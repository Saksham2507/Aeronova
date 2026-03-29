"""
Isolation Forest Anomaly Detector
==================================
Detects unusual patterns in inventory levels that humans miss.
Catches: sudden spikes, unexpected drops, multi-RDC simultaneous anomalies,
demand-inventory mismatches.

Features used:
- Current stock level
- Days of supply
- Average daily sales
- Stock-to-capacity ratio
- Deviation from safety stock
"""

import numpy as np
import pandas as pd
import os
import json
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.config import ANOMALY_CONTAMINATION, SAVED_MODELS_DIR
from utils.data_loader import load_inventory_data, load_sales_data


FEATURE_COLS = ['currentStock', 'daysOfSupply', 'avgDailySales',
                'stockCapacityRatio', 'safetyStockDeviation',
                'pendingInbound', 'pendingOutbound']


def prepare_features(inventory_df):
    """Engineer features for anomaly detection"""
    df = inventory_df.copy()

    # Derived features
    df['stockCapacityRatio'] = df['currentStock'] / df['maxCapacity'].clip(lower=1)
    df['safetyStockDeviation'] = (df['currentStock'] - df['safetyStock']) / df['safetyStock'].clip(lower=1)

    # Fill NaN
    for col in FEATURE_COLS:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    available_cols = [c for c in FEATURE_COLS if c in df.columns]
    return df, available_cols


def train_anomaly_detector():
    """Train Isolation Forest on inventory data"""
    print("\n" + "=" * 60)
    print("  ISOLATION FOREST ANOMALY DETECTOR")
    print("=" * 60)

    # Load data
    print("\n📊 Loading inventory data...")
    inventory_df = load_inventory_data()

    if len(inventory_df) < 10:
        print("  ✗ Not enough inventory data")
        return None

    # Prepare features
    print("\n🔧 Engineering features...")
    df, available_cols = prepare_features(inventory_df)
    print(f"  Features: {available_cols}")
    print(f"  Samples: {len(df)}")

    X = df[available_cols].values

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train Isolation Forest
    print(f"\n🧠 Training Isolation Forest (contamination={ANOMALY_CONTAMINATION})...")
    model = IsolationForest(
        n_estimators=200,
        contamination=ANOMALY_CONTAMINATION,
        max_samples='auto',
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_scaled)

    # Predict anomalies
    predictions = model.predict(X_scaled)  # 1 = normal, -1 = anomaly
    anomaly_scores = model.decision_function(X_scaled)  # lower = more anomalous

    n_anomalies = (predictions == -1).sum()
    print(f"\n📈 Results:")
    print(f"  Total items: {len(df)}")
    print(f"  Anomalies detected: {n_anomalies} ({n_anomalies/len(df)*100:.1f}%)")

    # Show top anomalies
    df['anomaly_prediction'] = predictions
    df['anomaly_score'] = anomaly_scores
    anomalies = df[df['anomaly_prediction'] == -1].sort_values('anomaly_score')

    if len(anomalies) > 0:
        print(f"\n  Top anomalies:")
        for _, row in anomalies.head(5).iterrows():
            print(f"    SKU: {row.get('sku', 'N/A')} | RDC: {row.get('rdcCode', 'N/A')} | "
                  f"Stock: {row.get('currentStock', 0)} | DoS: {row.get('daysOfSupply', 0):.0f} | "
                  f"Score: {row['anomaly_score']:.3f}")

    # Save model
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    model_path = os.path.join(SAVED_MODELS_DIR, 'anomaly_detector.joblib')
    joblib.dump(model, model_path)

    scaler_path = os.path.join(SAVED_MODELS_DIR, 'anomaly_scaler.joblib')
    joblib.dump(scaler, scaler_path)

    # Save metadata
    meta = {
        'features': available_cols,
        'contamination': ANOMALY_CONTAMINATION,
        'n_estimators': 200,
        'total_samples': len(df),
        'anomalies_found': int(n_anomalies),
        'anomaly_rate': float(n_anomalies / len(df))
    }
    meta_path = os.path.join(SAVED_MODELS_DIR, 'anomaly_meta.json')
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"\n💾 Model saved to {model_path}")
    print("✅ Anomaly detector training complete!")

    return {
        'model_path': model_path,
        'anomalies_found': int(n_anomalies),
        'anomaly_rate': float(n_anomalies / len(df)),
        'total_samples': len(df)
    }


def detect_anomalies(new_inventory_data):
    """Run anomaly detection on new inventory data"""
    model = joblib.load(os.path.join(SAVED_MODELS_DIR, 'anomaly_detector.joblib'))
    scaler = joblib.load(os.path.join(SAVED_MODELS_DIR, 'anomaly_scaler.joblib'))

    with open(os.path.join(SAVED_MODELS_DIR, 'anomaly_meta.json')) as f:
        meta = json.load(f)

    df, available_cols = prepare_features(new_inventory_data)
    X = df[available_cols].values
    X_scaled = scaler.transform(X)

    predictions = model.predict(X_scaled)
    scores = model.decision_function(X_scaled)

    df['is_anomaly'] = predictions == -1
    df['anomaly_score'] = scores

    anomalies = df[df['is_anomaly']].to_dict('records')
    return anomalies


if __name__ == '__main__':
    train_anomaly_detector()