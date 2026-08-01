// The two comments the bot posts on a pull request.
//
// Pure: they take everything they need as arguments and return a string, so they
// can be tested without a network. Kept out of validate.mjs because that module
// runs on import.
//
// Every link here MUST be absolute. GitHub does not rewrite relative links in
// issue and pull request comments -- it emits the bare href, which the browser
// then resolves against the comment's own URL. A link written as
// `docs/when-youre-stuck.md` on pull request 1 resolves to
// `/OWNER/REPO/pull/docs/when-youre-stuck.md` and 404s. That is a broken help
// link inside the message shown to someone who is already stuck, which is the
// worst possible place to put one. There is a test asserting no relative links.

import { routeFor } from "./contributor.mjs";

export const MARKER = "<!-- voss-bot:contributor-check -->";

const url = (repo, path) => `https://github.com/${repo}/blob/main/${path}`;

export function problemComment({ repo, author, problems }) {
  const list = problems.map((p, i) => `**${i + 1}. ${p.title}**\n\n${p.fix}`).join("\n\n");

  return [
    MARKER,
    "### Not quite there yet",
    "",
    "Nothing is broken and you have not done anything wrong. Here is exactly what to change:",
    "",
    list,
    "",
    "---",
    "",
    "Fix it on your branch, commit, and push. This check runs again by itself and merges you in the moment it passes. You do not need to close this pull request or open a new one.",
    "",
    "You can also check your file before pushing:",
    "",
    "```",
    `node scripts/validate.mjs --file contributors/${author}.md --author ${author}`,
    "```",
    "",
    `Stuck for more than a few minutes? Say so right here in this thread, or read [when-youre-stuck.md](${url(repo, "docs/when-youre-stuck.md")}).`,
  ].join("\n");
}

// Posted when the file is perfect but the merge call itself failed. The
// contributor must never be left with a red X and no explanation, and must never
// be told to fix something that is not theirs to fix.
export function mergeBlockedComment({ repo, contributor }) {
  return [
    MARKER,
    `### Your file is correct, ${contributor.name.split(" ")[0]}. This one is on us.`,
    "",
    "Every check passed. The bot could not complete the merge itself because of a permissions setting on our side, so a maintainer will merge this by hand shortly.",
    "",
    "**There is nothing for you to fix and nothing for you to do.** Do not close this or open another one. Your contribution counts from the moment it merges, and it will.",
    "",
    `While you wait, [pick-an-issue.md](${url(repo, "docs/pick-an-issue.md")}) is worth a read.`,
  ].join("\n");
}

export function successComment({ repo, contributor }) {
  const routes = routeFor(contributor.knows)
    .map((r) => `- **${r.repo}** — ${r.why}`)
    .join("\n");

  return [
    MARKER,
    `### Merged. You are a VOSS contributor, ${contributor.name.split(" ")[0]}.`,
    "",
    `Your name is on [CONTRIBUTORS.md](${url(repo, "CONTRIBUTORS.md")}) now, and that took a real fork, a real branch and a real pull request. That is the same loop every change to every VOSS project goes through.`,
    "",
    "**Where to go next, based on what you told us you know:**",
    "",
    routes,
    "",
    `Read [pick-an-issue.md](${url(repo, "docs/pick-an-issue.md")}), find an issue, and comment \`I'd like to work on this\` before you start writing code. Then [setup-a-voss-project.md](${url(repo, "docs/setup-a-voss-project.md")}) gets the project running on your machine.`,
    "",
    "Welcome in.",
  ].join("\n");
}
