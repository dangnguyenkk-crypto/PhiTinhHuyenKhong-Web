// ====================================================================
// TÌM NHÀ — Tab: Bảng so sánh 24 Sơn Hướng
// 
// Mục đích: Tự động giả lập nhập 24 sơn vào tab Nội Khí,
// lấy ra 3 cung quan trọng nhất để so sánh:
//   - Mặt trước: cung của hướng nhà (hướng nhập)
//   - Trung cung: cung 5 (luôn cố định)
//   - Mặt hậu: cung của tọa sơn (đối diện + 180°)
//
// Logic tính toán tuân thủ phi-tinh.js:
//   1. Vận bàn: lapTinhBan(van, true)
//   2. Sơn tinh: lấy số nhập trung từ cung tọa sơn, bay theo Nguyên Long + Vận
//   3. Hướng tinh: lấy số nhập trung từ cung hướng nhà, bay theo Nguyên Long + Vận
// ====================================================================

// ==== TÁI SỬ DỤNG TỪ shared.js và phi-tinh.js ====
const TN_CUNG_TO_SO = window.CUNG_TO_SO || {"Khảm":1,"Khôn":2,"Chấn":3,"Tốn":4,"Trung":5,"Càn":6,"Đoài":7,"Cấn":8,"Ly":9};
// Bảng ngược (số -> tên cung) — dùng khi gọi window.xetLienChauTamBanToanCuc(...) cần soToCung để đặt
// tên cung cho từng phần tử trong chiTiet (hàm đó nhận dạng {1: "Tên cung", ...}, không phải tên->số).
const TN_SO_TO_CUNG = window.SO_TO_CUNG || {1:"Khảm",2:"Khôn",3:"Chấn",4:"Tốn",5:"Trung",6:"Càn",7:"Đoài",8:"Cấn",9:"Ly"};
const TN_HANH_CUA_SAO = window.HANH_CUA_SAO || {1:"Thủy",2:"Thổ",3:"Mộc",4:"Mộc",5:"Thổ",6:"Kim",7:"Kim",8:"Thổ",9:"Hỏa"};
const TN_HANH_CUA_CUNG = window.HANH_CUA_CUNG || {"Khảm":"Thủy","Khôn":"Thổ","Chấn":"Mộc","Tốn":"Mộc","Trung":"Thổ","Càn":"Kim","Đoài":"Kim","Cấn":"Thổ","Ly":"Hỏa"};
const TN_HANH_SINH = window.HANH_SINH || {"Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim","Kim":"Thủy","Thủy":"Mộc"};
const TN_HANH_KHAC = window.HANH_KHAC || {"Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim","Kim":"Mộc"};
const TN_DUONG_BAY = window.DUONG_BAY || [5,6,7,8,9,1,2,3,4];

// ==== LƯU NIÊN: THÁI TUẾ & TAM SÁT (theo Địa Chi của Năm) ====
const TN_CHI_ARR = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
function tnChiCuaNam(nam) { return TN_CHI_ARR[((nam + 8) % 12 + 12) % 12]; }
// Tam Sát: 3 sơn bị sát nằm ở phương ĐỐI XUNG với cục Tam Hợp của Chi năm đó.
// Thân-Tý-Thìn (Thủy cục) → sát tại Tị-Ngọ-Mùi (Nam) | Dần-Ngọ-Tuất (Hỏa cục) → sát tại Hợi-Tý-Sửu (Bắc)
// Tị-Dậu-Sửu (Kim cục) → sát tại Dần-Mão-Thìn (Đông) | Hợi-Mão-Mùi (Mộc cục) → sát tại Thân-Dậu-Tuất (Tây)
// Thứ tự trong mỗi mảng CỐ ĐỊNH theo Địa Lý Tam Hợp: [0]=Kiếp Sát (Tuyệt), [1]=Tai Sát (Thai), [2]=Tuế Sát (Dưỡng).
const TN_CHI_TO_TAMSAT = {
  "Thân":["Tị","Ngọ","Mùi"], "Tý":["Tị","Ngọ","Mùi"], "Thìn":["Tị","Ngọ","Mùi"],
  "Dần":["Hợi","Tý","Sửu"], "Ngọ":["Hợi","Tý","Sửu"], "Tuất":["Hợi","Tý","Sửu"],
  "Tị":["Dần","Mão","Thìn"], "Dậu":["Dần","Mão","Thìn"], "Sửu":["Dần","Mão","Thìn"],
  "Hợi":["Thân","Dậu","Tuất"], "Mão":["Thân","Dậu","Tuất"], "Mùi":["Thân","Dậu","Tuất"]
};
// Tam Sát là hung sát đứng thứ hai sau Ngũ Hoàng (Địa Lý Tam Hợp — Sát trong Tam Hợp Thái Tuế),
// chiếm đúng 3 phương Tuyệt/Thai/Dưỡng của vòng Trường Sinh mỗi năm.
const TN_TAM_SAT_LOAI = [
  { ten: "Kiếp Sát", giaiDoan: "Tuyệt", icon: "☠", moTa: "Cực kỳ hung bạo, chủ về tai nạn bất ngờ, cướp đoạt, mất mát tài sản." },
  { ten: "Tai Sát",  giaiDoan: "Thai",  icon: "☠", moTa: "Tấn công từ từ, chủ về bệnh tật, hao tổn thể chất, áp lực kéo dài." },
  { ten: "Tuế Sát",  giaiDoan: "Dưỡng", icon: "☠", moTa: "Đánh vào nền tảng, chủ về hao tán vì tiểu nhân, kiện tụng rườm rà." }
];
// Xác định Tọa sơn đang phạm đúng LOẠI Tam Sát nào (nếu có) — trả về null nếu không phạm.
function tnXacDinhLoaiTamSat(chiNam, tenSon) {
  let nhom = TN_CHI_TO_TAMSAT[chiNam];
  if (!nhom) return null;
  let idx = nhom.indexOf(tenSon);
  if (idx === -1) return null;
  return TN_TAM_SAT_LOAI[idx];
}

// ==== HÀM TIỆN ÍCH ====
function tnCuonVe1Den9(x) { return ((x-1)%9+9)%9+1; }

// ==== QUY ĐỔI NĂM → VẬN (Tam Nguyên Cửu Vận, mốc 1864, chu kỳ 20 năm/Vận) ====
// Vận 1: 1864-1883, Vận 2: 1884-1903, ... Vận 9: 2024-2043, rồi quay lại Vận 1: 2044...
// Công thức: mỗi 180 năm là 1 chu kỳ Tam Nguyên (9 vận × 20 năm), lặp lại vô hạn hai chiều.
function tnNamToVan(nam) {
  let offset = nam - 1864;
  let vanIdx = Math.floor(offset / 20) % 9; // 0..8 (có thể âm nếu năm < 1864)
  vanIdx = ((vanIdx % 9) + 9) % 9;          // đưa về 0..8 dương
  return vanIdx + 1;                        // Vận 1..9
}

function tnTrangThai(sao, van) {
  if (sao === van) return {loai:"vuong",nhan:"Vượng",color:"#d32f2f",tip:"Đương vượng — Đại cát, khí mạnh nhất"};
  let sinh1 = tnCuonVe1Den9(van+1), sinh2 = tnCuonVe1Den9(van+2);
  if (sao === sinh1 || sao === sinh2) return {loai:"sinh",nhan:"Sinh",color:"#ff9800",tip:"Sinh khí — Tiến khí, cát vừa"};
  let suy = tnCuonVe1Den9(van-1);
  if (sao === suy) return {loai:"suy",nhan:"Suy",color:"#888",tip:"Thoái khí — Khí suy, bình hòa"};
  return {loai:"tu",nhan:"Tử",color:"#555",tip:"Tử/Sát khí — Hung, khí yếu nhất"};
}

function tnQuanHe(hanhCung, sao) {
  if (typeof window.xetQuanHeNguHanh === 'function') {
    let r = window.xetQuanHeNguHanh(hanhCung, sao);
    return { loai: r.loai, diem: r.diem, giai: r.giai || r.dienGiai, nhan: r.nhan };
  }
  // Fallback (nếu chưa load luan-giai.js) — logic gốc giữ nguyên
  let hs = TN_HANH_CUA_SAO[sao];
  if (hanhCung===hs) return {loai:"binh",diem:0,giai:"Cùng hành ("+hs+")",nhan:"Bình"};
  if (TN_HANH_SINH[hs]===hanhCung) return {loai:"tot",diem:1,giai:hs+" sinh "+hanhCung,nhan:"Tốt"};
  if (TN_HANH_SINH[hanhCung]===hs) return {loai:"hao",diem:0,giai:hanhCung+" sinh "+hs,nhan:"Hao"};
  if (TN_HANH_KHAC[hs]===hanhCung) return {loai:"xau",diem:-1,giai:hs+" khắc "+hanhCung,nhan:"Xấu"};
  if (TN_HANH_KHAC[hanhCung]===hs) return {loai:"che",diem:0,giai:hanhCung+" khắc "+hs,nhan:"Bình"};
  return {loai:"binh",diem:0,giai:"Bình hòa",nhan:"Bình"};
}

function tnLapTinhBan(saoChu, laThuan) {
  if (typeof lapTinhBan === "function") return lapTinhBan(saoChu, laThuan);
  let tinhBan = new Array(10);
  for (let i=0;i<9;i++) {
    let sao = laThuan ? (saoChu+i-1)%9+1 : ((saoChu-i-1)%9+9)%9+1;
    tinhBan[TN_DUONG_BAY[i]] = sao;
  }
  return tinhBan;
}

// ==== LẤY HÀM XÁC ĐỊNH CHIỀU BAY TỪ PHI-TINH.JS (HOẶC TỰ ĐỊNH NGHĨA FALLBACK) ====
function tnXacDinhChieuBay(s, bVan) {
  // Ưu tiên dùng hàm từ phi-tinh.js (đã được export qua window) — phép thế quái, cần bVan (vận bàn thật)
  if (typeof window.xacDinhChieuBayTheoNguyenLong === 'function') {
    return window.xacDinhChieuBayTheoNguyenLong(s, bVan);
  }
  // Fallback: dùng Âm/Dương trực tiếp — chỉ để tương thích nếu chưa load được phi-tinh.js
  console.warn('Hàm xacDinhChieuBayTheoNguyenLong chưa được export, dùng fallback Âm/Dương.');
  return s.amDuong === "Duong";
}

// ==== XẾP HẠNG 5 MỨC theo Tổng = Tầng A + Tầng B ====
function tnXepHang(tong) {
  if (tong >= 3)  return {icon:"🟢", nhan:"Tốt",   color:"#1b5e20", bg:"#e8f5e9"};
  if (tong >= 1)  return {icon:"🟢", nhan:"Khá",   color:"#2e7d32", bg:"#f1f8e4"};
  if (tong === 0) return {icon:"🟡", nhan:"Trung bình", color:"#f57f17", bg:"#fffde7"};
  if (tong >= -2) return {icon:"🟠", nhan:"Cân nhắc",   color:"#e65100", bg:"#fff3e0"};
  return                 {icon:"🔴", nhan:"Nên tránh",  color:"#c62828", bg:"#ffebee"};
}

// Gộp nhãn cách cục Tầng B thành 1 chuỗi hiển thị
function tnCachCuoc(vuongSon, vuongHuong, thuongSon, haThuy) {
  if (vuongSon && vuongHuong) return "Vượng Sơn Vượng Hướng";
  if (thuongSon && haThuy) return "Thượng Sơn Hạ Thủy";
  let labels = [];
  if (vuongSon) labels.push("Vượng Sơn");
  if (thuongSon) labels.push("Thượng Sơn");
  if (vuongHuong) labels.push("Vượng Hướng");
  if (haThuy) labels.push("Hạ Thủy");
  return labels.join(" + ");
}

