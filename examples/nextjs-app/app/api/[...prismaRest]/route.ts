import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { nextjsAdapter } from "prisma-rest";
import { withValidation } from "prisma-rest";

const prisma = new PrismaClient();

// Create the handler once
const handler = nextjsAdapter(prisma, {
  guards: withValidation(),
  hooks: {
    // Example: auto-set timestamps
    "*": {
      POST: ({ body }) => {
        body.createdAt = new Date();
        body.updatedAt = new Date();
      },
      PUT: ({ body }) => {
        body.updatedAt = new Date();
      },
      PATCH: ({ body }) => {
        body.updatedAt = new Date();
      },
    },
  },
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

export async function PUT(request: NextRequest) {
  return handler(request);
}

export async function PATCH(request: NextRequest) {
  return handler(request);
}

export async function DELETE(request: NextRequest) {
  return handler(request);
}