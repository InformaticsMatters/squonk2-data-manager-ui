import { useSuspenseProjectRoute } from "./useSuspenseProjectRoute";

export const ProjectShell = ({ projectId }: { projectId: string }) => {
  const route = useSuspenseProjectRoute(projectId);

  return (
    <header style={{ borderBottom: "1px solid #bbb", marginTop: 24, paddingBottom: 16 }}>
      <div>Organisation identity: {route.product.organisation.name}</div>
      <h2>{route.project.name}</h2>
      <div>Containing unit: {route.product.unit.name}</div>
      <small>Shell independently called useSuspenseProjectRoute.</small>
    </header>
  );
};
