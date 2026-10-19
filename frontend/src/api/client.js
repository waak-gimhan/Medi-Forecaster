const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || JSON.stringify(body)
    } catch {
      // ignore parse errors
    }
    throw new Error(detail)
  }
  return res.json()
}

export const api = {
  getMedicines: () => request('/medicines'),

  getClosedDates: () => request('/sales/closed-dates'),

  getSalesByDate: (sale_date) =>
    request(`/sales/by-date?sale_date=${sale_date}`),

  submitDailySales: (sale_date, sales) =>
    request('/sales/daily', {
      method: 'POST',
      body: JSON.stringify({ sale_date, sales }),
    }),

  markClosed: (closed_date, reason) =>
    request('/sales/closed', {
      method: 'POST',
      body: JSON.stringify({ closed_date, reason }),
    }),

  runForecast: (forecast_date) =>
    request(`/forecast/run?forecast_date=${forecast_date}`, {
      method: 'POST',
    }),

  getForecast: (run_date) =>
    request(`/forecast/latest${run_date ? `?run_date=${run_date}` : ''}`),

  getRecommendations: (run_date) =>
    request(`/recommendations${run_date ? `?run_date=${run_date}` : ''}`),

  getInventory: () => request('/inventory'),

  updateInventory: (updates) =>
    request('/inventory', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    }),

  recomputeInventory: () =>
    request('/inventory/recompute', { method: 'POST' }),
}

export function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}