import { useState } from "react";
import { X } from "lucide-react";
import Swal from 'sweetalert2';
import Button from "../common/Button";
import { receiptApi } from "../../services/api";

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: number;
    invoiceNo: string;
    customerName: string;
    total: string;
    paidAmount: string;
    remainingAmount: string;
  };
  onSuccess: () => void;
}

const CreateReceiptModal = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: CreateReceiptModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: invoice.remainingAmount,
    paymentMethod: "cash",
    notes: "",
  });

  const paymentMethods = [
    { value: "cash", label: "เงินสด" },
    { value: "transfer", label: "โอนเงิน" },
    { value: "credit_card", label: "บัตรเครดิต" },
    { value: "promptpay", label: "พร้อมเพย์" },
    { value: "mobile_banking", label: "Mobile Banking" },
    { value: "e_wallet", label: "E-Wallet" },
    { value: "check", label: "เช็ค" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Swal.fire({ icon: 'warning', title: 'กรุณาระบุจำนวนเงิน', confirmButtonText: 'ตกลง' });
      return;
    }

    if (parseFloat(formData.amount) > parseFloat(invoice.remainingAmount)) {
      Swal.fire({ icon: 'warning', title: 'จำนวนเงินเกินยอดค้างชำระ', confirmButtonText: 'ตกลง' });
      return;
    }

    try {
      setLoading(true);
      await receiptApi.create({
        invoiceId: invoice.id,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || null,
      });

      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'สร้างใบเสร็จสำเร็จ',
        confirmButtonText: 'ตกลง',
        timer: 2000,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating receipt:", error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: error.response?.data?.message || "ไม่สามารถสร้างใบเสร็จได้",
        confirmButtonText: 'ตกลง',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            สร้างใบเสร็จรับเงิน
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Invoice Info */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">เลขที่ใบแจ้งหนี้:</span>
              <span className="font-semibold text-gray-900">
                {invoice.invoiceNo}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ลูกค้า:</span>
              <span className="font-semibold text-gray-900">
                {invoice.customerName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ยอดรวม:</span>
              <span className="font-semibold text-gray-900">
                ฿{parseFloat(invoice.total).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ชำระแล้ว:</span>
              <span className="font-semibold text-green-600">
                ฿{parseFloat(invoice.paidAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
              <span className="text-gray-600">คงเหลือ:</span>
              <span className="font-bold text-red-600 text-base">
                ฿{parseFloat(invoice.remainingAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              จำนวนเงินที่ชำระ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ฿
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={parseFloat(invoice.remainingAmount)}
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              สูงสุด: ฿{parseFloat(invoice.remainingAmount).toLocaleString()}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วิธีชำระเงิน <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethod: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="success"
              className="flex-1"
              loading={loading}
              disabled={loading}
            >
              {loading ? "กำลังสร้าง..." : "สร้างใบเสร็จ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReceiptModal;