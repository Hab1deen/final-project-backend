import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ฟังก์ชัน Export PDF สำหรับ Quotation (พยายามให้อยู่ใน 1 หน้า)
export const exportQuotationToPDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // ซ่อนปุ่มและส่วนที่ไม่ต้องการใน PDF
    const buttons = element.querySelectorAll('.no-print');
    buttons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none';
    });

    // สร้าง canvas จาก HTML
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0
    });

    // แสดงปุ่มกลับ
    buttons.forEach(btn => {
      (btn as HTMLElement).style.display = '';
    });

    // สร้าง PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // ถ้าเนื้อหาสูงเกิน ให้ scale ลงเล็กน้อยให้พอดี 1 หน้า
    if (imgHeight > pageHeight) {
      const scaledWidth = (pageHeight / imgHeight) * imgWidth;
      const scaledHeight = pageHeight;
      const xOffset = (imgWidth - scaledWidth) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, scaledHeight);
    } else {
      // ถ้าพอดีหรือต่ำกว่า ให้ใช้ขนาดเต็ม
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }

    // บันทึก PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

// ฟังก์ชัน Export PDF สำหรับ Invoice
export const exportInvoiceToPDF = async (elementId: string, filename: string) => {
  return exportQuotationToPDF(elementId, filename);
};

// ฟังก์ชัน Export PDF สำหรับ Receipt
export const exportReceiptToPDF = async (elementId: string, filename: string) => {
  return exportQuotationToPDF(elementId, filename);
};