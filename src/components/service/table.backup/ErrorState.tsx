
import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
      <p>Veri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
        Yeniden Dene
      </Button>
    </div>
  );
}
