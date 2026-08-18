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
        var mauTiaHienTai = "#5c4a3a";
        var mauRanh8HienTai = "#ff0000";
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

        function veCompassChung(svgId, cx, cy, houseFacing, options) {
            const svg = document.getElementById(svgId); if (!svg) return;
            const { rDoSo=430,rDoTick=410,rDoText=390,r8Outer=360,r8Inner=300,r8Text=330,r24Outer=270,r24Inner=170,r24Text=250,
                    rTia=1400,rKim=420,doMo=0.7,mauTia=mauTiaHienTai,isReset=false,resetOffset=0,sonDen=null,sonDi=null,
                    showLabel=true,fontSize=10,mauRanh8=mauRanh8HienTai } = options || {};
            let totalRotation = isReset ? resetOffset : 0;
            let html = `<g transform="rotate(${totalRotation}, ${cx}, ${cy})">`;
            html += `<circle cx="${cx}" cy="${cy}" r="${rDoSo}" fill="none" stroke="#5c4a3a" stroke-width="0.5" opacity="0.9"/>`;
            for (let deg = 0; deg < 360; deg += 5) {
                let rad = (deg - 90) * Math.PI / 180;
                let isMajor = deg % 30 === 0;      // vạch tick to/đậm — vẫn giữ mỗi 30° như cũ
                let showDeg = deg % 10 === 0;       // SỐ ĐỘ hiển thị — đổi sang mỗi 10° theo yêu cầu (trước là trùng isMajor, tức 30°)
                let rIn = isMajor ? rDoTick - 8 : rDoTick;
                let x1 = cx + rIn * Math.cos(rad), y1 = cy + rIn * Math.sin(rad);
                let x2 = cx + rDoSo * Math.cos(rad), y2 = cy + rDoSo * Math.sin(rad);
                html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#fff" stroke-width="${isMajor?4:2.5}" opacity="0.8"/>`;
                html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#2a2a2a" stroke-width="${isMajor?2:1}" opacity="0.9"/>`;
                if (showDeg) {
                    let xt = cx + rDoText * Math.cos(rad), yt = cy + rDoText * Math.sin(rad);
                    html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${fontSize+2}" font-weight="600" fill="#2a2a2a" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${deg} ${xt.toFixed(1)} ${yt.toFixed(1)})">${deg}</text>`;
                }
            }
            DS8_HUONG.forEach((h, i) => {
                let rs = (h.goc - 22.5 - 90) * Math.PI / 180, re = (h.goc + 22.5 - 90) * Math.PI / 180;
                let xS = cx + r8Outer*Math.cos(rs), yS = cy + r8Outer*Math.sin(rs);
                let xE = cx + r8Outer*Math.cos(re), yE = cy + r8Outer*Math.sin(re);
                let xSi = cx + r8Inner*Math.cos(re), ySi = cy + r8Inner*Math.sin(re);
                let xEi = cx + r8Inner*Math.cos(rs), yEi = cy + r8Inner*Math.sin(rs);
                html += `<path d="M${xS.toFixed(1)},${yS.toFixed(1)} A${r8Outer},${r8Outer} 0 0,1 ${xE.toFixed(1)},${yE.toFixed(1)} L${xSi.toFixed(1)},${ySi.toFixed(1)} A${r8Inner},${r8Inner} 0 0,0 ${xEi.toFixed(1)},${yEi.toFixed(1)} Z" fill="${MAU_BAT_QUAI[i]}" opacity="0.55" stroke="${mauRanh8}" stroke-width="0.1" stroke-opacity="0.5"/>`;
                let rc = (h.goc - 90) * Math.PI / 180, xt = cx + r8Text*Math.cos(rc), yt = cy + r8Text*Math.sin(rc);
                let isMain = h.goc % 90 === 0;
                html += `<text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${isMain?fontSize+4:fontSize+2}" font-weight="700" fill="${isMain?'#8b4500':'#1a1a1a'}" stroke="#fff" stroke-width="2.0" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${h.goc} ${xt.toFixed(1)} ${yt.toFixed(1)})">${h.ten}</text>`;
            });
            DS8_HUONG.forEach((h) => {
                let aBien = (h.goc - 22.5 - 90) * Math.PI / 180;
                let xOut = cx + rTia*Math.cos(aBien), yOut = cy + rTia*Math.sin(aBien);
                html += `<line x1="${cx}" y1="${cy}" x2="${xOut.toFixed(1)}" y2="${yOut.toFixed(1)}" stroke="${mauRanh8}" stroke-width="1.5" opacity="0.9"/>`;
            });
            html += `<circle cx="${cx}" cy="${cy}" r="${r24Outer}" fill="rgba(253,250,242,${doMo*0.85})" stroke="#3a2a1a" stroke-width="0.5" opacity="${Math.max(0.3,doMo)}"/>`;
            html += `<circle cx="${cx}" cy="${cy}" r="${r24Inner}" fill="none" stroke="#5c4a3a" stroke-width="0.5" opacity="0.7"/>`;
            function wedge(tenSon, mauNen, mauVien) {
                let s = DS24_SON.find(x => x.ten === tenSon); if (!s) return "";
                let rs = (s.goc - 7.5 - 90)*Math.PI/180, re = (s.goc + 7.5 - 90)*Math.PI/180;
                let xs = cx+r24Outer*Math.cos(rs), ys = cy+r24Outer*Math.sin(rs);
                let xe = cx+r24Outer*Math.cos(re), ye = cy+r24Outer*Math.sin(re);
                return `<path d="M${cx},${cy} L${xs.toFixed(1)},${ys.toFixed(1)} A${r24Outer},${r24Outer} 0 0,1 ${xe.toFixed(1)},${ye.toFixed(1)} Z" fill="${mauNen}" stroke="${mauVien}" stroke-width="2"/>`;
            }
            if (sonDen) html += wedge(sonDen, "rgba(33,150,243,0.38)", "#1565c0");
            if (sonDi) html += wedge(sonDi, "rgba(255,152,0,0.38)", "#e65100");
            let sonHuong = timSonTheoGoc(houseFacing).ten;
            html += wedge(sonHuong, "rgba(244,67,54,0.30)", "#b71c1c");
            DS24_SON.forEach(s => {
                let rb = (s.goc - 7.5 - 90)*Math.PI/180;
                let xXa = cx + rTia*Math.cos(rb), yXa = cy + rTia*Math.sin(rb);
                html += `<line x1="${cx}" y1="${cy}" x2="${xXa.toFixed(1)}" y2="${yXa.toFixed(1)}" stroke="${mauTia}" stroke-width="0.4" opacity="0.9"/>`;
                let x1b = cx+(r24Outer-3)*Math.cos(rb), y1b = cy+(r24Outer-3)*Math.sin(rb);
                let x2b = cx+r24Outer*Math.cos(rb), y2b = cy+r24Outer*Math.sin(rb);
                html += `<line x1="${x1b.toFixed(1)}" y1="${y1b.toFixed(1)}" x2="${x2b.toFixed(1)}" y2="${y2b.toFixed(1)}" stroke="#5c4a3a" stroke-width="2"/>`;
                let r = (s.goc-90)*Math.PI/180, xt = cx+r24Text*Math.cos(r), yt = cy+r24Text*Math.sin(r);
                html += `<g transform="rotate(${s.goc} ${xt.toFixed(1)} ${yt.toFixed(1)})"><text x="${xt.toFixed(1)}" y="${yt.toFixed(1)}" font-size="${fontSize}" font-weight="800" fill="#7a1010" stroke="#ffffff" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${s.ten}</text></g>`;
            });
            let radMui = (houseFacing-90)*Math.PI/180, radVG = radMui + Math.PI/2;
            let xVG1 = cx+rTia*Math.cos(radVG), yVG1 = cy+rTia*Math.sin(radVG);
            let xVG2 = cx-rTia*Math.cos(radVG), yVG2 = cy-rTia*Math.sin(radVG);
            html += `<line x1="${xVG1.toFixed(1)}" y1="${yVG1.toFixed(1)}" x2="${xVG2.toFixed(1)}" y2="${yVG2.toFixed(1)}" stroke="#00c8c8" stroke-width="2.5" opacity="0.85"/>`;
            function arrow(rad, xTip, yTip, mau) {
                let tl=20, ta=0.45;
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
            html += `<line x1="${xHB.toFixed(1)}" y1="${yHB.toFixed(1)}" x2="${xHF.toFixed(1)}" y2="${yHF.toFixed(1)}" stroke="#ff0000" stroke-width="1.5"/>`;
            html += arrow(radMui, xHF, yHF, "#ff0000");
            if (showLabel) {
                let xLH = cx+(r8Outer+40)*Math.cos(radMui), yLH = cy+(r8Outer+40)*Math.sin(radMui);
                html += `<text x="${xLH.toFixed(1)}" y="${yLH.toFixed(1)}" font-size="${fontSize+3}" font-weight="800" fill="#ff0000" stroke="#fff" stroke-width="2.5" paint-order="stroke" text-anchor="middle" transform="rotate(${houseFacing} ${xLH.toFixed(1)} ${yLH.toFixed(1)})">▲ HƯỚNG NHÀ</text>`;
            }
            html += `<circle cx="${cx}" cy="${cy}" r="6" fill="#8b0000"/></g>`;
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

        var huongHienTai = 180, tpFontSize = 18;

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
            {deg:0,   ten:"1-Bắc💧Khảm"},   {deg:45,  ten:"8-ĐB🏔️Cấn"},
            {deg:90,  ten:"3-Đông🌳Chấn"},  {deg:135, ten:"4-ĐN🌳Tốn"},
            {deg:180, ten:"9-Nam🔥Ly"},   {deg:225, ten:"2-TN🏔️Khôn"},
            {deg:270, ten:"7-Tây💍Đoài"},   {deg:315, ten:"6-TB💍Càn"}
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
