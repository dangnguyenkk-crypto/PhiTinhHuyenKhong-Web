// ====================================================================
// thong-tin-nha.js — TAB "📝 THÔNG TIN NHÀ"
// Khai báo TRUNG TÂM cho toàn bộ hồ sơ: Trạch nhà (Vận/Năm nhập trạch, Hướng),
// Mặt bằng (hình dạng/kích thước/cửa chính), Gia chủ (năm sinh/giới tính).
// Các ô Trạch nhà + Gia chủ chỉ là UI "gương" trỏ thẳng vào input gốc đã có ở
// tab Nội Khí (#namNhapTrach, #vanNhapTrach, #doSoTay, #namSinhChu, #gioiTinhChu)
// — không giữ state riêng, sửa ở đâu cũng ra cùng 1 kết quả, không cần xác nhận.
// Riêng Mặt bằng có state riêng vì việc áp dụng sẽ XOÁ hình/cửa/phòng đã vẽ tay
// bên Cửu Cung Lưới — nên luôn hỏi xác nhận trước khi áp dụng.
// Ghi chú tự do (sự kiện theo năm, ghi chú theo hướng, ghi chú chung) vẫn lưu như cũ.
// ====================================================================

(function () {
    let ttNextId = 1;
    let thongTinData = {
        ghiChu: '',
        suKien: [],   // [{id, nam, noiDung}]
        huongInfo: [], // [{id, huong, noiDung}]
        // Mặt bằng — state riêng của tab này, chỉ áp dụng sang Cửu Cung Lưới khi người dùng xác nhận.
        matBang: { shape: 'rect', daiM: 10, rongM: 8, sonCua: '' },
        // Động khẩu tại — sơn (trong 24 sơn) nơi có "khí động" thực tế: đường/ngõ/cửa/nước lưu thông.
        // Dương trạch lấy động khẩu đường phố làm chuẩn lập hướng; Âm trạch xem Lai Long - Khứ Thủy.
        dongKhauTaiSon: ''
    };

    function escapeHtmlTT(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    // ==== CẬP NHẬT DỮ LIỆU (gọi từ input trong HTML) ====
    window.thongTinCapNhatTruong = function (key, value) {
        thongTinData[key] = value;
    };

    window.thongTinThemSuKien = function () {
        thongTinData.suKien.push({ id: ttNextId++, nam: '', noiDung: '' });
        thongTinRenderSuKien();
    };
    window.thongTinXoaSuKien = function (id) {
        thongTinData.suKien = thongTinData.suKien.filter(x => x.id !== id);
        thongTinRenderSuKien();
    };
    window.thongTinCapNhatSuKien = function (id, field, value) {
        let item = thongTinData.suKien.find(x => x.id === id);
        if (item) item[field] = value;
    };

    window.thongTinThemHuong = function () {
        let mac = (typeof DS24_SON !== 'undefined' && DS24_SON.length) ? DS24_SON[0].ten : '';
        thongTinData.huongInfo.push({ id: ttNextId++, huong: mac, noiDung: '' });
        thongTinRenderHuong();
    };
    window.thongTinXoaHuong = function (id) {
        thongTinData.huongInfo = thongTinData.huongInfo.filter(x => x.id !== id);
        thongTinRenderHuong();
    };
    window.thongTinCapNhatHuong = function (id, field, value) {
        let item = thongTinData.huongInfo.find(x => x.id === id);
        if (item) item[field] = value;
    };

    // ==== ĐỘNG KHẨU TẠI — sơn có khí động thực tế (đường/ngõ/cửa/nước) ====
    window.thongTinDoiDongKhauTaiSon = function (value) {
        thongTinData.dongKhauTaiSon = value;
    };

    // ==== TRẠCH NHÀ + GIA CHỦ — "gương" 2 chiều với input gốc bên tab Nội Khí ====
    // Đọc trực tiếp từ DOM (không cache), vì input gốc có thể bị nơi khác đổi bất cứ lúc nào.
    function elGoc(id) { return document.getElementById(id); }

    // Người dùng sửa ở tab Thông Tin -> ghi thẳng vào input gốc + kích hoạt đúng hàm đồng bộ
    // sẵn có của app (dongBoVanTuNam, dongBoNamTuVan, chonHuong24Son...), y như đang gõ tại chỗ gốc.
    window.thongTinDoiNamNhapTrach = function (value) {
        let el = elGoc('namNhapTrach'); if (!el) return;
        el.value = value;
        if (typeof dongBoVanTuNam === 'function') dongBoVanTuNam();
        thongTinBaoTrachNhaDoi();
        thongTinDongBoTruongGoc();
    };
    window.thongTinDoiVanNhapTrach = function (value) {
        let el = elGoc('vanNhapTrach'); if (!el) return;
        el.value = value;
        if (typeof dongBoNamTuVan === 'function') dongBoNamTuVan();
        thongTinBaoTrachNhaDoi();
        thongTinDongBoTruongGoc();
    };
    // #vanNhapTrach/#namNhapTrach chỉ có listener "change" gắn ở nơi khác (nếu có) — set .value bằng
    // JS thuần không tự bắn sự kiện đó, nên gọi trực tiếp API cập nhật hiển thị của Cửu Cung Lưới
    // (nếu tab đó đã load) để dòng "🏠 Trạch nhà: Vận X — nhập trạch năm Y" luôn khớp ngay lập tức.
    function thongTinBaoTrachNhaDoi() {
        if (typeof window.capNhatHienThiTrachNhaCC === 'function') window.capNhatHienThiTrachNhaCC();
    }
    window.thongTinDoiHuong24Son = function (value) {
        let el = elGoc('huong24Son'); if (!el) return;
        el.value = value;
        if (typeof chonHuong24Son === 'function') chonHuong24Son();
        thongTinBanEventDoSoTay(); // đảm bảo Cửu Cung Lưới (nghe sự kiện "input" trên #doSoTay) nhận được thay đổi
        thongTinDongBoTruongGoc();
    };
    window.thongTinDoiDoSoTay = function (value) {
        let el = elGoc('doSoTay'); if (!el) return;
        el.value = value;
        if (typeof capNhatHuongTuDoSo === 'function') capNhatHuongTuDoSo();
        thongTinBanEventDoSoTay(); // đảm bảo Cửu Cung Lưới (nghe sự kiện "input" trên #doSoTay) nhận được thay đổi
        thongTinDongBoTruongGoc();
    };
    // capNhatHuongTuDoSo()/chonHuong24Son() (shared.js) chỉ set .value và gọi các hàm vẽ CŨ
    // (redrawTamNha, boTriLuoiTheoHuong...) — KHÔNG dispatch sự kiện DOM "input" trên #doSoTay.
    // Trong khi đó Cửu Cung Lưới lắng nghe đúng sự kiện "input" đó để tự redraw() theo hướng mới
    // (xem cuu-cung-luoi.js, listener gắn trên #doSoTay). Set .value bằng JS thuần không tự phát
    // sinh sự kiện, nên phải tự dispatch thủ công, nếu không Cửu Cung Lưới sẽ không hề hay biết.
    function thongTinBanEventDoSoTay() {
        let el = elGoc('doSoTay');
        if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    window.thongTinDoiNamSinhChu = function (value) {
        let el = elGoc('namSinhChu'); if (!el) return;
        el.value = value;
        if (typeof capNhatCanChiNamSinh === 'function') capNhatCanChiNamSinh('namSinhChu', 'canChiNamSinhChu');
        if (typeof tinhToanPhiTinh === 'function') tinhToanPhiTinh();
        if (typeof window.thuyPhapDongBoTuNguon === 'function') window.thuyPhapDongBoTuNguon();
        thongTinDongBoTruongGoc();
    };
    window.thongTinDoiGioiTinhChu = function (value) {
        let el = elGoc('gioiTinhChu'); if (!el) return;
        el.value = value;
        if (typeof tinhToanPhiTinh === 'function') tinhToanPhiTinh();
        if (typeof window.thuyPhapDongBoTuNguon === 'function') window.thuyPhapDongBoTuNguon();
        thongTinDongBoTruongGoc();
    };

    // Nơi khác (Phi Tinh, Cửu Cung Lưới...) đổi input gốc -> tab Thông Tin tự cập nhật lại hiển thị.
    // QUAN TRỌNG: không innerHTML lại toàn bộ khối mỗi lần gọi — nếu người dùng đang gõ dở trong 1
    // ô số (vd xoá bớt chữ số của Năm), việc thay cả DOM sẽ làm mất focus/con trỏ ngay sau ký tự
    // đầu tiên, buộc phải bấm lại. Thay vào đó: nếu đang có input/select bên trong box được focus,
    // CHỈ cập nhật các phần tử KHÁC (không đụng ô đang gõ); nếu không ô nào đang focus, an toàn để
    // vẽ lại toàn bộ (áp dụng khi đổi từ nơi khác, hoặc đổi Vận/Hướng qua <select> — chọn xong rồi
    // nên không còn đang "gõ dở" theo nghĩa ký tự-từng-ký tự).
    function thongTinDongBoTruongGoc() {
        let box = document.getElementById('ttTrachNhaBox');
        if (!box) return; // tab chưa render thì thôi, lần sau mở tab sẽ tự đọc giá trị mới nhất
        let active = document.activeElement;
        let dangGoDoTrongBox = active && box.contains(active) && active.tagName === 'INPUT' && active.type === 'number';
        if (dangGoDoTrongBox) {
            capNhatCacTruongKhac(box, active);
        } else {
            box.innerHTML = renderTrachNhaGiaChuHtml();
        }
    }
    window.thongTinDongBoTruongGoc = thongTinDongBoTruongGoc;

    // Cập nhật các ô hiển thị phụ thuộc (Vận, Hướng 24 sơn, Độ hướng, Can Chi năm sinh) mà KHÔNG
    // đụng tới input đang được focus (giữ nguyên con trỏ/focus cho người dùng gõ tiếp). Dùng id cố
    // định (ttIn...) thay vì dò theo thứ tự phần tử, để không giòn khi HTML đổi cấu trúc sau này.
    function capNhatCacTruongKhac(box, active) {
        function capNhat(id, gocId, laTextContent) {
            let el = document.getElementById(id);
            if (!el || el === active) return; // không đụng ô đang được người dùng gõ dở
            let gocEl = elGoc(gocId);
            if (!gocEl) return;
            if (laTextContent) el.textContent = gocEl.textContent; else el.value = gocEl.value;
        }
        capNhat('ttInVanNhapTrach', 'vanNhapTrach');
        capNhat('ttInHuong24Son', 'huong24Son');
        capNhat('ttInDoSoTay', 'doSoTay');
        capNhat('ttInNamSinhChu', 'namSinhChu');
        capNhat('ttInGioiTinhChu', 'gioiTinhChu');
        capNhat('ttInCanChiNamSinhChu', 'canChiNamSinhChu', true);
        // Cung Mệnh không có input gốc tương ứng bên Nội Khí — tự tính lại từ giá trị Năm sinh/Giới
        // tính MỚI NHẤT (đọc trực tiếp từ input gốc, không phải từ ô đang focus) rồi vẽ lại khối này.
        let cmBox = document.getElementById('ttInCungMenh');
        if (cmBox) {
            let namSinhGoc = elGoc('namSinhChu') ? elGoc('namSinhChu').value : '';
            let gioiTinhGoc = elGoc('gioiTinhChu') ? elGoc('gioiTinhChu').value : 'nam';
            cmBox.innerHTML = renderCungMenhHtml(namSinhGoc, gioiTinhGoc);
        }
    }

    function renderTrachNhaGiaChuHtml() {
        let namNhapTrach = elGoc('namNhapTrach') ? elGoc('namNhapTrach').value : '';
        let vanNhapTrach = elGoc('vanNhapTrach') ? elGoc('vanNhapTrach').value : '8';
        let doSoTay = elGoc('doSoTay') ? elGoc('doSoTay').value : '180';
        let huong24SonVal = elGoc('huong24Son') ? elGoc('huong24Son').value : '180';
        let huong24SonSrcEl = elGoc('huong24Son');
        // Build lại option Vận + Hướng từ chính danh sách gốc (đọc option đã có, chỉ đổi cờ "selected"
        // theo giá trị hiện tại) — không dùng string-replace trên innerHTML vì option gốc có thể đang
        // "selected" ở một giá trị cũ, dễ hiển thị sai khi Vận/Hướng đã đổi qua nhiều lần.
        let vanOptions = '';
        for (let v = 1; v <= 9; v++) {
            vanOptions += `<option value="${v}"${String(v) === String(vanNhapTrach) ? ' selected' : ''}>Vận ${v}</option>`;
        }
        let huong24SonOptions = '';
        if (huong24SonSrcEl) {
            Array.from(huong24SonSrcEl.options).forEach(opt => {
                huong24SonOptions += `<option value="${opt.value}"${opt.value === String(huong24SonVal) ? ' selected' : ''}>${opt.textContent}</option>`;
            });
        }
        let namSinhChu = elGoc('namSinhChu') ? elGoc('namSinhChu').value : '';
        let canChiNamSinhChu = elGoc('canChiNamSinhChu') ? elGoc('canChiNamSinhChu').textContent : '—';
        let gioiTinhChu = elGoc('gioiTinhChu') ? elGoc('gioiTinhChu').value : 'nam';

        let ds24DongKhau = (typeof DS24_SON !== 'undefined') ? DS24_SON : [];
        let dongKhauVal = thongTinData.dongKhauTaiSon || '';
        let dongKhauSonOptions = '<option value="">— Chọn sơn —</option>' + ds24DongKhau.map(s =>
            `<option value="${s.ten}"${s.ten === dongKhauVal ? ' selected' : ''}>${s.ten}</option>`).join('');

        return `
        <div style="margin-bottom:8px;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
                <input type="number" id="ttInNamNhapTrach" value="${escapeHtmlTT(namNhapTrach)}" placeholder="Năm NT" title="Năm nhập trạch" oninput="thongTinDoiNamNhapTrach(this.value)" style="width:55px;flex:none;padding:6px 2px;border:1px solid #ccc;border-radius:6px;font-size:12px;text-align:center;">
                <select id="ttInVanNhapTrach" title="Vận nhập trạch" onchange="thongTinDoiVanNhapTrach(this.value)" style="width:60px;flex:none;padding:6px 0;border:1px solid #ccc;border-radius:6px;font-size:12px;">${vanOptions}</select>
                <select id="ttInHuong24Son" title="Hướng nhà (24 sơn)" onchange="thongTinDoiHuong24Son(this.value)" style="width:118px;flex:none;padding:6px 0;border:1px solid #ccc;border-radius:6px;font-size:12px;">${huong24SonOptions}</select>
                <input type="number" id="ttInDoSoTay" value="${escapeHtmlTT(doSoTay)}" min="0" max="360" title="Độ hướng" oninput="thongTinDoiDoSoTay(this.value)" style="width:45px;flex:none;padding:6px 2px;border:1px solid #ccc;border-radius:6px;font-size:12px;text-align:center;">
            </div>
            <div style="font-size:10px;color:#999;margin-top:3px;">Năm/Vận nhập trạch — Hướng nhà/Độ hướng · 🔄 đồng bộ với tab Nội Khí</div>
        </div>

        <div style="border-top:1px dashed #e3d5c0;padding-top:8px;margin-top:8px;">
            <label style="font-size:12px;font-weight:700;color:#5c4a3a;display:block;margin-bottom:4px;">🚪 Động khẩu tại<span class="nut-info" onclick='moInfoModal("🚪 Động khẩu tại", ${JSON.stringify(escapeHtmlTT("Dương trạch thì lấy động khẩu của đường phố làm tiêu chuẩn lập hướng; Âm Trạch thì phải xem Lai long - khứ thủy."))})'>i</span></label>
            <select id="ttInDongKhauTaiSon" title="Động khẩu tại (24 sơn)" onchange="thongTinDoiDongKhauTaiSon(this.value)" style="width:100%;padding:6px 4px;border:1px solid #ccc;border-radius:6px;font-size:12px;">${dongKhauSonOptions}</select>
        </div>

        <div style="border-top:1px dashed #e3d5c0;padding-top:8px;margin-top:8px;">
            <label style="font-size:12px;font-weight:700;color:#5c4a3a;display:block;margin-bottom:4px;">👤 Gia chủ</label>
            <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
                <input type="number" id="ttInNamSinhChu" value="${escapeHtmlTT(namSinhChu)}" placeholder="Năm sinh" title="Năm sinh" oninput="thongTinDoiNamSinhChu(this.value)" style="width:64px;flex:none;padding:6px 2px;border:1px solid #ccc;border-radius:6px;font-size:12px;text-align:center;">
                <span id="ttInCanChiNamSinhChu" title="Can Chi năm sinh" style="width:70px;flex:none;padding:6px 2px;font-size:11px;font-weight:600;color:#5c4a3a;background:#f5f0e6;border-radius:6px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtmlTT(canChiNamSinhChu)}</span>
                <select id="ttInGioiTinhChu" title="Giới tính" onchange="thongTinDoiGioiTinhChu(this.value)" style="width:56px;flex:none;padding:6px 0;border:1px solid #ccc;border-radius:6px;font-size:12px;">
                    <option value="nam"${gioiTinhChu === 'nam' ? ' selected' : ''}>Nam</option>
                    <option value="nu"${gioiTinhChu === 'nu' ? ' selected' : ''}>Nữ</option>
                </select>
            </div>
            <div id="ttInCungMenh" style="margin-top:6px;">${renderCungMenhHtml(namSinhChu, gioiTinhChu)}</div>
        </div>`;
    }

    // ==== CUNG MỆNH — tính từ năm sinh dương lịch + giới tính (window.tinhMenhQuai, xem shared.js) ====
    function renderCungMenhHtml(namSinhChu, gioiTinhChu) {
        if (typeof window.tinhMenhQuai !== 'function') return '';
        let mq = window.tinhMenhQuai(namSinhChu, gioiTinhChu);
        if (!mq) {
            return `<div style="font-size:11px;color:#999;">Nhập năm sinh để tính Cung Mệnh.</div>`;
        }
        let mauNhom = mq.nhom === 'Đông Tứ Mệnh' ? '#2e7d32' : '#8b0000';
        let nenNhom = mq.nhom === 'Đông Tứ Mệnh' ? '#e8f5e9' : '#fdecea';
        return `<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:${nenNhom};border-radius:6px;">
            <span style="font-size:12px;font-weight:700;color:${mauNhom};">🎋 Cung Mệnh: ${mq.cung} (Quái ${mq.quaiSo}, hành ${mq.hanh})</span>
            <span style="font-size:11px;color:${mauNhom};margin-left:auto;">${mq.nhom}</span>
        </div>`;
    }

    // ==== MẶT BẰNG — state riêng, áp dụng sang Cửu Cung Lưới khi xác nhận ====
    window.thongTinCapNhatMatBang = function (key, value) {
        thongTinData.matBang[key] = value;
    };

    window.thongTinApDungMatBang = function () {
        let mb = thongTinData.matBang;
        let dai = parseFloat(mb.daiM), rong = parseFloat(mb.rongM);
        let tenShape = { rect: 'Chữ Nhật', L: 'Hình L', sevenSides: '7 cạnh' }[mb.shape] || mb.shape;
        let dienGiai = 'Áp dụng Mặt bằng "' + tenShape + '"'
            + (mb.shape === 'rect' && dai > 0 && rong > 0 ? ' (' + dai + 'm × ' + rong + 'm)' : '')
            + (mb.sonCua ? ', Cửa chính sơn ' + mb.sonCua : '') + '?';
        let canhBao = '\n\n⚠️ Thao tác này sẽ VẼ LẠI hình dạng nhà ở tab 🀄 Cửu Cung Lưới — mọi chỉnh sửa tay (đỉnh, cửa, phòng) đã có ở đó sẽ bị THAY THẾ.';
        if (!confirm(dienGiai + canhBao)) return;
        if (typeof window.apDungKhaiBaoNhanhCC !== 'function') {
            alert('⚠️ Không tìm thấy Cửu Cung Lưới (js/cuu-cung-luoi.js) — chưa thể áp dụng.');
            return;
        }
        window.apDungKhaiBaoNhanhCC(mb.shape, dai, rong, mb.sonCua || null);
        alert('✅ Đã áp dụng Mặt bằng sang tab Cửu Cung Lưới.');
    };

    // Cửu Cung Lưới đổi shape/kích thước/cửa trực tiếp -> tab Thông Tin tự đọc lại để hiển thị đúng.
    // Không hỏi xác nhận theo chiều này (Thông Tin chỉ hiển thị theo, không phải nơi khởi phát đổi).
    window.thongTinDongBoTuCuuCung = function () {
        if (typeof window.layThongTinMatBangCC !== 'function') return;
        let mb = window.layThongTinMatBangCC();
        thongTinData.matBang.shape = mb.shape || thongTinData.matBang.shape;
        thongTinData.matBang.daiM = mb.daiM || thongTinData.matBang.daiM;
        thongTinData.matBang.rongM = mb.rongM || thongTinData.matBang.rongM;
        thongTinData.matBang.sonCua = mb.sonCua || thongTinData.matBang.sonCua;
        let box = document.getElementById('ttMatBangBox');
        if (box) box.innerHTML = renderMatBangHtml();
    };

    function renderMatBangHtml() {
        let mb = thongTinData.matBang;
        let ds24 = (typeof DS24_SON !== 'undefined') ? DS24_SON : [];
        let sonOpts = '<option value="">Cửa: —</option>' + ds24.map(s =>
            `<option value="${s.ten}"${s.ten === mb.sonCua ? ' selected' : ''}>Cửa: ${s.ten}</option>`).join('');
        return `
        <div style="margin-bottom:8px;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
                <select title="Hình dạng mặt bằng" onchange="thongTinCapNhatMatBang('shape', this.value)" style="width:85px;flex:none;padding:6px 0;border:1px solid #ccc;border-radius:6px;font-size:12px;">
                    <option value="rect"${mb.shape === 'rect' ? ' selected' : ''}>Chữ Nhật</option>
                    <option value="L"${mb.shape === 'L' ? ' selected' : ''}>Hình L</option>
                    <option value="sevenSides"${mb.shape === 'sevenSides' ? ' selected' : ''}>7 cạnh</option>
                </select>
                <input type="number" step="0.1" min="1" title="Chiều dài (m)" placeholder="Dài m" value="${escapeHtmlTT(mb.daiM)}" oninput="thongTinCapNhatMatBang('daiM', this.value)" style="width:52px;flex:none;padding:6px 2px;border:1px solid #ccc;border-radius:6px;font-size:12px;text-align:center;">
                <input type="number" step="0.1" min="1" title="Chiều rộng (m)" placeholder="Rộng m" value="${escapeHtmlTT(mb.rongM)}" oninput="thongTinCapNhatMatBang('rongM', this.value)" style="width:52px;flex:none;padding:6px 2px;border:1px solid #ccc;border-radius:6px;font-size:12px;text-align:center;">
                <select title="Cửa chính — sơn" onchange="thongTinCapNhatMatBang('sonCua', this.value)" style="width:90px;flex:none;padding:6px 0;border:1px solid #ccc;border-radius:6px;font-size:12px;">${sonOpts}</select>
            </div>
            <div style="font-size:10px;color:#999;margin-top:3px;">Hình dạng — Dài × Rộng — Cửa chính (sơn)</div>
        </div>
        <button onclick="thongTinApDungMatBang()" style="width:100%;background:#8b0000;color:#fff;border:none;border-radius:6px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">📐 Áp dụng sang Cửu Cung Lưới</button>
        <div style="font-size:10px;color:#999;margin-top:4px;">⚠️ Sẽ hỏi xác nhận trước khi ghi đè hình vẽ ở Cửu Cung Lưới.</div>`;
    }

    // ==== RENDER TỪNG PHẦN (ghi chú tự do — giữ nguyên như cũ) ====
    function thongTinRenderSuKien() {
        let el = document.getElementById('ttSuKienList');
        if (!el) return;
        if (thongTinData.suKien.length === 0) {
            el.innerHTML = '<div style="font-size:12px; color:#999; padding:4px 2px;">Chưa có sự kiện nào. VD: "2023 — sửa lại bếp", "2024 — sinh con thứ 2"...</div>';
            return;
        }
        let html = '';
        thongTinData.suKien.forEach(item => {
            html += `<div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
                <input type="text" value="${escapeHtmlTT(item.nam)}" placeholder="Năm" oninput="thongTinCapNhatSuKien(${item.id}, 'nam', this.value)" style="width:64px; padding:5px 6px; border:1px solid #ccc; border-radius:6px; font-size:12px; flex-shrink:0;">
                <input type="text" value="${escapeHtmlTT(item.noiDung)}" placeholder="Sự kiện xảy ra năm đó..." oninput="thongTinCapNhatSuKien(${item.id}, 'noiDung', this.value)" style="flex:1; min-width:0; padding:5px 8px; border:1px solid #ccc; border-radius:6px; font-size:12px;">
                <button onclick="thongTinXoaSuKien(${item.id})" title="Xóa sự kiện này" style="background:#e53935; border:1px solid #ff8a80; color:#fff; cursor:pointer; font-size:13px; font-weight:bold; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; padding:0;">✕</button>
            </div>`;
        });
        el.innerHTML = html;
    }

    function thongTinRenderHuong() {
        let el = document.getElementById('ttHuongList');
        if (!el) return;
        if (thongTinData.huongInfo.length === 0) {
            el.innerHTML = '<div style="font-size:12px; color:#999; padding:4px 2px;">Chưa có ghi chú hướng nào. VD: "Sửu — có hồ, cách nhà 10m", "Cấn — đặt bếp"...</div>';
            return;
        }
        let dsSon = (typeof DS24_SON !== 'undefined') ? DS24_SON : [];
        let html = '';
        thongTinData.huongInfo.forEach(item => {
            let selectHtml = `<select onchange="thongTinCapNhatHuong(${item.id}, 'huong', this.value)" style="width:78px; padding:5px 4px; border:1px solid #ccc; border-radius:6px; font-size:12px; flex-shrink:0;">`;
            dsSon.forEach(s => {
                selectHtml += `<option value="${s.ten}"${s.ten === item.huong ? ' selected' : ''}>${s.ten}</option>`;
            });
            selectHtml += `</select>`;
            html += `<div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
                ${selectHtml}
                <input type="text" value="${escapeHtmlTT(item.noiDung)}" placeholder="VD: có hồ cách nhà 10m" oninput="thongTinCapNhatHuong(${item.id}, 'noiDung', this.value)" style="flex:1; min-width:0; padding:5px 8px; border:1px solid #ccc; border-radius:6px; font-size:12px;">
                <button onclick="thongTinXoaHuong(${item.id})" title="Xóa ghi chú này" style="background:#e53935; border:1px solid #ff8a80; color:#fff; cursor:pointer; font-size:13px; font-weight:bold; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; padding:0;">✕</button>
            </div>`;
        });
        el.innerHTML = html;
    }

    // ==== RENDER TOÀN BỘ TAB ====
    function thongTinRenderTab() {
        let tab = document.getElementById('tab-thongtin');
        if (!tab) return;
        let d = thongTinData;

        let html = `
      <div style="padding:10px; max-width:520px; margin:0 auto;">
        <h2 style="color:#8b0000; margin-bottom:2px; font-size:16px;">📝 Thông Tin Nhà</h2>
        <p style="font-size:11px; color:#666; margin-bottom:8px; line-height:1.4;">Khai báo ban đầu cho toàn bộ hồ sơ — các tab khác tự lấy dữ liệu từ đây.</p>

        <div style="background:#fff; border:1px solid #e3d5c0; border-radius:10px; padding:10px; margin-bottom:8px;">
            <span style="font-size:12px; font-weight:700; color:#8b0000; display:block; margin-bottom:6px;">🏠 Trạch nhà</span>
            <div id="ttTrachNhaBox">${renderTrachNhaGiaChuHtml()}</div>
            <span style="font-size:12px; font-weight:700; color:#8b0000; display:block; margin:10px 0 6px; border-top:1px dashed #e3d5c0; padding-top:8px;">📐 Mặt bằng</span>
            <div id="ttMatBangBox">${renderMatBangHtml()}</div>
        </div>

        <div style="background:#fff; border:1px solid #e3d5c0; border-radius:10px; padding:10px; margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-size:12px; font-weight:700; color:#1565c0;">📅 Sự kiện theo năm</span>
                <button onclick="thongTinThemSuKien()" style="background:#1565c0; color:#fff; border:none; border-radius:6px; padding:6px 10px; font-size:11px; font-weight:600; cursor:pointer;">+ Thêm</button>
            </div>
            <div id="ttSuKienList"></div>
        </div>

        <div style="background:#fff; border:1px solid #e3d5c0; border-radius:10px; padding:10px; margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-size:12px; font-weight:700; color:#1a5c3a;">🧭 Ghi chú theo hướng</span>
                <button onclick="thongTinThemHuong()" style="background:#1a5c3a; color:#fff; border:none; border-radius:6px; padding:6px 10px; font-size:11px; font-weight:600; cursor:pointer;">+ Thêm</button>
            </div>
            <div id="ttHuongList"></div>
        </div>

        <div style="background:#fff; border:1px solid #e3d5c0; border-radius:10px; padding:10px; margin-bottom:8px;">
            <span style="font-size:12px; font-weight:700; color:#555; display:block; margin-bottom:4px;">🗒️ Ghi chú chung</span>
            <textarea id="ttGhiChu" rows="4" placeholder="Ghi chú tự do khác về ngôi nhà..." oninput="thongTinCapNhatTruong('ghiChu', this.value)" style="width:100%; padding:7px; border:1px solid #ccc; border-radius:6px; font-size:12px; resize:vertical; box-sizing:border-box; font-family:inherit;">${escapeHtmlTT(d.ghiChu)}</textarea>
        </div>
      </div>
        `;
        tab.innerHTML = html;
        thongTinRenderSuKien();
        thongTinRenderHuong();
    }
    window.thongTinRenderTab = thongTinRenderTab;

    // ==== LƯU / KHÔI PHỤC (dùng bởi ho-so.js — Hồ Sơ Nhà) ====
    // Lưu ý: Trạch nhà + Gia chủ KHÔNG lưu riêng ở đây nữa — chúng đã thuộc state chung của
    // phi-tinh.js (namNhapTrach, vanNhapTrach, doSoTay, namSinhChu, gioiTinhChu) và được ho-so.js
    // lưu/khôi phục thông qua layStatePhiTinh()/apDungStatePhiTinh() như trước giờ. Ở đây chỉ lưu
    // phần dữ liệu riêng của tab này: Mặt bằng (bản khai báo cuối, để mở lại hồ sơ vẫn thấy đúng
    // giá trị đã nhập dù chưa "Áp dụng"), Ghi chú, Sự kiện, Ghi chú theo hướng.
    function layStateThongTin() {
        return JSON.parse(JSON.stringify(thongTinData));
    }
    window.layStateThongTin = layStateThongTin;

    function apDungStateThongTin(obj) {
        thongTinData = {
            ghiChu: (obj && obj.ghiChu) || '',
            suKien: (obj && Array.isArray(obj.suKien)) ? obj.suKien.map(x => ({ id: ttNextId++, nam: x.nam || '', noiDung: x.noiDung || '' })) : [],
            huongInfo: (obj && Array.isArray(obj.huongInfo)) ? obj.huongInfo.map(x => ({ id: ttNextId++, huong: x.huong || '', noiDung: x.noiDung || '' })) : [],
            matBang: (obj && obj.matBang) ? Object.assign({ shape: 'rect', daiM: 10, rongM: 8, sonCua: '' }, obj.matBang) : { shape: 'rect', daiM: 10, rongM: 8, sonCua: '' },
            dongKhauTaiSon: (obj && obj.dongKhauTaiSon) || ''
        };
        thongTinRenderTab();
    }
    window.apDungStateThongTin = apDungStateThongTin;

    // ==== AUTO-REFRESH khi chuyển vào tab này ====
    // Đảm bảo mỗi lần mở tab "📝 Thông Tin" đều đọc lại giá trị MỚI NHẤT từ input gốc bên tab
    // Nội Khí (Vận/Năm nhập trạch, Hướng, Gia chủ) và từ Cửu Cung Lưới (Mặt bằng). Dùng
    // MutationObserver theo dõi class "active" của chính #tab-thongtin — KHÔNG đụng vào hàm
    // chuyenTab() toàn cục (tránh nguy cơ can thiệp làm hỏng cơ chế ẩn/hiện tab của app).
    function _ttKhoiTaoAutoRefresh() {
        let tabEl = document.getElementById('tab-thongtin');
        if (!tabEl) { setTimeout(_ttKhoiTaoAutoRefresh, 300); return; }
        let dangActive = tabEl.classList.contains('active');
        let observer = new MutationObserver(function () {
            let active = tabEl.classList.contains('active');
            if (active && !dangActive) { // vừa chuyển VÀO tab này
                try {
                    thongTinRenderTab();
                    if (typeof window.thongTinDongBoTuCuuCung === 'function') window.thongTinDongBoTuCuuCung();
                } catch (e) {
                    console.error('Lỗi tự-refresh tab Thông Tin:', e);
                }
            }
            dangActive = active;
        });
        observer.observe(tabEl, { attributes: true, attributeFilter: ['class'] });
    }
    _ttKhoiTaoAutoRefresh();
})();
