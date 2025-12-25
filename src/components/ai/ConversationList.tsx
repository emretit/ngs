import { AIConversation } from '@/services/conversationService';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConversationListProps {
  conversations: AIConversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const title = conv.title || 'Yeni Sohbet';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}dk önce`;
    if (diffHours < 24) return `${diffHours}sa önce`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2"
          variant="default"
        >
          <Plus className="w-4 h-4" />
          Yeni Sohbet
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Sohbetlerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center p-8 text-sm text-slate-500">
            {searchQuery ? 'Sohbet bulunamadı' : 'Henüz sohbet yok'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'group relative rounded-lg p-3 cursor-pointer transition-colors',
                  'hover:bg-slate-100 dark:hover:bg-slate-800',
                  activeConversationId === conversation.id &&
                    'bg-slate-200 dark:bg-slate-800'
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {conversation.title || 'Yeni Sohbet'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(conversation.updated_at)}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(conversation.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sohbeti Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu sohbeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve
              tüm mesajlar silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteConversation(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
