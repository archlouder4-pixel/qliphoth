-- Qliphoth: Eclipse Protocol — Complete Schema
-- Includes: Competitive (players, scores), Duels (PvP), Departments (guilds), Exploration (dungeons)
-- Run with: wrangler d1 execute qliphoth-db --remote --file=./schema.sql

-- ============================================================================
-- DROP EXISTING TABLES (in reverse dependency order)
-- ============================================================================

DROP TABLE IF EXISTS duel_match_results;
DROP TABLE IF EXISTS duel_queue;
DROP TABLE IF EXISTS duel_actions;
DROP TABLE IF EXISTS duels;
DROP TABLE IF EXISTS duel_inventory;
DROP TABLE IF EXISTS duel_stats;

DROP TABLE IF EXISTS exploration_loot;
DROP TABLE IF EXISTS exploration_participants;
DROP TABLE IF EXISTS exploration_sessions;

DROP TABLE IF EXISTS department_research;
DROP TABLE IF EXISTS department_abnos;
DROP TABLE IF EXISTS department_members;
DROP TABLE IF EXISTS departments;

DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS players;

-- ============================================================================
-- COMPETITIVE TABLES (existing)
-- ============================================================================

CREATE TABLE players (
  user_id         TEXT PRIMARY KEY,
  is_guest        INTEGER NOT NULL DEFAULT 0,
  discord_username TEXT,
  discord_global_name TEXT,
  custom_name     TEXT,
  avatar          TEXT,
  region          TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE scores (
  user_id     TEXT NOT NULL,
  region      TEXT NOT NULL,
  week        INTEGER NOT NULL,
  zone        TEXT NOT NULL,
  score       INTEGER NOT NULL DEFAULT 0,
  squad       TEXT NOT NULL DEFAULT 'Beginner',
  merit       INTEGER NOT NULL DEFAULT 0,
  reputation  INTEGER NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, region, week, zone),
  FOREIGN KEY (user_id) REFERENCES players(user_id)
);

CREATE INDEX idx_scores_region_week ON scores(region, week);
CREATE INDEX idx_scores_region_week_squad ON scores(region, week, squad);

-- ============================================================================
-- DUELS (PvP)
-- ============================================================================

-- Main duel record
CREATE TABLE duels (
  duel_id         TEXT PRIMARY KEY,
  challenger_id   TEXT NOT NULL,
  defender_id     TEXT NOT NULL,
  status          TEXT NOT NULL,           -- 'pending' | 'active' | 'completed' | 'cancelled'
  turn            INTEGER NOT NULL,        -- used as round number in new system
  challenger_team TEXT NOT NULL,           -- JSON array of identity IDs
  defender_team   TEXT NOT NULL,           -- JSON array of identity IDs
  state           TEXT,                    -- JSON: HP, SP, logs, phase, actions, etc.
  winner_id       TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  FOREIGN KEY (challenger_id) REFERENCES players(user_id),
  FOREIGN KEY (defender_id) REFERENCES players(user_id)
);

-- NOTE: duel_actions table is no longer used; actions are stored inside state JSON.
-- We keep the table for backward compatibility but may drop later.
CREATE TABLE duel_actions (
  action_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  duel_id     TEXT NOT NULL,
  player_id   TEXT NOT NULL,
  skill_index INTEGER NOT NULL,
  target_index INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (duel_id) REFERENCES duels(duel_id),
  FOREIGN KEY (player_id) REFERENCES players(user_id)
);

-- Player stats & progression
CREATE TABLE duel_stats (
  user_id          TEXT PRIMARY KEY,
  rank             TEXT NOT NULL DEFAULT 'Manager',
  rank_points      INTEGER NOT NULL DEFAULT 0,
  lives            INTEGER NOT NULL DEFAULT 5,
  points           INTEGER NOT NULL DEFAULT 0,
  total_points     INTEGER NOT NULL DEFAULT 0,
  best_10_points   INTEGER NOT NULL DEFAULT 0,
  matches_won      INTEGER NOT NULL DEFAULT 0,
  matches_lost     INTEGER NOT NULL DEFAULT 0,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  updated_at       INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES players(user_id)
);

-- Inventory for duel mode
CREATE TABLE duel_inventory (
  user_id     TEXT NOT NULL,
  item_id     TEXT NOT NULL,
  item_type   TEXT NOT NULL,               -- 'weapon' | 'gear' | 'gift'
  acquired_at INTEGER NOT NULL,
  equipped    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES players(user_id)
);

