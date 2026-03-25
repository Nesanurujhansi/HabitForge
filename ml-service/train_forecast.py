"""
HabitForge ML — Time-Series Training Pipeline
Trains both ARIMA and LSTM models on user consistency scores.
Automatically selects the best-performing model.
"""
import os
import sys
import warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

import config
from data_loader import build_daily_consistency_series, load_habit_logs

warnings.filterwarnings("ignore")


# ─────────────────────────────────────────────────────────────────────────────────
# ARIMA MODEL
# ─────────────────────────────────────────────────────────────────────────────────
def train_arima(series: pd.Series):
    """
    Train a Seasonal ARIMA model on daily consistency scores.
    Uses auto-detection of optimal (p,d,q) via grid search.
    """
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.stattools import adfuller

    print("\n[TRAIN] Training ARIMA Model...")

    # Stationarity test
    adf_result = adfuller(series.dropna())
    d = 0 if adf_result[1] < 0.05 else 1
    print(f"   ADF p-value: {adf_result[1]:.4f} → d={d}")

    # Grid search for best (p, q)
    best_aic = float("inf")
    best_order = (1, d, 1)

    for p in range(0, 4):
        for q in range(0, 4):
            try:
                model = ARIMA(series, order=(p, d, q))
                fitted = model.fit()
                if fitted.aic < best_aic:
                    best_aic = fitted.aic
                    best_order = (p, d, q)
            except Exception:
                continue

    print(f"   Best order: {best_order} (AIC: {best_aic:.2f})")

    # Final fit
    final_model = ARIMA(series, order=best_order).fit()

    # In-sample evaluation
    train_pred = final_model.fittedvalues
    mae = mean_absolute_error(series[1:], train_pred[1:])
    rmse = np.sqrt(mean_squared_error(series[1:], train_pred[1:]))
    print(f"   Train MAE : {mae:.4f}")
    print(f"   Train RMSE: {rmse:.4f}")

    return final_model, {"mae": mae, "rmse": rmse, "order": best_order}


def arima_forecast(model, horizon: int = 7) -> dict:
    """Generate forecast with confidence intervals."""
    forecast_result = model.get_forecast(steps=horizon)
    forecast = forecast_result.predicted_mean
    conf_int = forecast_result.conf_int(alpha=0.1)  # 90% CI

    dates = pd.date_range(
        start=pd.Timestamp.now().normalize() + pd.Timedelta(days=1),
        periods=horizon, freq="D"
    )

    predictions = []
    for i in range(horizon):
        predictions.append({
            "date": dates[i].strftime("%Y-%m-%d"),
            "predicted_score": round(float(np.clip(forecast.iloc[i], 0, 1)), 4),
            "lower_bound": round(float(np.clip(conf_int.iloc[i, 0], 0, 1)), 4),
            "upper_bound": round(float(np.clip(conf_int.iloc[i, 1], 0, 1)), 4),
        })

    return predictions


# ─────────────────────────────────────────────────────────────────────────────────
# LSTM MODEL
# ─────────────────────────────────────────────────────────────────────────────────
def train_lstm(series: pd.Series):
    """
    Train an LSTM neural network on daily consistency scores.
    Architecture: LSTM → Dropout → Dense
    """
    print("\n[TRAIN] Training LSTM Model...")

    try:
        os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout
        from tensorflow.keras.callbacks import EarlyStopping
        from tensorflow.keras.optimizers import Adam
    except ImportError:
        print("⚠️  TensorFlow not installed. Skipping LSTM training.")
        return None, {"mae": float("inf"), "rmse": float("inf")}

    # Normalize
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(series.values.reshape(-1, 1))

    # Create sliding-window sequences
    seq_len = config.SEQUENCE_LENGTH
    X, y = [], []
    for i in range(seq_len, len(scaled)):
        X.append(scaled[i - seq_len:i, 0])
        y.append(scaled[i, 0])

    X, y = np.array(X), np.array(y)
    X = X.reshape((X.shape[0], X.shape[1], 1))  # (samples, timesteps, features)

    # Split 80/20
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    print(f"   Sequences : {len(X)} total ({len(X_train)} train, {len(X_test)} test)")
    print(f"   Window    : {seq_len} days")

    # Build model
    p = config.LSTM_PARAMS
    model = Sequential([
        LSTM(p["units"], return_sequences=True, input_shape=(seq_len, 1)),
        Dropout(p["dropout"]),
        LSTM(p["units"] // 2, return_sequences=False),
        Dropout(p["dropout"]),
        Dense(32, activation="relu"),
        Dense(1, activation="sigmoid"),
    ])

    model.compile(
        optimizer=Adam(learning_rate=p["learning_rate"]),
        loss="mse",
        metrics=["mae"]
    )

    # Detect GPU
    gpus = tf.config.list_physical_devices("GPU")
    device = "GPU" if gpus else "CPU"
    print(f"   Device    : {device}")

    # Train with early stopping
    early_stop = EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True)

    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=p["epochs"],
        batch_size=p["batch_size"],
        callbacks=[early_stop],
        verbose=0,
    )

    # Evaluate
    y_pred = model.predict(X_test, verbose=0).flatten()
    y_test_inv = scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()
    y_pred_inv = scaler.inverse_transform(y_pred.reshape(-1, 1)).flatten()

    mae = mean_absolute_error(y_test_inv, y_pred_inv)
    rmse = np.sqrt(mean_squared_error(y_test_inv, y_pred_inv))
    print(f"   Test MAE  : {mae:.4f}")
    print(f"   Test RMSE : {rmse:.4f}")
    print(f"   Epochs run: {len(history.history['loss'])}")

    # Save scaler for inference
    joblib.dump(scaler, config.LSTM_SCALER_PATH)

    return model, {"mae": mae, "rmse": rmse}


