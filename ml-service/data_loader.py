"""
HabitForge ML — Data Loader & Feature Engineering
Extracts raw data from MongoDB and engineers features for both classification and time-series models.
"""
import pandas as pd
import numpy as np
from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId
import config


def get_db():
    """Returns a pymongo database handle."""
    client = MongoClient(config.MONGO_URI)
    return client[config.DB_NAME]


# ─────────────────────────────────────────────────────────────────────────────────
# RAW DATA LOADERS
# ─────────────────────────────────────────────────────────────────────────────────
def load_habit_logs(user_id: str = None) -> pd.DataFrame:
    """
    Load habit completion logs from MongoDB.
    Optionally filter by user_id.
    """
    db = get_db()
    query = {}
    if user_id:
        query["userId"] = ObjectId(user_id)

    logs = list(db.habitlogs.find(query))
    if not logs:
        return pd.DataFrame()

    df = pd.DataFrame(logs)
    df["date"] = pd.to_datetime(df["date"])
    df["completed"] = df["completed"].astype(int)
    df["userId"] = df["userId"].astype(str)
    df["habitId"] = df["habitId"].astype(str)
    return df


def load_habits(user_id: str = None) -> pd.DataFrame:
    """Load habit definitions."""
    db = get_db()
    query = {}
    if user_id:
        query["userId"] = ObjectId(user_id)

    habits = list(db.habits.find(query))
    if not habits:
        return pd.DataFrame()

    df = pd.DataFrame(habits)
    df["_id"] = df["_id"].astype(str)
    df["userId"] = df["userId"].astype(str)
    return df


# ─────────────────────────────────────────────────────────────────────────────────
# FEATURE ENGINEERING — CLASSIFICATION
# ─────────────────────────────────────────────────────────────────────────────────
def engineer_classification_features(logs_df: pd.DataFrame, habits_df: pd.DataFrame) -> pd.DataFrame:
    """
    Produces one row per (user, habit, date) with engineered features:
      - rolling_7d_mean     : Average completion rate in the last 7 days
      - rolling_3d_mean     : Average completion rate in the last 3 days
      - current_streak      : Consecutive days completed before this date
      - day_of_week         : 0=Mon … 6=Sun
      - is_weekend          : Boolean
      - category_encoded    : Integer-encoded habit category
      - completion_hour_avg : Average hour the user completes this habit
      - days_since_start    : Days since the habit was created
      - target              : Did the user complete the habit on this date? (label)
    """
    if logs_df.empty or habits_df.empty:
        return pd.DataFrame()

    # Merge habit metadata
    merged = logs_df.merge(
        habits_df[["_id", "category", "startDate"]],
        left_on="habitId", right_on="_id", how="left", suffixes=("", "_habit")
    )

    # Encode category
    category_map = {cat: i for i, cat in enumerate(merged["category"].dropna().unique())}
    merged["category_encoded"] = merged["category"].map(category_map).fillna(0).astype(int)

    # Sort for rolling calculations
    merged = merged.sort_values(["userId", "habitId", "date"]).reset_index(drop=True)

    features = []
    for (uid, hid), group in merged.groupby(["userId", "habitId"]):
        group = group.sort_values("date").reset_index(drop=True)

        # Rolling completions
        group["rolling_7d_mean"] = group["completed"].rolling(7, min_periods=1).mean().shift(1).fillna(0.5)
        group["rolling_3d_mean"] = group["completed"].rolling(3, min_periods=1).mean().shift(1).fillna(0.5)

        # Streak calculation
        streaks = []
        streak = 0
        for _, row in group.iterrows():
            streaks.append(streak)
            streak = streak + 1 if row["completed"] == 1 else 0
        group["current_streak"] = streaks

        # Temporal features
        group["day_of_week"] = group["date"].dt.dayofweek
        group["is_weekend"] = (group["day_of_week"] >= 5).astype(int)

        # Completion hour average (from logs with completionHour)
        if "completionHour" in group.columns:
            avg_hour = group.loc[group["completionHour"].notna(), "completionHour"].mean()
            group["completion_hour_avg"] = avg_hour if not np.isnan(avg_hour) else 12
        else:
            group["completion_hour_avg"] = 12

        # Days since start
        if "startDate" in group.columns and group["startDate"].notna().any():
            start = pd.to_datetime(group["startDate"].iloc[0])
            group["days_since_start"] = (group["date"] - start).dt.days.clip(lower=0)
        else:
            group["days_since_start"] = 0

        group["target"] = group["completed"]
        features.append(group)

    result = pd.concat(features, ignore_index=True)

    feature_cols = [
        "rolling_7d_mean", "rolling_3d_mean", "current_streak",
        "day_of_week", "is_weekend", "category_encoded",
        "completion_hour_avg", "days_since_start"
    ]
    return result[["userId", "habitId", "date"] + feature_cols + ["target"]]


