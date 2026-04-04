import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface BorderRadiusControlProps {
  value: number;
  onChange: (value: number[]) => void;
}

export const BorderRadiusControl = memo(function BorderRadiusControl({ value, onChange }: BorderRadiusControlProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Raio da Borda</CardTitle>
        <CardDescription>Ajuste o arredondamento dos elementos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <Slider
            value={[value]}
            onValueChange={onChange}
            min={0}
            max={24}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium text-muted-foreground w-12 text-right tabular-nums">
            {value}px
          </span>
        </div>

        {/* Preview elements */}
        <div className="flex items-center gap-3">
          <Button size="sm" style={{ borderRadius: `${value}px` }}>
            Botão
          </Button>
          <div
            className="px-3 py-1.5 border border-border text-sm text-muted-foreground"
            style={{ borderRadius: `${Math.max(value - 2, 0)}px` }}
          >
            Input
          </div>
          <div
            className="px-3 py-1.5 border border-border text-sm text-muted-foreground bg-card"
            style={{ borderRadius: `${value}px` }}
          >
            Card
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