// ==== TÍNH TOÁN CHO 1 HƯỚNG NHÀ (24 sơn) — đúng tư duy đã thống nhất =====
// Trung cung (trái tim) · cung Hướng = hướng cửa chính (tài lộc, nhìn Hướng tinh)
// · cung Tọa = sau lưng nhà, đối diện hướng (nhân đinh, nhìn Sơn tinh) — ưu tiên nhân đinh hơn tài lộc.
//
// Tầng A (Quy tắc 1 — ngũ hành sao/cung gốc, tái dùng đúng logic qCungGoc của phi-tinh.js qua tnQuanHe):
//   Điểm gốc = 2×(S tại Tọa: Sinh nhập +1 / Khắc nhập −1 / còn lại 0) + 1×(H tại Hướng: tương tự)
// Tầng B (Vượng Sơn Vượng Hướng / Thượng Sơn Hạ Thủy):
//   +2 Vượng Sơn (S tại Tọa = đúng Vận) · +1 Vượng Hướng (H tại Hướng = đúng Vận)
//   −2 Thượng Sơn (S tại Hướng = đúng Vận, sai chỗ) · −1 Hạ Thủy (H tại Tọa = đúng Vận, sai chỗ)
// Tầng C (Hợp Thập — CỘNG ĐIỂM THẬT): mỗi cung trong 3 cung Trung/Tọa/Hướng có V+S=10 hoặc V+H=10 thì +1 (tối đa +3).
//         Hà Đồ Tứ Tượng (xetHaDoTuTuong) và Tam Ban Quái: vẫn chỉ ghi chú tham khảo, KHÔNG cộng điểm.
// V tại Trung cung luôn cố định = số Vận nên không đưa vào so sánh giữa các hướng.
// ==== TẦNG C bổ sung: HỢP THẬP (合十) & PHẢN NGÂM/PHỤC NGÂM (反吟/伏吟) — theo đúng Tử Bạch Quyết/Huyền Không Bí Chỉ ====
// Hợp Thập: Vận tinh + Sơn tinh = 10, hoặc Vận tinh + Hướng tinh = 10 tại 1 cung — thông khí, cứu cục (đặc biệt quan trọng ở Vận 1, 9 vì không có VSVH tự nhiên)
// Phục Ngâm (cung vị): Sơn/Hướng tinh tại 1 cung trùng đúng số Lạc Thư nguyên đán của chính cung đó
// Phản Ngâm (cung vị): Sơn/Hướng tinh tại 1 cung hợp thập (+10) với số Lạc Thư nguyên đán của chính cung đó
// Tam Ban Quái (三般卦, Cha-Mẹ Tam Ban Quái — KHÔNG phải "Tam Bát Quái") — ĐÂY LÀ CÁCH CỤC TOÀN CỤC, không phải xét riêng 1 cung.
// Điều kiện: TẤT CẢ 9 cung của bàn đều phải có Vận-Sơn-Hướng (3 sao) tại cung đó cùng thuộc 1 trong 3 nhóm 1-4-7/2-5-8/3-6-9
// (mỗi cung có thể thuộc nhóm khác nhau, nhưng cung nào cũng phải "đủ 3 sao cùng nhóm" thì mới tính). Rất hiếm gặp trong thực tế.
const TN_NHOM_TBQ = {1:"1-4-7",4:"1-4-7",7:"1-4-7", 2:"2-5-8",5:"2-5-8",8:"2-5-8", 3:"3-6-9",6:"3-6-9",9:"3-6-9"};
function tnXetTamBanQuaiMotCung(v, s, h) {
  if (TN_NHOM_TBQ[v] === TN_NHOM_TBQ[s] && TN_NHOM_TBQ[s] === TN_NHOM_TBQ[h]) return TN_NHOM_TBQ[v];
  return null;
}
// Xét toàn bộ 9 cung của bVan/bSon/bHuong — chỉ true khi CẢ 9 cung đều đạt điều kiện trên
function tnXetTamBanQuaiToanCuc(bVan, bSon, bHuong) {
  for (let i = 1; i <= 9; i++) {
    if (!tnXetTamBanQuaiMotCung(bVan[i], bSon[i], bHuong[i])) return false;
  }
  return true;
}

// ==================================================================
// THẤT TINH ĐẢ KIẾP (七星打劫) — bí pháp đặc biệt tốt, thông khí Tam Nguyên,
// phát phúc lâu dài qua hàng thế kỷ. Đồng bộ ĐÚNG công thức với phi-tinh.js
// (hàm xetThatTinhDaKiep bên tab Nội Khí) — không viết lại logic khác đi.
// Điều kiện:
//  1) Sao Vận nhập trạch (van) phải xuất hiện ở Sơn tinh HOẶC Hướng tinh
//     TẠI CUNG HƯỚNG của nhà (sf/hf) — không xét tại Tọa.
//  2) Vận tinh (bVan) tại 3 cung Càn-Ly-Chấn CÙNG một nhóm Tam Ban Quái
//     (1-4-7 / 2-5-8 / 3-6-9) → Đả Kiếp THẬT.
//  3) Hoặc Vận tinh tại 3 cung Tốn-Khảm-Đoài cùng nhóm → Đả Kiếp GIẢ (hiệu
//     quả phụ thuộc hình thế Loan Đầu tại cung Tốn — app chưa đo được nên
//     chỉ ghi chú tham khảo, KHÔNG ảnh hưởng đến điểm cộng ở Tìm Nhà).
// Trả về null nếu không đạt, hoặc { loai: "that"/"gia", nhom, saoVanKhop }.
// ==================================================================
function tnXetThatTinhDaKiep(van, sf, hf, bVan) {
  if (!bVan) return null;
  let saoVanKhop = [];
  if (sf === van) saoVanKhop.push("S");
  if (hf === van) saoVanKhop.push("H");
  if (saoVanKhop.length === 0) return null; // điều kiện 1 không đạt

  let soCan = TN_CUNG_TO_SO["Càn"], soLy = TN_CUNG_TO_SO["Ly"], soChan = TN_CUNG_TO_SO["Chấn"];
  let soTon = TN_CUNG_TO_SO["Tốn"], soKham = TN_CUNG_TO_SO["Khảm"], soDoai = TN_CUNG_TO_SO["Đoài"];

  let nhomThat = TN_NHOM_TBQ[bVan[soCan]];
  let laThat = nhomThat && nhomThat === TN_NHOM_TBQ[bVan[soLy]] && nhomThat === TN_NHOM_TBQ[bVan[soChan]];
  if (laThat) return { loai: "that", nhom: nhomThat, saoVanKhop: saoVanKhop.join(",") };

  let nhomGia = TN_NHOM_TBQ[bVan[soTon]];
  let laGia = nhomGia && nhomGia === TN_NHOM_TBQ[bVan[soKham]] && nhomGia === TN_NHOM_TBQ[bVan[soDoai]];
  if (laGia) return { loai: "gia", nhom: nhomGia, saoVanKhop: saoVanKhop.join(",") };

  return null;
}

function tnXetHopThapNgam(v, s, h, cung, soNhapTrungSon, laThuanSon, soNhapTrungHuong, laThuanHuong) {
  let soGoc = cung === "Trung" ? 5 : TN_CUNG_TO_SO[cung];
  // Dùng hàm chung window.xetPhanPhucNgamMotSao (luan-giai.js) — hàm nhận tham số TRỰC TIẾP
  // (soNhapTrung, laThuan của CHÍNH bàn Sơn/Hướng đang xét cho hướng nhà ứng viên này), KHÔNG
  // đọc window.phiTinhVSH — biến đó chỉ đúng ngữ cảnh tab Phi Tinh, còn ở đây (tab Tìm Nhà) mỗi
  // hướng ứng viên có bàn Sơn/Hướng RIÊNG, tính độc lập trong tnTinhDiem (24 lần, 1 lần/sơn).
  // Kết quả null nghĩa là "không có Phản/Phục Ngâm" (không đủ điều kiện 5 nhập trung) — KHÔNG
  // tự tính lại kiểu khác.
  let ngS = (typeof window.xetPhanPhucNgamMotSao === 'function') ? window.xetPhanPhucNgamMotSao(s, soGoc, soNhapTrungSon, laThuanSon) : null;
  let ngH = (typeof window.xetPhanPhucNgamMotSao === 'function') ? window.xetPhanPhucNgamMotSao(h, soGoc, soNhapTrungHuong, laThuanHuong) : null;
  let ht = typeof window.xetHopThap === 'function' ? window.xetHopThap(v, s, h) : { hopThapVS: v+s===10, hopThapVH: v+h===10 };
  return {
    hopThapVS: ht.hopThapVS,
    hopThapVH: ht.hopThapVH,
    phucNgamS: !!(ngS && ngS.loai === "phuc"),
    phanNgamS: !!(ngS && ngS.loai === "phan"),
    phucNgamH: !!(ngH && ngH.loai === "phuc"),
    phanNgamH: !!(ngH && ngH.loai === "phan")
  };
}

// ==== TỔ HỢP 1-6 (Nhất Bạch + Lục Bạch — lợi công danh, sự nghiệp) mở rộng ra cặp V-S / V-H tại cung Hướng ====
// Cặp S-H tại cung Hướng đã được xét riêng ở TN_TO_HOP_CO_DIEN/TN_TO_HOP_HIEN_DAI (mục 2 trong tnTaoLuanNgan,
// bao gồm cả 1-6 và 1-4 theo Huyền Không Bí Chỉ/Tử Bạch Quyết) — không lặp lại ở đây để tránh trùng.
// Ở đây chỉ bổ sung xét thêm 2 cặp còn thiếu: (V,S) và (V,H).
const TN_TO_HOP_VSH_HUONG = {
  "1-6": { ten: "Khôi Tinh — Lục Bạch (1-6)", icon: "🏆", moTa: "Lợi công danh, sự nghiệp, thăng tiến quan chức." }
};
function tnXetToHopDacBietMotCung(v, s, h) {
  let cap = [["V","S",v,s], ["V","H",v,h]]; // bỏ (S,H) — đã xét ở TN_TO_HOP_CO_DIEN/TN_TO_HOP_HIEN_DAI
  let ketQua = [];
  for (let [nhan1, nhan2, x, y] of cap) {
    let minMax = [Math.min(x,y), Math.max(x,y)].join("-");
    if (TN_TO_HOP_VSH_HUONG[minMax]) {
      ketQua.push({ cap: `${nhan1}-${nhan2}`, saoA: x, saoB: y, ...TN_TO_HOP_VSH_HUONG[minMax] });
    }
  }
  return ketQua; // mảng rỗng nếu không có tổ hợp nào
}

