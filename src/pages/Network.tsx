import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { NetworkVisualization } from '@/components/network/NetworkVisualization';

const Network = () => {
  return (
    <AppLayout>
      <Header 
        title="Network Visualization" 
        subtitle="Mapa interativo de relacionamentos, empresas e contatos"
      />

      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <NetworkVisualization height={650} />
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Network;