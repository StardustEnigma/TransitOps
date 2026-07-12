import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  User, MapPin, Clock, AlertTriangle, PlusCircle, Maximize2,
  CheckCircle, XCircle, Loader2, AlertCircle, Truck, Package, Send
} from 'lucide-react';
import { tripsApi, vehiclesApi, driversApi } from '../services/api';
import './Dispatch.css';

// Fix for default Leaflet markers in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Dispatch() {
  const mapCenter = [21.1702, 72.8311];

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(null);
  const [actualDistance, setActualDistance] = useState('');

  // New trip form
  const [tripForm, setTripForm] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tripsData, vehicleData, driverData] = await Promise.all([
        tripsApi.getAll(),
        vehiclesApi.getAll(),
        driversApi.getAll()
      ]);
      setTrips(Array.isArray(tripsData) ? tripsData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setDrivers(Array.isArray(driverData) ? driverData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE' && !d.licenseExpired);
  const activeTrips = trips.filter(t => t.status === 'DISPATCHED');
  const draftTrips = trips.filter(t => t.status === 'DRAFT');

  const handleCreateAndDispatch = async (e) => {
    e.preventDefault();
    if (!tripForm.vehicleId || !tripForm.driverId || !tripForm.source || !tripForm.destination) return;

    setFormLoading(true);
    setFormError(null);
    try {
      // Step 1: Create draft trip
      const created = await tripsApi.create({
        vehicleId: parseInt(tripForm.vehicleId),
        driverId: parseInt(tripForm.driverId),
        source: tripForm.source,
        destination: tripForm.destination,
        cargoWeight: parseFloat(tripForm.cargoWeight) || 0,
        plannedDistance: parseFloat(tripForm.plannedDistance) || 0
      });

      // Step 2: Auto-dispatch
      await tripsApi.dispatch(created.id);

      // Reset form and refresh
      setTripForm({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDistance: '' });
      fetchData();
    } catch (err) {
      setFormError(err.fieldErrors ? Object.values(err.fieldErrors).join(', ') : err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDispatchDraft = async (id) => {
    setActionLoading(id);
    try {
      await tripsApi.dispatch(id);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id) => {
    setActionLoading(id);
    try {
      await tripsApi.complete(id, parseFloat(actualDistance) || undefined);
      setShowCompleteModal(null);
      setActualDistance('');
      fetchData();
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
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DISPATCHED': return 'normal';
      case 'DRAFT': return 'draft';
      default: return 'normal';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DISPATCHED': return 'IN TRANSIT';
      case 'DRAFT': return 'DRAFT';
      default: return status;
    }
  };

  return (
    <div className="dispatch-page">
      <div className="dispatch-header-bar">
        <h2>Dispatch Center <span className="header-subtitle">/ Live Fleet Operations</span></h2>
        <div className="dispatch-stats-row">
          <span className="dispatch-stat"><Truck size={14} /> {activeTrips.length} Active</span>
          <span className="dispatch-stat"><Clock size={14} /> {draftTrips.length} Pending</span>
          <span className="dispatch-stat"><CheckCircle size={14} /> {availableVehicles.length} Vehicles Ready</span>
        </div>
      </div>

      {error && (
        <div className="dispatch-error">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError(null)} className="dismiss-btn">×</button>
        </div>
      )}

      <div className="dispatch-content">
        <div className="dispatch-map-container">
          <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {/* Show a marker at center for each dispatched trip */}
            {activeTrips.map((trip, idx) => {
              // Spread markers along a line for visibility
              const lat = 19.0 + (idx * 1.2);
              const lng = 72.8 + (idx * 0.5);
              return (
                <Marker key={trip.id} position={[lat, lng]}>
                  <Popup>
                    <strong>TRP-{trip.id}</strong><br/>
                    {trip.source} → {trip.destination}<br/>
                    Driver: {trip.driverName || `#${trip.driverId}`}<br/>
                    Vehicle: {trip.vehicleRegistration || `#${trip.vehicleId}`}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className="dispatch-sidebar">
          {/* Active + Draft Trips List */}
          <div className="active-trips-list">
            <div className="trips-list-header">
              <span className="trips-list-title">Active & Pending Trips</span>
              <span className="trips-list-count">{activeTrips.length + draftTrips.length}</span>
            </div>

            {loading && (
              <div className="trips-loading">
                <Loader2 size={18} className="spin-icon" /> Loading trips...
              </div>
            )}

            {!loading && activeTrips.length === 0 && draftTrips.length === 0 && (
              <div className="trips-empty">No active or pending trips. Create one below.</div>
            )}

            {[...activeTrips, ...draftTrips].map((trip) => (
              <div className={`trip-card ${trip.status === 'DRAFT' ? 'trip-card-draft' : ''}`} key={trip.id}>
                <div className="trip-card-header">
                  <span className="trip-id">TRP-{trip.id}</span>
                  <span className={`trip-badge badge-${getStatusBadge(trip.status)}`}>
                    {getStatusLabel(trip.status)}
                  </span>
                </div>
                <div className="trip-route">{trip.source} → {trip.destination}</div>
                <div className="trip-card-footer">
                  <div className="trip-driver">
                    <User size={14} /> {trip.driverName || `Driver #${trip.driverId}`}
                  </div>
                  <div className="trip-vehicle">
                    <Truck size={14} /> {trip.vehicleRegistration || `Vehicle #${trip.vehicleId}`}
                  </div>
                </div>
                {trip.cargoWeight > 0 && (
                  <div className="trip-cargo">
                    <Package size={12} /> {trip.cargoWeight} kg cargo
                  </div>
                )}

                {/* Action buttons */}
                <div className="trip-card-actions">
                  {trip.status === 'DRAFT' && (
                    <button
                      className="trip-action-btn btn-dispatch"
                      onClick={() => handleDispatchDraft(trip.id)}
                      disabled={actionLoading === trip.id}
                    >
                      {actionLoading === trip.id ? <Loader2 size={13} className="spin-icon" /> : <Send size={13} />}
                      Dispatch
                    </button>
                  )}
                  {trip.status === 'DISPATCHED' && (
                    <button
                      className="trip-action-btn btn-complete"
                      onClick={() => { setShowCompleteModal(trip.id); setActualDistance(''); }}
                      disabled={actionLoading === trip.id}
                    >
                      <CheckCircle size={13} /> Complete
                    </button>
                  )}
                  {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
                    <button
                      className="trip-action-btn btn-cancel"
                      onClick={() => handleCancel(trip.id)}
                      disabled={actionLoading === trip.id}
                    >
                      {actionLoading === trip.id ? <Loader2 size={13} className="spin-icon" /> : <XCircle size={13} />}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* New Trip Creator */}
          <div className="new-trip-creator">
            <div className="creator-header">
              <PlusCircle size={18} className="text-blue" />
              <h3>New Trip — Create & Dispatch</h3>
            </div>

            {formError && (
              <div className="form-error-banner">
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <form onSubmit={handleCreateAndDispatch}>
              <div className="creator-section">
                <label>Route</label>
                <div className="input-with-icon">
                  <MapPin size={14} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Origin (e.g. Mumbai Warehouse)"
                    value={tripForm.source}
                    onChange={(e) => setTripForm({...tripForm, source: e.target.value})}
                    required
                  />
                </div>
                <div className="input-with-icon">
                  <MapPin size={14} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Destination (e.g. Ahmedabad Hub)"
                    value={tripForm.destination}
                    onChange={(e) => setTripForm({...tripForm, destination: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="creator-section">
                <label>Assign Assets</label>
                <select
                  value={tripForm.driverId}
                  onChange={(e) => setTripForm({...tripForm, driverId: e.target.value})}
                  required
                >
                  <option value="">Select driver...</option>
                  {availableDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.licenseCategory} (Score: {d.safetyScore})
                    </option>
                  ))}
                </select>
                {availableDrivers.length === 0 && !loading && (
                  <span className="form-hint-error">No available drivers</span>
                )}

                <select
                  value={tripForm.vehicleId}
                  onChange={(e) => setTripForm({...tripForm, vehicleId: e.target.value})}
                  required
                >
                  <option value="">Select vehicle...</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.modelName} (Max: {v.maxLoadCapacity}kg)
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && !loading && (
                  <span className="form-hint-error">No available vehicles</span>
                )}
              </div>

              <div className="creator-section">
                <label>Cargo & Distance</label>
                <div className="form-row-inline">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Cargo weight (kg)"
                    value={tripForm.cargoWeight}
                    onChange={(e) => setTripForm({...tripForm, cargoWeight: e.target.value})}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Planned distance (km)"
                    value={tripForm.plannedDistance}
                    onChange={(e) => setTripForm({...tripForm, plannedDistance: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="create-dispatch-btn" disabled={formLoading}>
                {formLoading ? (
                  <><Loader2 size={16} className="spin-icon" /> Creating...</>
                ) : (
                  <><Send size={16} /> Create & Dispatch</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complete Trip TRP-{showCompleteModal}</h3>
              <button className="btn-close-modal" onClick={() => setShowCompleteModal(null)}>×</button>
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
                  onClick={() => handleComplete(showCompleteModal)}
                  disabled={actionLoading === showCompleteModal}
                >
                  {actionLoading === showCompleteModal ? 'Completing...' : 'Mark Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
