const axios = require('axios');
const assert = require('assert');

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  validateStatus: () => true // Resolve on all statuses to handle error assertions
});

async function runTestFlow() {
  console.log("Starting test flow...");

  // 0. Login to get token
  const loginRes = await api.post('/auth/login', { email: 'admin@transitops.com', password: 'password123' });
  assert.strictEqual(loginRes.status, 200, "Login failed");
  api.defaults.headers.common['Authorization'] = `Bearer ${loginRes.data.token}`;
  // Pre-check: Ensure Van-05 and Alex exist
  const vehiclesRes = await api.get('/vehicles');
  const van05 = vehiclesRes.data.find(v => v.registration_number === 'Van-05');
  assert(van05, "Van-05 missing");

  const driversRes = await api.get('/drivers');
  const alex = driversRes.data.find(d => d.name === 'Alex');
  assert(alex, "Alex missing");

  console.log("1 & 2. Vehicles and drivers loaded.");

  // 3. Create trip cargo_weight=450kg → should succeed, both flip to On Trip on dispatch
  const tripRes = await api.post('/trips', {
    source: 'A', destination: 'B', vehicle_id: van05.id, driver_id: alex.id, cargo_weight: 450, planned_distance: 100
  });
  assert.strictEqual(tripRes.status, 201, "Trip creation failed");
  const tripId = tripRes.data.id;

  const dispatchRes = await api.put(`/trips/${tripId}/dispatch`);
  assert.strictEqual(dispatchRes.status, 200, "Dispatch failed");
  console.log("3. Trip created and dispatched.");

  // 4. Attempt to create a second trip using Van-05 or Alex while On Trip → must be blocked
  const trip2Res = await api.post('/trips', {
    source: 'C', destination: 'D', vehicle_id: van05.id, driver_id: alex.id, cargo_weight: 100, planned_distance: 50
  });
  assert.strictEqual(trip2Res.status, 400, "Should have been blocked for On Trip");
  console.log("4. Second trip blocked successfully.");

  // 5. Complete the trip → both flip back to Available, dashboard KPIs update
  const completeRes = await api.put(`/trips/${tripId}/complete`, { actual_distance: 105, fuel_consumed: 20 });
  assert.strictEqual(completeRes.status, 200, "Trip completion failed");
  console.log("5. Trip completed.");

  // 6. Create maintenance record for Van-05 → status becomes In Shop
  const maintRes = await api.post('/maintenance', { vehicle_id: van05.id, description: 'Oil change', cost: 150 });
  assert.strictEqual(maintRes.status, 201, "Maintenance creation failed");
  console.log("6. Maintenance record created.");

  // 7. Attempt trip with cargo_weight=600kg on a 500kg vehicle → must be rejected
  const maintCloseRes = await api.put(`/maintenance/1/close`); // Assuming it's ID 1 since we cleared the DB.
  
  const tripOverweightRes = await api.post('/trips', {
    source: 'X', destination: 'Y', vehicle_id: van05.id, driver_id: alex.id, cargo_weight: 600, planned_distance: 10
  });
  assert.strictEqual(tripOverweightRes.status, 400, "Should have blocked overweight cargo");
  assert(tripOverweightRes.data.error.includes("exceeds vehicle capacity"), "Wrong error message for overweight");
  console.log("7. Overweight trip blocked successfully.");

  console.log("All tests passed!");
}

runTestFlow().catch(err => {
  console.error("Test failed:", err.message);
  if (err.response) console.error(err.response.data);
  process.exit(1);
});