# ─────────────────────────────────────────────────────────────────────────────────
# FEATURE ENGINEERING — TIME SERIES
# ─────────────────────────────────────────────────────────────────────────────────
def build_daily_consistency_series(user_id: str) -> pd.Series:
    """
    Builds a daily consistency score (0.0 – 1.0) for a specific user.
    Score = (habits completed that day) / (total active habits on that day).
    Missing dates are forward-filled, then back-filled.
    """
    logs_df = load_habit_logs(user_id)
    if logs_df.empty:
        return pd.Series(dtype=float)

    # Daily aggregation
    daily = logs_df.groupby("date").agg(
        completed=("completed", "sum"),
        total=("completed", "count")
    )
    daily["score"] = (daily["completed"] / daily["total"]).clip(0, 1)

    # Fill missing dates
    full_range = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    daily = daily.reindex(full_range)
    daily["score"] = daily["score"].ffill().bfill().fillna(0.5)

    return daily["score"]


# ─────────────────────────────────────────────────────────────────────────────────
# SAMPLE DATA GENERATOR (for bootstrapping / testing)
# ─────────────────────────────────────────────────────────────────────────────────
def generate_sample_data(n_users=5, n_habits_per_user=3, n_days=60):
    """
    Generates realistic synthetic habit logs for training when real data is sparse.
    Inserts directly into MongoDB collections.
    """
    db = get_db()
    categories = ["Health", "Work", "Learning", "Social"]
    users = []

    for u in range(n_users):
        user_id = ObjectId()
        users.append(user_id)

        for h in range(n_habits_per_user):
            habit_id = ObjectId()
            cat = categories[h % len(categories)]
            start_date = datetime.now() - timedelta(days=n_days)

            # Insert habit document
            db.habits.insert_one({
                "_id": habit_id,
                "userId": user_id,
                "habitName": f"Habit_{cat}_{h}",
                "category": cat,
                "frequency": "daily",
                "startDate": start_date,
                "createdAt": start_date,
            })

            # Generate logs with realistic patterns
            # Simulate user who is ~70% consistent but less so on weekends
            streak = 0
            for d in range(n_days):
                log_date = start_date + timedelta(days=d)
                is_weekend = log_date.weekday() >= 5
                # Base probability modulated by streak momentum & weekend
                base_prob = 0.7 + min(streak * 0.02, 0.15)
                prob = base_prob - (0.15 if is_weekend else 0)
                completed = int(np.random.random() < prob)

                streak = streak + 1 if completed else 0
                hour = int(np.random.choice([7, 8, 9, 18, 19, 20, 21]))

                db.habitlogs.insert_one({
                    "habitId": habit_id,
                    "userId": user_id,
                    "date": log_date.strftime("%Y-%m-%d"),
                    "completed": bool(completed),
                    "completionHour": hour if completed else None,
                })

    print(f"✅ Generated {n_users * n_habits_per_user * n_days} logs for {n_users} users.")
    return users
