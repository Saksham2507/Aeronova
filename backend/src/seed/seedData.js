require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const RDC = require('../models/RDC');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');
const SalesHistory = require('../models/SalesHistory');
const CommodityPrice = require('../models/CommodityPrice');
const User = require('../models/User');

const connectDB = require('../config/database');

// ─── HELPERS ───
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randF = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);

// ─── SUPPLIERS ───
const suppliers = [
  { code: 'SUP-TW-01', name: 'TaiComp Electronics', country: 'Taiwan', region: 'taiwan',
    components: [{ name: 'Compressor', category: 'cooling', unitCost: 4200, currency: 'INR' },
                 { name: 'PCB Controller', category: 'electronics', unitCost: 1800, currency: 'INR' }],
    performance: { leadTimeDays: 56, reliabilityScore: 88, qualityScore: 92, defectRate: 0.8 },
    capacity: { monthlyUnits: 50000, currentUtilization: 72, surgeCapacity: 65000 },
    risks: { geopoliticalRisk: 'high', singleSourceRisk: true, alternateSuppliers: ['SUP-KR-01'] },
    sustainability: { carbonFootprint: 12.5, esgScore: 71, certifications: ['ISO14001'] } },
  { code: 'SUP-KR-01', name: 'KoreanTech Parts', country: 'South Korea', region: 'south_korea',
    components: [{ name: 'Inverter Motor', category: 'motors', unitCost: 3800, currency: 'INR' },
                 { name: 'Display Panel', category: 'electronics', unitCost: 950, currency: 'INR' }],
    performance: { leadTimeDays: 49, reliabilityScore: 93, qualityScore: 95, defectRate: 0.4 },
    capacity: { monthlyUnits: 40000, currentUtilization: 68, surgeCapacity: 52000 },
    risks: { geopoliticalRisk: 'medium', singleSourceRisk: false, alternateSuppliers: ['SUP-TW-01'] },
    sustainability: { carbonFootprint: 9.8, esgScore: 82, certifications: ['ISO14001', 'ISO9001'] } },
  { code: 'SUP-CN-01', name: 'ShenMotor Manufacturing', country: 'China', region: 'china',
    components: [{ name: 'Fan Motor', category: 'motors', unitCost: 1200, currency: 'INR' },
                 { name: 'Copper Tubing', category: 'raw_material', unitCost: 680, currency: 'INR' }],
    performance: { leadTimeDays: 42, reliabilityScore: 78, qualityScore: 80, defectRate: 2.1 },
    capacity: { monthlyUnits: 80000, currentUtilization: 85, surgeCapacity: 95000 },
    risks: { geopoliticalRisk: 'high', singleSourceRisk: false, alternateSuppliers: ['SUP-IN-02'] },
    sustainability: { carbonFootprint: 18.2, esgScore: 55, certifications: ['ISO9001'] } },
  { code: 'SUP-IN-01', name: 'Bharat Steel Works', country: 'India', region: 'india',
    components: [{ name: 'Sheet Metal Body', category: 'structure', unitCost: 2400, currency: 'INR' },
                 { name: 'Door Frame', category: 'structure', unitCost: 1100, currency: 'INR' }],
    performance: { leadTimeDays: 14, reliabilityScore: 85, qualityScore: 82, defectRate: 1.5 },
    capacity: { monthlyUnits: 60000, currentUtilization: 70, surgeCapacity: 78000 },
    risks: { geopoliticalRisk: 'low', singleSourceRisk: false, alternateSuppliers: ['SUP-IN-03'] },
    sustainability: { carbonFootprint: 8.5, esgScore: 68, certifications: ['BIS'] } },
  { code: 'SUP-IN-02', name: 'IndoWire Electricals', country: 'India', region: 'india',
    components: [{ name: 'Wiring Harness', category: 'electrical', unitCost: 450, currency: 'INR' },
                 { name: 'Thermostat', category: 'electronics', unitCost: 320, currency: 'INR' }],
    performance: { leadTimeDays: 10, reliabilityScore: 90, qualityScore: 88, defectRate: 1.0 },
    capacity: { monthlyUnits: 100000, currentUtilization: 55, surgeCapacity: 130000 },
    risks: { geopoliticalRisk: 'low', singleSourceRisk: false, alternateSuppliers: [] },
    sustainability: { carbonFootprint: 4.2, esgScore: 75, certifications: ['BIS', 'ISO9001'] } },
  { code: 'SUP-IN-03', name: 'ChemFoam Industries', country: 'India', region: 'india',
    components: [{ name: 'PU Insulation Foam', category: 'insulation', unitCost: 580, currency: 'INR' },
                 { name: 'Gasket Seals', category: 'sealing', unitCost: 120, currency: 'INR' }],
    performance: { leadTimeDays: 7, reliabilityScore: 82, qualityScore: 79, defectRate: 1.8 },
    capacity: { monthlyUnits: 70000, currentUtilization: 62, surgeCapacity: 90000 },
    risks: { geopoliticalRisk: 'low', singleSourceRisk: false, alternateSuppliers: [] },
    sustainability: { carbonFootprint: 6.1, esgScore: 62, certifications: ['BIS'] } }
];

