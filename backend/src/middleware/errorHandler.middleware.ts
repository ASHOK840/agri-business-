import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { InvalidFileTypeError } from '../config/upload';

// Final safety net — every controller already maps its own known
// error types to the right status code (see e.g. purchase.controller.ts),
// so reaching here means either a genuinely unexpected failure, or a
// Prisma error that slipped past a service's own pre-checks (e.g. a
// unique-constraint race). Either way: never leak the raw error
// (message, stack, SQL) to the client — log it server-side in full,
// respond with a safe, generic message.
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);

  // express.json() throws a SyntaxError (with a `status`/`statusCode` of
  // 400 set by body-parser) for malformed request JSON — a client
  // mistake, not a server failure, so it must not surface as a 500.
  const bodyParserStatus = (err as { status?: number; statusCode?: number }).status
    ?? (err as { status?: number; statusCode?: number }).statusCode;
  if (err instanceof SyntaxError && bodyParserStatus === 400 && 'body' in err) {
    return res.status(400).json({ status: 'error', message: 'Malformed JSON in request body.' });
  }

  // multer surfaces both "file too large" and fileFilter rejections
  // (config/upload.ts) as errors that bypass the controller's own
  // try/catch — they arrive here directly.
  if (err instanceof multer.MulterError || err instanceof InvalidFileTypeError) {
    return res.status(400).json({ status: 'error', message: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          status: 'error',
          message: 'A record with the same unique value already exists.',
        });
      case 'P2025':
        return res.status(404).json({
          status: 'error',
          message: 'The requested record was not found.',
        });
      case 'P2003':
        return res.status(409).json({
          status: 'error',
          message: 'This action conflicts with related records and cannot be completed.',
        });
      default:
        break;
    }
  }

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server.',
  });
};
