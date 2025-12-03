import ConversationItem from "../ConversationItem";

export default function ConversationItemExample() {
  return (
    <div className="w-72 space-y-1 bg-sidebar p-2 rounded-md">
      <ConversationItem
        id="1"
        title="Revenue Analysis"
        preview="Top customers by revenue in Q4"
        timestamp="2h ago"
        isActive={true}
        onClick={() => console.log("Clicked conversation 1")}
      />
      <ConversationItem
        id="2"
        title="Product Performance"
        preview="Best selling products by category"
        timestamp="1d ago"
        isActive={false}
        onClick={() => console.log("Clicked conversation 2")}
      />
    </div>
  );
}
