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
            // ==== Dropdown riêng cho la bàn Trường Sinh — chọn THẲNG 12 Địa Chi (không suy ngầm
            // từ 24 sơn), vì các sơn Càn/Khôn/Cấn/Tốn nằm vắt ngang ranh giới 2 Địa Chi (vd Càn
            // nửa thuộc Tuất, nửa thuộc Hợi) nên quy đổi ngầm sẽ mơ hồ, không rõ ràng với người
            // dùng. Cùng nguồn số liệu góc Địa Chi với GOC_DIA_CHI_12 dùng trong hàm vẽ la bàn
            // duy nhất về góc từng Địa Chi — xem GOC_DIA_CHI_12 bên dưới, dùng chung cho cả đây
            // lẫn hàm vẽ la bàn Trường Sinh).
            const GOC_DIA_CHI_12 = [
                {ten:"Tý",goc:0},{ten:"Sửu",goc:30},{ten:"Dần",goc:60},{ten:"Mão",goc:90},
                {ten:"Thìn",goc:120},{ten:"Tị",goc:150},{ten:"Ngọ",goc:180},{ten:"Mùi",goc:210},
                {ten:"Thân",goc:240},{ten:"Dậu",goc:270},{ten:"Tuất",goc:300},{ten:"Hợi",goc:330}
            ];
            // Nhóm loại của 24 sơn — chỉ dùng để tô màu phân biệt trực quan trên vòng 24 sơn
            // của la bàn Trường Sinh (không ảnh hưởng tính toán). "chi"=12 Địa Chi, "can"=8
            // Thiên Can, "quai"=4 Quái (Càn/Khôn/Cấn/Tốn).
            const NHOM_24_SON = {
                "Tý":"chi","Sửu":"chi","Dần":"chi","Mão":"chi","Thìn":"chi","Tị":"chi",
                "Ngọ":"chi","Mùi":"chi","Thân":"chi","Dậu":"chi","Tuất":"chi","Hợi":"chi",
                "Giáp":"can","Ất":"can","Bính":"can","Đinh":"can","Canh":"can","Tân":"can","Nhâm":"can","Quý":"can",
                "Càn":"quai","Khôn":"quai","Cấn":"quai","Tốn":"quai"
            };
            let selDiaChiDen = document.getElementById("selDiaChiDen"), selDiaChiDi = document.getElementById("selDiaChiDi");
            if (selDiaChiDen && selDiaChiDi) {
                GOC_DIA_CHI_12.forEach(dc => {
                    let o1 = document.createElement("option"); o1.value = dc.ten; o1.innerText = dc.ten + " (" + (dc.goc-15) + "°–" + (dc.goc+15) + "°)";
                    let o2 = o1.cloneNode(true); selDiaChiDen.appendChild(o1); selDiaChiDi.appendChild(o2);
                });
            }
            let isResetMode = false, laBanDaKhoa = false, compassVisible = true;
            // Chế độ hiển thị la bàn Bát Trạch: "trach" (mặc định, nền theo Quái Trạch của hướng
            // nhà) hoặc "menh" (vẫn giữ nền Quái Trạch, thêm vòng phụ Du Niên theo Quái Mệnh gia
            // chủ để so sánh song song — theo đúng yêu cầu, không thay hẳn nền).
            let batTrachCheDo = "menh";
            window.chonCheDoBatTrach = function(cheDo) {
                batTrachCheDo = (cheDo === "menh") ? "menh" : "trach";
                let btnTrach = document.getElementById("btnBatTrachTheoTrach"), btnMenh = document.getElementById("btnBatTrachTheoMenh");
                function apDungKieuNut(btn, dangChon) {
                    if (!btn) return;
                    btn.style.background = dangChon ? "#4CAF50" : "#fff";
                    btn.style.color = dangChon ? "#fff" : "#555";
                    btn.style.borderColor = dangChon ? "#4CAF50" : "#999";
                }
                apDungKieuNut(btnTrach, batTrachCheDo === "trach");
                apDungKieuNut(btnMenh, batTrachCheDo === "menh");
                if (typeof veLaBanBatTrach === "function") veLaBanBatTrach();
            };
            let imgOffset = {x:0, y:0}; // độ lệch ảnh nền (px) so với vị trí gốc — la bàn luôn đứng yên ở giữa khung
            let imgScale = 1; // tỉ lệ phóng to/thu nhỏ ảnh nền
            let imgRotation = 0; // góc xoay ảnh nền (độ)
            let map = null, marker = null, currentLocation = {lat:10.8231,lng:106.6297}, isSatellite = true, satelliteLayer = null, streetLayer = null;

            // ==== ĐỘ MỜ NỀN LA BÀN — thanh trượt #tpDoMoNen (0 = trong suốt hoàn toàn, thấy rõ ảnh
            // nhà bên dưới; 1 = nền la bàn đặc, che kín ảnh). Đọc trực tiếp từ HTML để đổi value mặc
            // định trong index.html có tác dụng ngay, không cần chạm thanh trượt trước.
            let _tpDoMoNenInputEl = document.getElementById("tpDoMoNen");
            let doMoNenLaBan = _tpDoMoNenInputEl ? (parseFloat(_tpDoMoNenInputEl.value) || 0) : 0;
            (function () {
                let label = document.getElementById("tpDoMoNenLabel");
                if (label) label.textContent = Math.round(doMoNenLaBan * 100) + "%";
            })();
            window.capNhatDoMoNenThuyPhap = function(val) {
                doMoNenLaBan = parseFloat(val);
                if (isNaN(doMoNenLaBan)) doMoNenLaBan = 0;
                let label = document.getElementById("tpDoMoNenLabel");
                if (label) label.textContent = Math.round(doMoNenLaBan * 100) + "%";
                veCompassOverlay(parseFloat(document.getElementById('houseFacing')?.value) || 0);
            };

            // ==== CỠ CHỮ LA BÀN — thanh trượt #tpFontSize (đã có sẵn trong index.html nhưng thiếu
            // hàm xử lý, nên trước đây KHÔNG hoạt động). Giá trị là SỐ PX TRỰC TIẾP dùng cho la bàn
            // tròn (đúng như veCompassChung trong shared.js mong đợi ở tham số fontSize, mặc định 10).
            // Với 2 kiểu la bàn mới (vuông 9 ô, đa giác nhà) vốn dùng cỡ chữ cơ sở khác, ta suy ra một
            // HỆ SỐ NHÂN từ tpFontSize/10 để áp dụng tương ứng — giữ đúng UX cũ cho la bàn tròn khi
            // người dùng chưa từng đụng vào thanh trượt.
            // Khởi tạo ĐỌC TRỰC TIẾP từ input HTML #tpFontSize (thay vì hardcode 10) — để đổi value
            // trong index.html có tác dụng ngay khi tải trang, không cần chạm vào thanh trượt trước.
            let _tpFontSizeInputElTP = document.getElementById("tpFontSize");
            let tpFontSize = _tpFontSizeInputElTP ? (parseFloat(_tpFontSizeInputElTP.value) || 10) : 10;
            function tpFontScale() { return tpFontSize / 10; }
            (function () {
                let label = document.getElementById("tpFontSizeLabel");
                if (label) label.textContent = tpFontSize + "px";
            })();
            window.capNhatFontSizeThuyPhap = function(val) {
                tpFontSize = parseFloat(val) || 10;
                let label = document.getElementById("tpFontSizeLabel");
                if (label) label.textContent = val;
                // Vẽ lại đúng kiểu la bàn đang hiển thị để áp dụng cỡ chữ mới ngay lập tức
                // (veCompassOverlay giờ tự nhận biết kieu hiện tại và gọi đúng hàm vẽ tương ứng).
                veCompassOverlay(parseFloat(document.getElementById('houseFacing')?.value) || 0);
            };

            function capNhatViTriAnhNen() {
                let img = document.getElementById('mapImage');
                if (img) img.style.transform = 'translate(' + imgOffset.x + 'px,' + imgOffset.y + 'px) scale(' + imgScale + ') rotate(' + imgRotation + 'deg)';
            }
            window.capNhatViTriAnhNen = capNhatViTriAnhNen;

            window.capNhatXoayAnhThuyPhap = function(val) {
                imgRotation = parseFloat(val) || 0;
                capNhatViTriAnhNen();
            };

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
                damBaoSvgTruongSinhTonTai();
                damBaoSvgBatTrachTonTai();
                const thuTu = ["tron24son", "truongSinh", "batTrach", "daGiacNha"];
                let hienTai = window.layKieuLaBanHienTai("compassOverlay");
                let idxMoi = (thuTu.indexOf(hienTai) + 1) % thuTu.length;
                let kieuMoi = window.setKieuLaBan("compassOverlay", thuTu[idxMoi]);

                let svgTron = document.getElementById("compassSvg");
                let svgDaGiac = document.getElementById("compassSvgDaGiac");
                let svgTruongSinh = document.getElementById("compassSvgTruongSinh");
                let svgBatTrach = document.getElementById("compassSvgBatTrach");
                if (svgTron) svgTron.style.display = (kieuMoi === "tron24son") ? "block" : "none";
                if (svgDaGiac) svgDaGiac.style.display = (kieuMoi === "daGiacNha") ? "block" : "none";
                if (svgTruongSinh) svgTruongSinh.style.display = (kieuMoi === "truongSinh") ? "block" : "none";
                if (svgBatTrach) svgBatTrach.style.display = (kieuMoi === "batTrach") ? "block" : "none";
                let panelDaGiac = document.getElementById("thuyPhapDaGiacPanel");
                if (panelDaGiac) panelDaGiac.style.display = (kieuMoi === "daGiacNha") ? "flex" : "none";
                // Hàng chọn Nước Đến/Đi theo Địa Chi (12 cung) chỉ cần hiện khi đang ở la bàn
                // Trường Sinh — la bàn Bát Trạch vẫn dùng #selSonDen/#selSonDi (24 sơn) như
                // Tròn 24 sơn/Đa giác nhà, vì Bát Trạch quy đổi sơn → phương vị (8 cung), không
                // cần Địa Chi 12 cung.
                let rowDiaChi = document.getElementById("tpDiaChiRow");
                if (rowDiaChi) rowDiaChi.style.display = (kieuMoi === "truongSinh") ? "flex" : "none";
                // Hàng chọn chế độ Bát Trạch (Trạch đất / So Mệnh gia chủ) chỉ hiện khi ở la bàn Bát Trạch.
                let rowBatTrachCheDo = document.getElementById("tpBatTrachCheDoRow");
                if (rowBatTrachCheDo) rowBatTrachCheDo.style.display = (kieuMoi === "batTrach") ? "flex" : "none";

                veCompassOverlay(parseFloat(document.getElementById('houseFacing').value) || 0);

                let btn = document.getElementById("btnKieuLaBan");
                if (btn) btn.textContent = kieuMoi === "daGiacNha" ? "📐" : (kieuMoi === "truongSinh" ? "♻️" : (kieuMoi === "batTrach" ? "🀄" : "🧭"));
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
                btn.title = "Chuyển kiểu la bàn: Tròn 24 sơn ↔ Trường Sinh 12 cung ↔ Bát Trạch 8 cung ↔ Đa giác nhà";
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

            // ====================================================================
            // LA BÀN TRƯỜNG SINH (12 CUNG) — kiểu la bàn thứ 3 cho tab Thủy Pháp.
            // Vẽ RIÊNG, KHÔNG dùng chung engine với veCompassChung()/CompassModule —
            // vòng tròn 12 cung (mỗi cung 30°) theo 12 Địa Chi, khởi Trường Sinh tại
            // đúng vị trí của CỤC (Thủy/Mộc/Hỏa/Kim) suy ra từ hướng nhà hiện tại
            // (house_facing -> sơn/hướng -> quy đổi Địa Chi -> Cục), dùng lại đúng
            // dữ liệu traTamHop/vongTruongSinh/diaChiToCuc/GOC_DIA_CHI_12 đã có sẵn
            // ở cuối file này (khai báo bằng const nên được hoisted trong cùng scope
            // IIFE — hàm vẽ chỉ thực sự CHẠY sau khi các const đó đã gán xong, vì nó
            // luôn được gọi qua sự kiện người dùng / setTimeout, không gọi ngay lúc định nghĩa).
            // ====================================================================
            function damBaoSvgTruongSinhTonTai() {
                let svg = document.getElementById("compassSvgTruongSinh");
                if (svg) return svg;
                let overlay = document.getElementById("compassOverlay");
                if (!overlay) return null;
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("id", "compassSvgTruongSinh");
                svg.setAttribute("viewBox", "0 0 1000 1000");
                svg.style.position = "absolute"; svg.style.top = "0"; svg.style.left = "0";
                svg.style.width = "100%"; svg.style.height = "100%";
                svg.style.display = "none";
                overlay.appendChild(svg);
                return svg;
            }

            // Màu theo mức cát/hung của cột "Nước Đến" (den) trong mucDoCatHung12 — nhất quán
            // với thang điểm đã dùng ở kết quả xác nhận Thủy Khẩu (traTamHop/dinhDangKetQua).
            // den > 0: cát (xanh dương, đậm dần theo điểm), den < 0: hung (đỏ, đậm dần theo điểm).
            function mauTheoDiem12(diem) {
                if (diem > 0) {
                    let bang = { 5: "#0d47a1", 4: "#1565c0", 3: "#1976d2", 2: "#42a5f5", 1: "#90caf9" };
                    return bang[diem] || "#42a5f5";
                } else if (diem < 0) {
                    let bang = { 5: "#7f0000", 4: "#b71c1c", 3: "#c62828", 2: "#e53935", 1: "#ef9a9a" };
                    return bang[-diem] || "#e53935";
                }
                return "#bdbdbd";
            }

            function veLaBanTruongSinh() {
                let svg = damBaoSvgTruongSinhTonTai(); if (!svg) return;
                svg.innerHTML = "";
                const cx = 500, cy = 500;
                // Vòng 12 Địa Chi (trong) giữ nguyên bán kính NGOÀI CÙNG cũ (400) để không phải
                // sửa lại các bán kính kim hướng/vòng chia độ phía sau; thu hẹp bớt bề dày vòng
                // 12 Địa Chi (rInner→rMid) để nhường chỗ cho vòng 24 Sơn mới chèn giữa rMid→rOuter.
                const rInner = 200, rMid = 340, rOuter = 400, rTextGD = 315, rTextChi = 265, rText24Son = 370, rTamTrong = 35;
                const rDoTick = rOuter, rDoText = rOuter + 40, rDoSo = rOuter + 20;

                let houseFacing = parseFloat(document.getElementById("houseFacing")?.value) || 0;
                // Nước Đến/Đi cho la bàn Trường Sinh đọc THẲNG từ dropdown 12 Địa Chi riêng
                // (#selDiaChiDen/#selDiaChiDi) — không còn suy ngầm từ sơn 24, vì các sơn
                // Càn/Khôn/Cấn/Tốn nằm vắt ngang ranh giới 2 Địa Chi, chọn 24 sơn sẽ mơ hồ.
                let diaChiDen = document.getElementById("selDiaChiDen")?.value || null;
                let diaChiDi = document.getElementById("selDiaChiDi")?.value || null;

                // Cục/Hành xác định theo chế độ đang chọn:
                // - "thuykhau" (mặc định): Cục theo NƯỚC ĐI — chưa chọn Nước Đi thì chưa có Cục.
                // - "toa": Hành theo NGŨ HÀNH CỦA SƠN TỌA (đối 180° với Hướng nhà) — luôn xác
                //   định được ngay khi có houseFacing, không cần chọn Đến/Đi.
                let cuc, sonToa = null;
                if (khoiTruongSinhCheDo === "toa") {
                    sonToa = laySonToa(houseFacing);
                    cuc = sonToNguHanh[sonToa.ten] || null;
                } else {
                    cuc = diaChiDi ? diaChiToCuc[diaChiDi] : null;
                }
                let bang12 = cuc ? (vongTruongSinh[cuc] || []) : null;

                let gdDen = (bang12 && diaChiDen) ? bang12.find(g => g.diaChi === diaChiDen) : null;
                let gdDi = (bang12 && diaChiDi) ? bang12.find(g => g.diaChi === diaChiDi) : null;

                let html = "";
                // Vòng viền mỏng đánh dấu ranh giới trong/ngoài/24-sơn (chỉ viền, không tô nền)
                // để vòng tròn vẫn rõ hình dù độ mờ = 0%.
                html += `<circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="#3a2a1a" stroke-width="1.5" opacity="0.8"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="${rMid}" fill="none" stroke="#3a2a1a" stroke-width="1.2" opacity="0.7"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="#5c4a3a" stroke-width="1" opacity="0.7"/>`;

                // ---- VÒNG 24 SƠN (mới, giữa vòng 12 Địa Chi và vòng chia độ) — chỉ để đối
                // chiếu trực quan, không tham gia tính toán Trường Sinh (vẫn tính theo 12 Địa
                // Chi thuần như trước). Tô màu xen kẽ theo nhóm Địa Chi/Can/Quái cho dễ phân biệt
                // ranh giới từng sơn, và tô đậm 2 sơn gần nhất với Nước Đến/Đi (chế độ Thủy Khẩu)
                // hoặc Tọa/Hướng nhà (chế độ Tọa) để đối chiếu nhanh.
                let sonHuongHienTai = timSonTheoGocCucBo((houseFacing % 360 + 360) % 360);
                DS24_SON.forEach(function(s) {
                    let gocStart = s.goc - 7.5, gocEnd = s.goc + 7.5;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rOuter * Math.cos(rs), ysO = cy + rOuter * Math.sin(rs);
                    let xeO = cx + rOuter * Math.cos(re), yeO = cy + rOuter * Math.sin(re);
                    let xsI = cx + rMid * Math.cos(re), ysI = cy + rMid * Math.sin(re);
                    let xeI = cx + rMid * Math.cos(rs), yeI = cy + rMid * Math.sin(rs);
                    let nhom24 = NHOM_24_SON ? NHOM_24_SON[s.ten] : null;
                    let mauNen = nhom24 === "chi" ? "#e8dcc8" : (nhom24 === "can" ? "#d8e8dc" : "#dce4f0");
                    let laToa = khoiTruongSinhCheDo === "toa" && sonToa && sonToa.ten === s.ten;
                    let laHuong = sonHuongHienTai && sonHuongHienTai.ten === s.ten;
                    // Chế độ Thủy Khẩu: tô đậm sơn trùng tên với Địa Chi Đến/Đi đã chọn (12 Địa
                    // Chi cũng là 12/24 sơn nên so tên trực tiếp được, không cần quy đổi).
                    let laDen24 = khoiTruongSinhCheDo !== "toa" && diaChiDen && diaChiDen === s.ten;
                    let laDi24 = khoiTruongSinhCheDo !== "toa" && diaChiDi && diaChiDi === s.ten;
                    let vien24 = laToa ? "#6a1b9a" : (laDen24 ? "#1565c0" : (laDi24 ? "#e65100" : (laHuong ? "#c62828" : "#3a2a1a")));
                    let dayVien24 = (laToa || laDen24 || laDi24 || laHuong) ? 4 : 0.8;
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rOuter},${rOuter} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rMid},${rMid} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${Math.max(doMoNenLaBan,0.35)}" stroke="${vien24}" stroke-width="${dayVien24}"/>`;
                    let x1b = cx + rMid * Math.cos(rs), y1b = cy + rMid * Math.sin(rs);
                    let x2b = cx + rOuter * Math.cos(rs), y2b = cy + rOuter * Math.sin(rs);
                    html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#3a2a1a" stroke-width="0.8"/>`;
                    let radT24 = (s.goc - 90) * Math.PI / 180;
                    let xS = cx + rText24Son * Math.cos(radT24), yS = cy + rText24Son * Math.sin(radT24);
                    html += `<g transform="rotate(${s.goc} ${xS.toFixed(1)} ${yS.toFixed(1)})"><text x="${xS.toFixed(1)}" y="${yS.toFixed(1)}" font-size="${(tpFontSize*0.75).toFixed(1)}" font-weight="700" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${s.ten}</text></g>`;
                });

                // ---- VÒNG CHIA ĐỘ (ngoài cùng, mỗi 10°) ----
                for (let deg = 0; deg < 360; deg += 10) {
                    let rad = (deg - 90) * Math.PI / 180;
                    let isMajor = deg % 30 === 0;
                    let rIn = isMajor ? rDoTick - 8 : rDoTick - 4;
                    let x1 = cx + rIn * Math.cos(rad), y1 = cy + rIn * Math.sin(rad);
                    let x2 = cx + rDoSo * Math.cos(rad), y2 = cy + rDoSo * Math.sin(rad);
                    html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#5c4a3a" stroke-width="${isMajor?1.5:1}" opacity="0.85"/>`;
                    let xt = cx + rDoText * Math.cos(rad), yt = cy + rDoText * Math.sin(rad);
                    html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${(tpFontSize*0.6).toFixed(1)}" font-weight="600" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${deg} ${xt.toFixed(1)} ${yt.toFixed(1)})">${deg}</text>`;
                }

                // 12 cung THUẦN Địa Chi, mỗi cung đúng 30°, tâm cung tại đúng bội số của 30°
                // (Tý=0°, Sửu=30°, Dần=60°...) — không còn gán kèm sơn Thiên Can/Quái nào nữa.
                // Biên ngoài của vòng này là rMid (giáp với vòng 24 Sơn mới thêm phía ngoài).
                GOC_DIA_CHI_12.forEach(function(dc) {
                    let gocTam = dc.goc;
                    let g = bang12 ? bang12.find(x => x.diaChi === dc.ten) : null;
                    let gocStart = gocTam - 15, gocEnd = gocTam + 15;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rMid * Math.cos(rs), ysO = cy + rMid * Math.sin(rs);
                    let xeO = cx + rMid * Math.cos(re), yeO = cy + rMid * Math.sin(re);
                    let xsI = cx + rInner * Math.cos(re), ysI = cy + rInner * Math.sin(re);
                    let xeI = cx + rInner * Math.cos(rs), yeI = cy + rInner * Math.sin(rs);
                    // Chưa xác định Cục (chưa chọn Nước Đi) → tô xám trung tính, không cát/hung.
                    let mauNen = g ? mauTheoDiem12(g.den) : "#cfcfcf";
                    let laCungDen = gdDen && gdDen.diaChi === dc.ten;
                    let laCungDi = gdDi && gdDi.diaChi === dc.ten;
                    let vien = laCungDen ? "#1565c0" : (laCungDi ? "#e65100" : "#3a2a1a");
                    let dayVien = (laCungDen || laCungDi) ? 5 : 1;
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rMid},${rMid} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rInner},${rInner} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${doMoNenLaBan}" stroke="${vien}" stroke-width="${dayVien}"/>`;

                    // Vạch ranh giới cung
                    let x1b = cx + rInner * Math.cos(rs), y1b = cy + rInner * Math.sin(rs);
                    let x2b = cx + rMid * Math.cos(rs), y2b = cy + rMid * Math.sin(rs);
                    html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#3a2a1a" stroke-width="1"/>`;

                    // Tên giai đoạn (Trường Sinh, Mộc Dục...) — vòng ngoài (bỏ trống nếu chưa có Cục)
                    let radT = (gocTam - 90) * Math.PI / 180;
                    if (g) {
                        let xGD = cx + rTextGD * Math.cos(radT), yGD = cy + rTextGD * Math.sin(radT);
                        html += `<g transform="rotate(${gocTam} ${xGD.toFixed(1)} ${yGD.toFixed(1)})"><text x="${xGD.toFixed(1)}" y="${yGD.toFixed(1)}" font-size="${(tpFontSize*1.1).toFixed(1)}" font-weight="800" fill="#7a1010" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${g.gd}</text></g>`;
                    }

                    // Địa Chi — vòng trong
                    let xChi = cx + rTextChi * Math.cos(radT), yChi = cy + rTextChi * Math.sin(radT);
                    html += `<g transform="rotate(${gocTam} ${xChi.toFixed(1)} ${yChi.toFixed(1)})"><text x="${xChi.toFixed(1)}" y="${yChi.toFixed(1)}" font-size="${(tpFontSize*1.3).toFixed(1)}" font-weight="900" fill="#1a1a1a" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${dc.ten}</text></g>`;
                });

                // Kim chỉ hướng nhà — đặt ra ngoài vòng chia độ (rDoSo) để không đè lên số độ
                let radMui = (houseFacing - 90) * Math.PI / 180;
                let rKimHuong = rDoSo + 25;
                let xHF = cx + rKimHuong * Math.cos(radMui), yHF = cy + rKimHuong * Math.sin(radMui);
                let xHB = cx - rKimHuong * Math.cos(radMui), yHB = cy - rKimHuong * Math.sin(radMui);
                html += `<line x1="${xHB.toFixed(1)}" y1="${yHB.toFixed(1)}" x2="${xHF.toFixed(1)}" y2="${yHF.toFixed(1)}" stroke="#00c8c8" stroke-width="2.5"/>`;
                let tl=20, ta=0.3;
                let x1a = xHF-tl*Math.cos(radMui-ta), y1a = yHF-tl*Math.sin(radMui-ta);
                let x2a = xHF-tl*Math.cos(radMui+ta), y2a = yHF-tl*Math.sin(radMui+ta);
                html += `<polygon points="${xHF.toFixed(1)},${yHF.toFixed(1)} ${x1a.toFixed(1)},${y1a.toFixed(1)} ${x2a.toFixed(1)},${y2a.toFixed(1)}" fill="#00c8c8"/>`;
                let xLH = cx+(rKimHuong+35)*Math.cos(radMui), yLH = cy+(rKimHuong+35)*Math.sin(radMui);
                html += `<text x="${xLH.toFixed(1)}" y="${yLH.toFixed(1)}" font-size="${tpFontSize+3}" font-weight="800" fill="#ff0000" stroke="#fff" stroke-width="1.5" paint-order="stroke" text-anchor="middle" transform="rotate(${houseFacing} ${xLH.toFixed(1)} ${yLH.toFixed(1)})">▲ HƯỚNG NHÀ</text>`;

                // Tâm: tên Cục/Hành + chú thích, nội dung khác nhau theo chế độ khởi.
                html += `<circle cx="${cx}" cy="${cy}" r="7" fill="#ff1a1a" stroke="#fff" stroke-width="2.5"/>`;
                if (cuc && khoiTruongSinhCheDo === "toa") {
                    html += `<text x="${cx}" y="${cy-30}" font-size="${(tpFontSize*1.4).toFixed(1)}" font-weight="900" fill="#2e7d32" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle">${cuc} (theo Tọa)</text>`;
                    html += `<text x="${cx}" y="${cy}" font-size="${tpFontSize}" font-weight="700" fill="#6a1b9a" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Tọa: ${sonToa?sonToa.ten:"—"}</text>`;
                    html += `<text x="${cx}" y="${cy+30}" font-size="${tpFontSize}" font-weight="700" fill="#555" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">${chieuTruongSinh==="nghich"?"Trường Sinh nghịch":"Trường Sinh thuận"}</text>`;
                } else if (cuc) {
                    html += `<text x="${cx}" y="${cy-30}" font-size="${(tpFontSize*1.4).toFixed(1)}" font-weight="900" fill="#2e7d32" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle">${cuc} Cục</text>`;
                    if (diaChiDen) html += `<text x="${cx}" y="${cy}" font-size="${tpFontSize}" font-weight="700" fill="#1565c0" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Đến: ${diaChiDen}${gdDen?" — "+gdDen.gd:""}</text>`;
                    html += `<text x="${cx}" y="${cy+30}" font-size="${tpFontSize}" font-weight="700" fill="#e65100" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Đi: ${diaChiDi}${gdDi?" — "+gdDi.gd:""}</text>`;
                } else {
                    html += `<text x="${cx}" y="${cy-15}" font-size="${(tpFontSize*1.2).toFixed(1)}" font-weight="800" fill="#c62828" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle">⚠️ Chưa chọn Nước Đi</text>`;
                    html += `<text x="${cx}" y="${cy+15}" font-size="${tpFontSize}" font-weight="600" fill="#666" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Chọn Nước Đi để xác định Cục</text>`;
                }

                svg.innerHTML = html;
            }
            window.veLaBanTruongSinh = veLaBanTruongSinh;

            // ====================================================================
            // LA BÀN BÁT TRẠCH THỦY PHÁP (8 CUNG) — kiểu la bàn thứ 4 cho tab Thủy Pháp.
            // Vẽ RIÊNG, KHÔNG dùng chung engine với veCompassChung()/CompassModule.
            // 8 cung CỐ ĐỊNH theo la bàn địa lý thật (Bắc=0°, Đông Bắc=45°, Đông=90°...,
            // mỗi cung 45°) — KHÔNG xoay theo hướng nhà, vì Du Niên Bát Trạch (Sinh Khí,
            // Thiên Y, Diên Niên, Phục Vị, Tuyệt Mệnh, Lục Sát, Ngũ Quỷ, Họa Hại) được tra
            // theo PHƯƠNG VỊ tuyệt đối, không theo góc tương đối với nhà. Quái Trạch của nhà
            // (Khảm/Khôn/Chấn/Tốn/Ly/Đoài/Cấn/Càn) suy ra từ houseFacing qua timQuaiTrachTheoGoc
            // đã có sẵn; dùng lại đúng bảng duNienBatTrach/nhomTuTrach ở cuối file (const nên
            // hoisted trong cùng scope IIFE — hàm vẽ chỉ THỰC SỰ chạy sau khi các const đó đã
            // gán xong, vì luôn được gọi qua sự kiện người dùng, không gọi ngay lúc định nghĩa).
            // ====================================================================
            function damBaoSvgBatTrachTonTai() {
                let svg = document.getElementById("compassSvgBatTrach");
                if (svg) return svg;
                let overlay = document.getElementById("compassOverlay");
                if (!overlay) return null;
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("id", "compassSvgBatTrach");
                svg.setAttribute("viewBox", "0 0 1000 1000");
                svg.style.position = "absolute"; svg.style.top = "0"; svg.style.left = "0";
                svg.style.width = "100%"; svg.style.height = "100%";
                svg.style.display = "none";
                overlay.appendChild(svg);
                return svg;
            }

            // Thứ tự cát/hung để định đậm nhạt màu — cát: Sinh Khí > Thiên Y > Diên Niên > Phục Vị
            // (theo đúng thang điểm 90/80/70/60 đã dùng trong traBatTrach); hung: Tuyệt Mệnh >
            // Lục Sát > Ngũ Quỷ > Họa Hại (thang -60/-70/-80/-90).
            const THU_TU_CAT_BAT_TRACH = ["Sinh Khí","Thiên Y","Diên Niên","Phục Vị"];
            const THU_TU_HUNG_BAT_TRACH = ["Tuyệt Mệnh","Lục Sát","Ngũ Quỷ","Họa Hại"];
            function mauTheoDuNien(tenDuNien) {
                let iCat = THU_TU_CAT_BAT_TRACH.indexOf(tenDuNien);
                if (iCat >= 0) { let bang = ["#0d47a1","#1565c0","#1976d2","#42a5f5"]; return bang[iCat]; }
                let iHung = THU_TU_HUNG_BAT_TRACH.indexOf(tenDuNien);
                if (iHung >= 0) { let bang = ["#7f0000","#b71c1c","#c62828","#e53935"]; return bang[iHung]; }
                return "#cfcfcf";
            }

            // 8 phương vị CỐ ĐỊNH, góc TÂM đúng theo la bàn địa lý thật (không đổi theo hướng nhà).
            const PHUONG_VI_8 = [
                {ten:"Bắc",goc:0},{ten:"Đông Bắc",goc:45},{ten:"Đông",goc:90},{ten:"Đông Nam",goc:135},
                {ten:"Nam",goc:180},{ten:"Tây Nam",goc:225},{ten:"Tây",goc:270},{ten:"Tây Bắc",goc:315}
            ];

            function veLaBanBatTrach() {
                let svg = damBaoSvgBatTrachTonTai(); if (!svg) return;
                svg.innerHTML = "";
                const cx = 500, cy = 500;
                const rOuter = 400, rInner = 200, rTextDuNien = 375, rTextPhuong = 300;
                const rDoTick = rOuter, rDoText = rOuter + 40, rDoSo = rOuter + 20;
                // Vòng phụ (chỉ vẽ khi batTrachCheDo === "menh"): 1 dải mỏng ngay SÁT VÀNH TRONG
                // (rInnerMenh -> rInner), tô theo Du Niên tính từ Quái MỆNH gia chủ, để so sánh
                // song song với vòng ngoài (vẫn luôn tô theo Quái TRẠCH của hướng nhà — không đổi).
                const rInnerMenh = 130;

                let houseFacing = parseFloat(document.getElementById("houseFacing")?.value) || 0;
                let sonDen = document.getElementById("selSonDen")?.value, sonDi = document.getElementById("selSonDi")?.value;

                let quaiTrachNha = timQuaiTrachTheoGoc(houseFacing);
                let nhomTrach = nhomTuTrach[quaiTrachNha.ten];
                let bangDuNien = duNienBatTrach[quaiTrachNha.ten]; // {huong: {"Sinh Khí":"Đông Nam", ...}}

                // Tra tên Du Niên tương ứng với 1 phương vị cụ thể, theo 1 bảng Du Niên bất kỳ
                // (dùng chung cho cả tra theo Quái Trạch lẫn tra theo Quái Mệnh — đảo ngược .huong)
                function duNienTaiPhuongTheoBang(bang, tenPhuong) {
                    if (!bang) return null;
                    for (let ten in bang.huong) { if (bang.huong[ten] === tenPhuong) return ten; }
                    return null;
                }
                function duNienTaiPhuong(tenPhuong) { return duNienTaiPhuongTheoBang(bangDuNien, tenPhuong); }
                function sonVePhuongVi(tenSon) {
                    let s = DS24_SON.find(x => x.ten === tenSon);
                    if (!s) return null;
                    return timQuaiTrachTheoGoc(s.goc).phuong;
                }
                let phuongDen = sonDen ? sonVePhuongVi(sonDen) : null;
                let phuongDi = sonDi ? sonVePhuongVi(sonDi) : null;

                // ==== Chế độ "So Mệnh gia chủ" — tính Quái Mệnh từ năm sinh/giới tính hiện có,
                // tra bảng Du Niên riêng theo Quái Mệnh đó (KHÁC bảng theo Quái Trạch ở trên). ====
                let dangSoMenh = (batTrachCheDo === "menh");
                let menhGiaChu = null, bangDuNienMenh = null;
                if (dangSoMenh) {
                    let namSinh = parseInt(document.getElementById("namSinhGiaChu")?.value) || 1990;
                    let gioiTinhRaw = document.getElementById("gioiTinhGiaChu")?.value;
                    let gioiTinhChu = (gioiTinhRaw === "Nữ" || gioiTinhRaw === "nu") ? "nu" : "nam";
                    menhGiaChu = window.tinhMenhQuai ? window.tinhMenhQuai(namSinh, gioiTinhChu) : null;
                    bangDuNienMenh = menhGiaChu ? duNienBatTrach[menhGiaChu.cung] : null;
                }
                function duNienTheoMenhTaiPhuong(tenPhuong) { return duNienTaiPhuongTheoBang(bangDuNienMenh, tenPhuong); }

                let html = "";
                html += `<circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="#3a2a1a" stroke-width="1.5" opacity="0.8"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="#5c4a3a" stroke-width="1" opacity="0.7"/>`;
                if (dangSoMenh) html += `<circle cx="${cx}" cy="${cy}" r="${rInnerMenh}" fill="none" stroke="#6a1b9a" stroke-width="1" opacity="0.7" stroke-dasharray="4,3"/>`;

                // ---- VÒNG CHIA ĐỘ (ngoài cùng, mỗi 10°) — cùng phong cách la bàn Trường Sinh ----
                for (let deg = 0; deg < 360; deg += 10) {
                    let rad = (deg - 90) * Math.PI / 180;
                    let isMajor = deg % 45 === 0;
                    let rIn = isMajor ? rDoTick - 8 : rDoTick - 4;
                    let x1 = cx + rIn * Math.cos(rad), y1 = cy + rIn * Math.sin(rad);
                    let x2 = cx + rDoSo * Math.cos(rad), y2 = cy + rDoSo * Math.sin(rad);
                    html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#5c4a3a" stroke-width="${isMajor?1.5:1}" opacity="0.85"/>`;
                    let xt = cx + rDoText * Math.cos(rad), yt = cy + rDoText * Math.sin(rad);
                    html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${(tpFontSize*0.6).toFixed(1)}" font-weight="600" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${deg} ${xt.toFixed(1)} ${yt.toFixed(1)})">${deg}</text>`;
                }

                // 8 cung Du Niên, mỗi cung 45°, tâm cung tại đúng bội số của 45° (Bắc=0°, Đông Bắc=45°...)
                PHUONG_VI_8.forEach(function(pv) {
                    let gocTam = pv.goc;
                    let tenDuNien = duNienTaiPhuong(pv.ten);
                    let gocStart = gocTam - 22.5, gocEnd = gocTam + 22.5;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rOuter * Math.cos(rs), ysO = cy + rOuter * Math.sin(rs);
                    let xeO = cx + rOuter * Math.cos(re), yeO = cy + rOuter * Math.sin(re);
                    // Vòng ngoài (Quái Trạch) co lại còn tới rInnerMenh khi đang So Mệnh, nhường chỗ
                    // cho dải phụ Du Niên theo Mệnh ở trong; bình thường (chỉ Trạch đất) vẫn tới rInner.
                    let rTrongCungNay = dangSoMenh ? rInnerMenh : rInner;
                    let xsI = cx + rTrongCungNay * Math.cos(re), ysI = cy + rTrongCungNay * Math.sin(re);
                    let xeI = cx + rTrongCungNay * Math.cos(rs), yeI = cy + rTrongCungNay * Math.sin(rs);
                    let mauNen = tenDuNien ? mauTheoDuNien(tenDuNien) : "#cfcfcf";
                    let laCungDen = phuongDen === pv.ten, laCungDi = phuongDi === pv.ten;
                    let vien = laCungDen ? "#1565c0" : (laCungDi ? "#e65100" : "#3a2a1a");
                    let dayVien = (laCungDen || laCungDi) ? 5 : 1;
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rOuter},${rOuter} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rTrongCungNay},${rTrongCungNay} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${doMoNenLaBan}" stroke="${vien}" stroke-width="${dayVien}"/>`;

                    // Vạch ranh giới cung (vòng ngoài)
                    let x1b = cx + rTrongCungNay * Math.cos(rs), y1b = cy + rTrongCungNay * Math.sin(rs);
                    let x2b = cx + rOuter * Math.cos(rs), y2b = cy + rOuter * Math.sin(rs);
                    html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#3a2a1a" stroke-width="1"/>`;

                    let radT = (gocTam - 90) * Math.PI / 180;
                    // Tên Du Niên (theo Trạch) — vòng ngoài. Khi đang So Mệnh (có cả 2 vòng cùng
                    // hiển thị), thêm nhãn phụ "(Ngoài)" nhỏ bên dưới để người dùng phân biệt rõ
                    // đây là vòng Trạch chứ không phải vòng Mệnh ở trong.
                    if (tenDuNien) {
                        let xDN = cx + rTextDuNien * Math.cos(radT), yDN = cy + rTextDuNien * Math.sin(radT);
                        html += `<g transform="rotate(${gocTam} ${xDN.toFixed(1)} ${yDN.toFixed(1)})"><text x="${xDN.toFixed(1)}" y="${yDN.toFixed(1)}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="800" fill="#7a1010" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${tenDuNien}</text></g>`;
                        if (dangSoMenh) {
                            let yDN2 = yDN + tpFontSize*1.05*0.85;
                            html += `<g transform="rotate(${gocTam} ${xDN.toFixed(1)} ${yDN2.toFixed(1)})"><text x="${xDN.toFixed(1)}" y="${yDN2.toFixed(1)}" font-size="${(tpFontSize*0.6).toFixed(1)}" font-weight="700" fill="#7a1010" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle"></text></g>`;
                        }
                    }
                    // Tên phương vị — vòng trong (giữa 2 dải, hoặc trong cùng nếu không so Mệnh)
                    let xPV = cx + rTextPhuong * Math.cos(radT), yPV = cy + rTextPhuong * Math.sin(radT);
                    html += `<g transform="rotate(${gocTam} ${xPV.toFixed(1)} ${yPV.toFixed(1)})"><text x="${xPV.toFixed(1)}" y="${yPV.toFixed(1)}" font-size="${(tpFontSize*1.1).toFixed(1)}" font-weight="900" fill="#1a1a1a" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${pv.ten}</text></g>`;


                    // ---- Dải phụ Du Niên theo MỆNH gia chủ (chỉ vẽ khi đang So Mệnh) ----
                    if (dangSoMenh) {
                        let xsO2 = cx + rInnerMenh * Math.cos(rs), ysO2 = cy + rInnerMenh * Math.sin(rs);
                        let xeO2 = cx + rInnerMenh * Math.cos(re), yeO2 = cy + rInnerMenh * Math.sin(re);
                        let xsI2 = cx + rInner * Math.cos(re), ysI2 = cy + rInner * Math.sin(re);
                        let xeI2 = cx + rInner * Math.cos(rs), yeI2 = cy + rInner * Math.sin(rs);
                        let tenDuNienMenh = duNienTheoMenhTaiPhuong(pv.ten);
                        let mauNenMenh = tenDuNienMenh ? mauTheoDuNien(tenDuNienMenh) : "#cfcfcf";
                        // So sánh Trạch vs Mệnh tại cùng 1 cung: nếu 2 bên CÙNG là cát (hoặc cùng
                        // là hung) thì viền tím đậm nhấn mạnh "đồng thuận"; khác nhau thì viền mảnh.
                        let catTrach = THU_TU_CAT_BAT_TRACH.includes(tenDuNien), catMenh = THU_TU_CAT_BAT_TRACH.includes(tenDuNienMenh);
                        let hungTrach = THU_TU_HUNG_BAT_TRACH.includes(tenDuNien), hungMenh = THU_TU_HUNG_BAT_TRACH.includes(tenDuNienMenh);
                        let dongThuan = (catTrach && catMenh) || (hungTrach && hungMenh);
                        html += `<path d="M${xsO2.toFixed(1)},${ysO2.toFixed(1)} A${rInnerMenh},${rInnerMenh} 0 0,1 ${xeO2.toFixed(1)},${yeO2.toFixed(1)} L${xsI2.toFixed(1)},${ysI2.toFixed(1)} A${rInner},${rInner} 0 0,0 ${xeI2.toFixed(1)},${yeI2.toFixed(1)} Z" fill="${mauNenMenh}" fill-opacity="${Math.min(1,doMoNenLaBan+0.15)}" stroke="${dongThuan?'#6a1b9a':'#3a2a1a'}" stroke-width="${dongThuan?3:1}"/>`;
                        if (tenDuNienMenh) {
                            let rTextMenh = (rInnerMenh + rInner) / 2;
                            let xM = cx + rTextMenh * Math.cos(radT), yM = cy + rTextMenh * Math.sin(radT);
                            // Gộp "(Mệnh)" ngay sau tên Du Niên trên cùng 1 dòng — dải này khá hẹp
                            // nên tách 2 dòng riêng sẽ chật; ghi gọn để phân biệt với vòng Trạch
                            // ở ngoài (đã có nhãn "(Ngoài · Trạch)" riêng).
                            html += `<g transform="rotate(${gocTam} ${xM.toFixed(1)} ${yM.toFixed(1)})"><text x="${xM.toFixed(1)}" y="${yM.toFixed(1)}" font-size="${(tpFontSize*0.7).toFixed(1)}" font-weight="800" fill="#4a148c" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${tenDuNienMenh}</text></g>`;
                        }
                    }
                });

                // Kim chỉ hướng nhà — đặt ra ngoài vòng chia độ (rDoSo) để không đè lên số độ
                let radMui = (houseFacing - 90) * Math.PI / 180;
                let rKimHuong = rDoSo + 25;
                let xHF = cx + rKimHuong * Math.cos(radMui), yHF = cy + rKimHuong * Math.sin(radMui);
                let xHB = cx - rKimHuong * Math.cos(radMui), yHB = cy - rKimHuong * Math.sin(radMui);
                html += `<line x1="${xHB.toFixed(1)}" y1="${yHB.toFixed(1)}" x2="${xHF.toFixed(1)}" y2="${yHF.toFixed(1)}" stroke="#00c8c8" stroke-width="2.5"/>`;
                let tl=20, ta=0.3;
                let x1a = xHF-tl*Math.cos(radMui-ta), y1a = yHF-tl*Math.sin(radMui-ta);
                let x2a = xHF-tl*Math.cos(radMui+ta), y2a = yHF-tl*Math.sin(radMui+ta);
                html += `<polygon points="${xHF.toFixed(1)},${yHF.toFixed(1)} ${x1a.toFixed(1)},${y1a.toFixed(1)} ${x2a.toFixed(1)},${y2a.toFixed(1)}" fill="#00c8c8"/>`;
                let xLH = cx+(rKimHuong+35)*Math.cos(radMui), yLH = cy+(rKimHuong+35)*Math.sin(radMui);
                html += `<text x="${xLH.toFixed(1)}" y="${yLH.toFixed(1)}" font-size="${tpFontSize+3}" font-weight="800" fill="#ff0000" stroke="#fff" stroke-width="1.5" paint-order="stroke" text-anchor="middle" transform="rotate(${houseFacing} ${xLH.toFixed(1)} ${yLH.toFixed(1)})">▲ HƯỚNG NHÀ</text>`;

                // Tâm: Quái Trạch + nhóm Tứ Trạch + chú thích Đến/Đi (+ Quái Mệnh khi So Mệnh)
                // Khi đang So Mệnh, dải phụ chiếm bán kính tới rInnerMenh=130 nên chữ tâm phải
                // co gọn lại, không tràn ra ngoài 130 để khỏi đè lên dải đó.
                html += `<circle cx="${cx}" cy="${cy}" r="7" fill="#ff1a1a" stroke="#fff" stroke-width="2.5"/>`;
                if (!dangSoMenh) {
                    html += `<text x="${cx}" y="${cy-30}" font-size="${(tpFontSize*1.3).toFixed(1)}" font-weight="900" fill="#2e7d32" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle">Quái ${quaiTrachNha.ten}</text>`;
                    html += `<text x="${cx}" y="${cy-5}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="700" fill="#555" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">${nhomTrach}</text>`;
                    if (sonDen) { let dnDen = phuongDen ? duNienTaiPhuong(phuongDen) : null; html += `<text x="${cx}" y="${cy+22}" font-size="${tpFontSize}" font-weight="700" fill="#1565c0" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Đến: ${sonDen} (${phuongDen})${dnDen?" — "+dnDen:""}</text>`; }
                    if (sonDi) { let dnDi = phuongDi ? duNienTaiPhuong(phuongDi) : null; html += `<text x="${cx}" y="${cy+46}" font-size="${tpFontSize}" font-weight="700" fill="#e65100" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Đi: ${sonDi} (${phuongDi})${dnDi?" — "+dnDi:""}</text>`; }
                } else {
                    // Chữ tâm rút gọn, cỡ chữ nhỏ hơn để vừa trong bán kính 130 (không đè dải phụ).
                    html += `<text x="${cx}" y="${cy-32}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="900" fill="#2e7d32" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Trạch (Ngoài): ${quaiTrachNha.ten}</text>`;
                    if (menhGiaChu) {
                        html += `<text x="${cx}" y="${cy-14}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="900" fill="#4a148c" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Nhân (trong): ${menhGiaChu.cung}</text>`;
                        let phamViTrach = nhomTrach.split(" ")[0], phamViMenh = menhGiaChu.nhom.split(" ")[0];
                        let hopNhau = phamViTrach === phamViMenh;
                        html += `<text x="${cx}" y="${cy+4}" font-size="${(tpFontSize*0.65).toFixed(1)}" font-weight="700" fill="${hopNhau?'#1565c0':'#c62828'}" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle">${hopNhau?'✅ Cùng '+phamViTrach+' Tứ':'⚠️ Lệch Đông/Tây'}</text>`;
                    } else {
                        html += `<text x="${cx}" y="${cy-10}" font-size="${(tpFontSize*0.7).toFixed(1)}" font-weight="700" fill="#c62828" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle">Chưa rõ năm sinh</text>`;
                    }
                   // if (sonDen) { let dnDen = phuongDen ? duNienTaiPhuong(phuongDen) : null; html += `<text x="${cx}" y="${cy+22}" font-size="${(tpFontSize*0.75).toFixed(1)}" font-weight="700" fill="#1565c0" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle">Đến: ${sonDen}${dnDen?" ("+dnDen+")":""}</text>`; }
                    //if (sonDi) { let dnDi = phuongDi ? duNienTaiPhuong(phuongDi) : null; html += `<text x="${cx}" y="${cy+38}" font-size="${(tpFontSize*0.75).toFixed(1)}" font-weight="700" fill="#e65100" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle">Đi: ${sonDi}${dnDi?" ("+dnDi+")":""}</text>`; }
                }

                svg.innerHTML = html;
            }
            window.veLaBanBatTrach = veLaBanBatTrach;

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
                panel.style.cssText = "display:none;padding:6px 8px;flex-wrap:nowrap;align-items:center;gap:6px;background:#f5f5f5;border-radius:8px;margin:4px 0;justify-content:flex-start;";
                panel.innerHTML = `
                    <span style="font-size:12px;font-weight:600;color:#444;white-space:nowrap;flex:0 0 auto;">📐 Hình La bàn:</span>
                    <select onchange="chonHinhDangNhaThuyPhap(this.value)" style="padding:2px 24px;border-radius:6px;border:1px solid #ccc;font-size:12px;flex:0 0 auto;width:auto;">
                        <option value="4">4 cạnh</option>
                        <option value="8">8 cạnh</option>
                        <option value="24">24 cạnh</option>
                    </select>
                    <button onclick="luuDaGiacNhaThuyPhap()" style="padding:2px 10px;border-radius:6px;border:none;background:#1565c0;color:#fff;font-size:12px;cursor:pointer;flex:0 0 auto;white-space:nowrap;max-width:70px;width:100%;">💾 Lưu</button>
                    <button onclick="moDaGiacNhaThuyPhap()" style="padding:2px 10px;border-radius:6px;border:none;background:#6a1b9a;color:#fff;font-size:12px;cursor:pointer;flex:0 0 auto;white-space:nowrap;max-width:70px;width:100%;">📂 Mở</button>
                `;
                stage.parentElement.insertBefore(panel, stage);
                return panel;
            }
            damBaoPanelDaGiacTonTai();

            function veCompassOverlay(houseFacing) {
                // Kieu-aware: gọi đúng hàm vẽ của kiểu la bàn ĐANG hiển thị, để mọi nơi trong file
                // này gọi veCompassOverlay() (khi đổi hướng nhà, đổi sơn Đến/Đi, đổi cỡ chữ, v.v.)
                // đều tự cập nhật đúng kiểu la bàn hiện tại thay vì luôn ép về "tron24son".
                let kieu = window.layKieuLaBanHienTai ? window.layKieuLaBanHienTai("compassOverlay") : "tron24son";
                if (kieu === "daGiacNha") { veLaiDaGiacNha(); return; }
                if (kieu === "truongSinh") { veLaBanTruongSinh(); return; }
                if (kieu === "batTrach") { veLaBanBatTrach(); return; }

                const svg = document.getElementById("compassSvg"); if (!svg) return;
                // La bàn luôn cố định ở giữa khung (500,500 trong viewBox 1000x1000) — không di chuyển theo tamPercent nữa.
                const cx = 500, cy = 500;
                const sonDen = document.getElementById("selSonDen")?.value, sonDi = document.getElementById("selSonDi")?.value;
                veCompassChung("compassSvg", cx, cy, houseFacing, {
                    // Bán kính KHÔNG truyền cứng nữa — để veCompassChung() tự dùng default mới (8 hướng
                    // trong cùng -> 24 sơn -> vạch chia độ -> số độ), tránh đè lên thay đổi trong shared.js.
                    doMo:doMoNenLaBan,mauTia:mauTiaHienTai,isReset:isResetMode,
                    resetOffset:isResetMode?-houseFacing:0,sonDen:sonDen,sonDi:sonDi,showLabel:true,fontSize:tpFontSize,mauRanh8:mauRanh8HienTai
                });
                // (Đã bỏ kiểu "vuông 9 ô" — chỉ còn Tròn 24 sơn ↔ Trường Sinh ↔ Bát Trạch ↔ Đa giác nhà.)
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
                imgOffset.x = 0; imgOffset.y = 0; imgScale = 1; imgRotation = 0;
                let rotInput = document.getElementById('tpBgRotation');
                if (rotInput) rotInput.value = 0;
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
                        imgOffset.x = 0; imgOffset.y = 0; imgScale = 1; imgRotation = 0;
                        let rotInput1 = document.getElementById('tpBgRotation'); if (rotInput1) rotInput1.value = 0;
                        capNhatViTriAnhNen();
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
                        imgOffset.x = 0; imgOffset.y = 0; imgScale = 1; imgRotation = 0;
                        let rotInput2 = document.getElementById('tpBgRotation'); if (rotInput2) rotInput2.value = 0;
                        capNhatViTriAnhNen();
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
                // Cho phép kéo/pinch bằng tay ở CẢ 2 chế độ: ảnh tĩnh (isImageMode) VÀ Maps sống
                // (dangODoiMaps). Trước đây hàm này chỉ hoạt động ở chế độ ảnh — khiến chế độ Maps
                // không kéo/zoom bằng gesture được (chỉ dùng được nút mũi tên qua panAnhNenThuyPhap).
                function isPanZoomEnabled() { return isImageMode() || dangODoiMaps(); }
                function start(e) {
                    if (laBanDaKhoa || !isPanZoomEnabled()) return;
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
                    if (laBanDaKhoa || !isPanZoomEnabled()) return;
                    if (dangODoiMaps()) {
                        // Chế độ Maps: kéo tay -> map.panBy() trực tiếp trên Leaflet (không có ảnh tĩnh
                        // để dịch offset). Pinch 2 ngón để Leaflet tự xử lý zoom gốc của nó (không can
                        // thiệp imgScale vì bản đồ sống không dùng imgScale).
                        if (!dragging || !map) return;
                        let p = getClientPos(e);
                        map.panBy([lastX - p.x, lastY - p.y]);
                        lastX = p.x; lastY = p.y;
                        e.preventDefault();
                        return;
                    }
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
                // Zoom bằng lăn chuột (desktop) — ở chế độ Maps dùng map.setZoom(), ở chế độ ảnh dùng imgScale.
                stage.addEventListener("wheel", function(e) {
                    if (laBanDaKhoa || !isPanZoomEnabled()) return;
                    e.preventDefault();
                    if (dangODoiMaps()) {
                        if (!map) return;
                        if (e.deltaY < 0) map.zoomIn(); else map.zoomOut();
                        return;
                    }
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

            const diaChiToCuc = {"Thân":"Thủy","Tý":"Thủy","Thìn":"Thủy","Hợi":"Mộc","Mão":"Mộc","Mùi":"Mộc","Dần":"Hỏa","Ngọ":"Hỏa","Tuất":"Hỏa","Tị":"Kim","Dậu":"Kim","Sửu":"Kim"};
            const thuTuDiaChi12 = ["Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tị","Ngọ","Mùi"];
            const tenGiaiDoan12 = ["Trường Sinh","Mộc Dục","Quan Đới","Lâm Quan","Đế Vượng","Suy","Bệnh","Tử","Mộ","Tuyệt","Thai","Dưỡng"];
            const mucDoCatHung12 = [{den:5,di:-5},{den:4,di:-4},{den:4,di:-3},{den:4,di:-3},{den:5,di:-4},{den:-2,di:5},{den:-3,di:4},{den:-3,di:4},{den:-4,di:5},{den:-5,di:5},{den:-3,di:-3},{den:2,di:2}];
            const khoiTruongSinh = {"Thủy":"Thân","Mộc":"Hợi","Hỏa":"Dần","Kim":"Tị"};
            // ==== Khởi Trường Sinh theo TỌA (phái Long/Sơn) — khác cơ chế theo Thủy Khẩu ở
            // trên: ở đây mỗi Ngũ Hành của Sơn Tọa có SẴN 2 điểm khởi Trường Sinh cố định khác
            // nhau (không phải cùng 1 điểm rồi đảo chiều đếm), gọi là "Trường Sinh thuận" và
            // "Trường Sinh nghịch". Sau khi xác định điểm khởi, 12 giai đoạn luôn đếm xuôi theo
            // đúng chiều thuTuDiaChi12 (giống cơ chế cũ, buoc=+1) — chỉ điểm khởi khác nhau.
            // Nguồn: bảng ngũ hành Sơn — Thủy: Hợi/Nhâm/Tý/Quý; Mộc: Dần/Giáp/Mão/Ất/Tốn;
            // Hỏa: Tị/Bính/Ngọ/Đinh; Kim: Thân/Canh/Dậu/Tân/Càn; Thổ: Cấn/Khôn/Thìn/Tuất/Sửu/Mùi.
            const sonToNguHanh = {
                "Hợi":"Thủy","Nhâm":"Thủy","Tý":"Thủy","Quý":"Thủy",
                "Dần":"Mộc","Giáp":"Mộc","Mão":"Mộc","Ất":"Mộc","Tốn":"Mộc",
                "Tị":"Hỏa","Bính":"Hỏa","Ngọ":"Hỏa","Đinh":"Hỏa",
                "Thân":"Kim","Canh":"Kim","Dậu":"Kim","Tân":"Kim","Càn":"Kim",
                "Cấn":"Thổ","Khôn":"Thổ","Thìn":"Thổ","Tuất":"Thổ","Sửu":"Thổ","Mùi":"Thổ"
            };
            const khoiTruongSinhTheoToa = {
                "Thủy":{thuan:"Thân",nghich:"Mão"}, "Mộc":{thuan:"Hợi",nghich:"Ngọ"},
                "Hỏa":{thuan:"Dần",nghich:"Dậu"}, "Kim":{thuan:"Tị",nghich:"Tý"},
                "Thổ":{thuan:"Thân",nghich:"Mão"}
            };
            // Chế độ khởi Trường Sinh: "thuykhau" (theo Cục = Nước Đi, mặc định, đã có từ trước)
            // hoặc "toa" (theo Ngũ Hành của Sơn Tọa nhà — Tọa = đối 180° với Hướng nhà).
            let khoiTruongSinhCheDo = "thuykhau";
            // Chiều chạy của vòng 12 Trường Sinh — do người dùng xác nhận theo chiều nước chảy
            // qua Minh Đường thực tế của căn nhà (không cố định theo Cục). "thuan" chạy theo
            // chiều tăng của thuTuDiaChi12 (Tý→Sửu→Dần...), "nghich" chạy ngược lại. Vòng
            // Trường Sinh phải build LẠI mỗi khi chiều đổi nên tách thành hàm riêng.
            let chieuTruongSinh = "thuan";
            let vongTruongSinh = {};
            // Tọa = đối 180° với Hướng nhà (houseFacing). Tìm sơn 24 gần nhất với góc Tọa bằng
            // DS24_SON sẵn có (không phụ thuộc hàm timSonTheoGoc để tránh giả định thứ tự load).
            function timSonTheoGocCucBo(goc) {
                let g = ((goc%360)+360)%360, best = DS24_SON[0], bestDiff = 999;
                DS24_SON.forEach(s => { let diff = Math.min(Math.abs(g-s.goc), 360-Math.abs(g-s.goc)); if (diff<bestDiff){bestDiff=diff;best=s;} });
                return best;
            }
            function laySonToa(houseFacing) {
                let gocToa = (houseFacing + 180) % 360;
                return timSonTheoGocCucBo(gocToa);
            }
            function buildVongTruongSinh() {
                vongTruongSinh = {};
                if (khoiTruongSinhCheDo === "toa") {
                    // Theo Tọa: mỗi Ngũ Hành có 2 điểm khởi cố định khác nhau (thuận/nghịch).
                    // "Thuận" đếm XUÔI chiều thuTuDiaChi12 (buoc=+1) từ điểm khởi thuận; "Nghịch"
                    // đếm NGƯỢC chiều (buoc=-1) từ điểm khởi nghịch — thiếu chiều ngược này thì
                    // vòng Nghịch sẽ ra sai vị trí Đế Vượng/Suy/... (không đối xứng đúng lý).
                    for (let hanh in khoiTruongSinhTheoToa) {
                        let diaChiKhoi = khoiTruongSinhTheoToa[hanh][chieuTruongSinh] || khoiTruongSinhTheoToa[hanh].thuan;
                        let idxKhoi = thuTuDiaChi12.indexOf(diaChiKhoi), bang = [];
                        let buoc = (chieuTruongSinh === "nghich") ? -1 : 1;
                        for (let i = 0; i < 12; i++) {
                            let diaChi = thuTuDiaChi12[((idxKhoi + i * buoc) % 12 + 12) % 12];
                            bang.push({gd:tenGiaiDoan12[i],diaChi:diaChi,den:mucDoCatHung12[i].den,di:mucDoCatHung12[i].di});
                        }
                        vongTruongSinh[hanh] = bang;
                    }
                    return;
                }
                for (let cuc in khoiTruongSinh) {
                    let diaChiKhoi = khoiTruongSinh[cuc], idxKhoi = thuTuDiaChi12.indexOf(diaChiKhoi), bang = [];
                    let buoc = (chieuTruongSinh === "nghich") ? -1 : 1;
                    for (let i = 0; i < 12; i++) {
                        let diaChi = thuTuDiaChi12[((idxKhoi + i * buoc) % 12 + 12) % 12];
                        bang.push({gd:tenGiaiDoan12[i],diaChi:diaChi,den:mucDoCatHung12[i].den,di:mucDoCatHung12[i].di});
                    }
                    vongTruongSinh[cuc] = bang;
                }
            }
            buildVongTruongSinh();
            function chonKhoiTruongSinhCheDo(cheDo) {
                khoiTruongSinhCheDo = (cheDo === "toa") ? "toa" : "thuykhau";
                buildVongTruongSinh();
                let btnTK = document.getElementById("btnTruongSinhTheoThuyKhau"), btnT = document.getElementById("btnTruongSinhTheoToa");
                if (btnTK && btnT) {
                    let laThuyKhau = khoiTruongSinhCheDo === "thuykhau";
                    btnTK.style.background = laThuyKhau ? "#1565c0" : "#fff"; btnTK.style.color = laThuyKhau ? "#fff" : "#555"; btnTK.style.borderColor = laThuyKhau ? "#1565c0" : "#999";
                    btnT.style.background = !laThuyKhau ? "#1565c0" : "#fff"; btnT.style.color = !laThuyKhau ? "#fff" : "#555"; btnT.style.borderColor = !laThuyKhau ? "#1565c0" : "#999";
                }
                let lbl = document.getElementById("lblChieuTruongSinh");
                if (lbl) lbl.innerText = (khoiTruongSinhCheDo === "toa") ? "📍 Điểm khởi (theo Ngũ Hành Tọa)" : "🌊 Chiều nước qua Minh Đường";
                veCompassOverlay(parseFloat(document.getElementById("houseFacing")?.value) || 0);
            }
            window.chonKhoiTruongSinhCheDo = chonKhoiTruongSinhCheDo;
            function chonChieuTruongSinh(chieu) {
                chieuTruongSinh = (chieu === "nghich") ? "nghich" : "thuan";
                buildVongTruongSinh();
                let btnT = document.getElementById("btnTruongSinhThuan"), btnN = document.getElementById("btnTruongSinhNghich");
                if (btnT && btnN) {
                    let bat = chieuTruongSinh === "thuan";
                    btnT.style.background = bat ? "#4CAF50" : "#fff"; btnT.style.color = bat ? "#fff" : "#555"; btnT.style.borderColor = bat ? "#4CAF50" : "#999";
                    btnN.style.background = !bat ? "#4CAF50" : "#fff"; btnN.style.color = !bat ? "#fff" : "#555"; btnN.style.borderColor = !bat ? "#4CAF50" : "#999";
                }
                let lbl = document.getElementById("lblChieuTruongSinh");
                if (lbl) lbl.innerText = (khoiTruongSinhCheDo === "toa") ? "📍 Điểm khởi (theo Ngũ Hành Tọa)" : "🌊 Chiều nước qua Minh Đường";
                veCompassOverlay(parseFloat(document.getElementById("houseFacing")?.value) || 0);
            }
            window.chonChieuTruongSinh = chonChieuTruongSinh;
            function traTamHop(cuc, diaChi) { if (!cuc || !diaChi) return null; let bang = vongTruongSinh[cuc]; return bang.find(gd=>gd.diaChi===diaChi) || null; }
            // (Đã bỏ quyDoiSonVeDiaChi()/timDiaChiTheoGoc() — Nước Đến/Đi cho la bàn Trường Sinh
            // giờ chọn THẲNG 12 Địa Chi qua #selDiaChiDen/#selDiaChiDi, không còn suy ngầm từ sơn
            // 24 nữa, nên không cần quy đổi góc→Địa Chi ở đây. Xem GOC_DIA_CHI_12 đầu file.)
            const huongToQuaiTrach = [{goc:0,ten:"Khảm",phuong:"Bắc"},{goc:45,ten:"Cấn",phuong:"Đông Bắc"},{goc:90,ten:"Chấn",phuong:"Đông"},{goc:135,ten:"Tốn",phuong:"Đông Nam"},{goc:180,ten:"Ly",phuong:"Nam"},{goc:225,ten:"Khôn",phuong:"Tây Nam"},{goc:270,ten:"Đoài",phuong:"Tây"},{goc:315,ten:"Càn",phuong:"Tây Bắc"}];
            function timQuaiTrachTheoGoc(goc) { let g = ((goc%360)+360)%360, best = huongToQuaiTrach[0], bestDiff = 999; huongToQuaiTrach.forEach(h=>{let diff=Math.min(Math.abs(g-h.goc),360-Math.abs(g-h.goc)); if(diff<bestDiff){bestDiff=diff;best=h;}}); return best; }
            const nhomTuTrach = {"Khảm":"Đông Tứ Trạch","Ly":"Đông Tứ Trạch","Chấn":"Đông Tứ Trạch","Tốn":"Đông Tứ Trạch","Càn":"Tây Tứ Trạch","Khôn":"Tây Tứ Trạch","Cấn":"Tây Tứ Trạch","Đoài":"Tây Tứ Trạch"};
            const duNienBatTrach = {
                "Khảm":{huong:{"Sinh Khí":"Đông Nam","Thiên Y":"Đông","Diên Niên":"Nam","Phục Vị":"Bắc","Tuyệt Mệnh":"Tây Nam","Lục Sát":"Tây Bắc","Ngũ Quỷ":"Đông Bắc","Họa Hại":"Tây"}},
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
            // Trạch mệnh (Quái Mệnh Bát Trạch) — dùng chung window.tinhMenhQuai (shared.js)
            // thay vì công thức riêng ở đây, để tránh lệch kết quả Đông Tứ Mệnh / Tây Tứ Mệnh
            // giữa các tab (trước đây module này tự tính bằng công thức "2 số cuối năm sinh +
            // mốc năm 2000" khác với công thức chuẩn "tổng 4 chữ số năm sinh" ở shared.js,
            // dẫn tới sai lệch quái mệnh với một số năm sinh, ví dụ 1988 Nam ra Chấn thay vì Khôn).
            window.xacNhanThuyKhau = function() {
                let sonDen = document.getElementById("selSonDen").value, sonDi = document.getElementById("selSonDi").value;
                let houseFacing = parseFloat(document.getElementById("houseFacing").value) || 0;
                let sonHuongNhaTamHop = timSonTheoGoc(houseFacing);
                // Tam Hợp Trường Sinh dùng dropdown Địa Chi riêng (#selDiaChiDen/#selDiaChiDi),
                // KHÔNG suy ngầm từ sơn 24 (selSonDen/selSonDi) — vì Càn/Khôn/Cấn/Tốn nằm vắt
                // ngang ranh giới 2 Địa Chi nên quy đổi ngầm sẽ mơ hồ. Phần Bát Trạch bên dưới
                // vẫn dùng sonDen/sonDi (24 sơn) như cũ vì đó là hệ khác (8 phương vị Bát Quái).
                let diaChiDen = document.getElementById("selDiaChiDen")?.value || null;
                let diaChiDi = document.getElementById("selDiaChiDi")?.value || null;
                // Cục/Hành PHẢI xác định theo ĐÚNG chế độ đang chọn trên la bàn Trường Sinh
                // (khoiTruongSinhCheDo: "thuykhau" theo Nước Đi, hay "toa" theo Ngũ Hành Sơn
                // Tọa) — nếu không đồng bộ, phần tổng kết chữ sẽ lệch với hình vẽ la bàn khi
                // người dùng đang xem ở chế độ "toa" (bug đã gặp: tổng kết luôn tính theo
                // Thủy Khẩu bất kể la bàn đang hiển thị chế độ nào).
                let cuc, sonToaChoTongKet = null;
                if (khoiTruongSinhCheDo === "toa") {
                    sonToaChoTongKet = laySonToa(houseFacing);
                    cuc = sonToNguHanh[sonToaChoTongKet.ten] || null;
                } else {
                    cuc = diaChiDi ? diaChiToCuc[diaChiDi] : null;
                }
                let ketQuaDen = (cuc && diaChiDen) ? traTamHop(cuc, diaChiDen) : null;
                let ketQuaDi = (cuc && diaChiDi) ? traTamHop(cuc, diaChiDi) : null;
                function dinhDangKetQua(label, kq, cotXet) {
                    if (!kq) return `${label}: <i>chưa xác định (chưa chọn Địa Chi Nước Đi)</i>`;
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
                let namSinh = parseInt(document.getElementById("namSinhGiaChu").value)||1990, gioiTinhRaw = document.getElementById("gioiTinhGiaChu").value;
                let gioiTinhChu = (gioiTinhRaw === "Nữ" || gioiTinhRaw === "nu") ? "nu" : "nam";
                let menh = window.tinhMenhQuai(namSinh, gioiTinhChu);
                // ==== Bát Trạch Thủy Pháp theo NHÂN MỆNH (Quái Mệnh gia chủ) — tra Du Niên theo
                // cung Mệnh (menh.cung) thay vì cung Trạch nhà (quaiTrachNha.ten). Vòng "Nhân" này
                // song song với vòng "Trạch" đã có, dùng chung Nước Đến/Đi (24 sơn) → phương vị 8
                // hướng, chỉ khác bảng Du Niên tra theo (Mệnh gia chủ thay vì Quái Trạch của nhà).
                let ketQuaBTDenMenh = menh ? traBatTrach(menh.cung, phuongDen) : null;
                let ketQuaBTDiMenh = menh ? traBatTrach(menh.cung, phuongDi) : null;
                // BUG ĐÃ SỬA: nhomMenh có dạng "Đông Tứ Mệnh"/"Tây Tứ Mệnh" còn nhomTrach có dạng
                // "Đông Tứ Trạch"/"Tây Tứ Trạch" — so sánh thẳng 2 chuỗi này (nhomMenh===nhomTrach)
                // LUÔN ra false vì khác hậu tố "Mệnh"/"Trạch", dù cùng ý nghĩa Đông/Tây Tứ. Phải so
                // sánh theo tiền tố "Đông"/"Tây" (cắt ở khoảng trắng đầu tiên) mới đúng.
                let nhomMenh = menh ? menh.nhom : null;
                let phamViMenh = nhomMenh ? nhomMenh.split(" ")[0] : null; // "Đông" hoặc "Tây"
                let phamViTrach = nhomTrach ? nhomTrach.split(" ")[0] : null;
                let hopMenh = (phamViMenh !== null && phamViMenh === phamViTrach);
                document.getElementById("ketQuaThuyKhau").style.display = "block";
                document.getElementById("ketQuaThuyKhau").innerHTML =
                    `<b>Đã ghi nhận Thủy Khẩu:</b><br>house_facing = ${houseFacing}° (hướng nhà ≈ sơn <b>${sonHuongNhaTamHop.ten}</b>)<br>water_in_direction (Nước đến, 24 sơn Bát trạch) = ${sonDen}<br>water_out_direction (Nước đi, 24 sơn Bát trạch) = ${sonDi}<br>Nước Đến/Đi (Tam Hợp vòng trường sinh) = ${diaChiDen||"—"} / ${diaChiDi||"—"}<br><br>
                     ${menh ? `<b>🏡 Trạch mệnh gia chủ:</b> Năm sinh ${namSinh} (${gioiTinhRaw}) → Quái <b>${menh.cung}</b> (Quái ${menh.quaiSo}, hành ${menh.hanh}, ${nhomMenh})<br>
                     <b style="color:${hopMenh?'#1565c0':'#c62828'}">${hopMenh?'✅ Mệnh gia chủ HỢP với Trạch nhà (cùng nhóm '+nhomMenh+')':'⚠️ Mệnh gia chủ KHÔNG hợp Trạch nhà — phạm "Đông Tây hỗn loạn" (Mệnh '+nhomMenh+', Trạch '+nhomTrach+')'}</b><br><br>`
                     : `<b>🏡 Trạch mệnh gia chủ:</b> <i>Không xác định được (kiểm tra lại năm sinh)</i><br><br>`}
                     <b>📘 Tam Hợp Trường Sinh</b> (khởi theo ${khoiTruongSinhCheDo==="toa"?`<b>Tọa nhà</b> — Tọa ≈ sơn <b>${sonToaChoTongKet?sonToaChoTongKet.ten:"—"}</b>, Trường Sinh ${chieuTruongSinh==="nghich"?"nghịch":"thuận"}`:`<b>Thủy Khẩu</b>, chiều nước ${chieuTruongSinh==="nghich"?"nghịch":"thuận"}`}): ${cuc ? `→ thuộc <b>${cuc}${khoiTruongSinhCheDo==="toa"?" (theo Tọa)":" Cục"}</b>` : `<i>${khoiTruongSinhCheDo==="toa"?"Không xác định được Ngũ Hành Tọa":"Chưa chọn Địa Chi Nước Đi nên chưa xác định được Cục"}</i>`}<br>
                     ${dinhDangKetQua("Nước Đến",ketQuaDen,"den")}<br>${dinhDangKetQua("Nước Đi",ketQuaDi,"di")}<br><br>
                     <b>📗 Bát Trạch Thủy Pháp (theo Trạch mệnh):</b> Hướng nhà ≈ ${quaiTrachNha.phuong} → Quái Trạch <b>${quaiTrachNha.ten}</b> (${nhomTrach})<br>
                     ${dinhDangBatTrach("Nước Đến",ketQuaBTDen,phuongDen)}<br>${dinhDangBatTrach("Nước Đi",ketQuaBTDi,phuongDi)}<br><br>
                     ${menh ? `<b>📙 Bát Trạch Thủy Pháp (theo Nhân mệnh):</b> Gia chủ → Quái Mệnh <b>${menh.cung}</b> (${nhomMenh})<br>
                     ${dinhDangBatTrach("Nước Đến",ketQuaBTDenMenh,phuongDen)}<br>${dinhDangBatTrach("Nước Đi",ketQuaBTDiMenh,phuongDi)}<br><br>`
                     : `<b>📙 Bát Trạch Thủy Pháp (theo Nhân mệnh):</b> <i>Không xác định được (kiểm tra lại năm sinh)</i><br><br>`}
                     <i>So sánh 4 sub-module (HKPT / Tam Hợp / Bát Trạch-Trạch / Bát Trạch-Nhân) để có góc nhìn đầy đủ.</i>`;
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
                    selDiaChiDen: val("selDiaChiDen"),
                    selDiaChiDi: val("selDiaChiDi"),
                    chieuTruongSinh: chieuTruongSinh,
                    khoiTruongSinhCheDo: khoiTruongSinhCheDo,
                    namSinhGiaChu: val("namSinhGiaChu"),
                    gioiTinhGiaChu: val("gioiTinhGiaChu"),
                    colorTiaNetDut: val("colorTiaNetDut"),
                    colorRanh8Huong: val("colorRanh8Huong"),
                    tpFontSize: val("tpFontSize"),
                    tpDoMoNen: val("tpDoMoNen"),
                    imgOffset: {x: imgOffset.x, y: imgOffset.y},
                    imgScale: imgScale,
                    imgRotation: imgRotation,
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
                setVal("tpDoMoNen", obj.tpDoMoNen); bnEvt("tpDoMoNen", ["input"]);
                setVal("selSonDen", obj.selSonDen); bnEvt("selSonDen", ["change"]);
                setVal("selSonDi", obj.selSonDi); bnEvt("selSonDi", ["change"]);
                setVal("selDiaChiDen", obj.selDiaChiDen); bnEvt("selDiaChiDen", ["change"]);
                setVal("selDiaChiDi", obj.selDiaChiDi); bnEvt("selDiaChiDi", ["change"]);
                if (typeof chonKhoiTruongSinhCheDo === "function") chonKhoiTruongSinhCheDo(obj.khoiTruongSinhCheDo === "toa" ? "toa" : "thuykhau");
                if (typeof chonChieuTruongSinh === "function") chonChieuTruongSinh(obj.chieuTruongSinh === "nghich" ? "nghich" : "thuan");

                if (obj.imgOffset) { imgOffset.x = obj.imgOffset.x || 0; imgOffset.y = obj.imgOffset.y || 0; } else { imgOffset.x = 0; imgOffset.y = 0; }
                imgScale = obj.imgScale || 1;
                imgRotation = obj.imgRotation || 0;
                setVal("tpBgRotation", imgRotation);
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
                // Vẽ lại la bàn đang hiển thị: cần thiết vì la bàn Bát Trạch ở chế độ "So Mệnh
                // gia chủ" hiển thị Quái Mệnh suy từ chính năm sinh này — đổi năm sinh mà không
                // vẽ lại thì vòng Mệnh ở giữa la bàn bị đứng yên, không cập nhật theo giá trị mới.
                veCompassOverlay(parseFloat(document.getElementById('houseFacing')?.value) || 0);
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
                // Cùng lý do như thuyPhapDoiNamSinhGiaChu ở trên — giới tính cũng quyết định Quái
                // Mệnh (nam/nữ ra Quái khác nhau dù cùng năm sinh).
                veCompassOverlay(parseFloat(document.getElementById('houseFacing')?.value) || 0);
            };
            // Nơi khác (Thông Tin, Nội Khí) đổi #namSinhChu/#gioiTinhChu -> tab Thủy Pháp tự đọc lại,
            // miễn không đang gõ dở tại chính ô của tab này (tránh giật/mất focus khi đang nhập).
            window.thuyPhapDongBoTuNguon = function () {
                let elNamChu = document.getElementById("namSinhChu");
                let elGioiChu = document.getElementById("gioiTinhChu");
                let elNamGiaChu = document.getElementById("namSinhGiaChu");
                let elGioiGiaChu = document.getElementById("gioiTinhGiaChu");
                let coThayDoi = false;
                if (elNamChu && elNamGiaChu && document.activeElement !== elNamGiaChu && elNamGiaChu.value !== elNamChu.value) {
                    elNamGiaChu.value = elNamChu.value;
                    if (typeof capNhatCanChiNamSinh === "function") capNhatCanChiNamSinh("namSinhGiaChu", "canChiNamSinhGiaChu");
                    coThayDoi = true;
                }
                if (elGioiChu && elGioiGiaChu && document.activeElement !== elGioiGiaChu) {
                    let giaTriMoi = gioiTinhChuSangGiaChu(elGioiChu.value);
                    if (elGioiGiaChu.value !== giaTriMoi) { elGioiGiaChu.value = giaTriMoi; coThayDoi = true; }
                }
                // Vẽ lại la bàn nếu năm sinh/giới tính vừa được đồng bộ từ tab khác — cùng lý do
                // như thuyPhapDoiNamSinhGiaChu/thuyPhapDoiGioiTinhGiaChu ở trên (la bàn Bát Trạch
                // chế độ "So Mệnh gia chủ" phụ thuộc trực tiếp 2 giá trị này).
                if (coThayDoi && typeof veCompassOverlay === "function") {
                    veCompassOverlay(parseFloat(document.getElementById('houseFacing')?.value) || 0);
                }
            };
            // Đọc giá trị ban đầu ngay từ nguồn chung (thay vì mặc định cứng 1990/Nam) khi tab này khởi tạo.
            window.thuyPhapDongBoTuNguon();

            setTimeout(function() { veCompassOverlay(parseFloat(document.getElementById("houseFacing").value)||180); }, 100);
        })();