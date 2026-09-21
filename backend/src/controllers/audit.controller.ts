import { Request, Response, NextFunction } from 'express';
import * as auditService from '../services/audit.service';
import { ListAuditLogsQuery } from '../validators/audit.validator';

export const getAuditLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListAuditLogsQuery;
    const result = await auditService.listAuditLogs(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};
