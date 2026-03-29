import pandas as pd
import numpy as np
from pymongo import MongoClient
from utils.config import MONGODB_URI, DB_NAME

def get_db():
    client = MongoClient(MONGODB_URI)
    return client[DB_NAME]

def load_sales_data():
    """Load sales history from MongoDB into a pandas DataFrame"""
    db = get_db()
    cursor = db.saleshistories.find({}, {
        'date': 1, 'sku': 1, 'rdcCode': 1, 'category': 1,
        'unitsSold': 1, 'revenue': 1, 'channel': 1, 'region': 1,
        'externalFactors': 1, 'colorBreakdown': 1, '_id': 0
    }).sort('date', 1)

    records = list(cursor)
    if not records:
        raise ValueError("No sales data found! Run 'npm run seed' first.")

    df = pd.DataFrame(records)

    # Flatten externalFactors
    ext = pd.json_normalize(df['externalFactors'])
    ext.columns = [c.replace('externalFactors.', '') for c in ext.columns]
    df = pd.concat([df.drop('externalFactors', axis=1), ext], axis=1)

    # Flatten colorBreakdown
    if 'colorBreakdown' in df.columns:
        colors = pd.json_normalize(df['colorBreakdown'])
        colors.columns = ['color_' + c for c in colors.columns]
        df = pd.concat([df.drop('colorBreakdown', axis=1), colors], axis=1)

    # Date features
    df['date'] = pd.to_datetime(df['date'])
    df['dayOfWeek'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['weekOfYear'] = df['date'].dt.isocalendar().week.astype(int)
    df['isWeekend'] = (df['dayOfWeek'] >= 5).astype(int)

    # Festival effect as numeric
    df['festivalEffect'] = df['festival'].notna().astype(int)

    # Fill NaN
    df['promoActive'] = df['promoActive'].fillna(False).astype(int)
    df['promoDiscount'] = df['promoDiscount'].fillna(0)
    df['competitorPriceIndex'] = df['competitorPriceIndex'].fillna(1.0)
    df['temperature'] = df['temperature'].fillna(30)
    df['humidity'] = df['humidity'].fillna(50)
    df['rainfall'] = df['rainfall'].fillna(0)

    print(f"✓ Loaded {len(df)} sales records from MongoDB")
    print(f"  Date range: {df['date'].min().date()} to {df['date'].max().date()}")
    print(f"  Categories: {df['category'].nunique()}")
    print(f"  RDCs: {df['rdcCode'].nunique()}")
    print(f"  SKUs: {df['sku'].nunique()}")

    return df


def load_inventory_data():
    """Load current inventory levels"""
    db = get_db()
    cursor = db.inventories.find({}, {'_id': 0})
    df = pd.DataFrame(list(cursor))
    print(f"✓ Loaded {len(df)} inventory records")
    return df


def load_commodity_prices():
    """Load commodity price history"""
    db = get_db()
    cursor = db.commodityprices.find({}, {'_id': 0}).sort('date', 1)
    df = pd.DataFrame(list(cursor))
    df['date'] = pd.to_datetime(df['date'])
    print(f"✓ Loaded {len(df)} commodity price records")
    return df


def load_rdc_data():
    """Load RDC information"""
    db = get_db()
    cursor = db.rdcs.find({}, {'_id': 0})
    records = list(cursor)
    df = pd.DataFrame(records)
    print(f"✓ Loaded {len(df)} RDC records")
    return df


def get_daily_aggregated_sales(category=None, rdcCode=None):
    """Aggregate sales to daily level for time-series modeling"""
    df = load_sales_data()

    if category:
        df = df[df['category'] == category]
    if rdcCode:
        df = df[df['rdcCode'] == rdcCode]

    daily = df.groupby('date').agg({
        'unitsSold': 'sum',
        'revenue': 'sum',
        'temperature': 'mean',
        'humidity': 'mean',
        'rainfall': 'mean',
        'festivalEffect': 'max',
        'promoActive': 'max',
        'competitorPriceIndex': 'mean',
        'dayOfWeek': 'first',
        'month': 'first'
    }).reset_index()

    daily = daily.sort_values('date').reset_index(drop=True)
    print(f"✓ Aggregated to {len(daily)} daily records")
    return daily


# News training data for sentiment classifier
def get_sentiment_training_data():
    """Returns labeled training data for sentiment classifier"""
    data = [
        # Negative - supply chain disruption signals
        ("Oil prices surge 40% as Middle East tensions escalate", "negative"),
        ("Semiconductor shortage worsens, lead times double", "negative"),
        ("Massive flooding disrupts South India logistics network", "negative"),
        ("China imposes export controls on rare earth minerals", "negative"),
        ("Port workers strike paralyzes Mumbai container terminal", "negative"),
        ("Copper prices hit 5-year high amid supply squeeze", "negative"),
        ("Heat wave kills dozens, power grid under severe strain", "negative"),
        ("New tariffs on imported electronics components announced", "negative"),
        ("Major supplier files for bankruptcy protection", "negative"),
        ("Cyclone warning issued for Bay of Bengal shipping lanes", "negative"),
        ("Steel prices spike as iron ore supply tightens globally", "negative"),
        ("Freight rates surge 200% on Asia-India shipping routes", "negative"),
        ("Factory fire destroys key component supplier in China", "negative"),
        ("Currency depreciation makes imports 15% more expensive", "negative"),
        ("Drought reduces hydroelectric power generation capacity", "negative"),
        ("Labor shortage hits manufacturing sector across India", "negative"),
        ("New environmental regulation forces factory shutdowns", "negative"),
        ("Truckers protest blocks major highway for 3 days", "negative"),
        ("Raw material quality issues cause production line halt", "negative"),
        ("Trade war escalation threatens supply chain stability", "negative"),

        # Positive - demand/growth signals
        ("India GDP growth beats expectations at 7.2%", "positive"),
        ("Record-breaking summer drives appliance demand surge", "positive"),
        ("Flipkart announces biggest ever Big Billion Days sale", "positive"),
        ("Government launches PLI scheme for white goods manufacturing", "positive"),
        ("Housing market boom drives demand for home appliances", "positive"),
        ("Amazon Great Indian Festival dates announced for October", "positive"),
        ("Middle class expansion drives rural appliance adoption", "positive"),
        ("Diwali festive season expected to boost retail 30%", "positive"),
        ("New smart home trend increasing premium appliance sales", "positive"),
        ("Government subsidies for energy efficient appliances expanded", "positive"),
        ("Wedding season drives gifting demand for refrigerators", "positive"),
        ("Urban migration increases demand in tier-2 cities", "positive"),
        ("Consumer confidence index hits 3-year high", "positive"),
        ("E-commerce penetration in appliances grows 45% YoY", "positive"),
        ("Real estate sector recovery boosts home appliance market", "positive"),
        ("Export demand for Indian appliances grows in ASEAN markets", "positive"),
        ("Rural electrification program creates new appliance market", "positive"),
        ("Interest rates cut makes EMI purchases more affordable", "positive"),
        ("Premiumization trend drives higher ASP in appliances", "positive"),
        ("Smart AC segment grows 85% year over year", "positive"),

        # Neutral - informational
        ("Quarterly earnings report shows stable performance", "neutral"),
        ("Industry conference discusses future of manufacturing", "neutral"),
        ("BIS releases updated standards for refrigerant gases", "neutral"),
        ("Market research firm publishes annual appliance report", "neutral"),
        ("Company appoints new head of supply chain operations", "neutral"),
        ("Annual maintenance shutdown scheduled for August", "neutral"),
        ("Industry body releases guidelines on e-waste management", "neutral"),
        ("Technology partnership announced for IoT integration", "neutral"),
        ("Warehouse automation pilot program shows mixed results", "neutral"),
        ("Government to review import duty structure next quarter", "neutral"),
        ("Company participates in sustainability benchmark survey", "neutral"),
        ("New product development timeline shared at investor day", "neutral"),
        ("Logistics company opens new distribution hub in Pune", "neutral"),
        ("Annual supplier conference focuses on quality improvement", "neutral"),
        ("Market share remains stable in competitive appliance segment", "neutral"),
    ]
    return data