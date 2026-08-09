// ====================================================================
// cua-module.js
// Modul CỬA dùng chung cho nhiều tab (Tâm Nhà, Cửu Cung Lưới, ...)
// Không tự giữ dữ liệu nhà — nhận vào "ctx" (context adapter) mô tả
// cách lấy đỉnh/cạnh/tỉ lệ/danh sách cửa từ tab đang dùng.
//
// ctx cần có các hàm/thuộc tính:
//   modalId        : id thẻ overlay modal (vd 'tnDoorModal')
//   boxId          : id thẻ nội dung modal (vd 'tnDoorModalBox')
//   listId         : id thẻ chứa danh sách cửa (vd 'tnDoorList')
//   idPrefix       : tiền tố id cho các input trong danh sách (vd 'tn')
//   getVertices()  : trả về mảng đỉnh [{x,y}, ...] (đơn vị world-px)
//   isClosed()     : true nếu đa giác đã đóng
//   getPxPerMeter(): số px ứng với 1 mét hiện tại
//   getDoors()     : trả về mảng cửa hiện có (tạo mới [] nếu chưa có)
//   onChange()     : gọi khi có cửa được thêm/sửa/xoá (để tab tự vẽ lại)
// ====================================================================

(function () {
  'use strict';

  var DOOR_TYPE_LABELS = { chinh: 'Cửa chính', phu: 'Cửa phụ', so: 'Cửa sổ' };
  var DOOR_TYPE_ICONS  = { chinh: 'Cửa chính 🚪', phu: 'Cửa phụ 🚪', so: 'Cửa sổ 🪟' };
  var DOOR_TYPE_COLORS = { chinh: '#8b0000', phu: '#1a5c3a', so: '#1565c0' };
  var DOOR_TYPE_TAGS   = { chinh: 'CC', phu: 'CP', so: 'CS' };

  function edgeLabel(i, n) {
    return String.fromCharCode(65 + i) + String.fromCharCode(65 + ((i + 1) % n));
  }
  function edgeLengthM(vertices, edgeIndex, pxPerMeter) {
    var n = vertices.length, a = vertices[edgeIndex], b = vertices[(edgeIndex + 1) % n];
    return Math.hypot(b.x - a.x, b.y - a.y) / pxPerMeter;
  }

  // Điểm giữa của 1 cửa, tính theo cùng hệ toạ độ với `vertices` (world, chưa quy đổi màn hình)
  function doorWorldMidpoint(door, vertices, pxPerMeter) {
    var n = vertices.length, a = vertices[door.edgeIndex], b = vertices[(door.edgeIndex + 1) % n];
    var edgeLenPx = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    var ux = (b.x - a.x) / edgeLenPx, uy = (b.y - a.y) / edgeLenPx;
    var offsetPx = (door.offset + door.width / 2) * pxPerMeter;
    return { x: a.x + ux * offsetPx, y: a.y + uy * offsetPx };
  }

  // Nhãn "xxx° - Tên sơn" cho 1 điểm, tính từ tâm nhà — theo toạ độ MÀN HÌNH (không phải world),
  // vì màn hình luôn có quy ước phổ quát "lên = Bắc, phải = Đông" bất kể mỗi tab dùng hệ world khác nhau
  // (tam-nha: +y world hướng lên; cửu-cung-lưới: +y world hướng xuống theo chuẩn SVG). Nhờ vậy hàm này
  // dùng đúng cho mọi tab miễn ctx cung cấp worldToScreen(). Cần timSonTheoGoc() toàn cục (shared.js).
  // Bắn tia từ tâm (toạ độ MÀN HÌNH) theo hướng dirX/dirY, tìm giao điểm với cạnh đa giác gần nhất.
  // Làm việc trong không gian màn hình (không phải world) để không phụ thuộc chiều +y world khác
  // nhau giữa các tab — xem lý do tương tự trong doorSonInfo() bên dưới.
  function raySnapEdge(centerScreen, dirX, dirY, verticesScreen) {
    var n = verticesScreen.length, best = null;
    for (var i = 0; i < n; i++) {
      var p1 = verticesScreen[i], p2 = verticesScreen[(i + 1) % n];
      var ex = p2.x - p1.x, ey = p2.y - p1.y;
      var a11 = dirX, a12 = -ex, b1 = p1.x - centerScreen.x;
      var a21 = dirY, a22 = -ey, b2 = p1.y - centerScreen.y;
      var det = a11 * a22 - a12 * a21;
      if (Math.abs(det) < 1e-9) continue;
      var t = (b1 * a22 - a12 * b2) / det; // khoảng cách dọc tia
      var s = (a11 * b2 - a21 * b1) / det; // tham số dọc cạnh, 0..1
      if (t > 1e-6 && s >= -1e-6 && s <= 1 + 1e-6) {
        if (best === null || t < best.t) best = { t: t, edgeIndex: i, s: Math.max(0, Math.min(1, s)) };
      }
    }
    return best;
  }

  // Tìm Cạnh + Cách đầu sao cho TÂM cửa (offset + width/2) rơi đúng vào hướng của 1 sơn trong 24
  // sơn — dùng khi người dùng đổi lựa chọn Sơn trong danh sách cửa, để tâm cửa tự động dời tới đúng
  // vị trí phù hợp (có thể đổi cả cạnh, vd đang AB thành BC, lẫn cách đầu, vd đang 6,4 thành 1,2).
  function timViTriTheoSon(sonTen, ctx, doorWidth) {
    var ds24 = (typeof DS24_SON !== 'undefined') ? DS24_SON : (window.DS24_SON || null);
    if (!ds24) return null;
    var son = ds24.filter(function (s) { return s.ten === sonTen; })[0];
    if (!son) return null;
    var vertices = ctx.getVertices();
    if (!vertices || vertices.length < 3) return null;
    var center = ctx.getCenter();
    var worldToScreen = ctx.worldToScreen;
    var centerScreen = worldToScreen(center.x, center.y);
    var verticesScreen = vertices.map(function (v) { return worldToScreen(v.x, v.y); });
    var rotationDeg = (ctx.getRotationDeg ? ctx.getRotationDeg() : 0) || 0;
    // son.goc là góc HIỂN THỊ trên la bàn đã xoay — phải trừ rotationDeg để ra góc màn hình THẬT
    // (chưa xoay) dùng để bắn tia lên đa giác gốc — cùng công thức nghịch đảo với bearingToSonName().
    var degManHinh = son.goc - rotationDeg;
    var rad = degManHinh * Math.PI / 180;
    var dirX = Math.sin(rad), dirY = -Math.cos(rad);
    var hit = raySnapEdge(centerScreen, dirX, dirY, verticesScreen);
    if (!hit) return null;
    var pxPerMeter = ctx.getPxPerMeter();
    var edgeLenM = edgeLengthM(vertices, hit.edgeIndex, pxPerMeter);
    var w = doorWidth || 0.8;
    var offsetTaiTam = hit.s * edgeLenM;
    var offset = Math.max(0, Math.min(offsetTaiTam - w / 2, Math.max(0, edgeLenM - w)));
    return { edgeIndex: hit.edgeIndex, offset: offset, edgeLenM: edgeLenM };
  }

  function doorSonInfo(centerScreen, midScreen, rotationDeg) {
    var dx = midScreen.x - centerScreen.x, dy = midScreen.y - centerScreen.y;
    var degManHinh = Math.atan2(dx, -dy) * 180 / Math.PI;
    // Cộng rotationDeg để ra đúng góc HIỂN THỊ trên la bàn đã xoay (khớp bearingToSonName trong
    // cuu-cung-luoi.js) — nếu không cộng, sơn/cung hiển thị sẽ lệch đúng bằng độ xoay hiện tại.
    var deg = degManHinh + (rotationDeg || 0);
    deg = ((deg % 360) + 360) % 360;
    var sonInfo = (typeof timSonTheoGoc === 'function') ? timSonTheoGoc(deg) : null;
    return {
      deg: Math.round(deg),
      sonTen: sonInfo ? sonInfo.ten : '?',
      cungTuDong: sonInfo ? sonInfo.cung : null
    };
  }

  // ================= WIZARD TẠO CỬA (4 bước) =================
  var wizard = { step: 0, type: null, edgeIndex: 0, offset: 0.5, width: 0.9, ctx: null };

  function startWizard(ctx) {
    var vertices = ctx.getVertices();
    var edgeCount = ctx.isClosed() ? vertices.length : Math.max(0, vertices.length - 1);
    if (edgeCount < 1) { alert('⚠️ Cần vẽ và đóng đa giác trước khi tạo cửa.'); return; }
    wizard = { step: 1, type: null, edgeIndex: 0, offset: 0.5, width: 0.9, ctx: ctx };
    renderModal();
  }

  function closeModal(ctx) {
    var c = ctx || wizard.ctx; if (!c) return;
    document.getElementById(c.modalId).classList.remove('active');
  }

  function selectType(type) { wizard.type = type; wizard.step = 2; renderModal(); }

  function confirmEdge() {
    var sel = document.getElementById('cuaModalEdgeSel'); if (!sel) return;
    wizard.edgeIndex = parseInt(sel.value); wizard.step = 3; renderModal();
  }

  function confirmOffset() {
    var val = parseFloat(document.getElementById('cuaModalOffsetInput').value);
    if (isNaN(val) || val < 0) { alert('⚠️ Nhập khoảng cách hợp lệ (>= 0).'); return; }
    var ctx = wizard.ctx, vertices = ctx.getVertices(), pxPerMeter = ctx.getPxPerMeter();
    var edgeLen = edgeLengthM(vertices, wizard.edgeIndex, pxPerMeter);
    if (val >= edgeLen) { alert('⚠️ Khoảng cách phải nhỏ hơn chiều dài cạnh (' + edgeLen.toFixed(2) + 'm).'); return; }
    wizard.offset = val; wizard.step = 4; renderModal();
  }

  function confirmWidth() {
    var val = parseFloat(document.getElementById('cuaModalWidthInput').value);
    if (isNaN(val) || val <= 0) { alert('⚠️ Nhập độ rộng hợp lệ (> 0).'); return; }
    var ctx = wizard.ctx, vertices = ctx.getVertices(), pxPerMeter = ctx.getPxPerMeter();
    var edgeLen = edgeLengthM(vertices, wizard.edgeIndex, pxPerMeter);
    if (wizard.offset + val > edgeLen) {
      alert('⚠️ Cửa vượt quá chiều dài cạnh!\nTổng ' + (wizard.offset + val).toFixed(2) + 'm > Cạnh ' + edgeLen.toFixed(2) + 'm.');
      return;
    }
    wizard.width = val;
    var doors = ctx.getDoors();
    doors.push({
      id: Date.now(), type: wizard.type, typeName: DOOR_TYPE_LABELS[wizard.type],
      edgeIndex: wizard.edgeIndex, offset: wizard.offset, width: wizard.width,
      leaves: 1, swingIn: true
    });
    closeModal(ctx);
    renderList(ctx);
    ctx.onChange();
  }

  function renderModal() {
    var ctx = wizard.ctx;
    var modal = document.getElementById(ctx.modalId), box = document.getElementById(ctx.boxId);
    modal.classList.add('active');
    var vertices = ctx.getVertices(), pxPerMeter = ctx.getPxPerMeter();
    var n = vertices.length, edgeCount = ctx.isClosed() ? n : Math.max(0, n - 1);

    if (wizard.step === 1) {
      box.innerHTML = '<div class="modal-title">🚪 Bước 1/4 — Chọn loại cửa</div>' +
        '<button class="door-type-btn chinh" onclick="CuaModule.selectType(\'chinh\')">🚪&nbsp; Cửa chính (CC)</button>' +
        '<button class="door-type-btn phu" onclick="CuaModule.selectType(\'phu\')">🚪&nbsp; Cửa phụ (CP)</button>' +
        '<button class="door-type-btn so" onclick="CuaModule.selectType(\'so\')">🪟&nbsp; Cửa sổ (CS)</button>' +
        '<div class="modal-row"><button class="btn-modal-cancel" onclick="CuaModule.closeModal()">Hủy</button></div>';
    } else if (wizard.step === 2) {
      var opts = '';
      for (var i = 0; i < edgeCount; i++) {
        var dist = edgeLengthM(vertices, i, pxPerMeter).toFixed(2);
        opts += '<option value="' + i + '">Cạnh ' + edgeLabel(i, n) + ' — ' + dist + 'm</option>';
      }
      box.innerHTML = '<div class="modal-title">📐 Bước 2/4 — Chọn cạnh đặt cửa</div>' +
        '<select class="modal-input" id="cuaModalEdgeSel">' + opts + '</select>' +
        '<div class="modal-row"><button class="btn-modal-next" onclick="CuaModule.confirmEdge()">Tiếp theo ▶</button><button class="btn-modal-cancel" onclick="CuaModule.closeModal()">Hủy</button></div>';
    } else if (wizard.step === 3) {
      var elen = edgeLengthM(vertices, wizard.edgeIndex, pxPerMeter).toFixed(2);
      var elbl = edgeLabel(wizard.edgeIndex, n);
      var defOff = Math.min(0.5, parseFloat(elen) / 4).toFixed(2);
      box.innerHTML = '<div class="modal-title">📏 Bước 3/4 — Khoảng cách từ điểm đầu cạnh</div>' +
        '<div class="modal-hint">Cạnh <b>' + elbl + '</b>: ' + elen + 'm — nhập khoảng cách từ điểm ' + elbl[0] + ' tới đầu cửa.</div>' +
        '<input class="modal-input" type="number" id="cuaModalOffsetInput" step="0.01" min="0" max="' + (parseFloat(elen) - 0.01).toFixed(2) + '" value="' + defOff + '">' +
        '<div class="modal-hint">Đơn vị: mét &nbsp;(0 → ' + elen + 'm)</div>' +
        '<div class="modal-row"><button class="btn-modal-next" onclick="CuaModule.confirmOffset()">Tiếp theo ▶</button><button class="btn-modal-cancel" onclick="CuaModule.closeModal()">Hủy</button></div>';
    } else if (wizard.step === 4) {
      box.innerHTML = '<div class="modal-title">↔️ Bước 4/4 — Độ rộng cửa</div>' +
        '<div class="modal-hint">Loại: <b>' + DOOR_TYPE_ICONS[wizard.type] + '</b></div>' +
        '<input class="modal-input" type="number" id="cuaModalWidthInput" step="0.01" min="0.3" max="5" value="0.9">' +
        '<div class="modal-hint">Đơn vị: mét &nbsp;(cửa chính 0.9–1.2m | cửa phụ 0.8–0.9m | cửa sổ 0.6–1.2m)</div>' +
        '<div class="modal-row"><button class="btn-modal-confirm" onclick="CuaModule.confirmWidth()">✅ Tạo cửa</button><button class="btn-modal-cancel" onclick="CuaModule.closeModal()">Hủy</button></div>';
    }
  }

  // ================= DANH SÁCH CỬA (chỉnh sửa nhanh, dạng bảng) =================
  function renderList(ctx) {
    var container = document.getElementById(ctx.listId); if (!container) return;
    var doors = ctx.getDoors();
    if (!doors || doors.length === 0) {
      container.innerHTML = '<div style="font-size:12px;color:#888;padding:6px;">Chưa có cửa nào.</div>';
      return;
    }
    var vertices = ctx.getVertices(), pxPerMeter = ctx.getPxPerMeter();
    var n = vertices.length, edgeCount = ctx.isClosed() ? n : Math.max(0, n - 1);
    var p = ctx.idPrefix || '';
    var center = (typeof ctx.getCenter === 'function') ? ctx.getCenter() : null;
    var worldToScreen = ctx.worldToScreen;
    var centerScreen = (center && worldToScreen) ? worldToScreen(center.x, center.y) : null;
    var edgeOpts = '';
    for (var ei = 0; ei < edgeCount; ei++) {
      var dist = edgeLengthM(vertices, ei, pxPerMeter).toFixed(2);
      edgeOpts += '<option value="' + ei + '">' + edgeLabel(ei, n) + '(' + dist + 'm)</option>';
    }
    var rows = '';
    doors.forEach(function (door, idx) {
      var color = DOOR_TYPE_COLORS[door.type] || '#333';
      var eopts = edgeOpts.replace('value="' + door.edgeIndex + '"', 'value="' + door.edgeIndex + '" selected');
      var isWindow = door.type === 'so';
      var leaves = door.leaves || 1, swingIn = (door.swingIn !== false);

      var leafCell = isWindow ? '<span class="cua-dash">—</span>' :
        '<select id="' + p + 'DL' + idx + '" title="Số cánh cửa">' +
          '<option value="1"' + (leaves === 1 ? ' selected' : '') + '>1 cánh</option>' +
          '<option value="2"' + (leaves === 2 ? ' selected' : '') + '>2 cánh</option>' +
        '</select>';
      var swingCell = isWindow ? '<span class="cua-dash">—</span>' :
        '<select id="' + p + 'DS' + idx + '" title="Chiều mở">' +
          '<option value="in"' + (swingIn ? ' selected' : '') + '>Vào</option>' +
          '<option value="out"' + (!swingIn ? ' selected' : '') + '>Ra</option>' +
        '</select>';

      var sonCell = '<span class="cua-dash">—</span>';
      if (centerScreen) {
        var mid = doorWorldMidpoint(door, vertices, pxPerMeter);
        var rotationDeg = (ctx.getRotationDeg ? ctx.getRotationDeg() : 0) || 0;
        var info = doorSonInfo(centerScreen, worldToScreen(mid.x, mid.y), rotationDeg);
        var ds24 = (typeof DS24_SON !== 'undefined') ? DS24_SON : (window.DS24_SON || []);
        var sonOpts = ds24.map(function (s) {
          return '<option value="' + s.ten + '"' + (s.ten === info.sonTen ? ' selected' : '') + '>' + s.ten + '</option>';
        }).join('');
        sonCell = '<select id="' + p + 'DSon' + idx + '" title="Chọn sơn — đổi sẽ tự dời tâm cửa (Cạnh/Cách đầu) tới đúng hướng sơn này" ' +
          'onchange="CuaModule.doiViTriTheoSon(window.__cuaCtx_' + p + ',' + idx + ',this.value)">' + sonOpts + '</select>' +
          '<div style="font-size:9px;color:#999;margin-top:2px;">' + info.deg + '° (cung ' + (info.cungTuDong || '?') + ')</div>';
      }

      rows += '<tr id="' + p + 'doorRow' + idx + '">' +
        '<td class="door-idx" style="color:' + color + ';">' + (idx + 1) + '</td>' +
        '<td><select id="' + p + 'DT' + idx + '">' +
          '<option value="chinh"' + (door.type === 'chinh' ? ' selected' : '') + '>C.chính</option>' +
          '<option value="phu"' + (door.type === 'phu' ? ' selected' : '') + '>C.phụ</option>' +
          '<option value="so"' + (door.type === 'so' ? ' selected' : '') + '>C.sổ</option>' +
        '</select></td>' +
        '<td><select id="' + p + 'DE' + idx + '">' + eopts + '</select></td>' +
        '<td><input type="number" step="0.01" id="' + p + 'DO' + idx + '" value="' + door.offset.toFixed(2) + '"></td>' +
        '<td><input type="number" step="0.01" id="' + p + 'DW' + idx + '" value="' + door.width.toFixed(2) + '"></td>' +
        '<td>' + leafCell + '</td>' +
        '<td>' + swingCell + '</td>' +
        '<td class="door-son">' + sonCell + '</td>' +
        '<td class="cua-actions">' +
          '<button class="dbtn" style="background:#1565c0;" onclick="CuaModule.applyChange(window.__cuaCtx_' + p + ',' + idx + ')" title="Áp dụng">✔</button>' +
          '<button class="dbtn" style="background:#c62828;" onclick="CuaModule.deleteDoor(window.__cuaCtx_' + p + ',' + idx + ')" title="Xóa">🗑</button>' +
        '</td>' +
        '</tr>';
    });
    container.innerHTML = '<div class="cua-door-list-wrap"><table class="cua-door-table"><thead><tr>' +
      '<th>#</th><th>Loại</th><th>Cạnh</th><th>Cách đầu (m)</th><th>Rộng (m)</th><th>Cánh</th><th>Mở</th><th>Vị trí</th><th></th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  // Gọi khi người dùng đổi lựa chọn Sơn trong danh sách cửa: tính lại Cạnh + Cách đầu tương ứng rồi
  // điền vào 2 ô đó (CHƯA áp dụng thật vào door — vẫn cần bấm ✔ như mọi thay đổi khác trong hàng,
  // để người dùng thấy trước Cạnh/Cách đầu sẽ đổi thành gì rồi mới xác nhận).
  function doiViTriTheoSon(ctx, idx, sonTen) {
    var doors = ctx.getDoors(), door = doors[idx]; if (!door) return;
    var p = ctx.idPrefix || '';
    var widthEl = document.getElementById(p + 'DW' + idx);
    var width = widthEl ? parseFloat(widthEl.value) || door.width : door.width;
    var viTri = timViTriTheoSon(sonTen, ctx, width);
    if (!viTri) { alert('Không tìm được vị trí phù hợp cho sơn ' + sonTen + ' trên mặt bằng hiện tại.'); return; }
    var edgeEl = document.getElementById(p + 'DE' + idx);
    var offsetEl = document.getElementById(p + 'DO' + idx);
    if (edgeEl) edgeEl.value = viTri.edgeIndex;
    if (offsetEl) offsetEl.value = viTri.offset.toFixed(2);
  }

  function applyChange(ctx, idx) {
    var doors = ctx.getDoors(), door = doors[idx]; if (!door) return;
    var p = ctx.idPrefix || '';
    var newType = document.getElementById(p + 'DT' + idx).value;
    var newEdge = parseInt(document.getElementById(p + 'DE' + idx).value);
    var newOffset = parseFloat(document.getElementById(p + 'DO' + idx).value);
    var newWidth = parseFloat(document.getElementById(p + 'DW' + idx).value);
    if (isNaN(newOffset) || newOffset < 0 || isNaN(newWidth) || newWidth <= 0) { alert('⚠️ Nhập giá trị hợp lệ.'); return; }
    var vertices = ctx.getVertices(), pxPerMeter = ctx.getPxPerMeter();
    var elen = edgeLengthM(vertices, newEdge, pxPerMeter);
    if (newOffset + newWidth > elen) { alert('⚠️ Cửa vượt quá chiều dài cạnh (' + elen.toFixed(2) + 'm).'); return; }
    door.type = newType; door.typeName = DOOR_TYPE_LABELS[newType];
    door.edgeIndex = newEdge; door.offset = newOffset; door.width = newWidth;
    if (newType !== 'so') {
      var leafEl = document.getElementById(p + 'DL' + idx), swingEl = document.getElementById(p + 'DS' + idx);
      door.leaves = leafEl ? parseInt(leafEl.value) : (door.leaves || 1);
      door.swingIn = swingEl ? (swingEl.value === 'in') : (door.swingIn !== false);
    }
    renderList(ctx);
    ctx.onChange();
  }

  function deleteDoor(ctx, idx) {
    if (!confirm('Xóa cửa #' + (idx + 1) + '?')) return;
    ctx.getDoors().splice(idx, 1);
    renderList(ctx);
    ctx.onChange();
  }

  // ================= VẼ SVG (cạnh có khoảng hở + ký hiệu cửa) =================
  // Dùng bên trong hàm redraw riêng của mỗi tab. worldToScreen(wx,wy) -> {x,y} do tab cung cấp.

  function svgLine(pa, pb, t0, t1, stroke, sw) {
    var x1 = pa.x + (pb.x - pa.x) * t0, y1 = pa.y + (pb.y - pa.y) * t0;
    var x2 = pa.x + (pb.x - pa.x) * t1, y2 = pa.y + (pb.y - pa.y) * t1;
    return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>';
  }

  // Vẽ 1 cạnh nhà, để hở đoạn nào có cửa nằm trên đó
  function svgEdgeWithGaps(paScreen, pbScreen, edgeLenWorldPx, doorsOnEdge, pxPerMeter, stroke, strokeWidth) {
    var html = '';
    var doorsHere = (doorsOnEdge || []).slice().sort(function (a, b) { return a.offset - b.offset; });
    var prevT = 0;
    doorsHere.forEach(function (door) {
      if (edgeLenWorldPx < 0.001) return;
      var t1 = (door.offset * pxPerMeter) / edgeLenWorldPx;
      var t2 = ((door.offset + door.width) * pxPerMeter) / edgeLenWorldPx;
      if (t1 > prevT) html += svgLine(paScreen, pbScreen, prevT, t1, stroke, strokeWidth);
      prevT = Math.min(t2, 1);
    });
    if (prevT < 1) html += svgLine(paScreen, pbScreen, prevT, 1, stroke, strokeWidth);
    return html;
  }

  // Vẽ 1 cánh cửa: đường thẳng bản lề→mép mở, cộng cung nét đứt quét từ mép mở về vị trí đóng.
  // Toàn bộ tính bằng ĐIỂM MÀN HÌNH đã quy đổi sẵn (hingeS, towardOtherS là điểm màn hình, dir là hướng màn hình).
  // Cung được dựng bằng nhiều đoạn thẳng nhỏ (không dùng cờ SVG 'A' mơ hồ) nên luôn đúng chiều, tâm đúng bản lề.
  function svgLeaf(hingeS, radiusS, dirS, towardOtherDirS, clr) {
    var html = '';
    var openTip = { x: hingeS.x + dirS.x * radiusS, y: hingeS.y + dirS.y * radiusS };
    html += '<line x1="' + hingeS.x.toFixed(1) + '" y1="' + hingeS.y.toFixed(1) + '" x2="' + openTip.x.toFixed(1) + '" y2="' + openTip.y.toFixed(1) + '" stroke="' + clr + '" stroke-width="1.5"/>';
    var segs = 10, path = '';
    for (var s = 0; s <= segs; s++) {
      var th = (s / segs) * (Math.PI / 2);
      var px = hingeS.x + radiusS * (Math.cos(th) * dirS.x + Math.sin(th) * towardOtherDirS.x);
      var py = hingeS.y + radiusS * (Math.cos(th) * dirS.y + Math.sin(th) * towardOtherDirS.y);
      path += (s === 0 ? 'M' : 'L') + px.toFixed(1) + ',' + py.toFixed(1) + ' ';
    }
    html += '<path d="' + path.trim() + '" stroke="' + clr + '" stroke-width="1.5" fill="none" stroke-dasharray="4,3"/>';
    return html;
  }

  // Vẽ ký hiệu 1 cửa. Tính bản lề/hướng mở trong hệ toạ độ WORLD (đúng theo hình học thật của
  // nhà), chỉ quy đổi sang màn hình ở bước cuối — nhờ vậy cung luôn đúng dù la bàn xoay/zoom.
  //   va, vb        : 2 đầu cạnh (world)
  //   door          : {offset, width, type, leaves, swingIn}
  //   pxPerMeter    : tỉ lệ hiện tại
  //   worldToScreen : hàm quy đổi world -> {x,y} màn hình do tab cung cấp
  //   centerWorld   : (tuỳ chọn) tâm nhà, dùng để xác định "vào/ra" đúng theo trong/ngoài thật
  function svgDoorSymbol(va, vb, door, pxPerMeter, worldToScreen, centerWorld) {
    var edgeLen = Math.hypot(vb.x - va.x, vb.y - va.y);
    if (edgeLen < 0.001) return '';
    var ux = (vb.x - va.x) / edgeLen, uy = (vb.y - va.y) / edgeLen; // hướng cạnh (world, đơn vị)
    var offsetPx = door.offset * pxPerMeter, widthPx = door.width * pxPerMeter;
    var dStartW = { x: va.x + ux * offsetPx, y: va.y + uy * offsetPx };
    var dEndW = { x: va.x + ux * (offsetPx + widthPx), y: va.y + uy * (offsetPx + widthPx) };
    var clr = DOOR_TYPE_COLORS[door.type] || '#333';

    // Điểm màn hình của 2 đầu khoảng cửa (dùng cho cửa sổ + nhãn)
    var dStartS = worldToScreen(dStartW.x, dStartW.y), dEndS = worldToScreen(dEndW.x, dEndW.y);

    if (door.type === 'so') {
      var edxS = dEndS.x - dStartS.x, edyS = dEndS.y - dStartS.y;
      var eslS = Math.hypot(edxS, edyS) || 1;
      var pxS = -edyS / eslS, pyS = edxS / eslS, off = 4;
      var html = '';
      html += '<line x1="' + (dStartS.x + pxS * off).toFixed(1) + '" y1="' + (dStartS.y + pyS * off).toFixed(1) + '" x2="' + (dEndS.x + pxS * off).toFixed(1) + '" y2="' + (dEndS.y + pyS * off).toFixed(1) + '" stroke="' + clr + '" stroke-width="2"/>';
      html += '<line x1="' + (dStartS.x - pxS * off).toFixed(1) + '" y1="' + (dStartS.y - pyS * off).toFixed(1) + '" x2="' + (dEndS.x - pxS * off).toFixed(1) + '" y2="' + (dEndS.y - pyS * off).toFixed(1) + '" stroke="' + clr + '" stroke-width="2"/>';
      html += '<line x1="' + (dStartS.x - pxS * off).toFixed(1) + '" y1="' + (dStartS.y - pyS * off).toFixed(1) + '" x2="' + (dStartS.x + pxS * off).toFixed(1) + '" y2="' + (dStartS.y + pyS * off).toFixed(1) + '" stroke="' + clr + '" stroke-width="2.5"/>';
      html += '<line x1="' + (dEndS.x - pxS * off).toFixed(1) + '" y1="' + (dEndS.y - pyS * off).toFixed(1) + '" x2="' + (dEndS.x + pxS * off).toFixed(1) + '" y2="' + (dEndS.y + pyS * off).toFixed(1) + '" stroke="' + clr + '" stroke-width="2.5"/>';
      var mxS = (dStartS.x + dEndS.x) / 2, myS = (dStartS.y + dEndS.y) / 2;
      html += '<text x="' + (mxS + pxS * 14).toFixed(1) + '" y="' + (myS + pyS * 14).toFixed(1) + '" font-size="10" font-weight="bold" fill="' + clr + '" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">' + DOOR_TYPE_TAGS.so + '</text>';
      return html;
    }

    // Hướng mở (world): vuông góc cạnh, mặc định quay về phía tâm nhà (mở vào trong)
    var normW = { x: -uy, y: ux }; // 1 trong 2 pháp tuyến, world
    if (centerWorld) {
      var midW = { x: (dStartW.x + dEndW.x) / 2, y: (dStartW.y + dEndW.y) / 2 };
      var toCenter = { x: centerWorld.x - midW.x, y: centerWorld.y - midW.y };
      if (normW.x * toCenter.x + normW.y * toCenter.y < 0) { normW.x = -normW.x; normW.y = -normW.y; }
    }
    if (door.swingIn === false) { normW.x = -normW.x; normW.y = -normW.y; }

    // Quy điểm world -> màn hình bằng cách lấy hiệu 2 điểm đã quy đổi (an toàn với mọi kiểu quy đổi world->screen)
    function dirToScreen(hingeW, dirW, lenWorld) {
      var p0 = worldToScreen(hingeW.x, hingeW.y);
      var p1 = worldToScreen(hingeW.x + dirW.x * lenWorld, hingeW.y + dirW.y * lenWorld);
      var dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy) || 1;
      return { x: dx / len, y: dy / len };
    }
    // Tỉ lệ px-màn-hình / px-world tại điểm này (để chuyển bán kính world -> bán kính màn hình)
    function screenScaleAt(hingeW) {
      var p0 = worldToScreen(hingeW.x, hingeW.y);
      var p1 = worldToScreen(hingeW.x + 1, hingeW.y);
      return Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    }

    var leaves = door.leaves || 1;
    var html = '';
    var tk = 8;

    if (leaves === 2) {
      var half = widthPx / 2;
      var midW2 = { x: dStartW.x + ux * half, y: dStartW.y + uy * half };
      // Cánh 1: bản lề tại dStartW, hướng "về phía kia" là +ux,uy (tới điểm giữa)
      var scale1 = screenScaleAt(dStartW);
      var dirS1 = dirToScreen(dStartW, normW, 1);
      var towardS1 = dirToScreen(dStartW, { x: ux, y: uy }, 1);
      html += svgLeaf(worldToScreen(dStartW.x, dStartW.y), half * scale1, dirS1, towardS1, clr);
      // Cánh 2: bản lề tại dEndW, hướng "về phía kia" là -ux,-uy (tới điểm giữa)
      var scale2 = screenScaleAt(dEndW);
      var dirS2 = dirToScreen(dEndW, normW, 1);
      var towardS2 = dirToScreen(dEndW, { x: -ux, y: -uy }, 1);
      html += svgLeaf(worldToScreen(dEndW.x, dEndW.y), half * scale2, dirS2, towardS2, clr);
    } else {
      var scaleS = screenScaleAt(dStartW);
      var dirS = dirToScreen(dStartW, normW, 1);
      var towardS = dirToScreen(dStartW, { x: ux, y: uy }, 1);
      html += svgLeaf(worldToScreen(dStartW.x, dStartW.y), widthPx * scaleS, dirS, towardS, clr);
    }

    // Vạch đánh dấu 2 đầu khoảng cửa trên tường (giữ nguyên như cũ, tính bằng điểm màn hình)
    var edxS = dEndS.x - dStartS.x, edyS = dEndS.y - dStartS.y, eslS = Math.hypot(edxS, edyS) || 1;
    var pxS = -edyS / eslS, pyS = edxS / eslS;
    html += '<line x1="' + (dStartS.x - pxS * tk / 2).toFixed(1) + '" y1="' + (dStartS.y - pyS * tk / 2).toFixed(1) + '" x2="' + (dStartS.x + pxS * tk / 2).toFixed(1) + '" y2="' + (dStartS.y + pyS * tk / 2).toFixed(1) + '" stroke="' + clr + '" stroke-width="2.5"/>';
    html += '<line x1="' + (dEndS.x - pxS * tk / 2).toFixed(1) + '" y1="' + (dEndS.y - pyS * tk / 2).toFixed(1) + '" x2="' + (dEndS.x + pxS * tk / 2).toFixed(1) + '" y2="' + (dEndS.y + pyS * tk / 2).toFixed(1) + '" stroke="' + clr + '" stroke-width="2.5"/>';

    var mxS2 = (dStartS.x + dEndS.x) / 2, myS2 = (dStartS.y + dEndS.y) / 2;
    html += '<text x="' + (mxS2 + pxS * 14).toFixed(1) + '" y="' + (myS2 + pyS * 14).toFixed(1) + '" font-size="10" font-weight="bold" fill="' + clr + '" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">' + DOOR_TYPE_TAGS[door.type] + '</text>';
    return html;
  }

  // Vẽ toàn bộ ký hiệu cửa của 1 nhà (dùng trong redraw của tab).
  // centerWorld (tuỳ chọn): truyền tâm nhà để chiều "Mở vào" tự đúng theo trong nhà thật.
  function svgForDoors(vertices, doors, pxPerMeter, worldToScreen, centerWorld) {
    var html = '', n = vertices.length;
    (doors || []).forEach(function (door) {
      if (door.edgeIndex >= n) return;
      var va = vertices[door.edgeIndex], vb = vertices[(door.edgeIndex + 1) % n];
      html += svgDoorSymbol(va, vb, door, pxPerMeter, worldToScreen, centerWorld);
    });
    return html;
  }

  // Gọi khi người dùng đổi lựa chọn Sơn trong danh sách cửa: tính lại Cạnh + Cách đầu tương ứng rồi
  // điền vào 2 ô đó (CHƯA áp dụng thật vào door — vẫn cần bấm ✔ như mọi thay đổi khác trong hàng,
  // để người dùng thấy trước Cạnh/Cách đầu sẽ đổi thành gì rồi mới xác nhận).
  function doiViTriTheoSon(ctx, idx, sonTen) {
    var doors = ctx.getDoors(), door = doors[idx]; if (!door) return;
    var p = ctx.idPrefix || '';
    var widthEl = document.getElementById(p + 'DW' + idx);
    var width = widthEl ? parseFloat(widthEl.value) || door.width : door.width;
    var viTri = timViTriTheoSon(sonTen, ctx, width);
    if (!viTri) { alert('Không tìm được vị trí phù hợp cho sơn ' + sonTen + ' trên mặt bằng hiện tại.'); return; }
    var edgeEl = document.getElementById(p + 'DE' + idx);
    var offsetEl = document.getElementById(p + 'DO' + idx);
    if (edgeEl) edgeEl.value = viTri.edgeIndex;
    if (offsetEl) offsetEl.value = viTri.offset.toFixed(2);
  }

  // Trả về tên sơn (trong 24 sơn) mà Cửa chính hiện đang nằm — dùng bởi tab Thông Tin Nhà để
  // hiển thị "Cửa chính hướng/sơn gì" đồng bộ ngược từ vị trí cửa thật đã vẽ trên Cửu Cung Lưới.
  function layTenSonCuaChinh(ctx) {
    var vertices = ctx.getVertices();
    var doors = ctx.getDoors();
    if (!vertices || vertices.length < 3 || !doors) return null;
    var cuaChinh = doors.filter(function (d) { return d.type === 'chinh'; })[0];
    if (!cuaChinh) return null;
    var pxPerMeter = ctx.getPxPerMeter();
    var center = ctx.getCenter();
    var worldToScreen = ctx.worldToScreen;
    var rotationDeg = (ctx.getRotationDeg ? ctx.getRotationDeg() : 0) || 0;
    var mid = doorWorldMidpoint(cuaChinh, vertices, pxPerMeter);
    var info = doorSonInfo(worldToScreen(center.x, center.y), worldToScreen(mid.x, mid.y), rotationDeg);
    return info.sonTen;
  }

  window.CuaModule = {
    startWizard: startWizard,
    closeModal: closeModal,
    selectType: selectType,
    confirmEdge: confirmEdge,
    confirmOffset: confirmOffset,
    confirmWidth: confirmWidth,
    renderList: renderList,
    applyChange: applyChange,
    doiViTriTheoSon: doiViTriTheoSon,
    timViTriTheoSon: timViTriTheoSon, // export để wizard "Khai báo nhanh" (cuu-cung-luoi.js) tự đặt cửa theo sơn
    layTenSonCuaChinh: layTenSonCuaChinh, // export để tab Thông Tin Nhà đọc ngược sơn của Cửa chính
    deleteDoor: deleteDoor,
    svgEdgeWithGaps: svgEdgeWithGaps,
    svgForDoors: svgForDoors,
    DOOR_TYPE_LABELS: DOOR_TYPE_LABELS
  };
})();
