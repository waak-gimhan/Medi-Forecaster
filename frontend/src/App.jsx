import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import DailySales from './pages/DailySales.jsx'
import Inventory from './pages/Inventory.jsx'
import Forecasts from './pages/Forecasts.jsx'
import Recommendations from './pages/Recommendations.jsx'

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <h1>RxForecast</h1>
          <p>Pharmacy Demand Planner</p>
        </div>
        <nav>
          <NavLink to="/dashboard" className="nav-link">
             Dashboard
          </NavLink>
          <NavLink to="/sales" className="nav-link">
             Daily Sales
          </NavLink>
          <NavLink to="/inventory" className="nav-link">
             Current Stock
          </NavLink>
          <NavLink to="/forecasts" className="nav-link">
             Forecasts
          </NavLink>
          <NavLink to="/recommendations" className="nav-link">
             Purchase Recommendations
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          RxForecast v2.0 · AI/ML
        </div>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<DailySales />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Routes>
      </main>
    </div>
  )
}