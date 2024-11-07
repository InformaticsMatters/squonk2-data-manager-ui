# Squonk 2 Data Manager UI

![build](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build/badge.svg)
![build latest](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build%20latest/badge.svg)
![build tag](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build%20tag/badge.svg)
![build stable](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build%20stable/badge.svg)

[![test](https://github.com/InformaticsMatters/squonk2-data-manager-ui/actions/workflows/test.yaml/badge.svg)](https://github.com/InformaticsMatters/squonk2-data-manager-ui/actions/workflows/test.yaml)

![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/InformaticsMatters/squonk2-data-manager-ui)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/informaticsmatters/squonk2-data-manager-ui)

## API Compatibility

The Data Manager UI will usually only work with specific API versions. A major version bump in the UI (E.g. 1.x to 2.y) will correspond to a major version change in either the data-manager API or the account-server API.

### Compatibility Table

| UI  | DM API | AS API |
| --- | ------ | ------ |
| 1   | 1      | 1      |
| 2   | 1      | 2      |
| 3   | 2      | 2      |
| 4   | 3      | 3      |
| 5   | 3      | 4      |

---

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

This project uses [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). This standardises commits so they can be used to generate changelogs. Release PRs will be created by [Release Please](https://github.com/googleapis/release-please) based on the changes since the last release. To force a PR to be generated with a specific version create an empty commit as follows:

```bash
git commit --no-verify --allow-empty -m "chore: release 3.0.0-rc.1" -m "Release-As: 3.0.0-rc.1"
```

## Devcontainers

Due to the use of [MDX](https://mdxjs.com/) and the node-dependent release mechanism, you will need a full development environment to verify changes by using the development server and to run tests. To aids in this, we provide a [devcontainer config file](.devcontainer/devcontainer.json) that sets up the needed Node dependencies and allows you to run the tests and dev server. You may open this dev container in browser or inside a supported editor of your choice given you can run the container on your system. It's recommended you use the `+ New with options` option (from the … menu) when starting your codespace so that you can enter the required secrets to get the app running against APIs.

---

[ansible playbook repo]: https://github.com/InformaticsMatters/squonk2-data-manager-ui-ansible
[nginx]: https://hub.docker.com/_/nginx
