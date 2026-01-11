import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Seed sample tasks
export const seedTasks = async () => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Check existing tasks to prevent duplicates
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);

    // Only add sample tasks if none exist
    if (existingTasks && existingTasks.length > 0) {
      toast.info("Görevler zaten mevcut, yeni örnek veriler eklenmedi.");
      return { success: true, message: "Görevler zaten mevcut" };
    }

    // First, get some employees to assign tasks to
    let { data: employees } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .limit(5);
    
    // If no employees exist, create a few sample employees
    if (!employees || employees.length === 0) {
      const sampleEmployees = [
        {
          id: uuidv4(),
          first_name: 'Ali',
          last_name: 'Yılmaz',
          email: 'ali.yilmaz@sirket.com',
          phone: '5301234567',
          position: 'Satış Uzmanı',
          department: 'Satış',
          hire_date: '2022-01-15',
          status: 'aktif' as const
        },
        {
          id: uuidv4(),
          first_name: 'Ayşe',
          last_name: 'Kaya',
          email: 'ayse.kaya@sirket.com',
          phone: '5311234567',
          position: 'Satış Müdürü',
          department: 'Satış',
          hire_date: '2020-03-10',
          status: 'aktif' as const
        },
        {
          id: uuidv4(),
          first_name: 'Mehmet',
          last_name: 'Demir',
          email: 'mehmet.demir@sirket.com',
          phone: '5321234567',
          position: 'Teknik Destek',
          department: 'Teknik',
          is_technical: true,
          hire_date: '2021-06-22',
          status: 'aktif' as const
        }
      ];
      
      const { error: empError } = await supabase.from('employees').insert(sampleEmployees);
      
      if (empError) {
        console.error("Error creating sample employees:", empError);
      } else {
        employees = sampleEmployees;
      }
    }
    
    // Get some opportunities to reference
    let { data: opportunities } = await supabase
      .from('opportunities')
      .select('id, title')
      .limit(3);

    // If no opportunities exist, create some
    if (!opportunities || opportunities.length === 0) {
      const sampleOpportunities = [
        {
          id: uuidv4(),
          title: 'ABC Şirketi Yazılım Projesi',
          description: 'Müşteri yönetim sistemi geliştirme projesi',
          status: 'qualified',
          customer_id: null,
          employee_id: employees?.[0]?.id,
          value: 50000,
          currency: 'TRY',
          expected_close_date: nextWeek.toISOString()
        },
        {
          id: uuidv4(),
          title: 'XYZ Firması Danışmanlık Hizmeti',
          description: 'İş süreçleri optimizasyonu danışmanlığı',
          status: 'proposal',
          customer_id: null,
          employee_id: employees?.[1]?.id,
          value: 25000,
          currency: 'TRY',
          expected_close_date: nextWeek.toISOString()
        }
      ];
      
      const { error: oppError } = await supabase.from('opportunities').insert(sampleOpportunities);
      
      if (oppError) {
        console.error("Error creating sample opportunities:", oppError);
      } else {
        opportunities = sampleOpportunities;
      }
    }

    // Generate a variety of sample tasks
    const sampleTasks = [
      // Todo tasks
      {
        id: uuidv4(),
        title: 'Müşteri görüşmesi planla',
        description: 'ABC Şirketi ile ürün demo görüşmesi için tarih belirle',
        status: 'todo',
        priority: 'high',
        type: 'meeting',
        due_date: tomorrow.toISOString(),
        assigned_to: employees?.[0]?.id,
        related_item_type: 'opportunity',
        related_item_id: opportunities?.[0]?.id,
        related_item_title: opportunities?.[0]?.title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Teklif hazırlama',
        description: 'XYZ Firması için yazılım geliştirme teklifi hazırlanacak',
        status: 'todo',
        priority: 'medium',
        type: 'proposal',
        due_date: nextWeek.toISOString(),
        assigned_to: employees?.[1]?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Takip araması yapılacak',
        description: 'Geçen hafta görüşülen müşterileri arayarak durum güncellemesi yapılacak',
        status: 'todo',
        priority: 'medium',
        type: 'call',
        due_date: tomorrow.toISOString(),
        assigned_to: employees?.[0]?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'E-posta yanıtla',
        description: 'Gelen bilgi taleplerine yanıt verilecek',
        status: 'todo',
        priority: 'low',
        type: 'email',
        due_date: today.toISOString(),
        assigned_to: employees?.[2]?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // In progress tasks
      {
        id: uuidv4(),
        title: 'Proje planı güncelleme',
        description: 'Yazılım geliştirme projesi takvimi güncellenecek ve paydaşlarla paylaşılacak',
        status: 'in_progress',
        priority: 'medium',
        type: 'general',
        due_date: nextWeek.toISOString(),
        assigned_to: employees?.[1]?.id,
        created_at: lastWeek.toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Teknik belgelendirme',
        description: 'Yeni API entegrasyonu için teknik dökümanların hazırlanması',
        status: 'in_progress',
        priority: 'high',
        type: 'general',
        due_date: tomorrow.toISOString(),
        assigned_to: employees?.[2]?.id,
        created_at: lastWeek.toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Fırsat değerlendirmesi',
        description: 'Potansiyel müşterilerle ilgili fırsatların değerlendirilmesi ve önceliklendirme',
        status: 'in_progress',
        priority: 'high',
        type: 'opportunity',
        due_date: tomorrow.toISOString(),
        assigned_to: employees?.[0]?.id,
        related_item_type: 'opportunity',
        related_item_id: opportunities?.[1]?.id,
        related_item_title: opportunities?.[1]?.title,
        created_at: lastWeek.toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Completed tasks
      {
        id: uuidv4(),
        title: 'Haftalık rapor hazırlandı',
        description: 'Satış departmanı için haftalık aktivite raporu tamamlandı',
        status: 'completed',
        priority: 'medium',
        type: 'general',
        due_date: lastWeek.toISOString(),
        assigned_to: employees?.[1]?.id,
        created_at: lastWeek.toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Müşteri sunumu yapıldı',
        description: 'Yeni ürün özellikleri hakkında müşteriye sunum yapıldı',
        status: 'completed',
        priority: 'high',
        type: 'meeting',
        due_date: lastWeek.toISOString(),
        assigned_to: employees?.[0]?.id,
        created_at: lastWeek.toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Ürün eğitimi verildi',
        description: 'Müşteri ekibine yeni ürün özellikleri hakkında eğitim verildi',
        status: 'completed',
        priority: 'medium',
        type: 'meeting',
        due_date: lastWeek.toISOString(),
        assigned_to: employees?.[2]?.id,
        created_at: lastWeek.toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Postponed tasks
      {
        id: uuidv4(),
        title: 'Bütçe planlaması ertelendi',
        description: 'Gelecek çeyrek için bütçe planlaması ertelendi',
        status: 'postponed',
        priority: 'high',
        type: 'general',
        due_date: nextWeek.toISOString(),
        assigned_to: employees?.[1]?.id,
        created_at: lastWeek.toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Tedarikçi görüşmesi ertelendi',
        description: 'Yeni tedarikçilerle planlanan görüşme ileri bir tarihe ertelendi',
        status: 'postponed',
        priority: 'medium',
        type: 'meeting',
        due_date: nextWeek.toISOString(),
        assigned_to: employees?.[0]?.id,
        created_at: lastWeek.toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Yazılım güncelleme ertelendi',
        description: 'Planlanan yazılım güncellemesi teknik sorunlar nedeniyle ertelendi',
        status: 'postponed',
        priority: 'medium',
        type: 'general',
        due_date: nextWeek.toISOString(),
        assigned_to: employees?.[2]?.id,
        created_at: lastWeek.toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert the sample tasks into the database
    const { error } = await supabase
      .from('tasks')
      .insert(sampleTasks);

    if (error) {
      console.error('Error seeding tasks:', error);
      toast.error("Örnek görevler eklenirken bir hata oluştu!");
      return { success: false, error };
    }
    
    toast.success("Örnek görevler başarıyla eklendi!");
    return { success: true };
  } catch (error) {
    console.error('Error seeding tasks:', error);
    toast.error("Örnek görevler eklenirken bir hata oluştu!");
    return { success: false, error };
  }
};

// Seed sample opportunities
export const seedOpportunities = async () => {
  try {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // First, get a customer to reference
    let { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(3);
    
    // If no customers exist, create some
    if (!customers || customers.length === 0) {
      const sampleCustomers = [
        {
          id: uuidv4(),
          name: 'ABC Teknoloji A.Ş.',
          company: 'ABC Teknoloji',
          email: 'info@abcteknoloji.com',
          mobile_phone: '5321234567',
          type: 'kurumsal' as const,
          status: 'aktif' as const
        },
        {
          id: uuidv4(),
          name: 'XYZ Sanayi Ltd. Şti.',
          company: 'XYZ Sanayi',
          email: 'info@xyzsanayi.com',
          mobile_phone: '5331234567',
          type: 'kurumsal' as const,
          status: 'aktif' as const
        },
        {
          id: uuidv4(),
          name: 'Mehmet Yılmaz',
          company: 'Yılmaz Danışmanlık',
          email: 'mehmet@yilmazdanismanlik.com',
          mobile_phone: '5351234567',
          type: 'bireysel' as const,
          status: 'potansiyel' as const
        }
      ];
      
      await supabase.from('customers').insert(sampleCustomers);
      customers = sampleCustomers;
    }
    
    // Get employees
    let { data: employees } = await supabase
      .from('employees')
      .select('id')
      .limit(2);
    
    // If no employees exist, create some
    if (!employees || employees.length === 0) {
      const sampleEmployees = [
        {
          id: uuidv4(),
          first_name: 'Ali',
          last_name: 'Yılmaz',
          email: 'ali.yilmaz@sirket.com',
          phone: '5301234567',
          position: 'Satış Uzmanı',
          department: 'Satış',
          hire_date: '2022-01-15',
          status: 'aktif' as const
        },
        {
          id: uuidv4(),
          first_name: 'Ayşe',
          last_name: 'Kaya',
          email: 'ayse.kaya@sirket.com',
          phone: '5311234567',
          position: 'Satış Müdürü',
          department: 'Satış',
          hire_date: '2020-03-10',
          status: 'aktif' as const
        }
      ];
      
      await supabase.from('employees').insert(sampleEmployees);
      employees = sampleEmployees;
    }
    
    const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const priorities = ['low', 'medium', 'high'];
    
    const sampleOpportunities = [];
    
    for (let i = 0; i < 5; i++) {
      const customerId = customers[Math.floor(Math.random() * customers.length)].id;
      const employeeId = employees[Math.floor(Math.random() * employees.length)].id;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      
      sampleOpportunities.push({
        id: uuidv4(),
        title: `Fırsat #${i + 1} - ${status === 'new' ? 'Yeni Fırsat' : status === 'contacted' ? 'İletişim Kuruldu' : status === 'qualified' ? 'Nitelikli' : status === 'proposal' ? 'Teklif Aşaması' : status === 'negotiation' ? 'Müzakere' : status === 'closed_won' ? 'Kazanıldı' : 'Kaybedildi'}`,
        description: `Bu bir örnek ${status} durumundaki fırsattır.`,
        customer_id: customerId,
        employee_id: employeeId,
        status: status,
        priority: priority,
        value: Math.floor(Math.random() * 50000) + 5000,
        expected_close_date: nextMonth.toISOString(),
        currency: 'TRY'
      });
    }
    
    const { error } = await supabase
      .from('opportunities')
      .insert(sampleOpportunities);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error seeding opportunities:', error);
    return { success: false, error };
  }
};

// Seed all sample data
export const seedAllData = async () => {
  try {
    // Seed customers if needed
    const { data: customerCount } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true });
    
    if (!customerCount) {
      const sampleCustomers = [
        {
          id: uuidv4(),
          name: 'ABC Teknoloji A.Ş.',
          company: 'ABC Teknoloji',
          email: 'info@abcteknoloji.com',
          mobile_phone: '5321234567',
          type: 'kurumsal' as const,
          status: 'aktif' as const
        },
        {
          id: uuidv4(),
          name: 'XYZ Sanayi Ltd. Şti.',
          company: 'XYZ Sanayi',
          email: 'info@xyzsanayi.com',
          mobile_phone: '5331234567',
          type: 'kurumsal' as const,
          status: 'aktif' as const
        },
        {
          id: uuidv4(),
          name: 'Mehmet Yılmaz',
          company: 'Yılmaz Danışmanlık',
          email: 'mehmet@yilmazdanismanlik.com',
          mobile_phone: '5351234567',
          type: 'bireysel' as const,
          status: 'potansiyel' as const
        }
      ];
      
      await supabase.from('customers').insert(sampleCustomers);
    }
    
    // Seed employees if needed
    const { data: employeeCount } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true });
    
    if (!employeeCount) {
      const sampleEmployees = [
        {
          id: uuidv4(),
          first_name: 'Ali',
          last_name: 'Yılmaz',
          email: 'ali.yilmaz@sirket.com',
          phone: '5301234567',
          position: 'Satış Uzmanı',
          department: 'Satış',
          hire_date: '2022-01-15',
          status: 'aktif' as const
        },
        {
          id: uuidv4(),
          first_name: 'Ayşe',
          last_name: 'Kaya',
          email: 'ayse.kaya@sirket.com',
          phone: '5311234567',
          position: 'Satış Müdürü',
          department: 'Satış',
          hire_date: '2020-03-10',
          status: 'aktif' as const
        }
      ];
      
      await supabase.from('employees').insert(sampleEmployees);
    }
    
    // Seed tasks
    await seedTasks();
    
    // Seed opportunities
    await seedOpportunities();
    
    toast.success("Tüm örnek veriler başarıyla eklendi!");
    return { success: true };
  } catch (error) {
    console.error('Error seeding all data:', error);
    toast.error("Örnek veriler eklenirken bir hata oluştu!");
    return { success: false, error };
  }
};
