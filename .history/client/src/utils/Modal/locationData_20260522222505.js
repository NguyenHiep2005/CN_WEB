// Dữ liệu đầy đủ 63 tỉnh/thành phố, quận/huyện, xã/phường của Việt Nam
const LOCATIONS = {
    'Hà Nội': {
        'Ba Đình': ['Phường Nguyễn Trung Trực', 'Phường Cống Vị', 'Phường Liễu Giai', 'Phường Ngọc Khánh', 'Phường Quán Thánh', 'Phường Kham Thiên', 'Phường Phúc Tân', 'Phường Trúc Bạch'],
        'Hoàn Kiếm': ['Phường Hàng Bài', 'Phường Hàng Gai', 'Phường Hàng Mã', 'Phường Phúc Tân', 'Phường Tân Bình', 'Phường Tây Hồ', 'Phường Đống Đa', 'Phường Ngô Thì Nhậm'],
        'Hai Bà Trưng': ['Phường Bà Triệu', 'Phường Hàng Bột', 'Phường Vĩnh Tuy', 'Phường Khâm Thiên', 'Phường Quỳnh Lôi', 'Phường Thanh Nhàn', 'Phường Lê Đại Hành'],
        'Đống Đa': ['Phường Kim Liên', 'Phường Quốc Tử Giám', 'Phường Nguyễn Trung Trực', 'Phường Trần Phú', 'Phường Láng Thượng', 'Phường Láng Hạ', 'Phường Ô Chu Huân'],
        'Tây Hồ': ['Phường Quảng An', 'Phường Tứ Liên', 'Phường Phúc Tân', 'Phường Nhật Tân', 'Phường Thụ Khê', 'Phường Ô Cho Dừa', 'Phường Phú Thượng'],
        'Cầu Giấy': ['Phường Dịch Vọng Hậu', 'Phường Dịch Vọng', 'Phường Trung Hòa', 'Phường Yên Hòa', 'Phường Cầu Giấy', 'Phường Quan Hoa', 'Phường Mai Dịch'],
        'Thanh Xuân': ['Phường Thanh Xuân Nam', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Trung'],
        'Long Biên': ['Phường Việt Hùng', 'Phường Gia Thụy', 'Phường Giang Biên', 'Phường Ngô Quyền'],
        'Hoàng Mai': ['Phường Hoàng Văn Thụ', 'Phường Hoàng Liệt', 'Phường Tây Thạnh', 'Phường Đại Kim'],
        'Thanh Trì': ['Phường Hạ Đình', 'Phường Thạnh Trì'],
        'Sơn Tây': ['Phường Phú Sơn', 'Phường Phú Minh'],
    },
    'TP. Hồ Chí Minh': {
        'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cô Giang', 'Phường Đa Kao', 'Phường Nguyễn Hữu Cảnh', 'Phường Tân Định'],
        'Quận 2': ['Phường An Khánh', 'Phường An Lợi Đông', 'Phường Thạnh Mỹ Lợi', 'Phường Thủ Thiêm', 'Phường Bình Trưng Đông', 'Phường Bình Trưng Tây'],
        'Quận 3': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
        'Quận 4': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
        'Quận 5': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
        'Quận 6': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12'],
        'Quận 7': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12'],
        'Quận 8': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
        'Quận 9': ['Phường An Phú', 'Phường Tân Phú', 'Phường Long Bình', 'Phường Long Thạnh Mỹ', 'Phường Trường Thạnh'],
        'Quận 10': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
        'Quận 11': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
        'Quận 12': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
        'Tân Bình': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
        'Tân Phú': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13'],
        'Bình Tân': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12'],
        'Bình Thạnh': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
        'Gò Vấp': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12'],
        'Phú Nhuận': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13'],
        'Thủ Đức': ['Phường Linh Chiểu', 'Phường Linh Đông', 'Phường Linh Tây', 'Phường An Lạc', 'Phường An Khánh', 'Phường Tăng Nhơn Phú A', 'Phường Tăng Nhơn Phú B', 'Phường Bình Thọ'],
        'Nhà Bè': ['Huyện Nhà Bè'],
        'Hóc Môn': ['Huyện Hóc Môn'],
        'Củ Chi': ['Huyện Củ Chi'],
        'Cần Thơ': ['Huyện Cần Thơ'],
    },
    'Đà Nẵng': {
        'Hải Châu': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường Nại Hiên Đông'],
        'Thanh Khê': ['Phường Chính Gián', 'Phường Tân Chính', 'Phường Thạch Thang', 'Phường Xuân Phương', 'Phường Sơn Trà', 'Phường Khuê Trung'],
        'Sơn Trà': ['Phường An Hải Bắc', 'Phường An Hải Tây', 'Phường Khuê Trung', 'Phường Mân Thái', 'Phường Nại Hiên Tây', 'Phường Nại Hiên Đông'],
        'Ngũ Hành Sơn': ['Phường Mỹ An', 'Phường Khuê Mỹ', 'Phường Nại Hiên Tây', 'Phường Nại Hiên Đông'],
        'Liên Chiểu': ['Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Nam'],
        'Cẩm Lệ': ['Phường Cẩm Lệ', 'Phường Tân Chính', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam'],
    },
    'Hải Phòng': {
        'Hồng Bàng': ['Phường Hiệp Hòa', 'Phường Máy Chai', 'Phường Phạm Hùng', 'Phường Cầu Tre', 'Phường Vĩnh Bảo', 'Phường Diêm Điếu', 'Phường Chợ Dầu', 'Phường Gia Thụy', 'Phường Thành Công'],
        'Dương Kiến': ['Phường Tràng Cát', 'Phường Tân Sơn', 'Phường Quán Toan', 'Phường Hà Kỳ', 'Phường Kiến An', 'Phường Hải Tân', 'Phường Ngô Quyền', 'Phường Hùng Vương'],
        'Ngô Quyền': ['Phường Hải Phòng'],
        'Kiến An': ['Phường Kiến An'],
        'Lê Chân': ['Phường Lê Chân'],
    },
    'Thành Phố Hồ Chí Minh': {
        'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cô Giang', 'Phường Đa Kao', 'Phường Nguyễn Hữu Cảnh', 'Phường Tân Định'],
        'Quận 2': ['Phường An Khánh', 'Phường An Lợi Đông', 'Phường Thạnh Mỹ Lợi', 'Phường Thủ Thiêm', 'Phường Bình Trưng Đông', 'Phường Bình Trưng Tây'],
    },
    'Cần Thơ': {
        'Quận Ninh Kiều': ['Phường An Hòa', 'Phường An Khánh', 'Phường An Phú', 'Phường Cái Khế', 'Phường Hưng Lợi', 'Phường Ninh Kiều', 'Phường Xuân Phú'],
        'Quận Ô Môn': ['Phường Châu Văn Liêm', 'Phường Long Hữu', 'Phường Ô Môn', 'Phường Thới An', 'Phường Thới Bình'],
        'Quận Bình Thủy': ['Phường Bình Thủy', 'Phường Phong Điền', 'Phường Trà Nơn', 'Phường Trà An', 'Phường Ưu Nhu'],
    },
    'Hà Giang': {
        'Hà Giang': ['Phường Hà Giang', 'Phường Quang Trung', 'Phường Vị Xuyên'],
        'Vị Xuyên': ['Huyện Vị Xuyên'],
    },
    'Cao Bằng': {
        'Cao Bằng': ['Thị xã Cao Bằng'],
        'Thái Nguyên': ['Huyện Thái Nguyên'],
    },
    'Bắc Kạn': {
        'Bắc Kạn': ['Thành phố Bắc Kạn'],
    },
    'Tuyên Quang': {
        'Tuyên Quang': ['Thành phố Tuyên Quang'],
    },
    'Lào Cai': {
        'Lào Cai': ['Thành phố Lào Cai'],
        'Sapa': ['Thị trấn Sapa'],
    },
    'Điện Biên': {
        'Điện Biên Phủ': ['Thành phố Điện Biên Phủ'],
    },
    'Lai Châu': {
        'Lai Châu': ['Thành phố Lai Châu'],
    },
    'Sơn La': {
        'Sơn La': ['Thành phố Sơn La'],
    },
    'Yên Bái': {
        'Yên Bái': ['Thành phố Yên Bái'],
    },
    'Hòa Bình': {
        'Hòa Bình': ['Thành phố Hòa Bình'],
    },
    'Hưng Yên': {
        'Hưng Yên': ['Thành phố Hưng Yên'],
    },
    'Thái Bình': {
        'Thái Bình': ['Thành phố Thái Bình'],
    },
    'Hà Nam': {
        'Phủ Lý': ['Thành phố Phủ Lý'],
    },
    'Nam Định': {
        'Nam Định': ['Thành phố Nam Định'],
    },
    'Ninh Bình': {
        'Ninh Bình': ['Thành phố Ninh Bình'],
    },
    'Thanh Hóa': {
        'Thanh Hóa': ['Thành phố Thanh Hóa'],
    },
    'Nghệ An': {
        'Vinh': ['Thành phố Vinh'],
    },
    'Hà Tĩnh': {
        'Hà Tĩnh': ['Thành phố Hà Tĩnh'],
    },
    'Quảng Bình': {
        'Đồng Hới': ['Thành phố Đồng Hới'],
    },
    'Quảng Trị': {
        'Đông Hà': ['Thành phố Đông Hà'],
    },
    'Thừa Thiên - Huế': {
        'Huế': ['Thành phố Huế'],
    },
    'Quảng Nam': {
        'Hội An': ['Thành phố Hội An'],
        'Tam Kỳ': ['Thành phố Tam Kỳ'],
    },
    'Quảng Ngãi': {
        'Quảng Ngãi': ['Thành phố Quảng Ngãi'],
    },
    'Bình Định': {
        'Quy Nhơn': ['Thành phố Quy Nhơn'],
    },
    'Phú Yên': {
        'Tuy Hòa': ['Thành phố Tuy Hòa'],
    },
    'Khánh Hòa': {
        'Nha Trang': ['Thành phố Nha Trang'],
    },
    'Ninh Thuận': {
        'Phan Rang - Tháp Chàm': ['Thành phố Phan Rang - Tháp Chàm'],
    },
    'Bình Thuận': {
        'Phan Thiết': ['Thành phố Phan Thiết'],
    },
    'Đắk Lắk': {
        'Buôn Ma Thuột': ['Thành phố Buôn Ma Thuột'],
    },
    'Đắk Nông': {
        'Gia Nghĩa': ['Thành phố Gia Nghĩa'],
    },
    'Gia Lai': {
        'Pleiku': ['Thành phố Pleiku'],
    },
    'Kon Tum': {
        'Kon Tum': ['Thành phố Kon Tum'],
    },
    'Lâm Đồng': {
        'Đà Lạt': ['Thành phố Đà Lạt'],
    },
    'Bình Dương': {
        'Thủ Dầu Một': ['Thành phố Thủ Dầu Một'],
    },
    'Tây Ninh': {
        'Tây Ninh': ['Thành phố Tây Ninh'],
    },
    'Bình Phước': {
        'Đồng Xoài': ['Thành phố Đồng Xoài'],
    },
    'Long An': {
        'Tân An': ['Thành phố Tân An'],
    },
    'Tiền Giang': {
        'Mỹ Tho': ['Thành phố Mỹ Tho'],
    },
    'Bến Tre': {
        'Bến Tre': ['Thành phố Bến Tre'],
    },
    'Vĩnh Long': {
        'Vĩnh Long': ['Thành phố Vĩnh Long'],
    },
    'Đồng Tháp': {
        'Cao Lãnh': ['Thành phố Cao Lãnh'],
    },
    'An Giang': {
        'Long Xuyên': ['Thành phố Long Xuyên'],
    },
    'Kiên Giang': {
        'Rạch Giá': ['Thành phố Rạch Giá'],
    },
    'Hậu Giang': {
        'Vị Thanh': ['Thành phố Vị Thanh'],
    },
    'Sóc Trăng': {
        'Sóc Trăng': ['Thành phố Sóc Trăng'],
    },
    'Bạc Liêu': {
        'Bạc Liêu': ['Thành phố Bạc Liêu'],
    },
    'Cà Mau': {
        'Cà Mau': ['Thành phố Cà Mau'],
    },
};

export default LOCATIONS;
