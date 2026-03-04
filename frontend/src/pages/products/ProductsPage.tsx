import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { productApi } from '../../services/api';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { showSuccess, showError, showDeleteConfirm } from '../../utils/alert';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'ชิ้น'
  });

  // ดึงข้อมูลสินค้า
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAll();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('ไม่สามารถดึงข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // เปิด Modal สำหรับเพิ่ม/แก้ไข
  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        unit: product.unit
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        unit: 'ชิ้น'
      });
    }
    setShowModal(true);
  };

  // บันทึกสินค้า
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingProduct) {
        await productApi.update(editingProduct.id, formData);
        showSuccess('แก้ไขสินค้าสำเร็จ');
      } else {
        await productApi.create(formData);
        showSuccess('เพิ่มสินค้าสำเร็จ');
      }

      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      showError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  };

  // เปิด Delete Dialog
  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteDialog(true);
  };

  // ลบสินค้า
  const handleDelete = async () => {
    if (!deletingProduct) return;

    const confirmed = await showDeleteConfirm(deletingProduct.name);
    if (!confirmed) return;

    try {
      await productApi.delete(deletingProduct.id);
      showSuccess('ลบสินค้าสำเร็จ');
      setShowDeleteDialog(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('ไม่สามารถลบสินค้าได้');
    }
  };

  // กรองสินค้า
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="จัดการสินค้า"
        description={`ทั้งหมด ${products.length} รายการ`}
        action={
          <Button icon={Plus} onClick={() => openModal()}>
            เพิ่มสินค้า
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">สินค้าทั้งหมด</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">สินค้าที่ใช้งาน</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {products.filter(p => p.isActive).length}
            </p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าเฉลี่ย</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {products.length > 0
                ? Math.round(products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length).toLocaleString()
                : 0}
            </p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">มูลค่ารวม</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {products.reduce((sum, p) => sum + parseFloat(p.price), 0).toLocaleString()}
            </p>
          </div>
        </Card>
      </div>


      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อสินค้า</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายละเอียด</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ราคา</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">หน่วย</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {product.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      ฿{parseFloat(product.price).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(product)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(product)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              ไม่พบสินค้า
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
        description="กรอกข้อมูลสินค้าหรือบริการ"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ชื่อสินค้า */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อสินค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รายละเอียด
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ราคา */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ราคา <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* หน่วย */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หน่วย
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ชิ้น">ชิ้น</option>
              <option value="เครื่อง">เครื่อง</option>
              <option value="งาน">งาน</option>
              <option value="เมตร">เมตร</option>
              <option value="กิโลกรัม">กิโลกรัม</option>
              <option value="ลิตร">ลิตร</option>
              <option value="ตัว">ตัว</option>
              <option value="จุด">จุด</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
              className="flex-1"
            >
              บันทึก
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleDelete}
        title="ยืนยันการลบ"
        message={`คุณแน่ใจหรือไม่ที่จะลบสินค้า "${deletingProduct?.name}"?`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        type="danger"
      />
    </div>
  );
};

export default ProductsPage;