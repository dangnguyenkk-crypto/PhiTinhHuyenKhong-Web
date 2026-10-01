// ====================================================================
// kham-du.js — TAB RIÊNG cho la bàn Kham Dư
// Tách ra từ thuy-phap.js để tiện nghiên cứu độc lập (file ngắn, đỡ tốn
// token khi trao đổi). CHỈ chứa la bàn Kham Dư — không có Thủy Khẩu,
// Đa Giác Nhà, Trường Sinh, Bát Trạch (những cái đó vẫn ở thuy-phap.js).
//
// Phụ thuộc duy nhất từ bên ngoài: DS24_SON (định nghĩa trong shared.js,
// phải load TRƯỚC file này trong index.html).
//
// HTML tối thiểu cần có (đặt trong index.html, xem hướng dẫn cuối file):
//   <div id="tab-khamdu" class="tab-content">
//     <div id="khamDuContainer"></div>
//   </div>
// ====================================================================

(function() {

    // ---- BẢNG 72 LONG (60 Long Lục Thập Giáp Tý + 12 ô Không Vong = null) ----
    // Nguồn: bảng tra La Kinh do Ka cung cấp (đã đối chiếu khớp 100% với danh sách 12 ô
    // Không Vong công bố kèm bảng gốc: 2,8,14,20,26,32,38,44,50,56,62,68).
    // Mảng theo đúng thứ tự 72 ô liên tục quanh vòng tròn, bắt đầu từ ô đầu tiên (ô 1,
    // góc 337.5°-342.5°, đầu sơn Nhâm) đi theo chiều kim đồng hồ. index 0 = ô số 1.
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

    // ---- NGŨ HÀNH CỦA BÁT QUÁI (Hậu Thiên) — dùng cho khối thống kê Tọa/Hướng bên dưới la
    // bàn. Khảm=Thủy, Khôn=Thổ, Chấn=Mộc, Tốn=Mộc, Càn=Kim, Đoài=Kim, Cấn=Thổ, Ly=Hỏa.
    const NGU_HANH_BAT_QUAI = { "Khảm":"Thủy", "Khôn":"Thổ", "Chấn":"Mộc", "Tốn":"Mộc", "Càn":"Kim", "Đoài":"Kim", "Cấn":"Thổ", "Ly":"Hỏa" };

    // ---- BẢNG TAM BÀN QUÁI (Giang Đông / Giang Tây / Nam Bắc) ----
    const TAM_BAN_QUAI = {
        "Sửu":"Giang Đông","Cấn":"Giang Đông","Dần":"Giang Đông","Giáp":"Giang Đông",
        "Mão":"Giang Đông","Ất":"Giang Đông","Thìn":"Giang Đông","Tốn":"Giang Đông",
        "Mùi":"Giang Tây","Khôn":"Giang Tây","Thân":"Giang Tây","Canh":"Giang Tây",
        "Dậu":"Giang Tây","Tân":"Giang Tây","Tuất":"Giang Tây","Càn":"Giang Tây",
        "Hợi":"Nam Bắc","Nhâm":"Nam Bắc","Tý":"Nam Bắc","Quý":"Nam Bắc",
        "Tị":"Nam Bắc","Tỵ":"Nam Bắc","Bính":"Nam Bắc","Ngọ":"Nam Bắc","Đinh":"Nam Bắc"
    };
    const MAU_TAM_BAN_QUAI = { "Giang Đông":"#2e7d32", "Giang Tây":"#c62828", "Nam Bắc":"#1565c0" };

    // ---- BẢNG NGŨ HÀNH CỦA 24 SƠN — dùng để tô nền vòng 24 Sơn/Địa bàn VÀ để tra trong khối
    // thống kê Tọa/Hướng bên dưới la bàn. Có 2 TRƯỜNG PHÁI khác nhau, chuyển qua lại bằng nút
    // (xem kdCheDoSon/kdToggleCheDoSon phía dưới):
    //
    // (A) TIỂU HUYỀN KHÔNG (theo đúng 5 nhóm người dùng cung cấp trước đây cho tab Kham Dư,
    //     KHÁC bảng Ngũ Hành Sơn dùng ở tab Thủy Pháp):
    //   Kim:  Càn, Khôn, Mão, Ngọ
    //   Mộc:  Hợi, Giáp, Cấn, Quý
    //   Thổ:  Tuất, Canh, Sửu, Mùi
    //   Thủy: Tý, Dần, Thìn, Tốn, Tân, Tị, Thân, Nhâm
    //   Hỏa:  Bính, Đinh, Dậu, Ất
    // (Đủ 4+4+4+8+4 = 24 sơn, không trùng/thiếu. Có thêm khóa "Tỵ" trùng "Tị" để phòng dữ liệu
    // DS24_SON dùng cách viết khác — xem TAM_BAN_QUAI ở trên cũng làm tương tự.)
    const NGU_HANH_24_SON_TIEU_HUYEN_KHONG = {
        "Càn":"Kim", "Khôn":"Kim", "Mão":"Kim", "Ngọ":"Kim",
        "Hợi":"Mộc", "Giáp":"Mộc", "Cấn":"Mộc", "Quý":"Mộc",
        "Tuất":"Thổ", "Canh":"Thổ", "Sửu":"Thổ", "Mùi":"Thổ",
        "Tý":"Thủy", "Dần":"Thủy", "Thìn":"Thủy", "Tốn":"Thủy", "Tân":"Thủy", "Tị":"Thủy", "Tỵ":"Thủy", "Thân":"Thủy", "Nhâm":"Thủy",
        "Bính":"Hỏa", "Đinh":"Hỏa", "Dậu":"Hỏa", "Ất":"Hỏa"
    };
    // Màu nền NHẠT (pastel) — dùng cho nền cả ô 24 Sơn, khác với MAU_NGU_HANH (màu đậm, dùng cho
    // chữ/vòng Long 72 phía trên) để không bị chói khi tô cả nền. Cùng tông màu pastel đã dùng
    // cho Ngũ Hành Long ở tab Thủy Pháp để nhất quán trong toàn app.
    const MAU_NGU_HANH_24_SON_TIEU_HUYEN_KHONG = { "Kim":"#ffe082", "Mộc":"#a5d6a7", "Thổ":"#d7ccc8", "Thủy":"#90caf9", "Hỏa":"#ef9a9a" };

    // Công dụng (theo người dùng): Đại Huyền Không dùng để định Thủy Đến/Thủy Đi, áp dụng cho
    // cả Âm Trạch (mộ phần) lẫn Dương Trạch (nhà ở) — xem ghi chú tương ứng hiển thị trong
    // khối thống kê (#kdThongKe) khi kdCheDoSon === "dai".
    // (B) ĐẠI HUYỀN KHÔNG (nhóm khác hẳn Tiểu Huyền Không ở trên — theo đúng người dùng cung
    //     cấp). Lưu ý: nhóm "Thổ và Thủy" người dùng gộp CHUNG 1 nhóm duy nhất (không tách
    //     riêng Thổ/Thủy như bên Tiểu Huyền Không), nên dùng nhãn ghép "Thổ/Thủy" cho nhóm này.
    //     Riêng chữ "Tân" trong nhóm Mộc người dùng gõ trùng 2 lần trong tin nhắn gốc — đối chiếu
    //     lại với đủ 24 sơn thì còn thiếu đúng 1 sơn "Thân" (chưa xuất hiện ở nhóm nào khác), nên
    //     mình suy đoán đó là lỗi gõ nhầm Tân/Thân và đã điền "Thân" vào chỗ đó cho đủ 24 sơn,
    //     không trùng/thiếu — ĐÃ dối chiếu lại bằng script, khớp 100% với TAM_BAN_QUAI. Nếu ý
    //     người dùng khác, cần sửa lại dòng Mộc bên dưới:
    //   Kim:      Tý, Dần, Thìn, Cấn, Bính, Ất
    //   Mộc:      Ngọ, Tân, Tuất, Khôn, Nhâm, Thân (suy đoán — xem ghi chú trên)
    //   Thổ/Thủy: Mão, Tị, Sửu, Càn, Canh, Đinh
    //   Hỏa:      Dậu, Hợi, Mùi, Tốn, Giáp, Quý
    const NGU_HANH_24_SON_DAI_HUYEN_KHONG = {
        "Tý":"Kim", "Dần":"Kim", "Thìn":"Kim", "Cấn":"Kim", "Bính":"Kim", "Ất":"Kim",
        "Ngọ":"Mộc", "Tân":"Mộc", "Tuất":"Mộc", "Khôn":"Mộc", "Nhâm":"Mộc", "Thân":"Mộc",
        "Mão":"Thổ/Thủy", "Tị":"Thổ/Thủy", "Tỵ":"Thổ/Thủy", "Sửu":"Thổ/Thủy", "Càn":"Thổ/Thủy", "Canh":"Thổ/Thủy", "Đinh":"Thổ/Thủy",
        "Dậu":"Hỏa", "Hợi":"Hỏa", "Mùi":"Hỏa", "Tốn":"Hỏa", "Giáp":"Hỏa", "Quý":"Hỏa"
    };
    // Nhóm "Thổ/Thủy" dùng 1 màu riêng (xanh-xám pha) vì không thuộc hẳn về 1 trong 5 màu Ngũ
    // Hành chuẩn — không dùng lại màu Thổ hay Thủy riêng lẻ để tránh gây hiểu lầm là thuần 1 hành.
    const MAU_NGU_HANH_24_SON_DAI_HUYEN_KHONG = { "Kim":"#ffe082", "Mộc":"#a5d6a7", "Thổ/Thủy":"#b0bec5", "Hỏa":"#ef9a9a" };

    // Chế độ đang chọn cho vòng 24 Sơn + khối thống kê Tọa/Hướng: "tieu" (mặc định, giữ nguyên
    // hành vi cũ) hoặc "dai". Nút bấm đổi chế độ nằm trong khoiTaoGiaoDienKhamDu(), xem
    // kdToggleCheDoSon() cuối file (gần các hàm window.kd... khác).
    let kdCheDoSon = "tieu";

    // ---- 12 Song Sơn của Thiên Bàn (lệch +7.5° so với Địa bàn), dùng riêng để đo
    // Thủy (Nước Đến/Đi), không dùng để đo Tọa/Hướng.
    const SONG_SON_12 = [
        {ten:"Nhâm-Tý", goc:0},{ten:"Quý-Sửu", goc:30},{ten:"Cấn-Dần", goc:60},{ten:"Giáp-Mão", goc:90},
        {ten:"Ất-Thìn", goc:120},{ten:"Tốn-Tị", goc:150},{ten:"Bính-Ngọ", goc:180},{ten:"Đinh-Mùi", goc:210},
        {ten:"Khôn-Thân", goc:240},{ten:"Canh-Dậu", goc:270},{ten:"Tân-Tuất", goc:300},{ten:"Kiền-Hợi", goc:330}
    ];
    const LECH_THIEN_BAN = 7.5; // Thiên bàn xoay lệch 7.5° theo chiều kim đồng hồ so với Địa bàn

    // Thiên Bàn luôn hiển thị mặc định (không có toggle bật/tắt).
    const hienThiThienBanKhamDu = true;

    // ---- Local: quy đổi góc → sơn 24 gần nhất (độc lập, không phụ thuộc thuy-phap.js) ----
    function timSonTheoGocCucBo(goc) {
        let g = ((goc%360)+360)%360, best = DS24_SON[0], bestDiff = 999;
        DS24_SON.forEach(s => { let diff = Math.min(Math.abs(g-s.goc), 360-Math.abs(g-s.goc)); if (diff<bestDiff){bestDiff=diff;best=s;} });
        return best;
    }
    function laySonToa(houseFacing) {
        let gocToa = (houseFacing + 180) % 360;
        return timSonTheoGocCucBo(gocToa);
    }

    // ---- Cỡ chữ & độ mờ nền — điều khiển riêng cho tab Kham Dư (không dùng chung với
    // tpFontSize/doMoNenLaBan của tab Thủy Pháp, để 2 tab hoàn toàn độc lập nhau). ----
    let kdFontSize = 10;
    let kdDoMoNen = 0.5;

    function damBaoSvgKhamDuTonTai() {
        let svg = document.getElementById("kdCompassSvg");
        if (svg) return svg;
        let overlay = document.getElementById("kdCompassOverlay");
        if (!overlay) return null;
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", "kdCompassSvg");
        svg.setAttribute("viewBox", "0 0 1000 1000");
        svg.style.position = "absolute"; svg.style.top = "0"; svg.style.left = "0";
        svg.style.width = "100%"; svg.style.height = "100%";
        overlay.appendChild(svg);
        return svg;
    }

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
        const rThienBanTrong = 385, rThienBanNgoai = 420;
        const rOuter = hienThiThienBanKhamDu ? rThienBanNgoai : rLong72Ngoai;
        const rDoTick = rOuter, rDoText = rOuter + 22, rDoSo = rOuter + 10;

        let houseFacing = parseFloat(document.getElementById("kdHouseFacing")?.value) || 0;
        let tpFontSize = kdFontSize;
        let doMoNenLaBan = kdDoMoNen;

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

        // ---- VÒNG THIÊN BÀN (Song Sơn, lệch +7.5° so với Địa bàn) ----
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
                html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rThienBanNgoai},${rThienBanNgoai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rThienBanTrong},${rThienBanTrong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNenTB}" fill-opacity="0.85" stroke="${mauVienTB}" stroke-width="1.2"/>`;
                let x1b = cx + rThienBanTrong * Math.cos(rs), y1b = cy + rThienBanTrong * Math.sin(rs);
                let x2b = cx + rThienBanNgoai * Math.cos(rs), y2b = cy + rThienBanNgoai * Math.sin(rs);
                html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#3a2a1a" stroke-width="0.8" opacity="0.7"/>`;
                let radT = (gocTam - 90) * Math.PI / 180;
                let rTextTB = (rThienBanTrong + rThienBanNgoai) / 2;
                let xT = cx + rTextTB * Math.cos(radT), yT = cy + rTextTB * Math.sin(radT);
                let gocChuanTB = ((gocTam % 360) + 360) % 360;
                let gocChuTB = (gocChuanTB > 90 && gocChuanTB < 270) ? gocTam + 180 : gocTam;
                html += `<g transform="rotate(${gocChuTB} ${xT.toFixed(1)} ${yT.toFixed(1)})"><text x="${xT.toFixed(1)}" y="${yT.toFixed(1)}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="800" fill="${mauVienTB}" stroke="#fff" stroke-width="${(tpFontSize*0.85*0.3).toFixed(1)}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${ss.ten}</text></g>`;
            });
        }

        // ---- VÒNG 72 LONG ----
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
            html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rLong72Ngoai},${rLong72Ngoai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rLong72Trong},${rLong72Trong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${doMoNen}" stroke="#3a2a1a" stroke-width="0.6"/>`;
            let gocTam = gocStart + 2.5;
            let radT = (gocTam - 90) * Math.PI / 180;
            let rTextL72 = (rLong72Trong + rLong72Ngoai) / 2;
            let xL = cx + rTextL72 * Math.cos(radT), yL = cy + rTextL72 * Math.sin(radT);
            let nhanLong = laKhongVong ? "KV" : tenLong;
            let mauChu = laKhongVong ? "#fff" : "#2a1a0a";
            let gocChuan72 = ((gocTam % 360) + 360) % 360;
            let gocChuL72 = (gocChuan72 > 180) ? gocTam + 90 : gocTam - 90;
            let vienChuL72 = laKhongVong ? "none" : "#fff";
            let dayVienChuL72 = (tpFontSize*0.85*0.28).toFixed(1);
            html += `<g transform="rotate(${gocChuL72} ${xL.toFixed(1)} ${yL.toFixed(1)})"><text x="${xL.toFixed(1)}" y="${yL.toFixed(1)}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="700" fill="${mauChu}" stroke="${vienChuL72}" stroke-width="${vienChuL72==='none'?0:dayVienChuL72}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${nhanLong}</text></g>`;
        }

        // ---- VÒNG TAM BÀN QUÁI (Giang Đông / Giang Tây / Nam Bắc) ----
        DS24_SON.forEach(function(s) {
            let gocStart = s.goc - 7.5, gocEnd = s.goc + 7.5;
            let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
            let xsO = cx + rTamBanQuai * Math.cos(rs), ysO = cy + rTamBanQuai * Math.sin(rs);
            let xeO = cx + rTamBanQuai * Math.cos(re), yeO = cy + rTamBanQuai * Math.sin(re);
            let xsI = cx + rNguyenLong * Math.cos(re), ysI = cy + rNguyenLong * Math.sin(re);
            let xeI = cx + rNguyenLong * Math.cos(rs), yeI = cy + rNguyenLong * Math.sin(rs);
            let tenNhom = TAM_BAN_QUAI[s.ten] || "";
            let mauNen = MAU_TAM_BAN_QUAI[tenNhom] || "#cfcfcf";
            html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rTamBanQuai},${rTamBanQuai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rNguyenLong},${rNguyenLong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${Math.max(doMoNenLaBan*0.5,0.2)}" stroke="#3a2a1a" stroke-width="0.6"/>`;
        });
        [
            {ten:"Giang Đông", gocGiua: (DS24_SON.find(s=>s.ten==="Cấn").goc + DS24_SON.find(s=>s.ten==="Tốn").goc)/2},
            {ten:"Giang Tây", gocGiua: (DS24_SON.find(s=>s.ten==="Khôn").goc + DS24_SON.find(s=>s.ten==="Càn").goc)/2},
            {ten:"Nam Bắc", gocGiua: 0}
        ].forEach(function(nhom) {
            let rTextTBQ = (rNguyenLong + rTamBanQuai) / 2;
            function veNhanTamBanQuai(gocGiua, nhan) {
                let radG = (gocGiua - 90) * Math.PI / 180;
                let xN = cx + rTextTBQ * Math.cos(radG), yN = cy + rTextTBQ * Math.sin(radG);
                let gocChuanTBQ = ((gocGiua % 360) + 360) % 360;
                let gocChu = (gocChuanTBQ > 90 && gocChuanTBQ < 270) ? gocGiua + 180 : gocGiua;
                html += `<g transform="rotate(${gocChu} ${xN.toFixed(1)} ${yN.toFixed(1)})"><text x="${xN.toFixed(1)}" y="${yN.toFixed(1)}" font-size="${(tpFontSize*0.8).toFixed(1)}" font-weight="800" fill="${MAU_TAM_BAN_QUAI[nhan]||'#333'}" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${nhan}</text></g>`;
            }
            veNhanTamBanQuai(nhom.gocGiua, nhom.ten);
        });

        // ---- VÒNG TAM NGUYÊN LONG (Thiên/Địa/Nhân) ----
        const NGUYEN_LONG_TAT = { "Thien":"T", "Dia":"Đ", "Nhan":"N" };
        const NGUYEN_LONG_MAU = { "Thien":"#c62828", "Dia":"#1565c0", "Nhan":"#2e7d32" };
        DS24_SON.forEach(function(s) {
            let gocStart = s.goc - 7.5, gocEnd = s.goc + 7.5;
            let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
            let xsO = cx + rNguyenLong * Math.cos(rs), ysO = cy + rNguyenLong * Math.sin(rs);
            let xeO = cx + rNguyenLong * Math.cos(re), yeO = cy + rNguyenLong * Math.sin(re);
            let xsI = cx + rSon24 * Math.cos(re), ysI = cy + rSon24 * Math.sin(re);
            let xeI = cx + rSon24 * Math.cos(rs), yeI = cy + rSon24 * Math.sin(rs);
            html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rNguyenLong},${rNguyenLong} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rSon24},${rSon24} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="none" stroke="#3a2a1a" stroke-width="0.4"/>`;
            let tat = NGUYEN_LONG_TAT[s.nguyenLong] || "?";
            let mauTat = NGUYEN_LONG_MAU[s.nguyenLong] || "#555";
            let radT = (s.goc - 90) * Math.PI / 180;
            let rTextNL = (rSon24 + rNguyenLong) / 2;
            let xT = cx + rTextNL * Math.cos(radT), yT = cy + rTextNL * Math.sin(radT);
            let gocChuanNL = ((s.goc % 360) + 360) % 360;
            let gocChuNL = (gocChuanNL > 90 && gocChuanNL < 270) ? s.goc + 180 : s.goc;
            html += `<g transform="rotate(${gocChuNL} ${xT.toFixed(1)} ${yT.toFixed(1)})"><text x="${xT.toFixed(1)}" y="${yT.toFixed(1)}" font-size="${(tpFontSize*0.85).toFixed(1)}" font-weight="800" fill="${mauTat}" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${tat}</text></g>`;
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
            let laToaSon = laySonToa(houseFacing);
            let laToa = laToaSon && laToaSon.ten === s.ten;
            let laHuong = sonHienTai && sonHienTai.ten === s.ten;
            // Tô nền theo NHÓM NGŨ HÀNH của sơn (thay cho Âm/Dương trước đây), theo yêu cầu
            // người dùng — chọn 1 trong 2 bảng theo kdCheDoSon (Tiểu/Đại Huyền Không).
            let bangHanhSonDangChon = kdCheDoSon === "dai" ? NGU_HANH_24_SON_DAI_HUYEN_KHONG : NGU_HANH_24_SON_TIEU_HUYEN_KHONG;
            let bangMauSonDangChon = kdCheDoSon === "dai" ? MAU_NGU_HANH_24_SON_DAI_HUYEN_KHONG : MAU_NGU_HANH_24_SON_TIEU_HUYEN_KHONG;
            let hanh24SonKD = bangHanhSonDangChon[s.ten];
            let mauNen = bangMauSonDangChon[hanh24SonKD] || "#cfcfcf";
            let vien = laHuong ? "#c62828" : (laToa ? "#6a1b9a" : "#3a2a1a");
            let dayVien = (laHuong || laToa) ? 3.5 : 0.8;
            html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rSon24},${rSon24} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${rSon24Trong},${rSon24Trong} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" fill-opacity="${doMoNenLaBan}" stroke="${vien}" stroke-width="${dayVien}"/>`;
            let x1b = cx + rSon24Trong * Math.cos(rs), y1b = cy + rSon24Trong * Math.sin(rs);
            let x2b = cx + rSon24 * Math.cos(rs), y2b = cy + rSon24 * Math.sin(rs);
            html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#3a2a1a" stroke-width="0.6"/>`;
            let radT = (s.goc - 90) * Math.PI / 180;
            let rTextS24 = (rSon24Trong + rSon24) / 2;
            let xS = cx + rTextS24 * Math.cos(radT), yS = cy + rTextS24 * Math.sin(radT);
            let gocChuanS24 = ((s.goc % 360) + 360) % 360;
            let gocChuS24 = (gocChuanS24 > 90 && gocChuanS24 < 270) ? s.goc + 180 : s.goc;
            html += `<g transform="rotate(${gocChuS24} ${xS.toFixed(1)} ${yS.toFixed(1)})"><text x="${xS.toFixed(1)}" y="${yS.toFixed(1)}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="800" fill="${vien}" stroke="#fff" stroke-width="${(tpFontSize*1.05*0.3).toFixed(1)}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${s.ten}</text></g>`;
        });

        // ---- VÒNG TRƯỜNG SINH KHAM DƯ (12 cung Song Sơn, khởi theo Tọa) ----
        const CUC_THEO_NAPAM_KD = { "Thủy":"Thủy", "Thổ":"Thủy", "Hỏa":"Hỏa", "Kim":"Kim", "Mộc":"Mộc" };
        const SONG_SON_12_KD = ["Nhâm-Tý","Quý-Sửu","Cấn-Dần","Giáp-Mão","Ất-Thìn","Tốn-Tị","Bính-Ngọ","Đinh-Mùi","Khôn-Thân","Canh-Dậu","Tân-Tuất","Kiền-Hợi"];
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
            cucKD = CUC_THEO_NAPAM_KD[hanhLongToaKD];
            if (cucKD) {
                let canLongToaKD = tenLongToaKD.split(" ")[0];
                chieuThuanKD = DUONG_CAN_KD.includes(canLongToaKD);
                let cungKhoi = KHOI_TRUONG_SINH_KD[cucKD];
                let idxKhoi = SONG_SON_12_KD.indexOf(cungKhoi);
                bang12TruongSinhKD = {};
                const TEN_GIAI_DOAN_12 = ["Trường Sinh","Mộc Dục","Quan Đới","Lâm Quan","Đế Vượng","Suy","Bệnh","Tử","Mộ","Tuyệt","Thai","Dưỡng"];
                let buocKD = chieuThuanKD ? 1 : -1;
                for (let k = 0; k < 12; k++) {
                    let idxCung = ((idxKhoi + k * buocKD) % 12 + 12) % 12;
                    bang12TruongSinhKD[SONG_SON_12_KD[idxCung]] = TEN_GIAI_DOAN_12[k];
                }
            }
        }
        const MAU_GIAI_DOAN_KD = {
            "Trường Sinh":"#2e7d32","Mộc Dục":"#f9a825","Quan Đới":"#2e7d32","Lâm Quan":"#2e7d32","Đế Vượng":"#1565c0",
            "Suy":"#8d6e34","Bệnh":"#c62828","Tử":"#c62828","Mộ":"#8d6e34","Tuyệt":"#c62828","Thai":"#f9a825","Dưỡng":"#f9a825"
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
            let gocChuanKD = ((gocTamKD % 360) + 360) % 360;
            let gocChuKD = (gocChuanKD > 90 && gocChuanKD < 270) ? gocTamKD + 180 : gocTamKD;
            let rTenCungKD = rTruongSinhKDTrong + (rTruongSinhKDNgoai - rTruongSinhKDTrong) * 0.72;
            let rTenGiaiDoanKD = rTruongSinhKDTrong + (rTruongSinhKDNgoai - rTruongSinhKDTrong) * 0.28;
            let xTenCung = cx + rTenCungKD * Math.cos(radTKD), yTenCung = cy + rTenCungKD * Math.sin(radTKD);
            let xTenGD = cx + rTenGiaiDoanKD * Math.cos(radTKD), yTenGD = cy + rTenGiaiDoanKD * Math.sin(radTKD);
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
        const MAU_BAT_QUAI_8 = ["#8a7a5c","#8a7a5c","#8a7a5c","#8a7a5c","#8a7a5c","#8a7a5c","#8a7a5c","#8a7a5c"];
        BATQUAI_8.forEach(function(bq, idx) {
            let gocStart = bq.goc - 22.5, gocEnd = bq.goc + 22.5;
            let rs = (gocStart - 90) * Math.PI / 180, re = (gocEnd - 90) * Math.PI / 180;
            let xsO = cx + rBatQuai * Math.cos(rs), ysO = cy + rBatQuai * Math.sin(rs);
            let xeO = cx + rBatQuai * Math.cos(re), yeO = cy + rBatQuai * Math.sin(re);
            let mauNen = MAU_BAT_QUAI_8[idx];
            html += `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${rBatQuai},${rBatQuai} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${cx},${cy} Z" fill="${mauNen}" fill-opacity="${Math.max(doMoNenLaBan*0.6,0.22)}" stroke="#3a2a1a" stroke-width="0.8"/>`;
            let radT = (bq.goc - 90) * Math.PI / 180;
            // Dịch chữ Quái ra sát mép ngoài vòng Bát Quái (gần vòng Trường Sinh KD ngay bên
            // ngoài, r=rBatQuai=160) thay vì nằm giữa cung gần tâm la bàn như trước (0.65) —
            // theo yêu cầu người dùng.
            let rTextBQ = rBatQuai * 0.88;
            let xB = cx + rTextBQ * Math.cos(radT), yB = cy + rTextBQ * Math.sin(radT);
            html += `<g transform="rotate(${bq.goc} ${xB.toFixed(1)} ${yB.toFixed(1)})"><text x="${xB.toFixed(1)}" y="${yB.toFixed(1)}" font-size="${(tpFontSize*1.3).toFixed(1)}" font-weight="900" fill="#fff" stroke="#2a2a2a" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${bq.ten}</text></g>`;
        });

        // Kim chỉ hướng nhà — rút ngắn dừng lại NGAY TRƯỚC vòng chia độ (rOuter), không vượt
        // ra ngoài đè lên các số độ (0°,10°,20°...) nằm ở bán kính rDoSo→rDoText. Nhãn
        // "▲ HƯỚNG NHÀ" đặt hẳn ra ngoài rDoText để không chồng lên số độ.
        let radMui = (houseFacing - 90) * Math.PI / 180;
        let rKimHuong = rOuter - 4;
        let xHF = cx + rKimHuong * Math.cos(radMui), yHF = cy + rKimHuong * Math.sin(radMui);
        let xHB = cx - rKimHuong * Math.cos(radMui), yHB = cy - rKimHuong * Math.sin(radMui);
        html += `<line x1="${xHB.toFixed(1)}" y1="${yHB.toFixed(1)}" x2="${xHF.toFixed(1)}" y2="${yHF.toFixed(1)}" stroke="#00c8c8" stroke-width="2.5"/>`;
        let tl=14, ta=0.3;
        let x1a = xHF-tl*Math.cos(radMui-ta), y1a = yHF-tl*Math.sin(radMui-ta);
        let x2a = xHF-tl*Math.cos(radMui+ta), y2a = yHF-tl*Math.sin(radMui+ta);
        html += `<polygon points="${xHF.toFixed(1)},${yHF.toFixed(1)} ${x1a.toFixed(1)},${y1a.toFixed(1)} ${x2a.toFixed(1)},${y2a.toFixed(1)}" fill="#00c8c8"/>`;
        let xLH = cx+(rDoText+22)*Math.cos(radMui), yLH = cy+(rDoText+22)*Math.sin(radMui);
        html += `<text x="${xLH.toFixed(1)}" y="${yLH.toFixed(1)}" font-size="${tpFontSize+3}" font-weight="800" fill="#ff0000" stroke="#fff" stroke-width="1.5" paint-order="stroke" text-anchor="middle" transform="rotate(${houseFacing} ${xLH.toFixed(1)} ${yLH.toFixed(1)})">▲ HƯỚNG NHÀ</text>`;

        // Tâm: nhãn "Kham Dư" + góc hướng nhà hiện tại + Long tại Hướng — PHÓNG TO toàn bộ cụm
        // chữ ở tâm theo yêu cầu người dùng (trước đây 0.75–0.9x tpFontSize, quá nhỏ so với các
        // vòng khác). Giãn lại khoảng cách dòng (cy+...) cho khớp cỡ chữ mới, tránh đè chữ.
        html += `<circle cx="${cx}" cy="${cy}" r="6" fill="#ff1a1a" stroke="#fff" stroke-width="2"/>`;
        html += `<text x="${cx}" y="${cy-34}" font-size="${(tpFontSize*1.3).toFixed(1)}" font-weight="900" fill="#2e7d32" stroke="#fff" stroke-width="3.2" paint-order="stroke" text-anchor="middle">KHAM DƯ</text>`;
        html += `<text x="${cx}" y="${cy-10}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="700" fill="#555" stroke="#fff" stroke-width="2.8" paint-order="stroke" text-anchor="middle">${houseFacing.toFixed(1)}°</text>`;
        if (sonHienTai) {
            html += `<text x="${cx}" y="${cy+15}" font-size="${(tpFontSize*1.15).toFixed(1)}" font-weight="700" fill="#c62828" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle">Hướng: ${sonHienTai.ten}</text>`;
        }
        // Long tại Hướng (tra theo góc houseFacing trong BANG_72_LONG)
        let idxLong = Math.floor((((houseFacing - 337.5) % 360 + 360) % 360) / 5);
        let tenLongHuong = BANG_72_LONG[idxLong];
        if (tenLongHuong) {
            let hanhLongHuong = NAPAM_60[tenLongHuong] || "";
            html += `<text x="${cx}" y="${cy+39}" font-size="${(tpFontSize*1.1).toFixed(1)}" font-weight="700" fill="${MAU_NGU_HANH[hanhLongHuong]||'#333'}" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle">Long: ${tenLongHuong} (${hanhLongHuong})</text>`;
        } else {
            html += `<text x="${cx}" y="${cy+39}" font-size="${(tpFontSize*1.1).toFixed(1)}" font-weight="700" fill="#3a3a3a" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle">Long: Không Vong</text>`;
        }
        // Thông tin vòng Trường Sinh Kham Dư (Cục + Thuận/Nghịch tại Tọa), hoặc cảnh báo
        // đỏ nếu Tọa phạm đúng ô Không Vong trong bảng 72 Long.
        if (canhBaoKhongVongToa) {
            html += `<rect x="${cx-145}" y="${cy+48}" width="290" height="32" fill="#c62828" rx="5"/>`;
            html += `<text x="${cx}" y="${cy+69}" font-size="${(tpFontSize*1.0).toFixed(1)}" font-weight="900" fill="#fff" text-anchor="middle">Tọa phạm Kính Không Vong</text>`;
            html += `<text x="${cx}" y="${cy+92}" font-size="${(tpFontSize*0.9).toFixed(1)}" font-weight="700" fill="#c62828" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle">Âm sai Dương thác</text>`;
        } else if (cucKD) {
            html += `<text x="${cx}" y="${cy+64}" font-size="${(tpFontSize*1.05).toFixed(1)}" font-weight="700" fill="#1565c0" stroke="#fff" stroke-width="2.8" paint-order="stroke" text-anchor="middle">Cục: ${cucKD} — ${chieuThuanKD ? "Thuận" : "Nghịch"}</text>`;
        }

        svg.innerHTML = html;

        // ====================================================================
        // THỐNG KÊ Tọa/Hướng — Quái + Sơn + Long, kèm Ngũ Hành mỗi phần, ghi vào
        // #kdThongKe (nằm DƯỚI la bàn, ngoài SVG). Tái dùng lại các biến đã tính ở
        // trên (gocToaKD, houseFacing, tenLongToaKD, tenLongHuong, sonHienTai...)
        // thay vì tính lại từ đầu.
        //   - Quái: tra theo BATQUAI_8 (8 cung x 45°, đã khai báo ở vòng Bát Quái trên).
        //   - Sơn: Tọa dùng laySonToa(houseFacing); Hướng dùng lại sonHienTai đã có.
        //   - Long: Tọa dùng lại tenLongToaKD (đã tính ở vòng Trường Sinh Kham Dư);
        //     Hướng dùng lại tenLongHuong (đã tính ở nhãn tâm la bàn). Ngũ Hành của Long
        //     tra qua NAPAM_60 — KHÔNG dùng cucKD (đó là Cục đã gộp Thủy+Thổ riêng cho
        //     mục đích tính Trường Sinh, không phải Ngũ Hành Nạp Âm gốc của Long).
        // ====================================================================
        let elThongKe = document.getElementById("kdThongKe");
        if (elThongKe) {
            function timBatQuaiTheoGocKD(goc) {
                let g = ((goc % 360) + 360) % 360, best = BATQUAI_8[0], bestDiff = 999;
                BATQUAI_8.forEach(function(bq) {
                    let diff = Math.min(Math.abs(g - bq.goc), 360 - Math.abs(g - bq.goc));
                    if (diff < bestDiff) { bestDiff = diff; best = bq; }
                });
                return best;
            }
            let quaiToaTK = timBatQuaiTheoGocKD(gocToaKD);
            let quaiHuongTK = timBatQuaiTheoGocKD(houseFacing);
            let sonToaTK = laySonToa(houseFacing);
            let sonHuongTK = sonHienTai; // đã tính ở vòng 24 Sơn phía trên
            let hanhLongToaTK = tenLongToaKD ? (NAPAM_60[tenLongToaKD] || "?") : null;
            let hanhLongHuongTK = tenLongHuong ? (NAPAM_60[tenLongHuong] || "?") : null;

            function dongTK(nhan, mauNhan, quai, son, tenLong, hanhLong) {
                let hanhQuai = NGU_HANH_BAT_QUAI[quai.ten] || "?";
                let bangHanhSonTK = kdCheDoSon === "dai" ? NGU_HANH_24_SON_DAI_HUYEN_KHONG : NGU_HANH_24_SON_TIEU_HUYEN_KHONG;
                let hanhSon = bangHanhSonTK[son.ten] || "?";
                let phanLong = tenLong
                    ? `<b>${tenLong}</b> (${hanhLong})`
                    : `<b style="color:#c62828;">Không Vong</b>`;
                return `<div style="margin:2px 0;"><b style="color:${mauNhan};">${nhan}</b>: `
                    + `Quái <b>${quai.ten}</b> (${hanhQuai})`
                    + ` &nbsp;·&nbsp; Sơn <b>${son.ten}</b> (${hanhSon})`
                    + ` &nbsp;·&nbsp; Long ${phanLong}</div>`;
            }

            let noiDungTK = "";
            noiDungTK += dongTK("Tọa", "#6a1b9a", quaiToaTK, sonToaTK, tenLongToaKD, hanhLongToaTK);
            noiDungTK += dongTK("Hướng", "#c62828", quaiHuongTK, sonHuongTK, tenLongHuong, hanhLongHuongTK);
            // Ghi chú nhỏ dưới 2 dòng Tọa/Hướng cho biết Ngũ Hành của "Sơn" đang tra theo
            // trường phái nào (Tiểu hay Đại Huyền Không) — vì 2 trường phái cho ra Ngũ Hành
            // Sơn khác nhau, cần ghi rõ tránh nhầm lẫn. Khi đang ở Đại Huyền Không, ghi chú
            // thêm công dụng của trường phái này (theo yêu cầu người dùng): dùng để định Thủy
            // Đến/Thủy Đi, áp dụng cho cả Âm Trạch (mộ phần) lẫn Dương Trạch (nhà ở).
            noiDungTK += `<div style="margin-top:4px;font-size:11px;color:#302828;">* Ngũ Hành của "Sơn" đang tính theo <b>${kdCheDoSon === "dai" ? "Đại Huyền Không" : "Tiểu Huyền Không"}</b> </div>`;
            if (kdCheDoSon === "dai") {
                noiDungTK += `<div style="margin-top:2px;font-size:11px;color:#302828;">* Đại Huyền Không: dùng để định <b>Thủy Đến</b> và <b>Thủy Đi</b>, áp dụng cho cả <b>Âm Trạch</b> (mộ phần) lẫn <b>Dương Trạch</b> (nhà ở). là tọa/hướng phải dụng địa chi của sơn (Tý, Sửu, Dần,..., Hợi).
                <br>`
                                    + `&nbsp;&nbsp;– <b>Thủy Lai</b> phải đáo sơn thiên can/tứ duy(Giáp Ất Bính Đinh Canh Tân Nhâm Quý) hoặc Tứ duy (Càn, Khôn, Cấn, Tốn.) <br>`
                                    + `&nbsp;&nbsp;– <b>Hướng và Thủy</b>  phải đồng một công vị (gọi là "đồng hành") hoặc tương sinh. "CHÚ Ý: NÓ KHÁC TIỂU HUYỀN KHÔNG NGŨ HÀNH"`
                                    + `</div>`;

            } else {
                // Ghi chú công dụng + quy tắc xét Sa/Thủy cho Tiểu Huyền Không, theo đúng nội
                // dung người dùng cung cấp — CHỈ hiển thị dưới dạng chú thích tham khảo, KHÔNG
                // tính toán/phán tốt xấu tự động (người dùng xác nhận chỉ cần ghi chú).
                noiDungTK += `<div style="margin-top:2px;font-size:11px;color:#302828;">`
                    + `* Tiểu Huyền Không: dùng <b>Sơn Tọa</b> để xét <b>Sa</b>, dùng <b>Sơn Hướng</b> để xét <b>Thủy</b>.<br>`
                    + `&nbsp;&nbsp;– <b>Thủy Lai</b> phải từ sơn hành <b>vượng tướng</b> cho hướng ngôi mộ: tức phải ở sơn có Ngũ Hành <b>đồng hành</b> với hành của Hướng (mộ), hoặc sơn có Ngũ Hành <b>sinh ra</b> hành của Hướng.<br>`
                    + `&nbsp;&nbsp;– <b>Thủy Khứ</b> phải từ sơn hành <b>hưu tù</b> của hướng ngôi mộ: tức phải khứ từ sơn có Ngũ Hành <b>được Hướng sinh ra</b> ("sinh xuất"), hoặc sơn có Ngũ Hành <b>bị Hướng khắc</b> ("khắc nhập").`
                    + `</div>`;
            }
            elThongKe.innerHTML = noiDungTK;
        }
    }
    window.veLaBanKhamDu = veLaBanKhamDu;

    // Đổi trường phái Ngũ Hành 24 Sơn (Tiểu ⇄ Đại Huyền Không) rồi vẽ lại toàn bộ la bàn +
    // thống kê. Cũng cập nhật luôn chữ trên nút cho đúng chế độ vừa chọn.
    window.kdToggleCheDoSon = function() {
        kdCheDoSon = (kdCheDoSon === "dai") ? "tieu" : "dai";
        let btn = document.getElementById("kdBtnCheDoSon");
        if (btn) {
            btn.textContent = kdCheDoSon === "dai"
                ? "🔄 Ngũ Hành 24 Sơn: Đại Huyền Không (bấm để đổi)"
                : "🔄 Ngũ Hành 24 Sơn: Tiểu Huyền Không (bấm để đổi)";
        }
        veLaBanKhamDu();
    };

    // ====================================================================
    // ẢNH NỀN (chọn từ thư viện) + PAN/ZOOM/KHÓA — bản RÚT GỌN của cơ chế
    // trong thuy-phap.js: KHÔNG có Maps/Leaflet/GPS/AR/lưu profile, chỉ ảnh
    // tĩnh + kéo/pinch/zoom bằng tay + nút mũi tên + khóa. Giữ file nhỏ đúng
    // mục đích ban đầu (tab thuần nghiên cứu la bàn Kham Dư).
    // ====================================================================
    let kdImgOffset = {x:0, y:0};
    let kdImgScale = 1;
    let kdImgRotation = 0;
    let kdLaBanDaKhoa = false;

    function kdCapNhatViTriAnhNen() {
        let img = document.getElementById('kdMapImage');
        // Giữ nguyên translate(-50%,-50%) gốc (căn tâm ảnh vào giữa khung #kdMapStage)
        // rồi mới nối thêm pan/scale/rotate của người dùng vào SAU — nếu bỏ phần
        // -50%/-50% này, ảnh sẽ bị lệch hẳn về góc trên-trái mỗi khi cập nhật.
        if (img) img.style.transform = 'translate(-50%,-50%) translate(' + kdImgOffset.x + 'px,' + kdImgOffset.y + 'px) scale(' + kdImgScale + ') rotate(' + kdImgRotation + 'deg)';
    }
    window.kdCapNhatXoayAnh = function(val) {
        kdImgRotation = parseFloat(val) || 0;
        kdCapNhatViTriAnhNen();
    };
    window.kdPanAnhNen = function(dx, dy) {
        if (kdLaBanDaKhoa) return;
        let step = 4;
        kdImgOffset.x += dx * step;
        kdImgOffset.y += dy * step;
        kdCapNhatViTriAnhNen();
    };
    window.kdResetViTriAnh = function() {
        kdImgOffset.x = 0; kdImgOffset.y = 0; kdImgScale = 1; kdImgRotation = 0;
        let rotInput = document.getElementById('kdBgRotation');
        if (rotInput) rotInput.value = 0;
        kdCapNhatViTriAnhNen();
    };
    window.kdToggleKhoaLaBan = function() {
        kdLaBanDaKhoa = !kdLaBanDaKhoa;
        let btn = document.getElementById("kdBtnKhoaLaBan");
        if (btn) { btn.innerText = kdLaBanDaKhoa ? "🔒" : "🔓"; }
    };

    function kdGanSuKienPanZoom() {
        let stage = document.getElementById("kdMapStage");
        if (!stage || stage.dataset.kdPanInit === "1") return;
        stage.dataset.kdPanInit = "1";
        let dragging = false, pinching = false, lastX = 0, lastY = 0, pinchStartDist = 0, pinchStartScale = 1;
        function getClientPos(e) { return e.touches ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : {x:e.clientX,y:e.clientY}; }
        function getTouchDist(t0, t1) { return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY); }
        function coAnh() { let img = document.getElementById('kdMapImage'); return img && img.style.display !== 'none'; }
        function start(e) {
            if (kdLaBanDaKhoa || !coAnh()) return;
            if (e.target.closest && e.target.closest('button')) return;
            if (e.touches && e.touches.length === 2) {
                pinching = true; dragging = false;
                pinchStartDist = getTouchDist(e.touches[0], e.touches[1]);
                pinchStartScale = kdImgScale;
                e.preventDefault();
                return;
            }
            dragging = true; let p = getClientPos(e); lastX = p.x; lastY = p.y;
        }
        function move(e) {
            if (kdLaBanDaKhoa || !coAnh()) return;
            if (pinching && e.touches && e.touches.length === 2) {
                let dist = getTouchDist(e.touches[0], e.touches[1]);
                kdImgScale = Math.max(0.2, Math.min(6, pinchStartScale * (dist / pinchStartDist)));
                kdCapNhatViTriAnhNen();
                e.preventDefault();
                return;
            }
            if (!dragging) return;
            let p = getClientPos(e);
            kdImgOffset.x += p.x - lastX; kdImgOffset.y += p.y - lastY;
            lastX = p.x; lastY = p.y;
            kdCapNhatViTriAnhNen();
            e.preventDefault();
        }
        function end(e) {
            dragging = false;
            if (e && e.touches && e.touches.length > 0) return;
            pinching = false;
        }
        stage.addEventListener("mousedown", start); stage.addEventListener("touchstart", start, {passive:false});
        window.addEventListener("mousemove", move); window.addEventListener("touchmove", move, {passive:false});
        window.addEventListener("mouseup", end); window.addEventListener("touchend", end);
        stage.addEventListener("wheel", function(e) {
            if (kdLaBanDaKhoa || !coAnh()) return;
            e.preventDefault();
            let factor = e.deltaY < 0 ? 1.1 : (1 / 1.1);
            kdImgScale = Math.max(0.2, Math.min(6, kdImgScale * factor));
            kdCapNhatViTriAnhNen();
        }, {passive:false});
        // Phím mũi tên (bàn phím vật lý, chủ yếu hữu ích khi debug trên desktop Chrome —
        // điện thoại không có bàn phím vật lý nên xem thêm 4 nút mũi tên chạm được trong
        // khung ảnh, do khoiTaoGiaoDienKhamDu() tạo, mới là cách chính để dùng trên mobile)
        // chỉ hoạt động khi tab Kham Dư đang mở, tránh xung đột phím
        // mũi tên của tab Thủy Pháp hay tab khác.
        document.addEventListener('keydown', function(e) {
            let tab = document.getElementById('tab-khamdu');
            if (!tab || !tab.classList || !tab.classList.contains('active')) return;
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); window.kdPanAnhNen(0, -1); break;
                case 'ArrowDown': e.preventDefault(); window.kdPanAnhNen(0, 1); break;
                case 'ArrowLeft': e.preventDefault(); window.kdPanAnhNen(-1, 0); break;
                case 'ArrowRight': e.preventDefault(); window.kdPanAnhNen(1, 0); break;
            }
        });
    }

    function kdGanSuKienChonAnh() {
        let btnChoose = document.getElementById("kdBtnChooseFile");
        let inp = document.getElementById("kdMapImageInput");
        if (!btnChoose || !inp || btnChoose.dataset.kdInit === "1") return;
        btnChoose.dataset.kdInit = "1";
        btnChoose.addEventListener("click", function(e) { e.preventDefault(); inp.click(); });
        inp.addEventListener("change", function(e) {
            let files = e.target.files;
            if (files && files.length > 0) {
                let file = files[0];
                let nameDisplay = document.getElementById('kdFileNameDisplay');
                if (nameDisplay) nameDisplay.textContent = file.name;
                let reader = new FileReader();
                reader.onload = function(ev) {
                    let img = document.getElementById('kdMapImage');
                    img.src = ev.target.result; img.style.display = 'block';
                    let placeholder = document.getElementById('kdMapPlaceholder');
                    if (placeholder) placeholder.style.display = 'none';
                    kdImgOffset.x = 0; kdImgOffset.y = 0; kdImgScale = 1; kdImgRotation = 0;
                    let rotInput = document.getElementById('kdBgRotation'); if (rotInput) rotInput.value = 0;
                    kdCapNhatViTriAnhNen();
                };
                reader.readAsDataURL(file); e.target.value = '';
            }
        });
    }

    // ====================================================================
    // KHỞI TẠO GIAO DIỆN cho tab (ảnh nền + input hướng nhà, cỡ chữ, độ mờ)
    // — tự tạo nếu HTML chưa có sẵn #khamDuContainer, để không bắt buộc phải
    // sửa tay index.html quá nhiều. Chỉ cần thêm 1 div rỗng, xem cuối file.
    // ====================================================================
    function khoiTaoGiaoDienKhamDu() {
        let container = document.getElementById("khamDuContainer");
        if (!container) return;
        if (container.dataset.kdInit === "1") return; // tránh khởi tạo lại nhiều lần
        container.dataset.kdInit = "1";
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;padding:12px 0px;gap:10px;width:100%;max-width:520px;margin:0 auto;">
                <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;width:100%;">
                    <button id="kdBtnChooseFile" style="flex:0 0 auto;width:auto;padding:6px 10px;border-radius:6px;border:1px solid #4CAF50;background:#4CAF50;color:#fff;font-size:12px;cursor:pointer;white-space:nowrap;">🖼️ Chọn ảnh</button>
                    <input type="file" id="kdMapImageInput" accept="image/*" style="display:none;">
                    <button id="kdBtnKhoaLaBan" onclick="kdToggleKhoaLaBan()" title="Khóa/mở khóa di chuyển ảnh nền" style="flex:0 0 auto;width:auto;padding:4px 8px;border-radius:6px;border:1px solid #999;background:#fff;font-size:14px;cursor:pointer;">🔓</button>
                    <button onclick="kdResetViTriAnh()" title="Reset vị trí/zoom/xoay ảnh" style="flex:0 0 auto;width:auto;padding:4px 8px;border-radius:6px;border:1px solid #999;background:#fff;color:#333;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;">↺ Reset</button>
                    <label style="flex:0 0 auto;font-size:12px;white-space:nowrap;">Xoay (°):
                        <input type="number" id="kdBgRotation" value="0" step="1" style="width:48px;padding:3px 4px;font-size:12px;"
                            oninput="kdCapNhatXoayAnh(this.value)">
                    </label>
                    <label style="flex:0 0 auto;font-size:12px;white-space:nowrap;">Hướng nhà (°):
                        <input type="number" id="kdHouseFacing" value="180" min="0" max="360" step="0.1"
                            style="width:56px;padding:3px 4px;font-size:12px;">
                    </label>
                    <label style="flex:0 0 auto;font-size:12px;white-space:nowrap;">Cỡ chữ:
                        <input type="range" id="kdFontSizeSlider" min="6" max="16" step="0.5" value="10" style="vertical-align:middle;width:70px;">
                    </label>
                    <label style="flex:0 0 auto;font-size:12px;white-space:nowrap;">Độ mờ:
                        <input type="range" id="kdDoMoNenSlider" min="0" max="1" step="0.05" value="0.5" style="vertical-align:middle;width:70px;">
                    </label>
                    <span id="kdFileNameDisplay" style="flex:0 0 auto;font-size:11px;color:#888;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Chưa chọn ảnh</span>
                </div>
                <div style="position:relative;width:100%;max-width:500px;aspect-ratio:1/1;overflow:hidden;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;" id="kdMapStage">
                    <div id="kdMapPlaceholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:13px;">Chưa có ảnh nền — bấm "🖼️ Chọn ảnh"</div>
                    <img id="kdMapImage" style="position:absolute;top:50%;left:50%;max-width:none;width:100%;transform-origin:center center;display:none;transform:translate(-50%,-50%);pointer-events:none;">
                    <div style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;" id="kdCompassOverlay"></div>
                    <!-- 4 nút mũi tên chạm được — thay cho phím mũi tên bàn phím (vô dụng trên
                         điện thoại/Android WebView vì không có bàn phím vật lý luôn hiện diện).
                         Theo yêu cầu người dùng, ĐỂ LẠI NẰM TRONG khung la bàn (đè góc dưới-phải)
                         như bản gốc — không tách ra ngoài nữa. Mỗi nút gọi kdPanAnhNen() bước nhỏ 4px. -->
                    <div style="position:absolute;bottom:8px;right:8px;display:grid;grid-template-columns:repeat(3,26px);grid-template-rows:repeat(3,26px);gap:2px;z-index:20;">
                        <span></span>
                        <button onclick="kdPanAnhNen(0,-1)" title="Dịch ảnh lên" style="grid-column:2;grid-row:1;width:100%;height:100%;border-radius:4px;border:1px solid #999;background:rgba(255,255,255,0.85);font-size:14px;color:#1565c0;font-weight:900;cursor:pointer;padding:0;">▲</button>
                        <span></span>
                        <button onclick="kdPanAnhNen(-1,0)" title="Dịch ảnh sang trái" style="grid-column:1;grid-row:2;width:100%;height:100%;border-radius:4px;border:1px solid #999;background:rgba(255,255,255,0.85);font-size:14px;color:#1565c0;font-weight:900;cursor:pointer;padding:0;">◀</button>
                        <span></span>
                        <button onclick="kdPanAnhNen(1,0)" title="Dịch ảnh sang phải" style="grid-column:3;grid-row:2;width:100%;height:100%;border-radius:4px;border:1px solid #999;background:rgba(255,255,255,0.85);font-size:14px;color:#1565c0;font-weight:900;cursor:pointer;padding:0;">▶</button>
                        <span></span>
                        <button onclick="kdPanAnhNen(0,1)" title="Dịch ảnh xuống" style="grid-column:2;grid-row:3;width:100%;height:100%;border-radius:4px;border:1px solid #999;background:rgba(255,255,255,0.85);font-size:14px;color:#1565c0;font-weight:900;cursor:pointer;padding:0;">▼</button>
                        <span></span>
                    </div>
                </div>
                <!-- Nút chuyển trường phái Ngũ Hành 24 Sơn (Tiểu/Đại Huyền Không) — đổi cả màu
                     nền vòng 24 Sơn lẫn giá trị Ngũ Hành "Sơn" trong khối thống kê bên dưới. -->
                <button id="kdBtnCheDoSon" onclick="kdToggleCheDoSon()" style="width:100%;max-width:500px;padding:8px;background:#eef3fb;border:1px solid #99aecb;border-radius:6px;color:#1a3a6b;font-weight:700;font-size:13px;cursor:pointer;">🔄 Ngũ Hành 24 Sơn: Tiểu Huyền Không (bấm để đổi)</button>
                <!-- THỐNG KÊ Tọa/Hướng: Quái + Sơn + Long, kèm Ngũ Hành từng phần — nội dung do
                     veLaBanKhamDu() ghi vào mỗi lần vẽ lại la bàn (xem cuối hàm đó). -->
                <div id="kdThongKe" style="width:100%;max-width:500px;background:#fffaf0;border:1px solid #d8c9a8;border-radius:8px;padding:10px 14px;font-size:13px;line-height:1.9;color:#2a1a0a;"></div>
            </div>
        `;
        kdGanSuKienChonAnh();
        kdGanSuKienPanZoom();
        document.getElementById("kdHouseFacing").addEventListener("input", veLaBanKhamDu);
        document.getElementById("kdFontSizeSlider").addEventListener("input", function() {
            kdFontSize = parseFloat(this.value) || 10;
            veLaBanKhamDu();
        });
        document.getElementById("kdDoMoNenSlider").addEventListener("input", function() {
            kdDoMoNen = parseFloat(this.value);
            if (isNaN(kdDoMoNen)) kdDoMoNen = 0.5;
            veLaBanKhamDu();
        });
        veLaBanKhamDu();
    }

    // ==== HOOK vào chuyenTab() — CHỈ 1 LẦN DUY NHẤT, không lặp lại bằng setTimeout. ====
    // LƯU Ý QUAN TRỌNG: nhiều file khác (lich-van-nien.js, loan-dau.js...) cũng tự
    // wrap window.chuyenTab theo kiểu tương tự. Nếu hàm hook này chạy LẶP LẠI nhiều
    // lần (như bản cũ dùng setTimeout 500ms/1000ms để "phòng trường hợp load sau"),
    // các lượt hook chồng lên nhau có thể tạo VÒNG LẶP ĐỆ QUY VÔ HẠN giữa các wrapper
    // (A wrap B, rồi B wrap lại A ở lượt sau, tham chiếu "bản gốc" của mỗi bên trỏ
    // ngược lại nhau) → "Maximum call stack size exceeded" và toàn bộ tab bị treo.
    // Vì kham-du.js luôn được nạp SAU CÙNG trong index.html (script cuối trước
    // </body>), tại thời điểm file này chạy thì chuyenTab chắc chắn đã tồn tại —
    // không cần và không được phép hook lặp lại.
    if (typeof chuyenTab === 'function') {
        let _chuyenTabGocKD = chuyenTab;
        window.chuyenTab = function(tabName) {
            _chuyenTabGocKD(tabName);
            if (tabName === 'khamdu') {
                setTimeout(function() {
                    khoiTaoGiaoDienKhamDu();
                    veLaBanKhamDu();
                }, 50);
            }
        };
    } else {
        console.error("kham-du.js: chuyenTab() chưa tồn tại lúc file này load — kiểm tra lại thứ tự <script> trong index.html, kham-du.js phải nằm SAU file định nghĩa chuyenTab().");
    }

})();

// ====================================================================
// HƯỚNG DẪN GẮN VÀO index.html (chỉ cần làm 1 lần):
//
// 1) Thêm nút tab vào .tab-bar (cạnh các nút tab khác):
//    <button class="tab-btn" id="tabBtnKhamdu" onclick="chuyenTab('khamdu')">🗺️ Kham Dư</button>
//
// 2) Thêm khung nội dung tab (đặt cạnh các <div id="tab-...') khác):
//    <div id="tab-khamdu" class="tab-content">
//      <div id="khamDuContainer"></div>
//    </div>
//
// 3) BẮT BUỘC nạp file này SAU CÙNG, sau TẤT CẢ script khác (đặc biệt sau
//    file nào định nghĩa chuyenTab() và sau lich-van-nien.js/loan-dau.js nếu
//    chúng cũng tự wrap chuyenTab) — file này hook 1 LẦN DUY NHẤT lúc load,
//    không tự lặp lại, nên thứ tự load đúng là điều kiện bắt buộc, không phải
//    tùy chọn:
//    <script src="js/kham-du.js"></script>   <!-- dòng script cuối cùng -->
// ====================================================================
