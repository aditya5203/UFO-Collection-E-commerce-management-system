import { Request, Response, NextFunction } from "express";

function roleFromReq(req: Request) {
  const u: any = (req as any).user;
  return u?.role || u?.user?.role || null;
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const role = roleFromReq(req);

  if (role !== "admin" && role !== "superadmin") {
    res.status(403).json({
      success: false,
      message: "Admin only",
    });
    return;
  }

  next();
}

export function requireCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const role = roleFromReq(req);

  if (!role || role === "admin" || role === "superadmin") {
    res.status(403).json({
      success: false,
      message: "Customer only",
    });
    return;
  }

  next();
}