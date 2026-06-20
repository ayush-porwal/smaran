# Branch protection for `main`

Deploy workflows assume PR CI passed before code reaches `main`. Enable
branch protection so merges are blocked until checks succeed.

## GitHub UI

1. Open **Settings → Branches → Branch protection rules → Add rule** (or edit the rule for `main`).
2. **Branch name pattern:** `main`
3. Enable **Require a pull request before merging** (recommended: require approvals if you want human review on PRs too).
4. Enable **Require status checks to pass before merging**.
5. Search and select these required checks (exact names from the `ci` workflow):
   - `format check`
   - `infra — lint, build, test, synth` (runs when infra/shared paths change)
   - `mobile — typecheck, lint` (runs when mobile/shared paths change)
6. Enable **Require branches to be up to date before merging** so the required checks ran on the latest commit.
7. Save.

When only infra changes, the mobile job is skipped — GitHub treats skipped
required checks as passing if they did not run. When only mobile changes,
infra and sandbox deploy are skipped similarly.

## GitHub CLI

```bash
gh api repos/ayush-porwal/smaran/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "format check" },
      { "context": "infra — lint, build, test, synth" },
      { "context": "mobile — typecheck, lint" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0
  },
  "restrictions": null
}
EOF
```

Adjust review count and checks to match your team. After the
`feature/actions-improvements` branch merges in `ayush-porwal/actions`, pin
workflow refs from `@feature/actions-improvements` to `@main` (or a release tag).
