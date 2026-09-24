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
            // "Lai Long" — sơn núi tới (quan sát từ tâm nhà). Chỉ dựng UI ở bước này: đổ 24 sơn
            // vào dropdown + lưu giá trị đã chọn vào laiLongRaw. Hiện laiLongRaw dùng để tô đậm ô
            // Lai Long ở vòng Ngũ Hành Long (la bàn Trường Sinh) và để thống kê "Thông tin thủy pháp".
            let laiLongRaw = null;
            let selLL = document.getElementById("selLaiLong");
            if (selLL) {
                // Ô trống "— chọn —" đứng đầu: nếu không có, trình duyệt tự hiển thị sơn đầu tiên (Tý)
                // dù laiLongRaw vẫn là null → ô hiện "Tý" nhưng thống kê ghi "—", và không thể chọn Tý
                // vì chọn lại đúng giá trị đang hiển thị thì onchange không chạy.
                let oTrongLL = document.createElement("option"); oTrongLL.value = ""; oTrongLL.innerText = "— chọn —";
                selLL.appendChild(oTrongLL);
                DS24_SON.forEach(s => {
                    let o = document.createElement("option"); o.value = s.ten; o.innerText = s.ten + " (" + s.goc + "°)";
                    selLL.appendChild(o);
                });
            }
            window.chonLaiLong = function(son) {
                laiLongRaw = son || null;
                // Vẽ lại la bàn ngay để ô Lai Long ở vòng Ngũ Hành Long được tô đậm khớp với dropdown
                // (giống Nước Đến/Đi). Không có bước này thì phải thao tác khác mới thấy cập nhật.
                if (typeof veCompassOverlay === "function") veCompassOverlay(parseFloat(document.getElementById("houseFacing")?.value) || 0);
            };
            // "Long nhập thủ" — cùng hàng dropdown với Lai Long (#selLongNhapThu). Chọn 1 trong 24 sơn,
            // lưu vào longNhapThuRaw; hiện được đưa vào "Thông tin thủy pháp" (xacNhanThuyKhau) và vào
            // bản lưu/khôi phục. CHƯA vẽ/tô gì trên la bàn. Khác Lai Long ở chỗ có ô trống "— chọn —"
            // đứng đầu, nên lúc mới mở ô hiển thị trống và khớp với longNhapThuRaw = null.
            let longNhapThuRaw = null;
            let selLNT = document.getElementById("selLongNhapThu");
            if (selLNT) {
                let oTrong = document.createElement("option"); oTrong.value = ""; oTrong.innerText = "— chọn —";
                selLNT.appendChild(oTrong);
                DS24_SON.forEach(s => {
                    let o = document.createElement("option"); o.value = s.ten; o.innerText = s.ten + " (" + s.goc + "°)";
                    selLNT.appendChild(o);
                });
            }
            window.chonLongNhapThu = function(son) {
                longNhapThuRaw = son || null;
            };
            // ==== Dropdown riêng cho la bàn Trường Sinh — chọn THẲNG 12 Địa Chi (không suy ngầm
            // từ 24 sơn), vì các sơn Càn/Khôn/Cấn/Tốn nằm vắt ngang ranh giới 2 Địa Chi (vd Càn
            // nửa thuộc Tuất, nửa thuộc Hợi) nên quy đổi ngầm sẽ mơ hồ, không rõ ràng với người
            // dùng. Cùng nguồn số liệu góc Địa Chi với GOC_DIA_CHI_12 dùng trong hàm vẽ la bàn
            // duy nhất về góc từng Địa Chi — xem GOC_DIA_CHI_12 bên dưới, dùng chung cho cả đây
            // lẫn hàm vẽ la bàn Trường Sinh).
            // Góc TÂM mỗi cung Địa Chi là CHÍNH GÓC — không cộng, không trừ độ lệch nào (Tý=0°,
            // Sửu=30°, Dần=60°...), theo yêu cầu của người dùng. Vòng 12 Địa Chi vì vậy thẳng hàng
            // với ĐỊA BÀN (vòng 24 Sơn ngoài cùng trong 3 vòng, cũng không lệch) — không thẳng hàng
            // với Nhân bàn (−7.5°) hay Thiên bàn (+7.5°) nữa.
            // (Trước đây bảng này lần lượt lệch −7.5° rồi +7.5° — nay bỏ hẳn độ lệch theo yêu cầu mới.)
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
            // Bảng quy đổi 24 sơn → 12 Địa Chi (dựa đúng vào GOC_DIA_CHI_12 ở trên: mỗi Địa Chi
            // "gánh" luôn Can/Quái đứng ngay trước nó theo góc). Dùng để la bàn Trường Sinh tự
            // suy ra Nước Đến/Đi (12 Địa Chi) từ dropdown 24 sơn #selSonDen/#selSonDi dùng
            // chung với các la bàn khác — không cần dropdown riêng nữa.
            const SON_SANG_DIA_CHI_12 = {
                "Tý":"Tý","Nhâm":"Tý", "Sửu":"Sửu","Quý":"Sửu", "Dần":"Dần","Cấn":"Dần",
                "Mão":"Mão","Giáp":"Mão", "Thìn":"Thìn","Ất":"Thìn", "Tị":"Tị","Tốn":"Tị",
                "Ngọ":"Ngọ","Bính":"Ngọ", "Mùi":"Mùi","Đinh":"Mùi", "Thân":"Thân","Khôn":"Thân",
                "Dậu":"Dậu","Canh":"Dậu", "Tuất":"Tuất","Tân":"Tuất", "Hợi":"Hợi","Càn":"Hợi"
            };
            function quyDoiSonSangDiaChi(tenSon) { return tenSon ? (SON_SANG_DIA_CHI_12[tenSon] || null) : null; }
            // 4 nhóm Thủy Khẩu (Tứ Mộ): mỗi nhóm có DUY NHẤT 1 Thủy Khẩu, Mộ = cặp Can/Quái + Chi.
            // Chọn bất kỳ sơn nào trong nhóm => quy ra Thủy Khẩu của nhóm đó (luôn là giải đoạn Mộ).
            const NHOM_THUY_KHAU = [
                { hanh:"Hỏa",  thuyKhau:"Thìn", mo:["Ất","Thìn"],  son:["Ất","Thìn","Tốn","Tị","Bính","Ngọ"] },
                { hanh:"Thủy", thuyKhau:"Tuất", mo:["Tân","Tuất"], son:["Tân","Tuất","Càn","Hợi","Nhâm","Tý"] },
                { hanh:"Mộc",  thuyKhau:"Sửu",  mo:["Quý","Sửu"],  son:["Quý","Sửu","Cấn","Dần","Giáp","Mão"] },
                { hanh:"Kim",  thuyKhau:"Mùi",  mo:["Đinh","Mùi"], son:["Đinh","Mùi","Khôn","Thân","Canh","Dậu"] }
            ];
            function timNhomThuyKhau(tenSon) {
                if (!tenSon) return null;
                return NHOM_THUY_KHAU.find(function(n) { return n.son.indexOf(tenSon) >= 0; }) || null;
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
            // ==== Bật/tắt 2 dải Bát Trạch (Trạch đất / Mệnh gia chủ) TÍCH HỢP VÀO BÊN TRONG
            // la bàn Trường Sinh (kiểu la bàn thứ 3) — độc lập với la bàn Bát Trạch 8 cung
            // riêng (kiểu la bàn thứ 4, vẫn giữ nguyên không đổi). Mặc định BẬT cả 2 để giữ
            // hành vi hữu ích ngay từ đầu; người dùng có thể tắt riêng từng dải nếu thấy rối.
            let hienThiBatTrachTrachTrongTruongSinh = true;
            let hienThiBatTrachMenhTrongTruongSinh = true;
            function capNhatNutToggleBatTrachTrongTS() {
                function apDungNut(id, dangBat) {
                    let btn = document.getElementById(id); if (!btn) return;
                    btn.style.background = dangBat ? "#4CAF50" : "#fff";
                    btn.style.color = dangBat ? "#fff" : "#555";
                    btn.style.borderColor = dangBat ? "#4CAF50" : "#999";
                }
                apDungNut("btnToggleBatTrachTrachTrongTS", hienThiBatTrachTrachTrongTruongSinh);
                apDungNut("btnToggleBatTrachMenhTrongTS", hienThiBatTrachMenhTrongTruongSinh);
            }
            window.toggleBatTrachTrachTrongTruongSinh = function() {
                hienThiBatTrachTrachTrongTruongSinh = !hienThiBatTrachTrachTrongTruongSinh;
                capNhatNutToggleBatTrachTrongTS();
                if (typeof veLaBanTruongSinh === "function") veLaBanTruongSinh();
            };
            window.toggleBatTrachMenhTrongTruongSinh = function() {
                hienThiBatTrachMenhTrongTruongSinh = !hienThiBatTrachMenhTrongTruongSinh;
                capNhatNutToggleBatTrachTrongTS();
                if (typeof veLaBanTruongSinh === "function") veLaBanTruongSinh();
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

            // Danh sách 4 kiểu la bàn của tab Thủy Pháp, đúng thứ tự hiển thị trong dropdown.
            // (Đã bỏ "batTrach" khỏi danh sách chọn — hàm veLaBanBatTrach()/dữ liệu duNienBatTrach
            // vẫn giữ nguyên trong file vì traBatTrach() ở phần Thủy Khẩu bên dưới còn dùng tới,
            // chỉ là người dùng không còn chọn được "la bàn Bát Trạch" như 1 kiểu la bàn riêng nữa.)
            const THU_TU_KIEU_LA_BAN = ["tron24son", "truongSinh", "khamDu", "daGiacNha"];
            const NHAN_KIEU_LA_BAN = { tron24son: "24 Sơn", truongSinh: "Trường Sinh", khamDu: "Kham Dư", daGiacNha: "Đa Giác Nhà" };
            const ICON_KIEU_LA_BAN = { tron24son: "🧭", truongSinh: "♻️", khamDu: "🗺️", daGiacNha: "📐" };

            window.chonKieuLaBanThuyPhap = function(kieuMoiRaw) {
                damBaoSvgDaGiacTonTai();
                damBaoSvgTruongSinhTonTai();
                damBaoSvgBatTrachTonTai();
                damBaoSvgKhamDuTonTai();
                let kieuMoi = window.setKieuLaBan("compassOverlay",
                    THU_TU_KIEU_LA_BAN.includes(kieuMoiRaw) ? kieuMoiRaw : THU_TU_KIEU_LA_BAN[0]);

                let svgTron = document.getElementById("compassSvg");
                let svgDaGiac = document.getElementById("compassSvgDaGiac");
                let svgTruongSinh = document.getElementById("compassSvgTruongSinh");
                let svgKhamDu = document.getElementById("compassSvgKhamDu");
                if (svgTron) svgTron.style.display = (kieuMoi === "tron24son") ? "block" : "none";
                if (svgDaGiac) svgDaGiac.style.display = (kieuMoi === "daGiacNha") ? "block" : "none";
                if (svgTruongSinh) svgTruongSinh.style.display = (kieuMoi === "truongSinh") ? "block" : "none";
                if (svgKhamDu) svgKhamDu.style.display = (kieuMoi === "khamDu") ? "block" : "none";
                let panelDaGiac = document.getElementById("thuyPhapDaGiacPanel");
                if (panelDaGiac) panelDaGiac.style.display = (kieuMoi === "daGiacNha") ? "flex" : "none";
                // Hàng chọn chế độ khởi Trường Sinh (Thủy Khẩu/Tọa/Mộ), Thuận-Nghịch, dải Bát
                // Trạch tích hợp, và nút "✅ Xác nhận" (đã dời xuống đây) — tất cả chỉ có tác
                // dụng và chỉ cần hiện khi đang ở la bàn Trường Sinh.
                let rowDiaChi = document.getElementById("tpDiaChiRow");
                if (rowDiaChi) rowDiaChi.style.display = (kieuMoi === "truongSinh") ? "flex" : "none";

                veCompassOverlay(parseFloat(document.getElementById('houseFacing').value) || 0);

                let sel = document.getElementById("selKieuLaBan");
                if (sel && sel.value !== kieuMoi) sel.value = kieuMoi;
            };
            // Giữ tên hàm cũ để tương thích ngược với bất kỳ chỗ nào khác còn gọi
            // window.chuyenKieuLaBanThuyPhap() — nay chuyển sang chọn kế tiếp trong danh sách 4 kiểu.
            window.chuyenKieuLaBanThuyPhap = function() {
                let hienTai = window.layKieuLaBanHienTai("compassOverlay");
                let idxMoi = (THU_TU_KIEU_LA_BAN.indexOf(hienTai) + 1) % THU_TU_KIEU_LA_BAN.length;
                window.chonKieuLaBanThuyPhap(THU_TU_KIEU_LA_BAN[idxMoi]);
            };
            // Tự tạo dropdown chọn kiểu la bàn nếu HTML chưa có sẵn #selKieuLaBan — đặt cạnh
            // btnToggleCompass (thừa hưởng vị trí của nút 🧭 cũ) để không phải sửa tay index.html.
            function damBaoDropdownKieuLaBanTonTai() {
                let sel = document.getElementById("selKieuLaBan");
                if (sel) return sel;
                let anchor = document.getElementById("btnToggleCompass");
                if (!anchor || !anchor.parentElement) return null;
                sel = document.createElement("select");
                sel.id = "selKieuLaBan";
                sel.title = "Chọn kiểu la bàn";
                // .map-stage là position:relative + overflow:hidden, và các nút anh em
                // (btnKhoaLaBan/btnResetGoc/btnToggleCompass) đều position:absolute (xem .btn-toggle-compass
                // trong style.css) — dropdown PHẢI absolute tương tự, nếu không sẽ nằm ở vị trí static
                // và bị overflow:hidden của .map-stage cắt mất (ẩn hoàn toàn dù không có display:none).
                sel.style.cssText = "position:absolute;top:8px;left:50%;transform:translateX(78px);z-index:30;padding:3px 20px 3px 6px;border-radius:14px;border:1px solid rgba(255,255,255,0.4);font-size:11px;font-weight:700;background:rgba(25,118,210,0.9);color:#fff;display:none;max-width:118px;";
                THU_TU_KIEU_LA_BAN.forEach(function(kieu) {
                    let opt = document.createElement("option");
                    opt.value = kieu;
                    opt.textContent = ICON_KIEU_LA_BAN[kieu] + " " + NHAN_KIEU_LA_BAN[kieu];
                    sel.appendChild(opt);
                });
                sel.addEventListener("change", function() { window.chonKieuLaBanThuyPhap(this.value); });
                anchor.parentElement.insertBefore(sel, anchor.nextSibling);

                // ==== ĐỒNG BỘ HIỂN THỊ với btnToggleCompass mọi lúc (bám theo, không cần sửa từng
                // chỗ code cũ set display='block'/'none' cho btnToggleCompass — tránh sót chỗ). ====
                let dongBoHienThi = function() {
                    sel.style.display = anchor.style.display === "none" ? "none" : "block";
                };
                dongBoHienThi(); // đồng bộ ngay lần đầu (lúc này anchor thường đang display:none)
                let mo = new MutationObserver(dongBoHienThi);
                mo.observe(anchor, { attributes: true, attributeFilter: ["style"] });

                return sel;
            }
            damBaoDropdownKieuLaBanTonTai();


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
                // 1300x1300 (thay vì 1000) để có chỗ cho 3 vòng 24 Sơn (Nhân/Thiên/Địa bàn).
                svg.setAttribute("viewBox", "0 0 1300 1300");
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

            // ====================================================================
            // VÒNG LONG PHÁP – LUẬN LONG   (CHỖ GIỮ CHỖ — CHƯA CÓ NỘI DUNG)
            // Nằm NGAY BÊN TRONG vòng 12 Địa Chi, ngoài các dải Bát Trạch: r từ rTrong → rNgoai
            // (hiện 200 → 260). Hiện chỉ vẽ nền + tên vòng để giữ chỗ trên la bàn. Sau này điền
            // nội dung luận Long vào ĐÚNG hàm này: hàm trả về chuỗi SVG và đã nhận sẵn tâm, hai
            // bán kính và cỡ chữ, nên không phải đụng tới bố cục các vòng khác. Nếu cần thêm dữ
            // liệu (hướng nhà, sơn đã chọn…) thì thêm tham số rồi truyền vào ở chỗ gọi trong
            // veLaBanTruongSinh(). Toàn bộ nội dung nên đặt trong <g data-vong="long-phap">.
            // ====================================================================
            function veVongLongPhapLuanLong(cx, cy, rTrong, rNgoai, coChu, doLechNhan, bangLongPhap) {
                // 12 ô, mỗi ô GỘP ĐÚNG 2 CUNG LIỀN KỀ trên VÒNG NHÂN BÀN THẬT (vòng 24 Sơn TRONG CÙNG
                // trong 3 vòng, r 340→400 ngoài Long Pháp) — KHÔNG phải theo Địa bàn. Nhân bàn lệch
                // −7,5° so với Địa bàn (DO_LECH_NHAN_THIEN), nên cung "Nhâm" thật nằm ở [330°,345°) và
                // cung "Tý" thật nằm ở [345°,360°) — gộp 2 cung liền kề Nhâm+Tý = [330°,360°), TÂM Ở
                // 345° (LỆCH 15° so với tâm ô "Tý" bên vòng 12 Địa Chi, KHÔNG thẳng hàng với nó — đã
                // xác nhận trực tiếp với người dùng, xem lịch sử trao đổi ngày tạo file này).
                // Cặp đủ 12: Nhâm+Tý, Quý+Sửu, Cấn+Dần, Giáp+Mão, Ất+Thìn, Tốn+Tị, Bính+Ngọ, Đinh+Mùi,
                // Khôn+Thân, Canh+Dậu, Tân+Tuất, Càn+Hợi — DS24_SON (shared.js) đúng theo thứ tự này
                // (Tý=0°, Quý=15°, Sửu=30°…) nên cặp là [i, i+1] với i lẻ, và Nhâm (i=23) nối vòng về
                // Tý (i=0).
                // bangLongPhap (từ buildVongLongPhap(), null nếu chưa chọn Nước Đi): mảng 12 phần tử
                // {gd, diaChi} — mỗi ô tra theo diaChi = Chi thành phần (s2) để lấy tên giai đoạn hiển
                // thị kèm 2 sơn, và tô nền đỏ nhạt cho ô "Mộ" (mốc suy vòng, xem buildVongLongPhap()).
                let h = `<g data-vong="long-phap">`;
                for (let i = 1; i <= 23; i += 2) {
                    let s1 = DS24_SON[i], s2 = DS24_SON[(i + 1) % 24];
                    // Biên thật trên Nhân bàn: đầu cung s1 (s1.goc − 7,5 − 7,5) → cuối cung s2 (s2.goc − 7,5 + 7,5).
                    // Cặp cuối (Nhâm+Tý) vòng qua mốc 360°/0°: s2 = Tý có goc = 0, phải cộng bù 360 để
                    // bienCuoi > bienDau, nếu không trung điểm (gocTam) sẽ tính sai lệch nửa vòng.
                    let goc2Bu = (i + 1 >= 24) ? s2.goc + 360 : s2.goc;
                    let bienDau = s1.goc - doLechNhan - 7.5, bienCuoi = goc2Bu - doLechNhan + 7.5;
                    let gocTam = (bienDau + bienCuoi) / 2; // = s2.goc − 15 (lệch 15° so với tâm ô Địa Chi s2.goc)
                    let rs = (bienDau - 90) * Math.PI / 180, re = (bienCuoi - 90) * Math.PI / 180;
                    let xsO = cx + rNgoai * Math.cos(rs), ysO = cy + rNgoai * Math.sin(rs);
                    let xeO = cx + rNgoai * Math.cos(re), yeO = cy + rNgoai * Math.sin(re);
                    let xsI = cx + rTrong * Math.cos(re), ysI = cy + rTrong * Math.sin(re);
                    let xeI = cx + rTrong * Math.cos(rs), yeI = cy + rTrong * Math.sin(rs);
                    let g = bangLongPhap ? bangLongPhap.find(x => x.diaChi === s2.ten) : null;
                    let mauNen = g ? (g.gd === "Mộ" ? "#e8b4a8" : "#f1e9d8") : "#f1e9d8";
                    h += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rNgoai},${rNgoai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rTrong},${rTrong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="0.95" stroke="#b9ad98" stroke-width="0.8"/>`;
                    let rChu = (rTrong + rNgoai) / 2, radT = (gocTam - 90) * Math.PI / 180;
                    let xT = cx + rChu * Math.cos(radT), yT = cy + rChu * Math.sin(radT);
                    let nhanChu = g ? (g.gd + " · " + s1.ten + "·" + s2.ten) : (s1.ten + "·" + s2.ten);
                    let coChuThat = g ? coChu * 0.5 : coChu * 0.62;
                    h += `<g transform="rotate(${gocTam} ${xT.toFixed(1)} ${yT.toFixed(1)})"><text x="${xT.toFixed(1)}" y="${yT.toFixed(1)}" font-size="${coChuThat.toFixed(1)}" font-weight="700" fill="#7a5a1e" text-anchor="middle" dominant-baseline="middle">${nhanChu}</text></g>`;
                }
                h += `</g>`;
                return h;
            }

            function veLaBanTruongSinh() {
                let svg = damBaoSvgTruongSinhTonTai(); if (!svg) return;
                svg.innerHTML = "";
                // Vòng Long Pháp build LẠI mỗi lần vẽ để luôn khớp Nước Đi/chiều hiện tại — rẻ (12
                // phần tử) nên không cần tối ưu chỉ-build-khi-đổi như vongTruongSinh.
                if (typeof buildVongLongPhap === "function") buildVongLongPhap();
                const cx = 650, cy = 650;
                // ====================================================================
                // BẢN ĐỒ CÁC VÒNG — LA BÀN THỦY PHÁP (svg#compassSvgTruongSinh)
                // viewBox 1300x1300, tâm (650,650); bán kính tính theo đơn vị SVG.
                // Liệt kê TỪ TRONG RA NGOÀI:
                //
                // QUY ƯỚC CHUNG: góc 0° = Bắc (đỉnh la bàn), tăng theo chiều KIM ĐỒNG HỒ. Mọi mốc (Nước
                //   Đến/Đi, Tọa, Hướng, Mộ, Lai Long) luôn được tính và tô đậm theo ĐỊA BÀN. Nhân bàn,
                //   Thiên bàn và Long Pháp KHÔNG tham gia tính Trường Sinh/Cục.
                //
                // LƯU Ý ĐỒNG BỘ: tên các vòng cũng được liệt kê cho người dùng trong khối chú giải
                // #tpChuThichCacVong ở cuối tab Thủy Pháp (index.html). Đổi/thêm/bớt vòng thì sửa cả 2 nơi.
                //
                // (1) TÂM (chỉ là chữ, không phải vòng): tên Cục/Hành; "Đến: …/Đi: …" (chế độ Thủy Khẩu),
                //     "Tọa: …" (chế độ Tọa nhà). Chưa chọn Nước Đi thì hiện lời nhắc chọn.
                // (2) DẢI BÁT TRẠCH — tối đa 2 dải, mỗi dải dày CỐ ĐỊNH 40 (DAY_DAI_BAT_TRACH_TS), xếp từ
                //     rInner=200 đi vào tâm: Trạch (ngoài) rồi Mệnh (trong). Dải nào tắt
                //     (hienThiBatTrachTrachTrongTruongSinh / hienThiBatTrachMenhTrongTruongSinh) thì bỏ qua,
                //     dải còn lại dịch sát rInner (KHÔNG giãn dày ra). 8 phương vị × 45°, tô theo Du Niên.
                // (3) NHÂN BÀN    r 200→260 (rInner→rNhanNgoai): 24 sơn, góc = Địa bàn − 7.5°.
                // (4) VÒNG LONG PHÁP – LUẬN LONG   r 260→320 (rNhanNgoai→rLongPhapNgoai): CHỖ GIỮ CHỖ,
                //     hiện chỉ có khung + tên 12 ô (2 sơn Nhân bàn/ô). Nội dung sau này viết trong hàm
                //     veVongLongPhapLuanLong().
                // (5) THIÊN BÀN   r 320→380 (rLongPhapNgoai→rThienNgoai): 24 sơn, góc = Địa bàn + 7.5°.
                // (6) 12 ĐỊA CHI (Trường Sinh)   r 380→460 (rThienNgoai→rMid): 12 cung × 30°, tâm cung
                //     tại CHÍNH góc, không lệch (Tý=0°, Sửu=30°…), thẳng hàng với Địa bàn (xem
                //     GOC_DIA_CHI_12 đầu file). Chữ ngoài (rTextGD) = giai đoạn Trường Sinh; chữ
                //     trong (rTextChi) = Địa Chi. Nền: xanh = cát, đỏ = hung (mauTheoDiem12), xám =
                //     chưa có Cục. Viền xanh dương = cung Nước Đến, viền cam = cung Nước Đi.
                // (7) ĐỊA BÀN     r 460→520 (rMid→rOuter): 24 sơn gốc (DS24_SON trong shared.js), mỗi
                //     sơn 15°, tâm tại s.goc (Tý=0°, Quý=15°…). Nền theo nhóm Chi/Can/Quái (NHOM_24_SON).
                //     Tô đậm viền: Hướng nhà = đỏ, Nước Đến = xanh dương, Nước Đi = cam, Tọa/Mộ = tím.
                // (8) NGŨ HÀNH LONG r 520→550 (rOuter→rLongOuter): 1 ô/sơn Địa bàn, màu theo
                //     NGU_HANH_LONG[tên sơn]; tô đậm Lai Long (laiLongRaw).
                // (9) CHIA ĐỘ: vạch mỗi 10° tại r=550, số độ tại r=590; KIM CHỈ HƯỚNG NHÀ tại r=595, nhãn
                //     "▲ HƯỚNG NHÀ" tại r≈630. Mép viewBox là r=650, nên muốn thêm vòng ngoài phải nới viewBox
                //     trong damBaoSvgTruongSinhTonTai() và đổi cx, cy tương ứng.
                // ====================================================================
                // Thứ tự TỪ TRONG RA (đã xác nhận với người dùng): Bát Trạch → NHÂN BÀN → LONG PHÁP →
                // THIÊN BÀN → 12 ĐỊA CHI → ĐỊA BÀN → Ngũ Hành Long. rInner vẫn là mốc chung "cạnh ngoài
                // dải Bát Trạch" — mọi vòng phía trên đều tính tiếp từ đây, chỉ đổi THỨ TỰ CỘNG DỒN.
                const rInner = 200;
                const rNhanNgoai = 260;           // cạnh ngoài Nhân bàn = cạnh trong Long Pháp
                const rLongPhapNgoai = 320;        // cạnh ngoài Long Pháp = cạnh trong Thiên bàn
                const rThienNgoai = 380;           // cạnh ngoài Thiên bàn = cạnh trong 12 Địa Chi
                const rMid = 460;                  // cạnh ngoài 12 Địa Chi = cạnh trong Địa bàn (giữ tên rMid vì nhiều chỗ khác tham chiếu)
                const rOuter = 520, rLongOuter = 550;
                const rTextGD = 442, rTextChi = 400, rText24Son = 490, rTextLong = 535, rTamTrong = 35;
                const rTextNhan = 230, rTextThien = 350;
                const DO_LECH_NHAN_THIEN = 7.5; // Nhân bàn = Địa − 7.5°, Thiên bàn = Địa + 7.5°
                const rDoTick = rLongOuter, rDoText = rLongOuter + 40, rDoSo = rLongOuter + 20;
                // ---- 2 dải Bát Trạch TÍCH HỢP (Trạch đất / Mệnh gia chủ) — chèn NGAY BÊN TRONG vòng
                // Long Pháp (bắt đầu từ rInner=200 đi vào tâm), mỗi dải dày cố định 40, bật/tắt độc lập từng
                // dải (hienThiBatTrachTrachTrongTruongSinh / hienThiBatTrachMenhTrongTruongSinh). Dải nào tắt
                // thì bỏ qua và dải còn lại dịch ra sát rInner — không giãn dày ra, nên khi cả 2 dải tắt hoặc
                // chỉ bật 1 dải, phần giữa la bàn để trống.
                const DAY_DAI_BAT_TRACH_TS = 40;

                let houseFacing = parseFloat(document.getElementById("houseFacing")?.value) || 0;
                // Nước Đến/Đi cho la bàn Trường Sinh giờ dùng CHUNG dropdown 24 sơn
                // #selSonDen/#selSonDi với các la bàn khác. sonDenRaw/sonDiRaw giữ nguyên tên
                // 24 sơn gốc (Giáp, Mão, Nhâm, Tý...) — dùng để tô sáng ĐÚNG SƠN người dùng
                // chọn ở vòng 24 Sơn bên ngoài. diaChiDen/diaChiDi là bản ĐÃ QUY ĐỔI sang 12
                // Địa Chi qua quyDoiSonSangDiaChi() — chỉ dùng để tra vòng Trường Sinh 12 cung
                // (traTamHop) bên trong, KHÔNG được dùng để so sánh tô sáng vòng 24 Sơn (bug đã
                // gặp: chọn Can/Quái như Giáp/Nhâm lại tô sáng nhầm sang Mão/Tý vì so sánh
                // diaChiDen/diaChiDi — đã quy đổi — với s.ten của từng sơn trong 24 sơn).
                let sonDenRaw = document.getElementById("selSonDen")?.value || null;
                let sonDiRaw = document.getElementById("selSonDi")?.value || null;
                let diaChiDen = quyDoiSonSangDiaChi(sonDenRaw);
                let diaChiDi = quyDoiSonSangDiaChi(sonDiRaw);

                // Cục/Hành xác định theo chế độ đang chọn:
                // - "thuykhau" (mặc định): Cục theo NƯỚC ĐI — chưa chọn Nước Đi thì chưa có Cục.
                //   vongTruongSinh[cuc] giờ khởi TRỰC TIẾP từ Mộ (xem buildVongTruongSinh(), bảng
                //   moTheoCuc) — không còn tra qua diaChiToCuc rồi tính điểm khởi Trường Sinh nữa,
                //   nên không cần chế độ "mo" nhập tay riêng như trước: chọn đúng Nước Đi là đủ.
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
                // Vòng viền mỏng đánh dấu ranh giới trong/ngoài/24-sơn/Ngũ-Hành-Long (chỉ viền,
                // không tô nền) để vòng tròn vẫn rõ hình dù độ mờ = 0%.
                html += `<circle cx="${cx}" cy="${cy}" r="${rLongOuter}" fill="none" stroke="#3a2a1a" stroke-width="1" opacity="0.6"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="#3a2a1a" stroke-width="1.5" opacity="0.8"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="${rThienNgoai}" fill="none" stroke="#3a2a1a" stroke-width="1.2" opacity="0.7"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="${rNhanNgoai}" fill="none" stroke="#3a2a1a" stroke-width="1.2" opacity="0.7"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="${rMid}" fill="none" stroke="#3a2a1a" stroke-width="1.2" opacity="0.7"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="${rLongPhapNgoai}" fill="none" stroke="#5c4a3a" stroke-width="1.2" opacity="0.7"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="#5c4a3a" stroke-width="1" opacity="0.7"/>`;

                // ---- VÒNG 24 SƠN (giữa vòng 12 Địa Chi và vòng Ngũ Hành Long) — chỉ để đối
                // chiếu trực quan, không tham gia tính toán Trường Sinh (vẫn tính theo 12 Địa
                // Chi thuần như trước). Tô màu xen kẽ theo nhóm Địa Chi/Can/Quái cho dễ phân biệt
                // ranh giới từng sơn, và tô đậm 2 sơn gần nhất với Nước Đến/Đi (chế độ Thủy Khẩu)
                // hoặc Tọa/Hướng nhà (chế độ Tọa) để đối chiếu nhanh.
                let sonHuongHienTai = timSonTheoGocCucBo((houseFacing % 360 + 360) % 360);

                // ---- NHÂN BÀN & THIÊN BÀN: 2 vòng 24 Sơn phụ, CHỈ để đối chiếu trực quan — dùng lại
                // đúng danh sách/tên/màu nhóm của Địa bàn, chỉ dịch góc (Nhân −7.5°, Thiên +7.5°).
                // Không tham gia tính Trường Sinh/Cục. Không tô đậm Đến/Đi/Mộ/Tọa (những mốc đó
                // luôn tính theo Địa bàn, vòng chuẩn ở ngoài cùng).
                function veVong24SonPhu(rTrong, rNgoai, rChu, doLech) {
                    DS24_SON.forEach(function(s) {
                        let gocTam = s.goc + doLech;
                        let rs = (gocTam - 7.5 - 90) * Math.PI / 180, re = (gocTam + 7.5 - 90) * Math.PI / 180;
                        let xsO = cx + rNgoai * Math.cos(rs), ysO = cy + rNgoai * Math.sin(rs);
                        let xeO = cx + rNgoai * Math.cos(re), yeO = cy + rNgoai * Math.sin(re);
                        let xsI = cx + rTrong * Math.cos(re), ysI = cy + rTrong * Math.sin(re);
                        let xeI = cx + rTrong * Math.cos(rs), yeI = cy + rTrong * Math.sin(rs);
                        let nhom = NHOM_24_SON ? NHOM_24_SON[s.ten] : null;
                        let mauNen = nhom === "chi" ? "#e8dcc8" : (nhom === "can" ? "#d8e8dc" : "#dce4f0");
                        html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rNgoai},${rNgoai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rTrong},${rTrong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${Math.max(doMoNenLaBan,0.35)}" stroke="#3a2a1a" stroke-width="0.8"/>`;
                        let radT = (gocTam - 90) * Math.PI / 180;
                        let xT = cx + rChu * Math.cos(radT), yT = cy + rChu * Math.sin(radT);
                        html += `<g transform="rotate(${gocTam} ${xT.toFixed(1)} ${yT.toFixed(1)})"><text x="${xT.toFixed(1)}" y="${yT.toFixed(1)}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="700" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${s.ten}</text></g>`;
                    });
                }
                veVong24SonPhu(rMid, rNhanNgoai, rTextNhan, -DO_LECH_NHAN_THIEN); // Nhân bàn
                veVong24SonPhu(rNhanNgoai, rThienNgoai, rTextThien, +DO_LECH_NHAN_THIEN); // Thiên bàn

                DS24_SON.forEach(function(s) {
                    let gocStart = s.goc - 7.5, gocEnd = s.goc + 7.5;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rOuter * Math.cos(rs), ysO = cy + rOuter * Math.sin(rs);
                    let xeO = cx + rOuter * Math.cos(re), yeO = cy + rOuter * Math.sin(re);
                    let xsI = cx + rThienNgoai * Math.cos(re), ysI = cy + rThienNgoai * Math.sin(re);
                    let xeI = cx + rThienNgoai * Math.cos(rs), yeI = cy + rThienNgoai * Math.sin(rs);
                    let nhom24 = NHOM_24_SON ? NHOM_24_SON[s.ten] : null;
                    let mauNen = nhom24 === "chi" ? "#e8dcc8" : (nhom24 === "can" ? "#d8e8dc" : "#dce4f0");
                    let laToa = khoiTruongSinhCheDo === "toa" && sonToa && sonToa.ten === s.ten;
                    let laHuong = sonHuongHienTai && sonHuongHienTai.ten === s.ten;
                    // Chế độ Thủy Khẩu: tô đậm ĐÚNG SƠN (24 sơn) mà người dùng đã chọn ở dropdown
                    // Nước Đến/Đi — dùng sonDenRaw/sonDiRaw (tên gốc, có thể là Can/Quái như
                    // Giáp/Nhâm/Càn), KHÔNG dùng diaChiDen/diaChiDi (đã quy đổi sang 1 trong 12
                    // Địa Chi, nên so sánh với diaChiDen sẽ tô sáng nhầm sơn Địa Chi tương ứng
                    // thay vì đúng sơn Can/Quái người dùng chọn — ví dụ chọn Giáp lại tô Mão).
                    let laDen24 = khoiTruongSinhCheDo === "thuykhau" && sonDenRaw && sonDenRaw === s.ten;
                    let laDi24 = khoiTruongSinhCheDo === "thuykhau" && sonDiRaw && sonDiRaw === s.ten;
                    let vien24 = laToa ? "#6a1b9a" : (laDen24 ? "#1565c0" : (laDi24 ? "#e65100" : (laHuong ? "#c62828" : "#3a2a1a")));
                    let dayVien24 = (laToa || laDen24 || laDi24 || laHuong) ? 4 : 0.8;
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rOuter},${rOuter} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rThienNgoai},${rThienNgoai} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${Math.max(doMoNenLaBan,0.35)}" stroke="${vien24}" stroke-width="${dayVien24}"/>`;
                    let x1b = cx + rThienNgoai * Math.cos(rs), y1b = cy + rThienNgoai * Math.sin(rs);
                    let x2b = cx + rOuter * Math.cos(rs), y2b = cy + rOuter * Math.sin(rs);
                    html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#3a2a1a" stroke-width="0.8"/>`;
                    let radT24 = (s.goc - 90) * Math.PI / 180;
                    let xS = cx + rText24Son * Math.cos(radT24), yS = cy + rText24Son * Math.sin(radT24);
                    html += `<g transform="rotate(${s.goc} ${xS.toFixed(1)} ${yS.toFixed(1)})"><text x="${xS.toFixed(1)}" y="${yS.toFixed(1)}" font-size="${(tpFontSize*1.15).toFixed(1)}" font-weight="700" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${s.ten}</text></g>`;
                });

                // ---- VÒNG NGŨ HÀNH CỦA LONG (dải mỏng, ngay NGOÀI vòng 24 Sơn) ----
                // Dùng bảng NGU_HANH_LONG khai báo ở top-level (đầu file, cạnh moTheoCuc)
                // để tổng kết "Lai Long là Kim/Mộc/Thủy/Hỏa Long" dựa vào sơn đã chọn ở dropdown
                // Lai Long phía trên la bàn — xacNhanThuyKhau() cũng dùng chung bảng này.
                const MAU_NGU_HANH_LONG = { "Mộc":"#a5d6a7", "Kim":"#ffe082", "Hỏa":"#ef9a9a", "Thủy":"#90caf9" };
                const VIEN_NGU_HANH_LONG = { "Mộc":"#2e7d32", "Kim":"#f9a825", "Hỏa":"#c62828", "Thủy":"#1565c0" };
                DS24_SON.forEach(function(s) {
                    let gocStart = s.goc - 7.5, gocEnd = s.goc + 7.5;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rLongOuter * Math.cos(rs), ysO = cy + rLongOuter * Math.sin(rs);
                    let xeO = cx + rLongOuter * Math.cos(re), yeO = cy + rLongOuter * Math.sin(re);
                    let xsI = cx + rOuter * Math.cos(re), ysI = cy + rOuter * Math.sin(re);
                    let xeI = cx + rOuter * Math.cos(rs), yeI = cy + rOuter * Math.sin(rs);
                    let hanhLong = NGU_HANH_LONG[s.ten];
                    let laLaiLong = laiLongRaw && laiLongRaw === s.ten;
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rLongOuter},${rLongOuter} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rOuter},${rOuter} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${MAU_NGU_HANH_LONG[hanhLong]}" fill-opacity="${laLaiLong ? 1 : Math.max(doMoNenLaBan, 0.35)}" stroke="${VIEN_NGU_HANH_LONG[hanhLong]}" stroke-width="${laLaiLong ? 2.5 : 0.5}"/>`;
                    let gocTamLong = s.goc, radTLong = (gocTamLong - 90) * Math.PI / 180;
                    let xL = cx + rTextLong * Math.cos(radTLong), yL = cy + rTextLong * Math.sin(radTLong);
                    let gocChuanLong = ((gocTamLong % 360) + 360) % 360;
                    let gocChuLong = (gocChuanLong > 90 && gocChuanLong < 270) ? gocTamLong + 180 : gocTamLong;
                    html += `<g transform="rotate(${gocChuLong} ${xL.toFixed(1)} ${yL.toFixed(1)})"><text x="${xL.toFixed(1)}" y="${yL.toFixed(1)}" font-size="${(tpFontSize*0.65).toFixed(1)}" font-weight="700" fill="${VIEN_NGU_HANH_LONG[hanhLong]}" text-anchor="middle" dominant-baseline="middle">${hanhLong}</text></g>`;
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
                    html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="600" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${deg} ${xt.toFixed(1)} ${yt.toFixed(1)})">${deg}</text>`;
                }

                // 12 cung THUẦN Địa Chi, mỗi cung đúng 30°, tâm cung tại đúng bội số của 30°
                // (Tý=0°, Sửu=30°, Dần=60°...) — không lệch, không gán kèm sơn Thiên Can/Quái nào.
                // Biên ngoài của vòng này là rMid (giáp Địa bàn), biên trong là rThienNgoai (giáp
                // Thiên bàn).
                GOC_DIA_CHI_12.forEach(function(dc) {
                    let gocTam = dc.goc;
                    let g = bang12 ? bang12.find(x => x.diaChi === dc.ten) : null;
                    let gocStart = gocTam - 15, gocEnd = gocTam + 15;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rMid * Math.cos(rs), ysO = cy + rMid * Math.sin(rs);
                    let xeO = cx + rMid * Math.cos(re), yeO = cy + rMid * Math.sin(re);
                    let xsI = cx + rThienNgoai * Math.cos(re), ysI = cy + rThienNgoai * Math.sin(re);
                    let xeI = cx + rThienNgoai * Math.cos(rs), yeI = cy + rThienNgoai * Math.sin(rs);
                    // Chưa xác định Cục (chưa chọn Nước Đi) → tô xám trung tính, không cát/hung.
                    let mauNen = g ? mauTheoDiem12(g.den) : "#cfcfcf";
                    let laCungDen = gdDen && gdDen.diaChi === dc.ten;
                    let laCungDi = gdDi && gdDi.diaChi === dc.ten;
                    let vien = laCungDen ? "#1565c0" : (laCungDi ? "#e65100" : "#3a2a1a");
                    let dayVien = (laCungDen || laCungDi) ? 5 : 1;
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rMid},${rMid} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rThienNgoai},${rThienNgoai} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${doMoNenLaBan}" stroke="${vien}" stroke-width="${dayVien}"/>`;

                    // Vạch ranh giới cung
                    let x1b = cx + rThienNgoai * Math.cos(rs), y1b = cy + rThienNgoai * Math.sin(rs);
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

                

                // ---- VÒNG LONG PHÁP – LUẬN LONG (chỗ giữ chỗ, xem veVongLongPhapLuanLong) ----
                html += veVongLongPhapLuanLong(cx, cy, rNhanNgoai, rLongPhapNgoai, tpFontSize, DO_LECH_NHAN_THIEN, vongLongPhap);

                // ---- 2 DẢI BÁT TRẠCH TÍCH HỢP (Trạch đất / Mệnh gia chủ) — ngay bên trong
                // vòng 12 Địa Chi (từ rInner=200 trở vào), mỗi dải tra Du Niên theo PHƯƠNG VỊ
                // tuyệt đối (8 hướng), dùng lại đúng bảng duNienBatTrach + hàm timQuaiTrachTheoGoc/
                // mauTheoDuNien đã có ở la bàn Bát Trạch 8 cung (kiểu la bàn thứ 4) — KHÔNG
                // tính lại bằng công thức riêng, tránh trùng lặp/lệch kết quả giữa 2 nơi.
                // Có thể bật/tắt ĐỘC LẬP từng dải qua hienThiBatTrachTrachTrongTruongSinh/
                // hienThiBatTrachMenhTrongTruongSinh; dải nào tắt thì bỏ qua hoàn toàn, dải
                // còn lại (nếu bật) sẽ chiếm luôn phần bán kính vừa nhường ra (tính động qua
                // biến raNgoaiVaoTrong trong vòng lặp cacDai bên dưới) để không có khoảng trống rỗng.
                if (hienThiBatTrachTrachTrongTruongSinh || hienThiBatTrachMenhTrongTruongSinh) {
                    let quaiTrachNhaTS = timQuaiTrachTheoGoc(houseFacing);
                    let bangDuNienTrachTS = duNienBatTrach[quaiTrachNhaTS.ten];
                    let menhGiaChuTS = null, bangDuNienMenhTS = null;
                    if (hienThiBatTrachMenhTrongTruongSinh) {
                        let namSinhTS = parseInt(document.getElementById("namSinhGiaChu")?.value) || 1990;
                        let gioiTinhRawTS = document.getElementById("gioiTinhGiaChu")?.value;
                        let gioiTinhChuTS = (gioiTinhRawTS === "Nữ" || gioiTinhRawTS === "nu") ? "nu" : "nam";
                        menhGiaChuTS = window.tinhMenhQuai ? window.tinhMenhQuai(namSinhTS, gioiTinhChuTS) : null;
                        bangDuNienMenhTS = menhGiaChuTS ? duNienBatTrach[menhGiaChuTS.cung] : null;
                    }
                    function duNienTaiPhuongTheoBangTS(bang, tenPhuong) {
                        if (!bang) return null;
                        for (let ten in bang.huong) { if (bang.huong[ten] === tenPhuong) return ten; }
                        return null;
                    }
                    // Xếp thứ tự các dải TỪ NGOÀI VÀO TRONG: Trạch trước (nếu bật), rồi Mệnh
                    // (nếu bật) — giữ nhất quán với thứ tự "Trạch → Mệnh" đã dùng ở la bàn Bát
                    // Trạch 8 cung (vòng ngoài = Trạch, vòng trong = Mệnh khi So Mệnh).
                    let raNgoaiVaoTrong = rInner;
                    let cacDai = [];
                    if (hienThiBatTrachTrachTrongTruongSinh) cacDai.push({ bang: bangDuNienTrachTS, nhan: "Trạch", mauChu: "#7a1010" });
                    if (hienThiBatTrachMenhTrongTruongSinh) cacDai.push({ bang: bangDuNienMenhTS, nhan: "Mệnh", mauChu: "#4a148c" });
                    cacDai.forEach(function(dai) {
                        let rNgoaiDai = raNgoaiVaoTrong, rTrongDai = raNgoaiVaoTrong - DAY_DAI_BAT_TRACH_TS;
                        let rTextDai = (rNgoaiDai + rTrongDai) / 2;
                        PHUONG_VI_8.forEach(function(pv) {
                            let gocTamPv = pv.goc;
                            let tenDuNienPv = duNienTaiPhuongTheoBangTS(dai.bang, pv.ten);
                            let gocStartPv = gocTamPv - 22.5, gocEndPv = gocTamPv + 22.5;
                            let rsPv = (gocStartPv - 90) * Math.PI / 180, rePv = (gocEndPv - 90) * Math.PI / 180;
                            let xsOPv = cx + rNgoaiDai * Math.cos(rsPv), ysOPv = cy + rNgoaiDai * Math.sin(rsPv);
                            let xeOPv = cx + rNgoaiDai * Math.cos(rePv), yeOPv = cy + rNgoaiDai * Math.sin(rePv);
                            let xsIPv = cx + rTrongDai * Math.cos(rePv), ysIPv = cy + rTrongDai * Math.sin(rePv);
                            let xeIPv = cx + rTrongDai * Math.cos(rsPv), yeIPv = cy + rTrongDai * Math.sin(rsPv);
                            let mauNenPv = tenDuNienPv ? mauTheoDuNien(tenDuNienPv) : "#cfcfcf";
                            html += `<path d="M${xsOPv.toFixed(1)},${ysOPv.toFixed(1)} A${rNgoaiDai},${rNgoaiDai} 0 0,1 ${xeOPv.toFixed(1)},${yeOPv.toFixed(1)} L${xsIPv.toFixed(1)},${ysIPv.toFixed(1)} A${rTrongDai},${rTrongDai} 0 0,0 ${xeIPv.toFixed(1)},${yeIPv.toFixed(1)} Z" fill="${mauNenPv}" fill-opacity="${doMoNenLaBan}" stroke="#3a2a1a" stroke-width="1"/>`;
                            let x1bPv = cx + rTrongDai * Math.cos(rsPv), y1bPv = cy + rTrongDai * Math.sin(rsPv);
                            let x2bPv = cx + rNgoaiDai * Math.cos(rsPv), y2bPv = cy + rNgoaiDai * Math.sin(rsPv);
                            html += `<line x1="${x1bPv.toFixed(1)}" y1="${y1bPv.toFixed(1)}" x2="${x2bPv.toFixed(1)}" y2="${y2bPv.toFixed(1)}" stroke="#3a2a1a" stroke-width="0.8"/>`;
                            if (tenDuNienPv) {
                                let radTPv = (gocTamPv - 90) * Math.PI / 180;
                                let xDNPv = cx + rTextDai * Math.cos(radTPv), yDNPv = cy + rTextDai * Math.sin(radTPv);
                                html += `<g transform="rotate(${gocTamPv} ${xDNPv.toFixed(1)} ${yDNPv.toFixed(1)})"><text x="${xDNPv.toFixed(1)}" y="${yDNPv.toFixed(1)}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="800" fill="${dai.mauChu}" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${tenDuNienPv}</text></g>`;
                            }
                        });
                        raNgoaiVaoTrong = rTrongDai;
                    });
                    // Nhãn ngắn "Trạch"/"Mệnh" đặt tại đúng hướng Bắc (0°, phía trên la bàn) của
                    // mỗi dải, để phân biệt dải nào là dải nào khi cả 2 cùng hiển thị.
                    let rRaNgoai2 = rInner;
                    cacDai.forEach(function(dai) {
                        let rTrongDai2 = rRaNgoai2 - DAY_DAI_BAT_TRACH_TS;
                        let rTextNhan = (rRaNgoai2 + rTrongDai2) / 2;
                        let xNhan = cx, yNhan = cy - rTextNhan;
                        html += `<text x="${xNhan.toFixed(1)}" y="${yNhan.toFixed(1)}" font-size="${(tpFontSize*0.6).toFixed(1)}" font-weight="700" fill="${dai.mauChu}" opacity="0.6" text-anchor="middle" dominant-baseline="middle">(${dai.nhan})</text>`;
                        rRaNgoai2 = rTrongDai2;
                    });
                }

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
                    if (diaChiDen) html += `<text x="${cx}" y="${cy+25}" font-size="${tpFontSize}" font-weight="700" fill="#1565c0" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Đến: ${diaChiDen}${gdDen?" — "+gdDen.gd:""}</text>`;
                    html += `<text x="${cx}" y="${cy+49}" font-size="${tpFontSize}" font-weight="700" fill="#e65100" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Đi: ${diaChiDi}${gdDi?" — "+gdDi.gd:""}</text>`;
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
                const rOuter = 400, rInner = 280, rTextDuNien = 375, rTextPhuong = 340;
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
                    html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="600" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${deg} ${xt.toFixed(1)} ${yt.toFixed(1)})">${deg}</text>`;
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
                            html += `<g transform="rotate(${gocTam} ${xM.toFixed(1)} ${yM.toFixed(1)})"><text x="${xM.toFixed(1)}" y="${yM.toFixed(1)}" font-size="${(tpFontSize*1.1).toFixed(1)}" font-weight="800" fill="#4a148c" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${tenDuNienMenh}</text></g>`;
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
                    html += `<text x="${cx}" y="${cy-32}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="900" fill="#2e7d32" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Trạch (Ngoài): ${quaiTrachNha.ten}</text>`;
                    if (menhGiaChu) {
                        html += `<text x="${cx}" y="${cy-14}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="900" fill="#4a148c" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Nhân (trong): ${menhGiaChu.cung}</text>`;
                        let phamViTrach = nhomTrach.split(" ")[0], phamViMenh = menhGiaChu.nhom.split(" ")[0];
                        let hopNhau = phamViTrach === phamViMenh;
                        html += `<text x="${cx}" y="${cy+25}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="700" fill="${hopNhau?'#1565c0':'#c62828'}" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle">${hopNhau?'✅ Cùng '+phamViTrach+' Tứ':'⚠️ Lệch Đông/Tây'}</text>`;
                    } else {
                        html += `<text x="${cx}" y="${cy-10}" font-size="${(tpFontSize*0.7).toFixed(1)}" font-weight="700" fill="#c62828" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle">Chưa rõ năm sinh</text>`;
                    }
                   // if (sonDen) { let dnDen = phuongDen ? duNienTaiPhuong(phuongDen) : null; html += `<text x="${cx}" y="${cy+22}" font-size="${(tpFontSize*0.75).toFixed(1)}" font-weight="700" fill="#1565c0" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle">Đến: ${sonDen}${dnDen?" ("+dnDen+")":""}</text>`; }
                    //if (sonDi) { let dnDi = phuongDi ? duNienTaiPhuong(phuongDi) : null; html += `<text x="${cx}" y="${cy+38}" font-size="${(tpFontSize*0.75).toFixed(1)}" font-weight="700" fill="#e65100" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle">Đi: ${sonDi}${dnDi?" ("+dnDi+")":""}</text>`; }
                }

                svg.innerHTML = html;
            }
            window.veLaBanBatTrach = veLaBanBatTrach;

            // ====================================================================
            // LA BÀN KHAM DƯ — kiểu la bàn thứ 5 (cuối cùng) cho tab Thủy Pháp.
            // La bàn tổng hợp nhiều vòng đồng tâm kiểu Dương Công / Tam Hợp phái cổ điển,
            // dùng để đối chiếu Tọa/Hướng qua nhiều hệ quy chiếu cùng lúc (24 Sơn, 72 Long,
            // Tam Nguyên Long, Bát Quái, Tam Bàn Quái, Thiên Bàn Song Sơn) — KHÔNG dùng để
            // tính điểm cát/hung như Bát Trạch/Trường Sinh, chỉ để TRA CỨU/ĐỐI CHIẾU trực quan.
            // Vẽ RIÊNG, không dùng chung engine với veCompassChung()/CompassModule, theo
            // đúng pattern của veLaBanTruongSinh()/veLaBanBatTrach() ở trên.
            // ====================================================================
            function damBaoSvgKhamDuTonTai() {
                let svg = document.getElementById("compassSvgKhamDu");
                if (svg) return svg;
                let overlay = document.getElementById("compassOverlay");
                if (!overlay) return null;
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("id", "compassSvgKhamDu");
                svg.setAttribute("viewBox", "0 0 1000 1000");
                svg.style.position = "absolute"; svg.style.top = "0"; svg.style.left = "0";
                svg.style.width = "100%"; svg.style.height = "100%";
                svg.style.display = "none";
                overlay.appendChild(svg);
                return svg;
            }

            // ---- BẢNG 72 LONG (60 Long Lục Thập Giáp Tý + 12 ô Không Vong = null) ----
            // Nguồn: bảng tra La Kinh do Ka cung cấp (đã đối chiếu khớp 100% với danh sách 12 ô
            // Không Vong công bố kèm bảng gốc: 2,8,14,20,26,32,38,44,50,56,62,68).
            // Mảng theo đúng thứ tự 72 ô liên tục quanh vòng tròn, bắt đầu từ ô đầu tiên (ô 1,
            // góc 337.5°-342.5°, đầu sơn Nhâm) đi theo chiều kim đồng hồ. index 0 = ô số 1.
            // Đã xác minh: ô 1-3 = 3 ô của sơn Nhâm (Quý Hợi / Không Vong-Chính Nhâm / Giáp Tý);
            // ô 4-6 = 3 ô của sơn Tý (Bính Tý, Mậu Tý, Canh Tý, không có Không Vong vì Tý là Địa Chi).
            const BANG_72_LONG = [
                "Quý Hợi", null, "Giáp Tý", "Bính Tý", "Mậu Tý", "Canh Tý",
                "Nhâm Tý", null, "Ất Sửu", "Đinh Sửu", "Kỷ Sửu", "Tân Sửu",
                "Quý Sửu", null, "Bính Dần", "Mậu Dần", "Canh Dần", "Nhâm Dần",
                "Giáp Dần", null, "Đinh Mão", "Kỷ Mão", "Tân Mão", "Quý Mão",
                "Ất Mão", null, "Mậu Thìn", "Canh Thìn", "Nhâm Thìn", "Giáp Thìn",
                "Bính Thìn", null, "Kỷ Tị", "Tân Tị", "Quý Tị", "Ất Tị",
                "Đinh Tị", null, "Canh Ngọ", "Nhâm Ngọ", "Giáp Ngọ", "Bính Ngọ",
                "Mậu Ngọ", null, "Tân Mùi", "Quý Mùi", "Ất Mùi", "Đinh Mùi",
                "Kỷ Mùi", null, "Nhâm Thân", "Giáp Thân", "Bính Thân", "Mậu Thân",
                "Canh Thân", null, "Quý Dậu", "Ất Dậu", "Đinh Dậu", "Kỷ Dậu",
                "Tân Dậu", null, "Giáp Tuất", "Bính Tuất", "Mậu Tuất", "Canh Tuất",
                "Nhâm Tuất", null, "Ất Hợi", "Đinh Hợi", "Kỷ Hợi", "Tân Hợi"
            ];
            // Nạp Âm Ngũ Hành cho 60 Hoa Giáp — dùng để tô màu vòng 72 Long theo Ngũ Hành.
            // Bảng chuẩn (Kim/Mộc/Thủy/Hỏa/Thổ), mỗi cặp Can Chi liền kề chia sẻ 1 Nạp Âm.
            const NAPAM_60 = {
                "Giáp Tý":"Kim","Ất Sửu":"Kim","Bính Dần":"Hỏa","Đinh Mão":"Hỏa","Mậu Thìn":"Mộc","Kỷ Tị":"Mộc",
                "Canh Ngọ":"Thổ","Tân Mùi":"Thổ","Nhâm Thân":"Kim","Quý Dậu":"Kim","Giáp Tuất":"Hỏa","Ất Hợi":"Hỏa",
                "Bính Tý":"Thủy","Đinh Sửu":"Thủy","Mậu Dần":"Thổ","Kỷ Mão":"Thổ","Canh Thìn":"Kim","Tân Tị":"Kim",
                "Nhâm Ngọ":"Mộc","Quý Mùi":"Mộc","Giáp Thân":"Thủy","Ất Dậu":"Thủy","Bính Tuất":"Thổ","Đinh Hợi":"Thổ",
                "Mậu Tý":"Hỏa","Kỷ Sửu":"Hỏa","Canh Dần":"Mộc","Tân Mão":"Mộc","Nhâm Thìn":"Thủy","Quý Tị":"Thủy",
                "Giáp Ngọ":"Kim","Ất Mùi":"Kim","Bính Thân":"Hỏa","Đinh Dậu":"Hỏa","Mậu Tuất":"Mộc","Kỷ Hợi":"Mộc",
                "Canh Tý":"Thổ","Tân Sửu":"Thổ","Nhâm Dần":"Kim","Quý Mão":"Kim","Giáp Thìn":"Hỏa","Ất Tị":"Hỏa",
                "Bính Ngọ":"Thủy","Đinh Mùi":"Thủy","Mậu Thân":"Thổ","Kỷ Dậu":"Thổ","Canh Tuất":"Kim","Tân Hợi":"Kim",
                "Nhâm Tý":"Mộc","Quý Sửu":"Mộc","Giáp Dần":"Thủy","Ất Mão":"Thủy","Bính Thìn":"Thổ","Đinh Tị":"Thổ",
                "Mậu Ngọ":"Hỏa","Kỷ Mùi":"Hỏa","Canh Thân":"Mộc","Tân Dậu":"Mộc","Nhâm Tuất":"Thủy","Quý Hợi":"Thủy"
            };
            const MAU_NGU_HANH = { "Kim":"#d4b106", "Mộc":"#2e7d32", "Thủy":"#1565c0", "Hỏa":"#c62828", "Thổ":"#8d6e34" };

            // ---- BẢNG TAM BÀN QUÁI (Giang Đông / Giang Tây / Nam Bắc) — theo đúng tài liệu
            // thế_quẻ.md / tài liệu Kham Dư đã cung cấp, dữ liệu chắc chắn không suy đoán.
            const TAM_BAN_QUAI = {
                "Sửu":"Giang Đông","Cấn":"Giang Đông","Dần":"Giang Đông","Giáp":"Giang Đông",
                "Mão":"Giang Đông","Ất":"Giang Đông","Thìn":"Giang Đông","Tốn":"Giang Đông",
                "Mùi":"Giang Tây","Khôn":"Giang Tây","Thân":"Giang Tây","Canh":"Giang Tây",
                "Dậu":"Giang Tây","Tân":"Giang Tây","Tuất":"Giang Tây","Càn":"Giang Tây",
                "Hợi":"Nam Bắc","Nhâm":"Nam Bắc","Tý":"Nam Bắc","Quý":"Nam Bắc",
                "Tị":"Nam Bắc","Tỵ":"Nam Bắc","Bính":"Nam Bắc","Ngọ":"Nam Bắc","Đinh":"Nam Bắc"
            };
            const MAU_TAM_BAN_QUAI = { "Giang Đông":"#2e7d32", "Giang Tây":"#c62828", "Nam Bắc":"#1565c0" };

            // ---- 12 Song Sơn của Thiên Bàn (lệch +7.5° so với Địa bàn), dùng riêng để đo
            // Thủy (Nước Đến/Đi), không dùng để đo Tọa/Hướng.
            const SONG_SON_12 = [
                {ten:"Nhâm-Tý", goc:0},{ten:"Quý-Sửu", goc:30},{ten:"Cấn-Dần", goc:60},{ten:"Giáp-Mão", goc:90},
                {ten:"Ất-Thìn", goc:120},{ten:"Tốn-Tị", goc:150},{ten:"Bính-Ngọ", goc:180},{ten:"Đinh-Mùi", goc:210},
                {ten:"Khôn-Thân", goc:240},{ten:"Canh-Dậu", goc:270},{ten:"Tân-Tuất", goc:300},{ten:"Kiền-Hợi", goc:330}
            ];
            const LECH_THIEN_BAN = 7.5; // Thiên bàn xoay lệch 7.5° theo chiều kim đồng hồ so với Địa bàn

            // Thiên Bàn luôn hiển thị mặc định trong la bàn Kham Dư (đã bỏ toggle bật/tắt,
            // giữ tên biến hienThiThienBanKhamDu để không phải sửa các chỗ dùng bên dưới).
            const hienThiThienBanKhamDu = true;

            function veLaBanKhamDu() {
                let svg = damBaoSvgKhamDuTonTai(); if (!svg) return;
                svg.innerHTML = "";
                const cx = 500, cy = 500;
                // Bán kính các vòng, từ trong ra ngoài:
                // Tâm -> Bát Quái (8, to) -> Trường Sinh Kham Dư (12 cung Song Sơn) -> 24 Sơn
                // (Địa bàn) -> Tam Nguyên Long (T/Đ/N) -> Tam Bàn Quái (Giang Đông/Tây/Nam Bắc)
                // -> 72 Long -> Thiên Bàn (Song Sơn) -> chia độ
                const rBatQuai = 160;
                const rTruongSinhKDTrong = 160, rTruongSinhKDNgoai = 210;
                const rSon24Trong = 210, rSon24 = 260;
                const rNguyenLong = 290;
                const rTamBanQuai = 330;
                const rLong72Trong = 330, rLong72Ngoai = hienThiThienBanKhamDu ? 385 : 400;
                // Dải Thiên Bàn được nới rộng từ 15px lên 35px bằng cách rút ngắn khoảng cách của
                // vạch chia độ ra ngoài rìa la bàn (rDoSo/rDoText bên dưới đổi từ +20/+40 xuống
                // +10/+22), nhường không gian cho dải Thiên Bàn dày hơn, dễ đọc chữ + màu hơn.
                const rThienBanTrong = 385, rThienBanNgoai = 420;
                const rOuter = hienThiThienBanKhamDu ? rThienBanNgoai : rLong72Ngoai;
                const rDoTick = rOuter, rDoText = rOuter + 22, rDoSo = rOuter + 10;

                let houseFacing = parseFloat(document.getElementById("houseFacing")?.value) || 0;

                let html = "";
                // Viền mỏng đánh dấu ranh giới các vòng
                [rBatQuai, rSon24, rNguyenLong, rTamBanQuai, rLong72Ngoai].forEach(function(r) {
                    html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#3a2a1a" stroke-width="1" opacity="0.6"/>`;
                });
                if (hienThiThienBanKhamDu) {
                    html += `<circle cx="${cx}" cy="${cy}" r="${rThienBanNgoai}" fill="none" stroke="#3a2a1a" stroke-width="1.5" opacity="0.8"/>`;
                }

                // ---- VÒNG CHIA ĐỘ (ngoài cùng, mỗi 10°) ----
                for (let deg = 0; deg < 360; deg += 10) {
                    let rad = (deg - 90) * Math.PI / 180;
                    let isMajor = deg % 45 === 0;
                    let rIn = isMajor ? rDoTick - 8 : rDoTick - 4;
                    let x1 = cx + rIn * Math.cos(rad), y1 = cy + rIn * Math.sin(rad);
                    let x2 = cx + rDoSo * Math.cos(rad), y2 = cy + rDoSo * Math.sin(rad);
                    html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#5c4a3a" stroke-width="${isMajor?1.5:1}" opacity="0.85"/>`;
                    let xt = cx + rDoText * Math.cos(rad), yt = cy + rDoText * Math.sin(rad);
                    html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${(tpFontSize*1.0).toFixed(1)}" font-weight="600" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${deg} ${xt.toFixed(1)} ${yt.toFixed(1)})">${deg}</text>`;
                }

                // ---- VÒNG THIÊN BÀN (Song Sơn, lệch +7.5° so với Địa bàn) — chỉ vẽ khi bật ----
                // Mỗi cung Song Sơn được tô 1 màu riêng biệt (bảng 12 màu xoay vòng, đủ tương
                // phản giữa các cung liền kề) để dễ phân biệt bằng mắt, thay vì đồng nhất 1 màu
                // như trước. Dải cũng đã được nới rộng (rThienBanNgoai-rThienBanTrong = 35px thay
                // vì 15px) nên chữ có thể tăng cỡ và vẫn nằm gọn.
                const MAU_THIEN_BAN_12 = [
                    "#ffcdd2","#f8bbd0","#e1bee7","#d1c4e9","#c5cae9","#bbdefb",
                    "#b2ebf2","#b2dfdb","#c8e6c9","#dcedc8","#fff9c4","#ffe0b2"
                ];
                const VIEN_THIEN_BAN_12 = [
                    "#c62828","#ad1457","#6a1b9a","#4527a0","#283593","#1565c0",
                    "#00838f","#00695c","#2e7d32","#558b2f","#f9a825","#ef6c00"
                ];
                if (hienThiThienBanKhamDu) {
                    SONG_SON_12.forEach(function(ss, idxTB) {
                        let gocTam = ((ss.goc + LECH_THIEN_BAN) % 360 + 360) % 360;
                        let gocStart = gocTam - 15, gocEnd = gocTam + 15;
                        let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                        let xsO = cx + rThienBanNgoai * Math.cos(rs), ysO = cy + rThienBanNgoai * Math.sin(rs);
                        let xeO = cx + rThienBanNgoai * Math.cos(re), yeO = cy + rThienBanNgoai * Math.sin(re);
                        let xsI = cx + rThienBanTrong * Math.cos(re), ysI = cy + rThienBanTrong * Math.sin(re);
                        let xeI = cx + rThienBanTrong * Math.cos(rs), yeI = cy + rThienBanTrong * Math.sin(rs);
                        let mauNenTB = MAU_THIEN_BAN_12[idxTB % MAU_THIEN_BAN_12.length];
                        let mauVienTB = VIEN_THIEN_BAN_12[idxTB % VIEN_THIEN_BAN_12.length];
                        html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rThienBanNgoai},${rThienBanNgoai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rThienBanTrong},${rThienBanTrong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNenTB}" fill-opacity="0.75" stroke="${mauVienTB}" stroke-width="1"/>`;
                        let x1b = cx + rThienBanTrong * Math.cos(rs), y1b = cy + rThienBanTrong * Math.sin(rs);
                        let x2b = cx + rThienBanNgoai * Math.cos(rs), y2b = cy + rThienBanNgoai * Math.sin(rs);
                        html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#5c4a3a" stroke-width="0.8"/>`;
                        let radT = (gocTam - 90) * Math.PI / 180;
                        let rTextTB = (rThienBanTrong + rThienBanNgoai) / 2;
                        let xT = cx + rTextTB * Math.cos(radT), yT = cy + rTextTB * Math.sin(radT);
                        // Chữ nằm NGANG theo hướng tiếp tuyến của cung (không xoay thêm -90° như
                        // vòng 72 Long) — mỗi cung Song Sơn rộng 30° nên chiều ngang theo cung dư
                        // dả hơn nhiều so với bề dày dải 35px; xoay dọc theo bán kính sẽ bị tràn vì
                        // tên Song Sơn 2 phần (VD "Nhâm-Tý") dài hơn 35px. Lật 180° ở nửa dưới vòng
                        // tròn để chữ luôn đọc xuôi, giống cách xử lý nhãn Tam Bàn Quái/Trường Sinh.
                        let gocChuanTB = ((gocTam % 360) + 360) % 360;
                        let gocChuTB = (gocChuanTB > 90 && gocChuanTB < 270) ? gocTam + 180 : gocTam;
                        html += `<g transform="rotate(${gocChuTB} ${xT.toFixed(1)} ${yT.toFixed(1)})"><text x="${xT.toFixed(1)}" y="${yT.toFixed(1)}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="800" fill="${mauVienTB}" stroke="#fff" stroke-width="${(tpFontSize*0.85*0.3).toFixed(1)}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${ss.ten}</text></g>`;
                    });
                }

                // ---- VÒNG 72 LONG (60 Long Giáp Tý + 12 Không Vong) — mỗi sơn 15° chia 3 ô
                // 5°, thứ tự liên tục bắt đầu từ đầu sơn Nhâm (337.5°) theo chiều kim đồng hồ ----
                for (let i = 0; i < 72; i++) {
                    let gocStart = 337.5 + i * 5;
                    let gocEnd = gocStart + 5;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rLong72Ngoai * Math.cos(rs), ysO = cy + rLong72Ngoai * Math.sin(rs);
                    let xeO = cx + rLong72Ngoai * Math.cos(re), yeO = cy + rLong72Ngoai * Math.sin(re);
                    let xsI = cx + rLong72Trong * Math.cos(re), ysI = cy + rLong72Trong * Math.sin(re);
                    let xeI = cx + rLong72Trong * Math.cos(rs), yeI = cy + rLong72Trong * Math.sin(rs);
                    let tenLong = BANG_72_LONG[i];
                    let laKhongVong = (tenLong === null);
                    let hanhLong = laKhongVong ? null : NAPAM_60[tenLong];
                    let mauNen = laKhongVong ? "#3a3a3a" : (MAU_NGU_HANH[hanhLong] || "#cccccc");
                    let doMoNen = laKhongVong ? 0.75 : Math.max(doMoNenLaBan * 0.55, 0.22);
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rLong72Ngoai},${rLong72Ngoai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rLong72Trong},${rLong72Trong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${doMoNen}" stroke="#8a7a5c" stroke-width="0.5"/>`;
                    let gocTam = gocStart + 2.5;
                    let radT = (gocTam - 90) * Math.PI / 180;
                    let rTextL72 = (rLong72Trong + rLong72Ngoai) / 2;
                    let xL = cx + rTextL72 * Math.cos(radT), yL = cy + rTextL72 * Math.sin(radT);
                    let nhanLong = laKhongVong ? "KV" : tenLong;
                    let mauChu = laKhongVong ? "#fff" : "#2a1a0a";
                    // Xoay -90° so với hướng tiếp tuyến để chữ nằm dọc theo bán kính (từ trong ra
                    // ngoài) — vì tên Long 2 từ (Can+Chi) dài hơn bề rộng cung 5°/ô, nằm dọc theo
                    // bán kính tận dụng được chiều dài dải vòng thay vì bị tràn theo chiều cung hẹp.
                    // Ở nửa TRÊN vòng tròn (gocTam trong khoảng 180°-360°, tức từ Tây qua Bắc đến
                    // Đông theo la bàn) chữ theo công thức -90° sẽ bị lộn ngược (đầu chữ hướng vào
                    // tâm) — lật thêm 180° ở nửa này để chữ luôn đọc xuôi từ ngoài nhìn vào, giống
                    // cách la bàn giấy thật vẫn trình bày.
                    let gocChuan72 = ((gocTam % 360) + 360) % 360;
                    let gocChuL72 = (gocChuan72 > 180) ? gocTam + 90 : gocTam - 90;
                    let vienChuL72 = laKhongVong ? "none" : "#fff";
                    // Font-size vòng 72 Long dùng hệ số RIÊNG (0.85 thay vì theo tpFontSize*0.5
                    // trước đây) — độc lập tương đối với vòng 24 Sơn (hệ số 1.15) để có thể đọc
                    // rõ tên Long 2 từ trong ô hẹp 5° mà không cần kéo thanh trượt tổng thể lên
                    // mức làm chữ 24 Sơn quá to. Dải rộng 55px (khi Thiên Bàn bật) vẫn đủ chỗ.
                    let dayVienChuL72 = (tpFontSize*0.85*0.28).toFixed(1);
                    html += `<g transform="rotate(${gocChuL72} ${xL.toFixed(1)} ${yL.toFixed(1)})"><text x="${xL.toFixed(1)}" y="${yL.toFixed(1)}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="700" fill="${mauChu}" stroke="${vienChuL72}" stroke-width="${dayVienChuL72}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${nhanLong}</text></g>`;
                }

                // ---- VÒNG TAM BÀN QUÁI (Giang Đông / Giang Tây / Nam Bắc) — theo 24 Sơn ----
                DS24_SON.forEach(function(s) {
                    let gocStart = s.goc - 7.5, gocEnd = s.goc + 7.5;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rTamBanQuai * Math.cos(rs), ysO = cy + rTamBanQuai * Math.sin(rs);
                    let xeO = cx + rTamBanQuai * Math.cos(re), yeO = cy + rTamBanQuai * Math.sin(re);
                    let xsI = cx + rNguyenLong * Math.cos(re), ysI = cy + rNguyenLong * Math.sin(re);
                    let xeI = cx + rNguyenLong * Math.cos(rs), yeI = cy + rNguyenLong * Math.sin(rs);
                    let tenNhom = TAM_BAN_QUAI[s.ten] || "";
                    let mauNen = MAU_TAM_BAN_QUAI[tenNhom] || "#cfcfcf";
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rTamBanQuai},${rTamBanQuai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rNguyenLong},${rNguyenLong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="0.28" stroke="#3a2a1a" stroke-width="0.4"/>`;
                });
                // Nhãn Tam Bàn Quái: đặt đúng GIỮA dải (bán kính trung bình giữa rNguyenLong và
                // rTamBanQuai) và xoay theo đúng góc cung (giống các vòng khác trong la bàn), để
                // luôn nằm gọn trong vùng màu của chính nhóm đó, không lệch ra ngoài.
                let rTextTBQ = (rNguyenLong + rTamBanQuai) / 2;
                function veNhanTamBanQuai(gocGiua, nhan) {
                    let radG = (gocGiua - 90) * Math.PI / 180;
                    let xN = cx + rTextTBQ * Math.cos(radG), yN = cy + rTextTBQ * Math.sin(radG);
                    // Chữ nằm ngang theo hướng tiếp tuyến của vòng tròn. Ở nửa DƯỚI (góc 90°-270°,
                    // tức từ Đông qua Nam đến Tây) chữ theo hướng tiếp tuyến thường sẽ bị úp ngược
                    // khi đọc — lật thêm 180° ở nửa này để luôn đọc xuôi.
                    let gocChuanTBQ = ((gocGiua % 360) + 360) % 360;
                    let gocChu = (gocChuanTBQ > 90 && gocChuanTBQ < 270) ? gocGiua + 180 : gocGiua;
                    return `<g transform="rotate(${gocChu} ${xN.toFixed(1)} ${yN.toFixed(1)})"><text x="${xN.toFixed(1)}" y="${yN.toFixed(1)}" font-size="${(tpFontSize*0.68).toFixed(1)}" font-weight="800" fill="${MAU_TAM_BAN_QUAI[nhan]}" stroke="#fff" stroke-width="${(tpFontSize*0.68*0.32).toFixed(1)}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${nhan}</text></g>`;
                }
                // Giang Đông: 8 sơn Sửu..Tốn, trải từ góc 22.5° đến 157.5°, tâm tại 90°.
                // Giang Tây: 8 sơn Mùi..Càn, trải từ góc 202.5° đến 337.5°, tâm tại 270°.
                // Nam Bắc: 2 cụm — Bắc (Hợi,Nhâm,Tý,Quý: 322.5°-22.5°, tâm 352.5°) và
                // Nam (Tị,Bính,Ngọ,Đinh: 142.5°-202.5°, tâm 172.5°).
                html += veNhanTamBanQuai(90, "Giang Đông");
                html += veNhanTamBanQuai(270, "Giang Tây");
                html += veNhanTamBanQuai(352.5, "Nam Bắc");
                html += veNhanTamBanQuai(172.5, "Nam Bắc");

                // ---- VÒNG TAM NGUYÊN LONG (T/Đ/N) — theo đúng DS24_SON.nguyenLong đã có sẵn ----
                const NGUYEN_LONG_TAT = { "Thien":"T", "Dia":"Đ", "Nhan":"N" };
                const NGUYEN_LONG_MAU = { "Thien":"#c62828", "Dia":"#1565c0", "Nhan":"#2e7d32" };
                DS24_SON.forEach(function(s) {
                    let gocStart = s.goc - 7.5, gocEnd = s.goc + 7.5;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rNguyenLong * Math.cos(rs), ysO = cy + rNguyenLong * Math.sin(rs);
                    let xeO = cx + rNguyenLong * Math.cos(re), yeO = cy + rNguyenLong * Math.sin(re);
                    let xsI = cx + rSon24 * Math.cos(re), ysI = cy + rSon24 * Math.sin(re);
                    let xeI = cx + rSon24 * Math.cos(rs), yeI = cy + rSon24 * Math.sin(rs);
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rNguyenLong},${rNguyenLong} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rSon24},${rSon24} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="#fff" fill-opacity="${doMoNenLaBan*0.5}" stroke="#8a7a5c" stroke-width="0.5"/>`;
                    let tat = NGUYEN_LONG_TAT[s.nguyenLong] || "?";
                    let mauTat = NGUYEN_LONG_MAU[s.nguyenLong] || "#555";
                    let radT = (s.goc - 90) * Math.PI / 180;
                    let rTextNL = (rSon24 + rNguyenLong) / 2;
                    let xT = cx + rTextNL * Math.cos(radT), yT = cy + rTextNL * Math.sin(radT);
                    html += `<g transform="rotate(${s.goc} ${xT.toFixed(1)} ${yT.toFixed(1)})"><text x="${xT.toFixed(1)}" y="${yT.toFixed(1)}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="800" fill="${mauTat}" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${tat}</text></g>`;
                });

                // ---- VÒNG 24 SƠN (Địa bàn) ----
                let sonHienTai = timSonTheoGocCucBo((houseFacing % 360 + 360) % 360);
                DS24_SON.forEach(function(s) {
                    let gocStart = s.goc - 7.5, gocEnd = s.goc + 7.5;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rSon24 * Math.cos(rs), ysO = cy + rSon24 * Math.sin(rs);
                    let xeO = cx + rSon24 * Math.cos(re), yeO = cy + rSon24 * Math.sin(re);
                    let xsI = cx + rSon24Trong * Math.cos(re), ysI = cy + rSon24Trong * Math.sin(re);
                    let xeI = cx + rSon24Trong * Math.cos(rs), yeI = cy + rSon24Trong * Math.sin(rs);
                    let laToaSon = laySonToa ? laySonToa(houseFacing) : null;
                    let laToa = laToaSon && laToaSon.ten === s.ten;
                    let laHuong = sonHienTai && sonHienTai.ten === s.ten;
                    let mauNen = s.amDuong === "Duong" ? "#fdf6e3" : "#eef1f7";
                    let vien = laHuong ? "#c62828" : (laToa ? "#6a1b9a" : "#3a2a1a");
                    let dayVien = (laHuong || laToa) ? 3.5 : 0.8;
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rSon24},${rSon24} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rSon24Trong},${rSon24Trong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${Math.max(doMoNenLaBan,0.5)}" stroke="${vien}" stroke-width="${dayVien}"/>`;
                    let x1b = cx + rSon24Trong * Math.cos(rs), y1b = cy + rSon24Trong * Math.sin(rs);
                    let x2b = cx + rSon24 * Math.cos(rs), y2b = cy + rSon24 * Math.sin(rs);
                    html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#3a2a1a" stroke-width="0.8"/>`;
                    let radT = (s.goc - 90) * Math.PI / 180;
                    let rTextS24 = (rSon24Trong + rSon24) / 2;
                    let xS = cx + rTextS24 * Math.cos(radT), yS = cy + rTextS24 * Math.sin(radT);
                    html += `<g transform="rotate(${s.goc} ${xS.toFixed(1)} ${yS.toFixed(1)})"><text x="${xS.toFixed(1)}" y="${yS.toFixed(1)}" font-size="${(tpFontSize*1.15).toFixed(1)}" font-weight="800" fill="#1a1a1a" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${s.ten}</text></g>`;
                });

                // ---- VÒNG TRƯỜNG SINH KHAM DƯ (12 cung Song Sơn) — chèn GIỮA Bát Quái và 24
                // Sơn. Thuật toán KHÁC HẲN la bàn Trường Sinh cũ (vốn tính theo 12 Địa Chi + Cục
                // theo Nước Đi/Sơn Tọa trực tiếp):
                //   B1. Long tại TỌA (đối 180° với Hướng nhà) tra trong BANG_72_LONG.
                //   B2. Nếu ô đó là Không Vong (null) → KHÔNG vẽ vòng, chỉ cảnh báo ở tâm.
                //   B3. Nếu có Long → tra NAPAM_60 → Cục: Thủy/Thổ→"Thủy", Hỏa→"Hỏa", Kim→"Kim",
                //       Mộc→"Mộc" (LƯU Ý: đây là quy đổi Cục THEO NẠP ÂM TẠI TỌA, không dùng
                //       chung bảng diaChiToCuc/sonToNguHanh của la bàn Trường Sinh cũ).
                //   B4. Cục → điểm khởi cung Song Sơn: Thủy→"Khôn-Thân", Mộc→"Kiền-Hợi",
                //       Hỏa→"Cấn-Dần", Kim→"Tốn-Tị".
                //   B5. Can của Long tại Tọa: Dương Can (Giáp,Bính,Mậu,Canh,Nhâm)→Thuận (theo
                //       đúng thứ tự 12 cung Song Sơn liệt kê dưới); Âm Can (Ất,Đinh,Kỷ,Tân,Quý)
                //       →Nghịch.
                const CUC_THEO_NAPAM_KD = { "Thủy":"Thủy", "Thổ":"Thủy", "Hỏa":"Hỏa", "Kim":"Kim", "Mộc":"Mộc" };
                const SONG_SON_12_KD = [
                    "Nhâm-Tý","Quý-Sửu","Cấn-Dần","Giáp-Mão","Ất-Thìn","Tốn-Tị",
                    "Bính-Ngọ","Đinh-Mùi","Khôn-Thân","Canh-Dậu","Tân-Tuất","Kiền-Hợi"
                ];
                const KHOI_TRUONG_SINH_KD = { "Thủy":"Khôn-Thân", "Mộc":"Kiền-Hợi", "Hỏa":"Cấn-Dần", "Kim":"Tốn-Tị" };
                const DUONG_CAN_KD = ["Giáp","Bính","Mậu","Canh","Nhâm"];
                let gocToaKD = (houseFacing + 180) % 360;
                let idxLongToaKD = Math.floor((((gocToaKD - 337.5) % 360 + 360) % 360) / 5);
                let tenLongToaKD = BANG_72_LONG[idxLongToaKD];
                let canhBaoKhongVongToa = false;
                let bang12TruongSinhKD = null; // { "Nhâm-Tý": "Trường Sinh", ... }
                let cucKD = null, chieuThuanKD = null;
                if (tenLongToaKD === null) {
                    canhBaoKhongVongToa = true;
                } else {
                    let hanhLongToaKD = NAPAM_60[tenLongToaKD];
                    cucKD = CUC_THEO_NAPAM_KD[hanhLongToaKD] || null;
                    let canLongToaKD = tenLongToaKD.split(" ")[0];
                    chieuThuanKD = DUONG_CAN_KD.includes(canLongToaKD);
                    if (cucKD) {
                        let cungKhoi = KHOI_TRUONG_SINH_KD[cucKD];
                        let idxKhoi = SONG_SON_12_KD.indexOf(cungKhoi);
                        bang12TruongSinhKD = {};
                        let buocKD = chieuThuanKD ? 1 : -1;
                        for (let k = 0; k < 12; k++) {
                            let idxCung = ((idxKhoi + k * buocKD) % 12 + 12) % 12;
                            bang12TruongSinhKD[SONG_SON_12_KD[idxCung]] = tenGiaiDoan12[k];
                        }
                    }
                }
                const MAU_GIAI_DOAN_KD = {
                    "Trường Sinh":"#2e7d32","Đế Vượng":"#2e7d32","Quan Đới":"#4caf50","Lâm Quan":"#4caf50",
                    "Mộc Dục":"#fbc02d","Suy":"#fbc02d","Thai":"#fbc02d","Dưỡng":"#fbc02d",
                    "Bệnh":"#e65100","Tử":"#c62828","Mộ":"#795548","Tuyệt":"#555555"
                };
                for (let i = 0; i < 12; i++) {
                    let gocStart = -15 + i * 30, gocEnd = gocStart + 30;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rTruongSinhKDNgoai * Math.cos(rs), ysO = cy + rTruongSinhKDNgoai * Math.sin(rs);
                    let xeO = cx + rTruongSinhKDNgoai * Math.cos(re), yeO = cy + rTruongSinhKDNgoai * Math.sin(re);
                    let xsI = cx + rTruongSinhKDTrong * Math.cos(re), ysI = cy + rTruongSinhKDTrong * Math.sin(re);
                    let xeI = cx + rTruongSinhKDTrong * Math.cos(rs), yeI = cy + rTruongSinhKDTrong * Math.sin(rs);
                    let tenCungKD = SONG_SON_12_KD[i];
                    let giaiDoanKD = bang12TruongSinhKD ? bang12TruongSinhKD[tenCungKD] : null;
                    let mauNenKD = giaiDoanKD ? MAU_GIAI_DOAN_KD[giaiDoanKD] : "#e0e0e0";
                    let doMoKD = giaiDoanKD ? 0.45 : 0.15;
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rTruongSinhKDNgoai},${rTruongSinhKDNgoai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rTruongSinhKDTrong},${rTruongSinhKDTrong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNenKD}" fill-opacity="${doMoKD}" stroke="#3a2a1a" stroke-width="0.6"/>`;
                    let x1c = cx + rTruongSinhKDTrong * Math.cos(rs), y1c = cy + rTruongSinhKDTrong * Math.sin(rs);
                    let x2c = cx + rTruongSinhKDNgoai * Math.cos(rs), y2c = cy + rTruongSinhKDNgoai * Math.sin(rs);
                    html += `<line x1="${x1c.toFixed(1)}" y1="${y1c.toFixed(1)}" x2="${x2c.toFixed(1)}" y2="${y2c.toFixed(1)}" stroke="#3a2a1a" stroke-width="0.6"/>`;
                    let gocTamKD = gocStart + 15;
                    let radTKD = (gocTamKD - 90) * Math.PI / 180;
                    // Tên cung Song Sơn (ví dụ "Nhâm-Tý") nằm ở nửa ngoài của dải, tên giai đoạn
                    // (ví dụ "Trường Sinh") nằm ở nửa trong — mỗi ô rộng 30° (rộng hơn nhiều so
                    // với bề dày dải 50px) nên chữ nằm NGANG theo hướng tiếp tuyến (xoay -90° so
                    // với hướng bán kính) để gọn trong ô, thay vì dọc theo bán kính như vòng 72
                    // Long (vốn có ô hẹp 5° cần chữ dọc). Lật thêm 180° ở nửa dưới vòng tròn để
                    // chữ luôn đọc xuôi.
                    let gocChuanKD = ((gocTamKD % 360) + 360) % 360;
                    let gocChuKD = (gocChuanKD > 90 && gocChuanKD < 270) ? gocTamKD + 180 : gocTamKD;
                    let rTenCungKD = rTruongSinhKDTrong + (rTruongSinhKDNgoai - rTruongSinhKDTrong) * 0.72;
                    let rTenGiaiDoanKD = rTruongSinhKDTrong + (rTruongSinhKDNgoai - rTruongSinhKDTrong) * 0.28;
                    let xTenCung = cx + rTenCungKD * Math.cos(radTKD), yTenCung = cy + rTenCungKD * Math.sin(radTKD);
                    let xTenGD = cx + rTenGiaiDoanKD * Math.cos(radTKD), yTenGD = cy + rTenGiaiDoanKD * Math.sin(radTKD);
                    // Font-size vòng Trường Sinh Kham Dư dùng hệ số RIÊNG (0.9 cho tên cung, 0.95
                    // cho tên giai đoạn — thay vì 0.55/0.6 trước đây), độc lập tương đối với vòng
                    // 24 Sơn (hệ số 1.15). Mỗi ô rộng 30° (~97px chiều dài chữ khả dụng) nên đủ
                    // chỗ cho tên giai đoạn dài nhất ("Trường Sinh", "Quan Đới"...) ở cỡ lớn hơn.
                    html += `<g transform="rotate(${gocChuKD} ${xTenCung.toFixed(1)} ${yTenCung.toFixed(1)})"><text x="${xTenCung.toFixed(1)}" y="${yTenCung.toFixed(1)}" font-size="${(tpFontSize*0.9).toFixed(1)}" font-weight="700" fill="#1a1a1a" stroke="#fff" stroke-width="${(tpFontSize*0.9*0.28).toFixed(1)}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${tenCungKD}</text></g>`;
                    if (giaiDoanKD) {
                        html += `<g transform="rotate(${gocChuKD} ${xTenGD.toFixed(1)} ${yTenGD.toFixed(1)})"><text x="${xTenGD.toFixed(1)}" y="${yTenGD.toFixed(1)}" font-size="${(tpFontSize*0.95).toFixed(1)}" font-weight="800" fill="#fff" stroke="${mauNenKD}" stroke-width="${(tpFontSize*0.95*0.35).toFixed(1)}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${giaiDoanKD}</text></g>`;
                    }
                }

                // ---- VÒNG BÁT QUÁI (8 cung, mỗi 45°, trong cùng) ----
                const BATQUAI_8 = [
                    {ten:"Khảm", goc:0},{ten:"Cấn", goc:45},{ten:"Chấn", goc:90},{ten:"Tốn", goc:135},
                    {ten:"Ly", goc:180},{ten:"Khôn", goc:225},{ten:"Đoài", goc:270},{ten:"Càn", goc:315}
                ];
                BATQUAI_8.forEach(function(bq, idx) {
                    let gocStart = bq.goc - 22.5, gocEnd = bq.goc + 22.5;
                    let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
                    let xsO = cx + rBatQuai * Math.cos(rs), ysO = cy + rBatQuai * Math.sin(rs);
                    let xeO = cx + rBatQuai * Math.cos(re), yeO = cy + rBatQuai * Math.sin(re);
                    let mauNen = MAU_BAT_QUAI ? MAU_BAT_QUAI[idx] : "#8a7a5c";
                    html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rBatQuai},${rBatQuai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${cx},${cy} Z" fill="${mauNen}" fill-opacity="${Math.max(doMoNenLaBan*0.6,0.22)}" stroke="#3a2a1a" stroke-width="0.8"/>`;
                    let radT = (bq.goc - 90) * Math.PI / 180;
                    let rTextBQ = rBatQuai * 0.65;
                    let xB = cx + rTextBQ * Math.cos(radT), yB = cy + rTextBQ * Math.sin(radT);
                    html += `<g transform="rotate(${bq.goc} ${xB.toFixed(1)} ${yB.toFixed(1)})"><text x="${xB.toFixed(1)}" y="${yB.toFixed(1)}" font-size="${(tpFontSize*1.3).toFixed(1)}" font-weight="900" fill="#fff" stroke="#2a2a2a" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${bq.ten}</text></g>`;
                });

                // Kim chỉ hướng nhà — đặt ra ngoài vòng chia độ, giống các la bàn khác
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

                // Tâm: nhãn "Kham Dư" + góc hướng nhà hiện tại + Long tại Hướng
                html += `<circle cx="${cx}" cy="${cy}" r="6" fill="#ff1a1a" stroke="#fff" stroke-width="2"/>`;
                html += `<text x="${cx}" y="${cy-30}" font-size="${(tpFontSize*1.1).toFixed(1)}" font-weight="900" fill="#2e7d32" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle">KHAM DƯ</text>`;
                html += `<text x="${cx}" y="${cy-8}" font-size="${(tpFontSize*0.9).toFixed(1)}" font-weight="700" fill="#555" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">${houseFacing.toFixed(1)}°</text>`;
                if (sonHienTai) {
                    html += `<text x="${cx}" y="${cy+10}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="700" fill="#c62828" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Hướng: ${sonHienTai.ten}</text>`;
                }
                // Long tại Hướng (tra theo góc houseFacing trong BANG_72_LONG)
                let idxLong = Math.floor((((houseFacing - 337.5) % 360 + 360) % 360) / 5);
                let tenLongHuong = BANG_72_LONG[idxLong];
                if (tenLongHuong) {
                    let hanhLongHuong = NAPAM_60[tenLongHuong] || "";
                    html += `<text x="${cx}" y="${cy+28}" font-size="${(tpFontSize*0.8).toFixed(1)}" font-weight="700" fill="${MAU_NGU_HANH[hanhLongHuong]||'#333'}" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Long: ${tenLongHuong} (${hanhLongHuong})</text>`;
                } else {
                    html += `<text x="${cx}" y="${cy+28}" font-size="${(tpFontSize*0.8).toFixed(1)}" font-weight="700" fill="#3a3a3a" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Long: Không Vong</text>`;
                }
                // Thông tin vòng Trường Sinh Kham Dư (Cục + Thuận/Nghịch tại Tọa), hoặc cảnh báo
                // đỏ nếu Tọa phạm đúng ô Không Vong trong bảng 72 Long.
                if (canhBaoKhongVongToa) {
                    html += `<rect x="${cx-130}" y="${cy+38}" width="260" height="26" fill="#c62828" rx="4"/>`;
                    html += `<text x="${cx}" y="${cy+55}" font-size="${(tpFontSize*0.78).toFixed(1)}" font-weight="900" fill="#fff" text-anchor="middle">Tọa phạm Kính Không Vong</text>`;
                    html += `<text x="${cx}" y="${cy+72}" font-size="${(tpFontSize*0.7).toFixed(1)}" font-weight="700" fill="#c62828" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle">Âm sai Dương thác</text>`;
                } else if (cucKD) {
                    html += `<text x="${cx}" y="${cy+46}" font-size="${(tpFontSize*0.75).toFixed(1)}" font-weight="700" fill="#1565c0" stroke="#fff" stroke-width="2.2" paint-order="stroke" text-anchor="middle">Cục: ${cucKD} — ${chieuThuanKD ? "Thuận" : "Nghịch"}</text>`;
                }

                svg.innerHTML = html;
            }
            window.veLaBanKhamDu = veLaBanKhamDu;

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
                // Chú giải tên các vòng (index.html #tpChuThichCacVong) chỉ có nghĩa với la bàn Trường
                // Sinh. Đặt ở đây (chứ không riêng trong chonKieuLaBanThuyPhap) vì mọi thay đổi — đổi
                // kiểu, khôi phục bản lưu, đổi hướng nhà — đều đi qua veCompassOverlay().
                let chuThichCacVong = document.getElementById("tpChuThichCacVong");
                if (chuThichCacVong) chuThichCacVong.style.display = (kieu === "truongSinh") ? "block" : "none";
                if (kieu === "daGiacNha") { veLaiDaGiacNha(); return; }
                if (kieu === "truongSinh") { veLaBanTruongSinh(); return; }
                if (kieu === "batTrach") { veLaBanBatTrach(); return; }
                if (kieu === "khamDu") { veLaBanKhamDu(); return; }

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
            // Điểm khởi vòng Trường Sinh theo Cục, tính THẲNG TỪ MỘ (không qua điểm khởi Trường
            // Sinh k=0 như trước) — vì Mộ là mốc CỐ ĐỊNH không đổi theo chiều thuận/nghịch, còn
            // tính từ Trường Sinh rồi lùi theo buoc sẽ làm Mộ trôi sang Địa Chi khác ở chiều nghịch
            // (đã xác nhận bằng số với người dùng — Cục Thủy: chiều thuận Mộ đúng ở Thìn nhưng
            // chiều nghịch lại ra Tý, sai).
            // moTheoCuc lấy Mộ đúng theo CÙNG BỘ TAM HỢP với điểm khởi Trường Sinh cũ (khoiTruongSinh
            // trước đây: Thủy=Thân, Mộc=Hợi, Hỏa=Dần, Kim=Tị) — Mộ luôn là đỉnh thứ 3 của tam hợp:
            //   Thủy: Thân-Tý-Thìn  → Mộ = Thìn
            //   Mộc:  Hợi-Mão-Mùi   → Mộ = Mùi
            //   Hỏa:  Dần-Ngọ-Tuất  → Mộ = Tuất
            //   Kim:  Tị-Dậu-Sửu    → Mộ = Sửu
            // LƯU Ý: đây KHÔNG PHẢI bảng NHOM_THUY_KHAU (đó là nhóm 6 Sơn quanh 1 Thủy Khẩu, ví dụ
            // Ất-Thìn-Tốn-Tị-Bính-Ngọ → Thủy Khẩu Thìn — một khái niệm KHÁC, dùng cho vòng Long Pháp,
            // không phải Mộ của Cục ở đây).
            const moTheoCuc = {"Thủy":"Thìn","Mộc":"Mùi","Hỏa":"Tuất","Kim":"Sửu"};
            // Ngũ Hành của Long (vòng ngoài vòng 24 Sơn trên la bàn Trường Sinh) — 4 nhóm x 6
            // sơn: Đông-Mộc, Tây-Kim, Nam-Hỏa, còn lại (Tý/Tân/Tuất/Càn/Hợi/Nhâm) là Bắc-Thủy.
            // Đặt ở top-level (không lồng trong veLaBanTruongSinh) vì xacNhanThuyKhau() cũng
            // cần dùng để tổng kết "Lai Long là ... Long" trong kết quả xác nhận Thủy Khẩu.
            const NGU_HANH_LONG = {
                "Quý":"Mộc","Sửu":"Mộc","Cấn":"Mộc","Dần":"Mộc","Giáp":"Mộc","Mão":"Mộc",
                "Đinh":"Kim","Mùi":"Kim","Khôn":"Kim","Thân":"Kim","Canh":"Kim","Dậu":"Kim",
                "Ất":"Hỏa","Thìn":"Hỏa","Tốn":"Hỏa","Tị":"Hỏa","Bính":"Hỏa","Ngọ":"Hỏa",
                "Tý":"Thủy","Tân":"Thủy","Tuất":"Thủy","Càn":"Thủy","Hợi":"Thủy","Nhâm":"Thủy"
            };
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
                // Khởi TRỰC TIẾP từ Mộ (giống hệt cơ chế chế độ "mo" ở nhánh trên): Mộ = Địa Chi
                // cố định theo Cục (moTheoCuc), giữ NGUYÊN vị trí này ở cả 2 chiều — chỉ chiều
                // suy 11 giai đoạn còn lại đổi theo chieuTruongSinh.
                for (let cuc in moTheoCuc) {
                    let idxMoc = thuTuDiaChi12.indexOf(moTheoCuc[cuc]);
                    let kMoc = tenGiaiDoan12.indexOf("Mộ"); // = 8, cố định
                    let buoc = (chieuTruongSinh === "nghich") ? -1 : 1;
                    let idxKhoi = ((idxMoc - kMoc * buoc) % 12 + 12) % 12;
                    let bang = [];
                    for (let i = 0; i < 12; i++) {
                        let diaChi = thuTuDiaChi12[((idxKhoi + i * buoc) % 12 + 12) % 12];
                        bang.push({gd:tenGiaiDoan12[i],diaChi:diaChi,den:mucDoCatHung12[i].den,di:mucDoCatHung12[i].di});
                    }
                    vongTruongSinh[cuc] = bang;
                }
            }
            buildVongTruongSinh();
            // ====================================================================
            // VÒNG LONG PHÁP — suy 12 giai đoạn Trường Sinh ĐỘC LẬP với vòng Thủy Pháp bên
            // trong (không phụ thuộc khoiTruongSinhCheDo/Cục), theo đúng quy tắc người dùng cho:
            //  1. Cung Mộ của Long Pháp = quy đổi Nước Đi (#selSonDi) qua NHOM_THUY_KHAU (đã có,
            //     dùng chung với dropdown "⚰️ Chọn sơn → ra Thủy Khẩu") → ra 1 trong 4 Thủy Khẩu
            //     (Thìn/Tuất/Sửu/Mùi) — Địa Chi của Thủy Khẩu đó chính là Chi của ô Mộ.
            //  2. Chiều suy vòng LUÔN NGƯỢC với chiều đang chạy của Thủy Pháp (chieuTruongSinh):
            //     Thủy Pháp thuận → Long Pháp nghịch, và ngược lại.
            //  3. Mỗi ô của vòng Long Pháp (xem veVongLongPhapLuanLong) đã có đúng 1 Địa Chi thành
            //     phần (s2, ví dụ "Ất·Thìn" có Chi=Thìn) — dùng lại thuTuDiaChi12/tenGiaiDoan12 như
            //     buildVongTruongSinh() để suy điểm khởi rồi liệt kê đủ 12 giai đoạn theo Chi đó.
            // Kết quả: vongLongPhap = null (chưa chọn Nước Đi) hoặc mảng 12 {gd, diaChi}.
            let vongLongPhap = null;
            function buildVongLongPhap() {
                vongLongPhap = null;
                let sonDi = document.getElementById("selSonDi")?.value || null;
                let nhom = sonDi ? timNhomThuyKhau(sonDi) : null;
                if (!nhom) return; // chưa chọn Nước Đi, hoặc sơn không thuộc nhóm nào (không xảy ra với 24 sơn chuẩn)
                let diaChiMo = nhom.thuyKhau; // Thìn/Tuất/Sửu/Mùi — luôn là 1 trong 12 Địa Chi
                let idxMo = thuTuDiaChi12.indexOf(diaChiMo);
                let kMo = tenGiaiDoan12.indexOf("Mộ"); // = 8, cố định
                // Chiều Long Pháp = NGƯỢC chiều Thủy Pháp (chieuTruongSinh) — không phải cùng chiều
                // như buildVongTruongSinh() chế độ "mo".
                let chieuLongPhap = (chieuTruongSinh === "nghich") ? "thuan" : "nghich";
                let buoc = (chieuLongPhap === "nghich") ? -1 : 1;
                let idxKhoi = ((idxMo - kMo * buoc) % 12 + 12) % 12;
                let bang = [];
                for (let i = 0; i < 12; i++) {
                    let diaChi = thuTuDiaChi12[((idxKhoi + i * buoc) % 12 + 12) % 12];
                    bang.push({ gd: tenGiaiDoan12[i], diaChi: diaChi });
                }
                vongLongPhap = bang;
            }
            buildVongLongPhap();
            function chonKhoiTruongSinhCheDo(cheDo) {
                khoiTruongSinhCheDo = (cheDo === "toa") ? "toa" : "thuykhau";
                buildVongTruongSinh();
                // 2 NÚT chế độ: Thủy Khẩu / Tọa nhà — chỉ nút đang chọn được tô xanh. (Nút "Theo
                // Mộ" thứ 3 đã gỡ: chế độ Thủy Khẩu giờ tự khởi vòng Trường Sinh từ Mộ — xem
                // buildVongTruongSinh()/moTheoCuc — nên không cần nhập tay sơn Mộ riêng nữa.)
                let btnTK = document.getElementById("btnTruongSinhTheoThuyKhau"), btnT = document.getElementById("btnTruongSinhTheoToa");
                [ [btnTK,"thuykhau"], [btnT,"toa"] ].forEach(function(pair) {
                    if (!pair[0]) return;
                    let bat = khoiTruongSinhCheDo === pair[1];
                    pair[0].style.background = bat ? "#1565c0" : "#fff"; pair[0].style.color = bat ? "#fff" : "#555"; pair[0].style.borderColor = bat ? "#1565c0" : "#999";
                });
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
            // Nước Đến/Đi cho Trường Sinh giờ quy đổi từ dropdown 24 sơn dùng chung
            // (#selSonDen/#selSonDi) qua quyDoiSonSangDiaChi() — xem SON_SANG_DIA_CHI_12 và
            // GOC_DIA_CHI_12 ở đầu file. Không còn dropdown 12 Địa Chi riêng nữa.
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
                // Tam Hợp Trường Sinh giờ quy đổi THẲNG từ sonDen/sonDi (24 sơn, đã đọc ở trên)
                // sang 12 Địa Chi qua quyDoiSonSangDiaChi() — dùng chung 1 lần chọn Nước Đến/Đi
                // cho cả Bát Trạch (sonDen/sonDi) lẫn Trường Sinh (diaChiDen/diaChiDi), không
                // còn 2 dropdown tách biệt như trước.
                let diaChiDen = quyDoiSonSangDiaChi(sonDen);
                let diaChiDi = quyDoiSonSangDiaChi(sonDi);
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
                // QUY TẮC THỦY PHÁP BÁT TRẠCH: Nước ĐẾN nên đến từ cung CÁT (Sinh Khí/Thiên Y/
                // Diên Niên/Phục Vị) — cát khí theo nước vào nhà; Nước ĐI thì NGƯỢC LẠI, nên
                // thoát ra ở cung HUNG (Tuyệt Mệnh/Lục Sát/Ngũ Quỷ/Họa Hại) để xả trừ hung khí,
                // tránh thoát ở cung cát vì sẽ làm trôi mất sinh khí ("nước đến cát, nước đi
                // hung" mới là cục tốt). Vì vậy khi định dạng cho "Nước Đi", phải ĐẢO ngược
                // đánh giá tốt/xấu so với "Nước Đến": kq.diem>0 (cát) tại cung Đi lại là điềm
                // xấu (mất khí), còn kq.diem<0 (hung) tại cung Đi mới là điềm tốt (xả hung).
                // BUG CŨ: dinhDangBatTrach dùng chung 1 chiều đánh giá (diem>0=tốt/★, diem<0=
                // xấu/☠) cho cả Đến lẫn Đi, khiến nước thoát đúng vào Tuyệt Mệnh/Lục Sát/Ngũ
                // Quỷ/Họa Hại (đúng phép) lại bị hiện ☠ đỏ như thể sai — ngược với thực tế.
                function dinhDangBatTrach(label, kq, phuong, laNuocDi) {
                    if (!kq) return `${label} (${phuong}): <i>không xác định</i>`;
                    let diemHienThi = laNuocDi ? -kq.diem : kq.diem; // đảo dấu cho Nước Đi
                    let soKy = Math.min(5,Math.round(Math.abs(kq.diem)/18));
                    let bieuTuong = diemHienThi>0?"★".repeat(soKy):"☠".repeat(soKy), mauChu = diemHienThi>0?"#1565c0":"#c62828";
                    let ghiChu = laNuocDi
                        ? (kq.diem<0 ? " (đi ở cung hung — đúng phép, xả trừ hung khí)" : " (đi ở cung cát — không tốt, làm trôi mất sinh khí)")
                        : "";
                    return `${label} (${phuong}): <b>${kq.ten}</b> (${kq.diem>0?"+":""}${kq.diem}) → <b style="color:${mauChu}">${bieuTuong}</b>${ghiChu}`;
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
                    `<b>Thông tin thủy pháp:</b><br>house_facing = ${houseFacing}° (hướng nhà ≈ sơn <b>${sonHuongNhaTamHop.ten}</b>)<br>water_in_direction (Nước đến, 24 sơn Bát trạch) = ${sonDen}<br>water_out_direction (Nước đi, 24 sơn Bát trạch) = ${sonDi}<br>Nước Đến/Đi (Tam Hợp vòng trường sinh) = ${diaChiDen||"—"} / ${diaChiDi||"—"}<br>⛰️ Lai Long = ${laiLongRaw||"—"}${laiLongRaw && NGU_HANH_LONG[laiLongRaw] ? (" (" + NGU_HANH_LONG[laiLongRaw] + " Long)") : ""}<br>🐉 Long nhập thủ = ${longNhapThuRaw||"—"}${longNhapThuRaw && NGU_HANH_LONG[longNhapThuRaw] ? (" (" + NGU_HANH_LONG[longNhapThuRaw] + " Long)") : ""}<br><br>
                     ${menh ? `<b>🏡 Trạch mệnh gia chủ:</b> Năm sinh ${namSinh} (${gioiTinhRaw}) → Quái <b>${menh.cung}</b> (Quái ${menh.quaiSo}, hành ${menh.hanh}, ${nhomMenh})<br>
                     <b style="color:${hopMenh?'#1565c0':'#c62828'}">${hopMenh?'✅ Mệnh gia chủ HỢP với Trạch nhà (cùng nhóm '+nhomMenh+')':'⚠️ Mệnh gia chủ KHÔNG hợp Trạch nhà — phạm "Đông Tây hỗn loạn" (Mệnh '+nhomMenh+', Trạch '+nhomTrach+')'}</b><br><br>`
                     : `<b>🏡 Trạch mệnh gia chủ:</b> <i>Không xác định được (kiểm tra lại năm sinh)</i><br><br>`}
                     <b>📘 Tam Hợp Trường Sinh</b> (khởi theo ${khoiTruongSinhCheDo==="toa"?`<b>Tọa nhà</b> — Tọa ≈ sơn <b>${sonToaChoTongKet?sonToaChoTongKet.ten:"—"}</b>, Trường Sinh ${chieuTruongSinh==="nghich"?"nghịch":"thuận"}`:`<b>Thủy Khẩu</b>, chiều nước ${chieuTruongSinh==="nghich"?"nghịch":"thuận"}`}): ${cuc ? `→ thuộc <b>${cuc}${khoiTruongSinhCheDo==="toa"?" (theo Tọa)":" Cục"}</b>` : `<i>${khoiTruongSinhCheDo==="toa"?"Không xác định được Ngũ Hành Tọa":"Chưa chọn Địa Chi Nước Đi nên chưa xác định được Cục"}</i>`}<br>
                     ${dinhDangKetQua("Nước Đến",ketQuaDen,"den")}<br>${dinhDangKetQua("Nước Đi",ketQuaDi,"di")}<br><br>
                     <b>📗 Bát Trạch Thủy Pháp (theo Trạch mệnh):</b> Hướng nhà ≈ ${quaiTrachNha.phuong} → Quái Trạch <b>${quaiTrachNha.ten}</b> (${nhomTrach})<br>
                     ${dinhDangBatTrach("Nước Đến",ketQuaBTDen,phuongDen,false)}<br>${dinhDangBatTrach("Nước Đi",ketQuaBTDi,phuongDi,true)}<br><br>
                     ${menh ? `<b>📙 Bát Trạch Thủy Pháp (theo Nhân mệnh):</b> Gia chủ → Quái Mệnh <b>${menh.cung}</b> (${nhomMenh})<br>
                     ${dinhDangBatTrach("Nước Đến",ketQuaBTDenMenh,phuongDen,false)}<br>${dinhDangBatTrach("Nước Đi",ketQuaBTDiMenh,phuongDi,true)}<br><br>`
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
                    chieuTruongSinh: chieuTruongSinh,
                    khoiTruongSinhCheDo: khoiTruongSinhCheDo,
                    laiLongRaw: laiLongRaw,
                    longNhapThuRaw: longNhapThuRaw,
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
                    hienThiBatTrachTrachTrongTruongSinh: hienThiBatTrachTrachTrongTruongSinh,
                    hienThiBatTrachMenhTrongTruongSinh: hienThiBatTrachMenhTrongTruongSinh,
                    mapImageSrc: coAnh ? mapImg.src : null
                };
            };

            window.apDungStateThuyPhap = function(obj) {
                if (!obj) return;
                function setVal(id, v) { let el = document.getElementById(id); if (el && v !== undefined && v !== "") el.value = v; }
                // Như setVal nhưng CHO PHÉP giá trị rỗng "" (ô người dùng đã xóa trắng lúc lưu). Chỉ bỏ qua khi
                // bản lưu KHÔNG có trường đó (undefined/null — bản lưu rất cũ) để giữ nguyên giá trị hiện tại.
                function setValCoRong(id, v) { let el = document.getElementById(id); if (el && v !== undefined && v !== null) el.value = v; }
                function bnEvt(id, kinds) { let el = document.getElementById(id); if (el) kinds.forEach(k => el.dispatchEvent(new Event(k, {bubbles:true}))); }
                setValCoRong("namSinhGiaChu", obj.namSinhGiaChu);
                setVal("gioiTinhGiaChu", obj.gioiTinhGiaChu);
                if (typeof capNhatCanChiNamSinh === "function") capNhatCanChiNamSinh("namSinhGiaChu", "canChiNamSinhGiaChu");
                setVal("colorTiaNetDut", obj.colorTiaNetDut); bnEvt("colorTiaNetDut", ["input","change"]);
                setVal("colorRanh8Huong", obj.colorRanh8Huong); bnEvt("colorRanh8Huong", ["input","change"]);
                setVal("tpFontSize", obj.tpFontSize); bnEvt("tpFontSize", ["input"]);
                setVal("tpDoMoNen", obj.tpDoMoNen); bnEvt("tpDoMoNen", ["input"]);
                setVal("selSonDen", obj.selSonDen); bnEvt("selSonDen", ["change"]);
                setVal("selSonDi", obj.selSonDi); bnEvt("selSonDi", ["change"]);
                laiLongRaw = obj.laiLongRaw || null;
                // Gán thẳng (không qua setVal) vì setVal bỏ qua giá trị rỗng → dropdown giữ giá trị cũ.
                let selLLKhoiPhuc = document.getElementById("selLaiLong");
                if (selLLKhoiPhuc) selLLKhoiPhuc.value = laiLongRaw || "";
                // Bản lưu cũ chưa có trường này → null, ô dropdown về "— chọn —".
                longNhapThuRaw = obj.longNhapThuRaw || null;
                // Gán thẳng (không qua setVal) vì setVal bỏ qua giá trị rỗng, sẽ để dropdown lệch dữ liệu.
                let selLNTKhoiPhuc = document.getElementById("selLongNhapThu");
                if (selLNTKhoiPhuc) selLNTKhoiPhuc.value = longNhapThuRaw || "";
                // Bản lưu cũ có thể có khoiTruongSinhCheDo="mo" (chế độ "Theo Mộ" đã gỡ) — quy về
                // "thuykhau", vì giờ chế độ đó đã tự khởi vòng Trường Sinh từ Mộ theo Nước Đi.
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
                // Mặc định TRUE nếu state cũ (trước bản có tính năng này) không có field —
                // giữ đúng hành vi mặc định BẬT cả 2 dải như lần đầu cài đặt tính năng.
                hienThiBatTrachTrachTrongTruongSinh = obj.hienThiBatTrachTrachTrongTruongSinh !== false;
                hienThiBatTrachMenhTrongTruongSinh = obj.hienThiBatTrachMenhTrongTruongSinh !== false;
                if (typeof capNhatNutToggleBatTrachTrongTS === "function") capNhatNutToggleBatTrachTrongTS();

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
                    setValCoRong("houseFacing", obj.houseFacing); bnEvt("houseFacing", ["input"]);
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