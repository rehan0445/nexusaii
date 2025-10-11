# Branch Protection and Signed Commits

## Required Protections (GitHub)
- Require pull request reviews (min 1; 2 for main if possible)
- Require status checks to pass (CI: lint, build, tests, CodeQL, Gitleaks)
- Require signed commits (GPG or SSH signature)
- Dismiss stale approvals on new commits
- Restrict who can push to matching branches (admins only)
- Require linear history (no merge commits) or enforce squash merges

## Suggested Branch Rules
- main: all rules enabled; admins only
- release/*: same as main
- dev: PR reviews + status checks; signed commits

## Signing Commits
- Configure git to sign commits: `git config commit.gpgsign true`
- Upload public key to GitHub; verify `Verified` badge appears on commits

## CI Required Checks
- codeql-analysis
- gitleaks
- zap-baseline (scheduled)
- server tests (unit/e2e)
