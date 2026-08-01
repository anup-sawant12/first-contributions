// Parsing and validation for a contributors/<username>.md file.
// Pure: no filesystem, no network. Shared by validate.mjs and build-contributors.mjs.

export const SKILLS = [
  "none-yet",
  "git",
  "dsa",
  "c-cpp",
  "java",
  "python",
  "javascript",
  "typescript",
  "react",
  "go",
  "html-css",
  "sql",
];

export const YEARS = ["FE", "SE", "TE", "BE"];

const REQUIRED = ["github", "name", "year", "branch", "knows"];
const MAX_BYTES = 4096;
const MAX_FIELD = 120;

// Minimal YAML-subset parser. The format is fixed and narrow on purpose:
// key: value, plus lists as either [a, b] or a "- item" block.
function parseFrontmatter(text) {
  const normalised = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const lines = normalised.split("\n");

  if (lines[0]?.trim() !== "---") {
    return { error: "NO_OPENING_FENCE" };
  }
  const close = lines.indexOf("---", 1);
  if (close === -1) {
    return { error: "NO_CLOSING_FENCE" };
  }

  const data = {};
  let listKey = null;

  for (let i = 1; i < close; i++) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith("#")) continue;

    const item = raw.match(/^\s*-\s+(.*)$/);
    if (item) {
      if (!listKey) return { error: "ORPHAN_LIST_ITEM", line: i + 1 };
      data[listKey].push(unquote(item[1]));
      continue;
    }

    const pair = raw.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!pair) return { error: "BAD_LINE", line: i + 1, text: raw };

    const [, key, rest] = pair;
    const value = rest.trim();

    if (value === "") {
      // Start of a "- item" block.
      data[key] = [];
      listKey = key;
    } else if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => unquote(v))
        .filter((v) => v !== "");
      listKey = null;
    } else {
      data[key] = unquote(value);
      listKey = null;
    }
  }

  return { data, body: lines.slice(close + 1).join("\n").trim() };
}

function unquote(value) {
  const v = value.trim();
  if (v.length >= 2 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) {
    return v.slice(1, -1).trim();
  }
  return v;
}

