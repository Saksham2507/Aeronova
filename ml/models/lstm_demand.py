"""
LSTM Demand Forecaster
======================
Trains an LSTM neural network on historical sales data to predict
future demand by SKU/region with probabilistic output (P10/P50/P90).

Features used:
- Historical sales (30-day lookback window)
- Temperature, humidity, rainfall
- Festival effect, promo activity
- Day of week, month (seasonality)
- Competitor price index

Architecture:
- 2 LSTM layers (64 → 32 units) with dropout
- Dense output layer
- Trained on MSE loss with Adam optimizer
"""

import numpy as np
import pandas as pd
import os
import json
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.config import (LSTM_SEQUENCE_LENGTH, LSTM_FORECAST_DAYS,
                           LSTM_EPOCHS, LSTM_BATCH_SIZE, SAVED_MODELS_DIR, TFJS_EXPORT_DIR)
from utils.data_loader import get_daily_aggregated_sales


FEATURE_COLS = ['unitsSold', 'temperature', 'humidity', 'rainfall',
                'festivalEffect', 'promoActive', 'competitorPriceIndex',
                'dayOfWeek', 'month']


def create_sequences(data, seq_length, forecast_length=1):
    """Create sliding window sequences for LSTM"""
    X, y = [], []
    for i in range(len(data) - seq_length - forecast_length + 1):
        X.append(data[i:i + seq_length])
        # Predict next `forecast_length` days of unitsSold (column 0)
        y.append(data[i + seq_length:i + seq_length + forecast_length, 0])
    return np.array(X), np.array(y)


def train_lstm(category=None, rdcCode=None):
    """Train LSTM model on sales data"""
    print("\n" + "=" * 60)
    print("  LSTM DEMAND FORECASTER")
    print("=" * 60)

    # Load data
    print("\n📊 Loading data from MongoDB...")
    daily = get_daily_aggregated_sales(category=category, rdcCode=rdcCode)

    if len(daily) < LSTM_SEQUENCE_LENGTH + LSTM_FORECAST_DAYS + 10:
        print(f"  ✗ Not enough data ({len(daily)} days). Need at least {LSTM_SEQUENCE_LENGTH + LSTM_FORECAST_DAYS + 10}.")
        return None

    # Prepare features
    print("\n🔧 Preparing features...")
    feature_data = daily[FEATURE_COLS].values.astype(np.float32)

    # Scale features
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(feature_data)

    # Create sequences
    print(f"  Sequence length: {LSTM_SEQUENCE_LENGTH} days lookback")
    print(f"  Forecast horizon: {LSTM_FORECAST_DAYS} days ahead")
    X, y = create_sequences(scaled_data, LSTM_SEQUENCE_LENGTH, LSTM_FORECAST_DAYS)
    print(f"  Created {len(X)} training sequences")
    print(f"  Input shape: {X.shape}")
    print(f"  Output shape: {y.shape}")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    print(f"  Train: {len(X_train)}, Test: {len(X_test)}")

    # Build LSTM model
    print("\n🧠 Building LSTM model...")
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(LSTM_SEQUENCE_LENGTH, len(FEATURE_COLS))),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(LSTM_FORECAST_DAYS)
    ])

    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    model.summary()

    # Train
    print(f"\n🏋️ Training for up to {LSTM_EPOCHS} epochs...")
    early_stop = EarlyStopping(monitor='val_loss', patience=8, restore_best_weights=True)

    history = model.fit(
        X_train, y_train,
        epochs=LSTM_EPOCHS,
        batch_size=LSTM_BATCH_SIZE,
        validation_split=0.15,
        callbacks=[early_stop],
        verbose=1
    )

    # Evaluate
    print("\n📈 Evaluating model...")
    test_loss, test_mae = model.evaluate(X_test, y_test, verbose=0)
    print(f"  Test MSE: {test_loss:.4f}")
    print(f"  Test MAE: {test_mae:.4f}")

    # Generate predictions with uncertainty (P10/P50/P90)
    print("\n🔮 Generating probabilistic predictions...")
    predictions = model.predict(X_test, verbose=0)

    # Inverse transform predictions (only unitsSold column)
    pred_full = np.zeros((len(predictions) * LSTM_FORECAST_DAYS, len(FEATURE_COLS)))
    pred_full[:, 0] = predictions.flatten()
    pred_inv = scaler.inverse_transform(pred_full)[:, 0]

    actual_full = np.zeros((len(y_test) * LSTM_FORECAST_DAYS, len(FEATURE_COLS)))
    actual_full[:, 0] = y_test.flatten()
    actual_inv = scaler.inverse_transform(actual_full)[:, 0]

    # Calculate error distribution for P10/P50/P90
    errors = pred_inv - actual_inv
    error_std = np.std(errors)
    mape = np.mean(np.abs(errors) / np.maximum(actual_inv, 1)) * 100

    print(f"  MAPE: {mape:.1f}%")
    print(f"  Error Std Dev: {error_std:.1f} units")
    print(f"  P10/P50/P90 spread: ±{error_std * 1.28:.1f} units")

    # Save model
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    model_path = os.path.join(SAVED_MODELS_DIR, 'lstm_demand.keras')
    model.save(model_path)
    print(f"\n💾 Model saved to {model_path}")

    # Save scaler parameters for inference
    scaler_params = {
        'min': scaler.data_min_.tolist(),
        'max': scaler.data_max_.tolist(),
        'scale': scaler.scale_.tolist(),
        'feature_cols': FEATURE_COLS,
        'sequence_length': LSTM_SEQUENCE_LENGTH,
        'forecast_days': LSTM_FORECAST_DAYS,
        'error_std': float(error_std),
        'mape': float(mape),
        'test_mae': float(test_mae)
    }
    scaler_path = os.path.join(SAVED_MODELS_DIR, 'lstm_scaler.json')
    with open(scaler_path, 'w') as f:
        json.dump(scaler_params, f, indent=2)
    print(f"  Scaler saved to {scaler_path}")

    # Export to TensorFlow.js
    try:
        import tensorflowjs as tfjs
        os.makedirs(TFJS_EXPORT_DIR, exist_ok=True)
        tfjs.converters.save_keras_model(model, TFJS_EXPORT_DIR)
        print(f"  TF.js model exported to {TFJS_EXPORT_DIR}")
    except Exception as e:
        print(f"  ⚠ TF.js export skipped: {e}")

    print("\n✅ LSTM training complete!")
    return {
        'model_path': model_path,
        'mape': mape,
        'mae': float(test_mae),
        'error_std': float(error_std),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'epochs_trained': len(history.history['loss'])
    }


