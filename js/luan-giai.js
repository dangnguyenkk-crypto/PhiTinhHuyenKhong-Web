// ====================================================================
// luan-giai.js
// GOM CÁC HÀM "QUY TẮC LUẬN GIẢI" DÙNG CHUNG cho nhiều tab (Nội Khí/Phi Tinh,
// Tìm Nhà, Cửu Cung Lưới...). Trước đây các hàm này được GỌI qua
// `typeof window.X === 'function'` ở nhiều nơi nhưng KHÔNG file nào định
// nghĩa — nên luôn rơi vào nhánh fallback (mỗi nơi tự viết 1 kiểu, có chỗ
// đúng có chỗ sai) hoặc trả về rỗng/không hoạt động.
//
// FILE NÀY PHẢI LOAD TRƯỚC: phi-tinh.js, compass-module.js, tim-nha.js
// (xem index.html — thứ tự script đã được sắp lại kèm theo).
//
// NGUYÊN TẮC: đây là NƠI DUY NHẤT định nghĩa các quy tắc dưới đây. Các tab
// khác chỉ được GỌI LẠI qua window.xetXxx(...), không tự viết lại logic.
// ====================================================================

(function () {
  'use strict';

  // ==================================================================
  // BẢNG NGŨ HÀNH GỐC — nguồn duy nhất, export ra window để mọi tab dùng
  // chung (trước đây mỗi file tự định nghĩa 1 bản y hệt qua fallback).
  // ==================================================================
  var HANH_CUA_SAO = window.HANH_CUA_SAO || {1:"Thủy",2:"Thổ",3:"Mộc",4:"Mộc",5:"Thổ",6:"Kim",7:"Kim",8:"Thổ",9:"Hỏa"};
  var HANH_SINH = window.HANH_SINH || {"Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim","Kim":"Thủy","Thủy":"Mộc"};
  var HANH_KHAC = window.HANH_KHAC || {"Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim","Kim":"Mộc"};
  window.HANH_CUA_SAO = HANH_CUA_SAO;
  window.HANH_SINH = HANH_SINH;
  window.HANH_KHAC = HANH_KHAC;

  // Hà Đồ (Tiên Thiên) — khác bảng Lạc Thư/Hậu Thiên ở trên. Dùng riêng cho
  // xetChanKhiHaDo. 1&6=Thủy, 2&7=Hỏa, 3&8=Mộc, 4&9=Kim, 5&10=Thổ.
  var HA_DO_HANH = {1:"Thủy",6:"Thủy",2:"Hỏa",7:"Hỏa",3:"Mộc",8:"Mộc",4:"Kim",9:"Kim",5:"Thổ",10:"Thổ"};

  // ==================================================================
  // 1) QUAN HỆ NGŨ HÀNH — sao (Vận/Sơn/Hướng/Niên/Nguyệt/Nhật) với cung nó đóng.
  // Đây là quy tắc gốc (Quy tắc 1), làm căn cứ hung/cát CỐ ĐỊNH cho mọi luận giải.
  // Nguồn: hợp nhất từ qCungGoc (phi-tinh.js) và tnQuanHe (tim-nha.js) — 2 bản
  // trước đây giống hệt nhau về logic, chỉ khác tên biến.
  // ==================================================================
  function xetQuanHeNguHanh(hanhCung, sao) {
    var hs = HANH_CUA_SAO[sao];
    if (hanhCung === hs) return { dienGiai: "đồng hành (" + hs + ")", loai: "binh", nhan: "Bình ổn", diem: 0 };
    if (HANH_SINH[hs] === hanhCung) return { dienGiai: hs + " sinh " + hanhCung, loai: "tot", nhan: "Sinh nhập — TỐT", diem: 1 };
    if (HANH_SINH[hanhCung] === hs) return { dienGiai: hanhCung + " sinh " + hs, loai: "hao_tan", nhan: "Hao tán — trung bình", diem: 0 };
    if (HANH_KHAC[hs] === hanhCung) return { dienGiai: hs + " khắc " + hanhCung, loai: "xau", nhan: "Khắc nhập — XẤU trọng tâm", diem: -1 };
    if (HANH_KHAC[hanhCung] === hs) return { dienGiai: hanhCung + " khắc " + hs, loai: "che_nhe", nhan: "Cung chế sao — nhẹ", diem: 0 };
    return { dienGiai: "bình hòa", loai: "binh", nhan: "Bình ổn", diem: 0 };
  }

  // ==================================================================
  // 2) HỢP THẬP — V+S=10 hoặc V+H=10 tại 1 cung (Vận cộng Sơn/Hướng tinh
  // ra 10 là thông khí, cứu cục). LƯU Ý theo đúng nguyên tắc đã chốt: Hợp
  // Thập chỉ xét V+S hoặc V+H — KHÔNG dùng S+H=10 (đó không phải Hợp Thập).
  // ==================================================================
  function xetHopThap(v, s, h) {
    return {
      hopThapVS: (v + s) === 10,
      hopThapVH: (v + h) === 10
    };
  }

  // ==================================================================
  // 3) PHẢN NGÂM / PHỤC NGÂM — theo đúng nguyên văn đã xác nhận:
  // "Hai sao sơn hoặc hướng là 5 nhập Trung cung thuận cục gọi là Phục ngâm.
  //  Hai sao sơn hoặc hướng 5 nhập Trung cung nghịch cục gọi là Phản ngâm.
  //  Phục ngâm tức là 5 nhập trung, chữ số nào phi tinh giống như tinh bàn
  //  gốc lạc thư. Phản ngâm tức là ở cung mà phi tinh chiếu tới chữ nào
  //  cũng hợp thập với địa bàn (tinh bàn gốc lạc thư)."
  //
  // => Điều kiện kích hoạt: CHỈ bàn nào (Sơn hoặc Hướng — xét ĐỘC LẬP,
  //    không OR/trộn với nhau) có số nhập Trung cung = 5 mới được xét.
  // => Khi đã kích hoạt: Phục/Phản xác định theo chiều bay của CHÍNH bàn đó
  //    (thuận => Phục Ngâm cả bàn; nghịch => Phản Ngâm cả bàn), rồi so từng
  //    cung của CHÍNH bàn đó với Lạc Thư nguyên đán tại cung ấy.
  //
  // THAM SỐ TRUYỀN TRỰC TIẾP (KHÔNG đọc window.phiTinhVSH/phiTinhLaThuan..
  // — biến toàn cục đó chỉ đúng ngữ cảnh cho tab Phi Tinh/Nội Khí đang mở;
  // tab Tìm Nhà tính bàn Sơn/Hướng RIÊNG cho từng hướng nhà ứng viên nên
  // PHẢI truyền trực tiếp để không bị lệch dữ liệu giữa 2 tab):
  //   soTaiCung   : số của bàn Sơn hoặc Hướng tại cung đang xét
  //   soGocTaiCung: số Lạc Thư nguyên đán tại chính cung đang xét
  //   soNhapTrung : số nhập Trung cung CỦA CHÍNH BÀN ĐANG XÉT (Sơn hoặc Hướng)
  //   laThuan     : true=thuận cục, false=nghịch cục — CỦA CHÍNH BÀN ĐANG XÉT
  // ==================================================================
  function xetPhanPhucNgamMotSao(soTaiCung, soGocTaiCung, soNhapTrung, laThuan) {
    if (soNhapTrung !== 5) return null; // chỉ kích hoạt khi CHÍNH bàn này có 5 nhập trung
    if (laThuan === true) {
      return soTaiCung === soGocTaiCung ? { loai: "phuc", nhan: "Phục Ngâm", ky: "伏" } : null;
    } else if (laThuan === false) {
      return (soTaiCung + soGocTaiCung) === 10 ? { loai: "phan", nhan: "Phản Ngâm", ky: "反" } : null;
    }
    return null;
  }

  // ==================================================================
  // 4) VƯỢNG SƠN VƯỢNG HƯỚNG / THƯỢNG SƠN HẠ THỦY — cách cục theo vị trí
  // Sơn tinh/Hướng tinh so với Vận, tại đúng Tọa và đúng Hướng của nhà.
  //   sTai_Toa   : Sơn tinh tại cung TỌA
  //   sTai_Huong : Sơn tinh tại cung HƯỚNG
  //   hTai_Huong : Hướng tinh tại cung HƯỚNG
  //   hTai_Toa   : Hướng tinh tại cung TỌA
  //   van        : Vận đang xét (vanNha hoặc vanHienTai tuỳ nơi gọi)
  //
  // - vuongSon (Vượng Sơn): Sơn tinh ĐÚNG TẠI TỌA bằng Vận — vượng nhân đinh.
  // - thuongSon (Thượng Sơn — xấu): Sơn tinh lạc RA HƯỚNG bằng Vận — hại nhân đinh.
  // - vuongHuong (Vượng Hướng): Hướng tinh ĐÚNG TẠI HƯỚNG bằng Vận — vượng tài lộc.
  // - haThuy (Hạ Thủy — xấu): Hướng tinh lạc VỀ TỌA bằng Vận — hại tài lộc.
  // ==================================================================
  function xetVuongSuyCachCuc(sTai_Toa, sTai_Huong, hTai_Huong, hTai_Toa, van) {
    var vuongSon = sTai_Toa === van;
    var thuongSon = sTai_Huong === van;
    var vuongHuong = hTai_Huong === van;
    var haThuy = hTai_Toa === van;
    var cachCuoc = null;
    if (vuongSon && vuongHuong) cachCuoc = "Vượng Sơn Vượng Hướng";
    else if (thuongSon && haThuy) cachCuoc = "Thượng Sơn Hạ Thủy";
    else if (vuongSon || vuongHuong || thuongSon || haThuy) {
      var phan = [];
      if (vuongSon) phan.push("Vượng Sơn");
      if (vuongHuong) phan.push("Vượng Hướng");
      if (thuongSon) phan.push("Thượng Sơn");
      if (haThuy) phan.push("Hạ Thủy");
      cachCuoc = phan.join(" + ");
    }
    return { vuongSon: vuongSon, thuongSon: thuongSon, vuongHuong: vuongHuong, haThuy: haThuy, cachCuoc: cachCuoc };
  }

  // ==================================================================
  // 5) TỔ HỢP HƯỚNG TINH – SƠN TINH ĐẶC BIỆT (11 cặp) — riêng cho phi-tinh.js
  // (tab Nội Khí/Phi Tinh). KHÔNG dùng chung với bảng lớn 81 tổ hợp
  // TN_TO_HOP_CO_DIEN/TN_TO_HOP_HIEN_DAI của tim-nha.js — 2 nguồn dữ liệu
  // được giữ TÁCH BIỆT theo đúng yêu cầu.
  //
  // Tham số theo thứ tự: huongTinh trước, sonTinh sau (khác chiều với bảng
  // toHopDacBiet cũ trong phi-tinh.js vốn dùng Sơn trước - Hướng sau).
  // ==================================================================
  var TO_HOP_SON_HUONG_DAC_BIET = {
    "1-6": { quaiTen: "Thủy Thiên Nhu", sinhVuong: "Thi cử đỗ đạt, danh tiếng; giàu nhanh; sống lâu.", khacSat: "Xuất huyết não, thương hàn, cha con bất hoà, trộm cắp, dâm dật; đề phòng chết đuối." },
    "6-1": { quaiTen: "Thiên Thủy Tụng", sinhVuong: "Học thức uyên bác, luật sư liêm khiết, làm giàu từ thủy lợi.", khacSat: "Xuất huyết não, sỏi thận, kiện tụng, gian nhân giả nghĩa." },
    "1-4": { quaiTen: "Thủy Phong Tình", sinhVuong: "Thi cử đỗ đạt, văn chương thi hoạ, thăng quan tiến chức.", khacSat: "Bệnh phong thấp, tinh thần không ổn định, đam mê tửu sắc, nam nữ dâm loạn." },
    "4-1": { quaiTen: "Phong Thủy Hoán", sinhVuong: "Con cái thi cử đỗ đạt, tài vận tốt, tuổi thọ cao.", khacSat: "Bệnh thận gan, phụ nữ sống buông thả, thành công ít thất bại nhiều." },
    "8-9": { quaiTen: "Sơn Hỏa Bí", sinhVuong: "Đất đai nhiều, giàu có, hôn nhân hạnh phúc, lợi cho thiếu nam.", khacSat: "Bệnh về máu, xuất huyết, huyết áp cao, bệnh về mắt." },
    "9-8": { quaiTen: "Hỏa Sơn Lữ", sinhVuong: "Của cải dư dật, nhân khẩu đông đúc, sinh quý tử.", khacSat: "Bệnh về máu, xuất huyết, huyết áp cao, người vị thành niên gặp nạn." },
    "2-5": { quaiTen: "Nhị Ngũ Giao Gia", sinhVuong: "Không có mặt tốt — cặp này luôn hung bất kể sinh hay khắc.", khacSat: "Đại hung, dễ sinh bệnh tật, tổn nhân đinh, mẹ góa con côi." },
    "5-2": { quaiTen: "Nhị Ngũ Giao Gia", sinhVuong: "Không có mặt tốt — cặp này luôn hung bất kể sinh hay khắc.", khacSat: "Đại hung, dễ sinh bệnh tật, tổn nhân đinh, mẹ góa con côi." },
    "7-9": { quaiTen: "Hỏa Trạch Khuê", sinhVuong: "Lấy người khác họ, xinh đẹp yêu kiều, hợp làm luật sư/quan tòa.", khacSat: "Hỏa hoạn, bị bỏng, vật nổ làm bị thương, đam mê tửu sắc, kiện tụng." },
    "9-7": { quaiTen: "Trạch Hỏa Cách", sinhVuong: "Hợp luật sư, quan tòa, nhà nghiên cứu; dễ xuất người đẹp.", khacSat: "Hỏa hoạn, chết cháy, bị bỏng, đào hoa, đam mê tửu sắc." },
    "3-7": { quaiTen: "Trạch Lôi Tùy / Lôi Trạch Quy Muội (tranh chấp)", sinhVuong: "Đắc tài, văn võ song toàn — nhưng cặp 3-7 dễ thiên về hình tụng.", khacSat: "Tranh chấp, hình tụng, kiện tụng, dễ va chạm, tai nạn đổ máu." }
  };
  function xetToHopSonHuong(huongTinh, sonTinh) {
    var key = huongTinh + "-" + sonTinh;
    return TO_HOP_SON_HUONG_DAC_BIET[key] || null;
  }

  // ==================================================================
  // 6) CHÂN KHÍ TIÊN THIÊN (Hà Đồ) — so ngũ hành Hà Đồ của VẬN với ngũ hành
  // Hà Đồ của số Lạc Thư CỐ ĐỊNH tại cung Hướng (KHÔNG dùng Hướng tinh bay
  // theo Vận, để giữ đúng tính chất Tiên Thiên/bất biến).
  //   dac  (Đắc Chân Khí): Vận sinh Hướng, hoặc Vận và Hướng đồng hành.
  //   tiet (Tiết khí)     : Hướng sinh ngược lại cho Vận (phản sinh).
  //   that (Thất Chân Khí): Vận và Hướng khắc nhau (bất kể chiều nào).
  //   binh (Bình hòa)     : không rơi vào 3 trường hợp trên.
  //
  // van              : Vận đang xét (1-9)
  // soCungHuongCoDinh: số Lạc Thư cố định của cung Hướng (CUNG_TO_SO[cungHuong])
  // ==================================================================
  function xetChanKhiHaDo(van, soCungHuongCoDinh) {
    if (!van || !soCungHuongCoDinh) return null;
    var hanhVan = HA_DO_HANH[van];
    var hanhHuong = HA_DO_HANH[soCungHuongCoDinh];
    if (!hanhVan || !hanhHuong) return null;

    var loai, nhan, moTa;
    if (hanhVan === hanhHuong) {
      loai = "dac"; nhan = "Đắc Chân Khí (đồng khí)";
      moTa = "Vận và Hướng cùng một khí Hà Đồ — khí Tiên Thiên thuần nhất, bền vượng.";
    } else if (HANH_SINH[hanhVan] === hanhHuong) {
      loai = "dac"; nhan = "Đắc Chân Khí (Vận sinh Hướng)";
      moTa = "Vận (Thiên thời) sinh xuất cho Hướng (Địa lợi) — khí Tiên Thiên vào nhà thuận chiều, nuôi dưỡng bền lâu.";
    } else if (HANH_SINH[hanhHuong] === hanhVan) {
      loai = "tiet"; nhan = "Tiết Khí (Hướng phản sinh Vận)";
      moTa = "Hướng (Địa lợi) phản sinh ngược lại cho Vận (Thiên thời) — khí Tiên Thiên bị hao tổn dần theo thời gian.";
    } else if (HANH_KHAC[hanhVan] === hanhHuong || HANH_KHAC[hanhHuong] === hanhVan) {
      loai = "that"; nhan = "Thất Chân Khí (Vận-Hướng khắc nhau)";
      moTa = "Vận và Hướng khắc nhau theo Hà Đồ — nhà mất gốc khí Tiên Thiên ngay từ nền tảng.";
    } else {
      loai = "binh"; nhan = "Bình hòa";
      moTa = "Vận và Hướng không sinh không khắc rõ rệt theo Hà Đồ.";
    }
    return { hanhVan: hanhVan, hanhHuong: hanhHuong, loai: loai, nhan: nhan, moTa: moTa };
  }

  // ==================================================================
  // 7) LIÊN CHÂU TAM BAN (連珠三般) — tại 1 cung, Vận-Sơn-Hướng tạo thành
  // BỘ BA SỐ LIÊN TIẾP theo vòng tròn Lạc Thư 1..9 (có nối vòng 9→1):
  //   1-2-3, 2-3-4, 3-4-5, 4-5-6, 5-6-7, 6-7-8, 7-8-9, 8-9-1, 9-1-2.
  // Khác với Tam Ban Quái (3 số CÙNG NHÓM 1-4-7/2-5-8/3-6-9), Liên Châu xét
  // 3 số LIÊN TỤC nhau bất kể thứ tự Vận/Sơn/Hướng tại cung đó.
  //
  // Quy tắc cát/hung (đã chốt với người dùng):
  //  - Toàn bộ 9 cung đều Liên Châu -> đại cách "mây xanh thênh thang".
  //  - Cung có Sơn tinh hoặc Hướng tinh là vượng khí (= đúng Vận) thì phát
  //    triển bền vững hơn.
  //  - Nếu bộ ba chạm sao hung (có mặt số 2 hoặc số 5) hoặc là tổ hợp xấu
  //    kinh điển 5-6-7 (hỏa hoạn, kiện tụng) thì vẫn ghi nhận là Liên Châu
  //    về mặt cấu trúc số, NHƯNG phải nêu rõ mặt hung riêng — không gộp
  //    chung một kết luận cát. Cần thêm Loan Đầu mới luận chính xác.
  //
  // xetLienChauTamBanMotCung(v, s, h, van):
  //   v, s, h : số Vận tinh, Sơn tinh, Hướng tinh tại cung đang xét
  //   van     : Vận đang xét (để đánh dấu vượng khí, có thể bỏ qua = undefined)
  // Trả về null nếu không phải Liên Châu; nếu có, trả về object:
  //   { chuoi: "4-5-6", boSo: [4,5,6], camSaoHung: true/false,
  //     laToHopXau567: true/false, sonVuong: bool, huongVuong: bool }
  // ==================================================================
  var BO_BA_LIEN_CHAU = ["1-2-3","2-3-4","3-4-5","4-5-6","5-6-7","6-7-8","7-8-9","8-9-1","9-1-2"];
  function xetLienChauTamBanMotCung(v, s, h, van) {
    if (v == null || s == null || h == null) return null;
    var boSoGoc = [v, s, h];
    var boSoSet = boSoGoc.slice().sort(function (a, b) { return a - b; }).join(",");
    var match = null;
    for (var i = 0; i < BO_BA_LIEN_CHAU.length; i++) {
      var boChuan = BO_BA_LIEN_CHAU[i].split("-").map(Number).sort(function (a, b) { return a - b; }).join(",");
      if (boChuan === boSoSet) { match = BO_BA_LIEN_CHAU[i]; break; }
    }
    if (!match) return null;

    var camSaoHung = boSoGoc.indexOf(2) !== -1 || boSoGoc.indexOf(5) !== -1;
    var laToHopXau567 = match === "5-6-7";
    var sonVuong = (van != null) && (s === van);
    var huongVuong = (van != null) && (h === van);

    return {
      chuoi: match,
      boSo: boSoGoc,
      camSaoHung: camSaoHung,
      laToHopXau567: laToHopXau567,
      sonVuong: sonVuong,
      huongVuong: huongVuong
    };
  }

  // Xét toàn cục 9 cung: trả về { soCung: number 0-9, chiTiet: [{so, ten, ketQua}],
  // duTron9Cung: bool } — không tự kết luận cát/hung, để nơi gọi tự trình bày
  // theo đúng yêu cầu "hiển thị cả hai khía cạnh cát/hung tách biệt".
  function xetLienChauTamBanToanCuc(bVan, bSon, bHuong, van, soToCung) {
    var chiTiet = [];
    for (var i = 1; i <= 9; i++) {
      var kq = xetLienChauTamBanMotCung(bVan[i], bSon[i], bHuong[i], van);
      if (kq) {
        chiTiet.push({ so: i, ten: (soToCung && soToCung[i]) || i, ketQua: kq });
      }
    }
    return { soCung: chiTiet.length, chiTiet: chiTiet, duTron9Cung: chiTiet.length === 9 };
  }

  // ==================================================================
  // EXPORT
  // ==================================================================
  window.xetQuanHeNguHanh = xetQuanHeNguHanh;
  window.xetHopThap = xetHopThap;
  window.xetPhanPhucNgamMotSao = xetPhanPhucNgamMotSao;
  window.xetVuongSuyCachCuc = xetVuongSuyCachCuc;
  window.xetToHopSonHuong = xetToHopSonHuong;
  window.xetChanKhiHaDo = xetChanKhiHaDo;
  window.xetLienChauTamBanMotCung = xetLienChauTamBanMotCung;
  window.xetLienChauTamBanToanCuc = xetLienChauTamBanToanCuc;

})();
