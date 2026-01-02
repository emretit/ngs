
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableRow, TableCell } from "@/components/ui/table";
import type { Task } from "@/types/task";

interface TaskTableRowProps {
  task: Task;
  onSelectTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskTableRow = ({ 
  task, 
  onSelectTask,
  onStatusChange,
  onDeleteTask
}: TaskTableRowProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDeleteTask(task.id);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };
  return (
    <>
    <TableRow 
      key={task.id}
      className="cursor-pointer hover:bg-gray-50 h-16"
      onClick={() => onSelectTask(task)}
    >
      <TableCell className="font-medium p-4">
        <div className="flex flex-col">
          <span>{task.title}</span>
          {task.description && (
            <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {task.description}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="p-4">
        {task.due_date ? (
          <span 
            className={cn(
              "text-xs font-medium",
              task.status !== "completed" && 
              new Date(task.due_date) < new Date() && 
              "text-red-600"
            )}
          >
            {new Date(task.due_date).toLocaleDateString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs font-medium">-</span>
        )}
      </TableCell>
      <TableCell className="p-4">
        <span className="text-sm text-muted-foreground">N/A</span>
      </TableCell>
      <TableCell className="p-4">
        {task.assignee ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar_url} />
              <AvatarFallback>
                {task.assignee.first_name?.[0]}
                {task.assignee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {task.assignee.first_name} {task.assignee.last_name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="p-4" onClick={(e) => e.stopPropagation()}>
        <Select
          value={task.status}
          onValueChange={(value) => onStatusChange(task.id, value as Task['status'])}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="postponed">Postponed</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-4 text-right">
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleDeleteClick}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>

    {/* Confirmation Dialog */}
    <ConfirmationDialogComponent
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      title="Görevi Sil"
      description={`"${task.title}" görevini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
      confirmText="Sil"
      cancelText="İptal"
      variant="destructive"
      onConfirm={handleDeleteConfirm}
      onCancel={handleDeleteCancel}
    />
    </>
  );
};

export default TaskTableRow;