function tnTinhDiem(sonInfo, van, nam) {
  // sonInfo từ DS24_SON: {ten, goc, amDuong, cung, nguyenLong} — đây là HƯỚNG NHÀ (hướng cửa chính)
  nam = nam || new Date().getFullYear();

  // 1. Tọa sơn (đối diện + 180°) — sau lưng nhà
  let toaGoc = (sonInfo.goc + 180) % 360;
  let toaSon = (typeof timSonTheoGoc === "function") ? timSonTheoGoc(toaGoc) : tnTimSonTuGoc(toaGoc);

  // 2. Vận bàn, rồi lập Sơn bàn (nhập trung từ cung Tọa) và Hướng bàn (nhập trung từ cung Hướng) — đúng lapTinhBan
  let bVan = tnLapTinhBan(van, true);
  let soNhapTrungSon = bVan[TN_CUNG_TO_SO[toaSon.cung]];
  let soNhapTrungHuong = bVan[TN_CUNG_TO_SO[sonInfo.cung]];

  // ===== Chiều bay theo phép thế quái (dùng bVan — vận bàn thật, không dùng số vận trực tiếp) =====
  let laThuanSon = tnXacDinhChieuBay(toaSon, bVan);
  let laThuanHuong = tnXacDinhChieuBay(sonInfo, bVan);
  // ================================================================

  let bSon = tnLapTinhBan(soNhapTrungSon, laThuanSon);
  let bHuong = tnLapTinhBan(soNhapTrungHuong, laThuanHuong);

  let cungFrontSo = TN_CUNG_TO_SO[sonInfo.cung]; // cung Hướng
  let cungBackSo = TN_CUNG_TO_SO[toaSon.cung];   // cung Tọa
  let cungCenterSo = 5;                          // Trung cung

  let vf=bVan[cungFrontSo], sf=bSon[cungFrontSo], hf=bHuong[cungFrontSo];
  let vc=bVan[cungCenterSo], sc=bSon[cungCenterSo], hc=bHuong[cungCenterSo]; // vc luôn = van
  let vb=bVan[cungBackSo], sb=bSon[cungBackSo], hb=bHuong[cungBackSo];

  let hanhF = TN_HANH_CUA_CUNG[sonInfo.cung];
  let hanhB = TN_HANH_CUA_CUNG[toaSon.cung];

  // ===== TẦNG A =====
  let qsToa = tnQuanHe(hanhB, sb);     // S tại Tọa (nhân đinh) — hệ số 2
  let qhHuong = tnQuanHe(hanhF, hf);   // H tại Hướng (tài lộc) — hệ số 1
  let tangA = 2 * qsToa.diem + 1 * qhHuong.diem;

  // ===== TẦNG B ===== (dùng hàm chung window.xetVuongSuyCachCuc — cùng nguồn với phi-tinh.js)
  let vsCC = typeof window.xetVuongSuyCachCuc === 'function'
    ? window.xetVuongSuyCachCuc(sb, sf, hf, hb, van)
    : { // fallback nếu luan-giai.js chưa load kịp
        vuongSon: sb === van, thuongSon: sf === van, vuongHuong: hf === van, haThuy: hb === van,
        get cachCuoc() { return tnCachCuoc(this.vuongSon, this.vuongHuong, this.thuongSon, this.haThuy); }
      };
  let vuongSon = vsCC.vuongSon, thuongSon = vsCC.thuongSon, vuongHuong = vsCC.vuongHuong, haThuy = vsCC.haThuy;
  // Tầng B: 4 yếu tố cân xứng, mỗi yếu tố ±1 điểm (Vượng Sơn +1, Vượng Hướng +1, Thượng Sơn -1, Hạ Thủy -1).
  // VSVH tối đa +2 (cả 2 yếu tố cùng đạt), TSHT tối thiểu -2 (cả 2 yếu tố cùng phạm) — không còn lệch trọng số 2:1 như trước.
  let tangB = (vuongSon ? 1 : 0) + (vuongHuong ? 1 : 0) - (thuongSon ? 1 : 0) - (haThuy ? 1 : 0);

  // ===== ĐỊNH CHÂN KHÍ TIÊN THIÊN (Hà Đồ) — dùng hàm chung window.xetChanKhiHaDo (luan-giai.js),
  // giống hệt cách tab Nội Khí đã làm. Thông tin THAM KHẢO (không cộng/trừ điểm vào Tổng, đồng bộ
  // cách xử lý ở Nội Khí — Chân Khí Tiên Thiên hiện là 1 mục luận giải riêng, không phải điểm số).
  // So Ngũ hành Hà Đồ của Vận với Ngũ hành Hà Đồ của Hướng (số Lạc Thư cố định của cung Hướng,
  // KHÔNG dùng Hướng tinh bay theo Vận, để giữ đúng tính chất Tiên Thiên/bất biến).
  let chanKhi = typeof window.xetChanKhiHaDo === 'function' ? window.xetChanKhiHaDo(van, TN_CUNG_TO_SO[sonInfo.cung]) : null;
  // Cộng/trừ điểm tương ứng: Đắc Chân Khí +1, Thất Chân Khí -1, Tiết Khí/Bình hòa không cộng trừ
  // (chỉ ở mức "bình thường", không đủ tốt để +1 cũng không đủ xấu để -1).
  let tangCK = chanKhi ? (chanKhi.loai === "dac" ? 1 : chanKhi.loai === "that" ? -1 : 0) : 0;

  // ===== TẦNG D (LƯU NIÊN — TRỪ ĐIỂM THẬT): Thái Tuế + Tam Sát + Phản/Phục Ngâm =====
  // LƯU Ý QUAN TRỌNG: Tam Sát và Thái Tuế kỵ NGƯỢC CHIỀU nhau, không đối xứng Tọa/Hướng như nhau:
  //  - Tam Sát: chỉ kỵ TỌA (động thổ/tu sửa đúng chỗ lưng nhà tựa vào phương Tam Sát là đại kỵ).
  //             Tam Sát tại Hướng không kỵ, không trừ điểm.
  //  - Thái Tuế: chỉ kỵ HƯỚNG (nhà quay mặt đối đầu trực diện với phương Thái Tuế mới là hung).
  //              Thái Tuế tại Tọa lại là cách tựa lưng vào thế, có chỗ dựa vững — KHÔNG trừ điểm.
  let chiNam = tnChiCuaNam(nam);
  let toaThaiTue = toaSon.ten === chiNam; // Tọa vào Thái Tuế = tựa núi, có thế vững — GHI CHÚ TÍCH CỰC, không trừ điểm
  let xungThaiTue = sonInfo.ten === chiNam; // Hướng nhà trùng đúng phương Thái Tuế — đối đầu trực diện, đại kỵ
  let phuongTamSat = TN_CHI_TO_TAMSAT[chiNam] || [];
  let loaiTamSat = tnXacDinhLoaiTamSat(chiNam, toaSon.ten); // {ten, giaiDoan, moTa} hoặc null
  let toaSat = !!loaiTamSat; // Tọa sơn rơi vào phương Tam Sát — đại kỵ động thổ/tu sửa
  // (Tam Sát chỉ kỵ Tọa, không xét Hướng — đã bỏ huongSat)

  let ngamFront  = tnXetHopThapNgam(vf, sf, hf, sonInfo.cung, soNhapTrungSon, laThuanSon, soNhapTrungHuong, laThuanHuong);
  let ngamCenter = tnXetHopThapNgam(vc, sc, hc, "Trung", soNhapTrungSon, laThuanSon, soNhapTrungHuong, laThuanHuong);
  let ngamBack   = tnXetHopThapNgam(vb, sb, hb, toaSon.cung, soNhapTrungSon, laThuanSon, soNhapTrungHuong, laThuanHuong);
  function demLoiNgam(ng) { return (ng.phucNgamS?1:0)+(ng.phucNgamH?1:0)+(ng.phanNgamS?1:0)+(ng.phanNgamH?1:0); }
  let soLoiNgam = demLoiNgam(ngamFront) + demLoiNgam(ngamCenter) + demLoiNgam(ngamBack); // mỗi lỗi -1, tính cả 3 cung

  // Ngũ Hoàng TRẠCH TINH (cố định vĩnh viễn theo cách cục, KHÁC Ngũ Hoàng LƯU NIÊN đổi theo năm):
  // là "gốc rễ bệnh của nhà" — ưu tiên xác định trước tiên, xử lý triệt để bằng vật phẩm hành Kim đặt lâu dài.
  // Quét đúng 3 cung trọng yếu đang xét (Trung/Tọa/Hướng): Sơn tinh hoặc Hướng tinh = 5 ở cung nào thì ghi nhận
  // (viTriNguHoang liệt kê ĐỦ cả 3 cung để hiển thị thông tin/badge cho người dùng biết).
  let viTriNguHoang = [];
  if (sf === 5) viTriNguHoang.push({ loai: "Sơn tinh", ten: `Hướng (${sonInfo.cung})` });
  if (sc === 5) viTriNguHoang.push({ loai: "Sơn tinh", ten: "Trung cung" });
  if (sb === 5) viTriNguHoang.push({ loai: "Sơn tinh", ten: `Tọa (${toaSon.cung})` });
  if (hf === 5) viTriNguHoang.push({ loai: "Hướng tinh", ten: `Hướng (${sonInfo.cung})` });
  if (hc === 5) viTriNguHoang.push({ loai: "Hướng tinh", ten: "Trung cung" });
  if (hb === 5) viTriNguHoang.push({ loai: "Hướng tinh", ten: `Tọa (${toaSon.cung})` });
  let coNguHoangTrachTinh = viTriNguHoang.length > 0;
  // TRỪ ĐIỂM: chỉ tính khi Ngũ Hoàng rơi đúng Tọa hoặc Hướng — số 5 tại Trung cung vốn là vị trí gốc
  // tự nhiên của mọi bàn Lạc Thư (trung cung luôn mang số 5 ở bàn gốc trước khi phi tinh theo Vận),
  // không phải hiện tượng "bay lạc" ra ngoài như khi nó rơi vào Tọa/Hướng, nên KHÔNG trừ điểm dù vẫn
  // hiển thị đầy đủ trong viTriNguHoang/badge ☠☠ để người dùng biết.
  let coNguHoangTruDiem = (sf === 5) || (sb === 5) || (hf === 5) || (hb === 5);

  // Lưu niên có 4 LOẠI độc lập: Ngũ Hoàng Trạch Tinh / Thái Tuế (chỉ xét Hướng) / Tam Sát (chỉ xét Tọa) / Phản-Phục Ngâm.
  // Mỗi loại tự chặn tối đa -1 — nếu dính đủ cả 4 loại thì trừ tối đa -4.
  let diemNguHoang = coNguHoangTruDiem ? -1 : 0;
  let diemThaiTue = Math.max(xungThaiTue ? -1 : 0, -1);
  let diemTamSat  = Math.max(toaSat ? -1 : 0, -1);
  let diemNgam    = Math.max(soLoiNgam * -1, -1);
  let tangDGoc = (xungThaiTue?-1:0) + (toaSat?-1:0) + soLoiNgam*(-1) + (coNguHoangTruDiem?-1:0);
  let tangD = diemNguHoang + diemThaiTue + diemTamSat + diemNgam;

  // ===== TẦNG C (CỘNG ĐIỂM THẬT): Hợp Thập — xét 3 cung Trung/Tọa/Hướng, mỗi cung có ít nhất
  // 1 tổ hợp Hợp Thập (V+S=10 hoặc V+H=10) thì +1, tối đa +3 =====
  function coHopThapTaiCung(ng) { return ng.hopThapVS || ng.hopThapVH; }
  let soCungHopThap = [ngamFront, ngamCenter, ngamBack].filter(coHopThapTaiCung).length;

  // ===== TẦNG C (chỉ ghi chú tham khảo, KHÔNG cộng/trừ điểm): Hà Đồ Tứ Tượng + Tam Ban Quái =====
  // (Hợp Thập đã tách ra cộng điểm thật ở trên — soCungHopThap)
  let coHaDo = typeof xetHaDoTuTuong === "function";
  let haDoFront  = coHaDo ? xetHaDoTuTuong(sf, hf, van) : null;
  let haDoCenter = coHaDo ? xetHaDoTuTuong(sc, hc, van) : null;
  let haDoBack   = coHaDo ? xetHaDoTuTuong(sb, hb, van) : null;

  let tamBanQuai = tnXetTamBanQuaiToanCuc(bVan, bSon, bHuong); // cách cục TOÀN CỤC — không gắn riêng vào 1 cung

  // ===== THẤT TINH ĐẢ KIẾP (七星打劫) — CỘNG ĐIỂM THẬT: Đả Kiếp thật +3, Đả Kiếp giả +2 =====
  let thatTinhDaKiep = tnXetThatTinhDaKiep(van, sf, hf, bVan);
  let tangDaKiep = thatTinhDaKiep ? (thatTinhDaKiep.loai === "that" ? 3 : 2) : 0;

  // ===== LIÊN CHÂU TAM BAN (連珠三般) — dùng lại xetLienChauTamBanMotCung/ToanCuc từ luan-giai.js,
  // KHÔNG viết lại logic. Hai mức độ:
  //  - Đủ TRỌN 9/9 cung Liên Châu -> đại cách, CỘNG ĐIỂM THẬT +1 (gộp vào tầng C, giống Hợp Thập).
  //  - Chỉ 3 cung trọng yếu Trung/Tọa/Hướng TỰ đạt Liên Châu riêng lẻ (không cần đủ 9 cung) -> CHỈ
  //    THÔNG BÁO tham khảo, KHÔNG cộng điểm (giống cách Tam Ban Quái/Hà Đồ Tứ Tượng đang xử lý ở trên).
  let lienChauToanCuc = typeof window.xetLienChauTamBanToanCuc === 'function'
    ? window.xetLienChauTamBanToanCuc(bVan, bSon, bHuong, van, TN_SO_TO_CUNG) : null;
  let lienChauDu9Cung = !!(lienChauToanCuc && lienChauToanCuc.duTron9Cung);
  let tangLienChau = lienChauDu9Cung ? 1 : 0;
  let lienChauTrungToaHuong = typeof window.xetLienChauTamBanMotCung === 'function' ? {
    center: window.xetLienChauTamBanMotCung(vc, sc, hc, van),
    back:   window.xetLienChauTamBanMotCung(vb, sb, hb, van),
    front:  window.xetLienChauTamBanMotCung(vf, sf, hf, van)
  } : { center: null, back: null, front: null };
  let coLienChauTrungToaHuong = !!(lienChauTrungToaHuong.center || lienChauTrungToaHuong.back || lienChauTrungToaHuong.front);

  let tangC = soCungHopThap * 1 + tangLienChau + tangDaKiep;
  let tong = tangA + tangB + tangC + tangD + tangCK;
  let xepHang = tnXepHang(tong);
  let cachCuoc = vsCC.cachCuoc;

  // Tổ hợp 1-6 mở rộng (V-S, V-H) tại cung HƯỚNG — bổ sung cho cặp S-H đã có sẵn trong TN_TO_HOP_CO_DIEN
  let toHopDacBietHuong = tnXetToHopDacBietMotCung(vf, sf, hf);

  return {
    front:  {cung: sonInfo.cung, v: vf, s: sf, h: hf, haDo: haDoFront, ngam: ngamFront},
    center: {cung: "Trung",      v: vc, s: sc, h: hc, haDo: haDoCenter, ngam: ngamCenter},
    back:   {cung: toaSon.cung,  v: vb, s: sb, h: hb, haDo: haDoBack, ngam: ngamBack},
    qsToa, qhHuong,
    vuongSon, thuongSon, vuongHuong, haThuy, cachCuoc, tamBanQuai, chanKhi,
    lienChauToanCuc, lienChauDu9Cung, tangLienChau, lienChauTrungToaHuong, coLienChauTrungToaHuong,
    thatTinhDaKiep, tangDaKiep,
    chiNam, toaThaiTue, xungThaiTue, toaSat, loaiTamSat, phuongTamSat, soLoiNgam, coNguHoangTrachTinh, viTriNguHoang,
    tangA, tangB, tangC, tangD, tangCK, tangDGoc, soCungHopThap, tong, xepHang,
    toHopDacBietHuong,
    toaSon: toaSon,
    huongSon: sonInfo
  };
}

// Dự phòng nếu không có timSonTheoGoc — đã cập nhật nguyenLong
function tnTimSonTuGoc(goc) {
  if (typeof DS24_SON !== "undefined") {
    let g = ((goc % 360) + 360) % 360;
    for (let s of DS24_SON) {
      let min = (s.goc - 7.5 + 360) % 360, max = (s.goc + 7.5) % 360;
      if (min < max) { if (g >= min && g < max) return s; }
      else { if (g >= min || g < max) return s; }
    }
    return DS24_SON[0];
  }
  // Fallback (đã bổ sung nguyenLong)
  let d = ((goc%360)+360)%360;
  let ds = TN_SON_24_FALLBACK;
  let best = ds[0], minDiff = 999;
  for (let s of ds) {
    let diff = Math.abs(d-s.goc);
    if (diff > 180) diff = 360 - diff;
    if (diff < minDiff) { minDiff = diff; best = s; }
  }
  return best;
}

