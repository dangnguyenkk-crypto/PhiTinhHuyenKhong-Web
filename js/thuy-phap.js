// ====================================================================
// thuy-phap.js
// Tab Thủy Pháp — la bàn, bản đồ, Tam Hợp, Bát Trạch
// ====================================================================

// =====================================================================
        // ===== TAB THỦY PHÁP =====
        // =====================================================================
        (function() {
            // BƯỚC 2: dùng lại module la bàn dùng chung (js/compass-module.js) để vẽ đa giác nhà
            // + la bàn 24 sơn V/S/H, giống hệt cơ chế của tab Cửu Cung Lưới.
            const CM = window.CompassModule;
            if (!CM) { console.error("thuy-phap.js cần js/compass-module.js load TRƯỚC nó trong index.html"); }

            let selDen = document.getElementById("selSonDen"), selDi = document.getElementById("selSonDi");
            DS24_SON.forEach(s => {
                let o1 = document.createElement("option"); o1.value = s.ten; o1.innerText = s.ten + " (" + s.goc + "°)";
                let o2 = o1.cloneNode(true); selDen.appendChild(o1); selDi.appendChild(o2);
            });
            let isResetMode = false, laBanDaKhoa = false, doMoNenLaBan = 0, compassVisible = true;
            let imgOffset = {x:0, y:0}; // độ lệch ảnh nền (px) so với vị trí gốc — la bàn luôn đứng yên ở giữa khung
            let imgScale = 1; // tỉ lệ phóng to/thu nhỏ ảnh nền
            let map = null, marker = null, currentLocation = {lat:10.8231,lng:106.6297}, isSatellite = true, satelliteLayer = null, streetLayer = null;

            // ==== CỠ CHỮ LA BÀN — thanh trượt #tpFontSize (đã có sẵn trong index.html nhưng thiếu
            // hàm xử lý, nên trước đây KHÔNG hoạt động). Giá trị là SỐ PX TRỰC TIẾP dùng cho la bàn
            // tròn (đúng như veCompassChung trong shared.js mong đợi ở tham số fontSize, mặc định 10).
            // Với 2 kiểu la bàn mới (vuông 9 ô, đa giác nhà) vốn dùng cỡ chữ cơ sở khác, ta suy ra một
            // HỆ SỐ NHÂN từ tpFontSize/10 để áp dụng tương ứng — giữ đúng UX cũ cho la bàn tròn khi
            // người dùng chưa từng đụng vào thanh trượt (mặc định 10 → hệ số 1.0, không đổi gì).
            let tpFontSize = 10;
            function tpFontScale() { return tpFontSize / 10; }
            window.capNhatFontSizeThuyPhap = function(val) {
                tpFontSize = parseFloat(val) || 10;
                let label = document.getElementById("tpFontSizeLabel");
                if (label) label.textContent = val;
                // Vẽ lại đúng kiểu la bàn đang hiển thị để áp dụng cỡ chữ mới ngay lập tức.
                let kieu = window.layKieuLaBanHienTai ? window.layKieuLaBanHienTai("compassOverlay") : "tron24son";
                if (kieu === "tron24son") veCompassOverlay(parseFloat(document.getElementById('houseFacing')?.value) || 0);
                else if (kieu === "daGiacNha") veLaiDaGiacNha();
            };

            function capNhatViTriAnhNen() {
                let img = document.getElementById('mapImage');
                if (img) img.style.transform = 'translate(' + imgOffset.x + 'px,' + imgOffset.y + 'px) scale(' + imgScale + ')';
            }
            window.capNhatViTriAnhNen = capNhatViTriAnhNen;

            window.zoomAnhNenThuyPhap = function(factor) {
                if (laBanDaKhoa) return;
                if (dangODoiMaps()) {
                    if (!map) return;
                    if (factor > 1) map.zoomIn(); else map.zoomOut();
                    return;
                }
                imgScale = Math.max(0.2, Math.min(6, imgScale * factor));
                capNhatViTriAnhNen();
            };

            window.chuyenKieuLaBanThuyPhap = function() {
                damBaoSvgDaGiacTonTai();
                const thuTu = ["tron24son", "daGiacNha"];
                let hienTai = window.layKieuLaBanHienTai("compassOverlay");
                let idxMoi = (thuTu.indexOf(hienTai) + 1) % thuTu.length;
                let kieuMoi = window.setKieuLaBan("compassOverlay", thuTu[idxMoi]);

                let svgTron = document.getElementById("compassSvg");
                let svgDaGiac = document.getElementById("compassSvgDaGiac");
                if (svgTron) svgTron.style.display = (kieuMoi === "tron24son") ? "block" : "none";
                if (svgDaGiac) svgDaGiac.style.display = (kieuMoi === "daGiacNha") ? "block" : "none";
                let panelDaGiac = document.getElementById("thuyPhapDaGiacPanel");
                if (panelDaGiac) panelDaGiac.style.display = (kieuMoi === "daGiacNha") ? "block" : "none";

                if (kieuMoi === "tron24son") veCompassOverlay(parseFloat(document.getElementById('houseFacing').value) || 0);
                else if (kieuMoi === "daGiacNha") veLaiDaGiacNha();

                let btn = document.getElementById("btnKieuLaBan");
                if (btn) btn.textContent = kieuMoi === "daGiacNha" ? "📐" : "🧭";
            };
            // Tự tạo nút chuyển kiểu la bàn nếu HTML chưa có sẵn #btnKieuLaBan — đặt cạnh btnToggleCompass
            // (thừa hưởng cùng style .btn-compass-tool nếu có trong CSS) để không phải sửa tay index.html.
            function damBaoNutKieuLaBanTonTai() {
                let btn = document.getElementById("btnKieuLaBan");
                if (btn) return btn;
                let anchor = document.getElementById("btnToggleCompass");
                if (!anchor || !anchor.parentElement) return null;
                btn = document.createElement("button");
                btn.id = "btnKieuLaBan";
                btn.type = "button";
                btn.className = anchor.className;
                btn.style.cssText = anchor.style.cssText;
                btn.textContent = "🧭";
                btn.title = "Chuyển kiểu la bàn: Tròn 24 sơn ↔ Đa giác nhà (khớp dáng nhà thật + V/S/H)";
                btn.addEventListener("click", function(e) { e.preventDefault(); window.chuyenKieuLaBanThuyPhap(); });
                anchor.parentElement.insertBefore(btn, anchor.nextSibling);

                // ==== ĐỒNG BỘ HIỂN THỊ với btnToggleCompass mọi lúc (bám theo, không cần sửa từng
                // chỗ code cũ set display='block'/'none' cho btnToggleCompass — tránh sót chỗ). ====
                // btnToggleCompass ẩn/hiện qua thuộc tính style.display trực tiếp (không phải class),
                // nên dùng MutationObserver theo dõi attribute "style" là đủ, không cần theo dõi class.
                let dongBoHienThi = function() {
                    btn.style.display = anchor.style.display;
                };
                dongBoHienThi(); // đồng bộ ngay lần đầu (lúc này anchor thường đang display:none)
                let mo = new MutationObserver(dongBoHienThi);
                mo.observe(anchor, { attributes: true, attributeFilter: ["style"] });

                return btn;
            }
            damBaoNutKieuLaBanTonTai();


            // ====================================================================
            // ĐA GIÁC NHÀ (BƯỚC 2) — vẽ/kéo-chỉnh hình dạng nhà đè lên ảnh vệ tinh,
            // rồi hiện la bàn 24 sơn + V/S/H (CM.renderCompassOverlay) khớp theo đúng
            // hình dạng đó — giống hệt cơ chế ở tab Cửu Cung Lưới, nhưng vẽ trong
            // svg#compassSvgDaGiac (viewBox cố định 0 0 1000 1000, KHÔNG đổi theo
            // zoom/pan của ảnh nền — người dùng tự zoom/pan ảnh bằng tay để khớp).
            // Chỉ hỗ trợ kéo-chỉnh các đỉnh có sẵn của 1 trong 3 đa giác đều chuẩn (4/8/24 cạnh) —
            // CHƯA hỗ trợ thêm/xóa đỉnh tùy ý (để đơn giản hoá bước đầu).
            // ====================================================================
            // Khởi tạo mặc định: hình vuông 4 cạnh, đỉnh tại 45°/135°/225°/315° (mỗi cạnh nằm đúng
            // giữa 1 hướng chính) — cùng công thức với chonHinhDangNhaThuyPhap(4) phía dưới.
            let dgPoints = [45, 135, 225, 315].map(function(gocDo) {
                let gocRad = gocDo * Math.PI / 180;
                return { x: 500 + 350 * Math.sin(gocRad), y: 500 - 350 * Math.cos(gocRad) };
            });
            let dgDragIdx = -1;

            function damBaoSvgDaGiacTonTai() {
                let svg = document.getElementById("compassSvgDaGiac");
                if (svg) return svg;
                let overlay = document.getElementById("compassOverlay");
                if (!overlay) return null;
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("id", "compassSvgDaGiac");
                svg.setAttribute("viewBox", "0 0 1000 1000");
                svg.style.position = "absolute"; svg.style.top = "0"; svg.style.left = "0";
                svg.style.width = "100%"; svg.style.height = "100%";
                svg.style.display = "none";
                overlay.appendChild(svg);

                function dgSvgPoint(evt) {
                    let pt = svg.createSVGPoint();
                    pt.x = evt.clientX; pt.y = evt.clientY;
                    return pt.matrixTransform(svg.getScreenCTM().inverse());
                }
                svg.addEventListener("pointermove", function(evt) {
                    if (dgDragIdx === -1) return;
                    let p = dgSvgPoint(evt);
                    dgPoints[dgDragIdx].x = Math.max(0, Math.min(1000, p.x));
                    dgPoints[dgDragIdx].y = Math.max(0, Math.min(1000, p.y));
                    veLaiDaGiacNha();
                });
                svg.addEventListener("pointerup", function() { dgDragIdx = -1; });
                svg.addEventListener("pointerleave", function() { dgDragIdx = -1; });
                svg._dgSvgPoint = dgSvgPoint; // để dùng lại trong drawHandles
                return svg;
            }

            function veLaiDaGiacNha() {
                let svg = damBaoSvgDaGiacTonTai(); if (!svg) return;
                svg.innerHTML = "";

                let polyPts = dgPoints.map(p => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
                let poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                poly.setAttribute("points", polyPts);
                poly.setAttribute("fill", "rgba(76,175,80,0.12)");
                poly.setAttribute("stroke", "#2e7d32");
                poly.setAttribute("stroke-width", "3");
                svg.appendChild(poly);

                // La bàn 24 sơn + V/S/H khớp theo đúng đa giác nhà vừa vẽ — dùng lại nguyên
                // renderCompassOverlay() của compass-module.js, y hệt Cửu Cung Lưới.
                let xs = dgPoints.map(p => p.x), ys = dgPoints.map(p => p.y);
                let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
                let center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
                let centerCellHalfW = (maxX - minX) / 3 / 2;
                let centerCellHalfH = (maxY - minY) / 3 / 2;
                let houseFacing = parseFloat(document.getElementById("houseFacing")?.value) || 0;
                let threshold = 70;
                CM.renderCompassOverlay("#compassSvgDaGiac", center, dgPoints, houseFacing, centerCellHalfW, centerCellHalfH, threshold, {
                    getScaledFontSize: function(el, basePx) { el.style.fontSize = (basePx * 1.4 * tpFontScale()).toFixed(2) + "px"; }, // ảnh nền lớn hơn viewBox 400 gốc ~2.5 lần
                    scaledOffset: function(px) { return px * 1.4 * tpFontScale(); },
                    currentVan: window.phiTinhVanDaTinh || 9,
                    currentNamXem: new Date().getFullYear()
                });

                // Vẽ tay cầm kéo (4 đỉnh, hoặc nhiều hơn nếu chọn hình L/7 cạnh)
                dgPoints.forEach(function(p, idx) {
                    let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 14);
                    c.setAttribute("fill", "#2e7d32"); c.setAttribute("stroke", "#fff"); c.setAttribute("stroke-width", "2");
                    c.style.cursor = "grab";
                    c.addEventListener("pointerdown", function(evt) {
                        dgDragIdx = idx;
                        c.setPointerCapture(evt.pointerId);
                    });
                    svg.appendChild(c);
                });
            }
            window.veLaiDaGiacNha = veLaiDaGiacNha;

            // Tạo đa giác ĐỀU khớp đúng phong thủy: N cạnh với ĐỈNH đặt tại ranh giới giữa 2
            // hướng/sơn (không phải tại chính giữa hướng) — để mỗi CẠNH của đa giác nằm vuông góc
            // và đúng chính giữa 1 hướng/sơn, giúp kéo-chỉnh trực quan theo đúng cấu trúc Bát Quái/24 Sơn:
            //   - 4 cạnh: đỉnh tại 45°, 135°, 225°, 315° (giữa 2 hướng chính, như hình chữ nhật ở Cửu Cung Lưới)
            //   - 8 cạnh: đỉnh tại 22.5°, 67.5°, ... (ranh giới giữa 2 trong 8 hướng Bát Quái)
            //   - 24 cạnh: đỉnh tại 7.5°, 22.5°, ... (ranh giới giữa 2 trong 24 sơn)
            var GOC_LECH_DINH_THEO_SO_CANH = { 4: 45, 8: 22.5, 24: 7.5 };
            window.chonHinhDangNhaThuyPhap = function(soCanh) {
                soCanh = parseInt(soCanh, 10);
                if (![4, 8, 24].includes(soCanh)) soCanh = 4;
                let gocLechDo = GOC_LECH_DINH_THEO_SO_CANH[soCanh];
                let cx = 500, cy = 500, r = 350;
                dgPoints = [];
                for (let i = 0; i < soCanh; i++) {
                    let gocDo = gocLechDo + i * (360 / soCanh);
                    let gocRad = gocDo * Math.PI / 180;
                    // Quy ước góc giống bearing la bàn (0°=trên/Bắc, tăng theo chiều kim đồng hồ) để khớp
                    // đúng hệ góc của renderCompassOverlay/houseFacing trong compass-module.js.
                    dgPoints.push({ x: cx + r * Math.sin(gocRad), y: cy - r * Math.cos(gocRad) });
                }
                veLaiDaGiacNha();
            };

            // ==== LƯU / MỞ đa giác nhà (chỉ lưu toạ độ điểm — KHÔNG kèm ảnh, để nhẹ) ====
            const LS_KEY_DA_GIAC = "thuyPhap_daGiacNha_v1";
            window.luuDaGiacNhaThuyPhap = function() {
                try {
                    localStorage.setItem(LS_KEY_DA_GIAC, JSON.stringify({ points: dgPoints, ngayLuu: new Date().toISOString() }));
                    alert("✅ Đã lưu hình dạng nhà (không kèm ảnh nền).");
                } catch (e) { alert("❌ Lỗi lưu: " + e.message); }
            };
            window.moDaGiacNhaThuyPhap = function() {
                try {
                    let raw = localStorage.getItem(LS_KEY_DA_GIAC);
                    if (!raw) { alert("Chưa có hình dạng nhà nào được lưu."); return; }
                    let obj = JSON.parse(raw);
                    if (obj && Array.isArray(obj.points) && obj.points.length >= 3) {
                        dgPoints = obj.points;
                        veLaiDaGiacNha();
                    }
                } catch (e) { alert("❌ Lỗi mở: " + e.message); }
            };

            // Panel nút điều khiển đa giác nhà (chọn hình dạng, số cạnh tùy ý, lưu, mở) — tự tạo
            // nếu HTML chưa có sẵn #thuyPhapDaGiacPanel, đặt ngay trên #mapStage.
            function damBaoPanelDaGiacTonTai() {
                let panel = document.getElementById("thuyPhapDaGiacPanel");
                if (panel) return panel;
                let stage = document.getElementById("mapStage");
                if (!stage || !stage.parentElement) return null;
                panel = document.createElement("div");
                panel.id = "thuyPhapDaGiacPanel";
                panel.style.cssText = "display:none;padding:6px 8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#f5f5f5;border-radius:8px;margin:4px 0;";
                panel.innerHTML = `
                    <span style="font-size:12px;font-weight:600;color:#444;">📐 Hình nhà:</span>
                    <select onchange="chonHinhDangNhaThuyPhap(this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid #ccc;font-size:12px;">
                        <option value="4">4 cạnh (vuông vắn)</option>
                        <option value="8">8 cạnh (theo 8 hướng)</option>
                        <option value="24">24 cạnh (theo 24 sơn)</option>
                    </select>
                    <button onclick="luuDaGiacNhaThuyPhap()" style="padding:4px 10px;border-radius:6px;border:none;background:#1565c0;color:#fff;font-size:12px;cursor:pointer;">💾 Lưu</button>
                    <button onclick="moDaGiacNhaThuyPhap()" style="padding:4px 10px;border-radius:6px;border:none;background:#6a1b9a;color:#fff;font-size:12px;cursor:pointer;">📂 Mở</button>
                `;
                stage.parentElement.insertBefore(panel, stage);
                return panel;
            }
            damBaoPanelDaGiacTonTai();

            function veCompassOverlay(houseFacing) {
                const svg = document.getElementById("compassSvg"); if (!svg) return;
                // La bàn luôn cố định ở giữa khung (500,500 trong viewBox 1000x1000) — không di chuyển theo tamPercent nữa.
                const cx = 500, cy = 500;
                const sonDen = document.getElementById("selSonDen")?.value, sonDi = document.getElementById("selSonDi")?.value;
                veCompassChung("compassSvg", cx, cy, houseFacing, {
                    rDoSo:430,rDoTick:410,rDoText:390,r8Outer:360,r8Inner:300,r8Text:330,r24Outer:270,r24Inner:170,r24Text:220,
                    rTia:1400,rKim:420,doMo:doMoNenLaBan,mauTia:mauTiaHienTai,isReset:isResetMode,
                    resetOffset:isResetMode?-houseFacing:0,sonDen:sonDen,sonDi:sonDi,showLabel:true,fontSize:tpFontSize,mauRanh8:mauRanh8HienTai
                });
                // (Đã bỏ kiểu "vuông 9 ô" — chỉ còn Tròn 24 sơn ↔ Đa giác nhà.)
            }
            window.veCompassOverlay = veCompassOverlay;

            window.resetCompassAngle = function() {
                isResetMode = !isResetMode;
                veCompassOverlay(parseFloat(document.getElementById('houseFacing').value) || 0);
                let btn = document.getElementById('btnResetGoc');
                if (btn) { btn.textContent = isResetMode ? '↩️' : '🔄'; btn.style.background = isResetMode ? 'rgba(255,152,0,0.85)' : 'rgba(46,125,50,0.85)'; }
            };
            window.toggleCompassVisibility = function() {
                compassVisible = !compassVisible;
                let ov = document.getElementById('compassOverlay'), btn = document.getElementById('btnToggleCompass');
                ov.style.display = compassVisible ? 'block' : 'none';
                btn.textContent = '👁️'; btn.style.background = compassVisible ? 'rgba(255,152,0,0.85)' : 'rgba(76,175,80,0.85)';
            };
            window.toggleKhoaLaBan = function() {
                laBanDaKhoa = !laBanDaKhoa;
                let btn = document.getElementById("btnKhoaLaBan"), ov = document.getElementById("compassOverlay");
                btn.innerText = laBanDaKhoa ? "🔒" : "🔓"; btn.classList.toggle("khoa-on", laBanDaKhoa); ov.classList.toggle("khoa", laBanDaKhoa);
            };
            // Nhận biết đang ở chế độ Maps (Leaflet #map đang hiển thị) hay chế độ ảnh tĩnh (#mapImage)
            function dangODoiMaps() {
                let m = document.getElementById('map');
                return !!m && m.style.display === 'block';
            }
            // Di chuyển ẢNH NỀN tỉ mỉ bằng nút mũi tên (la bàn đứng yên ở giữa, ảnh di chuyển bên dưới).
            // Ở chế độ Maps (Leaflet), #mapImage đang bị ẩn nên phải pan trực tiếp trên bản đồ sống
            // bằng map.panBy(), nếu không nút bấm sẽ chỉ di chuyển 1 ảnh vô hình, không thấy tác dụng gì.
            window.panAnhNenThuyPhap = function(dx, dy) {
                if (laBanDaKhoa) return;
                if (dangODoiMaps()) {
                    if (!map) return;
                    map.panBy([dx * 60, dy * 60]); // bước lớn hơn ảnh tĩnh vì bản đồ có tỉ lệ km thực
                    return;
                }
                let step = 4; // px mỗi lần bấm — bước nhỏ để canh chính xác
                imgOffset.x += dx * step;
                imgOffset.y += dy * step;
                capNhatViTriAnhNen();
            };
            window.resetViTriAnhNen = function() {
                if (dangODoiMaps()) {
                    if (map) map.setView([currentLocation.lat, currentLocation.lng], 18);
                    return;
                }
                imgOffset.x = 0; imgOffset.y = 0; imgScale = 1;
                capNhatViTriAnhNen();
            };
            window.locateMe = function() {
                if (!map) return;
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function(pos) {
                            currentLocation = {lat:pos.coords.latitude,lng:pos.coords.longitude};
                            map.setView([currentLocation.lat,currentLocation.lng], 18); marker.setLatLng([currentLocation.lat,currentLocation.lng]);
                            document.getElementById('fileNameDisplay').textContent = '📍 ' + currentLocation.lat.toFixed(6) + ', ' + currentLocation.lng.toFixed(6);
                        },
                        function(err) { alert('⚠️ Lỗi GPS: ' + err.message); }, {enableHighAccuracy:true,timeout:15000}
                    );
                } else alert('❌ Trình duyệt không hỗ trợ định vị!');
            };
            function initMap() {
                if (typeof L === 'undefined') { setTimeout(initMap, 500); return; }
                if (map) map.remove();
                map = L.map('map', {center:[currentLocation.lat,currentLocation.lng],zoom:17});
                satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles &copy; Esri',maxZoom:19});
                streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap',maxZoom:19});
                satelliteLayer.addTo(map);
                let toggleBtn = L.control({position:'topright'});
                toggleBtn.onAdd = function() {
                    let div = L.DomUtil.create('div','leaflet-bar leaflet-control leaflet-control-custom');
                    div.textContent = '🛰️';
                    div.onclick = function() {
                        isSatellite = !isSatellite;
                        if (isSatellite) { map.removeLayer(streetLayer); satelliteLayer.addTo(map); } else { map.removeLayer(satelliteLayer); streetLayer.addTo(map); }
                        div.textContent = isSatellite ? '🛰️' : '🗺️';
                    };
                    return div;
                };
                toggleBtn.addTo(map);
                let icon = L.icon({iconUrl:'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowUrl:'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png'});
                marker = L.marker([currentLocation.lat,currentLocation.lng],{icon:icon,draggable:false}).addTo(map);
                marker.bindPopup('📍 Vị trí hiện tại'); locateMe();
            }
            window.openMaps = function() {
                document.getElementById('map').style.display = 'block'; document.getElementById('mapImage').style.display = 'none';
                document.getElementById('mapPlaceholder').style.display = 'none'; document.getElementById('btnGPS').style.display = 'block';
                document.getElementById('compassOverlay').style.display = 'block'; document.getElementById('btnKhoaLaBan').style.display = 'block';
                document.getElementById('btnResetGoc').style.display = 'block'; document.getElementById('btnToggleCompass').style.display = 'block';
                document.getElementById('btnCaptureMaps').style.display = 'block';
                if (!map) initMap(); else { locateMe(); map.invalidateSize(); }
                veCompassOverlay(parseFloat(document.getElementById('houseFacing').value) || 0);
                document.getElementById('fileNameDisplay').textContent = '🛰️ Đang tìm vị trí...';
            };
            window.captureMapImage = function() {
                let stage = document.getElementById('mapStage');
                let wasHidden = document.getElementById('compassOverlay').style.display === 'none';
                if (wasHidden) document.getElementById('compassOverlay').style.display = 'block';
                html2canvas(stage,{useCORS:true,allowTaint:true,scale:2,backgroundColor:'#ffffff'}).then(function(canvas) {
                    if (wasHidden) document.getElementById('compassOverlay').style.display = 'none';
                    let img = document.getElementById('mapImage');
                    if (img) {
                        img.src = canvas.toDataURL('image/png'); img.style.display = 'block';
                        document.getElementById('mapPlaceholder').style.display = 'none';
                        document.getElementById('compassOverlay').style.display = 'block';
                        document.getElementById('btnKhoaLaBan').style.display = 'block';
                        document.getElementById('btnResetGoc').style.display = 'block';
                        document.getElementById('btnCaptureMaps').style.display = 'none';
                        document.getElementById('btnToggleCompass').style.display = 'none';
                        document.getElementById('btnGPS').style.display = 'none';
                        document.getElementById('map').style.display = 'none';
                        imgOffset.x = 0; imgOffset.y = 0; imgScale = 1; capNhatViTriAnhNen();
                        veCompassOverlay(parseFloat(document.getElementById('houseFacing').value) || 0);
                        document.getElementById('fileNameDisplay').textContent = '📸 Ảnh từ Google Maps';
                        compassVisible = true;
                    }
                }).catch(function(err) { alert('❌ Lỗi chụp ảnh: ' + err.message); if (wasHidden) document.getElementById('compassOverlay').style.display = 'none'; });
            };
            document.getElementById("houseFacing").addEventListener("input", function() { veCompassOverlay(parseFloat(this.value) || 0); });
            document.getElementById("colorTiaNetDut").addEventListener("input", function() { capNhatMauTia(); });
            document.getElementById("colorTiaNetDut").addEventListener("change", function() { capNhatMauTia(); });
            document.getElementById("colorRanh8Huong").addEventListener("input", function() { capNhatMauRanh8(); });
            document.getElementById("colorRanh8Huong").addEventListener("change", function() { capNhatMauRanh8(); });
            document.getElementById("selSonDen").addEventListener("change", function() { veCompassOverlay(parseFloat(document.getElementById("houseFacing").value) || 0); });
            document.getElementById("selSonDi").addEventListener("change", function() { veCompassOverlay(parseFloat(document.getElementById("houseFacing").value) || 0); });
            var _btnChoose = document.getElementById("btnChooseFile");
            if (_btnChoose) _btnChoose.addEventListener("click", function(e) {
                e.preventDefault();
                var inp = document.getElementById("mapImageInput");
                if (inp) inp.click();
            });
            document.getElementById("mapImageInput").addEventListener("change", function(e) {
                var files = e.target.files;
                if (files && files.length > 0) {
                    var file = files[0]; document.getElementById('fileNameDisplay').textContent = file.name;
                    var reader = new FileReader();
                    reader.onload = function(ev) {
                        var img = document.getElementById('mapImage'); img.src = ev.target.result; img.style.display = 'block';
                        document.getElementById('mapPlaceholder').style.display = 'none';
                        // Đang mở Maps (lớp Leaflet #map z-index cao hơn) thì phải ẩn nó đi,
                        // nếu không ảnh vừa chọn sẽ bị che khuất phía dưới bản đồ live — tap "Chọn" tưởng như vô tác dụng.
                        document.getElementById('map').style.display = 'none';
                        document.getElementById('btnGPS').style.display = 'none';
                        document.getElementById('btnCaptureMaps').style.display = 'none';
                        document.getElementById('compassOverlay').style.display = 'block';
                        document.getElementById('btnKhoaLaBan').style.display = 'block';
                        document.getElementById('btnResetGoc').style.display = 'block';
                        document.getElementById('btnToggleCompass').style.display = 'block';
                        imgOffset.x = 0; imgOffset.y = 0; imgScale = 1; capNhatViTriAnhNen();
                        veCompassOverlay(parseFloat(document.getElementById('houseFacing').value) || 0);
                    };
                    reader.readAsDataURL(file); e.target.value = '';
                }
            });
            document.getElementById("btnOpenMaps").addEventListener("click", function(e) { e.preventDefault(); openMaps(); });
            document.getElementById("btnARMode").addEventListener("click", function(e) {
                e.preventDefault();
                if (window.AndroidAR) window.AndroidAR.openARMode(); else alert('📱 Tính năng AR chỉ hoạt động trên Android app!');
            });
            (function() {
                let stage = document.getElementById("mapStage"), dragging = false, lastX = 0, lastY = 0;
                let pinching = false, pinchStartDist = 0, pinchStartScale = 1;
                function getClientPos(e) { return e.touches ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : {x:e.clientX,y:e.clientY}; }
                function getTouchDist(t0, t1) { return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY); }
                function isImageMode() { let img = document.getElementById('mapImage'); return img && img.style.display !== 'none'; }
                function start(e) {
                    if (laBanDaKhoa || !isImageMode()) return;
                    if (e.target.closest && e.target.closest('button')) return; // không bắt đầu kéo khi chạm vào nút
                    if (e.touches && e.touches.length === 2) {
                        pinching = true; dragging = false;
                        pinchStartDist = getTouchDist(e.touches[0], e.touches[1]);
                        pinchStartScale = imgScale;
                        e.preventDefault();
                        return;
                    }
                    dragging = true; let p = getClientPos(e); lastX = p.x; lastY = p.y;
                }
                function move(e) {
                    if (laBanDaKhoa || !isImageMode()) return;
                    if (pinching && e.touches && e.touches.length === 2) {
                        let dist = getTouchDist(e.touches[0], e.touches[1]);
                        imgScale = Math.max(0.2, Math.min(6, pinchStartScale * (dist / pinchStartDist)));
                        capNhatViTriAnhNen();
                        e.preventDefault();
                        return;
                    }
                    if (!dragging) return;
                    let p = getClientPos(e);
                    imgOffset.x += p.x - lastX; imgOffset.y += p.y - lastY;
                    lastX = p.x; lastY = p.y;
                    capNhatViTriAnhNen();
                    e.preventDefault();
                }
                function end(e) {
                    dragging = false;
                    if (e && e.touches && e.touches.length > 0) return; // vẫn còn ngón khác chạm, chưa kết thúc pinch
                    pinching = false;
                }
                stage.addEventListener("mousedown", start); stage.addEventListener("touchstart", start, {passive:false});
                window.addEventListener("mousemove", move); window.addEventListener("touchmove", move, {passive:false});
                window.addEventListener("mouseup", end); window.addEventListener("touchend", end);
                // Zoom bằng lăn chuột (desktop)
                stage.addEventListener("wheel", function(e) {
                    if (laBanDaKhoa || !isImageMode()) return;
                    e.preventDefault();
                    let factor = e.deltaY < 0 ? 1.1 : (1 / 1.1);
                    imgScale = Math.max(0.2, Math.min(6, imgScale * factor));
                    capNhatViTriAnhNen();
                }, {passive:false});
            })();

            document.addEventListener('keydown', function(e) {
                let tab = document.getElementById('tab-thuyphap'); if (!tab || !tab.classList.contains('active')) return;
                switch (e.key) {
                    case 'ArrowUp': e.preventDefault(); panAnhNenThuyPhap(0, -1); break;
                    case 'ArrowDown': e.preventDefault(); panAnhNenThuyPhap(0, 1); break;
                    case 'ArrowLeft': e.preventDefault(); panAnhNenThuyPhap(-1, 0); break;
                    case 'ArrowRight': e.preventDefault(); panAnhNenThuyPhap(1, 0); break;
                }
            });

            const quyDoiVeDiaChi = {"Tý":"Tý","Nhâm":"Tý","Quý":"Tý","Sửu":"Sửu","Cấn":"Sửu","Dần":"Dần","Giáp":"Mão","Mão":"Mão","Ất":"Mão","Thìn":"Thìn","Tốn":"Thìn","Tị":"Tị","Bính":"Ngọ","Ngọ":"Ngọ","Đinh":"Ngọ","Mùi":"Mùi","Khôn":"Mùi","Thân":"Thân","Canh":"Dậu","Dậu":"Dậu","Tân":"Dậu","Tuất":"Tuất","Càn":"Tuất","Hợi":"Hợi"};
            const diaChiToCuc = {"Thân":"Thủy","Tý":"Thủy","Thìn":"Thủy","Hợi":"Mộc","Mão":"Mộc","Mùi":"Mộc","Dần":"Hỏa","Ngọ":"Hỏa","Tuất":"Hỏa","Tị":"Kim","Dậu":"Kim","Sửu":"Kim"};
            const thuTuDiaChi12 = ["Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tị","Ngọ","Mùi"];
            const tenGiaiDoan12 = ["Trường Sinh","Mộc Dục","Quan Đới","Lâm Quan","Đế Vượng","Suy","Bệnh","Tử","Mộ","Tuyệt","Thai","Dưỡng"];
            const mucDoCatHung12 = [{den:5,di:-5},{den:4,di:-4},{den:4,di:-3},{den:4,di:-3},{den:5,di:-4},{den:-2,di:5},{den:-3,di:4},{den:-3,di:4},{den:-4,di:5},{den:-5,di:5},{den:-3,di:-3},{den:2,di:2}];
            const khoiTruongSinh = {"Thủy":"Thân","Mộc":"Hợi","Hỏa":"Dần","Kim":"Tị"};
            const sonTheoDiaChi = {"Thân":["Thân"],"Dậu":["Canh","Dậu","Tân"],"Tuất":["Tuất","Càn"],"Hợi":["Hợi","Nhâm"],"Tý":["Tý","Quý"],"Sửu":["Sửu","Cấn"],"Dần":["Dần","Giáp"],"Mão":["Mão","Ất"],"Thìn":["Thìn","Tốn"],"Tị":["Tị","Bính"],"Ngọ":["Ngọ","Đinh"],"Mùi":["Mùi","Khôn"]};
            const vongTruongSinh = {};
            for (let cuc in khoiTruongSinh) { let diaChiKhoi = khoiTruongSinh[cuc], idxKhoi = thuTuDiaChi12.indexOf(diaChiKhoi), bang = []; for (let i = 0; i < 12; i++) { let diaChi = thuTuDiaChi12[(idxKhoi+i)%12]; bang.push({gd:tenGiaiDoan12[i],diaChi:diaChi,sons:sonTheoDiaChi[diaChi],den:mucDoCatHung12[i].den,di:mucDoCatHung12[i].di}); } vongTruongSinh[cuc] = bang; }
            function traTamHop(cuc, tenSon) { if (!cuc) return null; let bang = vongTruongSinh[cuc]; return bang.find(gd=>gd.sons.includes(tenSon)) || null; }
            const huongToQuaiTrach = [{goc:0,ten:"Khảm",phuong:"Bắc"},{goc:45,ten:"Cấn",phuong:"Đông Bắc"},{goc:90,ten:"Chấn",phuong:"Đông"},{goc:135,ten:"Tốn",phuong:"Đông Nam"},{goc:180,ten:"Ly",phuong:"Nam"},{goc:225,ten:"Khôn",phuong:"Tây Nam"},{goc:270,ten:"Đoài",phuong:"Tây"},{goc:315,ten:"Càn",phuong:"Tây Bắc"}];
            function timQuaiTrachTheoGoc(goc) { let g = ((goc%360)+360)%360, best = huongToQuaiTrach[0], bestDiff = 999; huongToQuaiTrach.forEach(h=>{let diff=Math.min(Math.abs(g-h.goc),360-Math.abs(g-h.goc)); if(diff<bestDiff){bestDiff=diff;best=h;}}); return best; }
            const nhomTuTrach = {"Khảm":"Đông Tứ Trạch","Ly":"Đông Tứ Trạch","Chấn":"Đông Tứ Trạch","Tốn":"Đông Tứ Trạch","Càn":"Tây Tứ Trạch","Khôn":"Tây Tứ Trạch","Cấn":"Tây Tứ Trạch","Đoài":"Tây Tứ Trạch"};
            const duNienBatTrach = {
                "Khảm":{huong:{"Sinh Khí":"Đông Nam","Thiên Y":"Đông","Diên Niên":"Bắc","Phục Vị":"Tây Bắc","Tuyệt Mệnh":"Tây Nam","Lục Sát":"Tây Bắc","Ngũ Quỷ":"Đông Bắc","Họa Hại":"Tây"}},
                "Khôn":{huong:{"Sinh Khí":"Đông Bắc","Thiên Y":"Tây","Diên Niên":"Tây Bắc","Phục Vị":"Tây Nam","Tuyệt Mệnh":"Bắc","Lục Sát":"Nam","Ngũ Quỷ":"Đông Nam","Họa Hại":"Đông"}},
                "Chấn":{huong:{"Sinh Khí":"Nam","Thiên Y":"Bắc","Diên Niên":"Đông Nam","Phục Vị":"Đông","Tuyệt Mệnh":"Tây","Lục Sát":"Đông Bắc","Ngũ Quỷ":"Tây Bắc","Họa Hại":"Tây Nam"}},
                "Tốn":{huong:{"Sinh Khí":"Bắc","Thiên Y":"Nam","Diên Niên":"Đông","Phục Vị":"Đông Nam","Tuyệt Mệnh":"Đông Bắc","Lục Sát":"Tây","Ngũ Quỷ":"Tây Nam","Họa Hại":"Tây Bắc"}},
                "Càn":{huong:{"Sinh Khí":"Tây","Thiên Y":"Đông Bắc","Diên Niên":"Tây Nam","Phục Vị":"Tây Bắc","Tuyệt Mệnh":"Nam","Lục Sát":"Bắc","Ngũ Quỷ":"Đông","Họa Hại":"Đông Nam"}},
                "Đoài":{huong:{"Sinh Khí":"Tây Bắc","Thiên Y":"Tây Nam","Diên Niên":"Đông Bắc","Phục Vị":"Tây","Tuyệt Mệnh":"Đông","Lục Sát":"Đông Nam","Ngũ Quỷ":"Nam","Họa Hại":"Bắc"}},
                "Cấn":{huong:{"Sinh Khí":"Tây Nam","Thiên Y":"Tây Bắc","Diên Niên":"Tây","Phục Vị":"Đông Bắc","Tuyệt Mệnh":"Đông Nam","Lục Sát":"Nam","Ngũ Quỷ":"Bắc","Họa Hại":"Đông"}},
                "Ly":{huong:{"Sinh Khí":"Đông","Thiên Y":"Đông Nam","Diên Niên":"Bắc","Phục Vị":"Nam","Tuyệt Mệnh":"Tây Bắc","Lục Sát":"Tây","Ngũ Quỷ":"Tây Nam","Họa Hại":"Đông Bắc"}}
            };
            function traBatTrach(quaiTrachNha, tenPhuong) {
                let bang = duNienBatTrach[quaiTrachNha]; if (!bang) return null;
                for (let ten of ["Sinh Khí","Thiên Y","Diên Niên","Phục Vị"]) { if (bang.huong[ten]===tenPhuong) return {ten,diem:90-(["Sinh Khí","Thiên Y","Diên Niên","Phục Vị"].indexOf(ten)*10)}; }
                for (let ten of ["Tuyệt Mệnh","Lục Sát","Ngũ Quỷ","Họa Hại"]) { if (bang.huong[ten]===tenPhuong) return {ten,diem:-60-10*["Tuyệt Mệnh","Lục Sát","Ngũ Quỷ","Họa Hại"].indexOf(ten)}; }
                return null;
            }
            function rutGonMotChuSo(n) { while (n>9) { n = String(n).split("").reduce((a,b)=>a+parseInt(b),0); } return n; }
            const soToQuaiMenh = {1:"Khảm",2:"Khôn",3:"Chấn",4:"Tốn",6:"Càn",7:"Đoài",8:"Cấn",9:"Ly"};
            function tinhQuaiMenh(namSinh, gioiTinh) {
                let haiSoCuoi = namSinh%100, soGoc = rutGonMotChuSo(Math.floor(haiSoCuoi/10)+(haiSoCuoi%10));
                let soKetQua;
                if (namSinh>=2000) soKetQua = gioiTinh==="Nam" ? 9-soGoc : 6+soGoc;
                else soKetQua = gioiTinh==="Nam" ? 10-soGoc : 5+soGoc;
                soKetQua = rutGonMotChuSo(soKetQua);
                if (soKetQua===0) soKetQua = 9;
                if (soKetQua===5) soKetQua = gioiTinh==="Nam" ? 2 : 8;
                return {so:soKetQua, quai:soToQuaiMenh[soKetQua]};
            }
            window.xacNhanThuyKhau = function() {
                let sonDen = document.getElementById("selSonDen").value, sonDi = document.getElementById("selSonDi").value;
                let houseFacing = parseFloat(document.getElementById("houseFacing").value) || 0;
                let sonHuongNhaTamHop = timSonTheoGoc(houseFacing), diaChiHuong = quyDoiVeDiaChi[sonHuongNhaTamHop.ten], cuc = diaChiToCuc[diaChiHuong];
                let ketQuaDen = traTamHop(cuc, sonDen), ketQuaDi = traTamHop(cuc, sonDi);
                function dinhDangKetQua(label, kq, cotXet) {
                    if (!kq) return `${label}: <i>không thuộc 12 cung</i>`;
                    let muc = cotXet==="den"?kq.den:kq.di, soKy = Math.min(5,Math.abs(muc));
                    let bieuTuong = muc>0?"★".repeat(soKy):muc<0?"☠".repeat(soKy):"", mauChu = muc>0?"#1565c0":muc<0?"#c62828":"#666";
                    return `${label}: <b>${kq.gd}</b> (${kq.diaChi}) → <b style="color:${mauChu}">${bieuTuong}</b>`;
                }
                let quaiTrachNha = timQuaiTrachTheoGoc(houseFacing), nhomTrach = nhomTuTrach[quaiTrachNha.ten];
                function sonVePhuong(tenSon) { let s = DS24_SON.find(x=>x.ten===tenSon); if (!s) return null; return timQuaiTrachTheoGoc(s.goc).phuong; }
                let phuongDen = sonVePhuong(sonDen), phuongDi = sonVePhuong(sonDi);
                let ketQuaBTDen = traBatTrach(quaiTrachNha.ten, phuongDen), ketQuaBTDi = traBatTrach(quaiTrachNha.ten, phuongDi);
                function dinhDangBatTrach(label, kq, phuong) {
                    if (!kq) return `${label} (${phuong}): <i>không xác định</i>`;
                    let soKy = Math.min(5,Math.round(Math.abs(kq.diem)/18));
                    let bieuTuong = kq.diem>0?"★".repeat(soKy):"☠".repeat(soKy), mauChu = kq.diem>0?"#1565c0":"#c62828";
                    return `${label} (${phuong}): <b>${kq.ten}</b> (${kq.diem>0?"+":""}${kq.diem}) → <b style="color:${mauChu}">${bieuTuong}</b>`;
                }
                let namSinh = parseInt(document.getElementById("namSinhGiaChu").value)||1990, gioiTinh = document.getElementById("gioiTinhGiaChu").value;
                let menh = tinhQuaiMenh(namSinh, gioiTinh), nhomMenh = nhomTuTrach[menh.quai], hopMenh = (nhomMenh===nhomTrach);
                document.getElementById("ketQuaThuyKhau").style.display = "block";
                document.getElementById("ketQuaThuyKhau").innerHTML =
                    `<b>Đã ghi nhận Thủy Khẩu:</b><br>house_facing = ${houseFacing}° (hướng nhà ≈ sơn <b>${sonHuongNhaTamHop.ten}</b>)<br>water_in_direction (Nước đến) = ${sonDen}<br>water_out_direction (Nước đi) = ${sonDi}<br><br>
                     <b>👤 Quái Mệnh gia chủ:</b> Năm sinh ${namSinh} (${gioiTinh}) → số ${menh.so} → Quái <b>${menh.quai}</b> (${nhomMenh})<br>
                     <b style="color:${hopMenh?'#1565c0':'#c62828'}">${hopMenh?'✅ Mệnh gia chủ HỢP với Trạch nhà (cùng nhóm '+nhomMenh+')':'⚠️ Mệnh gia chủ KHÔNG hợp Trạch nhà — phạm "Đông Tây hỗn loạn" (Mệnh '+nhomMenh+', Trạch '+nhomTrach+')'}</b><br><br>
                     <b>📘 Tam Hợp Trường Sinh:</b> Hướng nhà quy về Địa Chi <b>${diaChiHuong}</b> → thuộc <b>${cuc} Cục</b><br>
                     ${dinhDangKetQua("Nước Đến",ketQuaDen,"den")}<br>${dinhDangKetQua("Nước Đi",ketQuaDi,"di")}<br><br>
                     <b>📗 Bát Trạch Thủy Pháp:</b> Hướng nhà ≈ ${quaiTrachNha.phuong} → Quái Trạch <b>${quaiTrachNha.ten}</b> (${nhomTrach})<br>
                     ${dinhDangBatTrach("Nước Đến",ketQuaBTDen,phuongDen)}<br>${dinhDangBatTrach("Nước Đi",ketQuaBTDi,phuongDi)}<br><br>
                     <i>So sánh 3 sub-module (HKPT / Tam Hợp / Bát Trạch) để có góc nhìn đầy đủ.</i>`;
            };
            // ==== LƯU / MỞ TOÀN BỘ TRẠNG THÁI (dùng bởi Hồ Sơ Nhà — ho-so.js) ====
            window.layStateThuyPhap = function() {
                function val(id) { let el = document.getElementById(id); return el ? el.value : ""; }
                let mapImg = document.getElementById("mapImage");
                let coAnh = mapImg && mapImg.style.display !== "none" && mapImg.src && mapImg.src.indexOf("data:") === 0;
                return {
                    loai: "thuy-phap", phienBan: 1,
                    houseFacing: val("houseFacing"),
                    selSonDen: val("selSonDen"),
                    selSonDi: val("selSonDi"),
                    namSinhGiaChu: val("namSinhGiaChu"),
                    gioiTinhGiaChu: val("gioiTinhGiaChu"),
                    colorTiaNetDut: val("colorTiaNetDut"),
                    colorRanh8Huong: val("colorRanh8Huong"),
                    tpFontSize: val("tpFontSize"),
                    imgOffset: {x: imgOffset.x, y: imgOffset.y},
                    imgScale: imgScale,
                    isResetMode: isResetMode,
                    laBanDaKhoa: laBanDaKhoa,
                    compassVisible: compassVisible,
                    mapImageSrc: coAnh ? mapImg.src : null
                };
            };

            window.apDungStateThuyPhap = function(obj) {
                if (!obj) return;
                function setVal(id, v) { let el = document.getElementById(id); if (el && v !== undefined && v !== "") el.value = v; }
                function bnEvt(id, kinds) { let el = document.getElementById(id); if (el) kinds.forEach(k => el.dispatchEvent(new Event(k, {bubbles:true}))); }
                setVal("namSinhGiaChu", obj.namSinhGiaChu);
                setVal("gioiTinhGiaChu", obj.gioiTinhGiaChu);
                if (typeof capNhatCanChiNamSinh === "function") capNhatCanChiNamSinh("namSinhGiaChu", "canChiNamSinhGiaChu");
                setVal("colorTiaNetDut", obj.colorTiaNetDut); bnEvt("colorTiaNetDut", ["input","change"]);
                setVal("colorRanh8Huong", obj.colorRanh8Huong); bnEvt("colorRanh8Huong", ["input","change"]);
                setVal("tpFontSize", obj.tpFontSize); bnEvt("tpFontSize", ["input"]);
                setVal("selSonDen", obj.selSonDen); bnEvt("selSonDen", ["change"]);
                setVal("selSonDi", obj.selSonDi); bnEvt("selSonDi", ["change"]);

                if (obj.imgOffset) { imgOffset.x = obj.imgOffset.x || 0; imgOffset.y = obj.imgOffset.y || 0; } else { imgOffset.x = 0; imgOffset.y = 0; }
                imgScale = obj.imgScale || 1;
                capNhatViTriAnhNen();
                isResetMode = !!obj.isResetMode;
                laBanDaKhoa = !!obj.laBanDaKhoa;
                compassVisible = obj.compassVisible !== false;

                let btnReset = document.getElementById("btnResetGoc");
                if (btnReset) { btnReset.textContent = isResetMode ? "↩️" : "🔄"; btnReset.style.background = isResetMode ? "rgba(255,152,0,0.85)" : "rgba(46,125,50,0.85)"; }
                let btnKhoa = document.getElementById("btnKhoaLaBan");
                if (btnKhoa) { btnKhoa.innerText = laBanDaKhoa ? "🔒" : "🔓"; btnKhoa.classList.toggle("khoa-on", laBanDaKhoa); }
                let ov = document.getElementById("compassOverlay");
                if (ov) { ov.classList.toggle("khoa", laBanDaKhoa); }
                let btnToggle = document.getElementById("btnToggleCompass");
                if (btnToggle) btnToggle.style.background = compassVisible ? "rgba(255,152,0,0.85)" : "rgba(76,175,80,0.85)";

                let mapImg = document.getElementById("mapImage"), placeholder = document.getElementById("mapPlaceholder");
                function hoanTat() {
                    setVal("houseFacing", obj.houseFacing); bnEvt("houseFacing", ["input"]);
                    if (ov) ov.style.display = (obj.mapImageSrc && compassVisible) ? "block" : (obj.mapImageSrc ? "none" : "none");
                    veCompassOverlay(parseFloat(document.getElementById("houseFacing").value) || 0);
                }
                if (obj.mapImageSrc && mapImg) {
                    mapImg.src = obj.mapImageSrc; mapImg.style.display = "block";
                    if (placeholder) placeholder.style.display = "none";
                    if (ov) ov.style.display = "block";
                    if (btnKhoa) btnKhoa.style.display = "block";
                    if (btnReset) btnReset.style.display = "block";
                    if (btnToggle) btnToggle.style.display = "block";
                    document.getElementById("btnGPS") && (document.getElementById("btnGPS").style.display = "none");
                    document.getElementById("btnCaptureMaps") && (document.getElementById("btnCaptureMaps").style.display = "none");
                    hoanTat();
                } else {
                    if (mapImg) mapImg.style.display = "none";
                    if (placeholder) placeholder.style.display = "block";
                    hoanTat();
                }
            };

            // ==== ĐỒNG BỘ Gia chủ với nguồn chung (#namSinhChu/#gioiTinhChu bên tab Nội Khí, cũng
            // là nơi tab Thông Tin trỏ vào) — tránh 3 nơi lưu Năm sinh/Giới tính riêng biệt dễ lệch
            // nhau. #gioiTinhGiaChu dùng "Nam"/"Nữ" (có dấu), còn #gioiTinhChu dùng "nam"/"nu" —
            // cần quy đổi 2 chiều khi đồng bộ.
            function gioiTinhChuSangGiaChu(v) { return v === "nu" ? "Nữ" : "Nam"; }
            function gioiTinhGiaChuSangChu(v) { return v === "Nữ" ? "nu" : "nam"; }

            window.thuyPhapDoiNamSinhGiaChu = function (value) {
                let elGiaChu = document.getElementById("namSinhGiaChu");
                if (elGiaChu) elGiaChu.value = value;
                if (typeof capNhatCanChiNamSinh === "function") capNhatCanChiNamSinh("namSinhGiaChu", "canChiNamSinhGiaChu");
                let elChu = document.getElementById("namSinhChu");
                if (elChu) {
                    elChu.value = value;
                    if (typeof capNhatCanChiNamSinh === "function") capNhatCanChiNamSinh("namSinhChu", "canChiNamSinhChu");
                    if (typeof tinhToanPhiTinh === "function") tinhToanPhiTinh();
                }
                if (typeof window.thongTinDongBoTruongGoc === "function") window.thongTinDongBoTruongGoc();
            };
            window.thuyPhapDoiGioiTinhGiaChu = function (value) {
                let elGiaChu = document.getElementById("gioiTinhGiaChu");
                if (elGiaChu) elGiaChu.value = value;
                let elChu = document.getElementById("gioiTinhChu");
                if (elChu) {
                    elChu.value = gioiTinhGiaChuSangChu(value);
                    if (typeof tinhToanPhiTinh === "function") tinhToanPhiTinh();
                }
                if (typeof window.thongTinDongBoTruongGoc === "function") window.thongTinDongBoTruongGoc();
            };
            // Nơi khác (Thông Tin, Nội Khí) đổi #namSinhChu/#gioiTinhChu -> tab Thủy Pháp tự đọc lại,
            // miễn không đang gõ dở tại chính ô của tab này (tránh giật/mất focus khi đang nhập).
            window.thuyPhapDongBoTuNguon = function () {
                let elNamChu = document.getElementById("namSinhChu");
                let elGioiChu = document.getElementById("gioiTinhChu");
                let elNamGiaChu = document.getElementById("namSinhGiaChu");
                let elGioiGiaChu = document.getElementById("gioiTinhGiaChu");
                if (elNamChu && elNamGiaChu && document.activeElement !== elNamGiaChu) {
                    elNamGiaChu.value = elNamChu.value;
                    if (typeof capNhatCanChiNamSinh === "function") capNhatCanChiNamSinh("namSinhGiaChu", "canChiNamSinhGiaChu");
                }
                if (elGioiChu && elGioiGiaChu && document.activeElement !== elGioiGiaChu) {
                    elGioiGiaChu.value = gioiTinhChuSangGiaChu(elGioiChu.value);
                }
            };
            // Đọc giá trị ban đầu ngay từ nguồn chung (thay vì mặc định cứng 1990/Nam) khi tab này khởi tạo.
            window.thuyPhapDongBoTuNguon();

            setTimeout(function() { veCompassOverlay(parseFloat(document.getElementById("houseFacing").value)||180); }, 100);
        })();