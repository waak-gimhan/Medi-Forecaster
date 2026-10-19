from pathlib import Path
import pandas as pd
import psycopg2


# ============================================
# PROJECT PATHS
# ============================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"

FORECAST_PATH = DATA_DIR / "forecast_7_days.csv"


# ============================================
# CHECK FORECAST FILE
# ============================================

print("Forecast path:")
print(FORECAST_PATH)

if not FORECAST_PATH.exists():
    raise FileNotFoundError(
        f"Forecast file not found:\n{FORECAST_PATH}"
    )


# ============================================
# LOAD FORECAST
# ============================================

forecast = pd.read_csv(FORECAST_PATH)

print("Forecast loaded successfully!")

print(
    "Number of forecast rows:",
    len(forecast)
)

print(
    "Number of medicines:",
    forecast["medicine_id"].nunique()
)


# ============================================
# CHECK EXPECTED DATA
# ============================================

expected_rows = (
    forecast["medicine_id"].nunique() * 7
)

if len(forecast) != expected_rows:
    raise ValueError(
        f"Expected {expected_rows} forecast rows, "
        f"but found {len(forecast)}."
    )


# ============================================
# POSTGRESQL CONNECTION
# ============================================

connection = psycopg2.connect(
    host="localhost",
    port=5432,
    database="pharmacy_demand",
    user="postgres",
    password=1234
)

cursor = connection.cursor()

print(
    "PostgreSQL connected successfully!"
)


# ============================================
# INSERT FORECASTS
# ============================================

print("Saving forecasts to PostgreSQL...")

for _, row in forecast.iterrows():

    cursor.execute(
        """
        INSERT INTO forecasts
        (
            medicine_id,
            forecast_date,
            predicted_quantity
        )

        VALUES (%s, %s, %s)

        ON CONFLICT
        (
            medicine_id,
            forecast_date
        )

        DO UPDATE SET
            predicted_quantity =
                EXCLUDED.predicted_quantity,

            created_at =
                CURRENT_TIMESTAMP;
        """,

        (
            row["medicine_id"],

            pd.to_datetime(
                row["date"]
            ).date(),

            int(
                row["predicted_quantity"]
            )
        )
    )


# ============================================
# COMMIT
# ============================================

connection.commit()

print(
    f"{len(forecast)} forecast records "
    "saved successfully!"
)


# ============================================
# CLOSE CONNECTION
# ============================================

cursor.close()

connection.close()

print(
    "PostgreSQL connection closed."
)