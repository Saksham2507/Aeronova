"""
Aeronova ML API Server (Flask)
================================
Serves all 5 trained models via REST endpoints.
Express backend calls these endpoints to get ML predictions.

Endpoints:
  POST /api/ml/predict/demand     — LSTM demand forecast
  POST /api/ml/detect/anomalies   — Isolation Forest anomaly detection
  POST /api/ml/classify/sentiment — NLP sentiment classification
  POST /api/ml/predict/price      — XGBoost price prediction
  GET  /api/ml/clusters           — K-Means RDC cluster assignments
  GET  /api/ml/health             — Health check with model status
"""

import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS

from models.lstm_demand import predict_demand
from models.anomaly_detector import detect_anomalies
from models.sentiment_scorer import classify_headlines
from utils.config import SAVED_MODELS_DIR

import pandas as pd

app = Flask(__name__)
CORS(app)


@app.route('/api/ml/health', methods=['GET'])
def health():
    """Check which models are loaded and ready"""
    models = {}
    model_files = {
        'lstm': 'lstm_demand.keras',
        'anomaly': 'anomaly_detector.joblib',
        'sentiment': 'sentiment_classifier.joblib',
        'price_copper': 'xgb_price_copper.joblib',
        'price_crude_oil': 'xgb_price_crude_oil.joblib',
        'rdc_clusters': 'rdc_cluster_meta.json'
    }
    for name, filename in model_files.items():
        path = os.path.join(SAVED_MODELS_DIR, filename)
        models[name] = {
            'status': 'ready' if os.path.exists(path) else 'not_trained',
            'path': path
        }

    return jsonify({
        'status': 'OK',
        'service': 'Aeronova ML API',
        'models': models
    })


@app.route('/api/ml/predict/demand', methods=['POST'])
def predict_demand_endpoint():
    """LSTM demand forecast — returns P10/P50/P90 for next 7 days"""
    try:
        predictions = predict_demand()
        return jsonify({
            'status': 'success',
            'model': 'LSTM',
            'forecast_days': len(predictions),
            'predictions': predictions
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/api/ml/detect/anomalies', methods=['POST'])
def detect_anomalies_endpoint():
    """Isolation Forest anomaly detection on inventory data"""
    try:
        data = request.json
        if not data or 'inventory' not in data:
            return jsonify({'error': 'Provide inventory data in request body'}), 400

        inventory_df = pd.DataFrame(data['inventory'])
        anomalies = detect_anomalies(inventory_df)

        return jsonify({
            'status': 'success',
            'model': 'Isolation Forest',
            'anomalies_found': len(anomalies),
            'anomalies': anomalies
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/api/ml/classify/sentiment', methods=['POST'])
def classify_sentiment_endpoint():
    """NLP sentiment classification on news headlines"""
    try:
        data = request.json
        if not data or 'headlines' not in data:
            return jsonify({'error': 'Provide headlines array in request body'}), 400

        results = classify_headlines(data['headlines'])

        return jsonify({
            'status': 'success',
            'model': 'TF-IDF + Logistic Regression',
            'classified': len(results),
            'results': results
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/api/ml/predict/price', methods=['POST'])
def predict_price_endpoint():
    """XGBoost commodity price prediction"""
    try:
        from models.price_predictor import predict_price
        from utils.data_loader import load_commodity_prices

        data = request.json
        commodity = data.get('commodity', 'copper') if data else 'copper'

        price_df = load_commodity_prices()
        result = predict_price(commodity, price_df)

        if result is None:
            return jsonify({'error': f'Not enough data for {commodity}'}), 400

        return jsonify({
            'status': 'success',
            'model': 'XGBoost',
            'prediction': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/api/ml/clusters', methods=['GET'])
def get_clusters_endpoint():
    """Get RDC cluster assignments"""
    try:
        meta_path = os.path.join(SAVED_MODELS_DIR, 'rdc_cluster_meta.json')
        if not os.path.exists(meta_path):
            return jsonify({'error': 'Clustering model not trained yet'}), 404

        with open(meta_path) as f:
            meta = json.load(f)

        return jsonify({
            'status': 'success',
            'model': 'K-Means',
            'n_clusters': meta['n_clusters'],
            'silhouette_score': meta['silhouette_score'],
            'cluster_names': meta['cluster_names'],
            'assignments': meta['rdc_assignments']
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/api/ml/summary', methods=['GET'])
def get_training_summary():
    """Get training summary for all models"""
    try:
        summary_path = os.path.join(SAVED_MODELS_DIR, 'training_summary.json')
        if not os.path.exists(summary_path):
            return jsonify({'error': 'No training summary found. Run train_all.py first.'}), 404

        with open(summary_path) as f:
            summary = json.load(f)

        return jsonify({'status': 'success', 'summary': summary})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


if __name__ == '__main__':
    print("\n🚀 Aeronova ML API starting...")
    print("   Health: http://localhost:5001/api/ml/health")
    print("   Endpoints:")
    print("     POST /api/ml/predict/demand")
    print("     POST /api/ml/detect/anomalies")
    print("     POST /api/ml/classify/sentiment")
    print("     POST /api/ml/predict/price")
    print("     GET  /api/ml/clusters")
    print("     GET  /api/ml/summary\n")
    app.run(host='0.0.0.0', port=5001, debug=True)