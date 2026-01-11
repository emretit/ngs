import { useState, useRef, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useAI } from '@/contexts/AIContext';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { chatWithAIStreaming, checkGeminiStatus } from '@/services/geminiService';
import { getQuickPromptsForModule, buildContextAwarePrompt } from '@/services/contextDetectionService';
import { RoleSelector, RoleBadge } from '@/components/ai/RoleSelector';
import { RoleBasedPrompts } from '@/components/ai/RoleBasedPrompts';
import { getRoleQuickActions } from '@/services/aiPersonalityService';
import {
  useCreateConversation,
  useSaveMessage,
  useAutoTitleConversation
} from '@/hooks/useConversation';

export function EmbeddedAIWidget() {
  const {
    isWidgetOpen,
    isWidgetMinimized,
    toggleWidget,
    closeWidget,
    minimizeWidget,
    maximizeWidget,
    messages,
    addMessage,
    clearMessages,
    setMessages,
    setIsLoading,
    isLoading,
    pageContext,
    currentConversationId,
    setCurrentConversationId,
    currentRole,
    setCurrentRole
  } = useAI();

  const { user } = useAuth();
  const { companyId } = useCompany();
  const { toast } = useToast();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [apiStatus, setApiStatus] = useState<{ configured: boolean; checked: boolean }>({ 
    configured: true, 
    checked: false 
  });

  const createConversation = useCreateConversation();
  const saveMessage = useSaveMessage();
  const autoTitle = useAutoTitleConversation();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleWidget();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleWidget]);

  // API status check when widget opens
  useEffect(() => {
    if (isWidgetOpen && !apiStatus.checked) {
      checkGeminiStatus().then(status => {
        setApiStatus({ configured: status.configured, checked: true });
        if (!status.configured) {
          toast({
            title: 'AI Yapılandırma Uyarısı',
            description: 'Gemini API yapılandırılmamış. Lütfen yöneticinize başvurun.',
            variant: 'destructive'
          });
        }
      });
    }
  }, [isWidgetOpen, apiStatus.checked, toast]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (!user?.id || !companyId) {
      toast({
        title: 'Hata',
        description: 'Kullanıcı oturumu bulunamadı',
        variant: 'destructive'
      });
      return;
    }

    setInput('');
    setIsLoading(true);

    // Add user message
    addMessage({
      role: 'user',
      content: text,
      timestamp: new Date()
    });

    try {
      // Create conversation if needed
      let conversationId = currentConversationId;
      if (!conversationId) {
        const newConv = await createConversation.mutateAsync({
          userId: user.id,
          companyId: companyId,
          title: text.slice(0, 50)
        });
        conversationId = newConv.id;
        setCurrentConversationId(conversationId);
      }

      // Save user message to DB
      await saveMessage.mutateAsync({
        conversationId,
        role: 'user',
        content: text,
        metadata: {
          context_route: pageContext?.route,
          context_module: pageContext?.module,
          context_entities: pageContext?.entities
        }
      });

      // Get AI response with streaming
      const contextPrompt = pageContext && companyId
        ? buildContextAwarePrompt(pageContext, companyId)
        : undefined;

      const geminiMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      // Add system message if context exists
      const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (contextPrompt) {
        fullMessages.push({ role: 'system', content: contextPrompt });
      }
      fullMessages.push(...(geminiMessages as any));
      fullMessages.push({ role: 'user', content: text });

      // Create placeholder for streaming response
      let streamingContent = '';
      addMessage({
        role: 'assistant',
        content: '',
        timestamp: new Date()
      });

      // Stream the response
      await chatWithAIStreaming(
        fullMessages,
        'gemini-2.5-flash',
        pageContext || undefined,
        currentRole,
        (chunk: string) => {
          streamingContent += chunk;
          // Update the last message (assistant) with streaming content
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (newMessages[lastIndex]?.role === 'assistant') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: streamingContent
              };
            }
            return newMessages;
          });
        }
      );

      // Save AI message to DB after streaming completes
      await saveMessage.mutateAsync({
        conversationId,
        role: 'assistant',
        content: streamingContent || 'Üzgünüm, bir yanıt oluşturamadım.'
      });

      // Auto-generate title if first message
      if (messages.length === 0) {
        autoTitle.mutate({ conversationId, firstMessage: text });
      }
    } catch (error: any) {
      logger.error('Message send error:', error);
      
      let errorMessage = 'Mesaj gönderilemedi';
      
      // Rate limit hatası
      if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
        errorMessage = 'Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyin.';
      } 
      // Ödeme/kota hatası
      else if (error.message?.includes('402') || error.message?.toLowerCase().includes('payment') || error.message?.toLowerCase().includes('quota')) {
        errorMessage = 'AI kullanım kotası aşıldı. Lütfen yöneticinize başvurun.';
      }
      // Bağlantı hatası
      else if (error.message?.includes('fetch') || error.message?.toLowerCase().includes('network')) {
        errorMessage = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
      }

      toast({
        title: 'Hata',
        description: errorMessage,
        variant: 'destructive'
      });

      // Remove the empty assistant message and add error message
      setMessages((prev) => {
        const filtered = prev.filter((_, i) => i !== prev.length - 1 || prev[i].role !== 'assistant' || prev[i].content !== '');
        return [
          ...filtered,
          {
            role: 'assistant',
            content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
            timestamp: new Date()
          }
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Use role-based prompts instead of module-based
  const quickPrompts = getRoleQuickActions(currentRole);

  // If widget is closed, show only floating button
  if (!isWidgetOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleWidget}
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 transition-all hover:scale-110"
        >
          <Bot className="h-6 w-6" />
          <span className="sr-only">AI Asistan</span>
        </Button>
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 animate-ping opacity-20 pointer-events-none" />
      </div>
    );
  }

  // Widget open - show panel
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300",
        isWidgetMinimized ? "h-16 w-80" : "h-[600px] w-[420px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-violet-50 to-blue-50 rounded-t-2xl">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-md">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs">AI Asistan</h3>
              <RoleBadge role={currentRole} />
              {apiStatus.checked && (
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    apiStatus.configured ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-[9px] text-muted-foreground">
                    {apiStatus.configured ? 'Online' : 'Offline'}
                  </span>
                </div>
              )}
            </div>
            {pageContext && (
              <p className="text-[10px] text-muted-foreground truncate">
                {pageContext.route}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={isWidgetMinimized ? maximizeWidget : minimizeWidget}
            className="h-7 w-7 p-0"
          >
            {isWidgetMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeWidget}
            className="h-7 w-7 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Role Selector - Below Header */}
      {!isWidgetMinimized && (
        <div className="px-3 py-2 border-b bg-gray-50/50">
          <RoleSelector
            currentRole={currentRole}
            onRoleChange={(role) => {
              setCurrentRole(role);
              // Clear messages when switching roles for fresh context
              clearMessages();
            }}
          />
        </div>
      )}

      {/* Body - only show if not minimized */}
      {!isWidgetMinimized && (
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse" />
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-xl">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>

                <h4 className="text-sm font-semibold mb-1 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  Size nasıl yardımcı olabilirim?
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  {getRoleQuickActions(currentRole)[0]?.split(' ')[0]} AI ile çalışıyorsunuz
                </p>

                {/* Role-Based Quick Prompts */}
                <RoleBasedPrompts
                  role={currentRole}
                  onPromptClick={handleSendMessage}
                  maxPrompts={3}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300',
                      message.role === 'user' && 'flex-row-reverse'
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.role === 'assistant' ? (
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-md">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-700 to-gray-600 shadow-md">
                          <MessageSquare className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={cn(
                        'flex-1 rounded-lg px-3 py-2 text-xs max-w-[85%]',
                        message.role === 'assistant'
                          ? 'bg-white border border-gray-200 shadow-sm'
                          : 'bg-gradient-to-br from-gray-700 to-gray-600 text-white'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-2 animate-in fade-in">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-md">
                      <Bot className="h-3 w-3 text-white animate-pulse" />
                    </div>
                    <div className="flex-1 rounded-lg px-3 py-2 bg-white border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">AI düşünüyor...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t bg-white p-3 rounded-b-2xl">
            <div className="flex items-end gap-2 p-2 rounded-lg border-2 border-gray-200 bg-white hover:border-violet-300 focus-within:border-violet-400 transition-all">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajınızı yazın..."
                className="flex-1 min-h-[20px] max-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-xs leading-relaxed"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-7 w-7 rounded-md bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 shadow-md disabled:opacity-50 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground text-center mt-1.5">
              Cmd/Ctrl + K ile aç/kapa • AI bazen yanlış bilgi verebilir
            </p>
          </div>
        </>
      )}
    </div>
  );
}
