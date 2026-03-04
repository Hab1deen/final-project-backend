import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import emailService from '../services/email.service';

// Generate random reset token
const generateToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Request password reset
export const requestPasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new AppError('กรุณาระบุอีเมล', 400);
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Don't reveal if user exists for security
        if (!user) {
            return successResponse(res, null, 'หากอีเมลมีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้');
        }

        // Delete any existing password reset tokens
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id }
        });

        // Create new reset token (expires in 1 hour)
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        // Send email
        await emailService.sendPasswordResetEmail(user.email, user.name, token);

        return successResponse(res, null, 'หากอีเมลมีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้');
    } catch (error) {
        next(error);
    }
};

// Verify reset token
export const verifyResetToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token } = req.params;

        if (!token) {
            throw new AppError('กรุณาระบุ token', 400);
        }

        // Find token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!resetToken) {
            throw new AppError('Token ไม่ถูกต้องหรือหมดอายุ', 400);
        }

        // Check if token expired
        if (new Date() > resetToken.expiresAt) {
            await prisma.passwordResetToken.delete({
                where: { id: resetToken.id }
            });
            throw new AppError('Token หมดอายุ กรุณาขอรีเซ็ตรหัสผ่านใหม่', 400);
        }

        // Check if already used
        if (resetToken.usedAt) {
            throw new AppError('Token นี้ถูกใช้งานแล้ว', 400);
        }

        return successResponse(res, {
            email: resetToken.user.email,
            name: resetToken.user.name
        }, 'Token ถูกต้อง');
    } catch (error) {
        next(error);
    }
};

// Reset password
export const resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            throw new AppError('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
        }

        if (newPassword.length < 6) {
            throw new AppError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', 400);
        }

        // Find token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!resetToken) {
            throw new AppError('Token ไม่ถูกต้องหรือหมดอายุ', 400);
        }

        // Check if token expired
        if (new Date() > resetToken.expiresAt) {
            await prisma.passwordResetToken.delete({
                where: { id: resetToken.id }
            });
            throw new AppError('Token หมดอายุ กรุณาขอรีเซ็ตรหัสผ่านใหม่', 400);
        }

        // Check if already used
        if (resetToken.usedAt) {
            throw new AppError('Token นี้ถูกใช้งานแล้ว', 400);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword }
        });

        // Mark token as used
        await prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() }
        });

        return successResponse(res, null, 'เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (error) {
        next(error);
    }
};
