import { AIMessage } from '@/services/conversationService';
import { Bot, User, Copy, Check, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: AIMessage;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-3 mb-4 group',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-blue-500' : 'bg-indigo-500'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 max-w-[80%]', isUser && 'flex flex-col items-end')}>
        {/* Bubble */}
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm',
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
          )}
        >
          {isAssistant ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Metadata: Chart, SQL, etc. */}
          {message.metadata && Object.keys(message.metadata).length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {message.metadata.query_type && (
                  <span>Query Type: {message.metadata.query_type}</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className={cn(
            'flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isUser && 'justify-end'
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Kopyalandı
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Kopyala
              </>
            )}
          </Button>

          {isAssistant && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onRegenerate}
            >
              <RotateCw className="w-3 h-3 mr-1" />
              Yeniden Oluştur
            </Button>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {new Date(message.created_at).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
