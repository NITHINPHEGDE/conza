import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import useMapStore from '../../../store/maps/useMapStore'

const workerIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#F5C842;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

export default function WorkerMap({ height = '400px' }) {
  const { workers, loading, error, fetchLiveTracking } = useMapStore()

  useEffect(() => {
    fetchLiveTracking()
    const interval = setInterval(fetchLiveTracking, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [fetchLiveTracking])

  return (
    <div style={{ height, position: 'relative' }}>
      {error && (
        <p className="absolute top-2 left-2 z-[1000] text-xs text-danger bg-white px-2 py-1 rounded shadow">
          {error}
        </p>
      )}
      {!loading && workers.length === 0 && !error && (
        <p className="absolute top-2 left-2 z-[1000] text-xs text-textMuted bg-white px-2 py-1 rounded shadow">
          No workers currently online with a live location
        </p>
      )}
      <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', borderRadius: '0.5rem' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {workers.map((worker) => (
          <Marker key={worker.id} position={[worker.latitude, worker.longitude]} icon={workerIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{worker.fullName}</p>
                <p className="text-textMuted">{worker.category}</p>
                <p className="text-xs">⭐ {worker.rating} | {worker.isAvailable ? 'Available' : 'On a job'}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
