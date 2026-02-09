import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import qrcode from 'qrcode';
import generatePayload from 'promptpay-qr';

const PROMPTPAY_ID = process.env.PROMPTPAY_ID || '0123456789'; // Fallback to dummy ID if not set


class PDFService {
  private browser: any = null;

  // Initialize browser (singleton)
  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  // Helper: Load HTML template
  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(__dirname, '../templates/pdf', `${templateName}.html`);
    return await fs.readFile(templatePath, 'utf-8');
  }

  // Helper: Replace template variables
  private replaceVariables(html: string, data: any): string {
    let result = html;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, data[key] || '');
    });
    return result;
  }

  // Helper: Format currency
  private formatCurrency(amount: number | string): string {
    return parseFloat(amount.toString()).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Helper: Format date
  private formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Generate Quotation PDF
  async generateQuotationPDF(quotation: any): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Prepare data
      const items = quotation.items.map((item: any, index: number) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${index + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #111827;">${item.productName}</div>
            ${item.description ? `<div style="font-size: 14px; color: #6b7280; margin-top: 4px;">${item.description}</div>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">฿${this.formatCurrency(item.price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">฿${this.formatCurrency(item.total)}</td>
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
            body { font-family: 'Sarabun', Arial, sans-serif; color: #111827; padding: 20px; background: white; }
            /* Header matches Frontend: border-b-2 border-blue-600 */
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
            .document-title { font-size: 36px; font-weight: bold; color: #111827; margin-bottom: 8px; }
            .document-subtitle { font-size: 20px; color: #4b5563; }
            .document-no { font-size: 16px; color: #6b7280; }
            
            .info-section { margin: 20px 0; }
            .info-title { font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; uppercase; }
            .info-item { margin-bottom: 8px; font-size: 14px; color: #374151; }
            .info-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
            .info-value { font-weight: 600; color: #111827; font-size: 14px; }
            
            /* Table matches Frontend: bg-blue-600 text-white for header */
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { 
              background: #2563eb; 
              color: white; 
              padding: 12px 16px; 
              text-align: left; 
              font-weight: 600; 
              font-size: 14px;
              border: 1px solid #1d4ed8; /* border-blue-700 */
            }
            td { 
              padding: 12px 16px; 
              border: 1px solid #e5e7eb; /* border-gray-300 */
              font-size: 14px;
              color: #111827;
            }
            
            .summary { margin-top: 20px; width: 384px; margin-left: auto; } /* w-96 */
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .summary-label { color: #374151; font-size: 14px; }
            .summary-value { font-weight: 600; color: #111827; }
            
            /* Total Row matches Frontend: bg-blue-50 text-blue-600 */
            .total-row { 
              display: flex; 
              justify-content: space-between;
              background-color: #eff6ff; /* bg-blue-50 */
              padding: 12px 16px;
              border-radius: 8px;
              margin-top: 8px;
            }
            .total-label { font-size: 18px; font-weight: bold; color: #111827; }
            .total-value { font-size: 20px; font-weight: bold; color: #2563eb; }
            
            .notes { margin-top: 30px; padding: 12px; background: #fefce8; border-left: 4px solid #facc15; border-radius: 4px; }
            .notes-title { font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 4px; }
            .notes-content { font-size: 12px; color: #374151; white-space: pre-line; }
            
            .footer { margin-top: 15px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="text-align: center;">
              <div class="document-title">ใบเสนอราคา</div>
              <div class="document-subtitle">QUOTATION</div>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <div class="document-no" style="text-align: right;">
                    <strong>เลขที่:</strong> ${quotation.quotationNo}<br>
                    <strong>วันที่:</strong> ${this.formatDate(quotation.createdAt)}
                </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 30px;">
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; height: fit-content;">
              <h3 class="info-title">ข้อมูลลูกค้า | Customer Information</h3>
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                 <div>
                    <div class="info-label">ชื่อ / Name</div>
                    <div class="info-value">${quotation.customerName}</div>
                 </div>
              </div>
              ${quotation.customer?.taxId ? `
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                 <div>
                    <div class="info-label">เลขประจำตัวผู้เสียภาษี / Tax ID</div>
                    <div class="info-value">${quotation.customer.taxId}</div>
                 </div>
              </div>` : ''}
              ${quotation.customerPhone ? `
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                 <div>
                    <div class="info-label">โทรศัพท์ / Phone</div>
                    <div class="info-value">${quotation.customerPhone}</div>
                 </div>
              </div>` : ''}
              ${quotation.customerAddress ? `
              <div style="display: flex; gap: 8px;">
                 <div>
                    <div class="info-label">ที่อยู่ / Address</div>
                    <div class="info-value">${quotation.customerAddress}</div>
                 </div>
              </div>` : ''}
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
                <span style="color: #4b5563; font-size: 14px;">เลขที่เอกสาร / Document No.</span>
                <span style="font-weight: 600; color: #111827;">${quotation.quotationNo}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
                <span style="color: #4b5563; font-size: 14px;">วันที่ / Date</span>
                <span style="color: #111827;">${this.formatDate(quotation.createdAt)}</span>
              </div>
              ${quotation.validUntil ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
                <span style="color: #4b5563; font-size: 14px;">วันหมดอายุ / Valid Until</span>
                <span style="color: #111827;">${this.formatDate(quotation.validUntil)}</span>
              </div>` : ''}
            </div>
          </div>

          <div>
            <table>
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">ลำดับ<br>No.</th>
                  <th style="width: 40%; text-align: left;">รายการ<br>Description</th>
                  <th style="width: 15%; text-align: center;">จำนวน<br>Quantity</th>
                  <th style="width: 20%; text-align: right;">ราคา/หน่วย<br>Unit Price</th>
                  <th style="width: 20%; text-align: right;">จำนวนเงิน<br>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${items}
                ${/* Empty rows loop could go here if needed, but keeping it simple for PDF */ ''}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">ยอดรวม / Subtotal</span>
              <span class="summary-value">${this.formatCurrency(quotation.subtotal)} บาท</span>
            </div>
            ${parseFloat(quotation.discount) > 0 ? `
            <div class="summary-row">
              <span class="summary-label">ส่วนลด / Discount</span>
              <span class="summary-value" style="color: #dc2626;">-${this.formatCurrency(quotation.discount)} บาท</span>
            </div>
            ` : ''}
            <div class="summary-row">
              <span class="summary-label">ภาษีมูลค่าเพิ่ม ${quotation.vat}% / VAT ${quotation.vat}%</span>
              <span class="summary-value">${this.formatCurrency(vatAmount)} บาท</span>
            </div>
            <div class="total-row">
              <span class="total-label">ยอดรวมสุทธิ / Grand Total</span>
              <span class="total-value">${this.formatCurrency(quotation.total)} บาท</span>
            </div>
          </div>

          ${quotation.notes ? `
          <div class="notes">
            <div class="notes-title">หมายเหตุ / Remarks</div>
            <div class="notes-content">${quotation.notes}</div>
          </div>
          ` : ''}
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
             <div>
                <h3 style="font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 8px;">เงื่อนไขและข้อตกลง</h3>
                <ul style="font-size: 10px; color: #4b5563; padding-left: 16px; margin: 0;">
                    <li>ใบเสนอราคานี้มีอายุ 30 วัน นับจากวันที่ออกเอกสาร</li>
                    <li>ราคาดังกล่าวรวม VAT 7% แล้ว</li>
                    <li>เงื่อนไขการชำระเงิน: เงินสด หรือโอนเงิน</li>
                    <li>การยกเลิกหลังจากสั่งซื้อแล้วจะไม่คืนเงิน</li>
                </ul>
             </div>
             
             ${quotation.signatures && quotation.signatures.filter((s: any) => s.type === 'shop').length > 0 ? `
             <div style="text-align: center;">
                 <h3 style="font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 8px;">ลายเซ็นผู้เสนอราคา</h3>
                 ${quotation.signatures.filter((s: any) => s.type === 'shop').map((sig: any) => `
                     <div style="border: 1px solid #d1d5db; padding: 8px; border-radius: 4px; display: inline-block; background: white;">
                        <img src="${sig.signatureUrl}" style="height: 48px;" alt="Signature" />
                     </div>
                     <p style="font-weight: 600; font-size: 12px; margin-top: 4px;">${sig.signerName}</p>
                 `).join('')}
             </div>
             ` : ''}
          </div>

          <div class="footer">
            <p>เอกสารนี้สร้างโดยระบบจัดการเอกสารธุรกิจ | This document is generated by Business Document Management System</p>
            <p style="color: #9ca3af; margin-top: 4px;">หน้า 1/1 | Page 1/1</p>
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

  // Generate Invoice PDF
  async generateInvoicePDF(invoice: any): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Prepare items HTML
      const items = invoice.items.map((item: any, index: number) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 10px; color: #374151;">${index + 1}</td>
          <td style="padding: 8px 10px;">
            <div style="font-weight: 500; color: #111827;">${item.productName}</div>
            ${item.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.description}</div>` : ''}
          </td>
          <td style="padding: 8px 10px; text-align: center; color: #374151;">${item.quantity}</td>
          <td style="padding: 8px 10px; text-align: right; color: #374151;">฿${this.formatCurrency(item.price)}</td>
          <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #111827;">฿${this.formatCurrency(item.total)}</td>
        </tr>
      `).join('');

      const paidAmount = parseFloat(invoice.total) - parseFloat(invoice.remainingAmount);

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
              font-family: Arial, sans-serif;
              color: #111827;
              padding: 30px;
              background: white;
              font-size: 13px;
            }
            .doc-header {
              text-align: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #2563eb;
            }
            .doc-title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 4px;
              color: #111827;
            }
            .doc-subtitle {
              font-size: 16px;
              color: #6b7280;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 13px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .info-row {
              margin: 4px 0;
              color: #374151;
            }
            .icon-text {
              display: flex;
              align-items: flex-start;
              gap: 8px;
            }
            .label {
              font-weight: 500;
              color: #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              text-align: left;
              padding: 8px 10px;
              font-size: 13px;
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #d1d5db;
              background-color: #f9fafb;
            }
            th.center { text-align: center; }
            th.right { text-align: right; }
            .summary-section {
              max-width: 300px;
              margin-left: auto;
              margin-bottom: 20px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              color: #374151;
            }
            .summary-value {
              font-weight: 600;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-top: 2px solid #d1d5db;
              font-size: 18px;
              font-weight: bold;
              color: #111827;
            }
            .total-value {
              color: #2563eb;
            }
            .paid-row {
              color: #059669;
              font-weight: 500;
            }
            .remaining-row {
              color: #dc2626;
              font-weight: 500;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
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
              ${invoice.customer?.taxId ? `<div class="info-row" style="font-size: 14px;">เลขประจำตัวผู้เสียภาษี: ${invoice.customer.taxId}</div>` : ''}
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
                <span class="label">วันที่:</span> ${this.formatDate(invoice.createdAt)}
              </div>
              ${invoice.dueDate ? `<div class="info-row"><span class="label">ครบกำหนด:</span> ${this.formatDate(invoice.dueDate)}</div>` : ''}
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
              ${items}
            </tbody>
          </table>

          <!-- Summary -->
          <div class="summary-section">
            <div class="summary-row">
              <span>ยอดรวม</span>
              <span class="summary-value">฿${this.formatCurrency(invoice.subtotal)}</span>
            </div>
            ${parseFloat(invoice.discount) > 0 ? `
            <div class="summary-row">
              <span>ส่วนลด</span>
              <span class="summary-value">-฿${this.formatCurrency(invoice.discount)}</span>
            </div>
            ` : ''}
            <div class="summary-row">
              <span>VAT ${invoice.vat}%</span>
              <span class="summary-value">฿${this.formatCurrency(((parseFloat(invoice.subtotal) - parseFloat(invoice.discount)) * parseFloat(invoice.vat)) / 100)}</span>
            </div>
            <div class="total-row">
              <span>ยอดรวมสุทธิ</span>
              <span class="total-value">฿${this.formatCurrency(invoice.total)}</span>
            </div>
            ${paidAmount > 0 ? `
            <div class="summary-row paid-row">
              <span style="font-weight: 500;">ชำระแล้ว</span>
              <span class="summary-value">฿${this.formatCurrency(paidAmount)}</span>
            </div>
            ` : ''}
            ${parseFloat(invoice.remainingAmount) > 0 ? `
            <div class="summary-row remaining-row">
              <span style="font-weight: 500;">คงเหลือ</span>
              <span class="summary-value">฿${this.formatCurrency(invoice.remainingAmount)}</span>
            </div>
            ${qrCodeDataUrl ? `
            <div style="margin-top: 16px; text-align: right;">
               <img src="${qrCodeDataUrl}" width="100" height="100" style="display: inline-block; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px; margin-bottom: 4px;" />
               <div style="font-size: 10px; font-weight: 700; color: #1e40af;">ชำระเงินทางออนไลน์</div>
            </div>
            ` : ''}
            ` : ''}
          </div>

          ${invoice.notes ? `
          <div style="padding: 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 32px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">หมายเหตุ</h3>
            <p style="color: #374151; white-space: pre-line;">${invoice.notes}</p>
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

  // Generate Receipt PDF
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
            body { font-family: 'Sarabun', Arial, sans-serif; color: #111827; padding: 40px; background: white; }
            .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 28px; font-weight: bold; color: #10b981; margin-bottom: 8px; }
            .document-title { font-size: 24px; font-weight: bold; color: #111827; margin-top: 10px; }
            .document-no { font-size: 16px; color: #6b7280; }
            .info-section { margin: 30px 0; background: #f9fafb; padding: 20px; border-radius: 8px; }
            .info-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .info-item { margin: 8px 0; color: #374151; }
            .info-label { font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 4px; }
            .info-value { color: #111827; font-size: 16px; }
            .payment-summary { margin: 30px 0; background: #dcfce7; padding: 24px; border-radius: 8px; border: 2px solid #10b981; }
            .summary-title { font-size: 20px; font-weight: 700; color: #065f46; margin-bottom: 16px; }
            .summary-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; }
            .summary-label { color: #065f46; font-weight: 600; }
            .summary-value { font-weight: 700; color: #065f46; font-size: 18px; }
            .amount-paid { background: white; padding: 20px; border-radius: 8px; margin-top: 16px; border: 1px solid #10b981; }
            .amount-paid-label { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
            .amount-paid-value { font-size: 32px; font-weight: 700; color: #10b981; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
            .thank-you { background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
            .thank-you-text { font-size: 20px; font-weight: 600; color: #065f46; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Air Condition Management System</div>
            <div class="document-title">ใบเสร็จรับเงิน</div>
            <div class="document-no">#${receipt.receiptNo}</div>
          </div>

          <div class="info-section">
            <div class="info-title">ข้อมูลลูกค้า</div>
            <div class="info-grid">
              <div>
                <div class="info-label">ชื่อลูกค้า</div>
                <div class="info-value">${receipt.invoice.customerName}</div>
              </div>
              ${receipt.invoice.customerPhone ? `
              <div>
                <div class="info-label">เบอร์โทรศัพท์</div>
                <div class="info-value">${receipt.invoice.customerPhone}</div>
              </div>
              ` : ''}
            </div>
            ${receipt.invoice.customerAddress ? `
            <div style="margin-top: 12px;">
              <div class="info-label">ที่อยู่</div>
              <div class="info-value">${receipt.invoice.customerAddress}</div>
            </div>
            ` : ''}
          </div>

          <div class="info-section">
            <div class="info-title">ข้อมูลการชำระเงิน</div>
            <div class="info-grid">
              <div>
                <div class="info-label">เลขที่ใบแจ้งหนี้</div>
                <div class="info-value">${receipt.invoice.invoiceNo}</div>
              </div>
              <div>
                <div class="info-label">วันที่ชำระ</div>
                <div class="info-value">${this.formatDate(receipt.paymentDate)}</div>
              </div>
              <div>
                <div class="info-label">วิธีการชำระเงิน</div>
                <div class="info-value">${this.getPaymentMethodText(receipt.paymentMethod)}</div>
              </div>
              <div>
                <div class="info-label">วันที่ออกใบเสร็จ</div>
                <div class="info-value">${this.formatDate(receipt.createdAt)}</div>
              </div>
            </div>
            ${receipt.notes ? `
            <div style="margin-top: 16px;">
              <div class="info-label">หมายเหตุ</div>
              <div class="info-value">${receipt.notes}</div>
            </div>
            ` : ''}
          </div>

          <div class="payment-summary">
            <div class="summary-title">สรุปการชำระเงิน</div>
            <div class="summary-row">
              <span class="summary-label">ยอดรวมใบแจ้งหนี้:</span>
              <span class="summary-value">฿${this.formatCurrency(receipt.invoice.total)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">ชำระแล้วก่อนหน้า:</span>
              <span class="summary-value">฿${this.formatCurrency(parseFloat(receipt.invoice.total) - parseFloat(receipt.invoice.remainingAmount) - parseFloat(receipt.amount))}</span>
            </div>
            <div class="amount-paid">
              <div class="amount-paid-label">จำนวนเงินที่ชำระครั้งนี้</div>
              <div class="amount-paid-value">฿${this.formatCurrency(receipt.amount)}</div>
            </div>
            <div class="summary-row" style="border-top: 2px solid #10b981; padding-top: 16px; margin-top: 16px;">
              <span class="summary-label">คงเหลือ:</span>
              <span class="summary-value">฿${this.formatCurrency(receipt.invoice.remainingAmount)}</span>
            </div>
          </div>

          <div class="thank-you">
            <div class="thank-you-text">ขอบคุณที่ใช้บริการ</div>
          </div>

          <div class="footer">
            <p>เอกสารนี้ถูกสร้างโดยระบบอัตโนมัติ</p>
            <p>Air Condition Management System</p>
          </div>
        </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
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

  // Helper: Get payment method text
  private getPaymentMethodText(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'เงินสด',
      'transfer': 'โอนเงิน',
      'credit': 'บัตรเครดิต',
      'promptpay': 'พร้อมเพย์'
    };
    return methods[method] || method;
  }

  // Close browser when app shuts down
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default new PDFService();
