
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Star,
  ExternalLink,
  FileText,
  ShoppingCart,
  Target,
  User,
  Receipt,
  PlayCircle,
  PauseCircle,
  AlertCircle
} from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface TasksTableRowProps {
  task: Task;
  onSelectTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleImportant?: (taskId: string, is_important: boolean) => void;
}

const TasksTableRow: React.FC<TasksTableRowProps> = ({
  task,
  onSelectTask,
  onStatusChange,
  onDeleteTask,
  onToggleImportant
}) => {
  const navigate = useNavigate();
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: tr });
    } catch (error) {
      return "-";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "todo": return "bg-red-100 border-red-200 text-red-800 hover:bg-red-200";
      case "in_progress": return "bg-yellow-100 border-yellow-200 text-yellow-800 hover:bg-yellow-200";
      case "completed": return "bg-green-100 border-green-200 text-green-800 hover:bg-green-200";
      case "postponed": return "bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200";
      default: return "bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200";
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "todo": return "🔴";
      case "in_progress": return "🟡";
      case "completed": return "🟢";
      case "postponed": return "⚪";
      default: return "⚪";
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "todo": return "Yapılacak";
      case "in_progress": return "Devam Ediyor";
      case "completed": return "Tamamlandı";
      case "postponed": return "Ertelendi";
      default: return status;
    }
  };

  const handleNavigateToRelatedItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.related_item_id || !task.related_item_type) return;

    const routes: Record<string, string> = {
      'proposal': `/proposal/${task.related_item_id}`,
      'order': `/orders/${task.related_item_id}`,
      'opportunity': `/opportunities/${task.related_item_id}`,
      'customer': `/contacts/${task.related_item_id}`,
      'invoice': `/sales-invoices/${task.related_item_id}`,
    };

    const route = routes[task.related_item_type];
    if (route) {
      navigate(route);
    }
  };

  const getRelatedItemIcon = () => {
    switch (task.related_item_type) {
      case 'proposal': return <FileText className="h-4 w-4 mr-2" />;
      case 'order': return <ShoppingCart className="h-4 w-4 mr-2" />;
      case 'opportunity': return <Target className="h-4 w-4 mr-2" />;
      case 'customer': return <User className="h-4 w-4 mr-2" />;
      case 'invoice': return <Receipt className="h-4 w-4 mr-2" />;
      case 'sales_invoice': return <Receipt className="h-4 w-4 mr-2" />;
      default: return <ExternalLink className="h-4 w-4 mr-2" />;
    }
  };

  const getRelatedItemLabel = () => {
    switch (task.related_item_type) {
      case 'proposal': return 'Teklife Git';
      case 'order': return 'Siparişe Git';
      case 'opportunity': return 'Fırsata Git';
      case 'customer': return 'Müşteriye Git';
      case 'invoice': return 'Faturaya Git';
      default: return 'İlişkili Öğeye Git';
    }
  };

  return (
    <TableRow 
      className="h-16 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelectTask(task)}
    >
      <TableCell className="p-4 font-medium">
        <div className="flex items-center space-x-2">
          {task.is_important && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
          {task.is_recurring && (
            <RefreshCw className="h-4 w-4 text-blue-500" />
          )}
          <span>{task.title}</span>
        </div>
      </TableCell>
      <TableCell className="p-4 text-muted-foreground">
        {formatDate(task.due_date)}
      </TableCell>
      <TableCell className="p-4">
        {task.is_important ? (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Star className="h-3 w-3 mr-1 fill-yellow-600" />
            Önemli
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="p-4">
        {task.assignee ? task.assignee.first_name + " " + task.assignee.last_name : "-"}
      </TableCell>
      <TableCell className="p-4 text-muted-foreground">
        {task.related_item_title ? (
          <span className="inline-flex items-center">
            {task.related_item_title}
          </span>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="p-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(task.status)}</span>
          <Badge variant="outline" className={getStatusColor(task.status)}>
            {getStatusLabel(task.status)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="p-4 text-center">
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTask(task);
            }}
            className="h-8 w-8"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
                title="Daha Fazla"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Hızlı Durum Değiştirme */}
              <DropdownMenuLabel>Durum Değiştir</DropdownMenuLabel>
              {task.status !== "todo" && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, "todo");
                  }}
                  className="cursor-pointer"
                >
                  <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  <span>Yapılacak</span>
                </DropdownMenuItem>
              )}
              {task.status !== "in_progress" && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, "in_progress");
                  }}
                  className="cursor-pointer"
                >
                  <PlayCircle className="mr-2 h-4 w-4 text-yellow-500" />
                  <span>Devam Ediyor</span>
                </DropdownMenuItem>
              )}
              {task.status !== "completed" && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, "completed");
                  }}
                  className="cursor-pointer"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>Tamamla</span>
                </DropdownMenuItem>
              )}
              {task.status !== "postponed" && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, "postponed");
                  }}
                  className="cursor-pointer"
                >
                  <PauseCircle className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Ertelendi</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Önem */}
              <DropdownMenuLabel>Hızlı İşlemler</DropdownMenuLabel>
              {onToggleImportant && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleImportant(task.id, !task.is_important);
                  }}
                  className="cursor-pointer"
                >
                  <Star className={`mr-2 h-4 w-4 ${task.is_important ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                  <span>{task.is_important ? 'Önemli Kaldır' : 'Önemli Yap'}</span>
                </DropdownMenuItem>
              )}
              
              {task.related_item_id && task.related_item_type && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>İlişkili Öğeler</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={handleNavigateToRelatedItem}
                    className="cursor-pointer"
                  >
                    {getRelatedItemIcon()}
                    <span>{getRelatedItemLabel()}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TasksTableRow;
