import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

// Reusable across every module: pass a Zod schema, get validated
// (and type-coerced) req.body, or a clean 400 response on failure.
export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed.',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Same pattern, for query-string params (e.g. ?page=1&limit=20&search=...).
// Express typings make req.query itself read-only in some versions, so the
// validated result is stashed on res.locals rather than reassigned.
export const validateQuery = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      res.locals.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid query parameters.',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
};
