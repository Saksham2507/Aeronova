import api from './api';

const demandService = {
  getAllForecasts: () =>
    api.get('/demand').then(res => res.data),

  getForecast: (region, sku) =>
    api.get(`/demand/${region}/${sku}`).then(res => res.data),

  createForecast: (data) =>
    api.post('/demand', data).then(res => res.data),

  updateForecast: (id, data) =>
    api.put(`/demand/${id}`, data).then(res => res.data)
};

export default demandService;