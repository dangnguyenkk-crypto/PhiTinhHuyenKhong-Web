// ====================================================================
// cuu-cung-luoi.js (cập nhật để tích hợp ve-phong)
// Tab Cửu Cung Lưới — chia lưới mặt bằng, la bàn, phân tích hướng
// (Modul CỬA dùng chung js/cua-module.js — xem cuuCungDoorCtx bên dưới)
// ====================================================================

// =====================================================================
        // ===== CỬU CUNG LƯỚI MODULE =====
        // =====================================================================
/* =========================================================
   MODULE: Cửu Cung - chia lưới 3x3 (Lạc Thư) lên mặt bằng nhà,
   xử lý được nhà khuyết góc (đa giác lõm, kể cả hình L/lục giác).

   Thuật toán:
   1. Tính bounding box (hình chữ nhật bao nhỏ nhất) từ các đỉnh
      của đa giác nhà -> đây là "hình đầy đủ" giả định.
   2. Chia bounding box thành lưới 3x3 đều nhau -> mỗi ô lý
      thuyết = 1/9 diện tích bounding box (cung giữa = 1/9 đúng
      như Lạc Thư).
   3. Với mỗi trong 9 ô, cắt (clip) đa giác nhà thực tế theo ô đó
      bằng thuật toán Sutherland-Hodgman (xử lý được đa giác lõm)
      -> tính diện tích thực chồng lên ô bằng công thức Shoelace.
   4. % = diện tích thực / diện tích ô lý thuyết. Nếu % < ngưỡng
      Ka quy định -> gắn nhãn "khuyết cung".

   Tích hợp vào phi-tinh.html: gọi CuuCungGrid.render(svgSelector,
   housePolygonPoints, thresholdPercent).
   ========================================================= */
