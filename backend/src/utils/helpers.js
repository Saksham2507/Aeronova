const helpers = {
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  calculatePercentage: (value, total) => {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  },

  formatDate: (date) => {
    return new Date(date).toLocaleDateString();
  },

  isValidEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

module.exports = helpers;