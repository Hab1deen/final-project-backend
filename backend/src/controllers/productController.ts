import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

// ดึงสินค้าทั้งหมด
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, products, 'ดึงข้อมูลสินค้าสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ดึงสินค้า 1 รายการ
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      throw new AppError('ไม่พบสินค้านี้', 404);
    }

    return successResponse(res, product, 'ดึงข้อมูลสินค้าสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// เพิ่มสินค้าใหม่
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, price, unit } = req.body;

    // Validation
    if (!name || !price) {
      throw new AppError('กรุณากรอกชื่อสินค้าและราคา', 400);
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        unit: unit || 'ชิ้น'
      }
    });

    return successResponse(res, product, 'เพิ่มสินค้าสำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// แก้ไขสินค้า
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, price, unit, isActive } = req.body;

    // เช็คว่ามีสินค้านี้ไหม
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      throw new AppError('ไม่พบสินค้านี้', 404);
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : existingProduct.price,
        unit,
        isActive
      }
    });

    return successResponse(res, product, 'แก้ไขสินค้าสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ลบสินค้า (Soft Delete)
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    return successResponse(res, product, 'ลบสินค้าสำเร็จ');
  } catch (error) {
    next(error);
  }
};