
import { formatDateOffset } from './utils';
import { mockCrmService } from '@/services/mockCrm';
import { taskWorkflow } from './taskWorkflow';

/**
 * Handle proposal status change workflow
 * Creates appropriate tasks and updates related opportunities
 */
export const handleProposalStatusChange = async (
  proposalId: string,
  proposalTitle: string,
  opportunityId: string | null,
  newStatus: string,
  assigneeId?: string
) => {
  // Update linked opportunity status if available
  if (opportunityId && newStatus === 'sent') {
    try {
      await mockCrmService.updateOpportunity(opportunityId, {
        status: 'proposal_sent' as any
      });
      
      // Create a follow-up task
      await taskWorkflow.createFollowUpTask({
        title: `Teklif Takibi: ${proposalTitle}`,
        related_item_id: proposalId,
        related_item_title: proposalTitle,
        related_item_type: 'proposal',
        assigned_to: assigneeId,
        due_date: formatDateOffset(3) // 3 days from now
      });
    } catch (error) {
      // Silently fail but don't break the application flow
      // In a production environment, this would be logged to a monitoring service
    }
  }
};

// Add functions for handling proposal creation, updates, and file management

/**
 * Get file icon based on file type/extension
 */
export const getProposalFileIcon = (file: File | { name: string, type: string }) => {
  const type = file.type.split('/')[0];
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (type === 'image') return 'image';
  if (extension === 'pdf') return 'pdf';
  if (extension === 'doc' || extension === 'docx') return 'word';
  if (extension === 'xls' || extension === 'xlsx') return 'excel';
  return 'file';
};

/**
 * Format proposal amounts with proper currency
 */
export const formatProposalAmount = (amount: number, currency: string = 'TRY') => {
  if (!amount && amount !== 0) return `${getCurrencySymbol(currency)}0`;
  
  // TL'yi TRY'ye çevir (ISO 4217 standardı)
  const normalizedCurrency = currency === 'TL' ? 'TRY' : (currency || 'TRY');
  
  // Para birimi sembolünü ve formatını doğrudan kullan
  const symbols: Record<string, string> = {
    'TRY': '₺',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  
  const symbol = symbols[normalizedCurrency] || normalizedCurrency;
  
  // Sayıyı formatla (binlik ayracı ile)
  const formattedNumber = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  
  // Para birimi sembolünü başa koy
  return `${symbol}${formattedNumber}`;
};

const getCurrencySymbol = (currency: string) => {
  // TL'yi TRY'ye çevir (ISO 4217 standardı)
  const normalizedCurrency = currency === 'TL' ? 'TRY' : (currency || 'TRY');
  
  const symbols: Record<string, string> = {
    'TRY': '₺',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  return symbols[normalizedCurrency] || normalizedCurrency;
};

/**
 * Calculate subtotals, taxes, and final amounts
 */
export const calculateProposalTotals = (items: any[]) => {
  let subtotal = 0;
  let taxAmount = 0;
  
  items.forEach(item => {
    const unitPrice = item.unit_price || 0;
    const quantity = item.quantity || 0;
    const taxRate = item.tax_rate || 0;
    
    const itemSubtotal = unitPrice * quantity;
    const itemTax = itemSubtotal * (taxRate / 100);
    
    subtotal += itemSubtotal;
    taxAmount += itemTax;
  });
  
  return {
    subtotal,
    taxAmount,
    total: subtotal + taxAmount
  };
};
