import { Response } from 'express';

export const successResponse = (
  res: Response,
  data: any,
  message: string = 'สำเร็จ',
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (
  res: Response,
  message: string = 'เกิดข้อผิดพลาด',
  statusCode: number = 400
) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};