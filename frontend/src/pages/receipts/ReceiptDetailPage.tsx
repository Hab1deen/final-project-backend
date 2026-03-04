import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import Swal from 'sweetalert2';
import { receiptApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

interface Receipt {
  id: number;
  receiptNo: string;
  invoiceId: number;
  amount: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  invoice?: {
    invoiceNo: string;
    customerName: string;
    customerPhone: string | null;
    customerAddress: string | null;
    total: string;
  };
  user?: {
    name: string;
  };
}

const ReceiptDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await receiptApi.getById(Number(id));
      setReceipt(response.data.data);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด!', text: 'ไม่สามารถโหลดข้อมูลใบเสร็จได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: "เงินสด",
      transfer: "โอนเงิน",
      credit_card: "บัตรเครดิต",
      promptpay: "พร้อมเพย์",
      mobile_banking: "Mobile Banking",
      e_wallet: "E-Wallet",
      check: "เช็ค",
    };
    return methods[method] || method;
  };

  const handleDownload = async () => {
    const element = document.getElementById("receipt-document");
    if (!element || !receipt) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`ใบเสร็จรับเงิน-${receipt.receiptNo}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถสร้างไฟล์ PDF ได้",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="กำลังโหลดข้อมูล..." />;
  }

  if (!receipt) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ไม่พบข้อมูลใบเสร็จ</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/receipts")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {receipt.receiptNo}
            </h1>
            <p className="text-gray-600">
              สร้างเมื่อ {new Date(receipt.createdAt).toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>

        <div className="flex gap-3 no-print">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="ส่งออกเป็น PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งออกเป็น PDF</span>
          </button>
        </div>
      </div>

      {/* Document */}
      <div
        id="receipt-document"
        className="bg-white rounded-lg shadow-lg mx-auto print:shadow-none print:rounded-none print:w-full"
        style={{ maxWidth: "210mm" }}
      >
        <div className="p-12 print:p-4">
          {/* Header Section */}
          <div className="text-center mb-6 pb-4 border-b-2 border-blue-600 print:mb-2 print:pb-1">
            <h1 className="text-4xl font-bold mb-2 print:text-3xl">ใบเสร็จรับเงิน</h1>
            <p className="text-xl text-gray-600 print:text-lg">RECEIPT</p>
          </div>

          {/* Company Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">นายสมชาย บุญจรัส</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>เลขที่ 23 ซ.เพชรเกษม 110แยก9 แขวงหนองค้างพลู</p>
              <p>เขตหนองแขม กรุงเทพฯ 10160</p>
              <p>เบอร์ติดต่อ: 094-4204792</p>
              <p>เลขประจำตัวผู้เสียภาษี: 3102101089827</p>
            </div>
          </div>

          {/* Receipt Info */}
          <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 mb-1">เลขที่ใบเสร็จ</p>
              <p className="text-lg font-semibold text-gray-900">{receipt.receiptNo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">วันที่</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(receipt.createdAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ที่ได้รับจาก</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">
                {receipt.invoice?.customerName}
              </p>
              {receipt.invoice?.customerAddress && (
                <p className="text-sm text-gray-600 mb-1">
                  {receipt.invoice.customerAddress}
                </p>
              )}
              {receipt.invoice?.customerPhone && (
                <p className="text-sm text-gray-600">
                  เบอร์ติดต่อ: {receipt.invoice.customerPhone}
                </p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              ขอบคุณสำหรับการชำระเงินของคุณกับใบแจ้งหนี้
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      เลขที่ใบแจ้งหนี้
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      จำนวนเงิน
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/invoices/${receipt.invoiceId}`)}
                        className="text-blue-600 hover:underline"
                      >
                        {receipt.invoice?.invoiceNo}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ฿{parseFloat(receipt.amount).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">จำนวนเงินที่ชำระทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">
                  ฿{parseFloat(receipt.amount).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">วิธีชำระเงิน</p>
                <p className="text-sm font-semibold text-gray-900">
                  {getPaymentMethodLabel(receipt.paymentMethod)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">หมายเหตุ</h3>
              <p className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                {receipt.notes}
              </p>
            </div>
          )}

          {/* Bank Details */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              รายละเอียดธนาคาร
            </h3>
            <p className="text-sm text-gray-600">ttb # 2432119101</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailPage;