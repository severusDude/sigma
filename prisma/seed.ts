import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("DATABASE_URL is not defined")

const adapter = new PrismaPg({ connectionString: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database ...")

  // ── Clean all data ──────────────────────────────────────
  await prisma.attachment.deleteMany()
  await prisma.document.deleteMany()
  await prisma.documentTemplate.deleteMany()
  await prisma.assessmentComponent.deleteMany()
  await prisma.assessment.deleteMany()
  await prisma.guidanceSession.deleteMany()
  await prisma.logbook.deleteMany()
  await prisma.issue.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.internSupervisor.deleteMany()
  await prisma.supervisorProfile.deleteMany()
  await prisma.internProfile.deleteMany()
  await prisma.department.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemConfig.deleteMany()
  await prisma.guide.deleteMany()

  const hash = await bcrypt.hash("password123", 10)

  // ── Departments ──────────────────────────────────────────
  const deptDist = await prisma.department.create({
    data: { id: randomUUID(), name: "Statistik Distribusi" },
  })
  await prisma.department.create({
    data: { id: randomUUID(), name: "Statistik Produksi" },
  })
  await prisma.department.create({
    data: { id: randomUUID(), name: "Statistik Sosial" },
  })
  const deptUmum = await prisma.department.create({
    data: { id: randomUUID(), name: "Umum & Kepegawaian" },
  })

  // ── Admin ────────────────────────────────────────────────
  const adminId = randomUUID()
  await prisma.user.create({
    data: {
      id: adminId,
      name: "Mas Adi",
      email: "admin@bps.go.id",
      emailVerified: true,
      username: "admin",
      displayUsername: "admin",
      role: "admin",
    },
  })
  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: "admin@bps.go.id",
      providerId: "credential",
      userId: adminId,
      password: hash,
    },
  })
  console.log("  ✓ admin — admin@bps.go.id / password123")

  // ── HR ───────────────────────────────────────────────────
  const hrId = randomUUID()
  await prisma.user.create({
    data: {
      id: hrId,
      name: "Mbak Fitri",
      email: "hr@bps.go.id",
      emailVerified: true,
      username: "hr",
      displayUsername: "hr",
      role: "hr",
    },
  })
  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: "hr@bps.go.id",
      providerId: "credential",
      userId: hrId,
      password: hash,
    },
  })
  console.log("  ✓ hr — hr@bps.go.id / password123")

  // ── Supervisor ────────────────────────────────────────────
  const spvId = randomUUID()
  await prisma.user.create({
    data: {
      id: spvId,
      name: "Pak Dedi",
      email: "supervisor@bps.go.id",
      emailVerified: true,
      username: "supervisor",
      displayUsername: "supervisor",
      role: "supervisor",
    },
  })
  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: "supervisor@bps.go.id",
      providerId: "credential",
      userId: spvId,
      password: hash,
    },
  })
  await prisma.supervisorProfile.create({
    data: {
      id: randomUUID(),
      userId: spvId,
      nip: "198001012010011001",
      field: "Statistik Distribusi",
      phone: "081234567890",
      email: "supervisor@bps.go.id",
    },
  })
  console.log("  ✓ supervisor — supervisor@bps.go.id / password123")

  // ── Intern ────────────────────────────────────────────────
  const internId = randomUUID()
  await prisma.user.create({
    data: {
      id: internId,
      name: "Rizky",
      email: "intern@bps.go.id",
      emailVerified: true,
      username: "intern",
      displayUsername: "intern",
      role: "intern",
    },
  })
  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: "intern@bps.go.id",
      providerId: "credential",
      userId: internId,
      password: hash,
    },
  })
  await prisma.internProfile.create({
    data: {
      id: randomUUID(),
      userId: internId,
      nik: "3273012345678901",
      institution: "Universitas Siliwangi",
      phone: "081298765432",
      email: "intern@bps.go.id",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-12-31"),
      departmentId: deptUmum.id,
      status: "active",
    },
  })
  console.log("  ✓ intern — intern@bps.go.id / password123")

  console.log("\nDone!")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
