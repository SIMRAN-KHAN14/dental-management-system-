from dental_agent.tools.csv_writer import book_appointment, cancel_appointment, reschedule_appointment
from dental_agent.tools.csv_reader import get_patient_appointments, check_slot_availability

def run_tests():
    print("Booking appointment...")
    print(book_appointment.func("1000082", "emily johnson", "5/10/2026 9:00"))

    print("\nChecking patient appointments...")
    print(get_patient_appointments.func("1000082"))

    print("\nCancelling appointment...")
    print(cancel_appointment.func("1000082", "5/10/2026 9:00"))

    print("\nRescheduling appointment...")
    print(reschedule_appointment.func("1000082", "5/10/2026 9:00", "5/12/2026 10:00", "emily johnson"))

    print("\nChecking slot availability...")
    print(check_slot_availability.func("emily johnson", "5/12/2026 10:00"))

if __name__ == "__main__":
    run_tests()
