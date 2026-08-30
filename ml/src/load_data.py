from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "medicine_sales_dataset_2020_2026.csv"


def load_and_prepare_data():

    # Load dataset
    df = pd.read_csv(DATA_PATH)

    # Convert date
    df["date"] = pd.to_datetime(df["date"])

    # Sort data
    df = df.sort_values(
        ["medicine_id", "date"]
    ).reset_index(drop=True)

    # Date features
    df["day_of_week"] = df["date"].dt.dayofweek

    df["day_of_month"] = df["date"].dt.day

    df["week_of_year"] = (
        df["date"]
        .dt.isocalendar()
        .week
        .astype(int)
    )

    df["month"] = df["date"].dt.month

    df["quarter"] = df["date"].dt.quarter

    df["year"] = df["date"].dt.year

    df["is_weekend"] = (
        df["day_of_week"] >= 5
    ).astype(int)

    # Lag features
    df["lag_1"] = (
        df.groupby("medicine_id")["quantity_sold"]
        .shift(1)
    )

    df["lag_7"] = (
        df.groupby("medicine_id")["quantity_sold"]
        .shift(7)
    )

    df["lag_14"] = (
        df.groupby("medicine_id")["quantity_sold"]
        .shift(14)
    )

    df["lag_30"] = (
        df.groupby("medicine_id")["quantity_sold"]
        .shift(30)
    )

    # Rolling features
    grouped = df.groupby("medicine_id")["quantity_sold"]

    df["rolling_mean_7"] = grouped.transform(
        lambda x: x.shift(1).rolling(7).mean()
    )

    df["rolling_mean_14"] = grouped.transform(
        lambda x: x.shift(1).rolling(14).mean()
    )

    df["rolling_mean_30"] = grouped.transform(
        lambda x: x.shift(1).rolling(30).mean()
    )

    df["rolling_std_7"] = grouped.transform(
        lambda x: x.shift(1).rolling(7).std()
    )

    df["rolling_std_30"] = grouped.transform(
        lambda x: x.shift(1).rolling(30).std()
    )

    return df
#ddefine featues
def prepare_train_test(df):

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
        "rolling_std_30"
    ]

    TARGET = "quantity_sold"

    # Remove rows without enough history
    df_model = df.dropna(
        subset=FEATURES
    ).copy()

    # Time-based split
    train = df_model[
        df_model["date"] <= "2025-12-31"
    ]

    test = df_model[
        df_model["date"] >= "2026-01-01"
    ]

    X_train = train[FEATURES]
    y_train = train[TARGET]

    X_test = test[FEATURES]
    y_test = test[TARGET]

    return (
        X_train,
        y_train,
        X_test,
        y_test,
        FEATURES,
        test
    )