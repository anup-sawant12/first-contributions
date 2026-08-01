# Set up a VOSS project locally

This doc gets a VOSS project running on your own machine. Pick the one repo your issue lives in and follow only that section. You do not need to set up all five.

Everything here was checked against the actual files in each repo. Where a repo's own README disagrees with this doc, the README is out of date. The commands here are the ones in `package.json`, `Makefile`, and `go.mod` right now.

## The five repos

| Repo | Language and runtime | Package manager | Minimum version | Needs a database | Start the dev server |
| --- | --- | --- | --- | --- | --- |
| [verp](https://github.com/voss-labs/verp) | Node, Next.js 16 | npm | Node `>=20.0.0` | Yes, Neon Postgres | `npm run dev` |
| [vosslabs.org](https://github.com/voss-labs/vosslabs.org) | Node, Astro 6 | npm | Node `>=22.12.0` | No | `npm run dev` |
| [vask](https://github.com/voss-labs/vask) | Go | Go modules | Go `1.25.0` | Yes, but it creates its own file | `make run` |
| [vboard](https://github.com/voss-labs/vboard) | Node, TanStack Start | pnpm | Not declared, use Node 24 | Yes, Neon Postgres | `pnpm dev` |
| [vauth](https://github.com/voss-labs/vauth) | Node, React Router 8 | npm | Node `>=22.22.0` | Yes, Neon Postgres | `npm run dev` |

Where each dev server ends up:

| Repo | Open this |
| --- | --- |
| verp | http://localhost:3000 |
| vosslabs.org | http://localhost:4321 |
| vask | not a website, you connect over SSH on port 2300 |
| vboard | http://localhost:3000 |
| vauth | http://localhost:5173 |

verp and vboard both use port 3000. Running both at the same time fails. There is a fix in [Common errors](#common-errors).

If you do not have Node installed, or an install fails complaining about your Node version, read [Node versions](#node-versions) before you start.

## Before you start

You need `git`. Check whether you already have it.

```sh
git --version
```

If that prints a version number, you are fine. If it says `command not found`, install Git from https://git-scm.com/downloads and open a new terminal window afterwards.

Every command in this doc is typed into a terminal. On macOS that is the Terminal app. On Windows, use Git Bash (it comes with Git) or WSL, not PowerShell, because some commands here are Unix-only.

Always fork the repo on GitHub first and clone your fork, not the original. You cannot push to the original repo. The clone commands below use `YOUR-USERNAME`, which you replace with your actual GitHub username.

## verp

Next.js app for the college ERP. The largest repo and the one most first issues live in.

### Prerequisites

- Node 20 or newer. `package.json` declares `"node": ">=20.0.0"`. Node 24 works and is what we suggest.
- A free Neon Postgres account. Walked through below.

Check your Node version.

```sh
node --version
```

If the number after `v` is less than 20, go to [Node versions](#node-versions) first.

### 1. Clone your fork

Download your fork to your machine.

```sh
git clone https://github.com/YOUR-USERNAME/verp.git
```

Move into the folder that was created.

```sh
cd verp
```

### 2. Install dependencies

This reads `package.json` and downloads every library the project uses. It takes a few minutes the first time.

```sh
npm install
```

### 3. Create a Neon Postgres database

verp stores everything in Postgres. Neon gives you one free, with no credit card. Follow these clicks exactly.

1. Open https://console.neon.tech in your browser.
2. Sign in with Google, GitHub, or email. The Free plan is selected by default. Do not upgrade.
3. Click **New Project**.
4. **Project name**: type `verp`.
5. **Database name**: leave it as `neondb`. Changing it does not break anything, but every example below assumes `neondb`.
6. **Postgres version**: leave the default.
7. **Region**: pick the one closest to you. If you are in India, choose **AWS Asia Pacific (Mumbai)**. **AWS Asia Pacific (Singapore)** is also fine. A far region means every page load in dev feels slow, so this choice is worth ten seconds of thought.
8. Click **Create project**.
9. You land on the project dashboard. Find the **Connection Details** panel.
10. There is a dropdown above the connection string that switches between a **pooled** and a **direct** connection. Copy the **pooled** one. This is your `DATABASE_URL`.
11. Switch the dropdown to the **direct** connection and copy that too. This is your `DIRECT_URL`.

Neon redesigns this console regularly, so the panel may not be labelled exactly as above. The reliable test does not depend on labels: the **pooled** string has `-pooler` in the hostname and the **direct** string does not. Both end with `?sslmode=require`.

A pooled string looks like this:

```
postgresql://neondb_owner:PASSWORD@ep-cool-bird-12345678-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require
```

A direct string looks like this:

```
postgresql://neondb_owner:PASSWORD@ep-cool-bird-12345678.ap-south-1.aws.neon.tech/neondb?sslmode=require
```

Copy both somewhere before you close the tab. Neon shows the password once. If you lose it, you can reset it from the dashboard, but you then have to update both strings.

Copy the whole string starting with `postgresql://`. Neon also offers a `psql "..."` command and connection snippets for various languages. Those are not what you want. If what you copied does not start with `postgresql://`, you copied the wrong thing.

### 4. Write .env.local

Copy the template of environment variables into the file the app actually reads.

```sh
cp .env.example .env.local
```

The file has to be named `.env.local`, not `.env`. Next.js reads `.env.local`, and `drizzle.config.ts` loads `.env.local` explicitly. A file named `.env` is silently ignored and you will spend an hour wondering why nothing works.

Open `.env.local` in your editor and fill it in so it looks like this, with your own two Neon strings pasted in:

```
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

BETTER_AUTH_SECRET="paste-the-generated-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

SUPER_ADMIN_EMAILS="your.email@vit.edu.in"

VOSS_DISCOVERY_URL="https://accounts.vosslabs.org/api/auth/.well-known/openid-configuration"
VOSS_CLIENT_ID=""
VOSS_CLIENT_SECRET=""
```

Generate the random value for `BETTER_AUTH_SECRET`.

```sh
openssl rand -base64 32
```

Paste that output between the quotes on the `BETTER_AUTH_SECRET` line.

**`SUPER_ADMIN_EMAILS` is missing from `.env.example`. You have to add that line yourself.** It is not a typo in this doc and it is not optional. `src/lib/session.ts` reads it as a comma-separated allowlist, and an email on that list becomes a super admin the moment it logs in. It is the only way to get admin access, because there is no seed data and no other route to it. If you leave it out, you can still run the app, but every admin page is closed to you. Use the same email you will sign in with. For more than one, separate with commas and no spaces:

```
SUPER_ADMIN_EMAILS="you@vit.edu.in,friend@vit.edu.in"
```

About `VOSS_CLIENT_ID` and `VOSS_CLIENT_SECRET`: leave them empty for now. verp has password login turned off in `src/lib/auth.ts`, so signing in goes through the VOSS accounts service, and that needs client credentials issued by a maintainer. The app builds and runs without them, and most first issues (pure functions, UI, tables, formatting) never need a signed-in session. If your issue does need one, say so in the issue thread and ask for dev credentials.

### 5. Create the database tables

Read `src/db/schema/` and create matching tables in your Neon database.

```sh
npm run db:push
```

**There is no `npm run setup` and no `npm run db:migrate` in verp.** Both were removed. The repo's own `README.md` and `CONTRIBUTING.md` still mention them, and both files are wrong. If you run either, npm tells you the script is missing. `npm run db:push` is the whole database step.

### 6. Run it

Start the dev server.

```sh
npm run dev
```

Open http://localhost:3000. Leave this terminal running. To stop the server, press `Ctrl` and `C` together.

### 7. Before you open a PR

This runs the TypeScript type checker, ESLint, and the Prettier format check, which is exactly what CI runs.

```sh
npm run check
```

If it fails only on formatting or fixable lint rules, this repairs most of it automatically.

```sh
npm run fix
```

Then run `npm run check` again. It must pass before you open the PR.

## vosslabs.org

The public VOSS website. An Astro static site. No database, no accounts, no environment variables. It is the fastest repo to get running.

### Prerequisites

Node 22.12.0 or newer. `package.json` declares `"node": ">=22.12.0"`, which is stricter than verp.

Check your Node version.

```sh
node --version
```

### 1. Clone your fork

Download your fork.

```sh
git clone https://github.com/YOUR-USERNAME/vosslabs.org.git
```

Move into the folder.

```sh
cd vosslabs.org
```

### 2. Install dependencies

```sh
npm install
```

### 3. Run it

```sh
npm run dev
```

Open http://localhost:4321. Astro uses 4321, not 3000.

There is nothing to configure. The homepage pulls the VOSS repo list from the public GitHub API, and `src/components/Projects.astro` handles the failure case, so the page still renders if GitHub rate-limits you. That section going blank locally is not a bug you introduced.

### 4. Before you open a PR

There is no `check` script in this repo. The production build is the check, because it runs Astro's type checking and fails on broken links and bad TypeScript.

```sh
npm run build
```

## vask

An anonymous campus Q&A forum you use over SSH, written in Go. There is no web page and no browser involved.

### Prerequisites

Go 1.25 or newer. `go.mod` declares `go 1.25.0`.

Check whether you have Go.

```sh
go version
```

If that says `command not found`, install it. On macOS with Homebrew:

```sh
brew install go
```

Without Homebrew, or on Windows and Linux, download the installer from https://go.dev/dl/ and run it, then open a new terminal and check `go version` again. Anything from `go1.25.0` up is fine.

You do not need Node, npm, or any account to work on vask.

### 1. Clone your fork

Download your fork.

```sh
git clone https://github.com/YOUR-USERNAME/vask.git
```

Move into the folder.

```sh
cd vask
```

### 2. Download dependencies

Fetch the Go libraries listed in `go.mod`.

```sh
go mod download
```

Use `go mod download` rather than `go mod tidy`. `tidy` can rewrite `go.mod` and `go.sum`, and those edits then show up in your pull request as unrelated changes a reviewer has to ask you to remove.

### 3. You do not need a Turso account

Production runs on Turso, a hosted database. Local development does not touch it.

`cmd/vask/main.go` reads the `TURSO_DATABASE_URL` environment variable. When it is unset, which is the default, the server falls back to a plain SQLite file named `ask.db` in the folder you run it from. That file is created for you on first run, along with an SSH host key named `host_ed25519`. Both are listed in `.gitignore`, so they never end up in your pull request.

The SQLite driver is `modernc.org/sqlite`, which is pure Go. There is no C compiler to install and no CGO to enable.

The repo's `README.md` says the local file is `vask.db`. It is `ask.db`. The default is set in `cmd/vask/main.go`.

### 4. Run the server

Start the SSH server on port 2300.

```sh
make run
```

Leave this terminal running. It prints `store ready` with `mode=local-sqlite`, which is how you confirm it is using the local file and not looking for Turso.

### 5. Connect to it

You need an SSH key, because vask identifies you by the fingerprint of your public key. Check whether you already have one.

```sh
ls ~/.ssh/id_ed25519.pub
```

If that says `No such file or directory`, create one. It asks nothing and takes a second.

```sh
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
```

Now open a **second** terminal window, leaving the server running in the first, and connect.

```sh
ssh -p 2300 -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes localhost
```

The `-i` and `-o IdentitiesOnly=yes` parts are worth keeping. Without them, SSH offers every key you own one at a time and the server can cut you off with `Too many authentication failures` before it reaches the right one.

Press `q` to quit the forum. Press `Ctrl` and `C` in the first terminal to stop the server.

Semantic search is optional and off by default. It needs Cloudflare Workers AI credentials, and without them the `/` key falls back to a plain substring search. Everything else works. One thing to know if you do try to enable it: the binary reads `CF_ACCOUNT_ID` and `CF_AI_TOKEN` with `os.Getenv` and nothing in the Go code loads a `.env` file, so putting them in `.env` does nothing when you run `make run`. You have to export them in your shell first.

### 6. Before you open a PR

Three commands, all from the `Makefile`. Format your code.

```sh
make fmt
```

Catch suspicious code that compiles but is probably wrong.

```sh
make vet
```

Run the tests with the race detector.

```sh
make test
```

All three must pass.

## vboard

Events and communities platform, TanStack Start on Vite+.

### Prerequisites

- **pnpm, not npm.** `package.json` sets `"packageManager": "pnpm@11.0.9"`. Running `npm install` here produces the wrong dependency tree.
- Node. This repo declares no `engines` field at all, so nothing enforces a version. Its `@types/node` is `^22.10.2`, so Node 22 is the floor in practice. Use Node 24.
- A free Neon Postgres account. Same signup as [the verp walkthrough](#3-create-a-neon-postgres-database), which the setup wizard below also walks you through.

Check whether you have pnpm.

```sh
pnpm --version
```

If that says `command not found`, install it.

```sh
npm install -g pnpm@11.0.9
```

### 1. Clone your fork

Download your fork.

```sh
git clone https://github.com/YOUR-USERNAME/vboard.git
```

Move into the folder.

```sh
cd vboard
```

### 2. Install dependencies

```sh
pnpm install
```

This also runs `vp config` at the end, because `package.json` has it as a `prepare` script. That is expected, not an error.

### 3. Run the setup wizard

Unlike the other repos, vboard has no `.env.example` to copy. `.env.local` is in `.gitignore`, so a fresh clone has no environment file of any kind. This wizard creates it.

```sh
pnpm setup
```

It asks for a Neon region, opens the Neon console for you, asks you to paste your pooled and direct connection strings, generates `BETTER_AUTH_SECRET` for you, writes `.env.local`, runs `pnpm db:push` and `pnpm db:migrate`, and offers to seed an admin and a student account with random passwords. Save those passwords when it prints them, because it does not print them again.

You can skip the Resend email key when it asks. It is only needed for signup verification emails.

Re-running `pnpm setup` is safe. It offers to keep your existing `.env.local` and only re-run the database steps.

### 4. Run it

```sh
pnpm dev
```

Open http://localhost:3000. The port is fixed at 3000 in the `dev` script.

`vite.config.ts` loads the Cloudflare plugin, and `wrangler.jsonc` declares an R2 bucket binding marked `"remote": true`. If starting the dev server asks you to log in to Cloudflare, that binding is the reason. It is only used for image uploads. Say so in your issue thread rather than creating a Cloudflare account, since most vboard issues do not touch uploads.

### 5. Before you open a PR

This runs Biome, which handles both linting and formatting.

```sh
pnpm check
```

There is no separate typecheck script, so build the project to catch type and build errors.

```sh
pnpm build
```

## vauth

The central VOSS identity provider. React Router 8 running on Cloudflare Workers. This is the most involved repo to set up. If you are choosing your first issue, choose a different repo.

### Prerequisites

Node 22.22.0 or newer. `package.json` declares `"node": ">=22.22.0"` and `.npmrc` sets `engine-strict=true`, which means an older Node makes `npm install` fail outright rather than warn. `.nvmrc` pins Node 24.

Check your Node version.

```sh
node --version
```

You do not need a Cloudflare account. The dev server emulates the Workers runtime and its KV storage on your machine.

### 1. Clone your fork

Download your fork.

```sh
git clone https://github.com/YOUR-USERNAME/vauth.git
```

Move into the folder.

```sh
cd vauth
```

### 2. Switch to the pinned Node version

This repo has a `.nvmrc`, so your version manager can read the right version from it. With nvm:

```sh
nvm use
```

With fnm:

```sh
fnm use
```

If either says the version is not installed, see [Node versions](#node-versions).

### 3. Install dependencies

```sh
npm install
```

### 4. Set up environment variables

Copy the template.

```sh
cp .env.example .env
```

Open `.env` and set two things. `DATABASE_URL` is a Neon connection string, created the same way as in [the verp walkthrough](#3-create-a-neon-postgres-database) but as its own separate Neon project. `BETTER_AUTH_SECRET` is a random value you generate:

```sh
openssl rand -base64 32
```

Leave `BETTER_AUTH_URL` as `http://localhost:5173`. Leave `RESEND_API_KEY` empty. Without it, login codes are printed to your terminal instead of emailed, which is what you want in development anyway.

Now make a second copy. This is not a mistake.

```sh
cp .env .dev.vars
```

Both files are needed and they serve different processes. The app runs inside the emulated Workers runtime, which reads `.dev.vars`. Drizzle Kit runs as a normal Node process and reads `.env`. Set only one and half of your commands break.

### 5. Create the database tables

Apply the migration files in `app/db/migrations/`.

```sh
npm run db:migrate
```

Unlike verp, `db:migrate` is a real script here and it is the correct one to use, because this repo does keep migration files.

### 6. Run it

```sh
npm run dev
```

Open http://localhost:5173.

### 7. Before you open a PR

This generates the Workers and route types and then runs the TypeScript compiler.

```sh
npm run typecheck
```

Check formatting.

```sh
npm run format:check
```

## Node versions

Four of the repos are Node projects and each declares a different minimum. These are the real numbers, read from each `package.json`:

| Repo | Declared minimum | Where it comes from |
| --- | --- | --- |
| verp | `>=20.0.0` | `engines.node` |
| vosslabs.org | `>=22.12.0` | `engines.node` |
| vboard | none declared | no `engines` field, `@types/node` is `^22.10.2` |
| vauth | `>=22.22.0` | `engines.node`, plus `.npmrc` sets `engine-strict=true` |

**Install Node 24 and use it for everything.** It satisfies every minimum above, and it is the version `.nvmrc` pins in vauth. One version, no switching.

You still want a version manager rather than a plain Node install, because a version manager lets you change versions per project when one repo eventually raises its minimum.

### fnm

fnm is fast and simple. On macOS with Homebrew:

```sh
brew install fnm
```

On other systems, follow the install steps at https://github.com/Schniz/fnm#installation. After installing you must add fnm to your shell config, which the instructions on that page cover. Skip that step and the `fnm` command works but switching versions silently does nothing.

Download Node 24.

```sh
fnm install 24
```

Use it in your current terminal.

```sh
fnm use 24
```

Make it the version every new terminal starts with.

```sh
fnm default 24
```

### nvm

nvm is the older and more widely documented option. Its install command includes a version number that changes, so copy the current one from https://github.com/nvm-sh/nvm#installing-and-updating rather than from any blog post.

After installing, close your terminal and open a new one, then download Node 24.

```sh
nvm install 24
```

Use it in your current terminal.

```sh
nvm use 24
```

Make it the default for new terminals.

```sh
nvm alias default 24
```

### Checking it worked

```sh
node --version
```

This should print something starting with `v24`. If it prints an older version after you installed a manager, you opened the wrong terminal or skipped the shell config step. Open a completely new terminal window and check again.

In a repo that has a `.nvmrc` file, such as vauth, run `nvm use` or `fnm use` with no version number and it reads the file.

## Common errors

### `Missing script: "setup"` or `Missing script: "db:migrate"` in verp

Neither script exists in verp any more. verp's `README.md` and `CONTRIBUTING.md` still mention them and both files are stale. Use `npm run db:push` instead. That single command is the entire database setup step.

### `Error: DATABASE_URL is not set`

`src/db/index.ts` in verp throws this exact message when the variable is missing. Three causes, in order of likelihood:

1. Your file is named `.env` instead of `.env.local`. verp reads `.env.local`. Rename it.
2. You edited `.env.example` instead of `.env.local`. The example file is a template and is never read at runtime.
3. You added the variable while the dev server was running. Environment files are read at startup. Stop the server with `Ctrl` and `C`, then run `npm run dev` again.

### Admin pages are missing or locked in verp

You did not set `SUPER_ADMIN_EMAILS` in `.env.local`, or you set it to an email different from the one you sign in with. It is deliberately absent from `.env.example`, so copying the example gives you a file without it. Add the line by hand, use your real sign-in email, and restart the dev server.

### `EBADENGINE` or an install that fails on your Node version

Your Node is older than the repo requires. In vauth this is a hard failure rather than a warning, because `.npmrc` sets `engine-strict=true`. Install Node 24 as described in [Node versions](#node-versions), then delete the partial install and retry:

```sh
rm -rf node_modules package-lock.json
```

Then run `npm install` again.

### `Port 3000 is already in use`

verp and vboard both want port 3000. So does anything else you left running. Stop the other server first. If you genuinely need both at once, run verp on a different port:

```sh
npm run dev -- -p 3001
```

For vboard, whose port is hardcoded in its `dev` script, call the underlying tool directly:

```sh
pnpm exec vp dev --port 3001
```

### `pnpm: command not found`

vboard is the only repo that uses pnpm. Install it:

```sh
npm install -g pnpm@11.0.9
```

Do not use `npm install` in vboard as a workaround. The lockfile is `pnpm-lock.yaml` and npm ignores it, so you get untested dependency versions and problems that are entirely your own.

### vboard has no `.env.example` to copy

Correct, it does not have one. `.env.local` is in `.gitignore` and nothing tracks a template. Run `pnpm setup`, which writes `.env.local` for you.

### `permission denied (publickey)` when connecting to vask

You have no SSH key on this machine. Create one:

```sh
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
```

Then connect again. Your private key never leaves your machine. vask stores only a hash of your public key.

### `Too many authentication failures` when connecting to vask

Your SSH agent is offering every key you own before the right one. Name the key explicitly and tell SSH to use only it:

```sh
ssh -p 2300 -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes localhost
```

### `address already in use` when running `make run` in vask

Port 2300 is taken, usually by a vask server you already started in another terminal. Either stop that one, or run on a different port using the flag defined in `cmd/vask/main.go`:

```sh
go run ./cmd/vask -port 2400
```

Then connect with `-p 2400` instead of `-p 2300`.

### Cloudflare AI credentials in vask's `.env` do nothing

Nothing in vask's Go code loads a `.env` file. `cmd/vask/main.go` and `internal/embed` read the environment directly with `os.Getenv`. `.env` is read by the deploy scripts and by systemd in production, not by `make run`. Export the variables in your shell before starting the server if you want semantic search locally.

### Neon connection string is rejected

Check three things. It must start with `postgresql://`, not `psql`. It must end with `?sslmode=require`. And `DATABASE_URL` should be the **pooled** string, the one with `-pooler` in the hostname. If you copied a snippet from Neon's language-specific examples rather than the raw string, copy it again from the connection string field.

### The app runs but you cannot sign in to verp

Expected. Password login is switched off in `src/lib/auth.ts`, and sign-in goes through the VOSS accounts service using `VOSS_CLIENT_ID` and `VOSS_CLIENT_SECRET`, which a maintainer has to issue. Most first issues do not need a session. If yours does, ask in the issue thread.

### Something else

Do not spend an evening on it. Setup problems are the maintainers' problem, not yours, and a question about setup is never an annoyance. Say what you ran and paste the full error into your issue thread.

Next: [your-first-pr.md](your-first-pr.md)
