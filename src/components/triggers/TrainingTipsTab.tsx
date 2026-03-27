import { motion } from 'framer-motion';
import {
  Target,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAK_LABELS } from '@/types/vak';
import type { TrainingTip, SalespersonProfile } from './communicationTrainingData';
import { DISC_TRAINING, VAK_TRAINING } from './communicationTrainingData';

interface TrainingTipsTabProps {
  selectedDISC: DISCProfile;
  setSelectedDISC: (disc: DISCProfile) => void;
  selectedVAK: VAKType;
  setSelectedVAK: (vak: VAKType) => void;
  salespersonProfile: SalespersonProfile | null;
}

export function TrainingTipsTab({
  selectedDISC,
  setSelectedDISC,
  selectedVAK,
  setSelectedVAK,
  salespersonProfile,
}: TrainingTipsTabProps) {
  const getDISCTip = (targetDISC: DISCProfile): TrainingTip | null => {
    const sellerDISC = salespersonProfile?.discProfile;
    if (!sellerDISC) return DISC_TRAINING.D[targetDISC];
    return DISC_TRAINING[sellerDISC][targetDISC];
  };

  const getVAKTip = (targetVAK: VAKType): TrainingTip | null => {
    const sellerVAK = salespersonProfile?.vakProfile;
    if (!sellerVAK) return VAK_TRAINING.V[targetVAK];
    return VAK_TRAINING[sellerVAK][targetVAK];
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* DISC Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Perfil DISC do Cliente
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((disc) => (
              <Button
                key={disc}
                variant={selectedDISC === disc ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDISC(disc)}
                className={cn(
                  'flex-col h-auto py-2',
                  disc === salespersonProfile?.discProfile && 'opacity-50'
                )}
              >
                <span className="font-bold">{disc}</span>
                <span className="text-xs truncate">{DISC_LABELS[disc].name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* VAK Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-500" />
            Sistema VAK do Cliente
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {(['V', 'A', 'K', 'D'] as VAKType[]).map((vak) => (
              <Button
                key={vak}
                variant={selectedVAK === vak ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedVAK(vak)}
                className={cn(
                  'flex-col h-auto py-2',
                  vak === salespersonProfile?.vakProfile && 'opacity-50'
                )}
              >
                <span>{VAK_LABELS[vak].icon}</span>
                <span className="text-xs">{VAK_LABELS[vak].name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* DISC Tips */}
      {getDISCTip(selectedDISC) && (
        <TipCard
          tipKey={`disc-${selectedDISC}`}
          tip={getDISCTip(selectedDISC)!}
          icon={<Target className="w-4 h-4 text-blue-600" />}
          gradientClass="from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
        />
      )}

      {/* VAK Tips */}
      {getVAKTip(selectedVAK) && (
        <TipCard
          tipKey={`vak-${selectedVAK}`}
          tip={getVAKTip(selectedVAK)!}
          icon={<Eye className="w-4 h-4 text-purple-600" />}
          gradientClass="from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30"
        />
      )}
    </div>
  );
}

interface TipCardProps {
  tipKey: string;
  tip: TrainingTip;
  icon: React.ReactNode;
  gradientClass: string;
}

function TipCard({ tipKey, tip, icon, gradientClass }: TipCardProps) {
  return (
    <motion.div
      key={tipKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className={`p-4 rounded-lg border bg-gradient-to-r ${gradientClass}`}>
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          {icon}
          {tip.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {tip.description}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> FAÇA
            </p>
            <ul className="space-y-1">
              {tip.doList.map((item, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-600 flex items-center gap-1">
              <ThumbsDown className="w-3 h-3" /> NÃO FAÇA
            </p>
            <ul className="space-y-1">
              {tip.dontList.map((item, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-background/80 rounded-lg">
          <p className="text-xs font-medium mb-2 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Exemplos de frases:
          </p>
          <div className="space-y-1">
            {tip.examples.map((ex, i) => (
              <p key={i} className="text-xs italic text-muted-foreground">
                {ex}
              </p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
