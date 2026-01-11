import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface AIConversation {
  id: string;
  user_id: string;
  company_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  companyId: string,
  title?: string
): Promise<{ data: AIConversation | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        company_id: companyId,
        title: title || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: data as AIConversation, error: null };
  } catch (error) {
    logger.error('Error creating conversation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all conversations for a user
 */
export async function getConversations(
  userId: string,
  companyId: string,
  limit: number = 50
): Promise<{ data: AIConversation[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data as AIConversation[], error: null };
  } catch (error) {
    logger.error('Error getting conversations:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(
  conversationId: string
): Promise<{ data: AIConversation | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;

    return { data: data as AIConversation, error: null };
  } catch (error) {
    logger.error('Error getting conversation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error updating conversation title:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Delete a conversation (and all its messages via CASCADE)
 */
export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error deleting conversation:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(
  conversationId: string,
  role: AIMessage['role'],
  content: string,
  metadata: Record<string, any> = {}
): Promise<{ data: AIMessage | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: data as AIMessage, error: null };
  } catch (error) {
    logger.error('Error saving message:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all messages for a conversation
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 100
): Promise<{ data: AIMessage[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return { data: data as AIMessage[], error: null };
  } catch (error) {
    logger.error('Error getting conversation history:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get the last N messages from a conversation (for context)
 */
export async function getRecentMessages(
  conversationId: string,
  count: number = 10
): Promise<{ data: AIMessage[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(count);

    if (error) throw error;

    // Reverse to get chronological order
    const messages = (data as AIMessage[]).reverse();
    return { data: messages, error: null };
  } catch (error) {
    logger.error('Error getting recent messages:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Generate a title for a conversation based on first message
 */
export function generateConversationTitle(firstMessage: string): string {
  // Take first 50 characters or until the first newline
  const truncated = firstMessage.split('\n')[0].substring(0, 50);
  return truncated.length < firstMessage.length ? `${truncated}...` : truncated;
}

/**
 * Auto-generate and update conversation title
 */
export async function autoTitleConversation(
  conversationId: string,
  firstMessage: string
): Promise<{ success: boolean; error: Error | null }> {
  const title = generateConversationTitle(firstMessage);
  return updateConversationTitle(conversationId, title);
}
