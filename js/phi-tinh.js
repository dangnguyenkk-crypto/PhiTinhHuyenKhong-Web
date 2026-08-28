// ====================================================================
// phi-tinh.js
// Tab Phi Tinh Nội Khí — tính toán Cửu Cung
// ====================================================================

const DUONG_BAY = [5,6,7,8,9,1,2,3,4];
const CUNG_TO_SO = {"Khảm":1,"Khôn":2,"Chấn":3,"Tốn":4,"Trung":5,"Càn":6,"Đoài":7,"Cấn":8,"Ly":9};
// Bảng ngũ hành lấy từ luan-giai.js (nguồn chung với Tìm Nhà, Cửu Cung Lưới) — fallback giữ nguyên nếu file chưa load
const HANH_CUA_SAO = window.HANH_CUA_SAO || {1:"Thủy",2:"Thổ",3:"Mộc",4:"Mộc",5:"Thổ",6:"Kim",7:"Kim",8:"Thổ",9:"Hỏa"};
const HANH_SINH = window.HANH_SINH || {"Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim","Kim":"Thủy","Thủy":"Mộc"};
const HANH_KHAC = window.HANH_KHAC || {"Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim","Kim":"Mộc"};
const HANH_CUA_CUNG = window.HANH_CUA_CUNG || {"Khảm":"Thủy","Khôn":"Thổ","Chấn":"Mộc","Tốn":"Mộc","Trung":"Thổ","Càn":"Kim","Đoài":"Kim","Cấn":"Thổ","Ly":"Hỏa"};

// Mở popup chi tiết dùng chung (markup #infoModal có sẵn trong index.html, style trong style.css)
function moInfoModal(tieuDe, noiDungHTML) {
    let modal = document.getElementById("infoModal");
    if (!modal) return;
    document.getElementById("infoModalTitle").textContent = tieuDe;
    document.getElementById("infoModalContent").innerHTML = noiDungHTML;
    modal.classList.add("active");
}
function dongInfoModal() {
    let modal = document.getElementById("infoModal");
    if (modal) modal.classList.remove("active");
}
window.moInfoModal = moInfoModal;
window.dongInfoModal = dongInfoModal;

// QUY TẮC 1: quan hệ ngũ hành giữa 1 sao và cung nó đóng — đây là căn cứ hung/cát CỐ ĐỊNH, làm gốc cho mọi luận giải.
function qCungGoc(hanhCung, sao) {
    if (typeof window.xetQuanHeNguHanh === 'function') return window.xetQuanHeNguHanh(hanhCung, sao);
    // Fallback (nếu chưa load luan-giai.js) — logic gốc giữ nguyên
    let hs = HANH_CUA_SAO[sao];
    if (hanhCung===hs) return {dienGiai:`đồng hành (${hs})`, loai:"binh", nhan:"Bình ổn", diem:0};
    if (HANH_SINH[hs]===hanhCung) return {dienGiai:`${hs} sinh ${hanhCung}`, loai:"tot", nhan:"Sinh nhập — TỐT", diem:1};
    if (HANH_SINH[hanhCung]===hs) return {dienGiai:`${hanhCung} sinh ${hs}`, loai:"hao_tan", nhan:"Hao tán — trung bình", diem:0};
    if (HANH_KHAC[hs]===hanhCung) return {dienGiai:`${hs} khắc ${hanhCung}`, loai:"xau", nhan:"Khắc nhập — XẤU trọng tâm", diem:-1};
    if (HANH_KHAC[hanhCung]===hs) return {dienGiai:`${hanhCung} khắc ${hs}`, loai:"che_nhe", nhan:"Cung chế sao — nhẹ", diem:0};
    return {dienGiai:"bình hòa", loai:"binh", nhan:"Bình ổn", diem:0};
}

// Dựng câu quan hệ ngũ hành có gắn nhãn vai trò (Sơn/Hướng/Vận/Niên/Nguyệt/Nhật) thay cho dạng chung
// "Mộc khắc Thổ" — ví dụ "Sơn (Mộc) khắc cung (Thổ)". Dựa theo q.loai (5 giá trị cố định trả về từ
// qCungGoc/xetQuanHeNguHanh: binh/tot/hao_tan/xau/che_nhe) để chọn đúng chiều sinh/khắc mà không cần
// đụng tới hàm xetQuanHeNguHanh gốc (dùng chung cho nhiều nơi khác trong app).
function moTaQuanHeCoNhan(nhanNgan, hanhSaoNay, hanhCungXet, qLoai) {
    switch (qLoai) {
        case "binh": return `${nhanNgan} (${hanhSaoNay}) đồng hành với cung (${hanhCungXet})`;
        case "tot": return `${nhanNgan} (${hanhSaoNay}) sinh cung (${hanhCungXet})`;
        case "hao_tan": return `Cung (${hanhCungXet}) sinh ${nhanNgan.toLowerCase()} (${hanhSaoNay})`;
        case "xau": return `${nhanNgan} (${hanhSaoNay}) khắc cung (${hanhCungXet})`;
        case "che_nhe": return `Cung (${hanhCungXet}) khắc ${nhanNgan.toLowerCase()} (${hanhSaoNay})`;
        default: return `${nhanNgan} (${hanhSaoNay}) — cung (${hanhCungXet})`;
    }
}

function lapTinhBan(saoChu, laThuan) {
    let tinhBan = new Array(10);
    for (let i = 0; i < 9; i++) {
        let sao = laThuan ? (saoChu+i-1)%9+1 : ((saoChu-i-1)%9+9)%9+1;
        tinhBan[DUONG_BAY[i]] = sao;
    }
    return tinhBan;
}
function laySoNhapTrungTuVanBan(bDoVan, sonInfo) { return bDoVan[CUNG_TO_SO[sonInfo.cung]]; }

// ===== THÀNH MÔN — Cứu nguy cho cục Địa (không Vượng Sơn Vượng Hướng) =====
// Xét tại 2 CUNG BÁT QUÁI liền kề 2 bên cung Hướng, theo đúng VỊ TRÍ ĐỊA LÝ thực trên la bàn Hậu
// Thiên Bát Quái (khác thứ tự phi tinh DUONG_BAY): Khảm-Cấn-Chấn-Tốn-Ly-Khôn-Đoài-Càn-(quay lại Khảm).
const VONG_VI_TRI_BAT_QUAI = ["Khảm","Cấn","Chấn","Tốn","Ly","Khôn","Đoài","Càn"];
function timHaiCungLienKeHuong(quaiHuong) {
    let idx = VONG_VI_TRI_BAT_QUAI.indexOf(quaiHuong);
    if (idx === -1) return null;
    return {
        trai: VONG_VI_TRI_BAT_QUAI[(idx - 1 + 8) % 8],
        phai: VONG_VI_TRI_BAT_QUAI[(idx + 1) % 8]
    };
}
// Số Hà Đồ theo quái (dùng số Lạc Thư cố định CUNG_TO_SO của quái): 1-6 Thủy, 2-7 Hỏa, 3-8 Mộc,
// 4-9 Kim, 5-10 Thổ. Quái nào ghép cặp Hà Đồ với quái Hướng thì là Thành Môn CHÍNH, còn lại là PHỤ.
const CAP_HA_DO_THEO_SO = {1:6,6:1, 2:7,7:2, 3:8,8:3, 4:9,9:4};
function laQuaiCapHaDo(quaiA, quaiHuong) {
    let soA = CUNG_TO_SO[quaiA], soHuong = CUNG_TO_SO[quaiHuong];
    return CAP_HA_DO_THEO_SO[soHuong] === soA;
}
// Xác định chiều bay (thuận/nghịch) của "sao thế" = Vận tinh tại 1 quái đang xét, để lập bàn phụ
// kiểm tra đắc khí. Nguyên tắc: LUÔN tìm sơn CÙNG Nguyên Long với Hướng nhà (Địa/Thiên/Nhân) trong
// quái đang xét — rồi lấy ÂM DƯƠNG của chính sơn đó tại quái này để định chiều bay. Vì mỗi quái có
// thể có sơn cùng Nguyên Long là Âm hoặc Dương khác nhau (ví dụ Hướng nhà Thiên Âm, nhưng quái đang
// xét lại có sơn Thiên Dương) — vẫn cùng Nguyên Long, chỉ khác Âm Dương theo đúng quái đó, không
// phải luôn lấy Nguyên Long/Âm Dương của Hướng nhà áp đặt lên quái khác. Áp dụng thống nhất cho cả
// trường hợp soVanTinh=5 (không có quái cai quản riêng, dùng ngay quái đang xét) lẫn soVanTinh khác.
function chieuBaySaoTheThanhMon(soVanTinh, quaiDangXet, nguyenLongHuong) {
    let quaiTraCuu = (soVanTinh === 5) ? quaiDangXet : SO_TO_CUNG[soVanTinh];
    if (quaiTraCuu === "Trung") return null; // không thể xác định, bỏ qua
    let sonCungNguyenLong = DS24_SON.find(x => x.cung === quaiTraCuu && x.nguyenLong === nguyenLongHuong);
    return sonCungNguyenLong ? sonCungNguyenLong.amDuong === "Duong" : null;
}
// Xét 1 quái ứng viên Thành Môn: trả về null nếu không đắc khí (bị loại), hoặc object mô tả nếu đắc khí.
function xetMotCungThanhMon(quaiDangXet, laChinh, bVan, van, huongSon) {
    let soVanTinh = bVan[CUNG_TO_SO[quaiDangXet]];
    let laThuanTheThanhMon = chieuBaySaoTheThanhMon(soVanTinh, quaiDangXet, huongSon.nguyenLong);
    if (laThuanTheThanhMon === null) return null;
    let banThe = lapTinhBan(soVanTinh, laThuanTheThanhMon);
    let saoTaiQuaiDangXet = banThe[CUNG_TO_SO[quaiDangXet]];
    let dacKhi = (saoTaiQuaiDangXet === van); // sao vượng đương lệnh (= số Vận hiện tại) bay tới đúng vị trí
    if (!dacKhi) return null;
    // Đắc khí -> tìm đúng sơn cùng Nguyên Long với Hướng trong 3 sơn của quái này để đặt điểm Thành Môn cụ thể
    let sonThanhMon = DS24_SON.find(x => x.cung === quaiDangXet && x.nguyenLong === huongSon.nguyenLong);
    return {
        quai: quaiDangXet, loai: laChinh ? "Chính" : "Phụ",
        soVanTinh, laThuanTheThanhMon, saoTaiQuaiDangXet,
        sonThanhMon: sonThanhMon ? sonThanhMon.ten : null
    };
}
// Hàm chính: trả về mảng 0-2 phần tử (Thành Môn đắc khí thực sự tồn tại, có thể 0, 1, hoặc cả 2 nếu
// cả 2 cung đều đắc khí — hiếm nhưng về lý thuyết có thể xảy ra).
function xetThanhMon(huongSon, bVan, van) {
    let haiCung = timHaiCungLienKeHuong(huongSon.cung);
    if (!haiCung) return [];
    let ketQua = [];
    for (let quai of [haiCung.trai, haiCung.phai]) {
        let laChinh = laQuaiCapHaDo(quai, huongSon.cung);
        let kq = xetMotCungThanhMon(quai, laChinh, bVan, van, huongSon);
        if (kq) ketQua.push(kq);
    }
    return ketQua;
}

// Quy đổi Năm -> Vận (Tam Nguyên Cửu Vận, chu kỳ 180 năm = 9 Vận x 20 năm, lặp lại vô hạn cả quá khứ lẫn tương lai).
// Mốc gốc: Vận 1 = 1864-1883 ... Vận 9 = 2024-2043, rồi lặp lại Vận 1 = 2044-2063, v.v.
function tinhVanTuNam(nam) {
    let offset = nam - 1864;
    let m = ((offset % 180) + 180) % 180; // luôn dương, 0..179 — cho phép nam < 1864
    return Math.floor(m / 20) + 1; // 1..9
}
function tinhSaoNien(nam) {
    let giapTyGoc, saoGoc;
    if (nam>=1864&&nam<=1923){giapTyGoc=1864;saoGoc=1;}else if(nam>=1924&&nam<=1983){giapTyGoc=1924;saoGoc=4;}
    else if(nam>=1984&&nam<=2043){giapTyGoc=1984;saoGoc=7;}else if(nam>=2044&&nam<=2103){giapTyGoc=2044;saoGoc=1;}
    else if(nam>=2104&&nam<=2163){giapTyGoc=2104;saoGoc=4;}else if(nam<1864){giapTyGoc=1864;saoGoc=1;}else{giapTyGoc=1984;saoGoc=7;}
    return ((saoGoc-1-(nam-giapTyGoc))%9+9)%9+1;
}
function layDiaChiNam(nam) { return ["Tý","Sửu","Dần","Mão","Thìn","Tị","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"][((nam+8)%12+12)%12]; }

// ==================================================================
// TAM SÁT (lưu niên theo Chi năm) — chuyển từ tim-nha.js (TN_CHI_TO_TAMSAT/
// TN_TAM_SAT_LOAI) để dùng chung cho "Tổng kết toàn nhà" bên tab Nội Khí.
// Tam Sát: 3 sơn bị sát nằm ở phương ĐỐI XUNG với cục Tam Hợp của Chi năm đó.
// Chỉ kỵ TỌA (đại kỵ động thổ/tu sửa đúng chỗ lưng nhà tựa vào phương Tam Sát).
// ==================================================================
const CHI_TO_TAM_SAT = {
    "Thân":["Tị","Ngọ","Mùi"], "Tý":["Tị","Ngọ","Mùi"], "Thìn":["Tị","Ngọ","Mùi"],
    "Dần":["Hợi","Tý","Sửu"], "Ngọ":["Hợi","Tý","Sửu"], "Tuất":["Hợi","Tý","Sửu"],
    "Tị":["Dần","Mão","Thìn"], "Dậu":["Dần","Mão","Thìn"], "Sửu":["Dần","Mão","Thìn"],
    "Hợi":["Thân","Dậu","Tuất"], "Mão":["Thân","Dậu","Tuất"], "Mùi":["Thân","Dậu","Tuất"]
};
const TAM_SAT_LOAI = [
    { ten: "Kiếp Sát", giaiDoan: "Tuyệt", moTa: "Cực kỳ hung bạo, chủ về tai nạn bất ngờ, cướp đoạt, mất mát tài sản." },
    { ten: "Tai Sát",  giaiDoan: "Thai",  moTa: "Tấn công từ từ, chủ về bệnh tật, hao tổn thể chất, áp lực kéo dài." },
    { ten: "Tuế Sát",  giaiDoan: "Dưỡng", moTa: "Đánh vào nền tảng, chủ về hao tán vì tiểu nhân, kiện tụng rườm rà." }
];
function xacDinhLoaiTamSat(chiNam, tenSon) {
    let nhom = CHI_TO_TAM_SAT[chiNam];
    if (!nhom) return null;
    let idx = nhom.indexOf(tenSon);
    if (idx === -1) return null;
    return TAM_SAT_LOAI[idx];
}

// ==================================================================
// TAM BAN QUÁI (三般卦) — cách cục TOÀN CỤC: cả 9 cung của bàn đều có Vận-
// Sơn-Hướng cùng nhóm 1-4-7 / 2-5-8 / 3-6-9. Chuyển từ tim-nha.js.
// ==================================================================
const NHOM_TAM_BAN_QUAI = {1:"1-4-7",4:"1-4-7",7:"1-4-7", 2:"2-5-8",5:"2-5-8",8:"2-5-8", 3:"3-6-9",6:"3-6-9",9:"3-6-9"};
function xetTamBanQuaiMotCung(v, s, h) {
    if (NHOM_TAM_BAN_QUAI[v] === NHOM_TAM_BAN_QUAI[s] && NHOM_TAM_BAN_QUAI[s] === NHOM_TAM_BAN_QUAI[h]) return NHOM_TAM_BAN_QUAI[v];
    return null;
}
function xetTamBanQuaiToanCuc(bVan, bSon, bHuong) {
    for (let i = 1; i <= 9; i++) {
        if (!xetTamBanQuaiMotCung(bVan[i], bSon[i], bHuong[i])) return false;
    }
    return true;
}

// ==================================================================
// THẤT TINH ĐẢ KIẾP (七星打劫) — bí pháp đặc biệt tốt, thông khí Tam Nguyên,
// phát phúc lâu dài qua hàng thế kỷ. Điều kiện:
//  1) Sao Vận nhập trạch (van) phải xuất hiện ở Sơn tinh HOẶC Hướng tinh
//     TẠI CUNG HƯỚNG của nhà (sf/hf) — không xét tại Tọa.
//  2) Vận tinh (bVan) tại 3 cung Càn-Ly-Chấn CÙNG một nhóm Tam Ban Quái
//     (1-4-7 / 2-5-8 / 3-6-9) → Đả Kiếp THẬT, không cần thêm điều kiện gì khác.
//  3) Hoặc Vận tinh tại 3 cung Tốn-Khảm-Đoài cùng nhóm → Đả Kiếp GIẢ, hiệu
//     quả phụ thuộc nhiều vào hình thế Loan Đầu (núi, nước) tại cung Tốn có
//     đẹp hay không — app chưa đo được Loan Đầu nên chỉ nhắc người dùng tự xét.
// Trả về null nếu không đạt, hoặc { loai: "that"/"gia", nhom, saoVanKhop: "S"/"H"/"S,H" }.
// ==================================================================
function xetThatTinhDaKiep(van, sf, hf, bVan) {
    if (!bVan) return null;
    let saoVanKhop = [];
    if (sf === van) saoVanKhop.push("S");
    if (hf === van) saoVanKhop.push("H");
    if (saoVanKhop.length === 0) return null; // điều kiện 1 không đạt

    let soCan = CUNG_TO_SO["Càn"], soLy = CUNG_TO_SO["Ly"], soChan = CUNG_TO_SO["Chấn"];
    let soTon = CUNG_TO_SO["Tốn"], soKham = CUNG_TO_SO["Khảm"], soDoai = CUNG_TO_SO["Đoài"];

    let nhomThat = NHOM_TAM_BAN_QUAI[bVan[soCan]];
    let laThat = nhomThat && nhomThat === NHOM_TAM_BAN_QUAI[bVan[soLy]] && nhomThat === NHOM_TAM_BAN_QUAI[bVan[soChan]];
    if (laThat) return { loai: "that", nhom: nhomThat, saoVanKhop: saoVanKhop.join(",") };

    let nhomGia = NHOM_TAM_BAN_QUAI[bVan[soTon]];
    let laGia = nhomGia && nhomGia === NHOM_TAM_BAN_QUAI[bVan[soKham]] && nhomGia === NHOM_TAM_BAN_QUAI[bVan[soDoai]];
    if (laGia) return { loai: "gia", nhom: nhomGia, saoVanKhop: saoVanKhop.join(",") };

    return null;
}

