# Plan 004: Patch Next.js CVEs and remove dead dependencies

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat da38d0e..HEAD -- apps/web/package.json package.json pnpm-lock.yaml`
> If `apps/web/package.json` changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. NOTE: the working tree already
> contains intentional uncommitted changes (security hardening) — `pnpm-lock.yaml`
> and `apps/web/package.json` having uncommitted modifications relative to
> `da38d0e` is EXPECTED (a `jsonwebtoken` dependency was added). That alone is
> not drift.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security / tech-debt
- **Planned at**: commit `da38d0e`, 2026-06-12 (plus intentional uncommitted hardening in the working tree)

## Why this matters

`pnpm audit --prod` reports active HIGH-severity advisories against the pinned
`next@16.1.0` (e.g. GHSA-vfv6-92ff-j949; patched in `>=16.2.5`) and against the
transitive `minimatch@9.0.5` (ReDoS, via `google-auth-library`). The web app is
the public-facing surface of this product, so a known DoS-able framework
version is the single cheapest security fix available. While the lockfile is
being refreshed anyway, this plan also deletes 26 `@radix-ui/react-*` packages
that are declared in `apps/web/package.json` but imported nowhere (the UI was
built on `@base-ui/react` instead), and aligns the TypeScript version across
the workspace.

## Current state

- `apps/web/package.json` — declares `"next": "16.1.0"` (check the exact
  current string; it may be `16.1.0` or `^16.1.0`) and 26 unused packages
  `@radix-ui/react-accordion` through `@radix-ui/react-tooltip` (lines ~20–45):
  accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible,
  context-menu, dialog, dropdown-menu, hover-card, label, menubar,
  navigation-menu, popover, progress, radio-group, scroll-area, select,
  separator, slider, slot, switch, tabs, toggle, toggle-group, tooltip.
- Verified during the audit: `grep -rn 'from "@radix-ui' apps/web --include='*.tsx' --include='*.ts'`
  returns **zero matches**. All UI components import from `@base-ui/react` or
  local `~/components/ui/*`.
- Root `package.json` — `"typescript": "5.9.2"` while `apps/api`, `packages/trpc`,
  `packages/services`, `packages/forms`, `packages/database` all use `^5.9.3`.
- Audit output (2026-06-12): 40 vulnerabilities (4 low / 19 moderate / 17 high).
  The high ones cluster on `next@16.1.0` and `minimatch@9.0.5`.

## Commands you will need

| Purpose   | Command                          | Expected on success                          |
|-----------|----------------------------------|----------------------------------------------|
| Install   | `pnpm install`                   | exit 0, lockfile updated                     |
| Audit     | `pnpm audit --prod`              | no HIGH advisories naming `next` or `minimatch` |
| Typecheck | `pnpm check-types`               | exit 0 (runs turbo across all packages)      |
| Lint      | `pnpm lint`                      | exit 0                                       |
| Build     | `pnpm build`                     | exit 0 (needs root `.env`; see STOP conditions) |

## Scope

**In scope** (the only files you should modify):
- `apps/web/package.json`
- `package.json` (root — typescript version only)
- `pnpm-lock.yaml` (via `pnpm install` only — never hand-edit)

**Out of scope** (do NOT touch, even though they look related):
- Any source file under `apps/` or `packages/` — if a build error suggests a
  source change is needed, that is a STOP condition.
- `@base-ui/react` version — leave as is.
- The other ~20 moderate advisories — they are transitive noise; do not chase
  them in this plan.
- `apps/web/package.json` `jsonwebtoken` / `ioredis` entries — recently added
  on purpose by the security hardening work.

## Git workflow

- Branch: `advisor/004-dependency-security-hygiene` (the repo commits straight
  to `main`, but isolate this work on a branch; the operator merges).
- Commit message style: single line, conventional-commit-ish, e.g.
  `fix: patch next CVEs, drop unused radix deps, align typescript`. No body,
  no Co-Authored-By trailer (operator preference).
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Confirm Radix is truly unused

Run: `grep -rn "@radix-ui" /home/ubuntu/cohort/formblox/apps/web --include='*.tsx' --include='*.ts'`

**Verify**: zero matches. If there are ANY matches, STOP — the codebase
drifted and the removal list is stale.

### Step 2: Edit apps/web/package.json

1. Change the `next` entry to `"next": "^16.2.5"`.
2. Delete all 26 `@radix-ui/react-*` dependency lines.
3. Change `"typescript": "5.9.2"` in `devDependencies` (if present in this
   file) to `"^5.9.3"`.

**Verify**: `grep -c "@radix-ui" apps/web/package.json` → `0`, and
`grep '"next"' apps/web/package.json` → shows `^16.2.5`.

### Step 3: Edit root package.json

Change `"typescript": "5.9.2"` to `"typescript": "^5.9.3"` in root
`devDependencies`.

**Verify**: `grep '"typescript"' package.json` → shows `^5.9.3`.

### Step 4: Refresh the lockfile

Run `pnpm install`. Then run `pnpm update --recursive minimatch` to pull the
patched transitive minimatch.

**Verify**: `pnpm install` exits 0. `pnpm why minimatch | head -20` shows
version `>=9.0.7` (or minimatch absent).

### Step 5: Re-audit

Run `pnpm audit --prod 2>&1 | tail -5`.

**Verify**: no HIGH advisory referencing `next` remains. If minimatch is still
flagged HIGH after step 4, add to root `package.json`:
```json
"pnpm": { "overrides": { "minimatch@>=9.0.0 <9.0.7": ">=9.0.7" } }
```
then `pnpm install` and re-audit. Moderate/low advisories remaining is
acceptable — do not chase them.

### Step 6: Full verification

Run `pnpm check-types`, `pnpm lint`, `pnpm build` in that order.

**Verify**: all exit 0. `pnpm build` requires a root `.env` file (scripts use
`dotenv --`); if `.env` is missing in your environment, run
`pnpm --filter web exec next build` is NOT a substitute — instead note in your
report that build was skipped for missing env and rely on check-types + lint.

## Test plan

No test infrastructure exists in this repo (known, deferred). Verification is
the command gates above. The behavioral surface of this change is zero source
lines — only manifest/lockfile.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "@radix-ui" apps/web/package.json` → 0
- [ ] `pnpm audit --prod` shows no HIGH advisory for `next` or `minimatch`
- [ ] `pnpm check-types` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `git status` shows changes only to the three in-scope files
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 finds any `@radix-ui` import.
- `next@^16.2.5` introduces a typecheck or build error in `apps/web` — do not
  patch source files to fix it; report the exact error.
- `pnpm install` fails to resolve `next@^16.2.5` (registry/network issue).
- Fixing the audit would require overriding anything other than `minimatch`.

## Maintenance notes

- The remaining moderate advisories are mostly dev-tooling transitive noise;
  re-run `pnpm audit --prod` quarterly or when adding deps.
- If someone later adds a Radix-based component (e.g. via shadcn generator),
  they must re-add only the specific packages used.
- Watch in review: the `pnpm-lock.yaml` diff should show only next/radix/
  typescript/minimatch-related movement; a huge unrelated diff means a
  different pnpm version regenerated the lockfile — re-run with pnpm 9.
