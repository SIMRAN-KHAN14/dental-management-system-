"""
One-shot CLI smoke test for the supervisor LangGraph (requires GROQ_API_KEY).
Run: python -m dental_agent.smoke_chat
"""
import os
import sys

from dotenv import load_dotenv

load_dotenv()

if not os.getenv("GROQ_API_KEY"):
    print("Set GROQ_API_KEY in .env first.")
    sys.exit(1)

from langchain_core.messages import HumanMessage

from dental_agent.agent import get_dental_graph
from dental_agent.utils import repair_chat_history


def main():
    graph = get_dental_graph()
    prompt = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "What appointment slots does Dr. Sharma have on 2026-06-25?"
    )
    print(f"User: {prompt}\n")
    result = graph.invoke(
        {"messages": [HumanMessage(content=prompt)]},
        config={"recursion_limit": 25},
    )
    messages = repair_chat_history(result.get("messages", []))
    for msg in reversed(messages):
        if msg.__class__.__name__ == "AIMessage" and msg.content and not getattr(msg, "tool_calls", None):
            print(f"Agent: {msg.content}")
            return
    print("Agent: (no text response — check tool results in state)")
    print(f"final_response: {result.get('final_response')}")


if __name__ == "__main__":
    main()
