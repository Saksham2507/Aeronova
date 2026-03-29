"""
NLP Sentiment Classifier for Supply Chain News
================================================
Uses TF-IDF vectorization + Logistic Regression to classify
news headlines as positive/negative/neutral for supply chain impact.

This acts as a FILTER: 500 headlines/day → only high-risk ones
get escalated to Claude AI for deep analysis.

Pipeline:
1. TF-IDF vectorization (max 5000 features, bigrams)
2. Logistic Regression with class balancing
3. Confidence score for each prediction
"""

import numpy as np
import os
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
import joblib

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.config import SAVED_MODELS_DIR, SENTIMENT_LABELS
from utils.data_loader import get_sentiment_training_data


def train_sentiment_classifier():
    """Train TF-IDF + Logistic Regression sentiment classifier"""
    print("\n" + "=" * 60)
    print("  NLP SENTIMENT CLASSIFIER")
    print("=" * 60)

    # Load training data
    print("\n📊 Loading training data...")
    data = get_sentiment_training_data()
    texts = [d[0] for d in data]
    labels = [d[1] for d in data]

    print(f"  Total samples: {len(texts)}")
    for label in SENTIMENT_LABELS:
        count = labels.count(label)
        print(f"  {label}: {count} ({count/len(labels)*100:.0f}%)")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    # Build pipeline: TF-IDF → Logistic Regression
    print("\n🧠 Building TF-IDF + Logistic Regression pipeline...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),      # unigrams + bigrams
            min_df=1,
            max_df=0.95,
            sublinear_tf=True,        # apply log normalization
            strip_accents='unicode',
            lowercase=True
        )),
        ('clf', LogisticRegression(
            C=1.0,
            class_weight='balanced',  # handle class imbalance
            max_iter=1000,
            solver='lbfgs',
            multi_class='multinomial',
            random_state=42
        ))
    ])

    # Train
    print("\n🏋️ Training...")
    pipeline.fit(X_train, y_train)

    # Evaluate
    print("\n📈 Evaluation:")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred))

    # Cross-validation
    cv_scores = cross_val_score(pipeline, texts, labels, cv=5, scoring='accuracy')
    print(f"  5-Fold CV Accuracy: {cv_scores.mean():.3f} (±{cv_scores.std():.3f})")

    # Show top features per class
    tfidf = pipeline.named_steps['tfidf']
    clf = pipeline.named_steps['clf']
    feature_names = np.array(tfidf.get_feature_names_out())

    print("\n📝 Top features per sentiment:")
    for i, label in enumerate(clf.classes_):
        top_indices = clf.coef_[i].argsort()[-8:][::-1]
        top_features = feature_names[top_indices]
        print(f"  {label}: {', '.join(top_features)}")

    # Save model
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    model_path = os.path.join(SAVED_MODELS_DIR, 'sentiment_classifier.joblib')
    joblib.dump(pipeline, model_path)

    # Save metadata
    meta = {
        'model_type': 'TF-IDF + Logistic Regression',
        'vocab_size': len(tfidf.vocabulary_),
        'classes': list(clf.classes_),
        'cv_accuracy': float(cv_scores.mean()),
        'cv_std': float(cv_scores.std()),
        'train_samples': len(X_train),
        'test_samples': len(X_test)
    }
    meta_path = os.path.join(SAVED_MODELS_DIR, 'sentiment_meta.json')
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"\n💾 Model saved to {model_path}")
    print("✅ Sentiment classifier training complete!")

    return {
        'model_path': model_path,
        'accuracy': float(cv_scores.mean()),
        'vocab_size': len(tfidf.vocabulary_),
        'classes': list(clf.classes_)
    }


def classify_headlines(headlines):
    """Classify a list of news headlines"""
    model_path = os.path.join(SAVED_MODELS_DIR, 'sentiment_classifier.joblib')
    pipeline = joblib.load(model_path)

    predictions = pipeline.predict(headlines)
    probabilities = pipeline.predict_proba(headlines)

    results = []
    for headline, pred, probs in zip(headlines, predictions, probabilities):
        confidence = float(max(probs))
        results.append({
            'headline': headline,
            'sentiment': pred,
            'confidence': confidence,
            'probabilities': {
                cls: float(p) for cls, p in zip(pipeline.classes_, probs)
            }
        })

    return results


if __name__ == '__main__':
    result = train_sentiment_classifier()

    # Test with new headlines
    print("\n\n🧪 Testing with new headlines:")
    test_headlines = [
        "Oil prices crash as OPEC increases production targets",
        "India announces massive infrastructure investment plan",
        "New warehouse opens in Hyderabad for logistics expansion",
        "Severe drought threatens agricultural supply chains",
        "Amazon announces Prime Day with record appliance discounts",
        "Iran-Israel tensions escalate, shipping routes at risk"
    ]

    results = classify_headlines(test_headlines)
    print(f"\n{'Headline':<55} {'Sentiment':<10} {'Confidence':<10}")
    print("-" * 75)
    for r in results:
        print(f"{r['headline'][:53]:<55} {r['sentiment']:<10} {r['confidence']:.2f}")