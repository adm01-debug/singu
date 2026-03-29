import { useState, useEffect } from 'react';

interface NetworkQuality {
  /** Tipo de conexão efetiva: '4g', '3g', '2g', 'slow-2g' */
  effectiveType: string;
  /** Downlink estimado em Mbps */
  downlink: number;
  /** RTT estimado em ms */
  rtt: number;
  /** Se o usuário tem data saver ativado */
  saveData: boolean;
  /** Se a conexão é considerada lenta */
  isSlow: boolean;
}

interface NavigatorConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?(type: string, listener: () => void): void;
  removeEventListener?(type: string, listener: () => void): void;
}

/**
 * Hook para detectar qualidade da rede e adaptar carregamento.
 * Usa Network Information API quando disponível.
 * 
 * Casos de uso:
 * - Desabilitar animações em conexões lentas
 * - Reduzir qualidade de imagens
 * - Desabilitar prefetch agressivo
 */
export function useNetworkQuality(): NetworkQuality {
  const getConnection = (): NavigatorConnection | null => {
    if (typeof navigator === 'undefined') return null;
    return (navigator as unknown as { connection?: NavigatorConnection }).connection || null;
  };

  const getQuality = (): NetworkQuality => {
    const conn = getConnection();
    const effectiveType = conn?.effectiveType || '4g';
    const downlink = conn?.downlink || 10;
    const rtt = conn?.rtt || 50;
    const saveData = conn?.saveData || false;
    
    return {
      effectiveType,
      downlink,
      rtt,
      saveData,
      isSlow: effectiveType === '2g' || effectiveType === 'slow-2g' || saveData || rtt > 500,
    };
  };

  const [quality, setQuality] = useState<NetworkQuality>(getQuality);

  useEffect(() => {
    const conn = getConnection();
    if (!conn?.addEventListener) return;

    const handleChange = () => setQuality(getQuality());
    conn.addEventListener('change', handleChange);
    return () => conn.removeEventListener?.('change', handleChange);
  }, []);

  return quality;
}
