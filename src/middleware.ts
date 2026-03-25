import type { GuardMap, HookFn, HookContext } from "./types";

/**
 * Runs the guard for the given model+method combo.
 * Returns an error string if blocked, null if allowed.
 */
export async function runGuard(
  guards: GuardMap,
  model: string,
  method: string,
  ctx: { id?: string | null; body?: any }
): Promise<string | null> {
  const modelGuards = guards[model];
  if (!modelGuards) return null;

  const fn = modelGuards[method as keyof typeof modelGuards];
  if (!fn) return null;

  return fn({ ...ctx, method });
}

/**
 * Runs a lifecycle hook (beforeOperation / afterOperation).
 * Silently swallows errors so hooks never crash the main flow.
 */
export async function runHook(
  hook: HookFn | undefined,
  ctx: HookContext
): Promise<void> {
  if (!hook) return;
  try {
    await hook(ctx);
  } catch (e) {
    // Hooks should not crash the request
    console.error("[omni-rest] Hook error:", e);
  }
}