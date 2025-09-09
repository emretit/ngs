
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Eye, 
  Trash,
  CheckCircle2
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
import { PriorityBadge } from "./PriorityBadge";

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
      case "todo": return "bg-gray-100 hover:bg-gray-200 text-gray-800";
      case "in_progress": return "bg-blue-100 hover:bg-blue-200 text-blue-800";
      case "completed": return "bg-green-100 hover:bg-green-200 text-green-800";
      case "postponed": return "bg-yellow-100 hover:bg-yellow-200 text-yellow-800";
      default: return "bg-gray-100 hover:bg-gray-200 text-gray-800";
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
        {task.title}
      </TableCell>
      <TableCell className="p-4 text-muted-foreground">
        {formatDate(task.due_date)}
      </TableCell>
      <TableCell className="p-4">
        <PriorityBadge priority={task.priority} />
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
        <Badge variant="outline" className={getStatusColor(task.status)}>
          {getStatusLabel(task.status)}
        </Badge>
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
