-- =====================================================
-- BottleBazaar Database Schema — Migration 001
-- Run with: npm run migrate
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ── ENUM TYPES ──────────────────────────────────────

CREATE TYPE user_role AS ENUM ('customer', 'store_owner', 'moderator', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending_deletion', 'deleted');
CREATE TYPE store_status AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'expired');
CREATE TYPE offer_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'suspended', 'expired', 'withdrawn');
CREATE TYPE offer_type AS ENUM ('fixed_price', 'percentage_discount', 'custom');
CREATE TYPE redemption_status AS ENUM ('issued', 'redeemed', 'expired', 'cancelled');
CREATE TYPE notification_type AS ENUM ('account', 'offer', 'store', 'system', 'redemption');
CREATE TYPE audit_action AS ENUM (
  'auth.login', 'auth.logout', 'auth.otp_request', 'auth.otp_verify',
  'store.create', 'store.approve', 'store.reject', 'store.suspend', 'store.update',
  'offer.create', 'offer.submit', 'offer.approve', 'offer.reject', 'offer.suspend', 'offer.withdraw',
  'redemption.issue', 'redemption.consume', 'redemption.expire',
  'user.create', 'user.suspend', 'user.role_change', 'user.delete_request',
  'config.change', 'admin.action'
);

-- ── JURISDICTIONS ────────────────────────────────────

CREATE TABLE jurisdictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code  VARCHAR(3) NOT NULL DEFAULT 'IN',
  state_code    VARCHAR(10) NOT NULL,
  state_name    VARCHAR(100) NOT NULL,
  state_name_hi VARCHAR(100),
  min_age       SMALLINT NOT NULL DEFAULT 21,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  legal_notes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(country_code, state_code)
);

CREATE TABLE cities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  name            VARCHAR(100) NOT NULL,
  name_hi         VARCHAR(100),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pin_codes (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id),
  code    VARCHAR(10) NOT NULL,
  UNIQUE(code)
);

-- ── USERS & AUTH ─────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(20) NOT NULL UNIQUE,
  country_code  VARCHAR(5) NOT NULL DEFAULT '+91',
  role          user_role NOT NULL DEFAULT 'customer',
  status        user_status NOT NULL DEFAULT 'active',
  display_name  VARCHAR(100),
  language      VARCHAR(10) NOT NULL DEFAULT 'en',
  age_declared  BOOLEAN NOT NULL DEFAULT false,
  age_declared_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       VARCHAR(20) NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,  -- bcrypt hash, never plain text
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT false,
  attempt_count SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL UNIQUE,
  device_info   JSONB,
  ip_address    INET,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);

CREATE TABLE user_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_type     VARCHAR(50) NOT NULL, -- 'terms', 'privacy', 'age_gate', 'marketing'
  policy_version  VARCHAR(20) NOT NULL,
  accepted        BOOLEAN NOT NULL,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CATEGORIES ───────────────────────────────────────

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  name_hi     VARCHAR(100),
  description TEXT,
  icon_url    VARCHAR(500),
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BRANDS ───────────────────────────────────────────

CREATE TABLE brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  name_hi     VARCHAR(100),
  origin      VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PRODUCTS ─────────────────────────────────────────

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES categories(id),
  brand_id        UUID REFERENCES brands(id),
  name            VARCHAR(200) NOT NULL,
  name_hi         VARCHAR(200),
  description     TEXT,
  description_hi  TEXT,
  abv             NUMERIC(5,2),   -- alcohol by volume %
  volume_ml       INTEGER,         -- pack size in ml
  pack_size       VARCHAR(50),     -- e.g. "750ml", "12x330ml"
  image_url       VARCHAR(500),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ── STORES ───────────────────────────────────────────

