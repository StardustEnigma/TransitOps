import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, CheckCircle, Wrench, Route, Clock, UserCheck, PieChart,
  ArrowRight, Loader2, AlertCircle
} from 'lucide-react';
import { dashboardApi, tripsApi, vehiclesApi, expensesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [expenses, setExpenses] = useState([]);
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
        vehiclesApi.getAll(),
        expensesApi.getAll()
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
      if (results[3].status === 'fulfilled') {
        setExpenses(Array.isArray(results[3].value) ? results[3].value : []);
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

  const isDriver = user?.role === 'DRIVER';
  const driverCompletedTrips = trips.filter(t => t.status === 'COMPLETED').length;
  const driverTotalDistance = trips.filter(t => t.status === 'COMPLETED' && t.actualDistance != null).reduce((sum, t) => sum + t.actualDistance, 0);
  const driverTotalCost = expenses.reduce((sum, e) => sum + e.amount, 0);

  const stats = isDriver ? [
    { 
      title: 'YOUR ACTIVE TRIPS', icon: Route, 
      value: activeTrips, 
      trend: 'Currently in transit'
    },
    { 
      title: 'YOUR PENDING TRIPS', icon: Clock, 
      value: pendingTrips, 
      trend: 'Awaiting dispatch'
    },
    { 
      title: 'YOUR COMPLETED TRIPS', icon: CheckCircle, 
      value: driverCompletedTrips, 
      trend: 'Successfully delivered'
    },
    { 
      title: 'TOTAL DISTANCE TRAVELED', icon: Car, 
      value: `${driverTotalDistance.toFixed(1)} km`, 
      trend: 'Across completed trips'
    },
    { 
      title: 'TOTAL OPERATIONAL COST', icon: PieChart, 
      value: `$${driverTotalCost.toFixed(2)}`, 
      trend: 'Expenses logged by you'
    }
  ] : [
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

  // Vehicle status breakdown for donut chart — compute dynamic percentages
  const nonRetired = vehicles.filter(v => v.status !== 'RETIRED').length || 1;
  const onTripPct = totalVehicles > 0 ? ((onTripVehicles / nonRetired) * 100).toFixed(0) : 0;
  const availablePct = totalVehicles > 0 ? ((availableVehicles / nonRetired) * 100).toFixed(0) : 0;
  const inShopPct = totalVehicles > 0 ? ((inShopVehicles / nonRetired) * 100).toFixed(0) : 0;
  const donutStyle = totalVehicles > 0
    ? { background: `conic-gradient(#1A1A1B 0% ${onTripPct}%, #DBEAFE ${onTripPct}% ${parseFloat(onTripPct) + parseFloat(availablePct)}%, #DC2626 ${parseFloat(onTripPct) + parseFloat(availablePct)}% 100%)` }
    : { background: '#E2E8F0' };

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
        {/* Fleet Status Chart or Driver Expenses */}
        {isDriver ? (
          <div className="fleet-status-card">
            <h2 className="card-title">Recent Expenses Logged</h2>
            <div className="driver-expenses-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {expenses.slice(0, 5).map((e, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#1E293B', display: 'block' }}>{e.expenseType.replace('_', ' ')}</span>
                    <span style={{ color: '#64748B', fontSize: '11px', display: 'block', marginTop: '2px' }}>{e.description || 'No description'}</span>
                    <span style={{ color: '#94A3B8', fontSize: '10px' }}>Trip TRP-{e.tripId} — {e.expenseDate}</span>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>
                    ${e.amount.toFixed(2)}
                  </div>
                </div>
              ))}
              {expenses.length === 0 && !loading && (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '32px 0', fontSize: '13px' }}>
                  No expenses logged yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="fleet-status-card">
            <h2 className="card-title">Fleet Status</h2>
            
            <div className="donut-chart-container">
              <div className="donut-chart" style={donutStyle}>
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
        )}

        {/* Recent Trip History */}
        <div className="recent-trips-card">
          <div className="card-header-row">
            <h2 className="card-title">Recent Trip History</h2>
            <button className="view-all-btn" onClick={() => navigate('/triplogs')}>
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
