import { vi } from "vitest";

/**
 * A mock Prisma client that mimics the delegate structure.
 * Each model has all CRUD methods as vi.fn() spies.
 * _runtimeDataModel is populated so getModels() works without
 * needing to require @prisma/client.
 */
export function createMockPrisma() {
  const makeDelegate = (overrides: Record<string, any> = {}) => ({
    findMany: vi.fn().mockResolvedValue([{ id: 1, name: "Test Record" }]),
    findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Test Record" }),
    create: vi.fn().mockResolvedValue({ id: 2, name: "New Record" }),
    update: vi.fn().mockResolvedValue({ id: 1, name: "Updated Record" }),
    delete: vi.fn().mockResolvedValue({ id: 1 }),
    count: vi.fn().mockResolvedValue(1),
    ...overrides,
  });

  const prisma = {
    user: makeDelegate(),
    department: makeDelegate(),
    category: makeDelegate(),
    $transaction: vi.fn((ops: Promise<any>[]) => Promise.all(ops)),
    // Provide _runtimeDataModel so getModels() resolves without @prisma/client
    _runtimeDataModel: {
      models: {
        User: {
          fields: [
            { name: "id", isId: true, type: "Int", isRequired: true, isList: false, kind: "scalar" },
            { name: "name", isId: false, type: "String", isRequired: true, isList: false, kind: "scalar" },
            { name: "email", isId: false, type: "String", isRequired: true, isList: false, kind: "scalar" },
          ],
        },
        Department: {
          fields: [
            { name: "id", isId: true, type: "Int", isRequired: true, isList: false, kind: "scalar" },
            { name: "name", isId: false, type: "String", isRequired: true, isList: false, kind: "scalar" },
          ],
        },
        Category: {
          fields: [
            { name: "id", isId: true, type: "Int", isRequired: true, isList: false, kind: "scalar" },
            { name: "label", isId: false, type: "String", isRequired: true, isList: false, kind: "scalar" },
          ],
        },
      },
    },
  };

  return prisma;
}