"""
HabitForge ML — Classification Inference
Loads the trained model and predicts whether a user will complete a habit today.
"""
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timedelta
from bson import ObjectId

import config
from data_loader import get_db


def predict_completion(user_id: str, habit_id: str) -> dict:
    """
    Predict whether a user will complete a specific habit today/tomorrow.

    Returns:
        {
            "user_id": str,
            "habit_id": str,
            "prediction": "will_complete" | "will_miss",
            "probability": float,        # 0.0 – 1.0
            "confidence": "high" | "medium" | "low",
            "features_used": dict,
            "timestamp": str
        }
    """
    # ── Load model & scaler ──────────────────────────────────────────────────
    try:
        model = joblib.load(config.CLASSIFICATION_MODEL_PATH)
        scaler = joblib.load(config.CLASSIFICATION_SCALER_PATH)
    except FileNotFoundError:
        return {
            "error": "Model not trained yet. Run train_classifier.py first.",
            "user_id": user_id,
            "habit_id": habit_id,
        }

    # ── Fetch recent logs from MongoDB ───────────────────────────────────────
    db = get_db()
    today = datetime.now()
    lookback_start = (today - timedelta(days=config.LOOKBACK_DAYS)).strftime("%Y-%m-%d")

    logs = list(db.habitlogs.find({
        "userId": ObjectId(user_id),
        "habitId": ObjectId(habit_id),
        "date": {"$gte": lookback_start}
    }).sort("date", 1))

    habit = db.habits.find_one({"_id": ObjectId(habit_id)})

    if not logs or not habit:
        return {
            "user_id": user_id,
            "habit_id": habit_id,
            "prediction": "insufficient_data",
            "probability": 0.5,
            "confidence": "low",
            "features_used": {},
            "timestamp": today.isoformat(),
        }

    # ── Engineer features for TODAY ──────────────────────────────────────────
    completions = [1 if log.get("completed") else 0 for log in logs]
    hours = [log.get("completionHour") for log in logs if log.get("completionHour") is not None]

    # Rolling means (use last N days of data)
    rolling_7d = np.mean(completions[-7:]) if len(completions) >= 7 else np.mean(completions)
    rolling_3d = np.mean(completions[-3:]) if len(completions) >= 3 else np.mean(completions)

    # Current streak (counting backwards from most recent)
    streak = 0
    for c in reversed(completions):
        if c == 1:
            streak += 1
        else:
            break

    # Temporal features for today
    day_of_week = today.weekday()
    is_weekend = int(day_of_week >= 5)

    # Category encoding (simple hash-based for inference consistency)
    category = habit.get("category", "General")
    category_map = {"Health": 0, "Work": 1, "Learning": 2, "Social": 3, "General": 4}
    category_encoded = category_map.get(category, 4)

    # Average completion hour
    completion_hour_avg = np.mean(hours) if hours else 12

    # Days since habit started
    start_date = habit.get("startDate", today)
    if isinstance(start_date, str):
        start_date = datetime.fromisoformat(start_date)
    days_since_start = max((today - start_date).days, 0)

    # ── Build feature vector ─────────────────────────────────────────────────
    features = {
        "rolling_7d_mean": round(rolling_7d, 4),
        "rolling_3d_mean": round(rolling_3d, 4),
        "current_streak": streak,
        "day_of_week": day_of_week,
        "is_weekend": is_weekend,
        "category_encoded": category_encoded,
        "completion_hour_avg": round(completion_hour_avg, 2),
        "days_since_start": days_since_start,
    }

    X = np.array([[
        features["rolling_7d_mean"],
        features["rolling_3d_mean"],
        features["current_streak"],
        features["day_of_week"],
        features["is_weekend"],
        features["category_encoded"],
        features["completion_hour_avg"],
        features["days_since_start"],
    ]])

    # ── Scale if model expects scaled input (Logistic Regression) ────────────
    model_type = type(model).__name__
    if model_type == "LogisticRegression":
        X = scaler.transform(X)

    # ── Predict ──────────────────────────────────────────────────────────────
    probability = float(model.predict_proba(X)[0][1])
    prediction = "will_complete" if probability >= 0.5 else "will_miss"

    # Confidence tier
    if probability >= 0.8 or probability <= 0.2:
        confidence = "high"
    elif probability >= 0.65 or probability <= 0.35:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "user_id": user_id,
        "habit_id": habit_id,
        "prediction": prediction,
        "probability": round(probability, 4),
        "confidence": confidence,
        "features_used": features,
        "timestamp": today.isoformat(),
    }


if __name__ == "__main__":
    # Quick test
    import sys
    if len(sys.argv) >= 3:
        result = predict_completion(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python inference.py <user_id> <habit_id>")
        result = {"msg": "Provide user_id and habit_id as arguments."}
    import json
    print(json.dumps(result, indent=2))
