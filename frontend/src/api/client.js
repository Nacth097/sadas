const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload.data;
};

export const api = {
  categories: () => request('/categories'),
  products: (slug) => request(`/categories/${slug}/products`),
  paymentChannels: () => request('/payment-channels'),
  createTransaction: (body) =>
    request('/transactions', { method: 'POST', body: JSON.stringify(body) }),
  transaction: (invoiceNumber) => request(`/transactions/${invoiceNumber}`)
};
