import { supabase } from '@/integrations/supabase/client';
import { QuoteData } from '@/types/pdf-template';
import { logger } from '@/utils/logger';
import { convertImageToBase64, batchConvertProductImages } from './imageProcessing';

/**
 * Get current user's company_id
 */
async function getCurrentCompanyId(): Promise<string | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return null;
    }

    return profile.company_id;
  } catch (error) {
    logger.error("Error fetching company_id", error);
    return null;
  }
}

/**
 * Fetch product data for batch of product IDs
 */
async function fetchProductData(productIds: string[], companyId: string | null) {
  if (productIds.length === 0) return null;
  
  try {
    let query = supabase
      .from('products')
      .select('id, image_url, description, name')
      .in('id', productIds);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data } = await query;
    return data;
  } catch (error) {
    logger.warn("Error fetching product data", error);
    return null;
  }
}

/**
 * Transform Proposal to QuoteData format for PDF generation
 */
export async function transformProposalForPdf(proposal: any): Promise<QuoteData> {
  try {
    if (!proposal) {
      throw new Error('Teklif verisi bulunamadı');
    }

    // Get customer data
    let customer = null;
    if (proposal.customer) {
      customer = proposal.customer;
    } else if (proposal.customer_id) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', proposal.customer_id)
        .single();
      customer = customerData;
    } else {
      customer = {
        name: proposal.customer_name || '',
        company: proposal.customer_company || '',
        email: proposal.customer_email || '',
        mobile_phone: proposal.mobile_phone || '',
        office_phone: proposal.office_phone || '',
        address: proposal.address || '',
        tax_number: proposal.tax_number || '',
        tax_office: proposal.tax_office || '',
      };
    }

    // Get employee data
    let preparedBy = 'Belirtilmemiş';
    if (proposal.employee) {
      preparedBy = `${proposal.employee.first_name} ${proposal.employee.last_name}`;
    } else if (proposal.employee_id) {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('first_name, last_name, email, phone, position')
        .eq('id', proposal.employee_id)
        .single();
      if (employeeData) {
        preparedBy = `${employeeData.first_name} ${employeeData.last_name}`;
      }
    } else if (proposal.employee_name) {
      preparedBy = proposal.employee_name;
    }

    const items = proposal.items || [];
    
    // Extract valid product IDs (UUIDs only)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const productIds = (items || [])
      .map((item: any) => item?.product_id)
      .filter((id: any) => id && uuidPattern.test(id))
      .filter((id: any, index: number, self: any[]) => self.indexOf(id) === index);

    // Batch fetch product data
    const companyId = await getCurrentCompanyId();
    const productsData = await fetchProductData(productIds, companyId);
    
    // Convert images to base64
    let productImageMap = new Map<string, string | null>();
    let productDescriptionMap = new Map<string, string | null>();
    let productNameMap = new Map<string, string | null>();
    
    if (productsData && productsData.length > 0) {
      productImageMap = await batchConvertProductImages(productIds, productsData);
      
      productsData.forEach((product: any) => {
        if (product?.description) {
          productDescriptionMap.set(product.id, product.description);
        }
        if (product?.name) {
          productNameMap.set(product.id, product.name);
        }
      });
    }

    // Calculate totals
    let subtotal = Number(proposal?.subtotal) || 0;
    let total_discount = Number(proposal?.total_discount) || 0;
    let total_tax = Number(proposal?.total_tax) || 0;
    let total_amount = Number(proposal?.total_amount) || 0;

    if (subtotal === 0 && items && items.length > 0) {
      subtotal = items.reduce((sum: number, item: any) => {
        if (!item) return sum;
        const total = Number(item.total) || (Number(item.quantity || 0) * Number(item.unit_price || 0));
        return sum + (Number(total) || 0);
      }, 0);
    }

    if (total_discount === 0 && items && items.length > 0) {
      total_discount = items.reduce((sum: number, item: any) => {
        if (!item) return sum;
        const itemTotal = Number(item.total) || (Number(item.quantity || 0) * Number(item.unit_price || 0));
        const discountRate = Number(item.discount_rate) || 0;
        return sum + ((Number(itemTotal) || 0) * discountRate / 100);
      }, 0);
    }

    if (total_tax === 0 && items && items.length > 0) {
      total_tax = items.reduce((sum: number, item: any) => {
        if (!item) return sum;
        const itemTotal = Number(item.total) || (Number(item.quantity || 0) * Number(item.unit_price || 0));
        const discountRate = Number(item.discount_rate) || 0;
        const itemDiscount = (itemTotal * discountRate) / 100;
        const netAmount = itemTotal - itemDiscount;
        const taxRate = Number(item.tax_rate) || 0;
        return sum + ((netAmount || 0) * taxRate / 100);
      }, 0);
    }

    if (total_amount === 0) {
      total_amount = subtotal - total_discount + total_tax;
    }

    // Transform items
    const transformedItems = await Promise.all((items || []).map(async (item: any) => {
      let imageUrl: string | undefined = undefined;
      
      if (item?.product_id) {
        imageUrl = productImageMap.get(item.product_id) || undefined;
      }
      
      // Fallback to item image_url
      if (!imageUrl && item?.image_url) {
        imageUrl = await convertImageToBase64(item.image_url) || item.image_url;
      }
      
      // Get description
      let description: string = '';
      if (item?.description && item.description.trim() !== '') {
        description = item.description;
      } else if (item?.product_id) {
        description = productDescriptionMap.get(item.product_id) || 
                     productNameMap.get(item.product_id) || 
                     item?.name || 
                     '';
      } else {
        description = item?.name || '';
      }
      
      return {
        id: item?.id || item?.product_id || Math.random().toString(),
        description,
        quantity: Number(item?.quantity) || 1,
        unit_price: Number(item?.unit_price) || 0,
        unit: item?.unit || 'adet',
        tax_rate: Number(item?.tax_rate) || 0,
        discount_rate: Number(item?.discount_rate) || 0,
        total: Number(item?.total) || (Number(item?.quantity || 1) * Number(item?.unit_price || 0)) || 0,
        image_url: imageUrl,
      };
    }));

    const quoteData: QuoteData = {
      id: proposal?.id || '',
      number: proposal?.number || proposal?.proposal_number || '',
      title: proposal?.title || '',
      description: proposal?.description || '',
      customer: customer ? {
        name: customer?.name || '',
        company: customer?.company || '',
        email: customer?.email || '',
        mobile_phone: customer?.mobile_phone || '',
        office_phone: customer?.office_phone || '',
        address: customer?.address || '',
        tax_number: customer?.tax_number || '',
        tax_office: customer?.tax_office || '',
      } : undefined,
      prepared_by: preparedBy,
      items: transformedItems,
      subtotal: Number(subtotal) || 0,
      total_discount: Number(total_discount) || 0,
      total_tax: Number(total_tax) || 0,
      total_amount: Number(total_amount) || 0,
      currency: proposal?.currency || 'TRY',
      valid_until: proposal?.valid_until || undefined,
      payment_terms: proposal?.payment_terms || undefined,
      delivery_terms: proposal?.delivery_terms || undefined,
      warranty_terms: proposal?.warranty_terms || undefined,
      price_terms: proposal?.price_terms || undefined,
      other_terms: proposal?.other_terms || undefined,
      notes: proposal?.notes || undefined,
      created_at: proposal?.created_at || new Date().toISOString(),
    };

    return quoteData;
  } catch (error) {
    logger.error("Error transforming proposal for PDF", error);
    throw new Error('Teklif PDF formatına dönüştürülürken hata oluştu: ' + (error as Error).message);
  }
}