// Dữ liệu dự phòng (đúng theo shared.js, đã thêm nguyenLong)
const TN_SON_24_FALLBACK = [
  {ten:"Nhâm",goc:345,amDuong:"Duong",cung:"Khảm",nguyenLong:"Dia"},
  {ten:"Tý",goc:0,amDuong:"Am",cung:"Khảm",nguyenLong:"Thien"},
  {ten:"Quý",goc:15,amDuong:"Am",cung:"Khảm",nguyenLong:"Nhan"},
  {ten:"Sửu",goc:30,amDuong:"Am",cung:"Cấn",nguyenLong:"Dia"},
  {ten:"Cấn",goc:45,amDuong:"Duong",cung:"Cấn",nguyenLong:"Thien"},
  {ten:"Dần",goc:60,amDuong:"Duong",cung:"Cấn",nguyenLong:"Nhan"},
  {ten:"Giáp",goc:75,amDuong:"Duong",cung:"Chấn",nguyenLong:"Dia"},
  {ten:"Mão",goc:90,amDuong:"Am",cung:"Chấn",nguyenLong:"Thien"},
  {ten:"Ất",goc:105,amDuong:"Am",cung:"Chấn",nguyenLong:"Nhan"},
  {ten:"Thìn",goc:120,amDuong:"Am",cung:"Tốn",nguyenLong:"Dia"},
  {ten:"Tốn",goc:135,amDuong:"Duong",cung:"Tốn",nguyenLong:"Thien"},
  {ten:"Tị",goc:150,amDuong:"Duong",cung:"Tốn",nguyenLong:"Nhan"},
  {ten:"Bính",goc:165,amDuong:"Duong",cung:"Ly",nguyenLong:"Dia"},
  {ten:"Ngọ",goc:180,amDuong:"Am",cung:"Ly",nguyenLong:"Thien"},
  {ten:"Đinh",goc:195,amDuong:"Am",cung:"Ly",nguyenLong:"Nhan"},
  {ten:"Mùi",goc:210,amDuong:"Am",cung:"Khôn",nguyenLong:"Dia"},
  {ten:"Khôn",goc:225,amDuong:"Duong",cung:"Khôn",nguyenLong:"Thien"},
  {ten:"Thân",goc:240,amDuong:"Duong",cung:"Khôn",nguyenLong:"Nhan"},
  {ten:"Canh",goc:255,amDuong:"Duong",cung:"Đoài",nguyenLong:"Dia"},
  {ten:"Dậu",goc:270,amDuong:"Am",cung:"Đoài",nguyenLong:"Thien"},
  {ten:"Tân",goc:285,amDuong:"Am",cung:"Đoài",nguyenLong:"Nhan"},
  {ten:"Tuất",goc:300,amDuong:"Am",cung:"Càn",nguyenLong:"Dia"},
  {ten:"Càn",goc:315,amDuong:"Duong",cung:"Càn",nguyenLong:"Thien"},
  {ten:"Hợi",goc:330,amDuong:"Duong",cung:"Càn",nguyenLong:"Nhan"}
];

// ==== TẠO HTML ====
// Tìm hướng hiện đại (8 hướng) từ góc
function tnTimHuongHienDai(goc) {
  if (typeof DS8_HUONG !== "undefined") {
    let g = ((goc % 360) + 360) % 360;
    let best = DS8_HUONG[0], minDiff = 999;
    for (let h of DS8_HUONG) {
      let diff = Math.abs(g - h.goc);
      if (diff > 180) diff = 360 - diff;
      if (diff < minDiff) { minDiff = diff; best = h; }
    }
    return best.ten;
  }
  // Fallback
  const huongs = [
    {goc:0,ten:"Bắc"},{goc:45,ten:"Đông Bắc"},{goc:90,ten:"Đông"},{goc:135,ten:"Đông Nam"},
    {goc:180,ten:"Nam"},{goc:225,ten:"Tây Nam"},{goc:270,ten:"Tây"},{goc:315,ten:"Tây Bắc"}
  ];
  let g = ((goc % 360) + 360) % 360;
  let best = huongs[0], minDiff = 999;
  for (let h of huongs) {
    let diff = Math.abs(g - h.goc);
    if (diff > 180) diff = 360 - diff;
    if (diff < minDiff) { minDiff = diff; best = h; }
  }
  return best.ten;
}

// Tính khoảng độ (±7.5° từ góc chính giữa)
function tnTinhKhoangDo(goc) {
  let min = ((goc - 7.5) % 360 + 360) % 360;
  let max = ((goc + 7.5) % 360 + 360) % 360;
  let minStr = min.toFixed(1).replace('.0', '');
  let maxStr = max.toFixed(1).replace('.0', '');
  return minStr + "°-" + maxStr + "°";
}

// ==== TỔ HỢP ĐẶC BIỆT — chỉ ghi chú, không cộng điểm ====
// Nhóm CỔ ĐIỂN: nguyên văn Tử Bạch Quyết (紫白訣) / Huyền Không Bí Chỉ (玄空秘旨)
const TN_TO_HOP_CO_DIEN = {
  "1-6":{ten:"Văn Xương", giai:"Lợi học hành, thi cử, thăng quan", nguon:"Huyền Không Bí Chỉ"},
  "6-1":{ten:"Văn Xương", giai:"Lợi sự nghiệp, thăng tiến công danh", nguon:"Huyền Không Bí Chỉ"},
  "1-4":{ten:"Văn Xương", giai:"Tốt văn học, nghệ thuật, tình duyên", nguon:"Huyền Không Bí Chỉ"},
  "4-1":{ten:"Văn Xương", giai:"Tốt văn học, nghệ thuật, tình duyên — \"tứ nhất đồng cung, chuẩn phát khoa danh\"", nguon:"Tử Bạch Quyết"},
  "2-5":{ten:"Nhị Ngũ giao gia", giai:"Đại hung, dễ sinh bệnh tật, tử vong — \"nhị ngũ giao gia, lỵ tử vong tịnh sinh tật bệnh\"", nguon:"Tử Bạch Quyết"},
  "5-2":{ten:"Nhị Ngũ giao gia", giai:"Đại hung, dễ sinh bệnh tật, tử vong", nguon:"Tử Bạch Quyết"},
  "7-9":{ten:"Hỏa trạch hỏa (Cửu Thất hợp triệt)", giai:"Đề phòng hỏa hoạn — \"cửu thất hợp triệt, thường tao hồi lộc chi tai\"", nguon:"Tử Bạch Quyết"},
  "9-7":{ten:"Hỏa trạch hỏa (Cửu Thất hợp triệt)", giai:"Đề phòng hỏa hoạn", nguon:"Tử Bạch Quyết"},
  "3-7":{ten:"Đấu Ngưu Sát (Tam Thất điệp chí)", giai:"Dễ trộm cướp, kiện tụng quan phi — \"tam thất điệp chí, bị kiếp đạo cánh kiến quan tai\"", nguon:"Tử Bạch Quyết"},
  "7-3":{ten:"Đấu Ngưu Sát (Tam Thất điệp chí)", giai:"Dễ trộm cướp, kiện tụng quan phi", nguon:"Tử Bạch Quyết"}
};
// Nhóm HIỆN ĐẠI: không thấy trong 2 quyển gốc — diễn giải của người đời sau theo bối cảnh Vận hiện tại, dùng tham khảo thêm
const TN_TO_HOP_HIEN_DAI = {
  "8-9":{ten:"Tài lộc lên", giai:"8 (vượng vừa qua) gặp 9 (vượng sắp tới) — nhiều thầy hiện đại cho là hợp thời vận Vận 9, đại lợi tài. Diễn giải sau này, không thấy trong Tử Bạch Quyết/Huyền Không Bí Chỉ."},
  "9-8":{ten:"Tài lộc lên", giai:"8 (vượng vừa qua) gặp 9 (vượng sắp tới) — nhiều thầy hiện đại cho là hợp thời vận Vận 9, đại lợi tài. Diễn giải sau này, không thấy trong Tử Bạch Quyết/Huyền Không Bí Chỉ."}
};
const TN_TO_HOP_DAC_BIET = {...TN_TO_HOP_CO_DIEN, ...TN_TO_HOP_HIEN_DAI};

// ==== LUẬN NGẮN — đúng theo 3 tầng đã thống nhất, không suy diễn thêm khái niệm chưa có nguồn ====
function tnTaoLuanNgan(kq, van) {
  let luan = [];

  // -1. CHÂN KHÍ TIÊN THIÊN (Hà Đồ) — nền tảng Thiên thời/Địa lợi, xét TRƯỚC cả Phi Tinh Hậu Thiên
  // (kể cả Ngũ Hoàng Trạch Tinh bên dưới) — thông tin tham khảo, không cộng/trừ điểm.
  if (kq.chanKhi) {
    let mauCK = kq.chanKhi.loai === "dac" ? "#2e7d32" : kq.chanKhi.loai === "tiet" ? "#e65100" : kq.chanKhi.loai === "that" ? "#c62828" : "#888";
    let iconCK = kq.chanKhi.loai === "dac" ? "🌟" : kq.chanKhi.loai === "tiet" ? "⚠️" : kq.chanKhi.loai === "that" ? "☠️" : "◽";
    luan.push(`<span style="color:${mauCK};font-weight:bold;font-size:9px;">${iconCK} Chân Khí Tiên Thiên: ${kq.chanKhi.nhan} (Vận Hà Đồ ${kq.chanKhi.hanhVan} — Hướng Hà Đồ ${kq.chanKhi.hanhHuong})${kq.tangCK !== 0 ? `, ${kq.tangCK>0?'+':''}${kq.tangCK}` : ''}</span>`);
  }

  // 0. TẦNG D — Ngũ Hoàng Trạch Tinh, Thái Tuế & Tam Sát (TRỪ ĐIỂM THẬT) — luôn đặt đầu, hung sát nặng nhất
  // Ngũ Hoàng Trạch Tinh (cố định vĩnh viễn, "gốc rễ bệnh của nhà") ưu tiên trên cả Thái Tuế/Tam Sát (lưu niên, đổi theo năm)
  // CHỈ trừ điểm khi rơi đúng Tọa hoặc Hướng — tại Trung cung không trừ (xem giải thích ở nơi tính coNguHoangTruDiem),
  // nhưng vẫn hiển thị đầy đủ vị trí (kể cả Trung cung) để người dùng biết.
  if (kq.coNguHoangTrachTinh) {
    let via = kq.viTriNguHoang.map(v => `${v.loai} tại ${v.ten}`).join(", ");
    let coTruDiem = kq.viTriNguHoang.some(v => v.ten !== "Trung cung");
    luan.push(`<span style="color:#4a148c;font-weight:bold;font-size:9px;">☠☠ Ngũ Hoàng Trạch Tinh (${via}) — gốc rễ bệnh của nhà, cần Kim khí trấn lâu dài${coTruDiem ? ', −1' : ''}</span>`);
  }
  if (kq.toaSat) luan.push(`<span style="color:#b71c1c;font-weight:bold;font-size:9px;">☠ Tọa ${kq.loaiTamSat.ten} (Tam Sát, Chi ${kq.chiNam}) — đại kỵ động thổ tại Tọa, −1</span>`);
  if (kq.xungThaiTue) luan.push(`<span style="color:#c62828;font-weight:bold;font-size:9px;">⚠ Hướng phạm Thái Tuế (${kq.chiNam}) — đối đầu trực diện, −1</span>`);
  if (kq.toaThaiTue) luan.push(`<span style="color:#2e7d32;font-weight:bold;font-size:9px;">🛡️ Tọa Thái Tuế (${kq.chiNam}) — tựa núi, có thế vững</span>`);

  // 1. Cách cục Tầng B (Vượng Sơn Vượng Hướng / Thượng Sơn Hạ Thủy) — mỗi nhãn tự tô màu riêng
  // theo đúng dấu điểm của chính nó (xanh = +1, đỏ = -1), KHÔNG gộp chung 1 màu cho cả cụm — tránh
  // hiểu nhầm khi 1 hướng vừa có yếu tố tốt (VD Vượng Sơn) vừa có yếu tố xấu (VD Hạ Thủy) cùng lúc.
  let nhanCachCuoc = [];
  if (kq.vuongSon) nhanCachCuoc.push(`<span style="color:#2e7d32;font-weight:bold;">Vượng Sơn</span>`);
  if (kq.thuongSon) nhanCachCuoc.push(`<span style="color:#c62828;font-weight:bold;">Thượng Sơn</span>`);
  if (kq.vuongHuong) nhanCachCuoc.push(`<span style="color:#2e7d32;font-weight:bold;">Vượng Hướng</span>`);
  if (kq.haThuy) nhanCachCuoc.push(`<span style="color:#c62828;font-weight:bold;">Hạ Thủy</span>`);
  if (nhanCachCuoc.length) luan.push(nhanCachCuoc.join(' <span style="color:#888;font-weight:normal;">+</span> '));
  if (kq.thuongSon) luan.push(`<span style="color:#c62828;font-size:9px;">⚠ Sơn lạc Hướng: hại nhân đinh</span>`);
  if (kq.haThuy) luan.push(`<span style="color:#c62828;font-size:9px;">⚠ Hướng lạc Tọa: hại tài lộc</span>`);

  // 2. Tổ hợp đặc biệt — xét trên cặp S-H tại cung Hướng (cổ điển: Tử Bạch Quyết/Huyền Không Bí Chỉ | hiện đại: diễn giải đời sau)
  let capSH = kq.front.s + "-" + kq.front.h;
  if (TN_TO_HOP_CO_DIEN[capSH]) {
    luan.push(`<span style="color:#1565c0;font-weight:600;">🎯 ${TN_TO_HOP_CO_DIEN[capSH].ten}</span>`);
  } else if (TN_TO_HOP_HIEN_DAI[capSH]) {
    luan.push(`<span style="color:#7b1fa2;font-weight:600;">🎯 ${TN_TO_HOP_HIEN_DAI[capSH].ten} <i style="font-weight:400;">(diễn giải hiện đại)</i></span>`);
  }

  // 3. Hà Đồ Tứ Tượng tại cung Hướng (Tầng C, tham khảo — không cộng/trừ điểm)
  if (kq.front.haDo) {
    let hd = kq.front.haDo;
    if (hd.dacVan) luan.push(`<span style="color:#2e7d32;">🌊 ${hd.tenCap} đắc vận</span>`);
    else luan.push(`<span style="color:#e65100;">🌊 ${hd.tenCap} thất vận</span>`);
  }

  // 3b. Hợp Thập (Tầng C, CỘNG ĐIỂM THẬT +1/cung) / Phản-Phục Ngâm (Tầng D, TRỪ ĐIỂM THẬT)
  if (kq.soCungHopThap > 0) luan.push(`<span style="color:#00695c;font-weight:bold;font-size:9px;">➕10 Hợp Thập × ${kq.soCungHopThap} cung (+${kq.soCungHopThap}) — thông khí</span>`);
  if (kq.soLoiNgam > 0) luan.push(`<span style="color:#8b0000;font-weight:bold;font-size:9px;">⚠ Phản/Phục Ngâm × ${kq.soLoiNgam} — loại Phản/Phục Ngâm, quy về −1</span>`);
  if (kq.tamBanQuai) luan.push(`<span style="color:#6a1b9a;font-weight:bold;font-size:9px;">🔺 Tam Ban Quái (toàn cục — quý cách hiếm gặp)</span>`);
  if (kq.lienChauDu9Cung) luan.push(`<span style="color:#004d40;font-weight:bold;font-size:9px;">🔗 Liên Châu Tam Ban đủ trọn 9/9 cung — đại cách, +${kq.tangLienChau}</span>`);
  else if (kq.coLienChauTrungToaHuong) luan.push(`<span style="color:#00695c;font-weight:600;font-size:9px;">🔗 Liên Châu Tam Ban tại ${[kq.lienChauTrungToaHuong.center&&'Trung',kq.lienChauTrungToaHuong.back&&'Tọa',kq.lienChauTrungToaHuong.front&&'Hướng'].filter(Boolean).join(', ')} (chưa đủ 9 cung)</span>`);
  if (kq.thatTinhDaKiep) {
    let loaiDK = kq.thatTinhDaKiep.loai === "that" ? "thật" : "giả";
    let mauDK = kq.thatTinhDaKiep.loai === "that" ? "#0d47a1" : "#4527a0";
    luan.push(`<span style="color:${mauDK};font-weight:bold;font-size:9px;">⚡ Thất Tinh Đả Kiếp (${loaiDK}) — thông khí Tam Nguyên, +${kq.tangDaKiep}</span>`);
  }
  if (kq.toHopDacBietHuong && kq.toHopDacBietHuong.length) {
    for (let th of kq.toHopDacBietHuong) {
      luan.push(`<span style="color:#795500;font-weight:600;font-size:9px;">${th.icon} ${th.ten} (${th.cap})</span>`);
    }
  }

  // 4. Hình thế Tọa-Hướng (ngũ hành của bản thân 2 cung, không phải sao — chỉ tham khảo hình thế)
  let hanhToa = TN_HANH_CUA_CUNG[kq.toaSon.cung];
  let hanhHuong = TN_HANH_CUA_CUNG[kq.huongSon.cung];
  if (TN_HANH_SINH[hanhToa] === hanhHuong) luan.push(`<span style="color:#2e7d32;font-size:9px;">Tọa sinh Hướng</span>`);
  else if (TN_HANH_SINH[hanhHuong] === hanhToa) luan.push(`<span style="color:#ff9800;font-size:9px;">Hướng sinh Tọa</span>`);
  else if (TN_HANH_KHAC[hanhToa] === hanhHuong) luan.push(`<span style="color:#c62828;font-size:9px;">Tọa khắc Hướng</span>`);
  else if (TN_HANH_KHAC[hanhHuong] === hanhToa) luan.push(`<span style="color:#888;font-size:9px;">Hướng khắc Tọa</span>`);

  // 5. (Xếp hạng tổng — đã chuyển sang cột đầu tiên "Sơn / Hướng / Điểm", không lặp lại ở cột Luận)

  return luan.join("<br>");
}

