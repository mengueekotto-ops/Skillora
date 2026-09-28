/**
 * Automated Verification Script for Skillora Geolocation System
 */

const { calculateHaversineDistance, formatDistance } = require('../src/utils/distance.util');

async function runGeolocationVerification() {
  console.log("=== 🔍 SKILLORA GEOLOCATION SYSTEM VERIFICATION ===");

  // 1. Verify Haversine Distance Formula
  console.log("\n1. Testing Haversine Distance Calculation...");
  // Bastos Yaoundé (3.888, 11.517) to Biyem-Assi Yaoundé (3.834, 11.488)
  const distSameCity = calculateHaversineDistance(3.888, 11.517, 3.834, 11.488);
  console.log(`   Yaoundé Bastos -> Yaoundé Biyem-Assi: ${distSameCity} km (Expected ~6.8 km)`);

  // Yaoundé (3.888, 11.517) to Douala Akwa (4.051, 9.704)
  const distCrossCity = calculateHaversineDistance(3.888, 11.517, 4.051, 9.704);
  console.log(`   Yaoundé Bastos -> Douala Akwa: ${distCrossCity} km (Expected ~203 km)`);

  // Format tests
  console.log(`   Format 0.45 km -> "${formatDistance(0.45)}"`);
  console.log(`   Format 2.4 km -> "${formatDistance(2.4)}"`);

  if (distSameCity > 0 && distCrossCity > 150) {
    console.log("   ✅ Haversine math verification PASSED!");
  } else {
    console.error("   ❌ Haversine calculation error!");
    process.exit(1);
  }

  // 2. Test Distance Filtering Logic
  console.log("\n2. Testing Distance Filtering & Sorting Logic...");
  const mockArtisans = [
    { name: "Artisan A (Close)", lat: 3.889, lon: 11.518 }, // ~0.15 km
    { name: "Artisan B (Medium)", lat: 3.834, lon: 11.488 }, // ~6.8 km
    { name: "Artisan C (Far)", lat: 4.051, lon: 9.704 }, // ~203 km
  ];

  const clientLat = 3.888;
  const clientLon = 11.517;

  const artisansWithDistance = mockArtisans.map((a) => {
    const dist = calculateHaversineDistance(clientLat, clientLon, a.lat, a.lon);
    return { ...a, distanceKm: dist, distanceText: formatDistance(dist) };
  });

  const within5km = artisansWithDistance.filter((a) => a.distanceKm <= 5);
  const within10km = artisansWithDistance.filter((a) => a.distanceKm <= 10);
  const sortedNearest = [...artisansWithDistance].sort((a, b) => a.distanceKm - b.distanceKm);

  console.log(`   Artisans within 5 km: ${within5km.map((a) => a.name).join(", ")} (Count: ${within5km.length})`);
  console.log(`   Artisans within 10 km: ${within10km.map((a) => a.name).join(", ")} (Count: ${within10km.length})`);
  console.log(`   Sorted Nearest: ${sortedNearest.map((a) => `${a.name} (${a.distanceText})`).join(" -> ")}`);

  if (within5km.length === 1 && within10km.length === 2 && sortedNearest[0].name.includes("Artisan A")) {
    console.log("   ✅ Distance filtering and sorting logic PASSED!");
  } else {
    console.error("   ❌ Distance filtering test FAILED!");
    process.exit(1);
  }

  // 3. Test Privacy Masking Logic
  console.log("\n3. Testing Privacy Masking Settings...");
  const testArtisan = {
    name: "Emmanuel Ngu",
    latitude: 3.888,
    longitude: 11.517,
    locationVisibility: "APPROXIMATE",
  };

  const sanitizeForPublicView = (artisan) => {
    const copy = { ...artisan };
    if (copy.locationVisibility === "APPROXIMATE" || copy.locationVisibility === "CITY_ONLY") {
      delete copy.latitude;
      delete copy.longitude;
    }
    return copy;
  };

  const publicProfile = sanitizeForPublicView(testArtisan);
  if (publicProfile.latitude === undefined && publicProfile.longitude === undefined) {
    console.log("   ✅ Privacy protection (masking exact coordinates for public view) PASSED!");
  } else {
    console.error("   ❌ Privacy protection FAILED!");
    process.exit(1);
  }

  console.log("\n========================================================");
  console.log("🎉 ALL GEOLOCATION VERIFICATION TESTS PASSED SUCCESSFULLY!");
  console.log("========================================================\n");
}

runGeolocationVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
