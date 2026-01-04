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
  Zap,
  FileText,
  ListTodo,
  TrendingUp,
  Users,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendMessageToGemini } from "@/services/geminiService";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import {
  useCreateConversation,
  useSaveMessage,
  useAutoTitleConversation,
  useUserConversations,
  useDeleteConversation
} from "@/hooks/useConversation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { detectFunctionCall, executeFunctionCall, formatFunctionResponse } from "@/services/aiFunctionService";
import { downloadFile, GeneratedFile } from "@/services/excelGenerationService";
import { FileGenerationMessage } from "@/components/ai/FileGenerationMessage";
import { TaskListMessage } from "@/components/ai/TaskListMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  functionCall?: {
    name: string;
    status: "pending" | "success" | "error";
    result?: any;
  };
}

const quickActions = [
  { icon: Users, label: "Müşteri Listesi", prompt: "Müşteri listesini Excel'e aktar" },
  { icon: TrendingUp, label: "Satış Raporu", prompt: "Bu ayki satışları raporla" },
  { icon: Package, label: "Stok Durumu", prompt: "Stok raporunu oluştur" },
  { icon: ListTodo, label: "Görevlerim", prompt: "Bekleyen görevlerimi göster" },
  { icon: FileText, label: "Faturalar", prompt: "Bu ayki faturaları listele" },
  { icon: Zap, label: "Hızlı Özet", prompt: "Bugünün iş özetini ver" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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
    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

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
        const pendingMessage: Message = {
          role: "assistant",
          content: "İşleminiz gerçekleştiriliyor...",
          timestamp: new Date(),
          functionCall: {
            name: functionDetection.functionName,
            status: "pending"
          }
        };
        setMessages(prev => [...prev, pendingMessage]);

        // Execute function
        const result = await executeFunctionCall(
          functionDetection.functionName,
          functionDetection.parameters
        );

        // Update message with result
        const updatedMessage: Message = {
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
        // Regular AI response
        const aiResponse = await sendMessageToGemini(text, messages);

        const assistantMessage: Message = {
          role: "assistant",
          content: aiResponse || "Üzgünüm, bir yanıt oluşturamadım.",
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Save assistant message
        await saveMessage.mutateAsync({
          conversationId,
          role: "assistant",
          content: assistantMessage.content
        });

        // Auto-generate title if first message
        if (messages.length === 0) {
          autoTitle.mutate({ conversationId, firstMessage: text });
        }
      }
    } catch (error: any) {
      console.error("Message send error:", error);
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilemedi",
        variant: "destructive"
      });

      const errorMessage: Message = {
        role: "assistant",
        content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleLoadConversation = (convId: string) => {
    // TODO: Load conversation messages
    setCurrentConversationId(convId);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Collapsible Sidebar */}
      <div
        className={cn(
          "relative border-r bg-white transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-72" : "w-0"
        )}
      >
        {isSidebarOpen && (
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b bg-gradient-to-r from-violet-50 to-blue-50">
              <div className="flex items-center justify-between mb-4">
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
                className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Sohbet
              </Button>
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
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteConversation(conv.id)}>
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
          className="absolute -right-3 top-4 h-6 w-6 p-0 rounded-full bg-white border shadow-sm z-10"
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-base">AI Agent</h1>
                <p className="text-xs text-muted-foreground">
                  Excel oluşturma, veri analizi, görev takibi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Ayarlar
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
                <p className="text-muted-foreground text-center mb-6 max-w-md text-sm">
                  Excel raporları oluşturun, veri analizi yapın, görev oluşturun
                </p>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(action.prompt)}
                      className="group p-3 rounded-xl border-2 border-gray-200 hover:border-violet-300 bg-white hover:bg-gradient-to-br hover:from-violet-50 hover:to-blue-50 transition-all duration-200 hover:shadow-lg hover:scale-105"
                    >
                      <action.icon className="h-5 w-5 mb-2 text-violet-500 group-hover:scale-110 transition-transform mx-auto" />
                      <p className="text-sm font-medium text-gray-700">{action.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      message.role === "user" && "flex-row-reverse"
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.role === "assistant" ? (
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
                          {message.role === "assistant" ? "AI Agent" : "Siz"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(message.timestamp || new Date(), "HH:mm", { locale: tr })}
                        </span>
                      </div>

                      {/* Function Call Results */}
                      {message.functionCall ? (
                        <>
                          {message.functionCall.name === "generate_excel" && (
                            <FileGenerationMessage
                              status={message.functionCall.status}
                              filename={message.functionCall.result?.filename}
                              fileSize={message.functionCall.result?.size}
                              error={message.functionCall.status === "error" ? "Dosya oluşturulamadı" : undefined}
                              onDownload={
                                message.functionCall.status === "success" && message.functionCall.result
                                  ? () => handleDownloadFile(message.functionCall!.result)
                                  : undefined
                              }
                            />
                          )}
                          {message.functionCall.name === "manage_tasks" && message.functionCall.result?.data && (
                            <TaskListMessage
                              tasks={message.functionCall.result.data.tasks || []}
                              stats={message.functionCall.result.data.stats || { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 }}
                            />
                          )}
                          {message.content && (
                            <div
                              className={cn(
                                "rounded-xl px-3 py-2 prose prose-sm max-w-none text-sm",
                                message.role === "assistant"
                                  ? "bg-white border border-gray-200 shadow-sm"
                                  : "bg-gradient-to-br from-gray-700 to-gray-600 text-white"
                              )}
                            >
                              <p className="whitespace-pre-wrap m-0">{message.content}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div
                          className={cn(
                            "rounded-xl px-3 py-2 prose prose-sm max-w-none text-sm",
                            message.role === "assistant"
                              ? "bg-white border border-gray-200 shadow-sm"
                              : "bg-gradient-to-br from-gray-700 to-gray-600 text-white prose-invert"
                          )}
                        >
                          <p className="whitespace-pre-wrap m-0">{message.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

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
              AI Agent bazen yanlış bilgi verebilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
