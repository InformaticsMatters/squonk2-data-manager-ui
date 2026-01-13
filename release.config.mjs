/**
 * @type {import('semantic-release').GlobalConfig}
 */
const config = {
  branches: ["master", { name: "dev", channel: "dev", prerelease: "dev" }],
  tagFormat: "${version}",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],
    ["@semantic-release/npm", { npmPublish: false }],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore: release ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    ["@semantic-release/github", { releasedLabels: false, successComment: false }],
  ],
};

export default config;
