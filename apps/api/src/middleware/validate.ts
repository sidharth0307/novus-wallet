import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body); 
      next();
    } catch (err: any) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors
      });
    }
};