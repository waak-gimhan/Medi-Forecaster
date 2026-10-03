from datetime import date, datetime
import psycopg2
import psycopg2.extras

from backend.database import get_connection, get_dict_connection


def _parse_date(value) -> date:
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    return datetime.strptime(str(value), "%Y-%m-%d").date()


def is_closed(conn, day: date) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM pharmacy_closed_dates WHERE closed_date = %s;",
            (day,),
        )
        return cur.fetchone() is not None


def validate_medicine(conn, medicine_id: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM medicines WHERE medicine_id = %s;",
            (medicine_id,),
        )
        return cur.fetchone() is not None


def insert_closed_date(day: date, reason: str = None) -> dict:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            existing_sales = _sales_exist_for_date(conn, day)
            if existing_sales:
                raise ValueError(
                    f"Cannot mark {day} as CLOSED: sales records "
                    f"already exist for this date. "
                    f"Delete those sales first."
                )

            cur.execute(
                """
                INSERT INTO pharmacy_closed_dates
                    (closed_date, reason)
                VALUES (%s, %s)
                ON CONFLICT (closed_date)
                DO UPDATE SET
                    reason = EXCLUDED.reason,
                    created_at = CURRENT_TIMESTAMP;
                """,
                (day, reason),
            )
        conn.commit()
        return {"closed_date": str(day), "reason": reason, "status": "CLOSED"}
    finally:
        conn.close()


def insert_daily_sales(day: date, sales: list) -> dict:
    day = _parse_date(day)

    if not sales:
        raise ValueError("No sales entries provided.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM pharmacy_closed_dates WHERE closed_date = %s;",
                (day,),
            )
            if cur.fetchone() is not None:
                raise ValueError(
                    f"{day} is marked as CLOSED. "
                    f"Sales cannot be entered for a closed date."
                )

            processed = 0
            for entry in sales:
                medicine_id = entry.get("medicine_id")
                quantity = entry.get("quantity_sold")

                if not medicine_id:
                    raise ValueError("medicine_id is required for each entry.")

                if quantity is None:
                    raise ValueError(
                        f"quantity_sold is required for {medicine_id}."
                    )

                try:
                    quantity = int(quantity)
                except (TypeError, ValueError):
                    raise ValueError(
                        f"quantity_sold must be an integer for {medicine_id}."
                    )

                if quantity < 0:
                    raise ValueError(
                        f"quantity_sold must be >= 0 for {medicine_id}."
                    )

                cur.execute(
                    "SELECT 1 FROM medicines WHERE medicine_id = %s;",
                    (medicine_id,),
                )
                if cur.fetchone() is None:
                    raise ValueError(
                        f"Medicine {medicine_id} does not exist in the "
                        f"medicines table."
                    )

                cur.execute(
                    """
                    INSERT INTO sales
                        (medicine_id, sale_date, quantity_sold)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (medicine_id, sale_date)
                    DO UPDATE SET
                        quantity_sold = EXCLUDED.quantity_sold;
                    """,
                    (medicine_id, day, quantity),
                )
                processed += 1

        conn.commit()
        return {
            "sale_date": str(day),
            "status": "OPEN - sales saved",
            "entries_processed": processed,
            "total_entries": len(sales),
        }
    finally:
        conn.close()


def get_closed_dates() -> list:
    conn = get_dict_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT closed_date, reason, created_at "
                "FROM pharmacy_closed_dates ORDER BY closed_date;"
            )
            rows = cur.fetchall()
            return [
                {
                    "closed_date": str(r["closed_date"]),
                    "reason": r["reason"],
                }
                for r in rows
            ]
    finally:
        conn.close()


def get_sales_for_date(day: date) -> list:
    day = _parse_date(day)
    conn = get_dict_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    s.medicine_id,
                    m.medicine_name,
                    s.quantity_sold
                FROM sales s
                JOIN medicines m
                    ON s.medicine_id = m.medicine_id
                WHERE s.sale_date = %s
                ORDER BY s.medicine_id;
                """,
                (day,),
            )
            rows = cur.fetchall()
            return [
                {
                    "medicine_id": r["medicine_id"],
                    "medicine_name": r["medicine_name"],
                    "quantity_sold": r["quantity_sold"],
                }
                for r in rows
            ]
    finally:
        conn.close()


def _sales_exist_for_date(conn, day: date) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM sales WHERE sale_date = %s LIMIT 1;",
            (day,),
        )
        return cur.fetchone() is not None