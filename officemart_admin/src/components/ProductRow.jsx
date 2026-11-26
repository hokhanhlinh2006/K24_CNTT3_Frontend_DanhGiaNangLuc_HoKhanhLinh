// ProductRow.jsx – Hiển thị một dòng sản phẩm trong bảng
// Nhận prop: product (object)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryNames } from '../data/sample.js';

// --- Hàm định dạng tiền Việt Nam ---
function formatPrice(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

// --- Component chính ---
export default function ProductRow({ product, onDelete }) {
  const navigate = useNavigate();

  // Xác định class và text cho trạng thái
  const statusClass =
    product.status === 'active' ? 'status-badge status-active' : 'status-badge status-inactive';
  const statusText = product.status === 'active' ? 'Đang bán' : 'Ngừng bán';

  // Xác định hiển thị tồn kho
  const stockDisplay =
    product.stock === 0 ? (
      <span className="stock-zero">Hết hàng</span>
    ) : (
      product.stock
    );

  // Lấy tên danh mục từ categoryNames (fallback về id nếu không có)
  const categoryDisplay = categoryNames[product.category] || product.category;

  return (
    <tr data-testid="product-row">
      {/* Tên */}
      <td data-label="Tên">{product.name}</td>

      {/* SKU */}
      <td data-label="SKU">{product.sku}</td>

      {/* Danh mục */}
      <td data-label="Danh mục">{categoryDisplay}</td>

      {/* Giá – định dạng Việt Nam */}
      <td data-label="Giá">{formatPrice(product.price)}</td>

      {/* Tồn kho */}
      <td data-label="Tồn kho">{stockDisplay}</td>

      {/* Trạng thái */}
      <td data-label="Trạng thái">
        <span className={statusClass} data-testid="product-status">
          {statusText}
        </span>
      </td>

      {/* Thao tác */}
      <td data-label="Thao tác" className="action-cell">
        <button
          id="edit-button"
          className="btn btn-sm btn-edit"
          onClick={() => navigate(`/products/${product.id}/edit`)}
        >
          Sửa
        </button>
        <button
          id="delete-button"
          className="btn btn-sm btn-delete"
          onClick={() => onDelete(product)}
        >
          Xoá
        </button>
      </td>
    </tr>
  );
}
