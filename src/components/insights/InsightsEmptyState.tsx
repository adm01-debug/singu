import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InsightsEmptyStateProps {
  hasInsights: boolean;
  generating: boolean;
  onRefresh: () => void;
}

export const InsightsEmptyState = ({ hasInsights, generating, onRefresh }: InsightsEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {!hasInsights ? 'Nenhum insight gerado' : 'Nenhum insight encontrado'}
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        {!hasInsights
          ? 'Adicione contatos e registre interações para que a IA possa gerar insights personalizados sobre seus relacionamentos.'
          : 'Tente ajustar os filtros de busca para encontrar insights.'}
      </p>
      {!hasInsights && (
        <Button onClick={onRefresh} disabled={generating} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", generating && "animate-spin")} />
          Tentar Gerar Insights
        </Button>
      )}
    </motion.div>
  );
};
