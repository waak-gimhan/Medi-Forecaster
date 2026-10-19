import { useEffect, useState } from 'react'
import { api, todayStr } from '../api/client'

export default function Dashboard() {
  const [medCount, setMedCount] = useState(null)
  const [closedDates, setClosedDates] = useState([])
  const [forecast, setForecast] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [error, setError] = useState('')

  const today = todayStr()

  useEffect(() => {
    api
      .getMedicines()
      .then((m) => setMedCount(m.length))
      .catch((e) => setError(e.message))

    api
      .getClosedDates()
      .then(setClosedDates)
      .catch((e) => setError(e.message))

    api
      .getForecast()
      .then(setForecast)
      .catch((e) => setError(e.message))

    api
      .getRecommendations()
      .then(setRecommendations)
      .catch((e) => setError(e.message))
  }, [])

  const todayClosed = closedDates.some((c) => c.closed_date === today)

  const buyList = recommendations
    ? recommendations.recommendations
        .filter((r) => r.status === 'BUY')
        .sort((a, b) => b.recommended_purchase - a.recommended_purchase)
    : []

  return (
    <div>
      <h2>Dashboard</h2>
      {error && <div className="alert error">{error}</div>}

      <div className="card-grid">
        <div className={`card status ${todayClosed ? 'closed' : 'open'}`}>
          <h3>Today ({today})</h3>
          <p>
            {todayClosed
              ? 'CLOSED'
              : 'OPEN - enter today\u2019s sales'}
          </p>
          {todayClosed && (
            <small>
              {
                closedDates.find((c) => c.closed_date === today)?.reason ||
                'No reason given'
              }
            </small>
          )}
        </div>

        <div className="card">
          <h3>Medicines</h3>
          <p className="big">{medCount ?? '...'}</p>
          <small>in the catalog</small>
        </div>

        <div className="card">
          <h3>Latest Forecast Run</h3>
          <p className="big">{forecast ? forecast.run_date : '...'}</p>
          <small>
            {forecast ? `${forecast.count} predictions` : 'no forecast yet'}
          </small>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <h3>Medicines to Buy ({buyList.length})</h3>
          {buyList.length === 0 ? (
            <p className="muted">All stock levels are sufficient.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>7-Day Demand</th>
                  <th>Current Stock</th>
                  <th>Buy</th>
                </tr>
              </thead>
              <tbody>
                {buyList.slice(0, 10).map((r) => (
                  <tr key={r.medicine_id}>
                    <td>
                      {r.medicine_name}{' '}
                      <span className="muted">{r.medicine_id}</span>
                    </td>
                    <td>{r.seven_day_demand}</td>
                    <td>{r.current_stock}</td>
                    <td className="buy">{r.recommended_purchase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h3>Closed Dates</h3>
          {closedDates.length === 0 ? (
            <p className="muted">No closed dates recorded.</p>
          ) : (
            <ul className="closed-list">
              {closedDates.map((c) => (
                <li key={c.closed_date}>
                  <strong>{c.closed_date}</strong>{' '}
                  <span className="muted">{c.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}