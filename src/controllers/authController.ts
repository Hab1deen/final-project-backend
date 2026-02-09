import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/authMiddleware';
import emailService from '../services/email.service';
import { createLoginHistory } from './loginHistoryController';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

interface TokenPayload {
      id: number;
      email: string;
      name: string;
      role: string;
}

// Generate JWT Token
const generateToken = (user: any): string => {
      const payload: TokenPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
      };

      const options: SignOptions = {
            expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn']
      };

      return jwt.sign(payload, JWT_SECRET, options);
};

// Register
export const register = async (
      req: Request,
      res: Response,
      next: NextFunction
) => {
      try {
            const { email, password, name } = req.body;

            // Validation
            if (!email || !password || !name) {
                  throw new AppError('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
            }

            if (password.length < 6) {
                  throw new AppError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 400);
            }

            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                  where: { email }
            });

            if (existingUser) {
                  throw new AppError('อีเมลนี้ถูกใช้งานแล้ว', 400);
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user (NOT verified by default)
            const user = await prisma.user.create({
                  data: {
                        email,
                        password: hashedPassword,
                        name,
                        role: 'user',
                        isEmailVerified: false  // Require email verification
                  }
            });

            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            await prisma.emailVerificationToken.create({
                  data: {
                        userId: user.id,
                        token: verificationToken,
                        expiresAt
                  }
            });

            // Send verification email
            try {
                  await emailService.sendEmailVerification(user.email, user.name, verificationToken);
            } catch (emailError) {
                  console.error('Failed to send verification email:', emailError);
                  // Continue even if email fails
            }

            // Generate token
            const token = generateToken(user);

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            return successResponse(
                  res,
                  {
                        user: userWithoutPassword,
                        token,
                        message: 'สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี'
                  },
                  'สมัครสมาชิกสำเร็จ',
                  201
            );
      } catch (error) {
            next(error);
      }
};

// Login
export const login = async (
      req: Request,
      res: Response,
      next: NextFunction
) => {
      try {
            const { email, password } = req.body;

            // Get IP and user agent for login history
            const ipAddress = (req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown').toString();
            const userAgent = req.headers['user-agent'] || 'unknown';

            // Validation
            if (!email || !password) {
                  throw new AppError('กรุณากรอกอีเมลและรหัสผ่าน', 400);
            }

            // Find user
            const user = await prisma.user.findUnique({
                  where: { email }
            });

            if (!user) {
                  throw new AppError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                  // Record failed login attempt
                  await createLoginHistory(
                        user.id,
                        ipAddress,
                        userAgent,
                        'failed',
                        'รหัสผ่านไม่ถูกต้อง'
                  );
                  throw new AppError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
            }

            // Check email verification (commented for now - uncomment in production)
            // if (!user.isEmailVerified) {
            //       await createLoginHistory(
            //             user.id,
            //             ipAddress,
            //             userAgent,
            //             'failed',
            //             'อีเมลยังไม่ได้รับการยืนยัน'
            //       );
            //       throw new AppError('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ', 403);
            // }

            // Record successful login
            await createLoginHistory(
                  user.id,
                  ipAddress,
                  userAgent,
                  'success'
            );

            // Generate token
            const token = generateToken(user);

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            return successResponse(res, {
                  user: userWithoutPassword,
                  token
            }, 'เข้าสู่ระบบสำเร็จ');
      } catch (error) {
            next(error);
      }
};

// Get current user
export const getCurrentUser = async (
      req: AuthRequest,
      res: Response,
      next: NextFunction
) => {
      try {
            const user = await prisma.user.findUnique({
                  where: { id: req.user!.id },
                  select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        createdAt: true
                  }
            });

            if (!user) {
                  throw new AppError('ไม่พบผู้ใช้', 404);
            }

            return successResponse(res, user, 'ดึงข้อมูลผู้ใช้สำเร็จ');
      } catch (error) {
            next(error);
      }
};

// Update profile
export const updateProfile = async (
      req: AuthRequest,
      res: Response,
      next: NextFunction
) => {
      try {
            const { name, email } = req.body;

            // Check if email is already taken
            if (email !== req.user!.email) {
                  const existingUser = await prisma.user.findUnique({
                        where: { email }
                  });

                  if (existingUser) {
                        throw new AppError('อีเมลนี้ถูกใช้งานแล้ว', 400);
                  }
            }

            // Update user
            const user = await prisma.user.update({
                  where: { id: req.user!.id },
                  data: { name, email },
                  select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        createdAt: true
                  }
            });

            return successResponse(res, user, 'อัพเดทข้อมูลสำเร็จ');
      } catch (error) {
            next(error);
      }
};

// Change password
export const changePassword = async (
      req: AuthRequest,
      res: Response,
      next: NextFunction
) => {
      try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                  throw new AppError('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
            }

            if (newPassword.length < 6) {
                  throw new AppError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', 400);
            }

            // Get user with password
            const user = await prisma.user.findUnique({
                  where: { id: req.user!.id }
            });

            if (!user) {
                  throw new AppError('ไม่พบผู้ใช้', 404);
            }

            // Check current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

            if (!isPasswordValid) {
                  throw new AppError('รหัสผ่านปัจจุบันไม่ถูกต้อง', 401);
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await prisma.user.update({
                  where: { id: req.user!.id },
                  data: { password: hashedPassword }
            });

            return successResponse(res, null, 'เปลี่ยนรหัสผ่านสำเร็จ');
      } catch (error) {
            next(error);
      }
};