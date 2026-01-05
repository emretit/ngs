
import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarIcon, MoreHorizontal, Edit, Trash2, UserIcon, Clock, CheckCircle2, AlertCircle, RefreshCw, Star } from "lucide-react";
import { TaskWithOverdue } from "@/types/task";
import { format } from "date-fns";

interface TaskCardProps {
  task: TaskWithOverdue;
  index: number;
  onEdit?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
}

const TaskCard = ({ task, index, onEdit, onSelect, onDelete }: TaskCardProps) => {
  
  // Metinleri kısalt
  const shortenText = (text: string, maxLength: number = 30) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  // Durum ikonunu al
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Clock className="h-3 w-3" />;
      case 'in_progress': return <AlertCircle className="h-3 w-3" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3" />;
      case 'postponed': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Durum rengini al
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'postponed': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 ${snapshot.isDragging ? "opacity-75 scale-105" : ""} transition-all duration-200`}
          onClick={onSelect}
        >
          <Card className={`
            ${task.isOverdue ? "border-red-300 bg-red-50/30" : "border-gray-200"} 
            hover:border-primary/50 hover:shadow-md cursor-pointer transition-all duration-200 bg-white/80 backdrop-blur-sm
            ${snapshot.isDragging ? "shadow-lg border-primary" : ""}
          `}>
            <CardContent className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-1 flex-1 mr-2">
                  {task.is_important && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                  {task.is_recurring && (
                    <RefreshCw className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  )}
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                    {shortenText(task.title, (task.is_important ? 2 : 0) + (task.is_recurring ? 2 : 0) + 26)}
                  </h4>
                </div>
                
                {/* 3 Nokta Menü */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}>
                        <Edit className="mr-2 h-3 w-3" />
                        Düzenle
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Sil
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {task.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                  {shortenText(task.description, 40)}
                </p>
              )}
              
              <div className="flex items-center justify-between mb-2">
                {task.is_important && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs font-medium" variant="outline">
                    <Star className="h-3 w-3 mr-1 fill-yellow-600" />
                    Önemli
                  </Badge>
                )}
                {!task.is_important && <div />} {/* Spacer when not important */}
                
                <Badge className={`${getStatusColor(task.status)} text-xs font-medium`} variant="outline">
                  {getStatusIcon(task.status)}
                  <span className="ml-1">
                    {task.status === "todo" ? "Yapılacak" :
                     task.status === "in_progress" ? "Devam Ediyor" :
                     task.status === "completed" ? "Tamamlandı" :
                     task.status === "postponed" ? "Ertelendi" : task.status}
                  </span>
                </Badge>
              </div>
              
              {task.due_date && (
                <div className={`
                  flex items-center text-xs px-2 py-1 rounded-full mb-2
                  ${task.isOverdue 
                    ? "text-red-600 bg-red-100 font-medium" 
                    : "text-gray-600 bg-gray-100"
                  }
                `}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {format(new Date(task.due_date), "dd MMM yyyy")}
                  {task.isOverdue && <span className="ml-1 font-bold">(Gecikmiş)</span>}
                </div>
              )}
              
              {task.assignee && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">Görevli:</span>
                  </div>
                  <Avatar className="h-6 w-6">
                    {task.assignee.avatar_url && (
                      <AvatarImage
                        src={task.assignee.avatar_url}
                        alt={`${task.assignee.first_name} ${task.assignee.last_name}`}
                      />
                    )}
                    <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">
                      {task.assignee.first_name?.[0]}
                      {task.assignee.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default React.memo(TaskCard, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.updated_at === nextProps.task.updated_at &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.index === nextProps.index
  );
});

