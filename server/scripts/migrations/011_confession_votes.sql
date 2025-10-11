-- Per-user voting for confessions

CREATE TABLE IF NOT EXISTS confession_votes (
  confession_id TEXT NOT NULL,
  voter_session_id TEXT NOT NULL,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 0, 1)),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (confession_id, voter_session_id)
);

CREATE INDEX IF NOT EXISTS idx_confession_votes_confession ON confession_votes(confession_id);
CREATE INDEX IF NOT EXISTS idx_confession_votes_voter ON confession_votes(voter_session_id);


