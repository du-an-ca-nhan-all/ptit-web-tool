# Hướng Dẫn Cơ Sở Dữ Liệu PostgreSQL & Migration Guide

Tài liệu này hướng dẫn chi tiết quy trình kết nối PostgreSQL, quản lý Schema Migration qua Prisma, và di chuyển dữ liệu (Data Migration) từ SQLite sang **PostgreSQL** cho cả môi trường Development và **Production**.

---

## 📌 1. Tổng Quan Quy Trình & Lệnh Thao Tác

| Thao tác | Lệnh thực thi | Mục đích |
|---|---|---|
| **Chuyển dữ liệu SQLite sang PostgreSQL** | `npm run db:migrate:from-sqlite` | Tự động đọc dữ liệu từ SQLite/JSON và nạp vào PostgreSQL |
| **Đồng bộ trực tiếp schema (Dev nhanh)** | `npm run db:push` | Đẩy schema từ `schema.prisma` trực tiếp vào database mà không tạo migration file |
| **Tạo migration mới (Dev)** | `npm run db:migrate` | Tạo file SQL migration PostgreSQL mới và áp dụng lên database local |
| **Tạo migration kèm custom SQL** | `npm run db:migrate:create -- --name <ten_migration>` | Tạo file SQL để viết thêm logic transform data trước khi áp dụng |
| **Deploy migration (Production)** | `npm run db:migrate:deploy` | Tự động chạy tất cả migration chưa áp dụng lên database PostgreSQL Production |
| **Kiểm tra trạng thái migration** | `npm run db:migrate:status` | Xem danh sách migration đã chạy và migration còn pending |
| **Sao lưu dữ liệu tự động** | `npm run db:backup` | Tạo bản sao lưu JSON và gửi Telegram (nếu có cấu hình) |
| **Quản trị trực quan CSDL** | `npm run db:studio` | Mở giao diện Prisma Studio trên trình duyệt |

---

## ⚙️ 2. Cấu Hình Kết Nối PostgreSQL

Trong file `.env` (hoặc biến môi trường máy chủ/Docker):

```env
# Định dạng: postgresql://<user>:<password>@<host>:<port>/<database>?schema=public
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ptit_web_tool?schema=public"
```

---

## 🔄 3. Cách Chuyển Dữ Liệu Từ SQLite Cũ Sang PostgreSQL

Nếu bạn đang có dữ liệu trên file `prisma/dev.db` hoặc các file sao lưu `.json` trong thư mục `backups/`:

1. **Khởi động PostgreSQL** (ví dụ qua Docker):
   ```bash
   docker-compose up -d postgres
   ```
2. **Khởi tạo bảng trên PostgreSQL:**
   ```bash
   npm run db:migrate:deploy
   # hoặc: npm run db:push
   ```
3. **Chạy script di chuyển dữ liệu tự động:**
   ```bash
   npm run db:migrate:from-sqlite
   ```
   *Script sẽ tự động tìm bản sao lưu JSON mới nhất trong `backups/` hoặc trích xuất trực tiếp từ `dev.db`, nạp toàn bộ 14 bảng dữ liệu, và đồng bộ lại các chuỗi khóa chính auto-increment (PostgreSQL Sequences).*

---

## 🛠️ 4. Quy Trình Khi Thay Đổi Schema (Bổ sung / Sửa / Xóa Cột hoặc Bảng)

### Bước 1: Sao lưu dữ liệu dự phòng (Khuyến nghị)
```bash
npm run db:backup
```

### Bước 2: Chỉnh sửa file `prisma/schema.prisma`
Cập nhật model, trường dữ liệu, hoặc bảng mới trong [`prisma/schema.prisma`](file:///Users/le.van.thanh/Documents/a/ptit-web-tool/prisma/schema.prisma).

### Bước 3: Tạo migration

#### Trường hợp A: Chỉ thay đổi cấu trúc bảng đơn giản
Chạy lệnh:
```bash
npm run db:migrate
```
Prisma sẽ yêu cầu nhập tên migration (ví dụ: `add_notification_channel`) và tự động:
1. Sinh file SQL trong thư mục `prisma/migrations/<timestamp>_<ten_migration>/migration.sql`.
2. Áp dụng file SQL lên database PostgreSQL cục bộ.
3. Cập nhật lại Prisma Client (`prisma generate`).

---

#### Trường hợp B: Thay đổi cần xử lý Data Migration (Backfill dữ liệu)
1. **Tạo file migration mà không áp dụng ngay:**
   ```bash
   npm run db:migrate:create -- --name backfill_user_profile
   ```

2. **Chỉnh sửa file `migration.sql` vừa sinh ra:**
   Mở file `prisma/migrations/<timestamp>_backfill_user_profile/migration.sql` và thêm các câu lệnh SQL xử lý dữ liệu:
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

## 🚀 5. Quy Trình Triển Khai Trên Production (Docker Compose)

Hệ thống đã được đóng gói sẵn cụm dịch vụ **Next.js Web App + PostgreSQL 16**:

```bash
docker-compose up -d --build
```

- Container `postgres` tự động lưu dữ liệu vĩnh viễn trên volume `postgres_data`.
- Container `ptit-web-tool` tự động đợi PostgreSQL sẵn sàng (qua Healthcheck), áp dụng migration (`npx prisma migrate deploy`), và khởi chạy dịch vụ.

---

## 🛡️ 6. Kiểm Tra & Phục Hồi Dữ Liệu

### Kiểm tra tình trạng migration
```bash
npm run db:migrate:status
```
Nếu hiển thị `Database schema is up to date!` tức là toàn bộ migrations đã được áp dụng thành công.

### Phục hồi cơ sở dữ liệu
1. Sử dụng tính năng **Phục Hồi Cơ Sở Dữ Liệu (Database Restore)** ngay trên giao diện Web Admin tab *Sao Lưu Dữ Liệu DB* (hỗ trợ upload file `.json` hoặc chọn bản snapshot có sẵn trên máy chủ).
2. Dữ liệu được khôi phục nguyên vẹn và các sequence trên PostgreSQL sẽ tự động được đồng bộ chính xác.
