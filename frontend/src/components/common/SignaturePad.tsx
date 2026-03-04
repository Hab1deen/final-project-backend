import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Check, Pen, Eraser } from 'lucide-react';
import { showWarning } from '../../utils/alert';

interface SignaturePadProps {
  onSave: (
    signatureData: string,
    saveAsTemplate?: boolean,
    templateName?: string,
    setAsDefault?: boolean
  ) => void;
  onCancel: () => void;
  title: string;
  signerName: string;
  onSignerNameChange: (name: string) => void;
  showTemplateOption?: boolean;
}

const SignaturePad = ({
  onSave,
  onCancel,
  title,
  signerName,
  onSignerNameChange,
  showTemplateOption = false,
}: SignaturePadProps) => {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);

  const handleClear = () => {
    sigPadRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigPadRef.current?.isEmpty()) {
      showWarning('กรุณาเซ็นชื่อ');
      return;
    }

    if (!signerName.trim()) {
      showWarning('กรุณากรอกชื่อผู้เซ็น');
      return;
    }

    const signatureData = sigPadRef.current?.toDataURL('image/png');
    if (signatureData) {
      onSave(signatureData, saveAsTemplate, templateName, setAsDefault);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">กรุณาเซ็นชื่อในกรอบด้านล่าง</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Signer Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อผู้เซ็น *
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => onSignerNameChange(e.target.value)}
              placeholder="กรอกชื่อผู้เซ็น"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Signature Canvas */}
          <div className="relative">
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <SignatureCanvas
                ref={sigPadRef}
                canvasProps={{
                  className: 'signature-canvas w-full h-64 cursor-crosshair',
                  style: { touchAction: 'none' }
                }}
                backgroundColor="rgb(249, 250, 251)"
                penColor="#1F2937"
                minWidth={1}
                maxWidth={2.5}
                onBegin={handleBegin}
              />
            </div>

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 text-gray-300">
                <Pen className="w-8 h-8" />
                <span className="text-xl font-light">เซ็นชื่อที่นี่</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>คำแนะนำ:</strong> ใช้เมาส์หรือนิ้วลากเพื่อเซ็นชื่อ หากต้องการเซ็นใหม่ กดปุ่มลบ
            </p>
          </div>

          {/* Template Options */}
          {showTemplateOption && (
            <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  บันทึกเป็นเทมเพลต (ใช้ซ้ำได้)
                </span>
              </label>

              {saveAsTemplate && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อเทมเพลต *
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="เช่น ลายเซ็นหลัก, ลายเซ็นรอง"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setAsDefault}
                      onChange={(e) => setSetAsDefault(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      ตั้งเป็นลายเซ็นเริ่มต้น
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-300"
            disabled={isEmpty}
          >
            <Eraser className="w-4 h-4" />
            ลบ
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-300"
            >
              <X className="w-4 h-4" />
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              บันทึกลายเซ็น
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;