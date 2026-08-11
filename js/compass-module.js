// ====================================================================
// compass-module.js
// MODULE LA BÀN DÙNG CHUNG — tách từ renderCompassOverlay() gốc của
// cuu-cung-luoi.js (BƯỚC 1 của kế hoạch tái cấu trúc), để dùng lại được
// ở nhiều tab (Cửu Cung Lưới, Thủy Pháp, ...).
//
// NGUYÊN TẮC TÁCH:
// - Chỉ chứa phần THUẦN HÌNH HỌC/TÍNH TOÁN + VẼ LA BÀN (24 sơn, 8 hướng,
//   trung cung, V/S/H, % diện tích khuyết) — không chứa phần đặc thù riêng
//   của tab Cửu Cung Lưới (kéo-thả đỉnh đa giác, modal chi tiết hướng, lưu/mở
//   file, quản lý cửa...). Các phần đó VẪN Ở LẠI cuu-cung-luoi.js.
// - Không đọc biến toàn cục ẩn (như svgEl/manualTextScale cũ) — mọi thứ tab
//   cần cung cấp được truyền vào qua tham số/opts, để module này tái sử dụng
//   được cho tab khác không có các biến đó.
//
// TƯƠNG THÍCH NGƯỢC: hành vi và công thức giữ NGUYÊN VẸN 100% so với bản gốc
// trong cuu-cung-luoi.js — chỉ đổi cách truyền tham số (dependency injection)
// để hết phụ thuộc closure riêng của tab đó.
// ====================================================================

