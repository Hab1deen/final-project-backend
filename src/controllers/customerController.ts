import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

// ดึงลูกค้าทั้งหมด
export const getAllCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            quotations: true,
            invoices: true
          }
        }
      }
    });

    return successResponse(res, customers, 'ดึงข้อมูลลูกค้าสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ดึงลูกค้า 1 รายการ
export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!customer) {
      throw new AppError('ไม่พบลูกค้านี้', 404);
    }

    return successResponse(res, customer, 'ดึงข้อมูลลูกค้าสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// เพิ่มลูกค้าใหม่
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, phone, address, taxId } = req.body;

    // Validation
    if (!name) {
      throw new AppError('กรุณากรอกชื่อลูกค้า', 400);
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        taxId
      }
    });

    return successResponse(res, customer, 'เพิ่มลูกค้าสำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// แก้ไขลูกค้า
export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, taxId } = req.body;

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        address,
        taxId
      }
    });

    return successResponse(res, customer, 'แก้ไขข้อมูลลูกค้าสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ลบลูกค้า
export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id: parseInt(id) }
    });

    return successResponse(res, null, 'ลบลูกค้าสำเร็จ');
  } catch (error) {
    next(error);
  }
};