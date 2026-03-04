import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Save, X, Camera, Image as ImageIcon } from "lucide-react";
import { quotationApi, customerApi, productApi } from "../../services/api";
import SignatureSelector from "../../components/signature/SignatureSelector";
import { showSuccess, showError, showWarning } from "../../utils/alert";

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
  // const [images, setImages] = useState<any[]>([]); // ใช้ state นี้สำหรับการแนบรูปทั่วไป (ถ้ายังต้องการ)
  const [loading, setLoading] = useState(false);

  // --- [State ใหม่สำหรับฟีเจอร์งานบริการ] ---
  const [siteImage, setSiteImage] = useState<string>(''); // รูปหน้างาน (Before)
  const [signature, setSignature] = useState<string>(''); // ลายเซ็นร้าน
  const [signerName, setSignerName] = useState<string>(''); // ชื่อผู้เซ็น (ร้าน)
  const [showSignatureSelector, setShowSignatureSelector] = useState(false); // แสดง modal เลือกลายเซ็น
  // ------------------------------------

  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    discount: 0,
    vat: 7,
    notes: "",
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
      console.error("Error fetching customers:", error);
      showError("ไม่สามารถโหลดข้อมูลลูกค้าได้");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productApi.getAll();
      setProducts(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      showError("ไม่สามารถโหลดข้อมูลสินค้าได้");
    }
  };

  // --- [ฟังก์ชันจัดการรูปภาพหน้างาน] ---
  const handleSiteImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showWarning("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSiteImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  // ---------------------------------

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === parseInt(customerId));
    if (customer) {
      setFormData({
        ...formData,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email || "",
        customerPhone: customer.phone || "",
        customerAddress: customer.address || "",
      });
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: 0,
        productName: "",
        description: "",
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    showSuccess("ลบรายการสินค้าแล้ว");
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];

    if (field === "productId") {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productName: product.name,
          description: product.description || "",
          price: parseFloat(product.price),
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - formData.discount;
    const vatAmount = (afterDiscount * formData.vat) / 100;
    return afterDiscount + vatAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      showWarning("กรุณากรอกชื่อลูกค้า");
      return;
    }

    if (items.length === 0) {
      showWarning("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    const hasInvalidItem = items.some(
      (item) => !item.productId || item.productId === 0
    );
    if (hasInvalidItem) {
      showWarning("กรุณาเลือกสินค้าให้ครบทุกรายการ");
      return;
    }

    // --- Validation ลายเซ็น ---
    if (signature && !signerName.trim()) {
      showWarning("กรุณากรอกชื่อผู้เซ็นของร้าน");
      return;
    }

    try {
      setLoading(true);

      const data = {
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerAddress: formData.customerAddress.trim(),
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
        })),
        discount: formData.discount,
        vat: formData.vat,
        notes: formData.notes.trim(),

        // --- [ส่งข้อมูลใหม่ไป Backend] ---
        siteImages: siteImage,
        shopSignature: signature, // เปลี่ยนเป็น shop signature
        signerName: signerName.trim(), // ชื่อผู้เซ็น (ร้าน)
        // -----------------------------
      };

      await quotationApi.create(data);
      showSuccess("สร้างใบเสนอราคาสำเร็จ");
      navigate("/quotations");
    } catch (error: any) {
      console.error("Error creating quotation:", error);
      const errorMessage =
        error.response?.data?.message ||
        "เกิดข้อผิดพลาดในการสร้างใบเสนอราคา";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/quotations")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              สร้างใบเสนอราคาใหม่
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              กรอกข้อมูลและเพิ่มรายการสินค้า
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded"></div>
            ข้อมูลลูกค้า
          </h2>
          {/* ... (คงเดิม: Customer inputs) ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกลูกค้า (ถ้ามี)
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">-- เลือกลูกค้า --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อลูกค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="ระบุชื่อลูกค้า"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล (สำหรับส่งใบเสนอราคา)
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) =>
                  setFormData({ ...formData, customerEmail: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, customerPhone: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0X-XXXX-XXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ที่อยู่
              </label>
              <input
                type="text"
                value={formData.customerAddress}
                onChange={(e) =>
                  setFormData({ ...formData, customerAddress: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="ที่อยู่ลูกค้า"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              รายการสินค้า
              {items.length > 0 && (
                <span className="text-sm font-normal text-gray-500">
                  ({items.length} รายการ)
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการ</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                  {/* ... (คงเดิม: Item Inputs) ... */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      สินค้า <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(index, "productId", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">-- เลือกสินค้า --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (฿
                          {parseFloat(product.price).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      จำนวน
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      ราคา/หน่วย
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", parseFloat(e.target.value))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      ยอดรวม
                    </label>
                    <div className="px-3 py-2 bg-blue-50 text-blue-900 rounded-lg font-semibold text-sm border border-blue-200">
                      ฿{(item.quantity * item.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start mt-6"
                  title="ลบรายการ"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-gray-400 mb-2">
                  <Plus className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-3">ยังไม่มีรายการสินค้า</p>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  + เพิ่มรายการสินค้าแรก
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- [NEW] Section: งานบริการ (รูป + ลายเซ็น) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. อัปโหลดรูปหน้างาน */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              รูปภาพหน้างาน (Before)
            </h3>

            <div className="space-y-4">
              {siteImage ? (
                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={siteImage} alt="Site" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-start justify-end p-2">
                    <button
                      type="button"
                      onClick={() => setSiteImage('')}
                      className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="block w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                  <ImageIcon className="w-10 h-10 text-gray-400 mb-3" />
                  <span className="text-sm text-gray-600 font-medium">คลิกเพื่ออัปโหลดรูปภาพ</span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG (Max 5MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleSiteImageUpload} />
                </label>
              )}
              <p className="text-xs text-gray-500 mt-2">
                * ใช้เพื่ออ้างอิงสภาพหน้างานก่อนเริ่มดำเนินการ (Optional)
              </p>
            </div>
          </div>

          {/* 2. ลายเซ็นร้าน (ผู้เสนอราคา) */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-600 rounded"></div>
              ลายเซ็นผู้เสนอราคา (ร้าน)
            </h3>

            {signature ? (
              <div className="flex-1 flex flex-col">
                <div className="border border-gray-300 rounded-lg p-4 bg-white flex-1 flex items-center justify-center mb-3">
                  <img src={signature} alt="ลายเซ็น" className="max-h-32" />
                </div>
                <div className="text-center mb-3">
                  <p className="font-semibold text-gray-900">{signerName}</p>
                  <p className="text-sm text-gray-600">ผู้เสนอราคา</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSignature('');
                    setSignerName('');
                  }}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  เซ็นใหม่
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowSignatureSelector(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  เลือกลายเซ็น
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-3">
              * ลายเซ็นของผู้เสนอราคา/ตัวแทนร้าน (Optional)
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded"></div>
            สรุปยอด
          </h2>
          {/* ... (คงเดิม: Summary Calculation) ... */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ส่วนลด (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VAT (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.vat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vat: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="7"
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>ยอดรวม</span>
                <span className="font-semibold text-gray-900">
                  ฿{calculateSubtotal().toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>ส่วนลด</span>
                <span className="font-semibold text-red-600">
                  -฿{formData.discount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT {formData.vat}%</span>
                <span className="font-semibold text-gray-900">
                  ฿
                  {(
                    ((calculateSubtotal() - formData.discount) * formData.vat) /
                    100
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span className="text-gray-900">ยอดรวมสุทธิ</span>
                <span className="text-blue-600">
                  ฿{calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="เงื่อนไขการชำระเงิน, ระยะเวลาส่งมอบ, ฯลฯ"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/quotations")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
              <span>ยกเลิก</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? "กำลังสร้าง..." : "สร้างใบเสนอราคา"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Signature Selector Modal */}
      {showSignatureSelector && (
        <SignatureSelector
          title="เลือกลายเซ็นผู้เสนอราคา"
          signerName={signerName}
          onSignerNameChange={setSignerName}
          onSelect={(signatureUrl) => {
            setSignature(signatureUrl);
            setShowSignatureSelector(false);
          }}
          onCancel={() => setShowSignatureSelector(false)}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              กำลังสร้างใบเสนอราคา...
            </h3>
            <p className="text-sm text-gray-600">
              กรุณารอสักครู่ ระบบกำลังสร้างเอกสารและส่งอีเมล
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuotationPage;