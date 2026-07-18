// Haversine formula — straight-line distance between two lat/lng points, in meters.
const EARTH_RADIUS_METERS = 6371000;

const toRad = (deg) => (deg * Math.PI) / 180;

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

module.exports = { getDistanceInMeters };
