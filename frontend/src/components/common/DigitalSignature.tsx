import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check } from 'lucide-react';

interface Props {
    onSave: (signatureData: string) => void;
    label?: string;
}

export default function DigitalSignature({ onSave, label = "ลงลายเซ็น" }: Props) {
    const sigPad = useRef<SignatureCanvas>(null);
    const [isSigned, setIsSigned] = useState(false);

    const clear = () => {
        sigPad.current?.clear();
        setIsSigned(false);
        onSave(''); // ล้างค่า
    };

    const save = () => {
        if (sigPad.current && !sigPad.current.isEmpty()) {
            // แปลงลายเซ็นเป็นรูปภาพ (Base64 String)
            // Note: ใช้ getCanvas() แทน getTrimmedCanvas() เพื่อแก้ปัญหา TypeError: import_trim_canvas.default is not a function
            const data = sigPad.current.getCanvas().toDataURL('image/png');
            onSave(data);
            setIsSigned(true);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} <span className="text-red-500">*</span>
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden">
                <SignatureCanvas
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{
                        width: 500,
                        height: 200,
                        className: 'signature-canvas w-full h-48 cursor-crosshair'
                    }}
                    onEnd={() => save()} // บันทึกทุกครั้งที่ปล่อยเมาส์/นิ้ว
                />
            </div>

            <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400">เซ็นชื่อในกรอบสี่เหลี่ยม</p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={clear}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1"
                    >
                        <Eraser className="w-3 h-3" /> ล้าง
                    </button>

                    {isSigned && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <Check className="w-3 h-3" /> บันทึกแล้ว
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}