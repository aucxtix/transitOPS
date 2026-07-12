import db, { initDb } from './db.js';
import bcrypt from 'bcryptjs';

const seed = async () => {
  console.log('Initializing database...');
  initDb();
  
  console.log('Clearing old data...');
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM expenses;
    DELETE FROM fuel_logs;
    DELETE FROM maintenance_logs;
    DELETE FROM trips;
    DELETE FROM drivers;
    DELETE FROM vehicles;
    DELETE FROM users;
    DELETE FROM roles;
  `);

  console.log('Seeding roles...');
  const insertRole = db.prepare('INSERT INTO roles (id, name) VALUES (?, ?)');
  const roles = [
    { id: 1, name: 'Fleet Manager' },
    { id: 2, name: 'Dispatcher' },
    { id: 3, name: 'Safety Officer' },
    { id: 4, name: 'Financial Analyst' },
    { id: 5, name: 'Driver' }
  ];
  for (const role of roles) insertRole.run(role.id, role.name);

  console.log('Seeding users...');
  const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role_id) VALUES (?, ?, ?, ?, ?)');
  const users = [
    { id: 1, name: 'Fleet Manager', email: 'admin@transitops.com', pass: 'Admin@123', role: 1 },
    { id: 2, name: 'Dispatcher', email: 'dispatcher@transitops.com', pass: 'Dispatch@123', role: 2 },
    { id: 3, name: 'Safety Officer', email: 'safety@transitops.com', pass: 'Safety@123', role: 3 },
    { id: 4, name: 'Financial Analyst', email: 'finance@transitops.com', pass: 'Finance@123', role: 4 },
    { id: 5, name: 'Alex Driver', email: 'alex@transitops.com', pass: 'Driver@123', role: 5 }
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.pass, 10);
    insertUser.run(u.id, u.name, u.email, hash, u.role);
  }

  console.log('Seeding vehicles...');
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (id, registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status, region)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const vehicles = [
    { id: 1, reg: 'MH-01-AB-1234', name: 'Volvo FH16', type: 'Heavy Truck', cap: 25000, odo: 120000, cost: 85000, status: 'Available', region: 'West' },
    { id: 2, reg: 'DL-04-CD-5678', name: 'Tata Signa', type: 'Medium Truck', cap: 15000, odo: 85000, cost: 45000, status: 'On Trip', region: 'North' },
    { id: 3, reg: 'KA-05-EF-9012', name: 'Ashok Leyland Dost', type: 'Light Truck', cap: 2500, odo: 35000, cost: 12000, status: 'In Shop', region: 'South' },
    { id: 4, reg: 'GJ-01-GH-3456', name: 'Mahindra Bolero Pickup', type: 'Pickup', cap: 1500, odo: 54000, cost: 9500, status: 'Available', region: 'West' },
    { id: 5, reg: 'TN-09-IJ-7890', name: 'Van-05', type: 'Van', cap: 500, odo: 12000, cost: 6500, status: 'Available', region: 'South' },
    { id: 6, reg: 'MH-12-PQ-4321', name: 'Scania R500', type: 'Heavy Truck', cap: 30000, odo: 45000, cost: 95000, status: 'Available', region: 'West' },
    { id: 7, reg: 'RJ-14-XY-8765', name: 'Tata Prima', type: 'Heavy Truck', cap: 28000, odo: 210000, cost: 65000, status: 'On Trip', region: 'North' },
    { id: 8, reg: 'KL-01-AB-1111', name: 'Eicher Pro', type: 'Medium Truck', cap: 12000, odo: 15000, cost: 40000, status: 'Available', region: 'South' },
    { id: 9, reg: 'UP-32-CD-2222', name: 'BharatBenz 3128', type: 'Heavy Truck', cap: 32000, odo: 300000, cost: 80000, status: 'In Shop', region: 'North' },
    { id: 10, reg: 'WB-02-EF-3333', name: 'Mahindra Blazo', type: 'Heavy Truck', cap: 26000, odo: 150000, cost: 70000, status: 'Available', region: 'East' }
  ];
  for (const v of vehicles) insertVehicle.run(v.id, v.reg, v.name, v.type, v.cap, v.odo, v.cost, v.status, v.region);

  console.log('Seeding drivers...');
  const insertDriver = db.prepare(`
    INSERT INTO drivers (id, user_id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const drivers = [
    { id: 1, user_id: 5, name: 'Alex Driver', license: 'LIC-1001', cat: 'Heavy', exp: '2028-12-31', contact: '555-0101', score: 98, status: 'Available' },
    { id: 2, user_id: null, name: 'Sarah Connor', license: 'LIC-1002', cat: 'Medium', exp: '2027-05-15', contact: '555-0102', score: 85, status: 'On Trip' },
    { id: 3, user_id: null, name: 'John Doe', license: 'LIC-1003', cat: 'Light', exp: '2024-11-30', contact: '555-0103', score: 70, status: 'Suspended' },
    { id: 4, user_id: null, name: 'Jane Smith', license: 'LIC-1004', cat: 'All', exp: '2026-08-20', contact: '555-0104', score: 92, status: 'Available' },
    { id: 5, user_id: null, name: 'Ravi Kumar', license: 'LIC-1005', cat: 'Heavy', exp: '2025-10-10', contact: '555-0105', score: 95, status: 'Available' },
    { id: 6, user_id: null, name: 'Amit Singh', license: 'LIC-1006', cat: 'Heavy', exp: '2027-01-20', contact: '555-0106', score: 88, status: 'On Trip' },
    { id: 7, user_id: null, name: 'Priya Sharma', license: 'LIC-1007', cat: 'Medium', exp: '2029-03-15', contact: '555-0107', score: 99, status: 'Available' },
    { id: 8, user_id: null, name: 'Vikram Das', license: 'LIC-1008', cat: 'Light', exp: '2024-05-11', contact: '555-0108', score: 65, status: 'Suspended' }
  ];
  for (const d of drivers) insertDriver.run(d.id, d.user_id, d.name, d.license, d.cat, d.exp, d.contact, d.score, d.status);

  console.log('Seeding trips and logs...');
  const insertTrip = db.prepare(`
    INSERT INTO trips (id, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, fuel_consumed, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Completed Trips (for Analytics)
  insertTrip.run(1, 'Mumbai', 'Pune', 1, 1, 15000, 150, 155, 40, 'Completed', 1);
  insertTrip.run(2, 'Delhi', 'Jaipur', 4, 4, 1000, 280, 290, 25, 'Completed', 1);
  insertTrip.run(4, 'Chennai', 'Bangalore', 6, 5, 20000, 350, 360, 90, 'Completed', 1);
  insertTrip.run(5, 'Hyderabad', 'Vijayawada', 10, 7, 18000, 275, 272, 70, 'Completed', 1);
  insertTrip.run(6, 'Kolkata', 'Bhubaneswar', 1, 1, 12000, 440, 450, 110, 'Completed', 1);
  insertTrip.run(7, 'Ahmedabad', 'Surat', 4, 4, 1500, 260, 265, 30, 'Completed', 1);
  insertTrip.run(8, 'Lucknow', 'Kanpur', 6, 5, 22000, 90, 92, 22, 'Completed', 1);
  insertTrip.run(9, 'Nagpur', 'Raipur', 8, 7, 9000, 285, 290, 60, 'Completed', 1);

  // Active / Pending Trips
  insertTrip.run(3, 'Bangalore', 'Chennai', 2, 2, 12000, 350, null, null, 'On Trip', 2);
  insertTrip.run(10, 'Pune', 'Goa', 7, 6, 25000, 450, null, null, 'On Trip', 2);
  insertTrip.run(11, 'Delhi', 'Chandigarh', 1, 1, 14000, 250, null, null, 'Pending', 2);
  insertTrip.run(12, 'Mumbai', 'Nashik', 4, 4, 800, 160, null, null, 'Pending', 2);
  
  // Fuel Logs
  const insertFuel = db.prepare('INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date) VALUES (?, ?, ?, ?, ?)');
  insertFuel.run(1, 1, 40, 3800, '2026-07-10');
  insertFuel.run(4, 2, 25, 2375, '2026-07-11');
  insertFuel.run(6, 4, 90, 8500, '2026-07-09');
  insertFuel.run(10, 5, 70, 6600, '2026-07-08');
  insertFuel.run(1, 6, 110, 10450, '2026-07-07');
  
  // Expenses (Categorized for Pie Chart)
  const insertExpense = db.prepare('INSERT INTO expenses (vehicle_id, type, amount, date, status) VALUES (?, ?, ?, ?, ?)');
  insertExpense.run(1, 'Tolls', 850, '2026-07-10', 'Approved');
  insertExpense.run(4, 'Tolls', 450, '2026-07-11', 'Approved');
  insertExpense.run(6, 'Maintenance', 12500, '2026-07-09', 'Approved');
  insertExpense.run(10, 'Fines', 1500, '2026-07-08', 'Approved');
  insertExpense.run(1, 'Permits', 3000, '2026-07-07', 'Approved');
  insertExpense.run(2, 'Food', 600, '2026-07-06', 'Approved');
  insertExpense.run(7, 'Insurance', 45000, '2026-07-05', 'Approved');
  insertExpense.run(8, 'Tolls', 1200, '2026-07-04', 'Approved');
  insertExpense.run(6, 'Food', 1800, '2026-07-09', 'Approved');

  // Maintenance
  const insertMaint = db.prepare('INSERT INTO maintenance_logs (vehicle_id, maintenance_name, description, status, notes) VALUES (?, ?, ?, ?, ?)');
  insertMaint.run(3, 'Engine Tune-up', 'Routine check and oil change', 'Open', 'Waiting for parts');
  insertMaint.run(9, 'Brake Replacement', 'Full set front and rear', 'Open', 'Scheduled for next Tuesday');
  insertMaint.run(1, 'Tire Rotation', 'Rotate all 18 tires', 'Completed', 'Done locally');

  console.log('Seed complete!');
};

seed().catch(console.error);
