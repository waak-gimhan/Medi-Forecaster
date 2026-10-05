import os
import psycopg2
from psycopg2.extras import RealDictCursor

# 1. Get the connection URL from the environment, fallback to localhost if not found
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:1234@localhost:5432/pharmacy_demand"
)

# 2. Helper functions to connect using the URL string
def get_connection():
    return psycopg2.connect(DATABASE_URL)


def get_dict_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)



def _table_exists(cur, table_name: str) -> bool:
    cur.execute(
        "SELECT 1 FROM information_schema.tables "
        "WHERE table_schema='public' AND table_name=%s;",
        (table_name,),
    )
    return cur.fetchone() is not None


def _drop_unique_constraint(cur, table_name: str, like: str):
    cur.execute(
        """
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = %s::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) ILIKE %s;
        """,
        (table_name, f"%{like}%"),
    )
    rows = cur.fetchall()
    for (conname,) in rows:
        cur.execute(f'ALTER TABLE {table_name} DROP CONSTRAINT "{conname}";')


def init_tables():
    conn = get_connection()
    cur = conn.cursor()

    # --- pharmacy_closed_dates (new table) ---
    cur.execute("""
        CREATE TABLE IF NOT EXISTS pharmacy_closed_dates (
            closed_date DATE PRIMARY KEY,
            reason VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # --- forecasts: add forecast_run_date (safe migration, keeps old data) ---
    if _table_exists(cur, "forecasts"):
        cur.execute("""
            ALTER TABLE forecasts
            ADD COLUMN IF NOT EXISTS forecast_run_date DATE
                NOT NULL DEFAULT CURRENT_DATE;
        """)
        _drop_unique_constraint(cur, "forecasts", "medicine_id%forecast_date")
        cur.execute("""
            ALTER TABLE forecasts
            ADD CONSTRAINT forecasts_med_date_run_key
                UNIQUE (medicine_id, forecast_date, forecast_run_date);
        """)
    else:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS forecasts (
                forecast_id SERIAL PRIMARY KEY,
                medicine_id VARCHAR(20) NOT NULL,
                forecast_date DATE NOT NULL,
                predicted_quantity INTEGER NOT NULL,
                forecast_run_date DATE NOT NULL DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (medicine_id, forecast_date, forecast_run_date)
            );
        """)

    # --- inventory_recommendations: add forecast_run_date (safe migration) ---
    if _table_exists(cur, "inventory_recommendations"):
        cur.execute("""
            ALTER TABLE inventory_recommendations
            ADD COLUMN IF NOT EXISTS forecast_run_date DATE
                NOT NULL DEFAULT CURRENT_DATE;
        """)
        _drop_unique_constraint(cur, "inventory_recommendations", "medicine_id")
        cur.execute("""
            ALTER TABLE inventory_recommendations
            ADD CONSTRAINT inventory_recs_med_run_key
                UNIQUE (medicine_id, forecast_run_date);
        """)
    else:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS inventory_recommendations (
                recommendation_id SERIAL PRIMARY KEY,
                medicine_id VARCHAR(20) NOT NULL,
                forecast_run_date DATE NOT NULL DEFAULT CURRENT_DATE,
                forecast_start_date DATE,
                forecast_end_date DATE,
                seven_day_demand INTEGER NOT NULL,
                current_stock INTEGER NOT NULL,
                recommended_purchase INTEGER NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (medicine_id, forecast_run_date)
            );
        """)

    conn.commit()
    cur.close()
    conn.close()
    print("Database tables verified/created successfully.")


if __name__ == "__main__":
    init_tables()