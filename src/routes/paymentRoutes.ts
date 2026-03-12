import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// POST /api/payments - แจ้งชำระเงิน
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      invoiceId,
      amount,
      paymentMethod,
      transferredAt,
      bankName,
      paymentSlip,
      notes
    } = req.body;

    // ตรวจสอบว่ามีใบแจ้งหนี้อยู่จริง
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: {
        customer: true,
        items: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'ไม่พบใบแจ้งหนี้' });
    }

    // ตรวจสอบว่าจำนวนเงินถูกต้อง
    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({ error: 'จำนวนเงินไม่ถูกต้อง' });
    }

    // บันทึกข้อมูลการชำระเงิน
    const payment = await prisma.payment.create({
      data: {
        invoiceId: parseInt(invoiceId),
        amount: paymentAmount,
        paymentMethod,
        paymentSlip,
        notes,
        ...(transferredAt && { transferredAt: new Date(transferredAt) }),
        ...(bankName && { bankName })
      }
    });

    // คำนวณยอดชำระแล้วและยอดคงเหลือ
    const totalPaid = parseFloat(invoice.paidAmount.toString()) + paymentAmount;
    const remaining = parseFloat(invoice.total.toString()) - totalPaid;

    // กำหนดสถานะใหม่
    let newStatus = 'unpaid';
    if (remaining <= 0) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    }

    // อัปเดตสถานะใบแจ้งหนี้
    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: {
        paidAmount: totalPaid,
        remainingAmount: remaining > 0 ? remaining : 0,
        status: newStatus,
        paidDate: newStatus === 'paid' ? new Date() : invoice.paidDate
      }
    });

    // ถ้าชำระครบแล้ว ให้ออกใบเสร็จอัตโนมัติ
    let receipt = null;
    if (newStatus === 'paid') {
      // สร้างเลขที่ใบเสร็จ
      const receiptCount = await prisma.receipt.count();
      const receiptNo = `RCPT${String(receiptCount + 1).padStart(8, '0')}`;

      // ออกใบเสร็จ
      receipt = await prisma.receipt.create({
        data: {
          receiptNo,
          invoiceId: parseInt(invoiceId),
          userId: (req as any).user.userId,
          amount: parseFloat(invoice.total.toString()),
          paymentMethod,
          notes: notes || 'ออกใบเสร็จอัตโนมัติจากการแจ้งชำระเงิน'
        }
      });
    }

    res.json({
      success: true,
      message: newStatus === 'paid' 
        ? 'บันทึกการชำระเงินสำเร็จ และออกใบเสร็จแล้ว' 
        : 'บันทึกการชำระเงินสำเร็จ',
      payment,
      invoice: updatedInvoice,
      receipt
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
});

// GET /api/payments/invoice/:invoiceId - ดูประวัติการชำระเงินของใบแจ้งหนี้
router.get('/invoice/:invoiceId', authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { invoiceId: parseInt(invoiceId) },
      orderBy: { createdAt: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

export default router;
