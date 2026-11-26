// Context để quản lý Toast notifications toàn ứng dụng
import React, { createContext, useContext, useState, useCallback } from 'react';

// Tạo context
const ToastContext = createContext(null);

// Hook để dùng toast ở bất kỳ component nào
export function useToast() {
  return useContext(ToastContext);
}

// Provider bọc bên ngoài App
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Hàm hiển thị toast, tự động mất sau 3 giây
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* Vùng hiển thị toast ở góc dưới phải */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
