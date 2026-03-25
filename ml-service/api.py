"""
HabitForge ML — FastAPI Prediction & Forecasting API
Serves both classification predictions and time-series forecasts via REST endpoints.

Endpoints:
  POST /predict-habit           → Habit completion prediction
  GET  /forecast-consistency/{userId} → 7-day consistency forecast
  GET  /health                  → API health check
"""
import os
import sys
import numpy as np
import pandas as pd
import joblib
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import config
from inference import predict_completion
from data_loader import build_daily_consistency_series

# ─── App Setup ───────────────────────────────────────────────────────────────────
app = FastAPI(
    title="HabitForge ML API",
    description="AI-powered habit completion prediction & consistency forecasting",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Schemas ──────────────────────────────────────────────────
class PredictRequest(BaseModel):
    user_id: str
    habit_id: str


class PredictResponse(BaseModel):
    user_id: str
    habit_id: str
    prediction: str
    probability: float
    confidence: str
    features_used: dict
    timestamp: str


class ForecastPoint(BaseModel):
    date: str
    predicted_score: float
    lower_bound: float
    upper_bound: float


class ForecastResponse(BaseModel):
    user_id: str
    model_used: str
    forecast: list[ForecastPoint]
    generated_at: str


# ─── Endpoints ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """API health check with model status."""
    classifier_ready = os.path.exists(config.CLASSIFICATION_MODEL_PATH)
    arima_ready = os.path.exists(config.ARIMA_MODEL_PATH)
    lstm_ready = os.path.exists(config.LSTM_MODEL_PATH)

    return {
        "status": "healthy",
        "models": {
            "classifier": "loaded" if classifier_ready else "not_trained",
            "arima": "loaded" if arima_ready else "not_trained",
            "lstm": "loaded" if lstm_ready else "not_trained",
        },
        "api_version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/predict-habit", response_model=PredictResponse)
async def predict_habit(request: PredictRequest):
    """
    Predict whether a user will complete a specific habit today.

    - **user_id**: MongoDB ObjectId of the user
    - **habit_id**: MongoDB ObjectId of the habit

    Returns prediction label, probability (0-1), and confidence tier.
    """
    try:
        result = predict_completion(request.user_id, request.habit_id)

        if "error" in result:
            raise HTTPException(status_code=503, detail=result["error"])

        return PredictResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/forecast-consistency/{user_id}", response_model=ForecastResponse)
async def forecast_consistency(user_id: str, horizon: int = 7):
    """
    Forecast a user's consistency score for the next N days.

    - **user_id**: MongoDB ObjectId of the user
    - **horizon**: Number of days to forecast (default: 7, max: 30)

    Returns daily predicted scores with 90% confidence intervals.
    """
    horizon = min(max(horizon, 1), 30)

    # Determine which model to use
    meta_path = os.path.join(config.MODEL_DIR, "forecast_meta.joblib")

    if not os.path.exists(meta_path):
        raise HTTPException(
            status_code=503,
            detail="Forecast model not trained yet. Run train_forecast.py first."
        )

    meta = joblib.load(meta_path)
    best_model_type = meta.get("best", "arima")

    # Build the user's time series
    series = build_daily_consistency_series(user_id)
    if series.empty or len(series) < 7:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient data for user {user_id}. Need at least 7 days of logs."
        )

    try:
        if best_model_type == "lstm" and os.path.exists(config.LSTM_MODEL_PATH):
            # LSTM forecast
            os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
            import tensorflow as tf
            lstm_model = tf.keras.models.load_model(config.LSTM_MODEL_PATH)
            from train_forecast import lstm_forecast
            predictions = lstm_forecast(lstm_model, series, horizon)
            model_used = "LSTM"
        else:
            # ARIMA forecast
            arima_model = joblib.load(config.ARIMA_MODEL_PATH)
            from train_forecast import arima_forecast
            predictions = arima_forecast(arima_model, horizon)
            model_used = "ARIMA"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")

    return ForecastResponse(
        user_id=user_id,
        model_used=model_used,
        forecast=[ForecastPoint(**p) for p in predictions],
        generated_at=datetime.now().isoformat(),
    )


# ─── Run ─────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print(f"\n[ML] Starting HabitForge ML API on http://{config.ML_API_HOST}:{config.ML_API_PORT}")
    print(f"Swagger docs: http://localhost:{config.ML_API_PORT}/docs\n")
    uvicorn.run(
        "api:app",
        host=config.ML_API_HOST,
        port=config.ML_API_PORT,
        reload=True,
    )
