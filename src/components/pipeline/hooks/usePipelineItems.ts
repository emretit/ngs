
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/types/task";
import type { Deal } from "@/types/deal";
import type { PipelineItem, PipelineDeal } from "@/types/pipeline";

export const usePipelineItems = () => {
  const [items, setItems] = useState<PipelineItem[]>([]);

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          assignee:assignee_id(id, name:first_name, avatar_url)
        `);

      if (error) throw error;
      
      return data.map((task: any) => ({
        ...task,
        item_type: 'task', // Explicitly set item_type
        assignee: task.assignee ? {
          id: task.assignee.id,
          name: task.assignee.name,
          avatar: task.assignee.avatar_url
        } : undefined
      })) as Task[];
    }
  });

  // Fetch deals
  const { data: deals, isLoading: dealsLoading, error: dealsError } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      // Simulate fetching deals from database
      // In a real app, you would fetch from Supabase
      const dummyDeals: PipelineDeal[] = [
        {
          id: "1",
          title: "Kurumsal Yazılım Çözümü",
          value: 50000,
          customerName: "Tech Corp",
          employeeName: "Ahmet Yılmaz",
          priority: "high",
          status: "new",
          proposalDate: new Date(),
          lastContactDate: new Date(),
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: "Kurumsal yazılım çözümü",
          department: "Kurumsal Satış",
          item_type: 'deal'
        },
        {
          id: "2",
          title: "Bulut Göç Projesi",
          value: 25000,
          customerName: "StartUp A.Ş.",
          employeeName: "Zeynep Kaya",
          priority: "medium",
          status: "new",
          proposalDate: new Date(),
          lastContactDate: new Date(),
          department: "Bulut Çözümleri",
          item_type: 'deal'
        }
      ];
      
      return dummyDeals;
    }
  });

  // Combine tasks and deals when both are loaded
  useEffect(() => {
    if (tasks && deals) {
      const combinedItems: PipelineItem[] = [...tasks, ...deals];
      setItems(combinedItems);
    }
  }, [tasks, deals]);

  const isLoading = tasksLoading || dealsLoading;
  const error = tasksError || dealsError;

  return { items, setItems, isLoading, error };
};
