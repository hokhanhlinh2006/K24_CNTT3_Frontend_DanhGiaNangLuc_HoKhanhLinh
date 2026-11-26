// ConfirmDialog.jsx – Hộp thoại xác nhận xoá sản phẩm
// Tự xây dựng, KHÔNG dùng window.confirm hoặc alert
// Props: product (object), onConfirm, onCancel
import React from 'react';

export default function ConfirmDialog({ product, onConfirm, onCancel }) {
  return (
    // Overlay nền mờ bọc ngoài
    <div className="dialog-overlay" data-testid="confirm-dialog">
      <div className="dialog-box">
        <h2>Xác nhận xoá</h2>
        <p>
          Bạn có chắc muốn xoá sản phẩm{' '}
          <strong>{product?.name}</strong>?
          <br />
          Hành động này không thể hoàn tác.
        </p>
        <div className="dialog-actions">
          {/* Nút Huỷ */}
          <button
            id="confirm-no"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Huỷ
          </button>
          {/* Nút Xoá */}
          <button
            id="confirm-yes"
            className="btn btn-danger"
            onClick={onConfirm}
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}
