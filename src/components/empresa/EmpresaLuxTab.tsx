import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LuxIntelligencePanel } from '@/components/lux/LuxIntelligencePanel';
import type { LuxIntelligenceRecord } from '@/hooks/useLuxIntelligence';

interface EmpresaLuxTabProps {
  luxRecord: LuxIntelligenceRecord | null;
  luxRecords: LuxIntelligenceRecord[];
  luxLoading: boolean;
  luxTriggering: boolean;
  onTriggerLux: () => void;
}

export const EmpresaLuxTab = ({
  luxRecord,
  luxRecords,
  luxLoading,
  luxTriggering,
  onTriggerLux,
}: EmpresaLuxTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="pt-6">
          <LuxIntelligencePanel
            record={luxRecord}
            records={luxRecords}
            entityType="company"
            loading={luxLoading}
            onTrigger={onTriggerLux}
            triggering={luxTriggering}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};
