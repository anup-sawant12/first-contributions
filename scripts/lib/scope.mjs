// Decides whether a pull request is a first contribution, and if so whether it
// is shaped correctly -- before anything reads the file's contents.
//
// Pure: no network, no filesystem. Split out of validate.mjs so it can be
// tested, because the worst defect this repository has had lived in here: a
// file added outside contributors/ returned "skip", which meant a green check
// and no comment at all on a repository with no human review.

export const DIR = "contributors/";
export const TEMPLATE = "contributors/TEMPLATE.md";

export function checkScope(files, author) {
  const touched = files.filter((f) => f.filename.startsWith(DIR) && f.filename !== TEMPLATE);
  // `others` must be the true complement of `touched`. It previously also
  // excluded TEMPLATE, which made contributors/TEMPLATE.md invisible to both
  // filters: a pull request that edited or deleted the template rode along
  // inside an automatic merge, corrupting the file every later contributor
  // copies from.
  const others = files.filter((f) => !f.filename.startsWith(DIR) || f.filename === TEMPLATE);

  if (touched.length === 0) {
    // Never return silently on a real contribution attempt. A file added at the
    // repository root, or under `Contributors/`, or an in-place edit of
    // TEMPLATE.md, used to produce a green check and no comment at all -- the
    // one failure mode in this system with zero feedback, on a repository that
    // has no human review to fall back on.
    if (files.length === 0) return { skip: true };
    return {
      problems: [
        {
          title: "This pull request does not add a file inside the `contributors` folder.",
          fix:
            `It changes ${files.slice(0, 5).map((f) => `\`${f.filename}\``).join(", ")}. ` +
            `Your file has to be at exactly \`${DIR}${author}.md\` -- inside the \`contributors\` folder, ` +
            `spelled lowercase and plural, and not \`${TEMPLATE}\` itself. ` +
            `On the GitHub website, open the \`contributors\` folder FIRST, then use Add file > Create new file, ` +
            `and type only \`${author}.md\` in the name box. ` +
            `Move the file on this same branch and push -- this check runs again by itself.`,
        },
      ],
    };
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
