# Git and GitHub, From Zero

This is for you if you have never used git, never used GitHub, and possibly never used a terminal. Read it in order. By the end you will have git installed, an authenticated connection to GitHub, and the exact sequence of commands that every VOSS contribution goes through.

Nothing here can break anything. You are working on your own copy of the code until a maintainer decides otherwise.

---

## What GitHub is

GitHub is a website that stores code projects and keeps a permanent record of every change anyone has ever made to them. VOSS Labs keeps all of its code there under an organisation account called `voss-labs`, so the college ERP lives at `https://github.com/voss-labs/verp` and the identity server lives at `https://github.com/voss-labs/vauth`. It is also where the talking happens: issues describe work that needs doing, and pull requests are where code gets read and argued about before it is accepted. You need a free account at `https://github.com/signup` before anything else in this document will work.

## What a repository is

A repository, usually shortened to repo, is one project: all of its files, all of its folders, and its entire history of changes. `voss-labs/verp` is a repo, and it holds both the current Next.js code for the ERP and the record of every change that produced it. When you copy a repo onto your laptop you get every file *and* the full history, not a snapshot of the latest version. VOSS has five public code repos — `verp`, `vauth`, `vask`, `vosslabs.org` and `vboard` — plus a `.github` repo that holds the organisation's profile page.

## What a fork is

A fork is your own copy of someone else's repo, stored under your own GitHub account. You cannot push code directly into `voss-labs/verp`, because you do not have write access to it, and almost nobody does. So you fork it, which gives you `YOUR-USERNAME/verp` — a repo you own outright and can push to as often as you like, including badly. Your fork starts out identical to the original and then drifts, as you add work to it and as the original moves on without you.

## What a branch is

A branch is a named line of work inside a repo. Every VOSS repo has a branch called `main`, which holds the accepted, working version of the code, and which you never commit to directly. When you start a change you make a new branch off `main` — VOSS names them by type, like `fix/dead-sidebar-links` or `feat/department-crud` — and all of your work happens on that branch while `main` stays untouched. One branch per issue: if you fix two unrelated things on one branch they have to be reviewed and merged as one lump, which is why VOSS asks for one issue per pull request.

## What a commit is

A commit is one saved change to the repo, with a message explaining it. It records which lines in which files changed, who changed them, and when. VOSS writes commit messages in the form `type(scope): summary`, for example `fix(sidebar): remove links to pages that do not exist`, and the longer ones explain what was rejected and why, not only what was done. Commits are local and cheap: nothing you commit is visible to anyone else until you push it.

## What a pull request is

A pull request, or PR, is a request that VOSS pull the work on your branch into their `main`. In practice it is a page on GitHub that shows exactly which lines you changed, with a comment thread running alongside them. A maintainer reads it, either asks for changes or approves it, and then merges it — VOSS squashes each PR down to a single commit on `main`, so your whole branch becomes one entry in the history. Until someone with merge access clicks that button, your PR is only a proposal, so there is no way for you to break the VOSS repo by opening one.

---

## Installing git

### macOS

First check whether you already have it, because macOS often does. If git is missing, running this pops up a dialog offering to install Apple's Command Line Tools; accept it and wait.

```bash
git --version
```

If no dialog appears and the command is not found, trigger the installer directly.

```bash
xcode-select --install
```

If you use Homebrew and want a newer git than Apple ships, install it that way instead.

```bash
brew install git
```

### Windows

Download the installer from `https://git-scm.com/download/win`, run it, and accept every default. That gives you both `git` and a terminal called Git Bash, which you will find in the Start menu. Use Git Bash, or WSL, rather than PowerShell: the plain `git` commands work anywhere, but some commands in these docs are Unix-only and will fail in PowerShell.

If you would rather install from a terminal, use winget, which ships with Windows 10 and 11.

```powershell
winget install --id Git.Git -e --source winget
```

After installing, close and reopen your terminal. A terminal that was already open will not know that git exists.

### Linux

On Debian or Ubuntu:

```bash
sudo apt update && sudo apt install git
```

On Fedora:

```bash
sudo dnf install git
```

On Arch:

```bash
sudo pacman -S git
```

### The two one-time config commands

Git stamps your name and email onto every commit you make. It refuses to commit at all until you set them, with the error `Please tell me who you are`. Run both of these once, ever, on each machine you use.

Set the name that will appear as the author of your commits.

```bash
git config --global user.name "Your Name"
```

Set the email that GitHub uses to link commits to your account.

```bash
git config --global user.email "you@example.com"
```

Check that both took effect.

```bash
git config --global --list
```