// Ô hiển thị 1 cung (Hướng / Trung / Tọa) trong bảng — vaiTro: 'huong' | 'trung' | 'toa'
function tnTaoO(c, vaiTro, kq) {
  let sBold = (vaiTro === 'toa'), hBold = (vaiTro === 'huong');
  let sColor = vaiTro==='toa' ? (kq.qsToa.diem>0?"#4CAF50":kq.qsToa.diem<0?"#F44336":"#888") : "#555";
  let hColor = vaiTro==='huong' ? (kq.qhHuong.diem>0?"#4CAF50":kq.qhHuong.diem<0?"#F44336":"#888") : "#555";

  let badges = [];
  if (vaiTro === 'toa') {
    if (kq.vuongSon) badges.push(`<span style="font-size:7px;color:#2e7d32;background:#e8f5e9;padding:0 3px;border-radius:2px;">Vượng Sơn</span>`);
    if (kq.haThuy) badges.push(`<span style="font-size:7px;color:#c62828;background:#ffebee;padding:0 3px;border-radius:2px;">Hạ Thủy</span>`);
  } else if (vaiTro === 'huong') {
    if (kq.vuongHuong) badges.push(`<span style="font-size:7px;color:#2e7d32;background:#e8f5e9;padding:0 3px;border-radius:2px;">Vượng Hướng</span>`);
    if (kq.thuongSon) badges.push(`<span style="font-size:7px;color:#c62828;background:#ffebee;padding:0 3px;border-radius:2px;">Thượng Sơn</span>`);
  } else {
    badges.push(`<span style="font-size:7px;color:#888;">(V=Vận)</span>`);
  }
  if (c.s === 5 || c.h === 5) {
    let via = c.s === 5 && c.h === 5 ? "S & H" : c.s === 5 ? "S" : "H";
    badges.push(`<span style="font-size:7px;color:#fff;background:#4a148c;font-weight:bold;padding:0 3px;border-radius:2px;" title="Ngũ Hoàng Trạch Tinh (${via}) — gốc rễ bệnh của nhà, cần Kim khí trấn lâu dài">☠☠ Ngũ Hoàng</span>`);
  }
  if (c.haDo) {
    badges.push(`<span style="font-size:7px;color:${c.haDo.dacVan?'#1565c0':'#e65100'};" title="${c.haDo.tenCap} — ${c.haDo.dacVan?'đắc vận':'thất vận'}">🌊${c.haDo.tenCap}</span>`);
  }
  if (c.ngam.hopThapVS || c.ngam.hopThapVH) {
    let via = c.ngam.hopThapVS && c.ngam.hopThapVH ? "V-S & V-H" : c.ngam.hopThapVS ? "V-S" : "V-H";
    badges.push(`<span style="font-size:7px;color:#00695c;font-weight:bold;" title="Hợp Thập ${via} — thông khí, cứu cục (+1 điểm)">➕10 Hợp Thập +1</span>`);
  }
  if (c.ngam.phucNgamS || c.ngam.phucNgamH) {
    badges.push(`<span style="font-size:7px;color:#8b0000;font-weight:bold;" title="Trùng số Lạc Thư nguyên đán — phát họa dữ dội khi thất vận">⚠伏 Phục Ngâm</span>`);
  }
  if (c.ngam.phanNgamS || c.ngam.phanNgamH) {
    badges.push(`<span style="font-size:7px;color:#8b0000;font-weight:bold;" title="Hợp Thập với Lạc Thư nguyên đán — phát họa dữ dội khi thất vận">⚠反 Phản Ngâm</span>`);
  }

  return `<div style="display:flex;flex-direction:column;gap:1px;align-items:center;">
    <div style="font-size:10px;color:#999;">V${c.v}</div>
    <div style="font-size:11px;"><span style="color:${sColor};font-weight:${sBold?700:400};">S${c.s}</span> <span style="color:${hColor};font-weight:${hBold?700:400};">H${c.h}</span></div>
    <div style="display:flex;flex-direction:column;gap:1px;margin-top:1px;">${badges.join("")}</div>
  </div>`;
}

// ==================================================================
// tnLienChauChiTiet — build khối HTML luận giải ĐẦY ĐỦ cho Liên Châu Tam Ban khi người dùng
// click mở rộng chi tiết 1 sơn. Đủ 3 ý theo đúng lý thuyết đã chốt:
//  1) Đủ trọn 9/9 cung -> đại cách "mây xanh thênh thang".
//  2) Cung nào có Sơn tinh hoặc Hướng tinh là VƯỢNG KHÍ (= đúng Vận) thì phát triển bền vững hơn.
//  3) Chuỗi chạm sao hung (Ngũ Hoàng 5, Nhị Hắc 2) hoặc tổ hợp xấu kinh điển 5-6-7 (hỏa hoạn, kiện
//     tụng) thì vẫn có thể hung dù là Liên Châu — cần thêm ngũ hành sinh khắc + Loan Đầu mới luận
//     chính xác. Dùng lại toàn bộ dữ liệu đã có sẵn từ xetLienChauTamBanMotCung/ToanCuc (luan-giai.js),
//     không tính lại logic ở đây.
// ==================================================================
function tnLienChauChiTiet(kq) {
  let mauNen = "#e0f2f1", mauVien = "#004d40", mauChu = "#004d40";
  let dongTieuDe, dongY1;

  if (kq.lienChauDu9Cung) {
    dongTieuDe = `🔗 <b>Liên Châu Tam Ban (連珠三般)</b> — đủ trọn 9/9 cung, mỗi cung Vận-Sơn-Hướng tạo bộ ba số liên tiếp theo vòng Lạc Thư (VD 4-5-6, 8-9-1...) — cộng điểm thật +${kq.tangLienChau}.`;
    dongY1 = `<div style="margin-top:4px;">✨ Nếu toàn 9 cung thì rất là tốt: đường công danh sự nghiệp rộng mở như đi trên mây xanh, vui vẻ, thênh thang, tự tại.</div>`;
  } else {
    let dsCung = [
      kq.lienChauTrungToaHuong.center && { ten: "Trung", kqc: kq.lienChauTrungToaHuong.center },
      kq.lienChauTrungToaHuong.back && { ten: "Tọa", kqc: kq.lienChauTrungToaHuong.back },
      kq.lienChauTrungToaHuong.front && { ten: "Hướng", kqc: kq.lienChauTrungToaHuong.front }
    ].filter(Boolean);
    dongTieuDe = `🔗 <b>Liên Châu Tam Ban (連珠三般)</b> — chỉ đạt tại <b>${dsCung.map(d => `${d.ten} (${d.kqc.chuoi})`).join(", ")}</b> — chưa đủ trọn 9 cung.`;
    dongY1 = "";
  }

  // Ý 2: vượng khí — quét TẤT CẢ cung đang có Liên Châu (toàn cục nếu đủ 9, hoặc riêng Trung/Tọa/Hướng
  // nếu chưa đủ) để liệt kê cung nào có Sơn/Hướng tinh vượng khí.
  let dsCungXet = kq.lienChauDu9Cung && kq.lienChauToanCuc
    ? kq.lienChauToanCuc.chiTiet.map(ct => ({ ten: ct.ten, kqc: ct.ketQua }))
    : [
        kq.lienChauTrungToaHuong.center && { ten: "Trung", kqc: kq.lienChauTrungToaHuong.center },
        kq.lienChauTrungToaHuong.back && { ten: "Tọa", kqc: kq.lienChauTrungToaHuong.back },
        kq.lienChauTrungToaHuong.front && { ten: "Hướng", kqc: kq.lienChauTrungToaHuong.front }
      ].filter(Boolean);

  let dsVuongKhi = dsCungXet.filter(d => d.kqc.sonVuong || d.kqc.huongVuong);
  let dongY2 = dsVuongKhi.length > 0
    ? `<div style="margin-top:4px;color:#2e7d32;">💪 Cung <b>${dsVuongKhi.map(d => `${d.ten}${d.kqc.sonVuong && d.kqc.huongVuong ? " (Sơn & Hướng đều vượng khí)" : d.kqc.sonVuong ? " (Sơn tinh vượng khí)" : " (Hướng tinh vượng khí)"}`).join(", ")}</b> đang có Sơn tinh hoặc Hướng tinh là vượng khí (đúng Vận) — vận thế của gia chủ càng phát triển bền vững.</div>`
    : "";

  // Ý 3: cảnh báo hung — quét cùng danh sách trên tìm cung nào chạm sao hung (2, 5) hoặc đúng 5-6-7.
  let dsHung567 = dsCungXet.filter(d => d.kqc.laToHopXau567);
  let dsHungSo = dsCungXet.filter(d => d.kqc.camSaoHung && !d.kqc.laToHopXau567);
  let dongY3 = "";
  if (dsHung567.length > 0 || dsHungSo.length > 0) {
    let chiTietHung = [];
    if (dsHung567.length > 0) chiTietHung.push(`cung <b>${dsHung567.map(d => `${d.ten} (${d.kqc.chuoi})`).join(", ")}</b> đúng tổ hợp <b>5-6-7</b> — dễ gây họa hỏa hoạn, kiện tụng`);
    if (dsHungSo.length > 0) chiTietHung.push(`cung <b>${dsHungSo.map(d => `${d.ten} (${d.kqc.chuoi})`).join(", ")}</b> có chạm sao <b>Ngũ Hoàng (5)</b> hoặc <b>Nhị Hắc (2)</b>`);
    dongY3 = `<div style="margin-top:4px;color:#c62828;">⚠️ Chuỗi liên tiếp này chạm vào sao hung: ${chiTietHung.join("; ")}. Liên Châu Tam Ban không phải cách cục nào cũng đẹp — nếu chạm sao hung như Ngũ Hoàng, Nhị Hắc hoặc tổ hợp xấu thì vẫn có thể hung, dù là Liên Châu. Cần kết hợp với ngũ hành sinh khắc và Loan Đầu (hình thế bên ngoài) mới luận chính xác.</div>`;
  }

  return `<div style="margin-bottom:8px;padding:6px 8px;background:${mauNen};border-radius:6px;border-left:3px solid ${mauVien};font-size:12px;color:${mauChu};">
    ${dongTieuDe}${dongY1}${dongY2}${dongY3}
  </div>`;
}

