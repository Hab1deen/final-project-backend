import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { showWarning, showError } from '../../utils/alert';
import { uploadApi } from '../../services/api';
import { getImageUrl } from '../../config/config';

interface UploadedImage {
  url: string;
  filename: string;
  caption?: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

const ImageUpload = ({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      showWarning(`สามารถอัพโหลดได้สูงสุด ${maxImages} รูป`);
      return;
    }

    setUploading(true);

    try {
      const filesArray = Array.from(files);
      const response = await uploadApi.multiple(filesArray);

      // Backend ส่งมาเป็น relative path แล้ว
      const uploadedImages = response.data.data.map((img: any) => ({
        url: img.url, // เก็บเป็น relative path ("/uploads/...")
        filename: img.filename,
        caption: ''
      }));

      onImagesChange([...images, ...uploadedImages]);
    } catch (error) {
      console.error('Upload error:', error);
      showError('เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const image = images[index];

    try {
      await uploadApi.delete(image.filename);

      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Delete error:', error);
      showError('เกิดข้อผิดพลาดในการลบรูป');
    }
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index].caption = caption;
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">กำลังอัพโหลด...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-700 font-medium mb-2">
              ลากและวางรูปภาพที่นี่
            </p>
            <p className="text-gray-500 text-sm mb-4">หรือ</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={images.length >= maxImages}
            >
              เลือกรูปภาพ
            </button>
            <p className="text-gray-500 text-xs mt-3">
              รองรับ: JPG, PNG, GIF, WebP (สูงสุด 5MB ต่อรูป)
            </p>
            <p className="text-gray-500 text-xs">
              อัพโหลดได้สูงสุด {maxImages} รูป ({images.length}/{maxImages})
            </p>
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={getImageUrl(image.url)} // ใช้ helper function
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={image.caption || ''}
                onChange={(e) => handleCaptionChange(index, e.target.value)}
                placeholder="คำอธิบายรูป (ถ้ามี)"
                className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>ยังไม่มีรูปภาพ</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;