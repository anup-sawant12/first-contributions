# Glossary

Every word in this list is one that somebody at VOSS will say to you without explaining it. Look it up, close the tab, get back to work. Not knowing these is the normal starting position, not a gap you were supposed to have filled already.

Where a term means something specific at VOSS, that is spelled out.

## Git and GitHub

**.gitignore** — A file listing paths Git should pretend do not exist, so secrets and generated files never get committed. verp's `.gitignore` blocks `node_modules`, `.next`, and every `.env*` file, with one deliberate exception: `!.env.example`, so the template listing which variables you need still ships.

**assignee** — The one person GitHub records as working on an issue. At VOSS you get assigned by asking: comment `I'd like to work on this` on the issue and wait for a maintainer. Starting on an unassigned issue risks two people building the same thing.

**branch** — A named line of work that keeps your changes separate from everyone else's until they are ready. VOSS branch names are typed the same way commits are; real ones on verp include `feat/mvp-roster-reset`, `fix/one-tr-per-class` and `chore/seed-test-accounts`.

Create a branch and switch onto it in one step:

```
git checkout -b fix/dead-sidebar-links
```

**clone** — Copying a repository from GitHub down to your computer, with its full history. You clone your fork, not the VOSS original.

```
git clone https://github.com/YOUR-USERNAME/verp.git
```

**CODEOWNERS** — A file that forces named people to review changes to specific paths. Exactly one VOSS repo has one: vauth, where a set of security-critical paths — the auth and permission code, the OAuth client config, the schema, the privileged scripts and the deployment config — require `@harshalmore31`'s review. Its own header explains why, and it is not distrust — "a bad change to any of them is invisible in a quick review and compromises every account."

**commit** — A saved snapshot of your staged changes, plus a message explaining them. VOSS commit messages run long on purpose: they say what was rejected and why, not only what changed.

```
git commit -m "fix: remove dead sidebar links"
```

**draft pull request** — A pull request marked not-ready-for-review: visible to everyone, mergeable by nobody. vauth's CONTRIBUTING tells you to open one before touching anything risky — "we would much rather discuss it before you build it."

**fork** — Your own copy of a VOSS repository, under your GitHub username. You cannot push to `voss-labs/verp`, but you can push to `YOUR-USERNAME/verp` and then ask for that work to be pulled in. You make one by clicking Fork on the repo page; there is no command.

**HEAD** — Git's word for where you are right now: the commit your working files currently reflect. When a message says "your branch is 1 commit ahead", it is comparing HEAD against the remote.

Show the commit HEAD is sitting on:

```
git log --oneline -1
```

**issue** — A GitHub thread describing one thing to build, fix or explain. A VOSS `good-first-issue` has to name the files to change, the acceptance criteria, and a mentor's GitHub handle before it can be posted at all.

**label** — A tag on an issue. VOSS uses nine across its repos: `good-first-issue`, `intermediate`, `advanced`, `bug`, `feature`, `docs`, `backend`, `ui`, `cleanup`. They are explained one by one in [pick-an-issue.md](pick-an-issue.md). vboard runs a larger scheme (`type:`, `status:`, `phase:`, `priority:`) defined in its `.github/labels.yml`.

**main** — The branch holding the real, current code. Every VOSS repo's default branch is `main`, and it is protected: nobody pushes to it directly, every change arrives as a pull request.

**merge** — Combining one branch's changes into another. At VOSS this happens on GitHub when a maintainer merges your pull request; you will rarely type a merge command yourself.

**merge conflict** — What Git does when two branches changed the same lines and it cannot pick a winner, so it stops and asks you. This repo is built so your first contribution can never hit one: everybody adds their own `contributors/<username>.md`, so no two people touch the same file.

**origin** — The default name for the remote you cloned from. If you forked and then cloned, `origin` is your fork, and it is where you push.

**pull** — Fetching new commits from a remote and merging them into your current branch. Do it before you start work, so you branch from current code.

```
git pull upstream main
```

**pull request** — Shortened to PR. A request to merge your branch into `main`, together with the review and discussion attached to it. It is the only way code enters a VOSS repo.

**push** — Sending your local commits up to a remote so GitHub can see them.

```
git push origin fix/dead-sidebar-links
```

If Git answers `src refspec ... does not match any`, you have not committed yet. Commit first, then push again.

