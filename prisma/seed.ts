import "dotenv/config"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/enums"

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

  // ── Departments ──────────────────────────────────────────
  await prisma.department.create({
    data: { name: "Statistik Distribusi" },
  })
  await prisma.department.create({
    data: { name: "Statistik Produksi" },
  })
  await prisma.department.create({
    data: { name: "Statistik Sosial" },
  })
  const deptUmum = await prisma.department.create({
    data: { name: "Umum & Kepegawaian" },
  })
  console.log("  ✓ 4 departments created")

  // ── Admin ────────────────────────────────────────────────
  const admin = await auth.api.signUpEmail({
    body: {
      name: "Mas Adi",
      email: "admin@bps.go.id",
      password: "password123",
      username: "admin",
    },
  })
  await prisma.user.update({
    where: { id: admin.user.id },
    data: { role: Role.admin },
  })
  console.log("  ✓ admin — admin@bps.go.id / password123")

  // ── HR ───────────────────────────────────────────────────
  const hr = await auth.api.signUpEmail({
    body: {
      name: "Mbak Fitri",
      email: "hrd@bps.go.id",
      password: "password123",
      username: "hrd",
    },
  })
  await prisma.user.update({
    where: { id: hr.user.id },
    data: { role: Role.hr },
  })
  console.log("  ✓ hr — hr@bps.go.id / password123")

  // ── Supervisor ────────────────────────────────────────────
  const supervisor = await auth.api.signUpEmail({
    body: {
      name: "Pak Dedi",
      email: "supervisor@bps.go.id",
      password: "password123",
      username: "supervisor",
    },
  })
  await prisma.user.update({
    where: { id: supervisor.user.id },
    data: { role: Role.supervisor },
  })
  await prisma.supervisorProfile.create({
    data: {
      userId: supervisor.user.id,
      nip: "198001012010011001",
      field: "Statistik Distribusi",
      phone: "081234567890",
      email: "supervisor@bps.go.id",
    },
  })
  console.log("  ✓ supervisor — supervisor@bps.go.id / password123")

  // ── Intern ────────────────────────────────────────────────
  const intern = await auth.api.signUpEmail({
    body: {
      name: "Rizky",
      email: "intern@bps.go.id",
      password: "password123",
      username: "intern",
    },
  })
  await prisma.internProfile.create({
    data: {
      userId: intern.user.id,
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

  console.log("\nSeed complete!")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
