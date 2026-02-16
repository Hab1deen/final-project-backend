import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationParams, createPaginatedResponse } from '../utils/paginationHelper';
import emailService from '../services/email.service';
import pdfService from '../services/pdf.service';
import { v4 as uuidv4 } from 'uuid';
import { emailNotificationService } from '../services/emailNotification.service';

// ดึงใบเสนอราคาทั้งหมด
export const getAllQuotations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, take, page: currentPage, limit: pageLimit } = getPaginationParams({ page, limit });

    // สร้าง where clause
    const where = status ? { status: status as string } : {};

    // นับจำนวนทั้งหมด
    const total = await prisma.quotation.count({ where });

    // ดึงข้อมูลแบบ paginate
    const quotations = await prisma.quotation.findMany({
      where,
      skip,
      take,
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

    // Format response with pagination
    const paginatedData = createPaginatedResponse(quotations, total, currentPage, pageLimit);

    return res.json({
      success: true,
      message: 'ดึงข้อมูลใบเสนอราคาสำเร็จ',
      ...paginatedData
    });
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
  console.log('[DEBUG] createQuotation endpoint called');
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      discount = 0,
      vat = 7,
      notes,
      validUntil,
      images,
      siteImages,
      shopSignature, // เปลี่ยนจาก customerSignature
      signerName // ชื่อผู้เซ็น
    } = req.body;

    // Validation
    if (!customerName || !items || items.length === 0) {
      throw new AppError('ข้อมูลไม่ครบถ้วน', 400);
    }

    // คำนวณยอดรวม
    const itemsData = items.map((item: any) => {
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.price);
      return {
        productId: item.productId ? parseInt(item.productId) : null,
        productName: item.productName,
        description: item.description || null,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        total: itemTotal
      };
    });

    const subtotal = itemsData.reduce((sum: number, item: any) => {
      return sum + item.total;
    }, 0);

    const discountAmount = parseFloat(discount.toString());
    const vatPercent = parseFloat(vat.toString());
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatAmount = (subtotalAfterDiscount * vatPercent) / 100;
    const total = subtotalAfterDiscount + vatAmount;

    // สร้างเลขที่ใบเสนอราคา - แก้ไขให้หาเลขล่าสุดในเดือนนี้
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `QT${year}${month}`;

    // หา quotation ล่าสุดในเดือนนี้
    const latestQuotation = await prisma.quotation.findFirst({
      where: {
        quotationNo: {
          startsWith: prefix
        }
      },
      orderBy: {
        quotationNo: 'desc'
      }
    });

    // ถ้ามี quotation ในเดือนนี้แล้ว ให้เอาเลขท้ายมา +1
    let runningNumber = 1;
    if (latestQuotation) {
      const lastNumber = parseInt(latestQuotation.quotationNo.slice(-4));
      runningNumber = lastNumber + 1;
    }

    const quotationNo = `${prefix}${String(runningNumber).padStart(4, '0')}`;

    // สร้าง approval token
    const approvalToken = uuidv4();

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
        siteImages,
        // ลบ customerSignature ออก
        approvalToken: approvalToken as any,
        approvalStatus: 'pending',
        items: {
          create: itemsData
        },
        images: images ? {
          create: images.map((img: any) => ({
            imageUrl: img.url,
            caption: img.caption || null
          }))
        } : undefined,
        // เพิ่ม shop signature ถ้ามี
        signatures: (shopSignature && signerName) ? {
          create: [{
            type: 'shop',
            signatureUrl: shopSignature,
            signerName: signerName,
            signedAt: new Date()
          }]
        } : undefined
      } as any,
      include: {
        customer: true,
        items: true,
        images: true,
        signatures: true // เพิ่ม signatures
      }
    });

    // ส่งการแจ้งเตือนทาง Email (ถ้ามี email)
    const createdQuotation = quotation as any;
    const emailToSend = customerEmail || createdQuotation.customer?.email;

    console.log('[DEBUG] Customer Email Override:', customerEmail);
    console.log('[DEBUG] Customer Relation Email:', createdQuotation.customer?.email);
    console.log('[DEBUG] Final Email to Send:', emailToSend);

    if (emailToSend) {
      try {
        console.log(`[EMAIL] Attempting to send email to: ${emailToSend}`);

        // ลอง generate PDF แยก — ถ้า fail ก็ส่งอีเมลโดยไม่แนบ PDF
        let pdfBuffer: Buffer | undefined;
        try {
          pdfBuffer = await pdfService.generateQuotationPDF(createdQuotation);
          console.log('[EMAIL] ✓ PDF generated successfully');
        } catch (pdfError) {
          console.error('[EMAIL] ✗ PDF generation failed (will send email without PDF):', pdfError instanceof Error ? pdfError.message : pdfError);
        }

        await emailService.sendQuotationToCustomer(createdQuotation, pdfBuffer, emailToSend);
        console.log(`[EMAIL] ✓ Email sent successfully to ${emailToSend}`);
      } catch (emailError) {
        console.error('[EMAIL] ✗ Error sending email:', emailError instanceof Error ? emailError.message : emailError);
        // ไม่ให้ fail ทั้งหมดถ้าส่ง email ไม่ได้
      }
    } else {
      console.log('[EMAIL] ⚠ No email address provided - skipping email notification');
    }

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
      status,
      siteImages,        // รูปภาพหน้างาน (Before)
      customerSignature  // ลายเซ็นลูกค้า (อนุมัติ)
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

    // เพิ่มการอัปเดตรูปภาพและลายเซ็น (ถ้ามีส่งมา)
    if (siteImages !== undefined) {
      updateData.siteImages = siteImages;
    }
    if (customerSignature !== undefined) {
      updateData.customerSignature = customerSignature;
    }

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

    // Check if invoice already exists (prevent duplicate/crash)
    const existingInvoice = await prisma.invoice.findUnique({
      where: { quotationId: quotation.id }
    });

    if (existingInvoice) {
      // If invoice exists but status wasn't updated, update it now
      await prisma.quotation.update({
        where: { id: quotation.id },
        data: { status: 'converted' }
      });
      return successResponse(res, existingInvoice, 'ใบเสนอราคานี้มีใบแจ้งหนี้อยู่แล้ว (อัปเดตสถานะสำเร็จ)');
    }

    // Start Transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // สร้างเลขที่ใบแจ้งหนี้
      const year = new Date().getFullYear() + 543;
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await tx.invoice.count() + 1;
      const invoiceNo = `INV${year}${month}${String(count).padStart(4, '0')}`;

      // สร้างใบแจ้งหนี้
      const newInvoice = await tx.invoice.create({
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
      await tx.quotation.update({
        where: { id: parseInt(id) },
        data: { status: 'converted' }
      });

      return newInvoice;
    });

    // ส่ง email ใบแจ้งหนี้ให้ลูกค้า (ถ้ามี email)
    // ทำนอก transaction เพื่อไม่ให้ block DB
    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        items: true,
        customer: true,
        signatures: true,
        quotation: {
          include: {
            customer: true
          }
        }
      }
    });

    if (fullInvoice && fullInvoice.customer?.email) {
      try {
        console.log(`[EMAIL] Attempting to send invoice email to: ${fullInvoice.customer.email}`);

        let pdfBuffer: Buffer | undefined;
        try {
          pdfBuffer = await pdfService.generateInvoicePDF(fullInvoice);
          console.log('[EMAIL] ✓ Invoice PDF generated successfully');
        } catch (pdfError) {
          console.error('[EMAIL] ✗ Invoice PDF generation failed (will send email without PDF):', pdfError instanceof Error ? pdfError.message : pdfError);
        }

        await emailService.sendInvoiceToCustomer(fullInvoice, pdfBuffer);
        console.log(`[EMAIL] ✓ Invoice email sent to customer`);
      } catch (emailError) {
        console.error('[EMAIL] ✗ Error sending invoice email:', emailError instanceof Error ? emailError.message : emailError);
      }
    }

    return successResponse(res, invoice, 'แปลงเป็นใบแจ้งหนี้สำเร็จ', 201);
  } catch (error) {
    console.error("Error converting invoice:", error); // Log error locally
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

    // ตรวจสอบว่ามีใบเสนอราคานี้หรือไม่
    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!quotation) {
      throw new AppError('ไม่พบใบเสนอราคานี้', 404);
    }

    // สร้างลายเซ็น
    const signature = await prisma.quotationSignature.create({
      data: {
        quotationId: parseInt(id),
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