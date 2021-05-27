# The Mini-Apps Data Tier UI

![build](https://github.com/InformaticsMatters/mini-apps-data-tier-ui/workflows/build/badge.svg)
![build latest](https://github.com/InformaticsMatters/mini-apps-data-tier-ui/workflows/build%20latest/badge.svg)
![build tag](https://github.com/InformaticsMatters/mini-apps-data-tier-ui/workflows/build%20tag/badge.svg)
![build stable](https://github.com/InformaticsMatters/mini-apps-data-tier-ui/workflows/build%20stable/badge.svg)

![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/InformaticsMatters/mini-apps-data-tier-ui)

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

