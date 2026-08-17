// ====================================================================
// ve-phong.js
// Module vẽ phòng — nay là FACTORY để tạo nhiều instance độc lập,
// dùng chung cho cả Cửu Cung Lưới (#cuuCungSvg2) và Tâm Nhà (#tnSvgMain).
// Hỗ trợ: vẽ đa giác, snap vào đỉnh/cạnh, kéo chỉnh kích thước,
// danh sách cạnh với căn ngang/dọc, khóa phòng, danh sách phòng (diện tích m²).
//
// window.VePhongFactory(config) -> tạo 1 instance mới (độc lập hoàn toàn).
// window.VePhongModule -> instance mặc định gắn sẵn cho Cửu Cung Lưới (giữ tương thích cũ).
// ====================================================================
(function () {
    'use strict';

    var NS = "http://www.w3.org/2000/svg";
    var sharedStyleInjected = false;

    function injectSharedStyleOnce() {
        if (sharedStyleInjected) return;
        sharedStyleInjected = true;
        var style = document.createElement('style');
        style.textContent = `
            .vp-room { stroke-linejoin: round; cursor: pointer; }
            .vp-room:hover { stroke-width: 3; stroke: #0d47a1; }
            .vp-handle { cursor: grab; }
            .vp-handle:hover { r: 8; fill: #ff6f00; }
            .vp-drawing { pointer-events: none; }
            .vp-drawing-handle { cursor: pointer; }
            .vp-drawing-handle:hover { r: 7; fill: #ff3d00; }
            .vp-label { pointer-events: none; text-shadow: 0 0 4px rgba(255,255,255,0.7); }
            .vp-room-select:hover { color: #81d4fa; }
            .vp-room-del:hover { color: #ff5252; }
            .vp-snap-indicator { pointer-events: none; }
            .vp-room-list-container { transition: max-height 0.3s ease; }
            .vp-edge-horiz:hover, .vp-edge-vert:hover { background: #2a5a3a; border-color: #66bb6a; color: #fff; }
        `;
        document.head.appendChild(style);
    }

    // ================================================================
    // FACTORY — tạo 1 instance độc lập của module vẽ phòng
    // ================================================================
    function VePhongFactory(config) {
        config = config || {};
        var idPrefix = config.idPrefix || 'vp';
        var globalName = config.globalName || 'VePhongModule';
        function ID(suffix) { return idPrefix + suffix; }

        var getPxPerMeter = config.getPxPerMeter || function () {
            var el2 = document.getElementById('scaleInput');
            return el2 ? (parseFloat(el2.value) || 20) : 20;
        };
        var getHouseVertices = config.getHouseVertices || function () {
            return (window.currentPoints && Array.isArray(window.currentPoints)) ? window.currentPoints : [];
        };

        // ---- Trạng thái nội bộ (riêng cho từng instance) ----
        var rooms = [];
        var nextId = 1;
        var drawingPoints = [];
        var isDrawing = false;
        var selectedRoomId = null;
        var dragHandleIdx = -1;
        var dragRoomId = null;
        var dragStartPoint = null;
        var svgEl = null;
        var moduleInitialized = false;
        var colorPicker = null;
        var roomNameInput = null;
        var roomListEl = null;
        var roomListContainer = null;
        var edgeListContainer = null;
        var edgeListEl = null;
        var btnDraw = null, btnStop = null, btnDelete = null, btnClear = null;
        var snapEnabled = true;
        var snapRadius = 10;
        var snapMode = 'both';
        var tempDisableSnap = false;
        var shiftPressed = false;
        var isActive = (config.alwaysActive !== false); // mặc định luôn hoạt động, trừ khi khai báo alwaysActive:false

        // ---- Chuyển đổi tọa độ (mặc định: giống hệt hành vi cũ — toạ độ local == toạ độ vẽ SVG) ----
        function defaultToLocal(evt) {
            var rect = svgEl.getBoundingClientRect();
            var vb = svgEl.getAttribute('viewBox');
            if (!vb) return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
            var parts = vb.split(/\s+/).map(parseFloat);
            var vx = parts[0] || 0, vy = parts[1] || 0, vw = parts[2] || 400, vh = parts[3] || 400;
            var scaleX = vw / rect.width;
            var scaleY = vh / rect.height;
            return {
                x: vx + (evt.clientX - rect.left) * scaleX,
                y: vy + (evt.clientY - rect.top) * scaleY
            };
        }
        var toLocal = config.toLocal || defaultToLocal;
        var toScreen = config.toScreen || function (pt) { return pt; };

        function defaultClamp(x, y) {
            // Không có config.clamp riêng: giới hạn theo viewBox hiện tại của svgEl (nếu có)
            var vb = svgEl && svgEl.getAttribute('viewBox');
            if (!vb) return { x: x, y: y };
            var parts = vb.split(/\s+/).map(parseFloat);
            var vx = parts[0] || 0, vy = parts[1] || 0, vw = parts[2] || 400, vh = parts[3] || 400;
            return { x: Math.max(vx, Math.min(vx + vw, x)), y: Math.max(vy, Math.min(vy + vh, y)) };
        }
        var clampFn = (config.clamp === null || config.clamp === false) ? null : (config.clamp || defaultClamp);

        // ---- Hình học ----
        function distance(p1, p2) {
            return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        }

        function polygonArea(pts) {
            if (pts.length < 3) return 0;
            var sum = 0;
            for (var i = 0; i < pts.length; i++) {
                var p1 = pts[i], p2 = pts[(i + 1) % pts.length];
                sum += p1.x * p2.y - p2.x * p1.y;
            }
            return Math.abs(sum) / 2;
        }

        function isAngleCloseTo(bearingDeg, targetDeg, epsilon) {
            epsilon = epsilon || 0.5;
            var diff = Math.abs(bearingDeg - targetDeg) % 360;
            if (diff > 180) diff = 360 - diff;
            return diff <= epsilon;
        }

        function edgeBearing(a, b) {
            var deg = Math.atan2(b.x - a.x, -(b.y - a.y)) * 180 / Math.PI;
            return (deg + 360) % 360;
        }

        // ---- Lấy danh sách đỉnh/cạnh để snap (nhà + các phòng khác) ----
        function getAllSnapVertices() {
            var vertices = [];
            var houseVerts = getHouseVertices();
            if (houseVerts && Array.isArray(houseVerts)) {
                houseVerts.forEach(function (p) {
                    vertices.push({ x: p.x, y: p.y, type: 'house' });
                });
            }
            rooms.forEach(function (room) {
                room.points.forEach(function (p) {
                    vertices.push({ x: p.x, y: p.y, type: 'room', roomId: room.id });
                });
            });
            return vertices;
        }

        function getAllSnapEdges() {
            var edges = [];
            var houseVerts = getHouseVertices();
            if (houseVerts && Array.isArray(houseVerts) && houseVerts.length >= 2) {
                for (var i = 0; i < houseVerts.length; i++) {
                    var j = (i + 1) % houseVerts.length;
                    edges.push({ p1: { x: houseVerts[i].x, y: houseVerts[i].y }, p2: { x: houseVerts[j].x, y: houseVerts[j].y }, type: 'house' });
                }
            }
            rooms.forEach(function (room) {
                var pts = room.points;
                for (var k = 0; k < pts.length; k++) {
                    var l = (k + 1) % pts.length;
                    edges.push({ p1: { x: pts[k].x, y: pts[k].y }, p2: { x: pts[l].x, y: pts[l].y }, type: 'room', roomId: room.id });
                }
            });
            return edges;
        }

        function findSnapPoint(x, y) {
            if (!snapEnabled || tempDisableSnap) return null;
            var mode = snapMode;
            var best = null;
            var bestDist = Infinity;

            if (mode === 'vertex' || mode === 'both') {
                var vertices = getAllSnapVertices();
                vertices.forEach(function (v) {
                    var d = distance({ x: x, y: y }, v);
                    if (d < snapRadius && d < bestDist) {
                        bestDist = d;
                        best = { x: v.x, y: v.y, type: 'vertex', source: v };
                    }
                });
            }

            if ((mode === 'edge' || mode === 'both') && (best === null || mode === 'edge')) {
                var edges = getAllSnapEdges();
                edges.forEach(function (e) {
                    var ax = e.p1.x, ay = e.p1.y;
                    var bx = e.p2.x, by = e.p2.y;
                    var dx = bx - ax, dy = by - ay;
                    var t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy);
                    t = Math.max(0, Math.min(1, t));
                    var px = ax + t * dx;
                    var py = ay + t * dy;
                    var d = distance({ x: x, y: y }, { x: px, y: py });
                    if (d < snapRadius && d < bestDist) {
                        bestDist = d;
                        best = { x: px, y: py, type: 'edge', source: e };
                    }
                });
            }

            return best;
        }

        function el(tag, attrs) {
            var e = document.createElementNS(NS, tag);
            for (var k in attrs) e.setAttribute(k, attrs[k]);
            return e;
        }

        // ---- Render danh sách cạnh của phòng đang chọn ----
        function renderEdgeList() {
            if (!edgeListEl) return;
            var room = rooms.find(function (r) { return r.id === selectedRoomId; });
            if (!room || room.points.length < 2) {
                edgeListEl.innerHTML = '<span style="color:#888;">Chọn một phòng để xem cạnh</span>';
                if (edgeListContainer) edgeListContainer.style.display = 'none';
                return;
            }
            if (edgeListContainer) edgeListContainer.style.display = 'block';

            var pts = room.points;
            var pxPerM = getPxPerMeter();
            if (!room.lockedEdges) room.lockedEdges = pts.map(function () { return false; });
            var html = '';
            for (var i = 0; i < pts.length; i++) {
                var j = (i + 1) % pts.length;
                var lenPx = distance(pts[i], pts[j]);
                var lenM = lenPx / pxPerM;
                var bearing = edgeBearing(pts[i], pts[j]);
                var locked = !!room.lockedEdges[i];

                var isHoriz = isAngleCloseTo(bearing, 90) || isAngleCloseTo(bearing, 270);
                var isVert = isAngleCloseTo(bearing, 0) || isAngleCloseTo(bearing, 180);

                html += '<div style="display:flex; align-items:center; gap:4px; padding:2px 0; font-size:12px; flex-wrap:nowrap; ' + (locked ? 'opacity:0.85;' : '') + '">';
                html += '<span style="min-width:44px; color:#aaa;">C' + (i + 1) + '</span>';
                html += '<input type="number" step="0.01" min="0.01" value="' + lenM.toFixed(2) + '" ' + (locked ? 'disabled' : '') + ' style="width:60px; padding:2px 4px; background:' + (locked ? '#222' : '#333') + '; color:' + (locked ? '#777' : '#fff') + '; border:1px solid #555; border-radius:4px; font-size:12px;" data-room="' + room.id + '" data-edge="' + i + '" onchange="window.' + globalName + '.updateEdgeLength(' + room.id + ', ' + i + ', this.value)">';
                html += '<span style="font-size:10px; color:#888; min-width:12px;">m</span>';
                html += '<button class="vp-edge-horiz" ' + (locked ? 'disabled' : '') + ' data-room="' + room.id + '" data-edge="' + i + '" style="background:' + (isHoriz ? '#2a7a3a' : 'transparent') + '; border:1px solid ' + (isHoriz ? '#4caf50' : '#555') + '; border-radius:4px; padding:2px 6px; cursor:' + (locked ? 'not-allowed' : 'pointer') + '; color:' + (isHoriz ? '#fff' : '#aaa') + '; font-size:12px;">↔</button>';
                html += '<button class="vp-edge-vert" ' + (locked ? 'disabled' : '') + ' data-room="' + room.id + '" data-edge="' + i + '" style="background:' + (isVert ? '#2a7a3a' : 'transparent') + '; border:1px solid ' + (isVert ? '#4caf50' : '#555') + '; border-radius:4px; padding:2px 6px; cursor:' + (locked ? 'not-allowed' : 'pointer') + '; color:' + (isVert ? '#fff' : '#aaa') + '; font-size:12px;">↕</button>';
                html += '<button class="vp-edge-lock" data-room="' + room.id + '" data-edge="' + i + '" title="' + (locked ? 'Đã khóa cạnh — bấm để mở khóa' : 'Khóa cạnh (giữ nguyên chiều dài/hướng)') + '" style="background:' + (locked ? '#ffb300' : 'transparent') + '; border:1px solid ' + (locked ? '#ffb300' : '#555') + '; color:' + (locked ? '#1a1a1a' : '#aaa') + '; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:12px;">' + (locked ? '🔒' : '🔓') + '</button>';
                html += '<span style="font-size:10px; color:#666; min-width:30px;">' + bearing.toFixed(0) + '°</span>';
                html += '</div>';
            }
            edgeListEl.innerHTML = html;

            // Gắn sự kiện cho các nút căn chỉnh (gọi trực tiếp hàm nội bộ, không qua window.*)
            edgeListEl.querySelectorAll('.vp-edge-horiz').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    var roomId = parseInt(this.dataset.room, 10);
                    var edgeIdx = parseInt(this.dataset.edge, 10);
                    setEdgeHorizontal(roomId, edgeIdx);
                    e.stopPropagation();
                });
            });
            edgeListEl.querySelectorAll('.vp-edge-vert').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    var roomId = parseInt(this.dataset.room, 10);
                    var edgeIdx = parseInt(this.dataset.edge, 10);
                    setEdgeVertical(roomId, edgeIdx);
                    e.stopPropagation();
                });
            });
            edgeListEl.querySelectorAll('.vp-edge-lock').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    var roomId = parseInt(this.dataset.room, 10);
                    var edgeIdx = parseInt(this.dataset.edge, 10);
                    toggleEdgeLock(roomId, edgeIdx);
                    e.stopPropagation();
                });
            });
        }

        // ---- Render tất cả ----
        function render() {
            if (!svgEl) return;
            var old = svgEl.querySelectorAll(".vp-room, .vp-handle, .vp-drawing, .vp-label, .vp-drawing-handle, .vp-snap-indicator, .vp-edge-lock-line");
            old.forEach(function (o) { o.remove(); });

            // Vẽ từng phòng
            rooms.forEach(function (room) {
                var screenPts = room.points.map(function (p) { return toScreen(p); });
                var poly = el("polygon", {
                    class: "vp-room",
                    points: screenPts.map(function (p) { return p.x.toFixed(2) + "," + p.y.toFixed(2); }).join(" "),
                    fill: room.color || "#4fc3f7",
                    "fill-opacity": "0.25",
                    stroke: room.locked ? "#ffb300" : "#1a5c3a",
                    "stroke-width": "2",
                    "stroke-dasharray": room.locked ? "5,3" : "none",
                    "stroke-linejoin": "round",
                    "data-room-id": room.id
                });
                svgEl.appendChild(poly);

                // Vẽ nổi bật riêng từng cạnh đã khóa (khác với khóa cả phòng — chỉ khóa 1 cạnh cụ thể)
                if (room.lockedEdges) {
                    for (var ei = 0; ei < screenPts.length; ei++) {
                        if (!room.lockedEdges[ei]) continue;
                        var pA = screenPts[ei], pB = screenPts[(ei + 1) % screenPts.length];
                        var lockLine = el("line", {
                            class: "vp-edge-lock-line",
                            x1: pA.x.toFixed(2), y1: pA.y.toFixed(2),
                            x2: pB.x.toFixed(2), y2: pB.y.toFixed(2),
                            stroke: "#ffb300",
                            "stroke-width": "3",
                            "stroke-dasharray": "5,3",
                            "pointer-events": "none"
                        });
                        svgEl.appendChild(lockLine);
                    }
                }

                var cx = 0, cy = 0;
                screenPts.forEach(function (p) { cx += p.x; cy += p.y; });
                cx /= screenPts.length;
                cy /= screenPts.length;
                var label = el("text", {
                    class: "vp-label",
                    x: cx.toFixed(2),
                    y: cy.toFixed(2),
                    "text-anchor": "middle",
                    "dominant-baseline": "central",
                    fill: "#111",
                    "font-size": "11px",
                    "font-weight": "bold",
                    "pointer-events": "none"
                });
                label.textContent = room.label || "Phòng";
                svgEl.appendChild(label);

                if (selectedRoomId === room.id && !room.locked) {
                    screenPts.forEach(function (p, idx) {
                        var vLocked = isVertexLocked(room, idx);
                        var circle = el("circle", {
                            class: "vp-handle",
                            cx: p.x.toFixed(2),
                            cy: p.y.toFixed(2),
                            r: "6",
                            fill: vLocked ? "#ddd" : "#fff",
                            stroke: vLocked ? "#ffb300" : "#1a5c3a",
                            "stroke-width": "2",
                            "data-room-id": room.id,
                            "data-handle-idx": idx,
                            "pointer-events": "all",
                            cursor: vLocked ? "not-allowed" : "grab"
                        });
                        svgEl.appendChild(circle);
                    });
                }
            });

            if (isDrawing && drawingPoints.length > 0) {
                var screenDraw = drawingPoints.map(function (p) { return toScreen(p); });
                var ptsStr = screenDraw.map(function (p) { return p.x.toFixed(2) + "," + p.y.toFixed(2); }).join(" ");
                var polyDraw = el("polygon", {
                    class: "vp-drawing",
                    points: ptsStr,
                    fill: "none",
                    stroke: "#ff6f00",
                    "stroke-width": "1.5",
                    "stroke-dasharray": "6,4"
                });
                svgEl.appendChild(polyDraw);

                screenDraw.forEach(function (p, idx) {
                    var circ = el("circle", {
                        class: "vp-drawing-handle",
                        cx: p.x.toFixed(2),
                        cy: p.y.toFixed(2),
                        r: "5",
                        fill: "#ff6f00",
                        stroke: "#fff",
                        "stroke-width": "1.5",
                        "data-idx": idx,
                        "pointer-events": "all",
                        cursor: "pointer"
                    });
                    svgEl.appendChild(circ);
                });

                if (screenDraw.length >= 3) {
                    var first = screenDraw[0];
                    var last = screenDraw[screenDraw.length - 1];
                    var closeLine = el("line", {
                        class: "vp-drawing",
                        x1: last.x.toFixed(2),
                        y1: last.y.toFixed(2),
                        x2: first.x.toFixed(2),
                        y2: first.y.toFixed(2),
                        stroke: "#ff6f00",
                        "stroke-width": "1.5",
                        "stroke-dasharray": "4,4",
                        opacity: "0.5"
                    });
                    svgEl.appendChild(closeLine);
                }
            }

            updateRoomList();
            if (selectedRoomId !== null) {
                renderEdgeList();
            }
        }

        // ---- Cập nhật danh sách phòng ----
        function updateRoomList() {
            if (!roomListEl) return;
            if (rooms.length === 0) {
                roomListEl.innerHTML = '<span style="color:#888;">Chưa có phòng nào.</span>';
                if (edgeListContainer) edgeListContainer.style.display = 'none';
                return;
            }
            var html = '';
            rooms.forEach(function (room) {
                var isSelected = (selectedRoomId === room.id);
                var pxPerMeter = getPxPerMeter();
                var areaM2 = (polygonArea(room.points) / (pxPerMeter * pxPerMeter)).toFixed(2);
                html += '<div style="display:flex; align-items:center; gap:8px; padding:4px 6px; ' +
                    (isSelected ? 'background:#2a4a3a; border-radius:4px;' : '') +
                    '" data-room-id="' + room.id + '">';
                html += '<span style="display:inline-block; width:12px; height:12px; background:' + (room.color || '#4fc3f7') + '; border-radius:2px;"></span>';
                html += '<span style="flex:1; font-weight:' + (isSelected ? 'bold' : 'normal') + ';">' + (room.label || 'Phòng') + '</span>';
                html += '<button class="vp-room-lock" title="' + (room.locked ? 'Đã khóa — bấm để mở khóa' : 'Khóa phòng (chống di chuyển)') + '" data-room-id="' + room.id + '" style="background:' + (room.locked ? '#ffb300' : 'rgba(255,255,255,0.08)') + '; border:1px solid ' + (room.locked ? '#ffb300' : '#666') + '; color:' + (room.locked ? '#1a1a1a' : '#aaa') + '; cursor:pointer; font-size:12px; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; padding:0;">' + (room.locked ? '🔒' : '🔓') + '</button>';
                html += '<span style="color:#aaa; font-size:10px;">' + room.points.length + ' đỉnh, ' + areaM2 + ' m²</span>';
                html += '<button class="vp-room-select" title="Xem/chọn phòng" data-room-id="' + room.id + '" style="background:rgba(79,195,247,0.15); border:1px solid #4fc3f7; color:#4fc3f7; cursor:pointer; font-size:12px; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; padding:0;">🔍</button>';
                html += '<button class="vp-room-del" title="Xóa phòng này" data-room-id="' + room.id + '" style="background:#e53935; border:1px solid #ff8a80; color:#fff; cursor:pointer; font-size:13px; font-weight:bold; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; padding:0; box-shadow:0 1px 3px rgba(0,0,0,0.4);">✕</button>';
                html += '</div>';
            });
            roomListEl.innerHTML = html;

            roomListEl.querySelectorAll('.vp-room-lock').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    var id = parseInt(this.dataset.roomId, 10);
                    toggleRoomLock(id);
                    e.stopPropagation();
                });
            });
            roomListEl.querySelectorAll('.vp-room-select').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    var id = parseInt(this.dataset.roomId, 10);
                    selectRoom(id);
                    e.stopPropagation();
                });
            });
            roomListEl.querySelectorAll('.vp-room-del').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    var id = parseInt(this.dataset.roomId, 10);
                    deleteRoom(id);
                    e.stopPropagation();
                });
            });
            roomListEl.querySelectorAll('[data-room-id]').forEach(function (row) {
                row.addEventListener('click', function () {
                    var id = parseInt(this.dataset.roomId, 10);
                    selectRoom(id);
                });
            });
        }

        function selectRoom(id) {
            if (isDrawing) {
                alert('Đang ở chế độ vẽ. Hãy dừng vẽ trước khi chọn phòng.');
                return;
            }
            var found = rooms.some(function (r) { return r.id === id; });
            if (!found) {
                selectedRoomId = null;
                render();
                return;
            }
            selectedRoomId = id;
            render();
        }

        function toggleRoomLock(id) {
            var room = rooms.find(function (r) { return r.id === id; });
            if (!room) return;
            room.locked = !room.locked;
            render();
        }

        function deleteRoom(id) {
            if (isDrawing) {
                alert('Đang ở chế độ vẽ. Hãy dừng vẽ trước khi xóa phòng.');
                return;
            }
            var room = rooms.find(function (r) { return r.id === id; });
            if (!room) return;
            if (!confirm('Xóa phòng "' + (room.label || 'Phòng') + '"?\nKhông thể hoàn tác sau khi xóa.')) return;
            rooms = rooms.filter(function (r) { return r.id !== id; });
            if (selectedRoomId === id) selectedRoomId = null;
            render();
        }

        function clearRooms() {
            if (isDrawing) {
                alert('Đang ở chế độ vẽ. Hãy dừng vẽ trước khi xóa tất cả.');
                return;
            }
            if (rooms.length === 0) return;
            if (!confirm('Xóa tất cả phòng đã vẽ?')) return;
            rooms = [];
            selectedRoomId = null;
            render();
        }

        function startDrawing() {
            if (isDrawing) return;
            isDrawing = true;
            drawingPoints = [];
            selectedRoomId = null;
            if (btnDraw) btnDraw.style.display = 'none';
            if (btnStop) btnStop.style.display = 'inline-block';
            if (svgEl) svgEl.style.cursor = 'crosshair';
            render();
        }

        function stopDrawing() {
            if (!isDrawing) return;
            isDrawing = false;
            drawingPoints = [];
            if (btnDraw) btnDraw.style.display = 'inline-block';
            if (btnStop) btnStop.style.display = 'none';
            if (svgEl) svgEl.style.cursor = 'default';
            render();
        }

        function finishDrawing() {
            if (!isDrawing || drawingPoints.length < 3) {
                stopDrawing();
                return;
            }
            var color = colorPicker ? colorPicker.value : '#4fc3f7';
            var label = roomNameInput ? roomNameInput.value.trim() : 'Phòng';
            if (!label) label = 'Phòng';
            var room = {
                id: nextId++,
                points: drawingPoints.map(function (p) { return { x: p.x, y: p.y }; }),
                color: color,
                label: label,
                locked: false,
                lockedEdges: drawingPoints.map(function () { return false; })
            };
            rooms.push(room);
            selectedRoomId = room.id;
            isDrawing = false;
            drawingPoints = [];
            if (btnDraw) btnDraw.style.display = 'inline-block';
            if (btnStop) btnStop.style.display = 'none';
            if (svgEl) svgEl.style.cursor = 'default';
            render();
        }

        // ---- Sự kiện SVG ----
        function onPointerDown(evt) {
            if (!isActive) return;
            var pt = toLocal(evt);
            var target = evt.target;
            if (target && target.classList && target.classList.contains('vp-handle')) {
                var roomId = parseInt(target.dataset.roomId, 10);
                var idx = parseInt(target.dataset.handleIdx, 10);
                if (!isNaN(roomId) && !isNaN(idx)) {
                    var room = rooms.find(function (r) { return r.id === roomId; });
                    if (room && selectedRoomId === roomId && !isVertexLocked(room, idx)) {
                        dragRoomId = roomId;
                        dragHandleIdx = idx;
                        dragStartPoint = { x: room.points[idx].x, y: room.points[idx].y };
                        target.setPointerCapture(evt.pointerId);
                        evt.preventDefault();
                        return;
                    }
                }
            }

            if (isDrawing) {
                if (target && target.classList && target.classList.contains('vp-drawing-handle')) {
                    var idx2 = parseInt(target.dataset.idx, 10);
                    if (!isNaN(idx2) && drawingPoints.length > 0) {
                        drawingPoints.splice(idx2, 1);
                        render();
                        evt.preventDefault();
                        return;
                    }
                }
                var snapPt = findSnapPoint(pt.x, pt.y);
                var newPt = snapPt ? { x: snapPt.x, y: snapPt.y } : { x: pt.x, y: pt.y };
                drawingPoints.push(newPt);
                render();
                evt.preventDefault();
                return;
            }

            if (target && target.classList && target.classList.contains('vp-room')) {
                var id = parseInt(target.dataset.roomId, 10);
                if (!isNaN(id)) {
                    selectRoom(id);
                    evt.preventDefault();
                    return;
                }
            }
        }

        function onPointerMove(evt) {
            if (!isActive) return;
            if (dragRoomId !== null && dragHandleIdx !== -1) {
                var pt = toLocal(evt);
                var room = rooms.find(function (r) { return r.id === dragRoomId; });
                if (room && room.points && room.points.length > dragHandleIdx) {
                    var x = pt.x, y = pt.y;

                    if (shiftPressed && dragStartPoint) {
                        var dx = Math.abs(x - dragStartPoint.x);
                        var dy = Math.abs(y - dragStartPoint.y);
                        if (dx > dy) {
                            y = dragStartPoint.y;
                        } else {
                            x = dragStartPoint.x;
                        }
                    }

                    var snapPt = findSnapPoint(x, y);
                    if (snapPt) {
                        x = snapPt.x;
                        y = snapPt.y;
                    }

                    if (clampFn) {
                        var clamped = clampFn(x, y);
                        x = clamped.x; y = clamped.y;
                    }

                    room.points[dragHandleIdx].x = x;
                    room.points[dragHandleIdx].y = y;
                    render();
                    evt.preventDefault();
                }
            } else if (isDrawing && drawingPoints.length > 0) {
                var pt2 = toLocal(evt);
                var snapPt2 = findSnapPoint(pt2.x, pt2.y);
                var oldInd = svgEl.querySelector('.vp-snap-indicator');
                if (oldInd) oldInd.remove();
                if (snapPt2) {
                    var screenSnap = toScreen(snapPt2);
                    var circ = el("circle", {
                        class: "vp-snap-indicator",
                        cx: screenSnap.x.toFixed(2),
                        cy: screenSnap.y.toFixed(2),
                        r: "4",
                        fill: "#ff6f00",
                        stroke: "#fff",
                        "stroke-width": "1",
                        "pointer-events": "none"
                    });
                    svgEl.appendChild(circ);
                }
            }
        }

        function onPointerUp(evt) {
            if (!isActive) return;
            if (dragRoomId !== null) {
                dragRoomId = null;
                dragHandleIdx = -1;
                dragStartPoint = null;
                render();
            }
            var oldInd = svgEl.querySelector('.vp-snap-indicator');
            if (oldInd) oldInd.remove();
        }

        function onDblClick(evt) {
            if (!isActive) return;
            if (isDrawing && drawingPoints.length >= 3) {
                finishDrawing();
                evt.preventDefault();
            }
        }

        function onKeyDown(evt) {
            if (evt.key === 'Shift') shiftPressed = true;
            if (evt.key === 'Control' || evt.key === 'Meta') tempDisableSnap = true;
        }

        function onKeyUp(evt) {
            if (evt.key === 'Shift') shiftPressed = false;
            if (evt.key === 'Control' || evt.key === 'Meta') tempDisableSnap = false;
        }

        function updateSnapSettings() {
            var toggle = document.getElementById(ID('SnapToggle'));
            var modeRadios = document.querySelectorAll('input[name="' + ID('SnapMode') + '"]');
            if (toggle) snapEnabled = toggle.checked;
            modeRadios.forEach(function (radio) {
                if (radio.checked) snapMode = radio.value;
            });
        }

        function toggleRoomList() {
            if (!roomListContainer) return;
            var currentMax = roomListContainer.style.maxHeight;
            var toggleBtnEl = document.getElementById(ID('ToggleList'));
            if (currentMax === '0px' || currentMax === '') {
                roomListContainer.style.maxHeight = '200px';
                if (toggleBtnEl) toggleBtnEl.textContent = '▼';
            } else {
                roomListContainer.style.maxHeight = '0px';
                if (toggleBtnEl) toggleBtnEl.textContent = '▶';
            }
        }

        function isVertexLocked(room, idx) {
            if (!room.lockedEdges) return false;
            var n = room.points.length;
            var edgeBefore = (idx - 1 + n) % n;
            var edgeAfter = idx;
            return !!room.lockedEdges[edgeBefore] || !!room.lockedEdges[edgeAfter];
        }

        function toggleEdgeLock(roomId, edgeIdx) {
            var room = rooms.find(function (r) { return r.id === roomId; });
            if (!room) return;
            if (!room.lockedEdges) room.lockedEdges = room.points.map(function () { return false; });
            room.lockedEdges[edgeIdx] = !room.lockedEdges[edgeIdx];
            render();
        }

        function setEdgeHorizontal(roomId, edgeIdx) {
            var room = rooms.find(function (r) { return r.id === roomId; });
            if (!room || !room.points || edgeIdx >= room.points.length) return;
            if (room.lockedEdges && room.lockedEdges[edgeIdx]) return;
            var pts = room.points;
            var i = edgeIdx;
            var j = (i + 1) % pts.length;
            pts[j].y = pts[i].y;
            render();
        }

        function setEdgeVertical(roomId, edgeIdx) {
            var room = rooms.find(function (r) { return r.id === roomId; });
            if (!room || !room.points || edgeIdx >= room.points.length) return;
            if (room.lockedEdges && room.lockedEdges[edgeIdx]) return;
            var pts = room.points;
            var i = edgeIdx;
            var j = (i + 1) % pts.length;
            pts[j].x = pts[i].x;
            render();
        }

        // ---- Public API của 1 instance ----
        var api = {
            init: function (svgSelector) {
                if (moduleInitialized) return;
                svgEl = document.querySelector(svgSelector || config.svgSelector);
                if (!svgEl) {
                    console.warn('ve-phong[' + globalName + ']: Không tìm thấy SVG ' + (svgSelector || config.svgSelector));
                    return;
                }

                colorPicker = document.getElementById(ID('ColorPicker'));
                roomNameInput = document.getElementById(ID('RoomName'));
                roomListEl = document.getElementById(ID('RoomList'));
                roomListContainer = document.getElementById(ID('RoomListContainer'));
                edgeListContainer = document.getElementById(ID('EdgeListContainer'));
                edgeListEl = document.getElementById(ID('EdgeList'));
                btnDraw = document.getElementById(ID('BtnDraw'));
                btnStop = document.getElementById(ID('BtnStop'));
                btnDelete = document.getElementById(ID('BtnDelete'));
                btnClear = document.getElementById(ID('BtnClear'));

                if (btnDraw) btnDraw.addEventListener('click', startDrawing);
                if (btnStop) btnStop.addEventListener('click', stopDrawing);
                if (btnDelete) btnDelete.addEventListener('click', function () {
                    if (selectedRoomId !== null) {
                        deleteRoom(selectedRoomId);
                    } else {
                        alert('Chọn một phòng để xóa (click vào phòng trên hình hoặc trong danh sách).');
                    }
                });
                if (btnClear) btnClear.addEventListener('click', clearRooms);

                var snapToggle = document.getElementById(ID('SnapToggle'));
                var modeRadios = document.querySelectorAll('input[name="' + ID('SnapMode') + '"]');
                if (snapToggle) snapToggle.addEventListener('change', function () { updateSnapSettings(); });
                modeRadios.forEach(function (radio) {
                    radio.addEventListener('change', function () { updateSnapSettings(); });
                });

                var toggleBtn = document.getElementById(ID('ToggleList'));
                if (toggleBtn) toggleBtn.addEventListener('click', toggleRoomList);

                svgEl.addEventListener('pointerdown', onPointerDown);
                svgEl.addEventListener('pointermove', onPointerMove);
                svgEl.addEventListener('pointerup', onPointerUp);
                svgEl.addEventListener('pointerleave', onPointerUp);
                svgEl.addEventListener('dblclick', onDblClick);

                document.addEventListener('keydown', onKeyDown);
                document.addEventListener('keyup', onKeyUp);

                injectSharedStyleOnce();

                moduleInitialized = true;
                render();
            },

            render: function () {
                render();
            },

            setActive: function (v) {
                isActive = !!v;
                if (!isActive && isDrawing) stopDrawing();
            },
            isActive: function () { return isActive; },

            startDrawing: startDrawing,
            stopDrawing: stopDrawing,
            deleteRoom: deleteRoom,
            toggleRoomLock: toggleRoomLock,
            toggleEdgeLock: toggleEdgeLock,
            clearRooms: clearRooms,
            selectRoom: selectRoom,
            getRooms: function () { return rooms; },

            setRooms: function (data) {
                if (isDrawing) stopDrawing();
                rooms = (data || []).map(function (r) {
                    var pts = r.points.map(function (p) { return { x: p.x, y: p.y }; });
                    return {
                        id: r.id || nextId++,
                        points: pts,
                        color: r.color || '#4fc3f7',
                        label: r.label || 'Phòng',
                        locked: !!r.locked,
                        lockedEdges: (Array.isArray(r.lockedEdges) && r.lockedEdges.length === pts.length)
                            ? r.lockedEdges.map(function (v) { return !!v; })
                            : pts.map(function () { return false; })
                    };
                });
                rooms.forEach(function (r) { if (r.id >= nextId) nextId = r.id + 1; });
                selectedRoomId = null;
                render();
            },

            updateEdgeLength: function (roomId, edgeIdx, value) {
                var room = rooms.find(function (r) { return r.id === roomId; });
                if (!room || !room.points || edgeIdx >= room.points.length) return;
                if (room.lockedEdges && room.lockedEdges[edgeIdx]) return;
                var lenM = parseFloat(value);
                if (isNaN(lenM) || lenM <= 0) return;
                var pxPerM = getPxPerMeter();
                var lenPx = lenM * pxPerM;
                var pts = room.points;
                var i = edgeIdx;
                var j = (i + 1) % pts.length;
                var dx = pts[j].x - pts[i].x;
                var dy = pts[j].y - pts[i].y;
                var currentLen = Math.sqrt(dx * dx + dy * dy);
                if (currentLen === 0) return;
                var scale = lenPx / currentLen;
                pts[j].x = pts[i].x + dx * scale;
                pts[j].y = pts[i].y + dy * scale;
                render();
            },

            setEdgeHorizontal: setEdgeHorizontal,
            setEdgeVertical: setEdgeVertical,

            renderEdgeList: function () {
                renderEdgeList();
            }
        };

        return api;
    }

    window.VePhongFactory = VePhongFactory;

    // ================================================================
    // Instance mặc định — giữ nguyên hành vi cũ cho Cửu Cung Lưới
    // ================================================================
    window.VePhongModule = VePhongFactory({
        svgSelector: '#cuuCungSvg2',
        idPrefix: 'vp',
        globalName: 'VePhongModule',
        alwaysActive: true
    });

    function initDefault() {
        window.VePhongModule.init('#cuuCungSvg2');
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDefault);
    } else {
        initDefault();
    }

    window.__vePhongRender = function () {
        if (window.VePhongModule) window.VePhongModule.render();
    };

})();
