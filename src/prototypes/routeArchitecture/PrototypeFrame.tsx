import { type ReactNode } from "react";

type Variant = "A" | "B" | "C" | "D";

export const PrototypeFrame = ({
  variant,
  projectId,
  summary,
  children,
}: {
  variant: Variant;
  projectId: string;
  summary: string;
  children: ReactNode;
}) => (
  <main style={{ fontFamily: "sans-serif", margin: "32px auto", maxWidth: 920, padding: 16 }}>
    <p style={{ color: "#9b1c1c", fontWeight: 700 }}>THROWAWAY ARCHITECTURE PROTOTYPE</p>
    <h1>Route-owned module boundaries</h1>
    <nav style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
      {(["A", "B", "C", "D"] as const).map((candidate) => (
        <a
          href={`/prototype/route-architecture/${projectId}/files?variant=${candidate}`}
          key={candidate}
        >
          Variant {candidate}
        </a>
      ))}
      <span aria-hidden="true">|</span>
      <a href={`/prototype/route-architecture/alpha/files?variant=${variant}`}>Editable project</a>
      <a href={`/prototype/route-architecture/beta/files?variant=${variant}`}>Read-only project</a>
      <a href={`/prototype/route-architecture/missing/files?variant=${variant}`}>Missing project</a>
    </nav>
    <section style={{ background: "#edf4fb", borderLeft: "5px solid #275d8c", padding: 16 }}>
      <strong>Variant {variant}</strong>: {summary}
    </section>
    {children}
  </main>
);

export const Loading = () => <p>Resolving route resources...</p>;
export const NotFound = () => <p role="alert">Project not found.</p>;

export const ProjectView = ({
  project,
  product,
  canEditFiles,
  architecture,
}: {
  project: { id: string; name: string };
  product: { unit: { name: string }; organisation: { name: string } };
  canEditFiles: boolean;
  architecture: string[];
}) => (
  <>
    <header style={{ borderBottom: "1px solid #bbb", marginTop: 24, paddingBottom: 16 }}>
      <div>Organisation identity: {product.organisation.name}</div>
      <h2>{project.name}</h2>
      <div>Containing unit: {product.unit.name}</div>
    </header>
    <section>
      <h3>Files</h3>
      <button disabled={!canEditFiles} type="button">
        Upload file
      </button>
      <p>Capability: {canEditFiles ? "can edit files" : "read only"}</p>
    </section>
    <section>
      <h3>Knowledge exposed to callers</h3>
      <ul>
        {architecture.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  </>
);
