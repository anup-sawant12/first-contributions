# Pick an Issue

You have made one contribution already: your name is in `CONTRIBUTORS.md`. This
page is about the second one, which is the harder one, because now you have to
choose what to work on.

Read this before you write any code. The last section on claiming an issue is a
rule, not a suggestion.

## Honest state of the backlog

There are five VOSS repositories. Four of them are where first contributions
happen; the fifth, `voss-labs/vauth`, is the identity provider and the hardest
one to set up, so it is not a first-issue repo. Here is what is actually open in
the other four right now:

| Repository | Open issues | Labelled `good-first-issue` |
|---|---|---|
| `voss-labs/verp` | 30 | 11 (4 already assigned) |
| `voss-labs/vask` | 2 | 0 |
| `voss-labs/vosslabs.org` | 0 | 0 |
| `voss-labs/vboard` | 0 | 0 |

That is a small backlog and two of the repositories have nothing filed at all.
More issues are being written. In the meantime, two of the routes below do not
depend on the backlog: writing tests, and proposing your own issue. Both are
covered further down, and both are real contributions.

## Route table: start where your knowledge already is

Find the row that describes you today, not the row you wish described you.

| If this is what you know | Start here | Why |
|---|---|---|
| Only git so far. You have made a commit and opened a pull request, and that is about it. | `vosslabs.org` | Plain Astro. No React, no framework, no database, no login. HTML and CSS in one file per component. |
| DSA and core CS, but no web frameworks | Writing tests for pure functions in `verp` and `vask` | The functions are plain input-to-output. No database, no auth, no React, no Go server. Exactly the shape you already practise on. |
| Go | `vask` | Terminal app plus a small server. Standard Go layout under `internal/`. |
| React or TypeScript | `verp`, and `vboard` when it opens issues | Next.js with React 19 and TypeScript. |

The routes are not a ranking. A test for `computeSgpi` is not a lesser
contribution than a UI change. Pick the one where you can actually finish.

### Route 1: vosslabs.org

The marketing site at https://vosslabs.org.

The whole `src` folder is fifteen files. Every component is a single `.astro`
file that holds its own markup and its own `<style>` block, and Astro scopes
that CSS to that component only, so you cannot break another page by editing
one. There is no database and no login to set up.

Browse the code here before deciding: https://github.com/voss-labs/vosslabs.org

Two things to know up front. This repository needs Node 22.12 or newer, which
is stricter than the other repositories. And it has no CI, so nothing checks
your pull request automatically. You verify your own work by running the build
locally before you push. `docs/setup-a-voss-project.md` covers both.

There are no open issues here today. Go to the "Propose your own issue" section
below. This repository is the easiest one to propose against, because you can
see the result of your change in a browser.

### Route 2: writing tests for pure functions

This is the route for someone who is strong on algorithms and data structures
but has never touched a web framework. It is also, right now, the most useful
unclaimed work in the organisation.

Here is the honest reason it matters. There are zero test files across the VOSS
repositories. Not "a few", not "some outdated ones". Zero. Every function
listed below is currently unverified by anything except a human reading it.

These functions are a good target because they are pure: you give them an
input, they return an output, and they touch nothing else. No database
connection, no logged-in user, no React component, no HTTP request. You can
reason about them entirely from the file in front of you.

**In `verp` (TypeScript):**

