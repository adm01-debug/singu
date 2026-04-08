import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Crown,
  Shield,
  Bell,
  Eye,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { StakeholderData } from '@/hooks/useStakeholderAnalysis';

interface StakeholderInfluenceNetworkProps {
  stakeholders: StakeholderData[];
  height?: number;
  className?: string;
}

interface NetworkNode {
  id: string;
  name: string;
  val: number;
  color: string;
  quadrant: string;
  power: number;
  interest: number;
  influence: number;
  support: number;
  engagement: number;
  riskLevel: string;
  avatar?: string;
  role?: string;
  x?: number;
  y?: number;
}

interface NetworkLink {
  source: string;
  target: string;
  value: number;
  type: 'influence' | 'collaboration' | 'conflict';
  strength: number;
}

const QUADRANT_COLORS = {
  manage_closely: '#3b82f6', // blue/primary
  keep_satisfied: '#f59e0b', // amber/warning
  keep_informed: '#06b6d4', // cyan/info
  monitor: '#94a3b8', // slate/muted
};

const SUPPORT_COLORS = {
  champion: '#22c55e', // green
  supporter: '#84cc16', // lime
  neutral: '#94a3b8', // slate
  skeptic: '#f97316', // orange
  blocker: '#ef4444', // red
};

function getSupportType(support: number): keyof typeof SUPPORT_COLORS {
  if (support >= 4) return 'champion';
  if (support >= 1) return 'supporter';
  if (support >= -1) return 'neutral';
  if (support >= -3) return 'skeptic';
  return 'blocker';
}

function getSupportLabel(support: number): string {
  const type = getSupportType(support);
  const labels = {
    champion: 'Champion',
    supporter: 'Apoiador',
    neutral: 'Neutro',
    skeptic: 'Cético',
    blocker: 'Bloqueador',
  };
  return labels[type];
}

function getQuadrantLabel(quadrant: string): string {
  const labels: Record<string, string> = {
    manage_closely: 'Gerenciar de Perto',
    keep_satisfied: 'Manter Satisfeito',
    keep_informed: 'Manter Informado',
    monitor: 'Monitorar',
  };
  return labels[quadrant] || quadrant;
}

function getQuadrantIcon(quadrant: string) {
  const icons: Record<string, typeof Crown> = {
    manage_closely: Crown,
    keep_satisfied: Shield,
    keep_informed: Bell,
    monitor: Eye,
  };
  return icons[quadrant] || Eye;
}

function getSupportIcon(support: number) {
  const type = getSupportType(support);
  const icons = {
    champion: UserCheck,
    supporter: TrendingUp,
    neutral: Minus,
    skeptic: TrendingDown,
    blocker: UserX,
  };
  return icons[type];
}

