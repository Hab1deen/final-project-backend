import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationParams, createPaginatedResponse } from '../utils/paginationHelper';
import emailService from '../services/email.service';
import pdfService from '../services/pdf.service';

// ดึงใบเสร็จทั้งหมด
export const getAllReceipts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const receipts = await prisma.receipt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          include: {
            customer: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // แปลงข้อมูลให้ตรงกับ Frontend
    const formattedReceipts = receipts.map(receipt => ({
      id: receipt.id,
      receiptNo: receipt.receiptNo,
      invoiceId: receipt.invoiceId,
      invoiceNo: receipt.invoice.invoiceNo,
      customerName: receipt.invoice.customer?.name || receipt.invoice.customerName,
      amount: receipt.amount.toString(),
      paymentMethod: receipt.paymentMethod,
      notes: receipt.notes,
      createdAt: receipt.createdAt,
      invoice: receipt.invoice,
      user: receipt.user
    }));

    return successResponse(res, formattedReceipts, 'ดึงข้อมูลใบเสร็จสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ดึงใบเสร็จ 1 ใบ
export const getReceiptById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const receipt = await prisma.receipt.findUnique({
      where: { id: parseInt(id) },
      include: {
        invoice: {
          include: {
            customer: true,
            items: {
              include: {
                product: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        signatures: true
      }
    });

    if (!receipt) {
      throw new AppError('ไม่พบใบเสร็จนี้', 404);
    }

    // แปลงข้อมูลให้ตรงกับ Frontend
    const formattedReceipt = {
      id: receipt.id,
      receiptNo: receipt.receiptNo,
      invoiceId: receipt.invoiceId,
      amount: receipt.amount.toString(),
      paymentMethod: receipt.paymentMethod,
      notes: receipt.notes,
      createdAt: receipt.createdAt,
      invoice: {
        invoiceNo: receipt.invoice.invoiceNo,
        customerName: receipt.invoice.customer?.name || receipt.invoice.customerName,
        customerPhone: receipt.invoice.customerPhone,
        customerAddress: receipt.invoice.customerAddress,
        total: receipt.invoice.total.toString()
      },
      user: receipt.user
    };

    return successResponse(res, formattedReceipt, 'ดึงข้อมูลใบเสร็จสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ดึงใบเสร็จตาม invoiceId
export const getReceiptsByInvoiceId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.params;

    const receipts = await prisma.receipt.findMany({
      where: { invoiceId: parseInt(invoiceId) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const formattedReceipts = receipts.map(receipt => ({
      id: receipt.id,
      receiptNo: receipt.receiptNo,
      invoiceId: receipt.invoiceId,
      amount: receipt.amount.toString(),
      paymentMethod: receipt.paymentMethod,
      notes: receipt.notes,
      createdAt: receipt.createdAt,
      user: receipt.user
    }));

    return successResponse(res, formattedReceipts, 'ดึงข้อมูลใบเสร็จสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// สร้างใบเสร็จ (เมื่อรับชำระเงิน)
export const createReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId, amount, paymentMethod, notes } = req.body;
    const userId = (req as any).user?.id;

    // ตรวจสอบว่ามี invoiceId
    if (!invoiceId) {
      throw new AppError('กรุณาระบุเลขที่ใบแจ้งหนี้', 400);
    }

    // ตรวจสอบว่ามี invoice จริง
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) }
    });

    if (!invoice) {
      throw new AppError('ไม่พบใบแจ้งหนี้นี้', 404);
    }

    // สร้างเลขที่ใบเสร็จ - แก้ไขให้หาเลขล่าสุด
    const lastReceipt = await prisma.receipt.findFirst({
      orderBy: { receiptNo: 'desc' }  // เปลี่ยนจาก id เป็น receiptNo
    });

    let nextNumber = 1;
    if (lastReceipt) {
      // แยกเลขออกจาก RECPT prefix
      const lastNumber = parseInt(lastReceipt.receiptNo.replace('RECPT', ''));
      nextNumber = lastNumber + 1;
    }

    const receiptNo = `RECPT${String(nextNumber).padStart(3, '0')}`;

    // ถ้าไม่มี userId ให้หา user ที่มีอยู่ในระบบ
    let finalUserId = userId;
    if (!finalUserId) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        throw new AppError('ไม่พบผู้ใช้ในระบบ กรุณาสร้างผู้ใช้ก่อน', 400);
      }
      finalUserId = firstUser.id;
    }

    // สร้างใบเสร็จ
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        invoiceId: parseInt(invoiceId),
        amount: parseFloat(amount),
        paymentMethod,
        notes: notes || null,
        userId: finalUserId
      },
      include: {
        invoice: {
          include: {
            customer: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const formattedReceipt = {
      id: receipt.id,
      receiptNo: receipt.receiptNo,
      invoiceId: receipt.invoiceId,
      invoiceNo: receipt.invoice.invoiceNo,
      customerName: receipt.invoice.customer?.name || receipt.invoice.customerName,
      amount: receipt.amount.toString(),
      paymentMethod: receipt.paymentMethod,
      notes: receipt.notes,
      createdAt: receipt.createdAt,
      invoice: receipt.invoice,
      user: receipt.user
    };

    // ส่ง email ใบเสร็จให้ลูกค้า (ถ้ามี email)
    if (receipt.invoice.customer?.email) {
      try {
        console.log(`[EMAIL] Attempting to send receipt email to: ${receipt.invoice.customer.email}`);

        const fullReceipt = await prisma.receipt.findUnique({
          where: { id: receipt.id },
          include: {
            invoice: {
              include: {
                customer: true
              }
            }
          }
        });

        if (fullReceipt) {
          let pdfBuffer: Buffer | undefined;
          try {
            pdfBuffer = await pdfService.generateReceiptPDF(fullReceipt);
            console.log('[EMAIL] ✓ Receipt PDF generated successfully');
          } catch (pdfError) {
            console.error('[EMAIL] ✗ Receipt PDF generation failed (will send email without PDF):', pdfError instanceof Error ? pdfError.message : pdfError);
          }

          await emailService.sendReceiptToCustomer(fullReceipt, pdfBuffer);
          console.log(`[EMAIL] ✓ Receipt email sent to customer`);
        }
      } catch (emailError) {
        console.error('[EMAIL] ✗ Error sending receipt email:', emailError instanceof Error ? emailError.message : emailError);
        // ไม่ให้ fail ทั้งหมดถ้าส่ง email ไม่ได้
      }
    }

    return successResponse(res, formattedReceipt, 'สร้างใบเสร็จสำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// ลบใบเสร็จ
export const deleteReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ามีใบเสร็จหรือไม่
    const receipt = await prisma.receipt.findUnique({
      where: { id: parseInt(id) }
    });

    if (!receipt) {
      throw new AppError('ไม่พบใบเสร็จนี้', 404);
    }

    // ลบใบเสร็จ
    await prisma.receipt.delete({
      where: { id: parseInt(id) }
    });

    return successResponse(res, null, 'ลบใบเสร็จสำเร็จ');
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
    const { signatureData, signedBy } = req.body;

    const receipt = await prisma.receipt.findUnique({
      where: { id: parseInt(id) }
    });

    if (!receipt) {
      throw new AppError('ไม่พบใบเสร็จนี้', 404);
    }

    const signature = await prisma.receiptSignature.create({
      data: {
        receiptId: parseInt(id),
        signatureData,
        signedBy
      }
    });

    return successResponse(res, signature, 'เพิ่มลายเซ็นสำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};