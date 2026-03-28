import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Target,
  CheckCircle,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { NLPBriefing } from '@/hooks/usePreContactBriefing';

interface BriefingCollapsibleSectionsProps {
  briefing: NLPBriefing;
  expandedSections: Set<string>;
  onToggleSection: (section: string) => void;
}

export function BriefingCollapsibleSections({
  briefing,
  expandedSections,
  onToggleSection,
}: BriefingCollapsibleSectionsProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <>
      {/* Opening Tips Section */}
      <CollapsibleSection
        id="tips"
        icon={<Lightbulb className="w-4 h-4 text-warning" />}
        title="Dicas de Abertura"
        expanded={expandedSections.has('tips')}
        onToggle={() => onToggleSection('tips')}
      >
        <div className="mt-2 space-y-1">
          {briefing.openingTips.map((tip, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 rounded-lg bg-warning/5 text-sm"
            >
              <CheckCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Words to Use/Avoid Section */}
      <CollapsibleSection
        id="words"
        icon={<MessageSquare className="w-4 h-4 text-primary" />}
        title="Palavras Magicas"
        expanded={expandedSections.has('words')}
        onToggle={() => onToggleSection('words')}
      >
        <div className="mt-2 grid grid-cols-2 gap-3">
          {/* Use */}
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <p className="text-xs font-medium text-success mb-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> USE
            </p>
            <div className="flex flex-wrap gap-1">
              {briefing.wordsToUse.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCopy(word, `use-${idx}`)}
                  className="text-xs px-2 py-1 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center gap-1"
                >
                  {word}
                  {copiedText === `use-${idx}` ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-50" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Avoid */}
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
              <X className="w-3 h-3" /> EVITE
            </p>
            <div className="flex flex-wrap gap-1">
              {briefing.wordsToAvoid.map((word, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Values Section */}
      <CollapsibleSection
        id="values"
        icon={<Target className="w-4 h-4 text-accent" />}
        title="Valores Importantes"
        expanded={expandedSections.has('values')}
        onToggle={() => onToggleSection('values')}
      >
        <div className="mt-2 flex flex-wrap gap-2">
          {briefing.topValues.map((value, idx) => (
            <Badge key={idx} variant="secondary" className="capitalize">
              {value}
            </Badge>
          ))}
        </div>
      </CollapsibleSection>

      {/* DISC Sales Strategies Section */}
      {briefing.discProfile.type !== 'N/A' && (
        <CollapsibleSection
          id="disc"
          icon={<Target className="w-4 h-4 text-primary" />}
          title={`Estrategias DISC (${briefing.discProfile.type})`}
          expanded={expandedSections.has('disc')}
          onToggle={() => onToggleSection('disc')}
        >
          <div className="mt-2 space-y-3">
            {/* Opening Strategies */}
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-medium text-primary mb-1">🎯 Abertura</p>
              <ul className="text-xs space-y-0.5 text-muted-foreground">
                {briefing.discProfile.salesStrategies.opening.slice(0, 2).map((tip, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <CheckCircle className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Closing Strategies */}
            <div className="p-2 rounded-lg bg-success/5 border border-success/20">
              <p className="text-xs font-medium text-success mb-1">🏆 Fechamento</p>
              <ul className="text-xs space-y-0.5 text-muted-foreground">
                {briefing.discProfile.salesStrategies.closing.slice(0, 2).map((tip, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <CheckCircle className="w-3 h-3 text-success shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Avoid Behaviors */}
            <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs font-medium text-destructive mb-1">⚠️ Evite</p>
              <ul className="text-xs space-y-0.5 text-muted-foreground">
                {briefing.discProfile.avoidBehaviors.slice(0, 2).map((avoid, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <X className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                    {avoid}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleSection>
      )}
    </>
  );
}

/** Reusable collapsible section wrapper */
interface CollapsibleSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ icon, title, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
