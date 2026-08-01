# Your First Pull Request

A pull request (PR) is how you propose a change to a VOSS repo. You put your work on a branch, push it, and ask a maintainer to merge it.

This guide covers the whole path: getting the issue assigned, naming your branch, writing commits, running the checks, describing the PR, and what happens after you submit.

Nothing here is theory. Every command and every example was taken from a real VOSS repo.

## Before you write any code

Get the issue assigned to you first. This is not a formality.

1. Find an issue you want to work on.
2. Check that nobody else is assigned. The assignee shows on the right side of the issue page.
3. Comment on the issue saying you would like to work on it.
4. Wait for a maintainer to assign it to you.

If two people build the same fix, one of them wastes their evening. That is the entire reason for this rule.

If the thread stays quiet, post once more in the same thread. Do not start a large change on an unassigned issue and hope for the best.

If the issue is unclear, ask in the issue thread before writing code. "Which file holds this?" and "should this also cover X?" are good questions. Nobody expects you to know the codebase already.

## Branch naming

VOSS uses typed, short-lived branches. The name is `type/short-description`, all lowercase, words separated by hyphens.

Short-lived means: one branch, one issue, merged within days. Do not keep a branch alive for weeks collecting unrelated work.

| Prefix | Use it for | Real example from VOSS history |
|---|---|---|
| `feat/` | New functionality | `feat/marks-import`, `feat/erp-rbac-foundation` (verp) |
| `fix/` | Something is broken | `fix/one-tr-per-class`, `fix/roster-scope-guards` (verp) |
| `chore/` | Housekeeping, no user-visible change | `chore/seed-test-accounts` (verp) |
| `docs/` | Documentation only | None yet. Follow the same pattern: `docs/setup-guide` |
| `security/` | vauth only, security-relevant changes | `security/kv-rate-limit` (vauth) |

More real branches, so you can see the naming rhythm: `feat/account-link`, `feat/phase5-student-dashboard`, `feat/voss-brand-overhaul`, `feat/session-24h`, `feat/voss-auth-oidc`, `feat/vosslabs-domain-and-client-mgmt`.

The description should say what the branch does, not which issue number it is. `fix/one-tr-per-class` tells you something. `fix/issue-42` tells you nothing.

### Creating the branch

Always branch from the latest `main`. If you branch from stale code, your PR will show changes you did not make.

Switch to the main branch.

```
git checkout main
```

Pull the newest code from the VOSS repo. `upstream` is the original repo, not your fork.

```
git pull upstream main
```

If that fails with `fatal: 'upstream' does not appear to be a git repository`, you have not linked the original repo yet. Add it, then run the pull again. Replace `verp` with whichever repo you are working on.

```
git remote add upstream https://github.com/voss-labs/verp.git
```

Create your branch and switch to it in one step.

```
git checkout -b fix/dead-sidebar-links
```

Confirm you are on the right branch. The current branch is marked with `*`.

```
git branch
```

## Commit messages

VOSS uses Conventional Commits. The first line is:

```
type(scope): summary
```

The scope in parentheses is optional. Use it when the change belongs to one clear area.

Keep the first line under about 72 characters, lowercase after the colon, and in the imperative ("add", "remove", "fix"), not the past tense ("added", "removed").

| Type | Meaning | Real commit from VOSS history |
|---|---|---|
| `feat` | New capability | `feat(marks): import marks from PDF/Excel marksheets` (verp) |
| `fix` | Something was broken | `fix(classes): one TR per class, not several` (verp) |
| `docs` | Documentation only | `docs: everything that broke integrating VERP, and why` (vauth) |
| `style` | Formatting only, no behaviour change | `style: prettier format marks files (fix red CI on main)` (verp) |
| `perf` | Same behaviour, faster | `perf(session): fewer DB round trips in getSessionUser` (verp) |
| `ci` | CI configuration | `ci: drop FORCE_JAVASCRIPT_ACTIONS_TO_NODE24 (no longer needed)` (vask) |
| `deps` | Dependency bumps | `deps: bump golang.org/x/crypto from 0.37.0 to 0.50.0` (vask) |
| `security` | vauth, security-relevant | `security: back the rate limiter with Workers KV (durable across isolates)` (vauth) |
| `chore` | Housekeeping | Used for branches like `chore/seed-test-accounts` (verp) |

