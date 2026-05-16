# UI Upgrade Plan

## Planned steps
1. Edit `frontend/src/pages/ChatPage.jsx` to add an action panel (quick actions) and wire up modal open/close state.
2. Create reusable `frontend/src/components/Modal.jsx` (basic dialog with overlay + accessibility helpers).
3. Create `frontend/src/components/BookAppointmentModal.jsx` that fetches doctors + slots and pre-fills a deterministic booking message.
4. Create `frontend/src/components/CancelAppointmentModal.jsx` that loads appointments for patientId, lets user select one, and pre-fills a deterministic cancel request message.
5. Create `frontend/src/components/RescheduleAppointmentModal.jsx` that loads appointments first, then allows selecting new doctor/date/slot, and pre-fills a deterministic reschedule request message.
6. Minor UI polish: loading/disabled states + consistent Tailwind styling in the new components.
7. Test flows manually:
   - Doctors/slots → open book modal → prefill → chat flow works.
   - Appointments → cancel/reschedule modal → prefill → chat flow works.
8. (Optional next) If UX still feels limited, implement backend structured endpoint.