function tnTaoChiTiet(kq, van) {
  let s = kq.huongSon;
  let ts = kq.toaSon;

  let capSH = kq.front.s + "-" + kq.front.h;
  let toHop = "";
  if (TN_TO_HOP_CO_DIEN[capSH]) {
    let th = TN_TO_HOP_CO_DIEN[capSH];
    toHop = `<div style="margin-top:6px;padding:6px;background:#e3f2fd;border-radius:6px;border-left:3px solid #2196F3;font-size:12px;"><b>🎯 Tổ hợp đặc biệt ${capSH} — ${th.ten}</b> <span style="font-size:10px;color:#888;">(${th.nguon})</span>:<br>${th.giai}</div>`;
  } else if (TN_TO_HOP_HIEN_DAI[capSH]) {
    let th = TN_TO_HOP_HIEN_DAI[capSH];
    toHop = `<div style="margin-top:6px;padding:6px;background:#f3e5f5;border-radius:6px;border-left:3px solid #9c27b0;font-size:12px;"><b>🎯 Tổ hợp ${capSH} — ${th.ten}</b> <span style="font-size:10px;color:#7b1fa2;font-weight:bold;">(diễn giải hiện đại, không có trong Tử Bạch Quyết/Huyền Không Bí Chỉ)</span>:<br>${th.giai}</div>`;
  }

  function boxHaDo(hd, van) {
    if (!hd) return "";
    return `<div style="margin-top:4px;font-size:10px;color:${hd.dacVan?'#1565c0':'#e65100'};">🌊 ${hd.tenCap} (${hd.hanhHoaKhi||''}) — ${hd.dacVan ? 'đắc vận' : 'thất vận'} so Vận ${van}</div>`;
  }

  function boxHopThap(ngam) {
    let lines = [];
    if (ngam.hopThapVS) lines.push(`<div style="color:#00695c;">➕10 Hợp Thập V-S — thông khí</div>`);
    if (ngam.hopThapVH) lines.push(`<div style="color:#00695c;">➕10 Hợp Thập V-H — thông khí</div>`);
    return lines.length ? `<div style="margin-top:4px;font-size:10px;">${lines.join("")}</div>` : "";
  }
  function boxNgamPhat(ngam) {
    let lines = [];
    if (ngam.phucNgamS) lines.push(`<div style="color:#8b0000;font-weight:bold;">⚠ Phục Ngâm (S) −1</div>`);
    if (ngam.phucNgamH) lines.push(`<div style="color:#8b0000;font-weight:bold;">⚠ Phục Ngâm (H) −1</div>`);
    if (ngam.phanNgamS) lines.push(`<div style="color:#8b0000;font-weight:bold;">⚠ Phản Ngâm (S) −1</div>`);
    if (ngam.phanNgamH) lines.push(`<div style="color:#8b0000;font-weight:bold;">⚠ Phản Ngâm (H) −1</div>`);
    return lines.length ? `<div style="margin-top:4px;font-size:10px;">${lines.join("")}</div>` : "";
  }

  // Khối luận giải CHÂN KHÍ TIÊN THIÊN (Hà Đồ) — nền tảng Thiên thời/Địa lợi, đặt TRƯỚC TIÊN,
  // trước cả Ngũ Hoàng Trạch Tinh — giống hệt cách tab Nội Khí đã làm (xem luanChanKhiTienThien
  // trong phi-tinh.js). Dùng chung window.xetChanKhiHaDo (luan-giai.js).
  let canhBaoChanKhi = "";
  if (kq.chanKhi) {
    const dienGiaiDayDu = {
      dac: `Vận (Thiên thời) sinh xuất cho Hướng (Địa lợi), hoặc cả hai đồng một Hà Đồ khí — luồng khí Tiên Thiên vào nhà thuận chiều, nuôi dưỡng bền lâu. Đây là nền tảng cát lợi bậc nhất, có trước và quan trọng hơn cả cách cục Phi Tinh Hậu Thiên (Vượng Sơn Vượng Hướng, Hợp Thập...).`,
      tiet: `Hướng (Địa lợi) phản sinh ngược lại cho Vận (Thiên thời) — nhà vẫn dùng được, nhưng khí Tiên Thiên bị hao tổn dần theo thời gian. Mức độ bình thường: không đại hung, nhưng cũng không thật sự bền vượng như trường hợp Đắc Chân Khí.`,
      that: `Vận và Hướng khắc nhau theo Hà Đồ (bất kể chiều nào khắc chiều nào) — nhà mất gốc khí Tiên Thiên ngay từ nền tảng. Dù cách cục Phi Tinh Hậu Thiên có bay đẹp đến đâu cũng khó bền lâu, vì Thiên thời và Địa lợi đã lệch nhau từ gốc — cần đặc biệt lưu tâm.`,
      binh: `Vận và Hướng không sinh không khắc rõ rệt theo Hà Đồ.`
    };
    let mauCK = kq.chanKhi.loai === "dac" ? "#2e7d32" : kq.chanKhi.loai === "tiet" ? "#e65100" : kq.chanKhi.loai === "that" ? "#c62828" : "#888";
    let iconCK = kq.chanKhi.loai === "dac" ? "🌟" : kq.chanKhi.loai === "tiet" ? "⚠️" : kq.chanKhi.loai === "that" ? "☠️" : "◽";
    canhBaoChanKhi = `<div style="margin-bottom:8px;padding:8px;border:1px solid ${mauCK};border-radius:6px;font-size:12px;color:${mauCK};">
      ${iconCK} <b>Luận Chân Khí Tiên Thiên (Hà Đồ):</b> ${kq.chanKhi.nhan}<br>
      <span style="font-size:10px;opacity:0.85;">Hà Đồ: 1&6=Thủy · 2&7=Hỏa · 3&8=Mộc · 4&9=Kim · 5&10=Thổ (khác bảng Lạc Thư/Hậu Thiên dùng cho Phi Tinh) — Vận ${van} → ${kq.chanKhi.hanhVan}, Hướng (cung ${kq.huongSon.cung}) → ${kq.chanKhi.hanhHuong}.</span><br>
      <span style="color:#333;">${dienGiaiDayDu[kq.chanKhi.loai] || kq.chanKhi.moTa}</span>
    </div>`;
  }

  // Khối cảnh báo Ngũ Hoàng TRẠCH TINH (cố định vĩnh viễn — "gốc rễ bệnh của nhà") — ưu tiên cao nhất, đặt đầu tiên,
  // tách biệt & nổi bật hơn khối Tam Sát/Thái Tuế (chỉ là lưu niên, đổi theo năm).
  let canhBaoNguHoang = "";
  if (kq.coNguHoangTrachTinh) {
    let via = kq.viTriNguHoang.map(v => `<b>${v.loai}</b> tại <b>${v.ten}</b>`).join(", ");
    let chiTrungCung = kq.viTriNguHoang.every(v => v.ten === "Trung cung");
    canhBaoNguHoang = `<div style="margin-bottom:8px;padding:8px;background:#f3e5f5;border-radius:6px;border-left:4px solid #4a148c;font-size:12px;color:#4a148c;">
      ☠☠ <b>Ngũ Hoàng Trạch Tinh</b> — ${via}.<br>
      Đây là "gốc rễ bệnh của nhà" (cố định vĩnh viễn theo cách cục, không đổi theo năm) — luôn ưu tiên xử lý trước tiên: đặt vật phẩm hành <b>Kim</b> (chuông gió kim loại, bát quái đồng, khánh đồng...) tại đúng vị trí này và giữ <b>lâu dài</b> để trấn.<br>
      ${chiTrungCung ? '<span style="font-size:10px;opacity:0.85;">Vị trí này ở Trung cung — vốn là chỗ số 5 luôn nằm ở bàn Lạc Thư gốc, không phải hiện tượng "bay lạc" như khi rơi vào Tọa/Hướng; vẫn nên trấn Kim khí như bình thường.</span><br>' : ''}
      <span style="font-size:10px;opacity:0.85;">Lưu ý: Ngũ Hoàng <i>lưu niên</i> (bay theo từng năm, chưa cài đặt trong bảng này) chỉ thực sự đáng ngại khi bay đúng vào vị trí Ngũ Hoàng Trạch Tinh này hoặc đúng cửa chính/bếp — năm nào bị thì chỉ cần treo chuông gió tạm thời năm đó là đủ, không cần trấn thêm.</span>
    </div>`;
  }

  // Khối cảnh báo Tầng D — Thái Tuế & Tam Sát (lưu niên, theo Năm xem)
  // Tam Sát chỉ kỵ Tọa, Thái Tuế chỉ kỵ Hướng — Tọa Thái Tuế là ghi chú TÍCH CỰC (tựa núi), tách riêng, không phải cảnh báo.
  let canhBaoD = "";
  if (kq.toaSat || kq.xungThaiTue) {
    let dong = [];
    if (kq.toaSat) dong.push(`☠ <b>Tọa ${kq.loaiTamSat.ten}</b> (${kq.loaiTamSat.giaiDoan} — Tam Sát của Chi ${kq.chiNam}) — ${kq.loaiTamSat.moTa} Đại kỵ động thổ, tu sửa tại Tọa`);
    if (kq.xungThaiTue) dong.push(`⚠ <b>Hướng phạm Thái Tuế</b> (Hướng nhà trùng đúng phương Thái Tuế năm ${kq.chiNam}) — đối đầu trực diện với phương Thái Tuế, đại kỵ đào đắp/sửa chữa tại Hướng`);
    canhBaoD = `<div style="margin-bottom:8px;padding:8px;background:#ffebee;border-radius:6px;border-left:3px solid #b71c1c;font-size:12px;color:#8b0000;">${dong.join("<br>")}</div>`;
  }
  if (kq.toaThaiTue) {
    canhBaoD += `<div style="margin-bottom:8px;padding:8px;background:#e8f5e9;border-radius:6px;border-left:3px solid #2e7d32;font-size:12px;color:#1b5e20;">🛡️ <b>Tọa Thái Tuế</b> (Tọa sơn trùng đúng phương Thái Tuế năm ${kq.chiNam}) — như tựa lưng vào núi, có quyền uy che chở, thế vững. Lưu ý: dù Tọa hay Hướng, phương Thái Tuế tuyệt đối không đào đắp/sửa chữa/đục phá.</div>`;
  }

  return `<div style="padding:12px;background:#faf8f5;border-radius:8px;margin-top:8px;border:1px solid #e3d5c0;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
      <b style="color:#8b0000;font-size:14px;">📍 ${s.ten} (${s.goc}°) — Hướng ${s.cung}</b>
      <span style="font-size:12px;color:#888;">Tọa: ${ts.ten} (${ts.cung})</span>
      <span style="font-size:16px;font-weight:bold;color:${kq.xepHang.color};">${kq.xepHang.icon} ${kq.xepHang.nhan} (${kq.tong>0?'+':''}${kq.tong})</span>
    </div>
    ${canhBaoChanKhi}
    ${canhBaoNguHoang}
    ${canhBaoD}
    ${kq.tamBanQuai ? `<div style="margin-bottom:8px;padding:6px 8px;background:#f3e5f5;border-radius:6px;border-left:3px solid #6a1b9a;font-size:12px;color:#6a1b9a;font-weight:bold;">🔺 Tam Ban Quái (三般卦) — cả 9 cung của bàn đều có Vận-Sơn-Hướng cùng nhóm 1-4-7/2-5-8/3-6-9. Quý cách hiếm gặp, đắc quý nhân, thông cả 3 nguyên — nhưng cần Hướng tinh đúng chỗ có thủy thật mới phát huy, nếu không dễ biến cát thành hung.</div>` : ""}
    ${kq.thatTinhDaKiep ? (kq.thatTinhDaKiep.loai === "that"
      ? `<div style="margin-bottom:8px;padding:6px 8px;background:#e3f2fd;border-radius:6px;border-left:3px solid #0d47a1;font-size:12px;color:#0d47a1;font-weight:bold;">⚡ Thất Tinh Đả Kiếp (thật) — Vận tinh tại 3 cung Càn-Ly-Chấn cùng nhóm ${kq.thatTinhDaKiep.nhom}, và sao Vận nhập trạch (${van}) xuất hiện tại ${kq.thatTinhDaKiep.saoVanKhop === "S,H" ? "cả Sơn tinh lẫn Hướng tinh" : (kq.thatTinhDaKiep.saoVanKhop === "S" ? "Sơn tinh" : "Hướng tinh")} của cung Hướng. Bí pháp đặc biệt tốt —thông khí Tam Nguyên, chiếm khí tương lai- có khả năng hóa giải tai họa, chuyển hung thành cát cho các cách cục xấu, phát phúc lâu dài qua hàng thế kỷ, Đại Phú Đại Quý 👑 cộng điểm thật +${kq.tangDaKiep}.</div>`
      : `<div style="margin-bottom:8px;padding:6px 8px;background:#ede7f6;border-radius:6px;border-left:3px solid #4527a0;font-size:12px;color:#4527a0;font-weight:bold;">⚡ Thất Tinh Đả Kiếp (giả) — Vận tinh tại 3 cung Tốn-Khảm-Đoài cùng nhóm ${kq.thatTinhDaKiep.nhom}, và sao Vận nhập trạch (${van}) xuất hiện tại ${kq.thatTinhDaKiep.saoVanKhop === "S,H" ? "cả Sơn tinh lẫn Hướng tinh" : (kq.thatTinhDaKiep.saoVanKhop === "S" ? "Sơn tinh" : "Hướng tinh")} của cung Hướng. Về lý thuyết cũng thông khí Tam Nguyên, phát phúc lâu dài qua hàng thế kỷ, cộng điểm thật +${kq.tangDaKiep} — nhưng vì là "giả" nên hiệu quả còn phụ thuộc nhiều vào hình thế Loan Đầu (núi, nước) tại cung Tốn có đẹp, hữu tình hay không (chưa thể tự động đánh giá).</div>`
    ) : ""}
    ${(kq.lienChauDu9Cung || kq.coLienChauTrungToaHuong) ? tnLienChauChiTiet(kq) : ""}
    ${kq.toHopDacBietHuong && kq.toHopDacBietHuong.length ? `<div style="margin-bottom:8px;padding:6px 8px;background:#fff8e1;border-radius:6px;border-left:3px solid #f9a825;font-size:12px;color:#795500;">
      ${kq.toHopDacBietHuong.map(th => `<div>${th.icon} <b>${th.ten}</b> <span style="font-size:10px;color:#888;">(cặp ${th.cap} = ${th.saoA}-${th.saoB}, tại cung Hướng)</span> — ${th.moTa}</div>`).join("")}
    </div>` : ""}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;">
      <div style="padding:8px;background:#fff;border-radius:6px;text-align:center;">
        <div style="font-size:10px;color:#888;margin-bottom:4px;">🏠 Cung Hướng (${kq.front.cung})<br><span style="font-size:8px;">tài lộc — nhìn H</span></div>
        <div style="font-size:13px;">V${kq.front.v} <b>S${kq.front.s}</b> <b style="color:#1565c0;">H${kq.front.h}</b></div>
        ${boxHaDo(kq.front.haDo, van)}${boxHopThap(kq.front.ngam)}${boxNgamPhat(kq.front.ngam)}
      </div>
      <div style="padding:8px;background:#fff;border-radius:6px;text-align:center;">
        <div style="font-size:10px;color:#888;margin-bottom:4px;">⚡ Trung cung<br><span style="font-size:8px;">(V luôn = Vận)</span></div>
        <div style="font-size:13px;">V${kq.center.v} S${kq.center.s} H${kq.center.h}</div>
        ${boxHaDo(kq.center.haDo, van)}${boxHopThap(kq.center.ngam)}${boxNgamPhat(kq.center.ngam)}
      </div>
      <div style="padding:8px;background:#fff;border-radius:6px;text-align:center;">
        <div style="font-size:10px;color:#888;margin-bottom:4px;">🏔️ Cung Tọa (${kq.back.cung})<br><span style="font-size:8px;">nhân đinh — nhìn S</span></div>
        <div style="font-size:13px;">V${kq.back.v} <b style="color:#1565c0;">S${kq.back.s}</b> <b>H${kq.back.h}</b></div>
        ${boxHaDo(kq.back.haDo, van)}${boxHopThap(kq.back.ngam)}${boxNgamPhat(kq.back.ngam)}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;background:#fff;border-radius:6px;font-size:12px;">
      <div>Tầng CK (Chân Khí Tiên Thiên): <b style="color:${kq.tangCK>0?'#2e7d32':kq.tangCK<0?'#c62828':'#888'}">${kq.tangCK>0?'+':''}${kq.tangCK}</b>
        <div style="font-size:10px;color:#888;">${kq.chanKhi ? kq.chanKhi.nhan : '—'} (Hà Đồ: Vận ${kq.chanKhi?kq.chanKhi.hanhVan:'?'} / Hướng ${kq.chanKhi?kq.chanKhi.hanhHuong:'?'})</div>
      </div>
      <div>Tầng A (gốc ngũ hành): <b style="color:${kq.tangA>0?'#2e7d32':kq.tangA<0?'#c62828':'#888'}">${kq.tangA>0?'+':''}${kq.tangA}</b>
        <div style="font-size:10px;color:#888;">2×S-Tọa(${kq.qsToa.giai}) + 1×H-Hướng(${kq.qhHuong.giai})</div>
      </div>
      <div>Tầng B (VSVH/TSHT): <b style="color:${kq.tangB>0?'#2e7d32':kq.tangB<0?'#c62828':'#888'}">${kq.tangB>0?'+':''}${kq.tangB}</b>
        <div style="font-size:10px;color:#888;">${kq.cachCuoc || 'Không có cách cục đặc biệt'}</div>
      </div>
      <div>Tầng C (Hợp Thập/Liên Châu/Đả Kiếp): <b style="color:${kq.tangC>0?'#00695c':'#888'}">${kq.tangC>0?'+':''}${kq.tangC}</b>
        <div style="font-size:10px;color:#888;">${kq.soCungHopThap} / 3 cung có Hợp Thập${kq.tangLienChau ? ` · Liên Châu đủ 9 cung +${kq.tangLienChau}` : ''}${kq.tangDaKiep ? ` · Thất Tinh Đả Kiếp (${kq.thatTinhDaKiep.loai === 'that' ? 'thật' : 'giả'}) +${kq.tangDaKiep}` : ''}</div>
      </div>
      <div>Tầng D (Hung sát, năm ${kq.chiNam}): <b style="color:${kq.tangD<0?'#c62828':'#888'}">${kq.tangD>0?'+':''}${kq.tangD}</b>
        <div style="font-size:10px;color:#888;">Ngũ Hoàng Trạch Tinh + Thái Tuế + Tam Sát + Phản/Phục Ngâm — mỗi loại tối đa −1${kq.tangDGoc < kq.tangD ? ` (gốc ${kq.tangDGoc} nếu không chặn theo loại)` : ''}</div>
      </div>
    </div>
    ${toHop}
    <div style="margin-top:8px;font-size:11px;color:#666;line-height:1.5;">
      <b>Gợi ý:</b> ${kq.tong >= 3 ? 'Rất tốt, nên ưu tiên chọn.' : kq.tong >= 1 ? 'Khá tốt, có thể sử dụng.' : kq.tong === 0 ? 'Trung bình, dùng được cho chức năng phụ.' : kq.tong >= -2 ? 'Có điểm bất lợi, nên cân nhắc hoặc hóa giải.' : 'Hung khí nặng, nên tránh hoặc hóa giải mạnh.'}
    </div>
  </div>`;
}

