import "dotenv/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";

async function ensureUser(
  email: string,
  password: string,
  name: string,
  role: Role,
): Promise<string> {
  const username = email.split("@")[0];
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== role) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role },
      });
    }
    return existing.id;
  }

  const { user } = await auth.api.signUpEmail({
    body: { name, email, password, username },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { role },
  });
  return user.id;
}

function seedConfig(prefix: string) {
  const email = process.env[`SEED_${prefix}_EMAIL`];
  if (!email) return null;

  const password = process.env[`SEED_${prefix}_PASSWORD`];
  if (!password) {
    console.warn(
      `  ⚠  SEED_${prefix}_EMAIL set but SEED_${prefix}_PASSWORD missing, skipping`,
    );
    return null;
  }

  return {
    email,
    password,
    name: process.env[`SEED_${prefix}_NAME`] || email.split("@")[0],
  };
}

export default async function seedProduction() {
  console.log("Seeding database (production) ...");

  const admin = seedConfig("ADMIN");
  if (admin) {
    await ensureUser(admin.email, admin.password, admin.name, Role.admin);
    console.log(`  ✓ admin — ${admin.email}`);
  } else {
    console.warn(
      "  ⚠  admin — SKIPPED (set SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD)",
    );
  }

  const hr = seedConfig("HR");
  if (hr) {
    await ensureUser(hr.email, hr.password, hr.name, Role.hr);
    console.log(`  ✓ hr — ${hr.email}`);
  } else {
    console.warn("  ⚠  hr — SKIPPED (set SEED_HR_EMAIL & SEED_HR_PASSWORD)");
  }

  const sup = seedConfig("SUPERVISOR");
  if (sup) {
    const supervisorId = await ensureUser(
      sup.email,
      sup.password,
      sup.name,
      Role.supervisor,
    );
    const existingSupProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: supervisorId },
    });
    if (!existingSupProfile) {
      await prisma.supervisorProfile.create({
        data: {
          userId: supervisorId,
          nip: "198001012010011001",
          field: "Statistik Distribusi",
          phone: "081234567890",
          email: sup.email,
        },
      });
    }
    console.log(`  ✓ supervisor — ${sup.email}`);
  } else {
    console.warn(
      "  ⚠  supervisor — SKIPPED (set SEED_SUPERVISOR_EMAIL & SEED_SUPERVISOR_PASSWORD)",
    );
  }

  const intern = seedConfig("INTERN");
  if (intern) {
    const internId = await ensureUser(
      intern.email,
      intern.password,
      intern.name,
      Role.intern,
    );
    const existingInternProfile = await prisma.internProfile.findUnique({
      where: { userId: internId },
    });
    if (!existingInternProfile) {
      await prisma.internProfile.create({
        data: {
          userId: internId,
          nik: "3273012345678901",
          institution: "Universitas Siliwangi",
          phone: "081298765432",
          email: intern.email,
          periodStart: new Date("2026-07-01"),
          periodEnd: new Date("2026-12-31"),
          status: "active",
        },
      });
    }
    console.log(`  ✓ intern — ${intern.email}`);
  } else {
    console.warn(
      "  ⚠  intern — SKIPPED (set SEED_INTERN_EMAIL & SEED_INTERN_PASSWORD)",
    );
  }

  console.log("\nSeed complete!");
}
