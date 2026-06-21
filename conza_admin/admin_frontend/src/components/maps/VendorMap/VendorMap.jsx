import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { mockVendors } from '../../../mock/vendors'
import L from 'leaflet'

const vendorIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#2E8B57;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

export default function VendorMap({ height = '400px' }) {
  return (
    <div style={{ height }}>
      <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', borderRadius: '0.5rem' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mockVendors.map((vendor) => (
          <Marker
            key={vendor.id}
            position={[vendor.latitude || 12.9716 + (Math.random() - 0.5) * 0.1, vendor.longitude || 77.5946 + (Math.random() - 0.5) * 0.1]}
            icon={vendorIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{vendor.shopName}</p>
                <p className="text-textMuted">{vendor.name}</p>
                <p className="text-xs">{vendor.city} | {vendor.sellerType}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
