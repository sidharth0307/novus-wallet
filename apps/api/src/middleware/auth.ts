import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    // Attach both userId AND role to the request object
    req.user = { 
      userId: decoded.userId, 
      role: decoded.role 
    };
    next();
  } catch (err: any) {
    return res.sendStatus(401);
  }
};