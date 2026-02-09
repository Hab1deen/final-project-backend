import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import path from 'path';
import fs from 'fs';

// Upload single image
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new AppError('กรุณาเลือกไฟล์รูปภาพ', 400);
    }

    // ส่งกลับเป็น relative path
    const imageUrl = `/uploads/${req.file.filename}`;

    return successResponse(res, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: imageUrl, // relative path
      size: req.file.size,
      mimetype: req.file.mimetype
    }, 'อัพโหลดรูปภาพสำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// Upload multiple images
export const uploadMultipleImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new AppError('กรุณาเลือกไฟล์รูปภาพ', 400);
    }

    const files = req.files as Express.Multer.File[];
    const images = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`, // relative path
      size: file.size,
      mimetype: file.mimetype
    }));

    return successResponse(res, images, 'อัพโหลดรูปภาพสำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// Delete image
export const deleteImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('ไม่พบไฟล์รูปภาพ', 404);
    }

    fs.unlinkSync(filePath);

    return successResponse(res, null, 'ลบรูปภาพสำเร็จ');
  } catch (error) {
    next(error);
  }
};