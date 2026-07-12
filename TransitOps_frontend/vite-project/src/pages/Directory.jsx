import React, { useState, useEffect } from 'react';
import { Car, UserPlus, Users, Filter, User, AlertCircle, AlertTriangle, Loader2, X, Edit2, Trash2 } from 'lucide-react';
import { vehiclesApi, driversApi } from '../services/api';
import './Directory.css';

export default function Directory() {
  const [activeTab, setActiveTab] = useState('drivers'); // 'vehicles' or 'drivers'
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Add/Edit modals
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Edit mode
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [editingDriverId, setEditingDriverId] = useState(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'vehicle'|'driver', id, name }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Vehicle form
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '', modelName: '', type: 'Cargo Van',
    maxLoadCapacity: '', odometer: '', acquisitionCost: ''
  });

  // Driver form
  const [driverForm, setDriverForm] = useState({
    name: '', email: '', licenseNumber: '', licenseCategory: 'Class A',
    licenseExpiry: '', contactNumber: '', safetyScore: 90
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'drivers') {
        const data = await driversApi.getAll(statusFilter || undefined);
        setDrivers(Array.isArray(data) ? data : []);
      } else {
        const data = await vehiclesApi.getAll(statusFilter || undefined);
        setVehicles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ——— Vehicle CRUD ———
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const payload = {
        ...vehicleForm,
        maxLoadCapacity: parseFloat(vehicleForm.maxLoadCapacity) || 0,
        odometer: parseFloat(vehicleForm.odometer) || 0,
        acquisitionCost: parseFloat(vehicleForm.acquisitionCost) || 0
      };

      if (editingVehicleId) {
        await vehiclesApi.update(editingVehicleId, payload);
      } else {
        await vehiclesApi.create(payload);
      }

      setShowAddVehicle(false);
      setEditingVehicleId(null);
      setVehicleForm({ registrationNumber: '', modelName: '', type: 'Cargo Van', maxLoadCapacity: '', odometer: '', acquisitionCost: '' });
      fetchData();
    } catch (err) {
      setFormError(err.fieldErrors ? Object.values(err.fieldErrors).join(', ') : err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditVehicle = (v) => {
    setVehicleForm({
      registrationNumber: v.registrationNumber || '',
      modelName: v.modelName || '',
      type: v.type || 'Cargo Van',
      maxLoadCapacity: v.maxLoadCapacity ?? '',
      odometer: v.odometer ?? '',
      acquisitionCost: v.acquisitionCost ?? ''
    });
    setEditingVehicleId(v.id);
    setShowAddVehicle(true);
    setFormError(null);
  };

  // ——— Driver CRUD ———
  const handleAddDriver = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const payload = {
        ...driverForm,
        safetyScore: parseInt(driverForm.safetyScore) || 90
      };

      if (editingDriverId) {
        await driversApi.update(editingDriverId, payload);
      } else {
        await driversApi.create(payload);
      }

      setShowAddDriver(false);
      setEditingDriverId(null);
      setDriverForm({ name: '', email: '', licenseNumber: '', licenseCategory: 'Class A', licenseExpiry: '', contactNumber: '', safetyScore: 90 });
      fetchData();
    } catch (err) {
      setFormError(err.fieldErrors ? Object.values(err.fieldErrors).join(', ') : err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDriver = (d) => {
    setDriverForm({
      name: d.name || '',
      email: d.email || '',
      licenseNumber: d.licenseNumber || '',
      licenseCategory: d.licenseCategory || 'Class A',
      licenseExpiry: d.licenseExpiry || '',
      contactNumber: d.contactNumber || '',
      safetyScore: d.safetyScore ?? 90
    });
    setEditingDriverId(d.id);
    setShowAddDriver(true);
    setFormError(null);
  };

  // ——— Delete ———
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      if (deleteConfirm.type === 'vehicle') {
        await vehiclesApi.delete(deleteConfirm.id);
      } else {
        await driversApi.delete(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      setError(err.message);
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getExpiryStatus = (dateStr, isExpired) => {
    if (isExpired) return 'expired';
    if (!dateStr) return 'ok';
    const expiry = new Date(dateStr);
    const now = new Date();
    const diff = (expiry - now) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'expired';
    if (diff < 90) return 'expiring';
    return 'ok';
  };

  const driverStatuses = ['', 'AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];
  const vehicleStatuses = ['', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

  return (
    <div className="directory-page">
      <div className="page-header">
        <div>
          <h1>Directory</h1>
          <p>Manage your fleet vehicles and assigned personnel.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => { setShowAddVehicle(true); setEditingVehicleId(null); setVehicleForm({ registrationNumber: '', modelName: '', type: 'Cargo Van', maxLoadCapacity: '', odometer: '', acquisitionCost: '' }); setFormError(null); }}>
            <Car size={16} /> ADD VEHICLE
          </button>
          <button className="btn btn-primary" onClick={() => { setShowAddDriver(true); setEditingDriverId(null); setDriverForm({ name: '', email: '', licenseNumber: '', licenseCategory: 'Class A', licenseExpiry: '', contactNumber: '', safetyScore: 90 }); setFormError(null); }}>
            <UserPlus size={16} /> ADD DRIVER
          </button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => { setActiveTab('vehicles'); setStatusFilter(''); }}
        >
          <Car size={16} /> VEHICLES
        </button>
        <button 
          className={`tab ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('drivers'); setStatusFilter(''); }}
        >
          <Users size={16} /> DRIVERS
        </button>
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="filters">
            <div className="select-wrapper">
              <Filter size={14} className="select-icon" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {(activeTab === 'drivers' ? driverStatuses : vehicleStatuses).filter(Boolean).map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="toolbar-stats">
            {loading ? 'Loading...' : (
              activeTab === 'drivers' 
                ? `Showing ${drivers.length} Driver${drivers.length !== 1 ? 's' : ''}`
                : `Showing ${vehicles.length} Vehicle${vehicles.length !== 1 ? 's' : ''}`
            )}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, margin: '0 0 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {activeTab === 'drivers' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME / EMAIL</th>
                <th>LICENSE</th>
                <th>CONTACT</th>
                <th>SAFETY SCORE</th>
                <th>STATUS</th>
                <th>LICENSE EXPIRY</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {!loading && drivers.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280', fontSize: 13 }}>
                    No drivers found. Click "ADD DRIVER" to register one.
                  </td>
                </tr>
              )}
              {drivers.map(d => {
                const expiryStatus = getExpiryStatus(d.licenseExpiry, d.licenseExpired);
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="cell-id">
                        <User size={16} className="id-icon" /> DVR-{String(d.id).padStart(2, '0')}
                      </div>
                    </td>
                    <td>
                      <div>{d.name}</div>
                      <div className="cell-muted" style={{ fontSize: '11px' }}>{d.email || '--'}</div>
                    </td>
                    <td>{d.licenseCategory} ({d.licenseNumber})</td>
                    <td className="cell-muted">{d.contactNumber || '--'}</td>
                    <td>
                      <div className="safety-score-cell">
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${d.safetyScore || 0}%` }}></div>
                        </div>
                        <span className="score-value">{d.safetyScore ?? '--'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${d.status?.toLowerCase().replace('_', '-')}`}>
                        <span className="dot"></span> {d.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className={`expiry-cell expiry-${expiryStatus}`}>
                        {d.licenseExpiry || '--'}
                        {expiryStatus === 'expired' && (
                          <>
                            <AlertCircle size={14} />
                            <span className="badge-expired">EXPIRED</span>
                          </>
                        )}
                        {expiryStatus === 'expiring' && (
                          <>
                            <AlertTriangle size={14} />
                            <span className="badge-expiring">EXPIRING SOON</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        <button className="row-action-btn" title="Edit Driver" onClick={() => openEditDriver(d)}>
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="row-action-btn row-action-delete"
                          title="Delete Driver"
                          onClick={() => setDeleteConfirm({ type: 'driver', id: d.id, name: d.name })}
                          disabled={d.status === 'ON_TRIP'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>REG #</th>
                <th>MODEL</th>
                <th>TYPE</th>
                <th>MAX LOAD (kg)</th>
                <th>STATUS</th>
                <th>ODOMETER</th>
                <th>COST ($)</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {!loading && vehicles.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280', fontSize: 13 }}>
                    No vehicles found. Click "ADD VEHICLE" to register one.
                  </td>
                </tr>
              )}
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td>
                    <div className="cell-id">
                      <Car size={16} className="id-icon" /> {v.registrationNumber}
                    </div>
                  </td>
                  <td>{v.modelName}</td>
                  <td>{v.type}</td>
                  <td>{v.maxLoadCapacity != null ? v.maxLoadCapacity.toLocaleString() : '--'}</td>
                  <td>
                    <span className={`status-badge status-${v.status?.toLowerCase().replace('_', '-')}`}>
                      <span className="dot"></span> {v.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{v.odometer != null ? `${v.odometer.toLocaleString()} km` : '--'}</td>
                  <td>{v.acquisitionCost != null ? `$${v.acquisitionCost.toLocaleString()}` : '--'}</td>
                  <td className="text-right">
                    <div className="row-actions">
                      <button className="row-action-btn" title="Edit Vehicle" onClick={() => openEditVehicle(v)}>
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="row-action-btn row-action-delete"
                        title="Delete Vehicle"
                        onClick={() => setDeleteConfirm({ type: 'vehicle', id: v.id, name: v.registrationNumber })}
                        disabled={v.status === 'ON_TRIP'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Vehicle Modal */}
      {showAddVehicle && (
        <div className="modal-overlay" onClick={() => { setShowAddVehicle(false); setEditingVehicleId(null); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button className="btn-close-modal" onClick={() => { setShowAddVehicle(false); setEditingVehicleId(null); }}><X size={20} /></button>
            </div>
            {formError && <div style={{ padding: '8px 24px', color: '#DC2626', fontSize: 13 }}>{formError}</div>}
            <form onSubmit={handleAddVehicle} className="modal-form">
              <div className="form-group">
                <label>Registration Number</label>
                <input type="text" placeholder="e.g. VAN-005" value={vehicleForm.registrationNumber} onChange={e => setVehicleForm({...vehicleForm, registrationNumber: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Model Name</label>
                <input type="text" placeholder="e.g. Ford Transit 2024" value={vehicleForm.modelName} onChange={e => setVehicleForm({...vehicleForm, modelName: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <input type="text" placeholder="e.g. Cargo Van" value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Max Load (kg)</label>
                  <input type="number" step="0.01" placeholder="1500" value={vehicleForm.maxLoadCapacity} onChange={e => setVehicleForm({...vehicleForm, maxLoadCapacity: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Odometer (km)</label>
                  <input type="number" step="0.01" placeholder="12000" value={vehicleForm.odometer} onChange={e => setVehicleForm({...vehicleForm, odometer: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Acquisition Cost ($)</label>
                  <input type="number" step="0.01" placeholder="45000" value={vehicleForm.acquisitionCost} onChange={e => setVehicleForm({...vehicleForm, acquisitionCost: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => { setShowAddVehicle(false); setEditingVehicleId(null); }}>Cancel</button>
                <button type="submit" className="btn-modal-submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (editingVehicleId ? 'Update Vehicle' : 'Save Vehicle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Driver Modal */}
      {showAddDriver && (
        <div className="modal-overlay" onClick={() => { setShowAddDriver(false); setEditingDriverId(null); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDriverId ? 'Edit Driver' : 'Add Driver'}</h3>
              <button className="btn-close-modal" onClick={() => { setShowAddDriver(false); setEditingDriverId(null); }}><X size={20} /></button>
            </div>
            {formError && <div style={{ padding: '8px 24px', color: '#DC2626', fontSize: 13 }}>{formError}</div>}
            <form onSubmit={handleAddDriver} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="e.g. John Doe" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="e.g. john@transitops.com" value={driverForm.email} onChange={e => setDriverForm({...driverForm, email: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>License Number</label>
                  <input type="text" placeholder="DL-99887766" value={driverForm.licenseNumber} onChange={e => setDriverForm({...driverForm, licenseNumber: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>License Category</label>
                  <select value={driverForm.licenseCategory} onChange={e => setDriverForm({...driverForm, licenseCategory: e.target.value})}>
                    <option>Class A</option>
                    <option>Class B</option>
                    <option>Class C</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>License Expiry</label>
                  <input type="date" value={driverForm.licenseExpiry} onChange={e => setDriverForm({...driverForm, licenseExpiry: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Contact Number (e.g. +1234567890)</label>
                  <input type="tel" pattern="^\+?[0-9]{10,15}$" placeholder="+1555019900" value={driverForm.contactNumber} onChange={e => setDriverForm({...driverForm, contactNumber: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Safety Score (0-100)</label>
                <input type="number" min="0" max="100" value={driverForm.safetyScore} onChange={e => setDriverForm({...driverForm, safetyScore: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => { setShowAddDriver(false); setEditingDriverId(null); }}>Cancel</button>
                <button type="submit" className="btn-modal-submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (editingDriverId ? 'Update Driver' : 'Save Driver')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card modal-card-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="btn-close-modal" onClick={() => setDeleteConfirm(null)}><X size={20} /></button>
            </div>
            <div className="modal-form">
              <p className="delete-warning">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button
                  className="btn-modal-submit btn-delete-confirm"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
