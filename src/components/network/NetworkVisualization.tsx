import { useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RefreshCw, 
  Users, 
  Building2, 
  User,
  X,
  ExternalLink,
  Star,
  MessageSquare,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNetworkGraph, GraphNode, GraphLink } from '@/hooks/useNetworkGraph';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NetworkVisualizationProps {
  className?: string;
  height?: number;
}

export const NetworkVisualization = ({ className, height = 600 }: NetworkVisualizationProps) => {
  const navigate = useNavigate();
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [filters, setFilters] = useState({
    showContacts: true,
    showCompanies: true,
    showYou: true,
  });

  const {
    graphData,
    loading,
    error,
    selectedNode,
    setSelectedNode,
    stats,
    refetch,
  } = useNetworkGraph();

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

  // Filter nodes and links
  const filteredData = {
    nodes: graphData.nodes.filter(node => {
      if (node.type === 'contact' && !filters.showContacts) return false;
      if (node.type === 'company' && !filters.showCompanies) return false;
      if (node.type === 'you' && !filters.showYou) return false;
      return true;
    }),
    links: graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
      
      const sourceNode = graphData.nodes.find(n => n.id === sourceId);
      const targetNode = graphData.nodes.find(n => n.id === targetId);
      
      if (!sourceNode || !targetNode) return false;
      if (sourceNode.type === 'contact' && !filters.showContacts) return false;
      if (targetNode.type === 'contact' && !filters.showContacts) return false;
      if (sourceNode.type === 'company' && !filters.showCompanies) return false;
      if (targetNode.type === 'company' && !filters.showCompanies) return false;
      
      return true;
    }),
  };

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    
    // Center on node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 500);
      graphRef.current.zoom(2, 500);
    }
  }, [setSelectedNode]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  }, []);

  const handleNavigateToEntity = useCallback((node: GraphNode) => {
    if (node.type === 'contact') {
      const contactId = node.id.replace('contact-', '');
      navigate(`/contatos/${contactId}`);
    } else if (node.type === 'company') {
      const companyId = node.id.replace('company-', '');
      navigate(`/empresas/${companyId}`);
    }
  }, [navigate]);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  const handleCenter = () => graphRef.current?.centerAt(0, 0, 500);

  // Custom node rendering
  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(12 / globalScale, 3);
    const nodeRadius = node.val;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();
    
    // Add glow effect for selected/hovered nodes
    if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
      
      // Outer glow
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeRadius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = `${node.color}40`;
      ctx.lineWidth = 4 / globalScale;
      ctx.stroke();
    }

    // Draw icon indicator
    ctx.beginPath();
    ctx.fillStyle = 'white';
    
    if (node.type === 'company') {
      // Building icon placeholder
      const iconSize = nodeRadius * 0.6;
      ctx.fillRect(node.x! - iconSize/2, node.y! - iconSize/2, iconSize, iconSize);
    } else if (node.type === 'you') {
      // Star icon placeholder
      ctx.arc(node.x!, node.y!, nodeRadius * 0.4, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // User icon placeholder
      ctx.arc(node.x!, node.y!, nodeRadius * 0.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw label
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = node.type === 'you' ? '#3b82f6' : 
                    node.type === 'company' ? '#8b5cf6' : '#64748b';
    
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
  }, [selectedNode, hoveredNode]);

  // Link styling
  const linkColor = (link: GraphLink) => {
    if (link.type === 'works_at') return '#8b5cf680';
    if (link.type === 'interacted') return '#3b82f680';
    return '#94a3b840';
  };

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Network Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="w-full h-[400px] rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-20 flex-1" />
              <Skeleton className="h-20 flex-1" />
              <Skeleton className="h-20 flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-8 text-center">
          <p className="text-destructive mb-4">Erro ao carregar visualização: {error}</p>
          <Button onClick={refetch}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Mapa de Relacionamentos
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={filters.showContacts}
                  onCheckedChange={(checked) => setFilters(f => ({ ...f, showContacts: checked }))}
                >
                  <User className="w-4 h-4 mr-2" />
                  Contatos
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.showCompanies}
                  onCheckedChange={(checked) => setFilters(f => ({ ...f, showCompanies: checked }))}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Empresas
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.showYou}
                  onCheckedChange={(checked) => setFilters(f => ({ ...f, showYou: checked }))}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Você
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={refetch}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Atualizar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalNodes}</p>
            <p className="text-xs text-muted-foreground">Nós</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalLinks}</p>
            <p className="text-xs text-muted-foreground">Conexões</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.avgConnections}</p>
            <p className="text-xs text-muted-foreground">Média Conexões</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.clusters}</p>
            <p className="text-xs text-muted-foreground">Clusters</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Graph container */}
        <div 
          ref={containerRef} 
          className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-b-lg overflow-hidden"
          style={{ height: `${height}px` }}
        >
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
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
            linkColor={linkColor}
            linkWidth={(link) => (link as GraphLink).value}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={(node) => handleNodeClick(node as GraphNode)}
            onNodeHover={(node) => handleNodeHover(node as GraphNode | null)}
            cooldownTime={2000}
            d3VelocityDecay={0.3}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
          />
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="secondary" onClick={handleZoomIn} className="shadow-lg">
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Zoom In</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="secondary" onClick={handleZoomOut} className="shadow-lg">
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Zoom Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="secondary" onClick={handleCenter} className="shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Centralizar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border">
          <p className="text-xs font-medium mb-2 text-muted-foreground">Legenda</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Você</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Empresas</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Score Alto</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Score Médio</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Score Baixo</span>
            </div>
          </div>
        </div>

        {/* Selected Node Panel */}
        <AnimatePresence>
          {selectedNode && selectedNode.type !== 'you' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-72 bg-background/95 backdrop-blur-sm rounded-lg shadow-xl border p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    {selectedNode.avatar ? (
                      <AvatarImage src={selectedNode.avatar} />
                    ) : null}
                    <AvatarFallback className={cn(
                      'text-white font-semibold',
                      selectedNode.type === 'company' ? 'bg-purple-500' : 'bg-blue-500'
                    )}>
                      {selectedNode.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-foreground">{selectedNode.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {selectedNode.type === 'company' ? 'Empresa' : 'Contato'}
                    </Badge>
                  </div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 mb-4">
                {selectedNode.role && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Função:</span> {selectedNode.role}
                  </p>
                )}
                {selectedNode.industry && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Setor:</span> {selectedNode.industry}
                  </p>
                )}
                {selectedNode.relationshipScore !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Score:</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all',
                          selectedNode.relationshipScore >= 70 ? 'bg-emerald-500' :
                          selectedNode.relationshipScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${selectedNode.relationshipScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{selectedNode.relationshipScore}%</span>
                  </div>
                )}
                {selectedNode.interactionCount !== undefined && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {selectedNode.interactionCount} interações
                  </p>
                )}
              </div>

              <Button 
                className="w-full" 
                size="sm"
                onClick={() => handleNavigateToEntity(selectedNode)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Detalhes
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {/* Top Influencers sidebar */}
      {stats.topInfluencers.length > 0 && (
        <div className="p-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Principais Influenciadores
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.topInfluencers.map((influencer, index) => (
              <Badge 
                key={influencer.id}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  const node = graphData.nodes.find(n => n.id === influencer.id);
                  if (node) handleNodeClick(node);
                }}
              >
                <span className="mr-1">#{index + 1}</span>
                {influencer.name}
                <span className="ml-1 text-muted-foreground">({influencer.connections})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};