# Squonk 2 Data Manager UI

![build](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build/badge.svg)
![build latest](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build%20latest/badge.svg)
![build tag](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build%20tag/badge.svg)
![build stable](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build%20stable/badge.svg)

[![test](https://github.com/InformaticsMatters/squonk2-data-manager-ui/actions/workflows/test.yaml/badge.svg)](https://github.com/InformaticsMatters/squonk2-data-manager-ui/actions/workflows/test.yaml)

![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/InformaticsMatters/squonk2-data-manager-ui)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/informaticsmatters/squonk2-data-manager-ui)

## API Compatibility

The Data Manager UI will usually only work with specific API versions.  A major version bump in the UI (E.g. 1.x to 2.y) will correspond to a major version change in either the data-manager API or the account-server API.

### Compatibility Table

| UI  | DM API | AS API |
| --- | ------ | ------ |
| 1   | 1      | 1      |
| 2   | 1      | 2      |
___

## Changes

Checkout the releases for the latest changes or look at [CHANGELOG.md](CHANGELOG.md).

## Development

This project uses `pnpm`.

Notable scripts:

- `pnpm install` to install dependencies. This will also setup `husky` git hooks via the `postinstall` script.
- `pnpm dev` starts the development server
- `pnpm dev:debug` same as above but with the Node debugger running. Start the VSCode debugger to connect.
- `pnpm build` will create a production build which includes type-checking and `eslint`
- `pnpm start` starts the production server
- `pnpm tsc` will run a one-off type check. This is also called pre-push to ensure no type errors are deployed.
- `pnpm lint` will run the linter with the `eslint` config
- `pnpm format` will format specified files with the `eslint` config
- `pnpm format:all` will format all files with the `eslint` config
- `pnpm test` will run the playwright tests
- `pnpm test:debug` runs the tests with debug mode (headed)
- `pnpm test:ci` runs the tests but configured for GitHub actions

See `package.json` for all available scripts.

## Testing

This project uses [Playwright](https://playwright.dev/) for integration and e2e testing. To get this setup install all dependencies:

```bash
pnpm i
pnpm exec playwright install-deps
pnpm exec playwright install
```

Then run:

- `pnpm t` to run the tests in headless mode
- `pnpm test:debug` to run the tests headed in debug mode
### Code Quality

We use a combination of `Husky`, `lint-staged` and `eslint` to format code to a standard style (see the `.eslintrc` file).
Changed lines/files are formatted by when a `git commit` is made.

## Building

Official builds are handled by GitHub Actions and container images pushed
to Docker-Hub. Refer to the `.github/workflows` files to see the official
build commands, which can be run from the project clone to produce an
[nginx] web-container: -

    $ docker build . \
        --build-arg GIT_SHA=$(git rev-parse HEAD) \
        --build-arg SKIP_CHECKS=1 \
        --tag informaticsmatters/squonk-data-manager-ui:latest

Deployment to Kubernetes is handled by our AWX-compliant [Ansible playbook repo].

## Local/alternative configuration
A `.env` file is injected by Kubernetes at run-time that provides values
for numerous environment variables. The `.env.*` used at build time is
`.env.staging`, but this can be changed by using the build-arg `FLAVOUR`.
NextJS loads `.env.*` files different depending on the Node environment. Read more
[here](https://nextjs.org/docs/basic-features/environment-variables#default-environment-variables).
Build the image using

    $ docker build . \
        --build-arg FLAVOUR=local.example \
        --build-arg GIT_SHA=$(git rev-parse HEAD) \
        --build-arg SKIP_CHECKS=1 \
        --build-arg BASE_PATH="" \
        --tag informaticsmatters/squonk-data-manager-ui:latest

Which can then be started on `http://localhost:8080/data-manager-ui` with: -

    $ docker run --rm --detach --publish 8080:3000 \
        informaticsmatters/squonk-data-manager-ui:latest

In local development the `.env.*` can be loaded by copying it into the container and
committing it as a image.

1. Crate the container: `docker create --name foo-tmp <temp-tag-name>`
2. Copy the `.env.*` into the container: docker cp .env.<FLAVOUR> foo-tmp:/app
3. Commit the container as a new image: `docker commit foo-tmp <new-tag-name>`
4. Run this image as above

## Releases

This project uses [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). This standardises commits so they can be used to generate changelogs. Use [standard-version](https://github.com/conventional-changelog/standard-version) to do a release (ensure you have no un-committed changes, I.e. a clean workspace).

- **Pre-release**:

A prerelease will update the version in the package.json to an appropriate semver version (based on whether the changes since the last tag are fixes, features and whether they contain breaking changes). In this case the `rc` tag is used in the semver string to mark it as a pre-release. It will then update the [CHANGELOG.md](CHANGELOG.md) file with the relevant changes since the last changelog update. These two changes are then committed with a standardised commit message. At this point, a tag is created with the same version number as the version field of the package.json. The second command then pushes both the new commit as well as the new tag.

```bash
pnpm dlx standard-version --prerelease rc -t "''" --skip.changelog=true
git push --follow-tags origin master
```

- **Release**

This causes the same as above but as a normal release. I.e. no `rc` tag.

```bash
pnpm dlx standard-version -t "''"
git push --follow-tags origin master
```

## Devcontainers

Due to the use of [MDX](https://mdxjs.com/) and the node-dependent release mechanism, you will need a full development environment to verify changes by using the development server and to run tests. To aids in this, we provide a [devcontainer config file](.devcontainer/devcontainer.json) that sets up the needed Node dependencies and allows you to run the tests and dev server. You may open this dev container in browser or inside a supported editor of your choice given you can run the container on your system. It's recommended you use the `+ New with options` option (from the … menu) when starting your codespace so that you can enter the required secrets to get the app running against APIs.

---

[ansible playbook repo]: https://github.com/InformaticsMatters/squonk2-data-manager-ui-ansible
[nginx]: https://hub.docker.com/_/nginx

