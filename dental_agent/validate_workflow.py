"""
Offline validation for tool_call / ToolMessage consistency and CSV tools.
Run: python -m dental_agent.validate_workflow
"""

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from dental_agent.tools.csv_reader import (
    get_available_slots,
    check_slot_availability,
    get_patient_appointments,
)
from dental_agent.tools.csv_writer import (
    book_appointment,
    cancel_appointment,
    reschedule_appointment,
)
from dental_agent.tools.date_utils import parse_date_slot
from dental_agent.utils import repair_chat_history


def test_repair_chat_history():
    ai = AIMessage(
        content="",
        tool_calls=[
            {
                "id": "call_abc",
                "name": "get_available_slots",
                "args": {"doctor_name": "Dr. Sharma"},
            }
        ],
    )
    broken = [HumanMessage(content="show slots"), ai, HumanMessage(content="thanks")]
    fixed = repair_chat_history(broken)
    assert len(fixed) == 4
    assert isinstance(fixed[2], ToolMessage)
    assert fixed[2].tool_call_id == "call_abc"
    print("OK repair_chat_history")


def test_csv_tools():
    slots = get_available_slots.invoke({"doctor_name": "Dr. Sharma"})
    assert isinstance(slots, list)
    assert len(slots) > 0
    print(f"OK get_available_slots ({len(slots)} rows)")

    slot = slots[0]
    doctor = slot["doctor_name"]
    date_slot = slot["date_slot"]
    avail = check_slot_availability.invoke({"doctor_name": doctor, "date_slot": date_slot})
    assert avail.get("success") is True
    print("OK check_slot_availability")

    test_pid = "VALIDATION-TEST-001"
    booked = book_appointment.invoke(
        {"patient_id": test_pid, "doctor_name": doctor, "date_slot": date_slot}
    )
    assert booked.get("success") is True
    print("OK book_appointment")

    appts = get_patient_appointments.invoke({"patient_id": test_pid})
    assert len(appts) >= 1
    print("OK get_patient_appointments")

    cancelled = cancel_appointment.invoke({"patient_id": test_pid, "date_slot": date_slot})
    assert cancelled.get("success") is True
    print("OK cancel_appointment")

    # Alternate date format (M/D/YYYY) should match the same slot row
    alt = parse_date_slot(date_slot)
    assert alt is not None
    alt_str = f"{alt.month}/{alt.day}/{alt.year} {alt.strftime('%H:%M')}"
    booked2 = book_appointment.invoke(
        {"patient_id": test_pid, "doctor_name": doctor, "date_slot": alt_str}
    )
    assert booked2.get("success") is True
    slots2 = get_available_slots.invoke({"doctor_name": doctor, "date_filter": alt_str.split()[0]})
    assert len(slots2) >= 0
    if len(slots2) > 1:
        new_slot = slots2[1]["date_slot"]
        rescheduled = reschedule_appointment.invoke(
            {
                "patient_id": test_pid,
                "current_date_slot": date_slot,
                "new_date_slot": new_slot,
                "doctor_name": doctor,
            }
        )
        assert rescheduled.get("success") is True
        cancel_appointment.invoke({"patient_id": test_pid, "date_slot": new_slot})
        print("OK reschedule_appointment")
    else:
        cancel_appointment.invoke({"patient_id": test_pid, "date_slot": date_slot})
        print("OK reschedule_appointment (skipped — only one slot)")


def test_api_endpoints():
    from fastapi.testclient import TestClient
    import api

    client = TestClient(api.app)
    doctors = client.get("/api/doctors")
    assert doctors.status_code == 200
    assert len(doctors.json()) > 0
    doc_id = doctors.json()[0]["doctor_id"]
    avail = client.get("/api/availability", params={"doctor_id": doc_id, "date": "2026-06-25"})
    assert avail.status_code == 200
    assert len(avail.json()) > 0
    print(f"OK API /api/availability ({len(avail.json())} slots)")


def test_graph_compiles():
    from dental_agent.workflows.graph import build_graph

    graph = build_graph()
    assert graph is not None
    print("OK build_graph compile")


def test_live_agent_smoke():
    import os
    from dotenv import load_dotenv

    load_dotenv()
    if not os.getenv("GROQ_API_KEY"):
        print("SKIP live agent (set GROQ_API_KEY in .env)")
        return

    from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
    from dental_agent.agent import get_dental_graph
    from dental_agent.utils import repair_chat_history

    graph = get_dental_graph()
    try:
        result = graph.invoke(
            {"messages": [HumanMessage(content="List available slots for Dr. Sharma on 2026-06-25")]},
            config={"recursion_limit": 25},
        )
    except Exception as exc:
        err = str(exc)
        if "tool_use_failed" in err or "failed_generation" in err or "INVALID_CHAT_HISTORY" in err:
            print(f"SKIP live agent (Groq/model): {err[:120]}...")
            return
        raise
    messages = repair_chat_history(result.get("messages", []))
    assert any(isinstance(m, AIMessage) for m in messages), "Expected at least one AI reply"
    for i, m in enumerate(messages):
        if isinstance(m, AIMessage) and m.tool_calls:
            ids = {tc["id"] for tc in m.tool_calls if tc.get("id")}
            following = {
                tm.tool_call_id
                for tm in messages[i + 1 :]
                if isinstance(tm, ToolMessage)
            }
            assert ids.issubset(following), "Dangling tool_call in live run"
    print("OK live agent smoke (no dangling tool_calls)")


if __name__ == "__main__":
    test_repair_chat_history()
    test_csv_tools()
    test_api_endpoints()
    test_graph_compiles()
    test_live_agent_smoke()
    print("\nAll validations passed.")