-- Match results (for leaderboard)
CREATE TABLE duel_match_results (
  result_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,
  duel_id     TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES players(user_id),
  FOREIGN KEY (duel_id) REFERENCES duels(duel_id)
);

-- Matchmaking queue
CREATE TABLE duel_queue (
  user_id     TEXT PRIMARY KEY,
  rank        TEXT NOT NULL,
  queued_at   INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES players(user_id)
);

-- Indexes for performance
CREATE INDEX idx_duels_status ON duels(status);
CREATE INDEX idx_duels_challenger ON duels(challenger_id);
CREATE INDEX idx_duels_defender ON duels(defender_id);
CREATE INDEX idx_duels_challenger_status ON duels(challenger_id, status);
CREATE INDEX idx_duels_defender_status ON duels(defender_id, status);
CREATE INDEX idx_duel_actions_duel ON duel_actions(duel_id);
CREATE INDEX idx_results_user ON duel_match_results(user_id);
CREATE INDEX idx_queue_rank ON duel_queue(rank);

-- ============================================================================
-- DEPARTMENTS (Guilds)
-- ============================================================================

CREATE TABLE departments (
  dept_id         TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  manager_id      TEXT NOT NULL,
  is_private      INTEGER NOT NULL DEFAULT 0,
  energy          INTEGER NOT NULL DEFAULT 50,
  total_energy    INTEGER NOT NULL DEFAULT 0,
  current_day     INTEGER NOT NULL DEFAULT 1,
  meltdown_level  INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  FOREIGN KEY (manager_id) REFERENCES players(user_id)
);

CREATE TABLE department_members (
  dept_id     TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  joined_at   INTEGER NOT NULL,
  PRIMARY KEY (dept_id, user_id),
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
  FOREIGN KEY (user_id) REFERENCES players(user_id)
);

CREATE TABLE department_abnos (
  id             TEXT PRIMARY KEY,
  dept_id        TEXT NOT NULL,
  abno_id        TEXT NOT NULL,
  qliphoth_counter INTEGER NOT NULL DEFAULT 3,
  work_count     INTEGER NOT NULL DEFAULT 0,
  is_breaching   INTEGER NOT NULL DEFAULT 0,
  meltdown       INTEGER NOT NULL DEFAULT 0,
  deployed_at    INTEGER NOT NULL,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

CREATE TABLE department_research (
  dept_id      TEXT NOT NULL,
  research_id  TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (dept_id, research_id),
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

CREATE INDEX idx_dept_members ON department_members(dept_id);
CREATE INDEX idx_dept_abnos ON department_abnos(dept_id);
CREATE INDEX idx_departments_manager ON departments(manager_id);

-- ============================================================================
-- EXPLORATION (Dungeon runs)
-- ============================================================================

CREATE TABLE exploration_sessions (
  session_id      TEXT PRIMARY KEY,
  leader_id       TEXT NOT NULL,
  location_id     TEXT NOT NULL,
  difficulty      TEXT NOT NULL,
  modifiers       TEXT,
  current_wave    INTEGER NOT NULL DEFAULT 0,
  max_waves       INTEGER NOT NULL,
  status          TEXT NOT NULL,
  score           INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  FOREIGN KEY (leader_id) REFERENCES players(user_id)
);

CREATE TABLE exploration_participants (
  session_id  TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  joined_at   INTEGER NOT NULL,
  PRIMARY KEY (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES exploration_sessions(session_id),
  FOREIGN KEY (user_id) REFERENCES players(user_id)
);

CREATE TABLE exploration_loot (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  item_type   TEXT NOT NULL,
  item_id     TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  claimed     INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES exploration_sessions(session_id),
  FOREIGN KEY (user_id) REFERENCES players(user_id)
);

CREATE INDEX idx_exploration_status ON exploration_sessions(status);
CREATE INDEX idx_exploration_participants ON exploration_participants(session_id);
CREATE INDEX idx_exploration_leader ON exploration_sessions(leader_id);

-- Additional indexes
CREATE INDEX idx_duels_challenger_active ON duels(challenger_id, status) WHERE status = 'active';
CREATE INDEX idx_duels_defender_active ON duels(defender_id, status) WHERE status = 'active';
CREATE INDEX idx_dept_members_user ON department_members(user_id);
CREATE INDEX idx_exploration_participants_user ON exploration_participants(user_id);