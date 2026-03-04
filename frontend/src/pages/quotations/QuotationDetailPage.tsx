import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ArrowRight,
  PenTool,
  Phone,
  MapPin,
  User,
  CreditCard,
} from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from '../../utils/alert';
import { quotationApi } from "../../services/api";
import SignatureSelector from "../../components/signature/SignatureSelector";
import ImageGallery from "../../components/common/ImageGallery";
import { exportQuotationToPDF } from "../../utils/pdfExport";

const QuotationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignatureSelector, setShowSignatureSelector] = useState(false);
  const [signerName, setSignerName] = useState("");

  const [converting, setConverting] = useState(false);

  useEffect(() => {
    // ถ้าเป็น "new" ก็ไม่ต้อง fetch
    if (id && id !== "new") {
      fetchQuotation();
    }
  }, [id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await quotationApi.getById(parseInt(id!));
      setQuotation(response.data.data);
    } catch (error) {
      console.error("Error fetching quotation:", error);
      showError('ไม่สามารถดึงข้อมูลใบเสนอราคาได้');
      navigate("/quotations");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    const result = await showDeleteConfirm(
      'คุณต้องการแปลงเป็นใบแจ้งหนี้ใช่หรือไม่?',
      'การกระทำนี้จะสร้างใบแจ้งหนี้ใหม่',
      'แปลง'
    );

    if (!result.isConfirmed) return;

    try {
      setConverting(true);
      await quotationApi.convertToInvoice(parseInt(id!));
      showSuccess('แปลงเป็นใบแจ้งหนี้สำเร็จ');
      navigate("/invoices");
    } catch (error) {
      console.error("Error converting:", error);
      showError('ไม่สามารถแปลงเป็นใบแจ้งหนี้ได้');
    } finally {
      setConverting(false);
    }
  };

  const handleSelectSignature = async (signatureUrl: string, templateId?: number) => {
    try {
      await quotationApi.addSignature(parseInt(id!), {
        type: "shop",
        signatureData: signatureUrl,
        signerName,
        templateId,
      });

      showSuccess('บันทึกลายเซ็นสำเร็จ');
      setShowSignatureSelector(false);
      setSignerName("");
      fetchQuotation(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error saving signature:", error);
      showError('เกิดข้อผิดพลาดในการบันทึกลายเซ็น');
    }
  };



  const getStatusBadge = (status: string) => {
    const config: any = {
      draft: { label: "ร่าง", color: "bg-gray-100 text-gray-800" },
      sent: { label: "ส่งแล้ว", color: "bg-blue-100 text-blue-800" },
      accepted: { label: "อนุมัติ", color: "bg-green-100 text-green-800" },
      rejected: { label: "ปฏิเสธ", color: "bg-red-100 text-red-800" },
      converted: { label: "แปลงแล้ว", color: "bg-purple-100 text-purple-800" },
    };
    const s = config[status] || config.draft;
    return (
      <span className={`px - 3 py - 1 text - sm font - medium rounded ${s.color} `}>
        {s.label}
      </span>
    );
  };

  const handlePrint = async () => {
    try {
      await exportQuotationToPDF(
        "quotation-document",
        `${quotation.quotationNo}.pdf`
      );
      showSuccess('ส่งออก PDF สำเร็จ');
    } catch (error) {
      console.error("Error exporting PDF:", error);
      // Fallback to print
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  if (!quotation) return null;

  return (
    <div className="space-y-6">
      {/* Header - Hide on print */}
      <div className="flex items-center justify-between print:hidden no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/quotations")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {quotation.quotationNo}
              </h1>
              {getStatusBadge(quotation.status)}
            </div>
            <p className="text-gray-600">
              สร้างเมื่อ{" "}
              {new Date(quotation.createdAt).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {/* Secondary Actions (Utilities) */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="พิมพ์หรือบันทึกเป็น PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งออกเป็น PDF</span>
          </button>

          {/* Primary Actions Group */}


          {!quotation.signatures?.some((sig: any) => sig.type === "shop") && (
            <button
              onClick={() => setShowSignatureSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <PenTool className="w-4 h-4" />
              <span>เซ็นชื่อ</span>
            </button>
          )}

          {quotation.status !== "converted" && (
            <button
              onClick={handleConvertToInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              <span>แปลงเป็นใบแจ้งหนี้</span>
            </button>
          )}
        </div>
      </div>

      {/* Document - A4 Paper Style */}
      <div
        id="quotation-document"
        className="bg-white rounded-lg shadow-lg mx-auto print:shadow-none print:rounded-none print:w-full"
        style={{ maxWidth: "210mm" }}
      >
        <div className="p-12 print:p-4">
          {/* Document Title - Centered */}
          <div className="text-center mb-6 pb-4 border-b-2 border-blue-600 print:mb-2 print:pb-1">
            <h1 className="text-4xl font-bold mb-2 print:text-3xl">
              ใบเสนอราคา
            </h1>
            <p className="text-xl text-gray-600 print:text-lg">QUOTATION</p>
          </div>

          {/* Document Info & Customer Info */}
          <div className="grid grid-cols-2 gap-8 mb-8 print:gap-3 print:mb-3">
            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg print:p-2 print:bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-2 border-b pb-1 print:mb-1 print:pb-0 print:text-xs">
                ข้อมูลลูกค้า | Customer Information
              </h3>
              <div className="space-y-2 print:space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 print:w-3 print:h-3" />
                  <div>
                    <p className="text-xs text-gray-500">ชื่อ / Name</p>
                    <p className="font-semibold text-gray-900">
                      {quotation.customerName}
                    </p>
                  </div>
                </div>
                {quotation.customer?.taxId && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400 print:w-3 print:h-3" />
                    <div>
                      <p className="text-xs text-gray-500">
                        เลขประจำตัวผู้เสียภาษี / Tax ID
                      </p>
                      <p className="text-sm text-gray-700">
                        {quotation.customer.taxId}
                      </p>
                    </div>
                  </div>
                )}
                {quotation.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 print:w-3 print:h-3" />
                    <div>
                      <p className="text-xs text-gray-500">โทรศัพท์ / Phone</p>
                      <p className="text-sm text-gray-700">
                        {quotation.customerPhone}
                      </p>
                    </div>
                  </div>
                )}
                {quotation.customerAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 print:w-3 print:h-3" />
                    <div>
                      <p className="text-xs text-gray-500">ที่อยู่ / Address</p>
                      <p className="text-sm text-gray-700">
                        {quotation.customerAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Document Info */}
            <div className="space-y-3 print:space-y-1">
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-gray-600">
                  เลขที่เอกสาร / Document No.
                </span>
                <span className="font-semibold text-gray-900">
                  {quotation.quotationNo}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-gray-600">วันที่ / Date</span>
                <span className="text-gray-900">
                  {new Date(quotation.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {quotation.validUntil && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-gray-600">
                    วันหมดอายุ / Valid Until
                  </span>
                  <span className="text-gray-900">
                    {new Date(quotation.validUntil).toLocaleDateString(
                      "th-TH",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">สถานะ / Status</span>
                {getStatusBadge(quotation.status)}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4 print:mb-2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th
                    className="py-3 px-4 text-left text-sm font-semibold border border-blue-700 print:py-2 print:px-2 print:text-xs"
                    style={{ width: "5%" }}
                  >
                    ลำดับ
                    <br />
                    No.
                  </th>
                  <th
                    className="py-3 px-4 text-left text-sm font-semibold border border-blue-700 print:py-2 print:px-2 print:text-xs"
                    style={{ width: "40%" }}
                  >
                    รายการ
                    <br />
                    Description
                  </th>
                  <th
                    className="py-3 px-4 text-center text-sm font-semibold border border-blue-700 print:py-2 print:px-2 print:text-xs"
                    style={{ width: "15%" }}
                  >
                    จำนวน
                    <br />
                    Quantity
                  </th>
                  <th
                    className="py-3 px-4 text-right text-sm font-semibold border border-blue-700 print:py-2 print:px-2 print:text-xs"
                    style={{ width: "20%" }}
                  >
                    ราคา/หน่วย
                    <br />
                    Unit Price
                  </th>
                  <th
                    className="py-3 px-4 text-right text-sm font-semibold border border-blue-700 print:py-2 print:px-2 print:text-xs"
                    style={{ width: "20%" }}
                  >
                    จำนวนเงิน
                    <br />
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item: any, index: number) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4 text-center border border-gray-300 print:py-2 print:px-2 print:text-xs">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 border border-gray-300 print:py-2 print:px-2">
                      <div className="font-medium text-gray-900">
                        {item.productName}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center border border-gray-300 print:py-2 print:px-2 print:text-xs">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right border border-gray-300 print:py-2 print:px-2 print:text-xs">
                      {parseFloat(item.price).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold border border-gray-300 print:py-2 print:px-2 print:text-xs">
                      {parseFloat(item.total).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}

                {/* Empty rows to fill space */}
                {quotation.items.length < 5 &&
                  [...Array(5 - quotation.items.length)].map((_, i) => (
                    <tr key={`empty - ${i} `}>
                      <td className="py-3 px-4 border border-gray-300">
                        &nbsp;
                      </td>
                      <td className="py-3 px-4 border border-gray-300">
                        &nbsp;
                      </td>
                      <td className="py-3 px-4 border border-gray-300">
                        &nbsp;
                      </td>
                      <td className="py-3 px-4 border border-gray-300">
                        &nbsp;
                      </td>
                      <td className="py-3 px-4 border border-gray-300">
                        &nbsp;
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8 print:mb-4">
            <div className="w-96">
              <div className="space-y-2 print:space-y-1">
                <div className="flex justify-between py-2 border-b print:py-1">
                  <span className="text-gray-700">ยอดรวม / Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {parseFloat(quotation.subtotal).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    บาท
                  </span>
                </div>
                {parseFloat(quotation.discount) > 0 && (
                  <div className="flex justify-between py-2 border-b print:py-1">
                    <span className="text-gray-700">ส่วนลด / Discount</span>
                    <span className="font-semibold text-red-600">
                      -
                      {parseFloat(quotation.discount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      บาท
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b print:py-1">
                  <span className="text-gray-700">
                    ภาษีมูลค่าเพิ่ม {quotation.vat}% / VAT {quotation.vat}%
                  </span>
                  <span className="font-semibold text-gray-900">
                    {(
                      ((parseFloat(quotation.subtotal) -
                        parseFloat(quotation.discount)) *
                        parseFloat(quotation.vat)) /
                      100
                    ).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    บาท
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg print:py-1.5 print:px-2">
                  <span className="text-lg font-bold text-gray-900 print:text-base">
                    ยอดรวมสุทธิ / Grand Total
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {parseFloat(quotation.total).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    บาท
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded print:mb-2 print:p-2">
              <h3 className="text-xs font-bold text-gray-700 mb-1 print:text-[10px]">
                หมายเหตุ / Remarks
              </h3>
              <p className="text-xs text-gray-700 whitespace-pre-line print:text-[10px]">
                {quotation.notes}
              </p>
            </div>
          )}

          {/* Images Gallery */}
          {/* 2. Gallery เดิม */}
          {quotation.images && quotation.images.length > 0 && (
            <ImageGallery images={quotation.images} title="รูปภาพประกอบเพิ่มเติม" />
          )}

          {/* Terms & Signature */}
          <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-200 print:mt-2 print:pt-1 print:gap-2 print:page-break-inside-avoid">
            <div>
              <h3 className="text-xs font-bold text-gray-700 mb-2 print:mb-1 print:text-[10px]">
                เงื่อนไขและข้อตกลง
              </h3>
              <ul className="text-[10px] text-gray-600 space-y-0.5 print:text-[8px]">
                <li>• ใบเสนอราคานี้มีอายุ 30 วัน นับจากวันที่ออกเอกสาร</li>
                <li>• ราคาดังกล่าวรวม VAT 7% แล้ว</li>
                <li>• เงื่อนไขการชำระเงิน: เงินสด หรือโอนเงิน</li>
                <li>• การยกเลิกหลังจากสั่งซื้อแล้วจะไม่คืนเงิน</li>
              </ul>
            </div>
          </div>

          {/* Signatures Display */}
          {quotation.signatures && quotation.signatures.length > 0 && (
            <div className="mt-4 pt-2 border-t border-gray-200 print:mt-2 print:pt-1">
              <h3 className="text-xs font-bold text-gray-900 mb-2 print:mb-1 print:text-[10px]">ลายเซ็น</h3>
              <div className="flex gap-4 print:gap-2">
                {/* 1. ลายเซ็นยืนยันการจ้าง (New) */}
                {quotation.customerSignature && (
                  <div className="flex-1">
                    <div className="border border-gray-300 rounded p-2 bg-white min-h-[80px] flex items-center justify-center print:min-h-[50px] print:p-1">
                      <img
                        src={quotation.customerSignature}
                        alt="ลายเซ็นผู้ว่าจ้าง"
                        className="max-h-16 print:max-h-12"
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <p className="font-semibold text-gray-900">
                        {quotation.customerName}
                      </p>
                      <p className="text-sm text-gray-600">ผู้ว่าจ้าง</p>
                      <p className="text-xs text-gray-500 mt-1">
                        วันที่:{" "}
                        {new Date(quotation.createdAt).toLocaleDateString(
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

                {/* 2. ลายเซ็นผู้เสนอราคา (shop) */}
                {quotation.signatures
                  .filter((sig: any) => sig.type === "shop")
                  .map((signature: any) => (
                    <div key={signature.id} className="flex-1">
                      <div className="border border-gray-300 rounded p-2 bg-white print:p-1">
                        <img
                          src={signature.signatureUrl}
                          alt="ลายเซ็นผู้เสนอราคา"
                          className="max-h-16 mx-auto print:max-h-12"
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <p className="font-semibold text-gray-900">
                          {signature.signerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          ผู้เสนอราคา
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          วันที่:{" "}
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
          <div className="mt-8 pt-6 border-t text-center print:mt-4 print:pt-4">
            <p className="text-xs text-gray-500">
              เอกสารนี้สร้างโดยระบบจัดการเอกสารธุรกิจ | This document is
              generated by Business Document Management System
            </p>
            <p className="text-xs text-gray-400 mt-1">หน้า 1/1 | Page 1/1</p>
          </div>
        </div>
      </div>
      {/* Signature Selector Modal */}
      {showSignatureSelector && (
        <SignatureSelector
          title="ลายเซ็นผู้เสนอราคา"
          signerName={signerName}
          onSignerNameChange={setSignerName}
          onSelect={handleSelectSignature}
          onCancel={() => {
            setShowSignatureSelector(false);
            setSignerName("");
          }}
        />
      )}



      {/* Loading Overlay for Converting */}
      {converting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              กำลังแปลงเป็นใบแจ้งหนี้...
            </h3>
            <p className="text-sm text-gray-600">
              กรุณารอสักครู่ ระบบกำลังสร้างเอกสารและส่งอีเมล
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationDetailPage;
