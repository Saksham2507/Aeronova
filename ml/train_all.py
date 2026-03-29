"""
Aeronova ML — Train All Models
================================
Trains all 5 ML models in sequence:
1. LSTM Demand Forecaster (TensorFlow)
2. Isolation Forest Anomaly Detector (scikit-learn)
3. NLP Sentiment Classifier (scikit-learn)
4. XGBoost Commodity Price Predictor
5. K-Means RDC Clusterer (scikit-learn)

Usage:
  python train_all.py
"""

import os
import sys
import json
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.lstm_demand import train_lstm
from models.anomaly_detector import train_anomaly_detector
from models.sentiment_scorer import train_sentiment_classifier
from models.price_predictor import train_price_predictor
from models.rdc_clusterer import train_rdc_clusterer
from utils.config import SAVED_MODELS_DIR


def train_all():
    print("\n" + "=" * 60)
    print("  🚀 AERONOVA ML TRAINING PIPELINE")
    print("  Training 5 models on seeded MongoDB data")
    print("=" * 60)

    start_time = time.time()
    results = {}

    # 1. LSTM
    print("\n\n[1/5] LSTM Demand Forecaster")
    try:
        results['lstm'] = train_lstm()
    except Exception as e:
        print(f"  ✗ LSTM failed: {e}")
        results['lstm'] = {'error': str(e)}

    # 2. Anomaly Detector
    print("\n\n[2/5] Isolation Forest Anomaly Detector")
    try:
        results['anomaly'] = train_anomaly_detector()
    except Exception as e:
        print(f"  ✗ Anomaly detector failed: {e}")
        results['anomaly'] = {'error': str(e)}

    # 3. Sentiment Classifier
    print("\n\n[3/5] NLP Sentiment Classifier")
    try:
        results['sentiment'] = train_sentiment_classifier()
    except Exception as e:
        print(f"  ✗ Sentiment classifier failed: {e}")
        results['sentiment'] = {'error': str(e)}

    # 4. Price Predictor
    print("\n\n[4/5] XGBoost Commodity Price Predictor")
    try:
        results['price'] = train_price_predictor()
    except Exception as e:
        print(f"  ✗ Price predictor failed: {e}")
        results['price'] = {'error': str(e)}

    # 5. RDC Clusterer
    print("\n\n[5/5] K-Means RDC Clusterer")
    try:
        results['clustering'] = train_rdc_clusterer()
    except Exception as e:
        print(f"  ✗ RDC clusterer failed: {e}")
        results['clustering'] = {'error': str(e)}

    # Summary
    elapsed = time.time() - start_time
    print("\n\n" + "=" * 60)
    print("  📊 TRAINING SUMMARY")
    print("=" * 60)

    for model_name, result in results.items():
        if result and 'error' not in result:
            print(f"  ✅ {model_name}: OK")
        else:
            print(f"  ❌ {model_name}: FAILED — {result.get('error', 'unknown')}")

    print(f"\n  Total time: {elapsed:.1f} seconds")
    print(f"  Models saved in: {SAVED_MODELS_DIR}")

    # Save summary
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    summary_path = os.path.join(SAVED_MODELS_DIR, 'training_summary.json')
    with open(summary_path, 'w') as f:
        # Make results JSON serializable
        clean_results = {}
        for k, v in results.items():
            if v is None:
                clean_results[k] = {'status': 'failed'}
            else:
                clean_results[k] = {key: val for key, val in v.items()
                                    if isinstance(val, (str, int, float, bool, list, dict))}
        json.dump({
            'training_time_seconds': elapsed,
            'models': clean_results
        }, f, indent=2)

    print(f"  Summary saved to {summary_path}")
    print("\n🎉 All models trained! Ready for API serving.\n")

    return results


if __name__ == '__main__':
    train_all()