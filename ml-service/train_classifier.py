"""
HabitForge ML — Supervised Classification Training Pipeline
Trains Logistic Regression, Random Forest, and XGBoost on habit completion data.
Automatically selects and exports the best-performing model.
"""
import os
import sys
import warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("⚠️  XGBoost not installed. Skipping XGBoost model.")

import config
from data_loader import load_habit_logs, load_habits, engineer_classification_features, generate_sample_data

warnings.filterwarnings("ignore")


def evaluate_model(model, X_test, y_test, name: str) -> dict:
    """Evaluate a classifier and return a metrics dictionary."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred

    metrics = {
        "model": name,
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.5,
    }

    print(f"\n{'='*50}")
    print(f"[METRICS] {name} Results")
    print(f"{'='*50}")
    print(f"  Accuracy  : {metrics['accuracy']:.4f}")
    print(f"  Precision : {metrics['precision']:.4f}")
    print(f"  Recall    : {metrics['recall']:.4f}")
    print(f"  F1-Score  : {metrics['f1']:.4f}")
    print(f"  ROC-AUC   : {metrics['roc_auc']:.4f}")
    return metrics


def train_pipeline(use_sample_data=False):
    """
    Full training pipeline:
    1. Load data from MongoDB (or generate sample data)
    2. Engineer features
    3. Train 3 classifiers
    4. Auto-select the best model by F1-score
    5. Export model + scaler using joblib
    """
    print("\n[TOOLS] HabitForge ML — Classification Training Pipeline")
    print("=" * 60)

    # ── Step 1: Load Data ────────────────────────────────────────────────────
    if use_sample_data:
        print("\n[DATA] Generating sample training data...")
        generate_sample_data(n_users=10, n_habits_per_user=4, n_days=90)

    print("\n[DATA] Loading data from MongoDB...")
    logs_df = load_habit_logs()
    habits_df = load_habits()

    if logs_df.empty:
        print("[ERROR] No habit logs found. Run with --sample flag to generate synthetic data.")
        sys.exit(1)

    print(f"   Loaded {len(logs_df)} log entries across {logs_df['habitId'].nunique()} habits.")

    # ── Step 2: Feature Engineering ──────────────────────────────────────────
    print("\n[FEATURES] Engineering features...")
    features_df = engineer_classification_features(logs_df, habits_df)

    if features_df.empty or len(features_df) < 20:
        print("[ERROR] Insufficient data for training. Need at least 20 samples.")
        sys.exit(1)

    feature_cols = [
        "rolling_7d_mean", "rolling_3d_mean", "current_streak",
        "day_of_week", "is_weekend", "category_encoded",
        "completion_hour_avg", "days_since_start"
    ]

    X = features_df[feature_cols].values
    y = features_df["target"].values

    print(f"   Feature matrix: {X.shape[0]} samples × {X.shape[1]} features")
    print(f"   Class balance : {y.mean():.2%} positive (completed)")

    # ── Step 3: Split & Scale ────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print(f"\n   Train set: {len(X_train)} | Test set: {len(X_test)}")

    # ── Step 4: Train Models ─────────────────────────────────────────────────
    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=42, class_weight="balanced"
        ),
        "Random Forest": RandomForestClassifier(**config.RANDOM_FOREST_PARAMS),
    }

    if HAS_XGBOOST:
        models["XGBoost"] = XGBClassifier(**config.XGBOOST_PARAMS)

    results = []
    trained_models = {}

    for name, model in models.items():
        print(f"\n[TRAIN] Training {name}...")

        # Use scaled data for Logistic Regression, raw for tree-based
        if name == "Logistic Regression":
            model.fit(X_train_scaled, y_train)
            metrics = evaluate_model(model, X_test_scaled, y_test, name)
        else:
            model.fit(X_train, y_train)
            metrics = evaluate_model(model, X_test, y_test, name)

        # Cross-validation score
        cv_data = X_train_scaled if name == "Logistic Regression" else X_train
        cv_scores = cross_val_score(model, cv_data, y_train, cv=5, scoring="f1")
        metrics["cv_f1_mean"] = cv_scores.mean()
        metrics["cv_f1_std"] = cv_scores.std()
        print(f"  CV F1     : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

        results.append(metrics)
        trained_models[name] = model

    # ── Step 5: Select Best Model ────────────────────────────────────────────
    results_df = pd.DataFrame(results).sort_values("f1", ascending=False)
    best_name = results_df.iloc[0]["model"]
    best_model = trained_models[best_name]

    print(f"\n{'='*60}")
    print(f"[BEST] Best Model: {best_name} (F1: {results_df.iloc[0]['f1']:.4f})")
    print(f"{'='*60}")

    # ── Step 6: Export ───────────────────────────────────────────────────────
    joblib.dump(best_model, config.CLASSIFICATION_MODEL_PATH)
    joblib.dump(scaler, config.CLASSIFICATION_SCALER_PATH)

    print(f"\n[SAVE] Model saved to: {config.CLASSIFICATION_MODEL_PATH}")
    print(f"[SAVE] Scaler saved to: {config.CLASSIFICATION_SCALER_PATH}")

    # Save training report
    report_path = os.path.join(config.MODEL_DIR, "classification_report.csv")
    results_df.to_csv(report_path, index=False)
    print(f"[REPORT] Report saved to: {report_path}")

    return best_model, scaler


if __name__ == "__main__":
    use_sample = "--sample" in sys.argv
    train_pipeline(use_sample_data=use_sample)
