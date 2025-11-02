import { useEffect, useState } from "react";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  FileText,
  ArrowRight,
} from "lucide-react";
import { quotationApi } from "../../services/api";
import { useNavigate } from "react-router-dom";

interface Quotation {
  id: number;
  quotationNo: string;
  customerName: string;
  customerPhone: string | null;
  total: string;
  status: string;
  createdAt: string;
  _count?: {
    items: number;
  };
}

const QuotationsPage = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await quotationApi.getAll();
      setQuotations(response.data.data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      alert("ไม่สามารถดึงข้อมูลใบเสนอราคาได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบใบเสนอราคานี้ใช่หรือไม่?")) return;

    try {
      await quotationApi.delete(id);
      alert("ลบใบเสนอราคาสำเร็จ");
      fetchQuotations();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      alert("ไม่สามารถลบใบเสนอราคาได้");
    }
  };

  const handleConvertToInvoice = async (id: number) => {
    if (!confirm("คุณต้องการแปลงเป็นใบแจ้งหนี้ใช่หรือไม่?")) return;

    try {
      await quotationApi.convertToInvoice(id);
      alert("แปลงเป็นใบแจ้งหนี้สำเร็จ");
      fetchQuotations();
    } catch (error) {
      console.error("Error converting to invoice:", error);
      alert("ไม่สามารถแปลงเป็นใบแจ้งหนี้ได้");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      draft: { label: "ร่าง", color: "bg-gray-100 text-gray-800" },
      sent: { label: "ส่งแล้ว", color: "bg-blue-100 text-blue-800" },
      accepted: { label: "อนุมัติ", color: "bg-green-100 text-green-800" },
      rejected: { label: "ปฏิเสธ", color: "bg-red-100 text-red-800" },
      converted: { label: "แปลงแล้ว", color: "bg-purple-100 text-purple-800" },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredQuotations = quotations.filter((quotation) => {
    const matchSearch =
      quotation.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      filterStatus === "all" || quotation.status === filterStatus;

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
          <h1 className="text-2xl font-bold text-gray-900">ใบเสนอราคา</h1>
          <p className="text-gray-600">ทั้งหมด {quotations.length} รายการ</p>
        </div>
        <button
          onClick={() => navigate("/quotations/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          สร้างใบเสนอราคา
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ใบเสนอราคาหรือชื่อลูกค้า..."
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
          <option value="draft">ร่าง</option>
          <option value="sent">ส่งแล้ว</option>
          <option value="accepted">อนุมัติ</option>
          <option value="rejected">ปฏิเสธ</option>
          <option value="converted">แปลงแล้ว</option>
        </select>
      </div>

      {/* Quotations Table */}
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
                รายการ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ยอดรวม
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
            {filteredQuotations.map((quotation) => (
              <tr key={quotation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {quotation.quotationNo}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {quotation.customerName}
                    </div>
                    {quotation.customerPhone && (
                      <div className="text-sm text-gray-500">
                        {quotation.customerPhone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {quotation._count?.items || 0} รายการ
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">
                    ฿{parseFloat(quotation.total).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(quotation.status)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(quotation.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/quotations/${quotation.id}`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {quotation.status !== "converted" && (
                      <>
                        <button
                          onClick={() => handleConvertToInvoice(quotation.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="แปลงเป็นใบแจ้งหนี้"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(quotation.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredQuotations.length === 0 && (
          <div className="text-center py-12 text-gray-500">ไม่พบใบเสนอราคา</div>
        )}
      </div>
    </div>
  );
};

export default QuotationsPage;