**The email matters more than it looks.** GitHub decides who wrote a commit by matching this email against the emails registered on GitHub accounts. If it does not match an email on your account, your commit shows up with a generic grey avatar, it is not linked to your profile, and it does not appear in your contribution graph — the PR still merges, but you get no credit for it. If you have already made commits with the wrong email, the fix is not to rewrite history: go to `https://github.com/settings/emails`, add that address to your account, and GitHub retroactively attributes the old commits to you.

If you do not want your real address visible in a public repo, use the noreply address GitHub gives you. It is shown on that same settings page and looks like `1234567+YOUR-USERNAME@users.noreply.github.com`. Put that in `user.email` instead. Related trap: if you turn on **Block command line pushes that expose my email** on that page and your git email is still your real private address, GitHub rejects your push with `GH007: Your push would publish a private email address`. Switching `user.email` to the noreply address clears it.

---

## Authenticating with GitHub

The first time you push code, git asks for a username and a password. **Your GitHub account password will not work.** GitHub stopped accepting passwords for git operations on 13 August 2021. If you see this, that is what happened:

```
remote: Support for password authentication was removed on August 13, 2021.
```

This is the single most common place beginners get stuck, and no amount of retyping the password fixes it. You need a token instead. There are two ways to get one.

### The easier path: the GitHub CLI

The GitHub CLI is a separate program called `gh`. It does the token handling for you and then tells git to reuse it, so you never type a credential again.

Install it on macOS:

```bash
brew install gh
```

Install it on Windows:

```powershell
winget install --id GitHub.cli
```

Install it on Debian or Ubuntu. This is one single command copied from GitHub's official instructions — copy the whole block, backslashes included, and paste it as one line of input.

```bash
(type -p wget >/dev/null || (sudo apt update && sudo apt install wget -y)) \
	&& sudo mkdir -p -m 755 /etc/apt/keyrings \
	&& out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
	&& cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
	&& sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
	&& sudo mkdir -p -m 755 /etc/apt/sources.list.d \
	&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
	&& sudo apt update \
	&& sudo apt install gh -y
```

Install it on Fedora:

```bash
sudo dnf install dnf5-plugins && sudo dnf config-manager addrepo --from-repofile=https://cli.github.com/packages/rpm/gh-cli.repo && sudo dnf install gh
```

Install it on Arch:

```bash
sudo pacman -S github-cli
```

Now log in. This is interactive and asks you four things.

```bash
gh auth login
```

Answer them in this order:

| Prompt | Answer |
|---|---|
| What account do you want to log into? | **GitHub.com** |
| What is your preferred protocol for Git operations? | **HTTPS** |
| Authenticate Git with your GitHub credentials? | **Yes** |
| How would you like to authenticate GitHub CLI? | **Login with a web browser** |

It then prints a one-time code like `A1B2-C3D4`. Copy it, press Enter, and your browser opens a GitHub page asking for that code. Paste it, click through the authorisation, and return to the terminal.

Answering **Yes** to the third question is the part that matters — that is what makes git stop asking for passwords. Confirm the whole thing worked:

```bash
gh auth status
```

If `gh auth status` looks fine but `git push` still prompts you for a password, git was never wired up to `gh`. Fix it with one command.

```bash
gh auth setup-git
```

### The other path: HTTPS plus a personal access token

If you do not want to install another tool, generate a token on the GitHub website and use it in place of a password.

Go to `https://github.com/settings/personal-access-tokens` and click **Generate new token**. Then:

1. Give it a name and an expiry date. Do not pick "no expiration" out of laziness; pick something and note it down, because when it expires your pushes start failing with `403` for no visible reason.
2. Leave **Resource owner** set to your own account. If you set it to `voss-labs`, the token needs organisation approval that you will not get, and it will not work.
3. Under **Repository access**, choose **Only select repositories** and pick your fork.
4. Under **Permissions -> Repository permissions**, set **Contents** to **Read and write**. That is the one permission that pushing needs. Metadata read-only is added automatically.
5. Click generate, then copy the token immediately. GitHub shows it exactly once and never again.

Now when git prompts you, enter your GitHub username as the username and paste the token as the password. The terminal will not show anything as you paste — that is normal, not a frozen terminal.

One quirk worth knowing: a fine-grained token cannot write to a public repo that you do not own. That sounds like it blocks this whole workflow, but it does not — you push to *your fork*, which you do own. If you prefer a classic token instead, generate it at `https://github.com/settings/tokens` and tick the `repo` scope.

To avoid pasting the token on every push, tell git to remember it. On macOS:

```bash
git config --global credential.helper osxkeychain
```

On Windows, the Git for Windows installer already sets up Git Credential Manager, which stores it for you in Windows Credential Manager. You do not need to do anything.

On Linux there is no equally good default. This one works but writes your token in plain text to `~/.git-credentials`, so use it only on a machine that is yours alone:

