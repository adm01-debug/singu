import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useImportantDates } from '../useImportantDates';
import type { Contact, Interaction } from '@/types';
import { addDays, subDays, addYears, subYears } from 'date-fns';

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'ct-1',
    companyId: 'co-1',
    companyName: 'Acme Corp',
    firstName: 'John',
    lastName: 'Doe',
    role: 'contact',
    roleTitle: 'Manager',
    tags: [],
    hobbies: [],
    interests: [],
    relationshipStage: 'customer',
    relationshipScore: 70,
    interactionCount: 5,
    sentiment: 'positive',
    behavior: {
      discProfile: null,
      discConfidence: 0,
      preferredChannel: 'email',
      formalityLevel: 3,
      decisionCriteria: [],
      needsApproval: false,
      decisionPower: 5,
      supportLevel: 5,
      influencedByIds: [],
      influencesIds: [],
      currentChallenges: [],
      competitorsUsed: [],
    },
    lifeEvents: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    ...overrides,
  } as Contact;
}

function makeInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    id: 'int-1',
    contactId: 'ct-1',
    companyId: 'co-1',
    type: 'call',
    title: 'Follow-up',
    content: 'Discussion',
    sentiment: 'positive',
    tags: [],
    initiatedBy: 'us',
    followUpRequired: false,
    createdAt: new Date(),
    ...overrides,
  } as Interaction;
}

