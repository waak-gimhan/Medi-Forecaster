import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Forecasts() {
  const [data, setData] = useState(null)
  const [runDate, setRunDate] = useState('')
  const [error, setError] = useState('')

  function load(run) {
    setError('')
    api
      .getForecast(run)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  function handleUseRun() {
    if (runDate) load(runDate)
  }

  const byDate = {}
  if (data) {
    data.forecasts.forEach((f) => {
      if (!byDate[f.forecast_date]) byDate[f.forecast_date] = []
      byDate[f.forecast_date].push(f)
    })
  }

  return (
    <div>
      <h2>7-Day Forecast</h2>
      {error && <div className="alert error">{error}</div>}

      <div className="panel row">
        <label>
          Forecast Run Date
          <input
            type="date"
            value={runDate || (data ? data.run_date : '')}
            onChange={(e) => setRunDate(e.target.value)}
          />
        </label>
        <button className="secondary" onClick={handleUseRun}>
          Load Run
        </button>
        <div className="status-badge">
          {data ? `${data.count} predictions` : '...'}
        </div>
      </div>

      {data && (
        <div className="panel">
          <h3>Run date: {data.run_date}</h3>
          {Object.keys(byDate)
            .sort()
            .map((d) => (
              <div key={d} className="forecast-day">
                <h4>{d}</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Predicted Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDate[d].map((f) => (
                      <tr key={`${d}-${f.medicine_id}`}>
                        <td>
                          {f.medicine_name}{' '}
                          <span className="muted">{f.medicine_id}</span>
                        </td>
                        <td>{f.predicted_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      )}

      {!data && !error && <p className="muted">Loading forecast...</p>}
    </div>
  )
}