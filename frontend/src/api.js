const BASE = '/api/tasks';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  list:           (filter) => request(`${BASE}${filter && filter !== 'all' ? `?filter=${filter}` : ''}`),
  create:         (text, priority) => request(BASE, { method: 'POST', body: JSON.stringify({ text, priority }) }),
  update:         (id, patch)      => request(`${BASE}/${id}`, { method: 'PUT',    body: JSON.stringify(patch) }),
  remove:         (id)             => request(`${BASE}/${id}`, { method: 'DELETE' }),
  clearCompleted: ()               => request(BASE,            { method: 'DELETE' }),
};
