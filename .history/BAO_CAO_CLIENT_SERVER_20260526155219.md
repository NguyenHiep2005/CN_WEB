# BÁO CÁO MÔ HÌNH CLIENT-SERVER
## Dự Án: Web Giày Thể Thao Thời Trang (Web Shoe)

---

## 📋 MỤC LỤC
1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Các Thành Phần Chính](#các-thành-phần-chính)
4. [Luồng Hoạt Động](#luồng-hoạt-động)
5. [Ưu Điểm](#ưu-điểm)
6. [Nhược Điểm](#nhược-điểm)
7. [Giải Pháp & Khuyến Nghị](#giải-pháp--khuyến-nghị)

---

## 🎯 Tổng Quan

**Định Nghĩa:** Mô hình Client-Server là một kiến trúc phần mềm trong đó:
- **Client** (Máy Khách): Ứng dụng chạy ở phía người dùng (Frontend)
- **Server** (Máy Chủ): Ứng dụng chạy ở phía backend, xử lý logic và lưu trữ dữ liệu

**Dự án Web Shoe:** Áp dụng mô hình Client-Server với phân tách rõ ràng giữa Frontend (React) và Backend (Node.js)

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                      INTERNET / NETWORK                     │
└─────────────────────────────────────────────────────────────┘
         ↑                                        ↑
         │ HTTP/HTTPS                            │ HTTP/HTTPS
         │ REST API                              │ REST API
         ↓                                        ↓
   ┌──────────────────┐               ┌──────────────────┐
   │    CLIENT SIDE   │               │   SERVER SIDE    │
   │  (Frontend)      │◄─────────────►│  (Backend)       │
   │                  │  Request/     │                  │
   │  • React SPA     │  Response     │  • Node.js       │
   │  • Components    │               │  • Express API   │
   │  • Pages         │               │  • Controllers   │
   │  • Styles        │               │  • Models        │
   │  • Store(State)  │               │  • Database      │
   └──────────────────┘               └──────────────────┘
         PORT 3000                       PORT 5000
```

---

## 🔧 Các Thành Phần Chính

### 1️⃣ PHÍA CLIENT (Frontend - React)

**Vị trí:** `client/`

**Cấu Trúc:**
```
client/
├── src/
│   ├── Components/          # React Components tái sử dụng
│   │   ├── Header.js
│   │   ├── Navbar.js
│   │   ├── Footer.js
│   │   ├── ManageOrder.js   # ← Quản lý đơn hàng
│   │   ├── ManageProducts.js
│   │   ├── ManagerUser.js
│   │   └── ... (các component khác)
│   │
│   ├── Pages/               # Trang chính của ứng dụng
│   │   ├── Home.js
│   │   ├── Login.js
│   │   ├── Cart.js
│   │   ├── Admin.js
│   │   └── ... (các trang khác)
│   │
│   ├── Config/              # Cấu hình API
│   │   └── api.js           # ← Endpoint backend
│   │
│   ├── store/               # State Management (Context API)
│   │   ├── Context.js
│   │   └── Provider.js
│   │
│   ├── hooks/               # Custom Hooks
│   │   ├── useDebounce.js
│   │   └── useStore.js
│   │
│   ├── Styles/              # CSS/SCSS modules
│   │   ├── Admin.module.scss
│   │   ├── Cart.module.scss
│   │   └── ... (các style)
│   │
│   ├── utils/               # Hàm tiện ích
│   │   ├── Modal/
│   │   ├── HandleCart/
│   │   └── ... (utilities)
│   │
│   ├── App.js
│   ├── index.js
│   └── setupTests.js
│
└── package.json
```

**Công Nghệ:**
- React (Thư viện UI)
- React Router (Định tuyến)
- React Bootstrap (UI Components)
- Context API (State Management)
- Axios (HTTP Client - gọi API)
- SCSS (CSS Preprocessor)

**Trách Nhiệm:**
✅ Hiển thị giao diện người dùng  
✅ Nhận input từ người dùng  
✅ Gọi API backend để lấy dữ liệu  
✅ Xử lý state và caching dữ liệu  
✅ Validation dữ liệu phía client  

---

### 2️⃣ PHÍA SERVER (Backend - Node.js)

**Vị trí:** `server/`

**Cấu Trúc:**
```
server/
├── src/
│   ├── server.js            # File chính, khởi động server
│   │
│   ├── Config/
│   │   └── db.js            # Kết nối MongoDB
│   │
│   ├── models/              # Database Models (MongoDB Schema)
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Category.js
│   │   └── ... (models khác)
│   │
│   ├── controllers/         # Business Logic
│   │   ├── ControllerCart.js
│   │   ├── ControllerUser.js
│   │   ├── ControllerProduct.js
│   │   ├── ControllerOrder.js
│   │   └── ... (controllers khác)
│   │
│   ├── routes/              # API Endpoints
│   │   ├── cartRoutes.js
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   └── ... (routes khác)
│   │
│   ├── middleware/          # Middleware (xác thực, validation)
│   │   ├── auth.js          # JWT Authentication
│   │   └── errorHandler.js
│   │
│   ├── jwt/                 # JWT token management
│   │
│   ├── SendMail/            # Email service
│   │
│   ├── uploads/             # File uploads
│   │
│   └── utils/               # Hàm tiện ích
│
├── public/
│   └── images/              # Lưu trữ ảnh sản phẩm
│
├── package.json
├── server.js
└── seed.js                  # Dữ liệu khởi tạo (seeding)
```

**Công Nghệ:**
- Node.js (Runtime)
- Express.js (Web Framework)
- MongoDB (Database)
- Mongoose (ODM - Object Document Mapper)
- JWT (JSON Web Token - xác thực)
- Bcrypt (Mã hóa mật khẩu)
- Nodemailer (Gửi email)

**Trách Nhiệm:**
✅ Tiếp nhận yêu cầu từ client  
✅ Xác thực người dùng (JWT)  
✅ Xử lý logic kinh doanh  
✅ Truy vấn/lưu trữ dữ liệu vào database  
✅ Trả về response cho client  
✅ Quản lý lỗi và validation  

---

## 🔄 Luồng Hoạt Động

### Ví Dụ: Người Dùng Xem Danh Sách Đơn Hàng

```
1. CLIENT (React Component)
   └─> Người dùng truy cập trang Quản Lý Đơn Hàng
       └─> ManageOrder.js gọi: request.get('/api/getallorder')

2. NETWORK (HTTP Request)
   └─> GET http://localhost:5000/api/getallorder
       Header: { Authorization: "Bearer <token>" }

3. SERVER (Node.js/Express)
   └─> Router nhận request
       └─> Middleware xác thực JWT
           └─> Controller (ControllerOrder.js)
               └─> Truy vấn MongoDB: Order.find()
                   └─> Trả về danh sách đơn hàng

4. NETWORK (HTTP Response)
   └─> 200 OK
       Body: [
         {
           _id: "123",
           username: "John",
           phone: "0987654321",
           province: "Hà Nội",
           ward: "Quận Ba Đình",
           address: "123 Phố Cổ",
           products: [...],
           sumprice: 2000000,
           tinhtrang: false,
           createdAt: "2026-05-26"
         }
       ]

5. CLIENT (React)
   └─> Nhận response
       └─> setState(dataCart)
           └─> Re-render bảng danh sách
               └─> Hiển thị đơn hàng cho người dùng
```

---

## 📊 Ưu Điểm

### 1. **Tách Biệt Rõ Ràng** ✅
- Frontend và Backend độc lập, dễ bảo trì
- Team frontend và backend có thể làm việc song song
- Lỗi ở một bên không ảnh hưởng bên kia

### 2. **Khả Năng Mở Rộng** 📈
- Có thể thêm nhiều client (Web, Mobile App, Desktop)
- Server API có thể được sử dụng bởi nhiều ứng dụng
- Dễ scale backend khi lưu lượng tăng

### 3. **Bảo Mật Tốt Hơn** 🔒
- Logic nhạy cảm chỉ ở server (mã hóa, validation)
- API key, database credentials không lộ phía client
- JWT token quản lý phiên người dùng an toàn

### 4. **Hiệu Năng** ⚡
- Frontend được cache tại browser
- Server có thể xử lý nhiều request từ nhiều client
- Chia tải giữa client và server

### 5. **Reusability** 🔄
- API backend có thể reuse cho nhiều frontend khác nhau
- Components React tái sử dụng
- Không cần viết lại logic kinh doanh

### 6. **Dễ Test** ✔️
- Backend API có thể test độc lập (Postman, Jest)
- Frontend có thể test với mock API
- Unit testing, Integration testing dễ hơn

---

## ⚠️ Nhược Điểm

### 1. **Độ Phức Tạp** 🤯
- Phải quản lý 2 dự án riêng biệt
- Phải hiểu cấu trúc cả frontend lẫn backend
- Deploy phức tạp hơn (2 server khác nhau)

### 2. **Kỳ Vọng Đồng Bộ** 🔄
- Phải đảm bảo client và server luôn tương thích
- Thay đổi API có thể làm hỏng client
- Cần versioning API

### 3. **Độ Trễ Mạng** 🌐
- Mỗi yêu cầu cần phải qua mạng (HTTP request/response)
- Kém performance hơn MVC server-side rendering
- Phụ thuộc vào kết nối internet

### 4. **CORS & Security** 🚨
- Cần cấu hình CORS (Cross-Origin Resource Sharing) đúng
- Phòng chống XSS, CSRF, SQL Injection
- Có thể bị DDoS attack

### 5. **Quản Lý State Khó** 📦
- Context API có thể dẫn đến prop drilling
- Cần thư viện quản lý state phức tạp (Redux, Zustand)
- Khó debug state khi dữ liệu từ server

### 6. **SEO Hạn Chế** 🔍
- React SPA khó tối ưu SEO
- Cần Next.js hoặc SSR để crawl content tốt
- Không thân thiện với search engines

---

## 💡 Giải Pháp & Khuyến Nghị

### 🎯 Giải Pháp Hiện Tại

**Cho Vấn Đề CORS:**
```javascript
// server/src/server.js
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
```

**Cho Quản Lý State:**
```javascript
// client/src/store/Context.js
// Dùng Context API + useReducer để quản lý state
// Hoặc nâng cấp lên Redux
```

**Cho Security:**
```javascript
// server/src/middleware/auth.js
// JWT authentication
// Password hashing với bcrypt
```

### 🚀 Khuyến Nghị Cải Thiện

| Vấn Đề | Khuyến Nghị | Độ Khó |
|--------|-----------|--------|
| SEO tập | Chuyển sang Next.js (SSR) | ⭐⭐⭐⭐ |
| State quản lý phức | Dùng Redux hoặc Zustand | ⭐⭐⭐ |
| Performance | Implement caching, pagination | ⭐⭐ |
| Real-time updates | Thêm WebSocket (Socket.io) | ⭐⭐⭐ |
| Load balancing | Dùng Nginx hoặc AWS | ⭐⭐⭐⭐ |
| Database optimization | Indexing, Query optimization | ⭐⭐⭐ |
| API documentation | Thêm Swagger/OpenAPI | ⭐⭐ |
| Error handling | Centralized error handler | ⭐⭐ |

---

## 📱 Mở Rộng Kiến Trúc

### Hiện Tại:
```
┌──────────────┐          ┌──────────────┐
│  Web Client  │          │ Node.js API  │
│  (React)     │◄────────►│ (Express)    │
└──────────────┘          └──────────────┘
   Port 3000                 Port 5000
                                 │
                            ┌────▼─────┐
                            │ MongoDB   │
                            │ Database  │
                            └───────────┘
```

### Tương Lai (Có thể mở rộng):
```
┌──────────────┐
│  Web Client  │
│  (React)     │
└──────────────┘
        │
        ├────────────┐
        │            │
   ┌────▼─────┐ ┌────▼─────┐
   │ Mobile   │ │ Desktop  │
   │ App      │ │ App      │
   │(React    │ │(Electron)│
   │Native)   │ │          │
   └────┬─────┘ └────┬─────┘
        │            │
        └────────────┼─────────┐
                     │         │
              ┌──────▼──────┐  │
              │ Node.js API │  │
              │ (Express)   │  │
              └──────┬──────┘  │
                     │         │
         ┌───────────┴────────┐│
         │                    ││
    ┌────▼─────┐        ┌────▼─────┐
    │ MongoDB   │        │ Redis    │
    │ Database  │        │ Cache    │
    └───────────┘        └──────────┘
```

---

## 📈 Thống Kê Dự Án

| Thông Tin | Chi Tiết |
|-----------|---------|
| **Frontend Framework** | React 18+ |
| **Backend Framework** | Node.js + Express.js |
| **Database** | MongoDB |
| **Port Frontend** | 3000 |
| **Port Backend** | 5000 |
| **Authentication** | JWT Token |
| **State Management** | Context API |
| **CSS** | SCSS Modules |
| **API Communication** | Axios (HTTP Client) |
| **Components** | ~20+ React Components |
| **Pages** | ~10+ Pages |
| **Models** | User, Product, Order, Category, etc. |

---

## 🎓 Kết Luận

**Dự án Web Shoe sử dụng mô hình Client-Server là lựa chọn tốt vì:**

✅ Phân tách rõ ràng giữa Frontend và Backend  
✅ Dễ bảo trì và nâng cấp  
✅ Bảo mật tốt hơn MVC truyền thống  
✅ Có thể mở rộng sang mobile hoặc desktop  
✅ Phù hợp cho startup và dự án vừa-to  

**Tuy nhiên cần lưu ý:**
⚠️ Phải quản lý 2 dự án riêng biệt  
⚠️ Cần hiểu rõ HTTP, API, JSON  
⚠️ Deploy phức tạp hơn MVC  
⚠️ Cần tối ưu performance và security  

---

**Ngày tạo báo cáo:** 26/05/2026  
**Dự án:** Web Shoe - Giày Thể Thao Thời Trang  
**Mô hình:** Client-Server Architecture
