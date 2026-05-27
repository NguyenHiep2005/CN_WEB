# 🎯 Bản Thiết Kế Chi Tiết: Chức Năng Checkout & Thanh Toán (COD) - Web Bán Giày

## 📑 Mục Lục
1. [User Flow (Luồng người dùng)](#1-user-flow-luồng-người-dùng)
2. [Database Schema Design](#2-database-schema-design)
3. [Order Status & Lifecycle](#3-order-status--lifecycle)
4. [Backend Logic & Xử lý Concurrency](#4-backend-logic--xử-lý-concurrency)
5. [Bảo mật & Chống Spam](#5-bảo-mật--chống-spam)
6. [Post-Checkout (Trang Thành Công)](#6-post-checkout-trang-thành-công)
7. [Pseudocode & Code Examples](#7-pseudocode--code-examples)

---

## 1️⃣ User Flow (Luồng người dùng)

### 1.1 Quy trình Checkout Chuẩn

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHECKOUT FLOW (COD)                          │
└─────────────────────────────────────────────────────────────────┘

     ┌──────────┐
     │ Giỏ Hàng │
     └────┬─────┘
          │
          ▼
     ┌──────────────────────┐
     │ Click "Checkout"     │
     │ Kiểm tra token/Auth  │
     └────┬─────────────────┘
          │
          ▼
     ┌──────────────────────────────────────────┐
     │ Đã đăng nhập?                            │
     └────┬─────────────────────┬───────────────┘
          │ YES                 │ NO (Guest)
          │                     │
          ▼                     ▼
     ┌──────────┐    ┌────────────────────┐
     │ Auto-fill│    │ Cho phép Check-out  │
     │ Thông tin│    │ không cần Đăng ký   │
     │ Người    │    │ (Guest Checkout)    │
     │ Dùng     │    └────────┬────────────┘
     └────┬─────┘             │
          │                   │
          └─────────┬─────────┘
                    │
                    ▼
      ┌─────────────────────────────────┐
      │ Form Checkout:                  │
      │ - Tên người nhận                │
      │ - SĐT (validate format)         │
      │ - Địa chỉ giao hàng             │
      │ - Ghi chú (optional)            │
      │ - Review Giỏ hàng               │
      └────────────┬────────────────────┘
                   │
                   ▼
      ┌─────────────────────────────────┐
      │ Review Đơn Hàng                 │
      │ - Danh sách sản phẩm            │
      │ - Tổng giá                      │
      │ - Phí ship (tính toán)          │
      │ - Tổng cộng                     │
      └────────────┬────────────────────┘
                   │
                   ▼
      ┌─────────────────────────────────┐
      │ Click "Xác Nhận Đặt Hàng"       │
      │ (POST /api/checkout)            │
      └────────────┬────────────────────┘
                   │
                   ▼
      ┌─────────────────────────────────┐
      │ ⚠️ KIỂM CHỨNG STOCK              │
      │ (Atomic Operation)              │
      │ - Lock product variants         │
      │ - Verify số lượng tồn           │
      │ - Giảm inventory                │
      │ - Tạo Order record              │
      │ (Toàn bộ trong Transaction)     │
      └────────────┬────────────────────┘
                   │
                   ▼
      ┌──────────────────────────────────┐
      │ Order Tạo Thành Công?            │
      └────┬──────────────────┬──────────┘
           │ YES              │ NO
           │                  │
           ▼                  ▼
      ┌─────────────┐  ┌──────────────────┐
      │ Xóa Giỏ     │  │ Error Response   │
      │ Hàng        │  │ - Out of Stock   │
      └────┬────────┘  │ - Invalid Data   │
           │           │ - System Error   │
           ▼           └────────┬─────────┘
      ┌─────────────────────┐  │
      │ Gửi Email Xác nhận  │  │
      │ đơn hàng             │  │
      └────┬─────────────────┘  │
           │                    │
           ▼                    ▼
      ┌──────────────────────────────────┐
      │ Redirect to Success Page         │
      │ /payment-success?orderId=XXX     │
      └──────────────────────────────────┘
```

### 1.2 Phân Biệt: Authenticated User vs Guest User

| Tiêu Chí | Authenticated User | Guest User |
|----------|-------------------|-----------|
| **Authorization** | Token trong Cookie | Không cần Token |
| **User Info** | Auto-fill từ Profile | Nhập thủ công |
| **History** | Lưu trong `/my-orders` | Chỉ email confirmation |
| **Address** | Có thể lưu multiple | Dùng 1 lần rồi discard |
| **Validation** | Email đã verify | Email verify qua OTP hoặc nhận hàng |
| **Risk Score** | Thấp | Cao (cần rate limit) |

---

## 2️⃣ Database Schema Design

### 2.1 Product Schema (Cải Tiến)

```javascript
// models/ModelProducts.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Product Schema với quản lý variants (Size/Color)
 * 
 * Quyết định thiết kế:
 * ✓ Nhúng (Embed) variants trực tiếp thay vì Reference
 * ✓ Lý do:
 *   - Variants không bao giờ được truy cập độc lập
 *   - Giảm số lượng query (atomicity)
 *   - Performance: Queries nhanh hơn vs JOIN từ nhiều collection
 *   - Consistency: Update stock và product metadata cùng lúc
 */

const variantSchema = new Schema({
    size: {
        type: String,
        required: true,
        enum: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
        lowercase: true,
    },
    color: {
        type: String,
        default: '',
        // Ví dụ: 'Black', 'White', 'Red', 'Navy Blue'
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0, // Không bao giờ âm
    },
    sku: {
        type: String,
        unique: false, // Nếu cần unique SKU per variant
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const modelProduct = new Schema({
    // Thông tin cơ bản
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
    },
    description: {
        type: String,
        default: '',
    },
    
    // Giá
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    originalPrice: {
        type: Number,
        default: 0,
        min: 0,
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    hasDiscount: {
        type: Boolean,
        default: false,
    },
    
    // Hình ảnh
    img: [{
        type: String,
        default: '',
    }],
    
    // Phân loại
    brand: {
        type: String,
        default: '',
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        required: true,
    },
    type: {
        type: Number,
        default: 0,
    },
    
    /**
     * Variants: Size & Color & Stock
     * Cấu trúc tối ưu cho:
     * - Query stock nhanh
     * - Update atomic không bị race condition
     */
    variants: [variantSchema],
    
    // Metadata
    totalStock: {
        type: Number,
        default: 0,
        // Denormalized: Cập nhật sau mỗi thay đổi variants
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Index cho performance
modelProduct.index({ slug: 1 });
modelProduct.index({ categoryId: 1 });
modelProduct.index({ 'variants.size': 1, 'variants.color': 1 });

module.exports = mongoose.model('products', modelProduct);
```

### 2.2 Order Schema (Thiết Kế Mới)

```javascript
// models/ModelOrder.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Order Item - Nhúng (Embed) trong Order
 * 
 * Lý do nhúng vs Reference:
 * 1. Giảm số lượng queries
 * 2. Tính toàn vẹn: Không thay đổi khi product bị xóa
 * 3. Lưu trữ snapshot: Giá, mô tả tại thời điểm order
 * 4. Atomicity: Tạo order & update stock cùng transaction
 */

const orderItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    productSlug: {
        type: String,
        required: true,
    },
    productImage: {
        type: String,
        default: '',
    },
    size: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        default: '',
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    unitPrice: {
        type: Number,
        required: true,
    },
    subtotal: {
        type: Number,
        required: true,
        // = quantity * unitPrice
    },
    discountPercentage: {
        type: Number,
        default: 0,
    },
}, { _id: false });

const modelOrder = new Schema({
    // Order ID
    orderNumber: {
        type: String,
        unique: true,
        required: true,
        // Format: ORD-YYYYMMDD-XXXXX
    },
    
    /**
     * User Information
     * - Cho phép Guest user: userId optional
     */
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        default: null,
        // null nếu là Guest
    },
    userEmail: {
        type: String,
        required: true,
        lowercase: true,
    },
    
    /**
     * Shipping Information
     */
    shipping: {
        recipientName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            // Format: 0xxxxxxxxx (Việt Nam)
        },
        address: {
            type: String,
            required: true,
        },
        ward: {
            type: String,
            default: '',
        },
        district: {
            type: String,
            default: '',
        },
        province: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            default: '',
        },
    },
    
    /**
     * Items (Nhúng)
     */
    items: [orderItemSchema],
    
    /**
     * Pricing Calculation
     */
    pricing: {
        subtotal: {
            type: Number,
            required: true,
        },
        shippingFee: {
            type: Number,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            // = subtotal + shippingFee - discountAmount
        },
    },
    
    /**
     * Order Status
     * COD-specific: tinhtrang (paid status), trangthai (delivery status)
     */
    status: {
        type: String,
        enum: [
            'PENDING',           // 🔵 Chờ xác nhận
            'CONFIRMED',         // 🟢 Đã xác nhận
            'PACKED',            // 📦 Đã đóng gói
            'SHIPPING',          // 🚚 Đang giao
            'DELIVERED',         // ✅ Đã giao
            'FAILED',            // ❌ Giao thất bại
            'CANCELLED',         // ❌ Bị hủy
            'RETURNED',          // 🔄 Hoàn trả
        ],
        default: 'PENDING',
    },
    
    /**
     * Payment Status (COD-specific)
     */
    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PAID', 'PARTIAL'],
        default: 'UNPAID',
        // COD: Thường là UNPAID cho đến khi shipper thu tiền
    },
    
    /**
     * Delivery Status (COD-specific)
     */
    deliveryStatus: {
        type: String,
        enum: ['NOT_STARTED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
        default: 'NOT_STARTED',
    },
    
    /**
     * Timeline
     */
    timeline: {
        createdAt: {
            type: Date,
            default: Date.now,
        },
        confirmedAt: {
            type: Date,
            default: null,
        },
        packedAt: {
            type: Date,
            default: null,
        },
        shippedAt: {
            type: Date,
            default: null,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
    },
    
    /**
     * Metadata (Chống Spam)
     */
    metadata: {
        ipAddress: {
            type: String,
            default: '',
        },
        userAgent: {
            type: String,
            default: '',
        },
        riskScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        flaggedAsSpam: {
            type: Boolean,
            default: false,
        },
        notes: [{
            type: String,
        }],
    },
    
    /**
     * Refund/Return
     */
    refund: {
        status: {
            type: String,
            enum: ['NONE', 'REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED'],
            default: 'NONE',
        },
        reason: {
            type: String,
            default: '',
        },
        amount: {
            type: Number,
            default: 0,
        },
        requestedAt: {
            type: Date,
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
}, {
    timestamps: true,
});

// Indexes
modelOrder.index({ orderNumber: 1 });
modelOrder.index({ userEmail: 1, 'timeline.createdAt': -1 });
modelOrder.index({ userId: 1, 'timeline.createdAt': -1 });
modelOrder.index({ status: 1 });
modelOrder.index({ 'metadata.flaggedAsSpam': 1 });
modelOrder.index({ 'timeline.createdAt': -1 });

module.exports = mongoose.model('orders', modelOrder);
```

### 2.3 Cart Schema (Cải Tiến)

```javascript
// models/ModelCart.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        required: true,
    },
    nameProduct: {
        type: String,
        required: true,
    },
    size: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        default: '',
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
    },
    img: {
        type: String,
        default: '',
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const modelCart = new Schema({
    user: {
        type: String, // email hoặc session ID
        required: true,
        unique: true,
    },
    products: [cartItemSchema],
    
    // Lưu thông tin ship last-used
    lastUsedShipping: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

modelCart.index({ user: 1 });

module.exports = mongoose.model('carts', modelCart);
```

---

## 3️⃣ Order Status & Lifecycle

### 3.1 Order Status Enum (COD-specific)

```javascript
/**
 * Order Status Lifecycle cho COD (Cash on Delivery)
 * 
 * Khác biệt với Online Payment:
 * - Không có PAID state khi order vừa được tạo
 * - Shipper collect payment khi delivery
 */

const ORDER_STATUS = {
    // ============ Initial States ============
    PENDING: 'PENDING',           // 🔵 Khách vừa đặt hàng, chờ xác nhận
    CONFIRMED: 'CONFIRMED',       // 🟢 Admin/Staff đã xác nhận
    
    // ============ Preparation ============
    PACKED: 'PACKED',             // 📦 Hàng đã được đóng gói
    
    // ============ Shipping ============
    SHIPPING: 'SHIPPING',         // 🚚 Hàng đang giao (shipper picked up)
    
    // ============ Final States ============
    DELIVERED: 'DELIVERED',       // ✅ Hàng đã giao thành công
    FAILED: 'FAILED',             // ❌ Giao thất bại (không gặp khách)
    CANCELLED: 'CANCELLED',       // ❌ Đơn bị hủy (trước khi giao)
    RETURNED: 'RETURNED',         // 🔄 Hoàn trả (khách không nhận)
};

const PAYMENT_STATUS = {
    UNPAID: 'UNPAID',             // Chưa thanh toán (COD sẽ ở trạng thái này)
    PAID: 'PAID',                 // Đã thanh toán (shipper confirm)
    PARTIAL: 'PARTIAL',           // Thanh toán 1 phần
};

const DELIVERY_STATUS = {
    NOT_STARTED: 'NOT_STARTED',   // Chưa bắt đầu giao
    IN_TRANSIT: 'IN_TRANSIT',     // Đang trên đường
    DELIVERED: 'DELIVERED',       // Đã giao
    FAILED: 'FAILED',             // Giao không thành công
};

/**
 * Transition Rules
 * 
 * PENDING → CONFIRMED (Admin xác nhận)
 * PENDING → CANCELLED (Khách hoặc Admin hủy trước khi confirm)
 * 
 * CONFIRMED → PACKED (Staff đóng gói)
 * CONFIRMED → CANCELLED (Hủy trước khi đóng gói)
 * 
 * PACKED → SHIPPING (Shipper lấy hàng)
 * PACKED → CANCELLED (Hủy cuối cùng)
 * 
 * SHIPPING → DELIVERED (Shipper confirm giao thành công + PAID)
 * SHIPPING → FAILED (Không gặp khách, hoàn quay lại)
 * 
 * DELIVERED → RETURNED (Khách hoặc shipper yêu cầu hoàn)
 * 
 * FAILED → PENDING (Thử giao lại)
 */
```

### 3.2 Status Transition Diagram

```
┌─────────────────────────────────────────────────────┐
│                ORDER LIFECYCLE (COD)                │
└─────────────────────────────────────────────────────┘

PENDING
  ↓ (Admin confirm)  ↘ (Cancel)
CONFIRMED          CANCELLED
  ↓ (Pack)
PACKED
  ↓ (Pickup)
SHIPPING
  ├─ ✅ → DELIVERED (Payment: UNPAID→PAID) [Timeline: deliveredAt]
  └─ ❌ → FAILED (Retry option)
          ↓
        PENDING (Re-attempt)

DELIVERED
  └─ 🔄 → RETURNED (Customer/Shipper request)

Payment Status Timeline (COD):
  Khởi tạo:    UNPAID
  Giao thành:  PAID (Shipper confirm)
  Hoàn hàng:   PARTIAL hoặc UNPAID (Nếu hoàn tiền)
```

---

## 4️⃣ Backend Logic & Xử Lý Concurrency

### 4.1 Bài Toán Race Condition

```
⚠️ SCENARIO: 2 người cùng lúc bấy "Buy" cho chiếc giày cuối cùng

Timeline:
═══════════════════════════════════════════════════════════════

T1: User A                              T2: User B
   │                                       │
   ├─ Query Stock (Size 40) = 1           │
   │                                       ├─ Query Stock (Size 40) = 1
   │                                       │
   ├─ Verify: 1 >= 1 ✓                    │
   │                                       ├─ Verify: 1 >= 1 ✓
   │                                       │
   ├─ Update: Size 40 = 0                 │
   │                                       │
   └─ Order Created ✓                     │
                                          │
                                          ├─ Update: Size 40 = -1 ❌ (NEGATIVE STOCK!)
                                          │
                                          └─ Order Created ✓ (BUG!)

RESULT: Cả 2 đều mua được 1 đôi giày, nhưng chỉ có 1 đôi
        → Server giao thiếu hoặc bom hàng
```

### 4.2 Giải Pháp: Atomic Update trong MongoDB

#### ✅ Phương Pháp 1: `findOneAndUpdate()` với Atomic Operators

```javascript
/**
 * RECOMMENDED: Sử dụng findOneAndUpdate() với $inc operator
 * Lý do:
 * - Đơn giản, hiệu suất cao
 * - MongoDB guarantee atomicity (không bị race condition)
 * - Một lần query, một lần update
 * - Không cần Transaction overhead
 */

async function createOrder(req, res) {
    const session = await mongoose.startSession();
    
    try {
        const { items, shipping, email } = req.body;
        
        // ================== VALIDATION ==================
        // 1. Validate input
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Empty order' });
        }
        
        // 2. Validate recipient info
        const { recipientName, phone, address } = shipping;
        if (!recipientName || !phone || !address) {
            return res.status(400).json({ error: 'Missing shipping info' });
        }
        
        // 3. Validate phone (Vietnamese format)
        if (!validateVietnamesePhone(phone)) {
            return res.status(400).json({ error: 'Invalid phone format' });
        }
        
        // ================== CALCULATE TOTAL ==================
        let totalAmount = 0;
        let orderItems = [];
        
        // ================== ATOMIC STOCK UPDATE ==================
        /**
         * Cách làm SAFE:
         * Dùng findOneAndUpdate() với atomic operators
         * để giảm stock + verify cùng 1 lần
         */
        
        for (const item of items) {
            const { productId, size, color, quantity } = item;
            
            // TÌM PRODUCT VÀ GIẢM STOCK - ATOMIC OPERATION
            const updatedProduct = await ModelProducts.findOneAndUpdate(
                {
                    _id: productId,
                    // Verify: stock >= requested qty
                    'variants.size': size,
                    'variants.color': color,
                    'variants.quantity': { $gte: quantity } // KEY: Kiểm tra trong query
                },
                {
                    // Atomic giảm stock
                    $inc: {
                        'variants.$.quantity': -quantity,  // $ = matched element
                        totalStock: -quantity
                    }
                },
                {
                    new: true,  // Return updated document
                    session,    // Trong transaction
                }
            );
            
            // Nếu không tìm được = stock không đủ
            if (!updatedProduct) {
                await session.abortTransaction();
                return res.status(409).json({
                    error: 'STOCK_INSUFFICIENT',
                    message: `Product ${productId} size ${size} out of stock`,
                });
            }
            
            // Tính giá
            const unitPrice = item.price;
            const subtotal = unitPrice * quantity;
            totalAmount += subtotal;
            
            // Lưu order item
            orderItems.push({
                productId,
                productName: updatedProduct.name,
                productSlug: updatedProduct.slug,
                productImage: updatedProduct.img?.[0] || '',
                size,
                color,
                quantity,
                unitPrice,
                subtotal,
            });
        }
        
        // ================== CALCULATE FINAL PRICING ==================
        const shippingFee = calculateShippingFee(shipping.address); // Mock
        const discountAmount = 0; // TODO: Apply coupon logic
        const finalTotal = totalAmount + shippingFee - discountAmount;
        
        // ================== CREATE ORDER ==================
        const orderNumber = generateOrderNumber();
        
        const newOrder = new ModelOrder({
            orderNumber,
            userId: null,  // TODO: Extract từ token nếu authenticated
            userEmail: email,
            shipping,
            items: orderItems,
            pricing: {
                subtotal: totalAmount,
                shippingFee,
                discountAmount,
                totalAmount: finalTotal,
            },
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            deliveryStatus: 'NOT_STARTED',
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                riskScore: calculateRiskScore(req, email),
            },
        });
        
        await newOrder.save({ session });
        
        // ================== CLEANUP ==================
        // Xóa cart
        await ModelCart.deleteOne({ user: email }, { session });
        
        // Commit transaction
        await session.commitTransaction();
        
        // ================== POST-ORDER ==================
        // Send confirmation email (async, không block)
        sendOrderConfirmationEmail(email, newOrder).catch(err => {
            console.error('Email send failed:', err);
        });
        
        // ================== RESPONSE ==================
        return res.status(201).json({
            success: true,
            orderId: newOrder._id,
            orderNumber: newOrder.orderNumber,
            message: 'Order created successfully',
            redirectUrl: `/payment-success?orderId=${newOrder._id}`,
        });
        
    } catch (error) {
        await session.abortTransaction();
        
        // Handle specific errors
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Duplicate order number' });
        }
        
        console.error('Create order error:', error);
        return res.status(500).json({
            error: 'ORDER_CREATION_FAILED',
            message: 'Failed to create order. Please try again.',
        });
        
    } finally {
        await session.endSession();
    }
}

/**
 * Helper Functions
 */

function validateVietnamesePhone(phone) {
    // Vietnamese phone: 0xxxxxxxxx (10 digits starting with 0)
    // Formats: 084, 085, 086, 087, 088, 089, 090, 091, 092, 093, 094, 095, 096, 097, 098, 099
    const regex = /^0(3|5|7|8|9)\d{8}$/;
    return regex.test(phone);
}

function generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${dateStr}-${random}`;
}

function calculateShippingFee(address) {
    // Mock: Thực tế dùng API giao hàng (GHN, GHTK, ...)
    return 30000; // 30k per order
}

function calculateRiskScore(req, email) {
    let score = 0;
    
    // High risk: New email, anonymous IP
    if (isNewEmail(email)) score += 30;
    if (isVPNorProxy(req.ip)) score += 40;
    if (isSuspiciousPattern(email)) score += 20;
    
    return Math.min(score, 100);
}

async function sendOrderConfirmationEmail(email, order) {
    // Implementation...
}
```

#### ✅ Phương Pháp 2: Multi-Document Transactions (Nếu cần)

```javascript
/**
 * Nếu muốn EXTRA SAFETY + rollback tự động:
 * Dùng Transactions (yêu cầu Replica Set)
 * 
 * Nhưng với findOneAndUpdate() ở trên, Transaction không cần thiết
 * vì findOneAndUpdate() đã atomic
 */

async function createOrderWithTransaction(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { items, email, shipping } = req.body;
        
        // Tất cả operations sẽ commit hoặc rollback cùng lúc
        
        // 1. Update stock (atomic)
        for (const item of items) {
            await ModelProducts.findOneAndUpdate(
                {
                    _id: item.productId,
                    'variants.size': item.size,
                    'variants.quantity': { $gte: item.quantity }
                },
                {
                    $inc: {
                        'variants.$.quantity': -item.quantity,
                        totalStock: -item.quantity
                    }
                },
                { session, new: true }
            );
        }
        
        // 2. Create order
        const order = new ModelOrder({ /* ... */ });
        await order.save({ session });
        
        // 3. Clear cart
        await ModelCart.deleteOne({ user: email }, { session });
        
        // 4. Commit
        await session.commitTransaction();
        
        return res.json({ success: true, orderId: order._id });
        
    } catch (error) {
        // Rollback auto
        await session.abortTransaction();
        return res.status(500).json({ error: 'Order failed' });
        
    } finally {
        await session.endSession();
    }
}
```

#### ❌ Phương Pháp 3: Tránh (Không Khuyến Khích)

```javascript
/**
 * ❌ WRONG: Separate query + update (RACE CONDITION)
 */

async function createOrderUnsafe(req, res) {
    // ❌ BUG 1: Kiểm tra stock ở query riêng
    const product = await ModelProducts.findById(productId);
    const variant = product.variants.find(v => v.size === size);
    
    if (variant.quantity < orderQty) {
        return res.status(409).json({ error: 'Out of stock' });
    }
    // ⚠️ RACE CONDITION: Giữa đây, User B có thể mua hết stock!
    
    // ❌ BUG 2: Update ở query riêng
    variant.quantity -= orderQty;
    await product.save(); // Không atomic!
    
    // Order tạo thành công
    const order = new ModelOrder({ /* ... */ });
    await order.save();
}
```

---

## 5️⃣ Bảo Mật & Chống Spam

### 5.1 Rate Limiting

```javascript
/**
 * Middleware: Rate Limiting cho Checkout
 * Chống: Spam đặt hàng, DDoS, Tấn công tự động
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient();

// ========== RATE LIMITER RULES ==========

/**
 * 1. By IP Address (Global)
 * - 10 orders per hour per IP
 */
const checkoutLimiterByIp = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:checkout:ip:',
    }),
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 10,  // 10 requests
    message: 'Too many orders from this IP. Try again after 1 hour.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * 2. By User Email (Per-User)
 * - 5 orders per day per email
 */
const checkoutLimiterByEmail = (req, res, next) => {
    const email = req.body.email || 'anonymous';
    
    rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rl:checkout:email:',
        }),
        windowMs: 24 * 60 * 60 * 1000,  // 24 hours
        max: 5,  // 5 requests
        keyGenerator: () => email,
        message: 'Too many orders from this email. Try again tomorrow.',
    })(req, res, next);
};

/**
 * 3. By Session (Same user device)
 * - 3 orders per 10 minutes
 */
const checkoutLimiterBySession = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:checkout:session:',
    }),
    windowMs: 10 * 60 * 1000,  // 10 minutes
    max: 3,
    keyGenerator: (req) => req.sessionID || req.ip,
    message: 'Too many orders in short time. Please slow down.',
});

module.exports = {
    checkoutLimiterByIp,
    checkoutLimiterByEmail,
    checkoutLimiterBySession,
};
```

### 5.2 Input Validation & Sanitization

```javascript
const { body, validationResult } = require('express-validator');

/**
 * Validate Checkout Request
 */
const validateCheckoutRequest = [
    // Recipient name
    body('shipping.recipientName')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Recipient name must be 3-100 characters')
        .matches(/^[a-zA-Z0-9\s\u0100-\u01B0\u1EA0-\u1EFF]+$/)
        .withMessage('Invalid characters in name'),
    
    // Phone (Vietnamese)
    body('shipping.phone')
        .trim()
        .custom((value) => {
            if (!/^0(3|5|7|8|9)\d{8}$/.test(value)) {
                throw new Error('Invalid Vietnamese phone number');
            }
            return true;
        }),
    
    // Email
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email'),
    
    // Address
    body('shipping.address')
        .trim()
        .isLength({ min: 10, max: 200 })
        .withMessage('Address must be 10-200 characters')
        .matches(/^[a-zA-Z0-9\s,\u0100-\u01B0\u1EA0-\u1EFF/-]+$/)
        .withMessage('Invalid characters in address'),
    
    // Items validation
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least 1 item'),
    
    body('items.*.productId')
        .isMongoId()
        .withMessage('Invalid product ID'),
    
    body('items.*.quantity')
        .isInt({ min: 1, max: 100 })
        .withMessage('Quantity must be 1-100'),
    
    body('items.*.size')
        .trim()
        .isIn(['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'])
        .withMessage('Invalid size'),
    
    // Notes (optional, xóa special chars)
    body('shipping.notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .escape()
        .withMessage('Notes must be less than 500 characters'),
];

/**
 * Middleware: Check validation errors
 */
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            details: errors.array(),
        });
    }
    next();
};

module.exports = {
    validateCheckoutRequest,
    checkValidation,
};
```

### 5.3 Fraud Detection

```javascript
/**
 * Fraud Detection Module
 */

class FraudDetector {
    constructor() {
        this.suspiciousPatterns = [
            /test/i,
            /demo/i,
            /spam/i,
            /bomb/i,
        ];
        
        this.knownBadIPs = new Set();
        this.knownBadEmails = new Set();
    }
    
    /**
     * Calculate Risk Score (0-100)
     */
    calculateRiskScore(req, orderData) {
        let score = 0;
        
        // ========== IP-BASED CHECKS ==========
        if (this.isVPN(req.ip)) {
            score += 20;
        }
        if (this.knownBadIPs.has(req.ip)) {
            score += 50;
        }
        
        // ========== EMAIL-BASED CHECKS ==========
        const { email } = orderData;
        
        if (this.isSuspiciousEmail(email)) {
            score += 30;
        }
        if (this.knownBadEmails.has(email)) {
            score += 50;
        }
        if (!email.includes('@')) {
            score += 40;
        }
        
        // ========== PHONE-BASED CHECKS ==========
        const { phone } = orderData.shipping;
        
        if (this.isSuspiciousPhone(phone)) {
            score += 25;
        }
        if (this.isVietnamTestNumber(phone)) {
            score += 50; // Số giả mạo
        }
        
        // ========== ADDRESS-BASED CHECKS ==========
        const { address } = orderData.shipping;
        
        if (address.length < 15) {
            score += 15; // Địa chỉ quá ngắn
        }
        if (this.containsSuspiciousKeywords(address)) {
            score += 20;
        }
        
        // ========== ORDER-BASED CHECKS ==========
        const totalAmount = orderData.pricing?.totalAmount || 0;
        
        if (totalAmount > 100000000) {
            score += 10; // Order quá lớn
        }
        if (totalAmount === 0) {
            score += 50;
        }
        
        // ========== REQUEST-BASED CHECKS ==========
        if (this.hasMultipleFailedAttempts(req.ip)) {
            score += 30;
        }
        
        return Math.min(score, 100);
    }
    
    isSuspiciousEmail(email) {
        // Disposable email domains
        const disposableDomains = ['tempmail', '10minutemail', 'guerrillamail', 'mailinator'];
        return disposableDomains.some(d => email.includes(d));
    }
    
    isSuspiciousPhone(phone) {
        // Repeated digits: 0333333333
        if (/(\d)\1{8,}/.test(phone)) return true;
        return false;
    }
    
    isVietnamTestNumber(phone) {
        // Số test: 0000000000, 9999999999
        const testNumbers = ['0000000000', '1111111111', '9999999999'];
        return testNumbers.includes(phone);
    }
    
    containsSuspiciousKeywords(text) {
        return this.suspiciousPatterns.some(p => p.test(text));
    }
    
    isVPN(ip) {
        // Có thể dùng GeoIP API (MaxMind, etc)
        // Hoặc VPN IP database
        return false; // TODO: Implement
    }
    
    hasMultipleFailedAttempts(ip) {
        // Check Redis/Cache for failed attempts
        return false; // TODO: Implement
    }
}

module.exports = new FraudDetector();
```

### 5.4 Route với Rate Limiting

```javascript
// routes/checkout.js

const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/CheckoutController');
const { 
    checkoutLimiterByIp, 
    checkoutLimiterByEmail, 
    checkoutLimiterBySession 
} = require('../middlewares/rateLimiter');
const { 
    validateCheckoutRequest, 
    checkValidation 
} = require('../middlewares/validation');
const fraudDetector = require('../utils/fraudDetector');

/**
 * POST /api/checkout
 * Thanh toán COD
 * 
 * Middleware stack:
 * 1. Rate limit by IP
 * 2. Rate limit by Email
 * 3. Rate limit by Session
 * 4. Validate input
 * 5. Check fraud score
 * 6. Create order
 */

router.post(
    '/checkout',
    checkoutLimiterByIp,
    checkoutLimiterByEmail,
    checkoutLimiterBySession,
    validateCheckoutRequest,
    checkValidation,
    // Custom middleware: Fraud check
    (req, res, next) => {
        const riskScore = fraudDetector.calculateRiskScore(req, req.body);
        req.body._riskScore = riskScore;
        
        if (riskScore > 80) {
            return res.status(403).json({
                error: 'FRAUD_SUSPECTED',
                message: 'Your order has been flagged for review. Please contact support.',
            });
        }
        
        if (riskScore > 50) {
            // Flag but allow (admin review later)
            req.body._flagged = true;
        }
        
        next();
    },
    checkoutController.createOrder
);

module.exports = router;
```

---

## 6️⃣ Post-Checkout (Trang Thành Công)

### 6.1 Success Page Response

```javascript
/**
 * GET /payment-success?orderId=XXX
 * 
 * Response data:
 */

{
    "success": true,
    "order": {
        "orderId": "507f1f77bcf86cd799439011",
        "orderNumber": "ORD-20260522-ABC12",
        "status": "PENDING",
        "paymentStatus": "UNPAID",
        "createdAt": "2026-05-22T10:30:00Z",
        
        "items": [
            {
                "productName": "Nike Air Jordan 1 Retro",
                "size": "40",
                "color": "Black",
                "quantity": 1,
                "unitPrice": 2500000,
                "subtotal": 2500000,
                "productImage": "https://..."
            }
        ],
        
        "pricing": {
            "subtotal": 2500000,
            "shippingFee": 30000,
            "discountAmount": 0,
            "totalAmount": 2530000
        },
        
        "shipping": {
            "recipientName": "Nguyễn Văn A",
            "phone": "0912345678",
            "address": "123 Nguyễn Huệ, Q1, HCM",
            "notes": "Gõ chuông nếu không ai trả lời"
        },
        
        "estimatedDelivery": "2026-05-24", // +2 ngày
        "trackingUrl": "https://track.ghn.vn/..." // GHN, GHTK, etc
    }
}
```

### 6.2 Frontend Success Page Component

```javascript
// client/src/Pages/PaymentSuccess.js

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../Config/api';
import styles from '../Styles/PaymentsSuccess.module.scss';

function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const orderId = searchParams.get('orderId');
                if (!orderId) {
                    setError('Order ID not found');
                    setLoading(false);
                    return;
                }
                
                const response = await api.get(`/payment-success/${orderId}`);
                setOrder(response.data.order);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load order');
            } finally {
                setLoading(false);
            }
        };
        
        fetchOrder();
    }, [searchParams]);
    
    if (loading) return <div className={styles.loading}>Đang tải...</div>;
    if (error) return <div className={styles.error}>Lỗi: {error}</div>;
    if (!order) return <div className={styles.error}>Không tìm thấy đơn hàng</div>;
    
    return (
        <div className={styles.container}>
            {/* ========== HEADER ========== */}
            <div className={styles.header}>
                <div className={styles.successIcon}>✅</div>
                <h1>Đặt Hàng Thành Công!</h1>
                <p className={styles.subtitle}>
                    Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ sớm.
                </p>
            </div>
            
            {/* ========== ORDER NUMBER ========== */}
            <div className={styles.orderNumber}>
                <label>Mã Đơn Hàng:</label>
                <strong>{order.orderNumber}</strong>
                <button onClick={() => navigator.clipboard.writeText(order.orderNumber)}>
                    📋 Copy
                </button>
            </div>
            
            {/* ========== ORDER ITEMS ========== */}
            <div className={styles.section}>
                <h2>📦 Chi Tiết Sản Phẩm</h2>
                <table className={styles.itemsTable}>
                    <thead>
                        <tr>
                            <th>Sản Phẩm</th>
                            <th>Size</th>
                            <th>Số Lượng</th>
                            <th>Giá</th>
                            <th>Thành Tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.productName}</td>
                                <td>{item.size}</td>
                                <td>{item.quantity}</td>
                                <td>{item.unitPrice.toLocaleString()}đ</td>
                                <td>{item.subtotal.toLocaleString()}đ</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* ========== PRICING ========== */}
            <div className={styles.section}>
                <h2>💰 Tổng Tiền</h2>
                <div className={styles.pricing}>
                    <div className={styles.row}>
                        <span>Tạm tính:</span>
                        <strong>{order.pricing.subtotal.toLocaleString()}đ</strong>
                    </div>
                    <div className={styles.row}>
                        <span>Phí giao hàng:</span>
                        <strong>{order.pricing.shippingFee.toLocaleString()}đ</strong>
                    </div>
                    {order.pricing.discountAmount > 0 && (
                        <div className={styles.row}>
                            <span>Giảm giá:</span>
                            <strong>-{order.pricing.discountAmount.toLocaleString()}đ</strong>
                        </div>
                    )}
                    <div className={styles.total}>
                        <span>Tổng cộng:</span>
                        <strong className={styles.totalAmount}>
                            {order.pricing.totalAmount.toLocaleString()}đ
                        </strong>
                    </div>
                </div>
                <div className={styles.paymentNote}>
                    <strong>⚠️ Thanh Toán Khi Nhận Hàng (COD)</strong>
                    <p>Bạn sẽ thanh toán tiền khi nhận hàng từ shipper</p>
                </div>
            </div>
            
            {/* ========== SHIPPING INFO ========== */}
            <div className={styles.section}>
                <h2>🚚 Thông Tin Giao Hàng</h2>
                <div className={styles.shippingInfo}>
                    <p><strong>Người nhận:</strong> {order.shipping.recipientName}</p>
                    <p><strong>Điện thoại:</strong> {order.shipping.phone}</p>
                    <p><strong>Địa chỉ:</strong> {order.shipping.address}</p>
                    {order.shipping.notes && (
                        <p><strong>Ghi chú:</strong> {order.shipping.notes}</p>
                    )}
                    {order.estimatedDelivery && (
                        <p><strong>Dự kiến giao:</strong> {new Date(order.estimatedDelivery).toLocaleDateString('vi-VN')}</p>
                    )}
                </div>
            </div>
            
            {/* ========== TRACKING ========== */}
            {order.trackingUrl && (
                <div className={styles.section}>
                    <a 
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.trackingBtn}
                    >
                        📍 Theo dõi đơn hàng
                    </a>
                </div>
            )}
            
            {/* ========== CONFIRMATION EMAIL ========== */}
            <div className={styles.section}>
                <p className={styles.info}>
                    📧 Email xác nhận đã được gửi tới {order.userEmail}
                </p>
            </div>
            
            {/* ========== ACTIONS ========== */}
            <div className={styles.actions}>
                <button 
                    className={styles.btnPrimary}
                    onClick={() => navigate('/my-orders')}
                >
                    📋 Xem Đơn Hàng Của Tôi
                </button>
                <button 
                    className={styles.btnSecondary}
                    onClick={() => navigate('/')}
                >
                    🏠 Tiếp Tục Mua Sắm
                </button>
            </div>
        </div>
    );
}

export default PaymentSuccess;
```

### 6.3 Email Template

```html
<!-- Confirmation Email Template -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #4CAF50; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f5f5f5; }
        .total { font-size: 18px; font-weight: bold; color: #4CAF50; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; }
        .cod-badge { background: #FF9800; color: white; padding: 10px; border-radius: 4px; text-align: center; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ ĐẶT HÀNG THÀNH CÔNG</h1>
        </div>
        
        <div class="section">
            <p>Cảm ơn bạn đã đặt hàng!</p>
            <p><strong>Mã đơn hàng:</strong> {{orderNumber}}</p>
            <p><strong>Ngày đặt:</strong> {{createdAt}}</p>
        </div>
        
        <div class="section">
            <h3>📦 Chi Tiết Sản Phẩm</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Sản Phẩm</th>
                        <th>Size</th>
                        <th>Qty</th>
                        <th>Giá</th>
                    </tr>
                </thead>
                <tbody>
                    {{#items}}
                    <tr>
                        <td>{{productName}}</td>
                        <td>{{size}}</td>
                        <td>{{quantity}}</td>
                        <td>{{unitPrice}} đ</td>
                    </tr>
                    {{/items}}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h3>💰 Tổng Tiền</h3>
            <p>Tạm tính: <strong>{{subtotal}} đ</strong></p>
            <p>Phí giao hàng: <strong>{{shippingFee}} đ</strong></p>
            <p class="total">Tổng cộng: {{totalAmount}} đ</p>
        </div>
        
        <div class="cod-badge">
            ⚠️ THANH TOÁN KHI NHẬN HÀNG (COD)
            <br>Vui lòng chuẩn bị tiền {{totalAmount}} đ khi nhận hàng
        </div>
        
        <div class="section">
            <h3>🚚 Thông Tin Giao Hàng</h3>
            <p><strong>Người nhận:</strong> {{recipientName}}</p>
            <p><strong>Điện thoại:</strong> {{phone}}</p>
            <p><strong>Địa chỉ:</strong> {{address}}</p>
            <p><strong>Dự kiến giao:</strong> {{estimatedDelivery}}</p>
        </div>
        
        <div class="section" style="text-align: center;">
            <a href="{{trackingUrl}}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                📍 Theo dõi đơn hàng
            </a>
        </div>
        
        <div class="footer">
            <p>Cảm ơn bạn đã tin tưởng chúng tôi!</p>
            <p>Nếu có câu hỏi, vui lòng liên hệ: support@webshoe.com | 0123-456-789</p>
        </div>
    </div>
</body>
</html>
```

---

## 7️⃣ Pseudocode & Code Examples

### 7.1 Checkout Flow Pseudocode

```pseudocode
FUNCTION CreateOrder(checkoutRequest):
    
    # 1. AUTHENTICATION & AUTHORIZATION
    IF token exists:
        userId = ExtractUserIdFromToken(token)
        email = GetUserEmailByToken(token)
    ELSE:
        userId = NULL  // Guest checkout
        email = checkoutRequest.email
    
    # 2. INPUT VALIDATION
    IF NOT ValidatePhone(checkoutRequest.phone):
        RETURN Error("Invalid phone number")
    
    IF NOT ValidateEmail(email):
        RETURN Error("Invalid email")
    
    IF checkoutRequest.items.length == 0:
        RETURN Error("Cart is empty")
    
    # 3. FRAUD CHECK
    riskScore = CalculateRiskScore(request.ip, email)
    IF riskScore > 80:
        RETURN Error("Order flagged as fraud")
    
    # 4. BEGIN TRANSACTION
    transaction = StartTransaction()
    
    TRY:
        orderItems = []
        totalPrice = 0
        
        # 5. ATOMIC STOCK VERIFICATION & UPDATE
        FOR EACH item IN checkoutRequest.items:
            
            # Atomic operation: Check stock & reduce in one go
            product = FindOneAndUpdate(
                query: {
                    _id: item.productId,
                    variants.size: item.size,
                    variants.quantity >= item.quantity  // KEY: Check in query
                },
                update: {
                    $inc: {
                        variants.$.quantity: -item.quantity,
                        totalStock: -item.quantity
                    }
                },
                options: { new: true, session: transaction }
            )
            
            IF product == NULL:
                # Stock not available
                transaction.Rollback()
                RETURN Error("OUT_OF_STOCK", "Product not available")
            
            # Calculate subtotal
            subtotal = item.quantity * item.price
            totalPrice += subtotal
            
            # Add to order items
            orderItems.Append({
                productId: item.productId,
                productName: product.name,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: subtotal
            })
        
        # 6. CALCULATE FINAL PRICING
        shippingFee = CalculateShippingFee(checkoutRequest.address)
        discountAmount = ApplyPromoCode(checkoutRequest.promoCode) // Optional
        finalTotal = totalPrice + shippingFee - discountAmount
        
        # 7. CREATE ORDER
        orderNumber = GenerateOrderNumber()
        newOrder = Order({
            orderNumber: orderNumber,
            userId: userId,
            userEmail: email,
            shipping: checkoutRequest.shipping,
            items: orderItems,
            pricing: {
                subtotal: totalPrice,
                shippingFee: shippingFee,
                discountAmount: discountAmount,
                totalAmount: finalTotal
            },
            status: "PENDING",
            paymentStatus: "UNPAID",
            metadata: {
                ipAddress: request.ip,
                riskScore: riskScore,
                flaggedAsSpam: (riskScore > 50)
            }
        })
        
        SaveOrder(newOrder, transaction)
        
        # 8. CLEAR CART
        DeleteCart(email, transaction)
        
        # 9. COMMIT TRANSACTION
        transaction.Commit()
        
        # 10. POST-ORDER TASKS (Async, não block)
        SendEmailAsync(email, newOrder)
        LogOrderCreation(newOrder)
        
        # 11. RESPONSE
        RETURN Success({
            orderId: newOrder._id,
            orderNumber: newOrder.orderNumber,
            redirectUrl: "/payment-success?orderId=" + newOrder._id
        })
        
    CATCH error:
        transaction.Rollback()
        LogError(error)
        RETURN Error("ORDER_CREATION_FAILED", error.message)
    
    END TRY

END FUNCTION
```

### 7.2 Frontend Request Example (JSON)

```javascript
// POST /api/checkout
// Request body

{
    "email": "customer@example.com",
    "shipping": {
        "recipientName": "Nguyễn Văn A",
        "phone": "0912345678",
        "address": "123 Nguyễn Huệ, Quận 1, TP.HCM",
        "ward": "Bến Nghé",
        "district": "Quận 1",
        "province": "TP.HCM",
        "notes": "Gõ chuông nếu không ai trả lời"
    },
    "items": [
        {
            "productId": "507f1f77bcf86cd799439011",
            "productName": "Nike Air Jordan 1 Retro High OG Bred",
            "size": "40",
            "color": "Black",
            "quantity": 1,
            "price": 2500000,
            "img": "https://cdn.example.com/products/aj1-bred.jpg"
        },
        {
            "productId": "507f1f77bcf86cd799439012",
            "productName": "Adidas Yeezy 350 V2",
            "size": "39",
            "color": "Zebra",
            "quantity": 1,
            "price": 3200000,
            "img": "https://cdn.example.com/products/yeezy-zebra.jpg"
        }
    ],
    "promoCode": "SUMMER2026"  // Optional
}
```

### 7.3 Backend Controller (Improved)

```javascript
// controllers/CheckoutController.js

const ModelOrder = require('../models/ModelOrder');
const ModelProducts = require('../models/ModelProducts');
const ModelCart = require('../models/ModelCart');
const FraudDetector = require('../utils/fraudDetector');
const sendOrderConfirmationEmail = require('../SendMail/SendMailOrder');
const { jwtDecode } = require('jwt-decode');

class CheckoutController {
    
    /**
     * POST /api/checkout
     * Create new order (COD)
     */
    async createOrder(req, res) {
        const session = await mongoose.startSession();
        
        try {
            // ============ EXTRACT DATA ============
            const { items, shipping, email, promoCode, userAgent } = req.body;
            const ipAddress = req.ip;
            const token = req.cookies.Token;
            
            let userId = null;
            let userEmail = email;
            
            // ============ AUTHENTICATE (If logged in) ============
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    userId = decoded.id;
                    userEmail = decoded.email;
                } catch (err) {
                    // Guest checkout, ignored
                }
            }
            
            // ============ VALIDATION ============
            if (!items || items.length === 0) {
                return res.status(400).json({
                    error: 'EMPTY_CART',
                    message: 'Order must contain at least 1 item',
                });
            }
            
            if (!validateVietnamesePhone(shipping.phone)) {
                return res.status(400).json({
                    error: 'INVALID_PHONE',
                    message: 'Invalid Vietnamese phone number',
                });
            }
            
            if (!shipping.address || shipping.address.length < 10) {
                return res.status(400).json({
                    error: 'INVALID_ADDRESS',
                    message: 'Address too short',
                });
            }
            
            // ============ FRAUD CHECK ============
            const riskScore = FraudDetector.calculateRiskScore(
                { ip: ipAddress, userAgent },
                { email: userEmail, ...shipping }
            );
            
            if (riskScore > 80) {
                return res.status(403).json({
                    error: 'FRAUD_DETECTED',
                    message: 'Your order has been flagged. Please contact support.',
                });
            }
            
            const isFlagged = riskScore > 50;
            
            // ============ START TRANSACTION ============
            session.startTransaction();
            
            let totalAmount = 0;
            let orderItems = [];
            
            // ============ PROCESS EACH ITEM ============
            for (const item of items) {
                const { productId, size, color, quantity, price } = item;
                
                // ATOMIC: Find product, verify stock, and reduce
                const updatedProduct = await ModelProducts.findOneAndUpdate(
                    {
                        _id: productId,
                        'variants.size': size,
                        'variants.color': color,
                        'variants.quantity': { $gte: quantity },
                    },
                    {
                        $inc: {
                            'variants.$.quantity': -quantity,
                            'totalStock': -quantity,
                        }
                    },
                    {
                        new: true,
                        session,
                    }
                );
                
                if (!updatedProduct) {
                    await session.abortTransaction();
                    return res.status(409).json({
                        error: 'INSUFFICIENT_STOCK',
                        message: `Product not available or out of stock`,
                        product: { productId, size, color }
                    });
                }
                
                // Build order item
                const subtotal = quantity * price;
                totalAmount += subtotal;
                
                orderItems.push({
                    productId,
                    productName: updatedProduct.name,
                    productSlug: updatedProduct.slug,
                    productImage: updatedProduct.img?.[0] || '',
                    size,
                    color: color || '',
                    quantity,
                    unitPrice: price,
                    subtotal,
                    discountPercentage: updatedProduct.discountPercentage || 0,
                });
            }
            
            // ============ CALCULATE PRICING ============
            const shippingFee = this.calculateShippingFee(shipping.address);
            let discountAmount = 0;
            
            if (promoCode) {
                discountAmount = await this.validateAndApplyPromo(promoCode, totalAmount);
            }
            
            const finalTotal = totalAmount + shippingFee - discountAmount;
            
            // ============ CREATE ORDER ============
            const orderNumber = this.generateOrderNumber();
            
            const newOrder = new ModelOrder({
                orderNumber,
                userId: userId || undefined,
                userEmail,
                shipping: {
                    recipientName: shipping.recipientName,
                    phone: shipping.phone,
                    address: shipping.address,
                    ward: shipping.ward || '',
                    district: shipping.district || '',
                    province: shipping.province || '',
                    notes: shipping.notes || '',
                },
                items: orderItems,
                pricing: {
                    subtotal: totalAmount,
                    shippingFee,
                    discountAmount,
                    totalAmount: finalTotal,
                },
                status: 'PENDING',
                paymentStatus: 'UNPAID',
                deliveryStatus: 'NOT_STARTED',
                metadata: {
                    ipAddress,
                    userAgent,
                    riskScore,
                    flaggedAsSpam: isFlagged,
                    notes: [],
                },
            });
            
            await newOrder.save({ session });
            
            // ============ DELETE CART ============
            await ModelCart.deleteOne({ user: userEmail }, { session });
            
            // ============ COMMIT TRANSACTION ============
            await session.commitTransaction();
            
            // ============ POST-ORDER ACTIONS (Async) ============
            this.sendOrderEmail(userEmail, newOrder).catch(err => {
                console.error('Email send failed:', err);
            });
            
            // ============ RESPONSE ============
            return res.status(201).json({
                success: true,
                orderId: newOrder._id,
                orderNumber: newOrder.orderNumber,
                totalAmount: finalTotal,
                message: 'Order created successfully',
                redirectUrl: `/payment-success?orderId=${newOrder._id}`,
            });
            
        } catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            
            console.error('Checkout error:', error);
            return res.status(500).json({
                error: 'ORDER_CREATION_FAILED',
                message: 'Failed to create order. Please try again.',
            });
            
        } finally {
            await session.endSession();
        }
    }
    
    /**
     * GET /api/payment-success/:orderId
     */
    async getPaymentSuccess(req, res) {
        try {
            const { orderId } = req.params;
            
            const order = await ModelOrder.findById(orderId);
            
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            
            return res.json({
                success: true,
                order,
                estimatedDelivery: new Date(
                    Date.now() + 2 * 24 * 60 * 60 * 1000 // +2 days
                ).toISOString().split('T')[0],
                trackingUrl: `https://track.ghn.vn/?tracking_id=${order.orderNumber}`,
            });
            
        } catch (error) {
            console.error('Get payment success error:', error);
            return res.status(500).json({
                error: 'FAILED_TO_RETRIEVE_ORDER',
            });
        }
    }
    
    // ============ HELPER METHODS ============
    
    generateOrderNumber() {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        return `ORD-${dateStr}-${random}`;
    }
    
    calculateShippingFee(address) {
        // Mock: Could integrate with GHN, GHTK API
        return 30000;
    }
    
    async validateAndApplyPromo(promoCode, amount) {
        // TODO: Implement promo code validation
        return 0;
    }
    
    async sendOrderEmail(email, order) {
        await sendOrderConfirmationEmail(email, order);
    }
}

module.exports = new CheckoutController();
```

### 7.4 MongoDB Queries Reference

```javascript
/**
 * MongoDB Queries - Checkout Related
 */

// ✅ 1. ATOMIC: Reduce stock safely
db.products.findOneAndUpdate(
    {
        _id: ObjectId("507f1f77bcf86cd799439011"),
        'variants.size': '40',
        'variants.quantity': { $gte: 1 }
    },
    {
        $inc: {
            'variants.$.quantity': -1,
            'totalStock': -1
        }
    }
)

// ✅ 2. Find order with all details
db.orders.findOne({
    orderNumber: 'ORD-20260522-ABC12'
})

// ✅ 3. Get user orders (paginated)
db.orders
    .find({ userEmail: 'customer@example.com' })
    .sort({ 'timeline.createdAt': -1 })
    .limit(10)
    .skip(0)

// ✅ 4. Find flagged orders (fraud check)
db.orders.find({
    'metadata.flaggedAsSpam': true,
    'timeline.createdAt': {
        $gte: ISODate('2026-05-20T00:00:00Z')
    }
})

// ✅ 5. Orders pending confirmation (for admin)
db.orders
    .find({ status: 'PENDING' })
    .sort({ 'timeline.createdAt': 1 })

// ✅ 6. Orders by date range (for reports)
db.orders
    .find({
        'timeline.createdAt': {
            $gte: ISODate('2026-05-01T00:00:00Z'),
            $lte: ISODate('2026-05-31T23:59:59Z')
        }
    })
    .aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$pricing.totalAmount' }
            }
        }
    ])

