// Validates a first-contributions pull request and merges it when it passes.
//
// Runs on pull_request_target, which means this process has write access to the
// repository while the pull request comes from an untrusted fork. It therefore
// never checks out, imports or executes anything from the pull request. It reads
// one markdown file through the API and nothing else.
//
// Local self-check (no network, no token):
//   node scripts/validate.mjs --file contributors/yourname.md --author yourname

import { readFileSync } from "node:fs";
import { validateContributor, routeFor } from "./lib/contributor.mjs";

// Identifies this bot's own comment so it edits that one instead of piling on a
// new comment every push. Deliberately contains no repository name: renaming the
// repo must not orphan comments already posted.
const MARKER = "<!-- voss-bot:contributor-check -->";
const DIR = "contributors/";
const TEMPLATE = "contributors/TEMPLATE.md";

const api = {
  token: process.env.GH_TOKEN,
  repo: process.env.GITHUB_REPOSITORY,
  pr: process.env.PR_NUMBER,
  author: process.env.PR_AUTHOR,
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function gh(path, options = {}) {
  return ghUrl(`https://api.github.com${path}`, options);
}

async function ghUrl(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${api.token}`,
      "x-github-api-version": "2022-11-28",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${options.method || "GET"} ${url} -> ${res.status}\n${body}`);
  }
  return res.status === 204 ? null : res.json();
}

// --- checks that run before we look inside the file ------------------------

function checkScope(files, author) {
  const touched = files.filter((f) => f.filename.startsWith(DIR) && f.filename !== TEMPLATE);
  const others = files.filter((f) => !f.filename.startsWith(DIR) && f.filename !== TEMPLATE);

  if (touched.length === 0) {
    return { skip: true };
  }

  if (others.length > 0) {
    return {
      problems: [
        {
          title: "This pull request changes files outside `contributors/`.",
          fix:
            `Your first contribution should add exactly one file: \`${DIR}${author}.md\`. ` +
            `Please open a separate pull request for ${others
              .slice(0, 5)
              .map((f) => `\`${f.filename}\``)
              .join(", ")}. Keeping them apart means this one can merge automatically.`,
        },
      ],
    };
  }

  if (touched.length > 1) {
    return {
      problems: [
        {
          title: `This pull request changes ${touched.length} files in \`contributors/\`.`,
          fix: `Add only your own file, \`${DIR}${author}.md\`. Remove the others from this branch and push again.`,
        },
      ],
    };
  }

  const file = touched[0];

  if (file.status !== "added" && file.status !== "modified") {
    return {
      problems: [
        {
          title: `The file was \`${file.status}\`, which this check does not allow.`,
          fix: "A first contribution adds your own file. It should not rename or delete anything.",
        },
      ],
    };
  }

  const expected = `${DIR}${author}.md`;
  if (file.filename.toLowerCase() !== expected.toLowerCase()) {
    return {
      problems: [
        {
          title: `The file is at \`${file.filename}\`, but it has to be at \`${expected}\`.`,
          fix:
            `The filename must match your GitHub username exactly. You opened this pull request as \`${author}\`, ` +
            `so rename the file to \`${expected}\` and push again. That is what keeps everyone's file separate ` +
            `so nobody ever hits a merge conflict here.`,
        },
      ],
    };
  }

  return { file };
}

// --- reading the file out of the fork, without trusting it -----------------

// contents_url already points at this file at the pull request's head commit,
// including forks, so there is no need to resolve a ref ourselves.
async function readPrFile(file) {
  try {
    const res = await ghUrl(file.contents_url);
    if (res?.content) return Buffer.from(res.content, "base64").toString("utf8");
  } catch {
    // A fork can be unreachable through the contents API; fall back to raw.
  }
  const raw = await fetch(file.raw_url);
  if (!raw.ok) throw new Error(`Could not read ${file.filename} (${raw.status})`);
  return raw.text();
}

// --- talking back to the contributor ---------------------------------------

function problemComment(problems) {
  const list = problems
    .map((p, i) => `**${i + 1}. ${p.title}**\n\n${p.fix}`)
    .join("\n\n");

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
    `node scripts/validate.mjs --file ${DIR}${api.author}.md --author ${api.author}`,
    "```",
    "",
    `Stuck for more than a few minutes? Say so right here in this thread, or read [when-youre-stuck.md](docs/when-youre-stuck.md).`,
  ].join("\n");
}

function successComment(contributor) {
  const routes = routeFor(contributor.knows)
    .map((r) => `- **${r.repo}** — ${r.why}`)
    .join("\n");

  return [
    MARKER,
    `### Merged. You are a VOSS contributor, ${contributor.name.split(" ")[0]}.`,
    "",
    "Your name is on [CONTRIBUTORS.md](../blob/main/CONTRIBUTORS.md) now, and that took a real fork, a real branch and a real pull request. That is the same loop every change to every VOSS project goes through.",
    "",
    "**Where to go next, based on what you told us you know:**",
    "",
    routes,
    "",
    "Read [pick-an-issue.md](docs/pick-an-issue.md), find an issue, and comment `I'd like to work on this` before you start writing code. Then [setup-a-voss-project.md](docs/setup-a-voss-project.md) gets the project running on your machine.",
    "",
    "Welcome in.",
  ].join("\n");
}

async function upsertComment(body) {
  const comments = await gh(`/repos/${api.repo}/issues/${api.pr}/comments?per_page=100`);
  const mine = comments.find((c) => c.body?.includes(MARKER));
  if (mine) {
    await gh(`/repos/${api.repo}/issues/comments/${mine.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
  } else {
    await gh(`/repos/${api.repo}/issues/${api.pr}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }
}

// --- entry points -----------------------------------------------------------

async function runLocal(args) {
  const file = args[args.indexOf("--file") + 1];
  const author = args.includes("--author") ? args[args.indexOf("--author") + 1] : "";
  if (!file) fail("Usage: node scripts/validate.mjs --file contributors/<username>.md --author <username>");

  const result = validateContributor(readFileSync(file, "utf8"), author);
  if (result.ok) {
    console.log(`OK. ${file} is valid.`);
    console.log(`Suggested repos: ${routeFor(result.contributor.knows).map((r) => r.repo).join(", ")}`);
    return;
  }
  console.error("Not valid yet:\n");
  for (const [i, p] of result.problems.entries()) {
    console.error(`${i + 1}. ${p.title}\n   ${p.fix}\n`);
  }
  process.exit(1);
}

async function runCi() {
  for (const [key, value] of Object.entries(api)) {
    if (!value) fail(`Missing required environment value: ${key}`);
  }

  const files = await gh(`/repos/${api.repo}/pulls/${api.pr}/files?per_page=100`);
  const scope = checkScope(files, api.author);

  if (scope.skip) {
    console.log("No contributor file in this pull request. Leaving it for a maintainer to review.");
    return;
  }

  let problems = scope.problems;

  if (!problems) {
    const text = await readPrFile(scope.file);
    const result = validateContributor(text, api.author);
    if (result.ok) {
      await upsertComment(successComment(result.contributor));
      await gh(`/repos/${api.repo}/pulls/${api.pr}/merge`, {
        method: "PUT",
        body: JSON.stringify({
          merge_method: "squash",
          commit_title: `feat: add ${result.contributor.github} to contributors (#${api.pr})`,
        }),
      });
      console.log(`Merged ${api.author}.`);
      return;
    }
    problems = result.problems;
  }

  await upsertComment(problemComment(problems));
  fail(`${problems.length} problem(s) found. Comment posted on #${api.pr}.`);
}

const args = process.argv.slice(2);
await (args.includes("--file") ? runLocal(args) : runCi());
