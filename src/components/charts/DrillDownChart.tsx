import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface DrillDownLevel {
  id: string;
  title: string;
  data: DrillDownDataItem[];
}

interface DrillDownDataItem {
  name: string;
  value: number;
  color?: string;
  children?: DrillDownDataItem[];
  metadata?: Record<string, any>;
}

interface DrillDownChartProps {
  initialLevel: DrillDownLevel;
  onDrillDown?: (item: DrillDownDataItem, level: number) => DrillDownLevel | null;
  onDrillUp?: (level: number) => void;
  chartType?: 'bar' | 'pie';
  title?: string;
  icon?: ReactNode;
  height?: number;
  className?: string;
  colors?: string[];
  showLegend?: boolean;
  /** Accessible table for screen readers */
  showAccessibleTable?: boolean;
}

const defaultColors = [
  'hsl(221, 83%, 53%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 67%, 45%)',
  'hsl(199, 89%, 48%)',
  'hsl(0, 84%, 60%)',
  'hsl(160, 84%, 39%)',
  'hsl(215, 16%, 47%)',
];

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Valor: <span className="font-medium">{data.value}</span>
        </p>
        {data.children && (
          <p className="text-xs text-primary mt-1 flex items-center gap-1">
            <ZoomIn className="w-3 h-3" /> Clique para expandir
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function DrillDownChart({
  initialLevel,
  onDrillDown,
  onDrillUp,
  chartType = 'bar',
  title,
  icon,
  height = 300,
  className,
  colors = defaultColors,
  showLegend = true,
  showAccessibleTable = true,
}: DrillDownChartProps) {
  const [levels, setLevels] = useState<DrillDownLevel[]>([initialLevel]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const currentLevel = levels[levels.length - 1];
  const canDrillUp = levels.length > 1;

  const handleItemClick = (item: DrillDownDataItem) => {
    if (!item.children && !onDrillDown) return;
    
    setIsAnimating(true);
    
    let newLevel: DrillDownLevel | null = null;
    
    if (item.children) {
      newLevel = {
        id: item.name,
        title: item.name,
        data: item.children,
      };
    } else if (onDrillDown) {
      newLevel = onDrillDown(item, levels.length);
    }
    
    if (newLevel) {
      setLevels(prev => [...prev, newLevel!]);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleDrillUp = () => {
    if (!canDrillUp) return;
    
    setIsAnimating(true);
    setLevels(prev => prev.slice(0, -1));
    onDrillUp?.(levels.length - 1);
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Assign colors to data
  const coloredData = currentLevel.data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {canDrillUp && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDrillUp}
                className="h-8 w-8 -ml-2"
                aria-label="Voltar ao nível anterior"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {icon}
            <CardTitle className="text-lg font-semibold">
              {title || currentLevel.title}
            </CardTitle>
          </div>
          
          {/* Breadcrumb for levels */}
          {levels.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {levels.map((level, index) => (
                <span key={level.id} className="flex items-center gap-1">
                  {index > 0 && <span>/</span>}
                  <button
                    onClick={() => setLevels(prev => prev.slice(0, index + 1))}
                    className={cn(
                      'hover:text-foreground transition-colors',
                      index === levels.length - 1 && 'text-foreground font-medium'
                    )}
                  >
                    {level.title}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ height }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart 
                  data={coloredData}
                  onClick={(data) => {
                    if (data && data.activePayload) {
                      handleItemClick(data.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {showLegend && <Legend />}
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                  >
                    {coloredData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className={cn(
                          'transition-opacity',
                          entry.children && 'hover:opacity-80'
                        )}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={coloredData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={handleItemClick}
                    cursor="pointer"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  >
                    {coloredData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className={cn(
                          'transition-opacity',
                          entry.children && 'hover:opacity-80'
                        )}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  {showLegend && <Legend />}
                </PieChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        {/* Accessible table for screen readers */}
        {showAccessibleTable && (
          <table className="sr-only" aria-label={`Dados do gráfico: ${currentLevel.title}`}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {currentLevel.data.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// Simplified drill-down bar chart for quick use
interface SimpleDrillDownBarProps {
  data: DrillDownDataItem[];
  title: string;
  icon?: ReactNode;
  height?: number;
  className?: string;
}

export function SimpleDrillDownBar({ data, title, icon, height = 250, className }: SimpleDrillDownBarProps) {
  return (
    <DrillDownChart
      initialLevel={{ id: 'root', title, data }}
      chartType="bar"
      title={title}
      icon={icon}
      height={height}
      className={className}
    />
  );
}

// Simplified drill-down pie chart for quick use
interface SimpleDrillDownPieProps {
  data: DrillDownDataItem[];
  title: string;
  icon?: ReactNode;
  height?: number;
  className?: string;
}

export function SimpleDrillDownPie({ data, title, icon, height = 280, className }: SimpleDrillDownPieProps) {
  return (
    <DrillDownChart
      initialLevel={{ id: 'root', title, data }}
      chartType="pie"
      title={title}
      icon={icon}
      height={height}
      className={className}
    />
  );
}
