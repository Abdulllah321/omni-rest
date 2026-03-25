import { vi } from "vitest";

/**
 * A mock Prisma client that mimics the delegate structure.
 * Each model has all CRUD methods as vi.fn() spies.
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
  };

  return prisma;
}

/**
 * Mock DMMF used when vi.mock("@prisma/client") is active.
 * Add more models here as needed for tests.
 */
export const mockDMMF = {
  datamodel: {
    models: [
      {
        name: "User",
        fields: [
          { name: "id", isId: true, type: "Int", isRequired: true, isList: false, relationName: null },
          { name: "name", isId: false, type: "String", isRequired: true, isList: false, relationName: null },
          { name: "email", isId: false, type: "String", isRequired: true, isList: false, relationName: null },
        ],
      },
      {
        name: "Department",
        fields: [
          { name: "id", isId: true, type: "Int", isRequired: true, isList: false, relationName: null },
          { name: "name", isId: false, type: "String", isRequired: true, isList: false, relationName: null },
        ],
      },
      {
        name: "Category",
        fields: [
          { name: "id", isId: true, type: "Int", isRequired: true, isList: false, relationName: null },
          { name: "label", isId: false, type: "String", isRequired: true, isList: false, relationName: null },
        ],
      },
    ],
  },
};