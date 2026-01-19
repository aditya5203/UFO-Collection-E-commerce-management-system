import { Request, Response, NextFunction } from "express";
import { adService } from "../services/ads.service";

function getAdminEmail(req: Request) {
  const u: any = (req as any).user || (req as any).admin;
  return String(u?.email || u?.username || "admin").trim();
}

function pickUploaded(req: Request) {
  // multer fields() => req.files is an object: { file?: [..], files?: [..] }
  const filesObj: any = (req as any).files || {};
  const single: Express.Multer.File | undefined = filesObj?.file?.[0];
  const multi: Express.Multer.File[] = Array.isArray(filesObj?.files) ? filesObj.files : [];
  return { single, multi };
}

/**
 * PUBLIC:
 *  GET /api/ads?position=Home%20Top&status=Active
 */
export const adsController = {
  publicList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await adService.publicList(req.query);
      return res.json(items); // homepage supports array directly
    } catch (err) {
      return next(err);
    }
  },

  /* ---------------- ADMIN ---------------- */

  adminList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await adService.adminList(req.query);
      return res.json({ success: true, items });
    } catch (err) {
      return next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const changedBy = getAdminEmail(req);
      const { single, multi } = pickUploaded(req);

      const ad = await adService.create(req.body, single, multi, changedBy);
      return res.status(201).json({ success: true, item: ad });
    } catch (err) {
      return next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const changedBy = getAdminEmail(req);
      const { single, multi } = pickUploaded(req);

      const ad = await adService.update(req.params.id, req.body, single, multi, changedBy);
      return res.json({ success: true, item: ad });
    } catch (err) {
      return next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const changedBy = getAdminEmail(req);
      await adService.remove(req.params.id, changedBy);
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  },

  toggle: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const changedBy = getAdminEmail(req);
      const makeActive = String(req.body?.active) === "true" || req.body?.active === true;

      const ad = await adService.toggleActive(req.params.id, makeActive, changedBy);
      return res.json({ success: true, item: ad });
    } catch (err) {
      return next(err);
    }
  },

  historyList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await adService.historyList(req.query);
      return res.json({ success: true, items });
    } catch (err) {
      return next(err);
    }
  },
};
