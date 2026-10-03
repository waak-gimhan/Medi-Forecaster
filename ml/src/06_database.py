from pathlib import Path
import pandas as pd
import psycopg2


# ============================================
# PROJECT PATHS
# ============================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"

CSV_PATH = DATA_DIR / "medicine_sales_dataset_2020_2026.csv"


# ============================================
# LOAD DATASET
# ============================================

print("Dataset path:")
print(CSV_PATH)

if not CSV_PATH.exists():
    raise FileNotFoundError(
        f"Dataset not found:\n{CSV_PATH}"
    )

df = pd.read_csv(CSV_PATH)

print("Dataset loaded successfully!")
print("Number of records:", len(df))
print(
    "Number of medicines:",
    df["medicine_id"].nunique()
)


# ============================================
# PREPARE MEDICINE DATA
# ============================================

medicines = (
    df[
        ["medicine_id", "medicine_name"]
    ]
    .drop_duplicates()
    .reset_index(drop=True)
)

print(
    "Unique medicines prepared:",
    len(medicines)
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

print("PostgreSQL connected successfully!")


# ============================================
# INSERT MEDICINES
# ============================================

for _, row in medicines.iterrows():

    cursor.execute(
        """
        INSERT INTO medicines
        (
            medicine_id,
            medicine_name
        )
        VALUES (%s, %s)

        ON CONFLICT (medicine_id)
        DO NOTHING;
        """,
        (
            row["medicine_id"],
            row["medicine_name"]
        )
    )


# ============================================
# COMMIT
# ============================================

connection.commit()

print(
    f"{len(medicines)} medicines inserted successfully!"
)

# ============================================
# INSERT HISTORICAL SALES
# ============================================

print("Starting sales data import...")

for _, row in df.iterrows():

    cursor.execute(
        """
        INSERT INTO sales
        (
            medicine_id,
            sale_date,
            quantity_sold
        )
        VALUES (%s, %s, %s)

        ON CONFLICT
        (medicine_id, sale_date)
        DO NOTHING;
        """,
        (
            row["medicine_id"],
            pd.to_datetime(row["date"]).date(),
            int(row["quantity_sold"])
        )
    )

connection.commit()

print(
    f"{len(df)} sales records processed successfully!"
)


# ============================================
# CLOSE CONNECTION
# ============================================

cursor.close()
connection.close()

print("PostgreSQL connection closed.")