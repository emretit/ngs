import { generateExcelReport, downloadFile, saveGeneratedFileRecord, ReportType, ReportFilters, GeneratedFile } from './excelGenerationService';
import { logger } from '@/utils/logger';
import { createTask, listTasks, updateTaskStatus, getTaskStatistics, TaskInput, TaskFilters, Task, TaskStatus } from './taskManagementService';

export interface AIFunction {
  name: string;
  description: string;
  parameters: any;
  execute: (params: any) => Promise<any>;
}

export interface FunctionCallResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Detect if message requires function calling
 */
export const detectFunctionCall = (message: string): { 
  shouldCall: boolean; 
  functionName?: string; 
  parameters?: any;
} => {
  const lowercaseMessage = message.toLowerCase();

  // Excel/Rapor oluşturma pattern'leri
  const excelPatterns = [
    /excel.*(?:oluştur|hazırla|aktar|indir|çıkar)/i,
    /(?:oluştur|hazırla|aktar|indir|çıkar).*excel/i,
    /rapor.*(?:oluştur|hazırla|indir|çıkar)/i,
    /(?:müşteri|satış|fatura|stok|ürün).*(?:listesi|raporu).*(?:oluştur|hazırla|indir)/i,
    /(?:oluştur|hazırla|indir|çıkar).*(?:müşteri|satış|fatura|stok|ürün).*(?:listesi|raporu)/i,
    /csv.*(?:oluştur|hazırla|aktar|indir)/i,
  ];

  // Task management pattern'leri
  const taskPatterns = {
    create: [
      /(?:görev|task).*(?:oluştur|ekle|yarat|yap)/i,
      /(?:oluştur|ekle|yarat|yap).*(?:görev|task)/i,
      /(?:hatırlat|reminder).*(?:ekle|oluştur)/i,
    ],
    list: [
      /(?:görev|task).*(?:listesi|liste|göster|neler|var)/i,
      /(?:bekleyen|pending|tamamlanmamış).*(?:görev|task)/i,
      /(?:görevlerimi|tasklerimi).*(?:göster|listele)/i,
      /ne.*(?:görev|task).*var/i,
    ],
    update: [
      /(?:görev|task).*(?:tamamla|bitir|complete)/i,
      /(?:tamamla|bitir|complete).*(?:görev|task)/i,
      /(?:görev|task).*(?:güncelle|update)/i,
    ]
  };

  const isExcelRequest = excelPatterns.some(pattern => pattern.test(message));
  const isTaskCreate = taskPatterns.create.some(pattern => pattern.test(message));
  const isTaskList = taskPatterns.list.some(pattern => pattern.test(message));
  const isTaskUpdate = taskPatterns.update.some(pattern => pattern.test(message));

  // Task management
  if (isTaskCreate || isTaskList || isTaskUpdate) {
    let action: 'create' | 'list' | 'update' = 'list';
    
    if (isTaskCreate) action = 'create';
    else if (isTaskUpdate) action = 'update';
    else if (isTaskList) action = 'list';

    const parameters: any = { action };

    if (action === 'create') {
      // Extract task title from message
      // Remove common words to get the essence
      let title = message
        .replace(/görev|task|oluştur|ekle|yarat|yap|hatırlat|reminder|için|lütfen/gi, '')
        .trim();
      
      // Extract due date
      let dueDate: Date | undefined;
      if (/yarın/i.test(message)) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);
      } else if (/bugün/i.test(message)) {
        dueDate = new Date();
      } else if (/gelecek hafta/i.test(message)) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
      }

      // Extract priority
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      if (/acil|urgent|önemli|kritik/i.test(message)) {
        priority = 'urgent';
      } else if (/yüksek|high/i.test(message)) {
        priority = 'high';
      } else if (/düşük|low/i.test(message)) {
        priority = 'low';
      }

      parameters.task = {
        title: title || 'Yeni Görev',
        priority,
        due_date: dueDate
      };
    } else if (action === 'list') {
      // Extract filters
      const filters: any = {};
      
      if (/bekleyen|pending/i.test(message)) {
        filters.status = ['pending'];
      } else if (/devam eden|in progress/i.test(message)) {
        filters.status = ['in_progress'];
      } else if (/tamamlanmış|completed/i.test(message)) {
        filters.status = ['completed'];
      }

      if (/acil|urgent/i.test(message)) {
        filters.priority = ['urgent'];
      } else if (/yüksek|high/i.test(message)) {
        filters.priority = ['high', 'urgent'];
      }

      parameters.filters = filters;
    }

    return {
      shouldCall: true,
      functionName: 'manage_tasks',
      parameters
    };
  }

  // Excel generation
  if (isExcelRequest) {
    // Rapor tipini belirle
    let reportType: ReportType = 'customers'; // default
    
    if (/müşteri/i.test(message)) reportType = 'customers';
    else if (/satış|ciro/i.test(message)) reportType = 'sales';
    else if (/fatura/i.test(message)) reportType = 'invoices';
    else if (/stok|ürün|envanter/i.test(message)) reportType = 'inventory';
    else if (/tedarikçi|supplier/i.test(message)) reportType = 'suppliers';

    // Format belirle
    const format: 'xlsx' | 'csv' = /csv/i.test(message) ? 'csv' : 'xlsx';

    // Tarih aralığı varsa belirle
    let dateRange: { start: Date; end: Date } | undefined;
    
    if (/bu ay/i.test(message)) {
      const now = new Date();
      dateRange = {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    } else if (/geçen ay/i.test(message)) {
      const now = new Date();
      dateRange = {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0)
      };
    } else if (/bu yıl/i.test(message)) {
      const now = new Date();
      dateRange = {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31)
      };
    }

    // Durum filtresi
    let status: string[] | undefined;
    if (/aktif/i.test(message)) {
      status = ['aktif', 'active'];
    } else if (/pasif/i.test(message)) {
      status = ['pasif', 'passive'];
    }

    return {
      shouldCall: true,
      functionName: 'generate_excel',
      parameters: {
        reportType,
        format,
        filters: {
          dateRange,
          status
        }
      }
    };
  }

  return { shouldCall: false };
};