// Returns { ok: true, contributor } or { ok: false, problems: [{ title, fix }] }.
// Every problem carries the exact fix, because this output is the only mentor
// a contributor gets at 2am.
export function validateContributor(text, expectedUsername) {
  const problems = [];
  const push = (title, fix) => problems.push({ title, fix });

  if (Buffer.byteLength(text, "utf8") > MAX_BYTES) {
    push(
      `Your file is larger than ${MAX_BYTES} bytes.`,
      "Trim it down. A few lines about yourself is all this needs.",
    );
    return { ok: false, problems };
  }

  const parsed = parseFrontmatter(text);

  if (parsed.error === "NO_OPENING_FENCE") {
    push(
      "The file does not start with the `---` frontmatter fence.",
      "The very first line of the file must be exactly three dashes: `---`. Copy `contributors/TEMPLATE.md` and edit it rather than writing the file from scratch.",
    );
    return { ok: false, problems };
  }
  if (parsed.error === "NO_CLOSING_FENCE") {
    push(
      "The frontmatter block is never closed.",
      "Add a line containing exactly `---` after your last field (after `wants:`).",
    );
    return { ok: false, problems };
  }
  if (parsed.error === "BAD_LINE") {
    push(
      `Line ${parsed.line} of the frontmatter is not a \`key: value\` pair.`,
      `The line reads: \`${parsed.text.trim()}\`. Every line between the two \`---\` fences must look like \`name: Your Name\`. Check for a missing colon.`,
    );
    return { ok: false, problems };
  }
  if (parsed.error === "ORPHAN_LIST_ITEM") {
    push(
      `Line ${parsed.line} is a list item with no field above it.`,
      "Use the inline form instead: `knows: [git, python]`.",
    );
    return { ok: false, problems };
  }

  const { data, body } = parsed;

  for (const key of REQUIRED) {
    if (data[key] === undefined || data[key] === "" || (Array.isArray(data[key]) && data[key].length === 0)) {
      push(
        `The \`${key}\` field is missing or empty.`,
        `Add \`${key}:\` to the frontmatter. See \`contributors/TEMPLATE.md\` for the full shape.`,
      );
    }
  }

  const username = typeof data.github === "string" ? data.github.replace(/^@/, "") : "";
  if (username && expectedUsername && username.toLowerCase() !== expectedUsername.toLowerCase()) {
    push(
      `The \`github\` field says \`${username}\` but you opened this pull request as \`${expectedUsername}\`.`,
      `Change the \`github\` field to \`${expectedUsername}\`, and make sure the file is named \`contributors/${expectedUsername}.md\`.`,
    );
  }

  if (typeof data.year === "string" && data.year && !YEARS.includes(data.year.toUpperCase())) {
    push(
      `\`year: ${data.year}\` is not one of the accepted values.`,
      `Use one of: ${YEARS.join(", ")}. FE is first year, SE second, TE third, BE fourth.`,
    );
  }

  if (typeof data.branch === "string" && data.branch.length > MAX_FIELD) {
    push("The `branch` field is too long.", "Use your branch code or short name, for example `EXCS` or `CMPN`.");
  }

  const knows = Array.isArray(data.knows) ? data.knows : data.knows ? [String(data.knows)] : [];
  if (!Array.isArray(data.knows) && data.knows) {
    push(
      "`knows` is a single value, but it has to be a list.",
      "Wrap it in square brackets, even for one entry: `knows: [python]`.",
    );
  }
  const unknown = knows.map((s) => s.toLowerCase()).filter((s) => !SKILLS.includes(s));
  if (unknown.length) {
    push(
      `\`knows\` contains ${unknown.map((s) => `\`${s}\``).join(", ")}, which ${unknown.length === 1 ? "is not" : "are not"} on the list.`,
      `Pick from: ${SKILLS.join(", ")}. If you have not written code before, \`knows: [none-yet]\` is a real and welcome answer. Put anything else in \`wants\`.`,
    );
  }

  if (typeof data.wants === "string" && data.wants.length > MAX_FIELD) {
    push("The `wants` field is too long.", "A few words is enough, for example `wants: backend and databases`.");
  }

  if (problems.length) return { ok: false, problems };

  return {
    ok: true,
    contributor: {
      github: username,
      name: String(data.name),
      year: String(data.year).toUpperCase(),
      branch: String(data.branch),
      knows: knows.map((s) => s.toLowerCase()),
      wants: data.wants ? String(data.wants) : "",
      body,
    },
  };
}

// Which repos to point someone at, given what they said they know.
// Returns [{ repo, why }] — never empty.
export function routeFor(knows) {
  const has = (...s) => s.some((x) => knows.includes(x));
  const routes = [];

  if (has("react", "typescript", "javascript")) {
    routes.push({
      repo: "verp",
      why: "Next.js and TypeScript. The largest issue backlog in the lab.",
    });
    routes.push({
      repo: "vboard",
      why: "TanStack Start and React. Early enough that whole features are unclaimed.",
    });
  }

  if (has("go")) {
    routes.push({
      repo: "vask",
      why: "Go and SQLite. The loosest review bar in the lab, by design.",
    });
  }

  if (has("dsa", "python", "java", "c-cpp", "sql") && !has("react", "typescript", "javascript", "go")) {
    routes.push({
      repo: "verp (tests)",
      why: "There are no tests anywhere in VOSS yet. src/lib/sgpi.ts, roll-number.ts and class-key.ts are pure functions with no database, no auth and no React. If you can reason about logic, you can test them, and you can run them locally the moment you write one.",
    });
  }

  if (has("html-css") || !routes.length) {
    routes.push({
      repo: "vosslabs.org",
      why: "Plain Astro with scoped CSS. No framework, no database, no build config to fight.",
    });
  }

  return routes.slice(0, 3);
}