def lstm_forecast(model, series: pd.Series, horizon: int = 7) -> list:
    """Generate multi-step forecast using the LSTM model."""
    scaler = joblib.load(config.LSTM_SCALER_PATH)
    scaled = scaler.transform(series.values.reshape(-1, 1))

    # Use the last `SEQUENCE_LENGTH` values as seed
    seq_len = config.SEQUENCE_LENGTH
    current_seq = scaled[-seq_len:].reshape(1, seq_len, 1)

    predictions = []
    dates = pd.date_range(
        start=pd.Timestamp.now().normalize() + pd.Timedelta(days=1),
        periods=horizon, freq="D"
    )

    for i in range(horizon):
        pred_scaled = model.predict(current_seq, verbose=0)[0, 0]
        pred = float(scaler.inverse_transform([[pred_scaled]])[0, 0])
        pred = round(np.clip(pred, 0, 1), 4)

        predictions.append({
            "date": dates[i].strftime("%Y-%m-%d"),
            "predicted_score": pred,
            "lower_bound": round(max(pred - 0.1, 0), 4),
            "upper_bound": round(min(pred + 0.1, 1), 4),
        })

        # Append prediction to the sequence for next step
        new_entry = np.array([[[pred_scaled]]])
        current_seq = np.concatenate([current_seq[:, 1:, :], new_entry], axis=1)

    return predictions


# ─────────────────────────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────────
def train_pipeline(user_id: str = None, use_sample_data: bool = False):
    """
    Full time-series training pipeline:
    1. Build daily consistency series
    2. Train ARIMA
    3. Train LSTM
    4. Compare MAE and save best model
    """
    print("\n[TOOLS] HabitForge ML — Time-Series Forecast Training Pipeline")
    print("=" * 60)

    if use_sample_data:
        from data_loader import generate_sample_data
        users = generate_sample_data(n_users=3, n_habits_per_user=4, n_days=120)
        user_id = str(users[0])

    if not user_id:
        # Find a user with the most logs
        logs_df = load_habit_logs()
        if logs_df.empty:
            print("❌ No data found. Use --sample to generate synthetic data.")
            sys.exit(1)
        user_id = logs_df.groupby("userId").size().idxmax()

    print(f"\n[EMOJI] Training for user: {user_id}")

    # Build time-series
    series = build_daily_consistency_series(user_id)
    if series.empty or len(series) < 21:
        print(f"❌ Insufficient time-series data ({len(series)} days). Need ≥21.")
        sys.exit(1)

    print(f"   Series length: {len(series)} days")
    print(f"   Date range   : {series.index.min().date()} → {series.index.max().date()}")
    print(f"   Mean score   : {series.mean():.4f}")

    # ── Train Both Models ────────────────────────────────────────────────────
    arima_model, arima_metrics = train_arima(series)

    lstm_model, lstm_metrics = train_lstm(series)

    # ── Compare & Save ───────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"[METRICS] Model Comparison")
    print(f"{'='*60}")
    print(f"   ARIMA MAE : {arima_metrics['mae']:.4f}")
    print(f"   LSTM  MAE : {lstm_metrics['mae']:.4f}")

    if lstm_model is not None and lstm_metrics["mae"] < arima_metrics["mae"]:
        print(f"\n[WINNER] Winner: LSTM (lower MAE)")
        lstm_model.save(config.LSTM_MODEL_PATH)
        joblib.dump({"best": "lstm", "user_id": user_id, "metrics": lstm_metrics},
                    os.path.join(config.MODEL_DIR, "forecast_meta.joblib"))
    else:
        print(f"\n[WINNER] Winner: ARIMA (lower MAE)")
        joblib.dump(arima_model, config.ARIMA_MODEL_PATH)
        joblib.dump({"best": "arima", "user_id": user_id, "metrics": arima_metrics},
                    os.path.join(config.MODEL_DIR, "forecast_meta.joblib"))

    print(f"\n[SAVE] Models saved to: {config.MODEL_DIR}")
    return arima_model, lstm_model


if __name__ == "__main__":
    uid = None
    use_sample = "--sample" in sys.argv

    for arg in sys.argv[1:]:
        if arg != "--sample":
            uid = arg

    train_pipeline(user_id=uid, use_sample_data=use_sample)
