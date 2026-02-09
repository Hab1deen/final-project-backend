import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/authMiddleware';
import emailService from '../services/email.service';

// Generate random verification token
const generateToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Send verification email
export const sendVerificationEmail = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.id;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new AppError('ไม่พบผู้ใช้', 404);
        }

        // Check if already verified
        if (user.isEmailVerified) {
            throw new AppError('อีเมลได้รับการยืนยันแล้ว', 400);
        }

        // Delete any existing tokens for this user
        await prisma.emailVerificationToken.deleteMany({
            where: { userId }
        });

        // Create new verification token (expires in 24 hours)
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.emailVerificationToken.create({
            data: {
                userId,
                token,
                expiresAt
            }
        });

        // Send email
        await emailService.sendEmailVerification(user.email, user.name, token);

        return successResponse(res, null, 'ส่งอีเมลยืนยันเรียบร้อยแล้ว');
    } catch (error) {
        next(error);
    }
};

// Verify email with token
export const verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token } = req.body;

        if (!token) {
            throw new AppError('กรุณาระบุ token', 400);
        }

        // Find token in database
        const verificationToken = await prisma.emailVerificationToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!verificationToken) {
            throw new AppError('Token ไม่ถูกต้องหรือหมดอายุ', 400);
        }

        // Check if token expired
        if (new Date() > verificationToken.expiresAt) {
            await prisma.emailVerificationToken.delete({
                where: { id: verificationToken.id }
            });
            throw new AppError('Token หมดอายุ กรุณาขอรับอีเมลยืนยันใหม่', 400);
        }

        // Check if already verified
        if (verificationToken.user.isEmailVerified) {
            throw new AppError('อีเมลได้รับการยืนยันแล้ว', 400);
        }

        // Update user as verified
        await prisma.user.update({
            where: { id: verificationToken.userId },
            data: {
                isEmailVerified: true,
                emailVerifiedAt: new Date()
            }
        });

        // Delete the token
        await prisma.emailVerificationToken.delete({
            where: { id: verificationToken.id }
        });

        return successResponse(res, null, 'ยืนยันอีเมลสำเร็จ');
    } catch (error) {
        next(error);
    }
};

// Resend verification email (public - no auth required)
export const resendVerificationEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new AppError('กรุณาระบุอีเมล', 400);
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if email exists for security
            return successResponse(res, null, 'หากอีเมลมีอยู่ในระบบ เราจะส่งอีเมลยืนยันให้');
        }

        // Check if already verified
        if (user.isEmailVerified) {
            throw new AppError('อีเมลได้รับการยืนยันแล้ว', 400);
        }

        // Delete any existing tokens
        await prisma.emailVerificationToken.deleteMany({
            where: { userId: user.id }
        });

        // Create new token
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        // Send email
        await emailService.sendEmailVerification(user.email, user.name, token);

        return successResponse(res, null, 'ส่งอีเมลยืนยันเรียบร้อยแล้ว');
    } catch (error) {
        next(error);
    }
};
