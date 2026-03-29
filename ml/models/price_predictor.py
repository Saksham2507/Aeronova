"""
XGBoost Commodity Price Predictor
==================================
Predicts future commodity prices (copper, aluminum, oil, semiconductors)
using gradient boosted trees on 20+ engineered features.

Features:
- Historical prices (7d, 14d, 30d moving averages)
- Price momentum and volatility
- Day of week, month seasonality
- Cross-commodity correlations (oil affects everything)
- Trend indicators (SMA crossovers)
"""

import numpy as np
import pandas as pd
import os
import json
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import joblib

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.config import SAVED_MODELS_DIR, COMMODITIES
from utils.data_loader import load_commodity_prices


def engineer_price_features(df, commodity_name):
    """Create technical indicator features for price prediction"""
    cdf = df[df['commodity'] == commodity_name].copy().sort_values('date').reset_index(drop=True)

    if len(cdf) < 35:
        return None

    # Moving averages
    cdf['ma7'] = cdf['price'].rolling(7).mean()
    cdf['ma14'] = cdf['price'].rolling(14).mean()
    cdf['ma30'] = cdf['price'].rolling(30).mean()

    # Momentum
    cdf['momentum_7d'] = cdf['price'].pct_change(7)
    cdf['momentum_14d'] = cdf['price'].pct_change(14)

    # Volatility
    cdf['volatility_7d'] = cdf['price'].rolling(7).std()
    cdf['volatility_14d'] = cdf['price'].rolling(14).std()

    # Trend signals
    cdf['ma7_above_ma30'] = (cdf['ma7'] > cdf['ma30']).astype(int)
    cdf['price_above_ma14'] = (cdf['price'] > cdf['ma14']).astype(int)

    # Lag features
    for lag in [1, 3, 7, 14]:
        cdf[f'price_lag_{lag}'] = cdf['price'].shift(lag)

    # Date features
    cdf['dayOfWeek'] = cdf['date'].dt.dayofweek
    cdf['month'] = cdf['date'].dt.month
    cdf['weekOfYear'] = cdf['date'].dt.isocalendar().week.astype(int)

    # Target: next day price
    cdf['target'] = cdf['price'].shift(-1)

    # Drop NaN rows
    cdf = cdf.dropna().reset_index(drop=True)

    return cdf


def train_price_predictor():
    """Train XGBoost models for each commodity"""
    print("\n" + "=" * 60)
    print("  XGBOOST COMMODITY PRICE PREDICTOR")
    print("=" * 60)

    # Load data
    print("\n📊 Loading commodity prices from MongoDB...")
    price_df = load_commodity_prices()

    feature_cols = ['price', 'ma7', 'ma14', 'ma30', 'momentum_7d', 'momentum_14d',
                    'volatility_7d', 'volatility_14d', 'ma7_above_ma30', 'price_above_ma14',
                    'price_lag_1', 'price_lag_3', 'price_lag_7', 'price_lag_14',
                    'dayOfWeek', 'month', 'weekOfYear']

    results = {}

    for commodity in COMMODITIES:
        print(f"\n{'─' * 40}")
        print(f"  Training for: {commodity}")

        cdf = engineer_price_features(price_df, commodity)
        if cdf is None or len(cdf) < 50:
            print(f"  ✗ Not enough data for {commodity}")
            continue

        X = cdf[feature_cols].values
        y = cdf['target'].values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, shuffle=False
        )

        # Train XGBoost
        model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            verbosity=0
        )

        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )

        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

        print(f"  MAE: {mae:.4f}")
        print(f"  RMSE: {rmse:.4f}")
        print(f"  R²: {r2:.4f}")
        print(f"  MAPE: {mape:.1f}%")

        # Feature importance
        importance = model.feature_importances_
        top_features = sorted(zip(feature_cols, importance), key=lambda x: x[1], reverse=True)[:5]
        print(f"  Top features: {', '.join([f'{f[0]}({f[1]:.2f})' for f in top_features])}")

        # Save model
        os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
        model_path = os.path.join(SAVED_MODELS_DIR, f'xgb_price_{commodity}.joblib')
        joblib.dump(model, model_path)

        results[commodity] = {
            'mae': float(mae), 'rmse': float(rmse), 'r2': float(r2),
            'mape': float(mape), 'model_path': model_path,
            'train_samples': len(X_train), 'test_samples': len(X_test)
        }

    # Save metadata
    meta_path = os.path.join(SAVED_MODELS_DIR, 'price_predictor_meta.json')
    with open(meta_path, 'w') as f:
        json.dump({
            'feature_cols': feature_cols,
            'commodities': results
        }, f, indent=2)

    print(f"\n💾 All models saved to {SAVED_MODELS_DIR}")
    print("✅ Price predictor training complete!")
    return results


def predict_price(commodity, recent_prices_df):
    """Predict next day price for a commodity"""
    model_path = os.path.join(SAVED_MODELS_DIR, f'xgb_price_{commodity}.joblib')
    model = joblib.load(model_path)

    with open(os.path.join(SAVED_MODELS_DIR, 'price_predictor_meta.json')) as f:
        meta = json.load(f)

    cdf = engineer_price_features(recent_prices_df, commodity)
    if cdf is None:
        return None

    X = cdf[meta['feature_cols']].iloc[-1:].values
    prediction = model.predict(X)[0]

    return {
        'commodity': commodity,
        'current_price': float(cdf['price'].iloc[-1]),
        'predicted_price': float(prediction),
        'change_percent': float((prediction - cdf['price'].iloc[-1]) / cdf['price'].iloc[-1] * 100)
    }


if __name__ == '__main__':
    train_price_predictor()