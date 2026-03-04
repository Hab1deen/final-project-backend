import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, FileCheck } from "lucide-react";
import Swal from 'sweetalert2';
import { receiptApi } from "../../services/api";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Pagination from "../../components/common/Pagination";

interface Receipt {
  id: number;
  receiptNo: string;
  invoiceId: number;
  invoiceNo: string;
  customerName: string;
  amount: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  invoice?: {
    invoiceNo: string;
    customerName: string;
  };
}

const ReceiptsPage = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await receiptApi.getAll();
      setReceipts(response.data.data);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถดึงข้อมูลใบเสร็จได้',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const filteredReceipts = receipts.filter((receipt) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      receipt.receiptNo.toLowerCase().includes(searchLower) ||
      receipt.invoiceNo?.toLowerCase().includes(searchLower) ||
      receipt.customerName?.toLowerCase().includes(searchLower)
    );
  });

  // Paginate filtered receipts
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

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

  if (loading) {
    return <LoadingSpinner size="lg" message="กำลังโหลดข้อมูล..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="ใบเสร็จรับเงิน"
        description={`${receipts.length} รายการ`}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="text-sm text-gray-600 mb-1">ใบเสร็จทั้งหมด</div>
          <div className="text-2xl font-bold text-gray-900">
            {receipts.length}
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-sm text-gray-600 mb-1">วันนี้</div>
          <div className="text-2xl font-bold text-gray-900">
            {receipts.filter((r) => {
              const today = new Date().toDateString();
              const receiptDate = new Date(r.createdAt).toDateString();
              return receiptDate === today;
            }).length}
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-sm text-gray-600 mb-1">ยอดรวม</div>
          <div className="text-2xl font-bold text-gray-900">
            ฿
            {receipts
              .reduce((sum, r) => sum + parseFloat(r.amount), 0)
              .toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหา (เลขใบเสร็จ, เลขใบแจ้งหนี้, ชื่อลูกค้า)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Receipts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  เลขที่ใบเสร็จ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  เลขที่ใบแจ้งหนี้
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  จำนวนเงิน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  วิธีชำระ
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
              {paginatedReceipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {receipt.receiptNo}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/invoices/${receipt.invoiceId}`)}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      {receipt.invoiceNo}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {receipt.customerName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-600">
                      ฿{parseFloat(receipt.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getPaymentMethodLabel(receipt.paymentMethod)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(receipt.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/receipts/${receipt.id}`)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReceipts.length === 0 && (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">ไม่พบใบเสร็จรับเงิน</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {filteredReceipts.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              แสดง {paginatedReceipts.length} รายการ
            </span>
            <span className="font-medium text-gray-900">
              ยอดรวมทั้งหมด: ฿
              {paginatedReceipts
                .reduce((sum, r) => sum + parseFloat(r.amount), 0)
                .toLocaleString()}
            </span>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {filteredReceipts.length > 0 && Math.ceil(filteredReceipts.length / limit) > 1 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(filteredReceipts.length / limit)}
          totalItems={filteredReceipts.length}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default ReceiptsPage;