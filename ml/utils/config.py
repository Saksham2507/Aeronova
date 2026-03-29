import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/aeronova')
DB_NAME = 'aeronova'

# Model paths
SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'saved_models')
TFJS_EXPORT_DIR = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'tfjs_lstm')

# LSTM config
LSTM_SEQUENCE_LENGTH = 30   # 30 days lookback
LSTM_FORECAST_DAYS = 7      # predict 7 days ahead
LSTM_EPOCHS = 50
LSTM_BATCH_SIZE = 32

# Feature columns for LSTM
LSTM_FEATURES = ['unitsSold', 'temperature', 'humidity', 'rainfall',
                 'festivalEffect', 'promoActive', 'dayOfWeek', 'month',
                 'competitorPriceIndex']

# Anomaly detection
ANOMALY_CONTAMINATION = 0.08  # expect ~8% anomalies

# Sentiment categories
SENTIMENT_LABELS = ['positive', 'negative', 'neutral']

# RDC codes
RDC_CODES = ['RDC-DEL', 'RDC-MUM', 'RDC-BLR', 'RDC-HYD',
             'RDC-KOL', 'RDC-CHN', 'RDC-PUN', 'RDC-NOI']

# Product categories
PRODUCT_CATEGORIES = ['refrigerator', 'air_conditioner', 'washing_machine',
                      'water_heater', 'microwave']

# Commodity names
COMMODITIES = ['copper', 'aluminum', 'steel', 'polyethylene',
               'crude_oil', 'semiconductor_index']