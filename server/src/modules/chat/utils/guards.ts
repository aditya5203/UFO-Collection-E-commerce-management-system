import { Request, Response, NextFunction } from "express";

function roleFromReq(req: Request) {
  // you may store role as req.user.role or req.user.user.role depending on your auth code
  const u: any = (req as any).user;
  return u?.role || u?.user?.role || null;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = roleFromReq(req);
  if (role !== "admin" && role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  next();
}

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  const role = roleFromReq(req);
  // allow normal user/customer
  if (!role || role === "admin" || role === "superadmin") {
    return res
      .status(403)
      .json({ success: false, message: "Customer only" });
  }
  next();
}