### No emojis

No emojis in commit messages. Not in the subject, not in the body. Not in code, comments, docs, READMEs, PR titles, or PR descriptions. This holds in every VOSS repo, with no exceptions.

There is not a single emoji in the commit history of any VOSS repo. Keep it that way.

### The part that actually matters: the body

A subject line says what changed. The body says **why**, and **what you considered and rejected**. That second part is what makes VOSS commit history worth reading a year later.

Here is a real commit from vauth. Read the first two paragraphs closely:

```
security: back the rate limiter with Workers KV (durable across isolates) (#1)

Better Auth's limiter defaults to an in-memory store, which on Workers is
per-isolate and ephemeral -- an attacker rotating isolates dilutes it, and the
whole passwordless abuse model (OTP-send spam, code brute-force) leaned on it.

Wired through rateLimit.customStorage backed by a KV namespace, NOT the global
secondaryStorage: setting secondaryStorage would also relocate SESSIONS into
eventually-consistent KV, which is the wrong substrate for auth sessions.
customStorage is scoped to rate limiting only (it wins first in
getRateLimitStorage, before secondaryStorage is ever read).
```

What makes this good:

- **The first paragraph is the why.** Not "the rate limiter was wrong" but the actual mechanism: the default store is per-isolate on Cloudflare Workers, so an attacker who rotates isolates gets around it. Someone reading this in a year understands the bug without opening the code.
- **The second paragraph names the rejected option and the reason.** Using `secondaryStorage` would have been the obvious fix. It was rejected because it would also move auth sessions into eventually-consistent storage. Without this note, a future contributor would "simplify" the code straight back into the bug.
- **It is specific.** Real names: `rateLimit.customStorage`, `getRateLimitStorage`. You can grep for them.
- **It is honest about limits.** Further down, the same commit records that KV is eventually consistent, so a fast burst can still slip through, and that a fully atomic limit would need a Durable Object.

That commit is the ceiling, not the entry bar. It was written by a maintainer changing security-critical code.

### The bar for your first PR

**One clear sentence of why is enough.**

You do not need four paragraphs. You need the reader to know what problem the change solves. This is a perfectly good first commit:

```
fix(sidebar): remove links to pages that do not exist

The Reports and Settings links pointed at routes that were never built, so
every click gave a 404.
```

Subject says what. Body says why. Done.

If you did reject an approach along the way, add one line about it. If you did not, do not invent one.

### Writing the commit

Stage the specific files you changed. Naming files is safer than `git add .`, which can sweep up scratch files you did not mean to commit.

```
git add src/components/app-sidebar.tsx
```

See exactly what you have staged before committing.

```
git diff --staged
```

Commit with a subject and a body. Each `-m` becomes its own paragraph.

```
git commit -m "fix(sidebar): remove links to pages that do not exist" -m "The Reports and Settings links pointed at routes that were never built, so every click gave a 404."
```

Running plain `git commit` with no `-m` opens a text editor instead. On many machines that editor is vim, and new users get stuck there with no obvious way out. If it happens: press `Esc`, then type `:wq` and press Enter to save and quit. Using two `-m` flags as above avoids the editor completely.

Push your branch to your fork. `-u` links the branch so that later pushes are just `git push`.

```
git push -u origin fix/dead-sidebar-links
```

## Before you open the PR: run the checks

Run your repo's checks locally and get them passing. A PR with a red CI check will not be reviewed. Maintainers wait for green before spending time on it, so a broken check just means your PR sits there.

| Repo | Command to run | What it actually runs |
|---|---|---|
| verp | `npm run check` | TypeScript typecheck, ESLint, Prettier format check |
| vauth | `npm run typecheck` | `wrangler types`, `react-router typegen`, then `tsc` |
| vask | `make fmt && make vet && make test` | `gofmt -s -w .`, `go vet ./...`, `go test ./... -race` |
| vboard | `pnpm check` | Biome check (lint and format) |
| vosslabs.org | `npm run build` | `astro build` |

