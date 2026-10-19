from load_data import (
    load_and_prepare_data,
    prepare_train_test
)

from sklearn.ensemble import RandomForestRegressor


# Load and prepare data
df = load_and_prepare_data()


# Create train/test data
(
    X_train,
    y_train,
    X_test,
    y_test,
    FEATURES,
    test
) = prepare_train_test(df)


# Create Random Forest
model = RandomForestRegressor(
    n_estimators=300,
    random_state=42,
    n_jobs=-1
)


# Train
model.fit(
    X_train,
    y_train
)


print("Model training completed!")

