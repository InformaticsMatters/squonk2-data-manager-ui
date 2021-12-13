# The Mini-Apps Data Tier UI

![build](https://github.com/InformaticsMatters/mini-apps-data-tier-ui/workflows/build/badge.svg)
![build latest](https://github.com/InformaticsMatters/mini-apps-data-tier-ui/workflows/build%20latest/badge.svg)
![build tag](https://github.com/InformaticsMatters/mini-apps-data-tier-ui/workflows/build%20tag/badge.svg)
![build stable](https://github.com/InformaticsMatters/mini-apps-data-tier-ui/workflows/build%20stable/badge.svg)

![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/InformaticsMatters/mini-apps-data-tier-ui)

## Development

This project uses `pnpm`.

Notable scripts:

- `pnpm install` to install dependencies. This will also setup `husky` git hooks.
- `pnpm dev` starts the development server
- `pnpm dev:debug` same as above but with the Node debugger running. Start the VSCode debugger to connect.
- `pnpm cypress` to run the end-to-end tests
- `pnpm build` will create a production build which includes type-checking and `eslint`
- `pnpm type-check` will run a one-off type check. This is also called pre-push to ensure no type errors are deployed.
- `pnpm format:all` will format all files with the `eslint` config

See `package.json` for all available scripts.

### Code Quality

We use a combination of `Husky`, `lint-staged` and `eslint` to format code to a standard style (see the `.eslintrc` file).
Changed lines/files are formatted by when a `git commit` is made.

## Building

Official builds are handled by GitHub Actions and container images pushed
to Docker-Hub. Refer to the `.github/workflows` files to see the official
build commands, which can be run from the project clone to produce an
[nginx] web-container: -

    $ docker build . \
        --tag informaticsmatters/mini-apps-data-tier-ui:latest

Deployment to Kubernetes is handled by our AWX-compliant [Ansible playbook repo].

## Local/alternative configuration
A `.env` file is injected by Kubernetes at run-time that provides values
for numerous environment variables. The `.env` used at build time is
`.env.staging`, but this can be changed by using the build-arg `FLAVOUR`: -

    $ docker build . \
        --build-arg FLAVOUR=local.example
        --tag informaticsmatters/mini-apps-data-tier-ui:latest

Which can then be started on `http://localhost:8080/data-manager-ui` with: -

    $ docker run --rm --detach --publish 8080:3000 \
        informaticsmatters/mini-apps-data-tier-ui:latest

---

[ansible playbook repo]: https://github.com/InformaticsMatters/mini-apps-data-tier-ui-ansible
[nginx]: https://hub.docker.com/_/nginx

