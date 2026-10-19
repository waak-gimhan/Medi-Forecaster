import pandas as pd

from backend.database import get_connection

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


def load_sales_from_db(exclude_date=None):
    conn = get_connection()
    try:
        query = """
            SELECT
                s.medicine_id,
                m.medicine_name,
                s.sale_date AS date,
                s.quantity_sold
            FROM sales s
            JOIN medicines m
                ON s.medicine_id = m.medicine_id
            ORDER BY s.medicine_id, s.sale_date;
        """
        df = pd.read_sql(query, conn)

        if exclude_date is not None:
            before = len(df)
            df = df[df["date"] != pd.Timestamp(exclude_date)]
            removed = before - len(df)
            if removed:
                print(
                    f"[load_sales_from_db] Excluded closed date "
                    f"{exclude_date}: removed {removed} rows."
                )

        return df
    finally:
        conn.close()


def load_closed_dates():
    conn = get_connection()
    try:
        query = "SELECT closed_date FROM pharmacy_closed_dates ORDER BY closed_date;"
        df = pd.read_sql(query, conn)
        return pd.to_datetime(df["closed_date"]).dt.date.tolist() if not df.empty else []
    finally:
        conn.close()


def load_and_prepare_data_db(exclude_date=None):
    df = load_sales_from_db(exclude_date=exclude_date)

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["medicine_id", "date"]).reset_index(drop=True)

    # Date features
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_month"] = df["date"].dt.day
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)
    df["month"] = df["date"].dt.month
    df["quarter"] = df["date"].dt.quarter
    df["year"] = df["date"].dt.year
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Lag features
    df["lag_1"] = df.groupby("medicine_id")["quantity_sold"].shift(1)
    df["lag_7"] = df.groupby("medicine_id")["quantity_sold"].shift(7)
    df["lag_14"] = df.groupby("medicine_id")["quantity_sold"].shift(14)
    df["lag_30"] = df.groupby("medicine_id")["quantity_sold"].shift(30)

    # Rolling features
    grouped = df.groupby("medicine_id")["quantity_sold"]
    df["rolling_mean_7"] = grouped.transform(lambda x: x.shift(1).rolling(7).mean())
    df["rolling_mean_14"] = grouped.transform(lambda x: x.shift(1).rolling(14).mean())
    df["rolling_mean_30"] = grouped.transform(lambda x: x.shift(1).rolling(30).mean())
    df["rolling_std_7"] = grouped.transform(lambda x: x.shift(1).rolling(7).std())
    df["rolling_std_30"] = grouped.transform(lambda x: x.shift(1).rolling(30).std())

    return df


if __name__ == "__main__":
    df = load_and_prepare_data_db()
    print("DataFrame shape:", df.shape)
    print("Latest date:", df["date"].max())
    print("Medicines:", df["medicine_id"].nunique())