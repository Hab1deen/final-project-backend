import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      logger: true, // Log to console
      debug: true, // Include debug info
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    this.transporter.verify(function (error, success) {
      if (error) {
        console.error('[DEBUG] SMTP Connection Error:', error);
      } else {
        console.log('[DEBUG] SMTP Server is ready to take our messages');
      }
    });
  }

  // ส่ง email พื้นฐาน
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: any[]
  ) {
    console.log(`[DEBUG] Preparing to send email to: ${to}`);
    try {
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to,
        subject,
        html,
        attachments: attachments || [],
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
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
            color: #111827;
            background-color: #f7fafc;
            padding: 20px;
          }
          .email-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .document {
            padding: 48px;
          }
          .doc-header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #2563eb;
          }
          .doc-title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #111827;
          }
          .doc-subtitle {
            font-size: 20px;
            color: #6b7280;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
          }
          .customer-info {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
          }
          .info-header {
            font-size: 12px;
            font-weight: bold;
            color: #374151;
            text-transform: uppercase;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row {
            margin: 12px 0;
          }
          .info-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 2px;
          }
          .info-value {
            font-weight: 600;
            color: #111827;
          }
          .doc-info {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .doc-info-row {
            display: flex;
            justify-content: space-between;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .doc-info-label {
            font-size: 14px;
            color: #6b7280;
          }
          .doc-info-value {
            font-weight: 600;
            color: #111827;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #2563eb;
            color: white;
            padding: 12px 16px;
            text-align: left;
            font-size: 14px;
            font-weight: 600;
            border: 1px solid #1e40af;
          }
          th.center { text-align: center; }
          th.right { text-align: right; }
          td {
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            font-size: 14px;
          }
          td.center { text-align: center; }
          td.right { text-align: right; }
          .item-name {
            font-weight: 500;
            color: #111827;
          }
          .item-desc {
            font-size: 13px;
            color: #6b7280;
            margin-top: 4px;
          }
          .summary-table {
            margin-left: auto;
            width: 400px;
            margin-top: 24px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .summary-label {
            color: #6b7280;
            font-size: 14px;
          }
          .summary-value {
            font-weight: 600;
            color: #111827;
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
            <!-- Document Header -->
            <div class="doc-header">
              <div class="doc-title">ใบเสนอราคา</div>
              <div class="doc-subtitle">QUOTATION</div>
            </div>

            <!-- Info Grid -->
            <div class="info-grid">
              <!-- Customer Info -->
              <div class="customer-info">
                <div class="info-header">ข้อมูลลูกค้า | Customer Information</div>
                <div class="info-row">
                  <div class="info-label">ชื่อ / Name</div>
                  <div class="info-value">${quotation.customerName}</div>
                </div>
                ${quotation.customerPhone ? `
                <div class="info-row">
                  <div class="info-label">โทรศัพท์ / Phone</div>
                  <div class="info-value">${quotation.customerPhone}</div>
                </div>
                ` : ''}
                ${quotation.customerAddress ? `
                <div class="info-row">
                  <div class="info-label">ที่อยู่ / Address</div>
                  <div class="info-value">${quotation.customerAddress}</div>
                </div>
                ` : ''}
              </div>

              <!-- Document Info -->
              <div class="doc-info">
                <div class="doc-info-row">
                  <span class="doc-info-label">เลขที่เอกสาร / Document No.</span>
                  <span class="doc-info-value">${quotation.quotationNo}</span>
                </div>
                <div class="doc-info-row">
                  <span class="doc-info-label">วันที่ / Date</span>
                  <span class="doc-info-value">${new Date(quotation.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <table>
              <thead>
                <tr>
                  <th class="center" style="width: 5%;">ลำดับ<br>No.</th>
                  <th style="width: 40%;">รายการ<br>Description</th>
                  <th class="center" style="width: 15%;">จำนวน<br>Quantity</th>
                  <th class="right" style="width: 20%;">ราคา/หน่วย<br>Unit Price</th>
                  <th class="right" style="width: 20%;">จำนวนเงิน<br>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.items.map((item: any, index: number) => `
                  <tr>
                    <td class="center">${index + 1}</td>
                    <td>
                      <div class="item-name">${item.productName}</div>
                      ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                    </td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">${parseFloat(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td class="right">${parseFloat(item.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Summary -->
            <div class="summary-table">
              <div class="summary-row">
                <span class="summary-label">ยอดรวม / Subtotal</span>
                <span class="summary-value">฿${parseFloat(quotation.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ${parseFloat(quotation.discount) > 0 ? `
              <div class="summary-row">
                <span class="summary-label">ส่วนลด / Discount</span>
                <span class="summary-value">฿${parseFloat(quotation.discount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span class="summary-label">VAT ${quotation.vat}%</span>
                <span class="summary-value">฿${((parseFloat(quotation.subtotal) - parseFloat(quotation.discount)) * parseFloat(quotation.vat) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="total-row">
                <div style="display: flex; justify-content: space-between;">
                  <span class="total-label">ยอดรวมทั้งสิ้น / Grand Total</span>
                  <span class="total-value">฿${parseFloat(quotation.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <!-- Call to Action -->
            <div class="cta-section">
              <div class="cta-text">กรุณาตรวจสอบและอนุมัติใบเสนอราคา</div>
              <a href="${approvalLink}" class="cta-button">ดูรายละเอียดและอนุมัติ</a>
            </div>

            <!-- Signatures (if any) -->
            ${(quotation.signatures && quotation.signatures.length > 0) || quotation.customerSignature ? `
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <h3 style="font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 12px;">ลายเซ็น</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                ${quotation.customerSignature ? `
                <div style="text-align: center;">
                  <div style="border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; background: white; min-height: 80px; display: flex; align-items: center; justify-content: center;">
                    <img src="${quotation.customerSignature}" alt="ลายเซ็นผู้ว่าจ้าง" style="max-height: 64px;">
                  </div>
                  <p style="margin-top: 12px; font-weight: 600; color: #111827;">${quotation.customerName}</p>
                  <p style="font-size: 14px; color: #6b7280;">ผู้ว่าจ้าง</p>
                </div>
                ` : ''}
                ${quotation.signatures && quotation.signatures.filter((sig: any) => sig.type === 'shop').map((signature: any) => `
                <div style="text-align: center;">
                  <div style="border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; background: white; min-height: 80px; display: flex; align-items: center; justify-content: center;">
                    <img src="${signature.signatureUrl}" alt="ลายเซ็นผู้เสนอราคา" style="max-height: 64px;">
                  </div>
                  <p style="margin-top: 12px; font-weight: 600; color: #111827;">${signature.signerName}</p>
                  <p style="font-size: 14px; color: #6b7280;">ผู้เสนอราคา</p>
                  <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                    วันที่: ${new Date(signature.signedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                `).join('')}
              </div>
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
  async sendInvoiceToCustomer(invoice: any, pdfBuffer?: Buffer) {
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
            color: #111827;
            background-color: #f7fafc;
            padding: 20px;
          }
          .email-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .document {
            padding: 48px;
          }
          .doc-header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #2563eb;
          }
          .doc-title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #111827;
          }
          .doc-subtitle {
            font-size: 20px;
            color: #6b7280;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
          }
          .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          .info-row {
            margin: 8px 0;
            color: #374151;
          }
          .label {
            font-weight: 500;
            color: #111827;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
          }
          th {
            text-align: left;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #d1d5db;
          }
          th.center { text-align: center; }
          th.right { text-align: right; }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #374151;
          }
          td.center { text-align: center; }
          td.right { text-align: right; }
          .item-name {
            font-weight: 500;
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
            margin-bottom: 32px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            color: #374151;
          }
          .summary-label {
            color: #374151;
          }
          .summary-value {
            font-weight: 600;
            color: #374151;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-top: 2px solid #d1d5db;
            font-size: 20px;
            font-weight: bold;
            color: #111827;
          }
          .total-label {
            color: #111827;
          }
          .total-value {
            color: #2563eb;
          }
          .paid-row {
            padding: 8px 0;
            color: #059669;
            font-weight: 500;
          }
          .remaining-row {
            padding: 8px 0;
            color: #dc2626;
            font-weight: 500;
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
            <!-- Header -->
            <div class="doc-header">
              <div class="doc-title">ใบแจ้งหนี้</div>
              <div class="doc-subtitle">INVOICE</div>
            </div>

            <!-- Info Grid -->
            <div class="info-grid">
              <!-- Customer Info -->
              <div>
                <div class="section-title">ข้อมูลลูกค้า</div>
                <div class="info-row">
                  <span class="label">${invoice.customerName}</span>
                </div>
                ${invoice.customerPhone ? `<div class="info-row">${invoice.customerPhone}</div>` : ''}
                ${invoice.customerAddress ? `<div class="info-row">${invoice.customerAddress}</div>` : ''}
              </div>

              <!-- Document Info -->
              <div>
                <div class="section-title">ข้อมูลเอกสาร</div>
                <div class="info-row">
                  <span class="label">เลขที่:</span> ${invoice.invoiceNo}
                </div>
                <div class="info-row">
                  <span class="label">วันที่:</span> ${new Date(invoice.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">ลำดับ</th>
                  <th style="width: 35%;">รายการ</th>
                  <th class="center" style="width: 15%;">จำนวน</th>
                  <th class="right" style="width: 20%;">ราคา/หน่วย</th>
                  <th class="right" style="width: 22%;">ยอดรวม</th>
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
                <span class="summary-label">ยอดรวม</span>
                <span class="summary-value">฿${parseFloat(invoice.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ${parseFloat(invoice.discount) > 0 ? `
              <div class="summary-row">
                <span class="summary-label">ส่วนลด</span>
                <span class="summary-value">-฿${parseFloat(invoice.discount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span class="summary-label">VAT ${invoice.vat}%</span>
                <span class="summary-value">฿${((parseFloat(invoice.subtotal) - parseFloat(invoice.discount)) * parseFloat(invoice.vat) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="total-row">
                <span class="total-label">ยอดรวมสุทธิ</span>
                <span class="total-value">฿${parseFloat(invoice.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ${(parseFloat(invoice.total) - parseFloat(invoice.remainingAmount)) > 0 ? `
              <div class="summary-row paid-row">
                <span class="summary-label" style="font-weight: 500;">ชำระแล้ว</span>
                <span class="summary-value">฿${(parseFloat(invoice.total) - parseFloat(invoice.remainingAmount)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              ${parseFloat(invoice.remainingAmount) > 0 ? `
              <div class="summary-row remaining-row">
                <span class="summary-label" style="font-weight: 500;">คงเหลือ</span>
                <span class="summary-value">฿${parseFloat(invoice.remainingAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
            </div>

            <!-- Signatures (if any) -->
            ${(invoice.acceptanceSignature || (invoice.signatures && invoice.signatures.length > 0)) ? `
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <h3 style="font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 12px;">ลายเซ็น</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                ${invoice.acceptanceSignature ? `
                <div style="text-align: center;">
                  <div style="border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; background: white; min-height: 80px; display: flex; align-items: center; justify-content: center;">
                    <img src="${invoice.acceptanceSignature}" alt="ลายเซ็นรับงาน" style="max-height: 64px;">
                  </div>
                  <p style="margin-top: 12px; font-weight: 600; color: #111827;">${invoice.customerName}</p>
                  <p style="font-size: 14px; color: #6b7280;">ลูกค้า (รับงาน)</p>
                </div>
                ` : ''}
                ${invoice.signatures && invoice.signatures.map((signature: any) => `
                <div style="text-align: center;">
                  <div style="border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; background: white; min-height: 80px; display: flex; align-items: center; justify-content: center;">
                    <img src="${signature.signatureUrl}" alt="ลายเซ็น" style="max-height: 64px;">
                  </div>
                  <p style="margin-top: 12px; font-weight: 600; color: #111827;">${signature.signerName}</p>
                  <p style="font-size: 14px; color: #6b7280;">${signature.type === 'shop' ? 'ผู้ขาย' : 'ลูกค้า'}</p>
                  <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                    ลงนามวันที่: ${new Date(signature.signedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                `).join('')}
              </div>
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
      invoice.customer?.email || invoice.customerEmail,
      `ใบแจ้งหนี้ #${invoice.invoiceNo} จาก ${process.env.SMTP_FROM_NAME}`,
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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            background-color: #f7fafc;
            padding: 20px;
          }
          .email-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .document {
            padding: 48px;
          }
          .doc-header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #2563eb;
          }
          .doc-title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #111827;
          }
          .doc-subtitle {
            font-size: 20px;
            color: #6b7280;
          }
          .company-section {
            margin-bottom: 32px;
          }
          .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 8px;
          }
          .company-info {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
          }
          .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            padding: 16px;
            background: #eff6ff;
            border-radius: 8px;
            margin-bottom: 32px;
          }
          .receipt-info-item {
            margin-bottom: 4px;
          }
          .receipt-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .receipt-value {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
          }
          .customer-box {
            padding: 16px;
            background: #f9fafb;
            border-radius: 8px;
            margin-bottom: 32px;
          }
          .customer-name {
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
          }
          .customer-detail {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .payment-table {
            width: 100%;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 32px;
          }
          .payment-table th {
            background: #f9fafb;
            padding: 12px 16px;
            text-align: left;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
          }
          .payment-table th.right {
            text-align: right;
          }
          .payment-table td {
            padding: 12px 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .payment-table td.right {
            text-align: right;
            font-weight: 600;
            color: #111827;
          }
          .invoice-link {
            color: #2563eb;
            text-decoration: none;
          }
          .amount-summary {
            padding: 24px;
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 32px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .amount-left {
            flex: 1;
          }
          .amount-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .amount-value {
            font-size: 28px;
            font-weight: bold;
            color: #111827;
          }
          .payment-method-box {
            text-align: right;
          }
          .payment-method-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .payment-method-value {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
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
            <!-- Header -->
            <div class="doc-header">
              <div class="doc-title">ใบเสร็จรับเงิน</div>
              <div class="doc-subtitle">RECEIPT</div>
            </div>

            <!-- Company Info -->
            <div class="company-section">
              <div class="company-name">นายสมชาย บุญจรัส</div>
              <div class="company-info">
                <div>เลขที่ 23 ซ.เพชรเกษม 110แยก9 แขวงหนองค้างพลู</div>
                <div>เข ตหนองแขม กรุงเทพฯ 10160</div>
                <div>เบอร์ติดต่อ: 094-4204792</div>
                <div>เลขประจำตัวผู้เสียภาษี: 3102101089827</div>
              </div>
            </div>

            <!-- Receipt Info -->
            <div class="receipt-info">
              <div class="receipt-info-item">
                <div class="receipt-label">เลขที่ใบเสร็จ</div>
                <div class="receipt-value">${receipt.receiptNo}</div>
              </div>
              <div class="receipt-info-item">
                <div class="receipt-label">วันที่</div>
                <div class="receipt-value">${new Date(receipt.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>

            <!-- Customer Info -->
            <div>
              <div class="section-title">ที่ได้รับจาก</div>
              <div class="customer-box">
                <div class="customer-name">${receipt.invoice?.customer?.name || receipt.invoice?.customerName}</div>
                ${receipt.invoice?.customer?.address || receipt.invoice?.customerAddress ? `
                <div class="customer-detail">${receipt.invoice?.customer?.address || receipt.invoice?.customerAddress}</div>
                ` : ''}
                ${receipt.invoice?.customer?.phone || receipt.invoice?.customerPhone ? `
                <div class="customer-detail">เบอร์ติดต่อ: ${receipt.invoice?.customer?.phone || receipt.invoice?.customerPhone}</div>
                ` : ''}
              </div>
            </div>

            <!-- Payment Details -->
            <div>
              <div class="section-title">ขอบคุณสำหรับการชำระเงินของคุณกับใบแจ้งหนี้</div>
              <table class="payment-table">
                <thead>
                  <tr>
                    <th>เลขที่ใบแจ้งหนี้</th>
                    <th class="right">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span class="invoice-link">${receipt.invoice?.invoiceNo}</span>
                    </td>
                    <td class="right">฿${parseFloat(receipt.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Amount Summary -->
            <div class="amount-summary">
              <div class="amount-row">
                <div class="amount-left">
                  <div class="amount-label">จำนวนเงินที่ชำระทั้งหมด</div>
                  <div class="amount-value">฿${parseFloat(receipt.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="payment-method-box">
                  <div class="payment-method-label">วิธีชำระเงิน</div>
                  <div class="payment-method-value">${getPaymentMethodText(receipt.paymentMethod)}</div>
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
      <!DOCTYPE html>
      <html>
      <body>
        <h2>ทดสอบการส่ง Email</h2>
        <p>ระบบอีเมลทำงานได้ถูกต้อง! 🎉</p>
        <p>เวลา: ${new Date().toLocaleString('th-TH')}</p>
      </body>
      </html>
    `;

    await this.sendEmail(to, 'ทดสอบระบบ Email - Air Condition Management', html);
  }
  // ส่งอีเมลยืนยันตัวตน
  async sendEmailVerification(email: string, name: string, token: string) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f7fafc;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #111827;
          }
          .message {
            font-size: 15px;
            color: #374151;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .verify-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 14px 40px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }
          .footer {
            background: #f9fafb;
            padding: 24px 30px;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
          .footer-note {
            margin-top: 16px;
            font-size: 12px;
            color: #9ca3af;
          }
          .expiry {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ ยืนยันอีเมลของคุณ</h1>
          </div>
          <div class="content">
            <div class="greeting">สวัสดี ${name}</div>
            <div class="message">
              ขอบคุณที่สมัครใช้งานระบบของเรา!<br>
              กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณและเริ่มใช้งานระบบได้เลย
            </div>
            
            <div class="button-container">
              <a href="${verificationLink}" class="verify-button">ยืนยันอีเมล</a>
            </div>

            <div class="expiry">
              ⏰ ลิงก์นี้จะหมดอายุใน <strong>24 ชั่วโมง</strong>
            </div>

            <div class="message">
              หากคุณไม่ได้สมัครใช้งานด้วยตัวเอง กรุณาเพิกเฉยอีเมลนี้
            </div>
          </div>
          <div class="footer">
            <div>อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ</div>
            <div style="margin-top: 4px; font-weight: 600; color: #374151;">${process.env.SMTP_FROM_NAME}</div>
            <div class="footer-note">
              หากปุ่มไม่ทำงาน กรุณาคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br>
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
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f7fafc;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #111827;
          }
          .message {
            font-size: 15px;
            color: #374151;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .reset-button {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 14px 40px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          .footer {
            background: #f9fafb;
            padding: 24px 30px;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
          .footer-note {
            margin-top: 16px;
            font-size: 12px;
            color: #9ca3af;
          }
          .expiry {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #92400e;
          }
          .warning {
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #991b1b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 รีเซ็ตรหัสผ่าน</h1>
          </div>
          <div class="content">
            <div class="greeting">สวัสดี ${name}</div>
            <div class="message">
              เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ<br>
              กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่
            </div>
            
            <div class="button-container">
              <a href="${resetLink}" class="reset-button">ตั้งรหัสผ่านใหม่</a>
            </div>

            <div class="expiry">
              ⏰ ลิงก์นี้จะหมดอายุใน <strong>1 ชั่วโมง</strong>
            </div>

            <div class="warning">
              ⚠️ หากคุณไม่ได้ร้องขอการรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้และเปลี่ยนรหัสผ่านของคุณทันที
            </div>
          </div>
          <div class="footer">
            <div>อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ</div>
            <div style="margin-top: 4px; font-weight: 600; color: #374151;">${process.env.SMTP_FROM_NAME}</div>
            <div class="footer-note">
              หากปุ่มไม่ทำงาน กรุณาคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br>
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