CREATE TABLE stores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES users(id),
  jurisdiction_id   UUID NOT NULL REFERENCES jurisdictions(id),
  city_id           UUID REFERENCES cities(id),
  name              VARCHAR(200) NOT NULL,
  description       TEXT,
  address_line1     VARCHAR(300) NOT NULL,
  address_line2     VARCHAR(300),
  city              VARCHAR(100) NOT NULL,
  state             VARCHAR(100) NOT NULL,
  pin_code          VARCHAR(10) NOT NULL,
  latitude          NUMERIC(9,6),
  longitude         NUMERIC(9,6),
  phone             VARCHAR(20),
  email             VARCHAR(200),
  website           VARCHAR(500),
  license_number    VARCHAR(100),
  license_type      VARCHAR(100),
  license_expiry    DATE,
  license_doc_url   VARCHAR(500),  -- private, signed URL only
  opening_hours     JSONB,          -- { mon: {open: "10:00", close: "22:00"}, ... }
  status            store_status NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT,
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  suspended_at      TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_location ON stores(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_stores_jurisdiction ON stores(jurisdiction_id);

-- ── STORE CATALOG (store-specific pricing) ────────────

CREATE TABLE store_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  price_paise   INTEGER,  -- price in paise (1 INR = 100 paise), integer for exactness
  in_stock      BOOLEAN NOT NULL DEFAULT true,
  stock_note    VARCHAR(200),
  last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, product_id)
);

CREATE INDEX idx_store_products_store ON store_products(store_id);
CREATE INDEX idx_store_products_product ON store_products(product_id);

-- ── OFFERS ────────────────────────────────────────────

CREATE TABLE offers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(id),
  created_by          UUID NOT NULL REFERENCES users(id),
  title               VARCHAR(200) NOT NULL,
  title_hi            VARCHAR(200),
  description         TEXT,
  description_hi      TEXT,
  offer_type          offer_type NOT NULL,
  -- Fixed price offer fields
  original_price_paise INTEGER,
  offer_price_paise    INTEGER,
  -- Percentage discount
  discount_percent     NUMERIC(5,2),
  -- Custom offer
  custom_terms        TEXT,
  -- Limits
  min_purchase_paise  INTEGER,
  total_limit         INTEGER,       -- max total redemptions, NULL = unlimited
  per_customer_limit  INTEGER DEFAULT 1,
  -- Validity
  valid_from          TIMESTAMPTZ NOT NULL,
  valid_until         TIMESTAMPTZ NOT NULL,
  -- Approval state
  status              offer_status NOT NULL DEFAULT 'draft',
  submitted_at        TIMESTAMPTZ,
  reviewed_by         UUID REFERENCES users(id),
  reviewed_at         TIMESTAMPTZ,
  review_notes        TEXT,
  suspended_at        TIMESTAMPTZ,
  suspension_reason   TEXT,
  -- Counters (de-normalized for performance, updated atomically)
  redemption_count    INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_approval CHECK (created_by != reviewed_by),
  CONSTRAINT valid_price_range CHECK (offer_price_paise IS NULL OR offer_price_paise >= 0),
  CONSTRAINT valid_dates CHECK (valid_until > valid_from),
  CONSTRAINT valid_discount CHECK (discount_percent IS NULL OR (discount_percent > 0 AND discount_percent <= 100))
);