// ─── RDCs ───
const rdcs = [
  { code: 'RDC-DEL', name: 'Delhi NCR Hub', city: 'Delhi', state: 'Delhi', region: 'north',
    coordinates: { lat: 28.61, lng: 77.23 }, capacity: { totalUnits: 5000, currentUtilization: 72 },
    demandClass: { tier: 'tier1_metro', avgDailyDemand: 180, responseTimeTarget: '2 days' },
    connectedPlants: ['PUNE', 'NOIDA'], transferPartners: [
      { rdcCode: 'RDC-NOI', transferTimeDays: 0.5, transportCost: 15000 },
      { rdcCode: 'RDC-MUM', transferTimeDays: 2, transportCost: 85000 }] },
  { code: 'RDC-MUM', name: 'Mumbai Metro Hub', city: 'Mumbai', state: 'Maharashtra', region: 'west',
    coordinates: { lat: 19.07, lng: 72.88 }, capacity: { totalUnits: 6000, currentUtilization: 68 },
    demandClass: { tier: 'tier1_metro', avgDailyDemand: 200, responseTimeTarget: '2 days' },
    connectedPlants: ['PUNE'], transferPartners: [
      { rdcCode: 'RDC-PUN', transferTimeDays: 0.5, transportCost: 12000 },
      { rdcCode: 'RDC-DEL', transferTimeDays: 2, transportCost: 85000 }] },
  { code: 'RDC-BLR', name: 'Bangalore Tech Hub', city: 'Bangalore', state: 'Karnataka', region: 'south',
    coordinates: { lat: 12.97, lng: 77.59 }, capacity: { totalUnits: 4000, currentUtilization: 65 },
    demandClass: { tier: 'tier1_metro', avgDailyDemand: 140, responseTimeTarget: '2 days' },
    connectedPlants: ['COIMBATORE'], transferPartners: [
      { rdcCode: 'RDC-CHN', transferTimeDays: 1, transportCost: 45000 },
      { rdcCode: 'RDC-HYD', transferTimeDays: 1.5, transportCost: 55000 }] },
  { code: 'RDC-HYD', name: 'Hyderabad Hub', city: 'Hyderabad', state: 'Telangana', region: 'south',
    coordinates: { lat: 17.38, lng: 78.49 }, capacity: { totalUnits: 3000, currentUtilization: 58 },
    demandClass: { tier: 'tier2_city', avgDailyDemand: 90, responseTimeTarget: '3 days' },
    connectedPlants: ['COIMBATORE'], transferPartners: [
      { rdcCode: 'RDC-BLR', transferTimeDays: 1.5, transportCost: 55000 },
      { rdcCode: 'RDC-CHN', transferTimeDays: 1.5, transportCost: 50000 }] },
  { code: 'RDC-KOL', name: 'Kolkata East Hub', city: 'Kolkata', state: 'West Bengal', region: 'east',
    coordinates: { lat: 22.57, lng: 88.36 }, capacity: { totalUnits: 2500, currentUtilization: 55 },
    demandClass: { tier: 'tier2_city', avgDailyDemand: 70, responseTimeTarget: '3 days' },
    connectedPlants: ['PUNE'], transferPartners: [
      { rdcCode: 'RDC-DEL', transferTimeDays: 3, transportCost: 120000 }] },
  { code: 'RDC-CHN', name: 'Chennai South Hub', city: 'Chennai', state: 'Tamil Nadu', region: 'south',
    coordinates: { lat: 13.08, lng: 80.27 }, capacity: { totalUnits: 3500, currentUtilization: 60 },
    demandClass: { tier: 'tier2_city', avgDailyDemand: 100, responseTimeTarget: '3 days' },
    connectedPlants: ['COIMBATORE'], transferPartners: [
      { rdcCode: 'RDC-BLR', transferTimeDays: 1, transportCost: 45000 }] },
  { code: 'RDC-PUN', name: 'Pune Assembly Hub', city: 'Pune', state: 'Maharashtra', region: 'west',
    coordinates: { lat: 18.52, lng: 73.86 }, capacity: { totalUnits: 8000, currentUtilization: 45 },
    demandClass: { tier: 'tier2_city', avgDailyDemand: 60, responseTimeTarget: '1 day' },
    connectedPlants: ['PUNE'], transferPartners: [
      { rdcCode: 'RDC-MUM', transferTimeDays: 0.5, transportCost: 12000 }] },
  { code: 'RDC-NOI', name: 'Noida Assembly Hub', city: 'Noida', state: 'Uttar Pradesh', region: 'north',
    coordinates: { lat: 28.53, lng: 77.39 }, capacity: { totalUnits: 4500, currentUtilization: 50 },
    demandClass: { tier: 'tier2_city', avgDailyDemand: 80, responseTimeTarget: '1 day' },
    connectedPlants: ['NOIDA'], transferPartners: [
      { rdcCode: 'RDC-DEL', transferTimeDays: 0.5, transportCost: 15000 }] }
];

