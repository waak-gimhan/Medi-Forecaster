import pandas as pd
import numpy as np
import joblib
from pathlib import Path

from load_data import load_and_prepare_data

# ==========================================
# LOAD TRAINED MODEL + PREPARE DATA
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "random_forest_v1.pkl"

model = joblib.load(MODEL_PATH)
print("Model loaded successfully!")

# Prepare data (create features)
df = load_and_prepare_data()

df = df.sort_values(["medicine_id", "date"]).reset_index(drop=True)

print("Data prepared successfully!")
print("Number of medicines:", df["medicine_id"].nunique())
print("Latest date:", df["date"].max())

# FEATURES used by the model (same as in load_data.prepare_train_test)
FEATURES = [
    "day_of_week",
    "day_of_month",
    "week_of_year",
    "month",
    "quarter",
    "year",
    "is_weekend",
    "lag_1",
    "lag_7",
    "lag_14",
    "lag_30",
    "rolling_mean_7",
    "rolling_mean_14",
    "rolling_mean_30",
    "rolling_std_7",
    "rolling_std_30",
]


def forecast_medicine(medicine_df, model, days=7):
    medicine_df = medicine_df.copy()
    medicine_df = medicine_df.sort_values("date").reset_index(drop=True)

    predictions = []

    for _ in range(days):
        last_date = medicine_df["date"].max()
        next_date = last_date + pd.Timedelta(days=1)

        # Date features
        day_of_week = next_date.dayofweek
        day_of_month = next_date.day
        week_of_year = next_date.isocalendar().week
        month = next_date.month
        quarter = (next_date.month - 1) // 3 + 1
        year = next_date.year
        is_weekend = int(day_of_week >= 5)

        # Lag features (take last available values if enough history exists)
        def safe_iloc(s, idx):
            try:
                return s.iloc[idx]
            except Exception:
                return np.nan

        lag_1 = safe_iloc(medicine_df["quantity_sold"], -1)
        lag_7 = safe_iloc(medicine_df["quantity_sold"], -7)
        lag_14 = safe_iloc(medicine_df["quantity_sold"], -14)
        lag_30 = safe_iloc(medicine_df["quantity_sold"], -30)

        # Rolling features
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

        # Predict (model expects the FEATURES order)
        prediction = model.predict(X_future[FEATURES])[0]
        prediction = max(0, prediction)
        prediction = round(prediction)

        # Append to history for recursive forecasting
        new_row = pd.DataFrame({"date": [next_date], "quantity_sold": [prediction]})
        medicine_df = pd.concat([medicine_df, new_row], ignore_index=True)

        predictions.append({"date": next_date, "predicted_quantity": prediction})

    return pd.DataFrame(predictions)


if __name__ == "__main__":
    # Example: forecast for a single medicine
    medicine_id = "MED001"
    medicine_df = df[df["medicine_id"] == medicine_id].copy()
    print(forecast_medicine(medicine_df, model, days=7))

    # Forecast for all medicines
    all_forecasts_list = []
    for med_id, med_df in df.groupby("medicine_id"):
        print(f"Forecasting {med_id}...")
        f = forecast_medicine(med_df, model, days=7)
        f["medicine_id"] = med_id
        all_forecasts_list.append(f)

    if all_forecasts_list:
        all_forecasts = pd.concat(all_forecasts_list, ignore_index=True)
    else:
        all_forecasts = pd.DataFrame(columns=["date", "predicted_quantity", "medicine_id"])

    print("Forecast rows:", len(all_forecasts))

    medicine_names = df[["medicine_id", "medicine_name"]].drop_duplicates()
    all_forecasts = all_forecasts.merge(medicine_names, on="medicine_id", how="left")

    # Save forecasts
    OUT_PATH = BASE_DIR / "data" / "forecast_7_days.csv"
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    all_forecasts.to_csv(OUT_PATH, index=False)
    print("Saved forecasts to:", OUT_PATH)

    # Optional: produce simple 7-day demand summary
    seven_day_demand = (
        all_forecasts.groupby(["medicine_id", "medicine_name"]) ["predicted_quantity"].sum().reset_index()
    )
    print(seven_day_demand.head())