**rebase** — Replaying your commits on top of newer ones, so it looks like you started from today's `main`. Useful when `main` moved while you were working.

```
git fetch upstream && git rebase upstream/main
```

Only rebase a branch nobody else is building on. It rewrites history, which breaks other people's copies.

**remote** — A nickname for a repository URL stored elsewhere. A VOSS contributor normally has two: `origin` (your fork) and `upstream` (the VOSS repo).

List the remotes this clone knows about:

```
git remote -v
```

**repository** — Repo. One project's files plus its entire history, for example `github.com/voss-labs/verp`. VOSS runs one repo per product: verp, vauth, vask, vboard, vosslabs.org.

**review / change request** — A maintainer reading your PR and either approving it or asking for changes. A change request is not a rejection and is not personal. Push new commits to the same branch and the PR updates itself; you never open a new one.

**squash merge** — Merging a PR by flattening all of its commits into one commit on `main`. VOSS squashes everything, which is why `git log --merges` returns nothing across verp, vauth and vask. This repo's bot merges you the same way, with a title like `feat: add yourname to contributors (#12)`.

**staging area** — The in-between place where you list which changed files belong in the next commit. `git add` puts a file there; `git status` shows you what is staged and what is not.

```
git add contributors/yourname.md
```

**stash** — A shelf for changes you are not ready to commit but need out of the way. `git stash` hides them; `git stash pop` puts them back.

```
git stash
```

**upstream** — The name conventionally given to the original VOSS repo you forked from, so you can pull its updates into your fork.

```
git remote add upstream https://github.com/voss-labs/verp.git
```

## Web development

**.env** — A plain text file of environment variables, one `KEY=value` per line, deliberately kept out of Git. verp reads `.env.local`, and the committed template is `.env.example`.

Copy the template, then fill in the values:

```
cp .env.example .env.local
```

verp's `.env.example` does not contain `SUPER_ADMIN_EMAILS`. You have to add that line yourself, by hand, or you will never get admin access.

**backend** — Code that runs on a server: reading and writing the database, checking who you are, deciding what you are allowed to see. verp's backend is `src/db/`, `src/lib/` and `src/app/api/`.

**component** — A reusable piece of interface written as a function, such as a button or a data table. verp keeps them in `src/components/`, with the shadcn/ui primitives under `src/components/ui/`.

