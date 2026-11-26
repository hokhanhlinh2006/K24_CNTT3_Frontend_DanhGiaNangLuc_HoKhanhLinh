// ProductFormPage.jsx – Form thêm / sửa sản phẩm (Mục 4.2.2, 4.2.3, 4.2.4)
//
// Luồng hoạt động:
//   - Thêm mới: URL = /products/new    → không có param id → gọi POST
//   - Sửa:      URL = /products/:id/edit → có param id    → gọi GET rồi PUT

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axiosClient.js';
import { useToast } from '../context/ToastContext.jsx';

// Regex kiểm tra định dạng SKU: 3 chữ hoa - 4 chữ số. Ví dụ: KEY-0001
const SKU_REGEX = /^[A-Z]{3}-[0-9]{4}$/;

// Giá trị khởi tạo cho form trống
const EMPTY_FORM = {
  name: '',
  sku: '',
  category: '',
  price: '',
  stock: '',
  status: 'active', // Mặc định: Đang bán
};

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // id tồn tại khi đang sửa, undefined khi thêm mới
  const showToast = useToast();
  const isEdit = Boolean(id); // true = đang sửa, false = đang thêm

  // ---- State form ----
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});         // lỗi từng trường
  const [submitting, setSubmitting] = useState(false); // đang gửi → disable nút

  // ---- State cho dữ liệu phụ ----
  const [categories, setCategories] = useState([]);  // danh sách danh mục từ API
  const [loadingProduct, setLoadingProduct] = useState(false); // đang tải sản phẩm để sửa
  const [loadError, setLoadError] = useState('');    // lỗi khi tải sản phẩm

  // ---- Tải danh mục khi component mount ----
  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([])); // nếu lỗi, để trống
  }, []);

  // ---- Nếu đang sửa, tải thông tin sản phẩm ----
  useEffect(() => {
    if (!isEdit) return; // Thêm mới thì bỏ qua

    setLoadingProduct(true);
    api.get(`/products/${id}`)
      .then((res) => {
        const p = res.data;
        // Điền dữ liệu vào form
        setFormData({
          name: p.name,
          sku: p.sku,
          category: p.category,
          price: String(p.price),
          stock: String(p.stock),
          status: p.status,
        });
      })
      .catch((err) => {
        const msg =
          err.response?.status === 404
            ? 'Không tìm thấy sản phẩm'
            : err.response?.data?.message || 'Không thể tải sản phẩm';
        setLoadError(msg);
      })
      .finally(() => setLoadingProduct(false));
  }, [id, isEdit]);

  // ---- Hàm cập nhật một trường form ----
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Xoá lỗi của trường vừa sửa
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  // ---- Hàm validate toàn bộ form ----
  // Trả về object lỗi (trống = không có lỗi)
  function validate(data) {
    const errs = {};

    // name: bắt buộc, 3-100 ký tự (sau khi trim)
    const name = data.name.trim();
    if (!name) {
      errs.name = 'Tên sản phẩm là bắt buộc';
    } else if (name.length < 3) {
      errs.name = 'Tên sản phẩm phải có ít nhất 3 ký tự';
    } else if (name.length > 100) {
      errs.name = 'Tên sản phẩm không được vượt quá 100 ký tự';
    }

    // sku: bắt buộc, đúng dạng ABC-1234
    if (!data.sku) {
      errs.sku = 'SKU là bắt buộc';
    } else if (!SKU_REGEX.test(data.sku)) {
      errs.sku = 'SKU phải có dạng ABC-1234 (3 chữ hoa - 4 chữ số)';
    }

    // category: bắt buộc chọn
    if (!data.category) {
      errs.category = 'Vui lòng chọn danh mục';
    }

    // price: là số lớn hơn 0
    const price = Number(data.price);
    if (data.price === '' || isNaN(price) || price <= 0) {
      errs.price = 'Giá phải là số lớn hơn 0';
    }

    // stock: là số nguyên không âm
    const stock = Number(data.stock);
    if (
      data.stock === '' ||
      isNaN(stock) ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      errs.stock = 'Tồn kho phải là số nguyên không âm';
    }

    return errs;
  }

  // ---- Xử lý submit form ----
  async function handleSubmit(e) {
    e.preventDefault();

    // Validate trước khi gửi
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return; // Dừng lại, không gọi API
    }

    // Chống gửi nhiều lần liên tiếp
    if (submitting) return;
    setSubmitting(true);

    // Chuẩn bị payload gửi đi
    const payload = {
      name: formData.name.trim(),
      sku: formData.sku,
      category: formData.category,
      price: Number(formData.price),
      stock: Number(formData.stock),
      status: formData.status,
    };

    try {
      if (isEdit) {
        // PUT /api/products/:id
        await api.put(`/products/${id}`, payload);
        showToast('Đã cập nhật sản phẩm', 'success');
      } else {
        // POST /api/products
        await api.post('/products', payload);
        showToast('Đã thêm sản phẩm', 'success');
      }
      navigate('/products');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 409 && data?.field === 'sku') {
        // SKU bị trùng → hiển thị lỗi tại trường sku, giữ nguyên dữ liệu đã nhập
        setErrors((prev) => ({ ...prev, sku: data.message }));
      } else if (status === 404) {
        setLoadError('Không tìm thấy sản phẩm');
      } else {
        // Lỗi chung khác
        setErrors((prev) => ({
          ...prev,
          _general: data?.message || 'Có lỗi xảy ra, vui lòng thử lại.',
        }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Render: đang tải sản phẩm để sửa ----
  if (loadingProduct) {
    return (
      <div className="loading-state">Đang tải thông tin sản phẩm...</div>
    );
  }

  // ---- Render: lỗi khi tải sản phẩm ----
  if (loadError) {
    return (
      <div>
        <Link to="/products" className="back-link">← Quay lại</Link>
        <div className="error-message">
          <p>{loadError}</p>
        </div>
      </div>
    );
  }

  // ---- Render: form ----
  return (
    <>
      <Link to="/products" className="back-link">← Quay lại danh sách</Link>

      <h1 style={{ marginBottom: '20px' }}>
        {isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
      </h1>

      <div className="form-card">
        {/* Lỗi chung (không thuộc trường nào) */}
        {errors._general && (
          <div className="error-message" style={{ marginBottom: '16px' }}>
            {errors._general}
          </div>
        )}

        <form id="product-form" onSubmit={handleSubmit} noValidate>

          {/* Trường: Tên sản phẩm */}
          <div className="form-group">
            <label htmlFor="name">Tên sản phẩm <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'input-error' : ''}
              placeholder="Ví dụ: Bàn phím cơ K87"
              autoComplete="off"
            />
            {errors.name && (
              <span id="field-error-name" className="field-error">{errors.name}</span>
            )}
          </div>

          {/* Trường: SKU */}
          <div className="form-group">
            <label htmlFor="sku">SKU <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              id="sku"
              name="sku"
              type="text"
              value={formData.sku}
              onChange={handleChange}
              className={errors.sku ? 'input-error' : ''}
              placeholder="Ví dụ: KEY-0001"
              autoComplete="off"
            />
            {errors.sku && (
              <span id="field-error-sku" className="field-error">{errors.sku}</span>
            )}
          </div>

          {/* Trường: Danh mục */}
          <div className="form-group">
            <label htmlFor="category">Danh mục <span style={{ color: '#dc2626' }}>*</span></label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? 'input-error' : ''}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <span id="field-error-category" className="field-error">{errors.category}</span>
            )}
          </div>

          {/* Trường: Giá */}
          <div className="form-group">
            <label htmlFor="price">Giá (₫) <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              id="price"
              name="price"
              type="number"
              min="1"
              value={formData.price}
              onChange={handleChange}
              className={errors.price ? 'input-error' : ''}
              placeholder="Ví dụ: 1290000"
            />
            {errors.price && (
              <span id="field-error-price" className="field-error">{errors.price}</span>
            )}
          </div>

          {/* Trường: Tồn kho */}
          <div className="form-group">
            <label htmlFor="stock">Tồn kho <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={formData.stock}
              onChange={handleChange}
              className={errors.stock ? 'input-error' : ''}
              placeholder="Ví dụ: 10"
            />
            {errors.stock && (
              <span id="field-error-stock" className="field-error">{errors.stock}</span>
            )}
          </div>

          {/* Trường: Trạng thái */}
          <div className="form-group">
            <label htmlFor="status">Trạng thái</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>

          {/* Nút hành động */}
          <div className="form-actions">
            <button
              type="submit"
              id="submit-button"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Lưu sản phẩm'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/products')}
            >
              Huỷ
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
