-- Add missing composite indexes for common query patterns

-- Interactions: user + contact timeline
CREATE INDEX IF NOT EXISTS idx_interactions_user_contact_created
  ON interactions (user_id, contact_id, created_at DESC);

-- Alerts: active alerts per user
CREATE INDEX IF NOT EXISTS idx_alerts_user_dismissed
  ON alerts (user_id, dismissed) WHERE dismissed = false;

-- RFM history: latest per contact
CREATE INDEX IF NOT EXISTS idx_rfm_history_contact_calculated
  ON rfm_history (contact_id, calculated_at DESC);

-- WhatsApp messages: per user lookup
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user
  ON whatsapp_messages (user_id);

-- Lux intelligence: pending requests per user
CREATE INDEX IF NOT EXISTS idx_lux_intelligence_user_status
  ON lux_intelligence (user_id, status);

-- Health alerts: per contact timeline
CREATE INDEX IF NOT EXISTS idx_health_alerts_contact_created
  ON health_alerts (contact_id, created_at DESC);

-- Social profiles: lookup by contact + platform
CREATE INDEX IF NOT EXISTS idx_social_profiles_contact_platform
  ON social_profiles (contact_id, platform);

-- Stakeholder alerts: active critical/high per user
CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_user_severity
  ON stakeholder_alerts (user_id, severity, dismissed) WHERE dismissed = false;

-- Insights: active insights per contact
CREATE INDEX IF NOT EXISTS idx_insights_contact_dismissed
  ON insights (contact_id, dismissed) WHERE dismissed = false;
