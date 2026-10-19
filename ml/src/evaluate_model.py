from train_model import FEATURES, model, X_test, y_test,test
import pandas as pd
from pathlib import Path

y_pred = model.predict(X_test)
print(y_pred[:10])

#evaluate the model
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

import numpy as np

mae = mean_absolute_error(
    y_test,
    y_pred
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        y_pred
    )
)

r2 = r2_score(
    y_test,
    y_pred
)

print("MAE :", mae)
print("RMSE:", rmse)
print("R²  :", r2)


#calculate performance for each medicines
test_results = test[
    ["medicine_id", "medicine_name", "date", "quantity_sold"]
].copy()

test_results["predicted"] = y_pred

medicine_mae = (
    test_results
    .groupby("medicine_name")
    .apply(
        lambda x: mean_absolute_error(
            x["quantity_sold"],
            x["predicted"]
        )
    )
)

print(medicine_mae)

#check feature importance
importance = pd.DataFrame({
    "feature": FEATURES,
    "importance": model.feature_importances_
})

importance = importance.sort_values(
    "importance",
    ascending=False
)

print(importance)

#save the model in ml/models/random_forest_v1.pkl

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "random_forest_v1.pkl"

import joblib

joblib.dump(
    model,
    MODEL_PATH
)
print ("Model save successfully!")
print("Model path:", MODEL_PATH)