(function () {
  'use strict';

  // ==================================================================
  // BƯỚC 1 TÁI CẤU TRÚC: alias sang js/compass-module.js (window.CompassModule).
  // Đặt NGAY ĐẦU file (trước mọi chỗ dùng CM.*) để tránh lỗi truy cập CM khi
  // còn undefined — ví dụ SHAPES/HUONG_DATA/CUNG_SO_GOC được gán từ CM ngay
  // trong phần khai báo biến phía dưới.
  // ==================================================================
  var CM = window.CompassModule;
  if (!CM) { console.error("cuu-cung-luoi.js cần js/compass-module.js load TRƯỚC nó trong index.html"); }

  // ---- Hình học cơ bản ----
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

  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  var CuuCungGrid = {
    render: function (svgSelector, housePoints, thresholdPercent, showKhuyetLabel) {
      if (showKhuyetLabel === undefined) showKhuyetLabel = true;
      var svg = document.querySelector(svgSelector);
      if (!svg) return;
      // Xoá nội dung SVG nhưng giữ lại các phần tử của module vẽ phòng (vp-*)
      var toRemove = [];
      var children = svg.children;
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        // Giữ lại các phần tử có class bắt đầu bằng "vp-" (do ve-phong.js quản lý)
        if (c.classList && c.classList.contains('vp-room') || 
            c.classList && c.classList.contains('vp-handle') ||
            c.classList && c.classList.contains('vp-drawing') ||
            c.classList && c.classList.contains('vp-label') ||
            c.classList && c.classList.contains('vp-drawing-handle')) {
          continue;
        }
        toRemove.push(c);
      }
      toRemove.forEach(function (el) { el.remove(); });

      var xs = housePoints.map(function (p) { return p.x; });
      var ys = housePoints.map(function (p) { return p.y; });
      var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
      var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
      var W = maxX - minX, H = maxY - minY;
      var cellW = W / 3, cellH = H / 3;

      var g = el("g", {});

      var houseStr = housePoints.map(function (p) { return p.x + "," + p.y; }).join(" ");
      g.appendChild(el("polygon", { class: "house", points: houseStr }));

      var results = [];
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 3; col++) {
          var cx0 = minX + col * cellW, cy0 = minY + row * cellH;
          var cellPoly = [
            { x: cx0, y: cy0 },
            { x: cx0, y: cy0 + cellH },
            { x: cx0 + cellW, y: cy0 + cellH },
            { x: cx0 + cellW, y: cy0 }
          ];
          var clipped = clipPolygon(housePoints, cellPoly);
          var overlapArea = shoelaceArea(clipped);
          var cellArea = cellW * cellH;
          var pct = cellArea > 0 ? (overlapArea / cellArea) * 100 : 0;
          var isCenter = (row === 1 && col === 1);
          results.push({ row: row, col: col, cx0: cx0, cy0: cy0, pct: pct, isCenter: isCenter });
        }
      }

      results.forEach(function (r) {
        var rect = el("rect", {
          class: "grid" + (r.isCenter ? " center-cell" : ""),
          x: r.cx0, y: r.cy0, width: cellW, height: cellH
        });
        g.appendChild(rect);

        var khuyet = r.pct < thresholdPercent;
        if (khuyet) {
          g.appendChild(el("rect", {
            class: "khuyet-fill",
            x: r.cx0, y: r.cy0, width: cellW, height: cellH
          }));
        }

        var midX = r.cx0 + cellW / 2, midY = r.cy0 + cellH / 2;

        if (khuyet && showKhuyetLabel) {
          var tag = el("text", { class: "khuyet-tag", x: midX, y: midY - 6 });
          tag.textContent = "KHUYẾT";
          setScaledFontSize(tag, 9);
          g.appendChild(tag);

          var pctText = el("text", { class: "cell-pct", x: midX, y: midY + 8 });
          pctText.textContent = (100 - r.pct).toFixed(0) + "%";
          setScaledFontSize(pctText, 9);
          g.appendChild(pctText);
        }
      });

      svg.appendChild(g);
      
      // Gọi lại render của module vẽ phòng để vẽ lại các phòng (nếu đã khởi tạo)
      if (window.VePhongModule && typeof window.VePhongModule.render === 'function') {
        window.VePhongModule.render();
      }
      
      return results;
    }
  };

  window.CuuCungGrid = CuuCungGrid;

  // SHAPES: đã chuyển sang js/compass-module.js (CM.SHAPES) để dùng chung cho cả tab Thủy Pháp.
  // Alias lại đúng tên cũ — phần code phía dưới dùng SHAPES[...] không cần sửa gì.
  var SHAPES = CM.SHAPES;

  var svgEl = null;
  var screenLocked = false;
  var manualTextScale = 1;

  function getEffectiveTextScale() {
    if (!svgEl) return manualTextScale;
    var vb = svgEl.getAttribute("viewBox");
    if (!vb) return manualTextScale;
    var parts = vb.split(/\s+/).map(parseFloat);
    var vw = parts[2] || 400;
    var autoScale = vw / 400;
    autoScale = Math.max(0.3, Math.min(3, autoScale));
    return autoScale * manualTextScale;
  }

  function setScaledFontSize(el, basePx) {
    el.style.fontSize = (basePx * getEffectiveTextScale()).toFixed(2) + "px";
  }
  // Khoảng cách giữa các dòng nhãn (tên cung/%/từ khóa/V-S-H-N) cũng phải co giãn theo cùng tỉ lệ với cỡ chữ,
  // để khi thu nhỏ chữ (nút vừa màn hình hoặc thanh trượt cỡ chữ) các dòng tự tịnh tiến co cụm lại gần tên cung,
  // thay vì đứng yên tại chỗ gây tràn ra khỏi ô (đặc biệt nhà dài/hẹp khiến ô lưới bị dẹt).
  function scaledOffset(px) {
    return px * getEffectiveTextScale();
  }
  var currentPoints = [];
  window.currentPoints = currentPoints; // Expose ra toàn cục để ve-phong.js snap vào
  var cuuCungDoors = [];    // cửa của tab này — dùng chung CuaModule (js/cua-module.js)
  var draggingIndex = -1;
  var scalePxPerMeter = 20; // 1 mét = 20px, Ka chỉnh qua thanh trượt
  var lockedPoints = [];    // true = đỉnh bị khoá, không cho kéo/chỉnh

  // currentPoints đã là toạ độ SVG (viewBox) sẵn — không có hệ world/zoom riêng như tam-nha,
  // nên hàm quy đổi world->screen của CuaModule chỉ cần trả về nguyên giá trị.
  function cuaIdentityWorldToScreen(wx, wy) { return { x: wx, y: wy }; }

  // Context adapter cho modul cửa dùng chung
  var cuuCungDoorCtx = {
    modalId: 'ccDoorModal', boxId: 'ccDoorModalBox', listId: 'ccDoorList', idPrefix: 'cc',
    getVertices: function () { return currentPoints; },
    isClosed: function () { return true; }, // mặt bằng cửu-cung-lưới luôn là đa giác kín
    getPxPerMeter: function () { return scalePxPerMeter; },
    getDoors: function () { return cuuCungDoors; },
    getCenter: function () {
      var xs = currentPoints.map(function (p) { return p.x; });
      var ys = currentPoints.map(function (p) { return p.y; });
      return { x: (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, y: (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2 };
    },
    worldToScreen: cuaIdentityWorldToScreen,
    // Độ xoay la bàn của tab này (đọc chung ô #doSoTay với renderCompassOverlay ở trên) — cần cộng
    // vào khi tính sơn/cung của cửa, nếu không sẽ lệch đúng bằng độ xoay hiện tại (vd gần 180°).
    getRotationDeg: function () { var el = document.getElementById("doSoTay"); return el ? (parseInt(el.value, 10) || 0) : 0; },
    onChange: function () { redraw(true); }
  };
  window.__cuaCtx_cc = cuuCungDoorCtx; // cho các nút ✔/🗑 trong danh sách cửa gọi lại đúng ctx

  // ==================================================================
  // BƯỚC 1 TÁI CẤU TRÚC: các hàm hình học/tính toán/vẽ la bàn thuần túy đã
  // được CHUYỂN sang js/compass-module.js (window.CompassModule) để dùng
  // chung cho cả tab Thủy Pháp. Ở đây chỉ alias lại đúng tên cũ, giữ nguyên
  // toàn bộ phần code phía dưới của file này không cần sửa gì thêm.
  // (var CM đã khai báo ở đầu file — xem dòng ~38)
  // ==================================================================
  function distance(p1, p2) { return CM.distance(p1, p2); }
  function edgeBearing(a, b) { return CM.edgeBearing(a, b); }
  // isAngleCloseTo là hàm phụ trợ CHỈ dùng riêng cho UI danh sách cạnh (buildEdgeList) của tab
  // Cửu Cung Lưới, không thuộc phần vẽ la bàn dùng chung — giữ nguyên định nghĩa gốc tại đây.
  function isAngleCloseTo(bearingDeg, targetDeg, epsilon) {
    epsilon = epsilon || 0.5;
    var diff = Math.abs(bearingDeg - targetDeg) % 360;
    if (diff > 180) diff = 360 - diff;
    return diff <= epsilon;
  }
  function bearingToUnit(bearingDeg) { return CM.bearingToUnit(bearingDeg); }
  function setPointByBearing(a, b, bearingDeg, lenPx) { return CM.setPointByBearing(a, b, bearingDeg, lenPx); }
  function rayHouseIntersection(center, bearingDeg, housePoints) { return CM.rayHouseIntersection(center, bearingDeg, housePoints); }
  function rectExitPoint(center, bearingDeg, halfW, halfH) { return CM.rectExitPoint(center, bearingDeg, halfW, halfH); }
  function wedgeAreaOfHouse(center, housePoints, centerBearing, halfSpan) { return CM.wedgeAreaOfHouse(center, housePoints, centerBearing, halfSpan); }
  function rectPolyFromCenter(center, halfW, halfH) { return CM.rectPolyFromCenter(center, halfW, halfH); }
  function computeHuongStats(center, housePoints, rotationDeg, centerHalfW, centerHalfH) { return CM.computeHuongStats(center, housePoints, rotationDeg, centerHalfW, centerHalfH); }
  function scorePhongThuy(sao, van) { return CM.scorePhongThuy(sao, van); }
  function getVanTrangThai(sao, van) { return CM.getVanTrangThai(sao, van); }
  function nienTinhTrungCung(year) { return CM.nienTinhTrungCung(year); }
  function flyStarValue(centerNum, baseNum) { return CM.flyStarValue(centerNum, baseNum); }

  var SON24_NAMES = CM.SON24_NAMES;
  var BATQUAI_NAMES = CM.BATQUAI_NAMES;
  var CUNG_SO_GOC = CM.CUNG_SO_GOC;
  var HUONG_DATA = CM.HUONG_DATA;
  var TRUNG_CUNG_DATA = CM.TRUNG_CUNG_DATA;

  // shoelaceArea/inside/intersect/clipPolygon vẫn cần giữ TÊN CŨ vì CuuCungGrid.render() (phía trên,
  // dòng ~33-88) đã dùng trực tiếp — nhưng để tránh khai báo trùng (function đã có ở đó rồi), KHÔNG
  // alias lại ở đây; CuuCungGrid tiếp tục dùng bản định nghĩa gốc của chính nó (giữ nguyên, không đổi).

  function veSoNenGoc(g, x, y, cungName, basePx) {
    return CM.veSoNenGoc(g, x, y, cungName, basePx, setScaledFontSize);
  }

  var PHUONG_VI_ABBR = ["B","ĐB","Đ","ĐN","N","TN","T","TB"];
  var PHUONG_VI_FULL = ["Bắc","Đông Bắc","Đông","Đông Nam","Nam","Tây Nam","Tây","Tây Bắc"];

  function bearingToSonName(bearingScreen, rotationDeg) {
    var absBearing = (bearingScreen + rotationDeg) % 360;
    if (absBearing < 0) absBearing += 360;
    var idx = Math.round(absBearing / 15) % 24;
    return { deg: Math.round(absBearing), son: SON24_NAMES[idx] };
  }

  var CUU_TINH_DATA = window.SAO_Y_NGHIA || {
    1: { ten: "Nhất Bạch", tenKhac: "Tham Lang", nguHanh: "Thủy", cung: "Khảm (+)",
      mauSac: "Trắng", bieuTuong: "Sông, biển, vùng bùn, khe núi sâu tối",
      coThe: "☵ Tai, Thận, Bàng quang, hệ thống sinh dục, tiết niệu, tuần hoàn máu, tủy xương và vùng thắt lưng",
      tinhChat: "Bồng bột, lãng đãng", loaiTinh: "Cát tinh",
      khiSinhVuong: "Vượng đinh lẫn tài, lợi cả văn lẫn võ, thi cử đỗ đạt, tiếng tăm lừng lẫy, sinh con trai thông minh, thăng quan phát tài. Cát tinh hàng đầu.",
      khiSuyTu: "Hoạ do tửu sắc, tan cửa nát nhà. Bệnh về tai, suy thận, bàng quang, sinh sản. Nặng thì hình khắc vợ, mù loà, yểu mệnh, sống phiêu bạt." },
    2: { ten: "Nhị Hắc", tenKhac: "Cự Môn", nguHanh: "Thổ", cung: "Khôn (-)",
      mauSac: "Đen", bieuTuong: "Mộ phần, nơi hoang vu",
      coThe: "☷ Bụng, tỳ, cơ bắp và mô mềm",
      tinhChat: "Nhu mà tĩnh (mềm mỏng, bình tĩnh)", loaiTinh: "Hung tinh",
      khiSinhVuong: "Có quyền có của, cơ ngơi bề thế, vượng cả đinh lẫn tài. Thường xuất võ quý, phụ nữ cai quản gia đình, đa mưu.",
      khiSuyTu: "Tai hoạ vì sắc, dễ hoả hoạn, thị phi, hao tiền tốn của. Phụ nữ dễ xảy thai, đau bụng, mụn nhọt, bệnh ngoài da, ở goá, bệnh dai dẳng." },
    3: { ten: "Tam Bích", tenKhac: "Lộc Tồn", nguHanh: "Mộc", cung: "Chấn (+)",
      mauSac: "Xanh lá cây", bieuTuong: "Rường, cột nhà, vườn góc, dụng cụ tra tấn",
      coThe: "☳ Chân, Gan, hệ thần kinh, gân mạch và các bệnh về hệ vận động",
      tinhChat: "Kình (mạnh mẽ) mà trực (thẳng thắn)", loaiTinh: "Hung tinh",
      khiSinhVuong: "Hưng gia lập nghiệp, giàu sang phú quý, công thành danh toại, vượng nhất ngành trưởng.",
      khiSuyTu: "Dễ dính kiện tụng, trộm cướp, bệnh tật, hình khắc vợ con. Bệnh nhiễm trùng máu, bệnh về chân, gan, mật." },
    4: { ten: "Tứ Lục", tenKhac: "Văn Xương", nguHanh: "Mộc", cung: "Tốn (-)",
      mauSac: "Xanh dương", bieuTuong: "Miếu, cây mây, dây thừng",
      coThe: "☴ Đùi, Đởm( túi mật), liên quan đến mạch máu, khí quản, các chứng phong thấp và trúng phong",
      tinhChat: "Hoà hoãn", loaiTinh: "Cát tinh",
      khiSinhVuong: "Thi cử đỗ đạt, quân tử thăng quan, tiểu nhân có tiền của, lấy được vợ hiền/chồng giỏi, có tài văn chương.",
      khiSuyTu: "Dễ mắc bệnh thần kinh, hen suyễn, sống phiêu bạt; đam mê tửu sắc phá tan cơ nghiệp. Dễ xảy thai, bệnh thắt lưng, tai nạn bất ngờ." },
    5: { ten: "Ngũ Hoàng", tenKhac: "Liêm Trinh", nguHanh: "Thổ", cung: "Trung cung",
      mauSac: "Vàng", bieuTuong: "Đế quyền, rồng vàng, hoàng bào",
      coThe: "(Không có mô tả riêng)",
      tinhChat: "(Không có mô tả riêng)", loaiTinh: "Đại hung tinh",
      khiSinhVuong: "Khi ở đúng trung cung: vượng cả đinh lẫn tài, sự nghiệp phát triển.",
      khiSuyTu: "Khi bay ra hướng khác: Ngũ Hoàng đại sát, sát tinh lớn nhất. Gặp Thái Tuế/Tam Sát/Thất Sát thì hại người mất của, bệnh tật, nặng có thể nguy hiểm tính mạng." },
    6: { ten: "Lục Bạch", tenKhac: "Vũ Khúc", nguHanh: "Kim", cung: "Càn (+)",
      mauSac: "Trắng, bạc", bieuTuong: "Chuông, đỉnh (vạc), ngọc, đá, vàng",
      coThe: "☰ Đầu, Đại trường, xương khớp",
      tinhChat: "Cương mà động", loaiTinh: "Cát tinh",
      khiSinhVuong: "Lắm của đông người, quyền cao chức trọng, phát lớn về nghiệp võ, uy danh lừng lẫy. Cát tinh thứ ba.",
      khiSuyTu: "Dễ dính kiện tụng, vất vả chốn quan trường. Đau đầu, đau ngực, thương tích do kim loại. Hình hại vợ con, cô đơn." },
    7: { ten: "Thất Xích", tenKhac: "Phá Quân", nguHanh: "Kim", cung: "Đoài (-)",
      mauSac: "Đỏ", bieuTuong: "Đao kiếm, kích, rìu",
      coThe: "☱ Miệng, Phổi, Liên quan đến hệ hô hấp (phế quản), miệng, lưỡi, họng và răng",
      tinhChat: "Quyết đoán mà nhanh nhẹn", loaiTinh: "Hung tinh",
      khiSinhVuong: "Vượng cả đinh lẫn tài, sự nghiệp phát đạt, chi út phát phúc, phát về nghiệp võ, quan vận hanh thông.",
      khiSuyTu: "Dễ gây rắc rối, sống lưu lạc, trộm cướp. Hoả hoạn, tổn thất nhân khẩu, bệnh hô hấp/phổi/cổ họng, bất lợi cho bé gái." },
    8: { ten: "Bát Bạch", tenKhac: "Tả Phù", nguHanh: "Thổ", cung: "Cấn (+)",
      mauSac: "Trắng", bieuTuong: "Vườn cây, gò đống",
      coThe: "☶ Tay, Vị, Tương ứng với các phần nhô ra trên cơ thể như mũi, vú, gót chân; dùng để điều trị các chứng ứ trệ, bệnh về dạ dày",
      tinhChat: "Bình an, dừng lại", loaiTinh: "Cát tinh",
      khiSinhVuong: "Công danh phú quý, hợp lập nghiệp/vượng tài, nghỉ ngơi dưỡng sức. Cát tinh thứ hai, có thể hoá giải hung sát.",
      khiSuyTu: "Dễ tổn hại trẻ nhỏ, bệnh liên quan tay chân, gân cốt, sống lưng, trướng bụng." },
    9: { ten: "Cửu Tử", tenKhac: "Hữu Bật", nguHanh: "Hỏa", cung: "Ly (-)",
      mauSac: "Đỏ tía", bieuTuong: "Bếp lò, đèn, nến",
      coThe: "☲ Mắt, tim, vùng trung thượng vị (là phần bụng phía trên rốn và ngay dưới xương ức, chứa dạ dày, gan, tụy và tá tràng), ngực, vùng mặt và các chứng bệnh nhiệt, viêm nhiễm",
      tinhChat: "Nóng nảy hung bạo", loaiTinh: "Cát tinh",
      khiSinhVuong: "Phát phúc rất nhanh, vượng cả đinh lẫn tài, sự nghiệp ổn định, tài văn chương xuất chúng, phát phúc cho chi thứ.",
      khiSuyTu: "Tính tình kiên cường, khí khái, dễ bị hoả hoạn. Dễ thổ huyết, bệnh về tim và mạch máu, khó sinh." }
  };

  var KY_NEN_BY_CATEGORY = {
    vuong: { nen: "Đặt phòng ngủ, đầu giường, bàn làm việc/học, bàn thờ, cổng cửa chính. Dùng đèn vàng để tăng cường.",
      ky: "Bỏ trống, ít sử dụng, hoặc để u ám thiếu ánh sáng." },
    sinh: { nen: "Có thể bố trí sinh hoạt lâu dài vì khí đang lớn dần, sắp tới sẽ vượng.",
      ky: "Chưa cần kiêng kỵ đặc biệt, nhưng cũng chưa nên kích hoạt quá mạnh." },
    suy: { nen: "Nếu bắt buộc phải dùng/mở cửa ở đây thì nên có yếu tố Thủy (nước, gương, màu xanh dương/đen) hỗ trợ. Dùng đèn trắng.",
      ky: "Đặt bếp, cổng cửa chính. Dùng đèn vàng." },
    tu: { nen: "Giữ khô thoáng, yên tĩnh; có thể dùng vật phẩm ngũ hành tương sinh phù hợp với sao để hoá giải.",
      ky: "Đặt phòng ngủ lâu dài, bếp, cổng cửa chính. Kích hoạt rung động, tiếng ồn, ánh sáng mạnh tại đây." }
  };

  var currentVan = 9;
  var currentNamXem = new Date().getFullYear();
  // nienTinhTrungCung/flyStarValue/rectExitPoint/wedgeAreaOfHouse/rectPolyFromCenter/computeHuongStats
  // đã alias sang CM ở đầu file (dòng ~270-277) — không định nghĩa lại ở đây.

  // renderCompassOverlay: alias gọi sang CompassModule, truyền ctx (dependency injection)
  // thay cho việc đọc trực tiếp setScaledFontSize/scaledOffset/currentVan/currentNamXem như bản gốc.
  function renderCompassOverlay(svgSelector, center, housePoints, rotationDeg, centerCellHalfW, centerCellHalfH, khuyetThreshold) {
    return CM.renderCompassOverlay(svgSelector, center, housePoints, rotationDeg, centerCellHalfW, centerCellHalfH, khuyetThreshold, {
      getScaledFontSize: setScaledFontSize,
      scaledOffset: scaledOffset,
      currentVan: currentVan,
      currentNamXem: currentNamXem,
      onHuongClick: openHuongModal
    });
  }


  // Đánh dấu cửa nhà (mốc tham chiếu tĩnh cho la bàn — cạnh đầu tiên của đa giác).
  // Khác với các cửa tương tác được quản lý bởi CuaModule bên dưới.
  // (drawDoorMarker cũ đã bị loại bỏ — cửa mặc định giờ là 1 entry thật trong cuuCungDoors, vẽ qua CuaModule.svgForDoors)

  function buildEdgeList() {
    var container = document.getElementById("edgeList");
    container.innerHTML = "";
    var n = currentPoints.length;

    for (var i = 0; i < n; i++) {
      (function (edgeIdx) {
        var aIdx = edgeIdx, bIdx = (edgeIdx + 1) % n;
        var a = currentPoints[aIdx], b = currentPoints[bIdx];
        var lenPx = distance(a, b);
        var lenM = lenPx / scalePxPerMeter;
        var bearing = edgeBearing(a, b);

        var aLocked = lockedPoints[aIdx];
        var bLocked = lockedPoints[bIdx];
        var fullyLocked = aLocked && bLocked;
        var moveA = bLocked && !aLocked;

        var row = document.createElement("div");
        row.className = "edge-row" + (fullyLocked ? " locked" : "");

        var label = document.createElement("span");
        label.className = "edge-label";
        label.textContent = "Đ" + (aIdx + 1) + "→Đ" + (bIdx + 1);
        label.title = "Cạnh " + (edgeIdx + 1) + (fullyLocked ? " (Đã khoá)" : (moveA ? " (Cố định Đ" + (bIdx + 1) + ")" : ""));
        row.appendChild(label);

        function applyBearing(newBearing) {
          if (fullyLocked) return;
          if (moveA) {
            setPointByBearing(b, a, (newBearing + 180) % 360, lenPx);
          } else {
            setPointByBearing(a, b, newBearing, lenPx);
          }
          redraw(true);
        }

        var lenInput = document.createElement("input");
        lenInput.type = "number"; lenInput.step = "0.1"; lenInput.min = "0.1";
        lenInput.value = lenM.toFixed(2);
        lenInput.disabled = fullyLocked;
        lenInput.addEventListener("change", function () {
          if (fullyLocked) return;
          var newLenM = parseFloat(lenInput.value) || 0.1;
          var newLenPx = newLenM * scalePxPerMeter;
          if (moveA) {
            setPointByBearing(b, a, (bearing + 180) % 360, newLenPx);
          } else {
            setPointByBearing(a, b, bearing, newLenPx);
          }
          redraw(true);
        });
        row.appendChild(lenInput);

        var mLabel = document.createElement("span");
        mLabel.textContent = "m";
        row.appendChild(mLabel);

        // --- nút Đứng (gọn, chỉ icon — giống style tam-nha) ---
        var btnDung = document.createElement("button");
        btnDung.className = "edge-btn" + ((isAngleCloseTo(bearing, 0) || isAngleCloseTo(bearing, 180)) ? " active" : "");
        btnDung.textContent = "↕";
        btnDung.title = "Đứng (dọc)";
        btnDung.type = "button";
        btnDung.disabled = fullyLocked;
        btnDung.addEventListener("click", function () {
          var target = (bearing < 90 || bearing > 270) ? 0 : 180;
          applyBearing(target);
        });
        row.appendChild(btnDung);

        // --- nút Ngang (gọn, chỉ icon) ---
        var btnNgang = document.createElement("button");
        btnNgang.className = "edge-btn" + ((isAngleCloseTo(bearing, 90) || isAngleCloseTo(bearing, 270)) ? " active" : "");
        btnNgang.textContent = "↔";
        btnNgang.title = "Ngang";
        btnNgang.type = "button";
        btnNgang.disabled = fullyLocked;
        btnNgang.addEventListener("click", function () {
          var target = (bearing < 180) ? 90 : 270;
          applyBearing(target);
        });
        row.appendChild(btnNgang);

        var angleInput = document.createElement("input");
        angleInput.type = "number"; angleInput.step = "1"; angleInput.min = "0"; angleInput.max = "359";
        angleInput.value = bearing.toFixed(0);
        angleInput.disabled = fullyLocked;
        angleInput.title = "Góc nghiêng (0°=lên, 90°=phải, 180°=xuống, 270°=trái)";
        angleInput.addEventListener("change", function () {
          var deg = ((parseFloat(angleInput.value) || 0) % 360 + 360) % 360;
          applyBearing(deg);
        });
        row.appendChild(angleInput);

        var degLabel = document.createElement("span");
        degLabel.textContent = "°";
        row.appendChild(degLabel);

        // --- nút Khoá / Mở khoá — gọn, chỉ icon ---
        var btnLock = document.createElement("button");
        var isEdgeLocked = lockedPoints[aIdx] && lockedPoints[bIdx];
        btnLock.className = "edge-btn" + (isEdgeLocked ? " lock-on" : "");
        btnLock.textContent = isEdgeLocked ? "🔒" : "🔓";
        btnLock.title = "Khoá cạnh";
        btnLock.type = "button";
        btnLock.addEventListener("click", function () {
          var newState = !(lockedPoints[aIdx] && lockedPoints[bIdx]);
          lockedPoints[aIdx] = newState;
          lockedPoints[bIdx] = newState;
          redraw(true);
        });
        row.appendChild(btnLock);

        container.appendChild(row);
      })(i);
    }
  }

  function svgPoint(evt) {
    var pt = svgEl.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    var ctm = svgEl.getScreenCTM().inverse();
    return pt.matrixTransform(ctm);
  }

  function drawHandles() {
    if (screenLocked) return;
    currentPoints.forEach(function (p, idx) {
      var locked = !!lockedPoints[idx];
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("class", "handle" + (locked ? " locked" : ""));
      c.setAttribute("cx", p.x);
      c.setAttribute("cy", p.y);
      c.setAttribute("r", 8);
      c.dataset.idx = idx;
      if (!locked) {
        c.addEventListener("pointerdown", function (evt) {
          draggingIndex = idx;
          c.setPointerCapture(evt.pointerId);
        });
      }
      svgEl.appendChild(c);
    });
  }

  function onPointerMove(evt) {
    if (screenLocked || draggingIndex === -1 || lockedPoints[draggingIndex]) return;
    var p = svgPoint(evt);
    currentPoints[draggingIndex].x = Math.max(0, Math.min(400, p.x));
    currentPoints[draggingIndex].y = Math.max(0, Math.min(400, p.y));
    redraw(true);
  }

  function onPointerUp() {
    draggingIndex = -1;
  }

  function fitToScreen() {
    if (!svgEl || currentPoints.length === 0) return;
    var xs = currentPoints.map(function (p) { return p.x; });
    var ys = currentPoints.map(function (p) { return p.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var padding = 40;
    var vx = minX - padding, vy = minY - padding;
    var vw = (maxX - minX) + padding * 2, vh = (maxY - minY) + padding * 2;
    svgEl.setAttribute("viewBox", vx.toFixed(1) + " " + vy.toFixed(1) + " " + vw.toFixed(1) + " " + vh.toFixed(1));
  }

  // ==== LƯU / MỞ BẢN VẼ (xuất-nhập file JSON) ====
  // Thu thập toàn bộ trạng thái hiện tại (hình dạng nhà, cửa, tỉ lệ, các input) thành 1 object để xuất ra file.
  function layStateCuuCung() {
    function val(id) { var el = document.getElementById(id); return el ? el.value : ""; }
    function checked(id) { var el = document.getElementById(id); return el ? el.checked : false; }
    // Lấy thêm dữ liệu phòng từ module ve-phong
    var roomsData = [];
    if (window.VePhongModule && typeof window.VePhongModule.getRooms === 'function') {
      roomsData = window.VePhongModule.getRooms();
    }
    return {
      loai: "cuu-cung-luoi",
      phienBan: 1,
      ngayLuu: new Date().toISOString(),
      diem: currentPoints.map(function (p) { return { x: p.x, y: p.y }; }),
      diemKhoa: lockedPoints.slice(),
      cua: JSON.parse(JSON.stringify(cuuCungDoors)),
      phong: roomsData.map(function (r) {
        return {
          id: r.id,
          points: r.points.map(function (p) { return { x: p.x, y: p.y }; }),
          color: r.color,
          label: r.label,
          locked: !!r.locked,
          lockedEdges: Array.isArray(r.lockedEdges) ? r.lockedEdges.map(function (v) { return !!v; }) : []
        };
      }),
      tyLeMet: scalePxPerMeter,
      inputs: {
        shapeSelect: val("shapeSelect"), sidesInput: val("sidesInput"), scaleInput: val("scaleInput"),
        threshInput: val("threshInput"), doSoTay: val("doSoTay"), vanInput: val("vanInput"),
        namXemInput: val("namXemInput"), textScaleInput: val("textScaleInput"),
        khuyetLabelToggle: checked("khuyetLabelToggle"), compassToggle: checked("compassToggle")
      }
    };
  }

  // Áp dụng lại 1 state đã lưu (từ file JSON mở lên) — nạp toàn bộ input + hình dạng + cửa, rồi vẽ lại.
  function apDungStateCuuCung(obj) {
    if (!obj || obj.loai !== "cuu-cung-luoi" || !Array.isArray(obj.diem)) {
      alert("File không đúng định dạng bản vẽ Cửu Cung Lưới.");
      return;
    }
    function setVal(id, v) { var el = document.getElementById(id); if (el && v !== undefined) el.value = v; }
    function setChecked(id, v) { var el = document.getElementById(id); if (el) el.checked = !!v; }
    var inp = obj.inputs || {};
    setVal("shapeSelect", inp.shapeSelect);
    setVal("sidesInput", inp.sidesInput);
    setVal("scaleInput", inp.scaleInput);
    setVal("threshInput", inp.threshInput);
    setVal("doSoTay", inp.doSoTay);
    setVal("compassRotInput", inp.doSoTay); // đồng bộ ô hiển thị tại chỗ
    setVal("vanInput", inp.vanInput);
    setVal("namXemInput", inp.namXemInput);
    setVal("textScaleInput", inp.textScaleInput);
    setChecked("khuyetLabelToggle", inp.khuyetLabelToggle);
    setChecked("compassToggle", inp.compassToggle);
    var scaleValEl = document.getElementById("scaleVal"); if (scaleValEl) scaleValEl.innerText = inp.scaleInput || scalePxPerMeter;
    var textScaleValEl = document.getElementById("textScaleVal"); if (textScaleValEl) textScaleValEl.innerText = inp.textScaleInput || 100;

    currentPoints = obj.diem.map(function (p) { return { x: p.x, y: p.y }; });
    window.currentPoints = currentPoints;
    lockedPoints = Array.isArray(obj.diemKhoa) ? obj.diemKhoa.slice() : currentPoints.map(function () { return false; });
    cuuCungDoors.length = 0;
    (obj.cua || []).forEach(function (c) { cuuCungDoors.push(c); });
    scalePxPerMeter = obj.tyLeMet || scalePxPerMeter;

    // Khôi phục dữ liệu phòng từ module ve-phong
    if (window.VePhongModule && typeof window.VePhongModule.setRooms === 'function') {
      window.VePhongModule.setRooms(obj.phong || []);
    }

    redraw(true); // giữ nguyên currentPoints vừa nạp, không reset theo shapeSelect
  }
  // Expose cho ho-so.js (Hồ Sơ Nhà) gọi khi lưu/mở toàn bộ hồ sơ
  window.layStateCuuCung = layStateCuuCung;
  window.apDungStateCuuCung = apDungStateCuuCung;

  // Chỉ cập nhật khung nhà (không đụng cửa/phòng/cài đặt khác) — dùng cho nút "Đồng bộ" với Tâm Nhà
  window.apDungShapeCuuCung = function (newPoints) {
    if (!Array.isArray(newPoints) || newPoints.length < 3) return;
    currentPoints = newPoints.map(function (p) { return { x: p.x, y: p.y }; });
    window.currentPoints = currentPoints;
    lockedPoints = currentPoints.map(function () { return false; });
    redraw(true);
  };

  // Tải file JSON xuống máy với tên do người dùng đặt
  function luuBanVeCuuCung() {
    var ten = prompt("Đặt tên cho bản vẽ này:", "Nhà " + new Date().toLocaleDateString("vi-VN"));
    if (ten === null) return; // bấm huỷ
    if (!ten.trim()) ten = "ban-ve-cuu-cung-luoi";
    var state = layStateCuuCung();
    state.tenBanVe = ten;
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var tenFileAnToan = ten.trim().replace(/[\\/:*?"<>|]/g, "-");
    a.href = url;
    a.download = tenFileAnToan + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Đọc file JSON người dùng chọn và áp dụng lại
  function moBanVeCuuCung(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (evt) {
      try {
        var obj = JSON.parse(evt.target.result);
        apDungStateCuuCung(obj);
      } catch (e) {
        alert("Không đọc được file — file có thể bị hỏng hoặc không đúng định dạng JSON.");
      }
    };
    reader.readAsText(file);
  }

  // Đặt 1 Cửa chính mặc định (2 cánh, mở ra) tại cạnh đầu tiên của currentPoints — dùng chung
  // cho redraw() (khi đổi hình dạng) và apDungKichThuoc() (khi wizard khai báo nhanh xác nhận
  // kích thước), để tránh 2 nơi tính công thức bề rộng/offset mặc định khác nhau.
  function datCuaChinhMacDinh() {
    cuuCungDoors.length = 0;
    if (currentPoints.length < 2) return;
    var edgeLenM0 = distance(currentPoints[0], currentPoints[1]) / scalePxPerMeter;
    var defaultDoorWidth = edgeLenM0 > 1.5 ? Math.min(1.2, edgeLenM0 * 0.6) : Math.max(0.4, edgeLenM0 * 0.6);
    var defaultOffset = Math.max(0, (edgeLenM0 - defaultDoorWidth) / 2);
    cuuCungDoors.push({
      id: Date.now(), type: 'chinh', typeName: 'Cửa chính',
      edgeIndex: 0, offset: defaultOffset, width: defaultDoorWidth,
      leaves: 2, swingIn: false
    });
  }

  function redraw(keepPoints) {
    var threshold = parseInt(document.getElementById("threshInput").value, 10) || 70;
    if (!keepPoints) {
      var shape = document.getElementById("shapeSelect").value;
      currentPoints = SHAPES[shape].map(function (p) { return { x: p.x, y: p.y }; });
      window.currentPoints = currentPoints;
      document.getElementById("sidesInput").value = currentPoints.length;
      lockedPoints = currentPoints.map(function () { return false; });
      // Mặc định luôn có sẵn 1 Cửa chính — thay cho chấm xanh "CỬA" cũ. Đây là cửa THẬT, nằm
      // trong danh sách cửa (cuuCungDoors), chỉnh sửa/xoá được như mọi cửa khác qua CuaModule.
      datCuaChinhMacDinh();
      svgEl.setAttribute("viewBox", "0 0 400 400");
    }
    var showKhuyetLabel = document.getElementById("khuyetLabelToggle").checked;
    CuuCungGrid.render("#cuuCungSvg2", currentPoints, threshold, showKhuyetLabel);

    // Vẽ ký hiệu cửa (dùng chung CuaModule — thay cho drawDoors() cũ)
    if (cuuCungDoors.length > 0 && typeof CuaModule !== 'undefined') {
      var svgElDoors = document.querySelector("#cuuCungSvg2");
      if (svgElDoors) {
        svgElDoors.insertAdjacentHTML('beforeend', CuaModule.svgForDoors(
          currentPoints, cuuCungDoors, scalePxPerMeter, cuaIdentityWorldToScreen, cuuCungDoorCtx.getCenter()
        ));
      }
    }

    // Gọi render của module vẽ phòng TRƯỚC la bàn, để la bàn (và các nhãn hướng có thể tap
    // để mở popup thông tin) luôn nằm ở lớp trên cùng, không bị lớp phòng che mất khả năng tap.
    if (window.VePhongModule && typeof window.VePhongModule.render === 'function') {
      window.VePhongModule.render();
    }

    if (document.getElementById("compassToggle").checked) {
      var xs = currentPoints.map(function (p) { return p.x; });
      var ys = currentPoints.map(function (p) { return p.y; });
      var minXc = Math.min.apply(null, xs), maxXc = Math.max.apply(null, xs);
      var minYc = Math.min.apply(null, ys), maxYc = Math.max.apply(null, ys);
      var center = { x: (minXc + maxXc) / 2, y: (minYc + maxYc) / 2 };
      var centerCellHalfW = (maxXc - minXc) / 3 / 2;
      var centerCellHalfH = (maxYc - minYc) / 3 / 2;
      // Đồng bộ Hướng nhà với các tab khác (Tâm Nhà, Phi Tinh) — dùng chung 1 input #doSoTay
      // thay vì input riêng #compassRotInput trước đây (2 input tách biệt gây lệch hướng giữa các tab).
      var rotationDeg = parseInt(document.getElementById("doSoTay").value, 10) || 0;
      renderCompassOverlay("#cuuCungSvg2", center, currentPoints, rotationDeg, centerCellHalfW, centerCellHalfH, threshold);
    }

    drawHandles();
    buildEdgeList();
    if (typeof CuaModule !== 'undefined') CuaModule.renderList(cuuCungDoorCtx);
  }

  // =========================================================================
  // WIZARD "KHAI BÁO NHANH" cho Mặt Bằng Mẫu — Chữ Nhật (3 bước, mỗi bước có
  // thể Bỏ qua để giữ giá trị mặc định). Dùng lại modal cửa sẵn có (ccDoorModal
  // /ccDoorModalBox) để không phải tạo modal riêng — chỉ đổi nội dung box theo bước.
  // Kích hoạt tự động khi shapeSelect đổi thành "rect" (redraw() đã dựng sẵn
  // hình vuông mặc định trước khi wizard này mở lên để tinh chỉnh thêm).
  // =========================================================================
  var quickWizard = { step: 0, dai: null, rong: null, huongDo: null, sonCua: null };

  function moModalCC() {
    var m = document.getElementById("ccDoorModal");
    if (m) m.classList.add("active");
  }
  function dongQuickWizard() {
    var m = document.getElementById("ccDoorModal");
    if (m) m.classList.remove("active");
    quickWizard = { step: 0, dai: null, rong: null, huongDo: null, sonCua: null };
  }

  function batDauQuickWizard() {
    quickWizard = { step: 1, dai: null, rong: null, huongDo: null, sonCua: null };
    renderQuickWizard();
    moModalCC();
  }

  // Tiêu đề 1 bước wizard kèm nút "×" đóng toàn bộ ở góc phải (thay cho hàng "Hủy toàn bộ" riêng trước đây)
  function titleVoiNutDong(tieuDe) {
    return '<div class="modal-title" style="display:flex;align-items:center;justify-content:space-between;">' +
      '<span>' + tieuDe + '</span>' +
      '<span onclick="dongQuickWizardCC()" title="Hủy" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#f0f0f0;color:#555;font-size:15px;line-height:1;cursor:pointer;flex-shrink:0;">×</span>' +
      '</div>';
  }

  function renderQuickWizard() {
    var box = document.getElementById("ccDoorModalBox");
    if (!box) return;
    if (quickWizard.step === 1) {
      // Chiều dài/rộng hiện tại (suy từ currentPoints, quy đổi ra mét theo tỉ lệ đang dùng)
      var xs = currentPoints.map(function (p) { return p.x; });
      var ys = currentPoints.map(function (p) { return p.y; });
      var wM = ((Math.max.apply(null, xs) - Math.min.apply(null, xs)) / scalePxPerMeter).toFixed(2);
      var hM = ((Math.max.apply(null, ys) - Math.min.apply(null, ys)) / scalePxPerMeter).toFixed(2);
      box.innerHTML =
        titleVoiNutDong('📐 Khai báo nhanh — Bước 1/3: Kích thước') +
        '<div class="modal-hint">Nhập chiều dài và chiều rộng thật của nhà (mét).</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<div style="flex:1;"><label style="font-size:11px;color:#888;">Chiều dài (m)</label>' +
          '<input class="modal-input" type="number" id="qwDai" step="0.1" min="1" value="' + wM + '"></div>' +
          '<div style="flex:1;"><label style="font-size:11px;color:#888;">Chiều rộng (m)</label>' +
          '<input class="modal-input" type="number" id="qwRong" step="0.1" min="1" value="' + hM + '"></div>' +
        '</div>' +
        '<div class="modal-row">' +
          '<button class="btn-modal-cancel" onclick="boQuaQuickWizardBuoc1()">Bỏ qua</button>' +
          '<button class="btn-modal-next" onclick="xacNhanQuickWizardBuoc1()">Tiếp theo ▶</button>' +
        '</div>';
    } else if (quickWizard.step === 2) {
      var huongHienTai = document.getElementById("doSoTay") ? document.getElementById("doSoTay").value : 0;
      box.innerHTML =
        titleVoiNutDong('🧭 Khai báo nhanh — Bước 2/3: Hướng nhà') +
        '<div class="modal-hint">Độ xoay la bàn của nhà (0–359°). Có thể chỉnh lại chính xác hơn sau bằng thanh trượt hướng.</div>' +
        '<input class="modal-input" type="number" id="qwHuong" step="1" min="0" max="359" value="' + huongHienTai + '">' +
        '<div class="modal-row">' +
          '<button class="btn-modal-cancel" onclick="boQuaQuickWizardBuoc2()">Bỏ qua</button>' +
          '<button class="btn-modal-next" onclick="xacNhanQuickWizardBuoc2()">Tiếp theo ▶</button>' +
        '</div>';
    } else if (quickWizard.step === 3) {
      var ds24 = (typeof DS24_SON !== 'undefined') ? DS24_SON : (window.DS24_SON || []);
      var sonOpts = ds24.map(function (s) { return '<option value="' + s.ten + '">' + s.ten + '</option>'; }).join('');
      box.innerHTML =
        titleVoiNutDong('🚪 Khai báo nhanh — Bước 3/3: Cửa chính') +
        '<div class="modal-hint">Chọn sơn đặt Cửa chính — hệ thống sẽ tự đặt cửa vào đúng cạnh/vị trí tương ứng.</div>' +
        '<select class="modal-input" id="qwSonCua">' + sonOpts + '</select>' +
        '<div class="modal-row">' +
          '<button class="btn-modal-cancel" onclick="boQuaQuickWizardBuoc3()">Bỏ qua</button>' +
          '<button class="btn-modal-confirm" onclick="xacNhanQuickWizardBuoc3()">✅ Hoàn tất</button>' +
        '</div>';
    }
  }

  // ----- Bước 1: Kích thước -----
  function apDungKichThuoc(daiM, rongM) {
    var w = daiM * scalePxPerMeter, h = rongM * scalePxPerMeter;
    var x0 = 60, y0 = 60; // giữ cùng góc gốc với SHAPES.rect mặc định
    currentPoints = [
      { x: x0, y: y0 }, { x: x0 + w, y: y0 },
      { x: x0 + w, y: y0 + h }, { x: x0, y: y0 + h }
    ];
    window.currentPoints = currentPoints;
    document.getElementById("sidesInput").value = currentPoints.length;
    lockedPoints = currentPoints.map(function () { return false; });
    datCuaChinhMacDinh(); // cửa chính mặc định (cạnh đầu) — sẽ bị wizard bước 3 ghi đè nếu chọn sơn
    redraw(true);
  }
  window.xacNhanQuickWizardBuoc1 = function () {
    var dai = parseFloat(document.getElementById("qwDai").value);
    var rong = parseFloat(document.getElementById("qwRong").value);
    if (isNaN(dai) || dai <= 0 || isNaN(rong) || rong <= 0) {
      alert('⚠️ Nhập chiều dài và chiều rộng hợp lệ (> 0).');
      return;
    }
    quickWizard.dai = dai; quickWizard.rong = rong;
    apDungKichThuoc(dai, rong);
    if (typeof window.thongTinDongBoTuCuuCung === "function") window.thongTinDongBoTuCuuCung();
    quickWizard.step = 2;
    renderQuickWizard();
  };
  window.boQuaQuickWizardBuoc1 = function () {
    quickWizard.step = 2;
    renderQuickWizard();
  };

  // ----- Bước 2: Hướng nhà -----
  window.xacNhanQuickWizardBuoc2 = function () {
    var deg = parseInt(document.getElementById("qwHuong").value, 10);
    if (isNaN(deg)) { alert('⚠️ Nhập độ hướng hợp lệ (0–359).'); return; }
    deg = ((deg % 360) + 360) % 360;
    var doSoTayEl = document.getElementById("doSoTay");
    var compassRotEl = document.getElementById("compassRotInput");
    if (doSoTayEl) {
      doSoTayEl.value = deg;
      doSoTayEl.dispatchEvent(new Event("input", { bubbles: true })); // trigger listener có sẵn → tự redraw(true)
    } else {
      redraw(true); // fallback nếu #doSoTay không tồn tại
    }
    if (compassRotEl) compassRotEl.value = deg;
    quickWizard.huongDo = deg;
    quickWizard.step = 3;
    renderQuickWizard();
  };
  window.boQuaQuickWizardBuoc2 = function () {
    quickWizard.step = 3;
    renderQuickWizard();
  };

  // ----- Bước 3: Cửa chính theo sơn -----
  // Tách riêng phần đặt cửa theo sơn để dùng chung giữa wizard UI (bước 3) và API gọi thẳng
  // từ tab Thông Tin Nhà (apDungKhaiBaoNhanhCC) — tránh 2 nơi viết lại cùng logic.
  function datCuaChinhTheoSon(sonTen) {
    if (typeof CuaModule === 'undefined' || typeof CuaModule.timViTriTheoSon !== 'function') return false;
    var cuaChinh = cuuCungDoors.filter(function (d) { return d.type === 'chinh'; })[0];
    var width = cuaChinh ? cuaChinh.width : 1.0;
    var viTri = CuaModule.timViTriTheoSon(sonTen, cuuCungDoorCtx, width);
    if (!viTri) return false;
    if (cuaChinh) {
      cuaChinh.edgeIndex = viTri.edgeIndex;
      cuaChinh.offset = viTri.offset;
    } else {
      cuuCungDoors.push({
        id: Date.now(), type: 'chinh', typeName: 'Cửa chính',
        edgeIndex: viTri.edgeIndex, offset: viTri.offset, width: width,
        leaves: 2, swingIn: false
      });
    }
    return true;
  }

  window.xacNhanQuickWizardBuoc3 = function () {
    var sonTen = document.getElementById("qwSonCua").value;
    var ok = datCuaChinhTheoSon(sonTen);
    if (!ok) { alert('Không tìm được vị trí phù hợp cho sơn ' + sonTen + ' trên mặt bằng hiện tại.'); return; }
    quickWizard.sonCua = sonTen;
    redraw(true);
    if (typeof window.thongTinDongBoTuCuuCung === "function") window.thongTinDongBoTuCuuCung();
    dongQuickWizardCC();
  };
  window.boQuaQuickWizardBuoc3 = function () {
    dongQuickWizardCC();
  };

  window.dongQuickWizardCC = dongQuickWizard;
  window.batDauQuickWizardCC = batDauQuickWizard;

  // ===== API gọi thẳng (không qua UI wizard) — dùng bởi tab Thông Tin Nhà (thong-tin-nha.js) =====
  // Cho phép khai báo Mặt bằng (hình dạng, dài, rộng, cửa chính theo sơn) từ nơi khác mà không
  // cần mở modal wizard từng bước. Trả về true nếu áp dụng thành công.
  window.apDungKhaiBaoNhanhCC = function (shape, daiM, rongM, sonCua) {
    var shapeSelectEl = document.getElementById("shapeSelect");
    if (shape && shapeSelectEl && SHAPES[shape]) {
      shapeSelectEl.value = shape;
      redraw(false); // dựng hình mẫu theo shape mới + cửa mặc định (giống người dùng tự đổi shapeSelect)
    }
    if (shape === "rect" && daiM > 0 && rongM > 0) {
      apDungKichThuoc(daiM, rongM); // chỉ áp dụng dài/rộng thật cho mẫu Chữ Nhật
    }
    if (sonCua) {
      datCuaChinhTheoSon(sonCua);
      redraw(true);
    }
    return true;
  };

  // Đọc lại trạng thái Mặt bằng hiện tại — dùng bởi tab Thông Tin Nhà để tự cập nhật ô hiển thị
  // mỗi khi người dùng đổi trực tiếp bên Cửu Cung Lưới (shape/kích thước/cửa chính).
  window.layThongTinMatBangCC = function () {
    var shapeSelectEl = document.getElementById("shapeSelect");
    var shape = shapeSelectEl ? shapeSelectEl.value : null;
    var xs = currentPoints.map(function (p) { return p.x; });
    var ys = currentPoints.map(function (p) { return p.y; });
    var daiM = ((Math.max.apply(null, xs) - Math.min.apply(null, xs)) / scalePxPerMeter);
    var rongM = ((Math.max.apply(null, ys) - Math.min.apply(null, ys)) / scalePxPerMeter);
    var sonCua = null;
    if (typeof CuaModule !== 'undefined' && typeof CuaModule.layTenSonCuaChinh === 'function') {
      sonCua = CuaModule.layTenSonCuaChinh(cuuCungDoorCtx);
    }
    return { shape: shape, daiM: Math.round(daiM * 100) / 100, rongM: Math.round(rongM * 100) / 100, sonCua: sonCua };
  };

  function regularPolygon(n, cx, cy, r) {
    cx = cx || 200; cy = cy || 200; r = r || 140;
    var pts = [];
    for (var i = 0; i < n; i++) {
      var angle = (-90 + i * (360 / n)) * Math.PI / 180;
      pts.push({
        x: +(cx + r * Math.cos(angle)).toFixed(1),
        y: +(cy + r * Math.sin(angle)).toFixed(1)
      });
    }
    return pts;
  }

  function openHuongModal(idx) {
    var d = HUONG_DATA[idx];
    var van = getVanTrangThai(d.sao, currentVan);
    document.getElementById("huongModalTitle").textContent =
      BATQUAI_NAMES[idx] + " - " + PHUONG_VI_FULL[idx] + " - " + d.hanh;
    document.getElementById("huongModalNguoi").textContent = d.nguoiNha;
    document.getElementById("huongModalCoThe").textContent = CUU_TINH_DATA[d.sao].coThe;
    document.getElementById("huongModalYNghia").textContent = d.quai + " — " + d.yNghia;
    document.getElementById("huongModalVan").innerHTML =
      "Vận " + currentVan + " — Sao " + d.sao + " — " +
      "<span class='khi-tag khi-" + van.category + "'>" + van.trangThai + "</span> (" + van.moTa + ")";

    var pt = scorePhongThuy(d.sao, currentVan);
    var ptClass = pt.loai === "Phong" ? "pt-phong" : (pt.loai === "Thủy" ? "pt-thuy" : "pt-trung");
    document.getElementById("huongModalPhongThuy").innerHTML =
      "<span class='khi-tag " + ptClass + "'>" + pt.loai + (pt.diem > 0 ? " " + pt.diem + "/4" : "") + "</span>";

    var tinh = CUU_TINH_DATA[d.sao];
    document.getElementById("huongModalSaoTen").textContent = tinh.ten + " (" + tinh.tenKhac + ") — " + tinh.loaiTinh;
    document.getElementById("huongModalTinhChat").textContent = tinh.tinhChat;
    document.getElementById("huongModalAnhHuong").textContent =
      (van.category === "vuong" || van.category === "sinh") ? tinh.khiSinhVuong : tinh.khiSuyTu;

    var nienVal = flyStarValue(nienTinhTrungCung(currentNamXem), d.sao);
    var nienTinhObj = CUU_TINH_DATA[nienVal];
    var nienTagClass = (nienTinhObj.loaiTinh === "Cát tinh") ? "khi-vuong" : "khi-tu";
    document.getElementById("huongModalNienTinh").innerHTML =
      "Năm " + currentNamXem + " — Sao " + nienVal + " (" + nienTinhObj.ten + " - " + nienTinhObj.tenKhac + ") — " +
      "<span class='khi-tag " + nienTagClass + "'>" + nienTinhObj.loaiTinh + "</span>";

    var warningEl = document.getElementById("huongModalWarning");
    var khiXau = (van.category === "suy" || van.category === "tu");
    var nienXau = (nienTinhObj.loaiTinh !== "Cát tinh");
    if (khiXau && nienXau) {
      warningEl.style.display = "block";
      warningEl.textContent = "⚠️ Đáng lo ngại: cung này đang " + van.trangThai +
        ", năm " + currentNamXem + " lại gặp Niên Tinh " + nienTinhObj.loaiTinh.toLowerCase() +
        " (" + nienTinhObj.ten + "). Hai lớp khí xấu chồng nhau — nên đặc biệt chú ý hoá giải, " +
        "hạn chế động thổ/sửa chữa lớn ở khu vực này trong năm nay.";
    } else {
      warningEl.style.display = "none";
      warningEl.textContent = "";
    }

    var kyNen = KY_NEN_BY_CATEGORY[van.category];
    document.getElementById("huongModalNen").textContent = kyNen.nen;
    document.getElementById("huongModalKy").textContent = kyNen.ky;
    document.getElementById("huongModalLuuY").textContent = d.luuY;
    var _ov = document.getElementById("huongModalOverlay");
    if (_ov) _ov.classList.add("open");
  }

  function vanCssClass(trangThai) {
    if (trangThai.indexOf("Vượng") === 0) return "van-vuong";
    if (trangThai.indexOf("Sinh") === 0) return "van-sinh";
    if (trangThai.indexOf("Suy") === 0) return "van-suy";
    return "van-tu";
  }

  function buildHuongRefTable() {
    var table = document.getElementById("huongRefTable");
    var html = "<tr><th>Hướng</th><th>Người/Cơ thể</th><th>Sao</th><th>Trạng thái Vận " + currentVan + "</th><th>Mức độ</th></tr>";
    // Trung cung lên đầu bảng — theo đúng quy ước trình bày Phi Tinh (Trung cung trước, rồi 8 hướng quanh).
    var vanTrung = getVanTrangThai(TRUNG_CUNG_DATA.sao, currentVan);
    html += "<tr><td>Trung cung</td><td>—</td><td>" + TRUNG_CUNG_DATA.sao + "</td>" +
      "<td class='" + vanCssClass(vanTrung.trangThai) + "'>" + vanTrung.trangThai + "</td><td>—</td></tr>";
    for (var k = 0; k < 8; k++) {
      var d = HUONG_DATA[k];
      var van = getVanTrangThai(d.sao, currentVan);
      var pt = scorePhongThuy(d.sao, currentVan);
      html += "<tr>" +
        "<td>" + BATQUAI_NAMES[k] + "</td>" +
        "<td>" + d.nguoiNha + " / " + d.coThe + "</td>" +
        "<td>" + d.sao + "</td>" +
        "<td class='" + vanCssClass(van.trangThai) + "'>" + van.trangThai + "</td>" +
        "<td>" + pt.loai + (pt.diem > 0 ? " " + pt.diem : "") + "</td>" +
        "</tr>";
    }
    table.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("cuuCungSvg2")) return;
    buildHuongRefTable();
    var _mClose = document.getElementById("huongModalClose");
    var _mOverlay = document.getElementById("huongModalOverlay");
    if (_mClose) _mClose.addEventListener("click", function () {
      if (_mOverlay) _mOverlay.classList.remove("open");
    });
    if (_mOverlay) _mOverlay.addEventListener("click", function (evt) {
      if (evt.target.id === "huongModalOverlay") evt.currentTarget.classList.remove("open");
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    svgEl = document.getElementById("cuuCungSvg2");
    if (!svgEl) return;
    svgEl.addEventListener("pointermove", onPointerMove);
    svgEl.addEventListener("pointerup", onPointerUp);
    svgEl.addEventListener("pointerleave", onPointerUp);

    redraw(false);
    document.getElementById("shapeSelect").addEventListener("change", function (evt) {
      redraw(false);
      // Chọn mẫu Chữ Nhật → tự mở chuỗi khai báo nhanh (Kích thước → Hướng → Cửa chính),
      // mỗi bước có thể "Bỏ qua" để giữ nguyên giá trị mặc định vừa vẽ.
      if (evt.target.value === "rect") batDauQuickWizardCC();
      // Báo cho tab Thông Tin Nhà biết mặt bằng vừa đổi, để nó tự cập nhật lại ô hiển thị
      // (không hỏi xác nhận theo chiều này — Thông Tin chỉ hiển thị theo, không phải nguồn gốc thay đổi).
      if (typeof window.thongTinDongBoTuCuuCung === "function") window.thongTinDongBoTuCuuCung();
    });
    document.getElementById("threshInput").addEventListener("change", function () { redraw(true); });

    var ccLuuBtnEl = document.getElementById("ccLuuBtn");
    if (ccLuuBtnEl) ccLuuBtnEl.addEventListener("click", luuBanVeCuuCung);
    var ccMoBtnEl = document.getElementById("ccMoBtn");
    var ccFileInputEl = document.getElementById("ccFileInput");
    if (ccMoBtnEl && ccFileInputEl) {
      ccMoBtnEl.addEventListener("click", function () { ccFileInputEl.click(); });
      ccFileInputEl.addEventListener("change", function (evt) {
        moBanVeCuuCung(evt.target.files[0]);
        ccFileInputEl.value = ""; // reset để mở lại cùng file lần sau vẫn bắn được sự kiện change
      });
    }

    var doSoTayEl = document.getElementById("doSoTay");
    var compassRotEl = document.getElementById("compassRotInput");
    if (doSoTayEl && compassRotEl) compassRotEl.value = doSoTayEl.value; // đồng bộ giá trị hiển thị ban đầu

    // ===== Hiển thị Trạch nhà (Vận/Năm nhập trạch) — thuần đọc từ #vanNhapTrach/#namNhapTrach =====
    // (khai báo gốc ở tab Nội Khí, cũng là nơi tab Thông Tin trỏ vào). Đây CHỈ là hiển thị tham
    // khảo, không dùng để tính currentVan (bảng 8 hướng vẫn theo "Vận xem"/Niên Tinh như trước).
    function capNhatHienThiTrachNhaCC() {
        var elText = document.getElementById("ccTrachNhaText");
        if (!elText) return;
        var vanNhapTrachEl = document.getElementById("vanNhapTrach");
        var namNhapTrachEl = document.getElementById("namNhapTrach");
        var van = vanNhapTrachEl ? vanNhapTrachEl.value : null;
        var nam = namNhapTrachEl ? namNhapTrachEl.value : null;
        elText.textContent = (van ? "Vận " + van : "—") + (nam ? " — nhập trạch năm " + nam : "");
    }
    capNhatHienThiTrachNhaCC();
    var vanNhapTrachGlobalEl = document.getElementById("vanNhapTrach");
    var namNhapTrachGlobalEl = document.getElementById("namNhapTrach");
    if (vanNhapTrachGlobalEl) vanNhapTrachGlobalEl.addEventListener("change", capNhatHienThiTrachNhaCC);
    if (namNhapTrachGlobalEl) namNhapTrachGlobalEl.addEventListener("change", capNhatHienThiTrachNhaCC);
    window.capNhatHienThiTrachNhaCC = capNhatHienThiTrachNhaCC; // để tab khác (Thông Tin) gọi lại nếu cần

    // Sửa hướng ở Tâm Nhà (#doSoTay) → đồng bộ hiển thị sang ô ngay tại Cửu Cung Lưới, rồi vẽ lại
    if (doSoTayEl) doSoTayEl.addEventListener("input", function () {
      if (compassRotEl) compassRotEl.value = doSoTayEl.value;
      redraw(true);
    });
    // Sửa hướng ngay tại Cửu Cung Lưới (#compassRotInput) → ghi ngược lại #doSoTay và bắn sự kiện "input"
    // để các tab khác (Tâm Nhà, Phi Tinh) đang lắng nghe #doSoTay cũng nhận được, rồi vẽ lại tại đây.
    if (compassRotEl) compassRotEl.addEventListener("input", function () {
      if (doSoTayEl) {
        doSoTayEl.value = compassRotEl.value;
        doSoTayEl.dispatchEvent(new Event("input", {bubbles: true}));
      }
      redraw(true);
    });

    // ===== Đồng bộ "Vận xem" + "Năm xem" với Vận trạch bên tab Nội Khí (phi-tinh.js) =====
    // Nguồn chân lý duy nhất là ô #namXem (năm đang xem) dùng chung toàn app. #vanInput ở đây
    // chỉ HIỂN THỊ (readonly) Vận hiện tại tự tính từ năm đó — không cho gõ tay để tránh lệch
    // với Vận trạch bên Phi Tinh như trước. #namXemInput vẫn cho chỉnh riêng (dùng cho Niên Tinh
    // của tab này) nhưng khi đổi sẽ đồng bộ ngược lại #namXem để cả 2 tab luôn khớp nhau.
    function dongBoVanTheoNamXem() {
      var namXemEl = document.getElementById("namXem"); // input dùng chung, thuộc tab Nội Khí
      var nam = namXemEl ? parseInt(namXemEl.value, 10) : currentNamXem;
      if (isNaN(nam)) nam = currentNamXem;
      currentNamXem = nam;
      currentVan = (typeof tinhVanTuNam === "function") ? tinhVanTuNam(nam) : currentVan;
      var vanInputEl = document.getElementById("vanInput");
      if (vanInputEl) vanInputEl.value = currentVan;
      var namXemInputEl = document.getElementById("namXemInput");
      if (namXemInputEl) namXemInputEl.value = nam;
      buildHuongRefTable();
    }
    window.dongBoVanTheoNamXem = dongBoVanTheoNamXem; // để phi-tinh.js gọi ngược lại nếu cần

    var namXemGlobalEl = document.getElementById("namXem");
    if (namXemGlobalEl) {
      dongBoVanTheoNamXem(); // khởi tạo đúng theo năm hiện có sẵn (vd nạp từ hồ sơ đã lưu)
      namXemGlobalEl.addEventListener("input", dongBoVanTheoNamXem);
      namXemGlobalEl.addEventListener("change", dongBoVanTheoNamXem);
    }

    var namXemInput = document.getElementById("namXemInput");
    namXemInput.value = currentNamXem;
    namXemInput.addEventListener("change", function (evt) {
      var y = parseInt(evt.target.value, 10) || currentNamXem;
      evt.target.value = y;
      // Ghi ngược lại #namXem (nguồn chung) rồi để listener phía trên tự đồng bộ Vận + vẽ lại —
      // đảm bảo đổi năm ở đây cũng cập nhật đúng Vận trạch bên tab Nội Khí, không chỉ một chiều.
      if (namXemGlobalEl) {
        namXemGlobalEl.value = y;
        namXemGlobalEl.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        currentNamXem = y;
      }
      redraw(true);
    });

    var _fitBtn = document.getElementById("fitBtn");
    if (!_fitBtn) return;
    _fitBtn.addEventListener("click", function () {
      fitToScreen();
      redraw(true);
    });
    document.getElementById("resetViewBtn").addEventListener("click", function () {
      svgEl.setAttribute("viewBox", "0 0 400 400");
      redraw(true);
    });
    document.getElementById("khuyetLabelToggle").addEventListener("change", function () { redraw(true); });

    document.getElementById("textScaleInput").addEventListener("input", function (evt) {
      var v = parseInt(evt.target.value, 10) || 100;
      document.getElementById("textScaleVal").textContent = v;
      manualTextScale = v / 100;
      redraw(true);
    });

    var _lockBtn = document.getElementById("lockScreenBtn");
    if (_lockBtn) _lockBtn.addEventListener("click", function (evt) {
      screenLocked = !screenLocked;
      var btn = evt.target;
      var edgeListEl = document.getElementById("edgeList");
      if (screenLocked) {
        btn.textContent = "🔒 Đã khoá";
        btn.title = "Đã khoá góc nhà — bấm để mở lại";
        btn.classList.add("active");
        edgeListEl.classList.add("screen-locked");
      } else {
        btn.textContent = "🔓 Khoá góc nhà";
        btn.title = "Khoá góc nhà (tránh chạm nhầm khi xoay/kéo hình)";
        btn.classList.remove("active");
        edgeListEl.classList.remove("screen-locked");
      }
      redraw(true);
    });

    document.getElementById("addDoorBtn").addEventListener("click", function () {
      CuaModule.startWizard(cuuCungDoorCtx);
    });

    var sidesInput = document.getElementById("sidesInput");
    sidesInput.addEventListener("change", function () {
      var n = Math.max(3, Math.min(20, parseInt(sidesInput.value, 10) || 3));
      sidesInput.value = n;
      currentPoints = regularPolygon(n);
      window.currentPoints = currentPoints;
      lockedPoints = currentPoints.map(function () { return false; });
      svgEl.setAttribute("viewBox", "0 0 400 400");
      redraw(true);
    });

    var scaleInput = document.getElementById("scaleInput");
    scaleInput.addEventListener("input", function () {
      scalePxPerMeter = parseInt(scaleInput.value, 10);
      document.getElementById("scaleVal").textContent = scalePxPerMeter;
      redraw(true);
    });

    document.getElementById("compassToggle").addEventListener("change", function () {
      redraw(true);
    });
  });

  window.cuuCungLuoiRedraw = function() { if (typeof redraw === "function") redraw(true); };
})();