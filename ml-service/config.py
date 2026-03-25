"""
HabitForge ML Configuration
Centralized configuration for database connections, model paths, and hyperparameters.
"""
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# ─── Database ───────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    # Fallback only for local development
    MONGO_URI = "mongodb://localhost:27017/habitforge"
DB_NAME = "habitforge"

# ─── Model Storage ──────────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models", "saved")
os.makedirs(MODEL_DIR, exist_ok=True)

CLASSIFICATION_MODEL_PATH = os.path.join(MODEL_DIR, "habit_classifier.joblib")
CLASSIFICATION_SCALER_PATH = os.path.join(MODEL_DIR, "habit_scaler.joblib")
ARIMA_MODEL_PATH = os.path.join(MODEL_DIR, "arima_model.joblib")
LSTM_MODEL_PATH = os.path.join(MODEL_DIR, "lstm_model.keras")
LSTM_SCALER_PATH = os.path.join(MODEL_DIR, "lstm_scaler.joblib")

# ─── Feature Engineering ────────────────────────────────────────────────────────
LOOKBACK_DAYS = 30          # Days of history to consider for classification
SEQUENCE_LENGTH = 14        # Sliding window for LSTM
FORECAST_HORIZON = 7        # Predict next N days

# ─── Hyperparameters ────────────────────────────────────────────────────────────
RANDOM_FOREST_PARAMS = {
    "n_estimators": 200,
    "max_depth": 10,
    "min_samples_split": 5,
    "random_state": 42,
    "n_jobs": -1,
}

XGBOOST_PARAMS = {
    "n_estimators": 200,
    "max_depth": 6,
    "learning_rate": 0.1,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "random_state": 42,
    "eval_metric": "logloss",
    "tree_method": "auto",  # Uses GPU if available
}

LSTM_PARAMS = {
    "epochs": 50,
    "batch_size": 16,
    "units": 64,
    "dropout": 0.2,
    "learning_rate": 0.001,
}

# ─── API ────────────────────────────────────────────────────────────────────────
ML_API_HOST = "0.0.0.0"
ML_API_PORT = int(os.environ.get("PORT", 8000))
