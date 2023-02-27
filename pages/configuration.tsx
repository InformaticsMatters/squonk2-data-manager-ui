import { Container } from "@mui/material";

// Format a value so undefined and empty string are visible
const ReprLi = ({ title, children }: { children: string | undefined; title: string }) => {
  if (children === "") {
    return (
      <li>
        {title}: <em>{"<empty string>"}</em>
      </li>
    );
  } else if (children === undefined) {
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

export const Configuration = () => (
  <Container>
    <h1>Configuration</h1>
    <p>
      Values will be displayed in <em>italics</em> if they are a special value (empty string or
      undefined)
    </p>
    <h2>Setup</h2>
    <ul>
      <ReprLi title="App Version">{process.env.NEXT_PUBLIC_APP_VERSION}</ReprLi>
      <ReprLi title="Base Path">{process.env.NEXT_PUBLIC_BASE_PATH}</ReprLi>
      <ReprLi title="Profile">{process.env.NEXT_PUBLIC_AUTH0_PROFILE}</ReprLi>
      <ReprLi title="Profile">{process.env.NEXT_PUBLIC_AUTH0_PROFILE}</ReprLi>
      <ReprLi title="DM API Server">{process.env.NEXT_PUBLIC_DATA_MANAGER_API_SERVER}</ReprLi>
      <ReprLi title="AS API Server">{process.env.NEXT_PUBLIC_ACCOUNT_SERVER_API_SERVER}</ReprLi>
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
