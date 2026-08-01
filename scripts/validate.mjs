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
import { checkScope, DIR } from "./lib/scope.mjs";
import { MARKER, problemComment, successComment, mergeBlockedComment } from "./lib/comments.mjs";


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

  const pr = await gh(`/repos/${api.repo}/pulls/${api.pr}`);
  const files = await gh(`/repos/${api.repo}/pulls/${api.pr}/files?per_page=100`);
  const scope = checkScope(files, api.author);

  if (scope.skip) {
    console.log("This pull request changes nothing. Leaving it for a maintainer.");
    return;
  }

  // A draft pull request cannot be merged, and GitHub returns 405 rather than a
  // permissions error. Without this the contributor was told the failure was
  // ours and to sit tight -- and marking it Ready for review is in the trigger
  // list below, so the check re-runs the moment they do.
  if (pr.draft) {
    await upsertComment(
      problemComment({
        repo: api.repo,
        author: api.author,
        problems: [
          {
            title: "This pull request is still a draft, so it cannot be merged yet.",
            fix: "Scroll to the bottom of the pull request and press **Ready for review**. Nothing else needs to change -- this check runs again by itself the moment you do.",
          },
        ],
      }),
    );
    fail(`#${api.pr} is a draft.`);
  }

  let problems = scope.problems;

  if (!problems) {
    const text = await readPrFile(scope.file);
    const result = validateContributor(text, api.author);
    if (result.ok) {
      // Merge first, comment second. The other order once told a contributor
      // "Merged. You are a VOSS contributor" on a pull request that then failed
      // to merge and sat open with a red X. A comment claiming something that
      // did not happen is worse than no comment at all.
      try {
        await gh(`/repos/${api.repo}/pulls/${api.pr}/merge`, {
          method: "PUT",
          body: JSON.stringify({
            merge_method: "squash",
            // Pin the merge to the exact commit that was validated. Without
            // this, a push landing between the check and the merge would be
            // merged without ever being looked at.
            sha: pr.head.sha,
            commit_title: `feat: add ${result.contributor.github} to contributors (#${api.pr})`,
          }),
        });
      } catch (error) {
        // Two students merging seconds apart makes GitHub reject the second with
        // "Base branch was modified". That is a race, not a problem with their
        // file, so retry once before telling anyone anything.
        const raced = /Base branch was modified/i.test(error.message);
        if (raced) {
          await new Promise((r) => setTimeout(r, 4000));
          try {
            await gh(`/repos/${api.repo}/pulls/${api.pr}/merge`, {
              method: "PUT",
              body: JSON.stringify({
                merge_method: "squash",
                sha: pr.head.sha,
                commit_title: `feat: add ${result.contributor.github} to contributors (#${api.pr})`,
              }),
            });
            await upsertComment(successComment({ repo: api.repo, contributor: result.contributor }));
            console.log(`Merged ${api.author} on retry after a base-branch race.`);
            return;
          } catch (retryError) {
            error.message += `\nRetry also failed: ${retryError.message}`;
          }
        }
        // The file is fine; only our side failed. Say exactly that, and never
        // ask the contributor to fix something that is not theirs to fix.
        await upsertComment(mergeBlockedComment({ repo: api.repo, contributor: result.contributor }));
        fail(`Validation passed but the merge failed. A maintainer must merge #${api.pr} by hand.\n${error.message}`);
      }
      await upsertComment(successComment({ repo: api.repo, contributor: result.contributor }));
      console.log(`Merged ${api.author}.`);
      return;
    }
    problems = result.problems;
  }

  await upsertComment(problemComment({ repo: api.repo, author: api.author, problems }));
  fail(`${problems.length} problem(s) found. Comment posted on #${api.pr}.`);
}

const args = process.argv.slice(2);

if (args.includes("--file")) {
  await runLocal(args);
} else {
  // A contributor must never be left with a red X and no explanation. Any error
  // that reaches here -- a GitHub outage, a rate limit, a bug of ours -- is not
  // something they can act on, so say so plainly rather than letting the job die
  // with a stack trace only a maintainer will ever read.
  try {
    await runCi();
  } catch (error) {
    console.error(error);
    try {
      await upsertComment(
        [
          MARKER,
          "### Something broke on our side",
          "",
          "This is not your fault and there is nothing in your file to fix. Our check hit an unexpected error before it could finish, so a maintainer will take a look and merge you in by hand.",
          "",
          "Leave this pull request open. You do not need to do anything.",
        ].join("\n"),
      );
    } catch {
      console.error("Could not post the failure comment either.");
    }
    process.exit(1);
  }
}