// ==== HIỂN THỊ BẢNG ====
let tnKetQuaCache = [];
let tnSortMode = 'diem';
let tnSelectedSon = null;

function tnHienThiBang() {
  let van = parseInt(document.getElementById("tnVan").value) || 9;
  let nam = parseInt(document.getElementById("tnNam").value) || new Date().getFullYear();
  let filter = document.getElementById("tnFilter").value;
  let search = (document.getElementById("tnSearch").value || "").toLowerCase();
  let container = document.getElementById("tnBangContainer");
  if (!container) return;

  let dsSon = (typeof DS24_SON !== "undefined") ? DS24_SON : TN_SON_24_FALLBACK;
  tnKetQuaCache = dsSon.map(s => ({...s, kq: tnTinhDiem(s, van, nam)}));

  let data = tnKetQuaCache;
  if (filter === 'tot') data = data.filter(d => d.kq.tong > 0);
  else if (filter === 'xau') data = data.filter(d => d.kq.tong < 0);
  else if (filter === 'vuong') data = data.filter(d => d.kq.cachCuoc !== '');
  else if (filter === 'rat_tot') data = data.filter(d => d.kq.tong >= 3);
  else if (filter === 'nen_tranh') data = data.filter(d => d.kq.tong <= -3);

  if (search) {
    data = data.filter(d => d.ten.toLowerCase().includes(search) || d.cung.toLowerCase().includes(search));
  }

  if (tnSortMode === 'diem') data.sort((a,b) => b.kq.tong - a.kq.tong);
  else if (tnSortMode === 'ten') data.sort((a,b) => a.ten.localeCompare(b.ten));
  else if (tnSortMode === 'huong') {
    data.sort((a,b) => {
      let ha = tnTimHuongHienDai(a.goc);
      let hb = tnTimHuongHienDai(b.goc);
      return (TN_HUONG_ORDER[ha]||0) - (TN_HUONG_ORDER[hb]||0);
    });
  }

  let html = `<div style="background:#fff;border:2px solid #e3d5c0;border-radius:10px;overflow:hidden;">
    <div style="display:grid;grid-template-columns:64px 1fr 1fr 1fr 150px;background:#8b0000;color:#fff;font-size:9px;font-weight:bold;padding:6px 2px;text-align:center;align-items:center;">
      <div>Sơn / Hướng / Điểm</div><div>🏠 Cung Hướng<br><span style="font-size:7px">(tài lộc, nhìn H)</span></div><div>⚡ Trung cung</div><div>🏔️ Cung Tọa<br><span style="font-size:7px">(nhân đinh, nhìn S)</span></div><div>📜 Luận</div>
    </div>`;

  for (let d of data) {
    let s = d, kq = d.kq;
    let rowBg = `background:${kq.xepHang.bg};`;
    let isSelected = tnSelectedSon === s.ten ? 'box-shadow:inset 0 0 0 2px #8b0000;' : '';
    let huongHienDai = tnTimHuongHienDai(s.goc);
    let khoangDo = tnTinhKhoangDo(s.goc);

    let luan = tnTaoLuanNgan(kq, van);

    html += `<div class="tn-row" data-son="${s.ten}" style="display:grid;grid-template-columns:64px 1fr 1fr 1fr 150px;padding:5px 2px;font-size:11px;align-items:center;border-bottom:1px solid #f0ebe0;cursor:pointer;${rowBg}${isSelected}" onclick="tnChonSon('${s.ten}',${van})">
      <div style="text-align:center;line-height:1.3;">
        <div style="font-weight:bold;color:#8b0000;font-size:12px;">${s.ten}</div>
        <div style="font-size:9px;color:#1565c0;font-weight:600;">${huongHienDai}</div>
        <div style="font-size:8px;color:#888;">${khoangDo}</div>
        <div style="font-size:13px;font-weight:bold;color:${kq.xepHang.color};margin-top:3px;border-top:1px dashed #ccc;padding-top:2px;">${kq.tong>0?'+':''}${kq.tong}</div>
        <div style="font-size:9px;font-weight:bold;color:${kq.xepHang.color};">${kq.xepHang.icon} ${kq.xepHang.nhan}</div>
      </div>
      <div style="text-align:center;">${tnTaoO(kq.front, 'huong', kq)}</div>
      <div style="text-align:center;">${tnTaoO(kq.center, 'trung', kq)}</div>
      <div style="text-align:center;">${tnTaoO(kq.back, 'toa', kq)}</div>
      <div style="text-align:center;font-size:9px;line-height:1.35;padding:3px;">${luan}</div>
    </div>`;
  }

  if (data.length === 0) html += `<div style="padding:20px;text-align:center;color:#888;font-size:13px;">Không có sơn nào khớp.</div>`;
  html += `</div>`;
  container.innerHTML = html;
  tnCapNhatThongKe(van);
}

function tnChonSon(sonName, van) {
  tnSelectedSon = sonName;
  let item = tnKetQuaCache.find(d => d.ten === sonName);
  if (!item) return;
  document.querySelectorAll('.tn-row').forEach(r => {
    r.style.boxShadow = r.dataset.son === sonName ? 'inset 0 0 0 2px #8b0000' : 'none';
  });
  let detailContainer = document.getElementById("tnChiTietContainer");
  if (detailContainer) {
    detailContainer.innerHTML = tnTaoChiTiet(item.kq, van);
    detailContainer.scrollIntoView({behavior:'smooth', block:'nearest'});
  }
}

function tnCapNhatThongKe(van) {
  let stats = document.getElementById("tnThongKe");
  if (!stats) return;
  let ratTot = tnKetQuaCache.filter(d => d.kq.tong >= 3).length;
  let khaTot = tnKetQuaCache.filter(d => d.kq.tong >= 1 && d.kq.tong <= 2).length;
  let trungBinh = tnKetQuaCache.filter(d => d.kq.tong === 0).length;
  let canNhac = tnKetQuaCache.filter(d => d.kq.tong <= -1 && d.kq.tong >= -2).length;
  let nenTranh = tnKetQuaCache.filter(d => d.kq.tong <= -3).length;
  let vuong = tnKetQuaCache.filter(d => d.kq.cachCuoc !== '').length;
  stats.innerHTML = `<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;">
    <span style="color:#1b5e20;font-weight:bold;">🟢 Tốt: ${ratTot}</span>
    <span style="color:#2e7d32;font-weight:bold;">🟢 Khá: ${khaTot}</span>
    <span style="color:#f57f17;font-weight:bold;">🟡 Tr/bình: ${trungBinh}</span>
    <span style="color:#e65100;font-weight:bold;">🟠 Cân nhắc: ${canNhac}</span>
    <span style="color:#c62828;font-weight:bold;">🔴 Nên tránh: ${nenTranh}</span>
    <span style="color:#8b0000;font-weight:bold;">🏆 Có cách cục: ${vuong}</span>
    <span style="color:#666;">| 24 sơn — Vận ${van}</span>
  </div>`;
}

