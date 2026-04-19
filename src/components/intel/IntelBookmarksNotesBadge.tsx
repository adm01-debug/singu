import { useEffect, useState } from 'react';
import { Star, StickyNote } from 'lucide-react';

const BOOKMARKS_KEY = 'intel-bookmarks-v1';
const NOTES_PREFIX = 'intel-notes-v1:';

function countBookmarks(): number {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch { return 0; }
}

function countNotes(): number {
  try {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NOTES_PREFIX)) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const p = JSON.parse(raw);
            if (p && typeof p.text === 'string' && p.text.trim().length > 0) n += 1;
          } catch { /* ignore */ }
        }
      }
    }
    return n;
  } catch { return 0; }
}

/**
 * Badge da status bar com contadores de bookmarks (★) e notas (📝) ativos.
 * Atualiza ao receber evento "storage" (entre abas) e a cada 3s (mesma aba).
 */
export const IntelBookmarksNotesBadge = () => {
  const [bookmarks, setBookmarks] = useState(0);
  const [notes, setNotes] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setBookmarks(countBookmarks());
      setNotes(countNotes());
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === BOOKMARKS_KEY || e.key.startsWith(NOTES_PREFIX)) refresh();
    };
    window.addEventListener('storage', onStorage);
    const t = window.setInterval(refresh, 3000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(t);
    };
  }, []);

  return (
    <span className="hidden sm:inline-flex items-center gap-2" aria-label="Bookmarks e notas">
      <span
        className="inline-flex items-center gap-1"
        title={`${bookmarks} bookmark${bookmarks === 1 ? '' : 's'}`}
      >
        <Star
          className={`h-3 w-3 ${bookmarks > 0 ? 'text-[hsl(var(--intel-accent))]' : 'text-muted-foreground opacity-50'}`}
          fill={bookmarks > 0 ? 'currentColor' : 'none'}
          aria-hidden
        />
        <span className={bookmarks > 0 ? 'text-[hsl(var(--intel-accent))]' : 'text-muted-foreground'}>
          ★{bookmarks}
        </span>
      </span>
      <span
        className="inline-flex items-center gap-1"
        title={`${notes} nota${notes === 1 ? '' : 's'} salva${notes === 1 ? '' : 's'}`}
      >
        <StickyNote
          className={`h-3 w-3 ${notes > 0 ? 'text-[hsl(var(--intel-accent))]' : 'text-muted-foreground opacity-50'}`}
          aria-hidden
        />
        <span className={notes > 0 ? 'text-[hsl(var(--intel-accent))]' : 'text-muted-foreground'}>
          NOTE:{notes}
        </span>
      </span>
    </span>
  );
};
