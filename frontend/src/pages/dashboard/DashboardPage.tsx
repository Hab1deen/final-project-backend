import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, Users, FileText } from 'lucide-react';
import { quotationApi, invoiceApi, customerApi, productApi } from '../../services/api';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    quotationsCount: 0,
    invoicesCount: 0,
    customersCount: 0,
    productsCount: 0,
    pendingQuotations: 0,
    paidInvoices: 0,
    partialInvoices: 0,
    unpaidInvoices: 0,
    totalPaid: 0,
    totalRemaining: 0
  });

  const [recentQuotations, setRecentQuotations] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ดึงข้อมูลทั้งหมดพร้อมกัน
      const [quotationsRes, invoicesRes, customersRes, productsRes] = await Promise.all([
        quotationApi.getAll(),
        invoiceApi.getAll(),
        customerApi.getAll(),
        productApi.getAll()
      ]);

      const quotations = quotationsRes.data.data;
      const invoices = invoicesRes.data.data;
      const customers = customersRes.data.data;
      const products = productsRes.data.data;

      // คำนวณยอดขายวันนี้
      const today = new Date().toDateString();
      const todaySales = invoices
        .filter((inv: any) => new Date(inv.createdAt).toDateString() === today)
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);

      // นับจำนวนใบเสนอราคาแต่ละสถานะ
      const pendingQuotations = quotations.filter(
        (q: any) => q.status === 'draft' || q.status === 'sent'
      ).length;

      // นับจำนวนใบแจ้งหนี้แต่ละสถานะ
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid').length;
      const partialInvoices = invoices.filter((i: any) => i.status === 'partial').length;
      const unpaidInvoices = invoices.filter((i: any) => i.status === 'unpaid').length;

      // คำนวณยอดรับแล้วและยอดคงเหลือ
      const totalPaid = invoices.reduce(
        (sum: number, inv: any) => sum + parseFloat(inv.paidAmount), 0
      );
      const totalRemaining = invoices.reduce(
        (sum: number, inv: any) => sum + parseFloat(inv.remainingAmount), 0
      );

      setStats({
        todaySales,
        quotationsCount: quotations.length,
        invoicesCount: invoices.length,
        customersCount: customers.length,
        productsCount: products.length,
        pendingQuotations,
        paidInvoices,
        partialInvoices,
        unpaidInvoices,
        totalPaid,
        totalRemaining
      });

      // ใบเสนอราคาล่าสุด 3 รายการ
      setRecentQuotations(quotations.slice(0, 3));
      
      // ใบแจ้งหนี้ล่าสุด 3 รายการ
      setRecentInvoices(invoices.slice(0, 3));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string, type: 'quotation' | 'invoice') => {
    if (type === 'quotation') {
      const config: any = {
        draft: { label: 'ร่าง', color: 'bg-gray-100 text-gray-800' },
        sent: { label: 'ส่งแล้ว', color: 'bg-blue-100 text-blue-800' },
        accepted: { label: 'อนุมัติ', color: 'bg-green-100 text-green-800' },
        rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-800' },
        converted: { label: 'แปลงแล้ว', color: 'bg-purple-100 text-purple-800' },
      };
      const s = config[status] || config.draft;
      return <span className={`text-xs px-2 py-1 rounded ${s.color}`}>{s.label}</span>;
    } else {
      const config: any = {
        unpaid: { label: 'รอชำระ', color: 'bg-yellow-100 text-yellow-800' },
        partial: { label: 'ชำระบางส่วน', color: 'bg-blue-100 text-blue-800' },
        paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-800' },
        overdue: { label: 'เกินกำหนด', color: 'bg-red-100 text-red-800' },
      };
      const s = config[status] || config.unpaid;
      return <span className={`text-xs px-2 py-1 rounded ${s.color}`}>{s.label}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  const statsCards = [
    {
      name: 'ยอดขายวันนี้',
      value: `฿${stats.todaySales.toLocaleString()}`,
      change: `+${stats.paidInvoices} ใบ`,
      icon: TrendingUp,
      color: 'blue'
    },
    {
      name: 'ใบเสนอราคา',
      value: stats.quotationsCount.toString(),
      change: `${stats.pendingQuotations} รอดำเนินการ`,
      icon: FileText,
      color: 'purple'
    },
    {
      name: 'ใบแจ้งหนี้',
      value: stats.invoicesCount.toString(),
      change: `${stats.paidInvoices} ชำระแล้ว`,
      icon: ShoppingCart,
      color: 'green'
    },
    {
      name: 'ลูกค้าทั้งหมด',
      value: stats.customersCount.toString(),
      change: `${stats.productsCount} สินค้า`,
      icon: Users,
      color: 'orange'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ยินดีต้อนรับสู่ระบบจัดการเอกสารธุรกิจ
        </h1>
        <p className="text-blue-100">
          จัดการใบเสนอราคาและใบแจ้งหนี้ได้อย่างง่ายดาย
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
            green: 'bg-green-100 text-green-600',
            orange: 'bg-orange-100 text-orange-600',
          }[stat.color];

          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-green-600 font-medium">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-gray-600">{stat.name}</p>
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">ยอดรับแล้วทั้งหมด</div>
          <div className="text-3xl font-bold text-green-600">
            ฿{stats.totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">ยอดคงเหลือ</div>
          <div className="text-3xl font-bold text-red-600">
            ฿{stats.totalRemaining.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">สถานะใบแจ้งหนี้</div>
          <div className="flex gap-2 mt-2">
            <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              รอชำระ {stats.unpaidInvoices}
            </span>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              บางส่วน {stats.partialInvoices}
            </span>
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              แล้ว {stats.paidInvoices}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ใบเสนอราคาล่าสุด
          </h3>
          <div className="space-y-3">
            {recentQuotations.length > 0 ? (
              recentQuotations.map((quotation: any) => (
                <div key={quotation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{quotation.quotationNo}</p>
                    <p className="text-sm text-gray-600">{quotation.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">฿{parseFloat(quotation.total).toLocaleString()}</p>
                    {getStatusBadge(quotation.status, 'quotation')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีใบเสนอราคา
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ใบแจ้งหนี้ล่าสุด
          </h3>
          <div className="space-y-3">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{invoice.invoiceNo}</p>
                    <p className="text-sm text-gray-600">{invoice.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">฿{parseFloat(invoice.total).toLocaleString()}</p>
                    {getStatusBadge(invoice.status, 'invoice')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีใบแจ้งหนี้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;