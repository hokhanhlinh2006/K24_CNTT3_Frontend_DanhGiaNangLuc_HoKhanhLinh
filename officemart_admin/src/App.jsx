// App.jsx – Điểm vào chính, khai báo layout và routes
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductFormPage from './pages/ProductFormPage.jsx';

export default function App() {
  return (
    // ToastProvider bọc ngoài để mọi trang đều dùng được toast
    <ToastProvider>

      {/* Header cố định – hiển thị OfficeMart Admin */}
      <header className="app-header">
        <h1>OfficeMart Admin</h1>
      </header>

      {/* Nội dung chính */}
      <main className="main-content">
        <Routes>
          {/* / → tự động chuyển đến /products */}
          <Route path="/" element={<Navigate to="/products" replace />} />

          {/* Trang danh sách sản phẩm */}
          <Route path="/products" element={<ProductsPage />} />

          {/* Trang thêm sản phẩm mới */}
          <Route path="/products/new" element={<ProductFormPage />} />

          {/* Trang sửa sản phẩm */}
          <Route path="/products/:id/edit" element={<ProductFormPage />} />
        </Routes>
      </main>

    </ToastProvider>
  );
}
