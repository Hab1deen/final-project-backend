import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

// ดึงใบเสนอราคาทั้งหมด
export const getAllQuotations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.query;

    const quotations = await prisma.quotation.findMany({
      where: status ? { status: status as string } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        _count: {
          select: {
            items: true,
            images: true,
            signatures: true
          }
        }
      }
    });

    return successResponse(res, quotations, 'ดึงข้อมูลใบเสนอราคาสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ดึงใบเสนอราคา 1 ใบ
export const getQuotationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        images: true,
        signatures: true,
        invoice: true
      }
    });

    if (!quotation) {
      throw new AppError('ไม่พบใบเสนอราคานี้', 404);
    }

    return successResponse(res, quotation, 'ดึงข้อมูลใบเสนอราคาสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// สร้างใบเสนอราคาใหม่
export const createQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      items,
      discount = 0,
      vat = 7,
      notes,
      validUntil
    } = req.body;

    // Validation
    if (!customerName) {
      throw new AppError('กรุณากรอกชื่อลูกค้า', 400);
    }

    if (!items || items.length === 0) {
      throw new AppError('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ', 400);
    }

    // คำนวณยอดรวม
    let subtotal = 0;
    const itemsData = items.map((item: any) => {
      const itemTotal = item.quantity * item.price;
      subtotal += itemTotal;
      return {
        productId: item.productId,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: itemTotal
      };
    });

    const discountAmount = parseFloat(discount.toString());
    const vatPercent = parseFloat(vat.toString());
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatAmount = (subtotalAfterDiscount * vatPercent) / 100;
    const total = subtotalAfterDiscount + vatAmount;

    // สร้างเลขที่ใบเสนอราคา
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.quotation.count() + 1;
    const quotationNo = `QT${year}${month}${String(count).padStart(4, '0')}`;

    // สร้างใบเสนอราคา
    const quotation = await prisma.quotation.create({
      data: {
        quotationNo,
        customerId: customerId ? parseInt(customerId) : null,
        customerName,
        customerPhone,
        customerAddress,
        subtotal,
        discount: discountAmount,
        vat: vatPercent,
        total,
        notes,
        validUntil: validUntil ? new Date(validUntil) : null,
        items: {
          create: itemsData
        }
      },
      include: {
        customer: true,
        items: true
      }
    });

    return successResponse(res, quotation, 'สร้างใบเสนอราคาสำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// แก้ไขใบเสนอราคา
export const updateQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      discount,
      vat,
      notes,
      status
    } = req.body;

    // ตรวจสอบว่ามีใบเสนอราคานี้หรือไม่
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    });

    if (!existingQuotation) {
      throw new AppError('ไม่พบใบเสนอราคานี้', 404);
    }

    // คำนวณยอดรวมใหม่ (ถ้ามีการแก้ไข items)
    let updateData: any = {
      customerName,
      customerPhone,
      customerAddress,
      notes,
      status
    };

    if (items && items.length > 0) {
      let subtotal = 0;
      const itemsData = items.map((item: any) => {
        const itemTotal = item.quantity * item.price;
        subtotal += itemTotal;
        return {
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: itemTotal
        };
      });

      const discountAmount = discount !== undefined ? parseFloat(discount) : existingQuotation.discount;
      const vatPercent = vat !== undefined ? parseFloat(vat) : existingQuotation.vat;
      const subtotalAfterDiscount = subtotal - Number(discountAmount);
      const vatAmount = (subtotalAfterDiscount * Number(vatPercent)) / 100;
      const total = subtotalAfterDiscount + vatAmount;

      // ลบรายการเก่าทั้งหมด
      await prisma.quotationItem.deleteMany({
        where: { quotationId: parseInt(id) }
      });

      updateData = {
        ...updateData,
        subtotal,
        discount: discountAmount,
        vat: vatPercent,
        total,
        items: {
          create: itemsData
        }
      };
    }

    const quotation = await prisma.quotation.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        customer: true,
        items: true
      }
    });

    return successResponse(res, quotation, 'แก้ไขใบเสนอราคาสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ลบใบเสนอราคา
export const deleteQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.quotation.delete({
      where: { id: parseInt(id) }
    });

    return successResponse(res, null, 'ลบใบเสนอราคาสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// แปลงใบเสนอราคาเป็นใบแจ้งหนี้
export const convertToInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    });

    if (!quotation) {
      throw new AppError('ไม่พบใบเสนอราคานี้', 404);
    }

    if (quotation.status === 'converted') {
      throw new AppError('ใบเสนอราคานี้ถูกแปลงเป็นใบแจ้งหนี้แล้ว', 400);
    }

    // สร้างเลขที่ใบแจ้งหนี้
    const year = new Date().getFullYear() + 543;
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.invoice.count() + 1;
    const invoiceNo = `INV${year}${month}${String(count).padStart(4, '0')}`;

    // สร้างใบแจ้งหนี้
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        quotationId: quotation.id,
        customerId: quotation.customerId,
        customerName: quotation.customerName,
        customerPhone: quotation.customerPhone,
        customerAddress: quotation.customerAddress,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        vat: quotation.vat,
        total: quotation.total,
        remainingAmount: quotation.total,
        items: {
          create: quotation.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          }))
        }
      },
      include: {
        items: true
      }
    });

    // อัพเดทสถานะใบเสนอราคา
    await prisma.quotation.update({
      where: { id: parseInt(id) },
      data: { status: 'converted' }
    });

    return successResponse(res, invoice, 'แปลงเป็นใบแจ้งหนี้สำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};