Two of these will surprise you, so read the notes below.

**vauth has no `check` script.** If you run `npm run check` there you get `npm error Missing script: "check"`. The command is `npm run typecheck`, and that is what vauth's own CONTRIBUTING.md and PR template ask for.

**vosslabs.org has no `check` script and no lint script.** Its only scripts are `dev`, `build`, `preview`, `astro`, and `generate-types`. `npm run build` is the check: if the site builds, it is fine.

Run verp's checks.

```
npm run check
```

If verp's check fails on formatting or lint, this fixes both automatically. It runs ESLint with `--fix` and then Prettier.

```
npm run fix
```

Then run `npm run check` again to confirm it is clean.

Run vask's checks. `make fmt` rewrites your files in place, so run it before you commit, not after.

```
make fmt && make vet && make test
```

Run vboard's check. vboard uses pnpm, not npm. If `pnpm` is not installed you will see `command not found: pnpm`.

```
pnpm check
```

### What CI runs on your PR

CI is a robot that runs the checks again on GitHub after you push. Only three repos have it.

| Repo | CI runs |
|---|---|
| verp | `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` |
| vauth | `npm run typecheck`, `npm run build` |
| vask | `go build ./...`, `go vet ./...`, `go test ./... -race -timeout 60s` |
| vboard | No CI. Your local `pnpm check` is the only gate. |
| vosslabs.org | No CI. Your local `npm run build` is the only gate. |

Note that verp's CI runs `npm run build` but `npm run check` does not. A change can pass `npm run check` locally and still fail CI on the build step. If CI goes red on build and you cannot see why, run the build yourself.

```
npm run build
```

### A trap in verp specifically

verp's `README.md` and `CONTRIBUTING.md` still tell you to run `npm run setup` and `npm run db:migrate`. **Both of those scripts were deleted. They do not exist.** Running them gives you `npm error Missing script`. Those docs are out of date, not you.

The real script list in verp is exactly: `dev`, `build`, `start`, `lint`, `lint:fix`, `typecheck`, `format`, `format:check`, `check`, `fix`, `db:push`, `db:generate`, `db:studio`.

Set up the verp database with a schema push. There are no migrations to run.

```
npm run db:push
```

Also: verp needs `SUPER_ADMIN_EMAILS` to make your account an admin, and it is missing from `.env.example`. Add the line to your `.env.local` by hand, with your own login email. It is a comma-separated list and it is matched in lowercase.

```
SUPER_ADMIN_EMAILS="you@example.com"
```

verp needs Node 20 or newer and uses npm. Check your version.

```
node -v
```

## Writing the PR description

Go to your fork on GitHub. After pushing, a banner appears offering to open a pull request. Click **Compare & pull request**. Make sure the base branch is `main` on the VOSS repo, not on your fork.

The PR title follows the same rule as the commit subject: `type(scope): summary`. No emojis.

Three things belong in the description:

1. **Link the issue** with `Closes #N`. Written exactly like that, GitHub closes the issue automatically when the PR merges. `#N` alone links but does not close.
2. **What changed and why.** The why matters more. Reviewers can read the diff to see what changed; they cannot read your mind to find out why.
3. **How you tested it.** Not "it works". The steps you actually took.

Copy this template and fill it in:

```
## What

One or two sentences on what this changes.

## Why

The problem this solves. If you rejected another approach, say which and why.

Closes #N

## How I tested

- Ran the repo's checks and they pass
- Steps I clicked through: ...
```

verp, vauth, vosslabs.org, and vask each have their own PR template that loads automatically when you open the PR. If a template appears in the description box, fill that in instead of the one above. It is the one the maintainers of that repo want.

Two things worth knowing about specific templates:

- vauth's template asks directly whether you are touching anything in CODEOWNERS. If yes, explain what you changed about the security behaviour and why it is safe. If no, delete that section.
- vask's template asks you to justify any new dependency. vask's CONTRIBUTING.md makes this a rule: never add a dependency without justifying it in the PR description.

If your PR is not finished and you want early feedback, open it as a **draft**. Use the dropdown on the green button and pick "Create draft pull request". For anything touching vauth's security core, opening a draft early is explicitly encouraged: vauth's CONTRIBUTING.md says "we would much rather discuss it before you build it."