// ==================================================================
// TỔ HỢP KHÔI TINH (1-6, cặp V-S hoặc V-H tại cung Hướng) — chuyển từ
// tim-nha.js (TN_TO_HOP_VSH_HUONG). Cặp S-H tại Hướng đã được xét riêng ở
// TO_HOP_SON_HUONG_DAC_BIET (luan-giai.js)/toHopDacBiet — không lặp lại.
// ==================================================================
function xetKhoiTinhVH(v, s, h) {
    let cap = [["V","S",v,s], ["V","H",v,h]];
    let ketQua = [];
    for (let [nhan1, nhan2, x, y] of cap) {
        let minMax = [Math.min(x,y), Math.max(x,y)].join("-");
        if (minMax === "1-6") ketQua.push({ cap: nhan1 + "-" + nhan2, saoA: x, saoB: y });
    }
    return ketQua;
}
function tinhSaoNguyet(nam, thang) {
    let chi = layDiaChiNam(nam);
    let khoi = ["Tý","Ngọ","Mão","Dậu"].includes(chi)?8:["Thìn","Tuất","Sửu","Mùi"].includes(chi)?5:2;
    return ((khoi-1-(thang-1))%9+9)%9+1;
}
const CAN_LIST = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
const CHI_LIST = ["Tý","Sửu","Dần","Mão","Thìn","Tị","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
const TRUNG_KHI = {"DongChi":{sao:1,thuan:true},"VuThuy":{sao:7,thuan:true},"CocVu":{sao:4,thuan:true},"HaChi":{sao:9,thuan:false},"XuThu":{sao:3,thuan:false},"SuongGiang":{sao:6,thuan:false}};
function thuTuLucGiap(can, chi) {
    let iCan = CAN_LIST.indexOf(can), iChi = CHI_LIST.indexOf(chi);
    for (let n = 0; n < 60; n++) { if (n%10===iCan && n%12===iChi) return n; } return 0;
}
function tinhSaoNhat(can, chi, trungKhiKey) {
    let info = TRUNG_KHI[trungKhiKey], soNgay = thuTuLucGiap(can, chi);
    return info.thuan ? ((info.sao-1+soNgay)%9+9)%9+1 : ((info.sao-1-soNgay)%9+9)%9+1;
}
function trangThaiThoiVan(sao, van) {
    let d = ((sao-van)%9+9)%9;
    switch (d) {
        case 0: return {ten:"Vượng khí", moTa:"Đương vận lệnh tinh, đại cát", loai:"cat"};
        case 1: return {ten:"Sinh khí", moTa:"Vị lai chi khí, chủ vượng đinh tài", loai:"cat"};
        case 2: return {ten:"Sinh khí (Viễn)", moTa:"Viễn sinh khí, tiệm phát", loai:"cat"};
        case 8: return {ten:"Suy khí (Thoái)", moTa:"Thoái khí, cát sự tiệm thất", loai:"binh"};
        case 7: return {ten:"Suy khí", moTa:"Suy bại chi khí, chủ suy vi", loai:"binh"};
        case 6: return {ten:"Tử/Sát khí", moTa:"Tử khí, vô dụng", loai:"hung"};
        case 5: return {ten:"Tử/Sát khí", moTa:"Sát khí, chủ đại hung", loai:"hung"};
        case 4: return {ten:"Tử/Sát khí", moTa:"Tử khí, hoạ hại", loai:"hung"};
        default: return {ten:"Tử/Sát khí", moTa:"Cực Tử khí, tổn đinh phá tài", loai:"hung"};
    }
}
// Thứ tự mức độ nguy hiểm của 9 sao (Huyền Không): 5 (Ngũ Hoàng) nguy hiểm nhất, rồi tới 2 (Nhị Hắc),
// 7 (Thất Xích), 3 (Tam Bích) — CHỈ 4 sao này được tô màu nổi bật để tránh gây áp lực thị giác. Các
// sao còn lại (1, 4, 6, 8, 9) coi là bình thường, không tô màu cảnh báo.
function getBgClass(sao) {
    if (sao === 5) return "bg-sao-5";
    if (sao === 2) return "bg-sao-2";
    if (sao === 7) return "bg-sao-7";
    if (sao === 3) return "bg-sao-3";
    return "bg-default";
}
// Dùng riêng cho các ô số trong bảng dự báo Ngày/Tháng/Năm — chỉ đổi MÀU CHỮ (không tô nền khối) để
// đỡ nặng thị giác hơn so với 9 cung chính. Chỉ áp dụng cho 4 sao nguy hiểm 5,2,7,3; còn lại màu đen
// bình thường (mucDoNguHiem trả về null).
function mauChuTheoSao(sao) {
    if (sao === 5) return "#b30000";
    if (sao === 2) return "#e53935";
    if (sao === 7) return "#f4511e";
    if (sao === 3) return "#c9860a";
    return null;
}
// ===== Tổng hợp "sao nặng nhất" giữa 3 cung TỌA / HƯỚNG / TRUNG + 1 CUNG TỰ DO cho bảng dự báo
// Ngày-Tháng-Năm ===== Trước đây 3 bảng chỉ xét sao lưu niên/nguyệt/nhật bay tới TRUNG CUNG. Giờ xét
// tối đa 4 nơi cùng lúc (tuỳ chọn qua checkbox #lichNhaXetToa/Huong/Trung + #lichNhaXetCungKhac với
// cung do người dùng chọn ở #lichNhaCungKhacChon), lấy sao nặng nhất theo đúng thứ tự nguy hiểm sẵn
// có của app: 5 (Ngũ Hoàng) > 2 (Nhị Hắc) > 7 (Thất Xích) > 3 (Tam Bích) — các sao khác (1,4,6,8,9)
// coi như nhau, không phân biệt thêm. Cung tự do trùng với Tọa/Hướng/Trung vẫn được tính bình thường,
// không cần cảnh báo hay loại trừ gì thêm (người dùng có thể cố ý chọn trùng để xem rõ hơn).
// LƯU Ý ĐẶC BIỆT: khi sao bay tới TRUNG CUNG đúng bằng 5 thì KHÔNG tính vào thống kê tại cung Trung
// (vì Ngũ Hoàng vốn luôn ở Trung cung khi nhập trung — không phải hiện tượng lưu niên/nguyệt/nhật ghé
// qua, nên không có giá trị cảnh báo thêm) — vẫn xét bình thường các cung còn lại đang được tick. Quy
// tắc loại trừ số 5 này CHỈ áp dụng riêng cho Trung cung, không áp dụng cho cung tự do (kể cả khi cung
// tự do đó lại trùng đúng vị trí Trung — nhưng Trung là 1 cung cố định, không thể chọn làm "cung khác").
const THU_TU_NANG_SAO = {5:4, 2:3, 7:2, 3:1}; // số càng lớn càng nặng; sao không có trong bảng = 0 (bình thường)
function doNangSao(sao) { return THU_TU_NANG_SAO[sao] || 0; }
// Đọc trạng thái 4 mục chọn cung cho Lịch nhà — mặc định TRUE/rỗng nếu chưa render (an toàn khi gọi sớm).
function layCoChonCungLichNha() {
    let elToa = document.getElementById("lichNhaXetToa");
    let elHuong = document.getElementById("lichNhaXetHuong");
    let elTrung = document.getElementById("lichNhaXetTrung");
    let elCungKhac = document.getElementById("lichNhaXetCungKhac");
    let elChonCungKhac = document.getElementById("lichNhaCungKhacChon");
    return {
        toa: elToa ? elToa.checked : true,
        huong: elHuong ? elHuong.checked : true,
        trung: elTrung ? elTrung.checked : true,
        cungKhac: elCungKhac ? elCungKhac.checked : false,
        tenCungKhac: elChonCungKhac ? elChonCungKhac.value : null
    };
}
// soTaiCungKhac: số Vận/Sơn/Hướng-tương-ứng của SAO LƯU NIÊN/NGUYỆT/NHẬT (không phải Vận/Sơn/Hướng cố
// định của nhà) tại đúng cung tự do đang chọn — do nơi gọi tự lập bàn và tra theo CUNG_TO_SO[tenCungKhac].
function saoNangNhatToaHuongTrung(saoToa, saoHuong, saoTrung, coChon, saoTaiCungKhac) {
    coChon = coChon || {toa:true, huong:true, trung:true, cungKhac:false};
    let ungVien = [];
    if (coChon.toa) ungVien.push(saoToa);
    if (coChon.huong) ungVien.push(saoHuong);
    if (coChon.trung && saoTrung !== 5) ungVien.push(saoTrung); // bỏ qua Trung cung nếu đúng là số 5
    if (coChon.cungKhac && saoTaiCungKhac !== undefined && saoTaiCungKhac !== null) ungVien.push(saoTaiCungKhac);
    let nangNhat = 0, doNang = -1;
    for (let s of ungVien) {
        if (doNangSao(s) > doNang) { doNang = doNangSao(s); nangNhat = s; }
    }
    return nangNhat; // 0 nghĩa là không có sao nào trong 4 sao nguy hiểm (hoặc không cung nào được tick) — bình thường
}
// Chú thích chung (legend) cho 3 bảng dự báo Ngày/Tháng/Năm — 1 ô vuông nhỏ màu tương ứng mỗi sao
// nguy hiểm, hiển thị 1 lần duy nhất bên dưới cả 3 bảng thay vì lặp lại ghi chú riêng từng bảng.
function chuThichMauSao() {
    let saoNguyHiem = [
        { sao: 5, ten: "Ngũ Hoàng", mau: "#b30000" },
        { sao: 2, ten: "Nhị Hắc", mau: "#e53935" },
        { sao: 7, ten: "Thất Xích", mau: "#f4511e" },
        { sao: 3, ten: "Tam Bích", mau: "#c9860a" }
    ];
    let o = saoNguyHiem.map(s => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${s.mau};"></span><span style="font-size:11.5px;color:#555;">${s.sao} ${s.ten}</span></span>`).join("");
    o += `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#795548;"></span><span style="font-size:11.5px;color:#555;">= thời điểm cần lưu ý (sao khác)</span></span>`;
    return `<div class="luan-giai-item"><div style="font-size:11px;color:#888;margin-bottom:4px;">Chú thích màu sao (áp dụng cho cả 3 bảng trên — tổng hợp theo các cung đang tick ở trên, lấy sao nặng nhất; riêng Trung cung ra đúng số 5 thì không tính):</div><div>${o}</div></div>`;
}
function quanHeNguHanh(saoChu, saoKhach) {
    let hC = HANH_CUA_SAO[saoChu], hK = HANH_CUA_SAO[saoKhach];
    if (hC===hK) return {quanHe:"Cùng hành",loai:"hoa",dienGiai:`${hK} gặp ${hC} — cộng hưởng, cùng tính chất`};
    if (HANH_SINH[hK]===hC) return {quanHe:"Khách sinh Chủ",loai:"cat",dienGiai:`${hK} sinh ${hC} — được trợ giúp, may mắn đến thụ động`};
    if (HANH_SINH[hC]===hK) return {quanHe:"Chủ sinh Khách",loai:"binh",dienGiai:`${hC} sinh ${hK} — phải hao tổn công sức, tiền bạc mới đạt được`};
    if (HANH_KHAC[hC]===hK) return {quanHe:"Chủ khắc Khách",loai:"binh",dienGiai:`${hC} khắc ${hK} — chủ động xử lý được, có quyền nhưng mệt`};
    if (HANH_KHAC[hK]===hC) return {quanHe:"Khách khắc Chủ",loai:"hung",dienGiai:`${hK} khắc ${hC} — hung, dễ bị quấy phá, hao tài hoặc bệnh tật`};
    return {quanHe:"Bình hòa",loai:"binh",dienGiai:"không sinh không khắc"};
}
const VAI_TRO_SAO = {Van:"Nền tảng, trí tuệ, văn chương", Son:"Sức khỏe, nhân đinh", Huong:"Tài lộc, sự nghiệp", Nien:"Quý nhân, pháp lý — cả năm", Nguyet:"Biến động trong tháng", Nhat:"Biến động trong ngày"};

// Ý nghĩa riêng của từng sao (không đổi theo vận) — khác nhau khi sao đó đang Vượng/Sinh so với khi đang Suy/Tử.
// Ý nghĩa 9 sao lấy từ luan-giai.js (nguồn chung, nội dung chi tiết hơn) — fallback giữ bản cũ nếu chưa load
const SAO_Y_NGHIA = window.SAO_Y_NGHIA || {
    1: {ten:"Nhất Bạch (Tham Lang)", cat:"nhân tài, trí tuệ, khoa cử, quý nhân, tài lộc về đường thủy, sáng tạo, thi cử đỗ đạt", hung:"tiêu tiền không kiểm soát, tình cảm rắc rối, đào hoa sát, trộm cắp, hao tổn trí lực", luuY:"khi suy dễ bị lường gạt; có thể ảnh hưởng thận, tai, huyết áp"},
    2: {ten:"Nhị Hắc (Cự Môn)", cat:"hưởng phúc tổ tiên, đất đai nhà cửa, sự ổn định lâu dài, bền vững", hung:"bệnh tật (đặc biệt dạ dày, phụ khoa), tai ách, hao tài — sao bệnh tật số 1", luuY:"rất hung khi suy, đặc biệt tại hướng Khôn hoặc Cấn, cần hóa giải mạnh"},
    3: {ten:"Tam Bích (Lộc Tồn)", cat:"thi cử, công danh, thăng tiến, sự nghiệp phát triển mạnh, sức khỏe tốt", hung:"kiện tụng, cãi vã, tranh chấp, mất mát, trộm cướp, phá sản do tranh tụng", luuY:"rất dữ khi suy, đặc biệt tại hướng Đông — là sao tranh đấu, nội chiến"},
    4: {ten:"Tứ Lục (Văn Khúc)", cat:"văn tài, học hành, khoa bảng, danh tiếng, tình duyên thắm thiết, thi cử đỗ đạt cao", hung:"tình cảm bê tha, ngoại tình, thị phi, lời nói vô nghĩa, giấy tờ sai sót", luuY:"khi vượng cực lợi cho du học, nghiên cứu; khi suy dễ sinh dâm đãng"},
    5: {ten:"Ngũ Hoàng (Liêm Trinh)", cat:"uy quyền, sự cai trị, chức tước, lãnh đạo, quyền lực", hung:"đại hung: bệnh nan y, tai họa, tán gia bại sản, mất người thân — sát khí tối thượng", luuY:"không bao giờ thật sự vượng, dù ở đâu cũng nên chủ động hóa giải"},
    6: {ten:"Lục Bạch (Vũ Khúc)", cat:"quyền lực, tài chính, lộc, phẩm tước, quý nhân, được cấp trên/cha mẹ giúp đỡ", hung:"mất chức, tai nạn vì kim khí, hao tài vì quan hệ, bị lừa dối", luuY:"khi vượng tốt cho chính trị, doanh nhân; khi suy dễ tai nạn giao thông"},
    7: {ten:"Thất Xích (Phá Quân)", cat:"đột phá mạnh mẽ, chiến thắng, tài chính đột biến, cải cách thành công", hung:"đào hoa sát, trộm cướp, hỏa hoạn, ly tán, mất mát vì chuyện tình cảm/xã hội đen", luuY:"là sao đào hoa nhưng tàn phá; khi suy dễ có án mạng hoặc bệnh về phổi"},
    8: {ten:"Bát Bạch (Tả Phù)", cat:"đại lộc, phú quý, đinh khí vượng, nhà cửa đất đai, thịnh vượng lâu dài, nhiều con cháu", hung:"tài ứ đọng không sinh lời, đinh suy, bất động sản trì trệ, sức khỏe xương khớp kém", luuY:"là sao tài lộc hàng đầu khi vượng; khi suy chỉ như đất bỏ hoang"},
    9: {ten:"Cửu Tử (Hữu Bật)", cat:"danh vọng, công danh, rạng danh, thành công nổi bật, văn hóa truyền thông, may mắn đột xuất", hung:"hỏa hoạn, tai nạn về lửa/điện, thị phi do lời nói, bệnh về mắt, tim mạch, huyết áp", luuY:"khi vượng rất sáng danh; khi suy có thể gây họa như sao Ngũ Hoàng"},
};
// Ghép ý nghĩa riêng của sao với trạng thái vượng-suy hiện tại: cat dùng nghĩa tốt, hung dùng nghĩa xấu,
// còn binh (Suy khí/Thoái khí) thì nghĩa tốt đã nhạt dần, chưa tới mức xấu hẳn — cần kích hoạt lại.
function yNghiaSaoTheoVan(sao, loaiTt) {
    let sy = SAO_Y_NGHIA[sao];
    let ten = sy.tenKhac ? `${sy.ten} (${sy.tenKhac})` : sy.ten; // tương thích cả 2 dạng dữ liệu (gộp sẵn hoặc tách riêng)
    if (loaiTt === "cat") return `${ten} đang phát đúng bản chất tốt: ${sy.cat}.`;
    if (loaiTt === "hung") return `${ten} đang lộ mặt xấu: ${sy.hung}.`;
    return `${ten} vốn tốt về "${sy.cat.split(",")[0]}..." nhưng nay đã qua vận, khí nhạt dần, chưa phát huy được như trước, cần kích hoạt lại mới dùng được.`;
}

// ===== HÀM XÁC ĐỊNH CHIỀU BAY — PHÉP THẾ QUÁI (theo Trạch Vận Tân Án) =====
// Lạc Thư số -> quái, dùng để tra quái cai quản tại phương Tọa/Hướng theo đúng số vận bàn bay tới đó.
const SO_TO_CUNG = {1:"Khảm",2:"Khôn",3:"Chấn",4:"Tốn",5:"Trung",6:"Càn",7:"Đoài",8:"Cấn",9:"Ly"};

// sonGoc: object Sơn từ DS24_SON tại đúng phương Tọa hoặc Hướng thực tế (có ten, cung, nguyenLong).
// bVan: Vận bàn đã lập sẵn (lapTinhBan(van, true)) — vận bàn luôn thuận, không xét âm dương.
// Cách làm: lấy số vận bàn tại cung của sonGoc -> tra quái cai quản (Lạc Thư) -> quái đó cai quản
// 3 sơn thuộc 3 tầng Nguyên Long khác nhau -> chọn sơn CÙNG tầng Nguyên Long với sonGoc -> âm dương
// của sơn ấy (không phải của sonGoc) quyết định thuận (Dương) hay nghịch (Âm).
function xacDinhChieuBayTheoNguyenLong(sonGoc, bVan) {
    let soTaiCung = bVan[CUNG_TO_SO[sonGoc.cung]];
    let quaiCaiQuan = SO_TO_CUNG[soTaiCung];
    // Khi Sơn tinh hoặc Hướng tinh nhập trung là số 5 (Ngũ Hoàng): Trung cung không có quẻ để đối
    // chiếu Nguyên Long, nên lấy âm dương của chính Tọa sơn/Hướng sơn của ngôi nhà (sonGoc) để
    // quyết định thuận/nghịch phi — không tra qua quái đại diện.
    if (quaiCaiQuan === "Trung") {
        return sonGoc.amDuong === "Duong";
    }
    let sonDaiDien = DS24_SON.find(x => x.cung === quaiCaiQuan && x.nguyenLong === sonGoc.nguyenLong);
    return sonDaiDien.amDuong === "Duong"; // true = thuận phi, false = nghịch phi
}

// ===== SAO THẾ — PHÉP THẾ QUÁI KIÊM HƯỚNG (theo thế_quẻ.md) =====
// LƯU Ý: khác với xacDinhChieuBayTheoNguyenLong ở trên (chọn chiều bay thuận/nghịch để LẬP BÀN gốc).
// Đây là bước bổ sung: khi độ hướng thực tế lệch tâm sơn phải kiêm hướng (xem xetKiemHuongTheQuai),
// ta cần tìm 1 SỐ SAO THẾ để nhập trung phụ, phi thêm 1 bàn phụ hiển thị kế bên sao gốc (vd S8_t7).
//
// Bảng thế cố định — chỉ áp dụng cho ĐÚNG cặp (sơn đại diện, số gốc) liệt kê dưới đây. 11 sơn còn
// lại (Tý, Quý, Mùi, Khôn, Tuất, Càn, Hợi, Tân, Dậu, Ngọ, Đinh) không cần thế vì vốn đã là sao chính.
const BANG_THE_SON = {
    "Giáp_3": 1, "Thân_2": 1,
    "Nhâm_1": 2, "Mão_3": 2, "Ất_3": 2,
    "Thìn_4": 6, "Tốn_4": 6, "Tỵ_4": 6,
    "Sửu_8": 7, "Cấn_8": 7, "Bính_9": 7,
    "Dần_8": 9, "Canh_7": 9
};
// soGoc: số sao tại Trung Cung (Sơn tinh hoặc Hướng tinh) CẦN thế.
// nguyenLongSonGoc: Nguyên Long ("Dia"/"Thien"/"Nhan") của chính Sơn Tọa (nếu thế cho sao Sơn) hoặc
// của Sơn Hướng (nếu thế cho sao Hướng) — mỗi sao dùng Nguyên Long của chính mình, không dùng chung.
// Trả về số sao thế, hoặc null nếu không cần thế (soGoc=5, hoặc sơn đại diện không nằm trong 13 sơn cần thế).
function timSaoThe(soGoc, nguyenLongSonGoc) {
    if (!soGoc || soGoc === 5) return null; // Ngũ Hoàng nhập trung không có quái để tra sơn đại diện
    let quaiCaiQuan = SO_TO_CUNG[soGoc];
    if (quaiCaiQuan === "Trung") return null;
    let sonDaiDien = DS24_SON.find(x => x.cung === quaiCaiQuan && x.nguyenLong === nguyenLongSonGoc);
    if (!sonDaiDien) return null;
    let key = sonDaiDien.ten + "_" + soGoc;
    return BANG_THE_SON[key] || null; // sơn đại diện không nằm trong 13 sơn cần thế -> không thế
}

// Lập bàn Sao Thế: dùng đúng chiều bay (laThuan) đã tính cho bàn Sơn/Hướng GỐC — không tính lại âm
// dương riêng cho sao thế, theo đúng nguyên tắc "sao gốc trong Trung Cung phi chiều nào thì sao thế
// phi chiều đó". Trả về null nếu không có sao thế (không cần trộn số vào bàn hiển thị).
function lapBanSaoThe(soGoc, nguyenLongSonGoc, laThuanBanGoc) {
    let soThe = timSaoThe(soGoc, nguyenLongSonGoc);
    if (soThe === null) return null;
    return { soThe: soThe, ban: lapTinhBan(soThe, laThuanBanGoc) };
}
window.timSaoThe = timSaoThe;
window.lapBanSaoThe = lapBanSaoThe;

// ===== BẢNG GIỚI TUYẾN — 24 ranh giới giữa các cặp sơn kề nhau trên la bàn =====
// "Không phùng" (giới tuyến giữa 2 SƠN, cùng quái) và "Kỵ tuyến" (giới tuyến giữa 2 QUÁI — trùng
// đúng 8/24 mốc ranh quái 45° đã dùng cho Quỷ Thần vào nhà) đều nằm trong bảng này; mỗi cặp có câu
// "điểm hung ứng nghiệm" riêng theo thế_quẻ.md (bản đã được người dùng đối chiếu và sửa lại đúng
// theo thứ tự vòng 24 sơn thực tế — bản gốc .md bị lỗi đánh máy ở nhiều dòng, đã sửa). Vùng cảnh
// báo: ±1° quanh mốc ranh. Còn thiếu duy nhất ranh Canh-Dậu (không có trong dữ liệu gốc) — ranh này
// sẽ không có câu ứng nghiệm cụ thể, chỉ hiển thị cảnh báo chung.
const BANG_GIOI_TUYEN = [
    { cap: "Bính Ngọ", ung: "Phụ nữ kinh nguyệt không đều, thổ huyết, sinh ra nghịch tử, dù có công danh cũng bị kẻ gian phá bỏ." },
    { cap: "Ngọ Đinh", ung: "Bất lợi cho thiếu nữ, ích kỷ, kiện tụng, mắc bệnh tim." },
    { cap: "Đinh Mùi", ung: "Phụ nữ tái giá, không có người sống thọ, vợ đoạt quyền chồng, xuất hiện tăng ni." },
    { cap: "Mùi Khôn", ung: "Ung thư phổi, trúng gió, tai nạn xe cộ, gãy xương, có nhiều mối thù." },
    { cap: "Khôn Thân", ung: "Chị em dâu bất hoà, kiện tụng thất bại, nhà chia không đều, thổ huyết, chấn thương bên ngoài." },
    { cap: "Thân Canh", ung: "Sinh ra nghịch tử, chi trưởng bại hoại, nam trộm cắp, nữ làm gái điếm, mọi việc gặp khó khăn, phá sản, kiện tụng." },
    { cap: "Dậu Tân", ung: "Chịu hình phạt, ly hôn, người vợ thường không đúng đắn, ham mê cờ bạc khiến tan cửa nát nhà." },
    { cap: "Tân Tuất", ung: "Lao phổi, bệnh về máu, mất vợ, ly dị." },
    { cap: "Tuất Càn", ung: "Chi trưởng bại hoại, sinh ra người sợ hãi nạt nộ, phụ nữ bị ung thư tử cung." },
    { cap: "Càn Hợi", ung: "Có người điên cuồng, có sự nghiệp sụp đổ." },
    { cap: "Hợi Nhâm", ung: "Sống phóng túng khiến gia phong bại hoại, có cảnh mẹ góa con côi, bị hãm hại." },
    { cap: "Nhâm Tý", ung: "Con cái bất hiếu, nghiện hút, sa ngã, bị giết." },
    { cap: "Tý Quý", ung: "Bệnh lao, phá tài, phá sản, hại phụ nữ." },
    { cap: "Quý Sửu", ung: "Hại đàn ông, tuyệt tự, có của thì không có người, có người thì không có của, tai họa, phụ nữ không trinh tiết." },
    { cap: "Sửu Cấn", ung: "Gia phong bại hoại, anh em bất hoà, chân tay tàn tật." },
    { cap: "Cấn Dần", ung: "Anh em bất hoà, của cải thất thoát, thương vong." },
    { cap: "Dần Giáp", ung: "Mắc bệnh tinh thần, phong thấp, ung thư, uống thuốc độc tự tử, phá sản, kiện tụng." },
    { cap: "Giáp Mão", ung: "Giàu trước khổ sau, con cái ngỗ ngược, cô độc, ngược đãi." },
    { cap: "Mão Ất", ung: "Khắc vợ, có người bị sét đánh, điện giật." },
    { cap: "Ất Thìn", ung: "Tai nạn xe cộ, tai nạn vì nước, dâm dật, đê hèn, loạn luân, tuyệt tự, phá tài, chết thảm, bệnh nặng." },
    { cap: "Thìn Tốn", ung: "Anh chị em dâu bất hoà, chi trưởng bại hoại, sinh ra người nhát gan khiếp nhược, tổn thương phụ nữ." },
    { cap: "Tốn Tị", ung: "Khắc con, hình vợ, không có con trai, chỉ có con gái, kiện tụng, tai nạn xe cộ." },
    { cap: "Tị Bính", ung: "Phá sản, anh em bất hoà, phát về phụ nữ, hại nam giới, đột tử." }
];
// Với mỗi sơn trong DS24_SON, tính ranh với sơn kế tiếp (goc + 7.5°) rồi khớp tên cặp với bảng trên
// (bảng ghi theo 1 chiều cố định, cặp trong DS24_SON có thể ngược thứ tự nên so khớp cả 2 chiều).
function timGioiTuyen(sonA, sonB) {
    return BANG_GIOI_TUYEN.find(gt => {
        let [t1, t2] = gt.cap.split(" ");
        return (t1 === sonA && t2 === sonB) || (t1 === sonB && t2 === sonA);
    });
}

// ===== XÉT KIÊM HƯỚNG — THẾ QUÁI (theo độ lệch tọa độ la bàn) =====
// LƯU Ý: đây là bộ luật KHÁC hoàn toàn với "phép thế quái" lập bàn Phi Tinh ở hàm
// xacDinhChieuBayTheoNguyenLong bên trên (hàm đó chọn chiều bay thuận/nghịch). Bộ luật này chỉ xét
// độ lệch của Hướng thực tế so với tâm sơn (đo bằng la bàn) để cảnh báo: có cần kiêm hướng không,
// và nếu kiêm thì có phạm Tiểu Không Vong / Đại Không Vong / Quỷ Thần vào nhà / Không Phùng hay không.
//
// Quy tắc (mỗi sơn rộng 15°, tâm tại sonGoc.goc, biên ±7.5°; mỗi quái rộng 45° gồm 3 sơn):
//  - Trước hết, kiểm tra 24 ranh giới GIỮA 2 SƠN kề nhau (vùng ±1° quanh mỗi ranh, xem BANG_GIOI_TUYEN):
//      • Nếu ranh đó cũng là ranh giữa 2 QUÁI (8/24 mốc trùng 22.5°, 67.5°...) → "Kỵ tuyến" — Quỷ Thần
//        vào nhà, du hồn, đại hung — kèm câu ứng nghiệm riêng của cặp sơn.
//      • Nếu ranh đó chỉ là ranh giữa 2 sơn CÙNG quái (16/24 mốc còn lại) → "Không phùng" — mộng mị
//        tình duyên — kèm câu ứng nghiệm riêng của cặp sơn.
//  - |lệch| ≤ 4.5°              : Chính hướng (chính sơn chính hướng), không cần kiêm.
//  - |lệch| > 4.5°               : có quá nhiều khí tạp, phải kiêm sang sơn kề theo chiều lệch. Xét sơn kề đó:
//      • CÙNG quái với sơn gốc:
//          - 2 sơn kề cùng tính Âm/Dương  → kiêm tối đa 6° (Âm) / 7° (Dương). Vượt quá → Tiểu Không Vong.
//          - 2 sơn kề khác tính Âm/Dương  → kiêm tối đa 5°. Vượt quá → Tiểu Không Vong.
//      • KHÁC quái (xuất quái)            → kiêm tối đa 5°. Vượt quá → Đại Không Vong.
function xetKiemHuongTheQuai(gocThucTe) {
    let g = ((gocThucTe % 360) + 360) % 360;

    // --- Giới Tuyến: vùng ±1° quanh 1 trong 24 ranh giới giữa các sơn kề nhau ---
    for (let i = 0; i < 24; i++) {
        let sonA = DS24_SON[i], sonB = DS24_SON[(i + 1) % 24];
        let mocRanh = (sonA.goc + 7.5) % 360;
        let dRanh = Math.abs(g - mocRanh);
        if (dRanh > 180) dRanh = 360 - dRanh;
        if (dRanh <= 1) {
            let laRanhQuai = sonA.cung !== sonB.cung;
            let gt = timGioiTuyen(sonA.ten, sonB.ten);
            let ungNghiem = gt ? gt.ung : "";
            if (laRanhQuai) {
                return {
                    canKiem: true, mucDo: "quy-than",
                    tieuDe: "⚠️ Kỵ Tuyến — Quỷ Thần vào nhà — ĐẠI HUNG",
                    moTa: `Độ hướng ${g.toFixed(1)}° nằm đúng trên giới tuyến giữa 2 quái (giữa sơn ${sonA.ten} và ${sonB.ten}, mốc ${mocRanh}°, dao động ±1°). Đây là Kỵ Tuyến — phạm Quỷ Thần vào nhà, du hồn, mộng mị tình duyên, đại hung.`
                        + (ungNghiem ? ` Điểm hung ứng nghiệm (${sonA.ten} ${sonB.ten}): ${ungNghiem}` : "")
                        + ` Cần chỉnh lại hướng nhà, tuyệt đối tránh đặt đúng tuyến này.`
                };
            } else {
                return {
                    canKiem: true, mucDo: "khong-phung",
                    tieuDe: "⚠️ Không Phùng — mộng mị tình duyên",
                    moTa: `Độ hướng ${g.toFixed(1)}° nằm đúng trên giới tuyến giữa 2 sơn (giữa ${sonA.ten} và ${sonB.ten}, mốc ${mocRanh}°, dao động ±1°). Đây là "Không phùng" — mộng mị tình duyên.`
                        + (ungNghiem ? ` Điểm hung ứng nghiệm (${sonA.ten} ${sonB.ten}): ${ungNghiem}` : "")
                        + ` Cần chỉnh lại hướng nhà để tránh đúng tuyến này.`
                };
            }
        }
    }

    let sonGoc = timSonTheoGoc(g);
    let lech = g - sonGoc.goc;
    if (lech > 180) lech -= 360;
    if (lech < -180) lech += 360;
    let lechAbs = Math.abs(lech);

    if (lechAbs <= 4.5) {
        return {
            canKiem: false, mucDo: "chinh-huong",
            tieuDe: "✓ Chính hướng",
            moTa: `Độ hướng ${g.toFixed(1)}° lệch tâm sơn ${sonGoc.ten} (${sonGoc.goc}°) chỉ ${lechAbs.toFixed(1)}° (≤ 4.5°) — không cần kiêm hướng, dùng chính hướng ${sonGoc.ten} là đủ.`
        };
    }

    // Xác định sơn kề để kiêm theo đúng chiều lệch
    let idxGoc = DS24_SON.findIndex(x => x.ten === sonGoc.ten);
    let idxKe = lech > 0 ? (idxGoc + 1) % 24 : (idxGoc - 1 + 24) % 24;
    let sonKe = DS24_SON[idxKe];
    let cungKhac = sonKe.cung !== sonGoc.cung;

    let gioiHan, loaiVuot, ghiChuTinh;
    if (cungKhac) {
        gioiHan = 5;
        loaiVuot = "Đại Không Vong";
        ghiChuTinh = `Khác quái (xuất quái: ${sonGoc.cung} → ${sonKe.cung})`;
    } else if (sonGoc.amDuong === sonKe.amDuong) {
        gioiHan = sonGoc.amDuong === "Duong" ? 7 : 6;
        loaiVuot = "Tiểu Không Vong";
        ghiChuTinh = `Cùng quái ${sonGoc.cung}, đồng tính ${sonGoc.amDuong === "Duong" ? "Dương" : "Âm"}`;
    } else {
        gioiHan = 5;
        loaiVuot = "Tiểu Không Vong";
        ghiChuTinh = `Cùng quái ${sonGoc.cung}, khác tính Âm Dương (${sonGoc.ten} ${sonGoc.amDuong === "Duong" ? "Dương" : "Âm"} kiêm ${sonKe.ten} ${sonKe.amDuong === "Duong" ? "Dương" : "Âm"})`;
    }

    let vuotGioiHan = lechAbs > gioiHan;
    return {
        canKiem: true, mucDo: vuotGioiHan ? "khong-vong" : "kiem-huong-hop-le",
        tieuDe: vuotGioiHan ? `⚠️ Phạm ${loaiVuot}` : `⟲ Kiêm hướng ${sonGoc.ten} → ${sonKe.ten}`,
        moTa: `Độ hướng ${g.toFixed(1)}° lệch tâm sơn ${sonGoc.ten} (${sonGoc.goc}°) tới ${lechAbs.toFixed(1)}° (> 4.5°) — phải kiêm sang sơn ${sonKe.ten}. ${ghiChuTinh}, giới hạn kiêm tối đa ${gioiHan}°. `
            + (vuotGioiHan
                ? `Độ kiêm ${lechAbs.toFixed(1)}° đã VƯỢT giới hạn ${gioiHan}° → phạm ${loaiVuot}, cần tránh dùng độ hướng này.`
                : `Độ kiêm ${lechAbs.toFixed(1)}° vẫn trong giới hạn cho phép — kiêm hướng hợp lệ.`)
    };
}
window.xetKiemHuongTheQuai = xetKiemHuongTheQuai;

// ===== PHẦN E (mục 26-29 tài liệu tong-ket-phi-tinh.docx) — Hà Đồ Tứ Tượng phối Vận =====
// Tầng luận giải BỔ SUNG cho cặp (Sơn tinh, Hướng tinh) cùng cung — CHẠY SONG SONG, ĐỘC LẬP với
// hệ 5 quy tắc (mục 22) và bảng tổ hợp Sơn-Hướng đặc biệt (mục 10). KHÔNG thay đổi điểm số chấm cung.
const HA_DO_CAP = {
    "1-6": {ten:"Thái Âm Thủy", hanh:"Thủy",
        dacVan:"trí tuệ, khoa cử, tư duy chiến lược — đỗ đạt, thăng tiến học vấn/quan lộ",
        thatVan:"u uất, cô độc, bệnh về thận/tiết niệu, phiêu bạt sa đọa"},
    "2-7": {ten:"Thiếu Dương Hỏa", hanh:"Hỏa",
        dacVan:"bộc phát tài lộc nhanh (đầu cơ, bất động sản, truyền thông)",
        thatVan:"hỏa hoạn, kiện tụng, xung đột, bệnh máu huyết/tim mạch — cặp nguy hiểm nhất khi thất vận"},
    "3-8": {ten:"Thiếu Âm Mộc", hanh:"Mộc",
        dacVan:"điền sản, nông nghiệp, gia đạo hòa thuận, sống thọ",
        thatVan:"tổn thương trẻ nhỏ, hiếm muộn hoặc con cái khó bảo, bệnh gân cốt/gan mật"},
    "4-9": {ten:"Thái Dương Kim", hanh:"Kim",
        dacVan:"đại phú đại quý, danh tiếng, quân sự/chính trị/công nghệ/tài chính lớn",
        thatVan:"độc đoán chuyên quyền, tai nạn xe cộ/dao kéo/phẫu thuật, bệnh phổi/đại tràng"},
};
function cuonVe1Den9(x) { return ((x - 1) % 9 + 9) % 9 + 1; }

// Trả về null nếu cặp (sSon,sHuong) không phải 1 trong 4 cặp Sinh-Thành Hà Đồ.
// vanHienTai = X theo đúng mục 27 (Vận hiện tại theo năm đang xem, không phải Vận nhập trạch).
function xetHaDoTuTuong(sSon, sHuong, vanHienTai) {
    let a = Math.min(sSon, sHuong), b = Math.max(sSon, sHuong);
    let key = a + "-" + b;
    let info = HA_DO_CAP[key];
    if (!info) return null;

    let X = vanHienTai, trangThai;
    if (X === 5) {
        // Trường hợp đặc biệt mục 27: số 5 không thuộc cặp nào, không có "Đương vượng" cho bất kỳ cặp nào
        if (key === "1-6") trangThai = "Tiến khí (Sinh khí)";
        else if (key === "4-9") trangThai = "Thoái khí (Suy)";
        else trangThai = "Sát khí (Tử khí, Đại Hung)"; // 2-7 và 3-8 — CẢ HAI đều Sát khí ở Vận 5
    } else {
        let Xtien = cuonVe1Den9(X + 1), Xthoai = cuonVe1Den9(X - 1);
        if (a === X || b === X) trangThai = "Đương vượng khí (Đại Cát)";
        else if (a === Xtien || b === Xtien) trangThai = "Tiến khí (Sinh khí, Cát vừa)";
        else if (a === Xthoai || b === Xthoai) trangThai = "Thoái khí (Suy)";
        else trangThai = "Sát khí (Tử khí, Đại Hung)";
    }
    let dacVan = trangThai.startsWith("Đương vượng") || trangThai.startsWith("Tiến khí");
    return { capSo: key, tenCap: info.ten, hanhHoaKhi: info.hanh, trangThai: trangThai, dacVan: dacVan, dienGiai: dacVan ? info.dacVan : info.thatVan };
}
// Dựng đoạn ghi chú HTML hiển thị kết quả trên — tách biệt hình thức để không lẫn với bảng/điểm số chính
function ghiChuHaDoTuTuong(sSon, sHuong, vanHienTai) {
    let kq = xetHaDoTuTuong(sSon, sHuong, vanHienTai);
    if (!kq) return "";
    return `<div style="border:1px dashed #b08968;border-radius:4px;padding:6px 8px;margin-top:8px;background:#fffaf0;font-size:12.5px;">`
        + `<b>🌊 Hà Đồ Tứ Tượng :</b><br>`
        + `Cặp Sơn-Hướng (${sSon}-${sHuong}) hóa khí <b>${kq.tenCap}</b> (${kq.hanhHoaKhi}) — hiện <b>${kq.trangThai}</b> so với Vận hiện tại (${vanHienTai}). `
        + `${kq.dacVan ? "Đắc vận" : "Thất vận"}: ${kq.dienGiai}.`
        + `</div>`;
}

// Dựng đoạn ghi chú HTML — Quan hệ 2 sao Sơn-Hướng tại 1 cung (81 tổ hợp, dùng lại window.xetQuanHeSonHuongMoiCung
// từ luan-giai.js). Độc lập với Hà Đồ Tứ Tượng (chỉ 4 cặp Sinh-Thành) — bảng này phủ đủ mọi cặp S-H 1-9.
// Hiển thị CẢ 2 CHIỀU tra cứu (Hướng-Sơn và Sơn-Hướng) vì đây là 2 góc luận bổ sung cho nhau (theo tài liệu
// gốc: luận Hướng thì Hướng đặt trước/quẻ ngoại; luận Sơn thì Sơn đặt trước/quẻ ngoại) — không phải chọn 1.
function ghiChuQuanHeSonHuongMoiCung(sSon, sHuong) {
    if (typeof window.xetQuanHeSonHuongMoiCung !== 'function') return "";
    let theoHuong = window.xetQuanHeSonHuongMoiCung(sSon, sHuong); // key H-S — luận theo Hướng (Hướng là quẻ ngoại)
    let theoSon = window.xetQuanHeSonHuongMoiCung(sHuong, sSon);   // key S-H — luận theo Sơn (Sơn là quẻ ngoại)
    if (!theoHuong && !theoSon) return "";
    function khoi(kq, nhanGoc) {
        if (!kq) return "";
        let tieuDe = nhanGoc ? `${nhanGoc} — ${kq.ten} (${kq.key})` : `${kq.ten} (${kq.key})`;
        return `<div style="margin-top:6px;">
            <b style="color:#4a0072;">${tieuDe}:</b><br>
            <span style="color:#2e7d32;"><b>Sinh vượng:</b> ${kq.sinhVuong}</span><br>
            <span style="color:#8b0000;"><b>Khắc sát:</b> ${kq.khacSat}</span>
        </div>`;
    }
    // Sơn=Hướng (VD 1-1, 2-2...) thì 2 chiều tra trùng nhau hệt (cùng key) — chỉ hiển thị 1 lần, không lặp.
    if (sSon === sHuong) {
        return `<div style="border:1px dashed #7b1fa2;border-radius:4px;padding:6px 8px;margin-top:8px;background:#f8f2ff;font-size:12.5px;">`
            + `<b style="color:#4a0072;">☯️ Quan hệ Sơn-Hướng (S${sSon}-H${sHuong}):</b>`
            + khoi(theoHuong, "")
            + `</div>`;
    }
    return `<div style="border:1px dashed #7b1fa2;border-radius:4px;padding:6px 8px;margin-top:8px;background:#f8f2ff;font-size:12.5px;">`
        + `<b style="color:#4a0072;">☯️ Quan hệ Sơn-Hướng (S${sSon}-H${sHuong}) — xét cả 2 chiều luận:</b>`
        + khoi(theoHuong, "Luận theo Hướng (Hướng làm quẻ ngoại)")
        + khoi(theoSon, "Luận theo Sơn (Sơn làm quẻ ngoại)")
        + `</div>`;
}

// Phản Ngâm / Phục Ngâm (cung vị) — dùng hàm chung window.xetPhanPhucNgamMotSao (luan-giai.js).
// Hàm chung nhận tham số trực tiếp (không tự đọc window.phiTinhVSH) để dùng chung được với tab
// Tìm Nhà — nên ở ĐÂY (ngữ cảnh tab Phi Tinh) ta tự tra window.phiTinhVSH["Trung"]/phiTinhLaThuan..
// rồi truyền vào. tenCungVi: tên cung đang xét; sao: số của bàn Sơn/Hướng tại cung đó;
// loaiBan: "Son" | "Huong" (BẮT BUỘC).
function xetPhanPhucNgam(sao, tenCungVi, loaiBan) {
    let soGoc = tenCungVi === "Trung" ? 5 : CUNG_TO_SO[tenCungVi];
    if (typeof window.xetPhanPhucNgamMotSao !== 'function') return null;
    let vsh = window.phiTinhVSH;
    if (!vsh || !vsh["Trung"]) return null;
    let soNhapTrung = loaiBan === "Huong" ? vsh["Trung"].H : vsh["Trung"].S;
    let laThuan = loaiBan === "Huong" ? window.phiTinhLaThuanHuong : window.phiTinhLaThuanSon;
    let ket = window.xetPhanPhucNgamMotSao(sao, soGoc, soNhapTrung, laThuan);
    if (!ket) return null;
    let tip = ket.loai === "phuc"
        ? `5 nhập Trung cung thuận cục (Phục Ngâm) — cung ${tenCungVi} trùng đúng số Lạc Thư nguyên đán (${soGoc}) — dữ khi thất vận`
        : `5 nhập Trung cung nghịch cục (Phản Ngâm) — cung ${tenCungVi} hợp thập với số Lạc Thư nguyên đán (${soGoc}) — dữ khi thất vận`;
    return { ...ket, tip };
}
function luanGiaiCung(tenCungVi, vanNha, sVan, sSon, sHuong, sNien, sNguyet, sNhat, thangXem, vanHienTai, namXem) {
    let hanhCung = HANH_CUA_CUNG[tenCungVi];
    let laTrung = tenCungVi === "Trung";

    // Bước 1 (Quy tắc 1): ngũ hành sao <-> cung, làm gốc hung/cát cố định — không phụ thuộc thời gian
    let qVan = qCungGoc(hanhCung, sVan), qSon = qCungGoc(hanhCung, sSon), qHuong = qCungGoc(hanhCung, sHuong);
    // Bước 2 (Quy tắc 2): vượng suy theo VẬN HIỆN TẠI (năm đang xem) — khác với vanNha (chỉ dùng để lập bàn cố định)
    let ttVan = trangThaiThoiVan(sVan, vanHienTai), ttSon = trangThaiThoiVan(sSon, vanHienTai), ttHuong = trangThaiThoiVan(sHuong, vanHienTai);

    const ungVien = [
        {nhan:"Vận tinh", ky:"V", sao:sVan},
        {nhan:"Niên tinh", ky:"N", sao:sNien},
        {nhan:"Nguyệt tinh", ky:"Ng", sao:sNguyet},
        {nhan:"Nhật tinh", ky:"Nh", sao:sNhat},
    ];
    // Bước 3 (Quy tắc 4): tìm cứu tinh cho 1 hành đang xấu, trong nhóm V/N/Ng/Nh (loại trừ chính sao đang xét)
    function timCuuTinh(hanhHung, tuKy) {
        let chinh = [], phu = [];
        ungVien.filter(u => u.ky !== tuKy).forEach(u => {
            let hu = HANH_CUA_SAO[u.sao];
            if (hu === hanhHung) return;
            if (HANH_KHAC[hu] === hanhHung) chinh.push(u);
            else if (HANH_SINH[hanhHung] === hu) phu.push(u);
        });
        return {chinh, phu};
    }
    // Bước 4 (Quy tắc 5): N/Ng/Nh là "ngòi nổ" — kiểm tra có tiếp sức (kích hoạt) cho hành đang xấu tại đúng thời điểm của nó không
    const thoiVu = [
        {nhan:"Niên tinh", ky:"N", sao:sNien, thoiDiem:"năm nay"},
        {nhan:"Nguyệt tinh", ky:"Ng", sao:sNguyet, thoiDiem:`tháng ${thangXem||'đang xem'}`},
        {nhan:"Nhật tinh", ky:"Nh", sao:sNhat, thoiDiem:"ngày đang xem"},
    ];
    function xetKichHoat(hanhHung, tuKy) {
        let ghiChu = [];
        thoiVu.filter(t => t.ky !== tuKy).forEach(t => {
            let ht = HANH_CUA_SAO[t.sao];
            if (ht === hanhHung || HANH_SINH[ht] === hanhHung) {
                ghiChu.push(`<b>Lưu ý ${t.thoiDiem}:</b> ${t.nhan} (${ht}) ${ht===hanhHung?'đồng hành, cộng hưởng thêm':'tiếp sức'} cho hung khí này, nên ${t.thoiDiem} bất lợi hơn các thời điểm khác.`);
            }
        });
        return ghiChu.join(" ");
    }
    // Ghép câu luận cho 1 sao trọng tâm (S hoặc H) theo đúng Quy tắc 1→2→3→4, không trộn chủ đề (Quy tắc 3)
    function luanTrongTam(nhan, ky, sao, q, tt, chuDe, loaiBan) {
        let hanhSao = HANH_CUA_SAO[sao];
        let nhanNgan = nhan.replace(" tinh", ""); // "Sơn tinh" -> "Sơn", "Hướng tinh" -> "Hướng"
        let cau = `<b>${tt.moTa}</b>. ${moTaQuanHeCoNhan(nhanNgan, hanhSao, hanhCung, q.loai)} → <b>${q.nhan}</b> cho ${chuDe}. ${yNghiaSaoTheoVan(sao, tt.loai)}`;
        if (q.loai === "xau") {
            let {chinh, phu} = timCuuTinh(hanhSao, ky);
            if (chinh.length || phu.length) {
                let phanChinh = chinh.map(c=>`${c.nhan} (${HANH_CUA_SAO[c.sao]})`).join(", ");
                let phanPhu = phu.map(c=>`${c.nhan} (${HANH_CUA_SAO[c.sao]})`).join(", ");
                let veCau = [phanChinh && `${phanChinh} khắc chế`, phanPhu && `${phanPhu} tiết bớt`].filter(Boolean).join("; ");
                cau += ` May có ${veCau} → đây là cứu tinh, hung khí giảm ${chinh.length?'mạnh (khoảng 50–70%)':'nhẹ'}, đỡ hơn nhiều so với khi không có gì hóa giải.`;
            } else {
                cau += ` Không có sao nào trong cung chế cứu, hung khí giữ nguyên mức độ, cần đặc biệt lưu ý.`;
            }
            let kichHoat = xetKichHoat(hanhSao, ky);
            if (kichHoat) cau += ` ${kichHoat}`;
        } else if (q.loai === "hao_tan") {
            cau += ` Không hẳn xấu nhưng cũng không mạnh — cần thêm trợ lực từ vật phẩm hoặc Vận tinh mới phát huy hết tác dụng.`;
        }
        // Gợi ý bố trí Sơn/Thủy theo trạng thái vượng-suy (bản rút gọn của "Vượng Sơn Vượng Hướng",
        // dùng khi không có dữ liệu địa hình thật): Sơn tinh cần yếu tố cao-tĩnh, Hướng tinh cần yếu tố thấp-động.
        if (tt.loai === "cat") {
            cau += loaiBan === "son"
                ? ` <b>Gợi ý bố trí:</b> đang Sinh/Vượng khí, nên chủ động tạo yếu tố "Sơn" tại đây (tủ, kệ sách cao, cây cảnh lớn, vách tường kín) để kích hoạt vượng khí, giúp nhân đinh thêm vượng.`
                : ` <b>Gợi ý bố trí:</b> đang Sinh/Vượng khí, nên chủ động tạo yếu tố "Thủy" tại đây (bể cá, gương nước, cửa ra vào, lối đi lại) để kích hoạt vượng khí, giúp tài lộc thêm vượng.`;
        } else if (tt.loai === "hung") {
            cau += loaiBan === "son"
                ? ` <b>Gợi ý bố trí:</b> đang Suy/Tử khí, tránh đặt vật cao, nặng, tĩnh (tủ lớn, kệ cao) tại đây kẻo kích hoạt thêm hung khí; nên để thông thoáng, thấp.`
                : ` <b>Gợi ý bố trí:</b> đang Suy/Tử khí, tránh đặt yếu tố nước/động mạnh (bể cá, gương lớn, cửa chính) tại đây kẻo kích hoạt thêm hung khí về tài lộc.`;
        }
        return cau;
    }

    function rowHTML(nhan, vaiTro, sao, giai, ngam) {
        let nhanHTML = `${nhan}=${sao}`;
        if (ngam) {
            nhanHTML = `<span style="font-weight:900;" title="${ngam.nhan} — ${ngam.tip}">${nhan}=${sao} <span style="color:#8b0000;">${ngam.ky}</span></span>`;
        }
        let hanhSao = HANH_CUA_SAO[sao] || "";
        return `<tr><td style="padding:5px 4px;border:1px solid #e3d5c0;font-weight:bold;white-space:nowrap;vertical-align:top;width:1%;" title="${vaiTro}"><div>${nhanHTML}</div>${hanhSao ? `<div style="font-weight:normal;font-size:0.72em;color:#8a7a68;margin-top:1px;">(${hanhSao})</div>` : ""}</td><td style="padding:5px 6px;border:1px solid #e3d5c0;line-height:1.5;">${giai}</td></tr>`;
    }
    // Vòng tương sinh trực quan cho Vận tinh — đặt trong ô Vận tinh của bảng luận giải chính,
    // theo đúng kiểu hiển thị của khối "Hà-Lạc Luận (Test)": Thủy → Mộc → Hỏa → Thổ → Kim → (quay lại),
    // đánh dấu đậm hành nào đang có yếu tố (đủ 6 sao của cung: Vận/Sơn/Hướng/Niên/Nguyệt/Nhật, và Cung) trú tại đó.
    function veVongTuongSinhVan(hanhCungXet, hanhVan, hanhSon, hanhHuong, hanhNien, hanhNguyet, hanhNhat) {
        const CHU_KY = ["Thủy", "Mộc", "Hỏa", "Thổ", "Kim"];
        let banDo = {};
        function ghi(hanh, ten) { if (!hanh) return; if (!banDo[hanh]) banDo[hanh] = []; banDo[hanh].push(ten); }
        ghi(hanhCungXet, "Cung"); ghi(hanhVan, "Vận"); ghi(hanhSon, "Sơn"); ghi(hanhHuong, "Hướng");
        ghi(hanhNien, "Niên"); ghi(hanhNguyet, "Nguyệt"); ghi(hanhNhat, "Nhật");
        let doanVong = CHU_KY.map(h => {
            let ds = banDo[h];
            return ds && ds.length
                ? `<b style="color:#2e7d32;background:#e8f5e9;padding:1px 5px;border-radius:4px;">${h} (${ds.join(", ")})</b>`
                : `<span style="color:#aaa;">${h}</span>`;
        });
        return doanVong.join(" → ") + ` → <span style="color:#aaa;">(quay lại ${CHU_KY[0]})</span>`;
    }
    let rows = "";
    rows += rowHTML("V", VAI_TRO_SAO.Van, sVan, `<b>${ttVan.moTa}</b>. ${moTaQuanHeCoNhan("Vận", HANH_CUA_SAO[sVan], hanhCung, qVan.loai)}.<div style="margin-top:4px;font-size:0.95em;">${veVongTuongSinhVan(hanhCung, HANH_CUA_SAO[sVan], HANH_CUA_SAO[sSon], HANH_CUA_SAO[sHuong], HANH_CUA_SAO[sNien], HANH_CUA_SAO[sNguyet], HANH_CUA_SAO[sNhat])}</div>`);
    rows += rowHTML("S", VAI_TRO_SAO.Son, sSon, luanTrongTam("Sơn tinh","S",sSon,qSon,ttSon,"sức khỏe, nhân đinh (người trong nhà)","son"), xetPhanPhucNgam(sSon, tenCungVi, "Son"));
    rows += rowHTML("H", VAI_TRO_SAO.Huong, sHuong, luanTrongTam("Hướng tinh","H",sHuong,qHuong,ttHuong,"tài lộc, sự nghiệp (việc bên ngoài)","huong"), xetPhanPhucNgam(sHuong, tenCungVi, "Huong"));

    const TEN_DAY_KHACH_TINH = {"N": "Niên", "Ng": "Nguyệt", "Nh": "Nhật"};
    function rowKhachTinh(nhan, ky, vaiTro, saoKhach) {
        let qC = qCungGoc(hanhCung, saoKhach);
        let ttC = trangThaiThoiVan(saoKhach, vanHienTai);
        let nhanDay = TEN_DAY_KHACH_TINH[nhan] || nhan;
        let giai = `<b>${ttC.moTa}</b>. ${moTaQuanHeCoNhan(nhanDay, HANH_CUA_SAO[saoKhach], hanhCung, qC.loai)} → <b>${qC.nhan}</b>. ${yNghiaSaoTheoVan(saoKhach, ttC.loai)}`;
        if (saoKhach===5) giai += qC.loai==='xau'||qC.loai==='hao_tan' ? ' Tại cung này Ngũ Hoàng chưa được chế hẳn, cần đặc biệt cẩn trọng.' : ' Ngũ Hoàng bị cung chế bớt, đỡ phần nào.';
        // Vai trò cứu tinh / ngòi nổ của chính sao thời vụ này đối với S và H đang xấu (nếu có)
        let vaiTroThem = [];
        if (qSon.loai==='xau') {
            let hs = HANH_CUA_SAO[sSon], hk = HANH_CUA_SAO[saoKhach];
            if (HANH_KHAC[hk]===hs) vaiTroThem.push(`là cứu tinh chính cho Sơn tinh (khắc chế ${hs})`);
            else if (HANH_SINH[hs]===hk) vaiTroThem.push(`tiết bớt hung khí của Sơn tinh (${hs} sinh ${hk})`);
            else if (hk===hs || HANH_SINH[hk]===hs) vaiTroThem.push(`tiếp sức thêm cho hung khí của Sơn tinh, cần lưu ý`);
        }
        if (qHuong.loai==='xau') {
            let hh = HANH_CUA_SAO[sHuong], hk = HANH_CUA_SAO[saoKhach];
            if (HANH_KHAC[hk]===hh) vaiTroThem.push(`là cứu tinh chính cho Hướng tinh (khắc chế ${hh})`);
            else if (HANH_SINH[hh]===hk) vaiTroThem.push(`tiết bớt hung khí của Hướng tinh (${hh} sinh ${hk})`);
            else if (hk===hh || HANH_SINH[hk]===hh) vaiTroThem.push(`tiếp sức thêm cho hung khí của Hướng tinh, cần lưu ý`);
        }
        if (vaiTroThem.length) giai += ` ${nhan} ${vaiTroThem.join("; ")}.`;
        return rowHTML(nhan, vaiTro, saoKhach, giai);
    }
    rows += rowKhachTinh("N", "N", VAI_TRO_SAO.Nien, sNien);
    rows += rowKhachTinh("Ng", "Ng", VAI_TRO_SAO.Nguyet, sNguyet);
    rows += rowKhachTinh("Nh", "Nh", VAI_TRO_SAO.Nhat, sNhat);

    let bang = `Cung ${tenCungVi} thuộc hành <b>${hanhCung}</b>.`
        + (!laTrung ? (() => { let ttVanNha = trangThaiThoiVan(vanNha, vanHienTai); return ` <i>(Vận khí Trung cung — Vận nhập trạch: <b>${vanNha}</b> (${HANH_CUA_SAO[vanNha]}), hiện đang ${ttVanNha.ten} so với Vận hiện tại (${vanHienTai}) — ${ttVanNha.moTa})</i>`; })() : "")
        + `<table style="border-collapse:collapse;width:100%;margin-top:8px;font-size:12.5px;">
            <tr style="background:#fff8f0;"><th style="padding:5px 4px;border:1px solid #e3d5c0;color:#8b0000;width:1%;white-space:nowrap;">Sao</th><th style="padding:5px 6px;border:1px solid #e3d5c0;color:#8b0000;">Luận giải</th></tr>
            ${rows}
          </table>`
        + (laTrung ? "" : ghiChuHaDoTuTuong(sSon, sHuong, vanHienTai)) // PHẦN E (mục 26-29) — ghi chú bổ sung, không đổi điểm số bên dưới; Trung cung đã có ở Tổng kết toàn nhà (tự động), không lặp lại ở đây
        + ghiChuQuanHeSonHuongMoiCung(sSon, sHuong); // Quan hệ 2 sao Sơn-Hướng (81 tổ hợp) — áp dụng cho MỌI cung kể cả Trung, vì đây là bảng riêng biệt với Hà Đồ Tứ Tượng

    // Kết luận: dựa trên điểm gốc Quy tắc 1 (qSon.diem + qHuong.diem) — đúng tinh thần "hung cát cố định" làm chủ đạo
    let diem = qSon.diem + qHuong.diem;
    let ketLuan;
    if (diem>=2) ketLuan = "Đây là cung vượng cả 2 mặt (sinh nhập Sơn lẫn Hướng), nên tận dụng tối đa cho các không gian quan trọng (phòng khách, bàn làm việc, phòng thờ).";
    else if (diem===1) ketLuan = "Cung có một mặt tốt rõ rệt (sức khỏe hoặc tài lộc), có thể tận dụng đúng mục đích đó, mặt còn lại nên hóa giải thêm.";
    else if (diem===0) ketLuan = "Cung ở mức trung bình (bình ổn hoặc hao tán), không quá tốt cũng không quá xấu, có thể dùng cho chức năng phụ.";
    else if (diem===-1) ketLuan = "Cung có một mặt bị khắc nhập cần lưu ý, nên hạn chế chức năng quan trọng liên quan đến mặt đó, ưu tiên xem có cứu tinh trong bảng trên hay không để cân nhắc mức độ.";
    else ketLuan = "Cung bị khắc nhập cả 2 mặt (Sơn lẫn Hướng), nên tránh đặt bếp, giường ngủ, bàn thờ; xem kỹ trong bảng trên có cứu tinh chế được hay không, nếu không thì cần hóa giải bằng vật phẩm Ngũ hành phù hợp.";
    let duoiBang = `<br><br><b>Kết luận:</b> ${ketLuan}`;
    let ngamSon = xetPhanPhucNgam(sSon, tenCungVi, "Son"), ngamHuong = xetPhanPhucNgam(sHuong, tenCungVi, "Huong");
    if (ngamSon || ngamHuong) {
        let ghi = [];
        if (ngamSon) ghi.push(`Sơn tinh ${ngamSon.nhan} (${ngamSon.ky})`);
        if (ngamHuong) ghi.push(`Hướng tinh ${ngamHuong.nhan} (${ngamHuong.ky})`);
        duoiBang += `<br><br><b style="color:#8b0000;">⚠ ${ghi.join(", ")}:</b> so với số Lạc Thư nguyên đán của cung ${tenCungVi} — theo Huyền Không Bí Chỉ, đây là sát khí dữ khi cung này thất vận, cần đặc biệt lưu ý.`;
    }
    // ===== Hợp Thập tại cung này (V+S=10 hoặc V+H=10) — dùng hàm chung window.xetHopThap từ
    // luan-giai.js, áp dụng cho CẢ 9 CUNG khi click vào (giống Phản/Phục Ngâm ở trên), không chỉ
    // riêng Tọa/Hướng như phần "Tổng kết toàn nhà" ở Trung cung. =====
    if (typeof window.xetHopThap === 'function') {
        let ht = window.xetHopThap(sVan, sSon, sHuong);
        if (ht.hopThapVS || ht.hopThapVH) {
            let ghiHT = [];
            if (ht.hopThapVS) ghiHT.push(`Vận-Sơn (${sVan}+${sSon}=10)`);
            if (ht.hopThapVH) ghiHT.push(`Vận-Hướng (${sVan}+${sHuong}=10)`);
            duoiBang += `<br><br><b style="color:#00695c;">➕10 Hợp Thập ${ghiHT.join(", ")}:</b> thông khí, cứu cục — có tác dụng hóa giải bớt hung khí tại cung này nếu đang thất vận, theo Tử Bạch Quyết.`;
        }
    }
    // ===== TAM HỢP PHÁI (Tam Hợp / Tam Tai / Xung) tại cung này — dùng hàm chung
    // window.xetTamHopPhaiMotCung từ luan-giai.js. Trung cung không thuộc Bát Quái nên bỏ qua.
    // LUÔN hiển thị đủ 3 nhóm Chi (để người dùng biết trước, kể cả khi chưa tới năm đó) — nếu Chi
    // của năm đang xem (namXem, ô "Năm xem" có sẵn trên tab) rơi đúng vào nhóm nào thì đánh dấu
    // nổi bật (⚠️ ĐANG ĐÚNG NĂM NÀY) cho nhóm đó, còn lại vẫn liệt kê bình thường để tham khảo. =====
    if (tenCungVi !== "Trung" && typeof window.xetTamHopPhaiMotCung === 'function') {
        let thp = window.xetTamHopPhaiMotCung(tenCungVi, namXem);
        if (thp) {
            let kq = thp.ketQua; // có thể null nếu namXem không hợp lệ — các cờ namLaXxx khi đó coi như false
            function dongChi(nhan, icon, mau, dsChi, dangUngNam) {
                let canhBao = dangUngNam ? ` <b style="background:${mau};color:#fff;padding:1px 6px;border-radius:4px;">⚠️ ĐANG ĐÚNG NĂM NÀY (${kq.chiNam})</b>` : "";
                return `<div style="margin-top:3px;"><span style="color:${mau};">${icon} <b>${nhan}</b>: ${dsChi.join(", ")}</span>${canhBao}</div>`;
            }
            let noiDung = dongChi("Tam Hợp", "🔵", "#2e7d32", thp.tamHopChi, kq && kq.namLaTamHop)
                + dongChi("Tam Tai", "🔺", "#c62828", thp.tamTaiChi, kq && kq.namLaTamTai)
                + dongChi("Xung", "⚡", "#e65100", thp.xungChi, kq && kq.namLaXung);
            duoiBang += `<br><br><div style="border:1px dashed #5c4a3a;border-radius:4px;padding:6px 8px;background:#fff8f0;">`
                + `<b style="color:#5c4a3a;">🧭 Tam Hợp Phái (cung ${tenCungVi}, phương ${thp.phuongVi}) — Chú ý các năm:</b>`
                + noiDung
                + `<div style="margin-top:4px;font-size:0.85em;color:#777;"><i>Tam Hợp: khí được kích hoạt/tăng cường (cát càng cát, hung càng hung). Tam Tai: dễ gây tai họa. Xung: khí bị xáo trộn, biến động, thị phi.</i></div>`
                + `</div>`;
        }
    }
    // (Khối tra cứu tổ hợp Sơn-Hướng cũ dùng window.xetToHopSonHuong đã được GỠ BỎ — thay thế hoàn
    // toàn bởi ghiChuQuanHeSonHuongMoiCung ở cuối bảng luận giải, xét đủ CẢ 2 CHIỀU H-S và S-H,
    // tránh hiển thị trùng lặp 2 bản luận cho cùng 1 cặp Sơn-Hướng.)
    let capSH = sSon + "-" + sHuong;
    const toHopDacBiet = {"1-6":"Văn Xương — lợi học hành, thi cử, thăng quan tiến chức.","6-1":"Văn Xương — lợi sự nghiệp, thăng tiến công danh.","1-4":"Văn Xương — tốt văn học, nghệ thuật, tình duyên.","4-1":"Văn Xương — tốt văn học, nghệ thuật, tình duyên.","8-9":"Tài lộc đang lên — hợp với thời vận sắp tới.","9-8":"Tài lộc đang lên — hợp với thời vận sắp tới.","2-5":"Nhị Ngũ giao gia — đại hung, dễ sinh bệnh tật.","5-2":"Nhị Ngũ giao gia — đại hung, dễ sinh bệnh tật.","7-9":"Hỏa trạch hỏa tai — đề phòng cháy nổ, tranh chấp.","9-7":"Hỏa trạch hỏa tai — đề phòng cháy nổ, tranh chấp.","3-7":"Tranh chấp, hình tụng — dễ va chạm, kiện tụng."};
    if (toHopDacBiet[capSH]) duoiBang += `<br><br><i>Tổ hợp đặc biệt ${capSH}: ${toHopDacBiet[capSH]}</i>`;
    return bang + duoiBang;
}
// ===== LUẬN CHÂN KHÍ TIÊN THIÊN (Hà Đồ) — MỤC RIÊNG, độc lập với Tổng kết toàn nhà (Hậu Thiên/
// Phi Tinh). So Ngũ hành Hà Đồ của Vận hiện tại (Thiên thời) với Ngũ hành Hà Đồ của Hướng nhà
// (Địa lợi, theo số Lạc Thư cố định của cung Hướng — KHÔNG dùng Hướng tinh bay theo Vận, để giữ
// đúng tính chất Tiên Thiên/bất biến). Dùng bảng Hà Đồ RIÊNG (window.HA_DO_NGU_HANH), khác hẳn
// bảng Lạc Thư/Hậu Thiên (HANH_CUA_SAO) dùng cho phần còn lại của app — không được lẫn 2 bảng này.
// ====================================================================
// "TEST" — HÀ-LẠC LUẬN (mục thử nghiệm riêng, KHÔNG đụng tới luanChanKhiTienThien cũ ở dưới).
// Cả 4 yếu tố Hướng - Tọa - Chủ (mệnh quái) - Vận đều được quy về SỐ Lạc Thư trước (CUNG_TO_SO cho
// Hướng/Tọa, quaiSo cho Chủ, số Vận có sẵn), rồi tra Ngũ hành theo đúng HÀ ĐỒ: 1&6=Thủy, 2&7=Hỏa,
// 3&8=Mộc, 4&9=Kim, 5&10=Thổ — KHÔNG dùng Hậu Thiên/Lạc Thư (HANH_CUA_CUNG, HANH_CUA_SAO) trong
// khối này nữa. Sau đó đặt 4 hành Hà Đồ vào bàn cân sinh/khắc, xét vượng suy theo thời vận, tìm
// hành thông quan, rồi tra Loại Tượng Hà Đồ + Lạc Thư để luận Nhân - Lộc - Thọ.
// ====================================================================
const HANH_HA_DO_THEO_SO = {1:"Thủy",6:"Thủy",2:"Hỏa",7:"Hỏa",3:"Mộc",8:"Mộc",4:"Kim",9:"Kim",5:"Thổ",10:"Thổ"};
function hanhHaDoTuSo(so) {
    return HANH_HA_DO_THEO_SO[so] || null;
}
function luanHaLacTest(vanNha, vanHienTai, cungHuong, cungToa, namSinhChu, gioiTinhChu) {
    if (!namSinhChu || !cungHuong || !cungToa || typeof window.tinhMenhQuai !== 'function') return "";

    let soHuong = CUNG_TO_SO[cungHuong];
    let soToa = CUNG_TO_SO[cungToa];
    let menhQuai = window.tinhMenhQuai(namSinhChu, gioiTinhChu);
    let soChu = menhQuai.quaiSo;
    let soVan = vanNha;

    let hanhHuong = hanhHaDoTuSo(soHuong);
    let hanhToa = hanhHaDoTuSo(soToa);
    let hanhChu = hanhHaDoTuSo(soChu);
    let hanhVan = hanhHaDoTuSo(soVan);
    let haDo = window.HA_DO_LOAI_TUONG || {};

    // ----- Bước 2: quan hệ sinh/khắc giữa từng cặp trong 4 yếu tố -----
    function quanHe(tenA, hanhA, tenB, hanhB) {
        if (hanhA === hanhB) return { loai: "dong", text: `${tenA} (${hanhA}) đồng hành với ${tenB} (${hanhB})` };
        if (HANH_SINH[hanhA] === hanhB) return { loai: "sinh", text: `${tenA} (${hanhA}) → Sinh → ${tenB} (${hanhB})` };
        if (HANH_SINH[hanhB] === hanhA) return { loai: "duocsinh", text: `${tenB} (${hanhB}) → Sinh → ${tenA} (${hanhA})` };
        if (HANH_KHAC[hanhA] === hanhB) return { loai: "khac", text: `${tenA} (${hanhA}) → Khắc → ${tenB} (${hanhB})` };
        if (HANH_KHAC[hanhB] === hanhA) return { loai: "bikhac", text: `${tenB} (${hanhB}) → Khắc → ${tenA} (${hanhA})` };
        return { loai: "?", text: "" };
    }
    let capHT = quanHe("Hướng", hanhHuong, "Tọa", hanhToa);
    let capVH = quanHe("Vận", hanhVan, "Hướng", hanhHuong);
    let capVT = quanHe("Vận", hanhVan, "Tọa", hanhToa);
    let capCV = quanHe("Chủ", hanhChu, "Vận", hanhVan);
    let capHC = quanHe("Hướng", hanhHuong, "Chủ", hanhChu);
    let capCT = quanHe("Chủ", hanhChu, "Tọa", hanhToa);

    // ----- Vòng tương sinh trực quan: Thủy → Mộc → Hỏa → Thổ → Kim → (quay lại Thủy) — đánh dấu
    // đậm tại đúng vị trí hành nào đã có yếu tố (Hướng/Tọa/Chủ/Vận) trú, hành nào để trống (mờ) thì
    // là "khoảng trống" — nhìn vào biết ngay đang thiếu hành gì trong chuỗi tương sinh liên hoàn.
    function veVongTuongSinh(hanhHuong, hanhToa, hanhChu, hanhVan) {
        const CHU_KY = ["Thủy", "Mộc", "Hỏa", "Thổ", "Kim"];
        let banDo = {};
        function ghi(hanh, ten) { if (!banDo[hanh]) banDo[hanh] = []; banDo[hanh].push(ten); }
        ghi(hanhChu, "Mệnh Chủ"); ghi(hanhHuong, "Hướng"); ghi(hanhToa, "Tọa"); ghi(hanhVan, "Vận");
        let doanVong = CHU_KY.map(h => {
            let ds = banDo[h];
            return ds && ds.length
                ? `<b style="color:#2e7d32;background:#e8f5e9;padding:1px 5px;border-radius:4px;">${h} (${ds.join(", ")})</b>`
                : `<span style="color:#aaa;">${h}</span>`;
        });
        return doanVong.join(" → ") + ` → <span style="color:#aaa;">(quay lại ${CHU_KY[0]})</span>`;
    }

    // ----- Tìm chuỗi thông quan: Hướng -> Chủ -> Tọa (hoặc chiều ngược) hóa giải Hướng khắc/bị khắc Tọa -----
    let thongQuanThuan = capHC.loai === "sinh" && capCT.loai === "sinh"; // Hướng sinh Chủ, Chủ sinh Tọa
    let thongQuanNghich = capHC.loai === "duocsinh" && capCT.loai === "duocsinh"; // Tọa sinh Chủ, Chủ sinh Hướng
    let coThongQuan = (capHT.loai === "khac" || capHT.loai === "bikhac") && (thongQuanThuan || thongQuanNghich);

    // ----- Bước 3: Vượng suy theo thời vận — so Vận Nhà (lúc xây) với Vận Hiện Tại (đang xét) -----
    let vanDangVuong = vanHienTai === vanNha;
    let ghiChuVuongSuy = vanDangVuong
        ? `Vận ${vanNha} hiện đang là VƯỢNG KHÍ (đúng thời) — mọi tác động (sinh hay khắc) của Vận lên Hướng/Tọa đều mạnh, ứng nghiệm rõ rệt.`
        : `Vận ${vanNha} (lúc xây) nay đã qua, đang là SUY KHÍ so với Vận hiện tại (${vanHienTai}) — tác động của Vận lên Hướng/Tọa chỉ còn nhẹ, không nguy hiểm/lợi ích rõ rệt như lúc đương vượng. Vận ${vanHienTai} đang vượng mới là yếu tố cần chú ý nhất hiện nay.`;

    // ----- Bước 4: Gợi ý thông quan -----
    let goiYThongQuan;
    if (capHT.loai !== "khac" && capHT.loai !== "bikhac") {
        goiYThongQuan = `Hướng và Tọa không khắc nhau trực tiếp — chưa cần dùng vật phẩm thông quan.`;
    } else if (coThongQuan) {
        let hanhCau = thongQuanThuan ? [hanhHuong, hanhChu, hanhToa] : [hanhToa, hanhChu, hanhHuong];
        goiYThongQuan = `Đã có sẵn chuỗi thông quan ${hanhCau.join(" → Sinh → ")} nhờ chính Mệnh Chủ (${hanhChu}) làm cầu nối. Nên tận dụng TỐI ĐA 2 hành ${hanhHuong} và ${hanhChu} (không cần thêm hành trung gian khác — thêm Thổ hoặc hành lạ vào lúc này dễ làm suy yếu chuỗi sinh đã có sẵn).`;
    } else {
        goiYThongQuan = `Hướng và Tọa khắc nhau mà KHÔNG có sẵn chuỗi thông quan qua Mệnh Chủ — nên chủ động bổ sung 1 hành trung gian (hành được ${hanhHuong} sinh ra, và hành đó lại sinh cho ${hanhToa}) để hóa giải, tránh chọn bừa theo nguyên tắc "cứ thêm Thổ là tốt".`;
    }

    // ----- Bước 5: Loại tượng Hà Đồ cho từng yếu tố -----
    function khoiLoaiTuong(ten, hanh) {
        let lt = haDo[hanh];
        if (!lt) return "";
        return `<div style="margin-top:4px;"><b>${ten} (${hanh}, Hà Đồ ${lt.soHaDo}):</b> <span style="color:#2e7d32;">${lt.sinhVuong}</span> <span style="color:#8b0000;">| Khắc sát: ${lt.khacSat}</span></div>`;
    }

    let html = `<div class="luan-giai-item" style="border:2px dashed #6a1b9a;border-radius:8px;padding:10px;margin-top:14px;background:#f3e5f515;">
        <b style="color:#6a1b9a;font-size:1.05em;">🌊 Hà-Lạc Luận (Test — mục thử nghiệm riêng, chưa dùng để chấm điểm)</b><br>
        <span style="font-size:0.9em;color:#555;">Mệnh Chủ: sinh ${namSinhChu}, ${gioiTinhChu === 'nam' ? 'Nam' : 'Nữ'} → Quái ${menhQuai.quaiSo} (${menhQuai.cung}, ${menhQuai.hanh}) — ${menhQuai.nhom}.</span>

        <div style="margin-top:8px;"><b>Bước 1 — Ngũ hành Thể (tra theo số Hà Đồ, không theo Hậu Thiên):</b> Hướng (cung ${cungHuong}, số ${soHuong}) = ${hanhHuong} · Tọa (cung ${cungToa}, số ${soToa}) = ${hanhToa} · Chủ (quái ${soChu}) = ${hanhChu} · Vận (số ${soVan}) = ${hanhVan}</div>

        <div style="margin-top:8px;"><b>Bước 2 — Vòng tương sinh trực quan:</b><br>
        <div style="padding:6px 0;font-size:0.95em;">${veVongTuongSinh(hanhHuong, hanhToa, hanhChu, hanhVan)}</div>
        <span style="font-size:0.85em;color:#777;">Hành in đậm/nền xanh = đang có yếu tố trú tại đó. Hành mờ = khoảng trống trong chuỗi — nhìn vào biết ngay đang thiếu hành gì để nối liền vòng sinh.</span><br><br>
        <b>Chi tiết từng cặp:</b><br>
        • ${capHT.text}<br>• ${capVH.text}<br>• ${capVT.text}<br>• ${capCV.text}<br>• ${capHC.text}<br>• ${capCT.text}<br>
        ${coThongQuan ? `<span style="color:#2e7d32;">→ Có chuỗi sinh liên hoàn hóa giải thế khắc Hướng-Tọa ban đầu — nhận xét quan trọng, chuyển hung thành cát tiềm năng.</span>` : ''}
        </div>

        <div style="margin-top:8px;"><b>Bước 3 — Vượng suy theo thời vận:</b> ${ghiChuVuongSuy}</div>

        <div style="margin-top:8px;"><b>Bước 4 — Thông quan:</b> ${goiYThongQuan}</div>

        <div style="margin-top:8px;"><b>Bước 5 — Loại tượng Hà Đồ (Nhân - Lộc - Thọ tham khảo):</b>
        ${khoiLoaiTuong("Hướng (Lộc — tài lộc)", hanhHuong)}
        ${khoiLoaiTuong("Tọa (Nhân — gia đạo)", hanhToa)}
        ${khoiLoaiTuong("Chủ (Thọ — sức khỏe)", hanhChu)}
        </div>
    </div>`;
    return html;
}

function luanChanKhiTienThien(van, cungHuong) {
    if (typeof window.xetChanKhiHaDo !== 'function' || !cungHuong) return "";
    let ck = window.xetChanKhiHaDo(van, CUNG_TO_SO[cungHuong]);
    if (!ck) return "";

    const dienGiaiDayDu = {
        dac: `Vận (Thiên thời) sinh xuất cho Hướng (Địa lợi), hoặc cả hai đồng một Hà Đồ khí — luồng khí Tiên Thiên vào nhà thuận chiều, nuôi dưỡng bền lâu. Đây là nền tảng cát lợi bậc nhất, có trước và quan trọng hơn cả cách cục Phi Tinh Hậu Thiên (Vượng Sơn Vượng Hướng, Hợp Thập...).`,
        tiet: `Hướng (Địa lợi) phản sinh ngược lại cho Vận (Thiên thời) — nhà vẫn dùng được, nhưng khí Tiên Thiên bị hao tổn dần theo thời gian. Mức độ bình thường: không đại hung, nhưng cũng không thật sự bền vượng như trường hợp Đắc Chân Khí.`,
        that: `Vận và Hướng khắc nhau theo Hà Đồ (bất kể chiều nào khắc chiều nào) — nhà mất gốc khí Tiên Thiên ngay từ nền tảng. Dù cách cục Phi Tinh Hậu Thiên (Sơn tinh, Hướng tinh) có bay đẹp đến đâu cũng khó bền lâu, vì Thiên thời và Địa lợi đã lệch nhau từ gốc — cần đặc biệt lưu tâm, cân nhắc kỹ trước khi chọn hướng này.`,
        binh: `Vận và Hướng không sinh không khắc rõ rệt theo Hà Đồ.`
    };
    let mauCK = ck.loai === "dac" ? "#2e7d32" : ck.loai === "tiet" ? "#e65100" : ck.loai === "that" ? "#c62828" : "#888";
    let iconCK = ck.loai === "dac" ? "🌟" : ck.loai === "tiet" ? "⚠️" : ck.loai === "that" ? "☠️" : "◽";

    return `<div class="luan-giai-item" style="border:1px solid ${mauCK};border-radius:8px;padding:10px;margin-top:10px;background:${mauCK}0d;">
        <b style="color:${mauCK};font-size:1.05em;">${iconCK} Luận Chân Khí Tiên Thiên (Hà Đồ)</b><br>
        <span style="font-size:0.8em;color:#555;">Hà Đồ (Tiên Thiên): 1&6=Thủy · 2&7=Hỏa · 3&8=Mộc · 4&9=Kim · 5&10=Thổ — khác bảng Lạc Thư/Hậu Thiên dùng cho Phi Tinh.</span><br>
        Vận ${van} → Hà Đồ <b>${ck.hanhVan}</b> &nbsp;|&nbsp; Hướng (cung ${cungHuong}, số ${CUNG_TO_SO[cungHuong]}) → Hà Đồ <b>${ck.hanhHuong}</b><br>
        <b style="color:${mauCK};">Kết quả: ${ck.nhan}</b><br>
        ${dienGiaiDayDu[ck.loai] || ck.moTa}
    </div>`;
}

function tongKetToanNha(van, ketQua9Cung, sb, sf, hf, hb, bVan, cungToa, cungHuong, bSon, bHuong, tenSonToa, tenSonHuong, namXem, vanHienTai) {
    let tot = ketQua9Cung.filter(c=>c.diem>=1), xau = ketQua9Cung.filter(c=>c.diem<=-1), tb = ketQua9Cung.filter(c=>c.diem===0);
    const vatPhamTheoHanh = {"Hỏa":"màu đỏ/cam/tím, đèn, vật hình tam giác, nến","Thổ":"màu vàng/nâu, gốm sứ, đá, thạch cao","Kim":"màu trắng/ánh kim, vật bằng kim loại, chuông gió kim loại","Thủy":"màu đen/xanh dương, bể cá, vật phẩm hình tròn/lượn sóng","Mộc":"màu xanh lá, cây cảnh, vật bằng gỗ"};
    let html = `<div class="luan-giai-item" style="margin-top:6px;"><b style="color:#455a64;">📌 Tổng kết các cách cục toàn nhà:</b></div>`;
    // ===== Vượng Sơn Vượng Hướng / Thượng Sơn Hạ Thủy + Hợp Thập — dùng hàm chung từ luan-giai.js
    // (trước đây tab này chưa có, chỉ tim-nha.js có). Hiển thị rõ ràng từng cờ riêng biệt để không
    // mất thông tin khi rơi vào tổ hợp lệch (ví dụ Vượng Sơn nhưng lại Hạ Thủy). =====
    if (typeof window.xetVuongSuyCachCuc === 'function') {
        let vsCC = window.xetVuongSuyCachCuc(sb, sf, hf, hb, van);
        if (vsCC.cachCuoc === "Vượng Sơn Vượng Hướng") {
            html += `<div class="luan-giai-item" style="color:#2e7d32;background:#e8f5e9;border-radius:6px;padding:8px;"><b>🎯 Vượng Sơn Vượng Hướng</b> — cách cục quý: Sơn tinh đúng tại Tọa → <b>vượng nhân đinh</b>; Hướng tinh đúng tại Hướng → <b>vượng tài lộc</b>. Cả 2 mặt đều đắc khí theo đúng Vận nhà.</div>`;
        } else if (vsCC.cachCuoc === "Thượng Sơn Hạ Thủy") {
            html += `<div class="luan-giai-item" style="color:#c62828;background:#ffebee;border-radius:6px;padding:8px;"><b>⚠️ Thượng Sơn Hạ Thủy</b> — cách cục xấu: Sơn tinh lạc ra Hướng → <b>hại nhân đinh</b>; Hướng tinh lạc về Tọa → <b>hao tán tài lộc</b>. Ngược hẳn vị trí cần có, cả 2 mặt đều thất khí.</div>`;
        } else if (vsCC.cachCuoc) {
            // Tổ hợp lẻ / lệch — liệt kê rõ từng yếu tố đang có, đúng ý nghĩa riêng của nó, không gộp mờ.
            let dong = [];
            if (vsCC.vuongSon) dong.push(`<span style="color:#2e7d32;">✅ <b>Vượng Sơn</b> (Sơn tinh đúng tại Tọa) — <b>vượng nhân đinh</b>, sức khỏe/con cháu thuận lợi.</span>`);
            if (vsCC.vuongHuong) dong.push(`<span style="color:#2e7d32;">✅ <b>Vượng Hướng</b> (Hướng tinh đúng tại Hướng) — <b>vượng tài lộc</b>, sự nghiệp/tiền bạc thuận lợi.</span>`);
            if (vsCC.thuongSon) dong.push(`<span style="color:#c62828;">⚠️ <b>Thượng Sơn</b> (Sơn tinh lạc ra Hướng) — <b>hại nhân đinh</b>, cần lưu ý sức khỏe, nhân khẩu.</span>`);
            if (vsCC.haThuy) dong.push(`<span style="color:#c62828;">⚠️ <b>Hạ Thủy</b> (Hướng tinh lạc về Tọa) — <b>hao tán tài lộc</b>, tiền bạc khó tụ.</span>`);
            html += `<div class="luan-giai-item" style="border-radius:6px;padding:8px;background:#fff8e1;"><b>${vsCC.cachCuoc}</b> — cách cục chỉ tốt một phần - không trọn vẹn:<br>${dong.join("<br>")}</div>`;
        }
    }

    // ===== THẤT TINH ĐẢ KIẾP (七星打劫) — bí pháp đặc biệt tốt, thông khí Tam Nguyên. =====
    if (bSon && bHuong && bVan) {
        let daKiep = xetThatTinhDaKiep(van, sf, hf, bVan);
        if (daKiep) {
            let saoVanKhopText = daKiep.saoVanKhop === "S,H" ? "cả Sơn tinh lẫn Hướng tinh" : (daKiep.saoVanKhop === "S" ? "Sơn tinh" : "Hướng tinh");
            if (daKiep.loai === "that") {
                html += `<div class="luan-giai-item" style="color:#0d47a1;background:#e3f2fd;border-radius:6px;padding:8px;"><b>⚡ Thất Tinh Đả Kiếp (thật)</b> — Vận tinh tại 3 cung <b>Càn - Ly - Chấn</b> cùng nhóm <b>${daKiep.nhom}</b>, và sao Vận (${van}) xuất hiện tại ${saoVanKhopText} của cung Hướng. Bí pháp đặc biệt tốt, không cần thêm điều kiện gì khác — <b>thông khí Tam Nguyên, chiếm khí tương lai- có khả năng hóa giải tai họa, chuyển hung thành cát cho các cách cục xấu, phát phúc lâu dài qua hàng thế kỷ, Đại Phú Đại Quý 👑</b>.</div>`;
            } else {
                html += `<div class="luan-giai-item" style="color:#4527a0;background:#ede7f6;border-radius:6px;padding:8px;"><b>⚡ Thất Tinh Đả Kiếp (giả)</b> — Vận tinh tại 3 cung <b>Tốn - Khảm - Đoài</b> cùng nhóm <b>${daKiep.nhom}</b>, và sao Vận (${van}) xuất hiện tại ${saoVanKhopText} của cung Hướng. Về lý thuyết cũng <b>thông khí Tam Nguyên - có khả năng hóa giải tai họa, chuyển hung thành cát cho các cách cục xấu, phát phúc lâu dài qua hàng thế kỷ</b>, nhưng vì là "giả" nên hiệu quả phụ thuộc nhiều vào <b>hình thế Loan Đầu (núi, nước) tại cung Tốn</b> — cần đẹp, hữu tình mới phát huy trọn vẹn; nếu hình thế xấu thì cách cục khó ứng nghiệm.</div>`;
            }
        }
    }

    // ===== LIÊN CHÂU TAM BAN (連珠三般) — Vận-Sơn-Hướng tạo bộ ba số liên tiếp
    // vòng tròn (1-2-3 ... 9-1-2) tại từng cung. Báo riêng từng cung có Liên Châu,
    // rồi tổng kết toàn bàn 9 cung. Nếu bộ ba chạm sao hung (2 hoặc 5) hoặc đúng
    // tổ hợp 5-6-7 thì tách riêng dòng cảnh báo hung, không gộp vào kết luận cát. =====
    if (typeof window.xetLienChauTamBanToanCuc === 'function') {
        let lienChau = window.xetLienChauTamBanToanCuc(bVan, bSon, bHuong, van, SO_TO_CUNG);
        if (lienChau.soCung > 0) {
            let dongTungCung = lienChau.chiTiet.map(function(ct) {
                let kq = ct.ketQua;
                let vuong = [];
                if (kq.sonVuong) vuong.push("Sơn tinh vượng khí");
                if (kq.huongVuong) vuong.push("Hướng tinh vượng khí");
                let ghiChuVuong = vuong.length ? ` — <span style="color:#2e7d32;">${vuong.join(", ")}, vận thế bền vững hơn</span>` : "";
                let canhBaoHung = "";
                if (kq.laToHopXau567) {
                    canhBaoHung = `<br><span style="color:#c62828;">⚠️ Tổ hợp 5-6-7 — dù là Liên Châu vẫn mang tính hung, dễ gây hỏa hoạn, kiện tụng. Cần xem thêm Loan Đầu bên ngoài để luận chính xác.</span>`;
                } else if (kq.camSaoHung) {
                    canhBaoHung = `<br><span style="color:#e65100;">⚠️ Bộ số có chạm Nhị Hắc (2) hoặc Ngũ Hoàng (5) — Liên Châu về cấu trúc số nhưng vẫn cần thận trọng, nên kết hợp Loan Đầu và ngũ hành sinh khắc trước khi kết luận cát.</span>`;
                }
                return `<div style="margin-top:4px;">• <b>${ct.ten}</b>: bộ ${kq.chuoi} (Vận ${bVan[ct.so]} - Sơn ${bSon[ct.so]} - Hướng ${bHuong[ct.so]})${ghiChuVuong}${canhBaoHung}</div>`;
            }).join("");

            let ketLuanToanCuc = lienChau.duTron9Cung
                ? `<div style="margin-top:6px;color:#2e7d32;"><b>✨ Đủ trọn 9/9 cung Liên Châu Tam Ban</b> — đại cách "đường công danh sự nghiệp rộng mở như đi trên mây xanh, vui vẻ, thênh thang, tự tại". Tuy nhiên nếu trong số đó có cung chạm sao hung như đã ghi chú ở trên thì vẫn phải xem xét riêng, không phải mọi mặt đều tốt tuyệt đối.</div>`
                : `<div style="margin-top:6px;color:#555;">Có <b>${lienChau.soCung}/9</b> cung đạt Liên Châu Tam Ban (chưa đủ trọn 9 cung nên chưa phải đại cách toàn phần).</div>`;

            html += `<div class="luan-giai-item" style="color:#004d40;background:#e0f2f1;border-radius:6px;padding:8px;">
                <b>🔗 Liên Châu Tam Ban</b> (連珠三般 — xét từng cung: Vận-Sơn-Hướng tạo bộ ba số liên tiếp theo vòng Lạc Thư)
                ${dongTungCung}
                ${ketLuanToanCuc}
            </div>`;
        }
    }

    // ===== THẬP HỢP (➕10) — TOÀN NHÀ (quét cả 9 cung, không chỉ Trung/Tọa/Hướng) —
    // dùng lại window.xetHopThap (V+S=10 hoặc V+H=10) cho từng cung. Nếu ĐỦ 9/9 cung thì
    // không liệt kê từng cung (rối mắt, vô nghĩa vì đã trọn vẹn) — chỉ nêu lợi ích của cách
    // cục Thập Cục toàn bàn. Nếu chưa đủ, liệt kê cung nào đạt kèm ghi chú cung đó là Tọa
    // hay Hướng của CHÍNH căn nhà (không phải Sơn tinh/Hướng tinh) — ví dụ nhà hướng Khảm mà
    // Ly (đối xứng Khảm qua Trung, tức là Tọa) đạt Hợp Thập thì ghi "Ly (Tọa)"; nếu Khảm cũng
    // đạt thì ghi "Khảm (Hướng)"; cung nào không phải Tọa/Hướng của nhà thì ghi trơn tên cung. =====
    if (typeof window.xetHopThap === 'function') {
        let dsHopThapToanNha = [];
        for (let c = 1; c <= 9; c++) {
            let tenC = SO_TO_CUNG[c];
            let ht = window.xetHopThap(bVan[c], bSon[c], bHuong[c]);
            if (ht.hopThapVS || ht.hopThapVH) {
                let ghiChuViTri = tenC === cungHuong ? " (Hướng)" : (tenC === cungToa ? " (Tọa)" : "");
                dsHopThapToanNha.push({ cung: tenC, ghiChuViTri });
            }
        }
        if (dsHopThapToanNha.length === 9) {
            html += `<div class="luan-giai-item" style="color:#00695c;background:#e0f2f1;border-radius:6px;padding:8px;">
                <b>➕10 Hợp Thập — thống kê toàn nhà</b>: đủ <b>9/9</b> cung đều Hợp Thập (Thập Cục toàn bàn).<br>
                Phối hợp với loan đầu hợp lý thì <b>Phúc Lộc song toàn, hóa hung thành cát, Kích hoạt chính ngẫu</b>.
            </div>`;
        } else if (dsHopThapToanNha.length > 0) {
            html += `<div class="luan-giai-item" style="color:#00695c;background:#e0f2f1;border-radius:6px;padding:8px;">
                <b>➕10 Hợp Thập — thống kê toàn nhà</b> (V+S=10 hoặc V+H=10, xét cả 9 cung): có <b>${dsHopThapToanNha.length}/9</b> cung đạt.<br>
                ${dsHopThapToanNha.map(d => `• <b>${d.cung}</b>${d.ghiChuViTri}`).join("<br>")}
            </div>`;
        }
    }

    // ===== CẶP SỐ 1-4 (Văn Xương) và 1-6 (Khôi Tinh) — TOÀN NHÀ (quét cả 9 cung) —
    // Xét ĐỦ 6 tổ hợp tại mỗi cung: 3 cặp giữa các sao bay với nhau (V-S, V-H, S-H)
    // + 3 cặp giữa SỐ LẠC THƯ GỐC của cung (CUNG_TO_SO — số mờ sau tên cung trên la bàn,
    // Khảm=1, Khôn=2... Ly=9) với từng sao bay tới (Gốc-V, Gốc-S, Gốc-H).
    // Ví dụ: cung Khảm gốc=1, nếu Vận bay tới =4 thì tính là cặp 1-4 (Gốc-V). =====
    {
        const TEN_CAP_14_16 = { "1-4": { ten: "Văn Xương (1-4)", icon: "🖋️", moTa: "Tốt văn học, nghệ thuật, tình duyên." },
                                 "1-6": { ten: "Khôi Tinh (1-6)", icon: "🏆", moTa: "Lợi công danh, sự nghiệp, thăng tiến quan chức." } };
        let dsCap14 = [], dsCap16 = [];
        for (let c = 1; c <= 9; c++) {
            let tenC = SO_TO_CUNG[c];
            let soGoc = CUNG_TO_SO[tenC]; // số Lạc Thư gốc của cung (mờ trên la bàn)
            let boSao = [
                ["V","S",bVan[c],bSon[c]], ["V","H",bVan[c],bHuong[c]], ["S","H",bSon[c],bHuong[c]],
                ["Gốc","V",soGoc,bVan[c]], ["Gốc","S",soGoc,bSon[c]], ["Gốc","H",soGoc,bHuong[c]]
            ];
            for (let [nhan1, nhan2, x, y] of boSao) {
                let key = [Math.min(x,y), Math.max(x,y)].join("-");
                if (key === "1-4") dsCap14.push({ cung: tenC, soGoc, cap: `${nhan1}-${nhan2}` });
                else if (key === "1-6") dsCap16.push({ cung: tenC, soGoc, cap: `${nhan1}-${nhan2}` });
            }
        }
        if (dsCap14.length > 0 || dsCap16.length > 0) {
            let dong14 = dsCap14.length ? `<div style="margin-top:4px;">${TEN_CAP_14_16["1-4"].icon} <b>${TEN_CAP_14_16["1-4"].ten}</b> — ${TEN_CAP_14_16["1-4"].moTa}<br>Có <b>${dsCap14.length}</b> cặp tại: ${dsCap14.map(d=>d.cung).join(", ")}</div>` : "";
            let dong16 = dsCap16.length ? `<div style="margin-top:4px;">${TEN_CAP_14_16["1-6"].icon} <b>${TEN_CAP_14_16["1-6"].ten}</b> — ${TEN_CAP_14_16["1-6"].moTa}<br>Có <b>${dsCap16.length}</b> cặp tại: ${dsCap16.map(d=>d.cung).join(", ")}</div>` : "";
            html += `<div class="luan-giai-item" style="color:#795500;background:#fff8e1;border-radius:6px;padding:8px;">
                <b>🔢 Học hành-Công Danh</b> <small> (xét cặp giữa các sao bay V-S/V-H/S-H, và cặp giữa số Lạc Thư gốc của cung với từng sao bay: Gốc-V/Gốc-S/Gốc-H)</small>
                ${dong14}${dong16}
            </div>`;
        }
    }

    // ===== PHÂN KIM — đối chiếu Động khẩu (đường/cửa/nước có khí động thực tế, khai báo ở tab
    // Thông Tin) với Hướng nhà: nếu CÙNG Nguyên Long (Thiên/Địa/Nhân) mà NGƯỢC Âm/Dương thì là
    // "Phúc Lộc Vĩnh Trình" — cách cục quý. Nếu không đạt, gợi ý các sơn cùng Nguyên Long, ngược
    // Âm/Dương với khẩu, để người dùng biết nên chỉnh Hướng nhà về sơn nào. =====
    if (typeof DS24_SON !== 'undefined' && typeof window.layStateThongTin === 'function' && tenSonHuong) {
        let ttState = window.layStateThongTin();
        let tenKhau = ttState ? ttState.dongKhauTaiSon : '';
        if (tenKhau) {
            let sonKhau = DS24_SON.find(x => x.ten === tenKhau);
            if (sonKhau && tenSonHuong.nguyenLong) {
                let TEN_NGUYEN_LONG = { "Thien": "Thiên nguyên", "Dia": "Địa nguyên", "Nhan": "Nhân nguyên" };
                let cungNguyenLong = sonKhau.nguyenLong === tenSonHuong.nguyenLong;
                let khacAmDuong = sonKhau.amDuong !== tenSonHuong.amDuong;
                if (cungNguyenLong && khacAmDuong) {
                    html += `<div class="luan-giai-item" style="color:#2e7d32;background:#e8f5e9;border-radius:6px;padding:8px;">
                        <b>🌟 Phân Kim — Phúc Lộc Vĩnh Trình</b><br>
                        Động khẩu tại <b>${sonKhau.ten}</b> (${sonKhau.amDuong === "Duong" ? "Dương khẩu" : "Âm khẩu"}, ${TEN_NGUYEN_LONG[sonKhau.nguyenLong]}) phối với Hướng nhà <b>${tenSonHuong.ten}</b> (${tenSonHuong.amDuong === "Duong" ? "Dương hướng" : "Âm hướng"}, ${TEN_NGUYEN_LONG[tenSonHuong.nguyenLong]}) — cùng Nguyên Long, Âm-Dương giao phối đúng cách → <b>Phúc Lộc Vĩnh Trình</b>, cát lợi lâu bền.
                    </div>`;
                } else {
                    let lyDo = !cungNguyenLong
                        ? `Khẩu <b>${sonKhau.ten}</b> (${TEN_NGUYEN_LONG[sonKhau.nguyenLong]}) và Hướng nhà <b>${tenSonHuong.ten}</b> (${TEN_NGUYEN_LONG[tenSonHuong.nguyenLong]}) KHÁC Nguyên Long`
                        : `Khẩu <b>${sonKhau.ten}</b> và Hướng nhà <b>${tenSonHuong.ten}</b> cùng Nguyên Long nhưng lại CÙNG ${sonKhau.amDuong === "Duong" ? "Dương" : "Âm"} (chưa giao phối Âm-Dương)`;
                    // Gợi ý các sơn cùng Nguyên Long với khẩu, ngược Âm/Dương với khẩu — để chỉnh Hướng nhà về đó
                    let goiY = DS24_SON.filter(x => x.nguyenLong === sonKhau.nguyenLong && x.amDuong !== sonKhau.amDuong && x.ten !== sonKhau.ten);
                    let dsGoiY = goiY.map(x => `<b>${x.ten}</b> (${x.amDuong === "Duong" ? "Dương" : "Âm"})`).join(", ");
                    html += `<div class="luan-giai-item" style="color:#795500;background:#fff8e1;border-radius:6px;padding:8px;">
                        <b>🌟 Phân Kim</b> — chưa đạt "Phúc Lộc Vĩnh Trình": ${lyDo}.<br>
                        Gợi ý: muốn đạt Phúc Lộc Vĩnh Trình với Động khẩu <b>${sonKhau.ten}</b> (${TEN_NGUYEN_LONG[sonKhau.nguyenLong]}, ${sonKhau.amDuong === "Duong" ? "Dương" : "Âm"} khẩu), Hướng nhà nên lập tại một trong các sơn cùng Nguyên Long, ngược Âm-Dương với khẩu: ${dsGoiY}.
                    </div>`;
                }
            }
        }
    }

    // ===== PHẢN NGÂM / PHỤC NGÂM — DANH MỤC TOÀN NHÀ — quét cả 9 cung (Sơn tinh và Hướng tinh),
    // dùng lại đúng hàm xetPhanPhucNgam (bàn hiệu lực, gồm sao Thế nếu có kiêm hướng) để liệt kê
    // rõ cung nào phạm và phạm ở sao nào (Sơn/Hướng, loại Phản hay Phục). =====
    if (bSon && bHuong) {
        let dsPhanPhucNgam = [];
        for (let c = 1; c <= 9; c++) {
            let tenC = SO_TO_CUNG[c];
            let ngS = xetPhanPhucNgam(bSon[c], tenC, "Son");
            let ngH = xetPhanPhucNgam(bHuong[c], tenC, "Huong");
            if (ngS) dsPhanPhucNgam.push({ cung: tenC, loaiBan: "Sơn tinh", sao: bSon[c], loai: ngS.loai, nhan: ngS.nhan });
            if (ngH) dsPhanPhucNgam.push({ cung: tenC, loaiBan: "Hướng tinh", sao: bHuong[c], loai: ngH.loai, nhan: ngH.nhan });
        }
        if (dsPhanPhucNgam.length > 0) {
            let dsPhuc = dsPhanPhucNgam.filter(d => d.loai === "phuc");
            let dsPhan = dsPhanPhucNgam.filter(d => d.loai === "phan");
            let dongDs = d => `<b>${d.cung}</b> (${d.loaiBan} ${d.sao})`;
            let phanText = dsPhan.length ? `<div style="margin-top:4px;"><b style="color:#c62828;">Phản Ngâm</b>: ${dsPhan.map(dongDs).join(", ")}.</div>` : "";
            let phucText = dsPhuc.length ? `<div style="margin-top:4px;"><b style="color:#8b0000;">Phục Ngâm</b>: ${dsPhuc.map(dongDs).join(", ")}.</div>` : "";
            html += `<div class="luan-giai-item" style="color:#8b0000;background:#ffebee;border-radius:6px;padding:8px;"><b>🔁 Phản Ngâm / Phục Ngâm — danh mục toàn nhà</b> (${dsPhanPhucNgam.length} cung/sao phạm)
                ${phanText}${phucText}
                <div style="margin-top:6px;font-size:0.9em;color:#555;"><i>Phục Ngâm: cung trùng đúng số Lạc Thư nguyên đán (5 nhập Trung thuận cục). Phản Ngâm: cung hợp thập với số Lạc Thư nguyên đán (5 nhập Trung nghịch cục). Cả hai đều dữ khi thất vận — hung tinh gặp đây càng hung, cát tinh gặp đây giảm lực hoặc dễ đảo chiều.</i></div>
            </div>`;
        }
    }

    // ===== HÀ ĐỒ TỨ TƯỢNG — THỐNG KÊ TOÀN NHÀ (quét cả 9 cung, không chỉ Trung cung) —
    // Dùng lại đúng xetHaDoTuTuong (mục 26-29) cho từng cung: cặp (Sơn tinh, Hướng tinh) tại
    // MỖI cung có thể hóa 1 trong 4 khí Hà Đồ (1-6/2-7/3-8/4-9) hay không, và đang Đương vượng/
    // Tiến khí/Thoái khí/Sát khí so với Vận hiện tại. Độc lập điểm số chính. =====
    if (bSon && bHuong && vanHienTai) {
        let dsHaDoToanNha = [];
        for (let c = 1; c <= 9; c++) {
            let tenC = SO_TO_CUNG[c];
            let kq = xetHaDoTuTuong(bSon[c], bHuong[c], vanHienTai);
            if (kq) dsHaDoToanNha.push(Object.assign({ cung: tenC }, kq));
        }
        if (dsHaDoToanNha.length > 0) {
            let dacVanList = dsHaDoToanNha.filter(d => d.dacVan);
            let thatVanList = dsHaDoToanNha.filter(d => !d.dacVan);
            let dongCung = d => `<b>${d.cung}</b> (${d.tenCap}, ${d.trangThai})`;
            let dacText = dacVanList.length ? `<div style="margin-top:4px;"><b style="color:#2e7d32;">Đắc vận</b>: ${dacVanList.map(dongCung).join(", ")}.</div>` : "";
            let thatText = thatVanList.length ? `<div style="margin-top:4px;"><b style="color:#8b0000;">Thất vận</b>: ${thatVanList.map(dongCung).join(", ")}.</div>` : "";
            html += `<div class="luan-giai-item" style="color:#795500;background:#fffaf0;border:1px dashed #b08968;border-radius:6px;padding:8px;">
                <b>🌊 Hà Đồ Tứ Tượng — thống kê toàn nhà</b> (xét cặp Sơn-Hướng tại từng cung/9 cung, so với Vận hiện tại ${vanHienTai}): có <b>${dsHaDoToanNha.length}/9</b> cung hóa khí Hà Đồ.
                ${dacText}${thatText}
            </div>`;
        }
    }

    // ===== HÀ ĐỒ TỨ TƯỢNG (Sơn-Hướng tại Trung cung) — riêng dòng tóm tắt tại Trung cung, giữ lại
    // để không mất chi tiết diễn giải dài (Nhân-Lộc-Thọ) đã có sẵn — không trùng khối thống kê trên. =====
    if (bSon && bHuong && vanHienTai) {
        let ghiChuHaDoTC = ghiChuHaDoTuTuong(bSon[5], bHuong[5], vanHienTai);
        if (ghiChuHaDoTC) html += ghiChuHaDoTC;
    }

    // ===== NGŨ HOÀNG TRẠCH TINH (cố định vĩnh viễn theo cách cục, KHÁC Ngũ Hoàng lưu niên) — Sơn
    // tinh hoặc Hướng tinh = 5 tại Trung/Tọa/Hướng. Chuyển từ tim-nha.js. Xét ĐÚNG 3 cung Trung/Tọa/
    // Hướng (không phải cả 9 cung). =====
    let viTriNguHoang = [];
    if (sb === 5) viTriNguHoang.push({ loai: "Sơn tinh", ten: `Tọa (${cungToa})` });
    if (sf === 5) viTriNguHoang.push({ loai: "Sơn tinh", ten: `Hướng (${cungHuong})` });
    if (bSon && bSon[5] === 5) viTriNguHoang.push({ loai: "Sơn tinh", ten: "Trung cung" });
    if (hb === 5) viTriNguHoang.push({ loai: "Hướng tinh", ten: `Tọa (${cungToa})` });
    if (hf === 5) viTriNguHoang.push({ loai: "Hướng tinh", ten: `Hướng (${cungHuong})` });
    if (bHuong && bHuong[5] === 5) viTriNguHoang.push({ loai: "Hướng tinh", ten: "Trung cung" });
    if (viTriNguHoang.length > 0) {
        let via = viTriNguHoang.map(v => `<b>${v.loai}</b> tại <b>${v.ten}</b>`).join(", ");
        html += `<div class="luan-giai-item" style="color:#4a148c;background:#f3e5f5;border-radius:6px;padding:8px;"><b>☠☠ Ngũ Hoàng Trạch Tinh</b> (xét tại Trung/Tọa/Hướng): ${via}. Đây là "gốc rễ bệnh của nhà" — cố định vĩnh viễn theo cách cục, không đổi theo năm. Nên đặt vật phẩm hành <b>Kim</b> (chuông gió kim loại, bát quái đồng, khánh đồng...) tại đúng vị trí này và giữ <b>lâu dài</b> để trấn.</div>`;
    }

    // ===== THÁI TUẾ + TAM SÁT (lưu niên, theo Năm xem — dùng lại ô "namXem" đã có sẵn trên tab) —
    // Tam Sát chỉ kỵ TỌA, Thái Tuế chỉ kỵ HƯỚNG. Chuyển từ tim-nha.js. Xét ĐÚNG 3 cung Trung/Tọa/
    // Hướng (Tam Sát/Thái Tuế thực chất chỉ rơi vào Tọa/Hướng, không có ở Trung cung). =====
    if (namXem && tenSonToa && tenSonHuong) {
        let chiNam = layDiaChiNam(namXem);
        let toaThaiTue = tenSonToa.ten === chiNam;
        let xungThaiTue = tenSonHuong.ten === chiNam;
        let loaiTamSat = xacDinhLoaiTamSat(chiNam, tenSonToa.ten);
        let toaSat = !!loaiTamSat;
        if (toaSat || xungThaiTue) {
            let dong = [];
            if (toaSat) dong.push(`☠ <b>Tọa phạm ${loaiTamSat.ten}</b> (${loaiTamSat.giaiDoan} — Tam Sát của Chi năm ${namXem}, tức năm ${chiNam}) — ${loaiTamSat.moTa} Đại kỵ động thổ, tu sửa tại Tọa (${cungToa}).`);
            if (xungThaiTue) dong.push(`⚠ <b>Hướng phạm Thái Tuế</b> (Hướng nhà trùng đúng phương Thái Tuế của Chi năm ${namXem}, tức năm ${chiNam}) — đối đầu trực diện với phương Thái Tuế, đại kỵ đào đắp/sửa chữa tại Hướng (${cungHuong}).`);
            html += `<div class="luan-giai-item" style="color:#8b0000;background:#ffebee;border-radius:6px;padding:8px;">${dong.join("<br>")}</div>`;
        }
        if (toaThaiTue) {
            html += `<div class="luan-giai-item" style="color:#1b5e20;background:#e8f5e9;border-radius:6px;padding:8px;">🛡️ <b>Tọa Thái Tuế</b> (Tọa sơn trùng đúng phương Thái Tuế của Chi năm ${namXem}, tức năm ${chiNam}) — như tựa lưng vào núi, có thế vững, không phải điều xấu. Lưu ý: dù Tọa hay Hướng, phương Thái Tuế tuyệt đối không đào đắp/sửa chữa/đục phá.</div>`;
        }
    }

    // ===== TAM HỢP PHÁI — THỐNG KÊ TOÀN NHÀ (quét 8 cung bát quái, bỏ qua Trung cung) — dùng lại
    // window.xetTamHopPhaiMotCung (luan-giai.js) và ô "Năm xem" (namXem) đã có sẵn trên tab — không
    // cần thêm ô năm riêng, tránh trùng lặp với Thái Tuế/Tam Sát ở trên (cùng dùng chung namXem). =====
    if (typeof window.xetTamHopPhaiMotCung === 'function' && namXem) {
        let dsTamHop = [], dsTamTai = [], dsXung = [];
        for (let c = 1; c <= 9; c++) {
            let tenC = SO_TO_CUNG[c];
            if (tenC === "Trung") continue;
            let thp = window.xetTamHopPhaiMotCung(tenC, namXem);
            if (!thp || !thp.ketQua) continue;
            let ghiChuViTri = tenC === cungHuong ? " (Hướng)" : (tenC === cungToa ? " (Tọa)" : "");
            if (thp.ketQua.namLaTamHop) dsTamHop.push({ cung: tenC, ghiChuViTri, phuongVi: thp.phuongVi });
            if (thp.ketQua.namLaTamTai) dsTamTai.push({ cung: tenC, ghiChuViTri, phuongVi: thp.phuongVi });
            if (thp.ketQua.namLaXung) dsXung.push({ cung: tenC, ghiChuViTri, phuongVi: thp.phuongVi });
        }
        if (dsTamHop.length || dsTamTai.length || dsXung.length) {
            let chiTHP = layDiaChiNam(namXem);
            let dong = [];
            if (dsTamHop.length) dong.push(`<div style="margin-top:4px;color:#2e7d32;">🔵 <b>Tam Hợp</b> (kích hoạt/tăng cường khí — cát càng cát, hung càng hung): ${dsTamHop.map(d => `<b>${d.cung}</b>${d.ghiChuViTri} (${d.phuongVi})`).join(", ")}.</div>`);
            if (dsTamTai.length) dong.push(`<div style="margin-top:4px;color:#c62828;">🔺 <b>Tam Tai</b> (dễ gây tai họa): ${dsTamTai.map(d => `<b>${d.cung}</b>${d.ghiChuViTri} (${d.phuongVi})`).join(", ")}.</div>`);
            if (dsXung.length) dong.push(`<div style="margin-top:4px;color:#e65100;">⚡ <b>Xung</b> (khí xáo trộn, biến động): ${dsXung.map(d => `<b>${d.cung}</b>${d.ghiChuViTri} (${d.phuongVi})`).join(", ")}.</div>`);
            html += `<div class="luan-giai-item" style="color:#5c4a3a;background:#fff8f0;border-radius:6px;padding:8px;">
                <b>🧭 Tam Hợp Phái — toàn cục</b> (năm ${namXem}, Chi ${chiTHP})
                ${dong.join("")}
                <div style="margin-top:6px;font-size:0.9em;color:#777;"><i>Đối chiếu Chi của năm lưu niên với Tam Hợp/Tam Tai/Xung riêng của từng cung bát quái. Nếu cung đang có hung tinh (Ngũ Hoàng, Nhị Hắc...) mà rơi vào năm Tam Hợp hoặc Tam Tai của chính cung đó thì hung sát phát tác mạnh nhất; nếu cung có cát tinh mà rơi vào năm Tam Hợp thì cát khí bùng nổ.</i></div>
            </div>`;
        }
    }

    // ===== TAM BAN QUÁI (三般卦, toàn cục 9 cung) + KHÔI TINH (1-6, cặp V-S/V-H tại Hướng) —
    // chỉ ghi chú tham khảo, không cộng/trừ điểm. Chuyển từ tim-nha.js. =====
    if (bSon && bHuong && bVan) {
        if (xetTamBanQuaiToanCuc(bVan, bSon, bHuong)) {
            html += `<div class="luan-giai-item" style="color:#6a1b9a;background:#f3e5f5;border-radius:6px;padding:8px;"><b>🔺 Tam Ban Quái</b> (toàn cục — xét cả 9 cung, không riêng Trung/Tọa/Hướng) — cả 9 cung của bàn đều có Vận-Sơn-Hướng cùng nhóm 1-4-7/2-5-8/3-6-9. Quý cách hiếm gặp, đắc quý nhân, thông cả 3 nguyên — nhưng cần Hướng tinh đúng chỗ có thủy thật mới phát huy, nếu không dễ biến cát thành hung.</div>`;
        }

        let khoiTinhHuong = xetKhoiTinhVH(bVan[CUNG_TO_SO[cungHuong]], sf, hf);
        if (khoiTinhHuong.length) {
            html += `<div class="luan-giai-item" style="color:#795500;background:#fff8e1;border-radius:6px;padding:8px;"><b>🏆 Khôi Tinh (1-6)</b> tại cung Hướng (${cungHuong}) — cặp ${khoiTinhHuong.map(k=>`${k.cap} = ${k.saoA}-${k.saoB}`).join(", ")}: lợi công danh, sự nghiệp, thăng tiến quan chức.</div>`;
        }
    }

    if (tot.length) html += `<div class="luan-giai-item"><b>✅ Cung nên tận dụng:</b> ${tot.map(c=>c.ten).join(", ")}. Đây là các khu vực thuận lợi cho sức khỏe và/hoặc tài lộc — phù hợp đặt phòng khách, bàn làm việc, phòng thờ, giường ngủ chính.</div>`;
    if (tb.length) html += `<div class="luan-giai-item"><b>➖ Cung trung bình:</b> ${tb.map(c=>c.ten).join(", ")}. Có thể dùng cho chức năng phụ (kho, lối đi, nhà vệ sinh).</div>`;
    if (xau.length) {
        html += `<div class="luan-giai-item"><b>⚠️ Cung cần tránh hoặc hóa giải:</b> ${xau.map(c=>c.ten).join(", ")}. Không nên đặt bếp, giường ngủ chính, bàn thờ hay két sắt tại các khu vực này nếu chưa hóa giải.</div>`;
        let goiY = xau.map(c => {
            let hanhCanTiet = HANH_SINH[c.hanhCung], hanhKhacCung = Object.keys(HANH_KHAC).find(h=>HANH_KHAC[h]===c.hanhCung);
            return `Cung ${c.ten} (${c.hanhCung}): có thể dùng vật phẩm hành ${hanhCanTiet} (${vatPhamTheoHanh[hanhCanTiet]||''}) để tiết giảm, hoặc hành ${hanhKhacCung} (${vatPhamTheoHanh[hanhKhacCung]||''}) để khắc chế — cân nhắc tùy mức độ.`;
        }).join(" ");
        html += `<div class="luan-giai-item"><b>🔧 Hướng hóa giải gợi ý:</b> ${goiY}</div>`;
    }
    html += `<div class="luan-giai-item"><i>Lưu ý: đây là gợi ý tổng quan dựa trên Các Tinh tú; nên kết hợp Loan đầu hình thế để kết luận.</i></div>`;
    return html;
}
// ===== Theo dõi "chưa bấm XEM SƠ ĐỒ" =====
// Danh sách toàn bộ input/select trong tab Nội Khí có ảnh hưởng đến kết quả tính toán. Nếu người
// dùng đổi bất kỳ ô nào trong danh sách này mà chưa bấm lại nút, ta hiện cảnh báo + đổi màu nút,
// để tránh nhầm tưởng bảng lưới/luận giải bên dưới đã phản ánh đúng thông số mới nhất.
const _DS_INPUT_ANH_HUONG_PHI_TINH = [
    "namNhapTrach", "vanNhapTrach", "huong24Son", "doSoTay", "congTacKiemHuong",
    "namSinhChu", "gioiTinhChu",
    "ngayDuongXem", "thangDuongXem", "namXem",
    "ngayAmLichXem", "thangXemAm", "namAmXem", "ngayAmNhuan",
    "canNgay", "chiNgay", "trungKhi"
];
function _layDauVanTayInputPhiTinh() {
    return _DS_INPUT_ANH_HUONG_PHI_TINH.map(id => {
        let el = document.getElementById(id);
        if (!el) return id + "=?";
        let v = el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value;
        return id + "=" + v;
    }).join("|");
}
// Đánh dấu kết quả hiện tại đã khớp với thông số hiện tại — gọi ngay sau khi tính toán xong.
function _danhDauPhiTinhDaCapNhat() {
    window._phiTinhDauVanTayDaTinh = _layDauVanTayInputPhiTinh();
    let btn = document.getElementById("btnXem");
    let canhBao = document.getElementById("canhBaoChuaCapNhat");
    if (btn) { btn.style.background = ""; btn.classList.remove("btn-can-cap-nhat"); }
    if (canhBao) canhBao.style.display = "none";
}
// Kiểm tra xem thông số hiện tại có còn khớp với lần tính gần nhất không — nếu lệch, bật cảnh báo.
function _kiemTraPhiTinhChuaCapNhat() {
    let dauMoi = _layDauVanTayInputPhiTinh();
    let chuaCapNhat = window._phiTinhDauVanTayDaTinh !== undefined && dauMoi !== window._phiTinhDauVanTayDaTinh;
    let btn = document.getElementById("btnXem");
    let canhBao = document.getElementById("canhBaoChuaCapNhat");
    if (btn) {
        btn.style.background = chuaCapNhat ? "#e65100" : "";
        btn.classList.toggle("btn-can-cap-nhat", chuaCapNhat);
    }
    if (canhBao) canhBao.style.display = chuaCapNhat ? "block" : "none";
}
// Gắn 1 listener duy nhất (event delegation) lên toàn bộ tab Nội Khí — không cần sửa từng thẻ input
// trong index.html. Chạy ở cả sự kiện "input" (gõ số) lẫn "change" (chọn select) để bắt mọi trường hợp.
(function _khoiTaoTheoDoiPhiTinhChuaCapNhat() {
    function gan() {
        let tab = document.getElementById("tab-noikhi");
        if (!tab || tab.dataset.theoDoiChuaCapNhat === "1") return;
        tab.addEventListener("input", _kiemTraPhiTinhChuaCapNhat);
        tab.addEventListener("change", _kiemTraPhiTinhChuaCapNhat);
        tab.dataset.theoDoiChuaCapNhat = "1";
    }
    gan();
    setTimeout(gan, 500);
    setTimeout(gan, 1500);
})();

async function tinhToanPhiTinh() {
    let btn = document.getElementById("btnXem"); btn.disabled = true; btn.innerText = "Đang tính...";
    let namNhap = parseInt(document.getElementById("namNhapTrach").value);
    let goc = parseFloat(document.getElementById("doSoTay").value) || 0;
    boTriLuoiTheoHuong(goc);   //cửu cung xoay
    let namXem = parseInt(document.getElementById("namXem").value);
    let thangXem = parseInt(document.getElementById("thangXemAm").value);
    let canNgay = document.getElementById("canNgay").value, chiNgay = document.getElementById("chiNgay").value;
    let trungKhi = document.getElementById("trungKhi").value;
    let van = tinhVanTuNam(namNhap);
    let vanHienTai = tinhVanTuNam(namXem); // Vận hiện tại theo năm đang xem — dùng để đánh giá vượng-suy, khác với "van" (chỉ dùng để lập bàn)
    let namSinhChuEl = document.getElementById("namSinhChu"), gioiTinhChuEl = document.getElementById("gioiTinhChu");
    let namSinhChu = namSinhChuEl && namSinhChuEl.value ? parseInt(namSinhChuEl.value) : null;
    let gioiTinhChu = gioiTinhChuEl ? gioiTinhChuEl.value : "nam";
    let huongSon = timSonTheoGoc(goc), lungSon = timSonTheoGoc((goc+180)%360);
    let saoNien = tinhSaoNien(namXem), saoNguyet = tinhSaoNguyet(namXem, thangXem), saoNhat = tinhSaoNhat(canNgay, chiNgay, trungKhi);
    let bVan = lapTinhBan(van, true);
    // ===== Chiều bay Sơn/Hướng bàn xác định theo phép thế quái (dùng bVan, không dùng van trực tiếp) =====
    let laThuanSon = xacDinhChieuBayTheoNguyenLong(lungSon, bVan);
    let laThuanHuong = xacDinhChieuBayTheoNguyenLong(huongSon, bVan);
    let bSon = lapTinhBan(laySoNhapTrungTuVanBan(bVan, lungSon), laThuanSon);
    let bHuong = lapTinhBan(laySoNhapTrungTuVanBan(bVan, huongSon), laThuanHuong);
    // ====================================================================================

    // ===== EXPORT ra window để module la bàn 9 ô (compass-module.js) ở tab khác (Thủy Pháp...)
    // có thể đọc lại đúng bàn Vận/Sơn/Hướng vừa tính, không phải tính lại. Kèm theo houseFacing/van
    // để nơi dùng biết dữ liệu này khớp với hướng/vận nào (đề phòng người dùng đổi tab mà chưa bấm
    // "Xem" lại ở tab Phi Tinh sau khi đổi hướng).
    window.bVanHienTai = bVan;
    window.bSonHienTai = bSon;
    window.bHuongHienTai = bHuong;
    window.phiTinhGocHuongDaTinh = goc;
    window.phiTinhVanDaTinh = van;

    // ===== SAO THẾ — chỉ tính khi công tắc Kiêm Hướng bật VÀ độ hướng thực tế cần kiêm hướng
    // (xetKiemHuongTheQuai báo canKiem=true). Sao Sơn dùng Nguyên Long của Sơn Tọa, Sao Hướng dùng
    // Nguyên Long của Sơn Hướng — mỗi sao thế theo Nguyên Long của chính nó (xem timSaoThe). Chiều
    // bay của bàn Sao Thế = đúng chiều bay đã dùng cho bàn Sơn/Hướng gốc (laThuanSon/laThuanHuong).
    let ctKiemHuongSaoThe = document.getElementById("congTacKiemHuong");
    let banSaoTheSon = null, banSaoTheHuong = null;
    if (ctKiemHuongSaoThe && ctKiemHuongSaoThe.checked) {
        let ktKiemHuong = xetKiemHuongTheQuai(goc);
        if (ktKiemHuong.canKiem) {
            banSaoTheSon = lapBanSaoThe(bSon[5], lungSon.nguyenLong, laThuanSon);
            banSaoTheHuong = lapBanSaoThe(bHuong[5], huongSon.nguyenLong, laThuanHuong);
        }
    }
    // EXPORT ra window để la bàn 9 ô ở tab khác (Cửu Cung Lưới, Thủy Pháp... qua compass-module.js)
    // vẽ được nhãn Sao Thế "t{số}" kế bên S/H — giống hệt cách bVanHienTai/bSonHienTai/bHuongHienTai
    // đã export ở trên. null nếu không kiêm hướng hoặc công tắc tắt (renderCompassOverlay tự bỏ qua).
    window.banSaoTheSonHienTai = banSaoTheSon;
    window.banSaoTheHuongHienTai = banSaoTheHuong;

    // ===== BÀN HIỆU LỰC CHO LUẬN GIẢI — khi có Sao Thế (kiêm hướng thế quái đang bật và cần kiêm),
    // TOÀN BỘ luận giải (từng cung, Tổng kết toàn nhà, Phản/Phục Ngâm, Vượng Sơn Vượng Hướng, Hợp
    // Thập, Tam Ban Quái, Liên Châu, Nhập Tù, dự báo Ngày/Tháng/Năm...) phải dùng SỐ SAO THẾ thay
    // cho số sao gốc — vì thế quái đã "thay ngôi" sao gốc trong Trung Cung, ý nghĩa cát hung đi theo
    // sao thế, không còn theo sao gốc nữa. Lưới ô vuông vẫn hiển thị "S{gốc} t{thế}" (giữ nguyên ở
    // dưới) để người dùng thấy cả 2, nhưng mọi câu chữ luận giải phải theo bàn hiệu lực này.
    let bSonHieuLuc = banSaoTheSon ? banSaoTheSon.ban : bSon;
    let bHuongHieuLuc = banSaoTheHuong ? banSaoTheHuong.ban : bHuong;

    let bNien = lapTinhBan(saoNien, true), bNguyet = lapTinhBan(saoNguyet, true), bNhat = lapTinhBan(saoNhat, TRUNG_KHI[trungKhi].thuan);
    const TEN_CUNG = ["","Khảm","Khôn","Chấn","Tốn","Trung","Càn","Đoài","Cấn","Ly"];
    // Xuất V/S/H theo TÊN CUNG + chiều bay Sơn/Hướng — NGAY SAU KHI TEN_CUNG được khai báo (const,
    // nên phải đặt SAU dòng khai báo — đặt trước sẽ vỡ do Temporal Dead Zone: "Cannot access
    // 'TEN_CUNG' before initialization"). Đồng thời phải đặt TRƯỚC mọi chỗ dùng xetPhanPhucNgam/
    // xetHopThap/tongKetToanNha/luanGiaiCung bên dưới, vì các hàm dùng chung trong luan-giai.js
    // (xetPhanPhucNgamMotSao...) đọc lại window.phiTinhVSH/window.phiTinhLaThuan.. — export muộn
    // (như bản cũ, ở cuối hàm) khiến các lời gọi bên dưới đọc dữ liệu của LẦN TÍNH TRƯỚC.
    // Dùng bSonHieuLuc/bHuongHieuLuc (đã gồm sao Thế nếu có) — không dùng bSon/bHuong gốc — để mọi
    // hàm dùng chung (Phản/Phục Ngâm nền trên lưới, v.v.) tự động luận theo sao Thế khi có kiêm hướng.
    window.phiTinhVSH = {};
    for (let c = 1; c <= 9; c++) window.phiTinhVSH[TEN_CUNG[c]] = {V: bVan[c], S: bSonHieuLuc[c], H: bHuongHieuLuc[c]};
    window.phiTinhLaThuanSon = laThuanSon;
    window.phiTinhLaThuanHuong = laThuanHuong;
    let ketQua9Cung = [];
    let duBao = document.getElementById("duBaoThoiGian");
    if (!duBao) {
        duBao = document.createElement("div");
        duBao.id = "duBaoThoiGian";
        document.getElementById("vungLuanGiai").insertAdjacentElement("beforebegin", duBao);
    }
    duBao.innerHTML = xayBangNgay(namXem, thangXem, vanHienTai, bSonHieuLuc[5], bHuongHieuLuc[5], canNgay, chiNgay, CUNG_TO_SO[lungSon.cung], CUNG_TO_SO[huongSon.cung]) + xayBangThang(namXem, thangXem, vanHienTai, bSonHieuLuc[5], bHuongHieuLuc[5], CUNG_TO_SO[lungSon.cung], CUNG_TO_SO[huongSon.cung]) + xayBangNam(namXem, bSonHieuLuc[5], bHuongHieuLuc[5], CUNG_TO_SO[lungSon.cung], CUNG_TO_SO[huongSon.cung]) + chuThichMauSao();

    // ===== KHUNG CHUNG "LUẬN GIẢI TOÀN NHÀ" — bọc ngoài Thành Môn + Địa Vận + Chính/Kiêm Hướng +
    // Tổng kết toàn nhà dưới 1 tiêu đề duy nhất, để đúng nghĩa "đầy đủ" thay vì 4 khối rời rạc. Các
    // div con (ketQuaThanhMon/ketQuaDiaVan/ketQuaKiemHuong/ketQuaTongKet) vẫn giữ nguyên id + logic
    // cập nhật nội dung như cũ, chỉ đổi nơi neo (insertAdjacentElement) để nằm trong khung này. =====
    let divLuanGiaiToanNha = document.getElementById("ketQuaLuanGiaiToanNha");
    if (!divLuanGiaiToanNha) {
        divLuanGiaiToanNha = document.createElement("div");
        divLuanGiaiToanNha.id = "ketQuaLuanGiaiToanNha";
        divLuanGiaiToanNha.className = "luan-giai-container";
        divLuanGiaiToanNha.innerHTML = `<div class="luan-giai-title">📋 Luận giải toàn nhà cho Vận (<span id="tieuDeVanLGTN"></span>):</div><div id="ketQuaLuanGiaiToanNhaBody"></div>`;
        duBao.insertAdjacentElement("afterend", divLuanGiaiToanNha);
    }
    document.getElementById("tieuDeVanLGTN").textContent = van;
    let ketQuaLuanGiaiToanNhaBody = document.getElementById("ketQuaLuanGiaiToanNhaBody");

    // ===== THÀNH MÔN — cứu nguy cho cục Địa không Vượng Sơn Vượng Hướng =====
    // QUAN TRỌNG: Thành Môn chỉ phát huy tác dụng (đem lại cát lành) trong ĐƯƠNG VẬN — tức Vận đang
    // xét tại thời điểm hiện tại (vanHienTai), KHÔNG PHẢI Vận lúc nhập trạch (van). Khi hết Vận, Thành
    // Môn mất hiệu lực, nếu không xử lý kịp thời còn có thể chuyển thành gây họa. Vì vậy phải lập lại
    // bàn Vận theo vanHienTai (không dùng bVan đã lập theo van nhập trạch) để tra cứu Vận tinh tại 2
    // cung liền kề, và điều kiện "đắc khí" cũng phải so với vanHienTai.
    let divThanhMon = document.getElementById("ketQuaThanhMon");
    if (!divThanhMon) {
        divThanhMon = document.createElement("div");
        divThanhMon.id = "ketQuaThanhMon";
        ketQuaLuanGiaiToanNhaBody.insertAdjacentElement("afterbegin", divThanhMon);
    }
    let bVanHienTaiChoThanhMon = lapTinhBan(vanHienTai, true);
    let dsThanhMon = xetThanhMon(huongSon, bVanHienTaiChoThanhMon, vanHienTai);
    // Xuất ra window để các module dùng chung (vd. compass-module.js ở tab Cửu Cung Lưới/Tâm Nhà)
    // có thể hiển thị biểu tượng ⛩️ ngay tại cung tương ứng mà không cần tính lại Thành Môn.
    window.phiTinhThanhMon = dsThanhMon;
    if (dsThanhMon.length > 0) {
        let tmChinh = dsThanhMon.find(tm => tm.loai === "Chính");
        let tmPhu = dsThanhMon.find(tm => tm.loai === "Phụ");
        let viTri = tm => `cung <b>${tm.quai}</b>${tm.sonThanhMon ? ` (sơn <b>${tm.sonThanhMon}</b>)` : ""}`;
        let dongTomTat = (tmChinh ? `<div style="margin-top:4px;"><b style="color:#2e7d32;">Thành Môn Chính</b>: ${viTri(tmChinh)}</div>` : "")
            + (tmPhu ? `<div style="margin-top:2px;"><b style="color:#f9a825;">Thành Môn Phụ</b>: ${viTri(tmPhu)}</div>` : "");

        let noiDungChiTiet = `<div style="margin-bottom:8px;">Cứu nguy cho cục Địa không Vượng Sơn Vượng Hướng — xét 2 cung liền kề 2 bên Hướng (${huongSon.cung}).</div>` +
            dsThanhMon.map(tm => {
                let mauLoai = tm.loai === "Chính" ? "#2e7d32" : "#f9a825";
                return `<div style="margin-top:8px;"><b style="color:${mauLoai};">Thành Môn ${tm.loai}</b> — cung <b>${tm.quai}</b>${tm.sonThanhMon ? `, đặt tại sơn <b>${tm.sonThanhMon}</b> (cùng Nguyên Long với Hướng)` : ""}. Vận tinh tại cung này (theo Vận hiện tại ${vanHienTai}) là ${tm.soVanTinh} → nhập trung, phi ${tm.laThuanTheThanhMon ? "thuận" : "nghịch"} → sao vượng đương lệnh (Vận ${vanHienTai}) bay đúng tới đây → <b>Thành Môn đắc khí</b>, rất tốt. <i>Lưu ý: chỉ có hiệu lực trong Vận ${vanHienTai} đang xét — Thành môn bắt buộc Phải có "khí động" thực tế tại vị trí đó (cửa, đường, nước). Nếu là tường kín thì vô dụng; Khi hết vận cần xem xét lại, nếu không có thể gặp suy bại.</i></div>`;
            }).join("");

        divThanhMon.innerHTML = `<div style="background:#e8f5e9;color:#333;border:2px solid #2e7d32;border-radius:8px;padding:10px 12px;margin:10px 0;">
            <b style="font-size:1.02em;">⛩️ Thành Môn<span class="nut-info" onclick='moInfoModal("⛩️ Thành Môn", ${JSON.stringify(noiDungChiTiet)})'>i</span></b>
            ${dongTomTat}
        </div>`;
    } else {
        let noiDungChiTiet = `Cứu nguy cho cục Địa không Vượng Sơn Vượng Hướng — xét 2 cung liền kề 2 bên Hướng (${huongSon.cung}).<div style="margin-top:8px;">Không có cung nào trong 2 cung liền kề Hướng (${huongSon.cung}) đạt điều kiện đắc khí — không có Thành Môn khả dụng ở Vận ${van} này.</div>`;
        divThanhMon.innerHTML = `<div style="background:#f5f5f5;color:#666;border:2px solid #bbb;border-radius:8px;padding:10px 12px;margin:10px 0;">
            <b style="font-size:1.02em;">⛩️ Thành Môn<span class="nut-info" onclick='moInfoModal("⛩️ Thành Môn", ${JSON.stringify(noiDungChiTiet)})'>i</span></b>
            <div style="font-size:0.92em;margin-top:4px;line-height:1.5;">Không có Thành Môn khả dụng ở Vận ${van} này.</div>
        </div>`;
    }

    // ===== NHẬP TÙ — khi Vận (tương lai) trùng đúng số Hướng tinh gốc tại Trung Cung (bàn gốc, lập
    // từ lúc nhập trạch, KHÔNG đổi theo thời gian). Tìm năm bắt đầu Vận Nhập Tù đầu tiên SAU năm nhập
    // trạch (mỗi Vận dài 20 năm, chu kỳ Tam Nguyên Cửu Vận lặp lại sau 180 năm, Vận tinh phi thuận
    // 1→2→...→9→1...).
    let divDiaVan = document.getElementById("ketQuaDiaVan");
    if (!divDiaVan) {
        divDiaVan = document.createElement("div");
        divDiaVan.id = "ketQuaDiaVan";
        divThanhMon.insertAdjacentElement("afterend", divDiaVan);
    }
    let vanNhapTu = bHuongHieuLuc[5];
    let namBatDauNhapTu = null;
    for (let k = 0; k <= 10; k++) {
        let mocGoc = 1864 + (vanNhapTu - 1) * 20 + k * 180;
        if (mocGoc > namNhap) { namBatDauNhapTu = mocGoc; break; }
    }
    let soNamConLaiTuHomNay = namBatDauNhapTu !== null ? namBatDauNhapTu - namXem : null;

    // ===== ĐỊA VẬN — số năm Vận tinh phi thuận từ Vận nhập trạch cho tới khi chạm đúng Vận Nhập Tù,
    // TỨC chính là số năm từ lúc nhập trạch cho tới năm bắt đầu Vận Nhập Tù (không phải phép trừ
    // tuyệt đối |Vận-Hướng|×20 như trước — đó là công thức sai).
    let diaVanNam = namBatDauNhapTu !== null ? namBatDauNhapTu - namNhap : null;

    // 3 trường hợp ngoại lệ — không phạm Nhập Tù dù đúng Vận:
    let ngoaiLe1 = (bHuongHieuLuc[5] === 5); // Hướng tinh (hiệu lực — gốc hoặc Thế) tại Trung Cung chính là sao 5
    // Ngoại lệ 2: tìm các cung BIÊN NHÀ (loại trừ cung Trung — không thể mở cửa/đường sá/thủy tại
    // Trung cung) trên bàn Hướng HIỆU LỰC (bHuongHieuLuc, chưa đổi Vận) đang có giá trị = 5 — đây là
    // (các) cung có thể mở cửa/đường sá/thủy để kích hoạt vượng khí H5, hóa giải. Nếu chính Hướng
    // tinh Trung cung đã là 5 (ngoaiLe1) thì không cần liệt kê lại ở đây, tránh trùng lặp vô nghĩa.
    let cacCungCoH5 = [];
    for (let c = 1; c <= 9; c++) {
        if (c === 5) continue; // bỏ qua Trung cung
        if (bHuongHieuLuc[c] === 5) cacCungCoH5.push(TEN_CUNG[c]);
    }
    let ngoaiLe2 = cacCungCoH5.length > 0;
    // Ngoại lệ 3: Thập Cục toàn bàn — CẢ 9 cung đều thỏa V+S=10 HOẶC V+H=10
    let ngoaiLe3 = false;
    if (typeof window.xetHopThap === 'function') {
        ngoaiLe3 = true;
        for (let c = 1; c <= 9; c++) {
            let ht = window.xetHopThap(bVan[c], bSonHieuLuc[c], bHuongHieuLuc[c]);
            if (!ht.hopThapVS && !ht.hopThapVH) { ngoaiLe3 = false; break; }
        }
    }
    let coHoaGiai = ngoaiLe1 || ngoaiLe2 || ngoaiLe3;

    let ghiChuNhapTu = "";
    if (namBatDauNhapTu !== null) {
        let dsHoaGiai = [];
        if (ngoaiLe1) dsHoaGiai.push("Hướng tinh tại Trung cung chính là sao 5 (Ngũ Hoàng) — không phạm Nhập Tù.");
        if (ngoaiLe2) dsHoaGiai.push(`Trên bàn Hướng hiện tại, cung <b>${cacCungCoH5.join(", ")}</b> đang có Hướng tinh H5 — Đến Vận ${vanNhapTu} (năm ${namBatDauNhapTu}) có thể mở cửa, mở đường sá, hoặc tạo thủy tại đúng cung này để kích hoạt vượng khí, hóa giải Nhập Tù.`);
        if (ngoaiLe3) dsHoaGiai.push("Toàn bàn 9 cung đều Hợp Thập (Thập Cục toàn bàn) — hóa giải được Nhập Tù.");
        ghiChuNhapTu = `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #7b1fa2;font-size:0.9em;line-height:1.6;">
            <b>⚠️ Lưu ý — Nhập Tù:</b> Khi hết Địa Vận (Vận ${vanNhapTu}, bắt đầu năm ${namBatDauNhapTu}${soNamConLaiTuHomNay !== null ? `, còn <b>${soNamConLaiTuHomNay > 0 ? soNamConLaiTuHomNay : 0} năm</b> nữa tính từ năm ${namXem} đang xem` : ""}), Hướng tinh sẽ bay nhập vào Trung cung — gọi là <b>Hướng tinh Nhập Tù</b>. Khi đó nhà sẽ suy bại cả đinh lẫn tài, linh khí huyệt mộ bị tiêu biến.
            ${coHoaGiai
                ? `<div style="margin-top:6px;color:#2e7d32;">✓ Trường hợp này <b>có thể hóa giải</b>:<br>${dsHoaGiai.map(d => "• " + d).join("<br>")}</div>`
                : `<div style="margin-top:6px;color:#8b0000;">✗ Không rơi vào 3 trường hợp ngoại lệ hóa giải (Hướng tinh gốc = 5; có cung nào đang mang H5 để kích hoạt; hoặc Thập Cục toàn bàn) — cần đặc biệt lưu ý khi tới Vận ${vanNhapTu}.</div>`}
        </div>`;
    }

    let noiDungChiTietDiaVan = `<div>Hướng tinh Trung cung H${bHuongHieuLuc[5]} — Vận tinh phi thuận từ Vận nhập trạch (${van}, năm ${namNhap}) tới khi chạm đúng Vận ${vanNhapTu} (năm ${namBatDauNhapTu}) → Địa Vận = ${namBatDauNhapTu} − ${namNhap} = <b>${diaVanNam !== null ? diaVanNam + " năm" : "—"}</b>.</div>${ghiChuNhapTu}`;

    divDiaVan.innerHTML = `<div style="background:#f3e9ff;color:#333;border:2px solid #7b1fa2;border-radius:8px;padding:10px 12px;margin:10px 0;">
        <b style="font-size:1.02em;">🌐 Địa Vận<span class="nut-info" onclick='moInfoModal("🌐 Địa Vận", ${JSON.stringify(noiDungChiTietDiaVan)})'>i</span></b>
        <div style="font-size:0.92em;margin-top:4px;line-height:1.5;">
            ${diaVanNam !== null ? `Địa Vận: <b>${diaVanNam} năm</b>` : "Địa Vận: —"}
            ${soNamConLaiTuHomNay !== null ? ` — còn <b>${soNamConLaiTuHomNay > 0 ? soNamConLaiTuHomNay : 0} năm</b>` : ""}
        </div>
    </div>`;

    // ===== Hiển thị kết quả xét Kiêm Hướng — Thế Quái (chỉ khi công tắc bật) =====
    let ctKiemHuong = document.getElementById("congTacKiemHuong");
    let divKiemHuong = document.getElementById("ketQuaKiemHuong");
    if (!divKiemHuong) {
        divKiemHuong = document.createElement("div");
        divKiemHuong.id = "ketQuaKiemHuong";
        divDiaVan.insertAdjacentElement("afterend", divKiemHuong);
    }
    if (ctKiemHuong && ctKiemHuong.checked) {
        let kq = xetKiemHuongTheQuai(goc);
        let mauNen = {"chinh-huong":"#e8f5e9", "kiem-huong-hop-le":"#fff8e1", "khong-vong":"#ffebee", "khong-phung":"#fce4ec", "quy-than":"#4a0000"}[kq.mucDo];
        let mauChu = kq.mucDo === "quy-than" ? "#fff" : "#333";
        let mauVien = {"chinh-huong":"#4CAF50", "kiem-huong-hop-le":"#f9a825", "khong-vong":"#c62828", "khong-phung":"#ad1457", "quy-than":"#ff1744"}[kq.mucDo];
        divKiemHuong.innerHTML = `<div style="background:${mauNen};color:${mauChu};border:2px solid ${mauVien};border-radius:8px;padding:10px 12px;margin:10px 0;">
            <b style="font-size:1.02em;">${kq.tieuDe}</b>
            <div style="font-size:0.92em;margin-top:4px;line-height:1.5;">${kq.moTa}</div>
        </div>`;
    } else {
        divKiemHuong.innerHTML = "";
    }

    document.getElementById("vungLuanGiai").innerHTML = "";
    loiGiaiTheoCung = {};

    // ===== TỔNG KẾT TOÀN NHÀ — hiện luôn ngay sau khi tính toán, không cần chờ click Trung cung
    // (đặt cạnh Thành Môn / Địa Vận, giống cách 2 mục đó tự hiện). Tính điểm 9 cung sớm ở đây riêng
    // cho mục đích này (vòng dưới vẫn tính lại y hệt để giữ nguyên logic gốc và ketQua9Cung dùng cho
    // Trung cung, không ảnh hưởng gì tới luồng cũ).
    let ketQua9CungSom = [];
    for (let c = 1; c <= 9; c++) {
        let hanhCungC0 = HANH_CUA_CUNG[TEN_CUNG[c]];
        let qSonC0 = qCungGoc(hanhCungC0, bSonHieuLuc[c]), qHuongC0 = qCungGoc(hanhCungC0, bHuongHieuLuc[c]);
        ketQua9CungSom.push({ten:TEN_CUNG[c], diem:qSonC0.diem + qHuongC0.diem, hanhCung:hanhCungC0});
    }
    let soToaSom = CUNG_TO_SO[lungSon.cung], soHuongSom = CUNG_TO_SO[huongSon.cung];
    let divTongKet = document.getElementById("ketQuaTongKet");
    if (!divTongKet) {
        divTongKet = document.createElement("div");
        divTongKet.id = "ketQuaTongKet";
        divKiemHuong.insertAdjacentElement("afterend", divTongKet);
    }
    divTongKet.innerHTML = luanChanKhiTienThien(van, huongSon.cung)
        + tongKetToanNha(van, ketQua9CungSom, bSonHieuLuc[soToaSom], bSonHieuLuc[soHuongSom], bHuongHieuLuc[soHuongSom], bHuongHieuLuc[soToaSom], bVan, lungSon.cung, huongSon.cung, bSonHieuLuc, bHuongHieuLuc, lungSon, huongSon, namXem, vanHienTai);

    // Vòng 1: vẽ lưới + tính điểm 9 cung (cần đủ trước khi ghép tổng kết vào Trung cung)
    for (let c = 1; c <= 9; c++) {
        let cell = document.getElementById("cung-" + c);
        // Phản/Phục Ngâm nền + điểm 9 cung xét theo bàn HIỆU LỰC (gồm sao Thế nếu có kiêm hướng) —
        // ý nghĩa cát hung đi theo sao đang thật sự tác động, không phải sao gốc đã bị thế thay.
        let ngamSonNen = xetPhanPhucNgam(bSonHieuLuc[c], TEN_CUNG[c], "Son"), ngamHuongNen = xetPhanPhucNgam(bHuongHieuLuc[c], TEN_CUNG[c], "Huong");
        let ngamHitNen = !!(ngamSonNen || ngamHuongNen);
        let soNenGoc = CUNG_TO_SO[TEN_CUNG[c]];
        let nenHTML = `<div class="so-nen-goc-vs" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.4em;font-weight:700;pointer-events:none;z-index:0;color:${ngamHitNen?'#b71c1c':'#999'};opacity:${ngamHitNen?'0.30':'0.26'};"${ngamHitNen?` title="${[ngamSonNen&&('Sơn tinh '+ngamSonNen.nhan),ngamHuongNen&&('Hướng tinh '+ngamHuongNen.nhan)].filter(Boolean).join(', ')} — số Lạc Thư nguyên đán ${soNenGoc}"`:''}>${soNenGoc}</div>`;
        // Sao Thế (nếu có, kiêm hướng thế quái) — hiển thị nhỏ kế bên sao GỐC trên lưới ô vuông, dạng
        // "_t{số thế}", để người dùng thấy cả gốc lẫn thế cùng lúc. Luận giải bên dưới dùng bàn hiệu lực.
        let saoTheSonHTML = banSaoTheSon ? `<sub class="sao-the" style="font-size:0.6em;font-weight:600;opacity:0.85;" title="Sao Thế Sơn tinh: ${banSaoTheSon.soThe} (thay cho ${bSon[5]})">t${banSaoTheSon.ban[c]}</sub>` : "";
        let saoTheHuongHTML = banSaoTheHuong ? `<sub class="sao-the" style="font-size:0.6em;font-weight:600;opacity:0.85;" title="Sao Thế Hướng tinh: ${banSaoTheHuong.soThe} (thay cho ${bHuong[5]})">t${banSaoTheHuong.ban[c]}</sub>` : "";
        // Thành Môn đắc khí tại cung này -> gắn biểu tượng ⛩️ ngay cạnh Niên tinh (N) cho dễ nhận biết trực quan
        let thanhMonTaiCungNay = dsThanhMon.find(tm => tm.quai === TEN_CUNG[c]);
        let bieuTuongThanhMon = thanhMonTaiCungNay ? `<span style="position:absolute;left:2px;top:50%;transform:translateY(-50%);font-size:11px;line-height:1;" title="Thành Môn ${thanhMonTaiCungNay.loai} đắc khí${thanhMonTaiCungNay.sonThanhMon ? ' tại sơn ' + thanhMonTaiCungNay.sonThanhMon : ''} (Vận ${vanHienTai})">⛩️</span>` : "";
        cell.innerHTML = `<div class="sao-hang-tren" style="position:relative;">${nenHTML}<span class="sao-item" style="position:relative;z-index:1;color:#d32f2f;">S${bSon[c]}${saoTheSonHTML}</span><span class="cung-ten" style="position:relative;z-index:1;">${TEN_CUNG[c]}</span><span class="sao-item" style="position:relative;z-index:1;color:#388e3c;">H${bHuong[c]}${saoTheHuongHTML}</span></div><div class="van-tinh" style="position:relative;">${bieuTuongThanhMon}${bVan[c]}</div><div class="hang-phu"><span class="phu-item ${getBgClass(bNien[c])}">N${bNien[c]}</span><span class="phu-item ${getBgClass(bNguyet[c])}">Ng${bNguyet[c]}</span><span class="phu-item ${getBgClass(bNhat[c])}">Nh${bNhat[c]}</span></div>`;
        cell.style.cursor = "pointer";
        let hanhCungC = HANH_CUA_CUNG[TEN_CUNG[c]];
        let qSonC = qCungGoc(hanhCungC, bSonHieuLuc[c]), qHuongC = qCungGoc(hanhCungC, bHuongHieuLuc[c]);
        let diemC = qSonC.diem + qHuongC.diem;
        ketQua9Cung.push({ten:TEN_CUNG[c], diem:diemC, hanhCung:hanhCungC});
    }
    // Vòng 2: build luận giải từng cung; riêng Trung cung ghép thêm tổng kết toàn nhà vào cuối
    for (let c = 1; c <= 9; c++) {
        // Luận giải văn bản dùng bàn HIỆU LỰC (sao Thế nếu có kiêm hướng) — theo đúng nguyên tắc thế
        // quái: sao Thế thay hẳn vai trò sao gốc trong Trung Cung, cát hung đi theo sao Thế.
        let loiGiai = luanGiaiCung(TEN_CUNG[c], van, bVan[c], bSonHieuLuc[c], bHuongHieuLuc[c], bNien[c], bNguyet[c], bNhat[c], thangXem, vanHienTai, namXem);
        let tieuDeSaoThe = (banSaoTheSon || banSaoTheHuong) ? ` <span style="font-weight:400;font-size:0.85em;color:#795500;">(theo Sao Thế${banSaoTheSon ? `, gốc S${bSon[c]}` : ''}${banSaoTheHuong ? `${banSaoTheSon ? ',' : ','} gốc H${bHuong[c]}` : ''})</span>` : "";
        let html = `<div class="luan-giai-item" id="luan-${TEN_CUNG[c]}"><b>Cung ${TEN_CUNG[c]} (S${bSonHieuLuc[c]}-H${bHuongHieuLuc[c]}):</b>${tieuDeSaoThe}<br>${loiGiai}</div>`;
        if (TEN_CUNG[c] === "Trung") {
            let soToa = CUNG_TO_SO[lungSon.cung], soHuong = CUNG_TO_SO[huongSon.cung];
            html += luanHaLacTest(van, vanHienTai, huongSon.cung, lungSon.cung, namSinhChu, gioiTinhChu);
            // Lưu ý: Luận Chân Khí Tiên Thiên (Hà Đồ) và Tổng kết toàn nhà đã được hiển thị tự động
            // ngay sau khi tính toán (xem div#ketQuaTongKet ở trên) — không ghép lại ở đây để tránh trùng lặp.
        }
        loiGiaiTheoCung[TEN_CUNG[c]] = html;
        document.getElementById("cung-" + c).onclick = () => hienThiLuanGiaiCung(TEN_CUNG[c]);
    }
    btn.disabled = false; btn.innerText = "XEM SƠ ĐỒ CỬU CUNG";
    _danhDauPhiTinhDaCapNhat(); // kết quả vừa hiển thị đã khớp thông số hiện tại — tắt cảnh báo

    // (window.phiTinhVSH đã được xuất SỚM hơn, ngay sau khi khai báo TEN_CUNG — xem ở trên)
    try { if (typeof cuuCungLuoiRedraw === "function") cuuCungLuoiRedraw(); } catch (e) {}
}
// Xác định 1 thời điểm (Niên tinh của 1 năm, hoặc Nguyệt tinh của 1 tháng) có "xấu" cho toàn nhà hay không,
// xét trên Trung cung (đại diện chung cả nhà) — dùng lại đúng 3 quy tắc đã áp dụng cho luận giải từng cung.
function laThoiDiemXau(saoTV, vanTaiThoiDiem, hanhCungTC, qSonTC, qHuongTC, sSonTC, sHuongTC) {
    let hanhTV = HANH_CUA_SAO[saoTV];
    if (qCungGoc(hanhCungTC, saoTV).loai === "xau") return true; // (1) tự nó khắc Trung cung
    if (trangThaiThoiVan(saoTV, vanTaiThoiDiem).loai === "hung") return true; // (2) đang Tử/Sát so với vận tại thời điểm đó
    if (qSonTC.loai === "xau") { let hs = HANH_CUA_SAO[sSonTC]; if (hanhTV===hs || HANH_SINH[hanhTV]===hs) return true; } // (5) kích hoạt hung của Sơn
    if (qHuongTC.loai === "xau") { let hh = HANH_CUA_SAO[sHuongTC]; if (hanhTV===hh || HANH_SINH[hanhTV]===hh) return true; } // (5) kích hoạt hung của Hướng
    return false;
}
// Xây nhãn mô tả ngắn "(theo Nguyệt/Niên/Nhật tinh, xét cung: ...)" tuỳ theo cung nào đang được tick,
// dùng chung cho cả 3 hàm xayBangNgay/xayBangThang/xayBangNam để đồng nhất cách diễn đạt.
function moTaCungDangXet(coChon) {
    let ten = [];
    if (coChon.toa) ten.push("Tọa");
    if (coChon.huong) ten.push("Hướng");
    if (coChon.trung) ten.push("Trung");
    if (coChon.cungKhac && coChon.tenCungKhac) ten.push(coChon.tenCungKhac);
    if (ten.length === 0) return "chưa chọn cung nào — tick ít nhất 1 mục ở trên";
    return "xét cung " + ten.join("/");
}
function xayBangThang(namXem, thangXem, vanHienTai, sSonTC, sHuongTC, soToa, soHuong) {
    let hanhCungTC = "Thổ";
    let qSonTC = qCungGoc(hanhCungTC, sSonTC), qHuongTC = qCungGoc(hanhCungTC, sHuongTC);
    let namAmHienTai = parseInt(document.getElementById("namAmXem")?.value) || namXem;
    let coChon = layCoChonCungLichNha();
    let soCungKhac = (coChon.cungKhac && coChon.tenCungKhac) ? CUNG_TO_SO[coChon.tenCungKhac] : null;
    let o = "";
    for (let t = 1; t <= 12; t++) {
        let saoNg = tinhSaoNguyet(namXem, t);
        let xau = laThoiDiemXau(saoNg, vanHienTai, hanhCungTC, qSonTC, qHuongTC, sSonTC, sHuongTC);
        // Nguyệt tinh bay THUẬN (giống bNguyet ở bàn chính) — lập bàn 9 cung cho riêng tháng này để
        // lấy đúng số Nguyệt tinh tại cung Tọa/Hướng/Cung-khác, rồi tổng hợp theo các mục đang được tick.
        let bNgTemp = lapTinhBan(saoNg, true);
        let saoTaiCungKhac = soCungKhac ? bNgTemp[soCungKhac] : null;
        let saoNangNhat = saoNangNhatToaHuongTrung(bNgTemp[soToa], bNgTemp[soHuong], saoNg, coChon, saoTaiCungKhac);
        let mauChuSao = mauChuTheoSao(saoNangNhat);
        let mauChu = mauChuSao || "#333";
        // Chấm nâu trên đầu chỉ hiện khi thời điểm xấu NHƯNG sao đó không thuộc 4 sao nguy hiểm đã có màu chữ riêng
        let chamNau = (xau && !mauChuSao) ? `<span style="position:absolute;top:-1px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:#795548;"></span>` : "";
        let tooltipCungKhac = soCungKhac ? `, ${coChon.tenCungKhac}:${saoTaiCungKhac}` : "";
        o += `<div style="position:relative;display:inline-block;width:7.6%;text-align:center;padding:3px 0;font-weight:700;font-size:12px;cursor:pointer;color:${mauChu};${t===thangXem?'text-decoration:underline;':''}" title="Nguyệt tinh — Trung:${saoNg}, Tọa:${bNgTemp[soToa]}, Hướng:${bNgTemp[soHuong]}${tooltipCungKhac} — bấm để xem tháng ${t} âm lịch" onclick="nhayToiThang(${namAmHienTai},${t})">${chamNau}T${t}</div>`;
    }
    return `<div class="luan-giai-item"><b>📅 Dự báo 12 tháng ÂM LỊCH năm ${namXem}</b> <span style="font-weight:normal;font-size:12px;color:#888;">(theo Nguyệt tinh, ${moTaCungDangXet(coChon)} — lấy sao nặng nhất )</span><div style="margin-top:4px;">${o}</div></div>`;
}
function xayBangNam(namXem, sSonTC, sHuongTC, soToa, soHuong) {
    let hanhCungTC = "Thổ";
    let qSonTC = qCungGoc(hanhCungTC, sSonTC), qHuongTC = qCungGoc(hanhCungTC, sHuongTC);
    let ngayDuongHienTai = parseInt(document.getElementById("ngayDuongXem")?.value) || 1;
    let thangDuongHienTai = parseInt(document.getElementById("thangDuongXem")?.value) || 1;
    let coChon = layCoChonCungLichNha();
    let soCungKhac = (coChon.cungKhac && coChon.tenCungKhac) ? CUNG_TO_SO[coChon.tenCungKhac] : null;
    let o = "";
    for (let dY = -3; dY <= 3; dY++) {
        let nam = namXem + dY;
        let vanNam = tinhVanTuNam(nam);
        let saoNienNam = tinhSaoNien(nam);
        let xau = laThoiDiemXau(saoNienNam, vanNam, hanhCungTC, qSonTC, qHuongTC, sSonTC, sHuongTC);
        // Niên tinh bay THUẬN (giống bNien ở bàn chính) — lập bàn 9 cung riêng cho năm này để lấy đúng
        // số Niên tinh tại cung Tọa/Hướng/Cung-khác, rồi tổng hợp theo các mục đang được tick.
        let bNienTemp = lapTinhBan(saoNienNam, true);
        let saoTaiCungKhac = soCungKhac ? bNienTemp[soCungKhac] : null;
        let saoNangNhat = saoNangNhatToaHuongTrung(bNienTemp[soToa], bNienTemp[soHuong], saoNienNam, coChon, saoTaiCungKhac);
        let mauChuSao = mauChuTheoSao(saoNangNhat);
        let mauChu = mauChuSao || "#333";
        let chamNau = (xau && !mauChuSao) ? `<span style="position:absolute;top:-1px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:#795548;"></span>` : "";
        let tooltipCungKhac = soCungKhac ? `, ${coChon.tenCungKhac}:${saoTaiCungKhac}` : "";
        o += `<div style="position:relative;display:inline-block;width:13.6%;text-align:center;padding:3px 0;font-weight:700;font-size:12px;cursor:pointer;color:${mauChu};${dY===0?'text-decoration:underline;':''}" title="Niên tinh — Trung:${saoNienNam}, Tọa:${bNienTemp[soToa]}, Hướng:${bNienTemp[soHuong]}${tooltipCungKhac} — bấm để xem năm này" onclick="nhayToiNam(${nam},${thangDuongHienTai},${ngayDuongHienTai})">${chamNau}${nam}</div>`;
    }
    return `<div class="luan-giai-item"><b>🗓️ Dự báo 7 năm (${namXem-3}–${namXem+3})</b> <span style="font-weight:normal;font-size:12px;color:#888;">(theo Niên tinh, ${moTaCungDangXet(coChon)} — lấy sao nặng nhất)</span><div style="margin-top:4px;">${o}</div></div>`;
}
// ===== Điều hướng: bấm vào ô Tháng/Năm/Ngày trong bảng dự báo -> nhảy tới đúng thời điểm đó =====
// LƯU Ý: bảng Tháng hiển thị và tính Nguyệt tinh theo THÁNG ÂM LỊCH (đúng chuẩn phong thủy Huyền
// Không — Nguyệt tinh luôn tính theo tháng Âm, không phải tháng Dương). Vì vậy khi bấm vào 1 ô
// tháng, phải set qua các ô ÂM LỊCH (#thangXemAm, #namAmXem, #ngayAmLichXem) rồi gọi dongBoTuAm() —
// không được set qua ô Dương lịch, nếu không app sẽ hiểu nhầm con số đó là tháng Dương và tự quy
// đổi lệch sang tháng Âm khác (thường sớm hơn 1-2 tháng, đúng như đã xảy ra trước khi sửa).
function nhayToiThang(namAm, thangAm) {
    document.getElementById("thangXemAm").value = thangAm;
    document.getElementById("namAmXem").value = namAm;
    document.getElementById("ngayAmNhuan").checked = false;
    dongBoTuAm();
}
window.nhayToiThang = nhayToiThang;
function nhayToiNam(nam, thang, ngay) {
    let maxDay = new Date(nam, thang, 0).getDate();
    if (ngay > maxDay) ngay = maxDay;
    document.getElementById("ngayDuongXem").value = ngay;
    document.getElementById("thangDuongXem").value = thang;
    document.getElementById("namXem").value = nam;
    dongBoTuDuong();
}
window.nhayToiNam = nhayToiNam;
// ===== Trung Khí chính xác + Can-Chi ngày, lấy trực tiếp từ module Lịch Vạn Niên (js/lich-van-nien.js) =====
// để dựng bảng ngày xấu đúng theo THÁNG ÂM LỊCH (input "Tháng xem" của app là âm lịch, không phải dương lịch).
// Trung Khí chính xác theo vị trí mặt trời thực (dùng sunLongitude từ LICH_VAN_NIEN), quy về đúng 6 mốc
// mà hệ Nhật Tinh Lục Giáp đang dùng (mỗi mốc cách nhau đúng 60°, bắt đầu từ Đông Chí = 270°).
function layTrungKhiTuSunLongitude(sunLongStr) {
    let sunLong = parseFloat(sunLongStr);
    let phase = ((sunLong - 270) % 360 + 360) % 360;
    let zone = Math.floor(phase / 60);
    const ZONES = ["DongChi", "VuThuy", "CocVu", "HaChi", "XuThu", "SuongGiang"];
    return ZONES[zone] || "DongChi";
}
function xayBangNgay(namXemAm, thangXemAm, vanHienTai, sSonTC, sHuongTC, canNgayXem, chiNgayXem, soToa, soHuong) {
    let hanhCungTC = "Thổ";
    let qSonTC = qCungGoc(hanhCungTC, sSonTC), qHuongTC = qCungGoc(hanhCungTC, sHuongTC);
    if (typeof LICH_VAN_NIEN === "undefined") {
        return `<div class="luan-giai-item"><i>⚠️ Chưa tải được js/lich-van-nien.js nên chưa thể dựng bảng ngày xấu theo tháng âm lịch. Kiểm tra lại thứ tự nạp script trong index.html.</i></div>`;
    }
    // Quét ~15 tháng dương lịch quanh năm âm đang xem để chắc chắn bắt đủ mọi ngày thuộc đúng tháng âm cần tìm
    // (tháng âm không thẳng hàng với tháng dương, và có thể lệch sang năm dương liền trước/sau quanh dịp Tết).
    let diem0 = new Date(namXemAm - 1, 10, 1); // mốc quét từ 1/11 năm dương trước, đủ bao trùm Tết
    let ngayKhopThangAm = [];
    for (let i = 0; i < 450; i++) {
        let d = new Date(diem0.getTime() + i * 86400000);
        let dd = d.getDate(), mm = d.getMonth() + 1, yy = d.getFullYear();
        let info = LICH_VAN_NIEN.getFullInfo(dd, mm, yy);
        if (info.lunarYear === namXemAm && info.lunarMonthNum === thangXemAm) {
            ngayKhopThangAm.push({ dd, mm, yy, info });
        }
    }
    let coChon = layCoChonCungLichNha();
    let soCungKhac = (coChon.cungKhac && coChon.tenCungKhac) ? CUNG_TO_SO[coChon.tenCungKhac] : null;
    let o = "";
    ngayKhopThangAm.forEach(({ dd, mm, yy, info }) => {
        let [can, chi] = info.canChiDay.split(" ");
        let trungKhiKey = layTrungKhiTuSunLongitude(info.solarTerm.sunLongitude);
        let saoNhatNgay = tinhSaoNhat(can, chi, trungKhiKey);
        let xau = laThoiDiemXau(saoNhatNgay, vanHienTai, hanhCungTC, qSonTC, qHuongTC, sSonTC, sHuongTC);
        let laNgayDangXem = can === canNgayXem && chi === chiNgayXem;
        // Nhật tinh bay thuận/nghịch tuỳ Trung Khí (giống bNhat ở bàn chính) — lập bàn 9 cung riêng cho
        // ngày này để lấy đúng số Nhật tinh tại cung Tọa/Hướng/Cung-khác, tổng hợp theo các mục đang được tick.
        let bNhatTemp = lapTinhBan(saoNhatNgay, TRUNG_KHI[trungKhiKey].thuan);
        let saoTaiCungKhac = soCungKhac ? bNhatTemp[soCungKhac] : null;
        let saoNangNhat = saoNangNhatToaHuongTrung(bNhatTemp[soToa], bNhatTemp[soHuong], saoNhatNgay, coChon, saoTaiCungKhac);
        let mauChuSao = mauChuTheoSao(saoNangNhat);
        let mauChu = mauChuSao || "#333";
        let chamNau = (xau && !mauChuSao) ? `<span style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#795548;"></span>` : "";
        let tooltipCungKhac = soCungKhac ? `, ${coChon.tenCungKhac} ${saoTaiCungKhac}` : "";
        o += `<div style="position:relative;display:inline-block;width:24px;text-align:center;padding:3px 0;font-weight:700;font-size:10.5px;cursor:pointer;color:${mauChu};${laNgayDangXem?'text-decoration:underline;':''}" title="${dd}/${mm}/${yy} — ${info.canChiDay} — Nhật tinh: Trung ${saoNhatNgay}, Tọa ${bNhatTemp[soToa]}, Hướng ${bNhatTemp[soHuong]}${tooltipCungKhac} — bấm để xem ngày này" onclick="nhayToiNgay(${dd},${mm},${yy})">${chamNau}${info.lunarDayNum}</div>`;
    });
    return `<div class="luan-giai-item"><b>📆 Ngày xấu trong tháng ${thangXemAm} Âm Lịch, năm ${namXemAm}</b> <span style="font-weight:normal;font-size:12px;color:#888;">(theo Nhật tinh, ${moTaCungDangXet(coChon)} — lấy sao nặng nhất)</span><div style="margin-top:4px;">${o}</div><div style="font-size:11px;color:#888;margin-top:4px;">Can-Chi và Trung Khí lấy trực tiếp từ Lịch Vạn Niên (Trung Khí tính theo vị trí mặt trời thực).</div></div>`;
}
window.nhayToiNgay = function(dd, mm, yy) {
    document.getElementById("ngayDuongXem").value = dd;
    document.getElementById("thangDuongXem").value = mm;
    document.getElementById("namXem").value = yy;
    dongBoTuDuong();
};
let loiGiaiTheoCung = {};
function hienThiLuanGiaiCung(tenCung) {
    let noiDung = loiGiaiTheoCung[tenCung] || "Chưa có dữ liệu luận giải cho cung này — bấm \"XEM SƠ ĐỒ CỬU CUNG\" trước.";
    // Mở popup dùng chung (giống Cửu Cung Lưới) — đỡ phải cuộn trang dài như trước.
    moInfoModal("🧭 Luận giải cung " + tenCung, noiDung);
    // Vẫn cập nhật vùng tóm tắt cố định dưới trang, để người dùng biết vừa xem cung nào (không lặp lại toàn bộ nội dung dài).
    let vung = document.getElementById("vungLuanGiai");
    if (vung) vung.innerHTML = `Đang xem cung <b>${tenCung}</b> — <a href="javascript:void(0)" onclick='hienThiLuanGiaiCung("${tenCung}")' style="color:#8b0000;text-decoration:underline;">bấm lại để mở popup</a> nếu đã lỡ đóng.`;
}

// ==== ĐỒNG BỘ 2 CHIỀU DƯƠNG LỊCH ↔ ÂM LỊCH — nhập bên nào, bên kia + Can/Chi/Trung Khí tự quy đổi ====
// Tìm ngày Dương lịch ứng với 1 ngày Âm lịch cho trước, bằng cách quét qua LICH_VAN_NIEN (đã có sẵn, chỉ hỗ trợ chiều Dương->Âm)
function convertLunarToSolar(lunarDay, lunarMonth, lunarYear, isLeap) {
    if (typeof LICH_VAN_NIEN === "undefined") return null;
    let start = new Date(lunarYear - 1, 10, 1); // quét từ 1/11 năm dương trước, đủ bao trùm Tết
    for (let i = 0; i < 450; i++) {
        let d = new Date(start.getTime() + i * 86400000);
        let dd = d.getDate(), mm = d.getMonth() + 1, yy = d.getFullYear();
        let info = LICH_VAN_NIEN.getFullInfo(dd, mm, yy);
        if (info.lunarYear === lunarYear && info.lunarMonthNum === lunarMonth && info.lunarDayNum === lunarDay && !!info.isLeapMonth === !!isLeap) {
            return { day: dd, month: mm, year: yy };
        }
    }
    return null;
}
// Điền chung Can/Chi/Trung Khí + hiển thị Can Chi Năm/Tháng từ 1 ngày Dương lịch đã xác định (dùng cho cả 2 chiều)
function apDungCanChiTrungKhiTuDuong(dd, mm, yy) {
    if (typeof LICH_VAN_NIEN === "undefined") return;
    let info = LICH_VAN_NIEN.getFullInfo(dd, mm, yy);
    let [can, chi] = info.canChiDay.split(" ");
    document.getElementById("canNgay").value = can;
    document.getElementById("chiNgay").value = chi;
    document.getElementById("trungKhi").value = layTrungKhiTuSunLongitude(info.solarTerm.sunLongitude);
    let elNam = document.getElementById("canChiNamDisplay"); if (elNam) elNam.textContent = "Năm: " + info.canChiYear;
    let elThang = document.getElementById("canChiThangDisplay"); if (elThang) elThang.textContent = "Tháng: " + info.canChiMonth;
    return info;
}
// Nhập Dương lịch (ngày/tháng/năm) -> tự tính ra Âm lịch + Can/Chi + Trung Khí
function dongBoTuDuong() {
    let dd = parseInt(document.getElementById("ngayDuongXem").value) || 1;
    let mm = parseInt(document.getElementById("thangDuongXem").value) || 1;
    let yy = parseInt(document.getElementById("namXem").value) || 2026;
    if (typeof LICH_VAN_NIEN === "undefined") return;
    let info = apDungCanChiTrungKhiTuDuong(dd, mm, yy);
    document.getElementById("ngayAmLichXem").value = info.lunarDayNum;
    document.getElementById("thangXemAm").value = info.lunarMonthNum;
    document.getElementById("namAmXem").value = info.lunarYear;
    document.getElementById("ngayAmNhuan").checked = !!info.isLeapMonth;
    if (typeof tinhToanPhiTinh === "function") tinhToanPhiTinh();
}
window.dongBoTuDuong = dongBoTuDuong;
// Nút "Hôm nay" — lấy ngày Dương lịch hiện tại của máy, đổ vào 3 ô rồi đồng bộ Âm lịch + tính lại Phi Tinh
function datNgayHomNayXem() {
    let now = new Date();
    document.getElementById("ngayDuongXem").value = now.getDate();
    document.getElementById("thangDuongXem").value = now.getMonth() + 1;
    document.getElementById("namXem").value = now.getFullYear();
    dongBoTuDuong();
}
window.datNgayHomNayXem = datNgayHomNayXem;
// Nhập Âm lịch (ngày/tháng/năm/nhuận) -> tự tìm ra Dương lịch + Can/Chi + Trung Khí
function dongBoTuAm() {
    let ngayAm = parseInt(document.getElementById("ngayAmLichXem").value) || 1;
    let thangAm = parseInt(document.getElementById("thangXemAm").value) || 1;
    let namAm = parseInt(document.getElementById("namAmXem").value) || 2026;
    let nhuan = document.getElementById("ngayAmNhuan").checked;
    let solar = convertLunarToSolar(ngayAm, thangAm, namAm, nhuan);
    if (!solar) {
        alert("⚠️ Không tìm thấy ngày Âm lịch " + ngayAm + "/" + thangAm + (nhuan ? " (nhuận)" : "") + " năm " + namAm + " — có thể tháng này không nhuận hoặc ngày không tồn tại. Kiểm tra lại.");
        return;
    }
    document.getElementById("ngayDuongXem").value = solar.day;
    document.getElementById("thangDuongXem").value = solar.month;
    document.getElementById("namXem").value = solar.year;
    apDungCanChiTrungKhiTuDuong(solar.day, solar.month, solar.year);
    if (typeof tinhToanPhiTinh === "function") tinhToanPhiTinh();
}
window.dongBoTuAm = dongBoTuAm;

// Đồng bộ 1 lần khi tải trang, dựa theo giá trị Âm lịch mặc định trong HTML (namAmXem/thangXemAm/ngayAmLichXem)
document.addEventListener("DOMContentLoaded", function() {
    if (typeof LICH_VAN_NIEN !== "undefined" && document.getElementById("ngayAmLichXem")) {
        dongBoTuAm();
    }
});

// ==== MỞ APP MẶC ĐỊNH TẢI NGÀY HIỆN TẠI (không dùng ngày cố định hardcode trong HTML nữa) ====
// Chạy SAU listener ở trên (thứ tự đăng ký DOMContentLoaded được giữ nguyên tuần tự) để giá trị
// ngày hôm nay ghi đè lên kết quả đồng bộ từ giá trị mặc định cũ trong HTML.
document.addEventListener("DOMContentLoaded", function() {
    let elNgay = document.getElementById("ngayDuongXem"), elThang = document.getElementById("thangDuongXem"), elNam = document.getElementById("namXem");
    if (!elNgay || !elThang || !elNam) return;
    let homNay = new Date();
    elNgay.value = homNay.getDate();
    elThang.value = homNay.getMonth() + 1;
    elNam.value = homNay.getFullYear();
    if (typeof dongBoTuDuong === "function") dongBoTuDuong();
});

// ==== NĂM SINH ÂM LỊCH = CAN CHI (không phải một số năm khác — Dương và Âm dùng chung 1 số năm,
// chỉ lệch nhau ở NGÀY quanh dịp Tết). Với ô chỉ nhập Năm (không có ngày/tháng cụ thể), hiển thị
// Can Chi của năm đó là đủ và đúng bản chất — không quy đổi ra số năm khác.
function canChiNamSinh(namSinh) {
    if (typeof LICH_VAN_NIEN === "undefined" || !namSinh) return "";
    // Dùng công thức Can-Chi năm gốc (không phụ thuộc ngày/tháng cụ thể trong năm)
    let CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
    let CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
    return CAN[((namSinh + 6) % 10 + 10) % 10] + " " + CHI[((namSinh + 8) % 12 + 12) % 12];
}
window.canChiNamSinh = canChiNamSinh;
// Cập nhật ô hiển thị Can Chi (span, không phải input) ngay cạnh ô Năm sinh Dương lịch.
function capNhatCanChiNamSinh(idNamDuong, idHienThi) {
    let elD = document.getElementById(idNamDuong), elHt = document.getElementById(idHienThi);
    if (!elD || !elHt) return;
    let nam = parseInt(elD.value);
    elHt.textContent = nam ? canChiNamSinh(nam) : "—";
}
window.capNhatCanChiNamSinh = capNhatCanChiNamSinh;
// Cập nhật 1 lần khi tải trang cho các ô năm sinh đã có sẵn giá trị mặc định trong HTML
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("namSinhChu")) capNhatCanChiNamSinh("namSinhChu", "canChiNamSinhChu");
    if (document.getElementById("namSinhGiaChu")) capNhatCanChiNamSinh("namSinhGiaChu", "canChiNamSinhGiaChu");
});

