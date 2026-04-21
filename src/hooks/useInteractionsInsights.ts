import { useMemo } from "react";
import { useConversationAnalyses, type ConversationAnalysis, type SentimentOverall } from "./useConversationIntel";

export type Period = "7d" | "30d" | "90d";

export interface ThemeAggregate {
  label: string;
  category: string;
  count: number;
  mentions: number;
  examples: string[]; // interaction_ids
}

export interface ObjectionAggregate {
  objection: string;
  category: string;
  count: number;
  handled: number;
  unhandled: number;
  suggestedResponse?: string;
  examples: string[];
}

export interface InsightsKpis {
  totalAnalyzed: number;
  dominantSentiment: SentimentOverall | null;
  dominantPct: number;
  avgCoachingScore: number;
  unhandledObjections: number;
}

const periodToDays: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 };

function startOfWeekIso(d: Date): string {
  const dt = new Date(d);
  const day = dt.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // ISO week starts Monday
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function useInteractionsInsights(period: Period = "30d") {
  const days = periodToDays[period];
  const query = useConversationAnalyses({ days });

  const insights = useMemo(() => {
    const list: ConversationAnalysis[] = Array.isArray(query.data)
      ? (query.data as unknown as ConversationAnalysis[])
      : [];

    const total = list.length;

    // Sentiment distribution
    const sentCounts: Record<string, number> = { positive: 0, neutral: 0, negative: 0, mixed: 0 };
    const sentBuckets: Record<SentimentOverall, string[]> = { positive: [], neutral: [], negative: [], mixed: [] };
    let scoreSum = 0;
    let scoreCount = 0;
    let unhandled = 0;

    for (const a of list) {
      if (a.sentiment_overall) {
        sentCounts[a.sentiment_overall] = (sentCounts[a.sentiment_overall] ?? 0) + 1;
        if (a.interaction_id) sentBuckets[a.sentiment_overall].push(a.interaction_id);
      }
      if (typeof a.coaching_score === "number") {
        scoreSum += a.coaching_score;
        scoreCount++;
      }
      if (Array.isArray(a.objections)) {
        for (const o of a.objections) if (!o.handled) unhandled++;
      }
    }

    const sentimentDistribution = (["positive", "neutral", "negative", "mixed"] as const).map((key) => ({
      key,
      count: sentCounts[key] ?? 0,
      pct: total ? Math.round(((sentCounts[key] ?? 0) / total) * 100) : 0,
    }));

    let dominant: SentimentOverall | null = null;
    let dominantCount = 0;
    for (const s of sentimentDistribution) {
      if (s.count > dominantCount) {
        dominantCount = s.count;
        dominant = s.key;
      }
    }

    // Sentiment trend by ISO week
    const trendMap = new Map<string, { week: string; positive: number; neutral: number; negative: number; mixed: number; total: number }>();
    for (const a of list) {
      if (!a.analyzed_at) continue;
      const week = startOfWeekIso(new Date(a.analyzed_at));
      const cur = trendMap.get(week) ?? { week, positive: 0, neutral: 0, negative: 0, mixed: 0, total: 0 };
      if (a.sentiment_overall) cur[a.sentiment_overall] += 1;
      cur.total += 1;
      trendMap.set(week, cur);
    }
    const sentimentTrend = Array.from(trendMap.values()).sort((a, b) => a.week.localeCompare(b.week));

    // Themes
    const themeMap = new Map<string, ThemeAggregate>();
    for (const a of list) {
      if (!Array.isArray(a.topics)) continue;
      for (const t of a.topics) {
        if (!t?.label) continue;
        const key = normalize(t.label);
        const cur = themeMap.get(key) ?? { label: t.label, category: t.category ?? "other", count: 0, mentions: 0, examples: [] };
        cur.count += 1;
        cur.mentions += t.mentions ?? 1;
        if (cur.examples.length < 5 && a.interaction_id) cur.examples.push(a.interaction_id);
        themeMap.set(key, cur);
      }
    }
    const topThemes = Array.from(themeMap.values()).sort((a, b) => b.mentions - a.mentions).slice(0, 10);

    // Objections
    const objMap = new Map<string, ObjectionAggregate>();
    for (const a of list) {
      if (!Array.isArray(a.objections)) continue;
      for (const o of a.objections) {
        if (!o?.objection) continue;
        const key = normalize(o.objection);
        const cur = objMap.get(key) ?? {
          objection: o.objection,
          category: o.category ?? "outras",
          count: 0,
          handled: 0,
          unhandled: 0,
          suggestedResponse: o.suggested_response,
          examples: [],
        };
        cur.count += 1;
        if (o.handled) cur.handled += 1;
        else cur.unhandled += 1;
        if (!cur.suggestedResponse && o.suggested_response) cur.suggestedResponse = o.suggested_response;
        if (cur.examples.length < 5 && a.interaction_id) cur.examples.push(a.interaction_id);
        objMap.set(key, cur);
      }
    }
    const topObjections = Array.from(objMap.values()).sort((a, b) => b.count - a.count).slice(0, 8);

    const kpis: InsightsKpis = {
      totalAnalyzed: total,
      dominantSentiment: dominant,
      dominantPct: total ? Math.round((dominantCount / total) * 100) : 0,
      avgCoachingScore: scoreCount ? Math.round(scoreSum / scoreCount) : 0,
      unhandledObjections: unhandled,
    };

    return { kpis, sentimentDistribution, sentimentTrend, topThemes, topObjections, list, sentimentBuckets: sentBuckets };
  }, [query.data]);

  return { ...insights, isLoading: query.isLoading, isError: query.isError };
}
