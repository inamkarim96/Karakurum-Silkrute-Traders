import api, { clearApiCache } from './axios';

// ── Site Settings (singleton company info) ──────────────────────────────
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.put('/settings', data);
  clearApiCache();
  return response.data;
};

export const uploadSettingsImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/settings/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// ── Services (bulk trade, sourcing, cargo, customs, etc.) ──────────────
export const getServices = async (includeInactive = false) => {
  const response = await api.get('/services', { params: includeInactive ? { all: 'true' } : {} });
  return response.data;
};

export const createService = async (data) => {
  const response = await api.post('/services', data);
  clearApiCache();
  return response.data;
};

export const updateService = async (id, data) => {
  const response = await api.put(`/services/${id}`, data);
  clearApiCache();
  return response.data;
};

export const deleteService = async (id) => {
  const response = await api.delete(`/services/${id}`);
  clearApiCache();
  return response.data;
};

// ── Team members (CEO, Directors, leadership) ───────────────────────────
export const getTeamMembers = async (includeInactive = false) => {
  const response = await api.get('/team', { params: includeInactive ? { all: 'true' } : {} });
  return response.data;
};

export const createTeamMember = async (data) => {
  const response = await api.post('/team', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  clearApiCache();
  return response.data;
};

export const updateTeamMember = async (id, data) => {
  const response = await api.put(`/team/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  clearApiCache();
  return response.data;
};

export const deleteTeamMember = async (id) => {
  const response = await api.delete(`/team/${id}`);
  clearApiCache();
  return response.data;
};
