import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import qrcode from 'qrcode';
import generatePayload from 'promptpay-qr';

const PROMPTPAY_ID = process.env.PROMPTPAY_ID || '0928980434'; // พร้อมเพย์


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
            body {
              font-family: Arial, sans-serif;
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
              display: flex;
              gap: 10px;
            }
            .header-icon {
              width: 40px;
              height: 40px;
              background-color: #2563eb;
              border-radius: 4px;
              flex-shrink: 0;
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
              justify-content: space-between;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .company-info {
              width: 55%;
            }
            .doc-info {
              width: fit-content;
              background-color: #eff6ff; /* Light blue background */
              padding: 15px;
              border-radius: 4px;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 2px;
            }
            .info-label {
              width: 80px;
              font-weight: 600;
              color: #374151;
            }
            .info-value {
              flex: 1;
              color: #111827;
            }

            .doc-info-row {
              display: flex;
              margin-bottom: 2px;
            }
            .doc-info-label {
              width: 100px;
              font-weight: 600;
              color: #374151;
            }
            .doc-info-value {
              flex: 1;
              color: #111827;
            }

            .customer-section {
              margin-bottom: 16px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #eff6ff; /* Light blue */
              color: #1f2937;
              font-weight: 600;
              text-align: left;
              padding: 10px;
              font-size: 12px;
              border-top: 1px solid #d1d5db;
              border-bottom: 1px solid #d1d5db;
            }
            th.center { text-align: center; }
            th.right { text-align: right; }
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #f3f4f6;
              vertical-align: top;
            }
            td.center { text-align: center; }
            td.right { text-align: right; }

            .summary-container {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            .summary-left {
              width: 50%;
            }
            .summary-right {
              width: 45%;
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
              padding: 15px;
              background-color: #eff6ff;
              border-radius: 4px;
              font-size: 16px;
              font-weight: bold;
              color: #111827;
              margin: 10px 0;
            }
            
            .paid-remaining {
              text-align: right;
              padding-right: 15px;
              margin-top: 10px;
            }
            
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .signature-box {
              width: 30%;
              text-align: center;
            }
            .signature-line {
              border-bottom: 1px dashed #9ca3af;
              height: 40px;
              margin-bottom: 10px;
            }
            .signature-name {
              font-size: 12px;
              color: #4b5563;
            }
            
          </style>
        </head>
        <body>
          
          <div class="header-top">
            <div class="header-left">
              <div class="header-icon"></div>
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
                <th style="width: 5%;">ลำดับ</th>
                <th style="width: 50%;">คำอธิบาย</th>
                <th class="center" style="width: 15%;">จำนวน</th>
                <th class="right" style="width: 15%;">ราคา</th>
                <th class="right" style="width: 15%;">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.items.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}.</td>
                  <td>
                    <div style="font-weight: 500;">${item.productName}</div>
                    ${item.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.description}</div>` : ''}
                  </td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">${this.formatCurrency(item.price)}</td>
                  <td class="right">${this.formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>



          <div class="summary-container">
            <div class="summary-left">
              ${quotation.notes ? `
                <div style="margin-bottom: 20px;">
                  <strong style="color: #374151;">หมายเหตุ:</strong>
                  <p style="color: #4b5563; font-size: 12px; white-space: pre-line; margin-top: 4px;">${quotation.notes}</p>
                </div>
              ` : ''}
              
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <strong style="color: #374151;">สรุป:</strong>
                <div style="font-size: 12px; color: #4b5563;">
                  <div>มูลค่าที่คำนวณภาษี ${quotation.vat}%</div>
                  <div>ภาษีมูลค่าเพิ่ม ${quotation.vat}%</div>
                  <div>จำนวนเงินทั้งสิ้น</div>
                </div>
              </div>            </div>

            <div class="summary-right">
              <div class="summary-row">
                <span>มูลค่ารวม/Subtotal</span>
                <span class="summary-value">${this.formatCurrency(quotation.subtotal)} บาท</span>
              </div>
              ${parseFloat(quotation.discount) > 0 ? `
              <div class="summary-row">
                <span>ส่วนลด/Discount</span>
                <span class="summary-value" style="color: #dc2626;">-${this.formatCurrency(quotation.discount)} บาท</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span>ภาษีมูลค่าเพิ่ม/VAT ${quotation.vat}%</span>
                <span class="summary-value">${this.formatCurrency(((parseFloat(quotation.subtotal) - parseFloat(quotation.discount)) * parseFloat(quotation.vat)) / 100)} บาท</span>
              </div>
              
              <div class="total-row">
                <span>จำนวนเงินทั้งสิ้น</span>
                <span>${this.formatCurrency(quotation.total)} บาท</span>
              </div>
            </div>
          </div>

          <div class="signatures">
            <div class="signature-box" style="margin-top: 10px;">
              <h3 style="font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 8px; text-align: left;">เงื่อนไขและข้อตกลง</h3>
              <ul style="font-size: 10px; color: #4b5563; padding-left: 16px; margin: 0; text-align: left;">
                  <li>ใบเสนอราคานี้มีอายุ 30 วัน นับจากวันที่ออกเอกสาร</li>
                  <li>ราคาดังกล่าวรวม VAT 7% แล้ว</li>
                  <li>เงื่อนไขการชำระเงิน: เงินสด หรือโอนเงิน</li>
                  <li>การยกเลิกหลังจากสั่งซื้อแล้วจะไม่คืนเงิน</li>
              </ul>
            </div>
            
             ${quotation.signatures && quotation.signatures.filter((s: any) => s.type === 'shop').length > 0 ? `
             <div class="signature-box">
                 <h3 style="font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 8px;">ลายเซ็นผู้เสนอราคา</h3>
                 ${quotation.signatures.filter((s: any) => s.type === 'shop').map((sig: any) => `
                     <div style="border: 1px solid #d1d5db; padding: 8px; border-radius: 4px; display: inline-block; background: white; margin-bottom: 4px;">
                        <img src="${sig.signatureUrl}" style="height: 48px;" alt="Signature" />
                     </div>
                     <p style="font-weight: 600; font-size: 12px; margin-top: 4px;">${sig.signerName}</p>
                     <p style="font-size: 10px; color: #6b7280;">ผู้มีอำนาจลงนาม</p>
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
              padding: 40px;
              background: white;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-top {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 20px;
            }
            .header-logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb; /* Blue */
              letter-spacing: 2px;
            }
            .header-title-wrapper {
              text-align: center;
              width: 100%;
            }
            .header-title-small {
              font-size: 12px;
              color: #4b5563;
              margin-bottom: 2px;
            }
            .header-title {
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;
            }
            
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .company-info {
              width: 55%;
            }
            .doc-info {
              width: fit-content;
              background-color: #eff6ff; /* Light blue background */
              padding: 15px;
              border-radius: 4px;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 2px;
            }
            .info-label {
              width: 80px;
              font-weight: 600;
              color: #374151;
            }
            .info-value {
              flex: 1;
              color: #111827;
            }

            .doc-info-row {
              display: flex;
              margin-bottom: 2px;
            }
            .doc-info-label {
              width: 100px;
              font-weight: 600;
              color: #374151;
            }
            .doc-info-value {
              flex: 1;
              color: #111827;
            }

            .customer-section {
              margin-bottom: 16px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #eff6ff; /* Light blue */
              color: #1f2937;
              font-weight: 600;
              text-align: left;
              padding: 10px;
              font-size: 12px;
              border-top: 1px solid #d1d5db;
              border-bottom: 1px solid #d1d5db;
            }
            th.center { text-align: center; }
            th.right { text-align: right; }
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #f3f4f6;
              vertical-align: top;
            }
            td.center { text-align: center; }
            td.right { text-align: right; }

            .summary-container {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            .summary-left {
              width: 50%;
            }
            .summary-right {
              width: 45%;
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
              padding: 15px;
              background-color: #eff6ff;
              border-radius: 4px;
              font-size: 16px;
              font-weight: bold;
              color: #111827;
              margin: 10px 0;
            }
            
            .paid-remaining {
              text-align: right;
              padding-right: 15px;
              margin-top: 10px;
            }
            
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .signature-box {
              width: 30%;
              text-align: center;
            }
            .signature-line {
              border-bottom: 1px dashed #9ca3af;
              height: 40px;
              margin-bottom: 10px;
            }
            .signature-name {
              font-size: 12px;
              color: #4b5563;
            }
            
          </style>
        </head>
        <body>
          
          <div class="header-top">
            <div class="header-title-wrapper">
              <div class="header-title">ใบแจ้งหนี้</div>
            </div>
          </div>

          <div class="info-section">
            <div class="company-info">
              <div class="info-row" style="margin-bottom: 8px;">
                <div class="info-label">ผู้ขาย :</div>
                <div class="info-value">
                  <strong>บริษัท ผิวฮะเส็ง ตู้โปสเตอร์ จำกัด สาขา 00002</strong><br/>
                  26/12 หมู่ 2 ตำบลทรงคนอง อำเภอสามพราน<br/>จังหวัดนครปฐม 73210<br/>
                  <div style="margin-top: 4px;"><strong>โทรศัพท์ :</strong> (66)2-8895655-7, (66)34-393-792</div>
                  <div><strong>เลขที่ภาษี :</strong> 0105534120206</div>
                </div>
              </div>
              <div style="border-top: 1px solid #e5e7eb; margin: 8px 0; width: 90%;"></div>
              <div class="info-row">
                <div class="info-label">ลูกค้า :</div>
                <div class="info-value">
                  <strong>${invoice.customerName}</strong>
                  ${invoice.customerAddress ? `<br/><strong>ที่อยู่ :</strong> ${invoice.customerAddress}` : ''}
                  ${invoice.customer?.taxId ? `<br/><div style="margin-top: 8px;"><strong>เลขที่ภาษี :</strong> ${invoice.customer.taxId}</div>` : ''}
                  ${invoice.customerPhone ? `<br/><div><strong>โทรศัพท์ :</strong> ${invoice.customerPhone}</div>` : ''}
                </div>
              </div>
            </div>

            <div class="doc-info">
              <div class="doc-info-row">
                <div class="doc-info-label">เลขที่เอกสาร :</div>
                <div class="doc-info-value">${invoice.invoiceNo}</div>
              </div>
              <div class="doc-info-row">
                <div class="doc-info-label">วันที่ออก :</div>
                <div class="doc-info-value">${this.formatDate(invoice.createdAt)}</div>
              </div>
              ${invoice.dueDate ? `
              <div class="doc-info-row">
                <div class="doc-info-label">วันครบกำหนด :</div>
                <div class="doc-info-value">${this.formatDate(invoice.dueDate)}</div>
              </div>
              ` : ''}
              <div class="doc-info-row">
                <div class="doc-info-label">อ้างอิง :</div>
                <div class="doc-info-value">-</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%;">ลำดับ</th>
                <th style="width: 50%;">คำอธิบาย</th>
                <th class="center" style="width: 15%;">จำนวน</th>
                <th class="right" style="width: 15%;">ราคา</th>
                <th class="right" style="width: 15%;">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}.</td>
                  <td>
                    <div style="font-weight: 500;">${item.productName}</div>
                    ${item.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.description}</div>` : ''}
                  </td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">${this.formatCurrency(item.price)}</td>
                  <td class="right">${this.formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-container">
            <div class="summary-left">
              ${invoice.notes ? `
                <div style="margin-bottom: 20px;">
                  <strong style="color: #374151;">หมายเหตุ:</strong>
                  <p style="color: #4b5563; font-size: 12px; white-space: pre-line; margin-top: 4px;">${invoice.notes}</p>
                </div>
              ` : ''}
              
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <strong style="color: #374151;">สรุป:</strong>
                <div style="font-size: 12px; color: #4b5563;">
                  <div>มูลค่าที่คำนวณภาษี ${invoice.vat}%</div>
                  <div>ภาษีมูลค่าเพิ่ม ${invoice.vat}%</div>
                  <div>จำนวนเงินทั้งสิ้น</div>
                </div>
              </div>
               <div style="margin-top: 16px; text-align: left; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb;">
                 <strong style="color: #374151; display: block; margin-bottom: 6px; font-size: 13px;">ข้อมูลการชำระเงิน:</strong>
                 <div style="color: #4b5563; font-size: 12px; line-height: 1.6;">
                   <div style="display: flex; align-items: center; gap: 6px;">
                     <span style="font-weight: bold; color: #111827;">ธนาคาร:</span> กสิกรไทย
                   </div>
                   <div style="display: flex; align-items: center; gap: 6px;">
                     <span style="font-weight: bold; color: #111827;">เลขบัญชี:</span> 209-1-72241-3
                   </div>
                   <div style="display: flex; align-items: center; gap: 6px;">
                     <span style="font-weight: bold; color: #111827;">ชื่อบัญชี:</span> ฮาบีดีน บุญสาลี
                   </div>
                 </div>
               </div>
            </div>

            <div class="summary-right">
              <div class="summary-row">
                <span>มูลค่ารวม/Subtotal</span>
                <span class="summary-value">${this.formatCurrency(invoice.subtotal)} บาท</span>
              </div>
              ${parseFloat(invoice.discount) > 0 ? `
              <div class="summary-row">
                <span>ส่วนลด/Discount</span>
                <span class="summary-value" style="color: #dc2626;">-${this.formatCurrency(invoice.discount)} บาท</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span>ภาษีมูลค่าเพิ่ม/VAT ${invoice.vat}%</span>
                <span class="summary-value">${this.formatCurrency(((parseFloat(invoice.subtotal) - parseFloat(invoice.discount)) * parseFloat(invoice.vat)) / 100)} บาท</span>
              </div>
              
              <div class="total-row">
                <span>จำนวนเงินทั้งสิ้น</span>
                <span>${this.formatCurrency(invoice.total)} บาท</span>
              </div>

              <div class="paid-remaining">
                ${paidAmount > 0 ? `
                <div class="summary-row" style="color: #059669; justify-content: flex-end; gap: 20px;">
                  <span>ชำระแล้ว:</span>
                  <span style="font-weight: bold;">${this.formatCurrency(paidAmount)} บาท</span>
                </div>
                ` : ''}
                ${parseFloat(invoice.remainingAmount) > 0 ? `
                <div class="summary-row" style="color: #dc2626; justify-content: flex-end; gap: 20px;">
                  <span>ยอดค้างชำระ:</span>
                  <span style="font-weight: bold;">${this.formatCurrency(invoice.remainingAmount)} บาท</span>
                </div>
                ` : ''}
              </div>
            </div>
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
            body {
              font-family: Arial, sans-serif;
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
            }
            .header-logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb; /* Blue */
              letter-spacing: 2px;
            }
            .header-title-wrapper {
              text-align: right;
            }
            .header-title {
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;
            }
            
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .company-info {
              width: 55%;
            }
            .doc-info {
              width: 40%;
              background-color: #eff6ff; /* Light blue background */
              padding: 15px;
              border-radius: 4px;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 2px;
            }
            .info-label {
              width: 80px;
              font-weight: 600;
              color: #374151;
            }
            .info-value {
              flex: 1;
              color: #111827;
            }

            .doc-info-row {
              display: flex;
              margin-bottom: 2px;
            }
            .doc-info-label {
              width: 100px;
              font-weight: 600;
              color: #374151;
            }
            .doc-info-value {
              flex: 1;
              color: #111827;
            }

            .customer-section {
              margin-bottom: 30px;
            }

            .summary-container {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            .summary-left {
              width: 50%;
            }
            .summary-right {
              width: 45%;
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
              padding: 15px;
              background-color: #eff6ff;
              border-radius: 4px;
              font-size: 16px;
              font-weight: bold;
              color: #111827;
              margin: 10px 0;
            }
            
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .signature-box {
              width: 30%;
              text-align: center;
            }
            .signature-line {
              border-bottom: 1px dashed #9ca3af;
              height: 40px;
              margin-bottom: 10px;
            }
            .signature-name {
              font-size: 12px;
              color: #4b5563;
            }
            
          </style>
        </head>
        <body>
          
          <div class="header-top">
            <div class="header-logo">EASYBILL</div>
            <div class="header-title-wrapper">
              <div class="header-title">ใบเสร็จรับเงิน</div>
            </div>
          </div>

          <div class="info-section">
            <div class="company-info">
              <div class="info-row">
                <div class="info-label">ผู้รับเงิน :</div>
                <div class="info-value"><strong>บริษัท ผิวฮะเส็ง ตู้โปสเตอร์ จำกัด สาขา 00002</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">ที่อยู่ :</div>
                <div class="info-value">26/12 หมู่ 2 ตำบลทรงคนอง อำเภอสามพราน<br>จังหวัดนครปฐม 73210</div>
              </div>
              <div class="info-row">
                <div class="info-label">โทรศัพท์ :</div>
                <div class="info-value">(66)2-8895655-7, (66)34-393-792</div>
              </div>
              <div class="info-row">
                <div class="info-label">เลขที่ภาษี :</div>
                <div class="info-value">0105534120206</div>
              </div>
            </div>

            <div class="doc-info">
              <div class="doc-info-row">
                <div class="doc-info-label">เลขที่เอกสาร :</div>
                <div class="doc-info-value">${receipt.receiptNo}</div>
              </div>
              <div class="doc-info-row">
                <div class="doc-info-label">วันที่ออก :</div>
                <div class="doc-info-value">${this.formatDate(receipt.createdAt)}</div>
              </div>
              <div class="doc-info-row">
                <div class="doc-info-label">อ้างอิงใบแจ้งหนี้ :</div>
                <div class="doc-info-value">${receipt.invoice.invoiceNo}</div>
              </div>
            </div>
          </div>

          <div class="customer-section">
            <div class="company-info">
              <div class="info-row">
                <div class="info-label">ลูกค้า :</div>
                <div class="info-value"><strong>${receipt.invoice.customerName}</strong></div>
              </div>
              ${receipt.invoice.customerAddress ? `
              <div class="info-row">
                <div class="info-label">ที่อยู่ :</div>
                <div class="info-value">${receipt.invoice.customerAddress}</div>
              </div>
              ` : ''}
              ${receipt.invoice.customer?.taxId ? `
              <div class="info-row">
                <div class="info-label">เลขที่ภาษี :</div>
                <div class="info-value">${receipt.invoice.customer.taxId}</div>
              </div>
              ` : ''}
              ${receipt.invoice.customerPhone ? `
              <div class="info-row">
                <div class="info-label">โทรศัพท์ :</div>
                <div class="info-value">${receipt.invoice.customerPhone}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <div style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 20px; margin-bottom: 30px;">
             <h3 style="font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">ข้อมูลการชำระเงิน</h3>
             <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                 <div style="width: 48%; margin-bottom: 10px;">
                     <div style="color: #6b7280; font-size: 12px;">วันที่ชำระ</div>
                     <div style="font-weight: 500;">${this.formatDate(receipt.paymentDate)}</div>
                 </div>
                 <div style="width: 48%; margin-bottom: 10px;">
                     <div style="color: #6b7280; font-size: 12px;">วิธีการชำระเงิน</div>
                     <div style="font-weight: 500;">${this.getPaymentMethodText(receipt.paymentMethod)}</div>
                 </div>
             </div>
          </div>

          <div class="summary-container" style="border-top: none; padding-top: 0;">
            <div class="summary-left">
              ${receipt.notes ? `
                <div style="margin-bottom: 20px;">
                  <strong style="color: #374151;">หมายเหตุ:</strong>
                  <p style="color: #4b5563; font-size: 12px; white-space: pre-line; margin-top: 4px;">${receipt.notes}</p>
                </div>
              ` : ''}
              <div style="margin-top: 20px; color: #059669; font-weight: bold; font-size: 18px;">
                ✔ ชำระเงินเรียบร้อยแล้ว
              </div>
            </div>

            <div class="summary-right">
              <h3 style="font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">สรุปการชำระเงิน</h3>
              <div class="summary-row">
                <span>ยอดรวมใบแจ้งหนี้</span>
                <span class="summary-value">${this.formatCurrency(receipt.invoice.total)} บาท</span>
              </div>
              <div class="summary-row">
                <span>ชำระแล้วก่อนหน้า</span>
                <span class="summary-value">${this.formatCurrency(parseFloat(receipt.invoice.total) - parseFloat(receipt.invoice.remainingAmount) - parseFloat(receipt.amount))} บาท</span>
              </div>
              
              <div class="total-row" style="background-color: #f0fdf4; color: #065f46;">
                <span>จำนวนเงินที่ชำระครั้งนี้</span>
                <span>${this.formatCurrency(receipt.amount)} บาท</span>
              </div>

              ${parseFloat(receipt.invoice.remainingAmount) > 0 ? `
              <div class="summary-row" style="color: #dc2626; justify-content: flex-end; gap: 20px; font-weight: bold; margin-top: 10px;">
                <span>ยอดค้างชำระคงเหลือ:</span>
                <span>${this.formatCurrency(receipt.invoice.remainingAmount)} บาท</span>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-name">ผู้รับเงิน</div>
            </div>
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
