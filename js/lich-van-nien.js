// ====================================================================
// LỊCH VẠN NIÊN — Tab riêng biệt, giao diện 2 cột Dương-Âm lịch
// Chuyển đổi Dương lịch ↔ Âm lịch + Can Chi + 24 Tiết khí + Giờ tốt
// ====================================================================

const LICH_VAN_NIEN = (function() {
    const CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
    const CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
    const CHI_MONTH = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
    const CHI_ANIMAL = ["Chuột","Trâu","Hổ","Mèo","Rồng","Rắn","Ngựa","Dê","Khỉ","Gà","Chó","Lợn"];
    const MONTH_NAMES = ["Giêng","Hai","Ba","Tư","Năm","Sáu","Bảy","Tám","Chín","Mười","Một","Chạp"];
    const THU_NAMES = ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"];
    const TIME_ZONE = 7.0;

    // Giờ theo Chi: Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi
    // Khung giờ: 23-1, 1-3, 3-5, 5-7, 7-9, 9-11, 11-13, 13-15, 15-17, 17-19, 19-21, 21-23
    const GIO_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
    const GIO_KHUNG = ["23h-1h","1h-3h","3h-5h","5h-7h","7h-9h","9h-11h","11h-13h","13h-15h","15h-17h","17h-19h","19h-21h","21h-23h"];

    // Giờ tốt/xấu theo Can ngày (lục nhâm) — 0=xấu, 1=trung, 2=tốt, 3=rất tốt
    // Theo truyền thống: Giáp/Kỷ → Tý, Dần, Mão, Ngọ, Mùi, Dậu là tốt
    const GIO_TOT_THEO_CAN = {
        "Giáp": [3,0,2,2,0,1,2,0,1,2,0,1],   // Tý=3, Sửu=0, Dần=2, Mão=2, Thìn=0, Tỵ=1, Ngọ=2, Mùi=0, Thân=1, Dậu=2, Tuất=0, Hợi=1
        "Ất":  [1,3,0,2,2,0,1,2,0,1,2,0],
        "Bính":[0,1,3,0,2,2,0,1,2,0,1,2],
        "Đinh":[2,0,1,3,0,2,2,0,1,2,0,1],
        "Mậu": [1,2,0,1,3,0,2,2,0,1,2,0],
        "Kỷ":  [0,1,2,0,1,3,0,2,2,0,1,2],
        "Canh":[2,0,1,2,0,1,3,0,2,2,0,1],
        "Tân": [1,2,0,1,2,0,1,3,0,2,2,0],
        "Nhâm":[0,1,2,0,1,2,0,1,3,0,2,2],
        "Quý": [2,0,1,2,0,1,2,0,1,3,0,2]
    };

    const SOLAR_TERMS = [
        {name:"Lập xuân", long:315, season:"Xuân", type:"Tiết", desc:"Bắt đầu mùa xuân, vạn vật sinh sôi"},
        {name:"Vũ thủy", long:330, season:"Xuân", type:"Khí", desc:"Mưa xuân bắt đầu, băng tan"},
        {name:"Kinh trập", long:345, season:"Xuân", type:"Tiết", desc:"Sấm đầu tiên, côn trùng thức giấc"},
        {name:"Xuân phân", long:0, season:"Xuân", type:"Khí", desc:"Ngày đêm bằng nhau"},
        {name:"Thanh minh", long:15, season:"Xuân", type:"Tiết", desc:"Trời trong sáng, tảo mộ tổ tiên"},
        {name:"Cốc vũ", long:30, season:"Xuân", type:"Khí", desc:"Mưa nuôi ngũ cốc"},
        {name:"Lập hạ", long:45, season:"Hạ", type:"Tiết", desc:"Bắt đầu mùa hạ"},
        {name:"Tiểu mãn", long:60, season:"Hạ", type:"Khí", desc:"Ngũ cốc bắt đầu đầy hạt"},
        {name:"Mang chủng", long:75, season:"Hạ", type:"Tiết", desc:"Lúa mạch chín, gieo lúa"},
        {name:"Hạ chí", long:90, season:"Hạ", type:"Khí", desc:"Ngày dài nhất năm"},
        {name:"Tiểu thử", long:105, season:"Hạ", type:"Tiết", desc:"Nắng nóng bắt đầu"},
        {name:"Đại thử", long:120, season:"Hạ", type:"Khí", desc:"Nắng nóng nhất năm"},
        {name:"Lập thu", long:135, season:"Thu", type:"Tiết", desc:"Bắt đầu mùa thu"},
        {name:"Xử thử", long:150, season:"Thu", type:"Khí", desc:"Nắng nóng giảm dần"},
        {name:"Bạch lộ", long:165, season:"Thu", type:"Tiết", desc:"Sương sớm xuất hiện"},
        {name:"Thu phân", long:180, season:"Thu", type:"Khí", desc:"Ngày đêm bằng nhau"},
        {name:"Hàn lộ", long:195, season:"Thu", type:"Tiết", desc:"Khí lạnh bắt đầu"},
        {name:"Sương giáng", long:210, season:"Thu", type:"Khí", desc:"Sương muối xuất hiện"},
        {name:"Lập đông", long:225, season:"Đông", type:"Tiết", desc:"Bắt đầu mùa đông"},
        {name:"Tiểu tuyết", long:240, season:"Đông", type:"Khí", desc:"Tuyết rơi nhẹ"},
        {name:"Đại tuyết", long:255, season:"Đông", type:"Tiết", desc:"Tuyết rơi nhiều"},
        {name:"Đông chí", long:270, season:"Đông", type:"Khí", desc:"Đêm dài nhất năm"},
        {name:"Tiểu hàn", long:285, season:"Đông", type:"Tiết", desc:"Lạnh bắt đầu"},
        {name:"Đại hàn", long:300, season:"Đông", type:"Khí", desc:"Lạnh nhất năm"}
    ];

    const SEASON_COLORS = {"Xuân": "#4CAF50", "Hạ": "#FF5722", "Thu": "#FF9800", "Đông": "#2196F3"};
    const NGU_HANH_COLORS = {"Mộc": "#4CAF50", "Hỏa": "#F44336", "Thổ": "#8B4513", "Kim": "#FFD700", "Thủy": "#2196F3"};

    function jdFromDate(dd, mm, yy) {
        let a = Math.floor((14 - mm) / 12);
        let y = yy + 4800 - a;
        let m = mm + 12 * a - 3;
        let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
        return jd;
    }

    function getSunLongitude(jd, timeZone) {
        let T = (jd - 2451545.5 - timeZone / 24) / 36525.0;
        let T2 = T * T;
        let dr = Math.PI / 180.0;
        let M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
        let L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
        let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
            + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
        let L = L0 + DL;
        L = L % 360.0;
        if (L < 0) L += 360.0;
        return L;
    }

    function newMoon(k) {
        let T = k / 1236.85;
        let T2 = T * T;
        let T3 = T2 * T;
        let dr = Math.PI / 180;
        let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
        Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
        let M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
        let Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
        let F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
        let C1 = (0.1734 - 0.000393 * T) * Math.sin(dr * M) + 0.0021 * Math.sin(dr * 2 * M)
            - 0.4068 * Math.sin(dr * Mpr) + 0.0161 * Math.sin(dr * 2 * Mpr) - 0.0004 * Math.sin(dr * 3 * Mpr)
            + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr)) - 0.0074 * Math.sin(dr * (M - Mpr))
            + 0.0004 * Math.sin(dr * (2 * F + M)) - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr))
            + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
        let deltat = (T < -11) 
            ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
            : -0.000278 + 0.000265 * T + 0.000262 * T2;
        return Jd1 + C1 - deltat;
    }

    function getNewMoonDay(k, timeZone) {
        return Math.floor(newMoon(k) + 0.5 + timeZone / 24);
    }

    function getLunarMonth11(yy, timeZone) {
        let off = jdFromDate(31, 12, yy) - 2415021;
        let k = Math.floor(off / 29.530588853);
        let nm = getNewMoonDay(k, timeZone);
        let sunLong = Math.floor(getSunLongitude(nm, timeZone) / 180 * 6);
        if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
        return nm;
    }

    function getLeapMonthOffset(a11, timeZone) {
        let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
        let last, i = 1;
        let arc = Math.floor(getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone) / 180 * 6);
        do {
            last = arc;
            i++;
            arc = Math.floor(getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone) / 180 * 6);
        } while (arc !== last && i < 14);
        return i - 1;
    }

    function convertSolar2Lunar(dd, mm, yy, timeZone) {
        let dayNumber = jdFromDate(dd, mm, yy);
        let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
        let monthStart = getNewMoonDay(k + 1, timeZone);
        if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
        let a11 = getLunarMonth11(yy, timeZone);
        let b11 = a11;
        let lunarYear;
        if (a11 >= monthStart) {
            lunarYear = yy;
            a11 = getLunarMonth11(yy - 1, timeZone);
        } else {
            lunarYear = yy + 1;
            b11 = getLunarMonth11(yy + 1, timeZone);
        }
        let lunarDay = dayNumber - monthStart + 1;
        let diff = Math.floor((monthStart - a11) / 29);
        let lunarLeap = 0;
        let lunarMonth = diff + 11;
        if (b11 - a11 > 365) {
            let leapMonthDiff = getLeapMonthOffset(a11, timeZone);
            if (diff >= leapMonthDiff) {
                lunarMonth = diff + 10;
                if (diff === leapMonthDiff) lunarLeap = 1;
            }
        }
        if (lunarMonth > 12) lunarMonth -= 12;
        if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
        return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap: lunarLeap === 1 };
    }

    function getCanChiYear(year) {
        return CAN[(year + 6) % 10] + " " + CHI[(year + 8) % 12];
    }

    function getCanChiMonth(lunarYear, lunarMonth) {
        return CAN[(lunarYear * 12 + lunarMonth + 3) % 10] + " " + CHI_MONTH[lunarMonth - 1];
    }

    function getCanChiDay(solarDay, solarMonth, solarYear) {
        let jd = jdFromDate(solarDay, solarMonth, solarYear);
        return CAN[(jd + 9) % 10] + " " + CHI[(jd + 1) % 12];
    }

    function getCanChiHour(dayCan, hour) {
        let canIndex = CAN.indexOf(dayCan.split(" ")[0]);
        let startCanIndex = (canIndex % 5) * 2;
        let hourCanIndex = (startCanIndex + Math.floor(hour / 2)) % 10;
        let hourChiIndex = Math.floor((hour + 1) / 2) % 12;
        return CAN[hourCanIndex] + " " + CHI[hourChiIndex];
    }

    function getZodiacAnimal(year) {
        return CHI_ANIMAL[(year + 8) % 12];
    }

    function getNgayHoangDao(solarDay, solarMonth, solarYear) {
        let chiIndex = (jdFromDate(solarDay, solarMonth, solarYear) + 1) % 12;
        let isHoangDao = [0, 4, 8, 2, 6, 10].includes(chiIndex);
        return {
            isHoangDao: isHoangDao,
            text: isHoangDao ? "Ngày Hoàng Đạo" : "Ngày Hắc Đạo",
            chiGroup: ["Tý-Thìn-Thân", "Sửu-Tỵ-Dậu", "Dần-Ngọ-Tuất", "Mão-Mùi-Hợi"][Math.floor(chiIndex / 3)]
        };
    }

    function getCurrentSolarTerm(day, month, year) {
        let jd = jdFromDate(day, month, year);
        let sunLong = getSunLongitude(jd, TIME_ZONE);
        let currentTerm = SOLAR_TERMS[0];
        let nextTerm = SOLAR_TERMS[1];
        for (let i = 0; i < SOLAR_TERMS.length; i++) {
            let term = SOLAR_TERMS[i];
            let next = SOLAR_TERMS[(i + 1) % 24];
            let currentLong = term.long;
            let nextLong = next.long;
            if (nextLong < currentLong) nextLong += 360;
            let currentSunLong = sunLong;
            if (sunLong < currentLong && currentLong > 300) currentSunLong += 360;
            if (currentSunLong >= currentLong && currentSunLong < nextLong) {
                currentTerm = term;
                nextTerm = next;
                break;
            }
        }
        let termSpan = 15;
        let progress = ((sunLong - currentTerm.long + 360) % 360) / termSpan * 100;
        progress = Math.min(100, Math.max(0, progress));
        return {
            current: currentTerm,
            next: nextTerm,
            progress: Math.round(progress),
            sunLongitude: sunLong.toFixed(1)
        };
    }

    function getGioTotXau(dayCan) {
        let scores = GIO_TOT_THEO_CAN[dayCan] || GIO_TOT_THEO_CAN["Giáp"];
        let result = [];
        for (let i = 0; i < 12; i++) {
            result.push({
                chi: GIO_CHI[i],
                khung: GIO_KHUNG[i],
                diem: scores[i],
                isTot: scores[i] >= 2,
                isXau: scores[i] === 0
            });
        }
        // Sắp xếp: giờ tốt trước, sau đó trung bình, xấu cuối
        return result.sort((a, b) => b.diem - a.diem);
    }

    function formatLunarDay(day) {
        return day <= 10 ? "mồng " + day : "ngày " + day;
    }

    function formatLunarMonth(month, isLeap) {
        let name = MONTH_NAMES[month - 1];
        let prefix = month <= 10 ? "tháng " : "";
        let leapSuffix = isLeap ? " (nhuận)" : "";
        return prefix + name + leapSuffix;
    }

    return {
        getFullInfo: function(day, month, year, hour) {
            hour = hour === undefined ? new Date().getHours() : hour;
            let lunar = convertSolar2Lunar(day, month, year, TIME_ZONE);
            let canChiYear = getCanChiYear(lunar.year);
            let canChiMonth = getCanChiMonth(lunar.year, lunar.month);
            let canChiDay = getCanChiDay(day, month, year);
            let dayCan = canChiDay.split(" ")[0];
            let canChiHour = getCanChiHour(dayCan, hour);
            let zodiac = getZodiacAnimal(lunar.year);
            let hoangDao = getNgayHoangDao(day, month, year);
            let solarTerm = getCurrentSolarTerm(day, month, year);
            let gioTot = getGioTotXau(dayCan);
            let thu = THU_NAMES[new Date(year, month - 1, day).getDay()];
            // Tính chi giờ hiện tại
            let chiGioHienTai = GIO_CHI[Math.floor(((hour + 1) % 24) / 2)];
            let khungGioHienTai = GIO_KHUNG[Math.floor(((hour + 1) % 24) / 2)];
            return {
                solarDate: day + "/" + month + "/" + year,
                lunarDate: formatLunarDay(lunar.day) + " " + formatLunarMonth(lunar.month, lunar.isLeap) + " năm " + lunar.year,
                canChiYear: canChiYear,
                canChiMonth: canChiMonth,
                canChiDay: canChiDay,
                canChiHour: canChiHour,
                zodiacAnimal: zodiac,
                isLeapMonth: lunar.isLeap,
                hoangDao: hoangDao,
                solarTerm: solarTerm,
                gioTot: gioTot,
                thu: thu,
                lunarDayNum: lunar.day,
                lunarMonthNum: lunar.month,
                lunarYear: lunar.year,
                hour: hour,
                chiGioHienTai: chiGioHienTai,
                khungGioHienTai: khungGioHienTai
            };
        },
        getToday: function() {
            let now = new Date();
            return this.getFullInfo(now.getDate(), now.getMonth() + 1, now.getFullYear());
        }
    };
})();

