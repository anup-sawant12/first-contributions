import { test } from "node:test";
import assert from "node:assert/strict";
import { MARKER, problemComment, successComment, mergeBlockedComment } from "../scripts/lib/comments.mjs";

const REPO = "voss-labs/first-contributions";

const contributor = {
  github: "harshalmore31",
  name: "Harshal More",
  year: "BE",
  branch: "EXCS",
  knows: ["git", "python", "dsa"],
  wants: "neural systems",
  body: "",
};

const problems = [{ title: "`year: FINAL` is not accepted.", fix: "Use one of: FE, SE, TE, BE." }];

const links = (body) => [...body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);

// GitHub does not rewrite relative links in pull request comments; it emits the
// bare href, which resolves against /OWNER/REPO/pull/N/ and 404s. Both comments
// are shown to people who are already stuck, so a dead link here is expensive.
for (const [name, body] of [
  ["problemComment", problemComment({ repo: REPO, author: "harshalmore31", problems })],
  ["successComment", successComment({ repo: REPO, contributor })],
]) {
  test(`${name} uses only absolute links`, () => {
    const found = links(body);
    assert.ok(found.length > 0, "expected at least one link");
    for (const href of found) {
      assert.ok(
        href.startsWith("https://"),
        `relative link "${href}" in ${name} would 404 from a pull request comment`,
      );
    }
  });

  test(`${name} points every link at this repository`, () => {
    for (const href of links(body)) {
      assert.ok(href.includes(REPO), `link "${href}" does not point at ${REPO}`);
    }
  });

  test(`${name} carries the marker so the bot edits instead of duplicating`, () => {
    assert.ok(body.startsWith(MARKER));
  });

  test(`${name} contains no emoji`, () => {
    assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(body));
  });
}

test("problemComment lists every problem with its fix", () => {
  const many = [
    { title: "First thing.", fix: "Fix the first thing." },
    { title: "Second thing.", fix: "Fix the second thing." },
  ];
  const body = problemComment({ repo: REPO, author: "someone", problems: many });
  for (const p of many) {
    assert.ok(body.includes(p.title), `missing title: ${p.title}`);
    assert.ok(body.includes(p.fix), `missing fix: ${p.fix}`);
  }
});

test("problemComment gives the contributor their own self-check command", () => {
  const body = problemComment({ repo: REPO, author: "priya-k", problems });
  assert.ok(body.includes("--file contributors/priya-k.md --author priya-k"));
});

test("problemComment never blames the contributor", () => {
  const body = problemComment({ repo: REPO, author: "someone", problems }).toLowerCase();
  for (const word in { invalid: 1, failed: 1, error: 1, rejected: 1 }) {
    assert.ok(!body.includes(word), `problem comment should not say "${word}"`);
  }
});

test("successComment greets by first name only", () => {
  const body = successComment({ repo: REPO, contributor });
  assert.ok(body.includes("Harshal."), "expected first-name greeting");
  assert.ok(!body.includes("Harshal More."), "should not use the full name");
});

test("successComment always suggests at least one repository", () => {
  for (const knows of [["none-yet"], ["go"], ["react"], ["dsa"]]) {
    const body = successComment({ repo: REPO, contributor: { ...contributor, knows } });
    assert.match(body, /^- \*\*/m, `no route rendered for ${knows.join(",")}`);
  }
});

test("mergeBlockedComment never asks the contributor to fix anything", () => {
  const body = mergeBlockedComment({ repo: REPO, contributor });
  assert.ok(body.startsWith(MARKER));
  assert.ok(body.includes("nothing for you to fix"), "must say it is not their problem");
  assert.ok(!body.toLowerCase().includes("merged."), "must not claim the merge happened");
  for (const href of links(body)) {
    assert.ok(href.startsWith("https://"), `relative link "${href}" would 404`);
  }
});

test("only successComment claims the pull request merged", () => {
  const merged = successComment({ repo: REPO, contributor });
  const blocked = mergeBlockedComment({ repo: REPO, contributor });
  const problem = problemComment({ repo: REPO, author: "someone", problems });
  assert.ok(merged.includes("Merged."));
  assert.ok(!blocked.includes("Merged."));
  assert.ok(!problem.includes("Merged."));
});
