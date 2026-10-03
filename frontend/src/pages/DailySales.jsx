import { useEffect, useState } from 'react'
import { api, todayStr } from '../api/client'

export default function DailySales() {
  const [date, setDate] = useState(todayStr())
  const [medicines, setMedicines] = useState([])
  const [closedDates, setClosedDates] = useState([])
  const [existing, setExisting] = useState({})
  const [quantities, setQuantities] = useState({})
  const [isClosedSelected, setIsClosedSelected] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getMedicines()
      .then((m) => setMedicines(m))
      .catch((e) => setError(e.message))
    api
      .getClosedDates()
      .then(setClosedDates)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!date) return
    setError('')
    setMessage('')
    // Clear previous state while loading a new date
    setExisting({})
    setQuantities({})

    api
      .getClosedDates()
      .then((dates) => {
        setClosedDates(dates)
        const isClosed = dates.some((c) => c.closed_date === date)
        setIsClosedSelected(isClosed)
        setReason(isClosed ? dates.find((c) => c.closed_date === date)?.reason || '' : '')
      })
      .catch((e) => setError(e.message))

    api
      .getSalesByDate(date)
      .then((rows) => {
        const map = {}
        rows.forEach((r) => {
          map[r.medicine_id] = r.quantity_sold
        })
        setExisting(map)
        setQuantities(map)
      })
      .catch((e) => setError(e.message))
  }, [date])

  const dateOpen = !isClosedSelected

  function handleQtyChange(medicineId, value) {
    const cleaned = value.replace(/[^0-9]/g, '')
    setQuantities((prev) => ({ ...prev, [medicineId]: cleaned }))
  }

  function buildSalesPayload() {
    const entries = []
    medicines.forEach((m) => {
      const raw = quantities[m.medicine_id]
      if (raw !== undefined && raw !== '' && Number(raw) > 0) {
        entries.push({
          medicine_id: m.medicine_id,
          quantity_sold: Number(raw),
        })
      }
    })
    return entries
  }

  async function handleSaveSales() {
    const entries = buildSalesPayload()
    if (entries.length === 0) {
      setError('Enter at least one medicine quantity before saving.')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await api.submitDailySales(date, entries)
      setMessage(
        `${result.entries_processed} entry/entries saved for ${date}.`
      )
      const rows = await api.getSalesByDate(date)
      const map = {}
      rows.forEach((r) => (map[r.medicine_id] = r.quantity_sold))
      setExisting(map)
      setQuantities(map)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkClosed() {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await api.markClosed(date, reason)
      setClosedDates(await api.getClosedDates())
      setIsClosedSelected(true)
      setQuantities({})
      setExisting({})
      setMessage(`${date} marked as CLOSED. No sales will be recorded.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRunForecast() {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await api.runForecast(date)
      setMessage(
        `${result.forecasts_saved} forecasts + ${result.recommendations_saved} recommendations generated for run date ${result.run_date}.`
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Daily Sales Entry</h2>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="panel">
        <div className="row">
          <label>
            Sales Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className={`status-badge ${dateOpen ? 'open' : 'closed'}`}>
            {dateOpen ? 'OPEN' : 'CLOSED'}
          </div>
        </div>
      </div>

      {dateOpen ? (
        <>
          <div className="panel">
            <h3>Enter Medicine Quantities</h3>
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Name</th>
                  <th>Quantity Sold</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m.medicine_id}>
                    <td>{m.medicine_id}</td>
                    <td>{m.medicine_name}</td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={
                          existing[m.medicine_id] !== undefined
                            ? `saved: ${existing[m.medicine_id]}`
                            : '0'
                        }
                        value={quantities[m.medicine_id] ?? ''}
                        onChange={(e) =>
                          handleQtyChange(m.medicine_id, e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="actions">
              <button
                className="primary"
                onClick={handleSaveSales}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Sales'}
              </button>
              <button
                className="secondary"
                onClick={handleRunForecast}
                disabled={loading}
              >
                Save Sales & Run 7-Day Forecast
              </button>
            </div>
            <p className="muted">
              Re-entering a quantity for the same medicine and date safely
              updates the existing record (no duplicates).
            </p>
          </div>

          <div className="panel danger-zone">
            <h3>Mark This Date As CLOSED</h3>
            <p className="muted">
              The pharmacy is not open on this date. No sales are recorded and
              the date is excluded from forecasting.
            </p>
            <div className="row">
              <input
                type="text"
                placeholder="Reason (e.g. Public Holiday)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <button
                className="danger"
                onClick={handleMarkClosed}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Mark as CLOSED'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="panel">
          <h3>{date} is CLOSED</h3>
          <p>
            Reason: <strong>{reason || 'Not specified'}</strong>
          </p>
          <p className="muted">
            This date is treated as a closed day. Sales entry is disabled, and
            forecasting will use the previous valid sales history.
          </p>
          <div className="actions">
            <button
              className="primary"
              onClick={handleRunForecast}
              disabled={loading}
            >
              {loading ? 'Running...' : 'Run 7-Day Forecast (skip closed date)'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}