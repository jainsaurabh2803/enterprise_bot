import { useState } from "react";
import ChatSidebar from "../ChatSidebar";

const mockConversations = [
  {
    id: "1",
    title: "Revenue Analysis Q4",
    preview: "Top customers by revenue in North America",
    timestamp: "2h ago",
  },
  {
    id: "2",
    title: "Product Performance",
    preview: "Best selling products by category",
    timestamp: "1d ago",
  },
  {
    id: "3",
    title: "Customer Churn",
    preview: "Analyze customer retention patterns",
    timestamp: "3d ago",
  },
];

export default function ChatSidebarExample() {
  const [activeId, setActiveId] = useState("1");

  return (
    <div className="h-[400px]">
      <ChatSidebar
        conversations={mockConversations}
        activeId={activeId}
        onSelectConversation={setActiveId}
        onNewConversation={() => console.log("New conversation")}
      />
    </div>
  );
}
