import { useState } from 'react';
import { Image as ImageIcon, ZoomIn } from 'lucide-react';
import { getImageUrl } from '../../config/config';
import ImageLightbox from './ImageLightbox';

interface Image {
  id: number;
  imageUrl: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: Image[];
  title?: string;
}

const ImageGallery = ({ images, title = 'รูปภาพ' }: ImageGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  // Transform images to include full URL
  const transformedImages = images.map(img => ({
    ...img,
    imageUrl: getImageUrl(img.imageUrl)
  }));

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">({images.length} รูป)</span>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {transformedImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              {/* Image */}
              <img
                src={image.imageUrl}
                alt={image.caption || `รูปที่ ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white rounded-full p-3">
                    <ZoomIn className="w-6 h-6 text-gray-800" />
                  </div>
                </div>
              </div>

              {/* Caption Badge */}
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm truncate">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          images={transformedImages}
          initialIndex={selectedImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};

export default ImageGallery;