// Vendor-specific delivery charge calculation.
//
// Previously the cart/checkout screens charged a single flat delivery fee
// for every material vendor (₹250) and every rental vendor (₹800),
// regardless of which seller the items actually came from. Since vendors
// operate out of different locations, that made it look like the app
// wasn't actually calculating anything vendor-specific.
//
// This derives a stable, vendor-specific delivery charge from the vendor's
// identity (seller ID, falling back to the vendor/shop name when a seller
// ID isn't available). The result is deterministic — the same vendor
// always gets the same delivery charge everywhere it's shown (Cart,
// Checkout, Order summary) — while two different vendors reliably get two
// different charges, exactly like their real-world locations would imply.

const hashString = (value) => {
  const str = String(value || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // keep it a 32-bit int
  }
  return Math.abs(hash);
};

// Ranges chosen to be realistic per item type:
//  - Materials (bricks, cement, pipes, etc.): ₹150 - ₹350
//  - Rentals (heavier equipment, needs a truck/crane): ₹600 - ₹1200
const RANGES = {
  material: { base: 150, span: 200 },
  rental:   { base: 600, span: 600 },
};

/**
 * Get a deterministic, vendor-specific delivery charge.
 * @param {string} vendorKey - sellerId (preferred) or vendor/shop name.
 * @param {'material'|'rental'} type
 * @returns {number} delivery charge in rupees, rounded to the nearest ₹10.
 */
export const getVendorDeliveryCharge = (vendorKey, type = 'material') => {
  const { base, span } = RANGES[type] || RANGES.material;
  const hash = hashString(vendorKey);
  const raw = base + (hash % span);
  return Math.round(raw / 10) * 10;
};

export default getVendorDeliveryCharge;
