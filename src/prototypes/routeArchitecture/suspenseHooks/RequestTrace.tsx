import { useRequestTrace } from "./generatedClientAdapter";

export const RequestTrace = () => {
  const trace = useRequestTrace();

  return (
    <section style={{ background: "#f7f7f7", marginTop: 16, padding: 12 }}>
      <strong>Generated-client request trace</strong>
      <div>
        Project requests: {trace.projectRequests}; Product requests: {trace.productRequests}
      </div>
      <ol>
        {trace.events.map((event) => (
          <li key={event.id}>{event.text}</li>
        ))}
      </ol>
    </section>
  );
};
