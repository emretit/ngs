# AI Agent - Detaylı Uygulama Planı

## 🎯 Vizyon
AI Agent, kullanıcıların işletme verilerini analiz edebilen, Excel raporları oluşturabilen, görevleri takip edebilen ve otomatik aksiyonlar alabilen akıllı bir asistan sistemi olacak.

---

## 📋 Faz 1: AI Agent Yetenekleri (Tools/Functions)

### 1.1 Excel/Dosya Oluşturma Yetenekleri
**Amaç**: Kullanıcı isteğine göre otomatik Excel/CSV dosyaları oluşturma

#### Özellikler:
- ✅ Veritabanı sorgularını Excel'e aktarma
- ✅ Filtrelenmiş müşteri listesi oluşturma
- ✅ Satış raporları (günlük/haftalık/aylık)
- ✅ Stok durumu raporları
- ✅ Finansal özetler
- ✅ Fatura/teklif listeleri

#### Teknik Detaylar:
```typescript
interface ExcelGenerationTool {
  name: "generate_excel";
  description: "Veritabanı verilerini Excel dosyasına aktarır";
  parameters: {
    reportType: "customers" | "sales" | "invoices" | "inventory" | "custom";
    filters?: {
      dateRange?: { start: Date; end: Date };
      status?: string[];
      customQuery?: string;
    };
    columns?: string[];
    format?: "xlsx" | "csv";
  };
}
```

#### Kullanım Örnekleri:
- "Bu ayki satışları Excel'e aktar"
- "Aktif müşteri listesini oluştur"
- "Stok seviyesi 10'dan az olan ürünleri CSV olarak ver"

---

### 1.2 Veri Analiz Yetenekleri
**Amaç**: Karmaşık veri sorgularını anlamlandırma ve sonuç üretme

#### Özellikler:
- ✅ SQL sorgu oluşturma (mevcut `geminiService`)
- ✅ Veri görselleştirme önerileri
- ✅ Trend analizi
- ✅ Karşılaştırmalı raporlar
- ✅ Anomali tespiti

#### Kullanım Örnekleri:
- "Bu ay geçen aya göre satışlar nasıl?"
- "En karlı müşterilerimiz kimler?"
- "Hangi ürünlerin stokları azalıyor?"

---

### 1.3 Görev ve Takip Yetenekleri
**Amaç**: Kullanıcı görevlerini takip etme ve hatırlatma

#### Özellikler:
- ✅ Görev oluşturma
- ✅ Görev durumu güncelleme
- ✅ Görev listesi görüntüleme
- ✅ Otomatik hatırlatıcılar
- ✅ Öncelik belirleme

#### Teknik Detaylar:
```typescript
interface TaskManagementTool {
  name: "manage_tasks";
  description: "Görev oluşturma ve takip";
  parameters: {
    action: "create" | "list" | "update" | "delete";
    task?: {
      title: string;
      description?: string;
      dueDate?: Date;
      priority?: "low" | "medium" | "high";
      assignedTo?: string;
      status?: "pending" | "in_progress" | "completed";
    };
  };
}
```

#### Kullanım Örnekleri:
- "Yarın için müşteri ziyareti görevi oluştur"
- "Bekleyen görevlerimi göster"
- "Yüksek öncelikli görevleri listele"

---

### 1.4 Otomasyon Yetenekleri
**Amaç**: Tekrarlayan işlemleri otomatikleştirme

#### Özellikler:
- ✅ Otomatik fatura oluşturma
- ✅ Stok uyarıları
- ✅ Ödeme takibi
- ✅ Müşteri bildirimleri
- ✅ Periyodik raporlar

---

## 📋 Faz 2: Mesaj Tipi Algılama ve Yönlendirme

### 2.1 Intent Detection (Niyet Tespiti)
Kullanıcı mesajını analiz ederek ne tür bir işlem istediğini belirleme.

#### Mesaj Tipleri:
```typescript
type MessageIntent = 
  | "excel_generation"      // Excel/dosya oluşturma isteği
  | "data_query"            // Veri sorgulama
  | "task_management"       // Görev yönetimi
  | "general_chat"          // Genel sohbet
  | "automation_setup"      // Otomasyon kurulumu
  | "help";                 // Yardım/açıklama

interface DetectedIntent {
  intent: MessageIntent;
  confidence: number;
  parameters?: Record<string, any>;
  suggestedAction?: string;
}
```

### 2.2 Akıllı Routing
```typescript
async function routeMessage(message: string): Promise<AgentResponse> {
  // 1. Intent detection
  const intent = await detectIntent(message);
  
  // 2. Parameter extraction
  const params = await extractParameters(message, intent);
  
  // 3. Tool selection
  const tool = selectTool(intent);
  
  // 4. Execute
  const result = await executeTool(tool, params);
  
  // 5. Format response
  return formatResponse(result);
}
```

---

## 📋 Faz 3: UI Geliştirmeleri

### 3.1 Mesaj Tipleri ve Görünümler

#### A. Tool Kullanımı Gösterimi
```typescript
interface ToolUsageMessage {
  type: "tool_usage";
  tool: string;
  status: "pending" | "success" | "error";
  result?: any;
}
```

