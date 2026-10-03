import pandas as pd
import numpy as np
import joblib
from pathlib import Path

from ml.src.load_data_db import (
    load_and_prepare_data_db,
    load_closed_dates,
    FEATURES,
)

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "random_forest_v1.pkl"


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def forecast_medicine(medicine_df, model, days=7, start_date=None):
    medicine_df = medicine_df.copy()
    medicine_df = medicine_df.sort_values("date").reset_index(drop=True)

    if start_date is None:
        start_date = medicine_df["date"].max() + pd.Timedelta(days=1)

    current = pd.Timestamp(start_date)
    predictions = []

    for _ in range(days):
        next_date = current

        day_of_week = next_date.dayofweek
        day_of_month = next_date.day
        week_of_year = next_date.isocalendar().week
        month = next_date.month
        quarter = (next_date.month - 1) // 3 + 1
        year = next_date.year
        is_weekend = int(day_of_week >= 5)

        def safe_iloc(s, idx):
            try:
                return s.iloc[idx]
            except Exception:
                return np.nan

        lag_1 = safe_iloc(medicine_df["quantity_sold"], -1)
        lag_7 = safe_iloc(medicine_df["quantity_sold"], -7)
        lag_14 = safe_iloc(medicine_df["quantity_sold"], -14)
        lag_30 = safe_iloc(medicine_df["quantity_sold"], -30)

        rolling_mean_7 = medicine_df["quantity_sold"].iloc[-7:].mean()
        rolling_mean_14 = medicine_df["quantity_sold"].iloc[-14:].mean()
        rolling_mean_30 = medicine_df["quantity_sold"].iloc[-30:].mean()
        rolling_std_7 = medicine_df["quantity_sold"].iloc[-7:].std()
        rolling_std_30 = medicine_df["quantity_sold"].iloc[-30:].std()

        X_future = pd.DataFrame([
            {
                "day_of_week": day_of_week,
                "day_of_month": day_of_month,
                "week_of_year": int(week_of_year),
                "month": month,
                "quarter": quarter,
                "year": year,
                "is_weekend": is_weekend,
                "lag_1": lag_1,
                "lag_7": lag_7,
                "lag_14": lag_14,
                "lag_30": lag_30,
                "rolling_mean_7": rolling_mean_7,
                "rolling_mean_14": rolling_mean_14,
                "rolling_mean_30": rolling_mean_30,
                "rolling_std_7": rolling_std_7,
                "rolling_std_30": rolling_std_30,
            }
        ])

        prediction = model.predict(X_future[FEATURES])[0]
        prediction = max(0, prediction)
        prediction = round(prediction)

        new_row = pd.DataFrame({"date": [next_date], "quantity_sold": [prediction]})
        medicine_df = pd.concat([medicine_df, new_row], ignore_index=True)

        predictions.append({"date": next_date, "predicted_quantity": prediction})
        current = current + pd.Timedelta(days=1)

    return pd.DataFrame(predictions)


def generate_7_day_forecast(forecast_date=None, days=7):
    closed_dates = load_closed_dates()
    today = pd.Timestamp(forecast_date or pd.Timestamp.today().normalize())

    exclude = None
    if today.date() in closed_dates:
        exclude = today.date()
        print(
            f"[forecast_engine] {today.date()} is CLOSED. "
            f"Excluding it from ML input."
        )
    else:
        print(
            f"[forecast_engine] {today.date()} is OPEN. "
            f"Today's sales will be included."
        )

    df = load_and_prepare_data_db(exclude_date=exclude)
    df = df.sort_values(["medicine_id", "date"]).reset_index(drop=True)

    model = load_model()
    print("[forecast_engine] Model loaded successfully!")
    print("[forecast_engine] Latest sales date in DB:", df["date"].max())

    start_date = today + pd.Timedelta(days=1)
    print(
        "[forecast_engine] Forecast window: "
        f"{start_date.date()} to "
        f"{(start_date + pd.Timedelta(days=days - 1)).date()}"
    )

    all_forecasts_list = []
    for med_id, med_df in df.groupby("medicine_id"):
        f = forecast_medicine(med_df, model, days=days, start_date=start_date)
        f["medicine_id"] = med_id
        all_forecasts_list.append(f)

    if all_forecasts_list:
        all_forecasts = pd.concat(all_forecasts_list, ignore_index=True)
    else:
        all_forecasts = pd.DataFrame(
            columns=["date", "predicted_quantity", "medicine_id"]
        )

    medicine_names = df[["medicine_id", "medicine_name"]].drop_duplicates()
    all_forecasts = all_forecasts.merge(medicine_names, on="medicine_id", how="left")

    print("[forecast_engine] Forecast rows:", len(all_forecasts))
    return all_forecasts


if __name__ == "__main__":
    import sys
    fc_date = sys.argv[1] if len(sys.argv) > 1 else None
    result = generate_7_day_forecast(forecast_date=fc_date)
    print(result.head(20))