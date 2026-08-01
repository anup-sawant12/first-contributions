import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContributor, routeFor } from "../scripts/lib/contributor.mjs";

const good = `---
github: harshalmore31
name: Harshal More
year: TE
branch: EXCS
knows: [git, python]
wants: distributed systems
---

Third year, want to work on databases.
`;

const titles = (result) => result.problems.map((p) => p.title).join(" | ");

test("accepts a well-formed file", () => {
  const result = validateContributor(good, "harshalmore31");
  assert.equal(result.ok, true);
  assert.deepEqual(result.contributor.knows, ["git", "python"]);
  assert.equal(result.contributor.year, "TE");
  assert.equal(result.contributor.name, "Harshal More");
  assert.equal(result.contributor.body, "Third year, want to work on databases.");
});

test("matches the username case-insensitively", () => {
  assert.equal(validateContributor(good, "HarshalMore31").ok, true);
});

test("tolerates a leading @ on the github field", () => {
  const result = validateContributor(good.replace("github: harshalmore31", "github: @harshalmore31"), "harshalmore31");
  assert.equal(result.ok, true);
  assert.equal(result.contributor.github, "harshalmore31");
});

test("accepts the block list form as well as the inline form", () => {
  const block = good.replace("knows: [git, python]", "knows:\n  - git\n  - python");
  const result = validateContributor(block, "harshalmore31");
  assert.equal(result.ok, true);
  assert.deepEqual(result.contributor.knows, ["git", "python"]);
});

test("survives CRLF line endings and a UTF-8 BOM", () => {
  const messy = "﻿" + good.replace(/\n/g, "\r\n");
  assert.equal(validateContributor(messy, "harshalmore31").ok, true);
});

test("ignores comment lines inside the frontmatter", () => {
  const commented = good.replace("github: harshalmore31", "# who you are\ngithub: harshalmore31");
  assert.equal(validateContributor(commented, "harshalmore31").ok, true);
});

test("strips surrounding quotes from values", () => {
  const quoted = good.replace("name: Harshal More", 'name: "Harshal More"');
  assert.equal(validateContributor(quoted, "harshalmore31").contributor.name, "Harshal More");
});

test("rejects a file with no opening fence", () => {
  const result = validateContributor("github: harshalmore31\n", "harshalmore31");
  assert.equal(result.ok, false);
  assert.match(titles(result), /does not start with/);
});

test("rejects an unclosed frontmatter block", () => {
  const result = validateContributor("---\ngithub: harshalmore31\n", "harshalmore31");
  assert.equal(result.ok, false);
  assert.match(titles(result), /never closed/);
});

test("rejects a frontmatter line with no colon", () => {
  const result = validateContributor(good.replace("year: TE", "year TE"), "harshalmore31");
  assert.equal(result.ok, false);
  assert.match(titles(result), /not a `key: value` pair/);
});

test("reports every missing required field, not just the first", () => {
  const result = validateContributor("---\ngithub: harshalmore31\n---\n", "harshalmore31");
  assert.equal(result.ok, false);
  for (const field of ["name", "year", "branch", "knows"]) {
    assert.match(titles(result), new RegExp(`\`${field}\``));
  }
});

test("rejects a username that does not match the pull request author", () => {
  const result = validateContributor(good, "someone-elses-account");
  assert.equal(result.ok, false);
  assert.match(titles(result), /but you opened this pull request as/);
});

test("rejects a year outside FE/SE/TE/BE", () => {
  const result = validateContributor(good.replace("year: TE", "year: 3rd"), "harshalmore31");
  assert.equal(result.ok, false);
  assert.match(titles(result), /not one of the accepted values/);
});

test("accepts a lowercase year and normalises it", () => {
  const result = validateContributor(good.replace("year: TE", "year: te"), "harshalmore31");
  assert.equal(result.ok, true);
  assert.equal(result.contributor.year, "TE");
});

test("rejects a skill that is not in the vocabulary", () => {
  const result = validateContributor(good.replace("[git, python]", "[git, rust]"), "harshalmore31");
  assert.equal(result.ok, false);
  assert.match(titles(result), /`rust`/);
});

test("rejects knows given as a bare value instead of a list", () => {
  const result = validateContributor(good.replace("knows: [git, python]", "knows: python"), "harshalmore31");
  assert.equal(result.ok, false);
  assert.match(titles(result), /has to be a list/);
});

test("accepts none-yet as a complete answer", () => {
  const result = validateContributor(good.replace("[git, python]", "[none-yet]"), "harshalmore31");
  assert.equal(result.ok, true);
});

test("treats wants as optional", () => {
  const result = validateContributor(good.replace("wants: distributed systems\n", ""), "harshalmore31");
  assert.equal(result.ok, true);
  assert.equal(result.contributor.wants, "");
});

test("rejects an oversized file", () => {
  const result = validateContributor(good + "x".repeat(5000), "harshalmore31");
  assert.equal(result.ok, false);
  assert.match(titles(result), /larger than/);
});

test("every problem carries a fix, not just a complaint", () => {
  const result = validateContributor("---\n---\n", "harshalmore31");
  assert.equal(result.ok, false);
  for (const problem of result.problems) {
    assert.ok(problem.fix && problem.fix.length > 20, `no useful fix for: ${problem.title}`);
  }
});

test("routes web skills to the app repos", () => {
  const repos = routeFor(["git", "react"]).map((r) => r.repo);
  assert.deepEqual(repos, ["verp", "vboard"]);
});

test("routes Go to vask", () => {
  assert.ok(routeFor(["go"]).some((r) => r.repo === "vask"));
});

test("routes non-web programmers to the untested pure functions", () => {
  const repos = routeFor(["dsa", "python"]).map((r) => r.repo);
  assert.ok(repos.includes("verp (tests)"), `got ${repos.join(", ")}`);
});

test("does not route a web developer to the tests track", () => {
  const repos = routeFor(["dsa", "react"]).map((r) => r.repo);
  assert.ok(!repos.includes("verp (tests)"));
});

test("always returns somewhere to go, even for a complete beginner", () => {
  for (const knows of [["none-yet"], ["git"], []]) {
    const routes = routeFor(knows);
    assert.ok(routes.length > 0, `no route for ${JSON.stringify(knows)}`);
  }
});
