import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Recommendations() {
  const [data, setData] = useState(null)
  const [runDate, setRunDate] = useState('')
  const [error, setError] = useState('')

  function load(run) {
    setError('')
    api
      .getRecommendations(run)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  function handleUseRun() {
    if (runDate) load(runDate)
  }

  const recs = data ? data.recommendations : []
  const buy = recs.filter((r) => r.status === 'BUY')
  const sufficient = recs.filter((r) => r.status === 'SUFFICIENT')
  const totalBuy = buy.reduce((s, r) => s + r.recommended_purchase, 0)

  return (
    <div>
      <h2>Inventory Purchase Recommendations</h2>
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
          {data
            ? `${buy.length} to buy / ${sufficient.length} sufficient`
            : '...'}
        </div>
      </div>

      {data && (
        <>
          <div className="card-grid">
            <div className="card">
              <h3>Medicines to Buy</h3>
              <p className="big">{buy.length}</p>
            </div>
            <div className="card">
              <h3>Total Units to Order</h3>
              <p className="big">{totalBuy}</p>
            </div>
            <div className="card">
              <h3>Stock Sufficient</h3>
              <p className="big">{sufficient.length}</p>
            </div>
          </div>

          <div className="panel">
            <h3>BUY List</h3>
            {buy.length === 0 ? (
              <p className="muted">No medicines need to be purchased.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>7-Day Demand</th>
                    <th>Current Stock</th>
                    <th>Recommended Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {buy
                    .sort((a, b) => b.recommended_purchase - a.recommended_purchase)
                    .map((r) => (
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
          </div>

          <div className="panel">
            <h3>All Medicines ({recs.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Status</th>
                  <th>7-Day Demand</th>
                  <th>Current Stock</th>
                  <th>Recommended Purchase</th>
                </tr>
              </thead>
              <tbody>
                {recs.map((r) => (
                  <tr key={r.medicine_id}>
                    <td>
                      {r.medicine_name}{' '}
                      <span className="muted">{r.medicine_id}</span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${r.status.toLowerCase()}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>{r.seven_day_demand}</td>
                    <td>{r.current_stock}</td>
                    <td>{r.recommended_purchase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!data && !error && <p className="muted">Loading recommendations...</p>}
    </div>
  )
}