// ====================================================================
// UI RENDERER — Giao diện 2 cột Dương-Âm lịch + Giờ tốt
// ====================================================================

function taoSaoRating(diem) {
    // diem: 0-3, tạo 3 sao: đầy = tốt, nửa = trung bình, rỗng = xấu
    let saoVang = diem >= 2 ? 1 : 0;
    let saoNua = diem === 1 ? 1 : 0;
    let saoXam = 3 - saoVang - saoNua;

    let html = '';
    for (let i = 0; i < saoVang; i++) {
        html += '★';
    }
    for (let i = 0; i < saoNua; i++) {
        html += '⯪'; // half star
    }
    for (let i = 0; i < saoXam; i++) {
        html += '☆';
    }
    return html;
}

function taoHTMLLichVanNien(info, year, month) {
    let seasonColor = {
        "Xuân": "#4CAF50",
        "Hạ": "#FF5722",
        "Thu": "#FF9800",
        "Đông": "#2196F3"
    }[info.solarTerm.current.season] || "#4CAF50";

    // Tạo options cho select
    let today = new Date();
    let currentYear = today.getFullYear();
    let yearOptions = "";
    for (let y = currentYear - 50; y <= currentYear + 10; y++) {
        yearOptions += `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`;
    }

    let monthOptions = "";
    for (let m = 1; m <= 12; m++) {
        monthOptions += `<option value="${m}" ${m === month ? 'selected' : ''}>Tháng ${m}</option>`;
    }

    let dayOptions = "";
    let maxDayInMonth = new Date(year, month, 0).getDate();
    let selectedDay = parseInt(info.solarDate.split('/')[0]);
    for (let d = 1; d <= maxDayInMonth; d++) {
        dayOptions += `<option value="${d}" ${d === selectedDay ? 'selected' : ''}>${d}</option>`;
    }

    // Tạo lịch tháng grid
    let calendarGrid = taoLichThangGrid(year, month, selectedDay);

    // Tạo danh sách giờ tốt
    let gioTotHTML = '';
    let gioTotList = info.gioTot.filter(g => g.diem >= 2);
    let gioXauList = info.gioTot.filter(g => g.diem === 0);

    if (gioTotList.length > 0) {
        gioTotHTML += `<div style="margin-bottom:12px;"><div style="color:#d32f2f;font-size:13px;font-weight:bold;margin-bottom:8px;">⭐ GIỜ TỐT HÔM NAY</div>`;
        gioTotHTML += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">`;
        for (let g of gioTotList) {
            let stars = taoSaoRating(g.diem);
            gioTotHTML += `
                <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#fff8f0;border-radius:6px;border:1px solid #e3d5c0;">
                    <span style="color:#d32f2f;font-size:11px;">●</span>
                    <span style="font-size:13px;font-weight:600;color:#333;">${g.chi} (${g.khung})</span>
                    <span style="margin-left:auto;font-size:14px;color:#ff9800;letter-spacing:1px;">${stars}</span>
                </div>`;
        }
        gioTotHTML += `</div></div>`;
    }

    // Tạo danh sách giờ xấu
    let gioXauHTML = '';
    if (gioXauList.length > 0) {
        gioXauHTML += `<div style="margin-bottom:12px;"><div style="color:#666;font-size:13px;font-weight:bold;margin-bottom:8px;">⚠️ GIỜ NÊN TRÁNH</div>`;
        gioXauHTML += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">`;
        for (let g of gioXauList) {
            gioXauHTML += `
                <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#f5f5f5;border-radius:6px;border:1px solid #ddd;">
                    <span style="color:#999;font-size:11px;">●</span>
                    <span style="font-size:13px;color:#666;">${g.chi} (${g.khung})</span>
                    <span style="margin-left:auto;font-size:14px;color:#ccc;letter-spacing:1px;">☆☆☆</span>
                </div>`;
        }
        gioXauHTML += `</div></div>`;
    }

    return `
    <div id="lichVanNienWrapper" style="max-width:500px;margin:0 auto;padding:12px;">

        <!-- Header chọn ngày -->
        <div style="background:#fff;border:1px solid #e3d5c0;border-radius:10px;padding:12px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">
                <select id="lvnNgay" onchange="capNhatLichVanNien()" style="padding:8px 10px;border:1.5px solid #4CAF50;border-radius:6px;font-size:14px;background:white;min-width:55px;cursor:pointer;font-weight:600;color:#333;">
                    ${dayOptions}
                </select>
                <span style="color:#888;">/</span>
                <select id="lvnThang" onchange="capNhatLichVanNien()" style="padding:8px 10px;border:1.5px solid #4CAF50;border-radius:6px;font-size:14px;background:white;min-width:90px;cursor:pointer;font-weight:600;color:#333;">
                    ${monthOptions}
                </select>
                <span style="color:#888;">/</span>
                <select id="lvnNam" onchange="capNhatLichVanNien()" style="padding:8px 10px;border:1.5px solid #4CAF50;border-radius:6px;font-size:14px;background:white;min-width:80px;cursor:pointer;font-weight:600;color:#333;">
                    ${yearOptions}
                </select>
                <span style="color:#888;">|</span>
                <input type="number" id="lvnGio" value="${info.hour}" min="0" max="23" style="padding:8px 6px;border:1.5px solid #4CAF50;border-radius:6px;font-size:14px;background:white;width:50px;cursor:pointer;font-weight:600;color:#333;text-align:center;" onchange="capNhatLichVanNien()">
                <span style="color:#888;">:</span>
                <input type="number" id="lvnPhut" value="${new Date().getMinutes()}" min="0" max="59" style="padding:8px 6px;border:1.5px solid #4CAF50;border-radius:6px;font-size:14px;background:white;width:50px;cursor:pointer;font-weight:600;color:#333;text-align:center;" onchange="capNhatLichVanNien()">
                <button onclick="hienThiLichVanNienHomNay()" style="padding:8px 14px;background:linear-gradient(135deg,#4CAF50,#388E3C);color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;margin-left:auto;font-weight:600;box-shadow:0 2px 4px rgba(76,175,80,0.3);">
                    📅 Hôm nay
                </button>
            </div>
            <div style="font-size:11px;color:#888;text-align:center;">
                ${info.solarTerm.current.name} · ${info.solarTerm.current.desc} · Tiến trình ${info.solarTerm.progress}%
            </div>
            <div style="background:#e8f5e9;height:4px;border-radius:2px;margin-top:6px;overflow:hidden;">
                <div style="width:${info.solarTerm.progress}%;height:100%;background:linear-gradient(90deg,#4CAF50,#81C784);border-radius:2px;transition:width 0.5s;"></div>
            </div>
        </div>

        <!-- 2 CỘT: Dương lịch & Âm lịch -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:12px;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

            <!-- Cột trái: Dương lịch -->
            <div style="background:linear-gradient(180deg,#4CAF50,#388E3C);padding:16px 8px;text-align:center;color:#fff;">
                <div style="font-size:12px;opacity:0.9;margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:4px;">
                    <span style="font-size:14px;">☀️</span> DƯƠNG LỊCH
                </div>
                <div style="font-size:15px;font-weight:600;margin-bottom:8px;opacity:0.95;">${info.thu}</div>
                <div style="font-size:56px;font-weight:bold;line-height:1;margin-bottom:8px;text-shadow:0 2px 8px rgba(0,0,0,0.2);">${selectedDay}</div>
                <div style="font-size:14px;font-weight:500;opacity:0.95;">Tháng ${month} năm ${year}</div>
            </div>

            <!-- Cột phải: Âm lịch -->
            <div style="background:linear-gradient(180deg,#1a5c3a,#0d3d26);padding:12px 8px;text-align:center;color:#fff;">
                <div style="font-size:12px;opacity:0.9;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:4px;">
                    <span style="font-size:14px;">🌙</span> ÂM LỊCH
                </div>
                <!-- 2 cột nhỏ bên trong -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,0.15);border-radius:8px;overflow:hidden;margin-bottom:8px;">
                    <!-- Cột 1: Số -->
                    <div style="background:rgba(0,0,0,0.2);padding:6px 4px;">
                        <div style="font-size:10px;opacity:0.7;margin-bottom:2px;">Giờ</div>
                        <div style="font-size:16px;font-weight:bold;">${info.hour}h${new Date().getMinutes().toString().padStart(2,'0')}</div>
                    </div>
                    <!-- Cột 2: Can Chi -->
                    <div style="background:rgba(0,0,0,0.1);padding:6px 4px;">
                        <div style="font-size:10px;opacity:0.7;margin-bottom:2px;">&nbsp;</div>
                        <div style="font-size:16px;font-weight:bold;">${info.canChiHour}</div>
                    </div>
                    <!-- Cột 1: Ngày số -->
                    <div style="background:rgba(0,0,0,0.2);padding:6px 4px;">
                        <div style="font-size:10px;opacity:0.7;margin-bottom:2px;">Ngày</div>
                        <div style="font-size:28px;font-weight:bold;">${info.lunarDayNum}</div>
                    </div>
                    <!-- Cột 2: Ngày Can Chi -->
                    <div style="background:rgba(0,0,0,0.1);padding:6px 4px;">
                        <div style="font-size:10px;opacity:0.7;margin-bottom:2px;">&nbsp;</div>
                        <div style="font-size:16px;font-weight:bold;">${info.canChiDay}</div>
                    </div>
                    <!-- Cột 1: Tháng số -->
                    <div style="background:rgba(0,0,0,0.2);padding:6px 4px;">
                        <div style="font-size:10px;opacity:0.7;margin-bottom:2px;">Tháng</div>
                        <div style="font-size:16px;font-weight:bold;">${info.lunarMonthNum}</div>
                    </div>
                    <!-- Cột 2: Tháng Can Chi -->
                    <div style="background:rgba(0,0,0,0.1);padding:6px 4px;">
                        <div style="font-size:10px;opacity:0.7;margin-bottom:2px;">&nbsp;</div>
                        <div style="font-size:16px;font-weight:bold;">${info.canChiMonth}</div>
                    </div>
                </div>
                <!-- Năm Can Chi — gộp cả 2 cột -->
                <div style="font-size:14px;font-weight:600;opacity:0.95;padding-top:4px;border-top:1px solid rgba(255,255,255,0.2);">
                    Năm ${info.canChiYear}
                </div>
            </div>
        </div>

        <!-- Hoàng đạo + Con giáp -->
        <div style="background:#fff;border:1px solid #e3d5c0;border-radius:10px;padding:12px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;color:#8B4513;font-weight:600;">🐕 ${info.zodiacAnimal}</span>
            <span style="font-size:13px;font-weight:bold;padding:4px 12px;border-radius:20px;${info.hoangDao.isHoangDao ? 'background:#e8f5e9;color:#2e7d32;' : 'background:#ffebee;color:#c62828;'}">
                ${info.hoangDao.isHoangDao ? '✓' : '⚠'} ${info.hoangDao.text}
            </span>
        </div>

        <!-- Giờ tốt / Giờ xấu -->
        <div style="background:#fff;border:1px solid #e3d5c0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            ${gioTotHTML}
            ${gioXauHTML}
        </div>

        <!-- Lịch tháng grid -->
        <div style="background:#fff;border:1px solid #e3d5c0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div style="font-size:14px;color:#8b0000;font-weight:bold;">📅 Lịch tháng ${month}/${year}</div>
                <div style="font-size:12px;color:#888;">${info.canChiYear}</div>
            </div>
            ${calendarGrid}
        </div>

        <!-- Footer info -->
        <div style="text-align:center;color:#999;font-size:11px;padding:8px;">
            Dương lịch: ${info.solarDate} · Kinh độ Mặt Trời: ${info.solarTerm.sunLongitude}° · ${info.hoangDao.chiGroup}
        </div>
    </div>`;
}