(function () {
  'use strict';

  // ==================================================================
  // HÌNH HỌC CƠ BẢN (giống hệt CuuCungGrid.* trong cuu-cung-luoi.js)
  // ==================================================================
  function shoelaceArea(pts) {
    if (pts.length < 3) return 0;
    var sum = 0;
    for (var i = 0; i < pts.length; i++) {
      var p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      sum += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(sum) / 2;
  }

  function inside(p, edgeStart, edgeEnd) {
    return (edgeEnd.x - edgeStart.x) * (p.y - edgeStart.y) -
           (edgeEnd.y - edgeStart.y) * (p.x - edgeStart.x) <= 0;
  }

  function intersect(p1, p2, edgeStart, edgeEnd) {
    var A1 = edgeEnd.y - edgeStart.y, B1 = edgeStart.x - edgeEnd.x;
    var C1 = A1 * edgeStart.x + B1 * edgeStart.y;
    var A2 = p2.y - p1.y, B2 = p1.x - p2.x;
    var C2 = A2 * p1.x + B2 * p1.y;
    var det = A1 * B2 - A2 * B1;
    if (Math.abs(det) < 1e-9) return p2;
    return {
      x: (B2 * C1 - B1 * C2) / det,
      y: (A1 * C2 - A2 * C1) / det
    };
  }

  function clipPolygon(subject, clipPoly) {
    var output = subject.slice();
    for (var i = 0; i < clipPoly.length; i++) {
      if (output.length === 0) break;
      var input = output;
      output = [];
      var edgeStart = clipPoly[i], edgeEnd = clipPoly[(i + 1) % clipPoly.length];
      for (var j = 0; j < input.length; j++) {
        var current = input[j], prev = input[(j - 1 + input.length) % input.length];
        var currentIn = inside(current, edgeStart, edgeEnd);
        var prevIn = inside(prev, edgeStart, edgeEnd);
        if (currentIn) {
          if (!prevIn) output.push(intersect(prev, current, edgeStart, edgeEnd));
          output.push(current);
        } else if (prevIn) {
          output.push(intersect(prev, current, edgeStart, edgeEnd));
        }
      }
    }
    return output;
  }

  function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  function edgeBearing(a, b) {
    var deg = Math.atan2(b.x - a.x, -(b.y - a.y)) * 180 / Math.PI;
    return (deg + 360) % 360;
  }

  function bearingToUnit(bearingDeg) {
    var rad = bearingDeg * Math.PI / 180;
    return { x: Math.sin(rad), y: -Math.cos(rad) };
  }

  function setPointByBearing(a, b, bearingDeg, lenPx) {
    var rad = bearingDeg * Math.PI / 180;
    b.x = a.x + lenPx * Math.sin(rad);
    b.y = a.y - lenPx * Math.cos(rad);
  }

  function rayHouseIntersection(center, bearingDeg, housePoints) {
    var dir = bearingToUnit(bearingDeg);
    var n = housePoints.length;
    var best = null;
    for (var i = 0; i < n; i++) {
      var p1 = housePoints[i], p2 = housePoints[(i + 1) % n];
      var ex = p2.x - p1.x, ey = p2.y - p1.y;
      var a11 = dir.x, a12 = -ex, b1 = p1.x - center.x;
      var a21 = dir.y, a22 = -ey, b2 = p1.y - center.y;
      var det = a11 * a22 - a12 * a21;
      if (Math.abs(det) < 1e-9) continue;
      var t = (b1 * a22 - a12 * b2) / det;
      var s = (a11 * b2 - a21 * b1) / det;
      if (t > 1e-6 && s >= -1e-6 && s <= 1 + 1e-6) {
        if (best === null || t < best.t) best = { t: t, x: center.x + t * dir.x, y: center.y + t * dir.y };
      }
    }
    return best;
  }

  function rectExitPoint(center, bearingDeg, halfW, halfH) {
    var dir = bearingToUnit(bearingDeg);
    var tx = Math.abs(dir.x) > 1e-9 ? halfW / Math.abs(dir.x) : Infinity;
    var ty = Math.abs(dir.y) > 1e-9 ? halfH / Math.abs(dir.y) : Infinity;
    var t = Math.min(tx, ty);
    return { x: center.x + t * dir.x, y: center.y + t * dir.y };
  }

  function rectPolyFromCenter(center, halfW, halfH) {
    return [
      { x: center.x - halfW, y: center.y - halfH },
      { x: center.x - halfW, y: center.y + halfH },
      { x: center.x + halfW, y: center.y + halfH },
      { x: center.x + halfW, y: center.y - halfH }
    ];
  }

  function wedgeAreaOfHouse(center, housePoints, centerBearing, halfSpan) {
    var bigR = 5000;
    var d1 = bearingToUnit(centerBearing - halfSpan);
    var d2 = bearingToUnit(centerBearing + halfSpan);
    var far1 = { x: center.x + bigR * d1.x, y: center.y + bigR * d1.y };
    var far2 = { x: center.x + bigR * d2.x, y: center.y + bigR * d2.y };
    var clipTri = [center, far2, far1];
    var clipped = clipPolygon(housePoints, clipTri);
    return shoelaceArea(clipped);
  }

  // % diện tích khuyết mỗi hướng + trung cung — GIỐNG HỆT computeHuongStats gốc.
  function computeHuongStats(center, housePoints, rotationDeg, centerHalfW, centerHalfH) {
    var totalArea = shoelaceArea(housePoints);
    var centerRectPoly = rectPolyFromCenter(center, centerHalfW, centerHalfH);
    var centerActualArea = shoelaceArea(clipPolygon(housePoints, centerRectPoly));
    var trungCungPct = totalArea > 0 ? (centerActualArea / totalArea) * 100 : 0;

    var xs = housePoints.map(function (p) { return p.x; });
    var ys = housePoints.map(function (p) { return p.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var boundingRectPoly = [
      { x: minX, y: minY }, { x: minX, y: maxY }, { x: maxX, y: maxY }, { x: maxX, y: minY }
    ];

    var huong = [];
    for (var k = 0; k < 8; k++) {
      var centerBearing = k * 45 - rotationDeg;
      var bigR = 5000;
      var d1 = bearingToUnit(centerBearing - 22.5);
      var d2 = bearingToUnit(centerBearing + 22.5);
      var far1 = { x: center.x + bigR * d1.x, y: center.y + bigR * d1.y };
      var far2 = { x: center.x + bigR * d2.x, y: center.y + bigR * d2.y };
      var wedgeTri = [center, far2, far1];

      var actualInWedge = clipPolygon(housePoints, wedgeTri);
      var actualInWedgeArea = shoelaceArea(actualInWedge);
      var actualInWedgeAndCenter = shoelaceArea(clipPolygon(actualInWedge, centerRectPoly));
      var actualOutside = actualInWedgeArea - actualInWedgeAndCenter;

      var idealInWedge = clipPolygon(boundingRectPoly, wedgeTri);
      var idealInWedgeArea = shoelaceArea(idealInWedge);
      var idealInWedgeAndCenter = shoelaceArea(clipPolygon(idealInWedge, centerRectPoly));
      var idealOutside = idealInWedgeArea - idealInWedgeAndCenter;

      huong.push({
        pct: totalArea > 0 ? (actualOutside / totalArea) * 100 : 0,
        ratioVsIdeal: idealOutside > 0 ? (actualOutside / idealOutside) * 100 : 100
      });
    }

    return { trungCungPct: trungCungPct, huong: huong };
  }

  // ==================================================================
  // DỮ LIỆU GỐC (giống hệt cuu-cung-luoi.js)
  // ==================================================================
  var SON24_NAMES = [
    "Tý","Quý","Sửu","Cấn","Dần","Giáp",
    "Mão","Ất","Thìn","Tốn","Tỵ","Bính",
    "Ngọ","Đinh","Mùi","Khôn","Thân","Canh",
    "Dậu","Tân","Tuất","Càn","Hợi","Nhâm"
  ];
  var BATQUAI_NAMES = ["Khảm","Cấn","Chấn","Tốn","Ly","Khôn","Đoài","Càn"];
  var CUNG_SO_GOC = window.CUNG_TO_SO || {"Khảm":1,"Khôn":2,"Chấn":3,"Tốn":4,"Trung":5,"Càn":6,"Đoài":7,"Cấn":8,"Ly":9};

  // Các hình mẫu nhà cơ bản (viewBox 400x400 gốc, dùng cho nút "Chọn hình dạng nhà") — dùng chung
  // cho cả Cửu Cung Lưới và Thủy Pháp. Toạ độ giống hệt bản gốc trong cuu-cung-luoi.js.
  var SHAPES = {
    rect: [
      { x: 60, y: 60 }, { x: 340, y: 60 }, { x: 340, y: 340 }, { x: 60, y: 340 }
    ],
    L: [
      { x: 60, y: 60 }, { x: 260, y: 60 }, { x: 260, y: 160 },
      { x: 340, y: 160 }, { x: 340, y: 340 }, { x: 60, y: 340 }
    ],
    sevenSides: [
      { x: 60, y: 60 }, { x: 300, y: 60 }, { x: 300, y: 140 },
      { x: 340, y: 140 }, { x: 340, y: 340 }, { x: 140, y: 340 },
      { x: 60, y: 220 }
    ]
  };

  var HUONG_DATA = [
    { hanh: "Thủy", quai: "Thủy", nguoiNha: "Trung nam", coThe: "Tai, Thận",
      yNghia: "Sự hiểm trở, mương rãnh, nước", sao: 1,
      luuY: "Chưa có ghi chú đặc biệt riêng trong tài liệu gốc." },
    { hanh: "Thổ", quai: "Thổ (núi)", nguoiNha: "Út nam", coThe: "Tay",
      yNghia: "Sự ngưng nghỉ, núi đá", sao: 8,
      luuY: "Kho tiền bạc/hàng hoá. Nếu ứ đọng (hàng không xuất được) thì mở cho thông thoáng, có thể kích đèn vàng. Bếp đặt đây hao tài." },
    { hanh: "Mộc", quai: "Mộc (sấm)", nguoiNha: "Trưởng nam", coThe: "Chân, gan",
      yNghia: "Chấn động, khởi đầu, sấm sét", sao: 3,
      luuY: "Hợp Thủy thì phát triển tốt (trưởng nam). Dính Phong (gió) là bị phá. Tránh đặt vật rung động/ồn (kim loại) ở đây." },
    { hanh: "Mộc", quai: "Mộc (gió)", nguoiNha: "Trưởng nữ", coThe: "Đùi",
      yNghia: "Gió, sự nhập vào, thảo mộc", sao: 4,
      luuY: "Là 1 trong Tứ Khố (kho tiền, hợp để ở)." },
    { hanh: "Hỏa", quai: "Hỏa (mặt trời)", nguoiNha: "Thứ nữ", coThe: "Mắt, tim",
      yNghia: "Sự rực rỡ, văn minh, lửa", sao: 9,
      luuY: "Chủ danh vọng, địa vị. Theo tài liệu: nếu có nước ở đây, các năm 2018/2020/2022 dễ mất tiền nhiều." },
    { hanh: "Thổ", quai: "Thổ (đất)", nguoiNha: "Mẹ, vợ", coThe: "Bụng, dạ dày, Tỳ Vị",
      yNghia: "Nhu nhuận, bao dung, đất đai", sao: 2,
      luuY: "Là 1 trong Tứ Khố (kho tiền, hợp để ở). Có giếng trời mà không có Thủy ở đây là lỗi theo tài liệu." },
    { hanh: "Kim", quai: "Kim (đầm)", nguoiNha: "Út nữ", coThe: "Miệng",
      yNghia: "Sự vui vẻ, ao đầm", sao: 7,
      luuY: "Có nước ở đây, theo tài liệu, dễ khiến cả nhà hay cãi vã." },
    { hanh: "Kim", quai: "Kim (trời)", nguoiNha: "Cha, chồng", coThe: "Đầu, xương, cột sống",
      yNghia: "Mạnh mẽ, cứng rắn, quý nhân", sao: 6,
      luuY: "Là 1 trong Tứ Khố (kho tiền). Chủ quý nhân." }
  ];
  var TRUNG_CUNG_DATA = {
    sao: 5,
    luuY: "Trung cung cần khô ráo, sạch, thoáng. Kỵ bị bế kín (thang máy) hoặc có nhà vệ sinh — dễ gây bế tắc mọi việc."
  };

  function getVanTrangThai(sao, van) {
    var d = ((sao - van) % 9 + 9) % 9;
    switch (d) {
      case 0: return { trangThai: "Vượng khí", moTa: "Đương vận lệnh tinh, đại cát", category: "vuong" };
      case 1: return { trangThai: "Sinh khí", moTa: "Vị lai chi khí, chủ vượng đinh tài", category: "sinh" };
      case 2: return { trangThai: "Sinh khí (viễn)", moTa: "Viễn sinh khí, tiệm phát", category: "sinh" };
      case 8: return { trangThai: "Suy khí (Thoái)", moTa: "Thoái khí, cát sự tiệm thất", category: "suy" };
      case 7: return { trangThai: "Suy khí", moTa: "Suy bại chi khí, chủ suy vi", category: "suy" };
      case 6: return { trangThai: "Tử/Sát khí", moTa: "Tử khí, vô dụng", category: "tu" };
      case 5: return { trangThai: "Tử/Sát khí", moTa: "Sát khí, chủ đại hung", category: "tu" };
      case 4: return { trangThai: "Tử/Sát khí", moTa: "Tử khí, hoạ hại", category: "tu" };
      default: return { trangThai: "Tử/Sát khí", moTa: "Cực Tử khí, tổn đinh phá tài", category: "tu" };
    }
  }

  function scorePhongThuy(sao, van) {
    var delta = (sao - van) % 9;
    if (delta < 0) delta += 9;
    if (delta > 4) delta -= 9;
    if (delta === -4) return { loai: "Trung tính", diem: 0 };
    if (delta <= 0) return { loai: "Phong", diem: 4 + delta };
    return { loai: "Thủy", diem: 5 - delta };
  }

  function nienTinhTrungCung(year) {
    var s = String(Math.abs(Math.floor(year))).split("").reduce(function (a, c) { return a + parseInt(c, 10); }, 0);
    var x = 11 - s;
    return ((x - 1) % 9 + 9) % 9 + 1;
  }

  function flyStarValue(centerNum, baseNum) {
    return (((centerNum + baseNum - 6) % 9) + 9) % 9 + 1;
  }

  // ==================================================================
  // VẼ SỐ NỀN GÓC (Lạc Thư nguyên đán mờ phía sau tên cung + cảnh báo Phản/Phục Ngâm)
  // ==================================================================
  // getScaledFontSizeFn: hàm (el, basePx) => void — tab gọi tự cung cấp cách set cỡ chữ theo scale riêng.
  function veSoNenGoc(g, x, y, cungName, basePx, getScaledFontSizeFn) {
    var soGoc = CUNG_SO_GOC[cungName];
    if (!soGoc) return;
    var vsh = window.phiTinhVSH && window.phiTinhVSH[cungName];
    var vshTrung = window.phiTinhVSH && window.phiTinhVSH["Trung"];
    var ngamHit = false;
    if (vsh && vshTrung && typeof window.xetPhanPhucNgamMotSao === 'function') {
      // Xét ĐỘC LẬP cho bàn Sơn và bàn Hướng — mỗi bàn chỉ kích hoạt Phản/Phục Ngâm khi
      // CHÍNH bàn đó có 5 nhập Trung cung (không dùng chéo, không OR đơn thuần theo số tại cung).
      // Tra soNhapTrung/laThuan ở ĐÂY (ngữ cảnh tab Phi Tinh qua window.phiTinhVSH) rồi truyền
      // trực tiếp — hàm chung không tự đọc window nữa để dùng lại được ở ngữ cảnh khác (Tìm Nhà).
      var hitSon = window.xetPhanPhucNgamMotSao(vsh.S, soGoc, vshTrung.S, window.phiTinhLaThuanSon);
      var hitHuong = window.xetPhanPhucNgamMotSao(vsh.H, soGoc, vshTrung.H, window.phiTinhLaThuanHuong);
      ngamHit = !!(hitSon || hitHuong);
    }
    var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("class", "so-nen-goc" + (ngamHit ? " so-nen-goc-ngam" : ""));
    t.setAttribute("x", x.toFixed(2)); t.setAttribute("y", y.toFixed(2));
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("dominant-baseline", "central");
    t.setAttribute("fill", ngamHit ? "#b71c1c" : "#999");
    t.setAttribute("fill-opacity", ngamHit ? "0.35" : "0.14");
    t.setAttribute("font-weight", "bold");
    t.setAttribute("pointer-events", "none");
    t.textContent = soGoc;
    getScaledFontSizeFn(t, basePx || 26);
    if (ngamHit) t.setAttribute("title", "Phản/Phục Ngâm tại cung " + cungName + " (so với Lạc Thư nguyên đán " + soGoc + ")");
    g.appendChild(t);
  }

  // ==================================================================
  // VẼ LA BÀN CHÍNH — GIỐNG HỆT renderCompassOverlay() gốc, chỉ khác cách
  // nhận scale/font/currentVan/currentNamXem qua "ctx" (dependency injection)
  // thay vì đọc biến toàn cục ẩn của cuu-cung-luoi.js.
  //
  // ctx = {
  //   getScaledFontSize: function(el, basePx) {...}   // BẮT BUỘC — set cỡ chữ theo scale hiện tại của tab
  //   scaledOffset: function(px) { return px; }        // BẮT BUỘC — khoảng cách dòng co giãn theo scale
  //   currentVan: 9,                                    // Vận hiện tại (dùng cho scorePhongThuy 💨/💧)
  //   currentNamXem: 2026,                               // Năm xem (dùng cho Niên tinh N{x})
  //   onHuongClick: function(idx) {...}                  // optional — callback khi bấm vào nhãn hướng (mở modal chi tiết...)
  // }
  function renderCompassOverlay(svgSelector, center, housePoints, rotationDeg, centerCellHalfW, centerCellHalfH, khuyetThreshold, ctx) {
    rotationDeg = rotationDeg || 0;
    khuyetThreshold = khuyetThreshold || 70;
    ctx = ctx || {};
    var getScaledFontSizeFn = ctx.getScaledFontSize || function (el, basePx) { el.style.fontSize = basePx + "px"; };
    var scaledOffsetFn = ctx.scaledOffset || function (px) { return px; };
    var currentVan = ctx.currentVan || 9;
    var currentNamXem = ctx.currentNamXem || new Date().getFullYear();

    var svg = document.querySelector(svgSelector);
    if (!svg) return;
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", "compassOverlay");

    for (var i = 0; i < 24; i++) {
      var boundaryBearing = i * 15 + 7.5 - rotationDeg;
      var isHuongBoundary = (i % 3 === 1);
      var hit = rayHouseIntersection(center, boundaryBearing, housePoints);
      if (!hit) continue;
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", isHuongBoundary ? "huong-ray" : "son-ray");
      var startPt = (centerCellHalfW && centerCellHalfH)
        ? rectExitPoint(center, boundaryBearing, centerCellHalfW, centerCellHalfH)
        : center;
      line.setAttribute("x1", startPt.x.toFixed(2)); line.setAttribute("y1", startPt.y.toFixed(2));
      line.setAttribute("x2", hit.x.toFixed(2)); line.setAttribute("y2", hit.y.toFixed(2));
      g.appendChild(line);
    }

    for (var j = 0; j < 24; j++) {
      var sonBearing = j * 15 - rotationDeg;
      var hit2 = rayHouseIntersection(center, sonBearing, housePoints);
      if (!hit2) continue;
      var dx = hit2.x - center.x, dy = hit2.y - center.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / len, uy = dy / len;
      var lx = hit2.x + ux * 14;
      var ly = hit2.y + uy * 14;
      var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("class", "son-label");
      text.setAttribute("x", lx.toFixed(2)); text.setAttribute("y", ly.toFixed(2));
      text.textContent = SON24_NAMES[j];
      getScaledFontSizeFn(text, 10);
      g.appendChild(text);
    }

    var stats = computeHuongStats(center, housePoints, rotationDeg, centerCellHalfW || 1, centerCellHalfH || 1);
    var nienTrungCurrent = nienTinhTrungCung(currentNamXem);
    for (var k = 0; k < 8; k++) {
      var huongBearing = k * 45 - rotationDeg;
      var hit3 = rayHouseIntersection(center, huongBearing, housePoints);
      if (!hit3) continue;
      var isKhuyetHuong = stats.huong[k].ratioVsIdeal < khuyetThreshold;
      var hx, hy;
      if (isKhuyetHuong) {
        var dxk = hit3.x - center.x, dyk = hit3.y - center.y;
        var lenk = Math.sqrt(dxk * dxk + dyk * dyk) || 1;
        hx = hit3.x + (dxk / lenk) * 32;
        hy = hit3.y + (dyk / lenk) * 32;
      } else {
        hx = center.x + (hit3.x - center.x) * 0.55;
        hy = center.y + (hit3.y - center.y) * 0.55;
      }
      var vshHuong = (window.phiTinhVSH && window.phiTinhVSH[BATQUAI_NAMES[k]]) ? window.phiTinhVSH[BATQUAI_NAMES[k]] : null;

      var pctText2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
      pctText2.setAttribute("class", "huong-pct");
      pctText2.setAttribute("x", hx.toFixed(2)); pctText2.setAttribute("y", (hy - scaledOffsetFn(10)).toFixed(2));
      pctText2.textContent = stats.huong[k].pct.toFixed(1) + "%";
      getScaledFontSizeFn(pctText2, 8);
      g.appendChild(pctText2);

      if (vshHuong) {
        var sonTinhText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sonTinhText.setAttribute("class", "huong-son-tinh");
        sonTinhText.setAttribute("x", (hx - scaledOffsetFn(16)).toFixed(2)); sonTinhText.setAttribute("y", (hy - scaledOffsetFn(10)).toFixed(2));
        sonTinhText.setAttribute("text-anchor", "middle");
        sonTinhText.setAttribute("fill", "#e86602");
        sonTinhText.setAttribute("font-weight", "bold");
        sonTinhText.textContent = "S" + vshHuong.S;
        getScaledFontSizeFn(sonTinhText, 8);
        g.appendChild(sonTinhText);

        var huongTinhText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        huongTinhText.setAttribute("class", "huong-huong-tinh");
        huongTinhText.setAttribute("x", (hx + scaledOffsetFn(16)).toFixed(2)); huongTinhText.setAttribute("y", (hy - scaledOffsetFn(10)).toFixed(2));
        huongTinhText.setAttribute("text-anchor", "middle");
        huongTinhText.setAttribute("fill", "#0bbd02");
        huongTinhText.setAttribute("font-weight", "bold");
        huongTinhText.textContent = "H" + vshHuong.H;
        getScaledFontSizeFn(huongTinhText, 8);
        g.appendChild(huongTinhText);
      }

      var text2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text2.setAttribute("class", "huong-label");
      text2.setAttribute("x", hx.toFixed(2)); text2.setAttribute("y", hy.toFixed(2));
      veSoNenGoc(g, hx, hy, BATQUAI_NAMES[k], 26, getScaledFontSizeFn);
      var ptIcon = scorePhongThuy(HUONG_DATA[k].sao, currentVan);
      var iconChar = ptIcon.loai === "Phong" ? " 💨" : (ptIcon.loai === "Thủy" ? " 💧" : "");
      text2.textContent = BATQUAI_NAMES[k] + iconChar;
      text2.dataset.huongIdx = k;
      if (typeof ctx.onHuongClick === 'function') {
        text2.addEventListener("click", (function (idx) { return function () { ctx.onHuongClick(idx); }; })(k));
      }
      getScaledFontSizeFn(text2, 11);
      g.appendChild(text2);

      var kwText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      kwText.setAttribute("class", "huong-keyword");
      kwText.setAttribute("x", hx.toFixed(2)); kwText.setAttribute("y", (hy + scaledOffsetFn(10)).toFixed(2));
      kwText.textContent = HUONG_DATA[k].nguoiNha.split(",")[0] + ", " + HUONG_DATA[k].coThe.split(",")[0];
      getScaledFontSizeFn(kwText, 7);
      g.appendChild(kwText);

      var nienTinhVal = flyStarValue(nienTrungCurrent, HUONG_DATA[k].sao);
      var vshNienStr = "N" + nienTinhVal;
      if (vshHuong) {
        vshNienStr = "V" + vshHuong.V + " " + vshNienStr;
      }
      var ntText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      ntText.setAttribute("class", "nien-tinh");
      ntText.setAttribute("x", hx.toFixed(2)); ntText.setAttribute("y", (hy + scaledOffsetFn(19)).toFixed(2));
      ntText.setAttribute("text-anchor", "middle");
      ntText.setAttribute("fill", "#8b0000");
      ntText.setAttribute("font-weight", "bold");
      ntText.textContent = vshNienStr;
      getScaledFontSizeFn(ntText, 6.3);
      g.appendChild(ntText);
    }

    veSoNenGoc(g, center.x, center.y, "Trung", 24, getScaledFontSizeFn);

    var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("class", "center-dot");
    dot.setAttribute("cx", center.x); dot.setAttribute("cy", center.y); dot.setAttribute("r", 3);
    g.appendChild(dot);

    var centerPctText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerPctText.setAttribute("class", "huong-pct");
    centerPctText.setAttribute("x", center.x); centerPctText.setAttribute("y", (center.y - scaledOffsetFn(8)).toFixed(2));
    centerPctText.textContent = stats.trungCungPct.toFixed(1) + "%";
    getScaledFontSizeFn(centerPctText, 8);
    g.appendChild(centerPctText);

    var centerVSHT = (window.phiTinhVSH && window.phiTinhVSH["Trung"]) ? window.phiTinhVSH["Trung"] : null;

    if (centerVSHT) {
      var centerSonTinhText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      centerSonTinhText.setAttribute("class", "huong-son-tinh");
      centerSonTinhText.setAttribute("x", (center.x - scaledOffsetFn(16)).toFixed(2)); centerSonTinhText.setAttribute("y", (center.y - scaledOffsetFn(8)).toFixed(2));
      centerSonTinhText.setAttribute("text-anchor", "middle");
      centerSonTinhText.setAttribute("fill", "#ad021e");
      centerSonTinhText.setAttribute("font-weight", "bold");
      centerSonTinhText.textContent = "S" + centerVSHT.S;
      getScaledFontSizeFn(centerSonTinhText, 8);
      g.appendChild(centerSonTinhText);

      var centerHuongTinhText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      centerHuongTinhText.setAttribute("class", "huong-huong-tinh");
      centerHuongTinhText.setAttribute("x", (center.x + scaledOffsetFn(16)).toFixed(2)); centerHuongTinhText.setAttribute("y", (center.y - scaledOffsetFn(8)).toFixed(2));
      centerHuongTinhText.setAttribute("text-anchor", "middle");
      centerHuongTinhText.setAttribute("fill", "#0bbd02");
      centerHuongTinhText.setAttribute("font-weight", "bold");
      centerHuongTinhText.textContent = "H" + centerVSHT.H;
      getScaledFontSizeFn(centerHuongTinhText, 8);
      g.appendChild(centerHuongTinhText);
    }

    var centerVSHNienStr = "N" + nienTrungCurrent;
    if (centerVSHT) centerVSHNienStr = "V" + centerVSHT.V + " " + centerVSHNienStr;
    var centerNienText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerNienText.setAttribute("class", "nien-tinh");
    centerNienText.setAttribute("x", center.x); centerNienText.setAttribute("y", (center.y + scaledOffsetFn(14)).toFixed(2));
    centerNienText.setAttribute("text-anchor", "middle");
    centerNienText.setAttribute("fill", "#8b0000");
    centerNienText.setAttribute("font-weight", "bold");
    centerNienText.textContent = centerVSHNienStr;
    getScaledFontSizeFn(centerNienText, 6.3);
    g.appendChild(centerNienText);

    svg.appendChild(g);
    return g;
  }

  // ==================================================================
  // EXPORT
  // ==================================================================
  window.CompassModule = {
    // hình học cơ bản
    shoelaceArea: shoelaceArea, inside: inside, intersect: intersect, clipPolygon: clipPolygon,
    distance: distance, edgeBearing: edgeBearing, bearingToUnit: bearingToUnit, setPointByBearing: setPointByBearing,
    rayHouseIntersection: rayHouseIntersection, rectExitPoint: rectExitPoint, rectPolyFromCenter: rectPolyFromCenter,
    wedgeAreaOfHouse: wedgeAreaOfHouse, computeHuongStats: computeHuongStats,
    // dữ liệu gốc
    SON24_NAMES: SON24_NAMES, BATQUAI_NAMES: BATQUAI_NAMES, CUNG_SO_GOC: CUNG_SO_GOC,
    HUONG_DATA: HUONG_DATA, TRUNG_CUNG_DATA: TRUNG_CUNG_DATA,
    // hình mẫu nhà (dùng chung cho nút "Chọn hình dạng nhà" ở mọi tab)
    SHAPES: SHAPES,
    // tính toán phong thủy
    getVanTrangThai: getVanTrangThai, scorePhongThuy: scorePhongThuy,
    nienTinhTrungCung: nienTinhTrungCung, flyStarValue: flyStarValue,
    // vẽ
    veSoNenGoc: veSoNenGoc, renderCompassOverlay: renderCompassOverlay
  };

  // ==================================================================
  // ĐIỀU PHỐI CHUNG — chuyển đổi giữa NHIỀU KIỂU la bàn dùng chung 1 overlay,
  // ẩn/hiện thay thế nhau. State theo dõi riêng cho từng overlayId (mỗi tab
  // có #compassOverlay riêng thì mỗi overlayId giữ trạng thái độc lập).
  // ==================================================================
  var _stateKieuLaBan = {};
  window.setKieuLaBan = function (overlayId, kieuMoi) {
    _stateKieuLaBan[overlayId] = kieuMoi;
    return kieuMoi;
  };
  window.layKieuLaBanHienTai = function (overlayId, macDinh) {
    return _stateKieuLaBan[overlayId] || macDinh || "tron24son";
  };

})();
