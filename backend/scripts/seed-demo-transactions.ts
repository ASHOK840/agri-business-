/**
 * Seeds realistic DEMO transactional data (purchases, sales, payments,
 * expenses, transport, staff assignments, quality, crop prices) by
 * calling the real running API — never by writing directly to the
 * database. That guarantees every computed field (totals, expected
 * revenue, settlement amounts) and every side effect (inventory
 * movements, audit log entries, sequential document numbers) is exactly
 * what the real app would produce, because it IS the real app producing
 * it.
 *
 * DEVELOPMENT ONLY. Requires:
 *   1. The backend already running (npm run dev) with the seeded
 *      reference data in place (npx prisma db seed).
 *   2. Run with: npx ts-node scripts/seed-demo-transactions.ts
 *
 * Safe to re-run — every create below either targets fresh demo records
 * with a "Demo" marker in notes, or is naturally idempotent (re-running
 * just creates a few more of the same, it won't corrupt anything). It
 * never touches farmers/buyers/purchases a real user created by hand.
 */

const BASE_URL = process.env.SEED_API_BASE_URL || 'http://localhost:5000/api';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run against NODE_ENV=production.');
  process.exit(1);
}

let token = '';

const api = async (method: string, path: string, body?: unknown): Promise<any> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${data?.message || JSON.stringify(data)}`);
  }
  return data.data ?? data;
};

const findByName = <T extends Record<string, any>>(items: T[], field: string, value: string): T => {
  const found = items.find((i) => i[field] === value);
  if (!found) throw new Error(`Could not find record where ${field} = "${value}"`);
  return found;
};

async function main() {
  console.log('Logging in as owner...');
  const login = await api('POST', '/auth/login', {
    email: 'owner@agribusiness.local',
    password: 'ChangeMe123!',
  });
  token = login.token;
  console.log('  Logged in.');

  console.log('Loading reference data...');
  // api() already unwraps the top-level `data` field, so for list
  // endpoints (shape { status, data: [...], pagination }) each of these
  // resolves directly to the array — no further `.data` needed.
  const [farmers, buyers, crops, transporters, drivers, vehicles, staffList, categories] = await Promise.all([
    api('GET', '/farmers?limit=100'),
    api('GET', '/buyers?limit=100'),
    api('GET', '/crops?limit=100'),
    api('GET', '/transporters?limit=100'),
    api('GET', '/drivers?limit=100'),
    api('GET', '/vehicles?limit=100'),
    api('GET', '/staff?limit=100'),
    api('GET', '/expense-categories?limit=100'),
  ]);

  const rice = findByName(crops, 'name', 'Rice');
  const wheat = findByName(crops, 'name', 'Wheat');
  const maize = findByName(crops, 'name', 'Maize');

  const ramesh = findByName(farmers, 'farmerCode', 'FARM-0001');
  const sureshP = findByName(farmers, 'farmerCode', 'FARM-0002');
  const lakshmi = findByName(farmers, 'farmerCode', 'FARM-0003');
  const venkat = findByName(farmers, 'farmerCode', 'FARM-0004');

  const agroCorp = findByName(buyers, 'buyerCode', 'BYR-0001');
  const sriBalaji = findByName(buyers, 'buyerCode', 'BYR-0002');
  const nationalGrain = findByName(buyers, 'buyerCode', 'BYR-0003');
  const deccanFoods = findByName(buyers, 'buyerCode', 'BYR-0004');

  const transporter1 = findByName(transporters, 'transporterCode', 'TRN-001');
  const transporter2 = findByName(transporters, 'transporterCode', 'TRN-002');
  const driver1 = findByName(drivers, 'driverCode', 'DRV-001');
  const vehicle1 = findByName(vehicles, 'vehicleNumber', 'AP09TA1234');

  const staff1 = findByName(staffList, 'staffCode', 'STF-001');
  const staff2 = findByName(staffList, 'staffCode', 'STF-002');

  const transportCat = findByName(categories, 'code', 'TRANSPORTATION');
  const loadingCat = findByName(categories, 'code', 'LOADING');
  const miscCat = findByName(categories, 'code', 'MISCELLANEOUS');

  console.log('Recording crop prices...');
  await api('POST', '/crop-prices', {
    cropId: rice.id,
    pricePerKg: 26,
    effectiveDate: '2026-09-01',
    sourceType: 'MARKET',
    quality: 'Grade A',
  });
  await api('POST', '/crop-prices', {
    cropId: wheat.id,
    pricePerKg: 21,
    effectiveDate: '2026-09-01',
    sourceType: 'MARKET',
  });
  await api('POST', '/crop-prices', {
    cropId: rice.id,
    buyerId: agroCorp.id,
    pricePerKg: 30,
    effectiveDate: '2026-09-05',
    sourceType: 'BUYER_QUOTE',
  });

  // --- Purchase 1: Rice from Ramesh — full cycle through to COMPLETED,
  // with weighing, staff assignment, transport, and full farmer payment.
  console.log('Creating Purchase 1 (Rice, completed, full cycle)...');
  const p1 = await api('POST', '/purchases', {
    farmerId: ramesh.id,
    cropId: rice.id,
    purchaseRatePerKg: 25,
    estimatedQuantityKg: 1000,
    advanceAmount: 15000,
    purchaseDate: '2026-09-05',
    quality: 'Grade A',
    notes: 'Demo data — Ramesh Kumar Rice purchase',
  });
  await api('POST', '/weighing-records', {
    purchaseId: p1.id,
    numberOfBags: 24,
    actualWeightKg: 1000,
    weighingDate: '2026-09-05',
  });
  await api('POST', '/staff-assignments', {
    purchaseId: p1.id,
    staffId: staff1.id,
    assignedDate: '2026-09-05',
    labourRatePerBag: 5,
  });
  const p1Transport = await api('POST', '/transport-records', {
    direction: 'FARMER_TO_WAREHOUSE',
    transporterId: transporter1.id,
    driverId: driver1.id,
    vehicleId: vehicle1.id,
    purchaseId: p1.id,
    cropId: rice.id,
    fromLocation: 'Nandgaon Farm',
    toLocation: 'Main Warehouse',
    numberOfBags: 24,
    weightKg: 1000,
    transportCost: 800,
    transportDate: '2026-09-05',
  });
  await api('PATCH', `/transport-records/${p1Transport.id}/status`, { status: 'DELIVERED' });
  await api('PATCH', `/purchases/${p1.id}/status`, { status: 'CONFIRMED' });
  await api('PATCH', `/purchases/${p1.id}/status`, { status: 'COLLECTED' });
  await api('PATCH', `/purchases/${p1.id}/status`, { status: 'AT_WAREHOUSE' });
  await api('PATCH', `/purchases/${p1.id}/status`, { status: 'COMPLETED' });
  // Final farmer payment — the remaining balance after the advance.
  await api('PUT', `/purchases/${p1.id}`, { advanceAmount: 25000 });
  await api('POST', '/expenses', {
    categoryId: transportCat.id,
    amount: 800,
    expenseDate: '2026-09-05',
    description: 'Demo data — transport for Purchase 1',
    purchaseId: p1.id,
    paymentMethod: 'CASH',
  });

  // --- Purchase 2: Wheat from Suresh Patel — also completed.
  console.log('Creating Purchase 2 (Wheat, completed)...');
  const p2 = await api('POST', '/purchases', {
    farmerId: sureshP.id,
    cropId: wheat.id,
    purchaseRatePerKg: 20,
    estimatedQuantityKg: 800,
    advanceAmount: 10000,
    purchaseDate: '2026-09-06',
    notes: 'Demo data — Suresh Patel Wheat purchase',
  });
  await api('POST', '/weighing-records', {
    purchaseId: p2.id,
    numberOfBags: 19,
    actualWeightKg: 800,
    weighingDate: '2026-09-06',
  });
  await api('POST', '/staff-assignments', {
    purchaseId: p2.id,
    staffId: staff2.id,
    assignedDate: '2026-09-06',
    labourRatePerBag: 5,
  });
  await api('POST', '/transport-records', {
    direction: 'FARMER_TO_WAREHOUSE',
    transporterId: transporter2.id,
    purchaseId: p2.id,
    cropId: wheat.id,
    fromLocation: 'Kothapally Farm',
    toLocation: 'Main Warehouse',
    numberOfBags: 19,
    weightKg: 800,
    transportCost: 650,
    transportDate: '2026-09-06',
  });
  await api('PATCH', `/purchases/${p2.id}/status`, { status: 'CONFIRMED' });
  await api('PATCH', `/purchases/${p2.id}/status`, { status: 'COLLECTED' });
  await api('PATCH', `/purchases/${p2.id}/status`, { status: 'AT_WAREHOUSE' });
  await api('PATCH', `/purchases/${p2.id}/status`, { status: 'COMPLETED' });
  await api('PUT', `/purchases/${p2.id}`, { advanceAmount: 16000 });

  // --- Purchase 3: Maize from Lakshmi Devi — still in progress
  // (tests the "pending purchase collection" dashboard alert).
  console.log('Creating Purchase 3 (Maize, still pending)...');
  await api('POST', '/purchases', {
    farmerId: lakshmi.id,
    cropId: maize.id,
    purchaseRatePerKg: 18,
    estimatedQuantityKg: 500,
    purchaseDate: '2026-09-10',
    notes: 'Demo data — Lakshmi Devi Maize purchase, not yet collected',
  });

  // --- Purchase 4: Rice from Venkat Rao — cancelled before collection.
  console.log('Creating Purchase 4 (Rice, cancelled)...');
  const p4 = await api('POST', '/purchases', {
    farmerId: venkat.id,
    cropId: rice.id,
    purchaseRatePerKg: 24,
    estimatedQuantityKg: 300,
    purchaseDate: '2026-09-08',
    notes: 'Demo data — Venkat Rao deal fell through',
  });
  await api('PATCH', `/purchases/${p4.id}/status`, { status: 'CANCELLED' });

  // --- Sale 1: Rice to AgroCorp — dispatched, accepted, paid in full.
  console.log('Creating Sale 1 (Rice, delivered + paid)...');
  const s1 = await api('POST', '/sales', {
    buyerId: agroCorp.id,
    cropId: rice.id,
    dispatchWeightKg: 400,
    sellingRatePerKg: 30,
    saleDate: '2026-09-08',
    notes: 'Demo data — AgroCorp Rice sale',
  });
  await api('PATCH', `/sales/${s1.id}/status`, { status: 'DISPATCHED' });
  const s1Settlement = await api('POST', '/sale-settlements', {
    saleId: s1.id,
    settlementStatus: 'ACCEPTED',
    buyerFinalWeightKg: 395,
    receivedDate: '2026-09-09',
    buyerRemarks: 'Minor moisture loss in transit.',
  });
  await api('POST', '/buyer-payments', {
    saleId: s1.id,
    amount: s1Settlement.finalSettlementAmount,
    paymentDate: '2026-09-10',
    paymentMethod: 'BANK_TRANSFER',
    transactionReferenceNumber: 'DEMO-TXN-0001',
  });
  await api('POST', '/expenses', {
    categoryId: loadingCat.id,
    amount: 300,
    expenseDate: '2026-09-08',
    description: 'Demo data — loading charges for Sale 1',
    saleId: s1.id,
    paymentMethod: 'CASH',
  });

  // --- Sale 2: Wheat to Sri Balaji — price-adjusted, partially paid
  // (tests buyer outstanding + quality price reduction alert).
  console.log('Creating Sale 2 (Wheat, price-adjusted, partial payment)...');
  const s2 = await api('POST', '/sales', {
    buyerId: sriBalaji.id,
    cropId: wheat.id,
    dispatchWeightKg: 300,
    sellingRatePerKg: 24,
    saleDate: '2026-09-09',
    notes: 'Demo data — Sri Balaji Wheat sale',
  });
  await api('PATCH', `/sales/${s2.id}/status`, { status: 'DISPATCHED' });
  const s2Settlement = await api('POST', '/sale-settlements', {
    saleId: s2.id,
    settlementStatus: 'PRICE_ADJUSTED',
    buyerFinalWeightKg: 300,
    receivedDate: '2026-09-10',
    adjustedSellingRatePerKg: 22,
    priceAdjustmentReason: 'Slightly below agreed quality grade.',
  });
  const s2Outstanding = Number(s2Settlement.finalSettlementAmount);
  await api('POST', '/buyer-payments', {
    saleId: s2.id,
    amount: Math.round((s2Outstanding / 2) * 100) / 100,
    paymentDate: '2026-09-11',
    paymentMethod: 'UPI',
    transactionReferenceNumber: 'DEMO-TXN-0002',
  });

  // --- Sale 3: Rice to National Grain Exports — rejected, returned to
  // warehouse (tests rejection handling + stock restoration).
  console.log('Creating Sale 3 (Rice, rejected)...');
  const s3 = await api('POST', '/sales', {
    buyerId: nationalGrain.id,
    cropId: rice.id,
    dispatchWeightKg: 200,
    sellingRatePerKg: 30,
    saleDate: '2026-09-09',
    notes: 'Demo data — National Grain Rice sale, rejected on delivery',
  });
  await api('PATCH', `/sales/${s3.id}/status`, { status: 'DISPATCHED' });
  await api('POST', '/sale-settlements', {
    saleId: s3.id,
    settlementStatus: 'REJECTED',
    buyerFinalWeightKg: 0,
    receivedDate: '2026-09-10',
    rejectionReason: 'Moisture content too high on inspection.',
    quantityAffectedKg: 200,
    rejectionAction: 'RETURN_TO_WAREHOUSE',
    buyerRemarks: 'Entire consignment rejected.',
  });

  // --- Sale 4: Rice to Deccan Foods — still pending, not dispatched yet.
  console.log('Creating Sale 4 (Rice, pending)...');
  await api('POST', '/sales', {
    buyerId: deccanFoods.id,
    cropId: rice.id,
    dispatchWeightKg: 100,
    sellingRatePerKg: 31,
    saleDate: '2026-09-12',
    notes: 'Demo data — Deccan Foods Rice sale, awaiting dispatch',
  });

  await api('POST', '/expenses', {
    categoryId: miscCat.id,
    amount: 150,
    expenseDate: '2026-09-11',
    description: 'Demo data — miscellaneous warehouse cost',
    paymentMethod: 'CASH',
  });

  console.log('\nDemo transactional data created successfully.');
  console.log('Sign in as owner@agribusiness.local to see it across every module.');
}

main().catch((error) => {
  console.error('Seeding demo transactions failed:', error.message);
  process.exit(1);
});