function taoLichThangGrid(year, month, selectedDay) {
    // Tuần bắt đầu từ Thứ 2
    let rawFirstDay = new Date(year, month - 1, 1).getDay();
    let firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;

    let daysInMonth = new Date(year, month, 0).getDate();
    let daysInPrevMonth = new Date(year, month - 1, 0).getDate();

    let thuLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    let thuColors = ["#555", "#555", "#555", "#555", "#555", "#1976d2", "#d32f2f"];

    // Header thứ
    let headerHTML = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:4px;">`;
    for (let i = 0; i < 7; i++) {
        headerHTML += `<div style="text-align:center;padding:6px 2px;font-size:11px;font-weight:bold;color:${thuColors[i]};">${thuLabels[i]}</div>`;
    }
    headerHTML += `</div>`;

    // Các ngày trong tháng
    let daysHTML = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;">`;

    // Ngày tháng trước (fill empty)
    for (let i = 0; i < firstDay; i++) {
        let prevDay = daysInPrevMonth - firstDay + i + 1;
        daysHTML += `<div style="aspect-ratio:1;background:#faf8f5;border-radius:6px;padding:3px;opacity:0.35;">
            <div style="font-size:10px;color:#bbb;text-align:right;">${prevDay}</div>
        </div>`;
    }

    // Ngày trong tháng
    for (let d = 1; d <= daysInMonth; d++) {
        let isSelected = d === selectedDay;
        let isToday = false;
        let now = new Date();
        if (d === now.getDate() && month === (now.getMonth()+1) && year === now.getFullYear()) {
            isToday = true;
        }

        // Tính âm lịch cho ngày này
        let lunarInfo = LICH_VAN_NIEN.getFullInfo(d, month, year);
        let lunarDayMatch = lunarInfo.lunarDate.match(/(mồng|ngày)\s*(\d+)/);
        let lunarDayNum = lunarDayMatch ? lunarDayMatch[2] : "";
        let isLunar1 = lunarDayNum === "1";
        let isLunar15 = lunarDayNum === "15";

        let bgColor = isSelected ? "#4CAF50" : (isToday ? "#e8f5e9" : "#fff");
        let borderColor = isSelected ? "#4CAF50" : (isToday ? "#4CAF50" : "#e8e0d5");
        let textColor = isSelected ? "#fff" : (isToday ? "#2e7d32" : "#333");
        let lunarColor = isSelected ? "#c8e6c9" : (isLunar1 || isLunar15 ? "#d32f2f" : "#999");
        let lunarWeight = isLunar1 || isLunar15 ? "bold" : "normal";

        // Ngày hoàng đạo indicator
        let hoangDaoDot = "";
        if (lunarInfo.hoangDao.isHoangDao && !isSelected) {
            hoangDaoDot = `<div style="position:absolute;top:2px;right:2px;width:5px;height:5px;background:#4CAF50;border-radius:50%;"></div>`;
        }

        daysHTML += `<div onclick="chonNgayTrongThang(${d},${month},${year})" style="aspect-ratio:1;background:${bgColor};border:1.5px solid ${borderColor};border-radius:6px;padding:2px;cursor:pointer;position:relative;transition:all 0.15s;${isSelected?'box-shadow:0 2px 6px rgba(76,175,80,0.3);transform:scale(1.05);':''}"
            onmouseover="if(!this.style.transform.includes('scale'))this.style.transform='scale(1.03)'" onmouseout="if(!this.style.transform.includes('1.05'))this.style.transform='scale(1)'">
            ${hoangDaoDot}
            <div style="font-size:12px;font-weight:${isToday||isSelected?'bold':'normal'};color:${textColor};text-align:right;">${d}</div>
            <div style="font-size:9px;color:${lunarColor};text-align:center;margin-top:1px;font-weight:${lunarWeight};">${lunarDayNum}</div>
        </div>`;
    }

    // Ngày tháng sau (fill empty)
    let totalCells = firstDay + daysInMonth;
    let remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
        daysHTML += `<div style="aspect-ratio:1;background:#faf8f5;border-radius:6px;padding:3px;opacity:0.35;">
            <div style="font-size:10px;color:#bbb;text-align:right;">${i}</div>
        </div>`;
    }

    daysHTML += `</div>`;

    // Legend
    let legendHTML = `<div style="display:flex;gap:12px;margin-top:10px;justify-content:center;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#666;">
            <div style="width:8px;height:8px;background:#4CAF50;border-radius:2px;"></div> Ngày chọn
        </div>
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#666;">
            <div style="width:8px;height:8px;background:#e8f5e9;border:1.5px solid #4CAF50;border-radius:2px;"></div> Hôm nay
        </div>
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#666;">
            <div style="width:6px;height:6px;background:#4CAF50;border-radius:50%;"></div> Hoàng đạo
        </div>
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#666;">
            <span style="color:#d32f2f;font-weight:bold;font-size:9px;">1</span> Mồng 1 / Rằm
        </div>
    </div>`;

    return headerHTML + daysHTML + legendHTML;
}

