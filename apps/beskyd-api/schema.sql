PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  emailVerified INTEGER NOT NULL,
  image TEXT,
  role TEXT DEFAULT "viewer",
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email
  ON user(email);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  token TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_token
  ON session(token);

CREATE INDEX IF NOT EXISTS idx_session_user
  ON session(userId);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  idToken TEXT,
  password TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id)
);

CREATE INDEX IF NOT EXISTS idx_account_user
  ON account(userId);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verification_identifier
  ON verification(identifier);

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS participant_assessments (
  id TEXT PRIMARY KEY,
  region_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  criteria_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

CREATE INDEX IF NOT EXISTS idx_participant_assessments_region
  ON participant_assessments(region_id);

CREATE TABLE IF NOT EXISTS expert_assessments (
  id TEXT PRIMARY KEY,
  region_id TEXT NOT NULL,
  safety_level TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

CREATE INDEX IF NOT EXISTS idx_expert_assessments_region
  ON expert_assessments(region_id);

CREATE TABLE IF NOT EXISTS model_configs (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  config_json TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_model_configs_version
  ON model_configs(version);

CREATE TABLE IF NOT EXISTS risk_results (
  id TEXT PRIMARY KEY,
  region_id TEXT NOT NULL,
  config_version INTEGER NOT NULL,
  result_json TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  created_by TEXT,
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

CREATE INDEX IF NOT EXISTS idx_risk_results_region
  ON risk_results(region_id);

CREATE INDEX IF NOT EXISTS idx_risk_results_computed
  ON risk_results(computed_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  diff_json TEXT,
  created_at TEXT NOT NULL
);
