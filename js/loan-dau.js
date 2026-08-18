// ====================================================================
// loan-dau.js
// Module Loan Đầu — Khảo sát ngoại cảnh thực tế quanh nhà
// Phiên bản 2: Nâng cấp công cụ khảo sát
//
// V2 giữ nguyên V1:
//   - Lưới 9 cung xoay theo hướng nhà (hướng nhà luôn ở 12 giờ)
//   - Logic xoay dùng BEARING_CUA_CUNG + REL_TO_SLOT từ shared.js
//   - Lọc 3 Sơn thuộc cung đang chọn (dùng DS24_SON.cung)
//   - Cơ chế thêm/sửa/xóa, chọn cung, reset
//
// V2 bổ sung:
//   - Object khảo sát có cấu trúc đầy đủ (vị trí, quy mô, hình thế,
//     động/tĩnh, thủy, đường, ghi chú)
//   - FORM THÔNG MINH theo LOAN_DAU_SCHEMA (theo loại đối tượng)
//   - Trạng thái "Đã khảo sát" cho từng cung
//   - Khu vực Tổng quan khảo sát
//   - Card tóm tắt + Chi tiết / Sửa / Xóa
//   - Minh Đường V2 (phạm vi, độ sâu, địa hình, độ thoáng...)
//
// V2 KHÔNG:
//   - Không lưu Hồ Sơ Nhà
//   - Không localStorage
//   - Không export/import
//   - Không tự luận cát/hung
//   - Không phá các module hiện tại
// ====================================================================
(function () {
    'use strict';

    // ====================================================================
    // 1. DANH SÁCH 9 CUNG (chỉ mapping UI cho Loan Đầu)
    // ====================================================================
    var LOAN_DAU_9_CUNG = [
        { index: 0, ten: "Tây Bắc", kyHieu: "Càn" },
        { index: 1, ten: "Bắc",     kyHieu: "Khảm" },
        { index: 2, ten: "Đông Bắc",kyHieu: "Cấn" },
        { index: 3, ten: "Tây",     kyHieu: "Đoài" },
        { index: 4, ten: "Trung Cung", kyHieu: "Trung" },
        { index: 5, ten: "Đông",    kyHieu: "Chấn" },
        { index: 6, ten: "Tây Nam", kyHieu: "Khôn" },
        { index: 7, ten: "Nam",     kyHieu: "Ly" },
        { index: 8, ten: "Đông Nam",kyHieu: "Tốn" }
    ];

    // ====================================================================
    // 1b. XOAY 9 CUNG THEO HƯỚNG NHÀ
    // GIỮ NGUYÊN V1. Không viết lại. Không thay đổi.
    // ====================================================================
    function layBangXoayCung() {
        return {
            bearing: (typeof BEARING_CUA_CUNG !== "undefined") ? BEARING_CUA_CUNG : {
                "Khảm": 0, "Cấn": 45, "Chấn": 90, "Tốn": 135,
                "Ly": 180, "Khôn": 225, "Đoài": 270, "Càn": 315
            },
            relToSlot: (typeof REL_TO_SLOT !== "undefined") ? REL_TO_SLOT : {
                0: 1, 45: 2, 90: 5, 135: 8, 180: 7, 225: 6, 270: 3, 315: 0
            }
        };
    }

    // Lấy hướng nhà hiện tại — ưu tiên biến huongHienTai do shared.js quản lý.
    // Fallback: đọc từ input #doSoTay (nguồn hướng chính của app).
    function layHuongNhaHienTai() {
        if (typeof window.huongHienTai === "number" && !isNaN(window.huongHienTai)) {
            return window.huongHienTai;
        }
        if (typeof huongHienTai !== "undefined" && typeof huongHienTai === "number" && !isNaN(huongHienTai)) {
            return huongHienTai;
        }
        var el = document.getElementById("doSoTay");
        if (el) {
            var v = parseFloat(el.value);
            if (!isNaN(v)) return v;
        }
        return 180;
    }

    // Tính slot hiển thị trên lưới 3x3 cho một quái dựa vào hướng nhà.
    // Trung Cung (kyHieu "Trung") luôn nằm giữa (slot 4), không có slot xoay.
    function laySlotCungTheoKyHieu(kyHieu, huongNha) {
        if (kyHieu === "Trung") return 4;
        var bang = layBangXoayCung();
        var bearing = bang.bearing[kyHieu];
        if (bearing === undefined) return null;
        var huong = (typeof huongNha === "number") ? huongNha : layHuongNhaHienTai();
        var rel = ((bearing - huong) % 360 + 360) % 360;
        rel = Math.round(rel / 45) * 45 % 360;
        var slot = bang.relToSlot[rel];
        return (slot !== undefined) ? slot : null;
    }

    // ====================================================================
    // 2. DANH MỤC LOẠI NGOẠI CẢNH (theo đặc tả V2)
    // ====================================================================
    var LOAN_DAU_DANH_MUC = {
        // A. Sơn / Địa hình
        son: [
            { value: "nui", label: "Núi", icon: "⛰️", nhom: "son" },
            { value: "doi", label: "Đồi", icon: "⛰️", nhom: "son" },
            { value: "go", label: "Gò", icon: "⛰️", nhom: "son" },
            { value: "dat-cao", label: "Đất cao", icon: "⛰️", nhom: "son" },
            { value: "nha-cao", label: "Nhà cao", icon: "⛰️", nhom: "son" },
            { value: "toa-nha", label: "Tòa nhà", icon: "⛰️", nhom: "son" },
            { value: "cong-trinh-cao", label: "Công trình cao", icon: "⛰️", nhom: "son" },
            { value: "vet-dat", label: "Vách", icon: "⛰️", nhom: "son" },
            { value: "tuong-cao", label: "Tường cao", icon: "⛰️", nhom: "son" }
        ],
        // B. Thủy
        thuy: [
            { value: "song", label: "Sông", icon: "💧", nhom: "thuy" },
            { value: "suoi", label: "Suối", icon: "💧", nhom: "thuy" },
            { value: "kenh", label: "Kênh", icon: "💧", nhom: "thuy" },
            { value: "muong", label: "Mương", icon: "💧", nhom: "thuy" },
            { value: "ao", label: "Ao", icon: "💧", nhom: "thuy" },
            { value: "ho", label: "Hồ", icon: "💧", nhom: "thuy" },
            { value: "dam", label: "Đầm", icon: "💧", nhom: "thuy" },
            { value: "bien", label: "Biển", icon: "💧", nhom: "thuy" },
            { value: "mat-nuoc", label: "Mặt nước", icon: "💧", nhom: "thuy" },
            { value: "nuoc-tu", label: "Nước tụ", icon: "💧", nhom: "thuy" },
            { value: "nuoc-chay", label: "Nước chảy", icon: "💧", nhom: "thuy" }
        ],
        // C. Đường
        duong: [
            { value: "duong-lon", label: "Đường lớn", icon: "🛣️", nhom: "duong" },
            { value: "duong-nho", label: "Đường nhỏ", icon: "🛣️", nhom: "duong" },
            { value: "ngo", label: "Ngõ", icon: "🛣️", nhom: "duong" },
            { value: "hem", label: "Hẻm", icon: "🛣️", nhom: "duong" },
            { value: "duong-cong", label: "Đường cong", icon: "🛣️", nhom: "duong" },
            { value: "duong-thang", label: "Đường thẳng", icon: "🛣️", nhom: "duong" },
            { value: "nga-ba", label: "Ngã ba", icon: "🛣️", nhom: "duong" },
            { value: "nga-tu", label: "Ngã tư", icon: "🛣️", nhom: "duong" },
            { value: "cau", label: "Cầu", icon: "🛣️", nhom: "duong" }
        ],
        // D. Công trình
        congTrinh: [
            { value: "nha", label: "Nhà", icon: "🏢", nhom: "cong-trinh" },
            { value: "nha-cao-tang", label: "Nhà cao tầng", icon: "🏢", nhom: "cong-trinh" },
            { value: "kho", label: "Kho", icon: "🏢", nhom: "cong-trinh" },
            { value: "xuong", label: "Xưởng", icon: "🏢", nhom: "cong-trinh" },
            { value: "tuong", label: "Tường", icon: "🏢", nhom: "cong-trinh" },
            { value: "cong", label: "Cổng", icon: "🏢", nhom: "cong-trinh" },
            { value: "cong-trinh-khac", label: "Công trình khác", icon: "🏢", nhom: "cong-trinh" }
        ],
        // E. Cây cối / Cảnh quan
        canhQuan: [
            { value: "cay-lon", label: "Cây lớn", icon: "🌳", nhom: "canh-quan" },
            { value: "hang-cay", label: "Hàng cây", icon: "🌳", nhom: "canh-quan" },
            { value: "rung", label: "Rừng", icon: "🌳", nhom: "canh-quan" },
            { value: "vuon", label: "Vườn", icon: "🌳", nhom: "canh-quan" },
            { value: "cong-vien", label: "Công viên", icon: "🌳", nhom: "canh-quan" },
            { value: "bai-dat-trong", label: "Khoảng đất trống", icon: "🌳", nhom: "canh-quan" }
        ],
        // F. Hình thế đặc biệt
        hinhThe: [
            { value: "duong-dam", label: "Đường đâm", icon: "⚠️", nhom: "hinh-the" },
            { value: "goc-nhon", label: "Góc nhọn", icon: "⚠️", nhom: "hinh-the" },
            { value: "vat-the-chan", label: "Vật thể chắn", icon: "⚠️", nhom: "hinh-the" },
            { value: "khoang-trong", label: "Khoảng trống", icon: "⚠️", nhom: "hinh-the" },
            { value: "hinh-the-loi", label: "Địa hình lồi", icon: "⚠️", nhom: "hinh-the" },
            { value: "hinh-the-lom", label: "Địa hình lõm", icon: "⚠️", nhom: "hinh-the" },
            { value: "hinh-the-dac-biet", label: "Hình thế đặc biệt", icon: "⚠️", nhom: "hinh-the" }
        ]
    };

    // ====================================================================
    // 3. DANH SÁCH THUỘC TÍNH (theo đặc tả V2)
    // ====================================================================
    var LOAN_DAU_KHOANG_CACH = [
        { value: "", label: "— Không xác định —" },
        { value: "rat-gan", label: "Rất gần" },
        { value: "gan", label: "Gần" },
        { value: "trung-binh", label: "Trung bình" },
        { value: "xa", label: "Xa" },
        { value: "rat-xa", label: "Rất xa" }
    ];

    var LOAN_DAU_PHIA = [
        { value: "", label: "— Không xác định —" },
        { value: "trai", label: "Trái" },
        { value: "giua", label: "Giữa" },
        { value: "phai", label: "Phải" },
        { value: "khong-xac-dinh", label: "Không xác định" }
    ];

    var LOAN_DAU_DO_LECH = [
        { value: "", label: "— Không xác định —" },
        { value: "khong-lech", label: "Không lệch" },
        { value: "lech-trai", label: "Lệch trái" },
        { value: "lech-phai", label: "Lệch phải" },
        { value: "khong-xac-dinh", label: "Không xác định" }
    ];

    var LOAN_DAU_QUY_MO = [
        { value: "", label: "— Không xác định —" },
        { value: "rat-nho", label: "Rất nhỏ" },
        { value: "nho", label: "Nhỏ" },
        { value: "vua", label: "Vừa" },
        { value: "lon", label: "Lớn" },
        { value: "rat-lon", label: "Rất lớn" }
    ];

    var LOAN_DAU_CHIEU_CAO = [
        { value: "", label: "— Không xác định —" },
        { value: "thap", label: "Thấp" },
        { value: "ngang-nha", label: "Ngang nhà" },
        { value: "cao", label: "Cao" },
        { value: "rat-cao", label: "Rất cao" }
    ];

    var LOAN_DAU_BE_RONG = [
        { value: "", label: "— Không xác định —" },
        { value: "hep", label: "Hẹp" },
        { value: "vua", label: "Vừa" },
        { value: "rong", label: "Rộng" },
        { value: "rat-rong", label: "Rất rộng" }
    ];

    var LOAN_DAU_HINH_DANG = [
        { value: "", label: "— Không xác định —" },
        { value: "khong-xac-dinh", label: "Không xác định" },
        { value: "tron", label: "Tròn" },
        { value: "vuong", label: "Vuông" },
        { value: "dai", label: "Dài" },
        { value: "thang", label: "Thẳng" },
        { value: "cong", label: "Cong" },
        { value: "nhon", label: "Nhọn" },
        { value: "xien", label: "Xiên" },
        { value: "bao-quanh", label: "Bao quanh" },
        { value: "lom", label: "Lõm" },
        { value: "loi", label: "Lồi" },
        { value: "khac", label: "Khác" }
    ];

    // Quan hệ với nhà — CHỈ mô tả hình thế, không tự luận cát/hung
    var LOAN_DAU_HUONG_TAC_DONG = [
        { value: "", label: "— Không xác định —" },
        { value: "khong-xac-dinh", label: "Không xác định" },
        { value: "binh-thuong", label: "Bình thường" },
        { value: "huong-vao-nha", label: "Hướng vào nhà" },
        { value: "huong-ra-nha", label: "Hướng ra nhà" },
        { value: "chan-truoc", label: "Chắn trước" },
        { value: "chan-ben", label: "Chắn bên" },
        { value: "chan-sau", label: "Chắn sau" },
        { value: "bao-quanh", label: "Bao quanh" },
        { value: "cat-ngang", label: "Cắt ngang" }
    ];

    var LOAN_DAU_TINH_CHAT = [
        { value: "", label: "— Không xác định —" },
        { value: "khong-xac-dinh", label: "Không xác định" },
        { value: "tinh", label: "Tĩnh" },
        { value: "it-dong", label: "Ít động" },
        { value: "dong", label: "Động" },
        { value: "rat-dong", label: "Rất động" }
    ];

    var LOAN_DAU_AM_DUONG = [
        { value: "", label: "— Không xác định —" },
        { value: "am", label: "Âm" },
        { value: "duong", label: "Dương" },
        { value: "khong-xac-dinh", label: "Không xác định" }
    ];

    var LOAN_DAU_LOAI_NUOC = [
        { value: "", label: "— Không xác định —" },
        { value: "song", label: "Sông" },
        { value: "suoi", label: "Suối" },
        { value: "kenh", label: "Kênh" },
        { value: "muong", label: "Mương" },
        { value: "ao", label: "Ao" },
        { value: "ho", label: "Hồ" },
        { value: "mat-nuoc-khac", label: "Mặt nước khác" }
    ];

    var LOAN_DAU_TINH_TRANG_NUOC = [
        { value: "", label: "— Không xác định —" },
        { value: "nuoc-tu", label: "Nước tụ" },
        { value: "nuoc-chay", label: "Nước chảy" },
        { value: "khong-xac-dinh", label: "Không xác định" }
    ];

    // Chỉ mô tả hướng dòng chảy quan sát — KHÔNG kết luận lai thủy/xuất thủy/cát/hung
    var LOAN_DAU_HUONG_CHAY = [
        { value: "", label: "— Không xác định —" },
        { value: "khong-xac-dinh", label: "Không xác định" },
        { value: "vao-nha", label: "Vào nhà" },
        { value: "ra-nha", label: "Ra nhà" },
        { value: "ngang-qua", label: "Ngang qua" },
        { value: "cong-quanh", label: "Cong quanh" },
        { value: "khac", label: "Khác" }
    ];

    var LOAN_DAU_LOAI_DUONG = [
        { value: "", label: "— Không xác định —" },
        { value: "duong-lon", label: "Đường lớn" },
        { value: "duong-nho", label: "Đường nhỏ" },
        { value: "ngo", label: "Ngõ" },
        { value: "hem", label: "Hẻm" },
        { value: "duong-cong", label: "Đường cong" },
        { value: "duong-thang", label: "Đường thẳng" },
        { value: "nga-ba", label: "Ngã ba" },
        { value: "nga-tu", label: "Ngã tư" },
        { value: "cau", label: "Cầu" }
    ];

    var LOAN_DAU_HUONG_DUONG = [
        { value: "", label: "— Không xác định —" },
        { value: "huong-vao-nha", label: "Hướng vào nhà" },
        { value: "huong-ra-nha", label: "Hướng ra nhà" },
        { value: "chay-ngang", label: "Chạy ngang" },
        { value: "chay-cheo", label: "Chạy chéo" },
        { value: "khong-xac-dinh", label: "Không xác định" }
    ];

    var LOAN_DAU_LUU_LUONG = [
        { value: "", label: "— Không xác định —" },
        { value: "it", label: "Ít" },
        { value: "vua", label: "Vừa" },
        { value: "nhieu", label: "Nhiều" },
        { value: "rat-nhieu", label: "Rất nhiều" },
        { value: "khong-xac-dinh", label: "Không xác định" }
    ];

    // ====================================================================
    // 4. LOAN_DAU_SCHEMA — METADATA FORM THÔNG MINH
    // Điều khiển form hiển thị field nào theo loại đối tượng.
    // Dễ dàng mở rộng sau này: thêm loại mới = thêm entry schema.
    // ====================================================================
    var LOAN_DAU_SCHEMA = {
        son: {
            label: "Sơn / Địa hình",
            fields: ["son", "khoangCach", "phia", "doLech", "quyMo", "chieuCao", "beRong", "hinhDang", "huongTacDong", "dongTinh", "ghiChu"]
        },
        thuy: {
            label: "Thủy",
            fields: ["son", "khoangCach", "phia", "doLech", "quyMo", "beRong", "hinhDang", "loaiNuoc", "tinhTrangNuoc", "huongChay", "dongTinh", "ghiChu"]
        },
        duong: {
            label: "Đường",
            fields: ["son", "khoangCach", "phia", "doLech", "quyMo", "beRong", "hinhDang", "loaiDuong", "huongDuong", "luuLuong", "dongTinh", "ghiChu"]
        },
        congTrinh: {
            label: "Công trình",
            fields: ["son", "khoangCach", "phia", "doLech", "quyMo", "chieuCao", "beRong", "hinhDang", "huongTacDong", "dongTinh", "ghiChu"]
        },
        canhQuan: {
            label: "Cây cối / Cảnh quan",
            fields: ["son", "khoangCach", "phia", "doLech", "quyMo", "chieuCao", "beRong", "hinhDang", "huongTacDong", "dongTinh", "ghiChu"]
        },
        hinhThe: {
            label: "Hình thế",
            fields: ["son", "khoangCach", "phia", "doLech", "quyMo", "hinhDang", "huongTacDong", "dongTinh", "ghiChu"]
        }
    };

    // Map nhóm (giá trị `nhom` trong object) -> key schema
    var LOAN_DAU_SCHEMA_KEY = {
        "son": "son",
        "thuy": "thuy",
        "duong": "duong",
        "cong-trinh": "congTrinh",
        "canh-quan": "canhQuan",
        "hinh-the": "hinhThe"
    };

    // ====================================================================
    // 5. STATE CHÍNH
    // ====================================================================
    function taoTuTuongMacDinh() {
        return {
            ghiChu: "",
            vatThe: [],
            caoThap: "",
            ganXa: "",
            dongTinh: ""
        };
    }

    function taoMinhDuongMacDinh() {
        return {
            phamVi: "",
            doSau: "",
            diaHinh: "",
            doThoang: "",
            coNuoc: "",
            coDuong: "",
            ghiChu: ""
        };
    }

    function taoCungTrangThaiMacDinh() {
        var obj = {};
        for (var i = 0; i < LOAN_DAU_9_CUNG.length; i++) {
            obj[LOAN_DAU_9_CUNG[i].index] = { daKhaoSat: false, ketQua: "" };
        }
        return obj;
    }

    var loanDauData = {
        cungDangChon: 4,
        cungTrangThai: taoCungTrangThaiMacDinh(),
        doiTuong: [],
        tuTuong: {
            thanhLong: taoTuTuongMacDinh(),
            bachHo: taoTuTuongMacDinh(),
            chuTuoc: taoTuTuongMacDinh(),
            huyenVu: taoTuTuongMacDinh()
        },
        minhDuong: taoMinhDuongMacDinh()
    };

    // ====================================================================
    // 6. TRẠNG THÁI MODAL
    // ====================================================================
    var modalState = {
        mode: "add",      // "add" | "edit"
        editId: null,
        cungIndex: 4
    };

    // ====================================================================
    // 7. HÀM TIỆN ÍCH
    // ====================================================================
    function layDS24Son() {
        if (typeof DS24_SON !== "undefined") return DS24_SON;
        if (typeof window.DS24_SON !== "undefined") return window.DS24_SON;
        return null;
    }

    function layNhomKey(homValue) {
        return LOAN_DAU_SCHEMA_KEY[homValue] || homValue || "";
    }

    function laySchemaByNhom(homValue) {
        var key = layNhomKey(homValue);
        return key && LOAN_DAU_SCHEMA[key] ? LOAN_DAU_SCHEMA[key] : null;
    }

    function taoId() {
        return "ld_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 6);
    }

    function layCungTheoIndex(index) {
        for (var i = 0; i < LOAN_DAU_9_CUNG.length; i++) {
            if (LOAN_DAU_9_CUNG[i].index === index) return LOAN_DAU_9_CUNG[i];
        }
        return LOAN_DAU_9_CUNG[4];
    }

    function layCungTenTheoIndex(index) {
        return layCungTheoIndex(index).kyHieu;
    }

    function layDoiTuongTheoCung(cungIndex) {
        return loanDauData.doiTuong.filter(function (item) {
            return item.cungIndex === cungIndex;
        });
    }

    function layDoiTuongTheoId(id) {
        for (var i = 0; i < loanDauData.doiTuong.length; i++) {
            if (loanDauData.doiTuong[i].id === id) return loanDauData.doiTuong[i];
        }
        return null;
    }

    function layDanhMucNhom(hom) {
        var key = layNhomKey(hom);
        return LOAN_DAU_DANH_MUC[key] || [];
    }

    function getLoanDauIcon(nhom) {
        var ds = layDanhMucNhom(nhom);
        if (ds && ds.length > 0) return ds[0].icon;
        return "📍";
    }

    function layNhanLoai(nhom, value) {
        var ds = layDanhMucNhom(nhom);
        for (var i = 0; i < ds.length; i++) {
            if (ds[i].value === value) return ds[i].label;
        }
        if (typeof value === "string" && value.length > 0) return value;
        return "";
    }

    function layNhanTuDanhSach(danhSach, value) {
        if (!value) return "";
        for (var i = 0; i < danhSach.length; i++) {
            if (danhSach[i].value === value) return danhSach[i].label;
        }
        return "";
    }

    function layNhanKhoangCach(v) { return layNhanTuDanhSach(LOAN_DAU_KHOANG_CACH, v); }
    function layNhanPhia(v) { return layNhanTuDanhSach(LOAN_DAU_PHIA, v); }
    function layNhanDoLech(v) { return layNhanTuDanhSach(LOAN_DAU_DO_LECH, v); }
    function layNhanQuyMo(v) { return layNhanTuDanhSach(LOAN_DAU_QUY_MO, v); }
    function layNhanChieuCao(v) { return layNhanTuDanhSach(LOAN_DAU_CHIEU_CAO, v); }
    function layNhanBeRong(v) { return layNhanTuDanhSach(LOAN_DAU_BE_RONG, v); }
    function layNhanHinhDang(v) { return layNhanTuDanhSach(LOAN_DAU_HINH_DANG, v); }
    function layNhanHuongTacDong(v) { return layNhanTuDanhSach(LOAN_DAU_HUONG_TAC_DONG, v); }
    function layNhanDongTinh(v) { return layNhanTuDanhSach(LOAN_DAU_TINH_CHAT, v); }
    function layNhanAmDuong(v) { return layNhanTuDanhSach(LOAN_DAU_AM_DUONG, v); }
    function layNhanLoaiNuoc(v) { return layNhanTuDanhSach(LOAN_DAU_LOAI_NUOC, v); }
    function layNhanTinhTrangNuoc(v) { return layNhanTuDanhSach(LOAN_DAU_TINH_TRANG_NUOC, v); }
    function layNhanHuongChay(v) { return layNhanTuDanhSach(LOAN_DAU_HUONG_CHAY, v); }
    function layNhanLoaiDuong(v) { return layNhanTuDanhSach(LOAN_DAU_LOAI_DUONG, v); }
    function layNhanHuongDuong(v) { return layNhanTuDanhSach(LOAN_DAU_HUONG_DUONG, v); }
    function layNhanLuuLuong(v) { return layNhanTuDanhSach(LOAN_DAU_LUU_LUONG, v); }

    function layGocSon(sonTen) {
        var ds = layDS24Son();
        if (!ds || !sonTen) return null;
        for (var i = 0; i < ds.length; i++) {
            if (ds[i].ten === sonTen) return ds[i].goc;
        }
        return null;
    }

    function demCungDaKhaoSat() {
        var dem = 0;
        for (var i = 0; i < LOAN_DAU_9_CUNG.length; i++) {
            var st = loanDauData.cungTrangThai[LOAN_DAU_9_CUNG[i].index];
            if (st && st.daKhaoSat) dem++;
        }
        return dem;
    }

    function tuTuongDaKhaiBao() {
        var keys = ["thanhLong", "bachHo", "chuTuoc", "huyenVu"];
        for (var i = 0; i < keys.length; i++) {
            var d = loanDauData.tuTuong[keys[i]];
            if (d && (d.ghiChu || (d.vatThe && d.vatThe.length > 0) || d.caoThap || d.ganXa || d.dongTinh)) return true;
        }
        return false;
    }

    function minhDuongDaKhaiBao() {
        var md = loanDauData.minhDuong;
        return !!(md && (md.phamVi || md.doSau || md.diaHinh || md.doThoang || md.coNuoc || md.coDuong || md.ghiChu));
    }

    // ====================================================================
    // 8. API THÊM / SỬA / XÓA ĐỐI TƯỢNG
    // ====================================================================
    function loanDauThemDoiTuong(data) {
        if (!data || !data.nhom) {
            console.warn("loanDauThemDoiTuong: thiếu nhóm ngoại cảnh");
            return null;
        }
        if (!data.loai) {
            console.warn("loanDauThemDoiTuong: thiếu loại ngoại cảnh");
            return null;
        }

        var cungIndex = (typeof data.cungIndex === "number") ? data.cungIndex : loanDauData.cungDangChon;
        var sonTen = (data.son && data.son.ten) ? data.son.ten : "";
        var sonGoc = (data.son && typeof data.son.goc === "number") ? data.son.goc : layGocSon(sonTen);
        var khoangCach = (data.viTri && data.viTri.khoangCach) ? data.viTri.khoangCach : (data.khoangCach || "");
        var quyMoV = (data.kichThuoc && data.kichThuoc.quyMo) || data.quyMo || "";
        var chieuCao = (data.kichThuoc && data.kichThuoc.chieuCao) || data.doCao || "";
        var beRong = (data.kichThuoc && data.kichThuoc.beRong) || "";
        var hinhDang = (data.hinhThe && data.hinhThe.dang) || data.hinhDang || "";
        var huongTacDong = (data.hinhThe && data.hinhThe.huongTacDong) || data.huongTacDong || "";
        var dongTinh = (data.tinhChat && data.tinhChat.dongTinh) || data.dongTinh || "";
        var amDuong = (data.tinhChat && data.tinhChat.amDuong) || "";
        var loaiNuoc = (data.thuy && data.thuy.loaiNuoc) || "";
        var huongChay = (data.thuy && data.thuy.huongChay) || "";
        var tinhTrangNuoc = (data.thuy && data.thuy.tinhTrang) || "";
        var loaiDuong = (data.duong && data.duong.loai) || data.loai || "";
        var huongDi = (data.duong && data.duong.huongDi) || "";
        var luuLuong = (data.duong && data.duong.luuLuong) || "";

        var obj = {
            id: taoId(),
            cungIndex: cungIndex,
            cungTen: layCungTenTheoIndex(cungIndex),

            // A. Đối tượng
            nhom: data.nhom || "",
            loai: data.loai || "",
            ten: layNhanLoai(data.nhom, data.loai) || data.ten || "",

            // B. Vị trí
            viTri: {
                khoangCach: khoangCach,
                phia: (data.viTri && data.viTri.phia) || "",
                doLech: (data.viTri && data.viTri.doLech) || ""
            },

            // C. Quy mô
            kichThuoc: {
                quyMo: quyMoV,
                chieuCao: chieuCao,
                beRong: beRong
            },

            // D. Hình thế
            hinhThe: {
                dang: hinhDang,
                huongTacDong: huongTacDong,
                coXung: !!(data.hinhThe && data.hinhThe.coXung),
                coCheChan: !!(data.hinhThe && data.hinhThe.coCheChan)
            },

            // E. Động / Tĩnh
            tinhChat: {
                dongTinh: dongTinh,
                amDuong: amDuong
            },

            // F. Thủy
            thuy: {
                coNuoc: data.nhom === "thuy" || !!(data.thuy && data.thuy.coNuoc),
                loaiNuoc: loaiNuoc,
                huongChay: huongChay,
                tinhTrang: tinhTrangNuoc
            },

            // G. Đường (chỉ mô tả)
            duong: {
                coDuong: data.nhom === "duong" || !!(data.duong && data.duong.coDuong),
                loai: loaiDuong,
                huongDi: huongDi,
                luuLuong: luuLuong
            },

            // Sơn (filter theo cung đang chọn)
            son: {
                ten: sonTen,
                goc: sonGoc
            },

            // H. Ghi chú
            ghiChu: data.ghiChu || ""
        };

        loanDauData.doiTuong.push(obj);
        renderLoanDau();
        return obj;
    }

    function loanDauSuaDoiTuong(id, data) {
        var obj = layDoiTuongTheoId(id);
        if (!obj) {
            console.warn("loanDauSuaDoiTuong: không tìm thấy đối tượng id = " + id);
            return false;
        }
        if (!data) return false;

        if (data.cungIndex !== undefined) {
            obj.cungIndex = data.cungIndex;
            obj.cungTen = layCungTenTheoIndex(data.cungIndex);
        }

        // A. Đối tượng
        if (data.nhom !== undefined) obj.nhom = data.nhom;
        if (data.loai !== undefined) {
            obj.loai = data.loai;
            obj.ten = layNhanLoai(data.nhom || obj.nhom, data.loai) || data.ten || "";
        }
        if (data.ten !== undefined && !!data.ten) obj.ten = data.ten;

        // B. Vị trí
        if (data.viTri) {
            if (data.viTri.khoangCach !== undefined) obj.viTri.khoangCach = data.viTri.khoangCach;
            if (data.viTri.phia !== undefined) obj.viTri.phia = data.viTri.phia;
            if (data.viTri.doLech !== undefined) obj.viTri.doLech = data.viTri.doLech;
        }
        if (data.khoangCach !== undefined) obj.viTri.khoangCach = data.khoangCach;

        // C. Quy mô
        if (data.kichThuoc) {
            if (data.kichThuoc.quyMo !== undefined) obj.kichThuoc.quyMo = data.kichThuoc.quyMo;
            if (data.kichThuoc.chieuCao !== undefined) obj.kichThuoc.chieuCao = data.kichThuoc.chieuCao;
            if (data.kichThuoc.beRong !== undefined) obj.kichThuoc.beRong = data.kichThuoc.beRong;
        }
        if (data.quyMo !== undefined) obj.kichThuoc.quyMo = data.quyMo;
        if (data.doCao !== undefined) obj.kichThuoc.chieuCao = data.doCao;

        // D. Hình thế
        if (data.hinhThe) {
            if (data.hinhThe.dang !== undefined) obj.hinhThe.dang = data.hinhThe.dang;
            if (data.hinhThe.huongTacDong !== undefined) obj.hinhThe.huongTacDong = data.hinhThe.huongTacDong;
            if (data.hinhThe.coXung !== undefined) obj.hinhThe.coXung = !!data.hinhThe.coXung;
            if (data.hinhThe.coCheChan !== undefined) obj.hinhThe.coCheChan = !!data.hinhThe.coCheChan;
        }
        if (data.hinhDang !== undefined) obj.hinhThe.dang = data.hinhDang;
        if (data.huongTacDong !== undefined) obj.hinhThe.huongTacDong = data.huongTacDong;

        // E. Động/Tĩnh
        if (data.tinhChat) {
            if (data.tinhChat.dongTinh !== undefined) obj.tinhChat.dongTinh = data.tinhChat.dongTinh;
            if (data.tinhChat.amDuong !== undefined) obj.tinhChat.amDuong = data.tinhChat.amDuong;
        }
        if (data.dongTinh !== undefined) obj.tinhChat.dongTinh = data.dongTinh;

        // F. Thủy
        if (data.thuy) {
            if (data.thuy.coNuoc !== undefined) obj.thuy.coNuoc = !!data.thuy.coNuoc;
            if (data.thuy.loaiNuoc !== undefined) obj.thuy.loaiNuoc = data.thuy.loaiNuoc;
            if (data.thuy.huongChay !== undefined) obj.thuy.huongChay = data.thuy.huongChay;
            if (data.thuy.tinhTrang !== undefined) obj.thuy.tinhTrang = data.thuy.tinhTrang;
        }

        // G. Đường
        if (data.duong) {
            if (data.duong.coDuong !== undefined) obj.duong.coDuong = !!data.duong.coDuong;
            if (data.duong.loai !== undefined) obj.duong.loai = data.duong.loai;
            if (data.duong.huongDi !== undefined) obj.duong.huongDi = data.duong.huongDi;
            if (data.duong.luuLuong !== undefined) obj.duong.luuLuong = data.duong.luuLuong;
        }

        // Sơn
        if (data.son) {
            if (data.son.ten !== undefined) obj.son.ten = data.son.ten;
            if (data.son.goc !== undefined) obj.son.goc = data.son.goc;
        }

        // H. Ghi chú
        if (data.ghiChu !== undefined) obj.ghiChu = data.ghiChu;

        renderLoanDau();
        return true;
    }

    function loanDauXoaDoiTuong(id) {
        var index = -1;
        for (var i = 0; i < loanDauData.doiTuong.length; i++) {
            if (loanDauData.doiTuong[i].id === id) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            loanDauData.doiTuong.splice(index, 1);
            renderLoanDau();
            return true;
        }
        return false;
    }

    function loanDauLayDoiTuong(id) {
        return layDoiTuongTheoId(id);
    }

    function loanDauChonCung(index) {
        if (typeof index !== "number" || index < 0 || index > 8) return;
        loanDauData.cungDangChon = index;
        renderLoanDauCacCung();
        renderLoanDauChiTietCung();
        renderLoanDauTongQuan();
    }

    function loanDauLayTuTuong() {
        return loanDauData.tuTuong;
    }

    function loanDauLayMinhDuong() {
        return loanDauData.minhDuong;
    }

    function loanDauLayTongQuan() {
        return {
            huongNha: layHuongNhaHienTai(),
            cungDangChon: loanDauData.cungDangChon,
            soNgoaiCanh: loanDauData.doiTuong.length,
            soCungDaKhaoSat: demCungDaKhaoSat(),
            tuTuongDaKhaiBao: tuTuongDaKhaiBao(),
            minhDuongDaKhaiBao: minhDuongDaKhaiBao()
        };
    }

    // ====================================================================
    // 9. RENDER — LƯỚI 9 CUNG
    // ====================================================================
    function renderLoanDauCacCung() {
        var container = document.getElementById("ld-cung-grid");
        if (!container) return;

        var huongNha = layHuongNhaHienTai();
        var html = "";
        for (var i = 0; i < LOAN_DAU_9_CUNG.length; i++) {
            var cung = LOAN_DAU_9_CUNG[i];
            var doiTuongCung = layDoiTuongTheoCung(cung.index);
            var activeClass = (cung.index === loanDauData.cungDangChon) ? " ld-cung-active" : "";
            var slot = laySlotCungTheoKyHieu(cung.kyHieu, huongNha);
            var orderStyle = (slot !== null) ? ' style="order:' + slot + ';"' : "";

            // Đếm số lượng theo nhóm
            var demNhom = {};
            for (var j = 0; j < doiTuongCung.length; j++) {
                var nhomObj = doiTuongCung[j].nhom;
                if (!demNhom[nhomObj]) demNhom[nhomObj] = 0;
                demNhom[nhomObj]++;
            }

            // Trạng thái khảo sát cung
            var st = loanDauData.cungTrangThai[cung.index];
            var daKhao = st && st.daKhaoSat;

            var badgeHtml = "";
            if (daKhao) {
                badgeHtml += '<span class="ld-cung-count ld-cung-count-done" title="Đã khảo sát">✓</span>';
            }
            var keys = Object.keys(demNhom);
            for (var k = 0; k < keys.length; k++) {
                var nhomKey = keys[k];
                var nhomKeyDanhMuc = nhomKey;
                if (nhomKey === "cong-trinh") nhomKeyDanhMuc = "congTrinh";
                var icon = "📍";
                if (LOAN_DAU_DANH_MUC[nhomKeyDanhMuc] && LOAN_DAU_DANH_MUC[nhomKeyDanhMuc].length > 0) {
                    icon = LOAN_DAU_DANH_MUC[nhomKeyDanhMuc][0].icon;
                }
                badgeHtml += '<span class="ld-cung-count">' + icon + ' ' + demNhom[nhomKey] + '</span>';
            }
            if (!daKhao && doiTuongCung.length === 0) {
                badgeHtml = '<span class="ld-cung-count ld-cung-count-empty">—</span>';
            }

            html += '<div class="ld-cung' + activeClass + '" data-cung-index="' + cung.index + '"' + orderStyle + '>' +
                        '<div class="ld-cung-ten">' + cung.ten + '</div>' +
                        '<div class="ld-cung-kyhieu">' + cung.kyHieu + '</div>' +
                        '<div class="ld-cung-badges">' + badgeHtml + '</div>' +
                    '</div>';
        }
        container.innerHTML = html;

        var cells = container.querySelectorAll(".ld-cung");
        for (var c = 0; c < cells.length; c++) {
            cells[c].addEventListener("click", function () {
                var idx = parseInt(this.getAttribute("data-cung-index"), 10);
                loanDauChonCung(idx);
            });
        }
    }

    // ====================================================================
    // 10. RENDER — CHI TIẾT CUNG ĐANG CHỌN
    // ====================================================================
    function lay3SonCuaCung(kyHieu) {
        var ds = layDS24Son();
        if (!ds || !kyHieu || kyHieu === "Trung") return "không có Sơn";
        var ds3 = [];
        for (var i = 0; i < ds.length; i++) {
            if (ds[i].cung === kyHieu) {
                ds3.push({ ten: ds[i].ten, goc: ds[i].goc });
            }
        }
        ds3.sort(function (a, b) { return a.goc - b.goc; });
        var t = "";
        for (var j = 0; j < ds3.length; j++) {
            t += (j > 0 ? " · " : "") + ds3[j].ten;
        }
        return t;
    }

    function renderLoanDauChiTietCung() {
        var container = document.getElementById("ld-chi-tiet-cung");
        if (!container) return;

        var cung = layCungTheoIndex(loanDauData.cungDangChon);
        var kyHieu = cung.kyHieu;
        var doiTuongCung = layDoiTuongTheoCung(cung.index);
        var baSon = lay3SonCuaCung(kyHieu);

        var html = '<div class="ld-detail-header">📍 CUNG ' + cung.ten.toUpperCase() + ' — ' + kyHieu + '</div>';
        html += '<div class="ld-cung-son">3 Sơn: <b>' + baSon + '</b></div>';

        // ---- Trạng thái khảo sát cung ----
        var st = loanDauData.cungTrangThai[cung.index] || { daKhaoSat: false, ketQua: "" };
        html += '<div class="ld-khaosat-status">' +
                    '<label class="ld-checkbox"><input type="checkbox" id="ld-cung-dakhaosat"' + (st.daKhaoSat ? ' checked' : '') + '> ✓ Đã khảo sát</label>' +
                    '<select id="ld-cung-ketqua" class="ld-ketqua-select"' + (st.daKhaoSat ? '' : ' disabled') + '>' +
                        '<option value="">— Kết quả —</option>' +
                        '<option value="co-ngoai-canh"' + (st.ketQua === "co-ngoai-canh" ? ' selected' : '') + '>Có ngoại cảnh</option>' +
                        '<option value="khong-gi"' + (st.ketQua === "khong-gi" ? ' selected' : '') + '>Không ghi nhận ngoại cảnh đáng chú ý</option>' +
                    '</select>' +
                '</div>';

        // Nút thêm
        html += '<button class="ld-btn-add" data-action="add">+ THÊM NGOẠI CẢNH</button>';

        // Danh sách đối tượng (card V2)
        if (doiTuongCung.length === 0) {
            html += '<div class="ld-empty">Chưa có ngoại cảnh nào ở cung này.</div>';
        } else {
            for (var i = 0; i < doiTuongCung.length; i++) {
                var obj = doiTuongCung[i];
                var nhomObj = obj.nhom;
                var tenHienThi = obj.ten || layNhanLoai(nhomObj, obj.loai) || "Ngoại cảnh";
                var icon = getLoanDauIcon(nhomObj);

                var phu = [];
                if (obj.son && obj.son.ten) phu.push(obj.son.ten);
                if (obj.viTri && obj.viTri.khoangCach) phu.push(layNhanKhoangCach(obj.viTri.khoangCach));
                if (obj.kichThuoc && obj.kichThuoc.quyMo) phu.push(layNhanQuyMo(obj.kichThuoc.quyMo));
                else if (obj.kichThuoc && obj.kichThuoc.beRong) phu.push(layNhanBeRong(obj.kichThuoc.beRong));
                if (obj.tinhChat && obj.tinhChat.dongTinh) phu.push(layNhanDongTinh(obj.tinhChat.dongTinh));
                var phuHtml = phu.length > 0 ? phu.join(" · ") : "";

                var quanHeHtml = "";
                if (obj.hinhThe && obj.hinhThe.huongTacDong) {
                    var qh = layNhanHuongTacDong(obj.hinhThe.huongTacDong);
                    if (qh) quanHeHtml = '<div class="ld-object-quanhe">↗ ' + qh + '</div>';
                }

                html += '<div class="ld-object" data-id="' + obj.id + '">' +
                            '<div class="ld-object-main">' +
                                '<span class="ld-object-icon">' + icon + '</span>' +
                                '<span class="ld-object-ten">' + tenHienThi + '</span>' +
                            '</div>';
                if (phuHtml) {
                    html += '<div class="ld-object-phu">' + phuHtml + '</div>';
                }
                if (quanHeHtml) {
                    html += quanHeHtml;
                }
                if (obj.ghiChu) {
                    html += '<div class="ld-object-ghichu">' + obj.ghiChu + '</div>';
                }
                html += '<div class="ld-object-actions">' +
                            '<button class="ld-btn-chitiet" data-action="detail" data-id="' + obj.id + '">Chi tiết</button>' +
                            '<button class="ld-btn-sua" data-action="edit" data-id="' + obj.id + '">Sửa</button>' +
                            '<button class="ld-btn-xoa" data-action="delete" data-id="' + obj.id + '">Xóa</button>' +
                        '</div>' +
                    '</div>';
            }
        }

        container.innerHTML = html;

        // Gắn sự kiện
        var btnAdd = container.querySelector('[data-action="add"]');
        if (btnAdd) btnAdd.addEventListener("click", function () { moModalThem(); });

        var btnChiTiet = container.querySelectorAll('[data-action="detail"]');
        for (var ct = 0; ct < btnChiTiet.length; ct++) {
            btnChiTiet[ct].addEventListener("click", function () {
                var id = this.getAttribute("data-id");
                moModalChiTiet(id);
            });
        }

        var btnSua = container.querySelectorAll('[data-action="edit"]');
        for (var s = 0; s < btnSua.length; s++) {
            btnSua[s].addEventListener("click", function () {
                var id = this.getAttribute("data-id");
                moModalSua(id);
            });
        }

        var btnXoa = container.querySelectorAll('[data-action="delete"]');
        for (var x = 0; x < btnXoa.length; x++) {
            btnXoa[x].addEventListener("click", function () {
                var id = this.getAttribute("data-id");
                if (confirm("Xóa ngoại cảnh này?")) {
                    loanDauXoaDoiTuong(id);
                }
            });
        }

        // Trạng thái cung
        var chkDaKhao = document.getElementById("ld-cung-dakhaosat");
        var selKetQua = document.getElementById("ld-cung-ketqua");
        if (chkDaKhao) {
            chkDaKhao.addEventListener("change", function () {
                var state = loanDauData.cungTrangThai[cung.index] || { daKhaoSat: false, ketQua: "" };
                state.daKhaoSat = this.checked;
                if (!this.checked) state.ketQua = "";
                loanDauData.cungTrangThai[cung.index] = state;
                renderLoanDauCacCung();
                renderLoanDauTongQuan();
                if (selKetQua) selKetQua.disabled = !this.checked;
            });
        }
        if (selKetQua) {
            selKetQua.addEventListener("change", function () {
                var state = loanDauData.cungTrangThai[cung.index] || { daKhaoSat: false, ketQua: "" };
                state.daKhaoSat = true;
                state.ketQua = this.value;
                loanDauData.cungTrangThai[cung.index] = state;
                renderLoanDauCacCung();
                renderLoanDauTongQuan();
            });
        }
    }

    // ====================================================================
    // 11. RENDER — TỔNG QUAN KHẢO SÁT
    // ====================================================================
    function renderLoanDauTongQuan() {
        var container = document.getElementById("ld-tong-quan");
        if (!container) return;

        var huongN = layHuongNhaHienTai();
        var sonHuong = "";
        var ds = layDS24Son();
        if (ds) {
            var g = ((huongN % 360) + 360) % 360;
            for (var i = 0; i < ds.length; i++) {
                var min = (ds[i].goc - 7.5 + 360) % 360;
                var max = (ds[i].goc + 7.5) % 360;
                if (min < max) { if (g >= min && g < max) { sonHuong = ds[i].ten; break; } }
                else { if (g >= min || g < max) { sonHuong = ds[i].ten; break; } }
            }
        }

        var tongSo = loanDauData.doiTuong.length;
        var soCungKhao = demCungDaKhaoSat();
        var mdK = minhDuongDaKhaiBao() ? "Đã" : "Chưa";
        var ttK = tuTuongDaKhaiBao() ? "Đã" : "Chưa";

        var html = '<div class="ld-section-title">📋 TỔNG QUAN KHẢO SÁT</div>';
        html += '<div class="ld-tong-quan-grid">';
        html += '<div class="ld-tong-quan-item"><span class="tq-label">Hướng nhà</span><span class="tq-value">' + Math.round(huongN) + '°</span></div>';
        html += '<div class="ld-tong-quan-item"><span class="tq-label">Sơn hướng nhà</span><span class="tq-value">' + (sonHuong || "—") + '</span></div>';
        html += '<div class="ld-tong-quan-item"><span class="tq-label">Ngoại cảnh</span><span class="tq-value">' + tongSo + '</span></div>';
        html += '<div class="ld-tong-quan-item"><span class="tq-label">Cung đã khảo sát</span><span class="tq-value">' + soCungKhao + '/8</span></div>';
        html += '<div class="ld-tong-quan-item"><span class="tq-label">Minh Đường</span><span class="tq-value">' + mdK + '</span></div>';
        html += '<div class="ld-tong-quan-item"><span class="tq-label">Tứ Tượng</span><span class="tq-value">' + ttK + '</span></div>';
        html += '</div>';

        container.innerHTML = html;
    }

    // ====================================================================
    // 12. RENDER — TỨ TƯỢNG (giữ V1 + bộ mô tả)
    // ====================================================================
    function layNhanCaoThap(v) {
        var ds = [
            { value: "thap", label: "Thấp" }, { value: "ngang", label: "Ngang" },
            { value: "cao", label: "Cao" }, { value: "rat-cao", label: "Rất cao" },
            { value: "khong-xac-dinh", label: "Không rõ" }
        ];
        return layNhanTuDanhSach(ds, v);
    }
    function layNhanGanXa(v) {
        var ds = [
            { value: "rat-gan", label: "Rất gần" }, { value: "gan", label: "Gần" },
            { value: "trung-binh", label: "Trung bình" }, { value: "xa", label: "Xa" },
            { value: "rat-xa", label: "Rất xa" }, { value: "khong-xac-dinh", label: "Không rõ" }
        ];
        return layNhanTuDanhSach(ds, v);
    }
    function layNhanDongTinhTT(v) {
        var ds = [
            { value: "tinh", label: "Tĩnh" }, { value: "it-dong", label: "Ít động" },
            { value: "dong", label: "Động" }, { value: "rat-dong", label: "Rất động" },
            { value: "khong-xac-dinh", label: "Không rõ" }
        ];
        return layNhanTuDanhSach(ds, v);
    }

    function renderLoanDauTuTuong() {
        // 4 slot riêng biệt bao quanh lưới Cửu Cung
        var slotMap = [
            { key: "chuTuoc",  slotId: "ld-tt-chu-tuoc",  ten: "Chu Tước",  icon: "🐦", viTri: "TRƯỚC" },
            { key: "thanhLong", slotId: "ld-tt-thanh-long", ten: "Thanh Long", icon: "🐉", viTri: "TRÁI" },
            { key: "bachHo",   slotId: "ld-tt-bach-ho",   ten: "Bạch Hổ",   icon: "🐅", viTri: "PHẢI" },
            { key: "huyenVu",  slotId: "ld-tt-huyen-vu",  ten: "Huyền Vũ",  icon: "🐢", viTri: "SAU" }
        ];

        for (var i = 0; i < slotMap.length; i++) {
            var item = slotMap[i];
            var container = document.getElementById(item.slotId);
            if (!container) continue;

            var data = loanDauData.tuTuong[item.key];
            var daKhaiBao = (data.ghiChu || (data.vatThe && data.vatThe.length > 0) || data.caoThap || data.ganXa || data.dongTinh) ? true : false;

            var moTa = [];
            if (data.vatThe && data.vatThe.length > 0) moTa.push(data.vatThe.join(", "));
            if (data.caoThap) moTa.push("Cao/thấp: " + layNhanCaoThap(data.caoThap));
            if (data.ganXa) moTa.push("Gần/xa: " + layNhanGanXa(data.ganXa));
            if (data.dongTinh) moTa.push("Động/tĩnh: " + layNhanDongTinhTT(data.dongTinh));
            var moTaHtml = moTa.length > 0 ? '<div class="ld-tt-mota">' + moTa.join(" · ") + '</div>' : "";

            var html = '<div class="ld-tt-card' + (daKhaiBao ? ' ld-tt-card-done' : '') + '" data-tutuong="' + item.key + '">' +
                            '<div class="ld-tt-card-icon">' + item.icon + '</div>' +
                            '<div class="ld-tt-card-ten">' + item.ten + '</div>' +
                            '<div class="ld-tt-card-vitri">' + item.viTri + '</div>' +
                            (daKhaiBao ? '<div class="ld-tt-card-done-badge">✓</div>' : '') +
                            '<button class="ld-btn-khaibao" data-tutuong="' + item.key + '">' + (daKhaiBao ? "Xem/Sửa" : "Khai báo") + '</button>' +
                            moTaHtml +
                        '</div>';

            container.innerHTML = html;

            // Bấm vào card hoặc nút đều mở modal
            var card = container.querySelector(".ld-tt-card");
            if (card) {
                card.addEventListener("click", function () {
                    var key = this.getAttribute("data-tutuong");
                    moModalTuTuong(key);
                });
            }
            var btn = container.querySelector(".ld-btn-khaibao");
            if (btn) {
                btn.addEventListener("click", function (e) {
                    e.stopPropagation();
                    var key = this.getAttribute("data-tutuong");
                    moModalTuTuong(key);
                });
            }
        }
    }

    // ====================================================================
    // 13. RENDER — MINH ĐƯỜNG (V2: Phạm vi, Độ sâu, Địa hình, Độ thoáng)
    // ====================================================================
    function renderLoanDauMinhDuong() {
        var container = document.getElementById("ld-minh-duong");
        if (!container) return;

        var md = loanDauData.minhDuong;

        var luaChon5 = [
            { value: "", label: "— Chọn —" },
            { value: "rat-hep", label: "Rất hẹp" },
            { value: "hep", label: "Hẹp" },
            { value: "vua", label: "Vừa" },
            { value: "rong", label: "Rộng" },
            { value: "rat-rong", label: "Rất rộng" }
        ];
        var luaChonSau = [
            { value: "", label: "— Chọn —" },
            { value: "nong", label: "Nông" },
            { value: "vua", label: "Vừa" },
            { value: "sau", label: "Sâu" },
            { value: "khong-xac-dinh", label: "Không xác định" }
        ];
        var luaChonDiaHinh = [
            { value: "", label: "— Chọn —" },
            { value: "bang-phang", label: "Bằng phẳng" },
            { value: "hoi-doc", label: "Hơi dốc" },
            { value: "doc", label: "Dốc" },
            { value: "khong-xac-dinh", label: "Không xác định" }
        ];
        var luaChonThoang = [
            { value: "", label: "— Chọn —" },
            { value: "rat-thoang", label: "Rất thoáng" },
            { value: "thoang", label: "Thoáng" },
            { value: "binh-thuong", label: "Bình thường" },
            { value: "bi-han-che", label: "Bị hạn chế" },
            { value: "bi-chan", label: "Bị chắn" }
        ];
        var luaChonCoKhong = [
            { value: "", label: "— Chọn —" },
            { value: "co", label: "Có" },
            { value: "khong", label: "Không" },
            { value: "khong-xac-dinh", label: "Không xác định" }
        ];

        function taoSelect(id, value, options) {
            var h = '<select id="' + id + '" class="ld-minh-duong-select">';
            for (var i = 0; i < options.length; i++) {
                var sel = (options[i].value === value) ? " selected" : "";
                h += '<option value="' + options[i].value + '"' + sel + '>' + options[i].label + '</option>';
            }
            h += '</select>';
            return h;
        }

        var html = '<div class="ld-section-title">🌿 MINH ĐƯỜNG</div>';
        html += '<div class="ld-minh-duong-row"><label>Phạm vi</label>' + taoSelect("ld-md-phamvi", md.phamVi, luaChon5) + '</div>';
        html += '<div class="ld-minh-duong-row"><label>Độ sâu</label>' + taoSelect("ld-md-dosau", md.doSau, luaChonSau) + '</div>';
        html += '<div class="ld-minh-duong-row"><label>Địa hình</label>' + taoSelect("ld-md-diahinh", md.diaHinh, luaChonDiaHinh) + '</div>';
        html += '<div class="ld-minh-duong-row"><label>Độ thoáng</label>' + taoSelect("ld-md-dothong", md.doThoang, luaChonThoang) + '</div>';
        html += '<div class="ld-minh-duong-row"><label>Có nước</label>' + taoSelect("ld-md-conuoc", md.coNuoc, luaChonCoKhong) + '</div>';
        html += '<div class="ld-minh-duong-row"><label>Có đường</label>' + taoSelect("ld-md-coduong", md.coDuong, luaChonCoKhong) + '</div>';
        html += '<div class="ld-minh-duong-row"><label>Ghi chú</label>' +
                    '<textarea id="ld-md-ghichu" class="ld-minh-duong-ghichu" placeholder="Ghi chú quan sát thực tế...">' + (md.ghiChu || "") + '</textarea>' +
                '</div>';

        container.innerHTML = html;

        var ids = ["ld-md-phamvi", "ld-md-dosau", "ld-md-diahinh", "ld-md-dothong", "ld-md-conuoc", "ld-md-coduong"];
        var keys = ["phamVi", "doSau", "diaHinh", "doThoang", "coNuoc", "coDuong"];
        for (var i = 0; i < ids.length; i++) {
            (function (id, key) {
                var el = document.getElementById(id);
                if (el) {
                    el.addEventListener("change", function () {
                        loanDauData.minhDuong[key] = this.value;
                    });
                }
            })(ids[i], keys[i]);
        }
        var ghichuEl = document.getElementById("ld-md-ghichu");
        if (ghichuEl) {
            ghichuEl.addEventListener("input", function () {
                loanDauData.minhDuong.ghiChu = this.value;
            });
        }
    }

    // ====================================================================
    // 14. RENDER TỔNG
    // ====================================================================
    function renderLoanDau() {
        renderLoanDauCacCung();
        renderLoanDauChiTietCung();
        renderLoanDauTongQuan();
        renderLoanDauTuTuong();
        renderLoanDauMinhDuong();
    }

    // ====================================================================
    // 15. MODAL THÊM / SỬA NGOẠI CẢNH — FORM THÔNG MINH THEO LOẠI
    // ====================================================================
    function taoOptionsTuDanhSach(danhSach, valueChon) {
        var h = "";
        for (var i = 0; i < danhSach.length; i++) {
            var sel = (danhSach[i].value === valueChon) ? " selected" : "";
            h += '<option value="' + danhSach[i].value + '"' + sel + '>' + danhSach[i].label + '</option>';
        }
        return h;
    }

    function fieldId(field) {
        return "ld-v2-" + field;
    }

    function buildOptions24Son(cungKyHieu, value) {
        var ds = layDS24Son();
        if (!ds) return '<option value="">Không có dữ liệu 24 Sơn</option>';
        if (!cungKyHieu || cungKyHieu === "Trung") return '<option value="">Không có Sơn</option>';
        var h = '<option value="">Không xác định</option>';
        for (var i = 0; i < ds.length; i++) {
            if (ds[i].cung !== cungKyHieu) continue;
            var sel = (ds[i].ten === value) ? " selected" : "";
            h += '<option value="' + ds[i].ten + '"' + sel + '>' + ds[i].ten + ' (' + ds[i].goc + '°)</option>';
        }
        return h;
    }

    function buildSelect(danhSach, value, id) {
        return '<select id="' + id + '">' + taoOptionsTuDanhSach(danhSach, value || "") + '</select>';
    }

    function escHtml(s) {
        var amp = String.fromCharCode(38); // ký tự &
        return String(s == null ? "" : s)
            .replace(/&/g, amp + "amp;")
            .replace(/</g, amp + "lt;")
            .replace(/>/g, amp + "gt;")
            .replace(/"/g, amp + "quot;");
    }

    // Render form theo nhóm đã chọn (dùng LOAN_DAU_SCHEMA)
    function renderV2Fields(nhom, obj) {
        var body = document.getElementById("ld-v2-form-body");
        if (!body) return;

        var schemaKey = LOAN_DAU_SCHEMA_KEY[nhom || ""];
        var schema = schemaKey ? LOAN_DAU_SCHEMA[schemaKey] : null;
        var cung = layCungTheoIndex(modalState.cungIndex);

        function val(field) {
            if (!obj) return "";
            if (field === "son") return obj.son && obj.son.ten ? obj.son.ten : "";
            if (field === "khoangCach") return obj.viTri && obj.viTri.khoangCach ? obj.viTri.khoangCach : "";
            if (field === "phia") return obj.viTri && obj.viTri.phia ? obj.viTri.phia : "";
            if (field === "doLech") return obj.viTri && obj.viTri.doLech ? obj.viTri.doLech : "";
            if (field === "quyMo") return obj.kichThuoc && obj.kichThuoc.quyMo ? obj.kichThuoc.quyMo : "";
            if (field === "chieuCao") return obj.kichThuoc && obj.kichThuoc.chieuCao ? obj.kichThuoc.chieuCao : "";
            if (field === "beRong") return obj.kichThuoc && obj.kichThuoc.beRong ? obj.kichThuoc.beRong : "";
            if (field === "hinhDang") return obj.hinhThe && obj.hinhThe.dang ? obj.hinhThe.dang : "";
            if (field === "huongTacDong") return obj.hinhThe && obj.hinhThe.huongTacDong ? obj.hinhThe.huongTacDong : "";
            if (field === "dongTinh") return obj.tinhChat && obj.tinhChat.dongTinh ? obj.tinhChat.dongTinh : "";
            if (field === "loaiNuoc") return obj.thuy && obj.thuy.loaiNuoc ? obj.thuy.loaiNuoc : "";
            if (field === "tinhTrangNuoc") return obj.thuy && obj.thuy.tinhTrang ? obj.thuy.tinhTrang : "";
            if (field === "huongChay") return obj.thuy && obj.thuy.huongChay ? obj.thuy.huongChay : "";
            if (field === "loaiDuong") return obj.duong && obj.duong.loai ? obj.duong.loai : "";
            if (field === "huongDuong") return obj.duong && obj.duong.huongDi ? obj.duong.huongDi : "";
            if (field === "luuLuong") return obj.duong && obj.duong.luuLuong ? obj.duong.luuLuong : "";
            if (field === "ghiChu") return obj.ghiChu || "";
            return "";
        }

        var html = "";

        // ===== A. ĐỐI TƯỢNG =====
        html += '<div class="ld-v2-group">';
        html += '<div class="ld-v2-group-title">A. Đối tượng</div>';
        html += '<div class="ld-field"><label>Nhóm</label>';
        html += '<select id="ld-v2-nhom">';
        var nhomList = [
            { key: "", label: "— Chọn nhóm —" },
            { key: "son", label: "Sơn / Địa hình" },
            { key: "thuy", label: "Thủy" },
            { key: "duong", label: "Đường" },
            { key: "cong-trinh", label: "Công trình" },
            { key: "canh-quan", label: "Cây cối / cảnh quan" },
            { key: "hinh-the", label: "Hình thế" }
        ];
        for (var i = 0; i < nhomList.length; i++) {
            var s = (nhomList[i].key === (nhom || "")) ? " selected" : "";
            html += '<option value="' + nhomList[i].key + '"' + s + '>' + nhomList[i].label + '</option>';
        }
        html += '</select></div>';

        html += '<div class="ld-field"><label>Loại cụ thể</label><select id="ld-v2-loai"><option value="">— Chọn loại —</option>';
        var keyDanhMuc = nhom === "cong-trinh" ? "congTrinh" : (nhom === "canh-quan" ? "canhQuan" : (nhom === "hinh-the" ? "hinhThe" : nhom));
        if (nhom && LOAN_DAU_DANH_MUC[keyDanhMuc]) {
            for (var j = 0; j < LOAN_DAU_DANH_MUC[keyDanhMuc].length; j++) {
                var ite = LOAN_DAU_DANH_MUC[keyDanhMuc][j];
                var sl = (ite.value === (obj ? obj.loai : "")) ? " selected" : "";
                html += '<option value="' + ite.value + '"' + sl + '>' + ite.icon + ' ' + ite.label + '</option>';
            }
        }
        html += '</select></div>';
        html += '</div>';

        // Nếu chưa chọn nhóm -> chỉ hiện A + H
        if (!schema) {
            html += '<div class="ld-v2-group"><div class="ld-v2-group-title">H. Ghi chú</div>';
            html += '<div class="ld-field"><label>Ghi chú khảo sát thực tế</label>';
            html += '<textarea id="ld-v2-ghichu" class="ld-textarea" placeholder="Ghi chú khảo sát thực tế...">' + escHtml(val("ghiChu")) + '</textarea>';
            html += '</div></div>';
            body.innerHTML = html;
            bindNhomChange(obj);
            return;
        }

        var fd = schema.fields;

        // B. VỊ TRÍ
        if (fd.indexOf("son") >= 0 || fd.indexOf("khoangCach") >= 0 || fd.indexOf("phia") >= 0 || fd.indexOf("doLech") >= 0) {
            html += '<div class="ld-v2-group"><div class="ld-v2-group-title">B. Vị trí</div>';
            if (fd.indexOf("son") >= 0) {
                html += '<div class="ld-field"><label>Sơn</label><select id="ld-v2-son">' + buildOptions24Son(cung.kyHieu, val("son")) + '</select></div>';
            }
            if (fd.indexOf("khoangCach") >= 0) {
                html += '<div class="ld-field"><label>Khoảng cách</label>' + buildSelect(LOAN_DAU_KHOANG_CACH, val("khoangCach"), "ld-v2-khoangcach") + '</div>';
            }
            if (fd.indexOf("phia") >= 0) {
                html += '<div class="ld-field"><label>Phía tương đối</label>' + buildSelect(LOAN_DAU_PHIA, val("phia"), "ld-v2-phia") + '</div>';
            }
            if (fd.indexOf("doLech") >= 0) {
                html += '<div class="ld-field"><label>Độ lệch</label>' + buildSelect(LOAN_DAU_DO_LECH, val("doLech"), "ld-v2-dolech") + '</div>';
            }
            html += '</div>';
        }

        // C. QUY MÔ
        if (fd.indexOf("quyMo") >= 0 || fd.indexOf("chieuCao") >= 0 || fd.indexOf("beRong") >= 0) {
            html += '<div class="ld-v2-group"><div class="ld-v2-group-title">C. Quy mô</div>';
            if (fd.indexOf("quyMo") >= 0) {
                html += '<div class="ld-field"><label>Quy mô</label>' + buildSelect(LOAN_DAU_QUY_MO, val("quyMo"), "ld-v2-quymo") + '</div>';
            }
            if (fd.indexOf("chieuCao") >= 0) {
                html += '<div class="ld-field"><label>Chiều cao</label>' + buildSelect(LOAN_DAU_CHIEU_CAO, val("chieuCao"), "ld-v2-chieucao") + '</div>';
            }
            if (fd.indexOf("beRong") >= 0) {
                html += '<div class="ld-field"><label>Bề rộng</label>' + buildSelect(LOAN_DAU_BE_RONG, val("beRong"), "ld-v2-berong") + '</div>';
            }
            html += '</div>';
        }

        // D. HÌNH THỂ
        if (fd.indexOf("hinhDang") >= 0 || fd.indexOf("huongTacDong") >= 0) {
            html += '<div class="ld-v2-group"><div class="ld-v2-group-title">D. Hình thế</div>';
            if (fd.indexOf("hinhDang") >= 0) {
                html += '<div class="ld-field"><label>Hình dạng</label>' + buildSelect(LOAN_DAU_HINH_DANG, val("hinhDang"), "ld-v2-hinhdang") + '</div>';
            }
            if (fd.indexOf("huongTacDong") >= 0) {
                html += '<div class="ld-field"><label>Quan hệ với nhà</label>' + buildSelect(LOAN_DAU_HUONG_TAC_DONG, val("huongTacDong"), "ld-v2-huongtacdong") + '</div>';
            }
            html += '</div>';
        }

        // E. ĐỘNG / TĨNH
        if (fd.indexOf("dongTinh") >= 0) {
            html += '<div class="ld-v2-group"><div class="ld-v2-group-title">E. Động / Tĩnh</div>';
            html += '<div class="ld-field"><label>Tính chất</label>' + buildSelect(LOAN_DAU_TINH_CHAT, val("dongTinh"), "ld-v2-dongtinh") + '</div>';
            html += '</div>';
        }

        // F. THỦY — chỉ hiện khi nhóm thuy
        if (nhom === "thuy") {
            html += '<div class="ld-v2-group ld-v2-group-thuy"><div class="ld-v2-group-title">F. Thủy</div>';
            if (fd.indexOf("loaiNuoc") >= 0) {
                html += '<div class="ld-field"><label>Loại nước</label>' + buildSelect(LOAN_DAU_LOAI_NUOC, val("loaiNuoc"), "ld-v2-loainuoc") + '</div>';
            }
            if (fd.indexOf("tinhTrangNuoc") >= 0) {
                html += '<div class="ld-field"><label>Trạng thái</label>' + buildSelect(LOAN_DAU_TINH_TRANG_NUOC, val("tinhTrangNuoc"), "ld-v2-tinhtrangnuoc") + '</div>';
            }
            if (fd.indexOf("huongChay") >= 0) {
                html += '<div class="ld-field"><label>Hướng dòng chảy</label>' + buildSelect(LOAN_DAU_HUONG_CHAY, val("huongChay"), "ld-v2-huongchay") + '</div>';
            }
            html += '<div class="ld-hint">Chỉ mô tả quan sát. Không tự kết luận lai thủy/xuất thủy.</div>';
            html += '</div>';
        }

        // G. ĐƯỜNG — chỉ hiện khi nhóm duong
        if (nhom === "duong") {
            html += '<div class="ld-v2-group ld-v2-group-duong"><div class="ld-v2-group-title">G. Đường</div>';
            if (fd.indexOf("loaiDuong") >= 0) {
                html += '<div class="ld-field"><label>Loại đường</label>' + buildSelect(LOAN_DAU_LOAI_DUONG, val("loaiDuong"), "ld-v2-loaiduong") + '</div>';
            }
            if (fd.indexOf("huongDuong") >= 0) {
                html += '<div class="ld-field"><label>Hướng</label>' + buildSelect(LOAN_DAU_HUONG_DUONG, val("huongDuong"), "ld-v2-huongduong") + '</div>';
            }
            if (fd.indexOf("luuLuong") >= 0) {
                html += '<div class="ld-field"><label>Lưu lượng</label>' + buildSelect(LOAN_DAU_LUU_LUONG, val("luuLuong"), "ld-v2-luuluong") + '</div>';
            }
            html += '<div class="ld-hint">Chỉ ghi nhận quan sát. Không tự luận xung sát.</div>';
            html += '</div>';
        }

        // H. GHI CHÚ
        html += '<div class="ld-v2-group"><div class="ld-v2-group-title">H. Ghi chú</div>';
        html += '<div class="ld-field"><label>Ghi chú khảo sát thực tế</label>';
        html += '<textarea id="ld-v2-ghichu" class="ld-textarea" placeholder="Ví dụ: Phía trước nhà khoảng 30m có đường lớn. Xe chạy nhiều vào giờ sáng và chiều...">' + escHtml(val("ghiChu")) + '</textarea>';
        html += '</div></div>';

        body.innerHTML = html;
        bindNhomChange(obj);
    }

    function bindNhomChange(obj) {
        var selN = document.getElementById("ld-v2-nhom");
        if (selN) {
            selN.addEventListener("change", function () {
                var newNhom = this.value;
                renderV2Fields(newNhom, obj);
            });
        }
    }

    // ====================================================================
    // 16. MỞ / ĐÓNG MODAL THÊM / SỬA
    // ====================================================================
    function moModalThem() {
        modalState.mode = "add";
        modalState.editId = null;
        modalState.cungIndex = loanDauData.cungDangChon;
        hienModalForm(true, null);
    }

    function moModalSua(id) {
        var obj = layDoiTuongTheoId(id);
        if (!obj) return;
        modalState.mode = "edit";
        modalState.editId = id;
        modalState.cungIndex = obj.cungIndex;
        hienModalForm(true, obj);
    }

    function hienModalForm(hien, obj) {
        var overlay = document.getElementById("ld-v2-modal-overlay");
        if (!overlay) return;
        overlay.classList.toggle("active", !!hien);
        if (hien) renderFormNgoaiCanh(obj);
    }

    function dongModalV2() {
        var overlay = document.getElementById("ld-v2-modal-overlay");
        if (overlay) overlay.classList.remove("active");
    }

    function renderFormNgoaiCanh(obj) {
        var cung = layCungTheoIndex(modalState.cungIndex);
        var title = document.getElementById("ld-v2-modal-title");
        if (title) {
            title.textContent = (modalState.mode === "add" ? "➕ Thêm ngoại cảnh" : "✏️ Sửa ngoại cảnh") + " — " + cung.ten + " (" + cung.kyHieu + ")";
        }

        var selCung = document.getElementById("ld-v2-f-cung");
        if (selCung) {
            var h = "";
            for (var i = 0; i < LOAN_DAU_9_CUNG.length; i++) {
                var sel = (LOAN_DAU_9_CUNG[i].index === modalState.cungIndex) ? " selected" : "";
                h += '<option value="' + LOAN_DAU_9_CUNG[i].index + '"' + sel + '>' + LOAN_DAU_9_CUNG[i].ten + ' (' + LOAN_DAU_9_CUNG[i].kyHieu + ')</option>';
            }
            selCung.innerHTML = h;
        }

        var nhom = obj ? obj.nhom : "";
        renderV2Fields(nhom, obj);
    }

    // ====================================================================
    // 17. LƯU MODAL
    // ====================================================================
    function luuModalV2() {
        var nhomEl = document.getElementById("ld-v2-nhom");
        if (!nhomEl) return;
        var nhom = nhomEl.value;
        if (!nhom) {
            alert("Vui lòng chọn nhóm.");
            return;
        }
        var loaiEl = document.getElementById("ld-v2-loai");
        if (!loaiEl) return;
        var loai = loaiEl.value;
        if (!loai) {
            alert("Vui lòng chọn loại ngoại cảnh cụ thể.");
            return;
        }

        function get(id) {
            var el = document.getElementById("ld-v2-" + id);
            if (!el) return "";
            return el.value;
        }

        var sonTen = get("son");
        var data = {
            cungIndex: parseInt(document.getElementById("ld-v2-f-cung").value, 10),
            nhom: nhom,
            loai: loai,
            ten: layNhanLoai(nhom, loai),
            son: { ten: sonTen, goc: layGocSon(sonTen) },
            viTri: {
                khoangCach: get("khoangcach"),
                phia: get("phia"),
                doLech: get("dolech")
            },
            kichThuoc: {
                quyMo: get("quymo"),
                chieuCao: get("chieucao"),
                beRong: get("berong")
            },
            hinhThe: {
                dang: get("hinhdang"),
                huongTacDong: get("huongtacdong"),
                coXung: false,
                coCheChan: false
            },
            tinhChat: {
                dongTinh: get("dongtinh"),
                amDuong: ""
            },
            thuy: {
                coNuoc: nhom === "thuy",
                loaiNuoc: get("loainuoc"),
                huongChay: get("huongchay"),
                tinhTrang: get("tinhtrangnuoc")
            },
            duong: {
                coDuong: nhom === "duong",
                loai: get("loaiduong"),
                huongDi: get("huongduong"),
                luuLuong: get("luuluong")
            },
            ghiChu: get("ghichu")
        };

        if (modalState.mode === "add") {
            loanDauThemDoiTuong(data);
        } else if (modalState.mode === "edit" && modalState.editId) {
            loanDauSuaDoiTuong(modalState.editId, data);
        }

        dongModalV2();
    }

    // ====================================================================
    // 18. MODAL CHI TIẾT ĐỐI TƯỢNG
    // ====================================================================
    function moModalChiTiet(id) {
        var obj = layDoiTuongTheoId(id);
        if (!obj) return;

        var overlay = document.getElementById("ld-v2-detail-overlay");
        if (!overlay) return;

        var title = document.getElementById("ld-v2-detail-title");
        if (title) title.textContent = (getLoanDauIcon(obj.nhom) || "") + " " + (obj.ten || layNhanLoai(obj.nhom, obj.loai));

        var body = document.getElementById("ld-v2-detail-body");
        if (body) {
            body.innerHTML = buildDetailHtml(obj);
        }

        overlay.classList.add("active");
    }

    function dongModalChiTiet() {
        var overlay = document.getElementById("ld-v2-detail-overlay");
        if (overlay) overlay.classList.remove("active");
    }

    function buildDetailHtml(obj) {
        var html = "";
        function row(label, value) {
            if (!value) return "";
            return '<div class="ld-detail-row"><span class="ld-detail-label">' + label + '</span><span class="ld-detail-value">' + value + '</span></div>';
        }

        html += '<div class="ld-detail-cung"><b>Cung:</b> ' + (obj.cungTen || "") + ' ' + (obj.cungIndex !== undefined ? '(' + obj.cungIndex + ')' : '') + '</div>';
        html += row("Sơn", obj.son && obj.son.ten ? obj.son.ten + (obj.son.goc != null ? " (" + obj.son.goc + "°)" : "") : "");
        html += row("Khoảng cách", obj.viTri && layNhanKhoangCach(obj.viTri.khoangCach));
        html += row("Phía tương đối", obj.viTri && layNhanPhia(obj.viTri.phia));
        html += row("Độ lệch", obj.viTri && layNhanDoLech(obj.viTri.doLech));
        html += row("Quy mô", obj.kichThuoc && layNhanQuyMo(obj.kichThuoc.quyMo));
        html += row("Chiều cao", obj.kichThuoc && layNhanChieuCao(obj.kichThuoc.chieuCao));
        html += row("Bề rộng", obj.kichThuoc && layNhanBeRong(obj.kichThuoc.beRong));
        html += row("Hình dạng", obj.hinhThe && layNhanHinhDang(obj.hinhThe.dang));
        html += row("Quan hệ với nhà", obj.hinhThe && layNhanHuongTacDong(obj.hinhThe.huongTacDong));
        if (obj.hinhThe && obj.hinhThe.coXung) html += row("Có xung", "Có");
        if (obj.hinhThe && obj.hinhThe.coCheChan) html += row("Có che chắn", "Có");
        html += row("Tính chất", obj.tinhChat && layNhanDongTinhTT(obj.tinhChat.dongTinh));
        if (obj.thuy && obj.thuy.coNuoc) {
            html += row("Có nước", "Có");
            html += row("Loại nước", obj.thuy && layNhanLoaiNuoc(obj.thuy.loaiNuoc));
            html += row("Trạng thái", obj.thuy && layNhanTinhTrangNuoc(obj.thuy.tinhTrang));
            html += row("Hướng chảy", obj.thuy && layNhanHuongChay(obj.thuy.huongChay));
        }
        if (obj.duong && obj.duong.coDuong) {
            html += row("Có đường", "Có");
            html += row("Loại đường", obj.duong && (layNhanLoai(obj.nhom, obj.duong.loai) || obj.duong.loai));
            html += row("Hướng", obj.duong && layNhanHuongDuong(obj.duong.huongDi));
            html += row("Lưu lượng", obj.duong && layNhanLuuLuong(obj.duong.luuLuong));
        }
        if (obj.ghiChu) {
            html += '<div class="ld-detail-ghichu"><b>Ghi chú:</b><br>' + escHtml(obj.ghiChu) + '</div>';
        }
        return html;
    }

    // ====================================================================
    // 19. MODAL TỨ TƯỢNG (giữ V1 + bổ sung các trường mô tả)
    // ====================================================================
    function moModalTuTuong(key) {
        var data = loanDauData.tuTuong[key];
        if (!data) return;

        var overlay = document.getElementById("ld-tutuong-modal-overlay");
        if (!overlay) return;

        var tenTuTuong2 = { thanhLong: "Thanh Long", bachHo: "Bạch Hổ", chuTuoc: "Chu Tước", huyenVu: "Huyền Vũ" };
        var iconTuTuong2 = { thanhLong: "🐉", bachHo: "🐅", chuTuoc: "🐦", huyenVu: "🐢" };

        var title = document.getElementById("ld-tutuong-modal-title");
        if (title) {
            title.textContent = (iconTuTuong2[key] || "") + " " + (tenTuTuong2[key] || key);
        }

        var elVatThe = document.getElementById("ld-tt-vatthe");
        if (elVatThe) elVatThe.value = (data.vatThe && data.vatThe.length > 0) ? data.vatThe.join(", ") : "";

        var elCaoThap = document.getElementById("ld-tt-caothap");
        if (elCaoThap) elCaoThap.value = data.caoThap || "";

        var elGanXa = document.getElementById("ld-tt-ganxa");
        if (elGanXa) elGanXa.value = data.ganXa || "";

        var elDongTinh = document.getElementById("ld-tt-dongtinh");
        if (elDongTinh) elDongTinh.value = data.dongTinh || "";

        var elGhiChu = document.getElementById("ld-tt-ghichu");
        if (elGhiChu) elGhiChu.value = data.ghiChu || "";

        overlay.setAttribute("data-tutuong-key", key);
        overlay.classList.add("active");
    }

    function dongModalTuTuong() {
        var overlay = document.getElementById("ld-tutuong-modal-overlay");
        if (overlay) overlay.classList.remove("active");
    }

    function luuModalTuTuong() {
        var overlay = document.getElementById("ld-tutuong-modal-overlay");
        if (!overlay) return;
        var key = overlay.getAttribute("data-tutuong-key");
        if (!key || !loanDauData.tuTuong[key]) return;

        var elVatThe = document.getElementById("ld-tt-vatthe");
        var elCaoThap = document.getElementById("ld-tt-caothap");
        var elGanXa = document.getElementById("ld-tt-ganxa");
        var elDongTinh = document.getElementById("ld-tt-dongtinh");
        var elGhiChu = document.getElementById("ld-tt-ghichu");

        var vatTheText = elVatThe ? elVatThe.value : "";
        var vatTheArr = vatTheText.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });

        loanDauData.tuTuong[key] = {
            ghiChu: elGhiChu ? elGhiChu.value : "",
            vatThe: vatTheArr,
            caoThap: elCaoThap ? elCaoThap.value : "",
            ganXa: elGanXa ? elGanXa.value : "",
            dongTinh: elDongTinh ? elDongTinh.value : ""
        };

        dongModalTuTuong();
        renderLoanDauTuTuong();
    }

    // ====================================================================
    // 20. RESET TOÀN BỘ
    // ====================================================================
    function resetLoanDau() {
        if (!confirm("Xóa toàn bộ dữ liệu Loan Đầu trong phiên hiện tại?")) return;

        loanDauData = {
            cungDangChon: 4,
            cungTrangThai: taoCungTrangThaiMacDinh(),
            doiTuong: [],
            tuTuong: {
                thanhLong: taoTuTuongMacDinh(),
                bachHo: taoTuTuongMacDinh(),
                chuTuoc: taoTuTuongMacDinh(),
                huyenVu: taoTuTuongMacDinh()
            },
            minhDuong: taoMinhDuongMacDinh()
        };

        renderLoanDau();
    }

    // ====================================================================
    // 21. KHỞI TẠO
    // ====================================================================
    function initLoanDau() {
        var container = document.getElementById("ld-container");
        if (!container) return;

        renderLoanDau();

        // Modal thêm/sửa
        var overlay = document.getElementById("ld-v2-modal-overlay");
        if (overlay) {
            overlay.addEventListener("click", function (e) {
                if (e.target === overlay) dongModalV2();
            });

            var btnDong = document.getElementById("ld-v2-modal-dong");
            if (btnDong) btnDong.addEventListener("click", dongModalV2);

            var btnLuu = document.getElementById("ld-v2-modal-luu");
            if (btnLuu) btnLuu.addEventListener("click", luuModalV2);

            // Đổi cung trong modal
            var selCung = document.getElementById("ld-v2-f-cung");
            if (selCung) {
                selCung.addEventListener("change", function () {
                    modalState.cungIndex = parseInt(this.value, 10);
                    var cungMoi = layCungTheoIndex(modalState.cungIndex);
                    var objEdit = null;
                    if (modalState.mode === "edit" && modalState.editId) {
                        objEdit = layDoiTuongTheoId(modalState.editId);
                    }
                    var titleEl = document.getElementById("ld-v2-modal-title");
                    if (titleEl) {
                        titleEl.textContent = (modalState.mode === "add" ? "➕ Thêm ngoại cảnh" : "✏️ Sửa ngoại cảnh") + " — " + cungMoi.ten + " (" + cungMoi.kyHieu + ")";
                    }
                    var objNhanNhom = objEdit ? objEdit.nhom : "";
                    renderV2Fields(objNhanNhom, objEdit);
                });
            }
        }

        // Modal chi tiết
        var detailOverlay = document.getElementById("ld-v2-detail-overlay");
        if (detailOverlay) {
            detailOverlay.addEventListener("click", function (e) {
                if (e.target === detailOverlay) dongModalChiTiet();
            });
            var btnDetailDong = document.getElementById("ld-v2-detail-dong");
            if (btnDetailDong) btnDetailDong.addEventListener("click", dongModalChiTiet);
        }

        // Modal tứ tượng
        var ttOverlay = document.getElementById("ld-tutuong-modal-overlay");
        if (ttOverlay) {
            ttOverlay.addEventListener("click", function (e) {
                if (e.target === ttOverlay) dongModalTuTuong();
            });

            var btnTTDong = document.getElementById("ld-tutuong-modal-dong");
            if (btnTTDong) btnTTDong.addEventListener("click", dongModalTuTuong);

            var btnTTLuu = document.getElementById("ld-tutuong-modal-luu");
            if (btnTTLuu) btnTTLuu.addEventListener("click", luuModalTuTuong);
        }

        // Nút reset
        var btnReset = document.getElementById("ld-btn-reset");
        if (btnReset) btnReset.addEventListener("click", resetLoanDau);

        // Khi đổi hướng nhà -> xoay lại vị trí cung (dữ liệu không đổi)
        var ldDoSo = document.getElementById("doSoTay");
        if (ldDoSo) {
            ldDoSo.addEventListener("input", function () {
                renderLoanDauCacCung();
                renderLoanDauTongQuan();
            });
        }

        // ESC đóng modal
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                dongModalV2();
                dongModalChiTiet();
                dongModalTuTuong();
            }
        });
    }

    // ====================================================================
    // 22. EXPOSE API PUBLIC
    // ====================================================================
    window.loanDauThemDoiTuong = loanDauThemDoiTuong;
    window.loanDauSuaDoiTuong = loanDauSuaDoiTuong;
    window.loanDauXoaDoiTuong = loanDauXoaDoiTuong;
    window.loanDauLayDoiTuong = loanDauLayDoiTuong;
    window.loanDauLayTheoCung = layDoiTuongTheoCung;
    window.loanDauChonCung = loanDauChonCung;
    window.loanDauLayTuTuong = loanDauLayTuTuong;
    window.loanDauLayMinhDuong = loanDauLayMinhDuong;
    window.loanDauLayTongQuan = loanDauLayTongQuan;
    window.initLoanDau = initLoanDau;

    // ====================================================================
    // 23. KHỞI TẠO TỰ ĐỘNG
    // ====================================================================
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLoanDau);
    } else {
        initLoanDau();
    }

})();