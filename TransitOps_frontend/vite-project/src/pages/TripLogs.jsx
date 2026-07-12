import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Fuel, Navigation, PenTool as Tool, TrendingUp } from 'lucide-react';
import './TripLogs.css';

// Fix for default Leaflet markers in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function TripLogs() {
  const mumbaiCenter = [19.0176, 72.8561]; // Dadar roughly center
  const routePositions = [
    [19.1136, 72.8697], // Andheri
    [19.0176, 72.8561], // Dadar
    [18.9067, 72.8147]  // Colaba
  ];

  const recentLogs = [
    { type: 'Fuel', place: 'HP Petrol Pump', date: 'Oct 24, 09:15 AM', amount: '-$150.00', icon: Fuel },
    { type: 'Toll', place: 'BWSL Toll', date: 'Oct 24, 11:30 AM', amount: '-$5.20', icon: Navigation },
    { type: 'Tire Patch', place: 'Local Garage', date: 'Oct 23, 16:45 PM', amount: '-$35.00', icon: Tool }
  ];

  return (
    <div className="triplogs-page">
      <div className="trip-header-section">
        <div>
          <h1>Trip #TR-1024</h1>
          <p>Andheri, Mumbai → Colaba, Mumbai</p>
        </div>
        <div className="trip-actions">
          <span className="status-badge status-in-progress">
            <span className="dot"></span> In Progress
          </span>
          <button className="btn btn-blue">Complete Trip</button>
        </div>
      </div>

      <div className="triplogs-grid">
        <div className="map-section">
          <div className="map-header">
            <span className="map-title">Live Tracking</span>
            <span className="map-eta">ETA: 14:30 IST</span>
          </div>
          <div className="map-container">
            <MapContainer center={mumbaiCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <Polyline positions={routePositions} color="#1E40AF" weight={4} dashArray="10, 10" />
              <Marker position={routePositions[0]}>
                <Popup>Andheri (Pickup)</Popup>
              </Marker>
              <Marker position={routePositions[1]}>
                <Popup>Dadar (Midpoint)</Popup>
              </Marker>
              <Marker position={routePositions[2]}>
                <Popup>Colaba (Drop-off)</Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="log-expense-card">
            <h3>Log Expense</h3>
            <form className="expense-form">
              <div className="form-group">
                <label>Expense Type</label>
                <select>
                  <option>Fuel</option>
                  <option>Toll</option>
                  <option>Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (USD)</label>
                <input type="number" placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" />
              </div>
              <button type="button" className="btn btn-primary" style={{alignSelf: 'flex-end', marginBottom: '2px'}}>Add</button>
            </form>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="profitability-card">
            <h3 className="card-title"><TrendingUp size={16} /> Profitability</h3>
            <div className="prof-row">
              <span className="prof-label">Expected Revenue</span>
              <span className="prof-value revenue">$4,500.00</span>
            </div>
            <div className="prof-row">
              <span className="prof-label">Logged Expenses</span>
              <span className="prof-value expense">-$190.20</span>
            </div>
            <hr />
            <div className="prof-row">
              <span className="prof-label-large">Current ROI</span>
              <span className="prof-value-large">$4,309.80</span>
            </div>
            <div className="prof-margin">95% MARGIN</div>
          </div>

          <div className="recent-logs-card">
            <div className="logs-header">Recent Logs</div>
            <div className="logs-list">
              {recentLogs.map((log, idx) => {
                const Icon = log.icon;
                return (
                  <div className="log-item" key={idx}>
                    <div className="log-icon-wrapper">
                      <Icon size={16} />
                    </div>
                    <div className="log-details">
                      <div className="log-type">{log.type} ({log.place})</div>
                      <div className="log-date">{log.date}</div>
                    </div>
                    <div className="log-amount">{log.amount}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
