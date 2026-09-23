// Location and reverse geocoding utilities

const addressCache = new Map();

/**
 * Extracts latitude and longitude from strings like "GPS (13.1086, 77.5782)" or "13.1086, 77.5782"
 */
export function parseCoordinates(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return null;
  
  const match = locationStr.match(/(?:GPS\s*\(?)?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\)?/i);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Reverse geocodes coordinates to a human readable address string.
 */
export async function reverseGeocode(lat, lng) {
  const cacheKey = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'Akash_ER_App/1.0 (contact@vsdigitech.com)'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const a = data.address;
        const mainLocation = a.building || a.amenity || a.road || a.neighbourhood || a.suburb;
        const parts = [
          mainLocation,
          a.suburb !== mainLocation ? a.suburb : null,
          a.city || a.town || a.village || a.county,
          a.state,
          a.postcode
        ].filter(Boolean);
        
        // Remove duplicate adjacent parts
        const cleanParts = parts.filter((item, index) => parts.indexOf(item) === index);
        const formattedAddress = cleanParts.join(', ');

        if (formattedAddress) {
          addressCache.set(cacheKey, formattedAddress);
          return formattedAddress;
        }
      }

      if (data && data.display_name) {
        addressCache.set(cacheKey, data.display_name);
        return data.display_name;
      }
    }
  } catch (err) {
    console.warn('Reverse geocode error:', err.message);
  }

  return null;
}
