import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { quotationApi, customerApi, productApi } from '../../services/api';

interface QuotationItem {
  productId: number;
  productName: string;
  description: string;
  quantity: number;
  price: number;
}

const CreateQuotationPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    discount: 0,
    vat: 7,
    notes: ''
  });

  const [items, setItems] = useState<QuotationItem[]>([]);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerApi.getAll();
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productApi.getAll();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    if (customer) {
      setFormData({
        ...formData,
        customerId,
        customerName: customer.name,
        customerPhone: customer.phone || '',
        customerAddress: customer.address || ''
      });
    }
  };

  const addItem = () => {
    setItems([...items, {
      productId: 0,
      productName: '',
      description: '',
      quantity: 1,
      price: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productName: product.name,
          description: product.description || '',
          price: parseFloat(product.price)
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - formData.discount;
    const vatAmount = (afterDiscount * formData.vat) / 100;
    return afterDiscount + vatAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    try {
      await quotationApi.create({
        ...formData,
        customerId: formData.customerId || null,
        items
      });
      
      alert('สร้างใบเสนอราคาสำเร็จ');
      navigate('/quotations');
    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('เกิดข้อผิดพลาดในการสร้างใบเสนอราคา');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/quotations')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สร้างใบเสนอราคาใหม่</h1>
          <p className="text-gray-600">กรอกข้อมูลและเพิ่มรายการสินค้า</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลลูกค้า</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลือกลูกค้า (ถ้ามี)
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- เลือกลูกค้า --</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อลูกค้า *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ที่อยู่
              </label>
              <input
                type="text"
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">รายการสินค้า</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายการ
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      สินค้า
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="0">-- เลือกสินค้า --</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} (฿{parseFloat(product.price).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวน
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ราคา/หน่วย
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ยอดรวม
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-lg font-semibold text-gray-900">
                      ฿{(item.quantity * item.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีรายการสินค้า กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้น
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">สรุปยอด</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ส่วนลด (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.vat}
                  onChange={(e) => setFormData({ ...formData, vat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>ยอดรวม</span>
                <span className="font-semibold">฿{calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ส่วนลด</span>
                <span className="font-semibold">-฿{formData.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT {formData.vat}%</span>
                <span className="font-semibold">฿{(((calculateSubtotal() - formData.discount) * formData.vat) / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>ยอดรวมสุทธิ</span>
                <span className="text-blue-600">฿{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="เงื่อนไขการชำระเงิน, ระยะเวลาส่งมอบ, ฯลฯ"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            บันทึกใบเสนอราคา
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuotationPage;