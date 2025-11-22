// scripts/create-admin.ts (run with tsx)
import "dotenv/config";
import { prisma } from "@caseflow/db";
import { hash } from "bcrypt-ts";

async function createAdmin() {
  const password = await hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@caseflow.com" },
    update: {},
    create: {
      email: "admin@caseflow.com",
      password,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const operatorPassword = await hash("user123", 10);
  await prisma.user.upsert({
    where: { email: "operator@caseflow.com" },
    update: {},
    create: {
      email: "operator@caseflow.com",
      password: operatorPassword,
      name: "Operator User",
      role: "OPERATOR",
    },
  });

  console.log("Admin & Operator created!");
  process.exit(0);
}

createAdmin();
