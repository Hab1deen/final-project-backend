import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationParams, createPaginatedResponse } from '../utils/paginationHelper';
import { emailNotificationService } from '../services/emailNotification.service';

// ดึงใบแจ้งหนี้ทั้งหมด
export const getAllInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, take, page: currentPage, limit: pageLimit } = getPaginationParams({ page, limit });

    const where = status ? { status: status as string } : {};

    const total = await prisma.invoice.count({ where });

    const invoices = await prisma.invoice.findMany({
      where,
      skip,
      take,
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

    const paginatedData = createPaginatedResponse(invoices, total, currentPage, pageLimit);

    return res.json({
      success: true,
      message: 'ดึงข้อมูลใบแจ้งหนี้สำเร็จ',
      ...paginatedData
    });
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
      notes,

      // --- [รับค่าเพิ่ม] ---
      workImages,        // รูปภาพผลงาน (After)
      acceptanceSignature // ลายเซ็นรับงาน
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

    // ถ้าสร้างจาก Quotation ให้ดึงข้อมูลมาเชื่อมโยงด้วย
    let quotationData = null;
    if (quotationId) {
      quotationData = await prisma.quotation.findUnique({
        where: { id: parseInt(quotationId) }
      });

      // อัปเดตสถานะ Quotation เป็น converted
      await prisma.quotation.update({
        where: { id: parseInt(quotationId) },
        data: { status: 'converted' }
      });
    }

    // สร้าง Invoice
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
        remainingAmount: total, // เริ่มต้นยอดคงเหลือ = ยอดรวม
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,

        // --- [บันทึกค่าใหม่ลง DB] ---
        workImages: workImages,                 // รูป After (ถ้ามีส่งมา)
        acceptanceSignature: acceptanceSignature, // ลายเซ็นรับงาน (ถ้ามีส่งมา)

        // กรณีแปลงจาก Quotation อาจจะดึงรูป Before มาเก็บไว้ด้วยก็ได้ 
        // หรือจะปล่อยให้ Linked กันผ่าน quotationId ก็ได้ (เลือกแบบ Linked ประหยัดที่กว่า)

        items: {
          create: itemsData
        }
      },
      include: {
        customer: true,
        items: true,
        quotation: true // include quotation เพื่อดูรูป Before
      }
    });

    return successResponse(res, invoice, 'สร้างใบแจ้งหนี้สำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// แก้ไขใบแจ้งหนี้
export const updateInvoice = async (
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
      dueDate,
      notes,
      status,
      workImages,           // รูปภาพผลงาน (After)
      acceptanceSignature   // ลายเซ็นรับงาน
    } = req.body;

    // ตรวจสอบว่ามีใบแจ้งหนี้นี้หรือไม่
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    });

    if (!existingInvoice) {
      throw new AppError('ไม่พบใบแจ้งหนี้นี้', 404);
    }

    // เตรียมข้อมูลสำหรับอัปเดต
    let updateData: any = {
      customerName,
      customerPhone,
      customerAddress,
      notes,
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined
    };

    // เพิ่มการอัปเดตรูปภาพและลายเซ็น (ถ้ามีส่งมา)
    if (workImages !== undefined) {
      updateData.workImages = workImages;
    }
    if (acceptanceSignature !== undefined) {
      updateData.acceptanceSignature = acceptanceSignature;
    }

    // ถ้ามีการแก้ไข items ให้คำนวณใหม่
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

      const discountAmount = discount !== undefined ? parseFloat(discount) : existingInvoice.discount;
      const vatPercent = vat !== undefined ? parseFloat(vat) : existingInvoice.vat;
      const subtotalAfterDiscount = subtotal - Number(discountAmount);
      const vatAmount = (subtotalAfterDiscount * Number(vatPercent)) / 100;
      const total = subtotalAfterDiscount + vatAmount;

      // คำนวณยอดคงเหลือใหม่
      const remainingAmount = total - Number(existingInvoice.paidAmount);

      // ลบรายการเก่าทั้งหมด
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: parseInt(id) }
      });

      updateData = {
        ...updateData,
        subtotal,
        discount: discountAmount,
        vat: vatPercent,
        total,
        remainingAmount,
        items: {
          create: itemsData
        }
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        customer: true,
        items: true,
        quotation: true,
        images: true,
        signatures: true,
        payments: true
      }
    });

    return successResponse(res, invoice, 'แก้ไขใบแจ้งหนี้สำเร็จ');
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
    const payment = await prisma.payment.create({
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

    // --- สร้างใบเสร็จรับเงินอัตโนมัติ ---
    const year = new Date().getFullYear() + 543;
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // หา receipt ล่าสุดในเดือนนี้
    const prefix = `REC${year}${month}`;
    const latestReceipt = await prisma.receipt.findFirst({
      where: {
        receiptNo: {
          startsWith: prefix
        }
      },
      orderBy: {
        receiptNo: 'desc'
      }
    });

    let runningNumber = 1;
    if (latestReceipt) {
      const lastNumber = parseInt(latestReceipt.receiptNo.slice(-4));
      runningNumber = lastNumber + 1;
    }

    const receiptNo = `${prefix}${String(runningNumber).padStart(4, '0')}`;

    // ดึง userId จาก req.user (ต้องมี auth middleware)
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่', 401);
    }

    // สร้างใบเสร็จ
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        invoiceId: parseInt(id),
        userId,
        amount: paymentAmount,
        paymentMethod,
        notes: notes || `ชำระเงินค่า ${invoice.invoiceNo}`
      }
    });

    console.log(`✅ สร้างใบเสร็จ ${receiptNo} สำเร็จ`);

    // ส่งการแจ้งเตือนทาง Email - รับชำระเงิน
    const lastPayment = updatedInvoice.payments[0]; // ล่าสุด
    await emailNotificationService.notifyPaymentReceived(lastPayment, updatedInvoice);

    // ถ้าชำระครบแล้ว ส่งการแจ้งเตือนพิเศษ
    if (newStatus === 'paid') {
      await emailNotificationService.notifyFullyPaid(updatedInvoice);
    }

    return successResponse(res, {
      invoice: updatedInvoice,
      receipt,
      message: `บันทึกการชำระเงินและสร้างใบเสร็จ ${receiptNo} สำเร็จ`
    }, 'บันทึกการชำระเงินสำเร็จ');
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

// เพิ่มลายเซ็น
export const addSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { type, signatureData, signerName } = req.body;

    // Validation
    if (!type || !signatureData || !signerName) {
      throw new AppError('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
    }

    if (type !== 'shop' && type !== 'customer') {
      throw new AppError('ประเภทลายเซ็นไม่ถูกต้อง', 400);
    }

    // ตรวจสอบว่ามีใบแจ้งหนี้นี้หรือไม่
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) }
    });

    if (!invoice) {
      throw new AppError('ไม่พบใบแจ้งหนี้นี้', 404);
    }

    // สร้างลายเซ็น
    const signature = await prisma.invoiceSignature.create({
      data: {
        invoiceId: parseInt(id),
        type,
        signatureUrl: signatureData, // base64 string
        signerName
      }
    });

    return successResponse(res, signature, 'บันทึกลายเซ็นสำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};