// ─── PRODUCTS ───
const colors = ['white', 'silver', 'black', 'stainless_steel', 'rose_gold'];
const products = [];

const fridgeSizes = ['180L', '260L', '340L', '500L'];
fridgeSizes.forEach(size => {
  colors.slice(0, 4).forEach(color => {
    [3, 4, 5].forEach(star => {
      products.push({
        sku: `FRG-${size}-${color.toUpperCase().slice(0,3)}-${star}S`,
        name: `Refrigerator ${size} ${star}-Star ${color}`,
        category: 'refrigerator',
        variant: { color, size, starRating: star },
        pricing: { costPrice: rand(12000, 28000), sellingPrice: rand(18000, 42000), margin: randF(18, 35) },
        seasonality: { peakMonths: [3, 4, 5, 6, 7], lowMonths: [11, 12, 1], weatherSensitive: true, festivalSensitive: true },
        status: 'active'
      });
    });
  });
});

const acTypes = ['1T', '1.5T', '2T'];
acTypes.forEach(type => {
  colors.slice(0, 3).forEach(color => {
    [3, 5].forEach(star => {
      products.push({
        sku: `AC-${type}-${color.toUpperCase().slice(0,3)}-${star}S`,
        name: `Split AC ${type} ${star}-Star ${color}`,
        category: 'air_conditioner',
        variant: { color, size: type, starRating: star },
        pricing: { costPrice: rand(18000, 35000), sellingPrice: rand(28000, 55000), margin: randF(20, 38) },
        seasonality: { peakMonths: [3, 4, 5, 6, 7, 8], lowMonths: [10, 11, 12, 1, 2], weatherSensitive: true, festivalSensitive: false },
        status: 'active'
      });
    });
  });
});

