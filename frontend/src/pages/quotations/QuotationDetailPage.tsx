import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Calendar, Download, ArrowRight, Building2 } from 'lucide-react';
import { quotationApi } from '../../services/api';

const QuotationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await quotationApi.getById(parseInt(id!));
      setQuotation(response.data.data);
    } catch (error) {
      console.error('Error fetching quotation:', error);
      alert('ไม่สามารถดึงข้อมูลใบเสนอราคาได้');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!confirm('คุณต้องการแปลงเป็นใบแจ้งหนี้ใช่หรือไม่?')) return;
    
    try {
      await quotationApi.convertToInvoice(parseInt(id!));
      alert('แปลงเป็นใบแจ้งหนี้สำเร็จ');
      navigate('/invoices');
    } catch (error) {
      console.error('Error converting:', error);
      alert('ไม่สามารถแปลงเป็นใบแจ้งหนี้ได้');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      draft: { label: 'ร่าง', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'ส่งแล้ว', color: 'bg-blue-100 text-blue-800' },
      accepted: { label: 'อนุมัติ', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-800' },
      converted: { label: 'แปลงแล้ว', color: 'bg-purple-100 text-purple-800' },
    };
    const s = config[status] || config.draft;
    return <span className={`px-3 py-1 text-sm font-medium rounded ${s.color}`}>{s.label}</span>;
  };

  const handlePrint = () => {
    window.print();
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
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quotations')}
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
              สร้างเมื่อ {new Date(quotation.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {quotation.status !== 'converted' && (
            <button
              onClick={handleConvertToInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              แปลงเป็นใบแจ้งหนี้
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            พิมพ์/บันทึก PDF
          </button>
        </div>
      </div>

      {/* Document - A4 Paper Style */}
      <div className="bg-white rounded-lg shadow-lg mx-auto print:shadow-none print:rounded-none" style={{ maxWidth: '210mm' }}>
        <div className="p-12 print:p-8">
          {/* Company Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-blue-600">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ระบบจัดการเอกสารธุรกิจ</h1>
                  <p className="text-sm text-gray-600">Business Document Management System</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <p>📍 123 ถนนสุขุมวิท กรุงเทพฯ 10110</p>
                <p>📞 Tel: 02-123-4567 | Email: info@business.com</p>
                <p>🆔 เลขประจำตัวผู้เสียภาษี: 0-1234-56789-01-2</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-blue-600 mb-1">ใบเสนอราคา</h2>
              <p className="text-lg text-gray-600">QUOTATION</p>
            </div>
          </div>

          {/* Document Info & Customer Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Customer Info */}
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b pb-2">
                ข้อมูลลูกค้า | Customer Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">ชื่อ / Name</p>
                  <p className="font-semibold text-gray-900">{quotation.customerName}</p>
                </div>
                {quotation.customer?.taxId && (
                  <div>
                    <p className="text-xs text-gray-500">เลขประจำตัวผู้เสียภาษี / Tax ID</p>
                    <p className="text-sm text-gray-700">{quotation.customer.taxId}</p>
                  </div>
                )}
                {quotation.customerPhone && (
                  <div>
                    <p className="text-xs text-gray-500">โทรศัพท์ / Phone</p>
                    <p className="text-sm text-gray-700">{quotation.customerPhone}</p>
                  </div>
                )}
                {quotation.customerAddress && (
                  <div>
                    <p className="text-xs text-gray-500">ที่อยู่ / Address</p>
                    <p className="text-sm text-gray-700">{quotation.customerAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Info */}
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-gray-600">เลขที่เอกสาร / Document No.</span>
                <span className="font-semibold text-gray-900">{quotation.quotationNo}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-gray-600">วันที่ / Date</span>
                <span className="text-gray-900">
                  {new Date(quotation.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {quotation.validUntil && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-gray-600">วันหมดอายุ / Valid Until</span>
                  <span className="text-gray-900">
                    {new Date(quotation.validUntil).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-3 px-4 text-left text-sm font-semibold border border-blue-700" style={{ width: '5%' }}>
                    ลำดับ<br />No.
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold border border-blue-700" style={{ width: '40%' }}>
                    รายการ<br />Description
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold border border-blue-700" style={{ width: '15%' }}>
                    จำนวน<br />Quantity
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold border border-blue-700" style={{ width: '20%' }}>
                    ราคา/หน่วย<br />Unit Price
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold border border-blue-700" style={{ width: '20%' }}>
                    จำนวนเงิน<br />Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item: any, index: number) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4 text-center border border-gray-300">{index + 1}</td>
                    <td className="py-3 px-4 border border-gray-300">
                      <div className="font-medium text-gray-900">{item.productName}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center border border-gray-300">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right border border-gray-300">
                      {parseFloat(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold border border-gray-300">
                      {parseFloat(item.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                
                {/* Empty rows to fill space */}
                {quotation.items.length < 5 && [...Array(5 - quotation.items.length)].map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="py-3 px-4 border border-gray-300">&nbsp;</td>
                    <td className="py-3 px-4 border border-gray-300">&nbsp;</td>
                    <td className="py-3 px-4 border border-gray-300">&nbsp;</td>
                    <td className="py-3 px-4 border border-gray-300">&nbsp;</td>
                    <td className="py-3 px-4 border border-gray-300">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-96">
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">ยอดรวม / Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {parseFloat(quotation.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                  </span>
                </div>
                {parseFloat(quotation.discount) > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-700">ส่วนลด / Discount</span>
                    <span className="font-semibold text-red-600">
                      -{parseFloat(quotation.discount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">ภาษีมูลค่าเพิ่ม {quotation.vat}% / VAT {quotation.vat}%</span>
                  <span className="font-semibold text-gray-900">
                    {(((parseFloat(quotation.subtotal) - parseFloat(quotation.discount)) * parseFloat(quotation.vat)) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg">
                  <span className="text-lg font-bold text-gray-900">ยอดรวมสุทธิ / Grand Total</span>
                  <span className="text-xl font-bold text-blue-600">
                    {parseFloat(quotation.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <h3 className="text-sm font-bold text-gray-700 mb-2">หมายเหตุ / Remarks</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{quotation.notes}</p>
            </div>
          )}

          {/* Terms & Signature */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-gray-200">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">เงื่อนไขและข้อตกลง</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• ใบเสนอราคานี้มีอายุ 30 วัน นับจากวันที่ออกเอกสาร</li>
                <li>• ราคาดังกล่าวรวม VAT 7% แล้ว</li>
                <li>• เงื่อนไขการชำระเงิน: เงินสด หรือโอนเงิน</li>
                <li>• การยกเลิกหลังจากสั่งซื้อแล้วจะไม่คืนเงิน</li>
              </ul>
            </div>
            <div>
              <div className="text-center">
                <div className="border-b-2 border-gray-300 mb-2 pb-12"></div>
                <p className="text-sm text-gray-700">ผู้เสนอราคา / Authorized Signature</p>
                <p className="text-xs text-gray-500 mt-1">
                  วันที่ / Date: {new Date().toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-xs text-gray-500">
              เอกสารนี้สร้างโดยระบบจัดการเอกสารธุรกิจ | This document is generated by Business Document Management System
            </p>
            <p className="text-xs text-gray-400 mt-1">
              หน้า 1/1 | Page 1/1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetailPage;