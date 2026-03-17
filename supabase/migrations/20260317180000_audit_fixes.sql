-- Migration: Audit fixes - FK constraints, indexes, CHECK constraints
-- Date: 2026-03-17
-- Audit: Comprehensive code review findings

-- ============================================
-- 1. FK CONSTRAINTS (Critical - prevent orphaned records)
-- ============================================

-- contact_relatives: Add FK to contacts with CASCADE delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_contact_relatives_contact_id'
    AND table_name = 'contact_relatives'
  ) THEN
    ALTER TABLE public.contact_relatives
    ADD CONSTRAINT fk_contact_relatives_contact_id
    FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- trigger_usage_history: Add FK to contacts with CASCADE delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_trigger_usage_history_contact_id'
    AND table_name = 'trigger_usage_history'
  ) THEN
    ALTER TABLE public.trigger_usage_history
    ADD CONSTRAINT fk_trigger_usage_history_contact_id
    FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 2. COMPOSITE INDEXES (Performance - prevent N+1 queries)
-- ============================================

-- Analysis history: contact + date for timeline queries
CREATE INDEX IF NOT EXISTS idx_disc_history_contact_analyzed
  ON public.disc_analysis_history(contact_id, analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_eq_history_contact_analyzed
  ON public.eq_analysis_history(contact_id, analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_cognitive_history_contact_analyzed
  ON public.cognitive_bias_history(contact_id, analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_vak_history_contact_analyzed
  ON public.vak_analysis_history(contact_id, analyzed_at DESC);

-- Trigger usage: user + contact + date for history
CREATE INDEX IF NOT EXISTS idx_trigger_usage_user_contact_date
  ON public.trigger_usage_history(user_id, contact_id, used_at DESC);

-- WhatsApp messages: contact + timestamp for conversation view
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_timestamp
  ON public.whatsapp_messages(contact_id, timestamp DESC);

-- Offer suggestions: contact + date for recent offers
CREATE INDEX IF NOT EXISTS idx_offer_suggestions_contact_date
  ON public.offer_suggestions(contact_id, created_at DESC);

-- Offer suggestions: status for filtering
CREATE INDEX IF NOT EXISTS idx_offer_suggestions_status
  ON public.offer_suggestions(status);

-- Compatibility alerts: dismissed for active alerts
CREATE INDEX IF NOT EXISTS idx_compatibility_alerts_dismissed
  ON public.compatibility_alerts(dismissed) WHERE dismissed = false;

-- Lux intelligence: entity lookup
CREATE INDEX IF NOT EXISTS idx_lux_intelligence_entity
  ON public.lux_intelligence(entity_type, entity_id);

-- Lux intelligence: recent entries
CREATE INDEX IF NOT EXISTS idx_lux_intelligence_created
  ON public.lux_intelligence(created_at DESC);

-- Social profiles: user + platform
CREATE INDEX IF NOT EXISTS idx_social_profiles_user_platform
  ON public.social_profiles(user_id, platform);

-- Social life events: user + event type
CREATE INDEX IF NOT EXISTS idx_social_life_events_user_type
  ON public.social_life_events(user_id, event_type);

-- ============================================
-- 3. CHECK CONSTRAINTS (Data integrity)
-- ============================================

-- offer_suggestions: confidence_score range
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'chk_offer_confidence_score_range'
  ) THEN
    ALTER TABLE public.offer_suggestions
    ADD CONSTRAINT chk_offer_confidence_score_range
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));
  END IF;
END $$;

-- lux_intelligence: entity_id NOT NULL
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.lux_intelligence ALTER COLUMN entity_id SET NOT NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'entity_id already NOT NULL or column does not exist';
  END;
END $$;

-- ============================================
-- 4. NOT NULL where critical
-- ============================================

-- contact_relatives: ensure contact_id is NOT NULL
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.contact_relatives ALTER COLUMN contact_id SET NOT NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'contact_id already NOT NULL or column does not exist';
  END;
END $$;
