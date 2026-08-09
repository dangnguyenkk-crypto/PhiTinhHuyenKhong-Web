// ====================================================================
// ho-so.js — HỒ SƠ NHÀ: lưu/mở/xoá/xuất/nhập toàn bộ 1 lần xem nhà
// Gộp state từ 4 tab: Tâm Nhà, Cửu Cung Lưới, Phi Tinh (Nội Khí), Thủy Pháp
// Lưu trong máy (localStorage) + Xuất/Nhập file JSON để backup/chuyển máy
// ====================================================================

(function () {
  const KEY_LIST = "pthk_hoso_list";      // mục lục nhẹ: [{id, ten, ngayTao, ngayCapNhat}]
  const KEY_DATA_PREFIX = "pthk_hoso_";   // + id -> toàn bộ dữ liệu 1 hồ sơ
  const KEY_DANG_MO = "pthk_hoso_dangMo"; // id hồ sơ đang mở (nếu có), để "Lưu" ghi đè đúng chỗ

  function taoId() {
    return "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function layDanhSach() {
    try {
      let raw = localStorage.getItem(KEY_LIST);
      let list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function luuDanhSach(list) {
    try {
      localStorage.setItem(KEY_LIST, JSON.stringify(list));
      return true;
    } catch (e) {
      canhBaoQuota(e);
      return false;
    }
  }

  function canhBaoQuota(e) {
    if (e && (e.name === "QuotaExceededError" || e.code === 22)) {
      alert("⚠️ Bộ nhớ lưu trong máy đã đầy (thường do nhiều ảnh bản đồ/mặt bằng).\nHãy Xuất file JSON các hồ sơ cũ ra ngoài để backup, rồi Xoá bớt hồ sơ trong danh sách để lấy chỗ trống.");
    } else {
      alert("⚠️ Có lỗi khi lưu: " + (e && e.message ? e.message : e));
    }
  }

  function dangMoId() {
    try { return localStorage.getItem(KEY_DANG_MO) || null; } catch (e) { return null; }
  }
  function datDangMoId(id) {
    try { if (id) localStorage.setItem(KEY_DANG_MO, id); else localStorage.removeItem(KEY_DANG_MO); } catch (e) {}
  }

  // ==== THU THẬP / ÁP DỤNG TOÀN BỘ 4 TAB ====
  function thuThapStateHienTai() {
    return {
      loai: "ho-so-nha",
      phienBan: 1,
      tamNha: (typeof window.layStateTamNha === "function") ? window.layStateTamNha() : null,
      cuuCungLuoi: (typeof window.layStateCuuCung === "function") ? window.layStateCuuCung() : null,
      phiTinh: (typeof window.layStatePhiTinh === "function") ? window.layStatePhiTinh() : null,
      thuyPhap: (typeof window.layStateThuyPhap === "function") ? window.layStateThuyPhap() : null,
      thongTin: (typeof window.layStateThongTin === "function") ? window.layStateThongTin() : null
    };
  }

  function apDungState(obj) {
    if (!obj) return;
    try { if (obj.phiTinh && typeof window.apDungStatePhiTinh === "function") window.apDungStatePhiTinh(obj.phiTinh); } catch (e) { console.error("Lỗi áp dụng Phi Tinh:", e); }
    try { if (obj.tamNha && typeof window.apDungStateTamNha === "function") window.apDungStateTamNha(obj.tamNha); } catch (e) { console.error("Lỗi áp dụng Tâm Nhà:", e); }
    try { if (obj.cuuCungLuoi && typeof window.apDungStateCuuCung === "function") window.apDungStateCuuCung(obj.cuuCungLuoi); } catch (e) { console.error("Lỗi áp dụng Cửu Cung Lưới:", e); }
    try { if (obj.thuyPhap && typeof window.apDungStateThuyPhap === "function") window.apDungStateThuyPhap(obj.thuyPhap); } catch (e) { console.error("Lỗi áp dụng Thủy Pháp:", e); }
    try { if (typeof window.apDungStateThongTin === "function") window.apDungStateThongTin(obj.thongTin || null); } catch (e) { console.error("Lỗi áp dụng Thông Tin Nhà:", e); }
  }

  // ==== CRUD localStorage ====
  function luuMoi(ten) {
    let id = taoId();
    let data = thuThapStateHienTai();
    data.tenHoSo = ten;
    data.id = id;
    let now = new Date().toISOString();
    data.ngayTao = now; data.ngayCapNhat = now;
    if (!ghiData(id, data)) return null;
    let list = layDanhSach();
    list.unshift({ id, ten, ngayTao: now, ngayCapNhat: now });
    luuDanhSach(list);
    datDangMoId(id);
    return id;
  }

  function capNhat(id) {
    let list = layDanhSach();
    let entry = list.find(x => x.id === id);
    if (!entry) return false;
    let data = thuThapStateHienTai();
    data.tenHoSo = entry.ten; data.id = id;
    data.ngayTao = entry.ngayTao; data.ngayCapNhat = new Date().toISOString();
    if (!ghiData(id, data)) return false;
    entry.ngayCapNhat = data.ngayCapNhat;
    luuDanhSach(list);
    datDangMoId(id);
    return true;
  }

  function ghiData(id, data) {
    try {
      localStorage.setItem(KEY_DATA_PREFIX + id, JSON.stringify(data));
      return true;
    } catch (e) { canhBaoQuota(e); return false; }
  }

  function docData(id) {
    try {
      let raw = localStorage.getItem(KEY_DATA_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function moHoSo(id) {
    let data = docData(id);
    if (!data) { alert("Không đọc được hồ sơ này — có thể đã bị xoá hoặc lỗi dữ liệu."); return; }
    apDungState(data);
    datDangMoId(id);
    hoSoRenderTab();
    if (typeof chuyenTab === "function") chuyenTab("noikhi");
  }

  function xoaHoSo(id) {
    let list = layDanhSach();
    let entry = list.find(x => x.id === id);
    if (!entry) return;
    if (!confirm('Xoá hồ sơ "' + entry.ten + '"? Không thể hoàn tác.')) return;
    list = list.filter(x => x.id !== id);
    luuDanhSach(list);
    try { localStorage.removeItem(KEY_DATA_PREFIX + id); } catch (e) {}
    if (dangMoId() === id) datDangMoId(null);
    hoSoRenderTab();
  }

  function doiTen(id) {
    let list = layDanhSach();
    let entry = list.find(x => x.id === id);
    if (!entry) return;
    let tenMoi = prompt("Đổi tên hồ sơ:", entry.ten);
    if (tenMoi === null || !tenMoi.trim()) return;
    entry.ten = tenMoi.trim();
    luuDanhSach(list);
    let data = docData(id);
    if (data) { data.tenHoSo = entry.ten; ghiData(id, data); }
    hoSoRenderTab();
  }

  function xuatJSON(id) {
    let data = docData(id);
    if (!data) { alert("Không đọc được hồ sơ này."); return; }
    let blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    let tenAnToan = (data.tenHoSo || "ho-so-nha").replace(/[\\/:*?"<>|]/g, "-");
    a.href = url; a.download = tenAnToan + ".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Xuất GỘP toàn bộ danh sách hồ sơ thành 1 file JSON duy nhất — để backup/đẩy lên Google Drive
  // một lần thay vì tải từng file riêng lẻ. File này Nhập lại được (xem nhapJSON bên dưới, tự
  // nhận diện obj.loai === "ho-so-nha-backup-toanbo" và khôi phục lại TẤT CẢ hồ sơ bên trong).
  function xuatTatCa() {
    let list = layDanhSach();
    if (list.length === 0) { alert("Chưa có hồ sơ nào để xuất."); return; }
    let danhSach = list.map(item => docData(item.id)).filter(Boolean);
    let goi = {
      loai: "ho-so-nha-backup-toanbo",
      phienBan: 1,
      ngayXuat: new Date().toISOString(),
      soLuong: danhSach.length,
      danhSach: danhSach
    };
    let blob = new Blob([JSON.stringify(goi, null, 2)], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    let ngay = new Date().toISOString().slice(0, 10);
    a.href = url; a.download = "backup-toan-bo-ho-so-" + ngay + ".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function nhapMotHoSo(obj, tenGoiY, hoiTen) {
    let ten = hoiTen ? prompt("Đặt tên hồ sơ vừa nhập:", tenGoiY) : tenGoiY;
    if (hoiTen && ten === null) return null;
    if (!ten || !ten.trim()) ten = tenGoiY;
    let id = taoId();
    obj.tenHoSo = ten.trim(); obj.id = id;
    let now = new Date().toISOString();
    obj.ngayTao = now; obj.ngayCapNhat = now;
    if (!ghiData(id, obj)) return null;
    let list = layDanhSach();
    list.unshift({ id, ten: obj.tenHoSo, ngayTao: now, ngayCapNhat: now });
    luuDanhSach(list);
    return { id, obj };
  }

  function nhapJSON(file) {
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (evt) {
      let obj;
      try { obj = JSON.parse(evt.target.result); } catch (e) { alert("File hỏng hoặc không đúng định dạng JSON."); return; }

      // File backup GỘP (xuất từ nút "Xuất TẤT CẢ") — chứa nhiều hồ sơ trong 1 file
      if (obj && obj.loai === "ho-so-nha-backup-toanbo" && Array.isArray(obj.danhSach)) {
        if (obj.danhSach.length === 0) { alert("File backup này không có hồ sơ nào bên trong."); return; }
        if (!confirm(`File backup này có ${obj.danhSach.length} hồ sơ. Nhập TẤT CẢ vào danh sách hiện tại (không hỏi tên từng cái, giữ nguyên tên cũ)?`)) return;
        let ketQua = obj.danhSach.map(item => nhapMotHoSo(item, item.tenHoSo || "Hồ sơ nhập", false)).filter(Boolean);
        alert(`✅ Đã nhập ${ketQua.length}/${obj.danhSach.length} hồ sơ.`);
        hoSoRenderTab();
        return;
      }

      // File 1 hồ sơ đơn lẻ (xuất từ nút "⬇️ Xuất" từng cái) — như cũ
      if (!obj || obj.loai !== "ho-so-nha") { alert("File này không phải Hồ Sơ Nhà hợp lệ (đơn hoặc backup gộp)."); return; }
      let tenGoiY = obj.tenHoSo || ("Nhà nhập " + new Date().toLocaleDateString("vi-VN"));
      let ketQua = nhapMotHoSo(obj, tenGoiY, true);
      if (!ketQua) return;
      apDungState(ketQua.obj);
      datDangMoId(ketQua.id);
      hoSoRenderTab();
      if (typeof chuyenTab === "function") chuyenTab("noikhi");
    };
    reader.readAsText(file);
  }

  // ==== HÀNH ĐỘNG GỌI TỪ NÚT BẤM (UI) ====
  window.hoSoLuuHienTai = function () {
    let dangMo = dangMoId();
    let list = layDanhSach();
    let entryDangMo = dangMo ? list.find(x => x.id === dangMo) : null;
    if (entryDangMo) {
      if (confirm('Cập nhật hồ sơ đang mở "' + entryDangMo.ten + '" bằng dữ liệu hiện tại?\n(Bấm Huỷ để lưu thành hồ sơ MỚI thay vì ghi đè.)')) {
        capNhat(dangMo);
        hoSoRenderTab();
        return;
      }
    }
    let ten = prompt("Đặt tên cho hồ sơ nhà này:", "Nhà " + new Date().toLocaleDateString("vi-VN"));
    if (ten === null) return;
    if (!ten.trim()) ten = "Nhà " + new Date().toLocaleDateString("vi-VN");
    luuMoi(ten.trim());
    hoSoRenderTab();
  };

  window.hoSoLuuThanhMoi = function () {
    let ten = prompt("Đặt tên cho hồ sơ nhà MỚI:", "Nhà " + new Date().toLocaleDateString("vi-VN"));
    if (ten === null) return;
    if (!ten.trim()) ten = "Nhà " + new Date().toLocaleDateString("vi-VN");
    luuMoi(ten.trim());
    hoSoRenderTab();
  };

  window.hoSoMo = moHoSo;
  window.hoSoXoa = xoaHoSo;
  window.hoSoDoiTen = doiTen;
  window.hoSoXuatJSON = xuatJSON;
  window.hoSoXuatTatCa = xuatTatCa;

  // ==== TÍCH HỢP GOOGLE DRIVE — qua cầu nối Android native (window.AndroidDriveBridge) ====
  // Chỉ hoạt động khi chạy trong app Android đã cài đặt DriveBridge.kt (xem file kèm theo).
  // Trên trình duyệt thường (test tay) sẽ không thấy cầu nối này, các nút Drive tự ẩn đi.
  let driveDaDangNhap = false, driveTenTaiKhoan = null, driveDangTai = false;

  function coCauNoiDrive() {
    return typeof window.AndroidDriveBridge !== "undefined" && window.AndroidDriveBridge !== null;
  }

  window.hoSoDriveDangNhap = function () {
    if (!coCauNoiDrive()) { alert("Tính năng Google Drive chỉ dùng được trong app Android (chưa cài cầu nối native)."); return; }
    window.AndroidDriveBridge.dangNhap();
  };

  // Android gọi NGƯỢC vào hàm này sau khi người dùng đăng nhập xong (hoặc thất bại) — xem baoJS() trong DriveBridge.kt
  window.hoSoDriveDangNhapKetQua = function (thanhCong, tenTaiKhoan) {
    driveDaDangNhap = !!thanhCong;
    driveTenTaiKhoan = tenTaiKhoan || null;
    if (!thanhCong) alert("❌ Đăng nhập Google thất bại, thử lại.");
    hoSoRenderTab();
  };

  window.hoSoDriveDangXuat = function () {
    if (!coCauNoiDrive()) return;
    if (!confirm("Đăng xuất khỏi Google Drive?")) return;
    window.AndroidDriveBridge.dangXuat();
  };

  // Android gọi NGƯỢC vào hàm này sau khi đăng xuất xong
  window.hoSoDriveDangXuatKetQua = function () {
    driveDaDangNhap = false;
    driveTenTaiKhoan = null;
    hoSoRenderTab();
  };

  window.hoSoDriveUploadTatCa = function () {
    if (!coCauNoiDrive()) { alert("Tính năng Google Drive chỉ dùng được trong app Android."); return; }
    if (!driveDaDangNhap) { alert("Bạn cần đăng nhập Google trước (bấm nút Đăng nhập Drive)."); return; }
    let list = layDanhSach();
    if (list.length === 0) { alert("Chưa có hồ sơ nào để tải lên."); return; }
    let danhSach = list.map(item => docData(item.id)).filter(Boolean);
    let goi = { loai: "ho-so-nha-backup-toanbo", phienBan: 1, ngayXuat: new Date().toISOString(), soLuong: danhSach.length, danhSach: danhSach };
    let ngay = new Date().toISOString().slice(0, 10);
    driveDangTai = true; hoSoRenderTab();
    window.AndroidDriveBridge.uploadJSON("backup-toan-bo-ho-so-" + ngay + ".json", JSON.stringify(goi));
  };

  window.hoSoDriveUpload1 = function (id) {
    if (!coCauNoiDrive()) { alert("Tính năng Google Drive chỉ dùng được trong app Android."); return; }
    if (!driveDaDangNhap) { alert("Bạn cần đăng nhập Google trước (bấm nút Đăng nhập Drive)."); return; }
    let data = docData(id);
    if (!data) { alert("Không đọc được hồ sơ này."); return; }
    let tenAnToan = (data.tenHoSo || "ho-so-nha").replace(/[\\/:*?"<>|]/g, "-");
    driveDangTai = true; hoSoRenderTab();
    window.AndroidDriveBridge.uploadJSON(tenAnToan + ".json", JSON.stringify(data));
  };

  // Android gọi NGƯỢC vào hàm này sau khi upload xong (hoặc lỗi)
  window.hoSoDriveUploadKetQua = function (thanhCong, thongDiep) {
    driveDangTai = false;
    alert(thanhCong ? "✅ Đã tải lên thư mục \"Phi Tinh Huyen Khong - Backup\" trên Google Drive." : "❌ Lỗi tải lên Drive: " + (thongDiep || "không rõ nguyên nhân"));
    hoSoRenderTab();
  };
  window.hoSoChonFileNhap = function () {
    let inp = document.getElementById("hoSoFileInput");
    if (inp) inp.click();
  };
  window.hoSoXuLyFileNhap = function (input) {
    let f = input.files && input.files[0];
    if (f) nhapJSON(f);
    input.value = "";
  };

  // ==== VẼ GIAO DIỆN TAB HỒ SƠ ====
  function dinhDangNgay(iso) {
    if (!iso) return "";
    try {
      let d = new Date(iso);
      return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  function hoSoRenderTab() {
    let tab = document.getElementById("tab-hoso");
    if (!tab) return;
    let list = layDanhSach();
    let dangMo = dangMoId();

    let html = `
      <div style="padding:12px;max-width:520px;margin:0 auto;">
        <h2 style="color:#8b0000;margin-bottom:4px;font-size:18px;">📁 Hồ Sơ Nhà</h2>
        <p style="font-size:12px;color:#666;margin-bottom:12px;">Lưu lại toàn bộ dữ liệu 1 lần xem nhà (Nội Khí, Thủy Pháp, Tâm Nhà, Cửu Cung Lưới) để mở lại sau. Lưu trong máy này — dùng Xuất/Nhập JSON để backup hoặc chuyển sang máy khác.</p>

        <div style="background:#fff;border:1px solid #e3d5c0;border-radius:10px;padding:12px;margin-bottom:14px;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button onclick="hoSoLuuHienTai()" style="flex:1;min-width:140px;padding:10px;background:#8b0000;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">💾 Lưu hồ sơ hiện tại</button>
            <button onclick="hoSoLuuThanhMoi()" style="flex:1;min-width:140px;padding:10px;background:#1565c0;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">➕ Lưu thành hồ sơ mới</button>
          </div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
            <button onclick="hoSoXuatTatCa()" style="flex:1;min-width:140px;padding:8px;background:#00695c;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">⬇️📦 Xuất TẤT CẢ (file JSON)</button>
            <button onclick="hoSoChonFileNhap()" style="flex:1;min-width:140px;padding:8px;background:#555;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">📥 Nhập file JSON</button>
            <input type="file" id="hoSoFileInput" accept=".json,application/json,text/plain,text/json,*/*" style="display:none;" onchange="hoSoXuLyFileNhap(this)">
          </div>
          ${coCauNoiDrive() ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #d4c4b0;">
            <div style="font-size:11px;color:#888;margin-bottom:6px;">☁️ Google Drive: ${driveDaDangNhap ? `<span style="color:#2e7d32;font-weight:600;">Đã đăng nhập (${escapeHtml(driveTenTaiKhoan || "")})</span>` : `<span style="color:#c62828;">Chưa đăng nhập</span>`}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${!driveDaDangNhap ? `<button onclick="hoSoDriveDangNhap()" style="flex:1;min-width:140px;padding:8px;background:#4285F4;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">🔑 Đăng nhập Google</button>` : `
              <button onclick="hoSoDriveUploadTatCa()" ${driveDangTai ? "disabled" : ""} style="flex:1;min-width:140px;padding:8px;background:${driveDangTai ? '#999' : '#4285F4'};color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:${driveDangTai ? 'default' : 'pointer'};">${driveDangTai ? "⏳ Đang tải lên..." : "☁️ Tải TẤT CẢ lên Drive"}</button>
              <button onclick="hoSoDriveDangXuat()" style="padding:8px 12px;background:#888;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">🚪 Đăng xuất</button>`}
            </div>
          </div>` : ""}
        </div>

        <div style="font-size:12px;color:#888;margin-bottom:6px;">Danh sách hồ sơ đã lưu (${list.length}):</div>
        <div id="hoSoDanhSach"></div>
      </div>
    `;
    tab.innerHTML = html;

    let dsContainer = document.getElementById("hoSoDanhSach");
    if (list.length === 0) {
      dsContainer.innerHTML = `<div style="padding:20px;text-align:center;color:#888;font-size:13px;background:#fff;border-radius:8px;border:1px dashed #d4c4b0;">Chưa có hồ sơ nào. Xem xong 1 ngôi nhà, bấm "💾 Lưu hồ sơ hiện tại" ở trên để lưu lại.</div>`;
      return;
    }

    let itemsHtml = list.map(item => {
      let dangMoTag = item.id === dangMo ? `<span style="font-size:10px;color:#fff;background:#2e7d32;padding:2px 6px;border-radius:10px;margin-left:6px;">Đang mở</span>` : "";
      return `
        <div style="background:#fff;border:1px solid ${item.id === dangMo ? '#2e7d32' : '#e3d5c0'};border-radius:8px;padding:10px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <b style="color:#333;font-size:14px;">${escapeHtml(item.ten)}</b>${dangMoTag}
          </div>
          <div style="font-size:10px;color:#999;margin-bottom:8px;">Cập nhật: ${dinhDangNgay(item.ngayCapNhat)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button onclick="hoSoMo('${item.id}')" style="flex:1;min-width:60px;padding:6px;background:#2e7d32;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer;">📂 Mở</button>
            <button onclick="hoSoDoiTen('${item.id}')" style="flex:1;min-width:60px;padding:6px;background:#888;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer;">✏️ Đổi tên</button>
            <button onclick="hoSoXuatJSON('${item.id}')" style="flex:1;min-width:60px;padding:6px;background:#1565c0;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer;">⬇️ Xuất</button>
            ${coCauNoiDrive() ? `<button onclick="hoSoDriveUpload1('${item.id}')" style="flex:1;min-width:60px;padding:6px;background:#4285F4;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer;">☁️ Drive</button>` : ""}
            <button onclick="hoSoXoa('${item.id}')" style="flex:1;min-width:60px;padding:6px;background:#c62828;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer;">🗑️ Xoá</button>
          </div>
        </div>
      `;
    }).join("");
    dsContainer.innerHTML = itemsHtml;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  window.hoSoRenderTab = hoSoRenderTab;
})();