**environment variable** — A setting your code reads from outside itself, so secrets and per-machine values are never hard-coded. verp reads `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `SUPER_ADMIN_EMAILS` — the last being a comma-separated list of emails that get super-admin. It is read in `src/lib/session.ts` but missing from `.env.example`, so add it manually.

**formatting** — Purely mechanical layout: indentation, quotes, line breaks. Nobody argues about it at VOSS because Prettier decides and CI checks the result.

Rewrite your files in the project's format:

```
npm run format
```

**framework** — A pre-built structure that handles routing, rendering and building, so you write features instead of plumbing. verp uses Next.js; vosslabs.org uses Astro.

**frontend** — Everything a person sees and clicks, running in their browser. In verp that is the pages in `src/app/` and the components in `src/components/`.

**linting** — An automated hunt for suspicious code: unused variables, forbidden patterns, likely bugs. verp uses ESLint, and lint errors fail CI.

Report the problems:

```
npm run lint
```

Fix the ones that can be fixed automatically:

```
npm run lint:fix
```

**node_modules** — The folder where npm downloads every library the project depends on. It is enormous, machine-specific and always gitignored. Never commit it; recreate it instead.

```
npm install
```

**package manager** — The tool that installs and versions dependencies. verp and vauth use npm; vboard uses pnpm. Use whichever the repo already uses, because mixing them produces a second lockfile and a confusing PR.

verp needs Node 20 or newer, so check before installing anything:

```
node -v
```

**props** — The values a parent component hands down to a child, like arguments to a function. A component reads its props; it does not change them.

**React** — The JavaScript library VOSS builds interfaces with. verp and vauth both run React 19.

**server-side rendering** — SSR. Building the HTML on the server and sending finished pages to the browser, instead of sending an empty page for JavaScript to fill in. Next.js's App Router does this by default, which is why verp components can query the database directly.

**state** — Data a component remembers between renders, such as whether a dropdown is open. When state changes, React redraws that part of the page.

**type checking** — Verifying that the types you declared line up, without running the code. verp runs TypeScript in strict mode, and a type error fails CI.

```
npm run typecheck
```

**TypeScript** — JavaScript with types added, so mistakes like passing a number where a string belongs get caught before the code runs. The files end in `.ts` and `.tsx`. Every VOSS web project uses it.

## Databases

**column** — One field in a table, with a fixed type. In verp's `students` table, `roll_number` is a text column and `is_active` is a boolean.

**connection string** — A single URL carrying everything needed to reach a database: user, password, host, database name. verp needs two — `DATABASE_URL` (pooled, used by the app) and `DIRECT_URL` (unpooled, used by Drizzle Kit). If yours fails, check you copied the whole string including `?sslmode=require`.

**database** — The separate program that stores your data and answers questions about it. verp and vauth use Postgres hosted on Neon; vask uses SQLite.

**Drizzle** — The ORM every VOSS project with a database uses. Tables are declared in TypeScript (`src/db/schema/` in verp) and those types flow straight into your queries, so a wrong column name is a type error rather than a runtime crash.

Open a local web UI to browse your data:

```
npm run db:studio
```

**foreign key** — A column pointing at a row in another table, enforced by the database itself. In verp's `students` table, `auth_user_id` references `user.id`, so a student row can be tied to a login, and if that login is deleted the field is set to null.

**migration** — A recorded, ordered change to a database's structure, so every copy can be brought to the same shape. verp does not use migrations. Its schema is applied directly, there is no migrate script in `package.json`, and older verp docs that tell you to run `npm run db:migrate` are out of date.

**ORM** — Object-relational mapper. A library that lets you read and write rows using your own programming language instead of hand-writing SQL strings. VOSS uses Drizzle for this everywhere.

**Postgres** — PostgreSQL, the database behind verp and vauth, hosted on Neon's free tier. It is the reason those repos need a connection string before they will start at all.

**primary key** — The column that uniquely identifies a row. verp's `departments` table uses the branch code itself as its primary key (`IT`, `CMPN`, `EXTC`, `BIOMED`, `EXCS`), deliberately, so every lookup keys on something a human can read.

**row** — One record in a table. One row in verp's `students` table is one student.

**schema** — The definition of your tables, columns and types: the shape of the database. In verp it lives in `src/db/schema/`, one file per domain (`students.ts`, `courses.ts`, `attendance.ts`), and those files are the single source of truth.

Apply that schema to your database:

```
npm run db:push
```

**SQLite** — A database that is a single file on disk, with no server to run or configure. vask uses it through a pure-Go driver, so its local data is just a `.db` file sitting in the repo folder.

**table** — A named grid of rows and columns holding one kind of thing. verp has `students`, `faculty`, `departments`, `classes`, `courses`, `attendance` and `marks`, among others.

## The VOSS stack

**API** — The set of URLs your frontend calls to make the backend do something. verp's live in `src/app/api/`.

**Astro** — The site framework behind vosslabs.org. It ships plain HTML with no JavaScript framework attached, which makes it the gentlest VOSS repo to contribute to if you know HTML and CSS.

**authentication vs authorization** — Authentication is "who are you", and it is vauth's job: proving you own your VIT email. Authorization is "what are you allowed to do", and it is each product's own job: whether that person can edit marks. Shortened in code to authn and authz.

**Cloudflare Workers** — Cloudflare's platform for running server code without you managing a server. vauth runs entirely on it, configured by `wrangler.jsonc` and deployed with the `wrangler` CLI.

**edge** — Running code in whichever of a provider's many datacentres is nearest the user, instead of one fixed machine. Cloudflare Workers is an edge platform, which is why vauth carries constraints a normal Node server does not, such as needing the `nodejs_compat` flag switched on.

**endpoint** — One specific URL an API answers on, together with the HTTP method it accepts, for example `POST /api/auth/...`.

**Go** — The language vask is written in. Compiled, fast, and with tiny built-in tooling: `go build`, `go vet` and `go test`, with nothing else to configure.

**JSON** — The plain-text format APIs use to send structured data: curly braces, keys in quotes. `package.json` and `wrangler.jsonc` are JSON files.

**Next.js** — The React framework verp is built on, version 16 with the App Router. It supplies file-based routing, server rendering and the build system in one package.

Start verp on http://localhost:3000:

```
npm run dev
```

If port 3000 is already taken, run it on another port instead:

```
npm run dev -- -p 3001
```

**OIDC / OAuth** — OAuth 2.0 is the protocol that lets one site sign you in using another site's account. OpenID Connect sits on top of it and also tells the site who you are. vauth is VOSS's OIDC provider at `accounts.vosslabs.org`, and verp is one of its clients, which is why verp's `.env.example` carries `VOSS_CLIENT_ID` and `VOSS_CLIENT_SECRET`.

**RBAC** — Role-based access control: permissions attached to roles rather than to individuals. verp's roles are `super_admin`, `hod` and `faculty`, defined in `src/db/schema/enums.ts`. `super_admin` is not stored in the database at all — it comes from the `SUPER_ADMIN_EMAILS` allowlist, so nobody can edit it away from inside the app.

**serverless** — A model where you upload code and the platform runs it on demand. It does not mean there is no server; it means the server is not yours to maintain.

**SSH** — Secure Shell, an encrypted terminal connection to another computer. vask is not a website: you use it by opening an SSH connection to it.

```
ssh vask.vosslabs.org
```

If that answers `permission denied (publickey)`, this device has no SSH key yet. Make one, then run the command above again:

```
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
```

## Process and CI

**build** — Turning source code into the optimised output that actually gets served. It is where errors that type checking missed tend to surface.

```
npm run build
```

**CI** — Continuous integration: automated checks that run on every pull request, so a machine catches mistakes before a human reviews. verp's CI runs lint, typecheck, format check and build.

Run those checks locally before you push. `npm run check` is verp's command, not a universal one:

```
npm run check
```

Every repo has its own: vauth uses `npm run typecheck`, vboard uses `pnpm check`, vask uses `make fmt && make vet && make test`, and vosslabs.org has no check script at all, so `npm run build` is the gate. [your-first-pr.md](your-first-pr.md) has the full table.

**contributor** — Anyone with at least one merged pull request. That is the whole definition at VOSS: no application, no interview, no committee. Your GitHub history is the record.

**conventional commits** — A commit message format: `type(scope): summary`. VOSS uses `feat`, `fix`, `docs`, `style`, `perf`, `chore`, `ci` and `deps`, and vauth adds `security`. Real examples from verp: `fix(classes): one TR per class, not several` and `perf(session): fewer DB round trips in getSessionUser`.

**deploy** — Putting a build where real users reach it. vauth deploys to Cloudflare Workers; vask deploys to a virtual machine over SSH from GitHub Actions. Contributors do not deploy — maintainers do.

**GitHub Actions** — GitHub's built-in CI system. It runs the YAML files in `.github/workflows/` on events you choose: a push, a pull request, a new tag.

**maintainer** — Someone with merge access who reviews pull requests. A maintainer will review yours; there is no promised turnaround, so follow up in the thread if it goes quiet. There is no election; maintainers are contributors who kept contributing.

**MIT licence** — The permissive open source licence every VOSS project uses. Anyone may use, change and redistribute the code, including commercially, as long as the copyright notice stays attached. By contributing, you agree your work ships under it.

**open source** — Code whose source is public and legally reusable. At VOSS it also means the process is public: design decisions happen in issues and pull requests, not in private messages.

**release** — A tagged, published version with downloadable builds attached. Only vask does full releases, and its pipeline publishes the GitHub Release last, after the deploy has been smoke-tested, so a release existing means a verified live version.

**semantic versioning** — Semver. Version numbers written `MAJOR.MINOR.PATCH`: patch for fixes, minor for new features that break nothing, major for changes that break existing users. vask's current tag is `v1.1.3`.

**tag** — A permanent name pinned to one commit, normally a version number. Pushing a tag matching `v*.*.*` to vask is what triggers its entire release pipeline.

**test** — Code that checks other code automatically, so a change that breaks something old fails immediately. Be aware that VOSS has almost none: vask's CI runs `go test` but there are no test files behind it yet. Writing the first ones is genuinely open work.

**workflow** — One YAML file in `.github/workflows/` describing what CI should do and when it should do it. verp has `ci.yml`; vask has `ci.yml`, `verify.yml` and `release.yml`.

---

Next: [pick-an-issue.md](pick-an-issue.md) — how to find something to work on and claim it.
