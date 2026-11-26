# BÀI LÀM – ĐÁNH GIÁ NĂNG LỰC FRONTEND (K24)

- **Mã đề:** 01
- **Họ tên:**
- **Lớp:**
- **Link repository:**
- **Hệ điều hành (Windows/macOS):** macOS
- **Mã commit P2 đã nộp trước phút 90 (gõ `git log --oneline -1`):**
- **Phiên bản Node.js (gõ `node -v`):** v20.x

## 4.1. Giao diện danh sách sản phẩm

> Pha 1 – mức AI-0 (không dùng AI).

> Chấm trực tiếp trên mã nguồn thư mục officemart_admin. Đánh dấu `[x]` vào các mục đã làm để tự kiểm tra.

- [x] 4.1.1. Bố cục trang
- [x] 4.1.2. Bảng sản phẩm
- [x] 4.1.3. Định dạng dữ liệu
- [x] 4.1.4. Hiển thị trên điện thoại

## 4.2. Thêm, sửa, xoá sản phẩm qua API

> Pha 1 – mức AI-0 (không dùng AI).

> Chấm trực tiếp trên mã nguồn thư mục officemart_admin.

- [x] 4.2.1. Tải danh sách
- [x] 4.2.2. Form thêm sản phẩm
- [x] 4.2.3. Gửi form
- [x] 4.2.4. Sửa sản phẩm
- [x] 4.2.5. Xoá sản phẩm

## 4.3. Tìm kiếm, lọc và phân trang

> Pha 2 – mức AI-2 (được dùng AI, ghi nhật ký ở Mục 4.3.5).

> Mục 4.3.1 đến 4.3.3 và ý c của Mục 4.3.4 chấm trực tiếp trên mã nguồn.

- [x] 4.3.1. Tìm kiếm và lọc
- [x] 4.3.2. Phân trang
- [x] 4.3.3. Đồng bộ URL

### 4.3.4. Phản biện mã do AI sinh

#### a) Thao tác làm danh sách hiển thị sai

Các bước thao tác:

```text
1. Khởi động mock API ở chế độ trễ không đồng đều: npm run api:cham (ở chế độ này, từ khoá bắt đầu bằng "ban" sẽ bị trễ 2,5 giây, còn từ khoá khác chỉ trễ 0,1 giây).
2. Mở trình duyệt và truy cập trang /products.
3. Nhập từ khoá "ban" vào ô tìm kiếm search-input.
4. Ngay lập tức (trong vòng dưới 2 giây), xoá nhanh và nhập từ khoá "chuot".
```

Kết quả hiển thị:

```text
- Ngay sau bước 4 khoảng 0,1 giây, danh sách hiển thị đúng các sản phẩm chuột tương ứng với từ khoá "chuot".
- Tuy nhiên khoảng 2,4 giây sau đó, danh sách lại đột ngột biến đổi và hiển thị các sản phẩm bàn phím ("ban"), trong khi ô tìm kiếm và thanh URL vẫn đang hiển thị từ khoá "chuot".
```

Kết quả đúng:

```text
- Danh sách sản phẩm hiển thị trên màn hình phải luôn khớp với từ khoá và bộ lọc mới nhất hiện tại ("chuot").
- Kết quả của request tìm kiếm "ban" trước đó đã hết hạn nên phải bị hủy (abort) hoặc bị loại bỏ, không được phép ghi đè lên state của trang.
```

#### b) Vì sao hook hiển thị sai

Hook `useProductSearch_ai.js` bị lỗi **Race Condition (bất đồng bộ cạnh tranh)**:
1. Khi params (`q`, `category`, `status`, `page`) thay đổi liên tục, hàm `load()` được gọi nhiều lần tạo ra nhiều request bất đồng bộ đồng thời. Do độ trễ mạng khác nhau, request gửi trước ("ban", trễ 2,5s) lại hoàn thành sau request gửi sau ("chuot", trễ 0,1s).
2. Khi request cũ phản hồi sau cùng, nó gọi `setData(res.data.data)` và ghi đè lên kết quả mới.
3. Hook không dùng `AbortController` để hủy request cũ, không kiểm tra điều kiện huỷ trước khi `setData`, và không dọn dẹp (cleanup) khi component unmount.

