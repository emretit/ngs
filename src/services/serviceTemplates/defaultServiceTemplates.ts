import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { defaultServiceTemplateSchema } from '@/types/service-template';

/**
 * Default service templates that will be created for new companies
 */
export const defaultServiceTemplates = [
  {
    name: 'Genel Servis Şablonu',
    description: 'Standart servis işlemleri için hazır şablon',
    service_details: {
      service_type: 'maintenance',
      service_priority: 'medium' as const,
      estimated_duration: 120, // 2 saat
      parts_list: [],
      pdf_schema: {
        ...defaultServiceTemplateSchema,
        header: {
          ...defaultServiceTemplateSchema.header,
          title: 'SERVİS FORMU',
        },
        notes: {
          ...defaultServiceTemplateSchema.notes,
          footer: 'Servis hizmeti için teşekkür ederiz.',
        },
      },
    },
    is_active: true,
  },
  {
    name: 'Acil Servis Şablonu',
    description: 'Acil müdahale gerektiren servis işlemleri için',
    service_details: {
      service_type: 'repair',
      service_priority: 'urgent' as const,
      estimated_duration: 60, // 1 saat
      parts_list: [],
      pdf_schema: {
        ...defaultServiceTemplateSchema,
        header: {
          ...defaultServiceTemplateSchema.header,
          title: 'ACİL SERVİS FORMU',
        },
        serviceInfo: {
          ...defaultServiceTemplateSchema.serviceInfo,
          showServiceStatus: true,
          showTechnician: true,
          showServiceType: true,
          showDates: true,
        },
        notes: {
          ...defaultServiceTemplateSchema.notes,
          footer: 'Acil servis hizmeti sağlanmıştır. İyi günler dileriz.',
        },
      },
    },
    is_active: true,
  },
  {
    name: 'Bakım Servisi Şablonu',
    description: 'Periyodik bakım işlemleri için standart şablon',
    service_details: {
      service_type: 'maintenance',
      service_priority: 'low' as const,
      estimated_duration: 180, // 3 saat
      parts_list: [],
      pdf_schema: {
        ...defaultServiceTemplateSchema,
        header: {
          ...defaultServiceTemplateSchema.header,
          title: 'PERİYODİK BAKIM FORMU',
        },
        partsTable: {
          ...defaultServiceTemplateSchema.partsTable,
          show: true,
          columns: [
            { key: 'name', label: 'Parça/Malzeme', show: true, align: 'left' },
            { key: 'quantity', label: 'Miktar', show: true, align: 'center' },
            { key: 'unit', label: 'Birim', show: true, align: 'center' },
            { key: 'unitPrice', label: 'Birim Fiyat', show: true, align: 'right' },
            { key: 'total', label: 'Toplam', show: true, align: 'right' },
          ],
          showRowNumber: true,
        },
        notes: {
          ...defaultServiceTemplateSchema.notes,
          footer: 'Periyodik bakım tamamlanmıştır. Bir sonraki bakım için bildirim alacaksınız.',
        },
      },
    },
    is_active: true,
  },
];

/**
 * Create default service templates for a company
 * @param companyId - The company ID to create templates for
 * @returns Array of created template IDs
 */
export async function createDefaultServiceTemplates(companyId: string) {
  const results = [];
  
  for (const template of defaultServiceTemplates) {
    try {
      // Check if template already exists for this company
      const { data: existing } = await supabase
        .from('service_templates')
        .select('id')
        
        .eq('name', template.name)
        .maybeSingle();

      if (existing) {
        logger.info(`Service template "${template.name}" already exists for company ${companyId}`);
        continue;
      }

      // Create the template
      const { data, error } = await supabase
        .from('service_templates')
        .insert({
          ...template,
          company_id: companyId,
          usage_count: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error(`Error creating default service template "${template.name}"`, error);
      } else {
        logger.info(`Created default service template "${template.name}" for company ${companyId}`);
        results.push(data);
      }
    } catch (error) {
      logger.error(`Exception creating default service template "${template.name}"`, error);
    }
  }

  return results;
}

/**
 * Ensure default service templates exist for a company
 * This will check if any service templates exist, and if not, create the defaults
 * @param companyId - The company ID to check
 */
export async function ensureDefaultServiceTemplates(companyId: string) {
  try {
    // Check if company has any service templates
    const { data: existingTemplates } = await supabase
      .from('service_templates')
      .select('id, name')
      ;

    if (!existingTemplates || existingTemplates.length === 0) {
      logger.info(`No service templates found for company ${companyId}, creating defaults`);
      return await createDefaultServiceTemplates(companyId);
    }

    // Check if specific default templates are missing
    const existingNames = new Set(existingTemplates.map(t => t.name));
    const missingTemplates = defaultServiceTemplates.filter(
      t => !existingNames.has(t.name)
    );

    if (missingTemplates.length > 0) {
      logger.info(`Creating ${missingTemplates.length} missing default service templates for company ${companyId}`);
      const results = [];
      
      for (const template of missingTemplates) {
        const { data, error } = await supabase
          .from('service_templates')
          .insert({
            ...template,
            company_id: companyId,
            usage_count: 0,
          })
          .select()
          .single();

        if (error) {
          logger.error(`Error creating missing service template "${template.name}"`, error);
        } else {
          results.push(data);
        }
      }
      
      return results;
    }

    logger.info(`All default service templates exist for company ${companyId}`);
    return [];
  } catch (error) {
    logger.error('Error ensuring default service templates', error);
    return [];
  }
}

