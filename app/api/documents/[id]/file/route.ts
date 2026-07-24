import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getObjectStream } from "@/services/storage";

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

  try {
    const { stream, contentType } = await getObjectStream(document.fileUrl);

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}