#### c) Hook đã sửa

> Chấm trực tiếp trên file src/hooks/useProductSearch.js và trang danh sách.

### 4.3.5. Nhật ký dùng AI (giữ – sửa – loại bỏ)

> Ghi ít nhất 2 lần dùng AI có ảnh hưởng đến mã nộp. Không dùng AI trong Pha 2 thì xoá bảng và ghi "Không sử dụng AI trong Pha 2".

| Lần | Câu lệnh chính gửi cho AI | Đoạn mã hoặc ý AI đưa ra (file) | Quyết định (giữ/sửa/loại bỏ) | Lý do | Bằng chứng kiểm chứng (chạy thử gì, kết quả) |
|---|---|---|---|---|---|
| 1 | Viết custom hook useProductSearch giải quyết race condition bằng AbortController cho Axios, hủy request cũ khi params thay đổi và dọn dẹp khi unmount | Khung hook `src/hooks/useProductSearch.js` dùng `useRef(null)` giữ `controller`, truyền `signal: controller.signal` vào `api.get`, bắt lỗi `axios.isCancel(err)` | Sửa | Giữ khung AbortController của AI, bổ sung thêm biến đếm `refreshIndex` và hàm `refetch` để trang danh sách có thể chủ động tải lại dữ liệu sau khi xoá sản phẩm hoặc bấm nút Thử lại | Chạy thử nghiệm với `npm run api:cham`, nhập "ban" rồi đổi thành "chuot": Network tab của DevTools hiển thị request "ban" chuyển trạng thái `(canceled)`, dữ liệu trên bảng hiển thị chuẩn xác sản phẩm chuột |
| 2 | Hướng dẫn cách debounce 400ms cho input tìm kiếm và đồng bộ 2 chiều với useSearchParams trong React Router v6 | Đề xuất tách `searchTerm` thành state cục bộ trong `ProductsPage.jsx`, dùng `useEffect` với `setTimeout(..., 400)` để cập nhật `setSearchParams`, kèm điều kiện so sánh `searchTerm === qFromUrl` | Giữ | Giải pháp giúp giao diện ô nhập phản hồi tức thì khi người dùng gõ phím, đúng thời gian chờ 400ms mới cập nhật URL, đồng thời không bị re-render vô tận khi người dùng bấm nút Back/Forward | Gõ liên tục chuỗi ký tự "ban phim", kiểm tra log chỉ gửi đúng 1 request sau khi ngừng gõ 400ms. Thử bấm Back/Forward trình duyệt, ô input tự động đồng bộ theo tham số `q` trên URL |

## Ghi chú (không tính điểm)

Các trường hợp biên đã được xử lý cụ thể trong ứng dụng:
- **Từ khoá chỉ có khoảng trắng (`q="   "`):** Được cắt bỏ khoảng trắng thừa bằng `.trim()`; nếu rỗng sẽ xoá bỏ param `q` trên URL (`nextParams.delete('q')`), API tải toàn bộ danh sách bình thường.
- **Trang âm hoặc không phải số (`page=-3`, `page=0`, `page=abc`):** Ép kiểu qua `parseInt`, nếu `<= 0` hoặc `isNaN` thì tự động đưa về `page = 1`.
- **Trang vượt quá số lượng (`page=999`):** API mock trả về danh sách rỗng `data: []` và tổng số bản ghi `total`. Giao diện hiển thị `empty-state` ("Không tìm thấy sản phẩm nào phù hợp"), `page-current` hiển thị `999 / 12`, nút `page-next` tự động bị disabled.
- **URL thiếu tham số (truy cập thẳng `/products`):** Mặc định hiển thị trang 1, không bộ lọc, tải 10 sản phẩm đầu tiên.
- **URL có tham số bộ lọc không hợp lệ:** Hook vẫn truyền an toàn lên server; nếu không có bản ghi phù hợp, ứng dụng hiển thị `empty-state` sạch sẽ, không gây lỗi giao diện.
- **Chống spam request chuyển trang / bộ lọc:** Các nút chuyển trang bị disabled khi đang ở trang biên hoặc khi `loading = true`. Mọi request trước đó đều được `AbortController` huỷ tự động khi có thao tác mới.
