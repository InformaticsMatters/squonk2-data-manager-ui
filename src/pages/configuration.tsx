import { Container } from "@mui/material";
import { type GetServerSideProps } from "next";

import { readApiServers } from "@/application/apiServers";
import { pagePolicies, withPagePolicy } from "@/application/pagePolicy";

// Format a value so undefined and empty string are visible
const ReprLi = ({ title, children }: { children: string | null | undefined; title: string }) => {
  if (children === "") {
    return (
      <li>
        {title}: <em>{"<empty string>"}</em>
      </li>
    );
  } else if (children === undefined || children === null) {
    return (
      <li>
        {title}: <em>undefined</em>
      </li>
    );
  }
  return (
    <li>
      {title}: {children}
    </li>
  );
};

export interface ConfigurationProps {
  dmAPI: string;
  asAPI: string;
  depictAPI: string;
}

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps<ConfigurationProps> = async () => {
  // These change between build and deployment, so they are read from the environment this server
  // is running in rather than from the "public" variables `next build` inlined.
  const { dataManager, accountServer, depict } = readApiServers(process.env);
  return { props: { dmAPI: dataManager, asAPI: accountServer, depictAPI: depict } };
};

export const Configuration = ({ dmAPI, asAPI, depictAPI }: ConfigurationProps) => (
  <Container>
    <h1>Configuration</h1>
    <p>
      Values will be displayed in <em>italics</em> if they are a special value (empty string or
      undefined).
    </p>
    <h2>Setup</h2>
    <ul>
      <ReprLi title="App Version">{process.env.NEXT_PUBLIC_APP_VERSION}</ReprLi>
      <ReprLi title="Base Path">{process.env.NEXT_PUBLIC_BASE_PATH}</ReprLi>
      <ReprLi title="DM API Server">{dmAPI}</ReprLi>
      <ReprLi title="AS API Server">{asAPI}</ReprLi>
      <ReprLi title="Depict API Server">{depictAPI}</ReprLi>
    </ul>
    <h2>Auth</h2>
    <ul>
      <ReprLi title="Auth URL">{process.env.BETTER_AUTH_BASE_URL}</ReprLi>
    </ul>
    <h2>Roles</h2>
    <ul>
      <ReprLi title="DM User Role">{process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE}</ReprLi>
      <ReprLi title="DM Admin Role">{process.env.NEXT_PUBLIC_KEYCLOAK_DM_ADMIN_ROLE}</ReprLi>
      <ReprLi title="DM Eval Role">{process.env.NEXT_PUBLIC_KEYCLOAK_DM_EVALUATOR_ROLE}</ReprLi>
      <ReprLi title="AS User Role">{process.env.NEXT_PUBLIC_KEYCLOAK_AS_USER_ROLE}</ReprLi>
      <ReprLi title="AS Admin Role">{process.env.NEXT_PUBLIC_KEYCLOAK_AS_ADMIN_ROLE}</ReprLi>
      <ReprLi title="AS Eval Role">{process.env.NEXT_PUBLIC_KEYCLOAK_AS_EVALUATOR_ROLE}</ReprLi>
    </ul>
    <h2>App</h2>
    <ul>
      <ReprLi title="Default Org Name">{process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME}</ReprLi>
    </ul>
  </Container>
);

export default withPagePolicy(pagePolicies.public, Configuration);
