// Generational Integration Panel
// Painel que mostra integração da geração com outros frameworks

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  AlertCircle, 
  CheckCircle2,
  Brain,
  Eye,
  Target
} from 'lucide-react';
import { GenerationalAnalysis } from '@/types/generation';

interface GenerationalIntegrationPanelProps {
  analysis: GenerationalAnalysis;
}

export function GenerationalIntegrationPanel({ analysis }: GenerationalIntegrationPanelProps) {
  const { discAlignment, vakAlignment, neuroAlignment, recommendations, generation } = analysis;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Integração Comportamental
        </CardTitle>
        <CardDescription>
          Cruzamento do perfil {generation.name} com frameworks detectados
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Alignment Scores */}
        <div className="grid grid-cols-3 gap-3">
          <AlignmentScore 
            title="DISC" 
            score={discAlignment.score} 
            icon={Brain}
          />
          <AlignmentScore 
            title="VAK" 
            score={vakAlignment.score} 
            icon={Eye}
          />
          <AlignmentScore 
            title="Neuro" 
            score={neuroAlignment.score} 
            icon={Lightbulb}
          />
        </div>
        
        <Separator />
        
        {/* DISC Insights */}
        <InsightSection 
          title="Insights DISC" 
          insights={discAlignment.insights}
          icon={Brain}
        />
        
        {/* VAK Insights */}
        <InsightSection 
          title="Insights VAK" 
          insights={vakAlignment.insights}
          icon={Eye}
        />
        
        {/* Neuro Insights */}
        <InsightSection 
          title="Insights Neuro" 
          insights={neuroAlignment.insights}
          icon={Lightbulb}
        />
        
        <Separator />
        
        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Recomendações Personalizadas
          </h4>
          
          <div className="space-y-2">
            <RecommendationGroup 
              title="Comunicação" 
              items={recommendations.communication}
              variant="default"
            />
            <RecommendationGroup 
              title="Abordagem" 
              items={recommendations.approach}
              variant="success"
            />
            <RecommendationGroup 
              title="Evitar" 
              items={recommendations.avoid}
              variant="destructive"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlignmentScore({ 
  title, 
  score, 
  icon: Icon 
}: { 
  title: string; 
  score: number; 
  icon: React.ElementType 
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="text-center p-2 rounded-lg bg-muted/50">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${getScoreColor(score)}`} />
      <div className={`text-lg font-bold ${getScoreColor(score)}`}>{score}%</div>
      <div className="text-xs text-muted-foreground">{title}</div>
      <Progress value={score} className="h-1 mt-1" />
    </div>
  );
}

function InsightSection({ 
  title, 
  insights, 
  icon: Icon 
}: { 
  title: string; 
  insights: string[]; 
  icon: React.ElementType 
}) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {title}
      </h4>
      <ul className="space-y-1">
        {insights.map((insight, i) => (
          <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationGroup({ 
  title, 
  items, 
  variant 
}: { 
  title: string; 
  items: string[]; 
  variant: 'default' | 'success' | 'destructive' 
}) {
  const colors = {
    default: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    destructive: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{title}:</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {items.slice(0, 4).map((item, i) => (
          <Badge 
            key={i} 
            variant="outline" 
            className={`text-xs ${colors[variant]}`}
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default GenerationalIntegrationPanel;
