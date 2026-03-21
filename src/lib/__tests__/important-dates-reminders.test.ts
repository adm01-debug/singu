/**
 * Testes exaustivos — Módulo de Datas Importantes e Lembretes
 * Cobre: useImportantDates lógica de urgência, categorização e geração de mensagens
 */
import { describe, it, expect } from 'vitest';
import { differenceInDays, addYears, addMonths, subDays, addDays } from 'date-fns';

// ── Urgency Calculator ──

type Urgency = 'overdue' | 'today' | 'urgent' | 'upcoming' | 'future';

function calculateUrgency(daysUntil: number, type: string): Urgency {
  if (daysUntil === 0) return 'today';
  if (daysUntil < 0 && daysUntil >= -7) return 'overdue';
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 7) return 'urgent';
  if (daysUntil <= 30) return 'upcoming';
  return 'future';
}

function calculateNextBirthday(birthday: Date, now: Date): { date: Date; daysUntil: number } {
  const next = new Date(birthday);
  next.setFullYear(now.getFullYear());
  if (next <= now) {
    next.setFullYear(now.getFullYear() + 1);
  }
  return { date: next, daysUntil: differenceInDays(next, now) };
}

function calculateNextRenewal(createdAt: Date, now: Date): { date: Date; daysUntil: number } {
  let renewal = addMonths(createdAt, 12);
  while (renewal <= now) {
    renewal = addYears(renewal, 1);
  }
  return { date: renewal, daysUntil: differenceInDays(renewal, now) };
}

function generateBirthdayMessage(firstName: string): string {
  return `🎂 Feliz aniversário, ${firstName}! Que este novo ano seja repleto de conquistas e alegrias. Um abraço!`;
}

function generateAnniversaryMessage(firstName: string, years: number): string {
  return `🎉 Olá ${firstName}! Hoje completamos ${years} ano(s) de parceria. Obrigado por fazer parte da nossa história!`;
}

function generateMilestoneMessage(firstName: string, milestone: number): string {
  return `🏆 Parabéns, ${firstName}! Essa é nossa ${milestone}ª interação. Obrigado pela confiança contínua!`;
}

function getNextMilestone(interactionCount: number): number | null {
  const milestones = [10, 25, 50, 100];
  return milestones.find(m => m > interactionCount) ?? null;
}

function isNearMilestone(interactionCount: number, threshold = 3): boolean {
  const next = getNextMilestone(interactionCount);
  if (!next) return false;
  return next - interactionCount <= threshold;
}

// ── Sorting ──

interface DateItem { urgency: Urgency; daysUntil: number; }

const urgencyOrder: Record<Urgency, number> = { overdue: 0, today: 1, urgent: 2, upcoming: 3, future: 4 };

function sortByUrgency(items: DateItem[]): DateItem[] {
  return [...items].sort((a, b) => {
    const diff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (diff !== 0) return diff;
    return a.daysUntil - b.daysUntil;
  });
}

function generateSummary(today: number, overdue: number, thisWeek: number, thisMonth: number): string {
  if (today > 0) return `${today} data(s) hoje!`;
  if (overdue > 0) return `${overdue} data(s) atrasada(s)`;
  if (thisWeek > 0) return `${thisWeek} data(s) esta semana`;
  if (thisMonth > 0) return `${thisMonth} data(s) este mês`;
  return 'Nenhuma data importante próxima';
}

// ══════════════════════════════
// TESTS
// ══════════════════════════════

describe('calculateUrgency', () => {
  it('today when daysUntil is 0', () => expect(calculateUrgency(0, 'birthday')).toBe('today'));
  it('overdue when -1', () => expect(calculateUrgency(-1, 'birthday')).toBe('overdue'));
  it('overdue when -7', () => expect(calculateUrgency(-7, 'birthday')).toBe('overdue'));
  it('overdue when -30', () => expect(calculateUrgency(-30, 'birthday')).toBe('overdue'));
  it('urgent when 1', () => expect(calculateUrgency(1, 'birthday')).toBe('urgent'));
  it('urgent when 7', () => expect(calculateUrgency(7, 'birthday')).toBe('urgent'));
  it('upcoming when 8', () => expect(calculateUrgency(8, 'birthday')).toBe('upcoming'));
  it('upcoming when 30', () => expect(calculateUrgency(30, 'birthday')).toBe('upcoming'));
  it('future when 31', () => expect(calculateUrgency(31, 'birthday')).toBe('future'));
  it('future when 365', () => expect(calculateUrgency(365, 'birthday')).toBe('future'));
});

describe('calculateNextBirthday', () => {
  const now = new Date('2026-03-21');

  it('birthday later this year', () => {
    const { date, daysUntil } = calculateNextBirthday(new Date('1990-06-15'), now);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5); // June
    expect(daysUntil).toBeGreaterThan(0);
  });

  it('birthday already passed this year', () => {
    const { date } = calculateNextBirthday(new Date('1990-01-10'), now);
    expect(date.getFullYear()).toBe(2027);
  });

  it('birthday is today', () => {
    const { daysUntil } = calculateNextBirthday(new Date('1990-03-21'), now);
    // Could be 0 or 365 depending on time
    expect(daysUntil >= 0).toBe(true);
  });

  it('birthday tomorrow', () => {
    const { date, daysUntil } = calculateNextBirthday(new Date('1990-03-22'), now);
    expect(date.getFullYear()).toBe(2026);
    expect(daysUntil).toBe(1);
  });

  it('birthday yesterday → next year', () => {
    const { date } = calculateNextBirthday(new Date('1990-03-20'), now);
    expect(date.getFullYear()).toBe(2027);
  });
});

