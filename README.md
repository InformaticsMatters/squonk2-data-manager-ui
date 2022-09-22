# Squonk Data Manager UI

![build](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build/badge.svg)
![build latest](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build%20latest/badge.svg)
![build tag](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build%20tag/badge.svg)
![build stable](https://github.com/InformaticsMatters/squonk2-data-manager-ui/workflows/build%20stable/badge.svg)

[![test](https://github.com/InformaticsMatters/squonk-data-manager-ui/actions/workflows/test.yaml/badge.svg)](https://github.com/InformaticsMatters/squonk-data-manager-ui/actions/workflows/test.yaml)

![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/InformaticsMatters/squonk-data-manager-ui)

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

This project uses [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). This standardises commits so they can be used to generate changelogs. Use [standard-version](https://github.com/conventional-changelog/standard-version) to do a release (with no un-committed changes).

- **Pre-release**:

```bash
pnpm dlx standard-version --prerelease rc -t "''"
git push --follow-tags origin master
```


- **Release**
```bash
pnpm dlx standard-version -t "''"
git push --follow-tags origin master
```

This will do the following:

- Update the [CHANGELOG.md](CHANGELOG.md) with the `fix`es and `feat`ures from the commit messages
- Update the `package.json` version field to the next semver version. This version is determined from whether the commit messages from the last release are: just fixes (+ 0.0.1); includes features (+0.1.0); has major breaking changes (+ 1.0.0). Additionally a `rc` tag is used for pre-releases.
- Tag the repo locally with the new version (prefixed with a `v`). This is then pushed to the remote with the second command.

---

[ansible playbook repo]: https://github.com/InformaticsMatters/squonk2-data-manager-ui-ansible
[nginx]: https://hub.docker.com/_/nginx

