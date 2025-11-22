
import { supabase } from "@/integrations/supabase/client";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { Json } from "@/types/json";
import { parseProposalData } from "../helpers/dataParser";
import { generateProposalNumber } from "../helpers/numberGenerator";
import { ServiceOptions } from "../../base/BaseService";

/**
 * Fetches a list of proposals with pagination and sorting
 */
export async function getProposals(options: ServiceOptions = {}) {
  const {
    pageSize = 10,
    page = 1,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;
  
  const startRow = (page - 1) * pageSize;
  const endRow = startRow + pageSize - 1;
  
  try {
    const { data, error, count } = await supabase
      .from('proposals')
      .select(`
        *,
        customer:customer_id(*),
        employee:employee_id(*)
      `, { count: 'exact' })
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(startRow, endRow);
    
    if (error) throw error;
    
    return { data, count };
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return { data: [], count: 0 };
  }
}

/**
 * Fetches a single proposal by ID
 */
export async function getProposalById(id: string) {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        customer:customer_id(*),
        employee:employee_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Parse the JSON strings to convert back to proper types
    const parsedData = parseProposalData(data);
    
    return { data: parsedData, error: null };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return { data: null, error };
  }
}

/**
 * Creates a new proposal
 */
export async function createProposal(proposal: Partial<Proposal>) {
  // Get current user info for history
  let userName = 'Sistem';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, employee_id')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) {
        userName = profile.full_name;
      } else if (profile?.employee_id) {
        const { data: employee } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('id', profile.employee_id)
          .single();
        if (employee) {
          userName = `${employee.first_name} ${employee.last_name}`;
        }
      }
    }
  } catch (e) {
    console.error('Error fetching user info:', e);
  }

  // Create history entry for new proposal
  const historyEntry = {
    type: 'created',
    title: 'Teklif Oluşturuldu',
    description: `#${proposal.number || 'Yeni'} numaralı teklif oluşturuldu`,
    timestamp: new Date().toISOString(),
    user: userName,
    changes: []
  };
  try {
    // Get current user's company_id if not provided
    let companyId = (proposal as any).company_id;
    if (!companyId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();
          if (profile?.company_id) {
            companyId = profile.company_id;
          }
        }
      } catch (e) {
        console.error('Error fetching company_id from profile:', e);
      }
    }

    console.log('Creating proposal with company_id:', companyId);
    if (!companyId) {
      console.warn('⚠️ WARNING: Proposal is being created without company_id!');
    }

    // Generate proposal number
    const proposalNumber = await generateProposalNumber();
    
    // Create proposal data object with required fields
    const insertData: {
      title: string;
      description?: string;
      subject?: string;
      customer_id?: string;
      employee_id?: string;
      opportunity_id?: string;
      company_id?: string;
      number: string;
      status: string;
      offer_date?: string;
      valid_until?: string;
      payment_terms?: string;
      delivery_terms?: string;
      warranty_terms?: string;
      price_terms?: string;
      other_terms?: string;
      selected_payment_terms?: string[];
      selected_delivery_terms?: string[];
      selected_warranty_terms?: string[];
      selected_pricing_terms?: string[];
      selected_other_terms?: string[];
      notes?: string;
      terms?: string;
      currency: string;
      exchange_rate?: number;
      total_amount: number;
      attachments?: Json;
      items?: Json;
      history?: Json;
      created_at: string;
      updated_at: string;
    } = {
      title: proposal.title || "Untitled Proposal",
      description: proposal.description,
      subject: (proposal as any).subject || null,
      customer_id: proposal.customer_id,
      employee_id: proposal.employee_id,
      opportunity_id: proposal.opportunity_id,
      company_id: companyId || null,
      number: proposalNumber,
      status: proposal.status || 'draft',
      offer_date: (proposal as any).offer_date ? (proposal as any).offer_date : null,
      valid_until: proposal.valid_until || null,
      payment_terms: proposal.payment_terms,
      delivery_terms: proposal.delivery_terms,
      warranty_terms: proposal.warranty_terms,
      price_terms: proposal.price_terms,
      other_terms: proposal.other_terms,
      selected_payment_terms: (proposal as any).selected_payment_terms || [],
      selected_delivery_terms: (proposal as any).selected_delivery_terms || [],
      selected_warranty_terms: (proposal as any).selected_warranty_terms || [],
      selected_pricing_terms: (proposal as any).selected_pricing_terms || [],
      selected_other_terms: (proposal as any).selected_other_terms || [],
      notes: proposal.notes,
      terms: proposal.terms,
      currency: proposal.currency || 'TRY',
      exchange_rate: (proposal as any).exchange_rate || null,
      total_amount: proposal.total_amount || 0,
      history: JSON.stringify([historyEntry]) as unknown as Json,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Handle complex types by proper serialization
    if (proposal.attachments && proposal.attachments.length > 0) {
      insertData.attachments = JSON.stringify(proposal.attachments) as unknown as Json;
    }
    
    if (proposal.items && proposal.items.length > 0) {
      insertData.items = JSON.stringify(proposal.items) as unknown as Json;
    }
    
    const { data, error } = await supabase
      .from('proposals')
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Parse response data
    const parsedData = parseProposalData(data);
    
    return { data: parsedData, error: null };
  } catch (error) {
    console.error('Error creating proposal:', error);
    return { data: null, error };
  }
}

