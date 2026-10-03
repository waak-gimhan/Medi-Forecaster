import pandas as pd
import psycopg2


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

print(
    "PostgreSQL connected successfully!"
)

# ============================================
# GET 7-DAY DEMAND
# ============================================

forecast_query = """
    SELECT
        f.medicine_id,
        m.medicine_name,
        SUM(f.predicted_quantity)
            AS seven_day_demand

    FROM forecasts f

    JOIN medicines m
        ON f.medicine_id = m.medicine_id

    GROUP BY
        f.medicine_id,
        m.medicine_name

    ORDER BY
        f.medicine_id;
"""

forecast = pd.read_sql(
    forecast_query,
    connection
)

print("\n7-Day demand:")
print(forecast)

# ============================================
# GET CURRENT INVENTORY
# ============================================

inventory_query = """
    SELECT
        i.medicine_id,
        i.current_stock

    FROM inventory i

    ORDER BY
        i.medicine_id;
"""

inventory = pd.read_sql(
    inventory_query,
    connection
)

print("\nCurrent inventory:")
print(inventory)

# ============================================
# COMBINE FORECAST + INVENTORY
# ============================================

recommendations = forecast.merge(
    inventory,
    on="medicine_id",
    how="left"
)

# ============================================
# PURCHASE RECOMMENDATION
# ============================================

recommendations[
    "recommended_purchase"
] = (
    recommendations["seven_day_demand"]
    - recommendations["current_stock"]
).clip(lower=0)

# ============================================
# STOCK STATUS
# ============================================

recommendations["status"] = "SUFFICIENT"

recommendations.loc[
    recommendations["recommended_purchase"] > 0,
    "status"
] = "BUY"

print("\n============================================")
print("INVENTORY PURCHASE RECOMMENDATIONS")
print("============================================")

print(
    recommendations.to_string(
        index=False
    )
)

connection.close()

print(
    "\nPostgreSQL connection closed."
)