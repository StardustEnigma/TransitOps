import React, { useState, useEffect } from 'react';
import {
  History, Filter, Loader2, AlertCircle, CheckCircle, XCircle, Send,
  Truck, User, Package, MapPin, Clock, ChevronLeft, ChevronRight,
  Fuel, Plus, X
} from 'lucide-react';
import { tripsApi, fuelApi, expensesApi } from '../services/api';
import './TripLogs.css';

export default function TripLogs() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  // Complete trip modal
  const [showCompleteModal, setShowCompleteModal] = useState(null);
  const [actualDistance, setActualDistance] = useState('');

  // Fuel/Expense logging modal
  const [showExpenseModal, setShowExpenseModal] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    type: 'FUEL',
    liters: '',
    cost: '',
    odometer: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tripsApi.getAll();
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = statusFilter === 'ALL'
    ? trips
    : trips.filter(t => t.status === statusFilter);

  const statusCounts = {
    ALL: trips.length,
    DRAFT: trips.filter(t => t.status === 'DRAFT').length,
    DISPATCHED: trips.filter(t => t.status === 'DISPATCHED').length,
    COMPLETED: trips.filter(t => t.status === 'COMPLETED').length,
    CANCELLED: trips.filter(t => t.status === 'CANCELLED').length
  };

  const handleDispatch = async (id) => {
    setActionLoading(id);
    try {
      await tripsApi.dispatch(id);
      fetchTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!showCompleteModal) return;
    setActionLoading(showCompleteModal);
    try {
      await tripsApi.complete(showCompleteModal, parseFloat(actualDistance) || undefined);
      setShowCompleteModal(null);
      setActualDistance('');
      fetchTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    setActionLoading(id);
    try {
      await tripsApi.cancel(id);
      fetchTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!showExpenseModal) return;
    setExpenseLoading(true);
    setExpenseError(null);

    const trip = trips.find(t => t.id === showExpenseModal);
    if (!trip) return;

    try {
      if (expenseForm.type === 'FUEL') {
        await fuelApi.create({
          vehicleId: trip.vehicleId,
          tripId: trip.id,
          liters: parseFloat(expenseForm.liters) || 0,
          cost: parseFloat(expenseForm.cost) || 0,
          odometer: parseFloat(expenseForm.odometer) || 0,
          fuelDate: expenseForm.date
        });
      } else {
        await expensesApi.create({
          vehicleId: trip.vehicleId,
          expenseType: expenseForm.type,
          amount: parseFloat(expenseForm.amount) || 0,
          description: expenseForm.description,
          expenseDate: expenseForm.date
        });
      }
      setShowExpenseModal(null);
      setExpenseForm({ type: 'FUEL', liters: '', cost: '', odometer: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      setExpenseError(err.fieldErrors ? Object.values(err.fieldErrors).join(', ') : err.message);
    } finally {
      setExpenseLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="tl-badge tl-badge-draft"><Clock size={12} /> Draft</span>;
      case 'DISPATCHED':
        return <span className="tl-badge tl-badge-dispatched"><Send size={12} /> In Transit</span>;
      case 'COMPLETED':
        return <span className="tl-badge tl-badge-completed"><CheckCircle size={12} /> Completed</span>;
      case 'CANCELLED':
        return <span className="tl-badge tl-badge-cancelled"><XCircle size={12} /> Cancelled</span>;
      default:
        return <span className="tl-badge">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="triplogs-page">
      <div className="tl-header">
        <div>
          <h1>Trip Logs</h1>
          <p>Complete history of all fleet trips and their lifecycle status.</p>
        </div>
      </div>

      {error && (
        <div className="tl-error">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError(null)} className="tl-dismiss">×</button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="tl-filter-tabs">
        {['ALL', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'].map(status => (
          <button
            key={status}
            className={`tl-filter-tab ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'ALL' ? 'All Trips' : status === 'DISPATCHED' ? 'In Transit' : status.charAt(0) + status.slice(1).toLowerCase()}
            <span className="tl-tab-count">{statusCounts[status]}</span>
          </button>
        ))}
      </div>

      {/* Trips Table */}
      <div className="tl-table-card">
        <table className="tl-table">
          <thead>
            <tr>
              <th>TRIP ID</th>
              <th>DRIVER</th>
              <th>VEHICLE</th>
              <th>ROUTE</th>
              <th>CARGO (kg)</th>
              <th>DISTANCE (km)</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="9" className="tl-loading-cell">
                  <Loader2 size={20} className="spin-icon" /> Loading trip history...
                </td>
              </tr>
            )}
            {!loading && filteredTrips.length === 0 && (
              <tr>
                <td colSpan="9" className="tl-empty-cell">
                  {statusFilter !== 'ALL'
                    ? <>No trips with status: <strong>{statusFilter}</strong></>
                    : 'No trips recorded yet. Go to Dispatch to create your first trip.'
                  }
                </td>
              </tr>
            )}
            {!loading && filteredTrips.map(trip => (
              <tr key={trip.id} className="tl-row">
                <td>
                  <span className="tl-trip-id">TRP-{trip.id}</span>
                </td>
                <td>
                  <div className="tl-driver-cell">
                    <div className="tl-avatar">
                      {(trip.driverName || 'D').charAt(0).toUpperCase()}
                    </div>
                    <span>{trip.driverName || `Driver #${trip.driverId}`}</span>
                  </div>
                </td>
                <td>
                  <div className="tl-vehicle-cell">
                    <Truck size={14} />
                    <span>{trip.vehicleRegistration || `#${trip.vehicleId}`}</span>
                  </div>
                </td>
                <td className="tl-route-cell">
                  {trip.source} → {trip.destination}
                </td>
                <td>{trip.cargoWeight ?? '--'}</td>
                <td>
                  {trip.actualDistance != null
                    ? <span>{trip.actualDistance} <span className="tl-muted">/ {trip.plannedDistance || '--'}</span></span>
                    : trip.plannedDistance || '--'
                  }
                </td>
                <td>{getStatusBadge(trip.status)}</td>
                <td className="tl-date-cell">{formatDate(trip.createdAt)}</td>
                <td className="text-right">
                  <div className="tl-actions">
                    {trip.status === 'DRAFT' && (
                      <button
                        className="tl-action-btn tl-btn-dispatch"
                        onClick={() => handleDispatch(trip.id)}
                        disabled={actionLoading === trip.id}
                        title="Dispatch this trip"
                      >
                        {actionLoading === trip.id ? <Loader2 size={13} className="spin-icon" /> : <Send size={13} />}
                      </button>
                    )}
                    {trip.status === 'DISPATCHED' && (
                      <button
                        className="tl-action-btn tl-btn-complete"
                        onClick={() => { setShowCompleteModal(trip.id); setActualDistance(''); }}
                        disabled={actionLoading === trip.id}
                        title="Complete trip"
                      >
                        <CheckCircle size={13} />
                      </button>
                    )}
                    {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
                      <button
                        className="tl-action-btn tl-btn-cancel"
                        onClick={() => handleCancel(trip.id)}
                        disabled={actionLoading === trip.id}
                        title="Cancel trip"
                      >
                        {actionLoading === trip.id ? <Loader2 size={13} className="spin-icon" /> : <XCircle size={13} />}
                      </button>
                    )}
                    {trip.status === 'COMPLETED' && (
                      <button
                        className="tl-action-btn tl-btn-expense"
                        onClick={() => { setShowExpenseModal(trip.id); setExpenseError(null); }}
                        title="Log fuel/expense"
                      >
                        <Plus size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="tl-table-footer">
          <span className="tl-footer-info">
            Showing {filteredTrips.length} of {trips.length} trips
          </span>
        </div>
      </div>

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complete Trip TRP-{showCompleteModal}</h3>
              <button className="btn-close-modal" onClick={() => setShowCompleteModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Actual Distance Traveled (km)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 122.5"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button className="btn-modal-cancel" onClick={() => setShowCompleteModal(null)}>Cancel</button>
                <button
                  className="btn-modal-submit"
                  onClick={handleComplete}
                  disabled={actionLoading === showCompleteModal}
                >
                  {actionLoading === showCompleteModal ? 'Completing...' : 'Mark Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Fuel/Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Expense — Trip TRP-{showExpenseModal}</h3>
              <button className="btn-close-modal" onClick={() => setShowExpenseModal(null)}><X size={20} /></button>
            </div>
            {expenseError && (
              <div style={{ padding: '8px 24px', color: '#DC2626', fontSize: 13 }}>{expenseError}</div>
            )}
            <form onSubmit={handleLogExpense} className="modal-form">
              <div className="form-group">
                <label>Expense Type</label>
                <select
                  value={expenseForm.type}
                  onChange={(e) => setExpenseForm({...expenseForm, type: e.target.value})}
                >
                  <option value="FUEL">Fuel</option>
                  <option value="TOLL">Toll</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="PARKING">Parking</option>
                  <option value="REPAIR">Repair</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {expenseForm.type === 'FUEL' ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Liters</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="45.5"
                        value={expenseForm.liters}
                        onChange={(e) => setExpenseForm({...expenseForm, liters: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="68.25"
                        value={expenseForm.cost}
                        onChange={(e) => setExpenseForm({...expenseForm, cost: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Odometer Reading (km)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="12500"
                      value={expenseForm.odometer}
                      onChange={(e) => setExpenseForm({...expenseForm, odometer: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="15.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Highway toll charge"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowExpenseModal(null)}>Cancel</button>
                <button type="submit" className="btn-modal-submit" disabled={expenseLoading}>
                  {expenseLoading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
