import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/authMiddleware';
import bcrypt from 'bcryptjs';

// Get all users
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return successResponse(res, users, 'ดึงข้อมูลผู้ใช้สำเร็จ');
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
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

// Create user (Admin only)
export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password || !name) {
      throw new AppError('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'user'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return successResponse(res, user, 'สร้างผู้ใช้สำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      throw new AppError('ไม่พบผู้ใช้', 404);
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });

      if (emailTaken) {
        throw new AppError('อีเมลนี้ถูกใช้งานแล้ว', 400);
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        email: email || existingUser.email,
        name: name || existingUser.name,
        role: role || existingUser.role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return successResponse(res, user, 'อัพเดทผู้ใช้สำเร็จ');
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      throw new AppError('ไม่พบผู้ใช้', 404);
    }

    // Prevent deleting yourself
    if (user.id === req.user!.id) {
      throw new AppError('ไม่สามารถลบบัญชีของคุณเองได้', 400);
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    return successResponse(res, null, 'ลบผู้ใช้สำเร็จ');
  } catch (error) {
    next(error);
  }
};

// Reset user password
export const resetUserPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      throw new AppError('ไม่พบผู้ใช้', 404);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    });

    return successResponse(res, null, 'รีเซ็ตรหัสผ่านสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// Get statistics
export const getStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalUsers,
      adminCount,
      userCount,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { role: 'user' } }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    return successResponse(res, {
      totalUsers,
      adminCount,
      userCount,
      recentUsers
    }, 'ดึงสถิติสำเร็จ');
  } catch (error) {
    next(error);
  }
};