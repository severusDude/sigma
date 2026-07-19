import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import fs from "fs";

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
    select: { fileUrl: true },
  });

  if (!document?.fileUrl) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(document.fileUrl);
    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}
