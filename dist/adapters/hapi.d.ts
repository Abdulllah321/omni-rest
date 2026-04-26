import { PrismaClient } from '@prisma/client';
import { P as PrismaRestOptions } from '../types-s-sMlBeU.js';

interface HapiAdapterOptions extends PrismaRestOptions {
    prisma: PrismaClient;
    prefix?: string;
}
/**
 * Hapi plugin adapter for omni-rest.
 * Registers dynamic REST endpoints directly on the Hapi server instance.
 *
 * @example
 * ```ts
 * import Hapi from "@hapi/hapi";
 * import { PrismaClient } from "@prisma/client";
 * import { hapiAdapter } from "omni-rest/hapi";
 *
 * const prisma = new PrismaClient();
 * const server = Hapi.server({ port: 3000 });
 *
 * await server.register({
 *   plugin: hapiAdapter,
 *   options: {
 *     prisma,
 *     prefix: "/api",
 *     allow: ["product", "category"],
 *   }
 * });
 * ```
 */
declare const hapiAdapter: {
    name: string;
    version: string;
    register: (server: any, options: HapiAdapterOptions) => Promise<void>;
};

export { type HapiAdapterOptions, hapiAdapter };