function chonNgayTrongThang(day, month, year) {
    hienThiLichVanNien(day, month, year);
}

function hienThiLichVanNien(day, month, year, hour) {
    if (day === undefined || month === undefined || year === undefined) {
        let now = new Date();
        day = now.getDate();
        month = now.getMonth() + 1;
        year = now.getFullYear();
        hour = now.getHours();
    }
    if (hour === undefined) hour = new Date().getHours();

    let container = document.getElementById("lvnContainer");
    if (!container) {
        console.error("Không tìm thấy #lvnContainer — đảm bảo đang ở tab Lịch VN");
        return;
    }

    let info = LICH_VAN_NIEN.getFullInfo(day, month, year, hour);
    container.innerHTML = taoHTMLLichVanNien(info, year, month);
}

function hienThiLichVanNienHomNay() {
    let now = new Date();
    hienThiLichVanNien(now.getDate(), now.getMonth() + 1, now.getFullYear(), now.getHours());
}

function capNhatLichVanNien() {
    let ngayEl = document.getElementById("lvnNgay");
    let thangEl = document.getElementById("lvnThang");
    let namEl = document.getElementById("lvnNam");
    let gioEl = document.getElementById("lvnGio");
    let phutEl = document.getElementById("lvnPhut");

    if (!ngayEl || !thangEl || !namEl) return;

    let ngay = parseInt(ngayEl.value);
    let thang = parseInt(thangEl.value);
    let nam = parseInt(namEl.value);
    let gio = gioEl ? parseInt(gioEl.value) || 0 : new Date().getHours();

    let maxDay = new Date(nam, thang, 0).getDate();
    if (ngay > maxDay) ngay = maxDay;

    hienThiLichVanNien(ngay, thang, nam, gio);
}

// ====================================================================
// AUTO-INIT: Tự động khởi tạo khi tab Lịch VN được kích hoạt
// ====================================================================

let _originalChuyenTab = null;
function _lichVanNienHook() {
    if (typeof chuyenTab === 'function' && chuyenTab !== _lichVanNienWrapped) {
        _originalChuyenTab = chuyenTab;
        window.chuyenTab = _lichVanNienWrapped;
    }
}

function _lichVanNienWrapped(tabName) {
    if (_originalChuyenTab) {
        _originalChuyenTab(tabName);
    }
    if (tabName === 'lichvannien') {
        setTimeout(function() {
            let container = document.getElementById("lvnContainer");
            if (container && (!container.innerHTML || container.innerHTML.trim() === '')) {
                hienThiLichVanNienHomNay();
            }
        }, 50);
    }
}

_lichVanNienHook();
setTimeout(_lichVanNienHook, 500);
setTimeout(_lichVanNienHook, 1000);
