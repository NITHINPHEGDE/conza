import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { mockWorkers } from '../../../mock/workers'
import { mockVendors } from '../../../mock/vendors'
import { mockBookings } from '../../../mock/bookings'
import L from 'leaflet'

const workerIcon = new L.DivIcon({
  html: `<div style="background:#F5C842;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const vendorIcon = new L.DivIcon({
  html: `<div style="background:#2E8B57;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const jobIcon = new L.DivIcon({
  html: `<div style="background:#E03B3B;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export default function LiveMap({ filters = {} }) {
  const { showWorkers = true, showVendors = true, showJobs = true } = filters

  return (
    <div className="h-full min-h-[500px]">
      <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', borderRadius: '0.5rem' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showWorkers && mockWorkers.filter(w => w.isOnline).map((worker) => (
          <Marker
            key={`w-${worker.id}`}
            position={[12.9716 + (Math.random() - 0.5) * 0.15, 77.5946 + (Math.random() - 0.5) * 0.15]}
            icon={workerIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{worker.fullName}</p>
                <p className="text-textMuted">{worker.category}</p>
                <p className="text-xs">Online | ⭐ {worker.rating}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        {showVendors && mockVendors.map((vendor) => (
          <Marker
            key={`v-${vendor.id}`}
            position={[12.9716 + (Math.random() - 0.5) * 0.15, 77.5946 + (Math.random() - 0.5) * 0.15]}
            icon={vendorIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{vendor.shopName}</p>
                <p className="text-textMuted">{vendor.city}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        {showJobs && mockBookings.filter(b => b.status === 'in_progress').map((job) => (
          <Marker
            key={`j-${job.id}`}
            position={[12.9716 + (Math.random() - 0.5) * 0.1, 77.5946 + (Math.random() - 0.5) * 0.1]}
            icon={jobIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Job #{job.id}</p>
                <p className="text-textMuted">{job.category}</p>
                <p className="text-xs">₹{job.total} | {job.status}</p>
              </div>
            </Popup>
            <Circle
              center={[12.9716 + (Math.random() - 0.5) * 0.1, 77.5946 + (Math.random() - 0.5) * 0.1]}
              radius={500}
              pathOptions={{ color: '#E03B3B', fillColor: '#E03B3B', fillOpacity: 0.1 }}
            />
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
