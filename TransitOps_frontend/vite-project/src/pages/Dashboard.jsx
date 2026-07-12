import React, { useState, useEffect } from 'react';
import { 
  Car, CheckCircle, Wrench, Route, Clock, UserCheck, PieChart,
  ArrowRight, Loader2, AlertCircle
} from 'lucide-react';
import { dashboardApi, tripsApi, vehiclesApi } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel; gracefully handle individual failures
      const results = await Promise.allSettled([
        dashboardApi.getKpis(),
        tripsApi.getAll(),
        vehiclesApi.getAll()
      ]);

      if (results[0].status === 'fulfilled') {
        setKpis(results[0].value);
      }
      if (results[1].status === 'fulfilled') {
        setTrips(Array.isArray(results[1].value) ? results[1].value : []);
      }
      if (results[2].status === 'fulfilled') {
        setVehicles(Array.isArray(results[2].value) ? results[2].value : []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute local KPIs from vehicle data as fallback
  const totalVehicles = vehicles.length;
  const onTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const inShopVehicles = vehicles.filter(v => v.status === 'IN_SHOP').length;

  const activeTrips = trips.filter(t => t.status === 'DISPATCHED').length;
  const pendingTrips = trips.filter(t => t.status === 'DRAFT').length;

  const stats = [
    { 
      title: 'ACTIVE VEHICLES', icon: Car, 
      value: kpis?.activeVehicles ?? onTripVehicles, 
      trend: totalVehicles > 0 ? `${totalVehicles} total in fleet` : 'No vehicles yet'
    },
    { 
      title: 'AVAILABLE VEHICLES', icon: CheckCircle, 
      value: kpis?.availableVehicles ?? availableVehicles, 
      trend: '— Ready to dispatch'
    },
    { 
      title: 'VEHICLES IN MAINTENANCE', icon: Wrench, 
      value: kpis?.vehiclesInMaintenance ?? inShopVehicles, 
      trend: inShopVehicles > 0 ? `${inShopVehicles} currently in shop` : 'All clear',
      iconColor: inShopVehicles > 0 ? 'red' : undefined
    },
    { 
      title: 'ACTIVE TRIPS', icon: Route, 
      value: kpis?.activeTrips ?? activeTrips, 
      trend: `${trips.length} total trips logged`
    },
    { 
      title: 'PENDING TRIPS', icon: Clock, 
      value: kpis?.pendingTrips ?? pendingTrips, 
      trend: pendingTrips > 0 ? 'Awaiting dispatch' : 'None pending'
    },
    { 
      title: 'DRIVERS ON DUTY', icon: UserCheck, 
      value: kpis?.driversOnDuty ?? '--', 
      trend: 'Check driver roster'
    },
    { 
      title: 'FLEET UTILIZATION %', icon: PieChart, 
      value: kpis?.fleetUtilization != null ? `${kpis.fleetUtilization.toFixed(0)}%` : (totalVehicles > 0 ? `${((onTripVehicles / totalVehicles) * 100).toFixed(0)}%` : '0%'),
      trend: 'Active / Total non-retired'
    },
  ];

  // Format recent trips for display
  const recentTrips = trips.slice(0, 5).map(trip => ({
    id: `TRP-${trip.id}`,
    driverName: trip.driverName || `Driver #${trip.driverId}`,
    initials: (trip.driverName || 'DR').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    route: `${trip.source || '?'} → ${trip.destination || '?'}`,
    status: trip.status === 'DISPATCHED' ? 'In Transit' : trip.status === 'COMPLETED' ? 'Completed' : trip.status === 'CANCELLED' ? 'Cancelled' : 'Draft',
    cargoWeight: trip.cargoWeight
  }));

  // Vehicle status breakdown for donut chart
  const nonRetired = vehicles.filter(v => v.status !== 'RETIRED').length || 1;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Operations Dashboard</h1>
          <p>High-level summary of fleet performance and active operations.</p>
        </div>
        <div className="last-updated">
          {loading ? (
            <><Loader2 size={14} className="spin-icon" /> Loading...</>
          ) : (
            <><Clock size={14} /> Last updated: Just now</>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="stats-grid">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div className="stat-card" key={idx}>
              <div className="stat-header">
                <span className="stat-title">{s.title}</span>
                <Icon size={16} color={s.iconColor === 'red' ? '#DC2626' : '#1A1A1B'} />
              </div>
              <div className="stat-value">{loading ? '...' : s.value}</div>
              <div className="stat-trend trend-gray">{s.trend}</div>
            </div>
          );
        })}
      </div>

      <div className="bottom-sections">
        {/* Fleet Status Chart */}
        <div className="fleet-status-card">
          <h2 className="card-title">Fleet Status</h2>
          
          <div className="donut-chart-container">
            <div className="donut-chart">
              <div className="donut-inner">
                <span className="donut-value">{loading ? '...' : totalVehicles}</span>
                <span className="donut-label">Total Units</span>
              </div>
            </div>
          </div>

          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-label">
                <span className="dot dot-black"></span> On Trip
              </div>
              <span className="legend-value">{totalVehicles > 0 ? `${((onTripVehicles / nonRetired) * 100).toFixed(0)}%` : '0%'}</span>
            </div>
            <div className="legend-item">
              <div className="legend-label">
                <span className="dot dot-blue"></span> Available
              </div>
              <span className="legend-value">{totalVehicles > 0 ? `${((availableVehicles / nonRetired) * 100).toFixed(0)}%` : '0%'}</span>
            </div>
            <div className="legend-item">
              <div className="legend-label">
                <span className="dot dot-red"></span> Maintenance
              </div>
              <span className="legend-value">{totalVehicles > 0 ? `${((inShopVehicles / nonRetired) * 100).toFixed(0)}%` : '0%'}</span>
            </div>
          </div>
        </div>

        {/* Recent Trip History */}
        <div className="recent-trips-card">
          <div className="card-header-row">
            <h2 className="card-title">Recent Trip History</h2>
            <button className="view-all-btn">
              VIEW ALL <ArrowRight size={14} />
            </button>
          </div>

          <table className="trips-table">
            <thead>
              <tr>
                <th>TRIP ID</th>
                <th>DRIVER</th>
                <th>ROUTE</th>
                <th>CARGO (kg)</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280', fontSize: 13 }}>
                    No trips recorded yet. Create your first trip to see it here.
                  </td>
                </tr>
              )}
              {recentTrips.map((trip, idx) => (
                <tr key={idx}>
                  <td className="trip-id">{trip.id}</td>
                  <td>
                    <div className="driver-cell">
                      <div className="avatar-initials">{trip.initials}</div>
                      <span>{trip.driverName}</span>
                    </div>
                  </td>
                  <td className="route-cell">{trip.route}</td>
                  <td>{trip.cargoWeight ?? '--'}</td>
                  <td>
                    <span className={`trip-status-badge trip-${trip.status.toLowerCase().replace(' ', '-')}`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
