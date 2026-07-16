---
name: upgrade-dependencies
description: Upgrade npm dependencies or fix security advisories in this library, verifying the build and snapshots don't move. Use when the user asks to upgrade or bump packages, run npm audit, fix vulnerabilities or advisories, or update the lockfile. Records which packages are pinned on purpose and why.
allowed-tools: Bash(npm *) Bash(git diff *) Bash(git status *) Read Edit Grep Glob
---

# Upgrade dependencies

**npm only.** Never add a `yarn.lock` (it's gitignored). `yarn audit` is retired — the registry returns 410 and Yarn 1 is frozen, so a second lockfile silently resolves a divergent tree that `npm audit` never inspects.

## Steps

1. **Baseline before touching anything.** Run `npm test` and `npm run build`, and record the suite/test/snapshot counts. You can't call an upgrade safe without a before to compare against, and you can't reconstruct one once the tree has moved. If the baseline is already failing, stop and surface that rather than upgrading on top of it.

2. **Make one kind of change.** Don't combine these in a single pass:
   - Advisories → `npm audit fix`
   - Move within existing ranges → `npm update`
   - Major bump → `npm i <pkg>@<version>`, one package at a time

   Install with `npm ci`. **Never `rm package-lock.json && npm install`** — that re-resolves the entire tree unaudited and discards a known-good state to solve a problem you haven't diagnosed yet.

3. **Confirm `audit fix` stayed in the lockfile.** `git diff package.json` must come back empty. If a declared range moved, `audit fix` escalated into something bigger than what was asked for. Stop and report it.

4. **Review what moved.** Read `git diff package-lock.json`. For each package: is the maintainer the established owner, and did it gain an install script?

   ```bash
   npm view <pkg>@<ver> --json    # returns an array — index [0] before reading fields
   npm audit signatures           # proves origin, not that the build was honest
   ```

   Install scripts are the main way a compromised package executes on this machine. npm blocks them and lists them during install. **One blocked package, `fsevents`, is expected** — it's optional, macOS-only, and ships a prebuilt binary, so the blocked build is unnecessary. Leave it blocked; don't run `npm approve-scripts` to silence it. Anything *else* in that list is worth investigating before accepting the upgrade.

5. **Verify against the baseline.** Re-run `npm test` and `npm run build`. The counts must match step 1 **exactly**. "Still green" isn't the bar — a silently skipped suite is also green.

6. **Report.** What moved and why, what you checked in step 4, and the before/after numbers. Lead with anything unexpected rather than burying it under a green result.

## Gotchas

- **The snapshots assert SVG output.** If one moves, the upgrade changed rendering. Stop and report it; don't run `test:update` to make it pass.
- **The tests never exercise `dist/`.** Jest runs ts-jest against `src/`, while the published artifact is built separately by webpack and tsc. A dependency that changes how `dist/` is emitted — TypeScript, webpack, ts-loader — can leave the whole suite green and still change what consumers receive. When bumping those, compare the build output before and after instead of trusting the suite.

## Pinned on purpose

Don't relitigate these mid-upgrade.

- **TypeScript stays on 5.x.** TS 7 ships CLI-only with no compiler API until 7.1, and `ts-loader`, `ts-jest`, `ts-node`, and `@typescript-eslint/parser` all consume that API. `typescript-eslint` caps its peer range below 6.1 and closed TS 7 support as not planned. TS 6 is the intended bridge, but it flips `strict` on by default and `tsconfig.json` has it off — add an explicit `"strict": false` first or expect a large error count.
- **ESLint stays on 8.x.** ESLint 10 removed the eslintrc system entirely and this repo uses `.eslintrc.json`. Moving requires a flat-config rewrite; check the prettier and import plugin peer ranges before starting.
- **prettier is pinned tighter than its declared range allows.** A bump reformats the codebase. Separately, `npm run lint` already reports pre-existing formatting errors against `.prettierrc.json` — that's a known, independent issue, and a dependency upgrade shouldn't get tangled in it.
