import MessageBubble from "../MessageBubble";

export default function MessageBubbleExample() {
  return (
    <div className="space-y-4">
      <MessageBubble
        role="user"
        content="Show me the top 10 customers by revenue in North America for 2024"
        timestamp="2:34 PM"
      />
      <MessageBubble
        role="assistant"
        content="I'll analyze the customer revenue data for North America. I'm querying the orders and customers tables with the appropriate filters and aggregations."
        timestamp="2:34 PM"
      />
    </div>
  );
}
