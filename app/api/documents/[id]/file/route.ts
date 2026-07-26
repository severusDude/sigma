import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getObjectStream } from "@/services/storage";
import { assertStorageHealthy, StorageError } from "@/services/storage-health";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: {
      OR: [
        { id },
        { internProfile: { userId: id } },
      ],
    },
    select: { fileUrl: true, documentType: true },
  });

  if (!document?.fileUrl) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await assertStorageHealthy();

  try {
    const { stream, contentType } = await getObjectStream(document.fileUrl);

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    if (e instanceof StorageError) {
      return NextResponse.json({ error: e.userMessage }, { status: 503 });
    }
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}