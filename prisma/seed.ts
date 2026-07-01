import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@condostock.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, role: Role.ADMIN },
  });

  console.log(`✅ Admin พร้อมใช้งาน: ${admin.email} (รหัสผ่านเริ่มต้น: ${password})`);
  console.log("   อย่าลืมเปลี่ยนรหัสผ่านหลังเข้าใช้งานครั้งแรก");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
