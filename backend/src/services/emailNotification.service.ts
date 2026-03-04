import nodemailer, { Transporter } from 'nodemailer';

interface EmailNotificationData {
    subject: string;
    message: string;
}

class EmailNotificationService {
    private transporter: Transporter;
    private recipientEmail: string;

    constructor() {
        this.recipientEmail = process.env.NOTIFICATION_EMAIL || '';

        // ตั้งค่า Gmail SMTP
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD // App Password จาก Gmail
            }
        });
    }

    async sendNotification(data: EmailNotificationData): Promise<void> {
        if (!this.recipientEmail || !process.env.EMAIL_USER) {
            console.warn('Email notification not configured. Skipping notification.');
            return;
        }

        try {
            await this.transporter.sendMail({
                from: `"ระบบจัดการธุรกิจ" <${process.env.EMAIL_USER}>`,
                to: this.recipientEmail,
                subject: data.subject,
                text: data.message,
                html: data.message.replace(/\n/g, '<br>')
            });

            console.log(`Email notification sent to ${this.recipientEmail}`);
        } catch (error: any) {
            console.error('Email notification error:', error.message);
        }
    }

    // Helper: ใบเสนอราคาใหม่
    async notifyNewQuotation(quotation: any): Promise<void> {
        const subject = '🔔 ใบเสนอราคาใหม่';
        const message = `
<h2>🔔 ใบเสนอราคาใหม่</h2>
<hr>
<p><strong>📄 เลขที่:</strong> ${quotation.quotationNo}</p>
<p><strong>👤 ลูกค้า:</strong> ${quotation.customerName}</p>
<p><strong>💰 ยอดรวม:</strong> ${Number(quotation.total).toLocaleString('th-TH')} บาท</p>
<p><strong>📅 วันที่:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
    `.trim();

        await this.sendNotification({ subject, message });
    }

    // Helper: แปลงเป็นใบแจ้งหนี้
    async notifyQuotationConverted(invoice: any): Promise<void> {
        const subject = '✨ แปลงเป็นใบแจ้งหนี้แล้ว';
        const message = `
<h2>✨ แปลงเป็นใบแจ้งหนี้แล้ว</h2>
<hr>
<p><strong>📄 เลขที่:</strong> ${invoice.invoiceNo}</p>
<p><strong>👤 ลูกค้า:</strong> ${invoice.customerName}</p>
<p><strong>💰 ยอดรวม:</strong> ${Number(invoice.total).toLocaleString('th-TH')} บาท</p>
<p><strong>📊 สถานะ:</strong> ${this.getStatusLabel(invoice.status)}</p>
    `.trim();

        await this.sendNotification({ subject, message });
    }

    // Helper: รับชำระเงิน
    async notifyPaymentReceived(payment: any, invoice: any): Promise<void> {
        const remainingAmount = Number(invoice.remainingAmount) - Number(payment.amount);
        const subject = '💵 รับชำระเงินแล้ว';

        const message = `
<h2>💵 รับชำระเงินแล้ว</h2>
<hr>
<p><strong>📄 ใบแจ้งหนี้:</strong> ${invoice.invoiceNo}</p>
<p><strong>👤 ลูกค้า:</strong> ${invoice.customerName}</p>
<p><strong>💰 จำนวนเงิน:</strong> ${Number(payment.amount).toLocaleString('th-TH')} บาท</p>
<p><strong>💳 วิธีชำระ:</strong> ${this.getPaymentMethodLabel(payment.paymentMethod)}</p>
<p><strong>📊 คงเหลือ:</strong> ${remainingAmount.toLocaleString('th-TH')} บาท</p>
    `.trim();

        await this.sendNotification({ subject, message });
    }

    // Helper: ชำระเงินครบแล้ว
    async notifyFullyPaid(invoice: any): Promise<void> {
        const subject = '🎉 ชำระเงินครบแล้ว!';
        const message = `
<h2>🎉 ชำระเงินครบแล้ว!</h2>
<hr>
<p><strong>📄 ใบแจ้งหนี้:</strong> ${invoice.invoiceNo}</p>
<p><strong>👤 ลูกค้า:</strong> ${invoice.customerName}</p>
<p><strong>💰 ยอดรวม:</strong> ${Number(invoice.total).toLocaleString('th-TH')} บาท</p>
<p><strong>✅ สถานะ:</strong> ชำระครบถ้วน</p>
    `.trim();

        await this.sendNotification({ subject, message });
    }

    // Helper: แปลง payment method
    private getPaymentMethodLabel(method: string): string {
        const labels: any = {
            cash: 'เงินสด',
            transfer: 'โอนเงิน',
            credit: 'บัตรเครดิต',
            promptpay: 'พร้อมเพย์'
        };
        return labels[method] || method;
    }

    // Helper: แปลง invoice status
    private getStatusLabel(status: string): string {
        const labels: any = {
            unpaid: 'รอชำระ',
            partial: 'ชำระบางส่วน',
            paid: 'ชำระแล้ว',
            overdue: 'เกินกำหนด'
        };
        return labels[status] || status;
    }
}

export const emailNotificationService = new EmailNotificationService();
