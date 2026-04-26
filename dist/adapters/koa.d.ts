import { PrismaClient } from '@prisma/client';
import { P as PrismaRestOptions } from '../types-s-sMlBeU.js';

/**
 * Koa adapter for omni-rest.
 * Allows using omni-rest within a Koa application using @koa/router.
 *
 * @example
 * ```ts
 * import Koa from "koa";
 * import bodyParser from "koa-bodyparser";
 * import Router from "@koa/router";
 * import { PrismaClient } from "@prisma/client";
 * import { koaAdapter } from "omni-rest/koa";
 *
 * const app = new Koa();
 * const router = new Router({ prefix: "/api" });
 * const prisma = new PrismaClient();
 *
 * app.use(bodyParser());
 * koaAdapter(router, prisma, {
 *   allow: ["product", "category"],
 * });
 *
 * app.use(router.routes());
 * ```
 */
declare function koaAdapter(router: any, prisma: PrismaClient, options?: PrismaRestOptions): any;

export { koaAdapter };
