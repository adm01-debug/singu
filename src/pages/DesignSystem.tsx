import { AppLayout } from '@/components/layout/AppLayout';
import { Typography, Heading, DisplayText } from '@/components/ui/typography';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const colorTokens = [
  { name: 'Primary', class: 'bg-primary', text: 'text-primary-foreground' },
  { name: 'Secondary', class: 'bg-secondary', text: 'text-secondary-foreground' },
  { name: 'Accent', class: 'bg-accent', text: 'text-accent-foreground' },
  { name: 'Success', class: 'bg-success', text: 'text-success-foreground' },
  { name: 'Warning', class: 'bg-warning', text: 'text-warning-foreground' },
  { name: 'Destructive', class: 'bg-destructive', text: 'text-destructive-foreground' },
  { name: 'Info', class: 'bg-info', text: 'text-info-foreground' },
  { name: 'Muted', class: 'bg-muted', text: 'text-muted-foreground' },
];

const surfaceLevels = [0, 1, 2, 3, 4] as const;

const spacingTokens = [
  { name: '1', size: 'var(--space-1)', px: '4px' },
  { name: '2', size: 'var(--space-2)', px: '8px' },
  { name: '3', size: 'var(--space-3)', px: '12px' },
  { name: '4', size: 'var(--space-4)', px: '16px' },
  { name: '6', size: 'var(--space-6)', px: '24px' },
  { name: '8', size: 'var(--space-8)', px: '32px' },
  { name: '12', size: 'var(--space-12)', px: '48px' },
  { name: '16', size: 'var(--space-16)', px: '64px' },
];

const shadowTokens = [
  { name: 'Soft', class: 'shadow-soft' },
  { name: 'Medium', class: 'shadow-medium' },
  { name: 'Strong', class: 'shadow-strong' },
  { name: 'Intense', class: 'shadow-intense' },
  { name: 'Glow', class: 'shadow-glow' },
];

export default function DesignSystem() {
  return (
    <AppLayout title="Design System">
      <div className="p-4 md:p-8 space-y-12 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <Typography variant="eyebrow">SINGU Design System</Typography>
          <DisplayText className="mt-2">Design Tokens</DisplayText>
          <Typography variant="lead" className="mt-2">
            Referência visual completa de todos os tokens do sistema de design.
          </Typography>
        </div>

        {/* Typography */}
        <section className="space-y-4">
          <Heading level={2}>Tipografia</Heading>
          <Surface level={1} bordered className="p-6 space-y-4">
            <DisplayText>Display Text</DisplayText>
            <Heading level={1}>Heading 1</Heading>
            <Heading level={2}>Heading 2</Heading>
            <Heading level={3}>Heading 3</Heading>
            <Heading level={4}>Heading 4</Heading>
            <Typography variant="lead">Lead paragraph — texto introdutório</Typography>
            <Typography variant="body">Body — texto padrão do sistema</Typography>
            <Typography variant="small">Small — texto secundário</Typography>
            <Typography variant="caption">Caption — labels e metadata</Typography>
            <Typography variant="eyebrow">Eyebrow — categorias</Typography>
            <Typography variant="h2" gradient>Gradient Heading</Typography>
          </Surface>
        </section>

        {/* Colors */}
        <section className="space-y-4">
          <Heading level={2}>Cores</Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {colorTokens.map((color) => (
              <div key={color.name} className="space-y-1">
                <div className={`${color.class} ${color.text} rounded-lg p-4 text-center font-medium text-sm`}>
                  {color.name}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Surfaces */}
        <section className="space-y-4">
          <Heading level={2}>Superfícies</Heading>
          <div className="grid grid-cols-5 gap-3">
            {surfaceLevels.map((level) => (
              <Surface key={level} level={level} bordered className="p-4 text-center">
                <Typography variant="caption">Surface {level}</Typography>
              </Surface>
            ))}
          </div>
        </section>

        {/* Spacing */}
        <section className="space-y-4">
          <Heading level={2}>Espaçamento</Heading>
          <Surface level={1} bordered className="p-6 space-y-2">
            {spacingTokens.map((token) => (
              <div key={token.name} className="flex items-center gap-4">
                <Typography variant="caption" className="w-16">--space-{token.name}</Typography>
                <div
                  className="bg-primary rounded-sm h-4"
                  style={{ width: token.size }}
                />
                <Typography variant="small">{token.px}</Typography>
              </div>
            ))}
          </Surface>
        </section>

        {/* Shadows */}
        <section className="space-y-4">
          <Heading level={2}>Sombras</Heading>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {shadowTokens.map((shadow) => (
              <div key={shadow.name} className={`bg-card rounded-lg p-6 text-center ${shadow.class}`}>
                <Typography variant="small">{shadow.name}</Typography>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <Heading level={2}>Botões</Heading>
          <Surface level={1} bordered className="p-6">
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="gradient">Gradient</Button>
              <Button variant="gradient-success">Success</Button>
              <Button variant="success">Success Solid</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="info">Info</Button>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
          </Surface>
        </section>

        {/* Focus Rings */}
        <section className="space-y-4">
          <Heading level={2}>Focus Rings Contextuais</Heading>
          <Surface level={1} bordered className="p-6">
            <div className="flex flex-wrap gap-4">
              <Input placeholder="Default focus" className="max-w-[200px]" />
              <Input placeholder="Destructive focus" className="max-w-[200px] focus-destructive" />
              <Input placeholder="Success focus" className="max-w-[200px] focus-success" />
              <Input placeholder="Warning focus" className="max-w-[200px] focus-warning" />
            </div>
            <Typography variant="small" className="mt-2">
              Tab para navegar e ver os rings contextuais.
            </Typography>
          </Surface>
        </section>

        {/* Container Queries */}
        <section className="space-y-4">
          <Heading level={2}>Container Queries</Heading>
          <Surface level={1} bordered className="p-6">
            <div className="container-query border border-dashed border-border rounded-lg p-4" style={{ resize: 'horizontal', overflow: 'auto', minWidth: '200px' }}>
              <div className="flex flex-col cq-md:flex-row gap-3">
                <div className="bg-primary/10 rounded-lg p-4 flex-1">
                  <Typography variant="small">Item 1</Typography>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 flex-1">
                  <Typography variant="small">Item 2</Typography>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 flex-1">
                  <Typography variant="small">Item 3</Typography>
                </div>
              </div>
              <Typography variant="caption" className="mt-2 block">
                ↔ Redimensione este container
              </Typography>
            </div>
          </Surface>
        </section>

        {/* Animations */}
        <section className="space-y-4">
          <Heading level={2}>Animações</Heading>
          <Surface level={1} bordered className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="animate-pulse-soft bg-primary/20 rounded-lg p-4">
                <Typography variant="small">Pulse Soft</Typography>
              </div>
              <div className="animate-float bg-accent/20 rounded-lg p-4">
                <Typography variant="small">Float</Typography>
              </div>
              <div className="animate-glow bg-card rounded-lg p-4 border">
                <Typography variant="small">Glow</Typography>
              </div>
              <div className="animate-attention bg-card rounded-lg p-4">
                <Typography variant="small">Attention</Typography>
              </div>
            </div>
          </Surface>
        </section>
      </div>
    </AppLayout>
  );
}
