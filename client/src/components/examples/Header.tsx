import { useState } from "react";
import Header from "../Header";

export default function HeaderExample() {
  const [role, setRole] = useState("analyst");
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <Header
      currentRole={role}
      onRoleChange={setRole}
      workflowPanelOpen={panelOpen}
      onToggleWorkflowPanel={() => setPanelOpen(!panelOpen)}
    />
  );
}
