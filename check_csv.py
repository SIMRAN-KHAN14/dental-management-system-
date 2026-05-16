import pandas as pd
from dental_agent.config.settings import CSV_PATH

def show_csv():
    df = pd.read_csv(CSV_PATH)
    print(df[["doctor_name", "date_slot", "is_available", "patient_to_attend"]])

if __name__ == "__main__":
    show_csv()