['Front Load 7kg', 'Front Load 8kg', 'Top Load 7kg', 'Top Load 8kg'].forEach(type => {
  colors.slice(0, 3).forEach(color => {
    products.push({
      sku: `WM-${type.replace(/\s/g, '-').toUpperCase()}-${color.toUpperCase().slice(0,3)}`,
      name: `Washing Machine ${type} ${color}`,
      category: 'washing_machine',
      variant: { color, size: type },
      pricing: { costPrice: rand(14000, 22000), sellingPrice: rand(22000, 38000), margin: randF(22, 35) },
      seasonality: { peakMonths: [8, 9, 10], lowMonths: [3, 4, 5], weatherSensitive: false, festivalSensitive: true },
      status: 'active'
    });
  });
});

// ─── INDIAN FESTIVALS MAP ───
const festivals = {
  1: [{ name: 'Pongal', regions: ['south'], boost: 1.15 }, { name: 'Republic Day Sales', regions: ['north', 'west'], boost: 1.1 }],
  3: [{ name: 'Holi', regions: ['north'], boost: 1.08 }],
  4: [{ name: 'Navratri', regions: ['west'], boost: 1.2 }, { name: 'Ugadi', regions: ['south'], boost: 1.12 }],
  8: [{ name: 'Onam', regions: ['south'], boost: 1.25 }, { name: 'Independence Day Sales', regions: ['north', 'west', 'south', 'east'], boost: 1.15 }],
  9: [{ name: 'Ganesh Chaturthi', regions: ['west'], boost: 1.1 }],
  10: [{ name: 'Navratri-Dussehra', regions: ['north', 'west'], boost: 1.3 }, { name: 'Flipkart BBD', regions: ['north', 'west', 'south', 'east'], boost: 1.5 }],
  11: [{ name: 'Diwali', regions: ['north', 'west', 'east'], boost: 1.6 }, { name: 'Amazon Great Indian', regions: ['north', 'west', 'south', 'east'], boost: 1.4 }],
  12: [{ name: 'Christmas', regions: ['south', 'east'], boost: 1.1 }]
};

// ─── CITY TEMPERATURE PROFILES (avg monthly °C) ───
const tempProfiles = {
  'RDC-DEL': [14, 17, 24, 33, 39, 40, 35, 33, 33, 29, 22, 15],
  'RDC-MUM': [25, 26, 28, 30, 32, 30, 28, 28, 28, 29, 28, 26],
  'RDC-BLR': [21, 23, 26, 28, 27, 24, 23, 23, 24, 23, 22, 20],
  'RDC-HYD': [22, 25, 29, 33, 35, 31, 28, 27, 28, 27, 24, 22],
  'RDC-KOL': [20, 23, 28, 32, 33, 33, 31, 31, 31, 29, 25, 20],
  'RDC-CHN': [25, 26, 28, 31, 34, 34, 32, 31, 30, 29, 27, 25],
  'RDC-PUN': [20, 22, 26, 30, 33, 29, 26, 25, 26, 27, 23, 20],
  'RDC-NOI': [13, 16, 23, 32, 38, 39, 34, 32, 32, 28, 21, 14]
};

