import { Skeleton } from "@/components/ui/skeleton";

export const AccountsSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Summary Stats Skeleton */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
            <Skeleton className="h-4 w-16 mx-auto mb-1" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-7 w-16" />
      </div>

      {/* Accounts List Skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-2 bg-gray-50 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div>
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountsSkeleton;
