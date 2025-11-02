import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, User, Phone, MapPin, Calendar, Download, DollarSign } from 'lucide-react';
import { invoiceApi } from '../../services/api';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getById(parseInt(id!));
      setInvoice(response.data.data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await invoiceApi.recordPayment(parseInt(id!), {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        notes: paymentNotes
      });
      
      alert('บันทึกการชำระเงินสำเร็จ');
      setShowPaymentModal(false);
      fetchInvoice();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      unpaid: { label: 'รอชำระ', color: 'bg-yellow-100 text-yellow-800' },
      partial: { label: 'ชำระบางส่วน', color: 'bg-blue-100 text-blue-800' },
      paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-800' },
      overdue: { label: 'เกินกำหนด', color: 'bg-red-100 text-red-800' },
    };
    const s = config[status] || config.unpaid;
    return <span className={`px-3 py-1 text-sm font-medium rounded ${s.color}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
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
              สร้างเมื่อ {new Date(invoice.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {invoice.status !== 'paid' && (
            <button
              onClick={() => {
                setPaymentAmount(invoice.remainingAmount);
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              รับชำระเงิน
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            พิมพ์/บันทึก PDF
          </button>
        </div>
      </div>

      {/* Payment Status Bar */}
      {invoice.status !== 'paid' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-800">ความคืบหน้าการชำระเงิน</span>
            <span className="text-sm font-semibold text-yellow-900">
              {((parseFloat(invoice.paidAmount) / parseFloat(invoice.total)) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full transition-all"
              style={{ width: `${(parseFloat(invoice.paidAmount) / parseFloat(invoice.total)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-yellow-700">ชำระแล้ว: ฿{parseFloat(invoice.paidAmount).toLocaleString()}</span>
            <span className="text-yellow-900 font-semibold">คงเหลือ: ฿{parseFloat(invoice.remainingAmount).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Document */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 print:border-0">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <h2 className="text-3xl font-bold text-blue-600 mb-2">
            ใบแจ้งหนี้
          </h2>
          <p className="text-xl font-semibold text-gray-700">INVOICE</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              ข้อมูลลูกค้า
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900">{invoice.customerName}</div>
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
                  <span className="text-gray-700">{invoice.customerAddress}</span>
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
                  <span className="font-medium">เลขที่:</span> {invoice.invoiceNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  <span className="font-medium">วันที่:</span>{' '}
                  {new Date(invoice.createdAt).toLocaleDateString('th-TH')}
                </span>
              </div>
              {invoice.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    <span className="font-medium">ครบกำหนด:</span>{' '}
                    {new Date(invoice.dueDate).toLocaleDateString('th-TH')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ลำดับ</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">รายการ</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">จำนวน</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">ราคา/หน่วย</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{item.productName}</div>
                    {item.description && (
                      <div className="text-sm text-gray-600">{item.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    ฿{parseFloat(item.price).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    ฿{parseFloat(item.total).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between py-2 text-gray-700">
                <span>ยอดรวม</span>
                <span className="font-semibold">฿{parseFloat(invoice.subtotal).toLocaleString()}</span>
              </div>
              {parseFloat(invoice.discount) > 0 && (
                <div className="flex justify-between py-2 text-gray-700">
                  <span>ส่วนลด</span>
                  <span className="font-semibold">-฿{parseFloat(invoice.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-gray-700">
                <span>VAT {invoice.vat}%</span>
                <span className="font-semibold">
                  ฿{(((parseFloat(invoice.subtotal) - parseFloat(invoice.discount)) * parseFloat(invoice.vat)) / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300 text-xl font-bold text-gray-900">
                <span>ยอดรวมสุทธิ</span>
                <span className="text-blue-600">฿{parseFloat(invoice.total).toLocaleString()}</span>
              </div>
              {parseFloat(invoice.paidAmount) > 0 && (
                <>
                  <div className="flex justify-between py-2 text-green-600">
                    <span className="font-medium">ชำระแล้ว</span>
                    <span className="font-semibold">฿{parseFloat(invoice.paidAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 text-red-600">
                    <span className="font-medium">คงเหลือ</span>
                    <span className="font-semibold">฿{parseFloat(invoice.remainingAmount).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-8 print:break-inside-avoid">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ประวัติการชำระเงิน</h3>
            <div className="space-y-2">
              {invoice.payments.map((payment: any, index: number) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      ครั้งที่ {index + 1} - {new Date(payment.paymentDate).toLocaleDateString('th-TH')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {payment.paymentMethod === 'cash' && 'เงินสด'}
                      {payment.paymentMethod === 'transfer' && 'โอนเงิน'}
                      {payment.paymentMethod === 'credit' && 'บัตรเครดิต'}
                      {payment.notes && ` - ${payment.notes}`}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    ฿{parseFloat(payment.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">หมายเหตุ</h3>
            <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>ขอบคุณที่ใช้บริการ</p>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              บันทึกการรับชำระเงิน
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">เลขที่ใบแจ้งหนี้</div>
              <div className="font-semibold text-gray-900">{invoice.invoiceNo}</div>
              <div className="text-sm text-gray-600 mt-2">ยอดคงเหลือ: ฿{parseFloat(invoice.remainingAmount).toLocaleString()}</div>
            </div>
            
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนเงินที่รับ *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  max={invoice.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วิธีการชำระ
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">เงินสด</option>
                  <option value="transfer">โอนเงิน</option>
                  <option value="credit">บัตรเครดิต</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุ
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เลขที่อ้างอิง, หมายเหตุเพิ่มเติม..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  บันทึกการชำระ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailPage;