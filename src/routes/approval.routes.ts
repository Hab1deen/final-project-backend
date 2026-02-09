import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import emailService from '../services/email.service';

const router = Router();
const prisma = new PrismaClient();

// ดูใบเสนอราคาผ่าน token (public - ไม่ต้อง auth)
router.get('/quotations/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const quotation = await prisma.quotation.findUnique({
            where: { approvalToken: token },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                images: true,
                signatures: true,
            },
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบใบเสนอราคา',
            });
        }

        res.json({
            success: true,
            data: quotation,
        });
    } catch (error) {
        console.error('Error fetching quotation by token:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        });
    }
});

// อนุมัติใบเสนอราคา (public)
router.post('/quotations/:token/approve', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { notes } = req.body;

        const quotation = await prisma.quotation.findUnique({
            where: { approvalToken: token },
            include: {
                customer: true,
            },
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบใบเสนอราคา',
            });
        }

        if (quotation.approvalStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `ใบเสนอราคานี้${quotation.approvalStatus === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}`,
            });
        }

        // อัปเดตสถานะ
        const updatedQuotation = await prisma.quotation.update({
            where: { id: quotation.id },
            data: {
                approvalStatus: 'approved',
                approvedAt: new Date(),
                approvalNotes: notes || null,
                status: 'accepted', // อัปเดต status หลักด้วย
            },
            include: {
                customer: true,
                items: true,
            },
        });

        // ส่ง email แจ้งเจ้าของธุรกิจ
        // TODO: ดึง email เจ้าของจาก users table หรือจาก env
        const ownerEmail = process.env.SMTP_USER || 'habideen1111@gmail.com';
        try {
            await emailService.notifyOwnerOnApproval(ownerEmail, updatedQuotation);
        } catch (emailError) {
            console.error('Error sending approval email:', emailError);
            // ไม่ให้ fail ทั้งหมดถ้าส่ง email ไม่ได้
        }

        res.json({
            success: true,
            message: 'อนุมัติใบเสนอราคาเรียบร้อยแล้ว',
            data: updatedQuotation,
        });
    } catch (error) {
        console.error('Error approving quotation:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอนุมัติ',
        });
    }
});

// ปฏิเสธใบเสนอราคา (public)
router.post('/quotations/:token/reject', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { notes, reason } = req.body;

        const quotation = await prisma.quotation.findUnique({
            where: { approvalToken: token },
            include: {
                customer: true,
            },
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบใบเสนอราคา',
            });
        }

        if (quotation.approvalStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `ใบเสนอราคานี้${quotation.approvalStatus === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}`,
            });
        }

        // อัปเดตสถานะ
        const updatedQuotation = await prisma.quotation.update({
            where: { id: quotation.id },
            data: {
                approvalStatus: 'rejected',
                approvedAt: new Date(),
                approvalNotes: notes || reason || null,
                status: 'rejected', // อัปเดต status หลักด้วย
            },
            include: {
                customer: true,
                items: true,
            },
        });

        // ส่ง email แจ้งเจ้าของธุรกิจ
        const ownerEmail = process.env.SMTP_USER || 'habideen1111@gmail.com';
        try {
            await emailService.notifyOwnerOnRejection(ownerEmail, updatedQuotation);
        } catch (emailError) {
            console.error('Error sending rejection email:', emailError);
        }

        res.json({
            success: true,
            message: 'ปฏิเสธใบเสนอราคาเรียบร้อยแล้ว',
            data: updatedQuotation,
        });
    } catch (error) {
        console.error('Error rejecting quotation:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการปฏิเสธ',
        });
    }
});

export default router;
