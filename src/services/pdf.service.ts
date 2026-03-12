import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import qrcode from 'qrcode';
import generatePayload from 'promptpay-qr';

const PROMPTPAY_ID = process.env.PROMPTPAY_ID || '0928980434';

class PDFService {
  private browser: any = null;

  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  private formatCurrency(amount: number | string): string {
    return parseFloat(amount.toString()).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Generate Quotation PDF with new design
  async generateQuotationPDF(quotation: any): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      const items = quotation.items.map((item: any, index: number) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 10px; text-align: center; color: #374151; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 12px 10px; border-right: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #111827;">${item.productName}</div>
            ${item.description ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${item.description}</div>` : ''}
          </td>
          <td style="padding: 12px 10px; text-align: center; color: #374151; border-right: 1px solid #e5e7eb;">${item.quantity}</td>
          <td style="padding: 12px 10px; text-align: right; color: #374151; border-right: 1px solid #e5e7eb;">${this.formatCurrency(item.price)}</td>
          <td style="padding: 12px 10px; text-align: right; font-weight: 600; color: #111827; border-right: 1px solid #e5e7eb;">${this.formatCurrency(item.total)}</td>
        </tr>
      `).join('');

      const vatAmount = (parseFloat(quotation.subtotal) * parseFloat(quotation.vat)) / 100;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Sarabun', Arial, sans-serif;
              color: #111827;
              padding: 40px;
              background: white;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 3px solid #2563eb;
            }
            .header-left {
              flex: 1;
            }
            .shop-info {
              flex: 1;
            }
            .shop-name {
              font-size: 14px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 2px;
            }
            .shop-subtitle {
              font-size: 10px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .shop-details {
              font-size: 10px;
              color: #374151;
              line-height: 1.6;
            }
            .header-right {
              text-align: right;
            }
            .header-title {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 4px;
            }
            .header-subtitle {
              font-size: 16px;
              color: #6b7280;
            }
            
            .info-section {
              display: flex;
              gap: 20px;
              margin-bottom: 20px;
            }
            .customer-info {
              flex: 1;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 1px solid #d1d5db;
            }
            .doc-info {
              width: fit-content;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 6px;
            }
            .info-label {
              width: 90px;
              font-weight: 600;
              color: #374151;
              font-size: 11px;
            }
            .info-value {
              flex: 1;
              color: #111827;
              font-size: 11px;
            }

            .doc-info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .doc-info-label {
              font-weight: 600;
              color: #374151;
              font-size: 11px;
            }
            .doc-info-value {
              color: #111827;
              font-size: 11px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #2563eb;
              color: white;
              font-weight: bold;
              text-align: left;
              padding: 12px 10px;
              font-size: 11px;
              border: 1px solid #1e40af;
            }
            th.center { text-align: center; }
            th.right { text-align: right; }
            th .subtitle {
              font-size: 9px;
              font-weight: normal;
              display: block;
              margin-top: 2px;
            }
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #e5e7eb;
              vertical-align: top;
              font-size: 12px;
            }
            td.center { text-align: center; }
            td.right { text-align: right; }

            .summary-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-box {
              width: 300px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              color: #374151;
              font-size: 12px;
            }
            .summary-value {
              font-weight: 600;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 16px;
              background-color: #eff6ff;
              border-radius: 4px;
              font-size: 14px;
              font-weight: bold;
              color: #111827;
              margin-top: 10px;
            }
            
            .notes-section {
              margin: 20px 0;
              padding: 12px;
              background-color: #f9fafb;
              border-left: 4px solid #2563eb;
              border-radius: 0 4px 4px 0;
            }
            .notes-title {
              font-size: 12px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 6px;
            }
            .notes-content {
              font-size: 11px;
              color: #4b5563;
              white-space: pre-line;
            }
            
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .signature-box {
              width: 45%;
            }
            .signature-line {
              border-bottom: 1px dashed #9ca3af;
              height: 60px;
              margin-bottom: 10px;
            }
            .signature-name {
              font-size: 11px;
              color: #4b5563;
              text-align: center;
            }
            
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          
          <div class="header-top">
            <div class="header-left">
              <div class="shop-info">
                <div class="shop-name">ระบบจัดการเอกสารธุรกิจ</div>
                <div class="shop-subtitle">Business Document Management System</div>
                <div class="shop-details">
                  123 ถนนสุขุมวิท กรุงเทพฯ 10110<br/>
                  Tel: 02-123-4567 | Email: info@business.com<br/>
                  เลขประจำตัวผู้เสียภาษี: 0-1234-56789-01-2
                </div>
              </div>
            </div>
            <div class="header-right">
              <div class="header-title">ใบเสนอราคา</div>
              <div class="header-subtitle">QUOTATION</div>
            </div>
          </div>

          <div class="info-section">
            <div class="customer-info">
              <div class="section-title">ข้อมูลลูกค้า | CUSTOMER INFORMATION</div>
              <div class="info-row">
                <div class="info-label">ชื่อ / Name</div>
                <div class="info-value"><strong>${quotation.customerName}</strong></div>
              </div>
              ${quotation.customer?.taxId ? `
              <div class="info-row">
                <div class="info-label">เลขที่ภาษี / Tax ID</div>
                <div class="info-value">${quotation.customer.taxId}</div>
              </div>
              ` : ''}
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

            <div class="doc-info">
              <div class="doc-info-row">
                <div class="doc-info-label">เลขที่เอกสาร / Document No.</div>
                <div class="doc-info-value" style="color: #2563eb; font-weight: bold;">${quotation.quotationNo}</div>
              </div>
              <div class="doc-info-row">
                <div class="doc-info-label">วันที่ / Date</div>
                <div class="doc-info-value">${this.formatDate(quotation.createdAt)}</div>
              </div>
              ${quotation.validUntil ? `
              <div class="doc-info-row">
                <div class="doc-info-label">วันหมดอายุ</div>
                <div class="doc-info-value">${this.formatDate(quotation.validUntil)}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="center" style="width: 8%; text-align: center;">
                  ลำดับ<span class="subtitle">No.</span>
                </th>
                <th style="width: 42%;">
                  รายการ<span class="subtitle">Description</span>
                </th>
                <th class="center" style="width: 15%; text-align: center;">
                  จำนวน<span class="subtitle">Quantity</span>
                </th>
                <th class="right" style="width: 17%; text-align: right;">
                  ราคา/หน่วย<span class="subtitle">Unit Price</span>
                </th>
                <th class="right" style="width: 18%; text-align: right;">
                  จำนวนเงิน<span class="subtitle">Amount</span>
                </th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>

          <div class="summary-container">
            <div class="summary-box">
              <div class="summary-row">
                <span>มูลค่ารวม/Subtotal</span>
                <span class="summary-value">${this.formatCurrency(quotation.subtotal)} บาท</span>
              </div>
              ${parseFloat(quotation.discount) > 0 ? `
              <div class="summary-row" style="color: #dc2626;">
                <span>ส่วนลด/Discount</span>
                <span class="summary-value">-${this.formatCurrency(quotation.discount)} บาท</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span>ภาษีมูลค่าเพิ่ม/VAT ${quotation.vat}%</span>
                <span class="summary-value">${this.formatCurrency(vatAmount)} บาท</span>
              </div>
              
              <div class="total-row">
                <span>จำนวนเงินทั้งสิ้น</span>
                <span>${this.formatCurrency(quotation.total)} บาท</span>
              </div>
            </div>
          </div>

          ${quotation.notes ? `
          <div class="notes-section">
            <div class="notes-title">หมายเหตุ:</div>
            <div class="notes-content">${quotation.notes}</div>
          </div>
          ` : ''}

          <div class="signatures">
            <div class="signature-box">
              <h3 style="font-size: 11px; font-weight: bold; color: #374151; margin-bottom: 8px;">เงื่อนไขและข้อตกลง</h3>
              <ul style="font-size: 10px; color: #4b5563; padding-left: 16px; margin: 0;">
                <li>ใบเสนอราคานี้มีอายุ 30 วัน นับจากวันที่ออกเอกสาร</li>
                <li>ราคาดังกล่าวรวม VAT 7% แล้ว</li>
                <li>เงื่อนไขการชำระเงิน: เงินสด หรือโอนเงิน</li>
                <li>การยกเลิกหลังจากสั่งซื้อแล้วจะไม่คืนเงิน</li>
              </ul>
            </div>
            
            ${quotation.signatures && quotation.signatures.filter((s: any) => s.type === 'shop').length > 0 ? `
            <div class="signature-box">
              <h3 style="font-size: 11px; font-weight: bold; color: #111827; margin-bottom: 8px; text-align: center;">ลายเซ็นผู้เสนอราคา</h3>
              ${quotation.signatures.filter((s: any) => s.type === 'shop').map((sig: any) => `
                <div style="border: 1px solid #d1d5db; padding: 8px; border-radius: 4px; text-align: center; background: white; margin-bottom: 4px;">
                  <img src="${sig.signatureUrl}" style="height: 48px;" alt="Signature" />
                </div>
                <p style="font-weight: 600; font-size: 11px; margin-top: 4px; text-align: center;">${sig.signerName}</p>
                <p style="font-size: 10px; color: #6b7280; text-align: center;">ผู้มีอำนาจลงนาม</p>
              `).join('')}
            </div>
            ` : `
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-name">ผู้เสนอราคา</div>
            </div>
            `}
          </div>

          <div class="footer">
            <p>ขอบคุณที่ใช้บริการ</p>
          </div>
        </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        printBackground: true
      });

