"""
K-Means RDC Clusterer
======================
Groups the 8 RDCs into behavioral clusters based on their
demand patterns, seasonal profiles, and product mix.

Purpose: RDCs in the same cluster should get similar inventory
policies. Delhi and Noida might cluster together (North India metro,
AC-heavy). Chennai and Bangalore might form another (South India,
washing machine heavy, different festival calendar).

Features per RDC:
- Average daily demand by category
- Seasonal demand profile (12-month pattern)
- Temperature profile
- Festival sensitivity
- Channel mix (online vs retail)
"""

import numpy as np
import pandas as pd
import os
import json
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import joblib

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.config import SAVED_MODELS_DIR, RDC_CODES
from utils.data_loader import load_sales_data


def build_rdc_features(sales_df):
    """Build feature vectors for each RDC from sales data"""
    features = []

    for rdc in sales_df['rdcCode'].unique():
        rdc_df = sales_df[sales_df['rdcCode'] == rdc]

        if len(rdc_df) < 30:
            continue

        feat = {'rdcCode': rdc}

        # Average demand by category
        for cat in ['refrigerator', 'air_conditioner', 'washing_machine']:
            cat_df = rdc_df[rdc_df['category'] == cat]
            feat[f'avg_demand_{cat}'] = cat_df['unitsSold'].mean() if len(cat_df) > 0 else 0

        # Monthly demand profile (seasonality signature)
        monthly = rdc_df.groupby('month')['unitsSold'].mean()
        for m in range(1, 13):
            feat[f'month_{m}_demand'] = monthly.get(m, 0)

        # Temperature profile
        feat['avg_temperature'] = rdc_df['temperature'].mean()
        feat['max_temperature'] = rdc_df['temperature'].max()
        feat['temp_range'] = rdc_df['temperature'].max() - rdc_df['temperature'].min()

        # Festival sensitivity
        festival_days = rdc_df[rdc_df['festivalEffect'] == 1]
        normal_days = rdc_df[rdc_df['festivalEffect'] == 0]
        if len(normal_days) > 0 and len(festival_days) > 0:
            feat['festival_uplift'] = festival_days['unitsSold'].mean() / max(normal_days['unitsSold'].mean(), 1)
        else:
            feat['festival_uplift'] = 1.0

        # Channel mix
        if 'channel' in rdc_df.columns:
            online = rdc_df[rdc_df['channel'].isin(['online_flipkart', 'online_amazon'])]
            feat['online_share'] = len(online) / max(len(rdc_df), 1)
        else:
            feat['online_share'] = 0.5

        # Color preferences
        for color in ['color_white', 'color_silver', 'color_black']:
            if color in rdc_df.columns:
                feat[f'{color}_share'] = rdc_df[color].sum() / max(rdc_df['unitsSold'].sum(), 1)

        # Demand volatility
        daily_demand = rdc_df.groupby('date')['unitsSold'].sum()
        feat['demand_volatility'] = daily_demand.std() / max(daily_demand.mean(), 1)

        # Total volume
        feat['total_volume'] = rdc_df['unitsSold'].sum()
        feat['avg_daily_demand'] = daily_demand.mean()

        features.append(feat)

    return pd.DataFrame(features)


def train_rdc_clusterer():
    """Train K-Means clustering on RDC behavioral features"""
    print("\n" + "=" * 60)
    print("  K-MEANS RDC CLUSTERER")
    print("=" * 60)

    # Load sales data
    print("\n📊 Loading sales data...")
    sales_df = load_sales_data()

    # Build RDC feature vectors
    print("\n🔧 Building RDC feature vectors...")
    rdc_features = build_rdc_features(sales_df)
    print(f"  RDCs with data: {len(rdc_features)}")
    print(f"  Features per RDC: {len(rdc_features.columns) - 1}")

    if len(rdc_features) < 3:
        print("  ✗ Not enough RDCs with data for clustering")
        return None

    # Prepare features (exclude rdcCode)
    rdc_codes = rdc_features['rdcCode'].values
    feature_cols = [c for c in rdc_features.columns if c != 'rdcCode']
    X = rdc_features[feature_cols].fillna(0).values

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Find optimal K using silhouette score
    print("\n🔍 Finding optimal number of clusters...")
    max_k = min(len(rdc_features) - 1, 5)
    best_k = 2
    best_score = -1

    for k in range(2, max_k + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X_scaled)
        score = silhouette_score(X_scaled, labels)
        print(f"  K={k}: Silhouette score = {score:.3f}")
        if score > best_score:
            best_score = score
            best_k = k

    print(f"  → Best K = {best_k} (silhouette = {best_score:.3f})")

    # Train final model
    print(f"\n🧠 Training K-Means with K={best_k}...")
    model = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    cluster_labels = model.fit_predict(X_scaled)

    # Analyze clusters
    print(f"\n📈 Cluster Analysis:")
    rdc_features['cluster'] = cluster_labels

    cluster_names = []
    for c in range(best_k):
        cluster_rdcs = rdc_features[rdc_features['cluster'] == c]
        rdc_list = cluster_rdcs['rdcCode'].tolist()
        avg_temp = cluster_rdcs['avg_temperature'].mean()
        avg_demand = cluster_rdcs['avg_daily_demand'].mean()
        top_cat = 'AC-heavy' if cluster_rdcs.get('avg_demand_air_conditioner', pd.Series([0])).mean() > \
                                cluster_rdcs.get('avg_demand_washing_machine', pd.Series([0])).mean() else 'WM-heavy'

        # Generate cluster name
        if avg_temp > 32:
            name = f"Hot climate {top_cat}"
        elif avg_temp > 25:
            name = f"Moderate climate {top_cat}"
        else:
            name = f"Cool climate {top_cat}"

        cluster_names.append(name)
        print(f"\n  Cluster {c}: \"{name}\"")
        print(f"    RDCs: {', '.join(rdc_list)}")
        print(f"    Avg temp: {avg_temp:.1f}°C")
        print(f"    Avg daily demand: {avg_demand:.0f} units")
        print(f"    Festival uplift: {cluster_rdcs['festival_uplift'].mean():.2f}x")

    # Save model
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    model_path = os.path.join(SAVED_MODELS_DIR, 'rdc_clusterer.joblib')
    joblib.dump(model, model_path)

    scaler_path = os.path.join(SAVED_MODELS_DIR, 'rdc_cluster_scaler.joblib')
    joblib.dump(scaler, scaler_path)

    # Save results
    cluster_results = {}
    for _, row in rdc_features.iterrows():
        cluster_results[row['rdcCode']] = {
            'cluster': int(row['cluster']),
            'cluster_name': cluster_names[int(row['cluster'])],
            'avg_daily_demand': float(row['avg_daily_demand']),
            'avg_temperature': float(row['avg_temperature']),
            'festival_uplift': float(row['festival_uplift'])
        }

    meta = {
        'n_clusters': best_k,
        'silhouette_score': float(best_score),
        'feature_cols': feature_cols,
        'cluster_names': cluster_names,
        'rdc_assignments': cluster_results
    }
    meta_path = os.path.join(SAVED_MODELS_DIR, 'rdc_cluster_meta.json')
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"\n💾 Model saved to {model_path}")
    print("✅ RDC clustering complete!")

    return {
        'n_clusters': best_k,
        'silhouette_score': float(best_score),
        'assignments': cluster_results
    }


if __name__ == '__main__':
    train_rdc_clusterer()