def predict_demand(model_path=None, recent_data=None):
    """Run inference on trained model"""
    if model_path is None:
        model_path = os.path.join(SAVED_MODELS_DIR, 'lstm_demand.keras')

    model = tf.keras.models.load_model(model_path)

    scaler_path = os.path.join(SAVED_MODELS_DIR, 'lstm_scaler.json')
    with open(scaler_path) as f:
        scaler_params = json.load(f)

    scaler = MinMaxScaler()
    scaler.data_min_ = np.array(scaler_params['min'])
    scaler.data_max_ = np.array(scaler_params['max'])
    scaler.scale_ = np.array(scaler_params['scale'])
    scaler.data_range_ = scaler.data_max_ - scaler.data_min_

    if recent_data is None:
        daily = get_daily_aggregated_sales()
        recent_data = daily[FEATURE_COLS].tail(LSTM_SEQUENCE_LENGTH).values

    scaled = scaler.transform(recent_data)
    X_input = scaled.reshape(1, LSTM_SEQUENCE_LENGTH, len(FEATURE_COLS))

    prediction = model.predict(X_input, verbose=0)[0]

    # Inverse transform
    pred_full = np.zeros((LSTM_FORECAST_DAYS, len(FEATURE_COLS)))
    pred_full[:, 0] = prediction
    pred_inv = scaler.inverse_transform(pred_full)[:, 0]

    error_std = scaler_params['error_std']

    results = []
    for i, p50 in enumerate(pred_inv):
        results.append({
            'day': i + 1,
            'p10': max(0, float(p50 - 1.28 * error_std)),
            'p50': max(0, float(p50)),
            'p90': float(p50 + 1.28 * error_std)
        })

    return results


if __name__ == '__main__':
    result = train_lstm()
    if result:
        print(f"\nModel MAPE: {result['mape']:.1f}%")
        print("\nRunning prediction on latest data...")
        predictions = predict_demand()
        print("\n7-Day Demand Forecast:")
        print(f"{'Day':>4} {'P10':>8} {'P50':>8} {'P90':>8}")
        print("-" * 32)
        for p in predictions:
            print(f"  {p['day']:>2}   {p['p10']:>7.0f}  {p['p50']:>7.0f}  {p['p90']:>7.0f}")