CREATE INDEX idx_offers_store ON offers(store_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_validity ON offers(valid_from, valid_until);
CREATE INDEX idx_offers_product ON offers(product_id);

-- ── REDEMPTIONS ───────────────────────────────────────

CREATE TABLE redemption_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    UUID NOT NULL REFERENCES offers(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  store_id    UUID NOT NULL REFERENCES stores(id),
  token_hash  VARCHAR(255) NOT NULL UNIQUE,  -- bcrypt/sha256 of token shown to user
  status      redemption_status NOT NULL DEFAULT 'issued',
  expires_at  TIMESTAMPTZ NOT NULL,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES users(id),   -- store staff who validated
  metadata    JSONB
);

CREATE INDEX idx_redemptions_user ON redemption_tokens(user_id);
CREATE INDEX idx_redemptions_offer ON redemption_tokens(offer_id);
CREATE INDEX idx_redemptions_token ON redemption_tokens(token_hash);
CREATE INDEX idx_redemptions_status ON redemption_tokens(status);

-- ── FAVORITES ─────────────────────────────────────────

CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id    UUID REFERENCES stores(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT favorite_has_target CHECK (product_id IS NOT NULL OR store_id IS NOT NULL),
  UNIQUE NULLS NOT DISTINCT (user_id, product_id, store_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- ── NOTIFICATIONS ──────────────────────────────────────

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  read        BOOLEAN NOT NULL DEFAULT false,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- ── APP CONFIGURATION ─────────────────────────────────

CREATE TABLE app_config (
  key           VARCHAR(100) PRIMARY KEY,
  value         JSONB NOT NULL,
  description   TEXT,
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed essential config keys
INSERT INTO app_config (key, value, description) VALUES
  ('delivery_enabled', 'false', 'Enable delivery feature — requires legal review'),
  ('delivery_coming_soon_message', '"Delivery coming soon! Currently available in-store only."', 'Message shown when delivery is disabled'),
  ('delivery_coming_soon_message_hi', '"डिलीवरी जल्द आ रही है! अभी केवल इन-स्टोर उपलब्ध है।"', 'Hindi delivery coming soon message'),
  ('age_gate_min_age', '21', 'Default minimum age for age gate'),
  ('age_gate_enabled', 'true', 'Enable age gate before showing content'),
  ('ai_discovery_enabled', 'false', 'Enable AI smart discovery assistant'),
  ('maintenance_mode', 'false', 'Put app in maintenance mode'),
  ('maintenance_message', '"BottleBazaar is undergoing maintenance. Please check back soon."', 'Maintenance mode message'),
  ('max_otp_attempts', '5', 'Max OTP verification attempts before lockout'),
  ('otp_expiry_minutes', '10', 'OTP validity in minutes'),
  ('redemption_token_expiry_minutes', '30', 'Redemption token validity in minutes'),
  ('featured_categories', '[]', 'List of featured category IDs for home screen'),
  ('supported_states', '["MH","DL","KA","GA","TN"]', 'Supported state codes'),
  ('app_version_android', '"1.0.0"', 'Current Android app version'),
  ('app_version_ios', '"1.0.0"', 'Current iOS app version'),
  ('support_phone', '"+918000000000"', 'Support phone number'),
  ('support_email', '"support@bottlebazaar.in"', 'Support email'),
  ('terms_version', '"1.0"', 'Current terms of service version'),
  ('privacy_version', '"1.0"', 'Current privacy policy version');

-- ── AUDIT LOG ─────────────────────────────────────────

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action        audit_action NOT NULL,
  actor_id      UUID REFERENCES users(id),
  actor_role    user_role,
  target_type   VARCHAR(50),   -- 'store', 'offer', 'user', 'config', etc.
  target_id     UUID,
  metadata      JSONB,          -- safe non-sensitive context
  ip_address    INET,
  request_id    VARCHAR(50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ── SEED: JURISDICTIONS ───────────────────────────────

INSERT INTO jurisdictions (state_code, state_name, state_name_hi, min_age) VALUES
  ('MH', 'Maharashtra', 'महाराष्ट्र', 21),
  ('DL', 'Delhi', 'दिल्ली', 25),
  ('KA', 'Karnataka', 'कर्नाटक', 21),
  ('GA', 'Goa', 'गोवा', 21),
  ('TN', 'Tamil Nadu', 'तमिल नाडु', 21);

-- ── SEED: DEFAULT CATEGORIES ──────────────────────────

INSERT INTO categories (slug, name, name_hi, sort_order) VALUES
  ('whisky', 'Whisky', 'व्हिस्की', 1),
  ('rum', 'Rum', 'रम', 2),
  ('vodka', 'Vodka', 'वोडका', 3),
  ('gin', 'Gin', 'जिन', 4),
  ('beer', 'Beer', 'बियर', 5),
  ('wine', 'Wine', 'वाइन', 6),
  ('brandy', 'Brandy', 'ब्रांडी', 7),
  ('tequila', 'Tequila', 'टकीला', 8),
  ('champagne', 'Champagne & Sparkling', 'शैम्पेन', 9),
  ('others', 'Others', 'अन्य', 10);

-- ── UPDATE TRIGGER ────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
