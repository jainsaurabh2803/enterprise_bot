import AgentStatus from "../AgentStatus";

const agents = [
  { name: "Intent Parser", status: "completed" as const },
  { name: "RAG Retrieval", status: "completed" as const },
  { name: "SQL Generator", status: "running" as const },
  { name: "Validator", status: "idle" as const },
  { name: "Cost Optimizer", status: "idle" as const },
];

export default function AgentStatusExample() {
  return <AgentStatus agents={agents} />;
}
