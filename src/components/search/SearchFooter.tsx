import { isMacOS } from '@/lib/utils';

export function SearchFooter() {
  const modKey = isMacOS() ? '⌘' : 'Ctrl';

  return (
    <div className="border-t border-border p-2.5 bg-muted/30">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">↑↓</kbd>
            <span>navegar</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">↵</kbd>
            <span>selecionar</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">esc</kbd>
            <span>fechar</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/70">Abrir com</span>
          <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">{modKey}</kbd>
          <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">K</kbd>
        </div>
      </div>
    </div>
  );
}