/**
 * Execute function call
 */
export const executeFunctionCall = async (
  functionName: string,
  parameters: any
): Promise<FunctionCallResult> => {
  try {
    if (functionName === 'generate_excel') {
      const { reportType, format = 'xlsx', filters = {} } = parameters;

      logger.debug('Executing generate_excel:', { reportType, format, filters });

      const generatedFile = await generateExcelReport(reportType, filters, format);

      return {
        success: true,
        data: generatedFile,
        metadata: {
          reportType,
          format,
          recordCount: 0 // Could be extracted from the data
        }
      };
    }

    if (functionName === 'manage_tasks') {
      const { action, task, filters } = parameters;

      logger.debug('Executing manage_tasks:', { action, task, filters });

      if (action === 'create') {
        const createdTask = await createTask(task);
        return {
          success: true,
          data: createdTask,
          metadata: { action: 'create' }
        };
      }

      if (action === 'list') {
        const tasks = await listTasks(filters || {});
        const stats = await getTaskStatistics();
        return {
          success: true,
          data: { tasks, stats },
          metadata: { action: 'list', count: tasks.length }
        };
      }

      if (action === 'update') {
        // For now, just return success - will implement specific update logic
        return {
          success: true,
          data: {},
          metadata: { action: 'update' }
        };
      }
    }

    return {
      success: false,
      error: `Bilinmeyen fonksiyon: ${functionName}`
    };
  } catch (error: any) {
    logger.error('Function execution error:', error);
    return {
      success: false,
      error: error.message || 'Fonksiyon çalıştırılamadı'
    };
  }
};

/**
 * Format function call response for chat
 */
export const formatFunctionResponse = (
  functionName: string,
  result: FunctionCallResult
): string => {
  if (functionName === 'generate_excel') {
    if (result.success && result.data) {
      const file = result.data as GeneratedFile;
      return `✅ Excel dosyanız hazır! \n\nDosya: ${file.filename}\nBoyut: ${(file.size / 1024).toFixed(1)} KB\n\nİndirmek için aşağıdaki butona tıklayın.`;
    } else {
      return `❌ Dosya oluşturulurken bir hata oluştu: ${result.error}`;
    }
  }

  if (functionName === 'manage_tasks') {
    if (result.success) {
      const action = result.metadata?.action;

      if (action === 'create') {
        const task = result.data as Task;
        return `✅ Görev oluşturuldu!\n\n📝 ${task.title}\n${task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟠' : '🟢'} Öncelik: ${task.priority}\n${task.due_date ? `📅 Tarihi: ${new Date(task.due_date).toLocaleDateString('tr-TR')}` : ''}`;
      }

      if (action === 'list') {
        const { tasks, stats } = result.data;
        const taskList = tasks.slice(0, 5); // İlk 5 görev
        
        let response = `📋 Görev Özeti:\n\n`;
        response += `• Toplam: ${stats.total}\n`;
        response += `• Bekleyen: ${stats.pending}\n`;
        response += `• Devam Eden: ${stats.in_progress}\n`;
        response += `• Tamamlanan: ${stats.completed}\n`;
        if (stats.overdue > 0) {
          response += `• ⚠️ Vadesi Geçen: ${stats.overdue}\n`;
        }

        if (taskList.length > 0) {
          response += `\n📌 Son Görevler:\n`;
          taskList.forEach((task: Task, index: number) => {
            const statusIcon = task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '🔄' : '⏳';
            response += `${index + 1}. ${statusIcon} ${task.title}\n`;
          });
        }

        return response;
      }
    }

    return `❌ İşlem başarısız: ${result.error}`;
  }

  return result.success ? '✅ İşlem başarılı' : `❌ Hata: ${result.error}`;
};

/**
 * Available AI functions
 */
export const AI_FUNCTIONS: AIFunction[] = [
  {
    name: 'generate_excel',
    description: 'Veritabanı verilerini Excel veya CSV dosyasına aktarır',
    parameters: {
      reportType: 'customers | sales | invoices | inventory | suppliers',
      format: 'xlsx | csv',
      filters: {
        dateRange: { start: 'Date', end: 'Date' },
        status: 'string[]'
      }
    },
    execute: async (params) => {
      return await executeFunctionCall('generate_excel', params);
    }
  },
  {
    name: 'manage_tasks',
    description: 'Görev oluşturma, listeleme ve güncelleme işlemleri',
    parameters: {
      action: 'create | list | update',
      task: {
        title: 'string',
        description: 'string (optional)',
        priority: 'low | medium | high | urgent',
        due_date: 'Date (optional)'
      },
      filters: {
        status: 'string[]',
        priority: 'string[]'
      }
    },
    execute: async (params) => {
      return await executeFunctionCall('manage_tasks', params);
    }
  }
];

