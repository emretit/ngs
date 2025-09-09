
import { AlertCircle, Package, CheckCircle, AlertTriangle } from "lucide-react";
import React from "react";

export function getStockStatusText(status: string) {
  switch (status) {
    case "out_of_stock":
      return "Stokta Yok";
    case "low_stock":
      return "Düşük Stok";
    case "in_stock":
      return "Stokta";
    default:
      return "Bilinmiyor";
  }
}

export function getStockStatusIcon(status: string) {
  switch (status) {
    case "out_of_stock":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "low_stock":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "in_stock":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

export function getStockStatusClass(status: string) {
  switch (status) {
    case "out_of_stock":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    case "low_stock":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
    case "in_stock":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
    default:
      return "";
  }
}

export function getStockWarning(status: string) {
  if (status === "out_of_stock") {
    return (
      <div className="mt-2 text-sm text-red-600 flex items-center space-x-1">
        <AlertCircle className="h-3 w-3" />
        <span>Bu ürün stokta mevcut değil. Yine de teklife ekleyebilirsiniz.</span>
      </div>
    );
  } else if (status === "low_stock") {
    return (
      <div className="mt-2 text-sm text-yellow-600 flex items-center space-x-1">
        <AlertTriangle className="h-3 w-3" />
        <span>Bu ürün düşük stok seviyesinde.</span>
      </div>
    );
  }
  return null;
}