## What happens next

**Timing.** A maintainer will review it. There is no promised turnaround, so if the thread goes quiet, leave a polite follow-up comment on the PR. Maintainers are students too and things get missed.

**Change requests are normal.** Almost every PR gets some. It is not a rejection and it is not a judgement of you. It is how the work gets better. Even maintainers get change requests on their own PRs.

Read each comment, make the change, and reply on the thread so the reviewer knows it is handled. If you disagree with a comment, say so and explain why. A reviewer being wrong is a normal outcome of a conversation.

**Pushing follow-up commits.** Do not open a new PR. Do not create a new branch. Commit on the same branch and push again, and the PR updates itself.

Make your changes, then stage and commit them as before.

```
git add src/components/app-sidebar.tsx
```

Commit the fix.

```
git commit -m "fix(sidebar): drop the unused import flagged in review"
```

Push. Because you used `-u` on the first push, this is all you need.

```
git push
```

Refresh the PR page and your new commit is there.

If `main` moved while you were working and GitHub says the branch has conflicts, update your branch. Pull the latest `main` into your branch and resolve any conflicts git reports.

```
git pull upstream main
```

**Follow-up commits do not need perfect messages.** VOSS squash-merges. When your PR is merged, every commit on your branch is combined into one commit on `main`. So `fix/dead-sidebar-links` with five commits becomes one commit in history.

Two consequences:

- Small review-fixup commits like "address review feedback" are fine. They disappear on merge.
- The commit that survives is built from your PR title and description. That is the message that lives in `main` forever, so put the real "why" there.

Once it is merged, you are a VOSS contributor. Delete your branch when GitHub offers to.

## Review rigour differs by repo, and why

The same PR gets a different level of scrutiny depending on where you send it. This is deliberate, and it is about what a bad change can destroy, not about who wrote it.

### vask: the loosest

vask's CONTRIBUTING.md opens with "Pick a thing, ship a PR. No interviews, no forms." The whole merge bar is three questions:

- Does it ship something?
- Is it the simplest thing that ships it?
- Does it preserve the privacy guarantees in the README?

Yes to all three and it merges. There are hard rules underneath, though, and they are about privacy: never log SSH IPs, never log raw public keys, never log post content.

### verp: normal

Every PR needs at least one review before merging, and CI must pass. Keep PRs focused: one feature or fix per PR.

### vauth: the strictest, and only in specific places

vauth is the identity provider. It authenticates real students, so a bad change there does not break a page, it opens accounts.

vauth splits the codebase in two. Most of it is open: UI and copy, the account and console pages, the email templates, accessibility, docs, and tests. Its CONTRIBUTING.md says "Dive in."

Then there is a list of files in `.github/CODEOWNERS` where a maintainer must review before anything merges: the auth config, the domain gate, the permission model, the recovery flow, OAuth client registration, the database schema, the privileged scripts, and the deployment config.

The CODEOWNERS file explains itself in its own header, and this is the line to remember:

```
These require a maintainer's review. This is not distrust of contributors; it
is the same reason Postgres has committers. Contribute freely everywhere else.
```

Postgres is one of the most-used databases in the world and has been developed in the open for decades. It still restricts who can commit to its core. Not because contributors are suspect, but because some code has consequences that a quick read cannot catch. As vauth's CONTRIBUTING.md puts it: "A change here that looks harmless can open every account, so these need a second set of eyes that knows the threat model."

Three rules in vauth are load-bearing, and a well-meaning PR could quietly break any of them:

1. **No passwords.** `emailAndPassword` stays disabled.
2. **The `user` table holds no product data.** No roll numbers, no marks. Those live in the product's own database.
3. **Redirect URIs are exact.** No wildcards, ever.

If your change touches a CODEOWNERS file, GitHub requests the maintainer's review automatically. You do not need to do anything. Open a draft PR early and ask first.

If you find a security bug in vauth, do not open a public issue. Follow `SECURITY.md` in that repo.

---

Next: [when-youre-stuck.md](./when-youre-stuck.md) — the errors you are most likely to hit, and how to ask a question that gets answered.
