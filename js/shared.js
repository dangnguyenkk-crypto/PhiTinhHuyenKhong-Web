// ====================================================================
// shared.js
// Dữ liệu dùng chung: DS24_SON, la bàn, màu, đồng bộ hướng
// ====================================================================

// nguyenLong: "Dia" (Địa Nguyên Long: Giáp Canh Nhâm Bính[D] Thìn Tuất Sửu Mùi[A]),
//             "Thien" (Thiên Nguyên Long: Càn Khôn Cấn Tốn[D] Tý Ngọ Mão Dậu[A]),
//             "Nhan" (Nhân Nguyên Long: Dần Thân Tị Hợi[D] Quý Đinh Ất Tân[A])
// LƯU Ý: Thìn/Tuất thuộc Địa Nguyên Long ÂM (tứ mộ đều Âm) — đã sửa lỗi amDuong cũ ghi nhầm "Duong".
const DS24_SON = [
            { ten: "Tý", goc: 0, amDuong: "Am", cung: "Khảm", nguyenLong: "Thien" }, { ten: "Quý", goc: 15, amDuong: "Am", cung: "Khảm", nguyenLong: "Nhan" },
            { ten: "Sửu", goc: 30, amDuong: "Am", cung: "Cấn", nguyenLong: "Dia" }, { ten: "Cấn", goc: 45, amDuong: "Duong", cung: "Cấn", nguyenLong: "Thien" },
            { ten: "Dần", goc: 60, amDuong: "Duong", cung: "Cấn", nguyenLong: "Nhan" }, { ten: "Giáp", goc: 75, amDuong: "Duong", cung: "Chấn", nguyenLong: "Dia" },
            { ten: "Mão", goc: 90, amDuong: "Am", cung: "Chấn", nguyenLong: "Thien" }, { ten: "Ất", goc: 105, amDuong: "Am", cung: "Chấn", nguyenLong: "Nhan" },
            { ten: "Thìn", goc: 120, amDuong: "Am", cung: "Tốn", nguyenLong: "Dia" }, { ten: "Tốn", goc: 135, amDuong: "Duong", cung: "Tốn", nguyenLong: "Thien" },
            { ten: "Tị", goc: 150, amDuong: "Duong", cung: "Tốn", nguyenLong: "Nhan" }, { ten: "Bính", goc: 165, amDuong: "Duong", cung: "Ly", nguyenLong: "Dia" },
            { ten: "Ngọ", goc: 180, amDuong: "Am", cung: "Ly", nguyenLong: "Thien" }, { ten: "Đinh", goc: 195, amDuong: "Am", cung: "Ly", nguyenLong: "Nhan" },
            { ten: "Mùi", goc: 210, amDuong: "Am", cung: "Khôn", nguyenLong: "Dia" }, { ten: "Khôn", goc: 225, amDuong: "Duong", cung: "Khôn", nguyenLong: "Thien" },
            { ten: "Thân", goc: 240, amDuong: "Duong", cung: "Khôn", nguyenLong: "Nhan" }, { ten: "Canh", goc: 255, amDuong: "Duong", cung: "Đoài", nguyenLong: "Dia" },
            { ten: "Dậu", goc: 270, amDuong: "Am", cung: "Đoài", nguyenLong: "Thien" }, { ten: "Tân", goc: 285, amDuong: "Am", cung: "Đoài", nguyenLong: "Nhan" },
            { ten: "Tuất", goc: 300, amDuong: "Am", cung: "Càn", nguyenLong: "Dia" }, { ten: "Càn", goc: 315, amDuong: "Duong", cung: "Càn", nguyenLong: "Thien" },
            { ten: "Hợi", goc: 330, amDuong: "Duong", cung: "Càn", nguyenLong: "Nhan" }, { ten: "Nhâm", goc: 345, amDuong: "Duong", cung: "Khảm", nguyenLong: "Dia" }
        ];
        const DS8_HUONG = [
            { ten: "Bắc", goc: 0 }, { ten: "Đông Bắc", goc: 45 }, { ten: "Đông", goc: 90 }, { ten: "Đông Nam", goc: 135 },
            { ten: "Nam", goc: 180 }, { ten: "Tây Nam", goc: 225 }, { ten: "Tây", goc: 270 }, { ten: "Tây Bắc", goc: 315 }
        ];
        const MAU_BAT_QUAI = ["#285AA0","#B4963C","#146B28","#3CA064","#BE2828","#A07832","#C8C8C8","#AAAAB4"];
        var mauTiaHienTai = "#e91e63";
        var mauRanh8HienTai = "#1565c0";
        window.mauTiaHienTai = mauTiaHienTai;
        window.mauRanh8HienTai = mauRanh8HienTai;

        function timSonTheoGoc(goc) {
            let g = ((goc % 360) + 360) % 360;
            for (let s of DS24_SON) {
                let min = (s.goc - 7.5 + 360) % 360, max = (s.goc + 7.5) % 360;
                if (min < max) { if (g >= min && g < max) return s; } else { if (g >= min || g < max) return s; }
            }
            return DS24_SON[0];
        }

        var dangCapNhatMau = false;
        function capNhatMauTia() {
            if (dangCapNhatMau) return; dangCapNhatMau = true;
            try {
                var tpColor = document.getElementById("colorTiaNetDut"), tnColor = document.getElementById("tnColorTia");
                if (tpColor) { mauTiaHienTai = tpColor.value; if (tnColor) tnColor.value = mauTiaHienTai; }
                else if (tnColor) { mauTiaHienTai = tnColor.value; var tpColor2 = document.getElementById("colorTiaNetDut"); if (tpColor2) tpColor2.value = mauTiaHienTai; }
                var houseFacing = parseFloat(document.getElementById('houseFacing').value) || 0;
                if (typeof veCompassOverlay === 'function') veCompassOverlay(houseFacing);
                redrawTamNha();
            } finally { dangCapNhatMau = false; }
        }
        window.capNhatMauTia = capNhatMauTia;

        function capNhatMauRanh8() {
            if (dangCapNhatMau) return; dangCapNhatMau = true;
            try {
                var tpColor = document.getElementById("colorRanh8Huong"), tnColor = document.getElementById("tnColorRanh8Huong");
                if (tpColor) { mauRanh8HienTai = tpColor.value; if (tnColor) tnColor.value = mauRanh8HienTai; }
                else if (tnColor) { mauRanh8HienTai = tnColor.value; var tpColor2 = document.getElementById("colorRanh8Huong"); if (tpColor2) tpColor2.value = mauRanh8HienTai; }
                var houseFacing = parseFloat(document.getElementById('houseFacing').value) || 0;
                if (typeof veCompassOverlay === 'function') veCompassOverlay(houseFacing);
                redrawTamNha();
            } finally { dangCapNhatMau = false; }
        }
        window.capNhatMauRanh8 = capNhatMauRanh8;

        function capNhatMauTiaTamNha() {
            if (dangCapNhatMau) return; dangCapNhatMau = true;
            try {
                var tnColor = document.getElementById("tnColorTia");
                if (tnColor) { mauTiaHienTai = tnColor.value; var tpColor = document.getElementById("colorTiaNetDut"); if (tpColor) tpColor.value = mauTiaHienTai; }
                var houseFacing = parseFloat(document.getElementById('houseFacing').value) || 0;
                if (typeof veCompassOverlay === 'function') veCompassOverlay(houseFacing);
                redrawTamNha();
            } finally { dangCapNhatMau = false; }
        }
        window.capNhatMauTiaTamNha = capNhatMauTiaTamNha;

        function capNhatMauRanh8TamNha() {
            if (dangCapNhatMau) return; dangCapNhatMau = true;
            try {
                var tnColor = document.getElementById("tnColorRanh8Huong");
                if (tnColor) { mauRanh8HienTai = tnColor.value; var tpColor = document.getElementById("colorRanh8Huong"); if (tpColor) tpColor.value = mauRanh8HienTai; }
                var houseFacing = parseFloat(document.getElementById('houseFacing').value) || 0;
                if (typeof veCompassOverlay === 'function') veCompassOverlay(houseFacing);
                redrawTamNha();
            } finally { dangCapNhatMau = false; }
        }
        window.capNhatMauRanh8TamNha = capNhatMauRanh8TamNha;

        // ====================================================================
        // 60 THẤU ĐỊA LONG — chỉ áp dụng cho 12 sơn Địa Chi (Tý, Sửu, Dần...); 12 sơn
        // Thiên Can + Bát Quái (Giáp, Ất, Cấn...) KHÔNG có vạch Thấu Địa Long (để trống
        // theo đúng tài liệu gốc). Mỗi Địa Chi có 5 vạch (Can Chi đầy đủ), mỗi vạch cách
        // nhau 3° trong phạm vi 15° của sơn đó (bắt đầu từ start = goc sơn - 7.5°).
        // ====================================================================
        const THAU_DIA_LONG = {
            "Tý":  ["Giáp","Bính","Mậu","Canh","Nhâm"],
            "Sửu": ["Ất","Đinh","Kỷ","Tân","Quý"],
            "Dần": ["Bính","Mậu","Canh","Nhâm","Giáp"],
            "Mão": ["Đinh","Kỷ","Tân","Quý","Ất"],
            "Thìn":["Mậu","Canh","Nhâm","Giáp","Bính"],
            "Tị":  ["Kỷ","Tân","Quý","Ất","Đinh"],
            "Ngọ": ["Canh","Nhâm","Giáp","Bính","Mậu"],
            "Mùi": ["Tân","Quý","Ất","Đinh","Kỷ"],
            "Thân":["Nhâm","Giáp","Bính","Mậu","Canh"],
            "Dậu": ["Quý","Ất","Đinh","Kỷ","Tân"],
            "Tuất":["Giáp","Bính","Mậu","Canh","Nhâm"],
            "Hợi": ["Ất","Đinh","Kỷ","Tân","Quý"]
        };
        const DIA_CHI_SET = { "Tý":1,"Sửu":1,"Dần":1,"Mão":1,"Thìn":1,"Tị":1,"Ngọ":1,"Mùi":1,"Thân":1,"Dậu":1,"Tuất":1,"Hợi":1 };

