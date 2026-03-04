import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Loader } from "lucide-react";
import Swal from 'sweetalert2';
import Button from "../common/Button";
import { uploadApi } from "../../services/api";

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (imageUrl: string) => void;
    title?: string;
    description?: string;
}

const ImageUploadModal = ({
    isOpen,
    onClose,
    onSuccess,
    title = "อัปโหลดรูปภาพ",
    description = "เลือกรูปภาพที่ต้องการอัปโหลด",
}: ImageUploadModalProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        // ตรวจสอบประเภทไฟล์
        if (!file.type.startsWith("image/")) {
            Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น', confirmButtonText: 'ตกลง' });
            return;
        }

        // ตรวจสอบขนาดไฟล์ (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({ icon: 'warning', title: 'ขนาดไฟล์ต้องไม่เกิน 5MB', confirmButtonText: 'ตกลง' });
            return;
        }

        setSelectedFile(file);

        // สร้าง preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            Swal.fire({ icon: 'warning', title: 'กรุณาเลือกรูปภาพ', confirmButtonText: 'ตกลง' });
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("image", selectedFile);

            const response = await uploadApi.uploadSingle(formData);
            const imageUrl = response.data.data.url;

            await Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'อัปโหลดรูปภาพสำเร็จ', timer: 2000 });
            onSuccess(imageUrl);
            handleClose();
        } catch (error: any) {
            console.error("Error uploading image:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด!',
                text: error.response?.data?.message || "ไม่สามารถอัปโหลดรูปภาพได้",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreview(null);
        setLoading(false);
        setIsDragging(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500 mt-1">{description}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Upload Area */}
                    {!preview ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-all duration-200
                ${isDragging
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                                }
              `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleInputChange}
                                className="hidden"
                            />

                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className={`
                  p-4 rounded-full transition-colors
                  ${isDragging
                                            ? "bg-blue-100"
                                            : "bg-gray-100 group-hover:bg-blue-50"
                                        }
                `}
                                >
                                    <Upload
                                        className={`w-8 h-8 ${isDragging ? "text-blue-600" : "text-gray-400"
                                            }`}
                                    />
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                        {isDragging
                                            ? "วางไฟล์ที่นี่"
                                            : "คลิกหรือลากไฟล์มาวางที่นี่"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        รองรับ PNG, JPG, GIF (สูงสุด 5MB)
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Preview Area
                        <div className="space-y-4">
                            <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-64 object-contain"
                                />
                                {!loading && (
                                    <button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setPreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {selectedFile && (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                        disabled={loading}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleUpload}
                        className="flex-1"
                        disabled={!selectedFile || loading}
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                กำลังอัปโหลด...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                อัปโหลด
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ImageUploadModal;
