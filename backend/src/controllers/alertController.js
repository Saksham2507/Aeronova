const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
  try {
    const { severity, category, status, source } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (source) filter.source = source;
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveCount = async (req, res) => {
  try {
    const counts = await Alert.aggregate([
      { $match: { status: { $in: ['new', 'acknowledged', 'in_progress'] } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    const result = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    counts.forEach(c => { result[c._id] = c.count; result.total += c.count; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'resolved') {
      update.resolvedAt = new Date();
      update.resolvedBy = req.user.userId;
    }
    const alert = await Alert.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};