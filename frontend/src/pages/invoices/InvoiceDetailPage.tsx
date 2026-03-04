import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Receipt,
  User,
  Phone,
  MapPin,
  Calendar,
  Download,
  DollarSign,
  PenTool,
  FileCheck,
  Image as ImageIcon,
} from "lucide-react";
import { showSuccess, showError } from '../../utils/alert';
import Swal from 'sweetalert2';
import { invoiceApi, receiptApi } from "../../services/api";
import SignatureSelector from "../../components/signature/SignatureSelector";
import ImageGallery from "../../components/common/ImageGallery";
import ImageUploadModal from "../../components/modals/ImageUploadModal";
import CreateReceiptModal from "../../components/modals/CreateReceiptModal";
import { exportInvoiceToPDF } from "../../utils/pdfExport";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import qrcode from 'qrcode';
import generatePayload from 'promptpay-qr';

const PROMPTPAY_ID = "0928980434"; // TODO: Should be from config/env


const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [showSignatureSelector, setShowSignatureSelector] = useState(false);
  const [signatureType, setSignatureType] = useState<"shop" | "customer" | "acceptance">(
    "shop"
  );
  const [signerName, setSignerName] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");


  useEffect(() => {
    fetchInvoice();
    fetchReceipts();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getById(parseInt(id!));
      setInvoice(response.data.data);

      // Generate QR Code if there's a remaining amount
      if (response.data.data.remainingAmount > 0) {
        try {
          const payload = generatePayload(PROMPTPAY_ID, { amount: parseFloat(response.data.data.remainingAmount) });
          const url = await qrcode.toDataURL(payload);
          setQrCodeDataUrl(url);
        } catch (err) {
          console.error("Error generating QR:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      showError('ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้');
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };


  const fetchReceipts = async () => {
    try {
      const response = await receiptApi.getByInvoiceId(parseInt(id!));
      setReceipts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  };

  const handleReceiptSuccess = () => {
    fetchInvoice();
    fetchReceipts();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Record payment
      await invoiceApi.recordPayment(parseInt(id!), {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        notes: paymentNotes,
      });

      // Success alert with SweetAlert2
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกการชำระเงินสำเร็จ!',
        text: `บันทึกการชำระ ${parseFloat(paymentAmount).toLocaleString()} บาทเรียบร้อยแล้ว`,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3b82f6',
      });

      // Reset form
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentNotes("");
      fetchInvoice();
    } catch (error) {
      console.error("Error recording payment:", error);
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถบันทึกการชำระเงินได้',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const openSignatureSelector = (type: "shop" | "customer" | "acceptance") => {
    setSignatureType(type);
    setShowSignatureSelector(true);
  };

  const handleSelectSignature = async (signatureUrl: string, templateId?: number) => {
    try {
      if (signatureType === "acceptance") {
        // Job acceptance signature - update invoice directly
        await invoiceApi.update(parseInt(id!), {
          acceptanceSignature: signatureUrl,
        });
        showSuccess('บันทึกลายเซ็นรับงานสำเร็จ');
      } else {
        // Shop or customer signature
        await invoiceApi.addSignature(parseInt(id!), {
          type: signatureType,
          signatureData: signatureUrl,
          signerName,
          templateId,
        });
        showSuccess('บันทึกลายเซ็นสำเร็จ');
      }

      setShowSignatureSelector(false);
      setSignerName("");
      setSignatureType("shop");
      fetchInvoice(); // Reload data
    } catch (error) {
      console.error("Error saving signature:", error);
      showError('เกิดข้อผิดพลาดในการบันทึกลายเซ็น');
    }
  };



  const handleUploadWorkImage = async (imageUrl: string) => {
    try {
      await invoiceApi.update(parseInt(id!), {
        workImages: imageUrl,
      });

      showSuccess('อัปโหลดรูปผลงานสำเร็จ');
      fetchInvoice(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error uploading work image:", error);
      showError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportInvoiceToPDF("invoice-document", `${invoice.invoiceNo}.pdf`);
      showSuccess('ส่งออก PDF สำเร็จ');
    } catch (error) {
      console.error("Error exporting PDF:", error);
      // Fallback to print
      window.print();
    }
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      unpaid: { label: "รอชำระ", color: "bg-yellow-100 text-yellow-800" },
      partial: { label: "ชำระบางส่วน", color: "bg-blue-100 text-blue-800" },
      paid: { label: "ชำระแล้ว", color: "bg-green-100 text-green-800" },
      overdue: { label: "เกินกำหนด", color: "bg-red-100 text-red-800" },
    };
    const s = config[status] || config.unpaid;
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded ${s.color}`}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="กำลังโหลดข้อมูล..." />;
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/invoices")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.invoiceNo}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-gray-600">
              สร้างเมื่อ{" "}
              {new Date(invoice.createdAt).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3 no-print">
          {/* Utility / Secondary Actions */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="Export PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งออกเป็น PDF</span>
          </button>

          {/* Action Group */}
          {/* Upload Work Image - แสดงถ้ายังไม่มีรูป After */}
          {!invoice.workImages && invoice.status !== "unpaid" && (
            <button
              onClick={() => setShowImageUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="แนบรูปผลงาน (After)"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden lg:inline">แนบรูปผลงาน</span>
            </button>
          )}

          {/* Customer Job Acceptance - แสดงถ้ามีรูป After แล้ว แต่ยังไม่มีลายเซ็นรับงาน */}
          {invoice.workImages && !invoice.acceptanceSignature && (
            <button
              onClick={() => openSignatureSelector("acceptance")}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="ลูกค้าเซ็นรับงาน"
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden lg:inline">ลูกค้าเซ็นรับงาน</span>
            </button>
          )}

          {/* Payment Button - Show when not fully paid */}
          {invoice.status !== "paid" && (
            <button
              onClick={() => navigate(`/invoices/${id}/payment`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
              title="รับชำระเงิน"
            >
              <DollarSign className="w-4 h-4" />
              <span>ชำระเงิน</span>
            </button>
          )}

          {/* Signature */}
          {!invoice.signatures?.some((sig: any) => sig.type === "shop") && (
            <button
              onClick={() => openSignatureSelector("shop")}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="เซ็นกำกับร้านค้า"
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden lg:inline">เซ็นชื่อ</span>
            </button>
          )}


        </div>
      </div>

      {/* Document */}
      <div
        id="invoice-document"
        className="bg-white rounded-lg border border-gray-200 p-8 print:border-0 print:p-6"
      >
        {/* Header - Compact for print */}
        <div className="text-center mb-6 pb-4 border-b-2 border-blue-600 print:mb-4 print:pb-2">
          <h1 className="text-4xl font-bold mb-2 print:text-2xl print:mb-1">ใบแจ้งหนี้</h1>
          <p className="text-xl text-gray-600 print:text-base">INVOICE</p>
        </div>

        {/* Info Grid - Adjusted spacing */}
        <div className="grid grid-cols-2 gap-8 mb-8 print:gap-4 print:mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 print:mb-1 print:text-xs">
              ข้อมูลลูกค้า
            </h3>
            <div className="space-y-2 print:space-y-1">
              <div className="flex items-start gap-2">

                <User className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900">
                    {invoice.customerName}
                  </div>
                  {invoice.customer?.taxId && (
                    <div className="text-sm text-gray-600">
                      เลขประจำตัวผู้เสียภาษี: {invoice.customer.taxId}
                    </div>
                  )}
                </div>
              </div>
              {invoice.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{invoice.customerPhone}</span>
                </div>
              )}
              {invoice.customerAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <span className="text-gray-700">
                    {invoice.customerAddress}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              ข้อมูลเอกสาร
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  <span className="font-medium">เลขที่:</span>{" "}
                  {invoice.invoiceNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  <span className="font-medium">วันที่:</span>{" "}
                  {new Date(invoice.createdAt).toLocaleDateString("th-TH")}
                </span>
              </div>
              {invoice.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    <span className="font-medium">ครบกำหนด:</span>{" "}
                    {new Date(invoice.dueDate).toLocaleDateString("th-TH")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table - Compact padding */}
        <div className="mb-8 print:mb-4">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 print:py-2 print:px-2">

                  ลำดับ
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  รายการ
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  จำนวน
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  ราคา/หน่วย
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  ยอดรวม
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700 print:py-2 print:px-2">{index + 1}</td>
                  <td className="py-3 px-4 print:py-2 print:px-2">

                    <div className="font-medium text-gray-900">
                      {item.productName}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-600">
                        {item.description}
                      </div>
                    )}

                  </td>
                  <td className="py-3 px-4 text-center text-gray-700 print:py-2 print:px-2">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 print:py-2 print:px-2">
                    ฿{parseFloat(item.price).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900 print:py-2 print:px-2">
                    ฿{parseFloat(item.total).toLocaleString()}
                  </td>
                </tr>

              ))}
            </tbody>
          </table>
        </div>

        {/* Summary - Reduced margins */}
        <div className="flex justify-end mb-8 print:mb-4">
          <div className="w-80">
            <div className="space-y-2 print:space-y-1">
              <div className="flex justify-between py-2 text-gray-700 print:py-1">
                <span>ยอดรวม</span>

                <span className="font-semibold">
                  ฿{parseFloat(invoice.subtotal).toLocaleString()}
                </span>
              </div>
              {parseFloat(invoice.discount) > 0 && (
                <div className="flex justify-between py-2 text-gray-700">
                  <span>ส่วนลด</span>
                  <span className="font-semibold">
                    -฿{parseFloat(invoice.discount).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 text-gray-700">
                <span>VAT {invoice.vat}%</span>
                <span className="font-semibold">
                  ฿
                  {(
                    ((parseFloat(invoice.subtotal) -
                      parseFloat(invoice.discount)) *
                      parseFloat(invoice.vat)) /
                    100
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300 text-xl font-bold text-gray-900">
                <span>ยอดรวมสุทธิ</span>
                <span className="text-blue-600">
                  ฿{parseFloat(invoice.total).toLocaleString()}
                </span>
              </div>
              {parseFloat(invoice.paidAmount) > 0 && (
                <>
                  <div className="flex justify-between py-2 text-green-600">
                    <span className="font-medium">ชำระแล้ว</span>
                    <span className="font-semibold">
                      ฿{parseFloat(invoice.paidAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-red-600">
                    <span className="font-medium">คงเหลือ</span>
                    <span className="font-semibold">
                      ฿{parseFloat(invoice.remainingAmount).toLocaleString()}
                    </span>
                  </div>
                </>
              )}

              {/* QR Code in Summary */}
              {qrCodeDataUrl && parseFloat(invoice.remainingAmount) > 0 && (
                <div className="pt-4 mt-2 border-t border-gray-200 flex flex-col items-end">
                  <img
                    src={qrCodeDataUrl}
                    alt="PromptPay QR"
                    className="w-24 h-24 object-contain border border-gray-200 rounded p-1 mb-2"
                  />
                  <div className="text-xs font-bold text-blue-800 mb-1">ชำระเงินทางออนไลน์</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg print:mb-4 print:p-2 print:bg-gray-100 print:text-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 print:mb-1">
              หมายเหตุ
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}




        {/* Work Images (After) */}
        {invoice.workImages && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              แนบรูปภาพ
            </h3>
            <div className="border border-gray-200 rounded p-2">
              <img
                src={invoice.workImages}
                alt="Work Completed"
                className="max-h-64 mx-auto object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* Signatures - Compact Layout */}
        {((invoice.acceptanceSignature) || (invoice.signatures && invoice.signatures.length > 0)) && (
          <div className="mt-4 pt-2 border-t border-gray-200 print:mt-2 print:pt-1">
            <h3 className="text-xs font-bold text-gray-900 mb-2 print:mb-1 print:text-[10px]">ลายเซ็น</h3>
            <div className="flex gap-4 print:gap-2">
              {/* Job Acceptance Signature */}
              {invoice.acceptanceSignature && (
                <div className="flex-1">
                  <div className="border border-gray-300 rounded p-2 bg-white min-h-[80px] flex items-center justify-center print:min-h-[50px] print:p-1">
                    <img
                      src={invoice.acceptanceSignature}
                      alt="ลายเซ็นรับงาน"
                      className="max-h-16 print:max-h-12"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-semibold text-gray-900">
                      {invoice.customerName}
                    </p>
                    <p className="text-sm text-gray-600">ลูกค้า (รับงาน)</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ลงนามวันที่:{" "}
                      {new Date(invoice.updatedAt).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Other Signatures */}
              {invoice.signatures && invoice.signatures.map((signature: any) => (
                <div key={signature.id} className="flex-1">
                  <div className="border border-gray-300 rounded p-2 bg-white print:p-1">
                    <img
                      src={signature.signatureUrl}
                      alt={`ลายเซ็น${signature.type === "shop" ? "ร้านค้า" : "ลูกค้า"}`}
                      className="max-h-16 mx-auto print:max-h-12"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-semibold text-gray-900">
                      {signature.signerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {signature.type === "shop" ? "ผู้ขาย" : "ลูกค้า"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ลงนามวันที่:{" "}
                      {new Date(signature.signedAt).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600 print:mt-6 print:pt-4">
          <p>ขอบคุณที่ใช้บริการ</p>
        </div>
      </div>

      {/* Receipts Section - เพิ่มหลัง Payment History */}
      {receipts && receipts.length > 0 && (
        <div className="mb-8 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              ใบเสร็จรับเงิน ({receipts.length} ใบ)
            </h3>
          </div>
          <div className="space-y-3">
            {receipts.map((receipt: any, index: number) => {
              const paymentMethodLabel: Record<string, string> = {
                cash: "เงินสด",
                transfer: "โอนเงิน",
                credit_card: "บัตรเครดิต",
                promptpay: "พร้อมเพย์",
                mobile_banking: "Mobile Banking",
                e_wallet: "E-Wallet",
                check: "เช็ค",
              };

              return (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/receipts/${receipt.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                      <FileCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {receipt.receiptNo}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 text-xs font-semibold rounded-full">
                          {paymentMethodLabel[receipt.paymentMethod] ||
                            receipt.paymentMethod}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(receipt.createdAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                      {receipt.notes && (
                        <div className="text-sm text-gray-500 mt-1">
                          📝 {receipt.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      ฿
                      {parseFloat(receipt.amount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      คลิกเพื่อดูรายละเอียด →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal - Improved */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">บันทึกการรับชำระเงิน</h2>
                  <p className="text-green-100 text-sm mt-1">
                    เลขที่ใบแจ้งหนี้: {invoice.invoiceNo}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Amount Info Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    ยอดรวมทั้งหมด
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ฿
                    {parseFloat(invoice.total).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-green-700">
                    ชำระแล้ว
                  </span>
                  <span className="text-lg font-semibold text-green-600">
                    ฿
                    {parseFloat(invoice.paidAmount).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="pt-3 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-red-700">
                      คงเหลือ
                    </span>
                    <span className="text-2xl font-bold text-red-600">
                      ฿
                      {parseFloat(invoice.remainingAmount).toLocaleString(
                        "th-TH",
                        { minimumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-5">
                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จำนวนเงินที่รับ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">
                      ฿
                    </span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      max={invoice.remainingAmount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    สูงสุด: ฿
                    {parseFloat(invoice.remainingAmount).toLocaleString(
                      "th-TH",
                      { minimumFractionDigits: 2 }
                    )}
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    วิธีการชำระ
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === "cash"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">💵</div>
                        <div className="text-sm font-medium">เงินสด</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("transfer")}
                      className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === "transfer"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🏦</div>
                        <div className="text-sm font-medium">โอนเงิน</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("credit")}
                      className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === "credit"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">💳</div>
                        <div className="text-sm font-medium">บัตรเครดิต</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                    placeholder="เลขที่อ้างอิง, หมายเหตุเพิ่มเติม..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    บันทึกการชำระ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Images Gallery */}
      {invoice.images && invoice.images.length > 0 && (
        <ImageGallery
          images={invoice.images}
          title="รูปภาพการติดตั้ง/ส่งมอบงาน"
        />
      )}

      {/* Signature Selector Modal */}
      {showSignatureSelector && (
        <SignatureSelector
          title={
            signatureType === "acceptance"
              ? "ลายเซ็นรับงาน"
              : signatureType === "shop"
                ? "ลายเซ็นผู้ออกใบแจ้งหนี้"
                : "ลายเซ็นลูกค้า"
          }
          signerName={signerName}
          onSignerNameChange={setSignerName}
          onSelect={handleSelectSignature}
          onCancel={() => {
            setShowSignatureSelector(false);
            setSignerName("");
            setSignatureType("shop");
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && invoice && (
        <CreateReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          invoice={{
            id: invoice.id,
            invoiceNo: invoice.invoiceNo,
            customerName: invoice.customerName,
            total: invoice.total,
            paidAmount: invoice.paidAmount,
            remainingAmount: invoice.remainingAmount,
          }}
          onSuccess={handleReceiptSuccess}
        />
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUploadModal
          isOpen={showImageUpload}
          onClose={() => setShowImageUpload(false)}
          onSuccess={handleUploadWorkImage}
          title="แนบรูปผลงาน (After)"
          description="อัปโหลดรูปภาพผลงานหลังจากเสร็จสิ้นการทำงาน"
        />
      )}
    </div>
  );
};

export default InvoiceDetailPage;
