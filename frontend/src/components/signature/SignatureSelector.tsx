import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';
import { signatureTemplateApi } from '../../services/signatureTemplateApi';
import type { SignatureTemplate } from '../../services/signatureTemplateApi';
import SignaturePad from '../common/SignaturePad';

interface SignatureSelectorProps {
    onSelect: (signatureUrl: string, templateId?: number) => void;
    onCancel: () => void;
    title: string;
    signerName: string;
    onSignerNameChange: (name: string) => void;
}

const SignatureSelector = ({
    onSelect,
    onCancel,
    title,
    signerName,
    onSignerNameChange,
}: SignatureSelectorProps) => {
    const [templates, setTemplates] = useState<SignatureTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<SignatureTemplate | null>(null);
    const [showNewSignature, setShowNewSignature] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'existing' | 'new'>('existing');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await signatureTemplateApi.getAll();
            const templateList = response.data.data;
            setTemplates(templateList);

            // Auto-select default template
            const defaultTemplate = templateList.find((t: SignatureTemplate) => t.isDefault);
            if (defaultTemplate) {
                setSelectedTemplate(defaultTemplate);
            }

            // If no templates, switch to new signature tab
            if (templateList.length === 0) {
                setTab('new');
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด!',
                text: 'ไม่สามารถโหลดเทมเพลตลายเซ็นได้',
                confirmButtonText: 'ตกลง',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplate = () => {
        if (!selectedTemplate) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาเลือกลายเซ็น',
                confirmButtonText: 'ตกลง',
            });
            return;
        }
        if (!signerName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณากรอกชื่อผู้เซ็น',
                confirmButtonText: 'ตกลง',
            });
            return;
        }
        onSelect(selectedTemplate.signatureUrl, selectedTemplate.id);
    };

    const handleSaveNewSignature = async (
        signatureData: string,
        saveAsTemplate?: boolean,
        templateName?: string,
        setAsDefault?: boolean
    ) => {
        try {
            if (saveAsTemplate && templateName) {
                // Save as template
                await signatureTemplateApi.create({
                    name: templateName,
                    signatureData,
                    isDefault: setAsDefault,
                });
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ!',
                    text: 'บันทึกลายเซ็นเป็นเทมเพลตเรียบร้อย',
                    confirmButtonText: 'ตกลง',
                    timer: 2000,
                });
            }

            // Use the signature
            onSelect(signatureData);
        } catch (error) {
            console.error('Error saving template:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด!',
                text: 'เกิดข้อผิดพลาดในการบันทึกเทมเพลต',
                confirmButtonText: 'ตกลง',
            });
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    if (showNewSignature) {
        return (
            <SignaturePad
                title={title}
                signerName={signerName}
                onSignerNameChange={onSignerNameChange}
                onSave={handleSaveNewSignature}
                onCancel={() => setShowNewSignature(false)}
                showTemplateOption={true}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Signer Name Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ชื่อผู้เซ็น
                        </label>
                        <input
                            type="text"
                            value={signerName}
                            onChange={(e) => onSignerNameChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="กรอกชื่อผู้เซ็น"
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b">
                        <button
                            onClick={() => setTab('existing')}
                            className={`px-4 py-2 font-medium transition-colors ${tab === 'existing'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            disabled={templates.length === 0}
                        >
                            ใช้ลายเซ็นเดิม {templates.length > 0 && `(${templates.length})`}
                        </button>
                        <button
                            onClick={() => setTab('new')}
                            className={`px-4 py-2 font-medium transition-colors ${tab === 'new'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            เซ็นใหม่
                        </button>
                    </div>

                    {/* Existing Templates Tab */}
                    {tab === 'existing' && (
                        <div>
                            {templates.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 mb-4">ยังไม่มีเทมเพลตลายเซ็น</p>
                                    <button
                                        onClick={() => setTab('new')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        สร้างลายเซ็นใหม่
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            onClick={() => setSelectedTemplate(template)}
                                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {template.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">
                                                        สร้างเมื่อ: {new Date(template.createdAt).toLocaleDateString('th-TH')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-white border rounded p-2 flex items-center justify-center min-h-[100px]">
                                                <img
                                                    src={template.signatureUrl}
                                                    alt={template.name}
                                                    className="max-h-20 max-w-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* New Signature Tab */}
                    {tab === 'new' && (
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">คุณจะได้เซ็นลายเซ็นใหม่</p>
                            <button
                                onClick={() => setShowNewSignature(true)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                เปิด Signature Pad
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    {tab === 'existing' && templates.length > 0 && (
                        <button
                            onClick={handleSelectTemplate}
                            disabled={!selectedTemplate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            ใช้ลายเซ็นนี้
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignatureSelector;