// Thứ tự 8 hướng để sắp xếp
const TN_HUONG_ORDER = {"Bắc":0,"Đông Bắc":1,"Đông":2,"Đông Nam":3,"Nam":4,"Tây Nam":5,"Tây":6,"Tây Bắc":7};

function tnDoiSortMode() {
  let modes = ['diem', 'ten', 'huong'];
  let idx = modes.indexOf(tnSortMode);
  tnSortMode = modes[(idx + 1) % modes.length];
  let labels = {'diem':'Điểm','ten':'Tên','huong':'Hướng'};
  let btn = document.getElementById("tnSortBtn");
  if (btn) btn.innerText = `📊 Sắp xếp theo: ${labels[tnSortMode]}`;
  tnHienThiBang();
}

// Gọi khi người dùng đổi ô "Năm tìm" — tự động quy đổi ra Vận tương ứng rồi cập nhật select Vận.
// Người dùng vẫn có thể tự tay đổi lại select Vận sau đó (ví dụ muốn xét nhà xây từ Vận cũ theo Năm hiện tại).
function tnCapNhatVanTuNam() {
  let namEl = document.getElementById("tnNam");
  let vanEl = document.getElementById("tnVan");
  if (!namEl || !vanEl) return;
  let nam = parseInt(namEl.value);
  if (!nam) return;
  let van = tnNamToVan(nam);
  vanEl.value = van;
  tnHienThiBang();
}

function tnDocTuNoiKhi() {
  let namNhap = parseInt(document.getElementById("namNhapTrach")?.value);
  if (namNhap) {
    let van = tnNamToVan(namNhap);
    let vanEl = document.getElementById("tnVan");
    if (vanEl) vanEl.value = van;
  }
  if (window.phiTinhVSH) {
    let vsEl = document.getElementById("tnVSHInfo");
    if (vsEl) {
      let html = `<b>📡 Dữ liệu từ tab Nội Khí:</b> `;
      let hasData = false;
      for (let cung in window.phiTinhVSH) {
        let d = window.phiTinhVSH[cung];
        html += `${cung}(V${d.V}S${d.S}H${d.H}) `;
        hasData = true;
      }
      if (!hasData) html += `Chưa có dữ liệu.`;
      vsEl.innerHTML = html;
    }
  }
  tnHienThiBang();
}

// ==== KHỞI TẠO ====
function tnKhoiTao() {
  let tab = document.getElementById("tab-timnha");
  if (!tab) return;

  if (tab.innerHTML.trim() === '' || !document.getElementById("tnBangContainer")) {
    tab.innerHTML = `
      <div style="padding:10px;max-width:900px;margin:0 auto;">
        <h2 style="color:#8b0000;margin-bottom:8px;font-size:18px;">🔍 Tìm Hướng Nhà để mua theo Vận</h2>
        <p style="font-size:12px;color:#666;margin-bottom:12px;">Chỉ nhập Vận. Xét 3 cung: Trung cung, cung Hướng (cửa chính — tài lộc), cung Tọa (sau lưng — nhân đinh).</p>

        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;background:#fff;padding:10px;border-radius:8px;border:1px solid #e3d5c0;">
          <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:6px;">
              <label style="font-size:13px;font-weight:600;color:#444;">Vận:</label>
              <select id="tnVan" style="padding:6px 10px;border:1px solid #d4c4b0;border-radius:6px;background:#fff;font-size:14px;cursor:pointer;" onchange="tnHienThiBang()">
                ${(function(){
                  let vanMacDinh = tnNamToVan(new Date().getFullYear());
                  let khoangVan = ["1864-1883","1884-1903","1904-1923","1924-1943","1944-1963","1964-1983","1984-2003","2004-2023","2024-2043"];
                  let opts = "";
                  for (let i = 1; i <= 9; i++) {
                    opts += `<option value="${i}" ${i === vanMacDinh ? 'selected' : ''}>${i} (${khoangVan[i-1]})</option>`;
                  }
                  return opts;
                })()}
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <label style="font-size:13px;font-weight:600;color:#444;">Năm tìm:</label>
              <input type="number" id="tnNam" value="${new Date().getFullYear()}" style="padding:6px 10px;border:1px solid #d4c4b0;border-radius:6px;background:#fff;font-size:14px;width:80px;" onchange="tnCapNhatVanTuNam()" title="Năm dự định mua/nhập trạch — tự động quy đổi ra Vận tương ứng (chọn lại Vận thủ công bên cạnh nếu muốn xét khác). Cũng dùng để tính Thái Tuế & Tam Sát lưu niên.">
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:6px;">
              <label style="font-size:13px;font-weight:600;color:#444;">Lọc:</label>
              <select id="tnFilter" style="padding:6px 10px;border:1px solid #d4c4b0;border-radius:6px;background:#fff;font-size:14px;cursor:pointer;" onchange="tnHienThiBang()">
                <option value="all">Tất cả 24 sơn</option>
                <option value="rat_tot">🟢 Tốt (≥+3)</option>
                <option value="tot">Cát (>0)</option>
                <option value="xau">Hung (<0)</option>
                <option value="nen_tranh">🔴 Nên tránh (≤−3)</option>
                <option value="vuong">Có cách cục VSVH/TSHT</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:40px;">
              <input type="text" id="tnSearch" placeholder="🔍 Tìm sơn, cung..." style="padding:6px 10px;border:1px solid #d4c4b0;border-radius:6px;background:#fff;font-size:13px;flex:1;min-width:0;" oninput="tnHienThiBang()">
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <button id="tnSortBtn" onclick="tnDoiSortMode()" style="padding:6px 12px;background:#8b0000;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;">📊 Sắp xếp theo: Điểm</button>
          </div>
        </div>

        <div id="tnThongKe" style="margin-bottom:10px;"></div>
        <div id="tnVSHInfo" style="margin-bottom:10px;font-size:11px;color:#666;background:#f5f5f5;padding:6px 10px;border-radius:6px;"></div>

        <div id="tnBangContainer"></div>
        <div id="tnChiTietContainer" style="margin-top:12px;"></div>

        <div style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;font-size:10px;">
          <div style="background:#e8f5e9;padding:8px;border-radius:8px;border-left:4px solid #1b5e20;"><b style="color:#1b5e20;">🟢 Tốt (≥+3)</b></div>
          <div style="background:#f1f8e4;padding:8px;border-radius:8px;border-left:4px solid #2e7d32;"><b style="color:#2e7d32;">🟢 Khá (+1..+2)</b></div>
          <div style="background:#fffde7;padding:8px;border-radius:8px;border-left:4px solid #f57f17;"><b style="color:#f57f17;">🟡 Trung bình (0)</b></div>
          <div style="background:#fff3e0;padding:8px;border-radius:8px;border-left:4px solid #e65100;"><b style="color:#e65100;">🟠 Cân nhắc (−1..−2)</b></div>
          <div style="background:#ffebee;padding:8px;border-radius:8px;border-left:4px solid #c62828;"><b style="color:#c62828;">🔴 Nên tránh (≤−3)</b></div>
        </div>

        <div style="margin-top:16px;font-size:11px;color:#888;line-height:1.6;background:#fff;padding:12px;border-radius:8px;border:1px dashed #d4c4b0;">
          <b>Công thức (Tổng = Tầng CK + Tầng A + Tầng B + Tầng C + Tầng D):</b><br>
          <b>Tầng CK</b> (Chân Khí Tiên Thiên — Hà Đồ, xét TRƯỚC cả Phi Tinh Hậu Thiên): so Ngũ hành Hà Đồ (1&6=Thủy, 2&7=Hỏa, 3&8=Mộc, 4&9=Kim, 5&10=Thổ — khác bảng Lạc Thư dùng cho Phi Tinh) của Vận với Hướng (theo số Lạc Thư cố định của cung Hướng). Vận sinh Hướng/đồng hành → Đắc Chân Khí +1 · Hướng sinh Vận → Bị Tiết Khí 0 (không cộng trừ) · Vận khắc Hướng hoặc Hướng khắc Vận → Thất Chân Khí −1<br>
          <b>Tầng A</b> (ngũ hành sao-cung, gốc): 2×(S tại Tọa: sinh nhập +1 / khắc nhập −1 / còn lại 0) + 1×(H tại Hướng: tương tự)<br>
          <b>Tầng B</b> (Vượng Sơn Vượng Hướng / Thượng Sơn Hạ Thủy — 4 yếu tố cân xứng, mỗi yếu tố ±1): +1 Vượng Sơn · +1 Vượng Hướng · −1 Thượng Sơn (S lạc Hướng) · −1 Hạ Thủy (H lạc Tọa)<br>
          <b>Tầng D</b> (Hung sát — TRỪ ĐIỂM THẬT, <u>mỗi loại tối đa −1, tổng tối đa −4</u> nếu dính đủ 4 loại — mỗi loại dù nặng hay lặp nhiều lần cũng chỉ trừ tối đa −1, không lấn át cách cục): ☠☠ Loại <b>Ngũ Hoàng Trạch Tinh</b> (cố định vĩnh viễn theo cách cục, KHÁC lưu niên — Sơn tinh hoặc Hướng tinh = 5 tại Trung/Tọa/Hướng — "gốc rễ bệnh của nhà", ưu tiên xử lý trước tiên bằng vật phẩm hành Kim đặt lâu dài) · ☠ Loại <b>Tam Sát</b> (lưu niên theo Năm xem): <u>chỉ kỵ Tọa</u> (đại kỵ động thổ/tu sửa đúng chỗ lưng nhà tựa vào phương Tam Sát của Chi năm; Tam Sát tại Hướng không kỵ) · ⚠ Loại <b>Thái Tuế</b> (lưu niên theo Năm xem): <u>chỉ kỵ Hướng</u> (nhà quay mặt đối đầu trực diện phương Thái Tuế của Chi năm là hung; Thái Tuế tại Tọa ngược lại là tựa núi, có thế vững, không trừ điểm — nhưng dù Tọa hay Hướng, phương Thái Tuế tuyệt đối không đào đắp/sửa chữa/đục phá) · ⚠ Loại <b>Phản/Phục Ngâm</b>: mỗi lỗi (S/H trùng hoặc hợp thập với số Lạc Thư nguyên đán tại chính cung đó, tính cả 3 cung) — mỗi loại dù có nhiều lỗi cũng chỉ trừ tối đa −1<br>
          <span style="font-size:10px;">Ngũ Hoàng <i>lưu niên</i> (bay theo từng năm) chưa cài đặt trong bảng — chỉ thực sự đáng ngại khi bay đúng vào vị trí Ngũ Hoàng Trạch Tinh hoặc đúng cửa/bếp, năm đó treo chuông gió tạm là đủ.</span><br>
          <span style="font-size:10px;">Ngoại lệ không trừ điểm dù thuộc Tầng D: Ngũ Hoàng Trạch Tinh rơi tại <b>Trung cung</b> (số 5 vốn luôn ở giữa theo bàn Lạc Thư gốc, không phải "bay lạc" như khi rơi vào Tọa/Hướng) · Thái Tuế tại <b>Tọa</b> (tựa núi, thế vững — ngược với phạm Thái Tuế tại Hướng).</span><br>
          <b>Tầng C</b> (Hợp Thập — CỘNG ĐIỂM THẬT): xét 3 cung Trung/Tọa/Hướng, mỗi cung có V+S=10 hoặc V+H=10 thì +1 (tối đa +3) — thông khí, quý nhất ở Vận 1, 9<br>
          <b>Tham khảo thêm</b> (KHÔNG cộng/trừ điểm vào Tổng): 🌊 Hà Đồ Tứ Tượng · 🔺 Tam Ban Quái (三般卦 — <i>không phải "Tam Bát Quái"</i>: CẢ 9 cung của bàn đều có Vận-Sơn-Hướng cùng nhóm 1-4-7/2-5-8/3-6-9, là cách cục toàn cục chứ không xét riêng 1 cung — rất hiếm gặp) · 🔗 Liên Châu Tam Ban khi <i>chưa đủ trọn 9 cung</i> (chỉ đủ tại Trung/Tọa/Hướng) · các tổ hợp đặc biệt Sơn-Hướng ghi ở mục "Tổ hợp đặc biệt" — theo Tử Bạch Quyết/Huyền Không Bí Chỉ<br>
          🎯 Tổ hợp <span style="color:#1565c0;">xanh dương</span> = cổ điển có nguồn sách · <span style="color:#7b1fa2;">tím</span> = diễn giải hiện đại (chưa thấy trong Tử Bạch Quyết/Huyền Không Bí Chỉ)<br>
          <b>Vận</b> dùng để lập Sơn/Hướng tinh (cố định theo thời điểm nhập trạch) — <b>Năm xem</b> dùng riêng để tính Thái Tuế/Tam Sát lưu niên (đổi theo từng năm, độc lập với Vận)<br><br>
          <b>V</b>=Vận tinh (Trung cung luôn = Vận) | <b>S</b>=Sơn tinh | <b>H</b>=Hướng tinh<br>
          🏠 <b>Cung Hướng</b> = hướng cửa chính (tài lộc, nhìn H) | 🏔️ <b>Cung Tọa</b> = sau lưng nhà (nhân đinh, nhìn S) — ưu tiên nhân đinh hơn tài lộc
        </div>
      </div>
    `;
  }
  tnHienThiBang();
}

window.tnKhoiTao = tnKhoiTao;
window.tnHienThiBang = tnHienThiBang;
window.tnChonSon = tnChonSon;
window.tnDoiSortMode = tnDoiSortMode;
window.tnDocTuNoiKhi = tnDocTuNoiKhi;