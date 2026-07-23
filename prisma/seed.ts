import "dotenv/config"

async function main() {
  const isProduction =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production" ||
    process.env.SEED_ENV === "production"

  if (isProduction) {
    const { default: seedProduction } = await import(
      "@/prisma/seed-production"
    )
    await seedProduction()
  } else {
    const { default: seedDevelopment } = await import(
      "@/prisma/seed-development"
    )
    await seedDevelopment()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