      await page.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating quotation PDF:', error);
      throw error;
    }
  }

  // Generate Invoice PDF with new design
  async generateInvoicePDF(invoice: any): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      const items = invoice.items.map((item: any, index: number) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 10px; text-align: center; color: #374151; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 12px 10px; border-right: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #111827;">${item.productName}</div>
            ${item.description ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${item.description}</div>` : ''}
          </td>
          <td style="padding: 12px 10px; text-align: center; color: #374151; border-right: 1px solid #e5e7eb;">${item.quantity}</td>
          <td style="padding: 12px 10px; text-align: right; color: #374151; border-right: 1px solid #e5e7eb;">${this.formatCurrency(item.price)}</td>
          <td style="padding: 12px 10px; text-align: right; font-weight: 600; color: #111827; border-right: 1px solid #e5e7eb;">${this.formatCurrency(item.total)}</td>
        </tr>
      `).join('');

      const vatAmount = ((parseFloat(invoice.subtotal) - parseFloat(invoice.discount)) * parseFloat(invoice.vat)) / 100;

      // Generate PromptPay QR Code
      let qrCodeDataUrl = '';
      try {
        if (invoice.remainingAmount > 0) {
          const payload = generatePayload(PROMPTPAY_ID, { amount: parseFloat(invoice.remainingAmount) });
          qrCodeDataUrl = await qrcode.toDataURL(payload);
        }
      } catch (err) {
        console.error('Error generating PromptPay QR:', err);
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Sarabun', Arial, sans-serif;
              color: #111827;
              padding: 40px;
              background: white;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 3px solid #2563eb;
            }
            .header-left {
              flex: 1;
            }
            .shop-info {
              flex: 1;
            }
            .shop-name {
              font-size: 14px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 2px;
            }
            .shop-subtitle {
              font-size: 10px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .shop-details {
              font-size: 10px;
              color: #374151;
              line-height: 1.6;
            }
            .header-right {
              text-align: right;
            }
            .header-title {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 4px;
            }
            .header-subtitle {
              font-size: 16px;
              color: #6b7280;
            }
            
            .info-section {
              display: flex;
              gap: 20px;
              margin-bottom: 20px;
            }
            .customer-info {
              flex: 1;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 1px solid #d1d5db;
            }
            .doc-info {
              width: fit-content;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 6px;
            }
            .info-label {
              width: 90px;
              font-weight: 600;
              color: #374151;
              font-size: 11px;
            }
            .info-value {
              flex: 1;
              color: #111827;
              font-size: 11px;
            }

            .doc-info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .doc-info-label {
              font-weight: 600;
              color: #374151;
              font-size: 11px;
            }
            .doc-info-value {
              color: #111827;
              font-size: 11px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #2563eb;
              color: white;
              font-weight: bold;
              text-align: left;
              padding: 12px 10px;
              font-size: 11px;
              border: 1px solid #1e40af;
            }
            th.center { text-align: center; }
            th.right { text-align: right; }
            th .subtitle {
              font-size: 9px;
              font-weight: normal;
              display: block;
              margin-top: 2px;
            }
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #e5e7eb;
              vertical-align: top;
              font-size: 12px;
            }

            .summary-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-box {
              width: 300px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              color: #374151;
              font-size: 12px;
            }
            .summary-value {
              font-weight: 600;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 16px;
              background-color: #eff6ff;
              border-radius: 4px;
              font-size: 14px;
              font-weight: bold;
              color: #111827;
              margin-top: 10px;
            }
            
            .bank-info {
              margin: 20px 0;
              padding: 15px;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
            }
            .bank-title {
              font-size: 11px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 1px solid #d1d5db;
            }
            .bank-row {
              display: flex;
              margin-bottom: 4px;
              font-size: 11px;
            }
            .bank-label {
              width: 80px;
              font-weight: 600;
              color: #111827;
            }
            .bank-value {
              flex: 1;
              color: #374151;
            }
            
            .notes-section {
              margin: 20px 0;
              padding: 12px;
              background-color: #f9fafb;
              border-left: 4px solid #2563eb;
              border-radius: 0 4px 4px 0;
            }
            .notes-title {
              font-size: 12px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 6px;
            }
            .notes-content {
              font-size: 11px;
              color: #4b5563;
              white-space: pre-line;
            }
            
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          
          <div class="header-top">
            <div class="header-left">
              <div class="shop-info">
                <div class="shop-name">ระบบจัดการเอกสารธุรกิจ</div>
                <div class="shop-subtitle">Business Document Management System</div>
                <div class="shop-details">
                  123 ถนนสุขุมวิท กรุงเทพฯ 10110<br/>
                  Tel: 02-123-4567 | Email: info@business.com<br/>
                  เลขประจำตัวผู้เสียภาษี: 0-1234-56789-01-2
                </div>
              </div>
            </div>
            <div class="header-right">
              <div class="header-title">ใบแจ้งหนี้</div>
              <div class="header-subtitle">INVOICE</div>
            </div>
          </div>

          <div class="info-section">
            <div class="customer-info">
              <div class="section-title">ข้อมูลลูกค้า | CUSTOMER INFORMATION</div>
              <div class="info-row">
                <div class="info-label">ชื่อ / Name</div>
                <div class="info-value"><strong>${invoice.customerName}</strong></div>
              </div>
              ${invoice.customer?.taxId ? `
              <div class="info-row">
                <div class="info-label">เลขที่ภาษี / Tax ID</div>
                <div class="info-value">${invoice.customer.taxId}</div>
              </div>
              ` : ''}
              ${invoice.customerPhone ? `
              <div class="info-row">
                <div class="info-label">โทรศัพท์ / Phone</div>
                <div class="info-value">${invoice.customerPhone}</div>
              </div>
              ` : ''}
              ${invoice.customerAddress ? `
              <div class="info-row">
                <div class="info-label">ที่อยู่ / Address</div>
                <div class="info-value">${invoice.customerAddress}</div>
              </div>
              ` : ''}
            </div>

            <div class="doc-info">
              <div class="doc-info-row">
                <div class="doc-info-label">เลขที่เอกสาร / Document No.</div>
                <div class="doc-info-value" style="color: #2563eb; font-weight: bold;">${invoice.invoiceNo}</div>
              </div>
              <div class="doc-info-row">
                <div class="doc-info-label">วันที่ / Date</div>
                <div class="doc-info-value">${this.formatDate(invoice.createdAt)}</div>
              </div>
              ${invoice.dueDate ? `
              <div class="doc-info-row">
                <div class="doc-info-label">ครบกำหนด / Due Date</div>
                <div class="doc-info-value">${this.formatDate(invoice.dueDate)}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="center" style="width: 8%; text-align: center;">
                  ลำดับ<span class="subtitle">No.</span>
                </th>
                <th style="width: 42%;">
                  รายการ<span class="subtitle">Description</span>
                </th>
                <th class="center" style="width: 15%; text-align: center;">
                  จำนวน<span class="subtitle">Quantity</span>
                </th>
                <th class="right" style="width: 17%; text-align: right;">
                  ราคา/หน่วย<span class="subtitle">Unit Price</span>
                </th>
                <th class="right" style="width: 18%; text-align: right;">
                  จำนวนเงิน<span class="subtitle">Amount</span>
                </th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>

          <div class="summary-container">
            <div class="summary-box">
              <div class="summary-row">
                <span>มูลค่ารวม/Subtotal</span>
                <span class="summary-value">${this.formatCurrency(invoice.subtotal)} บาท</span>
              </div>
              ${parseFloat(invoice.discount) > 0 ? `
              <div class="summary-row" style="color: #dc2626;">
                <span>ส่วนลด/Discount</span>
                <span class="summary-value">-${this.formatCurrency(invoice.discount)} บาท</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span>ภาษีมูลค่าเพิ่ม/VAT ${invoice.vat}%</span>
                <span class="summary-value">${this.formatCurrency(vatAmount)} บาท</span>
              </div>
              
              <div class="total-row">
                <span>จำนวนเงินทั้งสิ้น</span>
                <span>${this.formatCurrency(invoice.total)} บาท</span>
              </div>
              
              ${parseFloat(invoice.paidAmount) > 0 ? `
              <div style="padding-top: 10px; border-top: 1px solid #e5e7eb; margin-top: 10px;">
                <div class="summary-row" style="color: #059669;">
                  <span>ชำระแล้ว</span>
                  <span class="summary-value">฿${this.formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div class="summary-row" style="color: #dc2626;">
                  <span>คงเหลือ</span>
                  <span class="summary-value">฿${this.formatCurrency(invoice.remainingAmount)}</span>
                </div>
              </div>
              ` : ''}
            </div>
          </div>

          <div style="margin-top: 25px; margin-bottom: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <div style="font-size: 12px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">
              ช่องทางชำระเงิน
            </div>
            <div style="display: flex; gap: 12px; margin-bottom: 10px;">
              <div style="flex: 1; display: flex; gap: 12px; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="width: 40px; height: 40px; background: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; flex-shrink: 0;">
                  K
                </div>
                <div style="flex: 1; font-size: 11px;">
                  <div style="font-weight: 600; color: #111827; margin-bottom: 3px;">ธ.กสิกรไทย</div>
                  <div style="color: #4b5563;"><span style="font-weight: 600; color: #111827;">209-1-72241-3</span></div>
                  <div style="color: #6b7280; font-size: 10px; margin-top: 2px;">ชื่อบัญชี ฮาบีดีน บุญสาลี</div>
                </div>
              </div>
              <div style="flex: 1; display: flex; gap: 12px; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <div style="width: 40px; height: 40px; background: #7c3aed; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; flex-shrink: 0;">
                  S
                </div>
                <div style="flex: 1; font-size: 11px;">
                  <div style="font-weight: 600; color: #111827; margin-bottom: 3px;">ธ.ไทยพาณิชย์</div>
                  <div style="color: #4b5563;"><span style="font-weight: 600; color: #111827;">302-429452-4</span></div>
                  <div style="color: #6b7280; font-size: 10px; margin-top: 2px;">ชื่อบัญชี ฮาบีดีน บุญสาลี</div>
                </div>
              </div>
            </div>
          </div>

          ${invoice.notes ? `
          <div class="notes-section">
            <div class="notes-title">หมายเหตุ:</div>
            <div class="notes-content">${invoice.notes}</div>
          </div>
          ` : ''}

          <div class="footer">
            <p>ขอบคุณที่ใช้บริการ</p>
          </div>
        </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        printBackground: true
      });

      await page.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  // Generate Receipt PDF with new design
  async generateReceiptPDF(receipt: any): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Sarabun', Arial, sans-serif;
              color: #111827;
              padding: 40px;
              background: white;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 3px solid #2563eb;
            }
            .header-left {
              flex: 1;
            }
            .shop-info {
              flex: 1;
            }
            .shop-name {
              font-size: 14px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 2px;
            }
            .shop-subtitle {
              font-size: 10px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .shop-details {
              font-size: 10px;
              color: #374151;
              line-height: 1.6;
            }
            .header-right {
              text-align: right;
            }
            .header-title {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 4px;
            }
            .header-subtitle {
              font-size: 16px;
              color: #6b7280;
            }
            
            .info-section {
              display: flex;
              gap: 20px;
              margin-bottom: 20px;
            }
            .customer-info {
              flex: 1;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 1px solid #d1d5db;
            }
            .doc-info {
              width: fit-content;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 6px;
            }
            .info-label {
              width: 90px;
              font-weight: 600;
              color: #374151;
              font-size: 11px;
            }
            .info-value {
              flex: 1;
              color: #111827;
              font-size: 11px;
            }

            .doc-info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .doc-info-label {
              font-weight: 600;
              color: #374151;
              font-size: 11px;
            }
            .doc-info-value {
              color: #111827;
              font-size: 11px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              overflow: hidden;
            }
            th {
              background-color: #2563eb;
              color: white;
              font-weight: bold;
              text-align: left;
              padding: 12px 10px;
              font-size: 11px;
              border: 1px solid #1e40af;
            }
            th .subtitle {
              font-size: 9px;
              font-weight: normal;
              display: block;
              margin-top: 2px;
            }
            td {
              padding: 12px 10px;
              border: 1px solid #e5e7eb;
              font-size: 12px;
            }

            .summary-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-box {
              width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 16px;
              background-color: #eff6ff;
              border-radius: 4px;
              font-size: 14px;
              font-weight: bold;
              color: #111827;
            }
            
            .bank-info {
              margin: 20px 0;
              padding: 15px;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
            }
            .bank-title {
              font-size: 11px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 1px solid #d1d5db;
            }
            .bank-row {
              display: flex;
              margin-bottom: 4px;
              font-size: 11px;
            }
            .bank-label {
              width: 80px;
              font-weight: 600;
              color: #111827;
            }
            .bank-value {
              flex: 1;
              color: #374151;
            }
            
            .notes-section {
              margin: 20px 0;
              padding: 12px;
              background-color: #f9fafb;
              border-left: 4px solid #2563eb;
              border-radius: 0 4px 4px 0;
            }
            .notes-title {
              font-size: 12px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 6px;
            }
            .notes-content {
              font-size: 11px;
              color: #4b5563;
            }
            
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          
          <div class="header-top">
            <div class="header-left">
              <div class="shop-info">
                <div class="shop-name">ระบบจัดการเอกสารธุรกิจ</div>
                <div class="shop-subtitle">Business Document Management System</div>
                <div class="shop-details">
                  123 ถนนสุขุมวิท กรุงเทพฯ 10110<br/>
                  Tel: 02-123-4567 | Email: info@business.com<br/>
                  เลขประจำตัวผู้เสียภาษี: 0-1234-56789-01-2
                </div>
              </div>
            </div>
            <div class="header-right">
              <div class="header-title">ใบเสร็จรับเงิน</div>
              <div class="header-subtitle">RECEIPT</div>
            </div>
          </div>

          <div class="info-section">
            <div class="customer-info">
              <div class="section-title">ที่ได้รับจาก | RECEIVED FROM</div>
              <div class="info-row">
                <div class="info-label">ชื่อ / Name</div>
                <div class="info-value"><strong>${receipt.invoice?.customerName || '-'}</strong></div>
              </div>
              ${receipt.invoice?.customerPhone ? `
              <div class="info-row">
                <div class="info-label">โทรศัพท์ / Phone</div>
                <div class="info-value">${receipt.invoice.customerPhone}</div>
              </div>
              ` : ''}
              ${receipt.invoice?.customerAddress ? `
              <div class="info-row">
                <div class="info-label">ที่อยู่ / Address</div>
                <div class="info-value">${receipt.invoice.customerAddress}</div>
              </div>
              ` : ''}
            </div>

            <div class="doc-info">
              <div class="doc-info-row">
                <div class="doc-info-label">เลขที่ใบเสร็จ / Receipt No.</div>
                <div class="doc-info-value" style="color: #2563eb; font-weight: bold;">${receipt.receiptNo}</div>
              </div>
              <div class="doc-info-row">
                <div class="doc-info-label">วันที่ / Date</div>
                <div class="doc-info-value">${this.formatDate(receipt.createdAt)}</div>
              </div>
              <div class="doc-info-row">
                <div class="doc-info-label">วิธีชำระ / Payment</div>
                <div class="doc-info-value">${this.getPaymentMethodLabel(receipt.paymentMethod)}</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 11px; font-weight: bold; color: #374151; margin-bottom: 10px;">รายละเอียดการชำระเงิน | PAYMENT DETAILS</h3>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">
                    เลขที่ใบแจ้งหนี้<span class="subtitle">Invoice No.</span>
                  </th>
                  <th style="text-align: right;">
                    จำนวนเงิน<span class="subtitle">Amount</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 600; color: #2563eb;">${receipt.invoice?.invoiceNo || '-'}</td>
                  <td style="text-align: right; font-weight: 600; color: #111827;">${this.formatCurrency(receipt.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="summary-container">
            <div class="summary-box">
              <div class="total-row">
                <span>จำนวนเงินที่ชำระ / Total Amount</span>
                <span>${this.formatCurrency(receipt.amount)} บาท</span>
              </div>
            </div>
          </div>

          ${receipt.notes ? `
          <div class="notes-section">
            <div class="notes-title">หมายเหตุ</div>
            <div class="notes-content">${receipt.notes}</div>
          </div>
          ` : ''}

          <div class="bank-info">
            <div class="bank-title">ข้อมูลการชำระเงิน | PAYMENT INFORMATION</div>
            <div class="bank-row">
              <div class="bank-label">ธนาคาร :</div>
              <div class="bank-value">กสิกรไทย</div>
            </div>
            <div class="bank-row">
              <div class="bank-label">เลขบัญชี :</div>
              <div class="bank-value">209-1-72241-3</div>
            </div>
            <div class="bank-row">
              <div class="bank-label">ชื่อบัญชี :</div>
              <div class="bank-value">ระบบจัดการเอกสารธุรกิจ</div>
            </div>
          </div>

          <div class="footer">
            <p>ขอบคุณที่ใช้บริการ</p>
          </div>
        </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        printBackground: true
      });

      await page.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
      throw error;
    }
  }

  private getPaymentMethodLabel(method: string): string {
    const methods: Record<string, string> = {
      cash: 'เงินสด',
      transfer: 'โอนเงิน',
      credit_card: 'บัตรเครดิต',
      promptpay: 'พร้อมเพย์',
      mobile_banking: 'Mobile Banking',
      e_wallet: 'E-Wallet',
      check: 'เช็ค',
    };
    return methods[method] || method;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default new PDFService();