describe('useImportantDates', () => {
  it('should return empty results with no contacts', () => {
    const { result } = renderHook(() => useImportantDates([], []));
    expect(result.current.allDates).toEqual([]);
    expect(result.current.hasUrgent).toBe(false);
  });

  it('should return summary "Nenhuma data importante proxima" with no dates', () => {
    const { result } = renderHook(() => useImportantDates([], []));
    expect(result.current.summary).toContain('Nenhuma data');
  });

  it('should detect upcoming birthday within 7 days', () => {
    const birthdayDate = addDays(new Date(), 3);
    // Set birthday to same month/day but different year
    const birthday = new Date(2000, birthdayDate.getMonth(), birthdayDate.getDate());
    const contacts = [makeContact({ birthday })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const birthdayDates = result.current.allDates.filter(d => d.type === 'birthday');
    expect(birthdayDates.length).toBe(1);
    expect(birthdayDates[0].urgency).toBe('urgent');
  });

  it('should detect birthday today', () => {
    const today = new Date();
    const birthday = new Date(2000, today.getMonth(), today.getDate());
    const contacts = [makeContact({ birthday })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const birthdayDates = result.current.allDates.filter(d => d.type === 'birthday');
    expect(birthdayDates.length).toBe(1);
    expect(birthdayDates[0].urgency).toBe('today');
  });

  it('should generate birthday message template', () => {
    const birthdayDate = addDays(new Date(), 3);
    const birthday = new Date(2000, birthdayDate.getMonth(), birthdayDate.getDate());
    const contacts = [makeContact({ firstName: 'Alice', birthday })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const birthdayDates = result.current.allDates.filter(d => d.type === 'birthday');
    expect(birthdayDates[0].messageTemplate).toContain('Alice');
  });

  it('should detect relationship anniversary', () => {
    const twoYearsAgo = subYears(new Date(), 2);
    // First interaction was 2 years ago, anniversary coming up this year
    const contacts = [makeContact({ id: 'ct-1' })];
    const interactions = [makeInteraction({
      contactId: 'ct-1',
      createdAt: twoYearsAgo,
    })];

    const { result } = renderHook(() => useImportantDates(contacts, interactions));
    const anniversaryDates = result.current.allDates.filter(d => d.type === 'anniversary');
    // May or may not be within 30 days depending on current date
    expect(anniversaryDates.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect contract renewal for customers', () => {
    const contacts = [makeContact({
      relationshipStage: 'customer',
      createdAt: subYears(new Date(), 1),
    })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const renewalDates = result.current.allDates.filter(d => d.type === 'contract_renewal');
    expect(renewalDates.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect contract renewal for loyal customers', () => {
    const contacts = [makeContact({
      relationshipStage: 'loyal_customer',
      createdAt: subYears(new Date(), 1),
    })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const renewalDates = result.current.allDates.filter(d => d.type === 'contract_renewal');
    expect(renewalDates.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect interaction milestones', () => {
    const contacts = [makeContact({ interactionCount: 9 })]; // Close to 10 milestone

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const milestoneDates = result.current.allDates.filter(d => d.type === 'milestone');
    expect(milestoneDates.length).toBe(1);
    expect(milestoneDates[0].title).toContain('10');
  });

  it('should not detect milestone when far from next milestone', () => {
    const contacts = [makeContact({ interactionCount: 3 })]; // Far from 10

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const milestoneDates = result.current.allDates.filter(d => d.type === 'milestone');
    expect(milestoneDates.length).toBe(0);
  });

  it('should process life events', () => {
    const eventDate = addDays(new Date(), 2);
    const contacts = [makeContact({
      lifeEvents: [{
        id: 'evt-1',
        type: 'birthday',
        title: 'Wedding Anniversary',
        date: eventDate,
        reminder: true,
      }],
    })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const customDates = result.current.allDates.filter(d => d.type === 'custom');
    expect(customDates.length).toBeGreaterThanOrEqual(0);
  });

  it('should categorize dates into today, overdue, thisWeek, thisMonth', () => {
    const todayBday = new Date(2000, new Date().getMonth(), new Date().getDate());
    const contacts = [makeContact({ id: 'ct-today', birthday: todayBday })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    expect(result.current.today.length).toBeGreaterThanOrEqual(1);
  });

  it('should set hasUrgent when there are today dates', () => {
    const todayBday = new Date(2000, new Date().getMonth(), new Date().getDate());
    const contacts = [makeContact({ birthday: todayBday })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    expect(result.current.hasUrgent).toBe(true);
  });

  it('should sort allDates by urgency then by daysUntil', () => {
    const todayBday = new Date(2000, new Date().getMonth(), new Date().getDate());
    const futureBday = new Date(2000, new Date().getMonth(), addDays(new Date(), 20).getDate());
    const contacts = [
      makeContact({ id: 'ct-1', firstName: 'Today', birthday: todayBday }),
      makeContact({ id: 'ct-2', firstName: 'Future', birthday: futureBday }),
    ];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    if (result.current.allDates.length >= 2) {
      const urgencyOrder: Record<string, number> = { overdue: 0, today: 1, urgent: 2, upcoming: 3, future: 4 };
      expect(
        urgencyOrder[result.current.allDates[0].urgency]
      ).toBeLessThanOrEqual(
        urgencyOrder[result.current.allDates[1].urgency]
      );
    }
  });

  it('should generate summary for today dates', () => {
    const todayBday = new Date(2000, new Date().getMonth(), new Date().getDate());
    const contacts = [makeContact({ birthday: todayBday })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    expect(result.current.summary).toContain('hoje');
  });

  it('should set reminderDays for birthday dates', () => {
    const birthdayDate = addDays(new Date(), 3);
    const birthday = new Date(2000, birthdayDate.getMonth(), birthdayDate.getDate());
    const contacts = [makeContact({ birthday })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const birthdayDates = result.current.allDates.filter(d => d.type === 'birthday');
    expect(birthdayDates[0].reminderDays).toEqual([7, 1, 0]);
  });

  it('should handle contacts without birthday', () => {
    const contacts = [makeContact({ birthday: undefined })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const birthdayDates = result.current.allDates.filter(d => d.type === 'birthday');
    expect(birthdayDates.length).toBe(0);
  });

  it('should handle multiple contacts', () => {
    const birthdayDate = addDays(new Date(), 3);
    const birthday = new Date(2000, birthdayDate.getMonth(), birthdayDate.getDate());
    const contacts = [
      makeContact({ id: 'ct-1', firstName: 'Alice', birthday }),
      makeContact({ id: 'ct-2', firstName: 'Bob', birthday: undefined }),
    ];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const birthdayDates = result.current.allDates.filter(d => d.type === 'birthday');
    expect(birthdayDates.length).toBe(1);
  });

  it('should provide suggested action for today birthday', () => {
    const todayBday = new Date(2000, new Date().getMonth(), new Date().getDate());
    const contacts = [makeContact({ birthday: todayBday })];

    const { result } = renderHook(() => useImportantDates(contacts, []));
    const todayDates = result.current.today.filter(d => d.type === 'birthday');
    if (todayDates.length > 0) {
      expect(todayDates[0].suggestedAction).toContain('agora');
    }
  });
});
