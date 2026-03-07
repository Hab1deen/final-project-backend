import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, AlertCircle, CheckCircle, XCircle, PenLine, Trash2 } from 'lucide-react';
import axios from 'axios';
import { config } from '../../config/config';

interface QuotationItem {
    id: number;
    productName: string;
    description: string | null;
    quantity: number;
    price: string;
    total: string;
}

interface Customer {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
}

interface Quotation {
    id: number;
    quotationNo: string;
    customerName: string;
    customerPhone: string | null;
    customerAddress: string | null;
    subtotal: string;
    discount: string;
    vat: string;
    total: string;
    notes: string | null;
    status: string;
    approvalStatus: string;
    approvedAt: string | null;
    approvalNotes: string | null;
    createdAt: string;
    customerSignature: string | null;
    customer: Customer;
    items: QuotationItem[];
    signatures?: Array<{
        id: number;
        type: string;
        signatureUrl: string;
        signerName: string;
        signedAt: string;
    }>;
}

// ------------ Signature Canvas Component ------------
const SignatureCanvas = ({
    onSigned,
    onClear,
}: {
    onSigned: (dataUrl: string) => void;
    onClear: () => void;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const hasDrawn = useRef(false);

    const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        e.preventDefault();
        isDrawing.current = true;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        e.preventDefault();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1e3a5f';
        const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        hasDrawn.current = true;
    };

    const endDraw = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn.current) return;
        onSigned(canvas.toDataURL('image/png'));
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn.current = false;
        onClear();
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
            />
            <button
                type="button"
                onClick={clear}
                className="mt-2 flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
                <Trash2 className="w-4 h-4" />
                ล้างลายเซ็น
            </button>
        </div>
    );
};
// -----------------------------------------------------

