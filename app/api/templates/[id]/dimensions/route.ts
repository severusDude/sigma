import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getObjectBuffer } from "@/services/storage";
import { getPdfDimensions } from "@/lib/pdf-certificate";
import { assertStorageHealthy, StorageError } from "@/services/storage-health";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const template = await prisma.documentTemplate.findUnique({
    where: { id },
    select: { content: true },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  await assertStorageHealthy();

  try {
    const buffer = await getObjectBuffer(template.content);
    const dimensions = await getPdfDimensions(buffer);

    return NextResponse.json(dimensions);
  } catch (e) {
    if (e instanceof StorageError) {
      return NextResponse.json({ error: e.userMessage }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to read PDF dimensions" },
      { status: 500 },
    );
  }
}
