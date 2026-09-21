import { Request, Response, NextFunction } from 'express';
import * as assignmentService from '../services/staffAssignment.service';
import {
  PurchaseNotFoundError,
  StaffNotFoundError,
  AssignmentNotFoundError,
  TerminalStatusError,
} from '../services/staffAssignment.service';
import {
  ListStaffAssignmentsQuery,
  StaffWorkloadQuery,
} from '../validators/staffAssignment.validator';

export const getAssignments = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListStaffAssignmentsQuery;
    const result = await assignmentService.listAssignments(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getWorkload = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as StaffWorkloadQuery;
    const workload = await assignmentService.getStaffWorkload(query);
    res.status(200).json({ status: 'ok', data: workload });
  } catch (error) {
    next(error);
  }
};

export const getAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id);
    res.status(200).json({ status: 'ok', data: assignment });
  } catch (error) {
    if (error instanceof AssignmentNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.createAssignment(req.body);
    res.status(201).json({ status: 'ok', data: assignment });
  } catch (error) {
    if (error instanceof PurchaseNotFoundError || error instanceof StaffNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const putAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.updateAssignment(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: assignment });
  } catch (error) {
    if (error instanceof AssignmentNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof TerminalStatusError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchAssignmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.updateAssignmentStatus(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: assignment });
  } catch (error) {
    if (error instanceof AssignmentNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof TerminalStatusError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