const QuotationApprovalPage = () => {
    const { token } = useParams<{ token: string }>();
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [showAction, setShowAction] = useState<'approve' | 'reject' | null>(null);
    const [signatureData, setSignatureData] = useState<string | null>(null);

    useEffect(() => {
        fetchQuotation();
    }, [token]);

    const fetchQuotation = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${config.apiBaseUrl}/api/public/quotations/${token}`);
            setQuotation(response.data.data);
        } catch (err) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'ไม่พบใบเสนอราคา');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!quotation) return;
        if (!signatureData) {
            alert('กรุณาเซ็นชื่อในช่องลายเซ็นก่อนอนุมัติ');
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`${config.apiBaseUrl}/api/public/quotations/${token}/approve`, {
                notes: notes || null,
                customerSignature: signatureData,
            });
            await fetchQuotation();
            setShowAction(null);
            setNotes('');
            setSignatureData(null);
        } catch (err) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            alert(axiosErr.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!quotation) return;
        if (!notes.trim()) {
            alert('กรุณาระบุเหตุผลในการปฏิเสธ');
            return;
        }
        try {
            setSubmitting(true);
            await axios.post(`${config.apiBaseUrl}/api/public/quotations/${token}/reject`, {
                notes: notes,
            });
            await fetchQuotation();
            setShowAction(null);
            setNotes('');
        } catch (err) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            alert(axiosErr.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    if (error || !quotation) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบใบเสนอราคา</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    const isApproved = quotation.approvalStatus === 'approved';
    const isRejected = quotation.approvalStatus === 'rejected';
    const isPending = quotation.approvalStatus === 'pending';

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Status Badge */}
                {isApproved && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                            <h3 className="font-semibold text-green-900">อนุมัติแล้ว</h3>
                            <p className="text-sm text-green-700">
                                ใบเสนอราคานี้ได้รับการอนุมัติเมื่อ {new Date(quotation.approvedAt!).toLocaleDateString('th-TH')}
                            </p>
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <XCircle className="w-6 h-6 text-red-600" />
                        <div>
                            <h3 className="font-semibold text-red-900">ปฏิเสธแล้ว</h3>
                            <p className="text-sm text-red-700">
                                ใบเสนอราคานี้ถูกปฏิเสธเมื่อ {new Date(quotation.approvedAt!).toLocaleDateString('th-TH')}
                            </p>
                            {quotation.approvalNotes && (
                                <p className="text-sm text-red-700 mt-1">เหตุผล: {quotation.approvalNotes}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Document */}
                <div className="bg-white rounded-lg shadow-lg" style={{ maxWidth: '210mm', margin: '0 auto' }}>
                    <div className="p-12">
                        {/* Document Title */}
                        <div className="text-center mb-6 pb-4 border-b-2 border-blue-600">
                            <h1 className="text-4xl font-bold mb-2">ใบเสนอราคา</h1>
                            <p className="text-xl text-gray-600">QUOTATION</p>
                        </div>

                        {/* Document Info & Customer Info */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            {/* Customer Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2 border-b pb-1">
                                    ข้อมูลลูกค้า | Customer Information
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500">ชื่อ / Name</p>
                                        <p className="font-semibold text-gray-900">{quotation.customerName}</p>
                                    </div>
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
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-4">
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
                                    {quotation.items.map((item, index) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-3 px-4 text-center border border-gray-300">
                                                {index + 1}
                                            </td>
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
                                            {((parseFloat(quotation.subtotal) - parseFloat(quotation.discount)) * parseFloat(quotation.vat) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
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
                            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                                <h3 className="text-xs font-bold text-gray-700 mb-1">หมายเหตุ / Remarks</h3>
                                <p className="text-xs text-gray-700 whitespace-pre-line">{quotation.notes}</p>
                            </div>
                        )}

                        {/* Signatures Display */}
                        {((quotation.signatures && quotation.signatures.length > 0) || quotation.customerSignature) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h3 className="text-xs font-bold text-gray-900 mb-3">ลายเซ็น</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Customer Signature */}
                                    {quotation.customerSignature && (
                                        <div className="text-center">
                                            <div className="border border-gray-300 rounded p-2 bg-white min-h-[80px] flex items-center justify-center">
                                                <img
                                                    src={quotation.customerSignature}
                                                    alt="ลายเซ็นผู้ว่าจ้าง"
                                                    className="max-h-16"
                                                />
                                            </div>
                                            <p className="mt-2 font-semibold text-gray-900">{quotation.customerName}</p>
                                            <p className="text-sm text-gray-600">ผู้ว่าจ้าง</p>
                                        </div>
                                    )}
                                    {/* Shop Signatures */}
                                    {quotation.signatures
                                        ?.filter((sig) => sig.type === 'shop')
                                        .map((signature) => (
                                            <div key={signature.id} className="text-center">
                                                <div className="border border-gray-300 rounded p-2 bg-white min-h-[80px] flex items-center justify-center">
                                                    <img
                                                        src={signature.signatureUrl}
                                                        alt="ลายเซ็นผู้เสนอราคา"
                                                        className="max-h-16"
                                                    />
                                                </div>
                                                <p className="mt-2 font-semibold text-gray-900">{signature.signerName}</p>
                                                <p className="text-sm text-gray-600">ผู้เสนอราคา</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    วันที่: {new Date(signature.signedAt).toLocaleDateString('th-TH', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {isPending && (
                        <div className="bg-gray-50 px-8 py-6 border-t">
                            {showAction === null && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowAction('approve')}
                                        disabled={submitting}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-5 h-5" />
                                        อนุมัติใบเสนอราคา
                                    </button>
                                    <button
                                        onClick={() => setShowAction('reject')}
                                        disabled={submitting}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X className="w-5 h-5" />
                                        ปฏิเสธใบเสนอราคา
                                    </button>
                                </div>
                            )}

                            {/* Approve flow — requires signature */}
                            {showAction === 'approve' && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                                            <PenLine className="w-4 h-4 text-blue-600" />
                                            ลายเซ็นผู้อนุมัติ <span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">วาดลายเซ็นของคุณในกล่องด้านล่าง</p>
                                        <SignatureCanvas
                                            onSigned={(data) => setSignatureData(data)}
                                            onClear={() => setSignatureData(null)}
                                        />
                                        {!signatureData && (
                                            <p className="text-xs text-amber-600 mt-1">⚠ กรุณาวาดลายเซ็นก่อนอนุมัติ</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            หมายเหตุ (ไม่บังคับ)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..."
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleApprove}
                                            disabled={submitting || !signatureData}
                                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
                                        >
                                            {submitting ? 'กำลังดำเนินการ...' : '✓ ยืนยันอนุมัติ'}
                                        </button>
                                        <button
                                            onClick={() => { setShowAction(null); setNotes(''); setSignatureData(null); }}
                                            disabled={submitting}
                                            className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            ยกเลิก
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Reject flow */}
                            {showAction === 'reject' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            เหตุผลที่ปฏิเสธ <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="ระบุเหตุผลในการปฏิเสธ..."
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleReject}
                                            disabled={submitting}
                                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                                        >
                                            {submitting ? 'กำลังดำเนินการ...' : '✗ ยืนยันปฏิเสธ'}
                                        </button>
                                        <button
                                            onClick={() => { setShowAction(null); setNotes(''); }}
                                            disabled={submitting}
                                            className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            ยกเลิก
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-600">
                    <p className="text-sm">Easybill Online</p>
                    <p className="text-xs mt-1">ระบบจัดการเอกสารธุรกิจ</p>
                </div>
            </div>
        </div>
    );
};

export default QuotationApprovalPage;
