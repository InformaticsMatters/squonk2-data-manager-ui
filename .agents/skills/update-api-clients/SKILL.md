---
name: update-api-clients
description: How to update the generated Data Manager and Account Server API clients
---

The OpenAPI documents `openapi/data-manager.yaml` and `openapi/account-server.yaml` are used to generate the Data Manager and Account Server API clients at `api/data-manager` and `api/account-server`. When backend changes are made, we need to download the latest yaml files and regenerate the clients.

1. Download the latest OpenAPI documents.

From the dev deployment:

- Data Manager: https://data-manager.xchem-dev.diamond.ac.uk/data-manager-api/openapi.yaml
- Account Server: https://account-server.xchem-dev.diamond.ac.uk/account-server-api/openapi.yaml

Overwrite the files in `openapi/data-manager.yaml` and `openapi/account-server.yaml` with the downloaded files.

2. Regenerate the clients.

The clients are generated using Orval. They can be rebuilt with `pnpm generate:clients`. This will overwrite the existing clients in `api/data-manager` and `api/account-server`.
