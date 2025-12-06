import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const TasksKanbanSkeleton = () => {
  return (
    <div className="h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 pb-4">
        {[1, 2, 3, 4].map((colIndex) => (
          <div key={colIndex} className="flex flex-col">
            <Card className="flex-1">
              <CardContent className="p-4">
                {/* Column Header Skeleton */}
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-8 rounded-full ml-auto" />
                </div>
                
                {/* Task Cards Skeleton */}
                <div className="space-y-3">
                  {[1, 2, 3].map((taskIndex) => (
                    <Card key={taskIndex} className="p-3">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-2/3 mb-3" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksKanbanSkeleton;

