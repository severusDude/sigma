import { UserGetPayload } from "@/generated/prisma/models";

export type Intern = UserGetPayload<{ include: { internProfile: true } }>;
