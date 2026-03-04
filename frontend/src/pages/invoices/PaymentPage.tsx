import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoiceApi } from "../../services/api";
import Swal from 'sweetalert2';
import {
    ArrowLeft,
    Receipt,
    CheckCircle2,
} from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PromptPayQR from "../../components/payment/PromptPayQR";

interface Invoice {
    id: number;
    invoiceNo: string;
    customerName: string;
    customerPhone?: string;
    total: string;
    paidAmount: string;
    remainingAmount: string;
    status: string;
}

const PROMPTPAY_ID = "0928980434"; // PromptPay ID ของร้าน

const PaymentPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await invoiceApi.getById(parseInt(id));
            const invoiceData = response.data.data;
            setInvoice(invoiceData);
        } catch (error) {
            console.error("Error fetching invoice:", error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด!',
                text: 'ไม่สามารถโหลดข้อมูลใบแจ้งหนี้ได้',
                confirmButtonText: 'ตกลง',
            });
            navigate("/invoices");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!invoice) return;

        if (!paymentConfirmed) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณายืนยัน',
                text: 'กรุณายืนยันว่าคุณได้โอนเงินเรียบร้อยแล้ว',
                confirmButtonText: 'ตกลง',
            });
            return;
        }

        setSubmitting(true);
        // Show loading
        Swal.fire({
            title: 'กำลังบันทึกการชำระเงิน...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const amount = parseFloat(invoice.remainingAmount);

            await invoiceApi.recordPayment(invoice.id, {
                amount,
                paymentMethod: "promptpay",
                notes: "ชำระผ่าน PromptPay QR Code",
            });

            await Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: 'บันทึกการชำระเงินสำเร็จ',
                confirmButtonText: 'ตกลง',
            });
            navigate(`/invoices/${invoice.id}`);
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด!',
                text: 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน',
                confirmButtonText: 'ตกลง',
            });
            console.error("Error recording payment:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner size="lg" message="กำลังโหลดข้อมูล..." />;
    }

    if (!invoice) {
        return null;
    }

    const amount = parseFloat(invoice.remainingAmount);

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    รับชำระเงิน
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {invoice.invoiceNo}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="space-y-6">
                    {/* Invoice Summary */}
                    <Card>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    ข้อมูลใบแจ้งหนี้
                                </h2>
                                <p className="text-sm text-gray-500">{invoice.customerName}</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-100">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">ยอดรวมทั้งหมด</p>
                                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                                            ฿{parseFloat(invoice.total).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">ชำระแล้ว</p>
                                        <p className="text-base sm:text-lg font-semibold text-green-600">
                                            ฿{parseFloat(invoice.paidAmount).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <p className="text-xs text-gray-600 mb-1">ยอดคงเหลือ</p>
                                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                                            ฿{amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* PromptPay QR Code */}
                    <Card>
                        <PromptPayQR
                            amount={amount}
                            promptPayId={PROMPTPAY_ID}
                            invoiceNo={invoice.invoiceNo}
                        />
                    </Card>

                    {/* Payment Confirmation Checkbox */}
                    <Card>
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={paymentConfirmed}
                                    onChange={(e) => setPaymentConfirmed(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    ยืนยันว่าได้รับเงินเรียบร้อยแล้ว
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    กรุณาตรวจสอบบัญชีธนาคารหรือ statement ให้แน่ใจว่าได้รับเงินจากลูกค้าแล้ว
                                    ก่อนยืนยันการรับชำระเงิน
                                </p>
                            </div>
                        </label>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(-1)}
                            disabled={submitting}
                            className="flex-1"
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="button"
                            icon={CheckCircle2}
                            loading={submitting}
                            disabled={submitting || !paymentConfirmed}
                            onClick={handleConfirmPayment}
                            className="flex-1"
                        >
                            บันทึกการรับเงิน
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
