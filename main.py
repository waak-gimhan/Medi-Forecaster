from datetime import date
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from backend.database import get_dict_connection, init_tables
from backend.sales_service import (
    insert_closed_date,
    insert_daily_sales,
    get_closed_dates,
    get_sales_for_date,
)
from backend.inventory_service import (
    get_inventory,
    update_stock_bulk,
    get_latest_forecast_run_date,
)
from ml.src.db_forecast_runner import (
    run_full_forecast_workflow,
    compute_inventory_recommendations,
)

app = FastAPI(
    title="Pharmacy Medicine Demand Forecasting API",
    description="Daily sales entry + dynamic 7-day forecasting + inventory recommendations.",
    version="1.0.0",
)


class SalesEntry(BaseModel):
    medicine_id: str
    quantity_sold: int = Field(ge=0)


class DailySalesRequest(BaseModel):
    sale_date: date
    sales: List[SalesEntry] = Field(min_length=1)


class ClosedDateRequest(BaseModel):
    closed_date: date
    reason: Optional[str] = None


@app.on_event("startup")
def on_startup():
    init_tables()


@app.get("/")
def root():
    return {
        "message": "Pharmacy Demand Forecasting API",
        "docs": "/docs",
    }


@app.get("/medicines")
def list_medicines():
    conn = get_dict_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT medicine_id, medicine_name FROM medicines "
                "ORDER BY medicine_id;"
            )
            rows = cur.fetchall()
            return rows
    finally:
        conn.close()


@app.post("/sales/daily")
def enter_daily_sales(payload: DailySalesRequest):
    sales = [{"medicine_id": s.medicine_id, "quantity_sold": s.quantity_sold} for s in payload.sales]
    try:
        result = insert_daily_sales(payload.sale_date, sales)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/sales/closed")
def mark_day_closed(payload: ClosedDateRequest):
    try:
        result = insert_closed_date(payload.closed_date, payload.reason)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/sales/closed-dates")
def list_closed_dates():
    return get_closed_dates()


@app.get("/sales/by-date")
def sales_by_date(sale_date: date = Query(...)):
    return get_sales_for_date(sale_date)


class StockUpdate(BaseModel):
    medicine_id: str
    current_stock: int = Field(ge=0)


class StockUpdateRequest(BaseModel):
    updates: List[StockUpdate] = Field(min_length=1)


@app.get("/inventory")
def list_inventory():
    return get_inventory()


@app.put("/inventory")
def update_inventory(payload: StockUpdateRequest):
    updates = [
        {"medicine_id": u.medicine_id, "current_stock": u.current_stock}
        for u in payload.updates
    ]
    try:
        result = update_stock_bulk(updates)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/inventory/recompute")
def recompute_inventory():
    """Recompute recommendations for the latest forecast run using updated stock."""
    run_date = get_latest_forecast_run_date()
    try:
        saved = compute_inventory_recommendations(run_date=run_date)
        return {
            "status": "recommendations refreshed",
            "run_date": str(run_date),
            "recommendations_saved": saved,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/forecast/run")
def run_forecast(forecast_date: Optional[date] = Query(None, description="Reference date. Defaults to today.")):
    try:
        result = run_full_forecast_workflow(forecast_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/forecast/latest")
def get_latest_forecast(run_date: Optional[date] = Query(None)):
    conn = get_dict_connection()
    try:
        with conn.cursor() as cur:
            if run_date is None:
                cur.execute(
                    "SELECT COALESCE(MAX(forecast_run_date), CURRENT_DATE) "
                    "AS run_date FROM forecasts;"
                )
                run_date = cur.fetchone()["run_date"]

            cur.execute(
                """
                SELECT
                    f.medicine_id,
                    m.medicine_name,
                    f.forecast_date,
                    f.predicted_quantity,
                    f.forecast_run_date
                FROM forecasts f
                JOIN medicines m ON f.medicine_id = m.medicine_id
                WHERE f.forecast_run_date = %s
                ORDER BY f.medicine_id, f.forecast_date;
                """,
                (run_date,),
            )
            rows = cur.fetchall()
            return {
                "run_date": str(run_date),
                "count": len(rows),
                "forecasts": rows,
            }
    finally:
        conn.close()


@app.get("/recommendations")
def get_recommendations(run_date: Optional[date] = Query(None)):
    conn = get_dict_connection()
    try:
        with conn.cursor() as cur:
            if run_date is None:
                cur.execute(
                    "SELECT COALESCE(MAX(forecast_run_date), CURRENT_DATE) "
                    "AS run_date FROM forecasts;"
                )
                run_date = cur.fetchone()["run_date"]

            cur.execute(
                """
                SELECT
                    r.medicine_id,
                    m.medicine_name,
                    r.forecast_run_date,
                    r.seven_day_demand,
                    r.current_stock,
                    r.recommended_purchase,
                    r.status
                FROM inventory_recommendations r
                JOIN medicines m ON r.medicine_id = m.medicine_id
                WHERE r.forecast_run_date = %s
                ORDER BY r.status DESC, r.medicine_id;
                """,
                (run_date,),
            )
            rows = cur.fetchall()
            return {
                "run_date": str(run_date),
                "count": len(rows),
                "recommendations": rows,
            }
    finally:
        conn.close()