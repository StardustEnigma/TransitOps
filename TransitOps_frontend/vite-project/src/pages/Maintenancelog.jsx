import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Wrench, 
  CheckCircle2, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  Bus, 
  Car, 
  MoreVertical,
  X
} from 'lucide-react';
import './Maintenancelog.css';

export default function Maintenancelog() {
  const [records, setRecords] = useState([
    {
      id: 1,
      vehicleId: 'TRK-8042',
      type: 'Truck',
      serviceType: 'Engine Repair',
      date: 'Oct 24, 2023',
      cost: 'Est. $1,250',
      status: 'In Shop'
    },
    {
      id: 2,
      vehicleId: 'BUS-1109',
      type: 'Bus',
      serviceType: 'Routine Inspection',
      date: 'Oct 26, 2023',
      cost: '--',
      status: 'Scheduled'
    },
    {
      id: 3,
      vehicleId: 'VAN-302',
      type: 'Van',
      serviceType: 'Oil Change & Tires',
      date: 'Oct 20, 2023',
      cost: '$450.00',
      status: 'Completed'
    },
    {
      id: 4,
      vehicleId: 'TRK-8021',
      type: 'Truck',
      serviceType: 'Brake Replacement',
      date: 'Oct 18, 2023',
      cost: '$820.50',
      status: 'Completed'
    }
  ]);

  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    vehicleId: '',
    type: 'Truck',
    serviceType: '',
    date: 'Oct 28, 2023',
    cost: '',
    status: 'Scheduled'
  });

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bus':
        return <Bus size={18} className="vehicle-icon-svg" />;
      case 'van':
        return <Car size={18} className="vehicle-icon-svg" />;
      default:
        return <Truck size={18} className="vehicle-icon-svg" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Shop':
        return (
          <span className="status-badge status-inshop">
            <Wrench size={13} strokeWidth={2.5} />
            In Shop
          </span>
        );
      case 'Scheduled':
        return (
          <span className="status-badge status-scheduled">
            <Calendar size={13} strokeWidth={2.5} />
            Scheduled
          </span>
        );
      case 'Completed':
        return (
          <span className="status-badge status-completed">
            <CheckCircle2 size={13} strokeWidth={2.5} />
            Completed
          </span>
        );
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!newRecord.vehicleId || !newRecord.serviceType) return;

    const recordToAdd = {
      id: Date.now(),
      vehicleId: newRecord.vehicleId.toUpperCase(),
      type: newRecord.type,
      serviceType: newRecord.serviceType,
      date: newRecord.date || 'Today',
      cost: newRecord.cost ? (newRecord.cost.startsWith('$') || newRecord.cost.startsWith('Est') ? newRecord.cost : `$${newRecord.cost}`) : '--',
      status: newRecord.status
    };

    setRecords([recordToAdd, ...records]);
    setShowModal(false);
    setNewRecord({
      vehicleId: '',
      type: 'Truck',
      serviceType: '',
      date: 'Oct 28, 2023',
      cost: '',
      status: 'Scheduled'
    });
  };

  const filteredRecords = statusFilter === 'All' 
    ? records 
    : records.filter(r => r.status === statusFilter);

  const scheduledCount = records.filter(r => r.status === 'Scheduled').length + 11;
  const inShopCount = records.filter(r => r.status === 'In Shop').length + 3;
  const completedCount = records.filter(r => r.status === 'Completed').length + 26;

  return (
    <>
      <div className="maintenance-page">
        {/* Top Title & Actions Bar */}
        <div className="page-header-bar">
          <div className="page-title-group">
            <h1 className="page-title">Maintenance Management</h1>
            <p className="page-subtitle">Track and manage vehicle service records across the fleet.</p>
          </div>
          <button 
            className="btn-log-maintenance" 
            id="open-log-modal-btn"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} strokeWidth={2.5} />
            Log Maintenance
          </button>
        </div>

        {/* 3 Summary Stat Cards */}
        <div className="stats-cards-grid">
          <div className="stat-card" id="stat-card-scheduled">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <Calendar size={20} className="stat-icon" />
              </div>
              <span className="stat-label">Scheduled</span>
            </div>
            <div className="stat-value">{scheduledCount}</div>
          </div>

          <div className="stat-card" id="stat-card-inshop">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <Wrench size={20} className="stat-icon" />
              </div>
              <span className="stat-label">In Shop</span>
            </div>
            <div className="stat-value">{inShopCount}</div>
          </div>

          <div className="stat-card" id="stat-card-completed">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <CheckCircle2 size={20} className="stat-icon" />
              </div>
              <span className="stat-label">Completed (30d)</span>
            </div>
            <div className="stat-value">{completedCount}</div>
          </div>
        </div>

        {/* Recent Records Card */}
        <div className="records-card" id="recent-records-section">
          <div className="records-card-header">
            <h2 className="records-title">Recent Records</h2>
            <div className="filter-wrapper">
              <button 
                className={`btn-filter-icon ${statusFilter !== 'All' ? 'active-filter' : ''}`}
                id="filter-records-btn"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                title="Filter by status"
              >
                <Filter size={18} strokeWidth={2} />
              </button>

              {showFilterMenu && (
                <div className="filter-dropdown">
                  <div className="filter-dropdown-title">Filter Status</div>
                  {['All', 'In Shop', 'Scheduled', 'Completed'].map(status => (
                    <button
                      key={status}
                      className={`filter-option ${statusFilter === status ? 'selected' : ''}`}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilterMenu(false);
                      }}
                    >
                      {status === 'All' ? 'All Statuses' : status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="table-responsive">
            <table className="records-table">
              <thead>
                <tr>
                  <th>VEHICLE ID</th>
                  <th>SERVICE TYPE</th>
                  <th>DATE</th>
                  <th>COST</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="table-row">
                    <td>
                      <div className="vehicle-id-cell">
                        <div className="vehicle-icon-box">
                          {getVehicleIcon(rec.type)}
                        </div>
                        <span className="vehicle-id-text">{rec.vehicleId}</span>
                      </div>
                    </td>
                    <td className="service-type-cell">{rec.serviceType}</td>
                    <td className="date-cell">{rec.date}</td>
                    <td className="cost-cell">{rec.cost}</td>
                    <td>{getStatusBadge(rec.status)}</td>
                    <td className="actions-cell text-right">
                      <button className="btn-row-action" title="More Actions">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No maintenance records found for status: <strong>{statusFilter}</strong>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="records-card-footer">
            <div className="pagination-info">
              Showing {filteredRecords.length} of 42 records
            </div>
            <div className="pagination-arrows">
              <button className="btn-pagination" disabled aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              <button className="btn-pagination" aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* System Version Footer */}
        <div className="page-bottom-copyright">
          TransitOps Fleet Management System v2.4.1
        </div>
      </div>

      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Log New Maintenance</h3>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRecord} className="modal-form">
              <div className="form-group">
                <label>Vehicle ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. TRK-9104" 
                  value={newRecord.vehicleId}
                  onChange={(e) => setNewRecord({...newRecord, vehicleId: e.target.value})}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select 
                    value={newRecord.type}
                    onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                  >
                    <option value="Truck">Truck</option>
                    <option value="Bus">Bus</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={newRecord.status}
                    onChange={(e) => setNewRecord({...newRecord, status: e.target.value})}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Service Type</label>
                <input 
                  type="text" 
                  placeholder="e.g. Transmission Check, Oil Change" 
                  value={newRecord.serviceType}
                  onChange={(e) => setNewRecord({...newRecord, serviceType: e.target.value})}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="text" 
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Cost</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Est. $650" 
                    value={newRecord.cost}
                    onChange={(e) => setNewRecord({...newRecord, cost: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
