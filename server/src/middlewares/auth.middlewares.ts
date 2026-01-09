import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../services/auth.services";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

/**
 * Middleware that ensures the request is authenticated.
 * Attaches `session.user` to `req.user` on success.
 */
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new ApiError(401, "Unauthorized");
    }

    // NOTE: `req.user` is not part of Express' default Request type.
    // You should augment the Express namespace to include it.
    // @ts-ignore
    req.user = session.user;

    next();
  }
);
