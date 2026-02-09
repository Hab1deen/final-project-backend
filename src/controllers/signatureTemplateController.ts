import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

// Get all signature templates for current user
export const getAllTemplates = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError('User  not authenticated', 401);
        }

        const templates = await prisma.signatureTemplate.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' }, // Default templates first
                { createdAt: 'desc' },
            ],
        });

        res.json({
            status: 'success',
            data: templates,
        });
    } catch (error) {
        console.error("Error in getAllTemplates:", error);
        next(error);
    }
};

// Get default template
export const getDefaultTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const template = await prisma.signatureTemplate.findFirst({
            where: {
                userId,
                isDefault: true,
            },
        });

        res.json({
            status: 'success',
            data: template,
        });
    } catch (error) {
        console.error("Error in getAllTemplates:", error);
        next(error);
    }
};

// Create new signature template
export const createTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const { name, signatureData, isDefault } = req.body;

        if (!name || !signatureData) {
            throw new AppError('Name and signature data are required', 400);
        }

        // Signature data is already base64, store directly
        const signatureUrl = signatureData;

        // If setting as default, unset other defaults
        if (isDefault) {
            await prisma.signatureTemplate.updateMany({
                where: {
                    userId,
                    isDefault: true,
                },
                data: {
                    isDefault: false,
                },
            });
        }

        // Create template
        const template = await prisma.signatureTemplate.create({
            data: {
                userId,
                name,
                signatureUrl,
                isDefault: isDefault || false,
            },
        });

        res.status(201).json({
            status: 'success',
            data: template,
        });
    } catch (error) {
        console.error("Error in getAllTemplates:", error);
        next(error);
    }
};

// Update template (rename or set default)
export const updateTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, isDefault } = req.body;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        // Check ownership
        const existingTemplate = await prisma.signatureTemplate.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingTemplate) {
            throw new AppError('Template not found', 404);
        }

        if (existingTemplate.userId !== userId) {
            throw new AppError('Unauthorized', 403);
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await prisma.signatureTemplate.updateMany({
                where: {
                    userId,
                    isDefault: true,
                },
                data: {
                    isDefault: false,
                },
            });
        }

        // Update template
        const template = await prisma.signatureTemplate.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(isDefault !== undefined && { isDefault }),
            },
        });

        res.json({
            status: 'success',
            data: template,
        });
    } catch (error) {
        console.error("Error in getAllTemplates:", error);
        next(error);
    }
};

// Delete template
export const deleteTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        // Check ownership
        const existingTemplate = await prisma.signatureTemplate.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingTemplate) {
            throw new AppError('Template not found', 404);
        }

        if (existingTemplate.userId !== userId) {
            throw new AppError('Unauthorized', 403);
        }

        // Delete template
        await prisma.signatureTemplate.delete({
            where: { id: parseInt(id) },
        });

        res.json({
            status: 'success',
            message: 'Template deleted successfully',
        });
    } catch (error) {
        console.error("Error in getAllTemplates:", error);
        next(error);
    }
};

// Set template as default
export const setDefault = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        // Check ownership
        const existingTemplate = await prisma.signatureTemplate.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingTemplate) {
            throw new AppError('Template not found', 404);
        }

        if (existingTemplate.userId !== userId) {
            throw new AppError('Unauthorized', 403);
        }

        // Unset all other defaults
        await prisma.signatureTemplate.updateMany({
            where: {
                userId,
                isDefault: true,
            },
            data: {
                isDefault: false,
            },
        });

        // Set this as default
        const template = await prisma.signatureTemplate.update({
            where: { id: parseInt(id) },
            data: {
                isDefault: true,
            },
        });

        res.json({
            status: 'success',
            data: template,
        });
    } catch (error) {
        console.error("Error in getAllTemplates:", error);
        next(error);
    }
};
