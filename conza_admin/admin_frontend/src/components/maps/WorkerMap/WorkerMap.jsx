import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { mockWorkers } from '../../../mock/workers'
import L from 'leaflet'

const workerIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#F5C842;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

export default function WorkerMap({ height = '400px' }) {
  const onlineWorkers = mockWorkers.filter((w) => w.isOnline)

  return (
    <div style={{ height }}>
      <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', borderRadius: '0.5rem' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onlineWorkers.map((worker) => (
          <Marker
            key={worker.id}
            position={[worker.latitude || 12.9716 + (Math.random() - 0.5) * 0.1, worker.longitude || 77.5946 + (Math.random() - 0.5) * 0.1]}
            icon={workerIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{worker.fullName}</p>
                <p className="text-textMuted">{worker.category}</p>
                <p className="text-xs">⭐ {worker.rating} | {worker.totalJobs} jobs</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