// ─── GENERATE 12 MONTHS OF SALES DATA ───
async function generateSalesHistory(productDocs, rdcDocs) {
  const salesData = [];
  const now = new Date();

  for (let daysAgo = 365; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    for (const rdc of rdcDocs) {
      const temp = tempProfiles[rdc.code]?.[month - 1] || 25;
      const tempNoise = temp + randF(-3, 3);
      const humidity = rdc.region === 'south' ? rand(60, 90) : rand(30, 70);
      const rainfall = month >= 6 && month <= 9 ? rand(0, 50) : rand(0, 10);

      // Festival effect
      let festivalName = null;
      let festivalBoost = 1;
      const monthFestivals = festivals[month] || [];
      for (const f of monthFestivals) {
        if (f.regions.includes(rdc.region)) {
          festivalName = f.name;
          festivalBoost = Math.max(festivalBoost, f.boost);
        }
      }

      // Weekend effect
      const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.15 : 1;

      // Pick 3-5 random products for this RDC per day
      const dayProducts = productDocs.sort(() => 0.5 - Math.random()).slice(0, rand(3, 6));

      for (const product of dayProducts) {
        let baseDemand = rdc.demandClass.avgDailyDemand / 10;

        // Category seasonality
        if (product.category === 'air_conditioner') {
          baseDemand *= tempNoise > 35 ? 2.5 : tempNoise > 30 ? 1.5 : tempNoise < 20 ? 0.3 : 0.8;
        } else if (product.category === 'refrigerator') {
          baseDemand *= tempNoise > 32 ? 1.6 : tempNoise > 25 ? 1.2 : 0.9;
        } else if (product.category === 'washing_machine') {
          baseDemand *= month >= 8 && month <= 10 ? 1.4 : 1.0;
        }

        const units = Math.max(1, Math.round(baseDemand * festivalBoost * weekendBoost * randF(0.6, 1.4)));
        const revenue = units * (product.pricing?.sellingPrice || 25000);

        // Color breakdown
        const whiteShare = tempNoise > 35 ? 0.50 : 0.38;
        const silverShare = tempNoise > 35 ? 0.35 : 0.32;
        const blackShare = tempNoise > 35 ? 0.08 : 0.18;
        const remainingShare = 1 - whiteShare - silverShare - blackShare;

        salesData.push({
          date,
          sku: product.sku,
          rdcCode: rdc.code,
          category: product.category,
          unitsSold: units,
          revenue,
          channel: ['retail', 'online_flipkart', 'online_amazon', 'distributor'][rand(0, 3)],
          region: rdc.region,
          externalFactors: {
            temperature: +tempNoise.toFixed(1),
            humidity,
            rainfall,
            festival: festivalName,
            promoActive: festivalBoost > 1.2,
            promoDiscount: festivalBoost > 1.2 ? rand(10, 30) : 0,
            competitorPriceIndex: randF(0.9, 1.1)
          },
          colorBreakdown: {
            white: Math.round(units * whiteShare),
            silver: Math.round(units * silverShare),
            black: Math.round(units * blackShare),
            stainless_steel: Math.round(units * remainingShare * 0.6),
            rose_gold: Math.round(units * remainingShare * 0.4)
          }
        });
      }
    }
  }

  // Batch insert (much faster)
  const batchSize = 5000;
  for (let i = 0; i < salesData.length; i += batchSize) {
    await SalesHistory.insertMany(salesData.slice(i, i + batchSize));
    process.stdout.write(`\r  Inserted ${Math.min(i + batchSize, salesData.length)}/${salesData.length} sales records`);
  }
  console.log(`\n✓ ${salesData.length} sales records created`);
}

// ─── GENERATE COMMODITY PRICES (12 months) ───
async function generateCommodityPrices() {
  const commodities = [
    { name: 'copper', basePrice: 8.5, volatility: 0.08, unit: 'USD/kg' },
    { name: 'aluminum', basePrice: 2.4, volatility: 0.06, unit: 'USD/kg' },
    { name: 'steel', basePrice: 0.8, volatility: 0.05, unit: 'USD/kg' },
    { name: 'polyethylene', basePrice: 1.2, volatility: 0.1, unit: 'USD/kg' },
    { name: 'crude_oil', basePrice: 78, volatility: 0.12, unit: 'USD/barrel' },
    { name: 'semiconductor_index', basePrice: 100, volatility: 0.15, unit: 'index' }
  ];

  const data = [];
  const now = new Date();
  for (const comm of commodities) {
    let price = comm.basePrice;
    for (let daysAgo = 365; daysAgo >= 0; daysAgo--) {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      const change = (Math.random() - 0.48) * comm.volatility * price;
      price = Math.max(price * 0.7, price + change);
      const priceINR = +(price * 83.5).toFixed(2);
      data.push({
        date, commodity: comm.name, price: +price.toFixed(4),
        currency: 'USD', priceINR, changePercent: +((change / price) * 100).toFixed(2)
      });
    }
  }
  await CommodityPrice.insertMany(data);
  console.log(`✓ ${data.length} commodity price records created`);
}