| File | Pure functions worth testing |
|---|---|
| [`src/lib/sgpi.ts`](https://github.com/voss-labs/verp/blob/main/src/lib/sgpi.ts) | `computeMarks`, `getGradePoint`, `computeSgpi` |
| [`src/lib/roll-number.ts`](https://github.com/voss-labs/verp/blob/main/src/lib/roll-number.ts) | `parseRollNumber`, `isValidRollNumber`, `looksLikeRoll`, `divisionsForBranch`, `expectedYear` |
| [`src/lib/class-key.ts`](https://github.com/voss-labs/verp/blob/main/src/lib/class-key.ts) | `classKey`, `classKeyFromRoll`, `tryClassKeyFromRoll` |
| [`src/lib/marks-import.ts`](https://github.com/voss-labs/verp/blob/main/src/lib/marks-import.ts) | `extractRow`, `extractRows`, `applyMapping`, `guessTargets` |

`sgpi.ts` and `roll-number.ts` import nothing at all. `class-key.ts` and
`marks-import.ts` import only from `roll-number.ts`. That is the entire
dependency graph you need to hold in your head.

`getGradePoint` is a ladder of percentage thresholds returning 10 down to 4, or
the string `"Fail"`. Every boundary in that ladder is a test case, and boundary
values are exactly where this kind of function breaks.

**In `vask` (Go):**

| Package | Pure functions worth testing |
|---|---|
| [`internal/username`](https://github.com/voss-labs/vask/blob/main/internal/username/username.go) | `Random`, `RandomWithSuffix` |
| [`internal/policy`](https://github.com/voss-labs/vask/blob/main/internal/policy/policy.go) | `Inspect` |
| [`internal/embed`](https://github.com/voss-labs/vask/blob/main/internal/embed/embed.go) | `Pack`, `Format` |

One caveat so you do not waste an evening: `username.Random` returns a random
handle, so you cannot assert an exact string. You assert the shape instead —
two lowercase words joined by a hyphen, characters only in `[a-z-]`. Also in
`internal/embed`, only `Pack` and `Format` are pure. `Client.Embed` makes a
network call and `FromEnv` reads environment variables, so leave those two
alone for a first contribution.

**Now the part you need to know before you start.** The two repositories are
not in the same state, and the difference decides how much work you are signing
up for:

| Repository | What CI runs on your pull request today | What a test contribution needs |
|---|---|---|
| `vask` | `go build ./...`, `go vet ./...`, `go test ./... -race -timeout 60s` | Nothing extra. Go's test runner is built in. Add a `_test.go` file and CI runs it on your pull request automatically. |
| `verp` | lint, typecheck, format check, build | No test runner is installed and CI has no test step. Adding tests means adding the runner and the CI step too. |

So `vask` is the clean start: your test is picked up and run by CI the moment
you open the pull request, with no setup argument to have first.

For `verp`, do not add a test file on its own — nothing would run it, and a
maintainer would have to ask you to redo the pull request. Open an issue
proposing the test setup and the first test file as one change, and wait for a
maintainer to agree on which runner before you build it. That conversation is
itself worth having and nobody has had it yet.

One thing this is not: `verp` issue #28 is "Add end-to-end tests with
Playwright", labelled `advanced`. That is browser tests driving the whole
running app. Unit tests for pure functions are a smaller, separate piece of
work. Do not claim #28 thinking it is this.

### Route 3: vask, if you know Go

Go 1.25. A terminal app and a small server, laid out under `internal/`.

Both open issues are bug reports filed with a screenshot and one line of text,
and neither has any labels:

| # | Title |
|---|---|
| 8 | `[Error] Add better Error Handling` |
| 7 | `[Bug] URL Links in Posts are Not Clickable` |

Neither tells you which file to touch. That is not a trap; it is how they were
filed. If you take one, your first comment should say which file you think
owns the bug and what you plan to change, so a maintainer can correct you before
you spend the evening in the wrong package.

### Route 4: verp or vboard, if you know React or TypeScript

`verp` is the college ERP: Next.js 16, React 19, TypeScript, Drizzle, Postgres.
It has the most issues by a wide margin.

`vboard` is also React and TypeScript, but it has no open issues yet.

These are the `good-first-issue` items in `verp` right now, and whether someone
already holds them:

| # | Status | Title |
|---|---|---|
| 1 | free | Remove dead sidebar links |
| 2 | assigned | Add 404 and error pages |
| 3 | free | Add loading states to dashboard pages |
| 4 | free | Replace hardcoded dashboard stats with real data |
| 5 | free | Replace hardcoded dashboard chart with real data |
| 6 | free | Add Next.js middleware for auth protection |
| 7 | free | Add empty states for pages with no data |
| 8 | assigned | Implement password reset flow |
| 16 | free | Add department CRUD |
| 20 | assigned | Add student data export (CSV/Excel) |
| 27 | assigned | Add database schema documentation |

Read the section "When an issue looks like it is already done" before you pick
one of these. Several of them are stale, and #1, #4 and #5 in that table are
among them.

`verp` needs Node 20 or newer and uses npm. Setting it up needs a free Postgres
database, so budget an evening for setup before you budget an evening for the
issue itself.

## Reading the issue list yourself

Do not trust the tables above forever. They were accurate the day this file was
written. Check the live list before you pick.

Open the filtered list for beginner issues in the browser:

https://github.com/voss-labs/verp/labels/good-first-issue

Open the full list for vask:

https://github.com/voss-labs/vask/issues

If you have the GitHub CLI installed, this prints the same beginner list in your
terminal.

```
gh issue list -R voss-labs/verp --label good-first-issue --state open
```

This prints every open vask issue.

```
gh issue list -R voss-labs/vask --state open
```

If those commands print `command not found: gh`, the GitHub CLI is not installed
on your machine. You do not need it. Use the browser links above instead; they
show exactly the same information.

If they print `gh auth login required`, run that command once and follow the
prompts, or use the browser links instead.

This prints one issue in full, body and all, so you can read it without leaving
the terminal.

```
gh issue view 4 -R voss-labs/verp
```

## What the labels mean

| Label | What it means for you |
|---|---|
| `good-first-issue` | Scoped small enough for someone new to the codebase. Start here. |
| `intermediate` | Assumes you already know how this codebase is laid out. Not a good first pick. |
| `advanced` | Touches several systems at once. Skip until you have merged something here. |
| `bug` | Something is broken. The issue should say what the wrong behaviour is. |
| `feature` | Something does not exist yet and needs building. Larger than a bug, usually. |
| `docs` | Writing or fixing documentation. No framework knowledge needed. |
| `backend` | Server code, API routes, database queries and schema. |
| `ui` | What the user sees. Components, layout, styling, loading and empty states. |
| `cleanup` | Removing or reorganising code without changing behaviour. |

Labels combine. `good-first-issue` + `ui` is a small visible change. `advanced`
+ `backend` + `ui` is a whole feature and is not for a first contribution, no
matter how interesting it sounds.

Two labels are not difficulty ratings. `help wanted` means nobody is actively on
it. `bug` says nothing about how hard the fix is — a bug can be one line or a
week.

`vask` has no labels on its issues at all yet. Judge those two by reading them.

## When an issue looks like it is already done

This will happen to you in `verp`, so read this before it does.

Every `verp` issue was filed in April 2026. On 15 July 2026 the project was cut
back and rebuilt — the commit is literally titled "Reset VERP to the MVP". A
large amount of the code those issues describe no longer exists in that form.
Nobody went back and closed them.

Three you can verify yourself in about two minutes:

- **#2, "Add 404 and error pages".** Both
  [`src/app/not-found.tsx`](https://github.com/voss-labs/verp/blob/main/src/app/not-found.tsx)
  and [`src/app/error.tsx`](https://github.com/voss-labs/verp/blob/main/src/app/error.tsx)
  already exist.
- **#4 and #5, the hardcoded dashboard stats and chart.**
  [`src/app/dashboard/page.tsx`](https://github.com/voss-labs/verp/blob/main/src/app/dashboard/page.tsx)
  now queries the database and carries the comment "Real counts, no fabricated
  numbers, no demo chart".
- **#1, "Remove dead sidebar links".**
  [`src/components/app-sidebar.tsx`](https://github.com/voss-labs/verp/blob/main/src/components/app-sidebar.tsx)
  was rewritten and now says "MVP surface only". Whether any dead link survived
  the rewrite is a real question, and you have to read it to answer it.

So: **open the file the issue names, on GitHub, and read it, before you claim
the issue.** It takes two minutes and it is the difference between an evening
well spent and an evening spent rebuilding something that already exists.

If you find it is already done, do not silently move on to the next issue. Say
so in the issue thread. Something like:

> I read `src/app/not-found.tsx` and `src/app/error.tsx` on `main` and both of
> these already exist, so this looks like it was fixed by the July 15 rewrite.
> Should this be closed?

That comment is a genuine contribution. You have saved the next person the same
wasted evening, and you have given a maintainer the one piece of information
they needed to close the issue. Do that two or three times and you will have a
better map of `verp` than most people who have written code for it.

The same applies in reverse. If you read the file and the issue is still valid,
say that too, and say which file you found — it proves you looked, and it is the
fastest way to get assigned.

## If nothing fits: propose your own issue

Two of the four repositories in the table above have no issues at all, so
proposing is a normal path here, not a last resort.

Open a new issue and write four things:

1. **What is wrong or missing.** One or two sentences. Concrete.
2. **The file.** The exact path, for example `src/components/Footer.astro`. If
   you cannot name a file, you have not read enough of the code yet.
3. **What "done" looks like.** How a reviewer confirms you fixed it. "The footer
   shows the current year" is checkable. "The footer is better" is not.
4. **Why it is small.** Say roughly how long you think it takes. If you cannot
   say, it is probably too big for a first issue.

Then wait for a maintainer to reply before writing the code. They may say "yes,
take it", or "we are doing that differently", or "that file is being rewritten
next week". All three answers save you time. Writing the code first and asking
after is how good work gets rejected for reasons that had nothing to do with the
code.

Good things to propose, in rough order of how welcome they are: a bug you hit
while setting the project up, a missing test for one of the pure functions
listed above, a place where the documentation told you to run a command that
does not exist, or a small accessibility or clarity fix on `vosslabs.org`.

That third one is worth calling out. `verp`'s own `README.md`, `CONTRIBUTING.md`
and `onboarding.md` all still tell you to run `npm run setup` and
`npm run db:migrate`. Neither of those scripts exists any more; both were
removed in the July 15 rewrite. `verp` also needs a `SUPER_ADMIN_EMAILS`
variable that is missing from its `.env.example` entirely. Those docs will send
a new contributor straight into an error message. Fixing them is a real,
unclaimed, useful issue that anyone can file today.

## Scope discipline

**One issue per pull request.** If you are fixing issue #7 and you spot an
unrelated typo, leave the typo alone or file it separately. A pull request that
does two things takes longer to review than two pull requests that each do one
thing, and if one half is wrong the whole thing is blocked.

**If it grows, say so in the thread.** A first issue should fit in about an
evening. Sometimes you open the file and discover the change actually touches
six other files, or depends on something that does not exist yet. That is not
your fault and it is not failure. It means the issue was scoped wrong.

When that happens, comment on the issue and describe what you found:

> Started on this. To change X I also have to change Y and Z, because A depends
> on B. That is more than I can finish this week. Is there a smaller version of
> this, or should I hand it back?

What you must not do is disappear. An issue assigned to someone who has gone
quiet is worse than an unassigned issue, because nobody else will touch it and
nobody knows when it will free up. If you need to step away, say so and unassign
yourself. There is no penalty for that. There is a real cost to silence.

## The claiming rule

This is the one hard rule on this page.

**Comment "I'd like to work on this" on the issue. Wait until a maintainer
assigns it to you. Only then start writing code.**

Not "start writing and comment later". Not "comment and immediately start". You
comment, and you wait for the assignment.

The reason is simple arithmetic. If two people work the same issue, one of those
two pull requests gets closed unmerged. That person spent their whole week on
code that will never ship, and it was avoidable by one comment. The assignment
is the only thing that makes the issue yours.

Before you comment, check the issue page for an assignee in the right-hand
sidebar. If there is a face there, the issue is taken. Four of `verp`'s eleven
beginner issues are already assigned — #2, #8, #20 and #27 — and the table above
marks them.

Also read the existing comments. Somebody may have already asked and be waiting,
or a maintainer may have already said the issue is out of date.

If you claim an issue and the thread stays quiet, that is not a rejection and it
is not a signal to start anyway. Post once more in the same thread. Assignment
happens when a maintainer sees it; issues sit when nobody has looked yet.

## Next

You have an issue and it is assigned to you. Read
[setup-a-voss-project.md](setup-a-voss-project.md) to get that project running
on your machine before you change a single line.
