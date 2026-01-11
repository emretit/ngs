import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  User,
  Plus,
  Clock,
  MoreVertical,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// AIContext
import { useAI } from '@/contexts/AIContext';

// Streaming service
import { chatWithAIStreaming } from '@/services/geminiService';

// Role components
import { RoleSelector, RoleBadge } from '@/components/ai/RoleSelector';
import { RoleBasedPrompts } from '@/components/ai/RoleBasedPrompts';
import { getRoleQuickActions } from '@/services/aiPersonalityService';
import type { AIRole } from '@/services/aiPersonalityService';

// Conversation components
import { useConversationMessages } from '@/hooks/useConversation';
import {
  useCreateConversation,
  useSaveMessage,
  useAutoTitleConversation,
  useUserConversations,
  useDeleteConversation
} from "@/hooks/useConversation";

// Function call (mevcut)
import { detectFunctionCall, executeFunctionCall, formatFunctionResponse } from '@/services/aiFunctionService';
import { downloadFile, GeneratedFile } from "@/services/excelGenerationService";
import { FileGenerationMessage } from '@/components/ai/FileGenerationMessage';
import { TaskListMessage } from '@/components/ai/TaskListMessage';

interface MessageWithFunctionCall {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  functionCall?: {
    name: string;
    status: "pending" | "success" | "error";
    result?: any;
  };
}

