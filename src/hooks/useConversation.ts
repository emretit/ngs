import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AIConversation,
  AIMessage,
  createConversation,
  getConversations,
  getConversation,
  getConversationHistory,
  deleteConversation,
  updateConversationTitle,
  saveMessage,
  autoTitleConversation,
} from '@/services/conversationService';

/**
 * Hook to get all conversations for a user
 */
export function useConversations(userId: string, companyId: string) {
  return useQuery({
    queryKey: ['ai-conversations', userId, companyId],
    queryFn: async () => {
      const { data, error } = await getConversations(userId, companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get all conversations for a user (alias)
 */
export function useUserConversations(userId: string | undefined, companyId: string | undefined) {
  return useQuery({
    queryKey: ['ai-conversations', userId, companyId],
    queryFn: async () => {
      if (!userId || !companyId) return [];
      const { data, error } = await getConversations(userId, companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get a single conversation
 */
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['ai-conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const { data, error } = await getConversation(conversationId);
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
}

/**
 * Hook to get conversation messages
 */
export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['ai-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await getConversationHistory(conversationId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      companyId,
      title,
    }: {
      userId: string;
      companyId: string;
      title?: string;
    }) => {
      const { data, error } = await createConversation(userId, companyId, title);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: ['ai-conversations', variables.userId, variables.companyId],
      });
    },
  });
}

/**
 * Hook to delete a conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { success, error } = await deleteConversation(conversationId);
      if (error) throw error;
      return success;
    },
    onSuccess: () => {
      // Invalidate all conversation queries
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversation'] });
    },
  });
}

/**
 * Hook to update conversation title
 */
export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      title,
    }: {
      conversationId: string;
      title: string;
    }) => {
      const { success, error} = await updateConversationTitle(conversationId, title);
      if (error) throw error;
      return success;
    },
    onSuccess: (_, variables) => {
      // Invalidate conversation queries
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversation', variables.conversationId] });
    },
  });
}

/**
 * Hook to save a message
 */
export function useSaveMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      role,
      content,
      metadata = {},
    }: {
      conversationId: string;
      role: AIMessage['role'];
      content: string;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await saveMessage(conversationId, role, content, metadata);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: ['ai-messages', variables.conversationId],
      });
      // Invalidate conversations list (updated_at changed)
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
  });
}

/**
 * Hook to auto-title a conversation
 */
export function useAutoTitleConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      firstMessage,
    }: {
      conversationId: string;
      firstMessage: string;
    }) => {
      const { success, error } = await autoTitleConversation(conversationId, firstMessage);
      if (error) throw error;
      return success;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversation', variables.conversationId] });
    },
  });
}
