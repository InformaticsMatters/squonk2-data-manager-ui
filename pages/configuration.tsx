import { Container } from "@mui/material";
import type { GetServerSideProps } from "next";

// Format a value so undefined and empty string are visible
const ReprLi = ({ title, children }: { children: string | undefined | null; title: string }) => {
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
  dmAPI: string | null;
  asAPI: string | null;
}

export const getServerSideProps: GetServerSideProps<ConfigurationProps> = async () => {
  // These may change between build and deployment. NextJS statically builds these so just using
  // these "public" variables won't show the correct value.
  // When undefined a null is passed as undefined isn't valid json.
  const dmAPI = process.env.NEXT_PUBLIC_DATA_MANAGER_API_SERVER ?? null;
  const asAPI = process.env.NEXT_PUBLIC_ACCOUNT_SERVER_API_SERVER ?? null;
  return {
    props: { dmAPI, asAPI },
  };
};

export const Configuration = ({ dmAPI, asAPI }: ConfigurationProps) => (
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
    </ul>
    <h2>Roles</h2>
    <ul>
      <ReprLi title="DM User Role">{process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE}</ReprLi>
      <ReprLi title="DM Admin Role">{process.env.NEXT_PUBLIC_KEYCLOAK_DM_ADMIN_ROLE}</ReprLi>
      <ReprLi title="AS User Role">{process.env.NEXT_PUBLIC_KEYCLOAK_AS_USER_ROLE}</ReprLi>
      <ReprLi title="AS Admin Role">{process.env.NEXT_PUBLIC_KEYCLOAK_AS_ADMIN_ROLE}</ReprLi>
    </ul>
    <h2>App</h2>
    <ul>
      <ReprLi title="Default Org Name">{process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME}</ReprLi>
    </ul>
  </Container>
);

export default Configuration;
