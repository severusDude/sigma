import { prisma } from "@/lib/prisma";

export async function generateDocumentNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `CERT/${year}/${month}/`;

  const lastDoc = await prisma.document.findFirst({
    where: { documentNumber: { startsWith: prefix } },
    orderBy: { documentNumber: "desc" },
    select: { documentNumber: true },
  });

  const nextSeq = lastDoc
    ? String(Number(lastDoc.documentNumber.split("/").pop()) + 1).padStart(3, "0")
    : "001";

  return `${prefix}${nextSeq}`;
}
