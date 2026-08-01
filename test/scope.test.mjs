// The worst defect this repository has had lived in checkScope: a file added
// anywhere other than contributors/ returned skip, which produced a green check
// and no comment at all. On a repository with no human review, that is the only
// failure mode with zero feedback, and it looks exactly like success.
//
// Every case below was reproduced against the real script before it was fixed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { checkScope } from "../scripts/lib/scope.mjs";

const file = (filename, status = "added") => ({ filename, status });
const AUTHOR = "priya-k";

const titles = (r) => (r.problems || []).map((p) => p.title).join(" | ");

test("accepts the correct path", () => {
  const r = checkScope([file("contributors/priya-k.md")], AUTHOR);
  assert.equal(r.file.filename, "contributors/priya-k.md");
  assert.ok(!r.problems && !r.skip);
});

test("matches the path case-insensitively", () => {
  const r = checkScope([file("Contributors/Priya-K.md")], "priya-k");
  assert.ok(r.problems, "a differently-cased folder is not the contributors folder");
});

// The five silent-failure cases the review reproduced.
for (const path of [
  "priya-k.md", // Add file clicked from the repository root
  "Contributors/priya-k.md", // phone keyboard capitalised the folder
  "contributor/priya-k.md", // singular
  "contributers/priya-k.md", // misspelled
  "docs/priya-k.md", // wrong folder entirely
]) {
  test(`never stays silent about a file at ${path}`, () => {
    const r = checkScope([file(path)], AUTHOR);
    assert.ok(!r.skip, `${path} produced a silent skip -- green check, no comment`);
    assert.ok(r.problems?.length, `${path} produced no problem to report`);
    assert.match(titles(r), /contributors/i);
    assert.ok(r.problems[0].fix.includes(`contributors/${AUTHOR}.md`), "the fix must name the exact target path");
  });
}

test("an in-place edit of TEMPLATE.md is reported, not silently skipped", () => {
  const r = checkScope([file("contributors/TEMPLATE.md", "modified")], AUTHOR);
  assert.ok(!r.skip, "editing the template used to be invisible to both filters");
  assert.ok(r.problems?.length);
});

test("a template edit riding along with a valid file is blocked, not merged", () => {
  const r = checkScope([file("contributors/priya-k.md"), file("contributors/TEMPLATE.md", "modified")], AUTHOR);
  assert.ok(r.problems?.length, "this used to auto-merge and corrupt the template everyone copies");
  assert.ok(!r.file, "must not be treated as a clean contribution");
});

test("rejects a pull request that also changes unrelated files", () => {
  const r = checkScope([file("contributors/priya-k.md"), file("README.md", "modified")], AUTHOR);
  assert.ok(r.problems?.length);
  assert.match(titles(r), /outside/i);
});

test("rejects adding somebody else's file", () => {
  const r = checkScope([file("contributors/someone-else.md")], AUTHOR);
  assert.ok(r.problems?.length);
  assert.ok(r.problems[0].fix.includes(`contributors/${AUTHOR}.md`));
});

test("rejects adding two contributor files at once", () => {
  const r = checkScope([file("contributors/priya-k.md"), file("contributors/other.md")], AUTHOR);
  assert.ok(r.problems?.length);
});

test("rejects a deletion", () => {
  const r = checkScope([file("contributors/priya-k.md", "removed")], AUTHOR);
  assert.ok(r.problems?.length);
});

test("only a genuinely empty diff is allowed to be silent", () => {
  assert.equal(checkScope([], AUTHOR).skip, true);
});

test("every scope problem carries an actionable fix", () => {
  for (const files of [
    [file("priya-k.md")],
    [file("contributors/TEMPLATE.md", "modified")],
    [file("contributors/priya-k.md"), file("README.md", "modified")],
    [file("contributors/someone-else.md")],
  ]) {
    const r = checkScope(files, AUTHOR);
    for (const p of r.problems) {
      assert.ok(p.fix && p.fix.length > 30, `no useful fix for: ${p.title}`);
    }
  }
});
