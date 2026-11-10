let dryRun = (process.env.RELEASE_DRY_RUN || "false").toLowerCase() === "true";
let image = "ghcr.io/unibo-dtm-se-2526-pronto/pronto-helpdesk-frontend";

// A release records the new version in package.json and publishes dist/ (built
// by deploy.yml before semantic-release runs) to npm. Then it builds the Docker
// image for amd64 and arm64 (Apple Silicon) and pushes it to GHCR as <version>
// and latest. npm reads its token from NPM_TOKEN (deploy.yml).
//
// The label links the package on GHCR to this repository. buildx pushes both
// platforms under one tag; a dry run only builds them.
let publishCmd = "docker buildx build --platform linux/amd64,linux/arm64"
    + " --label org.opencontainers.image.source=https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend"
    + ` -t ${image}:\${nextRelease.version} -t ${image}:latest`
    + (dryRun ? "" : " --push")
    + " .";

import config from "semantic-release-preconfigured-conventional-commits" with { type: "json" };

config.plugins.push(
  ["@semantic-release/npm", { "npmPublish": !dryRun }],
  ["@semantic-release/exec", { "publishCmd": publishCmd }],
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
