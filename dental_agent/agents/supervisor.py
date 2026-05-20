import json
import re

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from dental_agent.models.state import AppointmentState, RouteTarget
from dental_agent.utils import sanitize_messages
from dental_agent.llm import get_llm


class SupervisorDecision(BaseModel):
    """Routing decision produced by the supervisor."""
    intent: str = Field(
        description="Classified intent. One of: get_info, book, cancel, reschedule, unknown, end."
    )
    next_agent: RouteTarget = Field(
        description=(
            "The agent to route to. One of: info_agent, booking_agent, "
            "cancellation_agent, rescheduling_agent, end."
        )
    )
    reasoning: str = Field(description="Brief explanation of the routing decision.")


INTENT_TO_AGENT: dict[str, RouteTarget] = {
    "get_info": "info_agent",
    "book": "booking_agent",
    "cancel": "cancellation_agent",
    "reschedule": "rescheduling_agent",
    "unknown": "info_agent",
    "end": "end",
}

VALID_AGENTS = set(INTENT_TO_AGENT.values())


SUPERVISOR_SYSTEM = """You are the supervisor and router for a dental appointment management system.

Your ONLY job is to analyze the user's latest message and classify their intent, then route to the correct specialist agent.

## Routing Rules
- get_info      → info_agent          : User asks about available slots, doctors, specializations, schedules, or general queries.
- book          → booking_agent       : User wants to create / make / schedule a NEW appointment.
- cancel        → cancellation_agent  : User wants to cancel / remove an existing appointment.
- reschedule    → rescheduling_agent  : User wants to move / change an existing appointment to a different time.
- end           → end                 : User says goodbye, thanks, says they're done, or the conversation is fully resolved.
- unknown       → info_agent          : Ambiguous intent; default to info_agent for clarification.

## Important
- Do NOT answer the user directly. Only classify and route.
- If the user's message contains multiple intents, pick the PRIMARY action.
- If the last AI message already answered the user's question and the user has no follow-up, route to end.

Respond with ONLY a JSON object (no markdown fences), for example:
{{"intent": "get_info", "next_agent": "info_agent", "reasoning": "User asked for available slots"}}
"""

SUPERVISOR_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SUPERVISOR_SYSTEM),
    ("placeholder", "{messages}"),
])


def _parse_decision(raw: str) -> SupervisorDecision:
    text = (raw or "").strip()
    if not text:
        return SupervisorDecision(
            intent="unknown", next_agent="info_agent", reasoning="empty supervisor response"
        )
    try:
        return SupervisorDecision.model_validate_json(text)
    except Exception:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return SupervisorDecision.model_validate(json.loads(match.group()))
        except Exception:
            pass
    return SupervisorDecision(
        intent="unknown", next_agent="info_agent", reasoning="could not parse supervisor JSON"
    )


def _normalize_decision(decision: SupervisorDecision) -> SupervisorDecision:
    intent = (decision.intent or "unknown").strip().lower()
    if intent not in INTENT_TO_AGENT:
        intent = "unknown"
    next_agent = decision.next_agent
    if next_agent not in VALID_AGENTS:
        next_agent = INTENT_TO_AGENT[intent]
    return SupervisorDecision(
        intent=intent,
        next_agent=next_agent,
        reasoning=decision.reasoning or "",
    )


def supervisor_node(state: AppointmentState) -> dict:
    llm = get_llm()
    chain = SUPERVISOR_PROMPT | llm
    response = chain.invoke({"messages": sanitize_messages(state["messages"])})
    content = response.content if isinstance(response.content, str) else str(response.content)
    decision = _normalize_decision(_parse_decision(content))

    return {
        "intent": decision.intent,
        "next_agent": decision.next_agent,
    }
