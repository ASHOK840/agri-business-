import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// This seed script is for DEVELOPMENT ONLY.
// It creates login accounts and reference/master data (staff, crops,
// farmers, buyers, transporters, drivers, vehicles, quality statuses,
// expense categories) so every module's dropdowns and lists have
// something to work with. It deliberately does NOT create transactional
// records (purchases, sales, payments, expenses, etc.) — those have real
// business rules and computed fields, so realistic sample transactions
// are created through the actual API instead — see
// scripts/seed-demo-transactions.ts.

const prisma = new PrismaClient();

async function main() {
  // Hard safety net: this creates known login credentials
  // (owner@agribusiness.local / ChangeMe123!) and sample business data.
  // It must never run against a production database. `prisma db seed`
  // can be invoked manually, so NODE_ENV is checked here too, not just
  // documented — a config mistake shouldn't be able to plant a
  // known-password admin account in production.
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'Refusing to run: NODE_ENV=production. This seed script is for development only ' +
        'and creates accounts with a known default password.'
    );
    process.exit(1);
  }

  console.log('Seeding development data...');

  // --- Admin (Father/Owner) user ---------------------------------------
  const adminPasswordHash = await bcrypt.hash('ChangeMe123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'owner@agribusiness.local' },
    update: {},
    create: {
      name: 'Business Owner',
      email: 'owner@agribusiness.local',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log(`  Created admin (Father/Owner) user: ${admin.email} (password: ChangeMe123!)`);

  // --- One staff login user (for testing role-based permissions) -------
  // Note: this is a User account (for logging in), separate from the
  // Staff table below (which represents field-operations staff records).
  // A later module may link these together; for now they're independent.
  const staffPasswordHash = await bcrypt.hash('ChangeMe123!', 10);

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@agribusiness.local' },
    update: {},
    create: {
      name: 'Test Staff Login',
      email: 'staff@agribusiness.local',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
    },
  });
  console.log(`  Created staff login user: ${staffUser.email} (password: ChangeMe123!)`);

  // --- One transportation login user (for testing role-based permissions) --
  const transportPasswordHash = await bcrypt.hash('ChangeMe123!', 10);

  const transportUser = await prisma.user.upsert({
    where: { email: 'transport@agribusiness.local' },
    update: {},
    create: {
      name: 'Test Transportation Login',
      email: 'transport@agribusiness.local',
      passwordHash: transportPasswordHash,
      role: 'TRANSPORTATION',
    },
  });
  console.log(
    `  Created transportation login user: ${transportUser.email} (password: ChangeMe123!)`
  );

  // --- Five sample staff members ---------------------------------------
  const staffMembers = [
    { staffCode: 'STF-001', name: 'Ravi Kumar', phone: '9000000001' },
    { staffCode: 'STF-002', name: 'Suresh Babu', phone: '9000000002' },
    { staffCode: 'STF-003', name: 'Manoj Reddy', phone: '9000000003' },
    { staffCode: 'STF-004', name: 'Ganesh Rao', phone: '9000000004' },
    { staffCode: 'STF-005', name: 'Vijay Singh', phone: '9000000005' },
  ];

  for (const staffMember of staffMembers) {
    await prisma.staff.upsert({
      where: { staffCode: staffMember.staffCode },
      update: {},
      create: staffMember,
    });
  }
  console.log(`  Created ${staffMembers.length} staff members`);

  // --- Sample farmers ---------------------------------------------------
  // Codes are plain FARM-000N so the normal auto-numbering (see
  // farmer.service.ts's generateNextFarmerCode) continues correctly
  // afterward — any farmers a user creates by hand with their own custom
  // code (e.g. "1001") are untouched by this upsert either way.
  const farmers = [
    { farmerCode: 'FARM-0001', name: 'Ramesh Kumar', phone: '9123456701', village: 'Nandgaon' },
    { farmerCode: 'FARM-0002', name: 'Suresh Patel', phone: '9123456702', village: 'Kothapally' },
    { farmerCode: 'FARM-0003', name: 'Lakshmi Devi', phone: '9123456703', village: 'Rampur' },
    { farmerCode: 'FARM-0004', name: 'Venkat Rao', phone: '9123456704', village: 'Anantapur' },
    { farmerCode: 'FARM-0005', name: 'Anjali Sharma', phone: '9123456705', village: 'Bhimavaram' },
    { farmerCode: 'FARM-0006', name: 'Mahesh Yadav', phone: '9123456706', village: 'Warangal' },
  ];
  for (const farmer of farmers) {
    await prisma.farmer.upsert({
      where: { farmerCode: farmer.farmerCode },
      update: {},
      create: farmer,
    });
  }
  console.log(`  Created ${farmers.length} sample farmers`);

  // --- Sample buyers ------------------------------------------------------
  const buyers = [
    { buyerCode: 'BYR-0001', companyName: 'AgroCorp Traders', contactPerson: 'Rajesh Mehta', phone: '9223456701' },
    { buyerCode: 'BYR-0002', companyName: 'Sri Balaji Rice Mills', contactPerson: 'Balaji Naidu', phone: '9223456702' },
    { buyerCode: 'BYR-0003', companyName: 'National Grain Exports', contactPerson: 'Priya Singh', phone: '9223456703' },
    { buyerCode: 'BYR-0004', companyName: 'Deccan Foods Pvt Ltd', contactPerson: 'Arjun Reddy', phone: '9223456704' },
    { buyerCode: 'BYR-0005', companyName: 'Golden Harvest Traders', contactPerson: 'Kavita Rao', phone: '9223456705' },
  ];
  for (const buyer of buyers) {
    await prisma.buyer.upsert({
      where: { buyerCode: buyer.buyerCode },
      update: {},
      create: buyer,
    });
  }
  console.log(`  Created ${buyers.length} sample buyers`);

  // --- Sample transporters, drivers, vehicles ----------------------------
  const transporters = [
    { transporterCode: 'TRN-001', name: 'Sri Venkateswara Transports', phone: '9323456701' },
    { transporterCode: 'TRN-002', name: 'Fast Track Logistics', phone: '9323456702' },
    { transporterCode: 'TRN-003', name: 'Ganesh Roadways', phone: '9323456703' },
  ];
  for (const t of transporters) {
    await prisma.transporter.upsert({ where: { transporterCode: t.transporterCode }, update: {}, create: t });
  }
  console.log(`  Created ${transporters.length} sample transporters`);

  const drivers = [
    { driverCode: 'DRV-001', name: 'Ravi Teja', phone: '9423456701' },
    { driverCode: 'DRV-002', name: 'Kumar Swamy', phone: '9423456702' },
    { driverCode: 'DRV-003', name: 'Suresh Reddy', phone: '9423456703' },
  ];
  for (const d of drivers) {
    await prisma.driver.upsert({ where: { driverCode: d.driverCode }, update: {}, create: d });
  }
  console.log(`  Created ${drivers.length} sample drivers`);

  const vehicles = [
    { vehicleNumber: 'AP09TA1234', vehicleType: 'Truck (6 wheeler)' },
    { vehicleNumber: 'TS08GH5678', vehicleType: 'Truck (10 wheeler)' },
    { vehicleNumber: 'AP16BC9012', vehicleType: 'Mini Truck' },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.upsert({ where: { vehicleNumber: v.vehicleNumber }, update: {}, create: v });
  }
  console.log(`  Created ${vehicles.length} sample vehicles`);

  // --- Sample crops (bag weight defaults to 42kg, but is editable) -----
  const crops = [
    { cropCode: 'CROP-RICE', name: 'Rice', startingPricePerKg: 30 },
    { cropCode: 'CROP-WHEAT', name: 'Wheat', startingPricePerKg: 21 },
    { cropCode: 'CROP-MAIZE', name: 'Maize', startingPricePerKg: 25 },
    { cropCode: 'CROP-MUSRI', name: 'Musri', startingPricePerKg: 20 },
  ];

  for (const { startingPricePerKg, ...crop } of crops) {
    const savedCrop = await prisma.crop.upsert({
      where: { cropCode: crop.cropCode },
      update: {},
      create: crop, // defaultBagWeightKg uses the schema default of 42
    });

    // Every crop needs at least one recorded market price before Staff can
    // use the simplified /staff-entries flow (it reads the latest price
    // automatically — see staffEntry.service.ts). Only seed one if this
    // crop genuinely has no price history yet, so re-running the seed
    // doesn't keep stacking duplicate rows.
    const hasPrice = await prisma.cropPrice.findFirst({ where: { cropId: savedCrop.id } });
    if (!hasPrice) {
      await prisma.cropPrice.create({
        data: {
          cropId: savedCrop.id,
          pricePerKg: startingPricePerKg,
          effectiveDate: new Date(),
          sourceType: 'MARKET',
          createdBy: admin.id,
        },
      });
    }
  }
  console.log(`  Created ${crops.length} crops (each with a starting market price)`);

  // --- One main warehouse ------------------------------------------------
  const existingWarehouse = await prisma.warehouse.findFirst({
    where: { name: 'Main Warehouse' },
  });

  if (!existingWarehouse) {
    await prisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        location: 'Village Center',
      },
    });
    console.log('  Created main warehouse');
  } else {
    console.log('  Main warehouse already exists, skipping');
  }

  // --- Default quality statuses (configurable — see Module 15) --------
  // The business can add more, rename these, or deactivate any of them
  // later via the Quality Statuses admin page. These four are just a
  // sensible starting point matching common real-world usage.
  const qualityStatuses = [
    { code: 'GOOD', name: 'Good', displayOrder: 1, isRejection: false },
    { code: 'MEDIUM', name: 'Medium', displayOrder: 2, isRejection: false },
    { code: 'LOW', name: 'Low', displayOrder: 3, isRejection: false },
    {
      code: 'REJECTED',
      name: 'Rejected',
      displayOrder: 4,
      isRejection: true,
      description: 'Crop did not meet acceptable quality standards.',
    },
  ];

  for (const qs of qualityStatuses) {
    await prisma.qualityStatus.upsert({
      where: { code: qs.code },
      update: {},
      create: qs,
    });
  }
  console.log(`  Created ${qualityStatuses.length} quality statuses`);

  // --- Default expense categories (configurable — see Module 21) ------
  // Transportation and Labour already have detailed records elsewhere
  // (TransportRecord, StaffAssignment) — these categories exist here for
  // ad-hoc costs not covered by those, and never duplicate what's
  // already tracked there (see the expense summary calculation).
  const expenseCategories = [
    { code: 'TRANSPORTATION', name: 'Transportation', displayOrder: 1 },
    { code: 'LABOUR', name: 'Labour', displayOrder: 2 },
    { code: 'LOADING', name: 'Loading', displayOrder: 3 },
    { code: 'UNLOADING', name: 'Unloading', displayOrder: 4 },
    { code: 'WAREHOUSE', name: 'Warehouse Expenses', displayOrder: 5 },
    { code: 'MISCELLANEOUS', name: 'Miscellaneous', displayOrder: 6 },
  ];

  for (const ec of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { code: ec.code },
      update: {},
      create: ec,
    });
  }
  console.log(`  Created ${expenseCategories.length} expense categories`);

  console.log('Seeding complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
