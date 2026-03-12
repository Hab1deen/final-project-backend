import { Resend } from 'resend';
import { config } from 'dotenv';

config();

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      console.warn('[WARN] RESEND_API_KEY is missing. Email sending will be disabled.');
    }
  }

  // ส่ง email พื้นฐาน
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: any[]
  ) {
    if (!this.resend) {
      console.error('[EMAIL] Resend not initialized — RESEND_API_KEY is missing');
      return null;
    }
    console.log(`[DEBUG] Preparing to send email to: ${to}`);
    try {
      const fromName = process.env.SMTP_FROM_NAME || 'Easybill Online';
      // ใช้ custom domain เมื่อมี, fallback ไป onboarding@resend.dev
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      // แปลง attachments format → Resend format
      const resendAttachments = attachments?.map((att) => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content)
          ? att.content
          : Buffer.from(att.content),
      }));

      const { data, error } = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
        attachments: resendAttachments,
      });

      if (error) {
        console.error('Resend error:', error);
        return null;
      }

      console.log('Email sent successfully via Resend:', data?.id);
      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      // ไม่ throw เพื่อไม่ให้ crash main flow
      return null;
    }
  }

  // ส่งใบเสนอราคาไปหาลูกค้า
  async sendQuotationToCustomer(quotation: any, pdfBuffer?: Buffer, customerEmail?: string) {
    const approvalLink = `${process.env.FRONTEND_URL}/public/quotations/${quotation.approvalToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            overflow: hidden;
          }
          .document {
            padding: 48px;
          }
          .doc-header {
            display: table;
            width: 100%;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #2563eb;
          }
          .doc-header > div {
            display: table-cell;
            vertical-align: top;
          }
          .doc-header > div:first-child {
            width: 60%;
          }
          .doc-header > div:last-child {
            width: 40%;
            text-align: right;
          }
          .doc-logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 1px;
          }
          .doc-title {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
          }
          .doc-subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-top: 4px;
          }
          .info-grid {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-bottom: 32px;
            border-spacing: 16px 0;
            margin-left: -16px;
          }
          .info-col {
            display: table-cell;
            vertical-align: top;
          }
          .info-col.doc-info {
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #374151;
            text-transform: uppercase;
            margin-bottom: 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
          }
          .doc-info .section-title {
            border-bottom-color: #bfdbfe;
          }
          .info-row {
            display: table;
            width: 100%;
            margin-bottom: 6px;
            font-size: 14px;
          }
          .info-label {
            display: table-cell;
            color: #6b7280;
            width: 80px;
            font-weight: 500;
          }
          .info-value {
            display: table-cell;
            color: #1f2937;
            font-weight: 500;
          }
          table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
            font-size: 14px;
          }
          .items-table th {
            background-color: #eff6ff;
            color: #1f2937;
            padding: 12px 16px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #bfdbfe;
          }
          .items-table th.center { text-align: center; }
          .items-table th.right { text-align: right; }
          .items-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
            vertical-align: top;
          }
          .items-table td.center { text-align: center; }
          .items-table td.right { text-align: right; }
          .item-name {
            font-weight: 600;
            color: #111827;
          }
          .item-desc {
            font-size: 13px;
            color: #6b7280;
            margin-top: 4px;
          }
          .summary-section {
            margin-left: auto;
            width: 320px;
            background: #eff6ff;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 32px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            color: #374151;
            font-size: 14px;
          }
          .summary-value {
            font-weight: 600;
          }
          .total-row {
            background: #f3f4f6;
            padding: 12px;
            margin-top: 8px;
            border-radius: 4px;
          }
          .total-label {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
          }
          .total-value {
            font-size: 18px;
            font-weight: 700;
            color: #2563eb;
          }
          .cta-section {
            background: #eff6ff;
            padding: 24px;
            border-radius: 8px;
            text-align: center;
            margin: 32px 0;
          }
          .cta-text {
            font-size: 16px;
            color: #1e40af;
            margin-bottom: 16px;
          }
          .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 32px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
          }
          .footer {
            background: #f9fafb;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="document">
            <!-- Document Header - New Design -->
            <div class="doc-header">
              <div>
                <div style="font-size: 14px; font-weight: bold; color: #111827;">ระบบจัดการเอกสารธุรกิจ</div>
                <div style="font-size: 10px; color: #6b7280;">Business Document Management System</div>
                <div style="font-size: 10px; color: #374151; margin-top: 4px;">
                  123 ถนนสุขุมวิท กรุงเทพฯ 10110<br/>
                  Tel: 02-123-4567 | Email: info@business.com
                </div>
              </div>
              <div>
                <div class="doc-title">ใบเสนอราคา</div>
                <div class="doc-subtitle">QUOTATION</div>
              </div>
            </div>

            <!-- Info Grid -->
            <div class="info-grid">
              <div class="info-col">
                <div class="section-title">ข้อมูลลูกค้า | CUSTOMER INFORMATION</div>
                <div class="info-row">
                  <div class="info-label">ชื่อ / Name:</div>
                  <div class="info-value"><strong>${quotation.customerName}</strong></div>
                </div>
                ${quotation.customer?.taxId ? `
                <div class="info-row">
                  <div class="info-label">เลขที่ภาษี / Tax ID:</div>
                  <div class="info-value">${quotation.customer.taxId}</div>
                </div>` : ''}
                ${quotation.customerPhone ? `
                <div class="info-row">
                  <div class="info-label">โทรศัพท์ / Phone:</div>
                  <div class="info-value">${quotation.customerPhone}</div>
                </div>` : ''}
                ${quotation.customerAddress ? `
                <div class="info-row">
                  <div class="info-label">ที่อยู่ / Address:</div>
                  <div class="info-value">${quotation.customerAddress}</div>
                </div>` : ''}
              </div>

              <!-- Document Info -->
              <div class="info-col doc-info">
                <div class="section-title">ข้อมูลเอกสาร | DOCUMENT INFO</div>
                <div class="info-row">
                  <div class="info-label">เลขที่ / No.:</div>
                  <div class="info-value" style="text-align: right; color: #2563eb; font-weight: bold;">${quotation.quotationNo}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">วันที่ / Date:</div>
                  <div class="info-value" style="text-align: right;">${new Date(quotation.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                ${quotation.validUntil ? `
                <div class="info-row">
                  <div class="info-label">วันหมดอายุ:</div>
                  <div class="info-value" style="text-align: right;">${new Date(quotation.validUntil).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>` : ''}
              </div>
            </div>

            <!-- Items Table - Blue Header -->
            <table class="items-table">
              <thead>
                <tr style="background: #2563eb; color: white;">
                  <th style="width: 8%; background: #2563eb; color: white; border: 1px solid #1e40af;">ลำดับ<br/><span style="font-size: 10px; font-weight: normal;">No.</span></th>
                  <th style="width: 40%; background: #2563eb; color: white; border: 1px solid #1e40af;">รายการ<br/><span style="font-size: 10px; font-weight: normal;">Description</span></th>
                  <th class="center" style="width: 12%; background: #2563eb; color: white; border: 1px solid #1e40af;">จำนวน<br/><span style="font-size: 10px; font-weight: normal;">Quantity</span></th>
                  <th class="right" style="width: 20%; background: #2563eb; color: white; border: 1px solid #1e40af;">ราคา/หน่วย<br/><span style="font-size: 10px; font-weight: normal;">Unit Price</span></th>
                  <th class="right" style="width: 20%; background: #2563eb; color: white; border: 1px solid #1e40af;">จำนวนเงิน<br/><span style="font-size: 10px; font-weight: normal;">Amount</span></th>
                </tr>
              </thead>
              <tbody>
                ${quotation.items.map((item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>
                      <div class="item-name">${item.productName}</div>
                      ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                    </td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">฿${parseFloat(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td class="right" style="font-weight: 600;">฿${parseFloat(item.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Summary -->
            <div class="summary-section">
              <div class="summary-row">
                <span class="summary-label">ยอดรวมเป็นเงิน</span>
                <span class="summary-value">฿${parseFloat(quotation.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ${parseFloat(quotation.discount) > 0 ? `
              <div class="summary-row">
                <span class="summary-label">ส่วนลด</span>
                <span class="summary-value" style="color: #ef4444;">-฿${parseFloat(quotation.discount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span class="summary-label">ภาษีมูลค่าเพิ่ม ${quotation.vat}%</span>
                <span class="summary-value">฿${((parseFloat(quotation.subtotal) - parseFloat(quotation.discount)) * parseFloat(quotation.vat) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="total-row">
                <span class="total-label">จำนวนเงินรวมทั้งสิ้น</span>
                <span class="total-value">฿${parseFloat(quotation.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <!-- Notes -->
            ${quotation.notes ? `
            <div class="notes-section">
              <div class="notes-title">หมายเหตุ:</div>
              <div>${quotation.notes.replace(/\n/g, '<br/>')}</div>
            </div>
            ` : ''}

            <!-- Terms -->
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 4px;">เงื่อนไขและข้อตกลง:</h3>
              <div style="font-size: 13px; color: #6b7280; padding-left: 8px;">
                <p>• ใบเสนอราคานี้มีอายุ 30 วัน นับจากวันที่ออกเอกสาร</p>
                <p>• ราคาดังกล่าวรวม VAT 7% แล้ว</p>
                <p>• เงื่อนไขการชำระเงิน: เงินสด หรือโอนเงิน</p>
                <p>• การยกเลิกหลังจากสั่งซื้อแล้วจะไม่คืนเงิน</p>
              </div>
            </div>

            <!-- Signatures Display (if any exist) -->
            ${(quotation.customerSignature || (quotation.signatures && quotation.signatures.length > 0)) ? `
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <h3 style="font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 16px; text-transform: uppercase;">ลายเซ็น</h3>
              <div style="display: table; width: 100%; table-layout: fixed; border-spacing: 16px 0; margin-left: -16px;">
                ${quotation.customerSignature ? `
                <div style="display: table-cell; text-align: center;">
                  <div style="border: 1px dashed #d1d5db; border-radius: 8px; padding: 12px; background: white; min-height: 100px; display: flex; align-items: center; justify-content: center;">
                    <img src="${quotation.customerSignature}" alt="ลายเซ็นผู้ว่าจ้าง" style="max-height: 80px; max-width: 100%;">
                  </div>
                  <p style="margin-top: 12px; font-weight: 600; color: #1f2937; font-size: 14px;">${quotation.customerName}</p>
                  <p style="font-size: 13px; color: #6b7280;">ผู้ว่าจ้าง</p>
                </div>
                ` : ''}
                ${quotation.signatures ? quotation.signatures.map((signature: any) => `
                <div style="display: table-cell; text-align: center;">
                  <div style="border: 1px dashed #d1d5db; border-radius: 8px; padding: 12px; background: white; min-height: 100px; display: flex; align-items: center; justify-content: center;">
                    <img src="${signature.signatureUrl}" alt="ลายเซ็น" style="max-height: 80px; max-width: 100%;">
                  </div>
                  <p style="margin-top: 12px; font-weight: 600; color: #1f2937; font-size: 14px;">${signature.signerName}</p>
                  <p style="font-size: 13px; color: #6b7280;">ผู้เสนอราคา</p>
                  <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                    วันที่: ${new Date(signature.signedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                `).join('') : ''}
              </div>
            </div>
            ` : ''}

            <!-- Call to Action -->
            <div class="cta-section">
              <div class="cta-text">คุณสามารถดูรายละเอียดและอนุมัติใบเสนอราคาได้ที่นี่</div>
              <a href="${process.env.FRONTEND_URL}/public/quotations/${quotation.approvalToken}" class="cta-button">
                ดูและอนุมัติใบเสนอราคา
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div>อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ</div>
            <div style="margin-top: 4px; font-weight: 600; color: #374151;">${process.env.SMTP_FROM_NAME}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = pdfBuffer
      ? [
        {
          filename: `quotation_${quotation.quotationNo}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ]
      : [];

    await this.sendEmail(
      customerEmail || quotation.customer?.email,
      `ใบเสนอราคา #${quotation.quotationNo} จาก ${process.env.SMTP_FROM_NAME}`,
      html,
      attachments
    );
  }

  // แจ้งเจ้าของธุรกิจเมื่อลูกค้าอนุมัติ
  async notifyOwnerOnApproval(ownerEmail: string, quotation: any) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Sarabun', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #10b981;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>ลูกค้าอนุมัติใบเสนอราคา!</h1>
          </div>
          <div class="content">
            <p><strong>ใบเสนอราคา #${quotation.quotationNo}</strong> ได้รับการอนุมัติแล้ว</p>
            
            <p><strong>ลูกค้า:</strong> ${quotation.customerName}</p>
            <p><strong>ยอดรวม:</strong> ฿${parseFloat(quotation.total).toLocaleString()}</p>
            <p><strong>วันที่อนุมัติ:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
            
            ${quotation.approvalNotes ? `<p><strong>หมายเหตุ:</strong> ${quotation.approvalNotes}</p>` : ''}
            
            <p style="margin-top: 30px;">กรุณาดำเนินการต่อไป</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(
      ownerEmail,
      `🎉 ลูกค้าอนุมัติใบเสนอราคา #${quotation.quotationNo}`,
      html
    );
  }

  // แจ้งเจ้าของธุรกิจเมื่อลูกค้าปฏิเสธ
  async notifyOwnerOnRejection(ownerEmail: string, quotation: any) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Sarabun', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #ef4444;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ลูกค้าปฏิเสธใบเสนอราคา</h1>
          </div>
          <div class="content">
            <p><strong>ใบเสนอราคา #${quotation.quotationNo}</strong> ถูกปฏิเสธ</p>
            
            <p><strong>ลูกค้า:</strong> ${quotation.customerName}</p>
            <p><strong>ยอดรวม:</strong> ฿${parseFloat(quotation.total).toLocaleString()}</p>
            <p><strong>วันที่ปฏิเสธ:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
            
            ${quotation.approvalNotes ? `<p><strong>เหตุผล:</strong> ${quotation.approvalNotes}</p>` : ''}
            
            <p style="margin-top: 30px;">กรุณาติดต่อลูกค้าเพื่อสอบถามรายละเอียดเพิ่มเติม</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(
      ownerEmail,
      `❌ ลูกค้าปฏิเสธใบเสนอราคา #${quotation.quotationNo}`,
      html
    );
  }

  // ส่งใบแจ้งหนี้ไปหาลูกค้า
  async sendInvoiceToCustomer(invoice: any, pdfBuffer?: Buffer, customerEmail?: string) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            overflow: hidden;
          }
          .document {
            padding: 48px;
          }
          .doc-header {
            display: table;
            width: 100%;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #2563eb;
          }
          .doc-header > div {
            display: table-cell;
            vertical-align: top;
          }
          .doc-header > div:first-child {
            width: 60%;
          }
          .doc-header > div:last-child {
            width: 40%;
            text-align: right;
          }
          .doc-logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 1px;
          }
          .doc-title {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
          }
          .doc-subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-top: 4px;
          }
          .info-grid {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-bottom: 32px;
            border-spacing: 16px 0;
            margin-left: -16px;
          }
          .info-col {
            display: table-cell;
            vertical-align: top;
          }
          .info-col.doc-info {
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #374151;
            text-transform: uppercase;
            margin-bottom: 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
          }
          .doc-info .section-title {
            border-bottom-color: #bfdbfe;
          }
          .info-row {
            display: table;
            width: 100%;
            margin-bottom: 6px;
            font-size: 14px;
          }
          .info-label {
            display: table-cell;
            color: #6b7280;
            width: 80px;
            font-weight: 500;
          }
          .info-value {
            display: table-cell;
            color: #1f2937;
            font-weight: 500;
          }
          table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
            font-size: 14px;
          }
          .items-table th {
            background-color: #eff6ff;
            color: #1f2937;
            padding: 12px 16px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #bfdbfe;
          }
          .items-table th.center { text-align: center; }
          .items-table th.right { text-align: right; }
          .items-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
            vertical-align: top;
          }
          .items-table td.center { text-align: center; }
          .items-table td.right { text-align: right; }
          .item-name {
            font-weight: 600;
            color: #111827;
          }
          .item-desc {
            font-size: 13px;
            color: #6b7280;
            margin-top: 4px;
          }
          .summary-section {
            margin-left: auto;
            width: 320px;
            background: #eff6ff;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 32px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            color: #374151;
            font-size: 14px;
          }
          .summary-value {
            font-weight: 600;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0 0;
            margin-top: 8px;
            border-top: 2px solid #bfdbfe;
            font-size: 18px;
            font-weight: bold;
            color: #111827;
          }
          .total-value {
            color: #2563eb;
          }
          .paid-row {
            color: #059669;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #bfdbfe;
          }
          .remaining-row {
            color: #dc2626;
          }
          .notes-section {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            margin-bottom: 24px;
            font-size: 14px;
          }
          .notes-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .footer {
            background: #f9fafb;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="document">
            
            <!-- Header - New Design -->
            <div class="doc-header">
              <div>
                <div style="font-size: 14px; font-weight: bold; color: #111827;">ระบบจัดการเอกสารธุรกิจ</div>
                <div style="font-size: 10px; color: #6b7280;">Business Document Management System</div>
                <div style="font-size: 10px; color: #374151; margin-top: 4px;">
                  123 ถนนสุขุมวิท กรุงเทพฯ 10110<br/>
                  Tel: 02-123-4567 | Email: info@business.com
                </div>
              </div>
              <div>
                <div class="doc-title">ใบแจ้งหนี้</div>
                <div class="doc-subtitle">INVOICE</div>
              </div>
            </div>

            <!-- Info Grid -->
            <div class="info-grid">
              
              <!-- Customer Info Column -->
              <div class="info-col">
                <div class="section-title">ข้อมูลลูกค้า | CUSTOMER INFORMATION</div>
                <div class="info-row">
                  <div class="info-label">ชื่อ / Name:</div>
                  <div class="info-value"><strong>${invoice.customerName}</strong></div>
                </div>
                ${invoice.customer?.taxId ? `
                <div class="info-row">
                  <div class="info-label">เลขที่ภาษี / Tax ID:</div>
                  <div class="info-value">${invoice.customer.taxId}</div>
                </div>` : ''}
                ${invoice.customerPhone ? `
                <div class="info-row">
                  <div class="info-label">โทรศัพท์ / Phone:</div>
                  <div class="info-value">${invoice.customerPhone}</div>
                </div>` : ''}
                ${invoice.customerAddress ? `
                <div class="info-row">
                  <div class="info-label">ที่อยู่ / Address:</div>
                  <div class="info-value">${invoice.customerAddress}</div>
                </div>` : ''}
              </div>

              <!-- Document Info -->
              <div class="info-col doc-info">
                <div class="section-title">ข้อมูลเอกสาร | DOCUMENT INFO</div>
                <div class="info-row">
                  <div class="info-label">เลขที่ / No.:</div>
                  <div class="info-value" style="text-align: right; color: #2563eb; font-weight: bold;">${invoice.invoiceNo}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">วันที่ / Date:</div>
                  <div class="info-value" style="text-align: right;">${new Date(invoice.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                ${invoice.dueDate ? `
                <div class="info-row">
                  <div class="info-label">ครบกำหนด / Due:</div>
                  <div class="info-value" style="text-align: right;">${new Date(invoice.dueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>` : ''}
              </div>
            </div>

            <!-- Items Table - Blue Header -->
            <table class="items-table">
              <thead>
                <tr style="background: #2563eb; color: white;">
                  <th style="width: 8%; background: #2563eb; color: white; border: 1px solid #1e40af;">ลำดับ<br/><span style="font-size: 10px; font-weight: normal;">No.</span></th>
                  <th style="width: 35%; background: #2563eb; color: white; border: 1px solid #1e40af;">รายการ<br/><span style="font-size: 10px; font-weight: normal;">Description</span></th>
                  <th class="center" style="width: 15%; background: #2563eb; color: white; border: 1px solid #1e40af;">จำนวน<br/><span style="font-size: 10px; font-weight: normal;">Quantity</span></th>
                  <th class="right" style="width: 20%; background: #2563eb; color: white; border: 1px solid #1e40af;">ราคา/หน่วย<br/><span style="font-size: 10px; font-weight: normal;">Unit Price</span></th>
                  <th class="right" style="width: 22%; background: #2563eb; color: white; border: 1px solid #1e40af;">จำนวนเงิน<br/><span style="font-size: 10px; font-weight: normal;">Amount</span></th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map((item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>
                      <div class="item-name">${item.productName}</div>
                      ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                    </td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">฿${parseFloat(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td class="right" style="font-weight: 600;">฿${parseFloat(item.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Summary -->
            <div class="summary-section">
              <div class="summary-row">
                <span class="summary-label">ยอดรวมเป็นเงิน</span>
                <span class="summary-value">฿${parseFloat(invoice.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ${parseFloat(invoice.discount) > 0 ? `
              <div class="summary-row">
                <span class="summary-label">ส่วนลด</span>
                <span class="summary-value" style="color: #ef4444;">-฿${parseFloat(invoice.discount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span class="summary-label">ภาษีมูลค่าเพิ่ม ${invoice.vat}%</span>
                <span class="summary-value">฿${((parseFloat(invoice.subtotal) - parseFloat(invoice.discount)) * parseFloat(invoice.vat) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="total-row">
                <span class="total-label">จำนวนเงินรวมทั้งสิ้น</span>
                <span class="total-value">฿${parseFloat(invoice.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ${parseFloat(invoice.paidAmount) > 0 ? `
              <div class="summary-row paid-row">
                <span class="summary-label" style="font-weight: 500;">ชำระแล้ว</span>
                <span class="summary-value">฿${parseFloat(invoice.paidAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              ${parseFloat(invoice.remainingAmount) > 0 ? `
              <div class="summary-row remaining-row">
                <span class="summary-label" style="font-weight: 500;">คงเหลือ</span>
                <span class="summary-value">฿${parseFloat(invoice.remainingAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
            </div>

            <!-- Bank/Payment Channels -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <h3 style="font-size: 14px; font-weight: bold; color: #1f2937; margin-bottom: 16px;">
                ช่องทางชำระเงิน
              </h3>
              <table style="width: 100%; border-spacing: 0 12px;">
                <tr>
                  <td style="width: 50%; padding-right: 6px;">
                    <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 48px; vertical-align: top;">
                            <div style="width: 48px; height: 48px; background: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">
                              K
                            </div>
                          </td>
                          <td style="padding-left: 12px; vertical-align: top;">
                            <div style="font-size: 13px;">
                              <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">ธ.กสิกรไทย</div>
                              <div style="color: #4b5563;"><span style="font-weight: 600; color: #111827;">209-1-72241-3</span></div>
                              <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">ชื่อบัญชี ฮาบีดีน บุญสาลี</div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                  <td style="width: 50%; padding-left: 6px;">
                    <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 48px; vertical-align: top;">
                            <div style="width: 48px; height: 48px; background: #7c3aed; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">
                              S
                            </div>
                          </td>
                          <td style="padding-left: 12px; vertical-align: top;">
                            <div style="font-size: 13px;">
                              <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">ธ.ไทยพาณิชย์</div>
                              <div style="color: #4b5563;"><span style="font-weight: 600; color: #111827;">302-429452-4</span></div>
                              <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">ชื่อบัญชี ฮาบีดีน บุญสาลี</div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Notes -->
            ${invoice.notes ? `
            <div class="notes-section">
              <div class="notes-title">หมายเหตุ:</div>
              <div>${invoice.notes.replace(/\n/g, '<br/>')}</div>
            </div>
            ` : ''}


          </div>

          <!-- Footer -->
          <div class="footer">
            <div>อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ</div>
            <div style="margin-top: 4px; font-weight: 600; color: #374151;">${process.env.SMTP_FROM_NAME}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = pdfBuffer
      ? [
        {
          filename: `invoice_${invoice.invoiceNo}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ]
      : [];

    await this.sendEmail(
      customerEmail || invoice.customer?.email || invoice.customerEmail,
      `ใบแจ้งหนี้ #${invoice.invoiceNo} จาก ${process.env.SMTP_FROM_NAME} `,
      html,
      attachments
    );
  }

  // ส่งใบเสร็จรับเงินไปหาลูกค้า
  async sendReceiptToCustomer(receipt: any, pdfBuffer?: Buffer) {
    const getPaymentMethodText = (method: string) => {
      const methods: Record<string, string> = {
        cash: 'เงินสด',
        transfer: 'โอนเงิน',
        credit_card: 'บัตรเครดิต',
        promptpay: 'พร้อมเพย์',
        mobile_banking: 'Mobile Banking',
        e_wallet: 'E-Wallet',
        check: 'เช็ค'
      };
      return methods[method] || method;
    };

    const html = `
  < !DOCTYPE html >
    <html>
    <head>
    <meta charset="UTF-8" >
      <style>
          * { margin: 0; padding: 0; box- sizing: border - box; }
          body {
  font - family: Arial, sans - serif;
  line - height: 1.6;
  color: #111827;
  background - color: #f7fafc;
  padding: 20px;
}
          .email - container {
  max - width: 800px;
  margin: 0 auto;
  background: white;
  border - radius: 8px;
  box - shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
          .document {
  padding: 48px;
}
          .doc - header {
  text - align: center;
  margin - bottom: 24px;
  padding - bottom: 16px;
  border - bottom: 2px solid #2563eb;
}
          .doc - title {
  font - size: 36px;
  font - weight: bold;
  margin - bottom: 8px;
  color: #111827;
}
          .doc - subtitle {
  font - size: 20px;
  color: #6b7280;
}
          .company - section {
  margin - bottom: 32px;
}
          .company - name {
  font - size: 20px;
  font - weight: bold;
  color: #111827;
  margin - bottom: 8px;
}
          .company - info {
  font - size: 14px;
  color: #6b7280;
  line - height: 1.5;
}
          .receipt - info {
  display: grid;
  grid - template - columns: 1fr 1fr;
  gap: 24px;
  padding: 16px;
  background: #eff6ff;
  border - radius: 8px;
  margin - bottom: 32px;
}
          .receipt - info - item {
  margin - bottom: 4px;
}
          .receipt - label {
  font - size: 12px;
  color: #6b7280;
  margin - bottom: 4px;
}
          .receipt - value {
  font - size: 18px;
  font - weight: 600;
  color: #111827;
}
          .section - title {
  font - size: 14px;
  font - weight: 600;
  color: #374151;
  margin - bottom: 12px;
}
          .customer - box {
  padding: 16px;
  background: #f9fafb;
  border - radius: 8px;
  margin - bottom: 32px;
}
          .customer - name {
  font - weight: 600;
  color: #111827;
  margin - bottom: 8px;
}
          .customer - detail {
  font - size: 14px;
  color: #6b7280;
  margin - bottom: 4px;
}
          .payment - table {
  width: 100 %;
  border: 1px solid #e5e7eb;
  border - radius: 8px;
  overflow: hidden;
  margin - bottom: 32px;
}
          .payment - table th {
  background: #f9fafb;
  padding: 12px 16px;
  text - align: left;
  font - size: 14px;
  font - weight: 600;
  color: #374151;
}
          .payment - table th.right {
  text - align: right;
}
          .payment - table td {
  padding: 12px 16px;
  border - top: 1px solid #e5e7eb;
  font - size: 14px;
}
          .payment - table td.right {
  text - align: right;
  font - weight: 600;
  color: #111827;
}
          .invoice - link {
  color: #2563eb;
  text - decoration: none;
}
          .amount - summary {
  padding: 24px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border - radius: 8px;
  margin - bottom: 32px;
}
          .amount - row {
  display: flex;
  justify - content: space - between;
  align - items: center;
}
          .amount - left {
  flex: 1;
}
          .amount - label {
  font - size: 14px;
  color: #6b7280;
  margin - bottom: 4px;
}
          .amount - value {
  font - size: 28px;
  font - weight: bold;
  color: #111827;
}
          .payment - method - box {
  text - align: right;
}
          .payment - method - label {
  font - size: 12px;
  color: #6b7280;
  margin - bottom: 4px;
}
          .payment - method - value {
  font - size: 14px;
  font - weight: 600;
  color: #111827;
}
          .footer {
  background: #f9fafb;
  padding: 24px;
  text - align: center;
  border - top: 1px solid #e5e7eb;
  font - size: 13px;
  color: #6b7280;
}
</style>
  </head>
  < body >
  <div class="email-container" >
    <div class="document" >
      <!--Header -->
        <div class="doc-header" >
          <div class="doc-title" > ใบเสร็จรับเงิน </div>
            < div class="doc-subtitle" > RECEIPT </div>
              </div>

              < !--Company Info-- >
                <div class="company-section" >
                  <div class="company-name" > นายสมชาย บุญจรัส </div>
                    < div class="company-info" >
                      <div>เลขที่ 23 ซ.เพชรเกษม 110แยก9 แขวงหนองค้างพลู </div>
                        < div > เข ตหนองแขม กรุงเทพฯ 10160 </div>
                          < div > เบอร์ติดต่อ: 094 - 4204792 </div>
                            < div > เลขประจำตัวผู้เสียภาษี: 3102101089827 </div>
                              </div>
                              </div>

                              < !--Receipt Info-- >
                                <div class="receipt-info" >
                                  <div class="receipt-info-item" >
                                    <div class="receipt-label" > เลขที่ใบเสร็จ </div>
                                      < div class="receipt-value" > ${receipt.receiptNo} </div>
                                        </div>
                                        < div class="receipt-info-item" >
                                          <div class="receipt-label" > วันที่ </div>
                                            < div class="receipt-value" > ${new Date(receipt.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} </div>
                                              </div>
                                              </div>

                                              < !--Customer Info-- >
                                                <div>
                                                <div class="section-title" > ที่ได้รับจาก </div>
                                                  < div class="customer-box" >
                                                    <div class="customer-name" > ${receipt.invoice?.customer?.name || receipt.invoice?.customerName} </div>
                ${receipt.invoice?.customer?.address || receipt.invoice?.customerAddress ? `
                <div class="customer-detail">${receipt.invoice?.customer?.address || receipt.invoice?.customerAddress}</div>
                ` : ''
      }
                ${receipt.invoice?.customer?.phone || receipt.invoice?.customerPhone ? `
                <div class="customer-detail">เบอร์ติดต่อ: ${receipt.invoice?.customer?.phone || receipt.invoice?.customerPhone}</div>
                ` : ''
      }
</div>
  </div>

  < !--Payment Details-- >
    <div>
    <div class="section-title" > ขอบคุณสำหรับการชำระเงินของคุณกับใบแจ้งหนี้ </div>
      < table class="payment-table" >
        <thead>
        <tr>
        <th>เลขที่ใบแจ้งหนี้ </th>
        < th class="right" > จำนวนเงิน </th>
          </tr>
          </thead>
          < tbody >
          <tr>
          <td>
          <span class="invoice-link" > ${receipt.invoice?.invoiceNo} </span>
            </td>
            < td class="right" >฿${parseFloat(receipt.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} </td>
              </tr>
              </tbody>
              </table>
              </div>

              < !--Amount Summary-- >
                <div class="amount-summary" >
                  <div class="amount-row" >
                    <div class="amount-left" >
                      <div class="amount-label" > จำนวนเงินที่ชำระทั้งหมด </div>
                        < div class="amount-value" >฿${parseFloat(receipt.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} </div>
                          </div>
                          < div class="payment-method-box" >
                            <div class="payment-method-label" > วิธีชำระเงิน </div>
                              < div class="payment-method-value" > ${getPaymentMethodText(receipt.paymentMethod)} </div>
                                </div>
                                </div>
                                </div>

            ${receipt.notes ? `
            <!-- Notes -->
            <div style="margin-bottom: 32px;">
              <div class="section-title">หมายเหตุ</div>
              <div style="padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 14px; color: #6b7280;">
                ${receipt.notes}
              </div>
            </div>
            ` : ''
      }
</div>

  < !--Footer -->
    <div class="footer" >
      <div>อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ </div>
      < div style = "margin-top: 4px; font-weight: 600; color: #374151;" > ${process.env.SMTP_FROM_NAME} </div>
        </div>
        </div>
        </body>
        </html>
          `;

    const attachments = pdfBuffer
      ? [
        {
          filename: `receipt_${receipt.receiptNo}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ]
      : [];

    await this.sendEmail(
      receipt.invoice.customer?.email || receipt.invoice.customerEmail,
      `ใบเสร็จรับเงิน #${receipt.receiptNo} - ขอบคุณที่ใช้บริการ`,
      html,
      attachments
    );
  }

  // Helper: แปลง payment method
  private getPaymentMethodText(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'เงินสด',
      'transfer': 'โอนเงิน',
      'credit': 'บัตรเครดิต',
      'promptpay': 'พร้อมเพย์'
    };
    return methods[method] || method;
  }

  // ทดสอบการส่ง email
  async testEmail(to: string) {
    const html = `
  < !DOCTYPE html >
    <html>
    <body>
    <h2>ทดสอบการส่ง Email </h2>
      < p > ระบบอีเมลทำงานได้ถูกต้อง! 🎉</p>
        < p > เวลา: ${new Date().toLocaleString('th-TH')} </p>
          </body>
          </html>
            `;

    await this.sendEmail(to, 'ทดสอบระบบ Email - Air Condition Management', html);
  }
  // ส่งอีเมลยืนยันตัวตน
  async sendEmailVerification(email: string, name: string, token: string) {
    const verificationLink = `${process.env.FRONTEND_URL} /verify-email/${token} `;

    const html = `
  < !DOCTYPE html >
    <html>
    <head>
    <meta charset="UTF-8" >
      <style>
      body {
  font - family: Arial, sans - serif;
  line - height: 1.6;
  color: #333;
  background - color: #f7fafc;
  margin: 0;
  padding: 20px;
}
          .container {
  max - width: 600px;
  margin: 0 auto;
  background: white;
  border - radius: 8px;
  overflow: hidden;
  box - shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
          .header {
  background: linear - gradient(135deg, #2563eb 0 %, #1e40af 100 %);
  color: white;
  padding: 40px 30px;
  text - align: center;
}
          .header h1 {
  margin: 0;
  font - size: 28px;
  font - weight: 700;
}
          .content {
  padding: 40px 30px;
}
          .greeting {
  font - size: 18px;
  font - weight: 600;
  margin - bottom: 20px;
  color: #111827;
}
          .message {
  font - size: 15px;
  color: #374151;
  margin - bottom: 30px;
  line - height: 1.8;
}
          .button - container {
  text - align: center;
  margin: 30px 0;
}
          .verify - button {
  display: inline - block;
  background: #2563eb;
  color: white;
  padding: 14px 40px;
  border - radius: 6px;
  text - decoration: none;
  font - weight: 600;
  font - size: 16px;
  box - shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
          .footer {
  background: #f9fafb;
  padding: 24px 30px;
  text - align: center;
  font - size: 13px;
  color: #6b7280;
  border - top: 1px solid #e5e7eb;
}
          .footer - note {
  margin - top: 16px;
  font - size: 12px;
  color: #9ca3af;
}
          .expiry {
  background: #fef3c7;
  border - left: 4px solid #f59e0b;
  padding: 12px 16px;
  margin: 20px 0;
  border - radius: 4px;
  font - size: 14px;
  color: #92400e;
}
</style>
  </head>
  < body >
  <div class="container" >
    <div class="header" >
      <h1>✉️ ยืนยันอีเมลของคุณ </h1>
        </div>
        < div class="content" >
          <div class="greeting" > สวัสดี ${name} </div>
            < div class="message" >
              ขอบคุณที่สมัครใช้งานระบบของเรา!<br>
กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณและเริ่มใช้งานระบบได้เลย
  </div>

  < div class="button-container" >
    <a href="${verificationLink}" class="verify-button" > ยืนยันอีเมล </a>
      </div>

      < div class="expiry" >
              ⏰ ลิงก์นี้จะหมดอายุใน < strong > 24 ชั่วโมง </strong>
  </div>

  < div class="message" >
    หากคุณไม่ได้สมัครใช้งานด้วยตัวเอง กรุณาเพิกเฉยอีเมลนี้
      </div>
      </div>
      < div class="footer" >
        <div>อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ </div>
        < div style = "margin-top: 4px; font-weight: 600; color: #374151;" > ${process.env.SMTP_FROM_NAME} </div>
          < div class="footer-note" >
            หากปุ่มไม่ทำงาน กรุณาคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์: <br>
              ${verificationLink}
</div>
  </div>
  </div>
  </body>
  </html>
    `;

    await this.sendEmail(
      email,
      '✉️ ยืนยันอีเมลของคุณ - ' + process.env.SMTP_FROM_NAME,
      html
    );
  }

  // ส่งอีเมลรีเซ็ตรหัสผ่าน
  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL} /reset-password/${token} `;

    const html = `
  < !DOCTYPE html >
    <html>
    <head>
    <meta charset="UTF-8" >
      <style>
      body {
  font - family: Arial, sans - serif;
  line - height: 1.6;
  color: #333;
  background - color: #f7fafc;
  margin: 0;
  padding: 20px;
}
          .container {
  max - width: 600px;
  margin: 0 auto;
  background: white;
  border - radius: 8px;
  overflow: hidden;
  box - shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
          .header {
  background: linear - gradient(135deg, #dc2626 0 %, #991b1b 100 %);
  color: white;
  padding: 40px 30px;
  text - align: center;
}
          .header h1 {
  margin: 0;
  font - size: 28px;
  font - weight: 700;
}
          .content {
  padding: 40px 30px;
}
          .greeting {
  font - size: 18px;
  font - weight: 600;
  margin - bottom: 20px;
  color: #111827;
}
          .message {
  font - size: 15px;
  color: #374151;
  margin - bottom: 30px;
  line - height: 1.8;
}
          .button - container {
  text - align: center;
  margin: 30px 0;
}
          .reset - button {
  display: inline - block;
  background: #dc2626;
  color: white;
  padding: 14px 40px;
  border - radius: 6px;
  text - decoration: none;
  font - weight: 600;
  font - size: 16px;
  box - shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}
          .footer {
  background: #f9fafb;
  padding: 24px 30px;
  text - align: center;
  font - size: 13px;
  color: #6b7280;
  border - top: 1px solid #e5e7eb;
}
          .footer - note {
  margin - top: 16px;
  font - size: 12px;
  color: #9ca3af;
}
          .expiry {
  background: #fef3c7;
  border - left: 4px solid #f59e0b;
  padding: 12px 16px;
  margin: 20px 0;
  border - radius: 4px;
  font - size: 14px;
  color: #92400e;
}
          .warning {
  background: #fef2f2;
  border - left: 4px solid #dc2626;
  padding: 12px 16px;
  margin: 20px 0;
  border - radius: 4px;
  font - size: 14px;
  color: #991b1b;
}
</style>
  </head>
  < body >
  <div class="container" >
    <div class="header" >
      <h1>🔒 รีเซ็ตรหัสผ่าน </h1>
        </div>
        < div class="content" >
          <div class="greeting" > สวัสดี ${name} </div>
            < div class="message" >
              เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ<br>
กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่
  </div>

  < div class="button-container" >
    <a href="${resetLink}" class="reset-button" > ตั้งรหัสผ่านใหม่ </a>
      </div>

      < div class="expiry" >
              ⏰ ลิงก์นี้จะหมดอายุใน < strong > 1 ชั่วโมง </strong>
  </div>

  < div class="warning" >
              ⚠️ หากคุณไม่ได้ร้องขอการรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้และเปลี่ยนรหัสผ่านของคุณทันที
  </div>
  </div>
  < div class="footer" >
    <div>อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ </div>
    < div style = "margin-top: 4px; font-weight: 600; color: #374151;" > ${process.env.SMTP_FROM_NAME} </div>
      < div class="footer-note" >
        หากปุ่มไม่ทำงาน กรุณาคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์: <br>
          ${resetLink}
</div>
  </div>
  </div>
  </body>
  </html>
    `;

    await this.sendEmail(
      email,
      '🔒 รีเซ็ตรหัสผ่าน - ' + process.env.SMTP_FROM_NAME,
      html
    );
  }
}

export default new EmailService();
