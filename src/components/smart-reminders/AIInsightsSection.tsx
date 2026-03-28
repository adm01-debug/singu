import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AIInsightsSectionProps {
  aiInsights: string | null;
  showInsights: boolean;
  onToggleInsights: (show: boolean) => void;
}

export const AIInsightsSection = ({
  aiInsights,
  showInsights,
  onToggleInsights,
}: AIInsightsSectionProps) => {
  if (!aiInsights) return null;

  return (
    <>
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground mb-1">
                        Insights da IA
                      </h4>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {aiInsights}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={() => onToggleInsights(false)}
                    aria-label="Ocultar"
                  >
                    <EyeOff className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!showInsights && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleInsights(true)}
          className="text-xs text-muted-foreground"
        >
          <Eye className="w-3 h-3 mr-1" />
          Mostrar insights IA
        </Button>
      )}
    </>
  );
};
