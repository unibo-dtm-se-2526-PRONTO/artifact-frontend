let dryRun = (process.env.RELEASE_DRY_RUN || "false").toLowerCase() === "true";

import config from "semantic-release-preconfigured-conventional-commits" with { type: "json" };

config.plugins.push(
  ["@semantic-release/npm", { "npmPublish": false }],
);

if (!dryRun) {
  config.plugins.push(
    ["@semantic-release/github", {}],
    ["@semantic-release/git", {
      "assets": [
        "CHANGELOG.md",
        "package.json",
      ],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
    }],
  );
}

export default config;