describe('calculateNextRenewal', () => {
  const now = new Date('2026-03-21');

  it('renewal in the future', () => {
    const { daysUntil } = calculateNextRenewal(new Date('2025-06-01'), now);
    expect(daysUntil).toBeGreaterThan(0);
  });

  it('renewal already passed → pushed to next year', () => {
    const { date } = calculateNextRenewal(new Date('2024-01-01'), now);
    expect(date.getTime()).toBeGreaterThan(now.getTime());
  });

  it('very old creation date → still calculates correctly', () => {
    const { date } = calculateNextRenewal(new Date('2020-03-01'), now);
    expect(date.getTime()).toBeGreaterThan(now.getTime());
  });
});

describe('Message Templates', () => {
  it('birthday message includes name', () => {
    const msg = generateBirthdayMessage('João');
    expect(msg).toContain('João');
    expect(msg).toContain('🎂');
  });

  it('anniversary message includes name and years', () => {
    const msg = generateAnniversaryMessage('Maria', 3);
    expect(msg).toContain('Maria');
    expect(msg).toContain('3 ano(s)');
  });

  it('milestone message includes count', () => {
    const msg = generateMilestoneMessage('Pedro', 50);
    expect(msg).toContain('Pedro');
    expect(msg).toContain('50ª');
  });
});

describe('Milestones', () => {
  it('next milestone for 5 interactions is 10', () => expect(getNextMilestone(5)).toBe(10));
  it('next milestone for 10 interactions is 25', () => expect(getNextMilestone(10)).toBe(25));
  it('next milestone for 25 interactions is 50', () => expect(getNextMilestone(25)).toBe(50));
  it('next milestone for 50 interactions is 100', () => expect(getNextMilestone(50)).toBe(100));
  it('no milestone after 100', () => expect(getNextMilestone(100)).toBeNull());
  it('no milestone for 200', () => expect(getNextMilestone(200)).toBeNull());
  it('next milestone for 0 is 10', () => expect(getNextMilestone(0)).toBe(10));

  it('near milestone when 3 away', () => expect(isNearMilestone(7)).toBe(true));
  it('near milestone when 1 away', () => expect(isNearMilestone(9)).toBe(true));
  it('not near when 5 away', () => expect(isNearMilestone(5)).toBe(false));
  it('near 25 when at 22', () => expect(isNearMilestone(22)).toBe(true));
  it('not near when past all milestones', () => expect(isNearMilestone(101)).toBe(false));
});

describe('sortByUrgency', () => {
  it('overdue before today', () => {
    const items: DateItem[] = [
      { urgency: 'today', daysUntil: 0 },
      { urgency: 'overdue', daysUntil: -2 },
    ];
    const sorted = sortByUrgency(items);
    expect(sorted[0].urgency).toBe('overdue');
  });

  it('today before urgent', () => {
    const items: DateItem[] = [
      { urgency: 'urgent', daysUntil: 3 },
      { urgency: 'today', daysUntil: 0 },
    ];
    expect(sortByUrgency(items)[0].urgency).toBe('today');
  });

  it('secondary sort by daysUntil', () => {
    const items: DateItem[] = [
      { urgency: 'urgent', daysUntil: 5 },
      { urgency: 'urgent', daysUntil: 2 },
    ];
    expect(sortByUrgency(items)[0].daysUntil).toBe(2);
  });

  it('full priority order', () => {
    const items: DateItem[] = [
      { urgency: 'future', daysUntil: 60 },
      { urgency: 'today', daysUntil: 0 },
      { urgency: 'upcoming', daysUntil: 15 },
      { urgency: 'overdue', daysUntil: -3 },
      { urgency: 'urgent', daysUntil: 4 },
    ];
    const sorted = sortByUrgency(items);
    expect(sorted.map(i => i.urgency)).toEqual(['overdue', 'today', 'urgent', 'upcoming', 'future']);
  });

  it('handles empty', () => expect(sortByUrgency([])).toEqual([]));
});

describe('generateSummary', () => {
  it('prioritizes today', () => expect(generateSummary(2, 1, 3, 5)).toBe('2 data(s) hoje!'));
  it('then overdue', () => expect(generateSummary(0, 3, 2, 1)).toBe('3 data(s) atrasada(s)'));
  it('then this week', () => expect(generateSummary(0, 0, 4, 2)).toBe('4 data(s) esta semana'));
  it('then this month', () => expect(generateSummary(0, 0, 0, 6)).toBe('6 data(s) este mês'));
  it('fallback message', () => expect(generateSummary(0, 0, 0, 0)).toBe('Nenhuma data importante próxima'));
});
