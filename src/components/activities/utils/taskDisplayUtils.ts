
import { TaskStatus, TaskType } from "@/types/task";

// Function to get the status display name
export const getStatusDisplay = (status: TaskStatus): string => {
  switch (status) {
    case "todo": return "Yapılacak";
    case "in_progress": return "Devam Ediyor";
    case "completed": return "Tamamlandı";
    case "postponed": return "Ertelendi";
    default: return status;
  }
};

// Function to get status badge color
export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case "todo": return "bg-gray-100 text-gray-800";
    case "in_progress": return "bg-blue-100 text-blue-800";
    case "completed": return "bg-green-100 text-green-800";
    case "postponed": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

// Function to get type display name
export const getTypeDisplay = (type: TaskType): string => {
  switch (type) {
    case "general": return "Genel";
    case "call": return "Arama";
    case "meeting": return "Toplantı";
    case "follow_up": return "Takip";
    case "proposal": return "Teklif";
    case "opportunity": return "Fırsat";
    case "reminder": return "Hatırlatma";
    case "email": return "E-posta";
    default: return type;
  }
};
