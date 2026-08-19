import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import useMapStore from '../../../store/maps/useMapStore'

const vendorIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#2E8B57;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

export default function VendorMap({ height = '400px' }) {
  const { vendors, loading, error, fetchLiveTracking } = useMapStore()

  useEffect(() => {
    fetchLiveTracking()
    const interval = setInterval(fetchLiveTracking, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveTracking])

  return (
    <div style={{ height, position: 'relative' }}>
      {error && (
        <p className="absolute top-2 left-2 z-[1000] text-xs text-danger bg-white px-2 py-1 rounded shadow">
          {error}
        </p>
      )}
      {!loading && vendors.length === 0 && !error && (
        <p className="absolute top-2 left-2 z-[1000] text-xs text-textMuted bg-white px-2 py-1 rounded shadow">
          No active vendors found
        </p>
      )}
      <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', borderRadius: '0.5rem' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vendors.map((vendor) => (
          <Marker key={vendor.id} position={[vendor.latitude, vendor.longitude]} icon={vendorIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{vendor.shopName}</p>
                <p className="text-textMuted">{vendor.name}</p>
                <p className="text-xs">{vendor.city}{vendor.approximate ? ' (approx.)' : ''}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
