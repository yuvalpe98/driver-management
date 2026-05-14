import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Admin1234!", 12);
  const driverHash = await bcrypt.hash("Driver1234!", 12);

  const manager = await prisma.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      name: "מנהל ראשי",
      username: "manager",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  const driver1 = await prisma.user.upsert({
    where: { username: "yossi" },
    update: {},
    create: {
      name: "יוסי כהן",
      username: "yossi",
      passwordHash: driverHash,
      role: Role.DRIVER,
      phone: "050-1234567",
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { username: "david" },
    update: {},
    create: {
      name: "דוד לוי",
      username: "david",
      passwordHash: driverHash,
      role: Role.DRIVER,
      phone: "052-7654321",
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "משלוח לתל אביב",
        description: "חבילה דחופה",
        deliveryAddress: "רחוב דיזנגוף 50, תל אביב",
        assignedDriverId: driver1.id,
        createdByManagerId: manager.id,
      },
      {
        title: "משלוח לירושלים",
        deliveryAddress: "רחוב יפו 100, ירושלים",
        assignedDriverId: driver2.id,
        createdByManagerId: manager.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed complete");
  console.log("   Manager:  manager  / Admin1234!");
  console.log("   Driver 1: yossi    / Driver1234!");
  console.log("   Driver 2: david    / Driver1234!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
