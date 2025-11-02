import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

// ดึงใบแจ้งหนี้ทั้งหมด
export const getAllInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.query;

    const invoices = await prisma.invoice.findMany({
      where: status ? { status: status as string } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        quotation: true,
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        _count: {
          select: {
            items: true,
            images: true,
            signatures: true,
            payments: true
          }
        }
      }
    });

    return successResponse(res, invoices, 'ดึงข้อมูลใบแจ้งหนี้สำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ดึงใบแจ้งหนี้ 1 ใบ
export const getInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        quotation: true,
        items: {
          include: {
            product: true
          }
        },
        images: true,
        signatures: true,
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        appointments: true
      }
    });

    if (!invoice) {
      throw new AppError('ไม่พบใบแจ้งหนี้นี้', 404);
    }

    return successResponse(res, invoice, 'ดึงข้อมูลใบแจ้งหนี้สำเร็จ');
  } catch (error) {
    next(error);
  }
};

// สร้างใบแจ้งหนี้ใหม่
export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      quotationId,
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      items,
      discount = 0,
      vat = 7,
      dueDate,
      notes
    } = req.body;

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

    // สร้างเลขที่ใบแจ้งหนี้
    const year = new Date().getFullYear() + 543;
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.invoice.count() + 1;
    const invoiceNo = `INV${year}${month}${String(count).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        quotationId: quotationId ? parseInt(quotationId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        customerName,
        customerPhone,
        customerAddress,
        subtotal,
        discount: discountAmount,
        vat: vatPercent,
        total,
        remainingAmount: total,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        items: {
          create: itemsData
        }
      },
      include: {
        customer: true,
        items: true
      }
    });

    return successResponse(res, invoice, 'สร้างใบแจ้งหนี้สำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// อัพเดทสถานะใบแจ้งหนี้
export const updateInvoiceStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('กรุณาระบุสถานะ', 400);
    }

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        status,
        paidDate: status === 'paid' ? new Date() : null
      },
      include: {
        items: true,
        payments: true
      }
    });

    return successResponse(res, invoice, 'อัพเดทสถานะสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// บันทึกการชำระเงิน
export const recordPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'cash', notes } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('กรุณาระบุจำนวนเงินที่ชำระ', 400);
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: { payments: true }
    });

    if (!invoice) {
      throw new AppError('ไม่พบใบแจ้งหนี้นี้', 404);
    }

    const paymentAmount = parseFloat(amount);
    const newPaidAmount = Number(invoice.paidAmount) + paymentAmount;
    const newRemainingAmount = Number(invoice.total) - newPaidAmount;

    // บันทึกการชำระเงิน
    await prisma.payment.create({
      data: {
        invoiceId: parseInt(id),
        amount: paymentAmount,
        paymentMethod,
        notes
      }
    });

    // อัพเดทยอดชำระในใบแจ้งหนี้
    let newStatus = invoice.status;
    if (newRemainingAmount <= 0) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paidDate: newStatus === 'paid' ? new Date() : null
      },
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return successResponse(res, updatedInvoice, 'บันทึกการชำระเงินสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ลบใบแจ้งหนี้
export const deleteInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.invoice.delete({
      where: { id: parseInt(id) }
    });

    return successResponse(res, null, 'ลบใบแจ้งหนี้สำเร็จ');
  } catch (error) {
    next(error);
  }
};