export default function AIAssistant() {
  // AIContext - global state
  const {
    messages,
    addMessage,
    setMessages,
    clearMessages,
    isLoading,
    setIsLoading,
    currentConversationId,
    setCurrentConversationId,
    currentRole,
    setCurrentRole,
    pageContext,
    updatePageContext
  } = useAI();

  // Local UI state
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<AIRole | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { companyId } = useCompany();
  
  const createConversation = useCreateConversation();
  const saveMessage = useSaveMessage();
  const autoTitle = useAutoTitleConversation();
  const { data: conversations = [] } = useUserConversations(user?.id, companyId);
  const deleteConversation = useDeleteConversation();

  // Load conversation messages when conversation changes
  const { data: conversationMessages } = useConversationMessages(currentConversationId);

  // Set page context on mount
  useEffect(() => {
    updatePageContext({
      route: '/ai-assistant',
      module: 'ai_assistant',
      entities: [],
      pageData: {}
    });
  }, [updatePageContext]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (conversationMessages && conversationMessages.length > 0) {
      const formattedMessages = conversationMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at)
      }));
      setMessages(formattedMessages);
    }
  }, [conversationMessages, setMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (!user?.id || !companyId) {
      toast({
        title: "Hata",
        description: "Kullanıcı oturumu bulunamadı",
        variant: "destructive"
      });
      return;
    }

    setInput("");
    setIsLoading(true);

    // Add user message
    const userMessage: MessageWithFunctionCall = {
      role: "user",
      content: text,
      timestamp: new Date()
    };

    addMessage(userMessage);

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

      // Save user message
      await saveMessage.mutateAsync({
        conversationId,
        role: "user",
        content: text
      });

      // Check for function call
      const functionDetection = detectFunctionCall(text);

      if (functionDetection.shouldCall && functionDetection.functionName) {
        // Add pending function call message
        const pendingMessage: MessageWithFunctionCall = {
          role: "assistant",
          content: "İşleminiz gerçekleştiriliyor...",
          timestamp: new Date(),
          functionCall: {
            name: functionDetection.functionName,
            status: "pending"
          }
        };
        addMessage(pendingMessage);

        // Execute function
        const result = await executeFunctionCall(
          functionDetection.functionName,
          functionDetection.parameters
        );

        // Update message with result
        const updatedMessage: MessageWithFunctionCall = {
          role: "assistant",
          content: formatFunctionResponse(functionDetection.functionName, result),
          timestamp: new Date(),
          functionCall: {
            name: functionDetection.functionName,
            status: result.success ? "success" : "error",
            result: result.data
          }
        };

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = updatedMessage;
          return newMessages;
        });

        // Save assistant message
        await saveMessage.mutateAsync({
          conversationId,
          role: "assistant",
          content: updatedMessage.content
        });
      } else {
        // Regular AI response with streaming
        const geminiMessages = messages
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

        const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          ...(geminiMessages as any),
          { role: 'user', content: text }
        ];

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

        // Save assistant message
        await saveMessage.mutateAsync({
          conversationId,
          role: "assistant",
          content: streamingContent || 'Üzgünüm, bir yanıt oluşturamadım.'
        });

        // Auto-generate title if first message
        if (messages.length === 0) {
          autoTitle.mutate({ conversationId, firstMessage: text });
        }
      }
    } catch (error: any) {
      console.error("Message send error:", error);
      
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
        title: "Hata",
        description: errorMessage,
        variant: "destructive"
      });

      const errorMsg: MessageWithFunctionCall = {
        role: "assistant",
        content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: new Date()
      };
      
      setMessages((prev) => {
        const filtered = prev.filter((_, i) => i !== prev.length - 1 || prev[i].role !== 'assistant' || prev[i].content !== '');
        return [...filtered, errorMsg];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    clearMessages();
    setCurrentConversationId(null);
  };

  const handleLoadConversation = (convId: string) => {
    setCurrentConversationId(convId);
    // Messages will be loaded automatically by useEffect
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation.mutateAsync(convId);
      if (convId === currentConversationId) {
        handleNewChat();
      }
      toast({
        title: "Başarılı",
        description: "Sohbet silindi"
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sohbet silinemedi",
        variant: "destructive"
      });
    }
  };

  const handleDownloadFile = async (file: GeneratedFile) => {
    try {
      downloadFile(file);
      toast({
        title: "Başarılı",
        description: "Dosya indiriliyor..."
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Dosya indirilemedi",
        variant: "destructive"
      });
    }
  };

  const handleRoleChange = (newRole: AIRole) => {
    if (messages.length > 0) {
      // Ask user if they want to start a new conversation
      setPendingRole(newRole);
      setRoleChangeDialogOpen(true);
    } else {
      setCurrentRole(newRole);
    }
  };

  const confirmRoleChange = (startNew: boolean) => {
    if (pendingRole) {
      setCurrentRole(pendingRole);
      if (startNew) {
        clearMessages();
        setCurrentConversationId(null);
      }
    }
    setRoleChangeDialogOpen(false);
    setPendingRole(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = getRoleQuickActions(currentRole);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Collapsible Sidebar */}
      <div
        className={cn(
          "relative border-r bg-white transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-80" : "w-0",
          "max-lg:absolute max-lg:z-20 max-lg:h-full max-lg:shadow-xl"
        )}
      >
        {isSidebarOpen && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-4 border-b bg-gradient-to-r from-violet-50 to-blue-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">AI Agent</h2>
                    <p className="text-xs text-muted-foreground">Akıllı asistanınız</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleNewChat}
                className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 mb-3"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Sohbet
              </Button>

              {/* Role Selector */}
              <div className="mb-3">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  AI Rolü
                </label>
                <RoleSelector
                  currentRole={currentRole}
                  onRoleChange={handleRoleChange}
                  className="w-full"
                />
              </div>

              {/* Quick Actions */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Hızlı Eylemler
                </label>
                <RoleBasedPrompts
                  role={currentRole}
                  onPromptClick={handleSendMessage}
                  maxPrompts={3}
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">Henüz sohbet yok</p>
                  </div>
                ) : (
                  conversations.map((conv: any) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group relative rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-100",
                        currentConversationId === conv.id && "bg-violet-50 hover:bg-violet-100"
                      )}
                      onClick={() => handleLoadConversation(conv.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 mb-1">
                            {conv.title || "Yeni Sohbet"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(conv.created_at), "d MMM, HH:mm", { locale: tr })}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conv.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute top-4 h-6 w-6 p-0 rounded-full bg-white border shadow-sm z-10",
            isSidebarOpen ? "-right-3" : "right-3"
          )}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-base">AI Agent</h1>
                  <RoleBadge role={currentRole} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Streaming yanıtlar, Excel oluşturma, görev takibi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="max-sm:hidden">Ayarlar</span>
              </Button>
              <Badge variant="secondary" className="gap-1 text-xs h-6 px-3">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Çevrimiçi
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse" />
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-xl">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  AI Agent'a Hoş Geldiniz
                </h2>
                <p className="text-muted-foreground text-center mb-2 max-w-md text-sm">
                  Streaming yanıtlar, Excel raporları, veri analizi, görev oluşturma
                </p>
                <p className="text-xs text-muted-foreground text-center mb-6">
                  <strong>{getRoleQuickActions(currentRole)[0]?.split(' ')[0]}</strong> AI rolü ile çalışıyorsunuz
                </p>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {quickActions.slice(0, 4).map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(action)}
                      className="group p-3 rounded-xl border-2 border-gray-200 hover:border-violet-300 bg-white hover:bg-gradient-to-br hover:from-violet-50 hover:to-blue-50 transition-all duration-200 hover:shadow-lg text-left"
                    >
                      <p className="text-sm font-medium text-gray-700 group-hover:text-violet-700">
                        {action}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const msg = message as MessageWithFunctionCall;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                        msg.role === "user" && "flex-row-reverse"
                      )}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {msg.role === "assistant" ? (
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-md">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-700 to-gray-600 shadow-md">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 space-y-1.5 max-w-3xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">
                            {msg.role === "assistant" ? "AI Agent" : "Siz"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(msg.timestamp || new Date(), "HH:mm", { locale: tr })}
                          </span>
                        </div>

                        {/* Function Call Results */}
                        {msg.functionCall ? (
                          <>
                            {msg.functionCall.name === "generate_excel" && (
                              <FileGenerationMessage
                                status={msg.functionCall.status}
                                filename={msg.functionCall.result?.filename}
                                fileSize={msg.functionCall.result?.size}
                                error={msg.functionCall.status === "error" ? "Dosya oluşturulamadı" : undefined}
                                onDownload={
                                  msg.functionCall.status === "success" && msg.functionCall.result
                                    ? () => handleDownloadFile(msg.functionCall!.result)
                                    : undefined
                                }
                              />
                            )}
                            {msg.functionCall.name === "manage_tasks" && msg.functionCall.result?.data && (
                              <TaskListMessage
                                tasks={msg.functionCall.result.data.tasks || []}
                                stats={msg.functionCall.result.data.stats || { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 }}
                              />
                            )}
                            {msg.content && (
                              <div
                                className={cn(
                                  "rounded-xl px-3 py-2 prose prose-sm max-w-none text-sm",
                                  msg.role === "assistant"
                                    ? "bg-white border border-gray-200 shadow-sm"
                                    : "bg-gradient-to-br from-gray-700 to-gray-600 text-white"
                                )}
                              >
                                <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            className={cn(
                              "rounded-xl px-3 py-2 prose prose-sm max-w-none text-sm",
                              msg.role === "assistant"
                                ? "bg-white border border-gray-200 shadow-sm"
                                : "bg-gradient-to-br from-gray-700 to-gray-600 text-white prose-invert"
                            )}
                          >
                            <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-md">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 max-w-3xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold">AI Agent</span>
                        <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                      </div>
                      <div className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow-sm">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-white shadow-sm px-4 py-3">
          <div className="max-w-5xl mx-auto space-y-2">
            <div className="relative flex items-center gap-2 p-2.5 rounded-xl border-2 border-gray-200 bg-white hover:border-violet-300 focus-within:border-violet-400 transition-all">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajınızı yazın..."
                className="flex-1 min-h-[20px] max-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-sm leading-relaxed"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-8 w-8 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 shadow-md disabled:opacity-50 flex-shrink-0 transition-all hover:scale-105"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              AI Agent bazen yanlış bilgi verebilir. Streaming yanıtlar aktif.
            </p>
          </div>
        </div>
      </div>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Rolünü Değiştir</AlertDialogTitle>
            <AlertDialogDescription>
              Mevcut konuşmanız devam ediyor. Yeni bir konuşma başlatmak ister misiniz yoksa mevcut konuşmayla devam etmek mi istersiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => confirmRoleChange(false)}>
              Mevcut konuşmayla devam et
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmRoleChange(true)}>
              Yeni konuşma başlat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
