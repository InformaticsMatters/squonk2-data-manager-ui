import { genericOAuthClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { withBasePath } from "../utils/app/basePath";
import { type Auth } from "./auth";

export const authClient = createAuthClient({
  basePath: withBasePath("/api/auth"),
  plugins: [
    genericOAuthClient(),
    inferAdditionalFields<Auth>(), // makes additionalFields (preferred_username, realm_access, etc.) typed on the client
  ],
});
