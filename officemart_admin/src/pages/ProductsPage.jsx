// ProductsPage.jsx – Trang danh sách sản phẩm (Hoàn thiện Mục 4.1, 4.2 và 4.3)
//
// Tính năng:
//   - Tải danh sách qua custom hook useProductSearch (xử lý race condition, AbortController)
//   - Tìm kiếm theo tên hoặc SKU (debounce đúng 400ms, gửi qua param q)
//   - Lọc theo danh mục (category-filter lấy từ GET /api/categories)
//   - Lọc theo trạng thái (status-filter: Tất cả, Đang bán, Ngừng bán)
//   - Phân trang (10 sản phẩm/trang, page-prev, page-next, page-current hiển thị dạng "1 / 12")
//   - Đồng bộ 2 chiều với URL thông qua useSearchParams (hỗ trợ mở trực tiếp, back/forward)
//   - Đổi bộ lọc hoặc từ khoá tự động về trang 1
//   - Xoá sản phẩm với ConfirmDialog tự xây dựng

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosClient.js';
import useProductSearch from '../hooks/useProductSearch.js';
import ProductTable from '../components/ProductTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProductsPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- 1. Đọc và chuẩn hoá các tham số từ URL ----
  const qFromUrl = searchParams.get('q') || '';
  const categoryFromUrl = searchParams.get('category') || '';
  const statusFromUrl = searchParams.get('status') || '';

  // Xử lý trường hợp biên của page (page <= 0 hoặc chuỗi không hợp lệ thì về 1)
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const pageFromUrl = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  // State cục bộ cho ô input tìm kiếm (để người dùng gõ phím mượt mà không bị giật)
  const [searchTerm, setSearchTerm] = useState(qFromUrl);

  // Danh sách categories lấy từ API
  const [categories, setCategories] = useState([]);

  // State quản lý sản phẩm cần xoá trong modal
  const [deletingProduct, setDeletingProduct] = useState(null);

  // ---- 2. Tải danh sách danh mục khi mount ----
  useEffect(() => {
    let isMounted = true;
    api
      .get('/categories')
      .then((res) => {
        if (isMounted) setCategories(res.data || []);
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // ---- 3. Đồng bộ input tìm kiếm khi URL thay đổi (hỗ trợ nút Back / Forward trình duyệt) ----
  useEffect(() => {
    setSearchTerm(qFromUrl);
  }, [qFromUrl]);

  // ---- 4. Debounce tìm kiếm đúng 400ms ----
  useEffect(() => {
    // Nếu giá trị ô nhập trùng khớp với URL thì không cần làm gì
    if (searchTerm === qFromUrl) return;

    // Chờ 400ms sau lần gõ phím cuối cùng mới cập nhật URL
    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      const trimmed = searchTerm.trim();

      if (trimmed) {
        nextParams.set('q', trimmed);
      } else {
        nextParams.delete('q');
      }

      // Đổi từ khoá tìm kiếm thì luôn quay về trang 1
      nextParams.set('page', '1');
      setSearchParams(nextParams);
    }, 400);

    // Dọn dẹp timer nếu người dùng gõ tiếp trước khi hết 400ms
    return () => clearTimeout(timer);
  }, [searchTerm, qFromUrl, searchParams, setSearchParams]);

  // ---- 5. Gọi custom hook tải danh sách sản phẩm ----
  const queryParams = useMemo(
    () => ({
      q: qFromUrl,
      category: categoryFromUrl,
      status: statusFromUrl,
      page: pageFromUrl,
      limit: 10,
    }),
    [qFromUrl, categoryFromUrl, statusFromUrl, pageFromUrl],
  );

  const {
    products,
    total,
    loading,
    error,
    refetch,
    setData: setProducts,
  } = useProductSearch(queryParams);

  // Tính tổng số trang (ít nhất là 1 trang)
  const totalPages = Math.max(1, Math.ceil(total / 10));

  // ---- 6. Xử lý thay đổi bộ lọc danh mục ----
  function handleCategoryChange(e) {
    const val = e.target.value;
    const nextParams = new URLSearchParams(searchParams);
    if (val) {
      nextParams.set('category', val);
    } else {
      nextParams.delete('category');
    }
    // Thay đổi bộ lọc thì về trang 1
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  }

  // ---- 7. Xử lý thay đổi bộ lọc trạng thái ----
  function handleStatusChange(e) {
    const val = e.target.value;
    const nextParams = new URLSearchParams(searchParams);
    if (val) {
      nextParams.set('status', val);
    } else {
      nextParams.delete('status');
    }
    // Thay đổi bộ lọc thì về trang 1
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  }

  // ---- 8. Xử lý chuyển trang ----
  function handlePrevPage() {
    if (pageFromUrl > 1) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('page', String(pageFromUrl - 1));
      setSearchParams(nextParams);
    }
  }

  function handleNextPage() {
    if (pageFromUrl < totalPages) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('page', String(pageFromUrl + 1));
      setSearchParams(nextParams);
    }
  }

  // ---- 9. Xử lý xoá sản phẩm ----
  function handleDeleteClick(product) {
    setDeletingProduct(product);
  }

  function handleCancelDelete() {
    setDeletingProduct(null);
  }

  async function handleConfirmDelete() {
    if (!deletingProduct) return;
    const id = deletingProduct.id;
    setDeletingProduct(null);

    try {
      await api.delete(`/products/${id}`);
      // Cập nhật state danh sách ngay lập tức và gọi refetch để cập nhật total
      setProducts((prev) => prev.filter((p) => p.id !== id));
      refetch();
      showToast('Đã xoá sản phẩm thành công', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Xoá sản phẩm thất bại.';
      showToast(msg, 'error');
    }
  }

  // ---- 10. Render giao diện ----
  return (
    <>
      <div className="page-heading">
        <h1>Sản phẩm</h1>
        <button
          id="add-button"
          className="btn btn-primary"
          onClick={() => navigate('/products/new')}
        >
          Thêm sản phẩm
        </button>
      </div>

      {/* Thanh tìm kiếm và bộ lọc (Mục 4.3.1) */}
      <div className="filter-bar">
        {/* Tìm kiếm tên hoặc SKU */}
        <div className="search-wrapper">
          <input
            id="search-input"
            className="search-input"
            type="text"
            placeholder="Tìm theo tên hoặc SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Lọc danh mục */}
        <div className="filter-group">
          <label htmlFor="category-filter" style={{ fontSize: '0.88rem' }}>
            Danh mục:
          </label>
          <select
            id="category-filter"
            className="category-filter"
            value={categoryFromUrl}
            onChange={handleCategoryChange}
          >
            <option value="">Tất cả</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc trạng thái */}
        <div className="filter-group">
          <label htmlFor="status-filter" style={{ fontSize: '0.88rem' }}>
            Trạng thái:
          </label>
          <select
            id="status-filter"
            className="status-filter"
            value={statusFromUrl}
            onChange={handleStatusChange}
          >
            <option value="">Tất cả</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && <div className="loading-state">Đang tải dữ liệu...</div>}

      {/* Error state */}
      {!loading && error && (
        <div className="error-message">
          <p>{error}</p>
          <button
            id="retry-button"
            className="btn btn-retry"
            onClick={refetch}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <p>Không tìm thấy sản phẩm nào phù hợp.</p>
        </div>
      )}

      {/* Bảng sản phẩm */}
      {!loading && !error && products.length > 0 && (
        <>
          <ProductTable products={products} onDelete={handleDeleteClick} />

          {/* Phân trang (Mục 4.3.2) */}
          <div className="pagination-wrapper">
            <div style={{ fontSize: '0.88rem', color: '#6b7280' }}>
              Tổng số sản phẩm: <strong>{total}</strong>
            </div>
            <div className="pagination-controls">
              <button
                id="page-prev"
                className="btn btn-secondary btn-sm"
                onClick={handlePrevPage}
                disabled={pageFromUrl <= 1 || loading}
              >
                ← Trang trước
              </button>

              <span id="page-current" className="page-current">
                {pageFromUrl} / {totalPages}
              </span>

              <button
                id="page-next"
                className="btn btn-secondary btn-sm"
                onClick={handleNextPage}
                disabled={pageFromUrl >= totalPages || loading}
              >
                Trang sau →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Hộp thoại xác nhận xoá */}
      {deletingProduct && (
        <ConfirmDialog
          product={deletingProduct}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
}