/**
 * Updates an existing proposal
 */
export async function updateProposal(id: string, proposal: Partial<Proposal>) {
  try {
    // Önce mevcut proposal'ı çek
    const { data: currentProposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!currentProposal) throw new Error('Proposal not found');

    // Employee ve Customer isimlerini çek (değişiklik gösterimi için)
    let oldEmployeeName = '-';
    let newEmployeeName = '-';
    let oldCustomerName = '-';
    let newCustomerName = '-';

    if (proposal.employee_id !== undefined && proposal.employee_id !== currentProposal.employee_id) {
      // Eski employee ismini çek
      if (currentProposal.employee_id) {
        const { data: oldEmployee } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('id', currentProposal.employee_id)
          .single();
        if (oldEmployee) {
          oldEmployeeName = `${oldEmployee.first_name} ${oldEmployee.last_name}`;
        }
      }
      // Yeni employee ismini çek
      if (proposal.employee_id) {
        const { data: newEmployee } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('id', proposal.employee_id)
          .single();
        if (newEmployee) {
          newEmployeeName = `${newEmployee.first_name} ${newEmployee.last_name}`;
        }
      }
    }

    if (proposal.customer_id !== undefined && proposal.customer_id !== currentProposal.customer_id) {
      // Eski customer ismini çek
      if (currentProposal.customer_id) {
        const { data: oldCustomer } = await supabase
          .from('customers')
          .select('name')
          .eq('id', currentProposal.customer_id)
          .single();
        if (oldCustomer) {
          oldCustomerName = oldCustomer.name;
        }
      }
      // Yeni customer ismini çek
      if (proposal.customer_id) {
        const { data: newCustomer } = await supabase
          .from('customers')
          .select('name')
          .eq('id', proposal.customer_id)
          .single();
        if (newCustomer) {
          newCustomerName = newCustomer.name;
        }
      }
    }

    // Değişiklikleri tespit et
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const fieldLabels: Record<string, string> = {
      title: 'Başlık',
      subject: 'Konu',
      description: 'Açıklama',
      customer_id: 'Müşteri',
      employee_id: 'Satış Temsilcisi',
      status: 'Durum',
      offer_date: 'Teklif Tarihi',
      valid_until: 'Geçerlilik Tarihi',
      payment_terms: 'Ödeme Şartları',
      delivery_terms: 'Teslimat Şartları',
      warranty_terms: 'Garanti Şartları',
      price_terms: 'Fiyat Şartları',
      other_terms: 'Diğer Şartlar',
      notes: 'Notlar',
      currency: 'Para Birimi',
      exchange_rate: 'Döviz Kuru',
      total_amount: 'Toplam Tutar',
    };

    // Her alan için değişiklik kontrolü
    Object.keys(fieldLabels).forEach(key => {
      const newValue = (proposal as any)[key];
      if (newValue !== undefined && newValue !== currentProposal[key]) {
        // Özel işleme: employee_id ve customer_id için isimleri kullan
        if (key === 'employee_id') {
          changes.push({
            field: fieldLabels[key],
            oldValue: oldEmployeeName,
            newValue: newEmployeeName
          });
        } else if (key === 'customer_id') {
          changes.push({
            field: fieldLabels[key],
            oldValue: oldCustomerName,
            newValue: newCustomerName
          });
        } else {
          changes.push({
            field: fieldLabels[key],
            oldValue: currentProposal[key] || '-',
            newValue: newValue || '-'
          });
        }
      }
    });

    // Status değişikliği özel işleme
    const statusChanged = proposal.status !== undefined && proposal.status !== currentProposal.status;
    const statusLabels: Record<string, string> = {
      draft: 'Taslak',
      sent: 'Gönderildi',
      accepted: 'Kabul Edildi',
      rejected: 'Reddedildi',
    };

    // Get current user info for history
    let userName = 'Sistem';
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, employee_id')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          userName = profile.full_name;
        } else if (profile?.employee_id) {
          const { data: employee } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('id', profile.employee_id)
            .single();
          if (employee) {
            userName = `${employee.first_name} ${employee.last_name}`;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching user info:', e);
    }

    // History entry oluştur
    let historyEntry: any = null;
    if (changes.length > 0 || statusChanged) {
      const timestamp = new Date().toISOString();
      
      if (statusChanged) {
        // Durum değişikliği için sadece changes göster, description'ı kaldır
        historyEntry = {
          type: 'status_changed',
          title: 'Durum Değişikliği',
          timestamp,
          user: userName,
          changes: [
            {
              field: 'Durum',
              oldValue: statusLabels[currentProposal.status] || currentProposal.status,
              newValue: statusLabels[proposal.status!] || proposal.status
            },
            ...changes.filter(c => c.field !== 'Durum')
          ]
        };
      } else {
        historyEntry = {
          type: 'updated',
          title: 'Teklif Güncellendi',
          description: changes.length > 0 ? `${changes.length} alan güncellendi` : undefined,
          timestamp,
          user: userName,
          changes
        };
      }
    }

    // Create a properly typed update data object
    const updateData: {
      updated_at: string;
      title?: string;
      description?: string;
      subject?: string;
      customer_id?: string;
      employee_id?: string;
      opportunity_id?: string;
      status?: string;
      offer_date?: string;
      valid_until?: string;
      payment_terms?: string;
      delivery_terms?: string;
      warranty_terms?: string;
      price_terms?: string;
      other_terms?: string;
      notes?: string;
      terms?: string;
      currency?: string;
      exchange_rate?: number;
      total_amount?: number;
      attachments?: Json;
      items?: Json;
      history?: Json;
    } = { 
      updated_at: new Date().toISOString() 
    };
    
    // Copy simple properties
    if (proposal.title !== undefined) updateData.title = proposal.title;
    if (proposal.description !== undefined) updateData.description = proposal.description;
    if ((proposal as any).subject !== undefined) updateData.subject = (proposal as any).subject;
    if (proposal.customer_id !== undefined) updateData.customer_id = proposal.customer_id;
    if (proposal.employee_id !== undefined) updateData.employee_id = proposal.employee_id;
    if (proposal.opportunity_id !== undefined) updateData.opportunity_id = proposal.opportunity_id;
    if (proposal.status !== undefined) updateData.status = proposal.status;
    if ((proposal as any).offer_date !== undefined) updateData.offer_date = (proposal as any).offer_date;
    if (proposal.valid_until !== undefined) updateData.valid_until = proposal.valid_until;
    if (proposal.payment_terms !== undefined) updateData.payment_terms = proposal.payment_terms;
    if (proposal.delivery_terms !== undefined) updateData.delivery_terms = proposal.delivery_terms;
    if (proposal.warranty_terms !== undefined) updateData.warranty_terms = proposal.warranty_terms;
    if (proposal.price_terms !== undefined) updateData.price_terms = proposal.price_terms;
    if (proposal.other_terms !== undefined) updateData.other_terms = proposal.other_terms;
    if (proposal.notes !== undefined) updateData.notes = proposal.notes;
    if (proposal.terms !== undefined) updateData.terms = proposal.terms;
    if (proposal.currency !== undefined) updateData.currency = proposal.currency;
    if ((proposal as any).exchange_rate !== undefined) updateData.exchange_rate = (proposal as any).exchange_rate;
    if (proposal.total_amount !== undefined) updateData.total_amount = proposal.total_amount;
    
    // Handle complex types with proper serialization
    if (proposal.attachments !== undefined) {
      updateData.attachments = JSON.stringify(proposal.attachments) as unknown as Json;
    }
    
    if (proposal.items !== undefined) {
      updateData.items = JSON.stringify(proposal.items) as unknown as Json;
    }

    // History'yi ekle
    if (historyEntry) {
      // Parse existing history if it's a string
      let existingHistory: any[] = [];
      if (currentProposal.history) {
        if (typeof currentProposal.history === 'string') {
          try {
            existingHistory = JSON.parse(currentProposal.history);
          } catch (e) {
            console.error('Error parsing existing history:', e);
            existingHistory = [];
          }
        } else if (Array.isArray(currentProposal.history)) {
          existingHistory = currentProposal.history;
        }
      }
      updateData.history = JSON.stringify([...existingHistory, historyEntry]) as unknown as Json;
    }
    
    const { data, error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Parse response data
    const parsedData = parseProposalData(data);
    
    return { data: parsedData, error: null };
  } catch (error) {
    console.error('Error updating proposal:', error);
    return { data: null, error };
  }
}

/**
 * Deletes a proposal
 */
export async function deleteProposal(id: string) {
  try {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return { success: false, error };
  }
}

/**
 * Updates only the status of a proposal
 */
export async function updateProposalStatus(id: string, status: ProposalStatus) {
  return updateProposal(id, { status });
}
