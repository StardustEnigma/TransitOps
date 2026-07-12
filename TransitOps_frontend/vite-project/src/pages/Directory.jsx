import React from 'react';
import { Car, UserPlus, Users, Filter, User, AlertCircle, AlertTriangle } from 'lucide-react';
import './Directory.css';

export default function Directory() {
  const drivers = [
    {
      id: 'DVR-01', name: 'John Doe', role: 'Delivery',
      status: 'AVAILABLE', expiry: '2025-10-12', expiryStatus: 'ok'
    },
    {
      id: 'DVR-02', name: 'Jane Smith', role: 'Delivery',
      status: 'ON TRIP', expiry: '2023-11-01', expiryStatus: 'expired'
    },
    {
      id: 'DVR-03', name: 'Bob Vance', role: 'Heavy Transit',
      status: 'OFF DUTY', expiry: '2024-02-15', expiryStatus: 'expiring'
    }
  ];

  return (
    <div className="directory-page">
      <div className="page-header">
        <div>
          <h1>Directory</h1>
          <p>Manage your fleet vehicles and assigned personnel.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            <Car size={16} /> ADD VEHICLE
          </button>
          <button className="btn btn-primary">
            <UserPlus size={16} /> ADD DRIVER
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className="tab">
          <Car size={16} /> VEHICLES
        </button>
        <button className="tab active">
          <Users size={16} /> DRIVERS
        </button>
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="filters">
            <div className="select-wrapper">
              <Filter size={14} className="select-icon" />
              <select>
                <option>All Statuses</option>
              </select>
            </div>
            <div className="select-wrapper">
              <select>
                <option>All Roles</option>
              </select>
            </div>
          </div>
          <div className="toolbar-stats">
            Showing 3 of 42 Drivers
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>DRIVER ID</th>
              <th>NAME</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>LICENSE EXPIRY</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id}>
                <td>
                  <div className="cell-id">
                    <User size={16} className="id-icon" /> {d.id}
                  </div>
                </td>
                <td>{d.name}</td>
                <td>{d.role}</td>
                <td>
                  <span className={`status-badge status-${d.status.toLowerCase().replace(' ', '-')}`}>
                    <span className="dot"></span> {d.status}
                  </span>
                </td>
                <td>
                  <div className={`expiry-cell expiry-${d.expiryStatus}`}>
                    {d.expiry}
                    {d.expiryStatus === 'expired' && (
                      <>
                        <AlertCircle size={14} />
                        <span className="badge-expired">EXPIRED</span>
                      </>
                    )}
                    {d.expiryStatus === 'expiring' && (
                      <>
                        <AlertTriangle size={14} />
                        <span className="badge-expiring">EXPIRING SOON</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button className="page-btn text-btn">&lt; PREV</button>
          <div className="page-numbers">
            <button className="page-num active">1</button>
            <button className="page-num">2</button>
            <button className="page-num">3</button>
          </div>
          <button className="page-btn text-btn">NEXT &gt;</button>
        </div>
      </div>
    </div>
  );
}
