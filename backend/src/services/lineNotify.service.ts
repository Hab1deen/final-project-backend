import axios from 'axios';

interface LineNotifyMessage {
    message: string;
    imageUrl?: string;
    stickerPackageId?: number;
    stickerId?: number;
}

class LineNotifyService {
    private token: string;
    private apiUrl = 'https://notify-api.line.me/api/notify';

    constructor() {
        this.token = process.env.LINE_NOTIFY_TOKEN || '';
    }

    async sendNotification(data: LineNotifyMessage): Promise<void> {
        if (!this.token) {
            console.warn('LINE_NOTIFY_TOKEN not configured. Skipping notification.');
            return;
        }

        try {
            const params = new URLSearchParams();
            params.append('message', data.message);

            if (data.imageUrl) params.append('imageThumbnail', data.imageUrl);
            if (data.stickerPackageId) params.append('stickerPackageId', data.stickerPackageId.toString());
            if (data.stickerId) params.append('stickerId', data.stickerId.toString());

            await axios.post(this.apiUrl, params, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            console.log('LINE notification sent successfully');
        } catch (error: any) {
            console.error('LINE Notify error:', error.response?.data || error.message);
        }
    }

    // Helper: ใบเสนอราคาใหม่
    async notifyNewQuotation(quotation: any): Promise<void> {
        const message = `
🔔 ใบเสนอราคาใหม่
━━━━━━━━━━━━━
📄 เลขที่: ${quotation.quotationNo}
👤 ลูกค้า: ${quotation.customerName}
💰 ยอดรวม: ${Number(quotation.total).toLocaleString('th-TH')} บาท
📅 วันที่: ${new Date().toLocaleDateString('th-TH')}
    `.trim();

        await this.sendNotification({ message });
    }

    // Helper: แปลงเป็นใบแจ้งหนี้
    async notifyQuotationConverted(invoice: any): Promise<void> {
        const message = `
✨ แปลงเป็นใบแจ้งหนี้แล้ว
━━━━━━━━━━━━━
📄 เลขที่: ${invoice.invoiceNo}
👤 ลูกค้า: ${invoice.customerName}
💰 ยอดรวม: ${Number(invoice.total).toLocaleString('th-TH')} บาท
📊 สถานะ: ${this.getStatusLabel(invoice.status)}
    `.trim();

        await this.sendNotification({
            message,
            stickerPackageId: 11537,
            stickerId: 52002734
        });
    }

    // Helper: รับชำระเงิน
    async notifyPaymentReceived(payment: any, invoice: any): Promise<void> {
        const remainingAmount = Number(invoice.remainingAmount) - Number(payment.amount);

        const message = `
💵 รับชำระเงินแล้ว
━━━━━━━━━━━━━
📄 ใบแจ้งหนี้: ${invoice.invoiceNo}
👤 ลูกค้า: ${invoice.customerName}
💰 จำนวนเงิน: ${Number(payment.amount).toLocaleString('th-TH')} บาท
💳 วิธีชำระ: ${this.getPaymentMethodLabel(payment.paymentMethod)}
📊 คงเหลือ: ${remainingAmount.toLocaleString('th-TH')} บาท
    `.trim();

        await this.sendNotification({ message });
    }

    // Helper: ชำระเงินครบแล้ว
    async notifyFullyPaid(invoice: any): Promise<void> {
        const message = `
🎉 ชำระเงินครบแล้ว!
━━━━━━━━━━━━━
📄 ใบแจ้งหนี้: ${invoice.invoiceNo}
👤 ลูกค้า: ${invoice.customerName}
💰 ยอดรวม: ${Number(invoice.total).toLocaleString('th-TH')} บาท
✅ สถานะ: ชำระครบถ้วน
    `.trim();

        await this.sendNotification({
            message,
            stickerPackageId: 11537,
            stickerId: 52002735
        });
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

export const lineNotifyService = new LineNotifyService();