// ==== ĐỒNG BỘ 2 CHIỀU NĂM NHẬP TRẠCH ↔ VẬN ====
// Nhập Năm nhập trạch -> tự tính ra Vận tương ứng.
function dongBoVanTuNam() {
    let elNam = document.getElementById("namNhapTrach"), elVan = document.getElementById("vanNhapTrach");
    if (!elNam || !elVan) return;
    let nam = parseInt(elNam.value);
    if (!nam) return;
    elVan.value = tinhVanTuNam(nam);
    if (typeof tinhToanPhiTinh === "function") tinhToanPhiTinh();
}
window.dongBoVanTuNam = dongBoVanTuNam;
// Chọn Vận -> tự điền Năm nhập trạch đại diện. Nếu năm hiện tại đang nhập đã thuộc đúng Vận vừa chọn thì giữ nguyên
// (không ghi đè năm cụ thể người dùng đã gõ), ngược lại điền năm đầu tiên của Vận đó gần với năm hiện tại nhất.
function dongBoNamTuVan() {
    let elNam = document.getElementById("namNhapTrach"), elVan = document.getElementById("vanNhapTrach");
    if (!elNam || !elVan) return;
    let van = parseInt(elVan.value);
    if (!van) return;
    let namHienTai = parseInt(elNam.value) || 2016;
    if (tinhVanTuNam(namHienTai) === van) { if (typeof tinhToanPhiTinh === "function") tinhToanPhiTinh(); return; }
    // Tìm năm đầu Vận gần nhất quanh namHienTai (mỗi Vận dài 20 năm, chu kỳ 180 năm)
    let ungVien = [];
    for (let k = -1; k <= 1; k++) {
        let mocGoc = 1864 + (van - 1) * 20 + k * 180;
        ungVien.push(mocGoc);
    }
    ungVien.sort((a, b) => Math.abs(a - namHienTai) - Math.abs(b - namHienTai));
    elNam.value = ungVien[0];
    if (typeof tinhToanPhiTinh === "function") tinhToanPhiTinh();
}
window.dongBoNamTuVan = dongBoNamTuVan;
// Đồng bộ 1 lần khi tải trang theo giá trị Năm nhập trạch mặc định trong HTML
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("namNhapTrach") && document.getElementById("vanNhapTrach")) dongBoVanTuNam();
});

