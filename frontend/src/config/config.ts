export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
  apiUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api`,
  uploadsUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/uploads`,
};

// Helper function
export const getImageUrl = (path: string): string => {
  if (!path) return '';
  
  // ถ้ามี http:// หรือ https:// อยู่แล้ว ให้คืนค่าเลย
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // ถ้าไม่มี / ข้างหน้า ให้เพิ่มให้
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${config.apiBaseUrl}${cleanPath}`;
};