/**
 * Transform proposal data to QuoteData format (simpler version without async operations)
 */
export function transformProposalToQuoteData(proposal: any, companySettings?: any): QuoteData {
  logger.debug("Transforming proposal to QuoteData", {
    proposalKeys: Object.keys(proposal),
    proposalId: proposal.id,
    proposalNumber: proposal.number || proposal.proposal_number,
    customerExists: !!proposal.customer,
    itemsCount: proposal.items?.length || proposal.proposal_items?.length || 0
  });

  const defaultCompany = {
    name: companySettings?.company_name || 'Şirket Adı',
    address: companySettings?.company_address || '',
    phone: companySettings?.company_phone || '',
    email: companySettings?.company_email || '',
    tax_number: companySettings?.company_tax_number || '',
    tax_office: companySettings?.company_tax_office || '',
    logo_url: companySettings?.company_logo_url || null,
    website: companySettings?.company_website || ''
  };

  const customer = {
    name: proposal.customer?.name || proposal.customer_name || 'Müşteri',
    company: proposal.customer?.company_name || proposal.customer?.company || '',
    email: proposal.customer?.email || '',
    mobile_phone: proposal.customer?.phone || proposal.customer?.mobile_phone || '',
    office_phone: proposal.customer?.office_phone || '',
    address: proposal.customer?.address || '',
    tax_number: proposal.customer?.tax_number || '',
    tax_office: proposal.customer?.tax_office || ''
  };

  const proposalItems = proposal.proposal_items || proposal.items || [];
  const lines = proposalItems.length > 0 ? proposalItems.map((item: any) => ({
    id: item.id || '',
    description: item.product_name || item.name || item.description || '',
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unit_price) || 0,
    unit: item.unit || '',
    tax_rate: Number(item.tax_rate || item.tax_percentage) || 18,
    discount_rate: Number(item.discount_percentage || item.discount_rate) || 0,
    total: Number(item.total_amount || item.total_price) || (Number(item.quantity) * Number(item.unit_price)),
    image_url: item.image_url || item.product?.image_url || undefined,
  })) : [{
    id: '1',
    description: 'Henüz kalem eklenmemiş',
    quantity: 0,
    unit_price: 0,
    unit: 'adet',
    tax_rate: 18,
    discount_rate: 0,
    total: 0,
    image_url: undefined
  }];

  // Calculate totals
  let subtotal = Number(proposal.subtotal) || 0;
  let total_discount = Number(proposal.total_discount) || 0;
  let total_tax = Number(proposal.total_tax) || 0;
  let total_amount = Number(proposal.total_amount) || 0;

  if (subtotal === 0 && lines.length > 0) {
    subtotal = lines.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  }

  if (total_discount === 0 && lines.length > 0) {
    total_discount = lines.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const itemDiscount = (itemTotal * item.discount_rate) / 100;
      return sum + itemDiscount;
    }, 0);
  }

  if (total_tax === 0 && lines.length > 0) {
    total_tax = lines.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const itemDiscount = (itemTotal * item.discount_rate) / 100;
      const netAmount = itemTotal - itemDiscount;
      const itemTax = (netAmount * item.tax_rate) / 100;
      return sum + itemTax;
    }, 0);
  }

  if (total_amount === 0) {
    total_amount = subtotal - total_discount + total_tax;
  }

  return {
    id: proposal.id || '',
    number: proposal.proposal_number || proposal.number || '',
    title: proposal.title || '',
    description: proposal.description || '',
    customer,
    company: defaultCompany,
    items: lines,
    subtotal,
    total_discount,
    total_tax,
    total_amount,
    currency: proposal.currency || 'TRY',
    valid_until: proposal.valid_until || '',
    payment_terms: proposal.payment_terms || '',
    delivery_terms: proposal.delivery_terms || '',
    warranty_terms: proposal.warranty_terms || '',
    price_terms: proposal.price_terms || '',
    other_terms: proposal.other_terms || '',
    notes: proposal.notes || '',
    created_at: proposal.created_at || new Date().toISOString(),
    prepared_by: proposal.prepared_by || proposal.created_by || proposal.employee?.name || companySettings?.default_prepared_by || 'Sistem'
  };
}

