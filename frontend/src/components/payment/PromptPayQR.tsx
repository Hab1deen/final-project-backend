import { useEffect, useState } from "react";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { Download, Smartphone } from "lucide-react";

interface PromptPayQRProps {
    amount: number;
    promptPayId: string;
    invoiceNo?: string;
}

const PromptPayQR = ({ amount, promptPayId, invoiceNo }: PromptPayQRProps) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        generateQR();
    }, [amount, promptPayId]);

    const generateQR = async () => {
        try {
            setLoading(true);

            // Generate PromptPay payload
            const payload = generatePayload(promptPayId, { amount });

            // Generate QR code
            const url = await QRCode.toDataURL(payload, {
                width: 400,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#FFFFFF",
                },
            });

            setQrCodeUrl(url);
        } catch (error) {
            console.error("Error generating QR code:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = () => {
        const link = document.createElement("a");
        link.href = qrCodeUrl;
        link.download = `promptpay-${invoiceNo || "payment"}.png`;
        link.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* QR Code Display */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-blue-200">
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                    <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
                        <img
                            src={qrCodeUrl}
                            alt="PromptPay QR Code"
                            className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64"
                        />
                    </div>

                    <div className="text-center">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">ยอดที่ต้องชำระ</p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                            ฿{amount.toLocaleString()}
                        </p>
                    </div>

                    <button
                        onClick={downloadQR}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors min-h-[44px]"
                    >
                        <Download className="w-4 h-4" />
                        ดาวน์โหลด QR Code
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6">
                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                            วิธีการชำระเงิน
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                            สแกน QR Code เพื่อชำระเงินผ่าน Mobile Banking
                        </p>
                    </div>
                </div>

                <ol className="space-y-2 sm:space-y-3">
                    <li className="flex items-start gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            1
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 pt-0.5">
                            เปิดแอปพลิเคชัน Mobile Banking ของคุณ
                        </span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            2
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 pt-0.5">
                            เลือกฟังก์ชัน "สแกน QR" หรือ "QR Payment"
                        </span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            3
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 pt-0.5">
                            สแกน QR Code ด้านบน
                        </span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            4
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 pt-0.5">
                            ตรวจสอบยอดเงินและยืนยันการโอน
                        </span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            5
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 pt-0.5">
                            กดปุ่ม "บันทึกการรับเงิน" ด้านล่างเมื่อได้รับเงินแล้ว
                        </span>
                    </li>
                </ol>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <div className="flex gap-2 sm:gap-3">
                    <div className="text-amber-600 flex-shrink-0">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="text-xs sm:text-sm text-amber-800">
                        <p className="font-medium mb-1">ข้อมูลสำคัญ</p>
                        <p>
                            ยอดเงินถูกตั้งค่าไว้ใน QR Code แล้ว คุณไม่ต้องกรอกยอดเองใน Mobile Banking
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptPayQR;
