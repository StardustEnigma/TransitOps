import React from 'react';
import { 
  Car, CheckCircle, Wrench, Route, Clock, UserCheck, PieChart,
  ArrowRight
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const stats = [
    { title: 'ACTIVE VEHICLES', icon: Car, value: '70', trend: '↗ +5% vs avg', trendColor: 'black' },
    { title: 'AVAILABLE VEHICLES', icon: CheckCircle, value: '38', trend: '— Stable', trendColor: 'gray' },
    { title: 'VEHICLES IN MAINTENANCE', icon: Wrench, value: '20', trend: '↗ +2 since yesterday', trendColor: 'red', iconColor: 'red' },
    { title: 'ACTIVE TRIPS', icon: Route, value: '42', trend: '↗ +12% vs last hr', trendColor: 'black' },
    { title: 'PENDING TRIPS', icon: Clock, value: '15', trend: 'Clock For next 4 hrs', trendColor: 'gray' },
    { title: 'DRIVERS ON DUTY', icon: UserCheck, value: '65', trend: 'Check Sufficient coverage', trendColor: 'gray' },
    { title: 'FLEET UTILIZATION %', icon: PieChart, value: '84%', trend: '↗ +3% this week', trendColor: 'black' },
  ];

  const recentTrips = [
    { id: 'TRP-8041', initials: 'JS', name: 'J. Smith', route: 'CHI → DET', roi: '+$420', status: 'Completed', roiColor: 'black' },
    { id: 'TRP-8040', initials: 'MC', name: 'M. Chen', route: 'NY → PHI', roi: '--', status: 'In Transit', roiColor: 'gray' },
    { id: 'TRP-8039', initials: 'AW', name: 'A. Wright', route: 'ATL → MIA', roi: '--', status: 'In Transit', roiColor: 'gray' },
    { id: 'TRP-8038', initials: 'DL', name: 'D. Lewis', route: 'DAL → HOU', roi: '+$185', status: 'Completed', roiColor: 'black' },
    { id: 'TRP-8037', initials: 'RJ', name: 'R. Jones', route: 'SEA → POR', roi: '-$45', status: 'Delayed', roiColor: 'red' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Operations Dashboard</h1>
          <p>High-level summary of fleet performance and active operations.</p>
        </div>
        <div className="last-updated">
          <Clock size={14} /> Last updated: Just now
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div className="stat-card" key={idx}>
              <div className="stat-header">
                <span className="stat-title">{s.title}</span>
                <Icon size={16} color={s.iconColor === 'red' ? '#DC2626' : '#1A1A1B'} />
              </div>
              <div className="stat-value">{s.value}</div>
              <div className={`stat-trend trend-${s.trendColor}`}>
                {s.trend.startsWith('Clock') ? (
                   <><Clock size={12} style={{marginRight: 4}}/> {s.trend.replace('Clock ', '')}</>
                ) : s.trend.startsWith('Check') ? (
                   <><CheckCircle size={12} style={{marginRight: 4}}/> {s.trend.replace('Check ', '')}</>
                ) : s.trend}
              </div>
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
                <span className="donut-value">128</span>
                <span className="donut-label">Total Units</span>
              </div>
            </div>
          </div>

          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-label">
                <span className="dot dot-black"></span> On Trip
              </div>
              <span className="legend-value">55%</span>
            </div>
            <div className="legend-item">
              <div className="legend-label">
                <span className="dot dot-blue"></span> Available
              </div>
              <span className="legend-value">30%</span>
            </div>
            <div className="legend-item">
              <div className="legend-label">
                <span className="dot dot-red"></span> Maintenance
              </div>
              <span className="legend-value">15%</span>
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
                <th>ROI EST.</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip, idx) => (
                <tr key={idx}>
                  <td className="trip-id">{trip.id}</td>
                  <td>
                    <div className="driver-cell">
                      <div className="avatar-initials">{trip.initials}</div>
                      <span>{trip.name}</span>
                    </div>
                  </td>
                  <td className="route-cell">{trip.route}</td>
                  <td className={`roi-cell roi-${trip.roiColor}`}>{trip.roi}</td>
                  <td>
                    <span className={`trip-status-badge trip-${trip.status.toLowerCase().replace(' ', '-')}`}>
                      {trip.status === 'Delayed' && <span className="dot-red-small"></span>}
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
