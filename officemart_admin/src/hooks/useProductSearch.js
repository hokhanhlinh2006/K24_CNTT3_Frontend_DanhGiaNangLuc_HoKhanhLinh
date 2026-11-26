// src/hooks/useProductSearch.js
// Custom hook tìm kiếm, lọc và phân trang sản phẩm qua API.
// Giải quyết triệt để Race Condition bằng AbortController.
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import api from '../api/axiosClient.js';

export default function useProductSearch(params = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lưu trữ AbortController hiện tại để có thể hủy khi có request mới hoặc unmount
  const abortControllerRef = useRef(null);

  // Biến đếm refresh để chủ động refetch khi cần (ví dụ sau khi xoá sản phẩm)
  const [refreshIndex, setRefreshIndex] = useState(0);
  const refetch = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // 1. Nếu có request trước đó chưa hoàn thành, huỷ bỏ ngay lập tức
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Tạo một AbortController mới cho request hiện tại
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const queryParams = {
          limit: 10,
          ...params,
        };

        const res = await api.get('/products', {
          params: queryParams,
          signal: controller.signal,
        });

        // Chỉ cập nhật state nếu request này chưa bị hủy (không bị race condition)
        if (!controller.signal.aborted) {
          setData(res.data.data || []);
          setTotal(res.data.total || 0);
        }
      } catch (err) {
        // Nếu lỗi do request bị hủy (AbortController), bỏ qua và không set error
        if (
          axios.isCancel(err) ||
          err.name === 'CanceledError' ||
          err.code === 'ERR_CANCELED'
        ) {
          return;
        }

        // Lấy thông báo lỗi từ server nếu có
        const msg =
          err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu';
        setError(msg);
      } finally {
        // Chỉ tắt loading nếu đây vẫn là request mới nhất (chưa bị hủy)
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    // 3. Cleanup: huỷ request khi component unmount hoặc params thay đổi trước khi effect tiếp theo chạy
    return () => {
      controller.abort();
    };
  }, [
    params.q,
    params.category,
    params.status,
    params.page,
    params.limit,
    refreshIndex,
  ]);

  return {
    data,
    products: data, // alias để tiện dùng
    setData,
    total,
    loading,
    error,
    refetch,
  };
}
