import { Router, Request, Response } from 'express';
import emailService from '../services/email.service';

const router = Router();

// ทดสอบส่ง email
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุอีเมล',
            });
        }

        await emailService.testEmail(email);

        res.json({
            success: true,
            message: `ส่งอีเมลทดสอบไปยัง ${email} เรียบร้อยแล้ว`,
        });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการส่งอีเมล',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
