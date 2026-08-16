# Quy Trình Migration Cơ Sở Dữ Liệu (Database Migration Guide)

Tài liệu này hướng dẫn chi tiết quy trình thay đổi cấu trúc bảng (Schema) và chuyển dịch dữ liệu (Data Migration) an toàn cho môi trường **Production**.

---

## 📌 1. Tổng Quan Quy Trình

| Thao tác | Lệnh thực thi | Mục đích |
|---|---|---|
| **Tạo migration mới (Dev)** | `npm run db:migrate` | Tạo file SQL migration mới và áp dụng lên database local |
| **Tạo migration kèm custom SQL** | `npm run db:migrate:create -- --name <ten_migration>` | Tạo file SQL để viết thêm logic transform data trước khi áp dụng |
| **Deploy migration (Production)** | `npm run db:migrate:deploy` | Tự động chạy tất cả migration chưa áp dụng lên database Production |
| **Kiểm tra trạng thái migration** | `npm run db:migrate:status` | Xem danh sách migration đã chạy và migration còn pending |

---

## 🛠️ 2. Quy Trình Khi Thay Đổi Schema (Bổ sung / Sửa / Xóa Cột hoặc Bảng)

### Bước 1: Sao lưu dữ liệu dự phòng (Khuyến nghị)
Trước khi tạo hoặc chạy migration, hãy tạo một bản sao lưu an toàn:
```bash
npm run db:backup
```

### Bước 2: Chỉnh sửa file `prisma/schema.prisma`
Cập nhật model, trường dữ liệu, hoặc bảng mới trong [`prisma/schema.prisma`](file:///Users/le.van.thanh/Documents/a/ptit-web-tool/prisma/schema.prisma).

### Bước 3: Tạo migration

#### Trường hợp A: Chỉ thay đổi cấu trúc bảng đơn giản (Thêm cột có `@default`, tạo bảng mới)
Chạy lệnh:
```bash
npm run db:migrate
```
Prisma sẽ yêu cầu nhập tên migration (ví dụ: `add_notification_channel`) và tự động:
1. Sinh file SQL trong thư mục `prisma/migrations/<timestamp>_<ten_migration>/migration.sql`.
2. Áp dụng file SQL lên database cục bộ.
3. Cập nhật lại Prisma Client (`prisma generate`).

---

#### Trường hợp B: Thay đổi cần xử lý Data Migration (Chuyển đổi kiểu dữ liệu, backfill dữ liệu cho các bản ghi cũ)
Nếu bạn thêm cột mới nhưng cần tính toán / nạp dữ liệu cho hàng nghìn bản ghi hiện có:

1. **Tạo file migration mà không áp dụng ngay:**
   ```bash
   npm run db:migrate:create -- --name backfill_user_profile
   ```

2. **Chỉnh sửa file `migration.sql` vừa sinh ra:**
   Mở file `prisma/migrations/<timestamp>_backfill_user_profile/migration.sql` và thêm các câu lệnh SQL xử lý dữ liệu, ví dụ:
   ```sql
   -- 1. Thêm cột mới
   ALTER TABLE "Student" ADD COLUMN "email" TEXT;

   -- 2. Data Migration: Cập nhật email mặc định từ mã sinh viên cho các bản ghi cũ
   UPDATE "Student" SET "email" = LOWER("maSV") || '@ptit.edu.vn' WHERE "email" IS NULL;
   ```

3. **Áp dụng migration vào database:**
   ```bash
   npm run db:migrate:deploy
   ```

---

## 🚀 3. Quy Trình Triển Khai Trên Production (Docker)

Khi ứng dụng chạy bằng Docker (`Dockerfile` / `docker-compose.yml`):
- Trong [`Dockerfile`](file:///Users/le.van.thanh/Documents/a/ptit-web-tool/Dockerfile), lệnh khởi động container đã được cấu hình tự động:
  ```dockerfile
  CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm start"]
  ```
- Khi bạn `git pull` code mới và khởi động lại container:
  ```bash
  docker compose up -d --build
  ```
  Container sẽ **tự động kiểm tra và áp dụng các file SQL migration mới** vào file CSDL [`dev.db`](file:///Users/le.van.thanh/Documents/a/ptit-web-tool/prisma/dev.db) mà không làm mất bất kỳ dữ liệu cũ nào.

---

## 🛡️ 4. Kiểm Tra & Xử Lý Sự Cố

### Kiểm tra tình trạng migration
```bash
npm run db:migrate:status
```
Nếu màn hình hiển thị `Database schema is up to date!` tức là toàn bộ migrations đã được áp dụng thành công.

### Phục hồi nếu migration gặp sự cố
1. Sử dụng tính năng **Phục Hồi Cơ Sở Dữ Liệu (Database Restore)** ngay trên giao diện Web Admin tab *Sao Lưu Dữ Liệu DB*.
2. Hoặc khôi phục file sao lưu an toàn tự động (`ptit-db-pre-restore-*.sqlite`) trong thư mục `backups/`.
