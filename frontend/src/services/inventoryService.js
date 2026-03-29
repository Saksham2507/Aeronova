import api from './api';

const inventoryService = {
  getInventory: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },

  getByRDC: async (rdcId) => {
    const response = await api.get('/inventory/rdc/' + rdcId);
    return response.data;
  },

  updateStock: async (data) => {
    const response = await api.put('/inventory', data);
    return response.data;
  }
};

export default inventoryService;