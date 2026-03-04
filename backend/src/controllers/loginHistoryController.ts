import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/authMiddleware';

// Helper function to extract device info from user agent
const parseUserAgent = (userAgent: string) => {
    const browser = userAgent.includes('Chrome') ? 'Chrome'
        : userAgent.includes('Firefox') ? 'Firefox'
            : userAgent.includes('Safari') ? 'Safari'
                : userAgent.includes('Edge') ? 'Edge'
                    : 'Unknown';

    const os = userAgent.includes('Windows') ? 'Windows'
        : userAgent.includes('Mac') ? 'macOS'
            : userAgent.includes('Linux') ? 'Linux'
                : userAgent.includes('Android') ? 'Android'
                    : userAgent.includes('iOS') ? 'iOS'
                        : 'Unknown';

    const device = userAgent.includes('Mobile') ? 'Mobile'
        : userAgent.includes('Tablet') ? 'Tablet'
            : 'Desktop';

    return { browser, os, device };
};

// Record login history
export const createLoginHistory = async (
    userId: number,
    ipAddress: string,
    userAgent: string,
    loginStatus: 'success' | 'failed',
    failureReason?: string
) => {
    try {
        const { browser, os, device } = parseUserAgent(userAgent);

        // Check if this is a new device (simple detection based on browser + os + device)
        const existingLogins = await prisma.loginHistory.findFirst({
            where: {
                userId,
                browser,
                os,
                device,
                loginStatus: 'success'
            }
        });

        const isNewDevice = !existingLogins;

        // Create login history record
        const loginHistory = await prisma.loginHistory.create({
            data: {
                userId,
                ipAddress,
                userAgent,
                browser,
                os,
                device,
                loginStatus,
                failureReason,
                isNewDevice
            }
        });

        return { loginHistory, isNewDevice };
    } catch (error) {
        console.error('Error creating login history:', error);
        // Don't throw error, just log it - login should continue even if history fails
        return { loginHistory: null, isNewDevice: false };
    }
};

// Get user's login history
export const getLoginHistory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.id;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [history, total] = await Promise.all([
            prisma.loginHistory.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
                select: {
                    id: true,
                    ipAddress: true,
                    browser: true,
                    os: true,
                    device: true,
                    location: true,
                    loginStatus: true,
                    failureReason: true,
                    isNewDevice: true,
                    createdAt: true
                }
            }),
            prisma.loginHistory.count({
                where: { userId }
            })
        ]);

        return successResponse(res, {
            history,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        }, 'ดึงประวัติการเข้าสู่ระบบสำเร็จ');
    } catch (error) {
        next(error);
    }
};

// Get recent failed login attempts
export const getRecentFailedLogins = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.id;

        const failedLogins = await prisma.loginHistory.findMany({
            where: {
                userId,
                loginStatus: 'failed'
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                ipAddress: true,
                browser: true,
                os: true,
                failureReason: true,
                createdAt: true
            }
        });

        return successResponse(res, failedLogins, 'ดึงประวัติ Login ที่ล้มเหลวสำเร็จ');
    } catch (error) {
        next(error);
    }
};
