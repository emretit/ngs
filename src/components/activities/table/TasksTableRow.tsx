
import React, { useState } from "react";
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
  AlertCircle,
  Circle,
  Check,
  StickyNote,
  ListChecks
} from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
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
import { cn } from "@/lib/utils";

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
      'customer': `/customers/${task.related_item_id}`,
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

  const isCompleted = task.status === "completed";
  const [isHovering, setIsHovering] = useState(false);

  // Not ve alt görev bilgileri (Microsoft To Do tarzı)
  const hasDescription = task.description && task.description.trim().length > 0;
  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;

  // Tamamla butonuna tıklama
  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: TaskStatus = isCompleted ? "todo" : "completed";
    onStatusChange(task.id, newStatus);
  };

  return (
    <TableRow 
      className={cn(
        "h-8 cursor-pointer transition-all duration-200",
        isCompleted 
          ? "bg-gray-50/80 hover:bg-gray-100/80" 
          : "hover:bg-gray-50"
      )}
      onClick={() => onSelectTask(task)}
    >
      {/* Microsoft To Do tarzı tamamlama butonu */}
      <TableCell className="py-2 px-2 w-10">
        <button
          onClick={handleToggleComplete}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
            "focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-green-500",
            isCompleted
              ? "bg-green-500 border-green-500 text-white"
              : isHovering
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-green-400 hover:bg-green-50"
          )}
          title={isCompleted ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}
        >
          {isCompleted ? (
            <Check className="h-3 w-3 animate-in zoom-in-50 duration-200" />
          ) : isHovering ? (
            <Check className="h-3 w-3 text-green-500 opacity-50" />
          ) : null}
        </button>
      </TableCell>

      <TableCell className="py-2 px-3 font-medium">
        <div className={cn(
          "flex flex-col transition-all duration-200",
          isCompleted && "opacity-60"
        )}>
          {/* Başlık satırı */}
          <div className="flex items-center space-x-2">
            {task.is_important && (
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
            {task.is_recurring && (
              <RefreshCw className="h-3 w-3 text-blue-500 flex-shrink-0" />
            )}
            <span className={cn(
              "transition-all duration-200 text-xs",
              isCompleted && "line-through text-gray-500"
            )}>
              {task.title}
            </span>
          </div>
          
          {/* Microsoft To Do tarzı - Not ve Alt Görev bilgisi */}
          {(hasDescription || hasSubtasks) && (
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              {/* Alt görev sayısı */}
              {hasSubtasks && (
                <div className="flex items-center gap-1" title={`${completedSubtasks}/${totalSubtasks} alt görev tamamlandı`}>
                  <ListChecks className="h-3 w-3" />
                  <span className={cn(
                    completedSubtasks === totalSubtasks && totalSubtasks > 0 && "text-green-600"
                  )}>
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                </div>
              )}
              {/* Not ikonu */}
              {hasDescription && (
                <div className="flex items-center gap-1" title="Not var">
                  <StickyNote className="h-3 w-3" />
                  <span>Not</span>
                </div>
              )}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className={cn("py-2 px-3 transition-opacity duration-200", isCompleted && "opacity-60")}>
        {task.is_important ? (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs py-0.5 px-1.5">
            <Star className="h-2.5 w-2.5 mr-1 fill-yellow-600" />
            Önemli
          </Badge>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </TableCell>
      <TableCell className={cn("py-2 px-3 transition-opacity duration-200 text-xs", isCompleted && "opacity-60")}>
        {task.assignee ? task.assignee.first_name + " " + task.assignee.last_name : "-"}
      </TableCell>
      <TableCell className={cn(
        "py-2 px-3 text-muted-foreground transition-opacity duration-200 text-xs",
        isCompleted && "opacity-60"
      )}>
        {task.related_item_title ? (
          <span className="inline-flex items-center">
            {task.related_item_title}
          </span>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className={cn("py-2 px-3 transition-opacity duration-200", isCompleted && "opacity-60")}>
        <div className="flex items-center space-x-1.5">
          <span className="text-xs">{getStatusIcon(task.status)}</span>
          <Badge variant="outline" className={cn(getStatusColor(task.status), "text-xs py-0.5 px-1.5")}>
            {getStatusLabel(task.status)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className={cn(
        "py-2 px-3 transition-opacity duration-200 text-xs font-medium text-center",
        isCompleted && "opacity-60"
      )}>
        {(() => {
          const dateValue = task.due_date;
          if (!dateValue) return <span className="text-muted-foreground">-</span>;
          const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
          if (isNaN(dateObj.getTime())) return <span className="text-muted-foreground">-</span>;
          return dateObj.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        })()}
      </TableCell>
      <TableCell className={cn(
        "py-2 px-3 transition-opacity duration-200 text-xs font-medium text-center",
        isCompleted && "opacity-60"
      )}>
        {(() => {
          const dateValue = task.created_at;
          if (!dateValue) return <span className="text-muted-foreground">-</span>;
          const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
          if (isNaN(dateObj.getTime())) return <span className="text-muted-foreground">-</span>;
          return dateObj.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        })()}
      </TableCell>
      <TableCell className="py-2 px-3 text-center">
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTask(task);
            }}
            className="h-7 w-7"
            title="Düzenle"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
                title="Daha Fazla"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
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
