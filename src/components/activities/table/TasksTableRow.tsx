
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Eye,
  Trash,
  CheckCircle2,
  RefreshCw,
  Star
} from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface TasksTableRowProps {
  task: Task;
  onSelectTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}

const TasksTableRow: React.FC<TasksTableRowProps> = ({
  task,
  onSelectTask,
  onStatusChange,
  onDeleteTask
}) => {
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

  return (
    <TableRow 
      className="h-16 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelectTask(task)}
    >
      <TableCell className="p-4 font-medium">
        <div className="flex items-center space-x-2">
          {task.is_important && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" title="Önemli görev" />
          )}
          {task.is_recurring && (
            <RefreshCw className="h-4 w-4 text-blue-500" title="Tekrar eden görev" />
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
      <TableCell className="p-4 text-right">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTask(task);
            }}
            className="h-8 w-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {task.status !== "completed" && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, "completed");
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  <span>Tamamla</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(task.id);
                }}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Sil</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TasksTableRow;
