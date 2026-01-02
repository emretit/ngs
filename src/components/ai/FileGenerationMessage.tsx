import { FileSpreadsheet, Download, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FileGenerationMessageProps {
  status: "pending" | "success" | "error";
  filename?: string;
  fileSize?: number;
  error?: string;
  onDownload?: () => void;
}

export const FileGenerationMessage = ({
  status,
  filename,
  fileSize,
  error,
  onDownload
}: FileGenerationMessageProps) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn(
      "rounded-lg p-3 border-2 transition-all duration-200",
      status === "pending" && "bg-blue-50 border-blue-200",
      status === "success" && "bg-green-50 border-green-200",
      status === "error" && "bg-red-50 border-red-200"
    )}>
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
          status === "pending" && "bg-blue-100",
          status === "success" && "bg-green-100",
          status === "error" && "bg-red-100"
        )}>
          {status === "pending" && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
          {status === "success" && <FileSpreadsheet className="h-5 w-5 text-green-600" />}
          {status === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "text-sm font-semibold",
              status === "pending" && "text-blue-900",
              status === "success" && "text-green-900",
              status === "error" && "text-red-900"
            )}>
              {status === "pending" && "Dosya Oluşturuluyor..."}
              {status === "success" && "Dosya Hazır"}
              {status === "error" && "Hata Oluştu"}
            </h4>
            {status === "success" && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>

          {/* Details */}
          {status === "success" && filename && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-700 font-medium truncate">
                {filename}
              </p>
              {fileSize && (
                <Badge variant="secondary" className="text-xs h-5">
                  {formatFileSize(fileSize)}
                </Badge>
              )}
            </div>
          )}

          {status === "error" && error && (
            <p className="text-xs text-red-700">
              {error}
            </p>
          )}

          {status === "pending" && (
            <p className="text-xs text-blue-700">
              Veriler toplanıyor ve Excel dosyası hazırlanıyor...
            </p>
          )}

          {/* Download Button */}
          {status === "success" && onDownload && (
            <Button
              onClick={onDownload}
              size="sm"
              className="mt-2 bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              İndir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

