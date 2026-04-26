import { PrismaClient } from '@prisma/client';
import { P as PrismaRestOptions } from '../types-s-sMlBeU.js';

/**
 * NestJS adapter for omni-rest.
 * Generates a dynamic controller block that maps wildcard routes directly into omni-rest handlers.
 *
 * @example
 * ```ts
 * import { Controller, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
 * import { PrismaClient } from '@prisma/client';
 * import { nestjsController } from 'omni-rest/nestjs';
 *
 * const prisma = new PrismaClient();
 *
 * // Create generating Controller natively via factory
 * export const OmniRestController = nestjsController(prisma, {
 *   allow: ["product", "category"],
 * });
 *
 * @Module({
 *   controllers: [OmniRestController],
 * })
 * export class AppModule {}
 * ```
 */
declare function nestjsController(prisma: PrismaClient, options?: PrismaRestOptions, prefix?: string): any;

export { nestjsController };
