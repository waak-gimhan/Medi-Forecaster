import pandas as pd
from datetime import date

from backend.database import get_connection
from ml.src.forecast_engine import generate_7_day_forecast


def save_forecasts_to_db(forecasts: pd.DataFrame, run_date: date = None):
    run_date = run_date or date.today()

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            for _, row in forecasts.iterrows():
                cur.execute(
                    """
                    INSERT INTO forecasts
                        (medicine_id, forecast_date,
                         predicted_quantity, forecast_run_date)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT
                        (medicine_id, forecast_date, forecast_run_date)
                    DO UPDATE SET
                        predicted_quantity = EXCLUDED.predicted_quantity,
                        created_at = CURRENT_TIMESTAMP;
                    """,
                    (
                        row["medicine_id"],
                        pd.to_datetime(row["date"]).date(),
                        int(row["predicted_quantity"]),
                        run_date,
                    ),
                )
        conn.commit()
        print(f"[db_forecast_runner] Saved {len(forecasts)} forecast rows.")
        return len(forecasts)
    finally:
        conn.close()


def compute_inventory_recommendations(run_date: date = None):
    run_date = run_date or date.today()

    conn = get_connection()
    try:
        forecast_query = """
            SELECT
                f.medicine_id,
                m.medicine_name,
                MIN(f.forecast_date) AS forecast_start_date,
                MAX(f.forecast_date) AS forecast_end_date,
                SUM(f.predicted_quantity) AS seven_day_demand
            FROM forecasts f
            JOIN medicines m ON f.medicine_id = m.medicine_id
            WHERE f.forecast_run_date = %s
            GROUP BY f.medicine_id, m.medicine_name
            ORDER BY f.medicine_id;
        """
        forecasts = pd.read_sql(forecast_query, conn, params=(run_date,))

        inventory_query = """
            SELECT medicine_id, current_stock
            FROM inventory
            ORDER BY medicine_id;
        """
        inventory = pd.read_sql(inventory_query, conn)

        if forecasts.empty:
            print("[db_forecast_runner] No forecasts for this run date.")
            return 0

        recommendations = forecasts.merge(
            inventory, on="medicine_id", how="left"
        )
        recommendations["current_stock"] = (
            recommendations["current_stock"].fillna(0).astype(int)
        )
        recommendations["recommended_purchase"] = (
            recommendations["seven_day_demand"]
            - recommendations["current_stock"]
        ).clip(lower=0).astype(int)

        recommendations["status"] = "SUFFICIENT"
        recommendations.loc[
            recommendations["recommended_purchase"] > 0, "status"
        ] = "BUY"

        with conn.cursor() as cur:
            for _, row in recommendations.iterrows():
                cur.execute(
                    """
                    INSERT INTO inventory_recommendations
                        (medicine_id, forecast_run_date,
                         forecast_start_date, forecast_end_date,
                         seven_day_demand,
                         current_stock, recommended_purchase, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (medicine_id, forecast_run_date)
                    DO UPDATE SET
                        forecast_start_date = EXCLUDED.forecast_start_date,
                        forecast_end_date = EXCLUDED.forecast_end_date,
                        seven_day_demand = EXCLUDED.seven_day_demand,
                        current_stock = EXCLUDED.current_stock,
                        recommended_purchase = EXCLUDED.recommended_purchase,
                        status = EXCLUDED.status,
                        created_at = CURRENT_TIMESTAMP;
                    """,
                    (
                        row["medicine_id"],
                        run_date,
                        row["forecast_start_date"],
                        row["forecast_end_date"],
                        int(row["seven_day_demand"]),
                        int(row["current_stock"]),
                        int(row["recommended_purchase"]),
                        row["status"],
                    ),
                )
        conn.commit()
        print(
            f"[db_forecast_runner] Saved {len(recommendations)} "
            f"inventory recommendations for run date {run_date}."
        )
        return len(recommendations)
    finally:
        conn.close()


def run_full_forecast_workflow(forecast_date: date = None) -> dict:
    if isinstance(forecast_date, str):
        forecast_date = date.fromisoformat(forecast_date)
    reference_date = forecast_date or date.today()

    result = {}

    forecasts = generate_7_day_forecast(forecast_date=reference_date)
    result["forecast_rows"] = len(forecasts)

    saved = save_forecasts_to_db(forecasts, run_date=reference_date)
    result["forecasts_saved"] = saved
    result["run_date"] = str(reference_date)

    recs = compute_inventory_recommendations(run_date=reference_date)
    result["recommendations_saved"] = recs

    return result


if __name__ == "__main__":
    import sys
    fc_date = sys.argv[1] if len(sys.argv) > 1 else None
    fc_date = date.fromisoformat(fc_date) if fc_date else None
    result = run_full_forecast_workflow(fc_date)
    print("Workflow result:", result)