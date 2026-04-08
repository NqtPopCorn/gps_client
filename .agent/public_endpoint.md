Tất cả các API trả về dữ liệu đều theo cấu trúc chuẩn chung:

```json
{
  "status": 200,
  "message": "Thông báo (nếu có)",
  "data": { ... } // Dữ liệu trả về
}
```

---

### 2. 📍 Nhóm API Địa điểm (POIs)

**2.1. Lấy chi tiết một địa điểm**

- **Method & Path:** `GET` `/api/pois/{id}`
- **Path Parameters:**
  - `id` (string): Bắt buộc. ID của địa điểm.
- **Query Parameters:**
  - `lang` (string): Bắt buộc. Ngôn ngữ (`en`, `fr`, `ja`, `vi`, `zh`).
- **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "name": "Tên địa điểm (theo lang)",
    "description": "Mô tả (theo lang)",
    "audio": "url_to_audio_file",
    "image": "url_to_image_file",
    "latitude": 10.762622,
    "longitude": 106.660172,
    "type": "food | drink | museum | park | historical | shopping | other",
    "slug": "ten-dia-diem",
    "distance": 1.5, // Có thể null nếu không search theo tọa độ
    "supported_languages": ["vi", "en"]
  }
  ```

**2.2. Tìm địa điểm lân cận (Nearby)**

- **Method & Path:** `GET` `/api/pois/nearby`
- **Query Parameters:**
  - `lat` (float): Bắt buộc. Vĩ độ hiện tại.
  - `lng` (float): Bắt buộc. Kinh độ hiện tại.
  - `lang` (string): Bắt buộc. (`en`, `fr`, `ja`, `vi`, `zh`).
  - `radius` (int): Không bắt buộc. Bán kính tìm kiếm (mét), mặc định là 5000.
  - `limit` (int): Không bắt buộc. Số lượng kết quả trả về, mặc định 20, max 100.
- **Response (200 OK):** Trả về mảng (array) các object POI giống API chi tiết ở trên, sắp xếp theo `distance`.

**2.3. Tìm kiếm địa điểm theo tên**

- **Method & Path:** `GET` `/api/pois/search/`
- **Query Parameters:**
  - `name` (string): Bắt buộc. Từ khóa tìm kiếm.
  - `lang` (string): Bắt buộc. Ngôn ngữ (`en`, `fr`, `ja`, `vi`, `zh`).
- **Response (200 OK):** Trả về mảng (array) các object POI khớp với từ khóa.

---

### 3. 🗺️ Nhóm API Chuyến đi (Tours)

**3.1. Lấy danh sách Tours**

- **Method & Path:** `GET` `/api/tours/`
- **Query Parameters (Tất cả đều không bắt buộc):**
  - `lang` (string): (`en`, `fr`, `ja`, `vi`, `zh`).
  - `name` (string): Lọc tour theo tên.
  - `page` (int): Số trang, mặc định 1.
  - `limit` (int): Số item mỗi trang, mặc định 20, max 100.
- **Response (200 OK):**
  ```json
  {
    "results": [
      {
        "id": "uuid",
        "name": "Tên tour",
        "description": "Mô tả tour",
        "point_count": 5, // Số lượng địa điểm trong tour
        "image": "url_to_image",
        "created_at": "datetime",
        "updated_at": "datetime",
        "status": "published"
      }
    ],
    "total": 50,
    "totalPage": 3
  }
  ```

**3.2. Lấy chi tiết Tour (bao gồm các địa điểm)**

- **Method & Path:** `GET` `/api/tours/{id}`
- **Path Parameters:**
  - `id` (string): Bắt buộc. ID của tour.
- **Query Parameters:**
  - `lang` (string): Bắt buộc. Ngôn ngữ hiển thị cho các địa điểm bên trong (`en`, `fr`, `ja`, `vi`, `zh`).
- **Response (200 OK):** Trả về object Tour giống API list, nhưng có thêm mảng `pois`:
  ```json
  {
    "id": "uuid",
    // ... (các trường thông tin tour)
    "pois": [
      {
        "id": "uuid_của_tour_point",
        "position": 1, // Thứ tự trong tour
        "poi": {
          /* Object chi tiết của địa điểm (POI) */
        }
      }
    ]
  }
  ```

---
