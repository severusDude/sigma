import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import IssueView from "@/features/supervisor/pages/issue-view";
import { issueInclude } from "@/features/supervisor/types/issue-types";
import Loading from "./loading";

async function IssueViewFetcher({ id }: { id: string }) {
  const { user } = await requireAuth([Role.admin, Role.supervisor]);

  const supervisorProfile = await prisma.supervisorProfile.findUnique({
    where: { userId: user.id },
  });
  if (!supervisorProfile) notFound();

  const issue = await prisma.issue.findFirst({
    where: {
      id,
      supervisorProfileId: supervisorProfile.id,
      deletedAt: null,
    },
    include: {
      ...issueInclude,
      logbooks: {
        where: { deletedAt: null },
        include: {
          internProfile: {
            include: {
              user: {
                select: { name: true, image: true },
              },
            },
          },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!issue) notFound();

  return <IssueView issue={issue} />;
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<Loading />}>
      <IssueViewFetcher id={id} />
    </Suspense>
  );
}