// ==== LƯU / MỞ TOÀN BỘ TRẠNG THÁI (dùng bởi Hồ Sơ Nhà — ho-so.js) ====
function layStatePhiTinh() {
    function val(id) { let el = document.getElementById(id); return el ? el.value : ""; }
    function chk(id) { let el = document.getElementById(id); return el ? el.checked : false; }
    return {
        loai: "phi-tinh", phienBan: 1,
        namNhapTrach: val("namNhapTrach"),
        vanNhapTrach: val("vanNhapTrach"),
        huong24Son: val("huong24Son"),
        doSoTay: val("doSoTay"),
        congTacKiemHuong: chk("congTacKiemHuong"),
        ngayDuongXem: val("ngayDuongXem"),
        thangDuongXem: val("thangDuongXem"),
        namXem: val("namXem"),
        thangXemAm: val("thangXemAm"),
        ngayAmLichXem: val("ngayAmLichXem"),
        namAmXem: val("namAmXem"),
        ngayAmNhuan: chk("ngayAmNhuan"),
        canNgay: val("canNgay"),
        chiNgay: val("chiNgay"),
        trungKhi: val("trungKhi"),
        namSinhChu: val("namSinhChu"),
        gioiTinhChu: val("gioiTinhChu")
    };
}
window.layStatePhiTinh = layStatePhiTinh;

