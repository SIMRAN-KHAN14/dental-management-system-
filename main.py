"""
Dental Appointment System — powered by LangGraph + Gemini (Google AI)
"""

import os
import sys
from dotenv import load_dotenv

# 1) Load .env from the same folder as this script (guarantees correct location)
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# 2) Quick sanity check (remove in production)
print("DEBUG: GROQ_API_KEY present?", bool(os.getenv("GROQ_API_KEY")))
print("DEBUG: MODEL_NAME =", os.getenv("MODEL_NAME"))
print("DEBUG: TEMPERATURE =", os.getenv("TEMPERATURE"))

# 3) Import only after dotenv is loaded
from langchain_core.messages import HumanMessage, AIMessageChunk
# Import the factory, not a preconstructed object
from dental_agent.agent import get_dental_graph

BANNER = """
╔══════════════════════════════════════════════════════════╗
║         Dental Appointment Management System             ║
║         Powered by LangGraph + Groq (Google AI)          ║
╚══════════════════════════════════════════════════════════╝
Examples:
  • Show available slots for an orthodontist
  • Book patient 1000082 with Emily Johnson on 5/10/2026 9:00
  • Cancel appointment for patient 1000082 at 5/10/2026 9:00
  • Reschedule patient 1000082 from 5/10/2026 9:00 to 5/12/2026 10:00
  • What appointments does patient 1000048 have?
Type 'quit' to exit.
"""

def run():
    # Create the graph lazily after dotenv is loaded
    try:
        dental_graph = get_dental_graph()
    except Exception as exc:
        print("\nFatal: failed to initialize dental_graph.")
        print("Error:", exc)
        # Print a short traceback for debugging
        import traceback
        traceback.print_exc()
        sys.exit(1)

    print(BANNER)
    history = []

    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue
        if user_input.lower() in {"quit", "exit", "bye"}:
            print("Goodbye!")
            break

        history.append(HumanMessage(content=user_input))

        print("\nAgent: ", end="", flush=True)
        final_messages = None

        try:
            for event_type, data in dental_graph.stream(
                {"messages": history},
                stream_mode=["messages", "values"],
                config={"recursion_limit": 20},
            ):
                if event_type == "messages":
                    chunk, meta = data
                    if (
                        isinstance(chunk, AIMessageChunk)
                        and chunk.content
                        and not getattr(chunk, "tool_calls", None)
                    ):
                        print(chunk.content, end="", flush=True)
                elif event_type == "values":
                    final_messages = data.get("messages", [])
        except Exception as exc:
            print(f"\nError during agent run: {exc}")
            import traceback
            traceback.print_exc()
            # Remove the last user message to avoid duplicate context
            if history:
                history.pop()
            continue

        print()
        if final_messages:
            history = final_messages


if __name__ == "__main__":
    run()