```bash
git config --global credential.helper store
```

If that trade-off bothers you, use the GitHub CLI path instead. On Linux it is the better option.

---

## The eight steps of every contribution

This is the loop. You will run it for your first PR and for every one after that. The example is `voss-labs/verp`; substitute any VOSS repo and replace `YOUR-USERNAME` with your own GitHub username throughout.

### 1. Fork the repo, on the web

Open `https://github.com/voss-labs/verp` in a browser and click **Fork** at the top right. On the screen that follows, leave everything at its defaults and click **Create fork**. After a few seconds you land on `https://github.com/YOUR-USERNAME/verp`, which is your copy. There is no terminal command for this step; the fork has to be created on GitHub's side.

### 2. Clone your fork

Cloning downloads your fork onto your laptop. Note the username in the URL — it is **yours**, not `voss-labs`.

```bash
git clone https://github.com/YOUR-USERNAME/verp.git
```

Move into the folder it created.

```bash
cd verp
```

This is the most common wrong turn in the entire workflow: cloning `https://github.com/voss-labs/verp.git` instead of your fork. Everything looks fine until you push, which fails with `403 Permission denied`. Check what you actually cloned:

```bash
git remote -v
```

If `origin` points at `voss-labs`, repoint it rather than starting over.

```bash
git remote set-url origin https://github.com/YOUR-USERNAME/verp.git
```

### 3. Add the original repo as `upstream`

Your clone knows about your fork and nothing else. Adding the VOSS repo under the name `upstream` is what lets you pull in changes that happen after you forked.

```bash
git remote add upstream https://github.com/voss-labs/verp.git
```

You now have two remotes with two different jobs, permanently:

| Remote | Points at | You use it to |
|---|---|---|
| `origin` | `YOUR-USERNAME/verp` | push your work |
| `upstream` | `voss-labs/verp` | fetch other people's work |

You never push to `upstream`. You do not have permission to, and if you somehow did, you would be skipping review.

If you have the GitHub CLI, `gh repo fork voss-labs/verp --clone` does steps 1 through 3 in one command. Run `git remote -v` afterwards to see what you got, and add `upstream` by hand if it is not there.

### 4. Create a branch

Branch off `main`, and name the branch after the work. VOSS uses typed prefixes: `fix/` for bug fixes, `feat/` for new functionality, `chore/` for housekeeping.

```bash
git checkout -b fix/dead-sidebar-links
```

The `-b` means "make this branch and switch to it". Without `-b`, git expects the branch to already exist. Confirm which branch you are on at any time with `git status`, whose first line tells you.

### 5. Stage the files you changed

Edit files in your editor as normal, then tell git which changes belong in the next commit.

```bash
git add src/components/app-sidebar.tsx
```

You will see `git add .` used everywhere online. It stages every changed file that is not ignored, which sooner or later includes a file you were experimenting with and did not mean to send. Name your files, or at minimum look at what is staged before committing:

```bash
git status
```

### 6. Commit

A commit needs a message. Use the `type(scope): summary` form, describe the change, and keep it in the present tense.

```bash
git commit -m "fix(sidebar): remove links to pages that do not exist"
```

If you leave off `-m "..."`, git opens a text editor to ask for the message, and on many systems that editor is vim, which is not obvious to escape. If you land in it by accident: press `Esc`, type `:q!`, press Enter, and run the command again with `-m`.

### 7. Push your branch to your fork

This uploads the branch to your fork on GitHub. The `-u` links your local branch to the remote one, so every later push on this branch is a bare `git push`.

```bash
git push -u origin fix/dead-sidebar-links
```

Git prints a URL ending in `/pull/new/fix/dead-sidebar-links` when it finishes. That link goes straight to the PR form, which makes the next step one click.

### 8. Open the pull request, on the web

Open your fork at `https://github.com/YOUR-USERNAME/verp`. A banner appears near the top offering **Compare & pull request** — click it. Before writing anything, check the four fields along the top of the form: base repository should be `voss-labs/verp`, base should be `main`, head repository should be `YOUR-USERNAME/verp`, and compare should be your branch. If base repository says your own username, you are about to open a PR against yourself, and no maintainer will ever see it.

`verp` fills the description box from `.github/pull_request_template.md`, which asks for four things — **What**, **Why**, **How**, **Testing** — and has two checkboxes: `npm run check` passes, and tested locally. Fill them in honestly. Writing `Closes #7` in the body links the PR to issue 7 and closes that issue automatically when the PR is merged.

Click **Create pull request**. You are done. If a reviewer asks for changes, do not open a new PR: commit and push to the same branch, and the PR updates itself.

---

## A warning about verp's own setup docs

