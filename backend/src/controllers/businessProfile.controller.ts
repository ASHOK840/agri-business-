import { Request, Response, NextFunction } from 'express';
import * as businessProfileService from '../services/businessProfile.service';

export const getProfile = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await businessProfileService.getBusinessProfile();

    // Not an error: it's normal for a fresh install to have no profile
    // configured yet. The frontend renders an empty form in that case.
    res.status(200).json({ status: 'ok', data: profile });
  } catch (error) {
    next(error);
  }
};

export const putProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await businessProfileService.upsertBusinessProfile(req.body);
    res.status(200).json({ status: 'ok', data: profile });
  } catch (error) {
    next(error);
  }
};

export const postLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No logo file was uploaded.',
      });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;
    const profile = await businessProfileService.updateBusinessLogo(logoUrl);

    if (!profile) {
      return res.status(400).json({
        status: 'error',
        message: 'Save the business profile details before uploading a logo.',
      });
    }

    res.status(200).json({ status: 'ok', data: profile });
  } catch (error) {
    next(error);
  }
};
