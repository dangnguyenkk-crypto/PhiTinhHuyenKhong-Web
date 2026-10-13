// ============================================================================
// nhac-nho-trai.js — Nhắc "Ngày thập trai" (cần lich-van-nien.js load TRƯỚC file này)
// Ngày trai: mùng 1, 8, 14, 15, 18, 23, 24 và 3 ngày cuối tháng âm lịch.
// Mặc định: nhắc 21:00 tối hôm trước + 6:00 sáng đúng ngày. Người dùng chỉnh được.
// ============================================================================
const NHAC_NHO_TRAI = (function () {
    const KEY = 'nhacNhoTrai_v1';
    const SO_NGAY = 75; // tính trước 75 ngày
    const NGAY_TRAI_AL = [1, 8, 14, 15, 18, 23, 24];
    const MAC_DINH = {
        bat: false,
        toiOn: true,  toi: '21:00',
        sangOn: true, sang: '06:00',
        loiNhac: 'Ngày thập trai'
    };

    function docCauHinh() {
        try {
            const s = JSON.parse(localStorage.getItem(KEY) || '{}');
            return Object.assign({}, MAC_DINH, s);
        } catch (e) { return Object.assign({}, MAC_DINH); }
    }
    function luuCauHinh(c) {
        try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    }
    function hhmm(s) {
        const m = /^(\d{1,2}):(\d{2})$/.exec(s || '');
        if (!m) return null;
        return { h: Math.min(23, +m[1]), m: Math.min(59, +m[2]) };
    }
    function nhan(ld, lm) {
        return (ld <= 10 ? 'Mùng ' + ld : 'Ngày ' + ld) + ' tháng ' + lm + ' âm lịch';
    }

    // Trả về mảng các lịch nhắc [{t: epochMs, ti: tiêu đề, bo: nội dung}]
    function tinhLich(cfg, now) {
        now = now || new Date();
        const ds = [];
        const info = [];
        for (let i = 0; i < SO_NGAY + 4; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12, 0, 0);
            ds.push(d);
            const f = LICH_VAN_NIEN.getFullInfo(d.getDate(), d.getMonth() + 1, d.getFullYear(), 12);
            info.push({ ld: f.lunarDayNum, lm: f.lunarMonthNum });
        }
        const toi = hhmm(cfg.toi), sang = hhmm(cfg.sang);
        const kq = [];
        for (let i = 0; i < SO_NGAY; i++) {
            let trai = NGAY_TRAI_AL.indexOf(info[i].ld) >= 0;
            if (!trai) for (let k = 1; k <= 3; k++) if (info[i + k].ld === 1) trai = true;
            if (!trai) continue;
            const d = ds[i];
            const lb = nhan(info[i].ld, info[i].lm);
            if (cfg.toiOn && toi) {
                const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, toi.h, toi.m, 0).getTime();
                if (t > now.getTime()) kq.push({ t: t, ti: cfg.loiNhac, bo: 'Ngày mai là ngày thập trai (' + lb + ')' });
            }
            if (cfg.sangOn && sang) {
                const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sang.h, sang.m, 0).getTime();
                if (t > now.getTime()) kq.push({ t: t, ti: cfg.loiNhac, bo: 'Hôm nay là ngày thập trai (' + lb + ')' });
            }
        }
        kq.sort(function (a, b) { return a.t - b.t; });
        return kq;
    }

    function cauNoi() {
        return (typeof AndroidNhacNho !== 'undefined') ? AndroidNhacNho : null;
    }

    function ganLich() {
        const cfg = docCauHinh();
        const ab = cauNoi();
        if (!ab) return;
        try {
            ab.datLich(JSON.stringify(cfg.bat ? tinhLich(cfg) : []));
        } catch (e) { console.error('NhacNhoTrai.ganLich: ' + e); }
    }

    // ---------------- Giao diện ----------------
    function veGiaoDien() {
        const host = document.getElementById('tab-lichvannien');
        const ct = document.getElementById('lvnContainer');
        if (!host || !ct || document.getElementById('nnTraiBox')) return;
        const cfg = docCauHinh();
        const box = document.createElement('div');
        box.id = 'nnTraiBox';
        box.style.cssText = 'width:100%;box-sizing:border-box;padding:8px 12px 0 12px;';
        box.innerHTML =
            '<style>' +
              '#nnTraiBox input[type=checkbox]{flex:none;width:22px!important;height:22px;margin:0;}' +
              '#nnTraiBox input[type=time]{flex:none;width:auto!important;}' +
              '#nnTraiBox #nnMo{flex:none;width:auto!important;min-width:0;margin:0;padding:0 4px;}' +
              '#nnTraiBox #nnTen{flex:1;min-width:0;white-space:nowrap;font-weight:bold;}' +
              '#nnTraiBox #nnThu{flex:1;width:auto!important;}' +
            '</style>' +
            '<div style="background:#fff8e1;border:1px solid #f0d58a;border-radius:10px;padding:8px 12px;font-size:14px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
                '<span id="nnTen">🔔 Nhắc ngày thập trai</span>' +
                '<input type="checkbox" id="nnBat" style="width:22px;height:22px;">' +
                '<button id="nnMo" style="border:none;background:none;font-size:18px;">⚙️</button>' +
              '</div>' +
              '<div id="nnChiTiet" style="display:none;margin-top:8px;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin:6px 0;">' +
                  '<input type="checkbox" id="nnToiOn"><span style="flex:1;">Tối hôm trước</span>' +
                  '<input type="time" id="nnToi">' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:8px;margin:6px 0;">' +
                  '<input type="checkbox" id="nnSangOn"><span style="flex:1;">Sáng đúng ngày</span>' +
                  '<input type="time" id="nnSang">' +
                '</div>' +
                '<div style="margin:6px 0;"><div style="margin-bottom:3px;">Lời nhắc</div>' +
                  '<input type="text" id="nnLoi" maxlength="60" style="width:100%;box-sizing:border-box;padding:6px;"></div>' +
                '<div style="display:flex;gap:8px;margin-top:8px;">' +
                  '<button id="nnThu" style="flex:1;padding:8px;">Gửi thử thông báo</button>' +
                '</div>' +
                '<div id="nnTrangThai" style="margin-top:6px;font-size:12px;color:#7a5a00;"></div>' +
              '</div>' +
            '</div>';
        host.insertBefore(box, ct);

        const $ = function (id) { return document.getElementById(id); };
        $('nnBat').checked = cfg.bat;
        $('nnToiOn').checked = cfg.toiOn;  $('nnToi').value = cfg.toi;
        $('nnSangOn').checked = cfg.sangOn; $('nnSang').value = cfg.sang;
        $('nnLoi').value = cfg.loiNhac;

        function doc() {
            const c = docCauHinh();
            c.bat = $('nnBat').checked;
            c.toiOn = $('nnToiOn').checked;   c.toi = $('nnToi').value || c.toi;
            c.sangOn = $('nnSangOn').checked; c.sang = $('nnSang').value || c.sang;
            c.loiNhac = ($('nnLoi').value || '').trim() || MAC_DINH.loiNhac;
            return c;
        }
        function capNhatTrangThai() {
            const c = docCauHinh();
            const ds = c.bat ? tinhLich(c) : [];
            let s = c.bat ? 'Đang bật. ' : 'Đang tắt. ';
            if (ds.length) {
                const d = new Date(ds[0].t);
                s += 'Lần nhắc tới: ' + d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2) +
                     ' ngày ' + d.getDate() + '/' + (d.getMonth() + 1) + '.';
            }
            if (!cauNoi()) s += ' (Chỉ chạy trong app Android.)';
            $('nnTrangThai').textContent = s;
        }
        function khiDoi() {
            const c = doc();
            luuCauHinh(c);
            if (c.bat && cauNoi()) {
                try { cauNoi().xinQuyenThongBao(); } catch (e) {}
            }
            ganLich();
            capNhatTrangThai();
        }
        ['nnBat', 'nnToiOn', 'nnToi', 'nnSangOn', 'nnSang', 'nnLoi'].forEach(function (id) {
            $(id).addEventListener('change', khiDoi);
        });
        $('nnMo').addEventListener('click', function () {
            const el = $('nnChiTiet');
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
            capNhatTrangThai();
        });
        $('nnThu').addEventListener('click', function () {
            const c = doc();
            const ab = cauNoi();
            if (!ab) { alert('Chỉ gửi thử được trong app Android.'); return; }
            try { ab.xinQuyenThongBao(); } catch (e) {}
            ab.guiThu(c.loiNhac, 'Thông báo thử — nhắc ngày thập trai hoạt động bình thường');
        });
        capNhatTrangThai();
    }

    function khoiDong() {
        veGiaoDien();
        ganLich(); // mỗi lần mở app: tính lại 75 ngày tới
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiDong);
    else khoiDong();

    return { tinhLich: tinhLich, docCauHinh: docCauHinh };
})();
