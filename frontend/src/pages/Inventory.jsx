import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Inventory() {
  const [rows, setRows] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  function load() {
    setError('')
    api
      .getInventory()
      .then((data) => {
        setRows(data)
        const map = {}
        data.forEach((r) => (map[r.medicine_id] = r.current_stock))
        setDrafts(map)
      })
      .catch((e) => setError(e.message))
  }

  function handleChange(medicineId, value) {
    const cleaned = value.replace(/[^0-9]/g, '')
    setDrafts((prev) => ({ ...prev, [medicineId]: cleaned }))
  }

  const dirty = rows.filter(
    (r) =>
      drafts[r.medicine_id] !== undefined &&
      drafts[r.medicine_id] !== '' &&
      Number(drafts[r.medicine_id]) !== r.current_stock
  )

  function buildUpdates() {
    return dirty.map((r) => ({
      medicine_id: r.medicine_id,
      current_stock: Number(drafts[r.medicine_id]),
    }))
  }

  async function handleSave() {
    if (dirty.length === 0) {
      setError('No stock changes to save.')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await api.updateInventory(buildUpdates())
      setMessage(
        `${result.updated} stock level(s) updated in the database.`
      )
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefreshRecs() {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await api.recomputeInventory()
      setMessage(
        `Recommendations refreshed for run date ${result.run_date} (${result.recommendations_saved} medicines).`
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const stockColor = (stock) => {
    if (stock === 0) return 'zero'
    if (stock < 100) return 'low'
    return 'ok'
  }

  return (
    <div>
      <h2>Current Stock (Inventory)</h2>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="panel">
        <div className="row">
          <p className="muted">
            Edit the physical stock count for each medicine. Saving updates
            the database immediately and the next inventory recommendation
            calculation uses the new values.
          </p>
          <div className="status-badge">{rows.length} medicines</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Name</th>
              <th>Current Stock</th>
              <th>New Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.medicine_id}>
                <td>{r.medicine_id}</td>
                <td>{r.medicine_name}</td>
                <td>
                  <span className={`stock-badge ${stockColor(r.current_stock)}`}>
                    {r.current_stock}
                  </span>
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={drafts[r.medicine_id] ?? ''}
                    onChange={(e) =>
                      handleChange(r.medicine_id, e.target.value)
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
            onClick={handleSave}
            disabled={loading || dirty.length === 0}
          >
            {loading ? 'Saving...' : `Save Changes (${dirty.length})`}
          </button>
          <button className="secondary" onClick={handleRefreshRecs} disabled={loading}>
            Refresh Recommendations with New Stock
          </button>
        </div>
        {dirty.length > 0 && (
          <p className="muted" style={{ marginTop: 10 }}>
            {dirty.length} medicine(s) have unsaved changes.
          </p>
        )}
      </div>
    </div>
  )
}