function apDungStatePhiTinh(obj) {
    if (!obj) return;
    function setVal(id, v) { let el = document.getElementById(id); if (el && v !== undefined && v !== "") el.value = v; }
    setVal("namNhapTrach", obj.namNhapTrach);
    setVal("vanNhapTrach", obj.vanNhapTrach);
    setVal("huong24Son", obj.huong24Son);
    setVal("doSoTay", obj.doSoTay);
    { let elKh = document.getElementById("congTacKiemHuong"); if (elKh) elKh.checked = !!obj.congTacKiemHuong; }
    setVal("ngayDuongXem", obj.ngayDuongXem);
    setVal("thangDuongXem", obj.thangDuongXem);
    setVal("namXem", obj.namXem);
    setVal("thangXemAm", obj.thangXemAm);
    setVal("ngayAmLichXem", obj.ngayAmLichXem);
    setVal("namAmXem", obj.namAmXem);
    let elNhuan = document.getElementById("ngayAmNhuan"); if (elNhuan) elNhuan.checked = !!obj.ngayAmNhuan;
    setVal("canNgay", obj.canNgay);
    setVal("chiNgay", obj.chiNgay);
    setVal("trungKhi", obj.trungKhi);
    setVal("namSinhChu", obj.namSinhChu);
    setVal("gioiTinhChu", obj.gioiTinhChu);
    if (document.getElementById("namSinhChu")) capNhatCanChiNamSinh("namSinhChu", "canChiNamSinhChu");
    if (document.getElementById("namNhapTrach") && document.getElementById("vanNhapTrach")) dongBoVanTuNam();
    // dongBoVanTuNam() ở trên ghi trực tiếp #vanNhapTrach.value mà không bắn "change", nên ô
    // "Vận nhập trạch" (#vanInput) ở tab Cửu Cung Lưới cần được đồng bộ lại thủ công tại đây.
    if (typeof window.dongBoVanInputTuVanNhapTrach === "function") window.dongBoVanInputTuVanNhapTrach();
    if (typeof apDungCanChiTrungKhiTuDuong === "function" && obj.ngayDuongXem && obj.thangDuongXem && obj.namXem) {
        apDungCanChiTrungKhiTuDuong(parseInt(obj.ngayDuongXem), parseInt(obj.thangDuongXem), parseInt(obj.namXem));
        setVal("canNgay", obj.canNgay); setVal("chiNgay", obj.chiNgay); setVal("trungKhi", obj.trungKhi); // ưu tiên giá trị đã lưu nếu người dùng từng sửa tay
    }
    if (typeof tinhToanPhiTinh === "function") tinhToanPhiTinh();
}
window.apDungStatePhiTinh = apDungStatePhiTinh;

// ==== EXPORT HÀM CHO MODULE KHÁC SỬ DỤNG =====
window.xacDinhChieuBayTheoNguyenLong = xacDinhChieuBayTheoNguyenLong;
window.lapTinhBan = lapTinhBan;
window.qCungGoc = qCungGoc;
window.xetHaDoTuTuong = xetHaDoTuTuong;