// ✅ 7. Total stock per product
db.products.find(
    { _id: ObjectId("507f1f77bcf86cd799439011") },
    { name: 1, totalStock: 1, 'variants': 1 }
)
```

---

## 📊 Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      CHECKOUT ARCHITECTURE                    │
└────────────────────────────────────────────────────────────────┘

CLIENT (React)
    │
    ├─ Validation Layer
    │  ├─ Phone format
    │  ├─ Email format
    │  ├─ Address length
    │  └─ Item quantity
    │
    └─ POST /api/checkout
       │
       ▼
────────────────────────────────────────────────────────────────

API GATEWAY (Express Middleware)
    │
    ├─ Rate Limiting
    │  ├─ By IP (10/hour)
    │  ├─ By Email (5/day)
    │  └─ By Session (3/10min)
    │
    ├─ Input Validation
    │  ├─ Vietnamese phone
    │  ├─ Email normalization
    │  ├─ XSS prevention
    │  └─ SQL injection prevention
    │
    └─ Fraud Detection
       ├─ Risk scoring
       ├─ VPN detection
       ├─ Email validation
       └─ Pattern matching
       │
       ▼
────────────────────────────────────────────────────────────────

CHECKOUT SERVICE (Node.js)
    │
    ├─ Transaction Start
    │  └─ MongoDB Session
    │
    ├─ For Each Item:
    │  ├─ findOneAndUpdate() [ATOMIC]
    │  ├─ Verify stock >= qty
    │  ├─ Reduce inventory
    │  └─ Build order item
    │
    ├─ Calculate Pricing
    │  ├─ Subtotal
    │  ├─ Shipping fee
    │  ├─ Discount (if promo)
    │  └─ Final total
    │
    ├─ Create Order
    │  └─ Insert to orders collection
    │
    ├─ Delete Cart
    │  └─ Remove from carts collection
    │
    └─ Transaction Commit/Abort
       │
       ▼
────────────────────────────────────────────────────────────────

DATABASE (MongoDB)
    │
    ├─ products
    │  ├─ _id
    │  ├─ name, slug, price
    │  ├─ variants: [{ size, color, quantity }]
    │  └─ totalStock (denormalized)
    │
    ├─ orders
    │  ├─ orderNumber (unique)
    │  ├─ items: [{ productId, qty, price }]
    │  ├─ shipping: { name, phone, address }
    │  ├─ pricing: { subtotal, shipping, total }
    │  ├─ status (PENDING, CONFIRMED, ...)
    │  └─ metadata: { ipAddress, riskScore }
    │
    └─ carts
       ├─ user (email)
       └─ products: [{ productId, qty }]
       │
       ▼
────────────────────────────────────────────────────────────────

POST-ORDER TASKS (Async)
    │
    ├─ Send Email
    │  ├─ Order confirmation
    │  ├─ Item details
    │  └─ Delivery estimate
    │
    ├─ Log Activity
    │  ├─ Order creation
    │  ├─ User metrics
    │  └─ Fraud metrics
    │
    └─ Cache Updates
       └─ Inventory cache invalidation
       │
       ▼
────────────────────────────────────────────────────────────────

FRONTEND RESPONSE
    │
    └─ Redirect to Success Page
       ├─ Order number
       ├─ Items purchased
       ├─ Total amount
       ├─ Shipping info
       ├─ Email confirmation
       └─ Tracking link
```

---

## ✅ Checklist: Triển khai Checkout

- [ ] Design & Approve Order Schema
- [ ] Design & Approve Product Variants Structure
- [ ] Implement Order Model (Mongoose)
- [ ] Implement Rate Limiting Middleware
- [ ] Implement Input Validation
- [ ] Implement Fraud Detection
- [ ] Implement Checkout Controller (with Transactions)
- [ ] Implement Payment Success Page (Frontend)
- [ ] Implement Order Confirmation Email
- [ ] Add Indexes to Collections
- [ ] Setup Error Handling & Logging
- [ ] Load Testing (Race Condition Test)
- [ ] Security Audit (OWASP Top 10)
- [ ] UAT with Real Users
- [ ] Monitor & Optimize Performance
- [ ] Setup Monitoring Alerts

---

**Thiết kế này tuân thủ:**
- ✅ ACID Principles (via MongoDB Transactions)
- ✅ OWASP Security Standards
- ✅ Scalability Best Practices
- ✅ Vietnamese Business Rules (COD, Phone Format)
- ✅ Performance Optimization (Indexes, Denormalization)