**UI Komponenti**:
```tsx
<div className="tool-message">
  <div className="tool-header">
    <FileSpreadsheet className="h-4 w-4" />
    <span>Excel Dosyası Oluşturuluyor...</span>
  </div>
  {status === "success" && (
    <Button variant="outline" onClick={downloadFile}>
      <Download className="h-4 w-4 mr-2" />
      İndir
    </Button>
  )}
</div>
```

#### B. Görev Kartları
```tsx
<TaskCard task={task} onUpdate={handleUpdate} />
```

#### C. Grafik ve Görselleştirmeler
```tsx
<ChartPreview data={chartData} type="bar" />
```

### 3.2 Interaktif Öğeler
- ✅ Quick action butonları
- ✅ Dosya önizleme
- ✅ İndirme linkleri
- ✅ Görev checkbox'ları
- ✅ Onay/Red butonları

---

## 📋 Faz 4: Backend Servisler

### 4.1 Excel Generation Service
```typescript
// /src/services/excelGenerationService.ts
export class ExcelGenerationService {
  async generateReport(type: ReportType, filters: Filters): Promise<Blob> {
    // 1. Query data from Supabase
    const data = await this.queryData(type, filters);
    
    // 2. Format for Excel
    const formatted = this.formatData(data, type);
    
    // 3. Create Excel file
    const workbook = this.createWorkbook(formatted);
    
    // 4. Return blob
    return workbook.toBlob();
  }
}
```

### 4.2 Task Management Service
```typescript
// /src/services/taskManagementService.ts
export class TaskManagementService {
  async createTask(task: TaskInput): Promise<Task> {
    return await supabase.from("tasks").insert(task);
  }
  
  async listTasks(filters: TaskFilters): Promise<Task[]> {
    return await supabase.from("tasks").select("*").match(filters);
  }
}
```

### 4.3 AI Function Calling
```typescript
// /src/services/aiFunctionService.ts
export class AIFunctionService {
  private tools: Tool[] = [
    {
      name: "generate_excel",
      function: excelGenerationService.generateReport
    },
    {
      name: "manage_tasks",
      function: taskManagementService.executeAction
    }
  ];
  
  async executeFunctionCall(functionCall: FunctionCall): Promise<any> {
    const tool = this.tools.find(t => t.name === functionCall.name);
    return await tool.function(functionCall.parameters);
  }
}
```

---

## 📋 Faz 5: Supabase Entegrasyonu

### 5.1 Yeni Tablolar

#### tasks tablosu
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### agent_actions tablosu (Log tutma için)
```sql
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id),
  action_type TEXT NOT NULL,
  parameters JSONB,
  result JSONB,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### generated_files tablosu
```sql
CREATE TABLE generated_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES auth.users(id),
  conversation_id UUID REFERENCES ai_conversations(id),
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT,
  file_size INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📋 Faz 6: Implementasyon Sırası

### Sprint 1 (Haftalar 1-2): Excel Generation
1. ✅ Excel generation service oluştur
2. ✅ UI component'leri ekle (download button, preview)
3. ✅ AI function calling entegrasyonu
4. ✅ Test ve debugging

### Sprint 2 (Haftalar 3-4): Task Management
1. ✅ Task tablosu ve migration
2. ✅ Task management service
3. ✅ UI component'leri (task cards, list)
4. ✅ AI entegrasyonu

### Sprint 3 (Haftalar 5-6): Advanced Features
1. ✅ Otomasyon kuralları
2. ✅ Scheduled reports
3. ✅ Notifications
4. ✅ Analytics dashboard

---

## 📋 Faz 7: Güvenlik ve Yetkilendirme

### 7.1 RLS (Row Level Security)
- Company bazlı veri izolasyonu
- User bazlı yetkilendirme
- Action logging

### 7.2 Rate Limiting
- AI çağrıları için rate limit
- Dosya oluşturma limitleri
- Kullanıcı bazlı kotallar

---

## 🎯 Başarı Metrikleri

### KPI'lar:
1. **Kullanım Oranı**: Günlük aktif kullanıcı sayısı
2. **Başarı Oranı**: Tool execution success rate (>95%)
3. **Yanıt Süresi**: Average response time (<3s)
4. **Dosya Oluşturma**: Günlük oluşturulan rapor sayısı
5. **Görev Takibi**: Task completion rate

---

## 📚 Kullanılacak Teknolojiler

### Frontend:
- React + TypeScript
- Shadcn UI Components
- TanStack Query (React Query)
- ExcelJS / SheetJS (Excel generation)
- Recharts (Grafik görselleştirme)

### Backend:
- Supabase (Database + Auth)
- Edge Functions (File processing)
- Gemini AI (Natural language processing)

### Dosya Yönetimi:
- Supabase Storage (Dosya depolama)
- Signed URLs (Güvenli download)

---

## 🚀 Sonraki Adımlar

1. ✅ Layout kompakt hale getirildi
2. ⏳ Excel generation service implementasyonu
3. ⏳ AI function calling setup
4. ⏳ UI component'lerinin geliştirilmesi
5. ⏳ Test ve iterasyon

---

**Not**: Bu plan iteratif olarak geliştirilecek ve kullanıcı feedback'lerine göre öncelikler değişebilir.

