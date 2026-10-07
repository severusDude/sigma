import "dotenv/config"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/enums"

export default async function seedDevelopment() {
  console.log("Seeding database (development) ...")

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
  await prisma.team.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemConfig.deleteMany()
  await prisma.guide.deleteMany()

  const teams = await Promise.all(
    ["KEJAR", "HALIS", "GADIS", "CAPUNG", "INTANT", "HUMAS", "SE2026", "Pengolahan", "D'Stik", "PEK", "KTIP", "UMUM"].map(
      (name) => prisma.team.create({ data: { name } }),
    ),
  )
  const teamUmum = teams[teams.length - 1]
  console.log(`  ✓ ${teams.length} teams created`)

  const admin = await auth.api.signUpEmail({
    body: {
      name: process.env.SEED_ADMIN_NAME || "Mas Adi",
      email: process.env.SEED_ADMIN_EMAIL || "admin@bps.go.id",
      password: process.env.SEED_ADMIN_PASSWORD || "password123",
      username: "admin",
    },
  })
  await prisma.user.update({
    where: { id: admin.user.id },
    data: { role: Role.admin },
  })
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@bps.go.id"
  console.log(`  ✓ admin — ${adminEmail} / ${process.env.SEED_ADMIN_PASSWORD || "password123"}`)

  const hr = await auth.api.signUpEmail({
    body: {
      name: process.env.SEED_HR_NAME || "Mbak Fitri",
      email: process.env.SEED_HR_EMAIL || "hrd@bps.go.id",
      password: process.env.SEED_HR_PASSWORD || "password123",
      username: "hrd",
    },
  })
  await prisma.user.update({
    where: { id: hr.user.id },
    data: { role: Role.hr },
  })
  const hrEmail = process.env.SEED_HR_EMAIL || "hrd@bps.go.id"
  console.log(`  ✓ hr — ${hrEmail} / ${process.env.SEED_HR_PASSWORD || "password123"}`)

  const supervisor = await auth.api.signUpEmail({
    body: {
      name: process.env.SEED_SUPERVISOR_NAME || "Pak Dedi",
      email: process.env.SEED_SUPERVISOR_EMAIL || "supervisor@bps.go.id",
      password: process.env.SEED_SUPERVISOR_PASSWORD || "password123",
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
      teamId: teamUmum.id,
      phone: "081234567890",
      email: process.env.SEED_SUPERVISOR_EMAIL || "supervisor@bps.go.id",
    },
  })
  const supervisorEmail = process.env.SEED_SUPERVISOR_EMAIL || "supervisor@bps.go.id"
  console.log(`  ✓ supervisor — ${supervisorEmail} / ${process.env.SEED_SUPERVISOR_PASSWORD || "password123"}`)

  const intern = await auth.api.signUpEmail({
    body: {
      name: process.env.SEED_INTERN_NAME || "Rizky",
      email: process.env.SEED_INTERN_EMAIL || "intern@bps.go.id",
      password: process.env.SEED_INTERN_PASSWORD || "password123",
      username: "intern",
    },
  })
  await prisma.internProfile.create({
    data: {
      userId: intern.user.id,
      nik: "3273012345678901",
      institution: "Universitas Siliwangi",
      phone: "081298765432",
      email: process.env.SEED_INTERN_EMAIL || "intern@bps.go.id",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-12-31"),
      teamId: teamUmum.id,
      status: "active",
    },
  })
  const internEmail = process.env.SEED_INTERN_EMAIL || "intern@bps.go.id"
  console.log(`  ✓ intern — ${internEmail} / ${process.env.SEED_INTERN_PASSWORD || "password123"}`)

  console.log("\nSeed complete!")
}
