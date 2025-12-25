import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UnifiedAIPanel } from "@/components/dashboard/UnifiedAIPanel";

const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card className="h-full flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
              <Bot className="h-5 w-5" />
            </div>
            AI Asistan
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-3 mb-4">
            <p className="text-sm text-muted-foreground">
              İş süreçleriniz için akıllı öneriler ve analizler alın
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  Akıllı Analiz
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-purple-200 dark:border-purple-800">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Chat Desteği
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            size="lg"
          >
            <Bot className="h-4 w-4 mr-2" />
            AI Asistan'ı Aç
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl h-[80vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Asistan
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <UnifiedAIPanel />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIAssistantWidget;

