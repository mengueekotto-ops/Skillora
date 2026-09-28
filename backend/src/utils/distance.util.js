/**
 * Distance Calculation Utility using the Haversine Formula
 * Calculates great-circle distance between two geographical coordinates on Earth.
 */

/**
 * Calculates Haversine distance between two sets of latitude/longitude coordinates in kilometers.
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }

  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) {
    return null;
  }

  const EARTH_RADIUS_KM = 6371; // Earth's mean radius in km

  const dLat = toRadians(numLat2 - numLat1);
  const dLon = toRadians(numLon2 - numLon1);

  const radLat1 = toRadians(numLat1);
  const radLat2 = toRadians(numLat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceKm = EARTH_RADIUS_KM * c;

  return Math.round(distanceKm * 10) / 10; // Round to 1 decimal place
}

/**
 * Helper to convert degrees to radians
 * @param {number} degrees 
 * @returns {number} radians
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats a distance in kilometers into a human-readable string.
 * e.g., 0.4 -> "400 m away", 2.4 -> "2.4 km away"
 * @param {number|null} distKm 
 * @returns {string} Formatted distance text
 */
function formatDistance(distKm) {
  if (distKm === null || distKm === undefined || isNaN(distKm)) {
    return "Distance unknown";
  }
  if (distKm < 1) {
    const meters = Math.round(distKm * 1000);
    return `${meters} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

module.exports = {
  calculateHaversineDistance,
  formatDistance,
};
