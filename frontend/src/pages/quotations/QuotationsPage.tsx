import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { quotationApi } from "../../services/api";
import { Plus, Trash2, FileText, Search, Filter } from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from '../../utils/alert';
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";

const QuotationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchQuotations();
  }, [page, statusFilter, limit]);

  useEffect(() => {
    // Reset to page 1 when search/filter changes
    if (page !== 1) {
      setPage(1);
    } else {
      fetchQuotations();
    }
  }, [searchTerm, statusFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await quotationApi.getAll(params);

      // Filter by search term on client side (or send to backend)
      let data = response.data.data;

      if (searchTerm) {
        data = data.filter(
          (q: any) =>
            q.quotationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setQuotations(data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      showError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (user?.role !== "admin") {
      showError("คุณไม่มีสิทธิ์ลบใบเสนอราคา");
      return;
    }

    const result = await showDeleteConfirm(
      'คุณแน่ใจหรือไม่ที่จะลบใบเสนอราคานี้?',
      'การกระทำนี้ไม่สามารถย้อนกลับได้'
    );

    if (!result.isConfirmed) return;

    try {
      await quotationApi.delete(id);
      showSuccess('ลบใบเสนอราคาสำเร็จ');
      fetchQuotations();
    } catch (error) {
      showError('ไม่สามารถลบได้');
    }
  };

  const getStatusCount = (status: string) => {
    // Use pagination total if available
    if (pagination && statusFilter === status) {
      return pagination.total;
    }
    return 0;
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="ใบเสนอราคา"
        description={`จัดการใบเสนอราคาทั้งหมด ${quotations.length} รายการ`}
        action={
          <Button
            icon={Plus}
            onClick={() => navigate("/quotations/create")}
          >
            สร้างใบเสนอราคา
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">ทั้งหมด</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
              {quotations.length}
            </p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">ร่าง</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {quotations.filter((q) => q.status === "draft").length}
            </p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">ส่งแล้ว</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {quotations.filter((q) => q.status === "sent").length}
            </p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">อนุมัติ</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {quotations.filter((q) => q.status === "accepted").length}
            </p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">แปลงแล้ว</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {quotations.filter((q) => q.status === "converted").length}
            </p>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ใบเสนอราคา, ชื่อลูกค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Button */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">ตัวกรอง</span>
          </button>
        </div>
      </Card>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  เลขที่
                </th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ลูกค้า
                </th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  วันที่
                </th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  ยอดรวม
                </th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  สถานะ
                </th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotations.length > 0 ? (
                quotations.map((quotation: any) => (
                  <tr
                    key={quotation.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 md:px-6 md:py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm md:text-base font-medium text-gray-900">
                          {quotation.quotationNo}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4">
                      <div className="text-sm md:text-base font-medium text-gray-900">
                        {quotation.customerName}
                      </div>
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm text-gray-500">
                      {quotation.createdAt
                        ? new Date(quotation.createdAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                        : "-"}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-right text-sm md:text-base font-semibold text-gray-900">
                      ฿{parseFloat(quotation.total).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-center">
                      <StatusBadge status={quotation.status} type="quotation" />
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4">
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        <button
                          onClick={() =>
                            navigate(`/quotations/${quotation.id}`)
                          }
                          className="p-1.5 md:p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {user?.role === "admin" && (
                          <button
                            onClick={() => handleDelete(quotation.id)}
                            className="p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <p>ไม่พบข้อมูลใบเสนอราคา</p>
                      <button
                        onClick={() => navigate("/quotations/create")}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + สร้างใบเสนอราคาใหม่
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      {quotations.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              แสดง {quotations.length} รายการ
              {pagination && ` (หน้า ${pagination.page}/${pagination.totalPages}, ทั้งหมด ${pagination.total} รายการ)`}
            </span>
            <span className="font-medium text-gray-900">
              ยอดรวมทั้งหมด: ฿
              {quotations
                .reduce((sum: number, q: any) => sum + parseFloat(q.total), 0)
                .toLocaleString()}
            </span>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default QuotationsPage;