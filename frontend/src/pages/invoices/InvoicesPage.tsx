import { useEffect, useState } from "react";
import { Plus, Eye, DollarSign, Search, Receipt } from "lucide-react";
import { invoiceApi } from "../../services/api";
import { useNavigate } from "react-router-dom";

interface Invoice {
  id: number;
  invoiceNo: string;
  customerName: string;
  customerPhone: string | null;
  total: string;
  paidAmount: string;
  remainingAmount: string;
  status: string;
  createdAt: string;
  _count?: {
    items: number;
    payments: number;
  };
}

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getAll();
      setInvoices(response.data.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      alert("ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.remainingAmount);
    setPaymentMethod("cash");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoice) return;

    try {
      await invoiceApi.recordPayment(selectedInvoice.id, {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        notes: paymentNotes,
      });

      alert("บันทึกการชำระเงินสำเร็จ");
      setShowPaymentModal(false);
      fetchInvoices();
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกการชำระเงิน");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      unpaid: { label: "รอชำระ", color: "bg-yellow-100 text-yellow-800" },
      partial: { label: "ชำระบางส่วน", color: "bg-blue-100 text-blue-800" },
      paid: { label: "ชำระแล้ว", color: "bg-green-100 text-green-800" },
      overdue: { label: "เกินกำหนด", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || statusConfig.unpaid;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchSearch =
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      filterStatus === "all" || invoice.status === filterStatus;

    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ใบแจ้งหนี้</h1>
          <p className="text-gray-600">ทั้งหมด {invoices.length} รายการ</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">รอชำระ</div>
          <div className="text-2xl font-bold text-yellow-600">
            {invoices.filter((i) => i.status === "unpaid").length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">ชำระบางส่วน</div>
          <div className="text-2xl font-bold text-blue-600">
            {invoices.filter((i) => i.status === "partial").length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">ชำระแล้ว</div>
          <div className="text-2xl font-bold text-green-600">
            {invoices.filter((i) => i.status === "paid").length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">ยอดรวมทั้งหมด</div>
          <div className="text-2xl font-bold text-gray-900">
            ฿
            {invoices
              .reduce((sum, i) => sum + parseFloat(i.total), 0)
              .toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ใบแจ้งหนี้หรือชื่อลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="unpaid">รอชำระ</option>
          <option value="partial">ชำระบางส่วน</option>
          <option value="paid">ชำระแล้ว</option>
          <option value="overdue">เกินกำหนด</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                เลขที่
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ลูกค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ยอดรวม
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ชำระแล้ว
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                คงเหลือ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                วันที่
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {invoice.invoiceNo}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {invoice.customerName}
                    </div>
                    {invoice.customerPhone && (
                      <div className="text-sm text-gray-500">
                        {invoice.customerPhone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">
                    ฿{parseFloat(invoice.total).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-green-600">
                    ฿{parseFloat(invoice.paidAmount).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-red-600">
                    ฿{parseFloat(invoice.remainingAmount).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(invoice.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {invoice.status !== "paid" && (
                      <button
                        onClick={() => openPaymentModal(invoice)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                        รับชำระ
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 text-gray-500">ไม่พบใบแจ้งหนี้</div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              บันทึกการรับชำระเงิน
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">เลขที่ใบแจ้งหนี้</div>
              <div className="font-semibold text-gray-900">
                {selectedInvoice.invoiceNo}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                ลูกค้า: {selectedInvoice.customerName}
              </div>
              <div className="text-sm text-gray-600">
                ยอดคงเหลือ: ฿
                {parseFloat(selectedInvoice.remainingAmount).toLocaleString()}
              </div>
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
                  max={selectedInvoice.remainingAmount}
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

export default InvoicesPage;
