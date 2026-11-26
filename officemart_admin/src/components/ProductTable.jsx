// ProductTable.jsx – Hiển thị bảng danh sách sản phẩm
// Nhận prop: products (array), onDelete (function)
import React from 'react';
import ProductRow from './ProductRow.jsx';

export default function ProductTable({ products, onDelete }) {
  return (
    <div className="table-wrapper">
      <table>
        {/* 7 cột đúng theo yêu cầu đề bài */}
        <thead>
          <tr>
            <th>Tên</th>
            <th>SKU</th>
            <th>Danh mục</th>
            <th>Giá</th>
            <th>Tồn kho</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
