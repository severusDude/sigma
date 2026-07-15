import { Prisma } from "../generated/prisma/client";
import { RELATION_MAP, SOFT_DELETE_MODELS, type RelationInfo } from "../generated/relation-map";

function excludeDeleted(
  where: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return where ? { AND: [where, { deletedAt: null }] } : { deletedAt: null };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ── nested-relation filter injection ──

function injectNestedFilters(
  args: Record<string, unknown>,
  modelName: string,
) {
  if (!isObject(args)) return;
  const rels = RELATION_MAP[modelName];
  if (!rels) return;

  for (const key of ["include", "select"] as const) {
    const container = args[key];
    if (!isObject(container)) continue;

    for (const r of rels) {
      if (!(r.fieldName in container)) continue;
      const val = container[r.fieldName];
      const isTarget = SOFT_DELETE_MODELS.has(r.relatedModel);

      if (val === true) {
        if (isTarget) container[r.fieldName] = { where: { deletedAt: null } };
        continue;
      }

      if (isObject(val)) {
        if (isTarget) {
          val.where = excludeDeleted(
            val.where as Record<string, unknown> | undefined,
          );
        }
        injectNestedFilters(val, r.relatedModel);
      }
    }
  }

  if (isObject(args.where)) filterWhereRelations(args.where, rels);
}

function filterWhereRelations(
  where: Record<string, unknown>,
  rels: RelationInfo[],
) {
  for (const logic of ["AND", "OR", "NOT"] as const) {
    const clause = where[logic];
    if (!clause) continue;
    for (const c of Array.isArray(clause) ? clause : [clause]) {
      if (isObject(c)) filterWhereRelations(c, rels);
    }
  }

  for (const r of rels) {
    if (!(r.fieldName in where)) continue;
    const val = where[r.fieldName];
    if (!isObject(val)) continue;
    if (!SOFT_DELETE_MODELS.has(r.relatedModel)) continue;

    const nestedRels = RELATION_MAP[r.relatedModel] ?? [];

    const andWrap = (obj: Record<string, unknown>) => {
      const wrapped = excludeDeleted(obj);
      const andArr = wrapped.AND;
      if (Array.isArray(andArr) && isObject(andArr[0]))
        filterWhereRelations(andArr[0], nestedRels);
      return wrapped;
    };

    if ("some" in val || "every" in val || "none" in val) {
      for (const q of ["some", "every", "none"] as const) {
        if (isObject(val[q])) andWrap(val[q]);
      }
    } else if ("is" in val) {
      if (isObject(val.is)) val.is = andWrap(val.is);
    } else if (!("isNot" in val)) {
      where[r.fieldName] = andWrap(val);
    }
  }
}

// ── custom method names to add per soft-delete model ──

const CUSTOM_METHODS = {
  async delete(args: { where: unknown; select?: unknown; include?: unknown }) {
    injectNestedFilters(args as Record<string, unknown>, this.constructor.name);
    return (this as unknown as { update: Function }).update({
      where: args.where,
      data: { deletedAt: new Date() },
      select: args.select,
      include: args.include,
    });
  },
  async deleteMany(args: { where?: unknown } = {}) {
    const where = excludeDeleted(
      args.where as Record<string, unknown> | undefined,
    );
    return (this as unknown as { updateMany: Function }).updateMany({
      where,
      data: { deletedAt: new Date() },
    });
  },
  async restore(args: { where: unknown; select?: unknown; include?: unknown }) {
    injectNestedFilters(args as Record<string, unknown>, this.constructor.name);
    return (this as unknown as { update: Function }).update({
      where: args.where,
      data: { deletedAt: null },
      select: args.select,
      include: args.include,
    });
  },
  async hardDelete(args: { where: unknown }) {
    return (this as unknown as { delete: Function }).delete({
      where: args.where,
    });
  },
} as const;

// ── build model extensions per soft-delete model ──

const modelExtensions: Record<string, Record<string, Function>> = {};
for (const name of SOFT_DELETE_MODELS) {
  modelExtensions[name] = { ...CUSTOM_METHODS };
}

// ── Prisma 7 type from generated namespace ──
type TMap = (typeof Prisma.defineExtension) extends (
  x: infer A,
) => unknown
  ? A extends { model?: infer M }
    ? M
    : never
  : never;

// ── export the factory ──

export function createSoftDeleteExtension() {
  return Prisma.defineExtension({
    name: "soft-delete",
    model: modelExtensions as TMap,
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const a = args as Record<string, unknown>;

          if (SOFT_DELETE_MODELS.has(model as string)) {
            if (
              [
                "findUnique",
                "findUniqueOrThrow",
                "findFirst",
                "findFirstOrThrow",
                "findMany",
                "count",
                "aggregate",
                "groupBy",
                "update",
                "updateMany",
                "updateManyAndReturn",
                "upsert",
              ].includes(operation as string)
            ) {
              a.where = excludeDeleted(
                a.where as Record<string, unknown> | undefined,
              );
            }
          }

          injectNestedFilters(a, model as string);

          return query(args);
        },
      },
    },
  });
}
