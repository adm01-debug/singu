import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  label: string;
  value: number;
  formattedValue?: string;
  color?: string;
}

interface AccessibleChartProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
  children: ReactNode;
  className?: string;
  /** Unit for screen reader (e.g., "%", "interações", "R$") */
  unit?: string;
  /** Show accessible data table (for keyboard users) */
  showDataTable?: boolean;
}

/**
 * Wrapper component that adds accessibility to Recharts visualizations
 * Includes ARIA labels, hidden data table, and keyboard navigation support
 */
export function AccessibleChart({
  data,
  title,
  description,
  chartType,
  children,
  className,
  unit = '',
  showDataTable = true,
}: AccessibleChartProps) {
  const chartId = `chart-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const tableId = `${chartId}-table`;

  // Generate screen reader summary
  const getSummary = () => {
    if (data.length === 0) return 'Nenhum dado disponível';
    
    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const sum = data.reduce((acc, d) => acc + d.value, 0);
    const avg = sum / data.length;
    
    const maxItem = data.find(d => d.value === max);
    const minItem = data.find(d => d.value === min);
    
    return `Gráfico de ${chartType === 'bar' ? 'barras' : chartType === 'line' ? 'linhas' : chartType === 'pie' ? 'pizza' : 'área'} com ${data.length} pontos de dados. ` +
      `Maior valor: ${maxItem?.label} com ${maxItem?.formattedValue || max}${unit}. ` +
      `Menor valor: ${minItem?.label} com ${minItem?.formattedValue || min}${unit}. ` +
      `Média: ${avg.toFixed(1)}${unit}.`;
  };

  return (
    <figure 
      className={cn("relative", className)}
      role="figure"
      aria-labelledby={`${chartId}-title`}
      aria-describedby={`${chartId}-desc`}
    >
      {/* Visible title (if needed externally, can be hidden) */}
      <figcaption className="sr-only" id={`${chartId}-title`}>
        {title}
      </figcaption>
      
      {/* Screen reader summary */}
      <p className="sr-only" id={`${chartId}-desc`}>
        {description || getSummary()}
      </p>
      
      {/* Chart container */}
      <div 
        role="img" 
        aria-label={title}
        aria-describedby={showDataTable ? tableId : `${chartId}-desc`}
      >
        {children}
      </div>
      
      {/* Accessible data table (hidden visually but available to screen readers) */}
      {showDataTable && (
        <table 
          id={tableId}
          className="sr-only"
          aria-label={`Dados do gráfico: ${title}`}
        >
          <caption>{title} - Dados tabulares</caption>
          <thead>
            <tr>
              <th scope="col">Categoria</th>
              <th scope="col">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <th scope="row">{item.label}</th>
                <td>{item.formattedValue || item.value}{unit}</td>
              </tr>
            ))}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td>{data.reduce((acc, d) => acc + d.value, 0).toFixed(1)}{unit}</td>
              </tr>
              <tr>
                <th scope="row">Média</th>
                <td>{(data.reduce((acc, d) => acc + d.value, 0) / data.length).toFixed(1)}{unit}</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </figure>
  );
}

/**
 * Wrapper for interactive charts with drill-down capability
 */
interface InteractiveChartWrapperProps {
  data: ChartDataPoint[];
  title: string;
  children: ReactNode;
  onPointClick?: (point: ChartDataPoint) => void;
  className?: string;
}

export function InteractiveChartWrapper({
  data,
  title,
  children,
  onPointClick,
  className,
}: InteractiveChartWrapperProps) {
  const handleKeyDown = (e: React.KeyboardEvent, point: ChartDataPoint) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPointClick?.(point);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {children}
      
      {/* Keyboard-accessible data points */}
      {onPointClick && (
        <div className="sr-only">
          <p>Use as teclas de seta para navegar entre os pontos de dados. Pressione Enter para selecionar.</p>
          <ul role="listbox" aria-label={`Pontos de dados: ${title}`}>
            {data.map((point, index) => (
              <li
                key={index}
                role="option"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, point)}
                onClick={() => onPointClick(point)}
              >
                {point.label}: {point.formattedValue || point.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Legend component with accessibility
 */
interface AccessibleLegendProps {
  items: { label: string; color: string; value?: number | string }[];
  title?: string;
}

export function AccessibleLegend({ items, title }: AccessibleLegendProps) {
  return (
    <div role="list" aria-label={title || 'Legenda do gráfico'} className="flex flex-wrap gap-4">
      {items.map((item, index) => (
        <div 
          key={index} 
          role="listitem" 
          className="flex items-center gap-2"
        >
          <span 
            className="w-3 h-3 rounded-sm flex-shrink-0" 
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground">
            {item.label}
            {item.value !== undefined && (
              <span className="font-medium text-foreground ml-1">
                ({item.value})
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export default AccessibleChart;
