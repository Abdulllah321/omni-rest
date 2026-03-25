"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const express_2 = require("prisma-rest/express");
const prisma_rest_1 = require("prisma-rest");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const prisma_rest_2 = require("prisma-rest");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Generate OpenAPI spec lazily (only when /docs is accessed)
let openApiSpec = null;
const getOpenApiSpec = () => {
    if (!openApiSpec) {
        openApiSpec = (0, prisma_rest_2.generateOpenApiSpec)({
            title: "Express API with prisma-rest",
            version: "1.0.0",
            basePath: "/api",
        });
    }
    return openApiSpec;
};
// Serve Swagger UI
app.use("/docs", swagger_ui_express_1.default.serve, (req, res, next) => {
    swagger_ui_express_1.default.setup(getOpenApiSpec())(req, res, next);
});
// Mount prisma-rest with validation
app.use("/api", (0, express_2.expressAdapter)(prisma, {
    guards: (0, prisma_rest_1.withValidation)(),
    hooks: {
        // Example hook: log all creates
        "*": {
            POST: ({ body, result }) => {
                console.log(`Created ${result.model}:`, result.data);
            },
        },
    },
}));
app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
    console.log("📖 API docs at http://localhost:3000/docs");
});