// ─── GENERATE INVENTORY ───
async function generateInventory(productDocs, rdcDocs) {
  const inventoryData = [];
  for (const rdc of rdcDocs) {
    const rdcProducts = productDocs.sort(() => 0.5 - Math.random()).slice(0, rand(15, 25));
    for (const product of rdcProducts) {
      const avgDaily = rand(5, 30);
      const currentStock = rand(20, 800);
      const safetyStock = avgDaily * 14;
      const dos = Math.round(currentStock / avgDaily);
      let status = 'normal';
      if (dos < 7) status = 'critical';
      else if (dos < 14) status = 'warning';
      else if (currentStock > rdc.capacity.totalUnits * 0.15) status = 'overstock';

      inventoryData.push({
        sku: product.sku, productId: product._id, rdcCode: rdc.code,
        currentStock, safetyStock, reorderPoint: avgDaily * 10,
        maxCapacity: Math.round(rdc.capacity.totalUnits * 0.15),
        status, daysOfSupply: dos, avgDailySales: avgDaily,
        pendingInbound: rand(0, 100), pendingOutbound: rand(0, 50),
        anomalyFlag: Math.random() < 0.08, anomalyScore: randF(0, 1)
      });
    }
  }
  await Inventory.insertMany(inventoryData);
  console.log(`✓ ${inventoryData.length} inventory records created`);
}

// ─── MAIN SEED ───
async function seed() {
  try {
    await connectDB();
    console.log('\n🌱 Seeding Aeronova database...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Product.deleteMany({}), RDC.deleteMany({}),
      Supplier.deleteMany({}), Inventory.deleteMany({}),
      SalesHistory.deleteMany({}), CommodityPrice.deleteMany({})
    ]);
    console.log('✓ Cleared existing data');

    // Create demo user
    await User.create({ name: 'Demo User', email: 'demo@aeronova.com', password: 'demo123456', role: 'admin' });
    await User.create({ name: 'Supply Planner', email: 'planner@aeronova.com', password: 'planner123', role: 'planner' });
    console.log('✓ Users created (demo@aeronova.com / demo123456)');

    // Suppliers
    const supplierDocs = await Supplier.insertMany(suppliers);
    console.log(`✓ ${supplierDocs.length} suppliers created`);

    // RDCs
    const rdcDocs = await RDC.insertMany(rdcs);
    console.log(`✓ ${rdcDocs.length} RDCs created`);

    // Products
    const productDocs = await Product.insertMany(products);
    console.log(`✓ ${productDocs.length} products created`);

    // Sales history (12 months - this is the ML training data)
    console.log('\n📊 Generating 12 months of sales data (this takes ~30 seconds)...');
    await generateSalesHistory(productDocs, rdcDocs);

    // Commodity prices
    await generateCommodityPrices();

    // Inventory
    await generateInventory(productDocs, rdcDocs);

    console.log('\n🎉 Seed complete! Database is ready for ML training.\n');
    console.log('Quick stats:');
    console.log(`  Products:        ${await Product.countDocuments()}`);
    console.log(`  RDCs:            ${await RDC.countDocuments()}`);
    console.log(`  Suppliers:       ${await Supplier.countDocuments()}`);
    console.log(`  Sales records:   ${await SalesHistory.countDocuments()}`);
    console.log(`  Inventory items: ${await Inventory.countDocuments()}`);
    console.log(`  Commodity prices:${await CommodityPrice.countDocuments()}`);
    console.log(`\nLogin: demo@aeronova.com / demo123456\n`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();