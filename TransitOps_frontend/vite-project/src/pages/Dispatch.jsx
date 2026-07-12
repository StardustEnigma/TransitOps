import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  User, MapPin, Clock, AlertTriangle, PlusCircle, Maximize2,
  CheckCircle, XCircle, Loader2, AlertCircle, Truck, Package, Send
} from 'lucide-react';
import { tripsApi, vehiclesApi, driversApi, expensesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
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

const truckIcon = new L.DivIcon({
  className: 'truck-marker-icon',
  html: '<div style="background:#1A1A1B; color:white; border-radius:50%; padding:4px; display:flex; align-items:center; justify-content:center; width:28px; height:28px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="13" x="2" y="5" rx="2" ry="2"/><path d="M18 10h4l-2.4 4.5A2 2 0 0 1 17.8 16H18"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const CityAutocomplete = ({ value, onChange, placeholder }) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3 || query === value) {
      setResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=IN&featuretype=city`);
        const data = await res.json();
        setResults(data.slice(0, 5));
      } catch (err) {}
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query, value]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        required
      />
      {showDropdown && results.length > 0 && (
        <ul className="autocomplete-dropdown">
          {results.map((r, i) => (
            <li key={i} onClick={() => {
              const shortName = r.display_name.split(',')[0];
              onChange(shortName);
              setQuery(shortName);
              setShowDropdown(false);
            }}>
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function Dispatch() {
  const mapCenter = [21.1702, 72.8311];
  const { user } = useAuth();
  const isDriver = user?.role === 'DRIVER';
  const isManager = user?.role === 'FLEET_MANAGER';

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(null);
  const [actualDistance, setActualDistance] = useState('');
  const [routeCache, setRouteCache] = useState({});
  const [activeRoutes, setActiveRoutes] = useState({});
  const [animationStep, setAnimationStep] = useState({});

  // New expense form
  const [expenseForm, setExpenseForm] = useState({
    expenseType: 'TOLL',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });

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

  // Fetch actual routes for active trips
  useEffect(() => {
    const fetchRoutes = async () => {
      const newRoutes = { ...activeRoutes };
      let changed = false;
      for (const trip of activeTrips) {
        if (newRoutes[trip.id] && newRoutes[trip.id].length > 0) continue;
        const cacheKey = `${trip.source}-${trip.destination}`;
        if (routeCache[cacheKey]) {
          newRoutes[trip.id] = routeCache[cacheKey];
          changed = true;
          continue;
        }

        try {
          const srcRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trip.source)}`);
          const srcData = await srcRes.json();
          const dstRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trip.destination)}`);
          const dstData = await dstRes.json();
          
          if (srcData.length > 0 && dstData.length > 0) {
            const src = srcData[0];
            const dst = dstData[0];
            const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${src.lon},${src.lat};${dst.lon},${dst.lat}?overview=full&geometries=geojson`);
            const osrmData = await osrmRes.json();
            if (osrmData.routes && osrmData.routes.length > 0) {
              const coords = osrmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              newRoutes[trip.id] = coords;
              setRouteCache(prev => ({ ...prev, [cacheKey]: coords }));
              changed = true;
            }
          }
        } catch (e) {
          console.error("Routing error:", e);
        }
      }
      if (changed) setActiveRoutes(newRoutes);
    };
    fetchRoutes();
  }, [activeTrips, activeRoutes, routeCache]);

  // Animate trucks along routes
  useEffect(() => {
    const routeKeys = Object.keys(activeRoutes);
    if (routeKeys.length === 0) return;
    const interval = setInterval(() => {
      setAnimationStep(prev => {
        const next = { ...prev };
        routeKeys.forEach(tripId => {
          const path = activeRoutes[tripId];
          if (path && path.length > 0) {
            const curStep = next[tripId] || 0;
            // Move forward, resetting to 0 if reaching end
            next[tripId] = (curStep + 1) % path.length;
          }
        });
        return next;
      });
    }, 300); // 300ms per step
    return () => clearInterval(interval);
  }, [activeRoutes]);

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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!showExpenseModal) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await expensesApi.create({
        vehicleId: showExpenseModal.vehicleId || showExpenseModal.vehicle?.id,
        tripId: showExpenseModal.id,
        expenseType: expenseForm.expenseType,
        amount: parseFloat(expenseForm.amount) || 0,
        description: expenseForm.description,
        expenseDate: expenseForm.expenseDate
      });
      setShowExpenseModal(null);
      setExpenseForm({
        expenseType: 'TOLL',
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      setFormError(err.fieldErrors ? Object.values(err.fieldErrors).join(', ') : err.message);
    } finally {
      setFormLoading(false);
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
            {/* Show routes and animated trucks for active trips */}
            {activeTrips.map((trip) => {
              const path = activeRoutes[trip.id];
              if (!path || path.length === 0) {
                // Fallback if route not loaded yet
                return null;
              }
              const step = animationStep[trip.id] || 0;
              const currentPos = path[step];

              return (
                <React.Fragment key={trip.id}>
                  <Polyline positions={path} color="#3B82F6" weight={4} opacity={0.6} />
                  <Marker position={currentPos} icon={truckIcon}>
                    <Popup>
                      <strong>TRP-{trip.id}</strong><br/>
                      {trip.source} → {trip.destination}<br/>
                      Driver: {trip.driverName || `#${trip.driverId}`}<br/>
                      Vehicle: {trip.vehicleRegistration || `#${trip.vehicleId}`}
                    </Popup>
                  </Marker>
                </React.Fragment>
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
                  {trip.status === 'DRAFT' && !isDriver && (
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
                    <>
                      <button
                        className="trip-action-btn btn-complete"
                        onClick={() => { setShowCompleteModal(trip.id); setActualDistance(''); }}
                        disabled={actionLoading === trip.id}
                      >
                        <CheckCircle size={13} /> Complete
                      </button>
                      <button
                        className="trip-action-btn btn-expense"
                        onClick={() => { setShowExpenseModal(trip); setFormError(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#2563eb', color: '#ffffff' }}
                      >
                        <PlusCircle size={13} /> Expense
                      </button>
                    </>
                  )}
                  {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && !isDriver && (
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
          {!isDriver && (
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
                    <MapPin size={14} className="input-icon" style={{ zIndex: 2 }} />
                    <CityAutocomplete
                      placeholder="Origin (e.g. Mumbai)"
                      value={tripForm.source}
                      onChange={(val) => setTripForm({...tripForm, source: val})}
                    />
                  </div>
                  <div className="input-with-icon">
                    <MapPin size={14} className="input-icon" style={{ zIndex: 2 }} />
                    <CityAutocomplete
                      placeholder="Destination (e.g. Pune)"
                      value={tripForm.destination}
                      onChange={(val) => setTripForm({...tripForm, destination: val})}
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
          )}
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

      {/* Log Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Expense — TRP-{showExpenseModal.id}</h3>
              <button className="btn-close-modal" onClick={() => setShowExpenseModal(null)}>×</button>
            </div>
            {formError && <div className="form-error-banner">{formError}</div>}
            <form onSubmit={handleAddExpense} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Expense Type</label>
                  <select
                    value={expenseForm.expenseType}
                    onChange={(e) => setExpenseForm({...expenseForm, expenseType: e.target.value})}
                    required
                  >
                    <option value="TOLL">Toll Gate Fee</option>
                    <option value="PARKING">Parking Fee</option>
                    <option value="FUEL">Fuel Top-up</option>
                    <option value="REPAIR">Repair</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER">Other Expense</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 15.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Expressway Toll"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Expense Date</label>
                <input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({...expenseForm, expenseDate: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowExpenseModal(null)}>Cancel</button>
                <button type="submit" className="btn-modal-submit" disabled={formLoading}>
                  {formLoading ? 'Logging...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