function veCompassChung(svgId, cx, cy, houseFacing, options) {
    const svg = document.getElementById(svgId); if (!svg) return;
    // THỨ TỰ TỪ TÂM RA NGOÀI:
    // 8 hướng -> 24 sơn -> 60 Thấu Địa Long -> vạch chia độ -> số độ.
    const {
    // ---- VÒNG 8 HƯỚNG (trong cùng) ----
    r8Outer=125, // Bán kính ngoài của vòng 8 hướng
    r8Inner=84,
    r8Text=100,
    // ---- VÒNG 24 SƠN ----
            r24Outer=355,
            r24Inner=125,
            r24Text=320,
    // ---- VÒNG 60 THẤU ĐỊA LONG ----
                rTdlOuter=410, // Bán kính ngoài của vòng 60 Long
                rTdlInner=355, // Bán kính trong của vòng 60 Long (sát vòng 24 sơn)
                rTdlTick=70,    // Chiều dài vạch chia 60 Long (tính từ rTdlOuter vào trong)
            rDoTick=410, // Điểm bắt đầu vẽ vạch chia độ (tính từ tâm)
            rDoText=450, // Vị trí đặt số độ (0°, 10°, 20°...)
            rDoSo=430,// Bán kính ngoài cùng của la bàn (viền ngoài)
    // ---- KIM CHỈ NAM & TIA ----
            rTia=1400,
            rTiaStart=35,
            rKim=410, doMo=0.7,
            mauTia=mauTiaHienTai, isReset=false, resetOffset=0, sonDen=null, sonDi=null,
            showLabel=true, fontSize=15, mauRanh8=mauRanh8HienTai } = options || {};

    let rTamTrong = rTiaStart;
    let totalRotation = isReset ? resetOffset : 0;
    let html = `<g transform="rotate(${totalRotation}, ${cx}, ${cy})">`;
    html += `<circle cx="${cx}" cy="${cy}" r="${rDoSo}" fill="none" stroke="#5c4a3a" stroke-width="0.5" opacity="0.9"/>`;

    // ---- VÒNG CHIA ĐỘ + SỐ ĐỘ (ngoài cùng) ----
    for (let deg = 0; deg < 360; deg += 5) {
        let rad = (deg - 90) * Math.PI / 180;
        let isMajor = deg % 30 === 0;
        let showDeg = deg % 10 === 0;
        let rIn = isMajor ? rDoTick - 5 : rDoTick;
        let x1 = cx + rIn * Math.cos(rad), y1 = cy + rIn * Math.sin(rad);
        let x2 = cx + rDoSo * Math.cos(rad), y2 = cy + rDoSo * Math.sin(rad);
        html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#fff" stroke-width="${isMajor?3:2.4}" opacity="0.9"/>`;
        html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#d40606" stroke-width="${isMajor?1.5:1.2}" opacity="1"/>`;// vạch chia độ
        if (showDeg) {
            let xt = cx + rDoText * Math.cos(rad), yt = cy + rDoText * Math.sin(rad);
            html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${fontSize+2}" font-weight="600" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${deg} ${xt.toFixed(1)} ${yt.toFixed(1)})">${deg}</text>`;
        }
    }

        // ---- VÒNG 60 THẤU ĐỊA LONG - VẠCH BIÊN + CHỮ XUYÊN TÂM ----
        html += `<circle cx="${cx}" cy="${cy}" r="${rTdlOuter}" fill="rgba(253,250,242,${doMo*0.6})" stroke="#3a2a1a" stroke-width="0.5" opacity="${Math.max(0.3,doMo)}"/>`;
        html += `<circle cx="${cx}" cy="${cy}" r="${rTdlInner}" fill="none" stroke="#5c4a3a" stroke-width="0.5" opacity="0.6"/>`;
        let rTdlText = rTdlInner + 5;

        DS24_SON.forEach(s => {
            // Vạch ranh giới sơn (biên trái và phải)
            let rbTdl = (s.goc - 7.5 - 90) * Math.PI / 180;
            let x1t = cx + (rTdlOuter - rTdlTick) * Math.cos(rbTdl), y1t = cy + (rTdlOuter - rTdlTick) * Math.sin(rbTdl);
            let x2t = cx + rTdlOuter * Math.cos(rbTdl), y2t = cy + rTdlOuter * Math.sin(rbTdl);
            html += `<line x1="${x1t.toFixed(1)}" y1="${y1t.toFixed(1)}" x2="${x2t.toFixed(1)}" y2="${y2t.toFixed(1)}" stroke="#2a2a2a" stroke-width="1.5"/>`;

            // Nếu là Địa Chi, vẽ 5 vạch biên
            if (!DIA_CHI_SET[s.ten]) return;
            let ten5 = THAU_DIA_LONG[s.ten];
            if (!ten5) return;

            for (let k = 0; k < 5; k++) {
                let degK = s.goc - 7.5 + 3 + k * 3;
                let radK = (degK - 90) * Math.PI / 180;

                // VẠCH BIÊN 60 LONG
                let xk1 = cx + (rTdlOuter - rTdlTick * 0.7) * Math.cos(radK), yk1 = cy + (rTdlOuter - rTdlTick * 0.7) * Math.sin(radK);
                let xk2 = cx + rTdlOuter * Math.cos(radK), yk2 = cy + rTdlOuter * Math.sin(radK);
                html += `<line x1="${xk1.toFixed(1)}" y1="${yk1.toFixed(1)}" x2="${xk2.toFixed(1)}" y2="${yk2.toFixed(1)}" stroke="${mauTia}" stroke-width="0.5"/>`;
                html += `<line x1="${xk1.toFixed(1)}" y1="${yk1.toFixed(1)}" x2="${xk2.toFixed(1)}" y2="${yk2.toFixed(1)}" stroke="#ffffff" stroke-width="1" opacity="0.2"/>`;

                // ===== TÊN 60 LONG - VIẾT XUYÊN TÂM (CHỮ ĐỨNG THEO BÁN KÍNH) =====
                let degCenter = s.goc - 7.5 + 1.5 + k * 3;
                let radCenter = (degCenter - 90) * Math.PI / 180;
                let xkt = cx + rTdlText * Math.cos(radCenter), ykt = cy + rTdlText * Math.sin(radCenter);

                let tenDayDu = ten5[k];
                let tenHienThi = tenDayDu; //.replace(/\s/g, '');
                let fontSizeTdl = fontSize * 0.9;

                // XOAY CHỮ: degCenter - 90 để chữ đứng dọc theo bán kính
                let gocXoay = degCenter - 90;
                html += `<g transform="rotate(${gocXoay.toFixed(2)} ${xkt.toFixed(1)} ${ykt.toFixed(1)})">`;
                html += `<text x="${xkt.toFixed(1)}" y="${ykt.toFixed(1)}" font-size="${fontSizeTdl.toFixed(1)}" font-weight="700" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="start" dominant-baseline="middle">${tenHienThi}</text>`;
                html += `</g>`;
            }
        });

    // ---- VÒNG 24 SƠN ----
    html += `<circle cx="${cx}" cy="${cy}" r="${r24Outer}" fill="rgba(253,250,242,${doMo*0.85})" stroke="#3a2a1a" stroke-width="0.5" opacity="${Math.max(0.3,doMo)}"/>`;
    html += `<circle cx="${cx}" cy="${cy}" r="${r24Inner}" fill="none" stroke="#5c4a3a" stroke-width="0.5" opacity="0.7"/>`;

    function wedge(tenSon, mauNen, mauVien) {
        let s = DS24_SON.find(x => x.ten === tenSon); if (!s) return "";
        let rs = (s.goc - 7.5 - 90)*Math.PI/180, re = (s.goc + 7.5 - 90)*Math.PI/180;
        let xsO = cx+r24Outer*Math.cos(rs), ysO = cy+r24Outer*Math.sin(rs);
        let xeO = cx+r24Outer*Math.cos(re), yeO = cy+r24Outer*Math.sin(re);
        let xsI = cx+r24Inner*Math.cos(re), ysI = cy+r24Inner*Math.sin(re);
        let xeI = cx+r24Inner*Math.cos(rs), yeI = cy+r24Inner*Math.sin(rs);
        return `<path d="M${xsO.toFixed(1)},${ysO.toFixed(1)} A${r24Outer},${r24Outer} 0 0,1 ${xeO.toFixed(1)},${yeO.toFixed(1)} L${xsI.toFixed(1)},${ysI.toFixed(1)} A${r24Inner},${r24Inner} 0 0,0 ${xeI.toFixed(1)},${yeI.toFixed(1)} Z" fill="${mauNen}" stroke="${mauVien}" stroke-width="2"/>`;
    }
    if (sonDen) html += wedge(sonDen, "rgba(33,150,243,0.38)", "#1565c0");
    if (sonDi) html += wedge(sonDi, "rgba(255,152,0,0.38)", "#e65100");
    let sonHuong = timSonTheoGoc(houseFacing).ten;
    html += wedge(sonHuong, "rgba(244,67,54,0.30)", "#b71c1c");

    // Tia và nhãn 24 sơn
    DS24_SON.forEach(s => {
        let rb = (s.goc - 7.5 - 90)*Math.PI/180;
        let xXa = cx + rTia*Math.cos(rb), yXa = cy + rTia*Math.sin(rb);
        let xTiaStart = cx + rTamTrong*Math.cos(rb), yTiaStart = cy + rTamTrong*Math.sin(rb);
        html += `<line x1="${xTiaStart.toFixed(1)}" y1="${yTiaStart.toFixed(1)}" x2="${xXa.toFixed(1)}" y2="${yXa.toFixed(1)}" stroke="${mauTia}" stroke-width="0.5" opacity="0.9"/>`;
        let x1b = cx+(r24Outer-3)*Math.cos(rb), y1b = cy+(r24Outer-3)*Math.sin(rb);
        let x2b = cx+r24Outer*Math.cos(rb), y2b = cy+r24Outer*Math.sin(rb);
        html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#5c4a3a" stroke-width="2"/>`;
        let r = (s.goc-90)*Math.PI/180, xt = cx+r24Text*Math.cos(r), yt = cy+r24Text*Math.sin(r);
        html += `<g transform="rotate(${s.goc} ${xt.toFixed(1)} ${yt.toFixed(1)})"><text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${fontSize}" font-weight="800" fill="#7a1010" stroke="#ffffff" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${s.ten}</text></g>`;
    });

    // ---- VÒNG 8 HƯỚNG ----
    DS8_HUONG.forEach((h, i) => {
        let rs = (h.goc - 22.5 - 90) * Math.PI / 180, re = (h.goc + 22.5 - 90) * Math.PI / 180;
        let xS = cx + r8Outer*Math.cos(rs), yS = cy + r8Outer*Math.sin(rs);
        let xE = cx + r8Outer*Math.cos(re), yE = cy + r8Outer*Math.sin(re);
        let html8;
        if (r8Inner <= 0) {
            html8 = `<path d="M${cx},${cy} L${xS.toFixed(1)},${yS.toFixed(1)} A${r8Outer},${r8Outer} 0 0,1 ${xE.toFixed(1)},${yE.toFixed(1)} Z" fill="${MAU_BAT_QUAI[i]}" opacity="0.55" stroke="${mauRanh8}" stroke-width="0.1" stroke-opacity="0.5"/>`;
        } else {
            let xSi = cx + r8Inner*Math.cos(re), ySi = cy + r8Inner*Math.sin(re);
            let xEi = cx + r8Inner*Math.cos(rs), yEi = cy + r8Inner*Math.sin(rs);
            html8 = `<path d="M${xS.toFixed(1)},${yS.toFixed(1)} A${r8Outer},${r8Outer} 0 0,1 ${xE.toFixed(1)},${yE.toFixed(1)} L${xSi.toFixed(1)},${ySi.toFixed(1)} A${r8Inner},${r8Inner} 0 0,0 ${xEi.toFixed(1)},${yEi.toFixed(1)} Z" fill="${MAU_BAT_QUAI[i]}" opacity="0.55" stroke="${mauRanh8}" stroke-width="0.1" stroke-opacity="0.5"/>`;
        }
        html += html8;
        let rc = (h.goc - 90) * Math.PI / 180, xt = cx + r8Text*Math.cos(rc), yt = cy + r8Text*Math.sin(rc);
        let isMain = h.goc % 90 === 0;
        html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${isMain?fontSize+2:fontSize}" font-weight="700" fill="${isMain?'#8b4500':'#1a1a1a'}" stroke="#fff" stroke-width="2.0" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${h.goc} ${xt.toFixed(1)} ${yt.toFixed(1)})">${h.ten}</text>`;
    });

    // Tia ranh 8 hướng
    DS8_HUONG.forEach((h) => {
        let aBien = (h.goc - 22.5 - 90) * Math.PI / 180;
        let xOut = cx + rTia*Math.cos(aBien), yOut = cy + rTia*Math.sin(aBien);
        let xTiaStart2 = cx + rTamTrong*Math.cos(aBien), yTiaStart2 = cy + rTamTrong*Math.sin(aBien);
        html += `<line x1="${xTiaStart2.toFixed(1)}" y1="${yTiaStart2.toFixed(1)}" x2="${xOut.toFixed(1)}" y2="${yOut.toFixed(1)}" stroke="${mauRanh8}" stroke-width="1.5" opacity="0.9"/>`;
    });

    // Kim chỉ nam (cố định)
    let radMui = (houseFacing-90)*Math.PI/180, radVG = radMui + Math.PI/2;
    let xVG1 = cx+rTia*Math.cos(radVG), yVG1 = cy+rTia*Math.sin(radVG);
    let xVG2 = cx-rTia*Math.cos(radVG), yVG2 = cy-rTia*Math.sin(radVG);
    html += `<line x1="${xVG1.toFixed(1)}" y1="${yVG1.toFixed(1)}" x2="${xVG2.toFixed(1)}" y2="${yVG2.toFixed(1)}" stroke="#00c8c8" stroke-width="1.5" opacity="1"/>`;

    function arrow(rad, xTip, yTip, mau) {
        let tl=17, ta=0.29;//tl = chiều dài cánh, ta = góc mở
        let x1a = xTip-tl*Math.cos(rad-ta), y1a = yTip-tl*Math.sin(rad-ta);
        let x2a = xTip-tl*Math.cos(rad+ta), y2a = yTip-tl*Math.sin(rad+ta);
        return `<polygon points="${xTip.toFixed(1)},${yTip.toFixed(1)} ${x1a.toFixed(1)},${y1a.toFixed(1)} ${x2a.toFixed(1)},${y2a.toFixed(1)}" fill="${mau}" opacity="0.9"/>`;
    }
    let radTy = (0-90)*Math.PI/180;
    let xTyF = cx+rKim*Math.cos(radTy), yTyF = cy+rKim*Math.sin(radTy);
    let xTyB = cx-rKim*Math.cos(radTy), yTyB = cy-rKim*Math.sin(radTy);
    html += `<line x1="${xTyB.toFixed(1)}" y1="${yTyB.toFixed(1)}" x2="${xTyF.toFixed(1)}" y2="${yTyF.toFixed(1)}" stroke="#FFD700" stroke-width="1.8" opacity="0.9"/>`;
    html += arrow(radTy, xTyF, yTyF, "#FFD700");
    let xHF = cx+rKim*Math.cos(radMui), yHF = cy+rKim*Math.sin(radMui);
    let xHB = cx-rKim*Math.cos(radMui), yHB = cy-rKim*Math.sin(radMui);
    html += `<line x1="${xHB.toFixed(1)}" y1="${yHB.toFixed(1)}" x2="${xHF.toFixed(1)}" y2="${yHF.toFixed(1)}" stroke="#00c8c8" stroke-width="1.8"/>`;
    html += arrow(radMui, xHF, yHF, "#00c8c8");
    if (showLabel) {
        let xLH = cx+(rDoSo+40)*Math.cos(radMui), yLH = cy+(rDoSo+40)*Math.sin(radMui);
        html += `<text x="${xLH.toFixed(1)}" y="${yLH.toFixed(1)}" font-size="${fontSize+3}" font-weight="800" fill="#ff0000" stroke="#fff" stroke-width="1.5" paint-order="stroke" text-anchor="middle" transform="rotate(${houseFacing} ${xLH.toFixed(1)} ${yLH.toFixed(1)})">▲ HƯỚNG NHÀ</text>`;
    }
    // Chấm đỏ tâm (nền trắng mờ)
    html += `<circle cx="${cx}" cy="${cy}" r="7" fill="#ff1a1a" stroke="#ffffff" stroke-width="2.5"/></g>`;
    svg.innerHTML = html;
}
 // xoay cửu cung
        const BEARING_CUA_CUNG = {"Khảm":0,"Cấn":45,"Chấn":90,"Tốn":135,"Ly":180,"Khôn":225,"Đoài":270,"Càn":315};
        const CUNG_SO_TO_TEN2 = {1:"Khảm",2:"Khôn",3:"Chấn",4:"Tốn",5:"Trung",6:"Càn",7:"Đoài",8:"Cấn",9:"Ly"};
        // slot lưới 3x3 (order css): 0=trên-trái 1=trên-giữa 2=trên-phải 3=trái 4=giữa 5=phải 6=dưới-trái 7=dưới-giữa 8=dưới-phải
        const REL_TO_SLOT = {0:1, 45:2, 90:5, 135:8, 180:7, 225:6, 270:3, 315:0};

        function boTriLuoiTheoHuong(goc) {
            let grid = document.querySelector(".cuu-cung-grid");
            if (!grid) return;
            for (let c = 1; c <= 9; c++) {
                let cell = document.getElementById("cung-" + c);
                if (!cell) continue;
                if (c === 5) { cell.style.order = 4; continue; }
                let bearing = BEARING_CUA_CUNG[CUNG_SO_TO_TEN2[c]];
                let rel = (((bearing - goc) % 360) + 360) % 360;
                rel = Math.round(rel / 45) * 45 % 360;
                cell.style.order = REL_TO_SLOT[rel];
            }
        }
        window.boTriLuoiTheoHuong = boTriLuoiTheoHuong;
        //=======Kết thúc củu cung xoay

        // Đọc font-size ban đầu từ chính input HTML (#tpFontSize) thay vì hardcode — để thay đổi
        // value trong index.html (vd 10 -> 17) có tác dụng ngay khi tải trang, không cần đợi người
        // dùng kéo thanh trượt mới cập nhật.
        var _tpFontSizeInputEl = document.getElementById("tpFontSize");
        var huongHienTai = 180, tpFontSize = _tpFontSizeInputEl ? (parseInt(_tpFontSizeInputEl.value) || 18) : 18;
        (function () {
            var lbl = document.getElementById("tpFontSizeLabel");
            if (lbl) lbl.textContent = tpFontSize + "px";
        })();

        function capNhatHuongTuDoSo() {
            let val = parseFloat(document.getElementById("doSoTay").value) || 0; huongHienTai = val;
            document.getElementById("houseFacing").value = val; document.getElementById("tnHuongLaBan").value = val;
            if (typeof veCompassOverlay !== 'undefined') veCompassOverlay(val);
            updateTamNhaCompassHeading(); redrawTamNha(); xoayLaBan(val);
            boTriLuoiTheoHuong(val);   // cửu cung xoay
            let sel = document.getElementById("huong24Son"), best = 0, bestDiff = 999;
            for (let i = 0; i < sel.options.length; i++) { let diff = Math.abs(parseFloat(sel.options[i].value)-val); if (diff < bestDiff) { bestDiff = diff; best = i; } }
            sel.selectedIndex = best;
        }
        function capNhatHuongTuThuyPhap() {
            let val = parseFloat(document.getElementById("houseFacing").value) || 0; huongHienTai = val;
            document.getElementById("doSoTay").value = val; document.getElementById("tnHuongLaBan").value = val;
            if (typeof veCompassOverlay !== 'undefined') veCompassOverlay(val);
            updateTamNhaCompassHeading(); redrawTamNha(); xoayLaBan(val);
            boTriLuoiTheoHuong(val);   // cửu cung xoay
            let sel = document.getElementById("huong24Son"), best = 0, bestDiff = 999;
            for (let i = 0; i < sel.options.length; i++) { let diff = Math.abs(parseFloat(sel.options[i].value)-val); if (diff < bestDiff) { bestDiff = diff; best = i; } }
            sel.selectedIndex = best;
        }
        function capNhatHuongTuTamNha() {
            let val = parseFloat(document.getElementById("tnHuongLaBan").value) || 0; huongHienTai = val;
            document.getElementById("doSoTay").value = val; document.getElementById("houseFacing").value = val;
            if (typeof veCompassOverlay !== 'undefined') veCompassOverlay(val);
            xoayLaBan(val);
            boTriLuoiTheoHuong(val);   // cửu cung xoay
            let sel = document.getElementById("huong24Son"), best = 0, bestDiff = 999;
            for (let i = 0; i < sel.options.length; i++) { let diff = Math.abs(parseFloat(sel.options[i].value)-val); if (diff < bestDiff) { bestDiff = diff; best = i; } }
            sel.selectedIndex = best;
            updateTamNhaCompassHeading(); redrawTamNha();
        }
        function capNhatFontSizeThuyPhap(val) {
            tpFontSize = parseInt(val); document.getElementById('tpFontSizeLabel').textContent = tpFontSize + 'px';
            var houseFacing = parseFloat(document.getElementById('houseFacing').value) || 0;
            if (typeof veCompassOverlay === 'function') veCompassOverlay(houseFacing);
        }

        const laBan = document.getElementById("laBan24Son");
        DS24_SON.forEach((s) => { let el = document.createElement("div"); el.className = "son-text"; el.innerText = s.ten; el.style.transform = "rotate(" + s.goc + "deg)"; laBan.appendChild(el); });
        function xoayLaBan(goc) { laBan.style.transform = "rotate(" + (-goc) + "deg)"; document.getElementById("doSoRing").style.transform = "rotate(" + (-goc) + "deg)"; }
        function chonHuong24Son() { let val = parseFloat(document.getElementById("huong24Son").value); document.getElementById("doSoTay").value = Math.round(val); capNhatHuongTuDoSo(); }

        function veVongDoSo() {
            const svg = document.getElementById("doSoRing"), cx = 200, cy = 200;
            const rCompass = 165, rTickIn = rCompass+1, rTickOut = rCompass+7, rText = rCompass+12;
            let html = "";
            for (let deg = 0; deg < 360; deg += 15) {
                let rad = (deg-90)*Math.PI/180;
                let x1 = cx+rTickIn*Math.cos(rad), y1 = cy+rTickIn*Math.sin(rad);
                let x2 = cx+rTickOut*Math.cos(rad), y2 = cy+rTickOut*Math.sin(rad);
                let xt = cx+rText*Math.cos(rad), yt = cy+rText*Math.sin(rad);
                html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#5c4a3a" stroke-width="1.2"/>`;
                html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="12" font-weight="700" fill="#4a3a2c" text-anchor="middle" dominant-baseline="middle" transform="rotate(${deg} ${xt.toFixed(1)} ${yt.toFixed(1)})">${deg}°</text>`;
            }
            svg.innerHTML = html;
        }

        // ===== Vòng NGUYÊN LONG (Địa/Thiên/Nhân + Âm/Dương) — chèn GIỮA vòng 24 sơn (mép ngoài
        // compass-circle, r≈160-168) và vòng 8 Hướng (bị đẩy vào trong hơn ở dưới). Dữ liệu lấy
        // thẳng từ DS24_SON.nguyenLong/amDuong (shared.js) — không tạo bảng riêng, tránh trùng lặp
        // nguồn dữ liệu với phần đã dùng cho thuật toán thế quái (xacDinhChieuBayTheoNguyenLong).
        // Dương = đỏ, Âm = xanh dương, theo đúng yêu cầu.
        function veVongNguyenLong() {
            const svg = document.getElementById("doSoRing"), cx = 200, cy = 200;
            const rLineIn = 130, rLineOut = 155, rText = 145; // dải bán kính: NGOÀI 8 Hướng, TRONG 24 Sơn
            const tenNguyenLong = { "Dia": "Địa", "Thien": "Thiên", "Nhan": "Nhân" };
            let html = "";
            // Vạch chia nhẹ tại ranh giới mỗi sơn (deg ± 7.5°) để tách 24 ô Nguyên Long
            for (let deg = 0; deg < 360; deg += 15) {
                let degBienGioi = deg + 7.5;
                let rad = (degBienGioi - 90) * Math.PI / 180;
                let x1 = cx + rLineIn * Math.cos(rad), y1 = cy + rLineIn * Math.sin(rad);
                let x2 = cx + rLineOut * Math.cos(rad), y2 = cy + rLineOut * Math.sin(rad);
                html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#bbb" stroke-width="0.7"/>`;
            }
            // Nhãn Địa/Thiên/Nhân tại đúng góc từng sơn trong DS24_SON, màu theo Âm/Dương
            DS24_SON.forEach(s => {
                let rad = (s.goc - 90) * Math.PI / 180;
                let xt = cx + rText * Math.cos(rad), yt = cy + rText * Math.sin(rad);
                let mau = s.amDuong === "Duong" ? "#c62828" : "#1565c0"; // Dương = đỏ, Âm = xanh dương
                let nhan = tenNguyenLong[s.nguyenLong] || "";
                html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="8.5" font-weight="700" fill="${mau}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${s.goc} ${xt.toFixed(1)} ${yt.toFixed(1)})">${nhan}</text>`;
            });
            svg.insertAdjacentHTML("beforeend", html);
        }

        // ===== Vòng phân định 8 HƯỚNG (Bắc/Đông Bắc/Đông/.../Tây Bắc) — bổ sung thêm cho vòng
        // 24 sơn đã có sẵn (veVongDoSo). Đường phân định vẽ tại RANH GIỚI giữa 2 hướng liền kề
        // (deg+22.5°, ví dụ đường qua 22.5° phân định Bắc/Đông Bắc), nhãn tên đặt tại TÂM mỗi
        // hướng (deg) như cũ. Đặt ở dải bán kính TRONG CÙNG (trong vòng Nguyên Long) để đúng thứ
        // tự từ ngoài vào trong: độ số → vạch chia → 24 sơn → Nguyên Long → 8 hướng.
        const BAT_HUONG = [
            {deg:0,   ten:"1-Bắc💧Khảm☵"},   {deg:45,  ten:"8-ĐB🏔️Cấn☶"},
            {deg:90,  ten:"3-Đông🌳Chấn☳"},  {deg:135, ten:"4-ĐN🌳Tốn☴"},
            {deg:180, ten:"9-Nam🔥Ly☲"},   {deg:225, ten:"2-TN🏔️Khôn☷"},
            {deg:270, ten:"7-Tây💍Đoài☱"},   {deg:315, ten:"6-TB💍Càn☰"}
        ];
        function veVong8Huong() {
            const svg = document.getElementById("doSoRing"), cx = 200, cy = 200;
            const rLineIn = 145, rLineOut = 197; // đường phân định: từ gần tâm ra sát mép trong của vòng Nguyên Long
            const rText = 193; // nhãn hướng nằm trong dải trước khi chạm vòng Nguyên Long
            const mauChuHuong = "#e86002"; // màu cam cho tên 8 hướng
            let html = "";
            // 1) Đường phân định — tại ranh giới giữa 2 hướng liền kề (deg + 22.5)
            BAT_HUONG.forEach(h => {
                let degBienGioi = h.deg + 22.5;
                let rad = (degBienGioi - 90) * Math.PI / 180;
                let x1 = cx + rLineIn * Math.cos(rad), y1 = cy + rLineIn * Math.sin(rad);
                let x2 = cx + rLineOut * Math.cos(rad), y2 = cy + rLineOut * Math.sin(rad);
                html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#8b1a1a" stroke-width="1.5" opacity="0.55"/>`;
            });
            // 2) Nhãn tên hướng — tại tâm mỗi hướng (deg), màu nâu
            BAT_HUONG.forEach(h => {
                let rad = (h.deg - 90) * Math.PI / 180;
                let xt = cx + rText * Math.cos(rad), yt = cy + rText * Math.sin(rad);
                html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="12.5" font-weight="800" fill="${mauChuHuong}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${h.deg} ${xt.toFixed(1)} ${yt.toFixed(1)})">${h.ten}</text>`;
            });
            // Nối thêm vào SVG (không dùng innerHTML= để khỏi xóa mất vòng 24 sơn đã vẽ trước đó)
            svg.insertAdjacentHTML("beforeend", html);
        }

        // ===== KIM CHỈ NAM — cố định từ 6h (Tọa) đến 12h (Hướng), KHÔNG xoay theo la bàn =====
        // Khác với doSoRing/laBan24Son (xoay theo xoayLaBan khi đổi hướng nhà), kim này luôn đứng
        // yên ở đúng trục dọc màn hình để làm điểm đọc cố định: đầu kim trên (12h) luôn chỉ đúng
        // sơn/hướng đang ở vị trí Hướng (vì la bàn xoay sao cho hướng nhà luôn nằm ở 12h — xem
        // ghi chú "Chú ý" cạnh la bàn), đầu kim dưới (6h) chỉ đúng sơn đang ở vị trí Tọa.
        function veKimChiNam() {
            const svg = document.getElementById("kimChiNam"), cx = 200, cy = 200;
            const rKim = 168; // chỉ dài tới đúng vòng tròn nâu (viền compass-circle) — không vươn ra vòng tên/độ số bên ngoài
            const mauKim = "#1565c0"; // xanh dương
            let html = "";
            html += `<line x1="${cx}" y1="${cy-rKim}" x2="${cx}" y2="${cy+rKim}" stroke="${mauKim}" stroke-width="1.2" opacity="0.92"/>`;
            // Đầu kim trên (12h, phía Hướng) — mũi tên tam giác để phân biệt với đầu dưới
            html += `<polygon points="${cx-7},${cy-rKim+14} ${cx+7},${cy-rKim+14} ${cx},${cy-rKim-2}" fill="${mauKim}" opacity="0.92"/>`;
            // Tâm xoay (điểm giữa la bàn)
            html += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${mauKim}" stroke="#fff" stroke-width="1.2"/>`;
            svg.innerHTML = html;
        }

        veVongDoSo();
        veVongNguyenLong();
        veVong8Huong();
        veKimChiNam();
        boTriLuoiTheoHuong(180);//cửu cung xoay

// ====================================================================
// ĐỒNG BỘ BẢN VẼ KHUNG NHÀ GIỮA TÂM NHÀ ↔ CỬU CUNG LƯỚI
// Cạnh AB (Tâm Nhà) tương ứng cạnh Đ1→Đ2 (Cửu Cung Lưới), cùng số đỉnh,
// cùng chiều dài thực tế (m) và cùng hướng la bàn thực tế của từng cạnh.
// Lưu ý hệ trục: Tâm Nhà dùng world-space Y hướng lên (Y-up), còn Cửu Cung
// Lưới dùng toạ độ SVG Y hướng xuống (Y-down) — nên khi quy đổi phải đảo
// dấu trục Y để hướng thực tế (bearing) của từng cạnh không bị lật ngược.
// ====================================================================
function _dongBoDoiChieuHinh(sourcePts, pxPerMeterSource, destStart, pxPerMeterDest) {
    var n = sourcePts.length;
    var dest = [{ x: destStart.x, y: destStart.y }];
    for (var i = 0; i < n - 1; i++) {
        var dxM = (sourcePts[i + 1].x - sourcePts[i].x) / pxPerMeterSource;
        var dyM = (sourcePts[i + 1].y - sourcePts[i].y) / pxPerMeterSource; // mét, còn theo chiều Y gốc
        var prev = dest[i];
        dest.push({ x: prev.x + dxM * pxPerMeterDest, y: prev.y - dyM * pxPerMeterDest }); // đảo trục Y khi sang hệ kia
    }
    return dest;
}

// Quy đổi 1 điểm bất kỳ (không chỉ đỉnh khung nhà) từ hệ nguồn sang hệ đích, neo theo
// cùng gốc quy chiếu đã dùng khi đồng bộ khung nhà (originSource -> originDest), để phòng
// (rooms) giữ đúng vị trí tương đối so với khung nhà sau khi đồng bộ.
function _dongBoDoiChieuDiem(pt, pxPerMeterSource, originSource, pxPerMeterDest, originDest) {
    var dxM = (pt.x - originSource.x) / pxPerMeterSource;
    var dyM = (pt.y - originSource.y) / pxPerMeterSource;
    return { x: originDest.x + dxM * pxPerMeterDest, y: originDest.y - dyM * pxPerMeterDest };
}

// Quy đổi toàn bộ danh sách phòng (mỗi phòng là 1 mảng điểm) từ hệ nguồn sang hệ đích.
function _dongBoDoiChieuPhong(roomsSource, pxPerMeterSource, originSource, pxPerMeterDest, originDest) {
    return (roomsSource || []).map(function (r) {
        return {
            id: r.id,
            points: (r.points || []).map(function (p) {
                return _dongBoDoiChieuDiem(p, pxPerMeterSource, originSource, pxPerMeterDest, originDest);
            }),
            color: r.color,
            label: r.label,
            locked: !!r.locked,
            lockedEdges: Array.isArray(r.lockedEdges) ? r.lockedEdges.map(function (v) { return !!v; }) : []
        };
    });
}

// Cửa (doors) dùng edgeIndex (chỉ số cạnh) + offset/width tính bằng MÉT — không phụ thuộc hệ
// toạ độ px/world, nên chỉ cần sao chép sâu, không cần quy đổi, miễn số cạnh khớp thứ tự
// (đúng vì _dongBoDoiChieuHinh luôn giữ nguyên số đỉnh và thứ tự Đ1→Đ2→...).
function _dongBoSaoChepCua(doorsSource) {
    return JSON.parse(JSON.stringify(doorsSource || []));
}

function dongBoTamNhaSangCuuCung() {
    if (typeof tamNhaData === "undefined" || !Array.isArray(tamNhaData.vertices) || tamNhaData.vertices.length < 3 || !tamNhaData.closed) {
        alert("⚠️ Cần vẽ xong và bấm 🔒 Đóng hình nhà ở tab Tâm Nhà (ít nhất 3 đỉnh) trước khi đồng bộ.");
        return;
    }
    if (typeof window.apDungShapeCuuCung !== "function") {
        alert("⚠️ Chưa sẵn sàng: hãy mở qua tab Cửu Cung Lưới ít nhất 1 lần rồi thử lại.");
        return;
    }
    if (!confirm("⚠️ Thao tác này sẽ GHI ĐÈ hoàn toàn khung nhà + phòng + cửa hiện có ở Cửu Cung Lưới bằng dữ liệu từ Tâm Nhà. Dữ liệu cũ bên Cửu Cung Lưới sẽ mất. Tiếp tục?")) {
        return;
    }
    var pxPerMeterTN = tamNhaData.pxPerMeter || 10;
    var scaleEl = document.getElementById("scaleInput");
    var pxPerMeterCC = scaleEl ? (parseFloat(scaleEl.value) || 20) : 20;
    var startCC = (window.currentPoints && window.currentPoints.length > 0) ? { x: window.currentPoints[0].x, y: window.currentPoints[0].y } : { x: 200, y: 150 };
    var startTN = tamNhaData.vertices[0];

    var newPoints = _dongBoDoiChieuHinh(tamNhaData.vertices, pxPerMeterTN, startCC, pxPerMeterCC);
    window.apDungShapeCuuCung(newPoints);

    // Đồng bộ PHÒNG (quy đổi toạ độ theo cùng gốc Đ1 vừa dùng ở trên)
    var roomsTN = (window.VePhongModuleTamNha && typeof window.VePhongModuleTamNha.getRooms === 'function')
        ? window.VePhongModuleTamNha.getRooms() : [];
    var newRooms = _dongBoDoiChieuPhong(roomsTN, pxPerMeterTN, startTN, pxPerMeterCC, startCC);
    if (window.VePhongModule && typeof window.VePhongModule.setRooms === 'function') {
        window.VePhongModule.setRooms(newRooms);
    }

    // Đồng bộ CỬA (edgeIndex + mét — sao chép trực tiếp, không quy đổi toạ độ)
    if (typeof window.apDungDoorsCuuCung === "function") {
        window.apDungDoorsCuuCung(_dongBoSaoChepCua(tamNhaData.doors));
    }

    alert("✅ Đã đồng bộ khung nhà + " + newRooms.length + " phòng + cửa từ Tâm Nhà sang Cửu Cung Lưới (" + newPoints.length + " đỉnh — Đ1→Đ2 = cạnh AB bên Tâm Nhà). Dữ liệu cũ bên Cửu Cung Lưới đã bị ghi đè.");
}
window.dongBoTamNhaSangCuuCung = dongBoTamNhaSangCuuCung;

function dongBoCuuCungSangTamNha() {
    if (!window.currentPoints || window.currentPoints.length < 3) {
        alert("⚠️ Cần có hình nhà ở tab Cửu Cung Lưới trước khi đồng bộ.");
        return;
    }
    if (typeof tamNhaData === "undefined" || typeof redrawTamNha !== "function") {
        alert("⚠️ Chưa sẵn sàng: hãy mở qua tab Tâm Nhà ít nhất 1 lần rồi thử lại.");
        return;
    }
    if (!confirm("⚠️ Thao tác này sẽ GHI ĐÈ hoàn toàn khung nhà + phòng + cửa hiện có ở Tâm Nhà bằng dữ liệu từ Cửu Cung Lưới. Dữ liệu cũ bên Tâm Nhà sẽ mất. Tiếp tục?")) {
        return;
    }
    var scaleEl = document.getElementById("scaleInput");
    var pxPerMeterCC = scaleEl ? (parseFloat(scaleEl.value) || 20) : 20;
    var pxPerMeterTN = tamNhaData.pxPerMeter || 10;
    var startCC = window.currentPoints[0];
    var startTN = (tamNhaData.vertices && tamNhaData.vertices.length > 0) ? { x: tamNhaData.vertices[0].x, y: tamNhaData.vertices[0].y } : { x: 0, y: 0 };

    var newVertices = _dongBoDoiChieuHinh(window.currentPoints, pxPerMeterCC, startTN, pxPerMeterTN);
    tamNhaData.vertices = newVertices;
    tamNhaData.closed = true;
    tamNhaData.lockedEdges = newVertices.map(function () { return false; });

    // Đồng bộ PHÒNG (quy đổi toạ độ theo cùng gốc Đ1 vừa dùng ở trên)
    var roomsCC = (window.VePhongModule && typeof window.VePhongModule.getRooms === 'function')
        ? window.VePhongModule.getRooms() : [];
    var newRooms = _dongBoDoiChieuPhong(roomsCC, pxPerMeterCC, startCC, pxPerMeterTN, startTN);
    if (window.VePhongModuleTamNha && typeof window.VePhongModuleTamNha.setRooms === 'function') {
        window.VePhongModuleTamNha.setRooms(newRooms);
    }

    // Đồng bộ CỬA (edgeIndex + mét — sao chép trực tiếp, không quy đổi toạ độ)
    tamNhaData.doors = _dongBoSaoChepCua(window.__cuuCungDoorsGetter ? window.__cuuCungDoorsGetter() : []);

    // Tính lại TÂM NHÀ ngay lập tức (không để null) — CuaModule.svgForDoors cần centroidWorld hợp lệ
    // để xác định đúng chiều "mở vào/mở ra" của cửa; nếu để null, cửa sẽ vẽ tạm theo chiều đa giác
    // thô (phụ thuộc thứ tự đỉnh), có thể NGƯỢC với chiều đã đúng bên Cửu Cung Lưới.
    var coTam = (typeof computeAndSetTamNhaCentroid === "function") ? computeAndSetTamNhaCentroid(true) : false;

    var kq = document.getElementById('tnKetQuaTam'); if (!coTam && kq) kq.style.display = 'none';
    if (typeof renderTamNhaEdgeList === "function") renderTamNhaEdgeList();
    if (typeof window.renderDoorList === "function") window.renderDoorList();
    redrawTamNha();
    alert("✅ Đã đồng bộ khung nhà + " + newRooms.length + " phòng + cửa từ Cửu Cung Lưới sang Tâm Nhà (" + newVertices.length + " đỉnh — cạnh AB = Đ1→Đ2 bên Cửu Cung Lưới), và tính lại tâm nhà. Dữ liệu cũ bên Tâm Nhà đã bị ghi đè.");
}
window.dongBoCuuCungSangTamNha = dongBoCuuCungSangTamNha;

// ====================================================================
// CUNG MỆNH GIA CHỦ — tính theo năm sinh DƯƠNG LỊCH (cách rút gọn, không qua Can Chi/Tam Nguyên).
// Cách tính: cộng các chữ số năm sinh -> nếu >9 cộng tiếp cho tới 1 chữ số; nếu chia hết cho 9 thì
// lấy 9 (không lấy 0). Tra bảng Nam/Nữ ra Quái số (1-9) rồi ra Cung Bát Quái tương ứng.
// Dùng chung toàn app: mọi module (Nội Khí, Thông Tin, Hà-Lạc Luận...) đều gọi window.tinhMenhQuai.
// ====================================================================
const BANG_MENH_QUAI_THEO_SO = {
    // so (1-9): { nam: {quaiSo, cung}, nu: {quaiSo, cung} }
    1: { nam: { quaiSo: 1, cung: "Khảm" }, nu: { quaiSo: 8, cung: "Cấn" } },
    2: { nam: { quaiSo: 9, cung: "Ly" }, nu: { quaiSo: 6, cung: "Càn" } },
    3: { nam: { quaiSo: 8, cung: "Cấn" }, nu: { quaiSo: 7, cung: "Đoài" } },
    4: { nam: { quaiSo: 7, cung: "Đoài" }, nu: { quaiSo: 8, cung: "Cấn" } },
    5: { nam: { quaiSo: 6, cung: "Càn" }, nu: { quaiSo: 9, cung: "Ly" } },
    6: { nam: { quaiSo: 2, cung: "Khôn" }, nu: { quaiSo: 1, cung: "Khảm" } },
    7: { nam: { quaiSo: 3, cung: "Chấn" }, nu: { quaiSo: 2, cung: "Khôn" } },
    8: { nam: { quaiSo: 2, cung: "Khôn" }, nu: { quaiSo: 3, cung: "Chấn" } },
    9: { nam: { quaiSo: 4, cung: "Tốn" }, nu: { quaiSo: 9, cung: "Ly" } }
};
// Nhóm Đông tứ mệnh / Tây tứ mệnh theo Cung
const NHOM_DONG_TAY_TU_MENH = {
    "Khảm": "Đông Tứ Mệnh", "Ly": "Đông Tứ Mệnh", "Chấn": "Đông Tứ Mệnh", "Tốn": "Đông Tứ Mệnh",
    "Càn": "Tây Tứ Mệnh", "Khôn": "Tây Tứ Mệnh", "Cấn": "Tây Tứ Mệnh", "Đoài": "Tây Tứ Mệnh"
};
// Ngũ hành theo Cung (Hậu Thiên Bát Quái) — dùng riêng cho module này, tách khỏi HANH_CUA_CUNG bên
// phi-tinh.js để tinhMenhQuai không phụ thuộc thứ tự nạp file (shared.js có thể được nạp trước).
const HANH_CUA_CUNG_MENH = { "Khảm": "Thủy", "Khôn": "Thổ", "Chấn": "Mộc", "Tốn": "Mộc", "Càn": "Kim", "Đoài": "Kim", "Cấn": "Thổ", "Ly": "Hỏa" };

function tinhTongChuSoVeMotChuSo(soNam) {
    let n = Math.abs(parseInt(soNam) || 0);
    if (n === 0) return 0;
    let tong = String(n).split("").reduce((s, ch) => s + (parseInt(ch) || 0), 0);
    while (tong > 9) {
        tong = String(tong).split("").reduce((s, ch) => s + (parseInt(ch) || 0), 0);
    }
    return tong === 0 ? 9 : tong; // tổng rút gọn = 0 chỉ xảy ra khi tổng gốc chia hết cho 9 -> quy ước lấy 9
}

// Trả về { namSinh, gioiTinh, soRutGon, quaiSo, cung, hanh, nhom } hoặc null nếu năm sinh không hợp lệ.
function tinhMenhQuai(namSinhDuongLich, gioiTinh) {
    let nam = parseInt(namSinhDuongLich);
    if (!nam || isNaN(nam)) return null;
    let soRutGon = tinhTongChuSoVeMotChuSo(nam);
    let hang = BANG_MENH_QUAI_THEO_SO[soRutGon];
    if (!hang) return null;
    let gt = (gioiTinh === "nu") ? "nu" : "nam";
    let ket = hang[gt];
    let cung = ket.cung;
    let hanh = HANH_CUA_CUNG_MENH[cung];
    let nhom = NHOM_DONG_TAY_TU_MENH[cung];
    return {
        namSinh: nam,
        gioiTinh: gt,
        soRutGon: soRutGon,
        quaiSo: ket.quaiSo,
        cung: cung,
        hanh: hanh,
        nhom: nhom
    };
}
window.tinhMenhQuai = tinhMenhQuai;

// ====================================================================
// NẠP ÂM NGŨ HÀNH — tính theo Can Chi năm sinh DƯƠNG LỊCH (nam/nữ như nhau).
// Công thức: số Can + số Chi (nếu >5 thì trừ 5) -> tra Ngũ hành.
// Dùng chung toàn app qua window.tinhNapAmNguHanh.
// ====================================================================
const NAM_CAN_NAP_AM = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI_NAP_AM = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const SO_CAN_NAP_AM = { "Giáp": 1, "Ất": 1, "Bính": 2, "Đinh": 2, "Mậu": 3, "Kỷ": 3, "Canh": 4, "Tân": 4, "Nhâm": 5, "Quý": 5 };
const SO_CHI_NAP_AM = { "Tý": 0, "Sửu": 0, "Ngọ": 0, "Mùi": 0, "Dần": 1, "Mão": 1, "Thân": 1, "Dậu": 1, "Thìn": 2, "Tỵ": 2, "Tuất": 2, "Hợi": 2 };
const NGU_HANH_THEO_SO_NAP_AM = { 1: "Kim", 2: "Thủy", 3: "Hỏa", 4: "Thổ", 5: "Mộc" };

// Trả về { namSinh, can, chi, canChi, hanh } hoặc null nếu năm sinh không hợp lệ.
function tinhNapAmNguHanh(namSinhDuongLich) {
    let nam = parseInt(namSinhDuongLich);
    if (!nam || isNaN(nam)) return null;
    let can = NAM_CAN_NAP_AM[(nam + 6) % 10];
    let chi = CHI_NAP_AM[(nam + 8) % 12];
    let soCan = SO_CAN_NAP_AM[can];
    let soChi = SO_CHI_NAP_AM[chi];
    let tong = soCan + soChi;
    if (tong > 5) tong -= 5;
    let hanh = NGU_HANH_THEO_SO_NAP_AM[tong];
    return {
        namSinh: nam,
        can: can,
        chi: chi,
        canChi: can + " " + chi,
        hanh: hanh
    };
}
window.tinhNapAmNguHanh = tinhNapAmNguHanh;