export function StakeholderInfluenceNetwork({
  stakeholders,
  height = 400,
  className,
}: StakeholderInfluenceNetworkProps) {
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height });
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Build network data from stakeholders
  const networkData = useMemo(() => {
    const nodes: NetworkNode[] = stakeholders.map((s) => ({
      id: s.contact.id,
      name: `${s.contact.first_name} ${s.contact.last_name}`,
      val: 8 + s.metrics.influence * 1.5, // Node size based on influence
      color: SUPPORT_COLORS[getSupportType(s.metrics.support)],
      quadrant: s.quadrant,
      power: s.metrics.power,
      interest: s.metrics.interest,
      influence: s.metrics.influence,
      support: s.metrics.support,
      engagement: s.metrics.engagement,
      riskLevel: s.riskLevel,
      avatar: s.contact.avatar_url || undefined,
      role: s.contact.role_title || undefined,
    }));

    // Build influence links between stakeholders
    const links: NetworkLink[] = [];

    // Create links based on shared quadrant and influence levels
    for (let i = 0; i < stakeholders.length; i++) {
      for (let j = i + 1; j < stakeholders.length; j++) {
        const s1 = stakeholders[i];
        const s2 = stakeholders[j];

        // Calculate relationship strength
        const sameQuadrant = s1.quadrant === s2.quadrant ? 2 : 0;
        const influenceDiff = Math.abs(s1.metrics.influence - s2.metrics.influence);
        const supportDiff = Math.abs(s1.metrics.support - s2.metrics.support);

        // High influencers connect to each other
        if (s1.metrics.influence >= 7 && s2.metrics.influence >= 7) {
          links.push({
            source: s1.contact.id,
            target: s2.contact.id,
            value: 3,
            type: 'influence',
            strength: (s1.metrics.influence + s2.metrics.influence) / 2,
          });
        }
        // Same quadrant stakeholders have natural connections
        else if (sameQuadrant && influenceDiff <= 3) {
          links.push({
            source: s1.contact.id,
            target: s2.contact.id,
            value: 1.5,
            type: 'collaboration',
            strength: sameQuadrant + (10 - influenceDiff) / 5,
          });
        }
        // Opposite positions might have conflict
        else if (
          (getSupportType(s1.metrics.support) === 'champion' &&
            getSupportType(s2.metrics.support) === 'blocker') ||
          (getSupportType(s1.metrics.support) === 'blocker' &&
            getSupportType(s2.metrics.support) === 'champion')
        ) {
          links.push({
            source: s1.contact.id,
            target: s2.contact.id,
            value: 2,
            type: 'conflict',
            strength: supportDiff,
          });
        }
        // High power connects to high interest
        else if (s1.metrics.power >= 7 && s2.metrics.interest >= 7) {
          links.push({
            source: s1.contact.id,
            target: s2.contact.id,
            value: 1,
            type: 'influence',
            strength: (s1.metrics.power + s2.metrics.interest) / 4,
          });
        } else if (s2.metrics.power >= 7 && s1.metrics.interest >= 7) {
          links.push({
            source: s2.contact.id,
            target: s1.contact.id,
            value: 1,
            type: 'influence',
            strength: (s2.metrics.power + s1.metrics.interest) / 4,
          });
        }
      }
    }

    return { nodes, links };
  }, [stakeholders]);

  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 500);
      graphRef.current.zoom(2.5, 500);
    }
  }, []);

  const handleNodeHover = useCallback((node: NetworkNode | null) => {
    setHoveredNode(node);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  }, []);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  const handleCenter = () => graphRef.current?.centerAt(0, 0, 500);

  // Custom node rendering
  const nodeCanvasObject = useCallback(
    (node: NetworkNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name.split(' ')[0]; // First name only
      const fontSize = Math.max(10 / globalScale, 3);
      const nodeRadius = node.val;

      // Draw outer ring for quadrant
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeRadius + 3, 0, 2 * Math.PI);
      ctx.strokeStyle = QUADRANT_COLORS[node.quadrant as keyof typeof QUADRANT_COLORS] || '#94a3b8';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();

      // Draw main node
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Glow effect for selected/hovered
      if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, nodeRadius + 8, 0, 2 * Math.PI);
        ctx.strokeStyle = `${node.color}60`;
        ctx.lineWidth = 4 / globalScale;
        ctx.stroke();
      }

      // Draw influence indicator (inner circle)
      const influenceRadius = (node.influence / 10) * nodeRadius * 0.6;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, influenceRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      // Draw label
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Background for text
      const textWidth = ctx.measureText(label).width;
      const padding = 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(
        node.x! - textWidth / 2 - padding,
        node.y! + nodeRadius + 2,
        textWidth + padding * 2,
        fontSize + padding * 2
      );

      // Text
      ctx.fillStyle = '#1e293b';
      ctx.fillText(label, node.x!, node.y! + nodeRadius + 4);
    },
    [selectedNode, hoveredNode]
  );

  // Link styling
  const linkColor = useCallback((link: NetworkLink) => {
    if (link.type === 'influence') return '#3b82f680';
    if (link.type === 'collaboration') return '#22c55e60';
    if (link.type === 'conflict') return '#ef444460';
    return '#94a3b840';
  }, []);

  if (stakeholders.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-muted-foreground', className)}>
        <p>Nenhum stakeholder para visualizar</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Graph container */}
      <div
        ref={containerRef}
        className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={networkData}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel=""
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, node.val as number, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkColor={linkColor as () => string}
          linkWidth={(link) => (link as NetworkLink).value}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.008}
          onNodeClick={(node) => handleNodeClick(node as NetworkNode)}
          onNodeHover={(node) => handleNodeHover(node as NetworkNode | null)}
          cooldownTime={2000}
          d3VelocityDecay={0.4}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" onClick={handleZoomIn} className="h-8 w-8 shadow-md">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom In</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" onClick={handleZoomOut} className="h-8 w-8 shadow-md">
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" onClick={handleCenter} className="h-8 w-8 shadow-md">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Centralizar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm p-2 rounded-lg shadow-md border text-xs">
        <p className="font-medium mb-1.5 text-muted-foreground">Legenda</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            <span>Champion</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#84cc16]" />
            <span>Apoiador</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
            <span>Neutro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
            <span>Cético</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <span>Bloqueador</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-[#3b82f680]" />
            <span>Influência</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-[#22c55e60]" />
            <span>Colaboração</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-[#ef444460]" />
            <span>Conflito</span>
          </div>
        </div>
      </div>

      {/* Selected Node Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-3 right-3 w-64 bg-background/95 backdrop-blur-sm rounded-lg shadow-xl border p-3"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <OptimizedAvatar 
                  src={selectedNode.avatar}
                  alt={selectedNode.name}
                  fallback={selectedNode.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                  size="sm"
                  className="w-10 h-10 border-2"
                />
                <div>
                  <h4 className="font-semibold text-sm">{selectedNode.name}</h4>
                  {selectedNode.role && (
                    <p className="text-xs text-muted-foreground truncate">{selectedNode.role}</p>
                  )}
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-[10px]"
                  style={{
                    borderColor: QUADRANT_COLORS[selectedNode.quadrant as keyof typeof QUADRANT_COLORS],
                    color: QUADRANT_COLORS[selectedNode.quadrant as keyof typeof QUADRANT_COLORS],
                  }}
                >
                  {(() => {
                    const Icon = getQuadrantIcon(selectedNode.quadrant);
                    return <Icon className="w-3 h-3 mr-1" />;
                  })()}
                  {getQuadrantLabel(selectedNode.quadrant)}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px]"
                  style={{
                    borderColor: selectedNode.color,
                    color: selectedNode.color,
                  }}
                >
                  {(() => {
                    const Icon = getSupportIcon(selectedNode.support);
                    return <Icon className="w-3 h-3 mr-1" />;
                  })()}
                  {getSupportLabel(selectedNode.support)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poder:</span>
                  <span className="font-medium">{selectedNode.power}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interesse:</span>
                  <span className="font-medium">{selectedNode.interest}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Influência:</span>
                  <span className="font-medium">{selectedNode.influence}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engajamento:</span>
                  <span className="font-medium">{selectedNode.engagement}/10</span>
                </div>
              </div>

              {selectedNode.riskLevel !== 'low' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] w-full justify-center',
                    selectedNode.riskLevel === 'high'
                      ? 'border-destructive/50 text-destructive bg-destructive/10'
                      : 'border-warning/50 text-warning bg-warning/10'
                  )}
                >
                  {selectedNode.riskLevel === 'high' ? 'Alto Risco' : 'Risco Médio'}
                </Badge>
              )}
            </div>

            <Link to={`/contatos/${selectedNode.id}`}>
              <Button variant="outline" size="sm" className="w-full text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver Perfil
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
