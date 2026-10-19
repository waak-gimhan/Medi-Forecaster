from datetime import date
from typing import List, Dict

from backend.database import get_connection, get_dict_connection


def get_inventory() -> list:
    conn = get_dict_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    i.medicine_id,
                    m.medicine_name,
                    i.current_stock,
                    i.updated_at
                FROM inventory i
                JOIN medicines m
                    ON i.medicine_id = m.medicine_id
                ORDER BY i.medicine_id;
                """
            )
            rows = cur.fetchall()
            return [
                {
                    "medicine_id": r["medicine_id"],
                    "medicine_name": r["medicine_name"],
                    "current_stock": r["current_stock"],
                    "updated_at": str(r["updated_at"]),
                }
                for r in rows
            ]
    finally:
        conn.close()


def update_stock_bulk(updates: List[Dict]) -> dict:
    if not updates:
        raise ValueError("No stock updates provided.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            processed = 0
            for entry in updates:
                medicine_id = entry.get("medicine_id")
                stock = entry.get("current_stock")

                if not medicine_id:
                    raise ValueError("medicine_id is required for each update.")

                if stock is None:
                    raise ValueError(
                        f"current_stock is required for {medicine_id}."
                    )

                try:
                    stock = int(stock)
                except (TypeError, ValueError):
                    raise ValueError(
                        f"current_stock must be an integer for {medicine_id}."
                    )

                if stock < 0:
                    raise ValueError(
                        f"current_stock must be >= 0 for {medicine_id}."
                    )

                cur.execute(
                    "SELECT 1 FROM medicines WHERE medicine_id = %s;",
                    (medicine_id,),
                )
                if cur.fetchone() is None:
                    raise ValueError(
                        f"Medicine {medicine_id} does not exist."
                    )

                cur.execute(
                    """
                    INSERT INTO inventory
                        (medicine_id, current_stock, updated_at)
                    VALUES (%s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (medicine_id)
                    DO UPDATE SET
                        current_stock = EXCLUDED.current_stock,
                        updated_at = CURRENT_TIMESTAMP;
                    """,
                    (medicine_id, stock),
                )
                processed += 1

        conn.commit()
        return {
            "updated": processed,
            "status": "inventory updated",
        }
    finally:
        conn.close()


def get_latest_forecast_run_date() -> date:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COALESCE(MAX(forecast_run_date), CURRENT_DATE) "
                "FROM forecasts;"
            )
            return cur.fetchone()[0]
    finally:
        conn.close()