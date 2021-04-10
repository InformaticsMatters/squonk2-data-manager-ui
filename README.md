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
        -t informaticsmatters/mini-apps-data-tier-ui:latest

Which can then be started on `https://localhost:8080` with: -

    $ docker run --rm -p 8080:80 \
        informaticsmatters/mini-apps-data-tier-ui:latest

Deployment to Kubernetes is handled by our AWX-compliant [Ansible playbook repo].

## Configuration

Modify the `config.json` in a production build to build a version detached from informatics matters.
Currently the following options are available:

- `DATA_MANAGER_API_SERVER`: The base url where an implementation of the data-manager-api can be accessed
- `GANALYTICS_ID`: The ID for a google analytics link. NOT CURRENTLY IMPLEMENTED

---

[ansible playbook repo]: https://github.com/InformaticsMatters/mini-apps-data-tier-ui-ansible
[nginx]: https://hub.docker.com/_/nginx

