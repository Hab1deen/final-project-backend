import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'quotation' | 'invoice';
}

const StatusBadge = ({ status, type = 'quotation' }: StatusBadgeProps) => {
  const configs: Record<string, Record<string, any>> = {
    quotation: {
      draft: {
        label: 'ร่าง',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: Clock
      },
      sent: {
        label: 'ส่งแล้ว',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: CheckCircle
      },
      accepted: {
        label: 'อนุมัติ',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle
      },
      rejected: {
        label: 'ปฏิเสธ',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle
      },
      converted: {
        label: 'แปลงแล้ว',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: CheckCircle
      },
    },
    invoice: {
      unpaid: {
        label: 'รอชำระ',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock
      },
      partial: {
        label: 'ชำระบางส่วน',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: AlertCircle
      },
      paid: {
        label: 'ชำระแล้ว',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle
      },
      overdue: {
        label: 'เกินกำหนด',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle
      },
    },
  };

  const config = configs[type]?.[status] || configs[type]?.draft || configs.quotation.draft;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

export default StatusBadge;