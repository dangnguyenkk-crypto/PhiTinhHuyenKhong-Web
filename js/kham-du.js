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
            let mauNen = s.amDuong === "Duong" ? "#fdf6e3" : "#eef1f7";
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
            <div style="display:flex;flex-direction:column;align-items:center;padding:12px;gap:10px;width:100%;max-width:520px;margin:0 auto;">
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;width:100%;">
                <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;width:100%;">
                    <button id="kdBtnChooseFile" style="flex:0 0 auto;padding:6px 10px;border-radius:6px;border:1px solid #4CAF50;background:#4CAF50;color:#fff;font-size:12px;cursor:pointer;white-space:nowrap;">🖼️ Chọn ảnh</button>
                    <input type="file" id="kdMapImageInput" accept="image/*" style="display:none;">
                    <button id="kdBtnKhoaLaBan" onclick="kdToggleKhoaLaBan()" title="Khóa/mở khóa di chuyển ảnh nền" style="flex:0 0 auto;padding:4px 8px;border-radius:6px;border:1px solid #999;background:#fff;font-size:14px;cursor:pointer;">🔓</button>
                    <button onclick="kdResetViTriAnh()" title="Reset vị trí/zoom/xoay ảnh" style="flex:0 0 auto;padding:4px 8px;border-radius:6px;border:1px solid #999;background:#fff;font-size:12px;cursor:pointer;white-space:nowrap;">↺ Reset</button>
                    <label style="flex:0 0 auto;font-size:12px;white-space:nowrap;">Xoay ảnh (°):
                        <input type="number" id="kdBgRotation" value="0" step="1" style="width:55px;padding:3px 5px;font-size:12px;"
                            oninput="kdCapNhatXoayAnh(this.value)">
                    </label>
                    <span id="kdFileNameDisplay" style="flex:0 0 auto;font-size:11px;color:#888;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Chưa chọn ảnh</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;width:100%;">
                    <label style="font-size:13px;">Hướng nhà (°):
                        <input type="number" id="kdHouseFacing" value="180" min="0" max="360" step="0.1"
                            style="width:70px;padding:4px 6px;font-size:13px;">
                    </label>
                    <label style="font-size:13px;">Cỡ chữ:
                        <input type="range" id="kdFontSizeSlider" min="6" max="16" step="0.5" value="10" style="vertical-align:middle;">
                    </label>
                    <label style="font-size:13px;">Độ mờ nền:
                        <input type="range" id="kdDoMoNenSlider" min="0" max="1" step="0.05" value="0.5" style="vertical-align:middle;">
                    </label>
                </div>
                <div style="position:relative;width:100%;max-width:500px;aspect-ratio:1/1;overflow:hidden;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;" id="kdMapStage">
                    <div id="kdMapPlaceholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:13px;">Chưa có ảnh nền — bấm "🖼️ Chọn ảnh"</div>
                    <img id="kdMapImage" style="position:absolute;top:50%;left:50%;max-width:none;width:100%;transform-origin:center center;display:none;transform:translate(-50%,-50%);pointer-events:none;">
                    <div style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;" id="kdCompassOverlay"></div>
                    <!-- 4 nút mũi tên chạm được — thay cho phím mũi tên bàn phím (vô dụng trên
                         điện thoại/Android WebView vì không có bàn phím vật lý luôn hiện diện).
                         Đặt góc dưới-phải khung ảnh, mỗi nút gọi kdPanAnhNen() bước nhỏ 4px. -->
                    <div style="position:absolute;bottom:8px;right:8px;display:grid;grid-template-columns:repeat(3,26px);grid-template-rows:repeat(3,26px);gap:2px;z-index:20;">
                        <span></span>
                        <button onclick="kdPanAnhNen(0,-1)" title="Dịch ảnh lên" style="grid-column:2;grid-row:1;border-radius:4px;border:1px solid #999;background:rgba(255,255,255,0.85);font-size:12px;cursor:pointer;padding:0;">▲</button>
                        <span></span>
                        <button onclick="kdPanAnhNen(-1,0)" title="Dịch ảnh sang trái" style="grid-column:1;grid-row:2;border-radius:4px;border:1px solid #999;background:rgba(255,255,255,0.85);font-size:12px;cursor:pointer;padding:0;">◀</button>
                        <span></span>
                        <button onclick="kdPanAnhNen(1,0)" title="Dịch ảnh sang phải" style="grid-column:3;grid-row:2;border-radius:4px;border:1px solid #999;background:rgba(255,255,255,0.85);font-size:12px;cursor:pointer;padding:0;">▶</button>
                        <span></span>
                        <button onclick="kdPanAnhNen(0,1)" title="Dịch ảnh xuống" style="grid-column:2;grid-row:3;border-radius:4px;border:1px solid #999;background:rgba(255,255,255,0.85);font-size:12px;cursor:pointer;padding:0;">▼</button>
                        <span></span>
                    </div>
                </div>
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