`verp`'s `README.md`, `CONTRIBUTING.md` and `onboarding.md` are out of date, and following them costs you an evening. Specifically:

- **`npm run setup` does not exist.** It was removed on 15 July 2026. Nothing replaced it; you set up the environment by hand.
- **`npm run db:migrate` does not exist.** The database schema is applied with `npm run db:push`, and there is no migrations directory.
- The README says Node 18 in one place; `package.json` requires **Node 20 or newer**.
- `SUPER_ADMIN_EMAILS` is missing from `.env.example` but is read by `src/lib/session.ts`. It is the only way to become an admin — no seed data grants it. Add the line to your `.env.local` by hand, comma-separated, and use the email you sign in with.

The real commands, from `package.json`, are `dev`, `build`, `start`, `lint`, `lint:fix`, `typecheck`, `format`, `format:check`, `check`, `fix`, `db:push`, `db:generate` and `db:studio`. Run `npm run check` before every PR — it runs typecheck, lint and format check, and CI fails your PR if it does not pass.

Fixing those stale docs is itself a genuinely useful pull request, and a good first one.

---

## Keeping your fork up to date

### Why this matters

Your fork froze at the moment you created it. `voss-labs/verp` did not. Every PR that gets merged upstream moves `main` forward while your copy stays where it was, and your branch was cut from the old `main`.

For a day or two that is harmless. After a couple of weeks, someone else has probably edited the same files you are editing, and git can no longer work out how to combine the two versions. That is a merge conflict, and GitHub will put `This branch has conflicts that must be resolved` on your PR and refuse to merge it until you sort it out. Conflicts are not hard, but they scale with how stale you are, so the fix is to sync often rather than to get good at resolving them.

Do this before you create a branch, and again before you open the PR.

### The four commands

Download everything new from the VOSS repo. This changes nothing in your working files; it only fetches.

```bash
git fetch upstream
```

Switch to your local `main` branch.

```bash
git checkout main
```

Move your `main` forward to match VOSS's `main`.

```bash
git merge upstream/main
```

Push the updated `main` to your fork on GitHub, so your fork matches too.

```bash
git push origin main
```

That last merge should say `Fast-forward`. If it does not, you have committed something to your local `main`, which is the one thing the VOSS rules ask you not to do. Ask in the issue thread before trying to unpick it.

### Then update the branch you are working on

Syncing `main` does not touch your feature branch. Switch back to it:

```bash
git checkout fix/dead-sidebar-links
```

And bring the new `main` into it:

```bash
git merge main
```

If a conflict appears, git names the files it could not merge. Open each one and you will find your version and theirs marked out like this:

```
<<<<<<< HEAD
your version of the line
=======
their version of the line
>>>>>>> main
```

Edit the file until it reads the way it should, delete all three marker lines, then stage and commit it.

```bash
git add src/components/app-sidebar.tsx
```

```bash
git commit
```

### Two shortcuts

On the GitHub page for your fork there is a **Sync fork** dropdown above the file list; clicking **Update branch** in it does the same thing as the four commands, for the default branch. You still have to `git pull` afterwards to bring the change down to your laptop.

With the GitHub CLI, one command syncs your local repo from the parent:

```bash
gh repo sync
```

---

## Commands you will actually use

| Command | What it does |
|---|---|
| `git --version` | Check that git is installed |
| `git config --global user.name "Your Name"` | Set the name on your commits, once per machine |
| `git config --global user.email "you@example.com"` | Set the email that links commits to your GitHub account |
| `gh auth login` | Log in to GitHub and let git reuse the credentials |
| `gh auth status` | Check that you are still logged in |
| `git clone <url>` | Download a repo onto your laptop |
| `git remote -v` | Show which repos `origin` and `upstream` point at |
| `git remote add upstream <url>` | Register the original VOSS repo as `upstream` |
| `git status` | Show your branch, your changed files and what is staged |
| `git checkout main` | Switch to the `main` branch |
| `git checkout -b fix/thing` | Create a branch and switch to it |
| `git diff` | Show the changes you have made but not staged |
| `git add <file>` | Stage a file for the next commit |
| `git commit -m "type(scope): summary"` | Save the staged changes with a message |
| `git push -u origin fix/thing` | Upload a new branch to your fork |
| `git push` | Upload later commits on a branch already pushed once |
| `git fetch upstream` | Download new work from the VOSS repo |
| `git merge upstream/main` | Move your `main` up to match VOSS's `main` |
| `git log --oneline` | List recent commits, one per line |
| `gh repo sync` | Sync your local repo from the parent repo |

---

**Next:** [pick-an-issue.md](./pick-an-issue.md) — finding something to work on and claiming it before you write code.
