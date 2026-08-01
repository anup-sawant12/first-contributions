# When You Are Stuck

Every error in this document is one that someone actually hit on a VOSS repo. None of it is invented, and none of it means you did something wrong. Setup breaks for everyone. It broke for the people who wrote these projects.

Read the section that matches your error. If nothing here matches, skip to [How to ask a good question](#how-to-ask-a-good-question) and ask. That is the intended ending, not a failure.

---

## Try this first

Five moves. They take about two minutes together and they fix most things.

### 1. Read the actual error text

Scroll up. Terminals print the real error first and then a lot of noise after it — stack traces, "npm error A complete log of this run can be found in...", retry messages. The first red line is the one that matters. The last one usually is not.

Read it slowly. A surprising number of errors say exactly what is wrong: `DATABASE_URL is not set` means `DATABASE_URL` is not set.

### 2. Check your Node or Go version

This is the single most common cause of "it works for everyone but me".

Check the Node version on your machine.

```bash
node --version
```

Check the Go version on your machine.

```bash
go version
```

Compare against what the repo needs:

| Repo | Needs | Package manager |
|---|---|---|
| verp | Node 20.0.0 or newer | npm |
| vosslabs.org | Node 22.12.0 or newer | npm |
| vauth | Node 22.22.0 or newer | npm |
| vboard | No version declared, use Node 24 | pnpm |
| vask | Go 1.25 or newer | go (built in) |

**Install Node 24.** It clears every floor in the table, so one version covers all four Node repos, and it is the version vauth's `.nvmrc` pins. Get it from `https://nodejs.org` or, if you already have `nvm`, run `nvm install 24`. [setup-a-voss-project.md](./setup-a-voss-project.md) has the full version-manager walkthrough.

### 3. Delete node_modules and reinstall

Half-finished installs are real and they produce errors that make no sense. Wiping the folder is safe: everything in it is downloaded, nothing in it is yours.

In verp or the website.

```bash
rm -rf node_modules && npm install
```

In vboard.

```bash
rm -rf node_modules && pnpm install
```

**Do not delete `package-lock.json` or `pnpm-lock.yaml` as well.** They are tracked files, they belong to the repo, and deleting them makes your next PR contain a 500,000-line diff nobody asked for. If one of them shows up modified in `git status` and you did not add a dependency, throw the change away.

```bash
git checkout -- package-lock.json
```

### 4. Confirm your .env

verp reads **`.env.local`**, not `.env`. Next.js loads `.env.local` automatically, and `drizzle.config.ts` loads it explicitly. A file named `.env` is ignored by both.

Create it from the template, in the verp folder.

```bash
cp .env.example .env.local
```

Then check what is actually in it, because an empty value looks identical to a correct one at a glance.

```bash
cat .env.local
```

Two things go wrong here constantly:

- **`SUPER_ADMIN_EMAILS` is missing from `.env.example`.** It is read by `src/lib/session.ts` and it is the only way to become an admin — there is no seed data that grants it. Add the line yourself. It is comma-separated and matched in lowercase, so use the exact email you sign in with.

  ```bash
  SUPER_ADMIN_EMAILS="you@vit.edu.in"
  ```

- **Do not append to an env file with `>>` from the shell.** If the file does not already end in a newline, your new line joins onto the end of the previous value and silently corrupts it. This has already cost VOSS a debugging session over a 74-character API key that should have been 40. Open the file in an editor instead.

vask is different: it runs with no env file at all. `.env` there only enables optional semantic search, and without it search falls back to substring matching.

### 5. Pull the latest main

Your fork froze the moment you created it. If a fix landed upstream two days ago, you do not have it.

Download what is new in the VOSS repo. This changes none of your files.

```bash
git fetch upstream
```

Bring it into your branch.

```bash
git merge upstream/main
```

If you have never set up the `upstream` remote, [git-and-github.md](./git-and-github.md) covers that in three lines.

---

## Git and GitHub errors

| Symptom | What it means | Fix |
|---|---|---|
| `remote: Support for password authentication was removed on August 13, 2021.` | You typed your GitHub account password. GitHub has not accepted passwords for git since 2021. | Use `gh auth login` or a personal access token. Full walkthrough in [git-and-github.md](./git-and-github.md). |
| `git@github.com: Permission denied (publickey).` | You are talking to GitHub over SSH and this machine has no SSH key GitHub recognises. | Clone over HTTPS instead and use `gh auth login`. That path is simpler and works everywhere. |
| `fatal: Authentication failed for 'https://github.com/...'` | Wrong credentials, or a token that expired. Tokens expire silently. | Generate a new token, or run `gh auth login` again. |
| `403` when pushing, or `remote: Permission to voss-labs/verp.git denied` | You cloned `voss-labs/verp` instead of your own fork. You do not have write access to the VOSS repo, and neither does almost anyone. | Check with `git remote -v`, then repoint `origin` at your fork. See [git-and-github.md](./git-and-github.md). |
| `fatal: The current branch add-thing has no upstream branch.` | First push of a new branch. Git will not guess where to send it. | Run the `git push -u` line git prints for you. |
| `fatal: No configured push destination.` | The repo has no remote at all, usually because you ran `git init` instead of `git clone`. | `git remote add origin <your fork url>`. |
| `warning: in the working copy of 'x.ts', LF will be replaced by CRLF the next time Git touches it` | Windows line endings. Harmless on its own, but it can make an entire file look changed in your PR. | Run `git config --global core.autocrlf input` on Windows, then re-clone. |
| Your commits show a grey avatar and are not linked to your GitHub profile | Your `git config user.email` does not match an email registered on your GitHub account. | Add that address at `https://github.com/settings/emails` — GitHub reattributes the old commits. |

### Merge conflicts

A conflict means two people edited the same lines and git will not pick a winner. It is not damage and nothing is lost. You get this:

```
CONFLICT (content): Merge conflict in src/components/app-sidebar.tsx
Automatic merge failed; fix conflicts and then commit the result.
```

See exactly which files are unresolved. They show as `UU`.

```bash
git status --short
```

Open each one. Git has written both versions into the file, marked like this:

```
<<<<<<< HEAD
your version of the line
=======
their version of the line
>>>>>>> main
```

Edit the file until it reads the way it should — sometimes that is your version, sometimes theirs, sometimes a combination. **Delete all three marker lines**, including the `=======`. Leaving one in is the classic mistake; the file then fails to compile and the error looks unrelated.

Mark the file resolved.

```bash
git add src/components/app-sidebar.tsx
```

Finish the merge once every file is resolved.

```bash
git commit
```

If you would rather stop and think about it, this puts everything back exactly as it was before you started.

```bash
git merge --abort
```

### My PR shows files I did not change

Three causes, in order of how often they happen.

**You ran a formatter across the whole repo.** verp's `npm run format` is `prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"` — every file under `src/`, not only yours. If anything in the repo was unformatted before you arrived, your commit now contains it. Same for `make fmt` in vask, which is `gofmt -s -w .`.

**Your branch carries commits from your fork's `main`.** If you committed to `main` on your fork at some point, every branch you cut afterwards inherits those commits, and they appear in the PR.

**You committed something ignored, like `.env.local` or `node_modules`.** Rare, but it happens if you use `git add .` before checking.

Find out which it is. This lists every commit your branch adds on top of the VOSS `main`.

```bash
git log --oneline upstream/main..HEAD
```

This lists every file your PR touches, the same way GitHub computes it.

```bash
git diff --stat upstream/main...HEAD
```

If the extra files are formatting churn and you have not committed yet, unstage everything and add back only your own files by name.

```bash
git reset
```

---

## Install and version errors

| Symptom | What it means | Fix |
|---|---|---|
| `npm warn EBADENGINE Unsupported engine` with `required: { node: '>=20.0.0' }` | Your Node is older than verp requires. This is a **warning** — the install finishes and everything looks fine, then breaks later. | Install Node 24 and run `npm install` again. |
| `You are using Node.js 18.20.4. For Next.js, Node.js version ">=20.9.0" is required.` | The same problem, now fatal. Next 16 refuses to start. | Install Node 24. |
| `go: go.mod requires go >= 1.25.0 (running go 1.24.0; GOTOOLCHAIN=local)` | Your Go is older than vask's `go.mod` requires. | Install Go 1.25 or newer from `https://go.dev/dl`. On Go 1.21 and up with default settings, Go downloads the right toolchain itself — this error means the automatic download is turned off or your Go predates the feature. |
| `command not found: pnpm` | vboard uses pnpm, not npm. | `npm install -g pnpm@11.0.9`, the version vboard's `packageManager` field pins. |
| A cgo or "C compiler not found" error while building vask | You are following advice written for a different SQLite library. | vask needs no C compiler. Local storage is pure-Go (`modernc.org/sqlite`) and there is no cgo anywhere in the repo. Do not set `CGO_ENABLED`. |
| `npm error Missing script: "setup"` | verp's `README.md` and `CONTRIBUTING.md` still tell you to run `npm run setup`. That script was deleted on 15 July 2026. The docs are wrong, not you. | There is no setup wizard. Set up by hand: copy `.env.example` to `.env.local`, fill it in, then `npm run db:push`. |
| `npm error Missing script: "db:migrate"` | Same stale docs. verp has no migrations to run. | The schema is applied with `npm run db:push`. |

verp's complete script list, from `package.json` and nothing else, is: `dev`, `build`, `start`, `lint`, `lint:fix`, `typecheck`, `format`, `format:check`, `check`, `fix`, `db:push`, `db:generate`, `db:studio`. Anything outside that list does not exist, no matter which document told you about it.

Fixing those stale docs is a genuinely good first pull request.

---

## Database and environment errors

| Symptom | What it means | Fix |
|---|---|---|
| `Error: DATABASE_URL is not set` | verp threw this itself, from `src/db/index.ts`. There is no `.env.local`, or the variable in it is empty. | `cp .env.example .env.local`, then paste your Neon connection string in. |
| ``No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?`` | The same problem, reported one layer down by the Neon driver. | Same fix. |
| ``Database connection string provided to `neon()` is not a valid URL.`` | You pasted something that is not a connection string — a `psql ...` command, a dashboard URL, or the placeholder from `.env.example` with the quotes mangled. | It must start with `postgresql://`. Neon shows the raw string under **Connection string** on the project dashboard. |
| `Error  Either connection "url" or "host", "database" are required for PostgreSQL database connection` | `npm run db:push` found neither `DIRECT_URL` nor `DATABASE_URL`. Drizzle Kit reads `.env.local`, so a `.env` file will not be seen. | Set both in `.env.local`. Neon gives you a pooled string and a direct one; `DATABASE_URL` is the pooled one, `DIRECT_URL` is the direct one. |
| `npm run db:push` prints a wall of `ErrorEvent { ... }` | A connection failure, buried. Search that output for `ENOTFOUND` or `ECONNREFUSED`. | `getaddrinfo ENOTFOUND host` means your connection string still has the literal word `host` in it from the template. Paste the real one. |
| `npm run build` fails with `DATABASE_URL is not set` | The build evaluates pages, and some of them touch the database layer. | Have `.env.local` in place before building. CI passes a deliberately fake connection string for this step, so the build never truly connects. |

### You cannot log in to verp

This one is not your fault and it is worth knowing before you lose an evening to it.

verp has no password login. `emailAndPassword` is disabled in `src/lib/auth.ts`, and the only button on the login page is **Sign in with VOSS**. Signing in therefore needs `VOSS_DISCOVERY_URL`, `VOSS_CLIENT_ID` and `VOSS_CLIENT_SECRET`, and the client ID and secret are issued by the VOSS identity server. They are not in `.env.example` because they cannot be — each one is registered individually.

If those are blank you get `Invalid OAuth configuration` when you click the button.

**Most good first issues do not need you to log in.** Component work, styling, dead links, pure-function tests and documentation all work against `npm run dev` with no session. If your issue genuinely needs a logged-in dashboard, say so in the issue thread and ask for a client ID.

If you do get in and land on `/unclaimed` instead of the dashboard, your account has no role. Add your email to `SUPER_ADMIN_EMAILS` in `.env.local`, restart the dev server, and sign in again.

---

## Running the project

| Symptom | What it means | Fix |
|---|---|---|
| `Port 3000 is in use by process 4821, using available port 3001 instead.` | Next did not fail — it quietly moved to another port. But `BETTER_AUTH_URL` in your `.env.local` says `http://localhost:3000`, and the OAuth redirect URI is built from it and must match exactly, so login breaks with no useful error. | Close the other dev server and restart on 3000. Do not carry on using 3001. |
| `listen tcp 0.0.0.0:2300: bind: address already in use` | vask is already running in another terminal. | Stop the other one with `Ctrl+C`, or run this one on a different port with `go run ./cmd/vask -port 2301`. |
| `permission denied (publickey)` when you `ssh` into vask | Your machine has no SSH key. vask uses your public key as your identity, so there is nothing to identify you with. | Generate one (below). Your private key never leaves your machine; vask only stores a hash of the public one. |

Generate an SSH key for vask, once per machine.

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
```

Start vask locally. It listens on port 2300 and creates its host key and local SQLite file in the folder on first run — both are gitignored.

```bash
make run
```

Connect to it from a second terminal.

```bash
ssh -p 2300 -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes localhost
```

---

## CI failed on my pull request

CI is a robot that re-runs the checks on GitHub. Red CI does not mean your code is bad; it usually means a formatter is unhappy about whitespace.

Click **Details** next to the red mark to see which step failed. verp runs four, in this order: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`.

| What CI printed | What it is | Does `npm run fix` handle it |
|---|---|---|
| `[warn] Code style issues found in the above file. Run Prettier with --write to fix.` | Formatting. Indentation, quotes, semicolons, line breaks. | **Yes.** This is the most common CI failure and it is fully automatic. |
| `'user' is assigned a value but never used  @typescript-eslint/no-unused-vars` | A lint finding. In verp's config this is a warning, so `npm run lint` still exits 0 and CI's lint step passes — but clean it up. | Partly. `--fix` handles the mechanical rules; unused variables you delete yourself. |
| `src/lib/sgpi.ts(41,7): error TS2322: Type 'string' is not assignable to type 'number'.` | A real type error. TypeScript found a bug. | **No.** Nothing auto-fixes this. Read the line it names and fix the type. |
| A failure on the **Build** step when `npm run check` was green locally | `npm run check` runs typecheck, lint and format check. It does **not** run the build. | No. Run the build yourself. |

Fix formatting and the auto-fixable lint findings in one go.

```bash
npm run fix
```

Confirm it is clean before pushing again.

```bash
npm run check
```

Reproduce the build step that `npm run check` skips.

```bash
npm run build
```

Then commit and push to the same branch. **Do not open a new pull request** — the existing one updates itself and CI runs again automatically.

For vask, the equivalent single command is `make fmt`, and it rewrites files in place, so run it before you commit rather than after.

```bash
make fmt && make vet && make test
```

---

## How to ask a good question

A vague question gets a vague answer, and then two more rounds of back-and-forth, and now it is tomorrow. Four things turn a question into something someone can answer in one reply.

**1. What you were trying to do.** One sentence. "Setting up verp for the first time" or "running the checks before opening PR #41."

**2. The exact command you ran.** Copy it from your terminal rather than typing it from memory. Half the time the answer is visible in the command itself.

**3. The exact error text, pasted as text.** Not a screenshot, and not a summary in your own words.

Screenshots cannot be searched, cannot be copied out of, cannot be read by someone on a phone, and cut off the part above the visible area — which is usually the part that matters. Select the text in your terminal, copy it, and paste it inside triple backticks so it stays readable:

````
```
paste the error here
```
````

**4. What you already tried.** "I reinstalled node_modules and checked that .env.local exists" saves someone from suggesting both of those.

It also helps to include your versions. This prints all three at once.

```bash
node --version && npm --version && git --version
```

Here is the whole thing as a template. Copy it, fill it in, delete the rest.

```
What I'm doing: setting up verp for the first time
Command: npm run db:push
Error:

Error  Either connection "url" or "host", "database" are required for PostgreSQL database connection

Already tried: copied .env.example to .env.local and pasted my Neon string into DATABASE_URL
node v24.9.0, npm 11.6.0, git 2.47.0
```

That question is answerable in one reply. "db push not working" is not.

---

## Where to ask

**First: the issue thread or pull request thread on GitHub.** Comment directly on the issue you are working on, or on your own PR.

Ask there even when a DM would be faster, and this is the reason: the thread is public and permanent. The next person who hits your error finds your question and the answer under it, and never has to ask. A DM helps exactly one person. A thread helps everyone who comes after you — that is how documents like this one get written.

**Then: DM Harshal on WhatsApp, if you are properly blocked.** Properly blocked means you cannot make progress on anything until it is resolved — not "this is annoying."

When you do, still bring the four things above. The template works in a DM exactly as well as it works on GitHub.

### How long is too long

**An hour is normal.** An hour of being stuck on a setup step is an ordinary evening in software, for everyone, permanently. It is worth asking about at that point, and nobody will think less of you for it. Ask.

**Three days in silence is not normal**, and it is the one thing that actually goes wrong here. It is not that anyone will be annoyed — it is that three silent days is almost always a five-minute answer nobody had a chance to give, and in the meantime you decided you were not cut out for this. You are; you were missing one line in a file.

**No question here is too basic.** Not "what is a terminal", not "what does `cd` do", not "which folder am I supposed to be in". Everyone in this lab had a first pull request, and everybody's first setup broke.

---

**Next:** [glossary.md](./glossary.md) — the words that keep coming up, explained plainly.
