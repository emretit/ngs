import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  FileText,
  HardDrive,
  Share2,
  Database,
  ExternalLink,
  Download,
  Eye,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  searchGoogleDrive,
  getGoogleDriveConnection,
  analyzeGoogleDriveDocument,
  type GoogleDriveFile
} from '@/services/integrations/googleDriveService';
import {
  searchSharePoint,
  getSharePointConnection,
  type SharePointFile
} from '@/services/integrations/sharePointService';
import { useToast } from '@/hooks/use-toast';

interface DocumentSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentSelect?: (document: any) => void;
}

type SearchSource = 'all' | 'google_drive' | 'sharepoint' | 'pafta';

interface SearchResult {
  id: string;
  name: string;
  source: 'google_drive' | 'sharepoint' | 'pafta';
  url?: string;
  size?: number;
  modifiedDate: string;
  type?: string;
  snippet?: string;
}

export function DocumentSearchDialog({
  open,
  onOpenChange,
  onDocumentSelect
}: DocumentSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [activeSource, setActiveSource] = useState<SearchSource>('all');
  const [searching, setSearching] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const [googleDriveResults, setGoogleDriveResults] = useState<GoogleDriveFile[]>([]);
  const [sharePointResults, setSharePointResults] = useState<SharePointFile[]>([]);
  const [paftaResults, setPaftaResults] = useState<any[]>([]);

  const [hasGoogleDrive, setHasGoogleDrive] = useState(false);
  const [hasSharePoint, setHasSharePoint] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    const [googleConn, sharePointConn] = await Promise.all([
      getGoogleDriveConnection(),
      getSharePointConnection()
    ]);

    setHasGoogleDrive(!!googleConn);
    setHasSharePoint(!!sharePointConn);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    setGoogleDriveResults([]);
    setSharePointResults([]);
    setPaftaResults([]);

    try {
      const promises: Promise<any>[] = [];

      // Google Drive search
      if ((activeSource === 'all' || activeSource === 'google_drive') && hasGoogleDrive) {
        promises.push(
          searchGoogleDrive(query)
            .then((result) => {
              if (result) setGoogleDriveResults(result.files);
            })
            .catch((err) => logger.error('Google Drive search error:', err))
        );
      }

      // SharePoint search
      if ((activeSource === 'all' || activeSource === 'sharepoint') && hasSharePoint) {
        promises.push(
          searchSharePoint(query)
            .then((result) => {
              if (result) setSharePointResults(result.files);
            })
            .catch((err) => logger.error('SharePoint search error:', err))
        );
      }

      // PAFTA internal search (placeholder - would implement actual search)
      if (activeSource === 'all' || activeSource === 'pafta') {
        promises.push(
          searchPaftaDocuments(query)
            .then((results) => setPaftaResults(results))
            .catch((err) => logger.error('PAFTA search error:', err))
        );
      }

      await Promise.all(promises);
    } catch (err) {
      toast({
        title: 'Arama Hatası',
        description: 'Dökümanlar aranırken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  };

  const searchPaftaDocuments = async (query: string): Promise<any[]> => {
    // Placeholder: In production, this would search PAFTA's internal documents
    // (proposals, invoices, generated files, etc.)
    return [];
  };

  const handleAnalyzeDocument = async (fileId: string, source: string) => {
    if (source !== 'google_drive') {
      toast({
        title: 'Desteklenmiyor',
        description: 'Şu an sadece Google Drive dökümanları analiz edilebilir.',
        variant: 'destructive'
      });
      return;
    }

    setAnalyzing(fileId);

    try {
      const analysis = await analyzeGoogleDriveDocument(fileId);

      if (analysis) {
        toast({
          title: 'Analiz Tamamlandı',
          description: analysis
        });
      }
    } catch (err) {
      toast({
        title: 'Analiz Hatası',
        description: 'Döküman analiz edilemedi.',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(null);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const allResults: SearchResult[] = [
    ...googleDriveResults.map((file) => ({
      id: file.id,
      name: file.name,
      source: 'google_drive' as const,
      url: file.webViewLink,
      size: file.size,
      modifiedDate: file.modifiedTime,
      type: file.mimeType
    })),
    ...sharePointResults.map((file) => ({
      id: file.id,
      name: file.name,
      source: 'sharepoint' as const,
      url: file.webUrl,
      size: file.size,
      modifiedDate: file.lastModifiedDateTime,
      type: 'SharePoint'
    })),
    ...paftaResults.map((file) => ({
      id: file.id,
      name: file.name,
      source: 'pafta' as const,
      url: file.url,
      modifiedDate: file.created_at,
      type: 'PAFTA'
    }))
  ];

  const totalResults = allResults.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Döküman Ara</DialogTitle>
          <DialogDescription>
            PAFTA, Google Drive ve SharePoint'te döküman arayın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Döküman ara..."
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aranıyor...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Ara
                </>
              )}
            </Button>
          </div>

          {/* Source Tabs */}
          <Tabs value={activeSource} onValueChange={(v) => setActiveSource(v as SearchSource)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Tümü
                {totalResults > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalResults}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="google_drive" disabled={!hasGoogleDrive}>
                <HardDrive className="h-4 w-4 mr-2" />
                Google Drive
                {googleDriveResults.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {googleDriveResults.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sharepoint" disabled={!hasSharePoint}>
                <Share2 className="h-4 w-4 mr-2" />
                SharePoint
                {sharePointResults.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {sharePointResults.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pafta">
                <Database className="h-4 w-4 mr-2" />
                PAFTA
                {paftaResults.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {paftaResults.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Results */}
            <div className="mt-4">
              <ScrollArea className="h-[400px]">
                {totalResults === 0 && !searching && (
                  <div className="text-center py-12 text-muted-foreground">
                    {query.trim() ? 'Sonuç bulunamadı' : 'Aramak için bir anahtar kelime girin'}
                  </div>
                )}

                <div className="space-y-2 pr-4">
                  {allResults.map((result) => {
                    const sourceIcon =
                      result.source === 'google_drive'
                        ? HardDrive
                        : result.source === 'sharepoint'
                        ? Share2
                        : Database;
                    const SourceIcon = sourceIcon;

                    const sourceColor =
                      result.source === 'google_drive'
                        ? 'text-blue-600'
                        : result.source === 'sharepoint'
                        ? 'text-purple-600'
                        : 'text-gray-600';

                    return (
                      <div
                        key={`${result.source}-${result.id}`}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={cn('p-2 rounded bg-gray-100', sourceColor)}>
                              <FileText className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">{result.name}</p>
                                <Badge variant="outline" className="gap-1 flex-shrink-0">
                                  <SourceIcon className="h-3 w-3" />
                                  {result.source === 'google_drive'
                                    ? 'Drive'
                                    : result.source === 'sharepoint'
                                    ? 'SharePoint'
                                    : 'PAFTA'}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatFileSize(result.size)}</span>
                                <span>•</span>
                                <span>{formatDate(result.modifiedDate)}</span>
                              </div>

                              {result.snippet && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                  {result.snippet}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 ml-2">
                            {result.url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(result.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}

                            {result.source === 'google_drive' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAnalyzeDocument(result.id, result.source)}
                                disabled={analyzing === result.id}
                              >
                                {analyzing === result.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            )}

                            {onDocumentSelect && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDocumentSelect(result)}
                              >
                                Seç
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </Tabs>

          {/* Connection Notice */}
          {(!hasGoogleDrive || !hasSharePoint) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              <p>
                <strong>İpucu:</strong> Daha fazla kaynakta arama yapmak için{' '}
                {!hasGoogleDrive && 'Google Drive'}
                {!hasGoogleDrive && !hasSharePoint && ' ve '}
                {!hasSharePoint && 'SharePoint'} entegrasyonlarını ayarlardan etkinleştirin.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
