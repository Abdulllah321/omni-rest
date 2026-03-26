// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
import type { PrismaRestOptions } from "../types";

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
export function nestjsController(
  prisma: PrismaClient,
  options: PrismaRestOptions = {},
  prefix: string = "api"
): any {
  // We lazily require NestJS specific decorators so they don't break applications that don't have `@nestjs/common`
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, Req, Res, HttpStatus } = require("@nestjs/common");
  const { handle } = createRouter(prisma, options);

  const getSearchParams = (query: Record<string, string>): URLSearchParams => {
    return new URLSearchParams(
      Object.entries(query || {})
        .map(([k, v]) => `${k}=${v}`)
        .join("&")
    );
  };

  @Controller(prefix)
  class OmniRestDynamicController {
    
    @Patch(":model/bulk/update")
    async bulkUpdate(
      @Param("model") model: string,
      @Body() body: any[],
      @Query() query: any,
      @Res() res: any
    ) {
      try {
        const { status, data } = await handle("PATCH", model, null, body ?? [], getSearchParams(query), "bulk-update");
        if (status === 204) return res.status(HttpStatus.NO_CONTENT).send();
        return res.status(status).json(data);
      } catch (e: any) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
      }
    }

    @Delete(":model/bulk/delete")
    async bulkDelete(
      @Param("model") model: string,
      @Body() body: any[],
      @Query() query: any,
      @Res() res: any
    ) {
      try {
        const { status, data } = await handle("DELETE", model, null, body ?? [], getSearchParams(query), "bulk-delete");
        if (status === 204) return res.status(HttpStatus.NO_CONTENT).send();
        return res.status(status).json(data);
      } catch (e: any) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
      }
    }

    @Get(":model")
    async list(
      @Param("model") model: string,
      @Query() query: any,
      @Res() res: any
    ) {
      return await this._processRequest("GET", model, null, {}, query, res);
    }

    @Post(":model")
    async create(
      @Param("model") model: string,
      @Body() body: any,
      @Query() query: any,
      @Res() res: any
    ) {
      return await this._processRequest("POST", model, null, body, query, res);
    }

    @Get(":model/:id")
    async read(
      @Param("model") model: string,
      @Param("id") id: string,
      @Query() query: any,
      @Res() res: any
    ) {
      return await this._processRequest("GET", model, id, {}, query, res);
    }

    @Put(":model/:id")
    async replace(
      @Param("model") model: string,
      @Param("id") id: string,
      @Body() body: any,
      @Query() query: any,
      @Res() res: any
    ) {
      return await this._processRequest("PUT", model, id, body, query, res);
    }

    @Patch(":model/:id")
    async update(
      @Param("model") model: string,
      @Param("id") id: string,
      @Body() body: any,
      @Query() query: any,
      @Res() res: any
    ) {
      return await this._processRequest("PATCH", model, id, body, query, res);
    }

    @Delete(":model/:id")
    async remove(
      @Param("model") model: string,
      @Param("id") id: string,
      @Query() query: any,
      @Res() res: any
    ) {
      return await this._processRequest("DELETE", model, id, {}, query, res);
    }

    private async _processRequest(
      method: string, 
      model: string, 
      id: string | null, 
      body: any, 
      query: any, 
      res: any
    ) {
      try {
        const { status, data } = await handle(method, model, id, body ?? {}, getSearchParams(query));
        if (status === 204) {
          return res.status(HttpStatus.NO_CONTENT).send();
        }
        return res.status(status).json(data);
      } catch (e: any) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
      }
    }
  }

  return OmniRestDynamicController;
}
