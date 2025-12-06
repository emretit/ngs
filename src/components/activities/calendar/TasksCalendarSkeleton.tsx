import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const TasksCalendarSkeleton = () => {
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
      <div style={{ height: '600px' }} className="relative">
        {/* Calendar Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        
        {/* Calendar Grid Skeleton */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
            <div key={i} className="text-center p-2">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square border border-gray-200 rounded p-2">
              <Skeleton className="h-3 w-3 mb-1" />
              <div className="space-y-1">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TasksCalendarSkeleton;

