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
  // QUAN HỆ 2 SAO SƠN-HƯỚNG TẠI MỖI CUNG (81 tổ hợp, nguồn: tài liệu
  // "Luận 2 sao Sơn - Hướng", Thẩm Thị Huyền Không Học) — mỗi cung có
  // Sơn tinh (S) và Hướng tinh (H) riêng, ghép thành 1 trong 64 quẻ Dịch
  // (Hướng tinh là quẻ NGOẠI/trên vì luận Hướng thì Hướng đặt trước, Sơn
  // là quẻ NỘI/dưới — đúng theo nguyên tắc gốc: "khi luận bàn về hướng
  // thì hướng tinh ở trước... khi luận bàn về sơn, sơn tinh ở trước").
  // Key tra cứu: "H-S" (H = Hướng tinh, S = Sơn tinh tại CÙNG 1 cung).
  // Ví dụ: Sơn=4, Hướng=3 -> tra "3-4" -> "Lôi Phong Hằng".
  // ==================================================================
  var QUAN_HE_SON_HUONG_MOI_CUNG = {
    "1-1": {ten:"Khảm Vi Thuỷ",sinhVuong:"Sinh con thông minh, túc trí đa mưu, thi cử đỗ đạt, nổi tiếng khắp nơi. Hai Thuỷ tỷ hoà, tiền của dư dật, sự nghiệp phát đạt phát tài ngoài luồng, khởi nghiệp bằng nghề buôn muối và cá. Đầu năm thuận lợi, nhưng dương thịnh âm suy, đề phòng phụ nữ chết trẻ, lâu thì nhân khẩu giảm.",khacSat:"Mắc bệnh tim, đau tai, bệnh về máu, thận và bệnh về hệ thống tiết niệu, bệnh sa nang, di tinh, băng huyết, đào hoa, có thói trăng hoa, phạm tội trộm cắp, là dân giang hồ. Nếu hình thế của núi và dòng nước xấu thì chủ thiếu nam chết chìm hoặc thắt cổ chết; nếu hình thế của núi và dòng nước rời rạc thì chủ người trẻ (thiếu niên) đồng tính luyến ái."},
    "1-2": {ten:"Thuỷ Địa Tỷ",sinhVuong:"Nhân khẩu đông đúc, thích hợp với công việc trong khách sạn, quán trà. Công việc đóng áng thuận lợi, công bằng chính trực, kiên trì với điều thiện, phát minh sáng tạo cái mới.",khacSat:"Bị mất nước, báng nước, bệnh dạ dày, xuất huyết dạ dày, viêm lá lách, nhiễm trùng máu, thiếu máu, tiểu đường, bệnh scorbut (bệnh về máu do thiếu vitamin C trong thức ăn), mất máu vùng bụng, viêm ruột thừa, cổ họng sưng đau, liệt dương, người trẻ hay bệnh tật, bệnh phụ khoa, phụ nữ đổ máu bị sát hại. Khắc thứ nam hoặc trung nam, làm suy giảm nhân đinh trong nhà. Mẹ con bất hoà, trung nam bị phụ nữ làm nhục, chủ người trẻ bị người đã có chồng lôi cuốn. Nếu có núi cao thì không có lợi cho mệnh Khảm."},
    "1-3": {ten:"Thủy Lôi Truân",sinhVuong:"Phải trải qua nhiều gian khổ, tay không gây dựng sự nghiệp. Lợi cho con cháu chi trưởng, giàu có vinh hiển. Thi cử đỗ đạt, gia đình hoà thuận. Thuỷ Mộc tương sinh, có tài thao lược.",khacSat:"Chủ mắc bệnh gan, bệnh về chân, phù thũng, đau chân, khó sinh, hoa mắt, bệnh thận, trướng bụng. Thanh niên bị chết đuối, nếu gặp Khách tinh Thất Xích đề phòng bị rắn cắn, chó cắn và bị sét đánh. Nếu gặp Khách tinh Thất Xích bay tới mà lại phạm thế Xuyên sơn sát là điềm báo nhà tan người mất. Lâm vào hoàn cảnh khó khăn, ít con nối dõi, tranh chấp, cãi cọ, hao tổn sinh khí, kiện tụng, trộm cắp, hao tài tốn của. Nếu hình thế của dòng nước xấu thì chủ thanh niên gặp vận hạn, nếu hình thế của núi xấu thì chủ người trẻ bị sét đánh."},
    "1-4": {ten:"Thủy Phong Tỉnh",sinhVuong:"Thi cử đỗ đạt, có tiếng tăm. Vợ bé sinh quỷ tử, giỏi văn chương thi hoạ, là danh sĩ phong lưu, chấp pháp nghiêm minh, trong sạch liêm khiết. Người này thích hợp làm trong công ty con của tập đoàn tài chính, thuận lợi trong giao dịch trên giấy tờ, khế ước. Đi xa gặp thuận lợi, được tăng lương và thăng quan tiến chức.",khacSat:"Chủ bệnh phong thấp, bệnh ở vú, vú chảy máu, xuất huyết khí quản, bệnh về gan và mật, tinh thần không ổn định. Đam mê tửu sắc, nam nữ dâm loạn, phạm tội bị truy nã. Nếu Nhất Bạch suy, Mộc tiết làm yếu Thuỷ thì chủ chị dâu em chồng dan díu với nhau. Nếu hình thế dòng nước xấu thì chủ phụ nữ trẻ chết đuối. Nếu hình thế của núi xấu thì chủ người trẻ gặp hạn, nếu hình thế của nước dâm thì chủ người trẻ yêu phụ nữ đã có chồng, chị gái em trai hoặc chị dâu em chồng loạn luân (nam chủ động). Nếu là người nắm quyền thì chủ tham ô hối lộ mà phạm pháp."},
    "1-5": {ten:"Không Quẻ (Nhất Ngũ)",sinhVuong:"Thi cử đỗ đầu, thường sinh con trai thông minh tài giỏi, tăng nhân khẩu. Thích hợp làm chuyên gia thuỷ lợi, nhà phát minh.",khacSat:"Chủ mắc bệnh ung thư (máu và tử cung), nhiễm trùng máu, bệnh thận, tăng urê huyết (viêm cầu thận), chứng mất nước, trường toan (nước chua) trong dạ dày không đủ, thận trúng độc, thiếu máu, bệnh giun móc, ngộ độc thai nghén, ngộ độc máu, ngộ độc rượu, xuất huyết dạ dày, bệnh truyền nhiễm qua đường tình dục, đau rát âm hộ, sỏi thận, phù thũng, vô sinh, sảy thai, nghiện hút, buôn bán ma tuý. Nếu hình thế núi xấu thì chủ người trẻ chết thảm, trung nam ngỗ nghịch."},
    "1-6": {ten:"Thủy Thiên Nhu",sinhVuong:"Chủ thi cử đỗ đạt mang lại tiếng tăm, đến tuổi trung niên làm giàu một cách nhanh chóng, phát về nghiệp võ, thích hợp làm giáo viên và trợ lý, chủ sống lâu, mọi việc thuận lợi, thường ứng nghiệm với lưu niên 2 và 8.",khacSat:"Xuất huyết não, đần độn, thương hàn, chấn thương sọ não, xung huyết não, xuất huyết từ xương, tràn dịch màng phổi, sa dạ con, sa tinh hoàn, sa nang, sỏi thận, bệnh về thận. Cha con bất hoà, trộm cắp phạm pháp, hoang dâm vô độ, cần đề phòng bị chết đuối hoặc sống lưu lạc. Nếu hình thể của dòng nước xấu thì chủ người già gặp hạn, người trẻ bị thương do dao."},
    "1-7": {ten:"Thủy Trạch Tiết",sinhVuong:"Nắm quyền, biết cách quản lý tài chính, là người khéo ăn khéo nói. Xuất hành thuận lợi, nam liêm khiết nữ chung thuỷ.",khacSat:"Chủ mắc bệnh phổi, phổi chảy máu, bé gái mắc bệnh thận, bệnh về tai, chứng câm điếc, thổ huyết đàm suyễn, di tinh, sảy thai, chó cắn, nhiễm trùng do rắn cắn. Đam mê tửu sắc, người nhà ly tán, nam nữ dâm loạn, người trẻ bị tử hình, phụ nữ trung nam cãi cọ, trung nam lừa gạt thiếu nữ, keo kiệt độc ác, trộm cắp giết người. Nếu hình thế dòng nước xấu thì chủ bé gái bị chết chìm. Nếu hình thế núi xấu thì chủ thiếu niên bị đâm chết."},
    "1-8": {ten:"Thủy Sơn Kiển",sinhVuong:"Có tài văn chương, học thức uyên bác. Khi biết lỗi thì biết hối cải, biết tự kiểm điểm mình, gặp hung hóa cát. Công bằng chính trực, tài đức vẹn toàn. Thích hợp với những công việc gian khổ như khai thác mỏ, công trình thuỷ lợi.",khacSat:"Chủ mắc bệnh thận, sỏi thận, sỏi bàng quang, bệnh về mũi, thiếu máu, nhiễm trùng máu, trường toan quá ít, bệnh về tai, sỏi đường tiết niệu, tắc ống dẫn trứng, sỏi tử cung, người trẻ bị tâm thần, ngã xuống vực, chứng mất nước, đau lưng, tay bị thương, bị thương do thú vật vồ, sảy thai, kiết lỵ, trẻ nhỏ bị u, vẹo cột sống, trung nam lâm bệnh mà chết. Anh em bất hoà, khắc trung nam, phạm tội phải ngồi tù, vợ chồng ly dị. Nếu hình thế dòng nước xấu thì chủ bé trai chết chìm. Nếu hình thế núi xấu thì chủ người trẻ bị rơi xuống vực hoặc bị chó dại cắn, em giết anh. Nếu có núi cao là Dụng thần thì không có lợi cho mệnh Khảm."},
    "1-9": {ten:"Thuỷ Hoả Ký Tế",sinhVuong:"Thuỷ Hoả Ký Tế, chủ vượng cả đinh lẫn tài. Âm dương cân bằng, giàu sang phú quý, công thành danh toại, vợ chồng hạnh phúc. Đức cao vọng trọng, tài cao học rộng. Tu tâm dưỡng tính, thay da đổi thịt, phúc trạch bền lâu.",khacSat:"Bệnh truyền nhiễm qua đường tình dục, bệnh da liễu, bệnh tim, bệnh thận, mù, bệnh về mắt, hay bị ám ảnh, sa nang, sảy thai. Vợ chồng bất hoà, ly dị, kiện tụng, trung nữ đoản mệnh. Phạm thượng làm loạn, bị trùng tang. Thuỷ hoả tai hoạ, kiện cáo triền miên. Thuỷ Hoả không dung hoà, hay làm điều trái khoáy. Nếu hình thế của dòng nước dâm thì chủ nam nữ dâm loạn."},
    "2-1": {ten:"Địa Thuỷ Sư",sinhVuong:"Chủ về sinh con, là nhân tài có khả năng lãnh đạo trong các ngành nghề. Biết trọng dụng người có tài, thành công nhờ quần chúng. Phát về ruộng đất hoa màu, có tài phát minh sáng chế.",khacSat:"Bệnh phụ khoa, bệnh dạ dày, bệnh tiểu đường, bệnh về cơ quan sinh dục, bệnh thận, sảy thai. Không có lợi cho trung nam, trung nam bị vô sinh. Ruộng đất của cải bị mất, tranh cãi về đất đai. Gặp tai hoạ bất ngờ, chiến tranh, tiểu nhân, trộm cắp, xã hội đen."},
    "2-2": {ten:"Khôn Vi Địa",sinhVuong:"Phát về ruộng đất của cải dư dật. Phát về nghiệp võ, hoặc gây dựng sự nghiệp bằng nghề kinh doanh kim khí, đất đai. Có tài nhưng thành đạt muộn, mẹ hiền từ, nhiều vốn liếng, có giáo dục. Tăng nhân khẩu, trong nhà có người là lương y. Nhưng sinh ra nhiều góa phụ làm nên cơ nghiệp.",khacSat:"Bệnh về ruột và dạ dày, bệnh phụ khoa, đần độn, câm điếc. Phạm pháp và phải chịu hình phạt, hám của, vô đạo đức, dốt nát mê muội, thuộc lớp người thấp hèn. Vợ đoạt quyền chồng, khó sinh, sảy thai. Thường có goá phụ, bị tà khí xâm nhập, phụ nữ mắc chứng cuồng dâm."},
    "2-3": {ten:"Địa Lôi Phục",sinhVuong:"Biết hối cải và hướng thiện, biết tu tâm dưỡng tính. Sống đúng với bản chất, luân hồi đầu thai, thai nghén tái sinh. Tích cực tiến thủ, biết đứng dậy sau khi vấp ngã. Biết phân biệt rõ đúng sai, tốt xấu.",khacSat:"Bệnh về chân, bệnh về dạ dày, chứng co giật, khớp gặp vấn đề, bệnh tình xấu đi hoặc bị tường đè làm bị thương. Con trưởng không nghe lời mẹ, nhà cửa không yên, người mẹ gặp tai hoạ, mẹ hiền con hư, mẹ ác con ác. Vì tham lam nên bị hại, cãi cọ, điều tiếng thị phi, thắt cổ tự tử, vì gia sản mà nhà cửa tan hoang, kiện tụng, phải chịu hình phạt, phụ nữ chết thảm, thanh niên hay ốm đau bệnh tật, trưởng nam treo cổ tự vẫn. Nếu hình thế dòng nước xấu thì chủ thanh niên bị siết cổ chết. Nếu hình thế núi xấu thì phụ nữ bị sét đánh, con giết mẹ, thanh niên loạn luân. Nếu có núi cao là Dụng thần thì không có lợi cho người mệnh Khôn."},
    "2-4": {ten:"Địa Phong Thăng",sinhVuong:"Thích hợp làm nghề kinh doanh bất động sản, năng nhặt chặt bị, vượng tài. Trúng thưởng, thăng chức, hơn hẳn mọi người, nâng cao chất lượng cuộc sống. Mẹ hiền, vợ đảm, con gái xinh đẹp, phụ nữ sang trọng.",khacSat:"Chủ mắc bệnh phong, hao tổn sinh khí, bệnh về bắp đùi, bệnh về mật, bệnh về vú, bệnh dạ dày, trúng gió, gặp vấn đề khi sinh. Trong nhà người mẹ hay buồn rầu, phụ nữ treo cổ tự vẫn, tranh chấp đất đai, vì tham lam mà mất của, mẹ chồng con dâu bất hoà, đàn ông sống không thọ. Bị trúng kế mắc lừa, bị rơi vào cạm bẫy. Nếu hình thế dòng nước xấu thì chủ về phụ nữ có chồng thắt cổ tự tử. Nếu hình thế núi xấu thì chủ về con gái nhục mạ mẹ, con dâu lừa gạt mẹ chồng. Nếu có núi cao là Dụng thần thì không có lợi cho người mệnh Khôn."},
    "2-5": {ten:"Không Quẻ (Nhị Ngũ)",sinhVuong:"Tăng nhân khẩu, phát về ruộng đất của cải, trong nhà có người làm ngành pháp luật, phát về nghiệp võ, lợi cho nghề y, mở hiệu thuốc hoặc nghề mai táng. Nếu làm nghề y thì trong nhà sẽ có người là bác sỹ nổi tiếng.",khacSat:"Chủ về ốm đau bệnh tật, bệnh ung thư (dạ dày, đại tràng, thực quản, da), bệnh dạ dày, viêm loét dạ dày, da lở loét, ngộ độc, nghiện hút, mụn nhọt, bệnh giun móc, sảy thai, đẻ non. Nhị Ngũ giao nhau tất sẽ tổn thương đến chủ nhân, cẫn đến cảnh mẹ góa con côi. Vợ chồng xích mích, hay gặp rủi ro, tranh chấp đất đai."},
    "2-6": {ten:"Địa Thiên Thái",sinhVuong:"Chủ về làm giàu nhỏ, kinh doanh đất cát, đầu tư ít nhưng kiếm được nhiều, trong nhà người mẹ luôn khoẻ mạnh. Tinh thần thoải mái, vinh hoa phú quý. Cấp dưới trung thành, phò tá cấp trên, là người có lương tâm. Vượng gia đình lẫn tài, luôn tràn đầy sức sống.",khacSat:"Chủ mắc bệnh dạ dày, sa dạ dày, sỏi thận, bệnh phổi, bệnh đại tràng, phụ nữ đau đầu, sưng lá lách, lúc nóng lúc lạnh, tinh thần bất định, tà khí xâm nhập. Vợ chồng xích mích, người già gặp tai nạn đổ máu, thắt cổ tự vẫn, keo kiệt bủn xỉn, địa vị thấp hèn."},
    "2-7": {ten:"Địa Trạch Lâm",sinhVuong:"Làm giàu nhanh chóng, trở thành tỷ phú. Mở rộng đất đai, dùng tiền bạc để sinh lời. Tăng nhân khẩu, thường sinh con gái, sinh quý tử. Trong nhà có người làm trong ngành y hoặc pháp luật, kiến thức uyên bác, hay làm điều thiện.",khacSat:"Chủ mắc bệnh dạ dày, bệnh đại tràng, bệnh phổi, bệnh vòm họng, bé gái mắc dịch tả, kiết lị, đau vai, sảy thai. Vì thói trăng hoa mà mất của. Hai chồng khác con, kiện tụng, gặp tai họa bất ngờ. Con dâu út tinh tinh ngỗ nghịch, hay cãi cọ với nhà mẹ đẻ. Trong nhà người mẹ hay buồn phiền, tranh chấp đất đai. Gặp tai nạn về lửa, phụ nữ cuồng dâm. Nếu hình thế dòng nước xấu thì tổn thương đến bé gái. Nếu hình thế núi xấu thì tổn thương đến phụ nữ."},
    "2-8": {ten:"Địa Sơn Khiêm",sinhVuong:"Làm giàu nhỏ nhờ đất đai, thích hợp với nghề kinh doanh bất động sản. Kính trọng người già, trong nhà có người hiền tài, sống hoà đồng, hiểu biết rộng, biết mềm nắn rắn buông, có lợi từ di chuyển.",khacSat:"Chủ mắc bệnh dạ dày, bệnh về ổ bụng, bệnh da liễu, bệnh về ngón tay, bệnh cột sống, bệnh thần kinh, bệnh về gân cốt, bệnh kết sỏi. Thiếu nam tính, tinh thần ngỗ nghịch, trong nhà người mẹ hay u sầu phiền muộn. Thành công ít thất bại nhiều, tranh chấp đất đai của cải, có nhiều quả phụ. Nếu hình thế dòng nước xấu thì tổn thương đến bé trai. Nếu hình thế núi xấu thì bị chó dại cắn, phụ nữ bị chết."},
    "2-9": {ten:"Địa Hỏa Minh Di",sinhVuong:"Tăng nhân khẩu, trong nhà có người có danh (có tiếng tăm). Đất đai mở rộng, của cải dư dật. Có tài văn chương, thi cử thuận lợi. Như viên ngọc vùi trong cát có lợi lộc có công danh. Nhẫn nhục chịu đựng, quả phụ làm nên sự nghiệp. Nếu gặp vận 2 thì của cải dùng không hết.",khacSat:"Chủ mắc bệnh dạ dày, bệnh về máu, xuất huyết dạ dày, viêm dạ dày, viêm ruột thừa, bị tai nạn đổ máu, bệnh nhiệt, bệnh về mắt, bệnh tim, gặp rắc rối khi sinh nở, dạ dày tích nhiệt, viêm da, mất máu vùng bụng, cắt tử cung. Trong nhà người mẹ hay lo buồn, tranh chấp đất đai của cải, kiện tụng. Chống đối, đần độn, ít con, giảm nhân khẩu. Phạm tội giết người, sống dâm loạn, mất của. Nếu hình thế dòng nước xấu thì làm hại đến thiếu nữ. Nếu hình thế núi xấu thì phụ nữ gặp hạn."},
    "3-1": {ten:"Lôi Thủy Giải",sinhVuong:"Thủy Mộc tương sinh, gia đình hoà thuận, chủ về phú quý. Sinh con phát tài, thi cử thuận lợi. Phạm tội được giảm án, mãn hạn tù, chịu hình phạt lại được trọng dụng. Biết cách hoà giải tranh chấp, được gặp gỡ người quyền quý.",khacSat:"Kiện tụng, khắc mẹ, tổn thương dạ dày, gia đình ly tán, con trưởng đi khỏi nhà, tổn hại đến phụ nữ, ít con cháu. Tranh cãi, kích động, hao của."},
    "3-2": {ten:"Lôi Địa Dự",sinhVuong:"Đắc tài, thành danh, thích hợp với những nơi như khách sạn, thương trường. An cư lạc nghiệp, thay da đổi thịt, tu tâm dưỡng tính, sống chân thật, lương thiện.",khacSat:"Chủ về dạ dày bị tổn thương, sắc mặt vàng vọt. Đầu Ngũ sát, chủ về kiện tụng, khắc mẹ, tai họa bất ngờ giáng xuống đầu, kích động, hao tài tốn của, tranh chấp đất đai tài sản. Trưởng nam chống lại mẹ, điều tiếng thị phi, trước ảnh hưởng đến người mẹ, sau ảnh hưởng đến chi trưởng."},
    "3-3": {ten:"Chấn Vi Lôi",sinhVuong:"Tài lộc dồi dào, có thể sáng lập sự nghiệp gây dựng cơ đồ. Lợi về đường công danh, lợi cho chi trưởng. Thi cử thuận lợi, luôn là người đứng đầu.",khacSat:"Chủ mắc bệnh gan, tai nạn đổ máu, đau chân, bệnh tâm thần, chứng hoang tưởng. Kiện tụng, tranh chấp, phạm tội giết người, phụ nữ chết yểu, trẻ con khó nuôi, trong nhà có người đần độn. Dâm loạn, chi trưởng bị phạt đánh bằng trượng. Động đất, côn trùng cắn, ngã bị thương, hao tốn tiền của. Nếu hình thế núi hoặc dòng nước xấu thì chủ thanh niên bị sét đánh. Nếu hình thế núi hoặc dòng nước đâm thì chủ nam giới dâm loạn."},
    "3-4": {ten:"Lôi Phong Hằng",sinhVuong:"Chủ phú quý, lợi về đường công danh, gia đinh hoà thuận, sinh sôi, vợ chồng đồng tâm hiệp lực. Trăm sự thuận lợi, giữ vững lập trường. Nam lấy được vợ sang trọng, sống hạnh phúc đến già, luôn thích ứng trong mọi hoàn cảnh. Bền bỉ, đức hạnh, sống có đạo lý.",khacSat:"Chủ mắc bệnh gan, đau chân, chân bị thương, bệnh về bắp đùi, bệnh về vú, bệnh phong, hao tổn sinh khí, gặp rắc rối khi sinh nở. Treo cổ tự vẫn, không hiểu lý lẽ, làm việc tùy tiện, đam mê tửu sắc, trong nhà có người theo nghề trộm cắp, ăn xin. Chi trưởng có tiếng tăm không tốt, tốt xấu lẫn lộn, vong ân bội nghĩa, luôn dựa dẫm người khác, công việc không ổn định. Nếu hình thế dòng nước xấu thì tổn hại đến phụ nữ đã có chồng, hoặc vợ chồng trẻ xích mích. Nếu hình thế núi xấu thì chủ vợ hại chồng. Nếu hình thế núi dâm thì chủ nam nữ dâm loạn."},
    "3-5": {ten:"Không Quẻ (Tam Ngũ)",sinhVuong:"Tài lộc dồi dào, gây dựng cơ nghiệp, chồng giàu sang phú quý, trong nhà có người làm quan lớn, góp công xây dựng đất nước, thành lập doanh nghiệp tư nhân, lợi cho ngành nông lâm, chi trưởng giàu sang phú quý.",khacSat:"Chủ mắc bệnh gan, ung thư gan, chân lở loét, nghiện hút, bị rắn cắn, bệnh dịch, nếu Tam, Tứ gặp nhau thì chủ bị trúng gió, ngã bị thương, sưng bầm, tai nạn xe cộ, bệnh phong, ham cờ bạc làm khuynh gia bại sản. Gặp tai họa bất ngờ, kiện tụng triền miên, động đất, sét đánh. Nếu hình thế núi xấu thì chủ thanh niên bị hạ độc mà chết. Nếu có dòng nước lớn là Dụng thần thì lợi cho cung Ngũ."},
    "3-6": {ten:"Lôi Thiên Đại Tráng",sinhVuong:"Lợi cho chi trưởng, được cấp trên đề bạt. Thích hợp làm kiến trúc sư, danh lợi song toàn. Thành đạt vào độ tuổi trung niên, sau khi thành đạt thì ẩn mình, công bằng chính trực, hay làm việc thiện.",khacSat:"Chủ mắc bệnh gan, bệnh não, bệnh về chân, đau bắp chân, ngã bị thương, ngã chết, bị tai nạn đổ máu, tai nạn xe cộ, bị thương do dao, chấn thương sọ não, kết sỏi gan, xơ gan. Trộm cắp, giết người, bị sét đánh, tổn thương đến trưởng nam, ngã ngựa, gãy chân. Kiện tụng, phải ngồi tù, điều tiếng thị phi, thích đao to búa lớn, thích khoe sức khoe tài, không biết điểm dừng. Nếu hình thế dòng nước xấu thì chủ xà nhà rơi trúng người cha. Nếu hình thế núi xấu thì chủ thanh niên bị thương, cha giết con. Nếu hình thế núi dâm thì chủ người cha có tụ tinh. Nếu có núi cao là Dụng thần thì không có lợi cho người mệnh Càn."},
    "3-7": {ten:"Lôi Trạch Quy Muội",sinhVuong:"Tăng nhân khẩu, thêm tiền tài, thích hợp với ngành nghề dịch vụ. Nữ lấy được chồng quý, danh lợi song toàn.",khacSat:"Chủ mắc bệnh gan, bệnh vòm họng, đau chân, bệnh đại tràng, ngã bị thương, ngã bị chết, thổ huyết, bị tai nạn đổ máu. Tai nạn xe cộ, Xuy Vưu sát, kiện tụng, giết người, trộm cướp, tính tình hung bạo, chuyên gây rắc rối, điều tiếng thị phi, nam trộm cắp, nữ làm gái nhà hàng, ma quỷ vào nhà, con cháu không có hiếu. Nếu hình thế dòng nước xấu thì chủ bé gái bị xe cán. Nếu hình thế núi xấu thì chủ thanh niên gặp hạn. Nếu hình thế núi dâm thì chủ gia đình loạn luân. Nếu có núi cao là Dụng thần thì không có lợi cho người mệnh Chấn."},
    "3-8": {ten:"Lôi Sơn Tiểu Quá",sinhVuong:"Con cái trong nhà thông minh, có tài văn chương, đông con nhiều cháu. Lợi cho việc xây dựng, trồng cây, làm rừng, phát về ruộng đất. Được anh em, bạn bè tôn trọng, thật thà chất phác, trung hiếu.",khacSat:"Chủ mắc bệnh dạ dày, bệnh về ngón tay, bệnh cột sống, bệnh về gân cốt, bệnh về xương, bệnh về cánh tay, bệnh thần kinh, kết sỏi, gan kết sỏi, da mặt vàng, trướng bụng, chán ăn, thở khò khè, đẻ non. Tổn hại đến bé trai, tổn hại đến nhân khẩu, mất mát tiền của, nhảy lầu ngã chết, bị ngã tổn thương vùng đầu, chân tay đều có bệnh, bàn chân và bàn tay dị dạng, không có chân tay, không có tứ chi, trượt chân ngã xuống vách núi. Anh em bất hoà, không có lợi cho trẻ em trong nhà, mất mát tiền của. Nếu hình thế dòng nước xấu thì chủ bị chó dại cắn. Nếu hình thế dòng nước dâm thì chủ thanh niên dâm loạn. Nếu có dòng nước lớn là Dụng thần thì không có lợi cho người thuộc cung 8."},
    "3-9": {ten:"Lôi Hỏa Phong",sinhVuong:"Sinh con thông minh, phú quý song toàn. Mộc Hỏa sáng láng, tài năng xuất chúng. Phát về đất đai, của cải dư dật, phụ nữ gây dựng cơ đồ. Thi cử thuận lợi, thăng quan tiến chức, làm rạng danh gia đình.",khacSat:"Chủ mắc bệnh gan, bệnh về bàn chân và bắp chân, bệnh về mắt, bệnh về máu, ung thư máu, chứng viêm, bệnh nhiệt, bị bỏng, bị lửa thiêu, gặp rắc rối khi sinh nở, cảm nắng, bệnh tim. Bị vật nổ gây thương tích, hao tổn nhân khẩu, keo kiệt, mất mát tiền của. Phụ nữ đắc tội với anh chồng, nam trộm cắp, nữ làm gái nhà hàng. Nếu hình thế núi xấu thì chủ hỏa hoạn gây thương tích. Nếu hình thế dòng nước xấu thì chủ gia đình loạn luân."},
    "4-1": {ten:"Phong Thủy Hoán",sinhVuong:"Con cái thi cử đỗ đạt, thành danh, có tài văn chương, con gái xinh đẹp, lấy chồng giàu sang phú quý. Tài vận tốt, tuổi thọ cao. Lợi xuất hành, thích hợp đến nơi khác để mưu cầu danh lợi.",khacSat:"Mắc bệnh thận, gan, thiếu máu. Phụ nữ sống buông thả, phóng đãng, nếu có núi mà không có dòng chảy thì chủ vợ bé sinh con. Dâu trưởng thông dâm với em chồng. Có mâu thuẫn, thành công ít thất bại nhiều, tiến thoái lưỡng nan. Hợp lâu ắt sẽ tan, sa vào cuộc sống giang hồ."},
    "4-2": {ten:"Phong Địa Quán",sinhVuong:"Có người là doanh nhân, kiến thức uyên bác, thích hợp phát triển ngành nông nghiệp, du lịch, thầy địa lý.",khacSat:"Đau gan, trướng bụng, bệnh giun móc, phụ nữ khó sinh, lao lực, sưng lá lách, hao tổn nhân đinh, mất mát tiền của, kiện tụng, tranh chấp, có tang, mất người mất của, tai họa tới tấp, trong nhà có người phụ nữ lừa gạt mẹ chồng, hoặc con gái sỉ nhục mẹ."},
    "4-3": {ten:"Phong Lôi Ích",sinhVuong:"Vượng cả đinh lẫn tài, phú quý song toàn. Lợi về nghiệp văn chương, đầu tư sinh lời. Phát triển ngành nông lâm, được người phụ nữ sang trọng giúp đỡ. Gặp người hiền tài khiến mình phải suy ngẫm lại và nên làm việc thiện, thăng quan tiến chức, công thành danh toại.",khacSat:"Dễ mắc bệnh gan, thiếu nữ bị điên. Không hiểu lý lẽ, làm việc tùy tiện. Con gái cả gây gổ với chồng, sống phóng đãng, bại hoại gia phong. Làm tan nát nhà cửa, ảnh hưởng nhất đối với chi giữa, phụ nữ đoạt quyền chồng, làm giả giấy tờ, làm điều mờ ám, thường có người đi trộm cắp, ăn xin."},
    "4-4": {ten:"Tốn Vi Phong",sinhVuong:"Lợi về nghiệp văn chương, có nhiều danh vọng, thi cử thuận lợi. Sinh con gái xinh đẹp, lấy chồng giàu sang, cũng vượng cả đinh lẫn tài. Sự nghiệp văn chương phát triển, tài tử giai nhân, lợi xuất hành.",khacSat:"Chủ mắc bệnh về vú, bệnh về bắp đùi, bệnh phong thấp, gặp rắc rối khi sinh nở, hen suyễn, ho. Con gái cả gây gổ với chồng, chi trưởng có tiếng xấu, mất chồng, giảm nhân khẩu, có người sống phóng đãng. Buông thả phá tài, đàn ông không thọ. Dùng sắc đẹp để mê hoặc lòng người, không biết hổ thẹn. Nếu hình thế núi và dòng nước dâm thì chủ phụ nữ đồng tính luyến ái. Nếu hình thế núi hoặc dòng nước xấu thì chủ phụ nữ trẻ mất mạng."},
    "4-5": {ten:"Không Quẻ (Tứ Ngũ)",sinhVuong:"Có người giỏi văn chương, là người phụ nữ thành đạt, là công nhân giỏi, là người thợ khéo, có tiếng tăm và khí phách, sự nghiệp phát triển thuận lợi.",khacSat:"Chủ mắc bệnh ung thư vú, ung thư gan, bệnh về vú, bệnh về mặt, bệnh phong, hao tổn sinh khí, gặp rắc rối khi sinh nở, mụn nhọt, thiếu phụ mắc bệnh do khí độc xâm nhập, viêm gan, bệnh dịch, bệnh dạ dày, bệnh điên, chứng nhiễm trùng huyết. Gặp tai họa chết chóc, buôn lậu ma túy, cờ bạc đầu cơ trục lợi, phá sản, mất của, sống phóng đãng, thân bại danh liệt. Nếu hình thế núi và dòng chảy dâm thì chủ thiếu phụ mất mạng. Nếu có dòng chảy lớn là Dụng thần thì không có lợi cho người thuộc cung Ngũ."},
    "4-6": {ten:"Phong Thiên Tiểu Súc",sinhVuong:"Danh lợi song toàn, thăng quan tiến chức, gặp nhiều cơ hội, cạnh tranh đắc thắng. Nên phát triển ngành nông nghiệp và chăn nuôi, đầu tư ít thu lợi nhiều. Có tài văn nghệ, con gái cả nắm quyền, lấy chồng giàu sang, chuyện phiền hà có nhưng rồi lại hết.",khacSat:"Chủ mắc bệnh về mặt, bệnh phổi, bệnh ở vú, chứng đờm, hao tổn sinh khí, trúng gió, sảy thai, bệnh về bắp đùi, bệnh về đầu và mặt, bệnh não, bệnh đại tràng, sỏi mật, sưng phổi, sa dạ dày, gân cốt nhức mỏi, xơ gan. Đề phòng tự vẫn, tổn hại đến trưởng nữ, vất vả, người nhà ly tán, kiện tụng, trộm cắp, thiếu phụ phạm tội giết người. Nếu hình thế dòng nước xấu thì chủ người già chết. Nếu hình thế núi xấu thì chủ thiếu phụ mất mạng. Nếu có núi cao là Dụng thần thì không có lợi cho người mệnh Tốn, thuộc cung Tứ Lục."},
    "4-7": {ten:"Phong Trạch Trung Phu",sinhVuong:"Là người có tướng mạo xinh đẹp, là người nắm quyền, thành thật, có uy tín, thẳng thắn vô tư.",khacSat:"Mắc bệnh về mặt, bệnh phổi, bệnh về vú, sưng phổi, bệnh về bắp đùi, bệnh phong, hao tổn sinh khí, bệnh vòm họng, bệnh đại tràng, phong thấp, chảy máu, bị thương do dao, xơ gan, bệnh về mắt. Âm thịnh dương suy, vợ chồng bất hoà, tổn hại con cái thông minh, đàn ông không thọ. Kiện tụng, tranh chấp, ngồi tù, mất của, gian trá, giết người, đào hoa, kém tài kém sắc. Chị em bất hoà, không có tài văn chương. Nếu hình thế dòng nước xấu thì dâm loạn, không có lợi cho người mệnh Tốn."},
    "4-8": {ten:"Phong Sơn Tiệm",sinhVuong:"Theo nghề đông y, cây cảnh, là người thanh nhàn, làm giàu nhờ nghề nông lâm và chăn nuôi. Làm điều thiện sẽ được hưởng điều tốt lành.",khacSat:"Mắc bệnh về lá lách và dạ dày, bệnh về ngón tay và cánh tay, hao tổn sinh khí, bệnh phong, bệnh về mặt, bệnh về vú, bệnh cột sống, hen suyễn, thiếu phụ mắc bệnh tinh thần, bệnh phong thấp. Anh em bất hòa, chị dâu em chồng thông dâm. Không có lợi cho chi út, con gái cả sảy thai tử vong. Mất của, sống phóng đãng, có con riêng. Nếu hình thế núi xấu thì không có lợi cho người mệnh Cấn, thuộc cung 8."},
    "4-9": {ten:"Phong Hỏa Gia Nhân",sinhVuong:"Con cái thông minh, có con gái giỏi giang, vợ hiền gây dựng cơ nghiệp, phát về chi trưởng, hay làm điều thiện.",khacSat:"Mắc bệnh viêm, bệnh về máu, viêm phế quản, bệnh về mắt, bệnh về mặt, bệnh phong, bệnh tim, tai nạn đổ máu, hỏa hoạn, bệnh dịch, chóng mặt hoa mắt. Tự tử, có người bị gù. Không có lợi cho thiếu phụ trong nhà, không giữ gìn khí tiết, làm bại hoại gia phong, dính líu đến vụ bê bối tình dục, trong nhà có người trộm cắp, bị chê bai. Hình thế núi và dòng nước xấu, nếu có 2 người phụ nữ ở trong một nhà thì nhà này sẽ tuyệt tự."},
    "5-1": {ten:"Không Quẻ (Nhất Ngũ)",sinhVuong:"Thi cử đỗ đầu, thường sinh con trai thông minh tài giỏi, tăng nhân khẩu. Thích hợp làm chuyên gia thuỷ lợi, nhà phát minh.",khacSat:"Chủ mắc bệnh ung thư (máu và tử cung), nhiễm trùng máu, bệnh thận, tăng urê huyết (viêm cầu thận), chứng mất nước, trường toan (nước chua) trong dạ dày không đủ, thận trúng độc, thiếu máu, bệnh giun móc, ngộ độc thai nghén, ngộ độc máu, ngộ độc rượu, xuất huyết dạ dày, bệnh truyền nhiễm qua đường tình dục, đau rát âm hộ, sỏi thận, phù thũng, vô sinh, sảy thai, nghiện hút, buôn bán ma tuý. Nếu hình thế núi xấu thì chủ người trẻ chết thảm, trung nam ngỗ nghịch."},
    "5-2": {ten:"Không Quẻ (Nhị Ngũ)",sinhVuong:"Tăng nhân khẩu, phát về ruộng đất của cải, trong nhà có người làm ngành pháp luật, phát về nghiệp võ, lợi cho nghề y, mở hiệu thuốc hoặc nghề mai táng. Nếu làm nghề y thì trong nhà sẽ có người là bác sỹ nổi tiếng.",khacSat:"Chủ về ốm đau bệnh tật, bệnh ung thư (dạ dày, đại tràng, thực quản, da), bệnh dạ dày, viêm loét dạ dày, da lở loét, ngộ độc, nghiện hút, mụn nhọt, bệnh giun móc, sảy thai, đẻ non. Nhị Ngũ giao nhau tất sẽ tổn thương đến chủ nhân, cẫn đến cảnh mẹ góa con côi. Vợ chồng xích mích, hay gặp rủi ro, tranh chấp đất đai."},
    "5-3": {ten:"Không Quẻ (Tam Ngũ)",sinhVuong:"Tài lộc dồi dào, gây dựng cơ nghiệp, chồng giàu sang phú quý, trong nhà có người làm quan lớn, góp công xây dựng đất nước, thành lập doanh nghiệp tư nhân, lợi cho ngành nông lâm, chi trưởng giàu sang phú quý.",khacSat:"Chủ mắc bệnh gan, ung thư gan, chân lở loét, nghiện hút, bị rắn cắn, bệnh dịch, nếu Tam, Tứ gặp nhau thì chủ bị trúng gió, ngã bị thương, sưng bầm, tai nạn xe cộ, bệnh phong, ham cờ bạc làm khuynh gia bại sản. Gặp tai họa bất ngờ, kiện tụng triền miên, động đất, sét đánh. Nếu hình thế núi xấu thì chủ thanh niên bị hạ độc mà chết. Nếu có dòng nước lớn là Dụng thần thì lợi cho cung Ngũ."},
    "5-4": {ten:"Không Quẻ (Tứ Ngũ)",sinhVuong:"Có người giỏi văn chương, là người phụ nữ thành đạt, là công nhân giỏi, là người thợ khéo, có tiếng tăm và khí phách, sự nghiệp phát triển thuận lợi.",khacSat:"Chủ mắc bệnh ung thư vú, ung thư gan, bệnh về vú, bệnh về mặt, bệnh phong, hao tổn sinh khí, gặp rắc rối khi sinh nở, mụn nhọt, thiếu phụ mắc bệnh do khí độc xâm nhập, viêm gan, bệnh dịch, bệnh dạ dày, bệnh điên, chứng nhiễm trùng huyết. Gặp tai họa chết chóc, buôn lậu ma túy, cờ bạc đầu cơ trục lợi, phá sản, mất của, sống phóng đãng, thân bại danh liệt. Nếu hình thế núi và dòng chảy dâm thì chủ thiếu phụ mất mạng. Nếu có dòng chảy lớn là Dụng thần thì không có lợi cho người thuộc cung Ngũ."},
    "5-5": {ten:"Ngũ Ngũ Song Tinh",sinhVuong:"Là nhà sưu tầm, nhà buôn đồ cổ, quý nhân giàu có, tài năng xuất chúng, người nắm quyền, tạo dựng công trạng sự nghiệp, đông con nhiều cháu.",khacSat:"Bệnh ung thư, mụn nhọt, bệnh giun móc, bệnh dạ dày, bệnh dịch, cảm điếc, đần độn, xuất huyết não, bệnh truyền nhiễm, gặp rắc rối khi sinh nở. Tai nạn bất ngờ, kiện tụng, dâm loạn, giảm nhân khẩu, mất mạng 5 người."},
    "5-6": {ten:"Ngũ Lục Song Tinh",sinhVuong:"Là người chỉ huy, khai quốc công thần, bậc thánh nhân, người lương thiện, tôn thờ Phật giáo và Đạo giáo.",khacSat:"Bệnh dạ dày, bệnh đại tràng, bệnh phổi, ung thư (dạ dày, phổi, đại tràng), đau mọc mụn, người già mất trí, người thực vật. Gặp tai họa, gây tổn hại cho gia chủ. Nếu hình thế dòng nước xấu thì chủ người già chết."},
    "5-7": {ten:"Ngũ Thất Song Tinh",sinhVuong:"Là nhà ngôn ngữ, nhà ngoại giao, nhà bình luận. Yểu điệu thục nữ, xinh đẹp danh giá, có tài xuất chúng, là nhà tâm linh.",khacSat:"Bệnh phổi, bệnh vòm họng, bệnh về lưỡi, bệnh đại tràng, viêm gan, bệnh giun móc, ung thư (đại tràng, vòm miệng, lưỡi, phổi), ngộ độc thực phẩm, nghiện hút, mụn nhọt, bệnh về đường sinh dục, đần độn, hôn mê, thiếu phụ lâm bệnh nặng, tranh chấp đất đai tài sản. Nếu hình thế núi và dòng nước xấu thì chủ bé gái gặp tai họa."},
    "5-8": {ten:"Ngũ Bát Song Tinh",sinhVuong:"Người đứng đầu, cảnh sát, thầy tu, trẻ con thông minh nhanh trí, phúc thọ song toàn, thật thà chất phác, có phúc phận.",khacSat:"Bệnh dạ dày, bệnh về mũi (ung thư), bệnh về ngón tay và cánh tay, bệnh tinh thần, bong gân, gãy xương, bệnh cột sống, bệnh kết sỏi, đầu mọc mụn, cảm điếc, đần độn, bại liệt, đau thần kinh tọa. Thiếu nam nghiện hút, thiếu nam lâm bệnh nặng, tổn hại đến người trẻ. Nếu hình thế núi và dòng nước xấu thì chủ bé trai mất mạng."},
    "5-9": {ten:"Ngũ Cửu Song Tinh",sinhVuong:"Nhà giáo dục, nhà quân sự, người có học vấn. Là người xinh đẹp, phụ nữ hào hiệp, phụ nữ sang trọng. Có tài xuất chúng, phú quý song toàn.",khacSat:"Bệnh về máu, bệnh tim, ung thư máu, ung thư đại tràng, viêm đại tràng, bệnh về mắt, bệnh mủ máu, chứng viêm, bệnh nhiệt, loét tá tràng, gặp rắc rối khi sinh nở, vô sinh, sảy thai, đẻ non, xuất huyết dạ dày, mụn nhọt. Trong nhà có người lâm bệnh nặng, không có lợi cho con gái giữa, dâm loạn, mất của. Ngũ - Cửu - Thất đồng cung chủ mắc bệnh về đường sinh dục, viêm kết mạc. Nếu hình thế núi và dòng nước xấu thì chủ thiếu nữ gặp tai họa."},
    "6-1": {ten:"Thiên Thủy Tụng",sinhVuong:"Có tài văn chương, học thức uyên bác. Là luật sư thanh bạch liêm khiết. Làm giàu từ ngành thủy lợi, có công gây dựng sự nghiệp. Dung mạo xinh đẹp, hiền lành lương thiện.",khacSat:"Bị thương vùng đầu, não xuất huyết, xuất huyết não, xuất huyết tủy xương, xuất huyết phổi, khí thũng, sỏi thận, sa dạ con, băng huyết, sảy thai, sa bàng quang, kiết lị, táo bón, di tinh, bệnh đại tràng. Kiện tụng, trung nam mất của, tranh chấp tài sản, gian nhân giả nghĩa, độc ác nham hiểm. Nếu hình thế núi và dòng nước xấu thì chủ người già dâm loạn, bị vướng vào vụ bê bối về tình dục."},
    "6-2": {ten:"Thiên Địa Bĩ",sinhVuong:"Phát về đất đai, của cải dư dật. Là doanh nghiệp kinh doanh (không nên làm thương mại), vốn liếng nhiều. Vượng cả đinh lẫn tài, đông con, đa tài.",khacSat:"Bệnh dạ dày, sa dạ dày, dạ dày kết sỏi, bệnh phổi, bệnh đại tràng, đau đầu, đau cơ, bệnh phụ khoa. Cha mẹ lâm bệnh. Nếu hình thế núi và dòng nước xấu thì bị tà khí xâm nhập, dễ có người xuất gia."},
    "6-3": {ten:"Thiên Lôi Vô Vọng",sinhVuong:"Có nước thì phát tài, được hưởng phúc bất ngờ, người già khỏe mạnh, về già có con, trong nhà có người làm quan.",khacSat:"Bệnh gan, chân bị khuyết tật, đau chân, bắp đùi bị khuyết tật, bệnh về não (suy nhược thần kinh), tai nạn đổ máu, tai nạn xe cộ, ngã bị thương, bị thương do dao. Tính tình ngông cuồng, cha con bất hoà, phụ nữ dâm loạn, tổn hại đến trưởng nam. Nếu hình thế núi và dòng nước xấu thì trong nhà có người vong ân bội nghĩa."},
    "6-4": {ten:"Thiên Phong Cấu",sinhVuong:"Danh lợi song toàn, trong nhà có người giỏi cả văn lẫn võ. Nhân duyên tốt lấy con nhà quyền quý, vợ bé sinh quý tử.",khacSat:"Bệnh gan, bệnh phổi, bệnh về vú, sảy thai, bệnh phong, trúng gió, bệnh não, tai nạn đổ máu, bị thương do dao, tai nạn xe cộ, xơ gan. Mất vợ hoặc tổn hại đến con gái cả, kiện tụng triền miên, hám của, sống phóng đãng. Nếu nước cung Tốn uốn quanh Càn thì chủ treo cổ xà nhà tự vẫn, không có lợi cho người thuộc cung Tứ Lục."},
    "6-5": {ten:"Ngũ Lục Song Tinh",sinhVuong:"Là người chỉ huy, khai quốc công thần, bậc thánh nhân, người lương thiện, tôn thờ Phật giáo và Đạo giáo.",khacSat:"Bệnh dạ dày, bệnh đại tràng, bệnh phổi, ung thư (dạ dày, phổi, đại tràng), đau mọc mụn, người già mất trí, người thực vật. Gặp tai họa, gây tổn hại cho gia chủ. Nếu hình thế dòng nước xấu thì chủ người già chết."},
    "6-6": {ten:"Càn Vi Thiên",sinhVuong:"Giàu có, nhân khẩu đông đúc, dễ được cấp trên đề bạt. Thích hợp làm về ngành máy móc, sản xuất kim loại. Có chí tiến thủ trong giới Phật học, hiểu biết hơn người.",khacSat:"Đau đầu, bệnh não, đau cổ, bệnh phổi, đau xương, bệnh đại tràng, tai nạn đổ máu, bệnh trung khu thần kinh. Hay dính líu đến kiện tụng, tuyệt tự, gây gổ với vợ, cốt nhục tương tàn, giàu có mà không có con, cuộc sống lẻ loi hiu quạnh. Nếu hình thế núi và dòng nước xấu thì trong nhà có người sống dâm loạn."},
    "6-7": {ten:"Thiên Trạch Lý",sinhVuong:"Thích hợp làm bộ đội, công an, nhân viên tư pháp. Ngoài ra cũng thích hợp làm trong ngành tài chính công thương, như kế toán, nhân viên tài vụ.",khacSat:"Bệnh phổi, bệnh vòm họng, đau đầu, đau nhức xương, bệnh đại tràng, tai nạn đổ máu, bị chém, bị thương do dao, viêm mũi. Cướp giật hợp tác không thành, đánh nhau, giải tán đoàn thể, nam nữ bất hoà, nữ xấu hơn nam, thường sinh con gái, con trai có nhiều con của vợ bé, tranh chấp tài sản, đấu kiếm gây thương tích. Nếu hình thế dòng nước xấu thì nam nữ loạn luân (ông già và gái trẻ)."},
    "6-8": {ten:"Thiên Sơn Độn",sinhVuong:"Phát về nghiệp võ, là người nắm quyền, công thành danh toại. Thổ Kim tương sinh, đất đai bổng lộc nhiều. Cha hiền con hiếu thảo, chi út vượng nhân đinh. Phụ nữ không thọ, lâu thì tuyệt tự.",khacSat:"Bệnh phổi, đau đầu, bệnh não, đau cổ, bệnh đại tràng, đau nhức xương, bệnh dạ dày, bệnh thần kinh, đau ngón tay, bệnh cột sống, đau nhức gân cốt, bệnh kết sỏi, bệnh về mũi. Bị chém, bị điên. Cha không nuôi dưỡng con, công danh không có. Nếu hình thể núi và dòng nước xấu thì trong nhà có người loạn luân."},
    "6-9": {ten:"Thiên Hỏa Đồng Nhân",sinhVuong:"Có tài văn chương, đức cao vọng trọng, là nhân vật nổi tiếng trong xã hội. Yêu thích thiên văn học, có danh tiếng.",khacSat:"Bệnh phổi, bệnh về máu, chứng viêm, xuất huyết não, não xuất huyết, bệnh về tuyến giáp trạng, đau cổ, đau nhức xương, bệnh đại tràng, bệnh nhiệt, bị thiêu chết, bị bỏng mà chết, sảy thai, gặp rắc rối khi sinh nở, vô sinh, sa dạ dày, bệnh về mắt. Bôn ba vất vả, cha và con gái bất hòa, con cái bất hiếu, con gái giữa ngỗ ngược với người già, nam nữ loạn luân. Nếu hình thể dòng nước xấu thì chủ thiếu nữ gặp tai nạn. Nếu hình thể núi xấu thì người già gặp tai nạn. Nếu hình thể núi tản mạn thì chủ thiếu nữ cặp bồ. Không có lợi cho người mệnh Càn, thuộc cung Lục Bạch."},
    "7-1": {ten:"Trạch Thủy Khốn",sinhVuong:"Người hiền lành, xinh đẹp, giỏi giang, thích hợp làm giáo viên, luật sư, bác sĩ, thầy bói. Được hưởng nhiều bổng lộc mà trở nên giàu có, có thể phát triển trong ngành chăn nuôi, thủy lợi, ao đầm, sông ngòi. Chi giữa vượng nhân đinh.",khacSat:"Bệnh phổi, xuất huyết phổi, khí thũng, bệnh thận, bệnh về tai, cảm điếc, thổ huyết. Sảy thai, đam mê tửu sắc, phạm tội bị lưu đày, giết người, nam nữ loạn luân, thiếu nữ trung nam tranh cãi, phá sản, bắt cóc, kiện tụng."},
    "7-2": {ten:"Trạch Địa Tuy",sinhVuong:"Có người làm bác sĩ, quan tòa, cảnh sát, võ sư. Phụ nữ gây dựng cơ đồ, người mẹ chuyên lo liệu việc nhà, của cái ngày càng nhiều, hay làm điều thiện.",khacSat:"Bệnh đại tràng, bệnh dạ dày, bệnh phổi, bệnh vòm họng, bé gái đau bụng, tiêu chảy. Hỏa hoạn, phụ nữ dâm loạn, đàn ông đam mê tửu sắc. Không có lợi cho người thuộc cung Nhị Hắc, Ngũ Hoàng và Bát Bạch."},
    "7-3": {ten:"Trạch Lôi Tùy",sinhVuong:"Đắc tài, có người văn võ song toàn, thích hợp làm trong ngành dịch vụ, giỏi văn nghệ. Vợ hiền trợ giúp cho chồng, vượng đinh vượng tài.",khacSat:"Bệnh gan, bệnh về mặt, bệnh vòm họng, bệnh đại tràng, đau chân, ngã bị thương, tai nạn đổ máu, thổ huyết. Bị thương do dao, tai nạn xe cộ, kiện tụng, giết người, tranh cãi, mất của. Bị người âm nhập, thiếu phụ mạo phạm với chồng, chi trưởng bất hoà, tổn hại đến chi trưởng, chiếm dụng phi pháp, cướp đoạt, vì nóng nảy mà gây tai họa. Nếu Tam, Thất, Cửu đồng cung thì thông minh, khắt khe, không có lợi cho người mệnh Tam Bích Mộc."},
    "7-4": {ten:"Trạch Phong Đại Quá",sinhVuong:"Hiền lành xinh đẹp, giỏi văn giỏi võ, giỏi viết văn, nên phát triển trong ngành xuất bản.",khacSat:"Bệnh gan, bệnh phổi, bệnh về vú, khí thũng, đau bắp đùi, bệnh phong, bệnh phong thấp, bệnh vòm họng, bệnh đại tràng, tai nạn đổ máu, bị thương do dao, bị điên, tự vẫn, bị giết, đau chân, bị chết thảm. Đàn ông thường hoang dâm, phụ nữ thường dâm loạn. Tốt mã xấu xí, bất chấp thủ đoạn để làm giàu, chị em bất hoà. Không có lợi cho người thuộc cung Tứ Lục."},
    "7-5": {ten:"Không Quẻ (Thất Ngũ)",sinhVuong:"Nhân khẩu đông đúc, giàu sang phú quý, dễ trở thành nhà bình luận chính trị, nhà ngoại giao, nhà phê bình, nhà văn học, nhà giáo dục, chuyên gia ngôn ngữ, nhà tâm linh. Tích cóp làm giàu, phụ nữ làm rạng danh gia đình, thích hợp phát triển trong ngành kinh doanh thương mại.",khacSat:"Bệnh phổi, bệnh vòm họng, bệnh về lưỡi, bệnh đại tràng, bệnh ung thư (vòm miệng, đại tràng, lưỡi), mụn nhọt, uống thuốc độc, ngộ độc, bệnh về đường sinh dục. Thiếu phụ mạo phạm gia chủ, bị tử hình, tàn phế, bị tai nạn xe cộ mà chết."},
    "7-6": {ten:"Trạch Thiên Quải",sinhVuong:"Thích hợp làm quan tòa, luật sư, nhà bình luận chính trị, có tài hùng biện, khéo léo, tiêu diệt thế lực tà ác, bảo vệ pháp luật, luật lệ nghiêm minh. Tiền của vào nhà, thích hợp phát triển trong ngành chế tạo vũ khí. Gia đình hoà thuận, phát cả đinh lẫn tài.",khacSat:"Bệnh phổi, đau đầu, đau nhức xương, bệnh thận, bệnh về tai, bệnh đại tràng, bệnh về đường sinh dục. Tai nạn đổ máu, chém giết, bị thương do dao, cướp giật, mất cắp, mất vợ, phụ nữ gặp tai họa."},
    "7-7": {ten:"Đoài Vi Trạch",sinhVuong:"Vượng cả đinh lẫn tài, chi út giàu có. Con gái trong nhà tài giỏi, khéo léo. Lợi về ngành tư pháp, ngành y, bói toán, đặc biệt nên làm luật sư, quan tòa. Làm giàu nhanh chóng, nên làm kinh doanh, có quý nhân phù trợ.",khacSat:"Bệnh phổi, bệnh vòm họng, bệnh đại tràng, bị cảm, sứt môi, cảm cúm, bệnh về đường hô hấp, bệnh về mũi, bị thương do dao, chứng nhiệt sinh đờm. Cốt nhục tương tàn, chém giết, tai nạn đổ máu, tai nạn xe cộ, trộm cướp, tranh cãi, bịa chuyện đặt điều, mất vợ, tuyệt tự, thiếu phụ nắm quyền, tổn hại đến bé gái, nam nữ dâm loạn. Nếu hình thể núi hoặc dòng nước xấu thì chủ bé gái bị giết hại. Nếu hình thể núi hoặc dòng nước dâm thì chủ thiếu phụ ngoại tình."},
    "7-8": {ten:"Trạch Sơn Hàm",sinhVuong:"Trai tài gái sắc, vợ chồng hoà thuận, lợi về hôn nhân. Của cải dư dật, nên làm ngành y, bói toán, gia sản kếch xù.",khacSat:"Bệnh phổi, bệnh vòm họng, bệnh đại tràng, bệnh dạ dày, đau tay, đau đầu, bệnh tinh thần, bệnh cột sống, đau nhức gân cốt, bệnh kết sỏi, bệnh điên, đau nhức xương. Thiếu nam thiếu nữ sống phóng đãng, vợ chồng xích mích, vợ mạo phạm chồng, bị người âm nhập, mất tiền mất của. Nếu hình thể dòng nước xấu thì chủ tổn hại đến bé trai hoặc chồng. Nếu hình thể núi xấu thì chủ tổn hại đến bé gái. Không có lợi cho người mệnh Đoài."},
    "7-9": {ten:"Trạch Hỏa Cách",sinhVuong:"Thích hợp làm luật sư, quan tòa, nhà nghiên cứu khoa học. Dễ xuất người đẹp, thay đổi diện mạo làm con người mới, quyết tâm sửa chữa sai lầm.",khacSat:"Chủ mắc bệnh vòm họng, bệnh phổi, bệnh đường ruột, bệnh về máu, thổ huyết, bệnh lậu, bệnh lao, bệnh tim, chứng nhiệt, trĩ lậu. Nghiện hút, ngộ độc, hỏa hoạn, chết cháy, bị bỏng, bị thương do vật nổ, mù màu, gặp nguy hiểm khi sinh nở, đào hoa, đam mê tửu sắc. Người âm bị quấy nhiễu, điều tiếng thị phi, mất của hao tài, tổn hại đến bé gái. Nếu hình thể dòng nước xấu thì chủ tổn thương thiếu nữ. Nếu hình thể núi xấu thì chủ tổn thương bé gái. Không có lợi cho người mệnh quẻ Đoài."},
    "8-1": {ten:"Sơn Thủy Mông",sinhVuong:"Tu thân dưỡng tính, tài cao học rộng. Thích hợp làm họa sĩ, làm giàu nhờ ngành chăn nuôi.",khacSat:"Bệnh thận, sỏi bàng quang, bệnh về mũi, thiếu máu, ung thư máu, bệnh về tai, sỏi thận. Tổn hại đến trung nam, trong nhà có người đần độn, anh em bất hoà, ngã xuống vực, kiện tụng triền miên, điều tiếng thị phi."},
    "8-2": {ten:"Sơn Địa Bác",sinhVuong:"Cơ nghiệp khá giả, nên làm giàu bằng nghề kinh doanh bất động sản, hoặc xuất nhập khẩu. Mẹ hiền con hiếu thảo, nhân khẩu đông đúc.",khacSat:"Bệnh dạ dày, bệnh vùng bụng, bệnh da liễu, đau ngón tay, bệnh cột sống, phụ nữ mắc bệnh tinh thần, đau nhức gân cốt, dạ dày kết sỏi, thiếu nam cảm điếc, bệnh giun móc, đần độn. Trong nhà có người xuất gia, bị chó cắn, bại hoại gia phong, gia cảnh suy sút."},
    "8-3": {ten:"Sơn Lôi Di",sinhVuong:"Tự lập tự cường, nên phát triển và làm giàu từ các ngành liên quan đến lương thực, hoa cỏ, nhạc cụ và thủ công nghệ. Con cháu trong nhà thông minh.",khacSat:"Bệnh dạ dày, đau ngón tay, bệnh cột sống, đau nhức gân cốt, đau cánh tay, bệnh tinh thần, bệnh kết sỏi, sảy thai. Không có lợi cho người vị thành niên, không có con nối dõi. Anh em không hoà thuận, người cùng một nhà gây gổ với nhau. Không có lợi cho người mệnh Cấn."},
    "8-4": {ten:"Sơn Phong Cổ",sinhVuong:"Lợi cho công việc liên quan đến giấy tờ, phổ biến công việc ở địa phương. Cơ nghiệp khá giả, nên kinh doanh hàng dệt may, tơ tằm.",khacSat:"Đau ngón tay, bệnh phong, bệnh sỏi mật, bệnh ở vú, đau bắp đùi, bệnh cột sống, hen suyễn, bệnh dạ dày, thiếu phụ mắc bệnh tinh thần, thiếu nam mắc bệnh dạ dày, động kinh, bại liệt. Hại chồng khác con, chủ về quả phụ lo liệu việc nhà, tổn hại đến người vị thành niên, dễ bị thú vật cắn."},
    "8-5": {ten:"Không Quẻ (Bát Ngũ)",sinhVuong:"Thiếu niên thông minh, trong nhà có người theo nghề khoáng chất, hoặc có người xuất gia.",khacSat:"Bệnh về mũi, đau đầu, bệnh dạ dày, đau ngón tay, bệnh tinh thần, gãy xương, đau nhức gân cốt, bệnh cột sống, bệnh kết sỏi, thiếu nam mắc bệnh thận, đần độn, cảm điếc, đau thần kinh tọa. Khuynh gia bại sản, tổn hại đến con nối dõi, thiếu niên mất mạng."},
    "8-6": {ten:"Sơn Thiên Đại Súc",sinhVuong:"Làm giàu nhờ đất đai, hoặc làm trong ngành tài chính. Cha hiền con hiếu thảo, gia đình vẻ vang.",khacSat:"Bệnh phổi, đau đầu, đau cổ, bệnh đại tràng, đau nhức xương, bệnh dạ dày, suy nhược thần kinh, đau ngón tay, bệnh cột sống, bệnh kết sỏi, sa dạ dày. Thiếu nam bất hiếu với cha, thiếu nam khiến tan của nát nhà, mất vợ, không có con nối dõi."},
    "8-7": {ten:"Sơn Trạch Tổn",sinhVuong:"Nhân khẩu đông đúc, thiếu niên phát đạt sớm, chủ phú quý. Đất đai mở rộng, kinh doanh có lợi, chủ giàu có.",khacSat:"Bệnh phổi, bệnh vòm họng, bệnh đại tràng, bệnh dạ dày, đau ngón tay, bệnh tinh thần, bệnh cột sống, bệnh kết sỏi, bệnh hủi. Vợ chồng bất hoà, bị kẻ gian giết hại, tổn hại đến người vị thành niên, mất của, bị quấy rối tình dục."},
    "8-8": {ten:"Cấn Vi Sơn",sinhVuong:"Phát về đất đai, của cải dư dật, nhân khẩu đông đúc, giàu sang phú quý, sống thọ. Nên kinh doanh hoặc theo nghề nhà giáo, có tài có trí, là nhân viên trung thành, thích hợp với nghề viết lách, không nên làm trong doanh nghiệp như kiểu công xưởng. Nên ngồi thiền, làm thông hai huyệt vị Nhâm và Đốc.",khacSat:"Đau nhức gân cốt, đau xương, bệnh cột sống, dạ dày kết sỏi, chứng liệt dạ dày, chi trên ở nam vị thành niên thường bị dị tật, bệnh dạ dày, thiếu niên cảm điếc, đần độn. Dễ bị chó cắn, thiếu niên sống không tốt, tính tình bảo thủ, nam vị thành niên mất mạng. Nếu hình thể dòng nước xấu thì chủ bé trai mất mạng, hoặc bé trai bị chó dại cắn. Nếu hình thể núi hoặc dòng nước dâm thì chủ đàn ông dâm loạn."},
    "8-9": {ten:"Sơn Hỏa Bí",sinhVuong:"Gặp nhiều may mắn, đất đai nhiều, giàu có. Nên kinh doanh đất đai hoặc đồi rừng. Cuộc sống hôn nhân hạnh phúc, sinh quý tử, lợi cho thiếu nam.",khacSat:"Mắc bệnh về máu, xuất huyết, bệnh tim, huyết áp cao, não xuất huyết, bệnh dạ dày, bệnh về mũi, bệnh đại tràng, bệnh về mắt, mủ máu, chứng viêm, chứng nhiệt, bị bỏng, bị thiêu, trung nữ và thiếu nam mắc bệnh tinh thần, chứng liệt dạ dày, đau mắt hột, chảy máu cam, chi trên xuất huyết. Vợ chồng không hợp nhau. Nếu hình thể dòng nước xấu thì chủ tổn hại đến thiếu nữ. Nếu hình thể núi xấu thì bé trai mất mạng."},
    "9-1": {ten:"Hỏa Thủy Vị Tế",sinhVuong:"Vợ chồng hạnh phúc, đông con nhiều cháu. Của cải dư dật, kinh doanh thuận lợi, chủ phú quý.",khacSat:"Bệnh tim, bệnh thận, bệnh về đường sinh dục, mủ, bệnh về mắt, thần trí mơ hồ. Vợ chồng bất hoà, vợ đoạt quyền chồng, vợ chồng phân ly, đam mê tửu sắc."},
    "9-2": {ten:"Hỏa Địa Tấn",sinhVuong:"Sinh con phú quý, nhân khẩu đông đúc, học rộng hiểu nhiều, nổi tiếng thiên hạ, công việc thuận lợi, thăng quan tiến chức. Hợp với nghề làm gốm, kinh doanh vất vả, làm ăn hợp pháp.",khacSat:"Bệnh dạ dày, bệnh về máu, xuất huyết dạ dày, viêm dạ dày, viêm ruột thừa, bệnh về mắt, bệnh tim, khó sinh, viêm phúc mạc. Giết người, tai nạn đổ máu, mạo phạm cấp trên, không biết điều. Chồng bảo thủ đần độn, hao tốn nhân đinh, gia cảnh nghèo khó, đam mê tửu sắc, gặp kiếp đào hoa."},
    "9-3": {ten:"Hỏa Lôi Phệ Hạp",sinhVuong:"Sinh con thông minh xinh đẹp, đường thăng quan tiến chức thuận lợi, tài lộc thường vào nhà. Trung nữ phúc thọ song toàn, con dâu thứ mang thai con trai. Thanh Long vào nhà, Mộc Hỏa tương thông.",khacSat:"Bệnh gan, đau chân, bệnh về mắt, bệnh về máu, ung thư máu, chứng viêm, bệnh dịch, bị thiêu chết, bị bỏng, khó sinh, bệnh tim. Bị vật nổ làm chân bị thương, tổn hại nhân đinh, mất của, nam trộm cắp nữ làm gái nhà hàng, phải ngồi tù."},
    "9-4": {ten:"Hỏa Phong Đỉnh",sinhVuong:"Chi trưởng sinh quý tử, thông minh xinh đẹp, có trình độ học vấn cao, thành tích nổi bật, thăng quan tiến chức, nên làm nhân viên công chức. Phụ nữ làm rạng danh gia đình, tài lộc dồi dào, gia đình hạnh phúc.",khacSat:"Chứng viêm, viêm phế quản, bệnh về mắt, bệnh về ống mật, viêm tuyến vú, bệnh về máu, đau bắp đùi, bệnh phong, hao tổn sinh khí, bệnh tim, mất máu, bệnh đại tràng, nhiễm khuẩn, đau đầu chóng mặt, hủy hoại dung nhan. Tai nạn đổ máu, bị thương do dao, thất cơ tự tử, bị thiêu chết, mất của, hao tổn nhân đinh, trong nhà có kẻ sống lang thang, phụ nữ bất hoà, gia trạch không yên."},
    "9-5": {ten:"Không Quẻ (Cửu Ngũ)",sinhVuong:"Sinh quý tử, nhân khẩu đông đúc. Tài lộc dồi dào, đất đai rộng rãi. Trong nhà có người làm quan lớn. Nên theo ngành quân sự, có tiếng và nghề làm gốm.",khacSat:"Bệnh tim, bệnh về huyết quản, ung thư máu, bệnh đại tràng, mù màu, khó sinh, vô sinh, sảy thai, nhiễm khuẩn, chứng viêm, mụn nhọt, viêm dạ dày, xuất huyết dạ dày, loét tá tràng, bệnh da liễu, bị bỏng, ung thư đại tràng, tàn tật, gầy gò, chết yểu. Kiện tụng, tử hình, dâm loạn, mất của."},
    "9-6": {ten:"Hỏa Thiên Đại Hữu",sinhVuong:"Học rộng hiểu nhiều, vui tươi hồ hởi, tinh thần phấn chấn, giàu có, sống thọ.",khacSat:"Bệnh phổi, bệnh về máu, chứng viêm, xuất huyết, bệnh tim, não xuất huyết, bệnh về tuyến giáp, đau cổ, đau nhức xương, đau đầu, bệnh đại tràng, bệnh nhiệt, bị thiêu chết, bị bỏng, sảy thai, vô sinh, khó sinh, ung thư máu, xuất huyết não. Chết bất ngờ, con dâu xấu nết, phụ nữ ngang tàng, con cháu bất hiếu, tổn hại đến người già, gây gổ chém giết lẫn nhau, tự sát, nhảy xuống giếng tự vẫn."},
    "9-7": {ten:"Hỏa Trạch Khuê",sinhVuong:"Lấy người khác họ, xinh đẹp yêu kiều. Thích hợp làm chuyên gia chế tạo vũ khí, luật sư, quan tòa, là người giữ gìn chân lý.",khacSat:"Bệnh phổi, bệnh vòm họng, bệnh đại tràng, bệnh về máu, bệnh tim, chứng viêm, xuất huyết, mất máu, nghiện hút, ngộ độc, mù màu, bệnh về mắt, vô sinh, ung thư vòm miệng, thổ huyết, ung thư phổi. Hỏa hoạn, bị bỏng, vật nổ làm bị thương. Đam mê tửu sắc, kiện tụng, tai họa bất ngờ, anh em bất hoà, cuộc sống gia đình không được yên ổn, bại hoại gia phong, phóng đãng dâm dật."},
    "9-8": {ten:"Hỏa Sơn Lữ",sinhVuong:"Của cải dư dật, nhân khẩu đông đúc. Trung nam trung nữ giàu có, sinh quý tử, thiếu nam công thành danh toại. Phát triển thuận lợi về ngành nông nghiệp, kinh doanh thương mại.",khacSat:"Bệnh về máu, xuất huyết, bệnh tim, huyết áp cao, não xuất huyết, bệnh dạ dày, bệnh về mũi, đau mắt, bệnh đại tràng, bị bỏng, bị thiêu, tự thiêu, đần độn, cảm điếc. Người vị thành niên bị mất mạng, phụ nữ thô bạo, trẻ em bị thiểu năng tâm thần."},
    "9-9": {ten:"Ly Vi Hỏa",sinhVuong:"Cơ nghiệp khá giả, giàu sang phú quý. Thích hợp với nghề nấu ăn, luyện kim, mỹ phẩm, thời trang. Gia cảnh khá giả, nhưng dễ giàu cũng dễ suy bại.",khacSat:"Bệnh về mắt, thần trí mơ màng, bệnh về hệ thống tuần hoàn máu, bệnh về máu, mất máu, xuất huyết, bệnh tim, huyết áp cao, chứng nhiệt, chứng viêm, say nắng, viêm phổi, viêm đại tràng, khó sinh, sảy thai, vô sinh. Hỏa hoạn, tai nạn đổ máu, chết thảm, tự sát, hao tổn nhân đinh, mất của, giết người, kiện tụng, tử hình, âm thịnh dương suy, phụ nữ lo liệu việc nhà, không có lợi cho người vị thành niên. Nếu hình thể núi hoặc dòng nước xấu thì chủ thiếu phụ mất mạng. Nếu hình thể núi hoặc dòng nước dâm thì chủ thiếu nữ dâm loạn."}
  };

  // Trả về {key, ten, sinhVuong, khacSat} hoặc null nếu sSon/sHuong không hợp lệ (1-9).
  function xetQuanHeSonHuongMoiCung(sSon, sHuong) {
    if (!sSon || !sHuong || sSon < 1 || sSon > 9 || sHuong < 1 || sHuong > 9) return null;
    var key = sHuong + "-" + sSon;
    var info = QUAN_HE_SON_HUONG_MOI_CUNG[key];
    if (!info) return null;
    return { key: key, ten: info.ten, sinhVuong: info.sinhVuong, khacSat: info.khacSat };
  }

  // ==================================================================
  // 8) TAM HỢP PHÁI — Tam Hợp / Tam Tai / Xung theo Chi năm lưu niên, đối
  // chiếu với TỪNG CUNG bát quái (Khảm/Khôn/Chấn/Tốn/Ly/Đoài/Càn/Cấn).
  // Nguồn: tam-hop-phai.md. Trung cung (Ngũ Hoàng) không thuộc Bát Quái nên
  // không có dữ liệu Tam Hợp Phái — bỏ qua khi tra cứu.
  //
  //  - tamHop : cục Tam Hợp của chính cung đó (kích hoạt/tăng cường khí tại
  //             cung — cát tinh thì bùng cát, hung tinh thì phát hung mạnh).
  //  - tamTai : 3 Chi liên tiếp gây tai hoạ cho cung (khắc theo Ngũ Hành).
  //  - xung   : Chi xung trực tiếp với Chi của cung — khí bị xáo trộn.
  // Trả về {tenCung, chiCuaCung, phuongVi, tamHopChi, tamTaiChi, xungChi,
  //         ketQua:{chiNam, namLaTamHop, namLaTamTai, namLaXung}} hoặc null.
  // ==================================================================
  var TAM_HOP_PHAI = {
    "Khảm": { chi: ["Tý"],          phuongVi: "Bắc",       tamHop: ["Thân","Tý","Thìn"], tamTai: ["Ngọ","Mùi","Thân"], xung: ["Ngọ"] },
    "Khôn": { chi: ["Mùi","Thân"],  phuongVi: "Tây Nam",   tamHop: ["Thân","Tý","Thìn"], tamTai: ["Dần","Mão","Thìn"], xung: ["Sửu","Dần"] },
    "Chấn": { chi: ["Mão"],         phuongVi: "Đông",      tamHop: ["Hợi","Mão","Mùi"],  tamTai: ["Thân","Dậu","Tuất"], xung: ["Dậu"] },
    "Tốn":  { chi: ["Thìn","Tị"],   phuongVi: "Đông Nam",  tamHop: ["Tị","Dậu","Sửu"],   tamTai: ["Hợi","Tý","Sửu"],   xung: ["Tuất","Hợi"] },
    "Ly":   { chi: ["Ngọ"],         phuongVi: "Nam",       tamHop: ["Dần","Ngọ","Tuất"], tamTai: ["Tý","Sửu","Dần"],   xung: ["Tý"] },
    "Đoài": { chi: ["Dậu"],         phuongVi: "Tây",       tamHop: ["Tị","Dậu","Sửu"],   tamTai: ["Hợi","Tý","Sửu"],   xung: ["Mão"] },
    "Càn":  { chi: ["Tuất","Hợi"],  phuongVi: "Tây Bắc",   tamHop: ["Dần","Ngọ","Tuất"], tamTai: ["Thân","Dậu","Tuất"], xung: ["Thìn","Tị"] },
    "Cấn":  { chi: ["Sửu","Dần"],   phuongVi: "Đông Bắc",  tamHop: ["Tị","Dậu","Sửu"],   tamTai: ["Ngọ","Mùi","Thân"], xung: ["Mùi","Thân"] }
  };
  // Danh sách Địa Chi theo thứ tự vòng — dùng khi nơi gọi chưa có sẵn Chi của năm dương lịch.
  var _THP_CHI_ORDER = ["Tý","Sửu","Dần","Mão","Thìn","Tị","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  function _thpChiCuaNam(nam) {
    var n = parseInt(nam);
    if (!n || isNaN(n)) return null;
    return _THP_CHI_ORDER[((n + 8) % 12 + 12) % 12];
  }

  // tenCung: 1 trong 8 cung bát quái (không nhận "Trung"). nam: năm dương lịch cần đối chiếu (tuỳ chọn).
  // chiNamCoSan: Chi năm đã tính sẵn ở nơi gọi (tuỳ chọn, ưu tiên dùng nếu có — ví dụ layDiaChiNam() bên
  // phi-tinh.js — để khỏi tính lại và tránh lệch quy đổi Can-Chi giữa các module khác nhau trong app).
  function xetTamHopPhaiMotCung(tenCung, nam, chiNamCoSan) {
    var info = TAM_HOP_PHAI[tenCung];
    if (!info) return null;
    var chiNam = chiNamCoSan || _thpChiCuaNam(nam);
    var ketQua = null;
    if (chiNam) {
      ketQua = {
        chiNam: chiNam,
        namLaTamHop: info.tamHop.indexOf(chiNam) !== -1,
        namLaTamTai: info.tamTai.indexOf(chiNam) !== -1,
        namLaXung: info.xung.indexOf(chiNam) !== -1
      };
    }
    return {
      tenCung: tenCung,
      chiCuaCung: info.chi,
      phuongVi: info.phuongVi,
      tamHopChi: info.tamHop,
      tamTaiChi: info.tamTai,
      xungChi: info.xung,
      ketQua: ketQua
    };
  }

  // ==================================================================
  // EXPORT
  // ==================================================================
  window.TAM_HOP_PHAI = TAM_HOP_PHAI;
  window.xetTamHopPhaiMotCung = xetTamHopPhaiMotCung;
  window.xetQuanHeNguHanh = xetQuanHeNguHanh;
  window.xetHopThap = xetHopThap;
  window.xetPhanPhucNgamMotSao = xetPhanPhucNgamMotSao;
  window.xetVuongSuyCachCuc = xetVuongSuyCachCuc;
  window.xetToHopSonHuong = xetToHopSonHuong;
  window.xetChanKhiHaDo = xetChanKhiHaDo;
  window.xetLienChauTamBanMotCung = xetLienChauTamBanMotCung;
  window.xetLienChauTamBanToanCuc = xetLienChauTamBanToanCuc;
  window.xetQuanHeSonHuongMoiCung = xetQuanHeSonHuongMoiCung;

})();
