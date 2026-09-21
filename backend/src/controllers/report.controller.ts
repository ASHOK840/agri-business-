import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { reportTypeEnum, ReportQuery } from '../validators/report.validator';
import { toCsv } from '../utils/csv.util';

export const getReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const typeResult = reportTypeEnum.safeParse(req.params.reportType);
    if (!typeResult.success) {
      return res.status(404).json({ status: 'error', message: 'Unknown report type.' });
    }

    const query = res.locals.query as ReportQuery;
    const result = await reportService.getReport(typeResult.data, query);

    if (query.format === 'csv') {
      // CSV export is a deliberate full download — pagination is a
      // browser-payload concern (see below), not a limit on what the
      // owner can export to a file they open elsewhere.
      const csv = toCsv(result.columns, result.rows);
      const filename = `${typeResult.data}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // A leading BOM so Excel opens UTF-8 CSVs (₹, etc.) without mangling them.
      return res.status(200).send(`﻿${csv}`);
    }

    // Summary totals must reflect ALL matching rows (computed above), but
    // only one page of rows is ever sent to the browser — "do not load
    // thousands of records into the browser unnecessarily".
    const { page, limit } = query;
    const total = result.rows.length;
    const pageRows = result.rows.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      status: 'ok',
      data: {
        ...result,
        rows: pageRows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};
