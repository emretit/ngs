import { useState } from 'react';
import { useEmbeddedAI } from '@/hooks/useEmbeddedAI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmbeddedAIAnalysisProps {
  tableName: string;
  query?: {
    select?: string;
    filters?: Record<string, any>;
    limit?: number;
  };
  title?: string;
}

export const EmbeddedAIAnalysis = ({ 
  tableName, 
  query,
  title 
}: EmbeddedAIAnalysisProps) => {
  const { analyzeTable, loading, error, modelStatus } = useEmbeddedAI();
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    const analysis = await analyzeTable(tableName, query);
    if (analysis) {
      setResult(analysis);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {title || `${tableName} Analizi`}
            </CardTitle>
            <CardDescription>
              Groq AI ile veri analizi
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {modelStatus.loaded ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Groq API hazır
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Groq API key gerekli
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleAnalyze} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analiz ediliyor...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Verileri Analiz Et
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {/* Özet */}
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-2">Özet</h3>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </div>

            {/* Bulgular */}
            {result.insights && result.insights.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Önemli Bulgular
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {result.insights.map((insight: string, index: number) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Öneriler */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Öneriler</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {result.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {result.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

