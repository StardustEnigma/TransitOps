import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Wrench, CheckCircle2, Filter, ChevronLeft, ChevronRight, 
  Truck, Bus, Car, MoreVertical, X, Loader2, AlertCircle
} from 'lucide-react';
import { maintenanceApi, vehiclesApi } from '../services/api';
import './Maintenancelog.css';

export default function Maintenancelog() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [closingId, setClosingId] = useState(null);

  const [newRecord, setNewRecord] = useState({
    vehicleId: '',
    title: '',
    description: '',
    maintenanceDate: new Date().toISOString().split('T')[0],
    cost: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [maintenanceData, vehicleData] = await Promise.all([
        maintenanceApi.getAll(),
        vehiclesApi.getAll()
      ]);
      setRecords(Array.isArray(maintenanceData) ? maintenanceData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!newRecord.vehicleId || !newRecord.title) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await maintenanceApi.create({
        vehicleId: parseInt(newRecord.vehicleId),
        title: newRecord.title,
        description: newRecord.description,
        maintenanceDate: newRecord.maintenanceDate,
        cost: parseFloat(newRecord.cost) || 0
      });
      setShowModal(false);
      setNewRecord({ vehicleId: '', title: '', description: '', maintenanceDate: new Date().toISOString().split('T')[0], cost: '' });
      fetchData();
    } catch (err) {
      setFormError(err.fieldErrors ? Object.values(err.fieldErrors).join(', ') : err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleClose = async (id) => {
    setClosingId(id);
    try {
      await maintenanceApi.close(id);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setClosingId(null);
    }
  };

  // Map API status to display status
  const getDisplayStatus = (record) => {
    if (record.status === 'CLOSED' || record.closedAt) return 'Completed';
    return 'In Shop';
  };

  const getVehicleIcon = (regNumber) => {
    const reg = (regNumber || '').toUpperCase();
    if (reg.startsWith('BUS')) return <Bus size={18} className="vehicle-icon-svg" />;
    if (reg.startsWith('VAN')) return <Car size={18} className="vehicle-icon-svg" />;
    return <Truck size={18} className="vehicle-icon-svg" />;
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

  // Compute display records from API data
  const displayRecords = records.map(r => {
    const vehicle = vehicles.find(v => v.id === r.vehicleId);
    const displayStatus = getDisplayStatus(r);
    return {
      ...r,
      vehicleRegNumber: vehicle?.registrationNumber || `Vehicle #${r.vehicleId}`,
      vehicleType: vehicle?.type || 'Unknown',
      displayStatus,
      displayDate: r.maintenanceDate ? new Date(r.maintenanceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
      displayCost: r.cost != null ? `$${r.cost.toFixed(2)}` : '--'
    };
  });

  const filteredRecords = statusFilter === 'All' 
    ? displayRecords 
    : displayRecords.filter(r => r.displayStatus === statusFilter);

  const inShopCount = displayRecords.filter(r => r.displayStatus === 'In Shop').length;
  const completedCount = displayRecords.filter(r => r.displayStatus === 'Completed').length;
  const totalCount = displayRecords.length;

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
            onClick={() => { setShowModal(true); setFormError(null); }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Log Maintenance
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* 3 Summary Stat Cards */}
        <div className="stats-cards-grid">
          <div className="stat-card" id="stat-card-total">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <Calendar size={20} className="stat-icon" />
              </div>
              <span className="stat-label">Total Records</span>
            </div>
            <div className="stat-value">{loading ? '...' : totalCount}</div>
          </div>

          <div className="stat-card" id="stat-card-inshop">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <Wrench size={20} className="stat-icon" />
              </div>
              <span className="stat-label">In Shop</span>
            </div>
            <div className="stat-value">{loading ? '...' : inShopCount}</div>
          </div>

          <div className="stat-card" id="stat-card-completed">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <CheckCircle2 size={20} className="stat-icon" />
              </div>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-value">{loading ? '...' : completedCount}</div>
          </div>
        </div>

        {/* Recent Records Card */}
        <div className="records-card" id="recent-records-section">
          <div className="records-card-header">
            <h2 className="records-title">Maintenance Records</h2>
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
                  {['All', 'In Shop', 'Completed'].map(status => (
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
                  <th>VEHICLE</th>
                  <th>TITLE</th>
                  <th>DATE</th>
                  <th>COST</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280' }}>
                      <Loader2 size={20} className="spin-icon" style={{ display: 'inline-block', marginRight: 8 }} />
                      Loading records...
                    </td>
                  </tr>
                )}
                {!loading && filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      {statusFilter !== 'All' 
                        ? <>No records with status: <strong>{statusFilter}</strong></>
                        : 'No maintenance records yet. Click "Log Maintenance" to create one.'
                      }
                    </td>
                  </tr>
                )}
                {!loading && filteredRecords.map((rec) => (
                  <tr key={rec.id} className="table-row">
                    <td>
                      <div className="vehicle-id-cell">
                        <div className="vehicle-icon-box">
                          {getVehicleIcon(rec.vehicleRegNumber)}
                        </div>
                        <span className="vehicle-id-text">{rec.vehicleRegNumber}</span>
                      </div>
                    </td>
                    <td className="service-type-cell">{rec.title}</td>
                    <td className="date-cell">{rec.displayDate}</td>
                    <td className="cost-cell">{rec.displayCost}</td>
                    <td>{getStatusBadge(rec.displayStatus)}</td>
                    <td className="actions-cell text-right">
                      {rec.displayStatus === 'In Shop' && (
                        <button 
                          className="btn-row-action" 
                          title="Close / Mark Complete"
                          onClick={() => handleClose(rec.id)}
                          disabled={closingId === rec.id}
                          style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                        >
                          {closingId === rec.id ? '...' : 'Close'}
                        </button>
                      )}
                      {rec.displayStatus !== 'In Shop' && (
                        <button className="btn-row-action" title="More Actions">
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="records-card-footer">
            <div className="pagination-info">
              Showing {filteredRecords.length} of {displayRecords.length} records
            </div>
            <div className="pagination-arrows">
              <button className="btn-pagination" disabled aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              <button className="btn-pagination" disabled aria-label="Next page">
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

      {/* Log Maintenance Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Log New Maintenance</h3>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            {formError && (
              <div style={{ padding: '8px 24px', color: '#DC2626', fontSize: 13 }}>{formError}</div>
            )}
            <form onSubmit={handleAddRecord} className="modal-form">
              <div className="form-group">
                <label>Vehicle</label>
                <select 
                  value={newRecord.vehicleId}
                  onChange={(e) => setNewRecord({...newRecord, vehicleId: e.target.value})}
                  required
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.modelName} ({v.status})
                    </option>
                  ))}
                </select>
                {vehicles.length === 0 && !loading && (
                  <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>
                    No vehicles registered. Add a vehicle first in the Directory.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Engine Tune-up" 
                  value={newRecord.title}
                  onChange={(e) => setNewRecord({...newRecord, title: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Routine checkup and oil change" 
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={newRecord.maintenanceDate}
                    onChange={(e) => setNewRecord({...newRecord, maintenanceDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cost ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="250.00" 
                    value={newRecord.cost}
                    onChange={(e) => setNewRecord({...newRecord, cost: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
