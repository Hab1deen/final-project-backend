import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

// ดึงนัดหมายทั้งหมด
export const getAllAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, appointmentType, startDate, endDate } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (appointmentType) where.appointmentType = appointmentType;

    if (startDate && endDate) {
      where.appointmentDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: 'asc' },
      include: {
        invoice: {
          include: {
            customer: true
          }
        }
      }
    });

    return successResponse(res, appointments, 'ดึงข้อมูลนัดหมายสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ดึงนัดหมาย 1 รายการ
export const getAppointmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        invoice: {
          include: {
            customer: true,
            items: true
          }
        }
      }
    });

    if (!appointment) {
      throw new AppError('ไม่พบนัดหมายนี้', 404);
    }

    return successResponse(res, appointment, 'ดึงข้อมูลนัดหมายสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// สร้างนัดหมายใหม่
export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      invoiceId,
      appointmentType,
      title,
      description,
      appointmentDate,
      startTime,
      endTime,
      location,
      contactPerson,
      contactPhone,
      notes
    } = req.body;

    // Validation
    if (!title || !appointmentDate || !appointmentType) {
      throw new AppError('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
    }

    if (!['installation', 'payment', 'other'].includes(appointmentType)) {
      throw new AppError('ประเภทนัดหมายไม่ถูกต้อง', 400);
    }

    // ถ้ามี invoiceId ให้ตรวจสอบว่ามี Invoice นี้หรือไม่
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: parseInt(invoiceId) }
      });

      if (!invoice) {
        throw new AppError('ไม่พบใบแจ้งหนี้นี้', 404);
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        invoiceId: invoiceId ? parseInt(invoiceId) : null,
        appointmentType,
        title,
        description,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        location,
        contactPerson,
        contactPhone,
        notes
      },
      include: {
        invoice: {
          include: {
            customer: true
          }
        }
      }
    });

    return successResponse(res, appointment, 'สร้างนัดหมายสำเร็จ', 201);
  } catch (error) {
    next(error);
  }
};

// แก้ไขนัดหมาย
export const updateAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      appointmentDate,
      startTime,
      endTime,
      appointmentType,
      status,
      location,
      contactPerson,
      contactPhone,
      notes
    } = req.body;

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (appointmentDate !== undefined) updateData.appointmentDate = new Date(appointmentDate);
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (appointmentType !== undefined) updateData.appointmentType = appointmentType;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (notes !== undefined) updateData.notes = notes;

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        invoice: {
          include: {
            customer: true
          }
        }
      }
    });

    return successResponse(res, appointment, 'แก้ไขนัดหมายสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// ลบนัดหมาย
export const deleteAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.appointment.delete({
      where: { id: parseInt(id) }
    });

    return successResponse(res, null, 'ลบนัดหมายสำเร็จ');
  } catch (error) {
    next(error);
  }
};

// อัพเดทสถานะนัดหมาย
export const updateAppointmentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('กรุณาระบุสถานะ', 400);
    }

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      throw new AppError('สถานะไม่ถูกต้อง', 400);
    }

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        invoice: {
          include: {
            customer: true
          }
        }
      }
    });

    return successResponse(res, appointment, 'อัพเดทสถานะสำเร็จ');
  } catch (error) {
    next(error);
  }
};