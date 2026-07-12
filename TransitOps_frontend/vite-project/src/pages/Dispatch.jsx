import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { User, MapPin, Clock, AlertTriangle, PlusCircle, Maximize2 } from 'lucide-react';
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
  const mapCenter = [21.1702, 72.8311]; // Surat, roughly midpoint between Mumbai and Ahmedabad

  const activeTrips = [
    {
      id: 'TRP-8842-X',
      route: 'Mumbai → Ahmedabad',
      driver: 'R. Sharma',
      status: 'IN TRANSIT',
      eta: '4h 12m',
      statusType: 'normal',
      coords: [20.37, 72.9] // Near Vapi
    },
    {
      id: 'TRP-9011-Y',
      route: 'Pune → Surat',
      driver: 'M. Patel',
      status: 'IN TRANSIT',
      eta: '1h 05m',
      statusType: 'normal',
      coords: [20.95, 73.0] // Near Navsari
    },
    {
      id: 'TRP-7720-Z',
      route: 'Vadodara → Rajkot',
      driver: 'A. Desai',
      status: 'DELAYED',
      issue: 'Traffic',
      statusType: 'error',
      coords: [22.3, 73.2] // Near Vadodara
    }
  ];

  return (
    <div className="dispatch-page">
      <div className="dispatch-header-bar">
        <h2>Dispatch Center <span className="header-subtitle">/ Live Fleet Map</span></h2>
      </div>

      <div className="dispatch-content">
        <div className="dispatch-map-container">
          <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {activeTrips.map((trip, idx) => (
              <Marker key={idx} position={trip.coords}>
                <Popup>
                  <strong>{trip.id}</strong><br/>
                  {trip.route}<br/>
                  {trip.status}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="dispatch-sidebar">
          <div className="active-trips-list">
            {activeTrips.map((trip, idx) => (
              <div className={`trip-card ${trip.statusType === 'error' ? 'trip-card-error' : ''}`} key={idx}>
                <div className="trip-card-header">
                  <span className="trip-id">{trip.id}</span>
                  <span className={`trip-badge badge-${trip.statusType}`}>{trip.status}</span>
                </div>
                <div className="trip-route">{trip.route}</div>
                <div className="trip-card-footer">
                  <div className="trip-driver">
                    <User size={14} /> {trip.driver}
                  </div>
                  {trip.statusType === 'error' ? (
                    <div className="trip-eta text-red">
                      <AlertTriangle size={14} /> {trip.issue}
                    </div>
                  ) : (
                    <div className="trip-eta">
                      <Clock size={14} /> ETA: {trip.eta}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="new-trip-creator">
            <div className="creator-header">
              <PlusCircle size={18} className="text-blue" />
              <h3>New Trip Creator</h3>
            </div>
            
            <div className="creator-section">
              <label>Quick Draft</label>
              <input type="text" placeholder="Route Alpha - Evening Run" defaultValue="Mumbai Express - Night Run" />
              <div className="input-with-icon">
                <MapPin size={14} className="input-icon" />
                <input type="text" placeholder="Origin" defaultValue="Mumbai Central Warehouse" />
              </div>
              <div className="input-with-icon">
                <MapPin size={14} className="input-icon" />
                <input type="text" placeholder="Destination" defaultValue="Ahmedabad Hub" />
              </div>
            </div>

            <div className="creator-section">
              <label>Quick Assets</label>
              <select>
                <option>R. Sharma - AVAILABLE</option>
                <option>S. Singh - OFF DUTY</option>
              </select>
              <select>
                <option>Heavy Truck - MH-01-AB-1234</option>
                <option>Medium Van - GJ-01-XY-9876</option>
              </select>
            </div>

            <button className="expand-editor-btn">
              Expand Full Editor <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
