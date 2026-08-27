// ====================================================================
// tam-nha.js
// Tab Tâm Nhà — vẽ mặt bằng, hiệu chỉnh + chuyenTab + init
// (Modul CỬA đã tách ra js/cua-module.js — xem tamNhaDoorCtx bên dưới)
// ====================================================================

// =====================================================================
        // ===== TAB TÂM NHÀ =====
        // =====================================================================
        var tamNhaData = {
            vertices: [], closed: false, lockedEdges: [], mode: 'add',
            zoomLevel: 1, panX: 0, panY: 0, pxPerMeter: 10,
            centroidWorld: null, bgImage: null, bgImgWorld: null, bgImgRotation: 0,
            isResetView: false, huongResetCu: 0, fontSizeCompass: 10,
            dragging: false, lastTouch: null,
            doors: [], showCompass: true
        };

        var svgMain = document.getElementById('tnSvgMain');
        var wrap = document.getElementById('tnSvgWrap');

        function getTamNhaScale() { tamNhaData.pxPerMeter = parseFloat(document.getElementById('tnTiLePxPerM').value)||10; return tamNhaData.pxPerMeter * tamNhaData.zoomLevel; }
        function worldToScreenTamNha(wx, wy) {
            const s = getTamNhaScale(), rect = wrap.getBoundingClientRect();
            const cx = rect.width/2 + tamNhaData.panX, cy = rect.height/2 + tamNhaData.panY;
            return {x: cx + wx*s, y: cy - wy*s};
        }
        function screenToWorldTamNha(sx, sy) {
            const s = getTamNhaScale(), rect = wrap.getBoundingClientRect();
            const cx = rect.width/2 + tamNhaData.panX, cy = rect.height/2 + tamNhaData.panY;
            return {x: (sx-cx)/s, y: -(sy-cy)/s};
        }

        // ---- Module vẽ phòng dùng chung code với Cửu Cung Lưới (ve-phong.js) ----
        // Phòng được lưu ở tọa độ WORLD (mét, gốc = tâm ảnh nền) để tự pan/zoom theo nhà.
        window.VePhongModuleTamNha = window.VePhongFactory({
            svgSelector: '#tnSvgMain',
            idPrefix: 'tnVp',
            globalName: 'VePhongModuleTamNha',
            alwaysActive: false, // chỉ hoạt động khi tamNhaData.mode === 'room'
            getPxPerMeter: function () { return tamNhaData.pxPerMeter || 10; },
            getHouseVertices: function () { return tamNhaData.vertices || []; },
            toLocal: function (evt) {
                const rect = wrap.getBoundingClientRect();
                return screenToWorldTamNha(evt.clientX - rect.left, evt.clientY - rect.top);
            },
            toScreen: function (pt) { return worldToScreenTamNha(pt.x, pt.y); },
            clamp: null // không giới hạn — tọa độ world không có biên cố định
        });
        window.VePhongModuleTamNha.init('#tnSvgMain');

        // ---- Context adapter cho modul cửa dùng chung (js/cua-module.js) ----
        var tamNhaDoorCtx = {
            modalId: 'tnDoorModal', boxId: 'tnDoorModalBox', listId: 'tnDoorList', idPrefix: 'tn',
            getVertices: function() { return tamNhaData.vertices; },
            isClosed: function() { return tamNhaData.closed; },
            getPxPerMeter: function() { return tamNhaData.pxPerMeter; },
            getDoors: function() { if (!tamNhaData.doors) tamNhaData.doors = []; return tamNhaData.doors; },
            getCenter: function() { return tamNhaData.centroidWorld; },
            worldToScreen: worldToScreenTamNha,
            onChange: function() { redrawTamNha(); }
        };
        window.__cuaCtx_tn = tamNhaDoorCtx; // cho các nút ✔/🗑 trong danh sách cửa gọi lại đúng ctx
        window.startDoorWizard = function() { CuaModule.startWizard(tamNhaDoorCtx); };
        window.renderDoorList = function() { CuaModule.renderList(tamNhaDoorCtx); };

        function renderTamNhaEdgeList() {
            const container = document.getElementById('tnEdgeList');
            const edgeCount = tamNhaData.closed ? tamNhaData.vertices.length : tamNhaData.vertices.length - 1;
            if (edgeCount <= 0) { container.innerHTML = '<div style="font-size:12px;color:#888;padding:6px;">Chưa có cạnh nào.</div>'; renderDoorList(); return; }
            let html = '';
            for (let i = 0; i < edgeCount; i++) {
                const a = tamNhaData.vertices[i], b = tamNhaData.vertices[(i+1) % tamNhaData.vertices.length];
                const distPx = Math.hypot(b.x-a.x, b.y-a.y), distM = distPx / tamNhaData.pxPerMeter;
                let ang = Math.atan2(b.x-a.x, b.y-a.y) * 180 / Math.PI; ang = (ang+360)%360;
                const locked = !!tamNhaData.lockedEdges[i];
                html += `<div class="edge-row ${locked?'locked':''}">
                    <span class="edge-label">${String.fromCharCode(65+i)}${String.fromCharCode(65+((i+1)%tamNhaData.vertices.length))}</span>
                    <input type="number" step="0.01" value="${distM.toFixed(2)}" id="tnLen${i}" ${locked?'disabled':''}>
                    <input type="number" step="1" value="${ang.toFixed(0)}" id="tnAng${i}" ${locked?'disabled':''}>
                    <button onclick="applyTamNhaEdge(${i})" ${locked?'disabled':''}>✔</button>
                    <button onclick="snapTamNhaEdge(${i},'v')" ${locked?'disabled':''}>↕</button>
                    <button onclick="snapTamNhaEdge(${i},'h')" ${locked?'disabled':''}>↔</button>
                    <button class="lock-btn ${locked?'on':''}" onclick="toggleTamNhaLock(${i})">${locked?'🔒':'🔓'}</button>
                </div>`;
            }
            container.innerHTML = html;
            renderDoorList();
        }

        function redrawTamNha() {
            const rect = wrap.getBoundingClientRect();
            let html = '';
            if (tamNhaData.bgImage && tamNhaData.bgImgWorld) {
                const pTL = worldToScreenTamNha(tamNhaData.bgImgWorld.wx, tamNhaData.bgImgWorld.wy);
                const pBR = worldToScreenTamNha(tamNhaData.bgImgWorld.wx+tamNhaData.bgImgWorld.ww, tamNhaData.bgImgWorld.wy-tamNhaData.bgImgWorld.wh);
                const imgCx = (pTL.x+pBR.x)/2, imgCy = (pTL.y+pBR.y)/2;
                const rotDeg = tamNhaData.bgImgRotation || 0;
                const rotAttr = rotDeg ? ` transform="rotate(${rotDeg} ${imgCx} ${imgCy})"` : '';
                html += `<image href="${tamNhaData.bgImage.src}" x="${pTL.x}" y="${pTL.y}" width="${pBR.x-pTL.x}" height="${pBR.y-pTL.y}" opacity="1"${rotAttr}/>`;
            }
            if (tamNhaData.vertices.length > 0) {
                let points = '';
                tamNhaData.vertices.forEach(v => { const p = worldToScreenTamNha(v.x, v.y); points += `${p.x},${p.y} `; });

                if (tamNhaData.closed) {
                    // Fill polygon (no stroke — edges drawn per-segment to allow door gaps)
                    html += `<polygon points="${points}" fill="rgba(139,0,0,0.08)" stroke="none"/>`;
                    // Draw each edge with gaps for doors (dùng CuaModule dùng chung)
                    const nVerts = tamNhaData.vertices.length;
                    for (let ei = 0; ei < nVerts; ei++) {
                        const vaE = tamNhaData.vertices[ei], vbE = tamNhaData.vertices[(ei+1)%nVerts];
                        const paE = worldToScreenTamNha(vaE.x, vaE.y), pbE = worldToScreenTamNha(vbE.x, vbE.y);
                        const edgeLenW = Math.hypot(vbE.x-vaE.x, vbE.y-vaE.y);
                        const doorsHere = (tamNhaData.doors||[]).filter(d => d.edgeIndex===ei);
                        html += CuaModule.svgEdgeWithGaps(paE, pbE, edgeLenW, doorsHere, tamNhaData.pxPerMeter, '#8b0000', 2.5);
                    }
                } else {
                    html += `<polyline points="${points}" fill="none" stroke="#8b0000" stroke-width="2.5"/>`;
                }

                // Đỉnh
                tamNhaData.vertices.forEach((v, i) => {
                    const p = worldToScreenTamNha(v.x, v.y);
                    html += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#1a5c3a"/>`;
                    html += `<text x="${p.x+8}" y="${p.y-6}" font-size="11" font-family="sans-serif" fill="#333">${String.fromCharCode(65+i)}</text>`;
                });

                // Nhãn cạnh
                const edgeCount = tamNhaData.closed ? tamNhaData.vertices.length : tamNhaData.vertices.length-1;
                for (let i = 0; i < edgeCount; i++) {
                    const a = tamNhaData.vertices[i], b = tamNhaData.vertices[(i+1)%tamNhaData.vertices.length];
                    const distMeters = Math.hypot(b.x-a.x, b.y-a.y) / tamNhaData.pxPerMeter;
                    const mid = worldToScreenTamNha((a.x+b.x)/2, (a.y+b.y)/2);
                    html += `<text x="${mid.x+4}" y="${mid.y-4}" font-size="11" font-weight="bold" font-family="sans-serif" fill="${tamNhaData.lockedEdges[i]?'#1a5c3a':'#555'}">${distMeters.toFixed(2)}m</text>`;
                }

                // Ký hiệu cửa (dùng CuaModule dùng chung) — truyền tâm nhà để chiều "Mở vào" tự đúng
                if (tamNhaData.closed && tamNhaData.doors && tamNhaData.doors.length > 0) {
                    html += CuaModule.svgForDoors(tamNhaData.vertices, tamNhaData.doors, tamNhaData.pxPerMeter, worldToScreenTamNha, tamNhaData.centroidWorld);
                }
            }

            // La bàn tại tâm (chỉ vẽ khi đã có tâm VÀ đang bật hiện la bàn)
            if (tamNhaData.centroidWorld && tamNhaData.showCompass) {
                const p = worldToScreenTamNha(tamNhaData.centroidWorld.x, tamNhaData.centroidWorld.y);
                const az = parseFloat(document.getElementById('tnHuongLaBan').value) || 0;
                const minDim = Math.min(rect.width, rect.height) * 0.95;
                // THỨ TỰ TỪ TÂM RA NGOÀI (đúng như veCompassChung mặc định):
                // 8 hướng -> 24 sơn -> 60 Thấu Địa Long -> vạch chia độ -> số độ.
                const r8Out = minDim*0.20, r8In = minDim*0.15, r8Text = minDim*0.17;
                const r24Out = minDim*0.37, r24In = minDim*0.2, r24Text = minDim*0.34, rKim = minDim*0.37;
                const rTdlOut = minDim*0.44, rTdlIn = r24Out, rTdlTk = (rTdlOut-rTdlIn)*0.9;//thấu địa long
                const rDoSo = minDim*0.45, rDoTick = rTdlOut, rDoText = minDim*0.47;
                const rTiaSt = r8In -15;//nơi các tia bắt đầu
                const tempSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
                tempSvg.setAttribute('id','tempSvg'); document.body.appendChild(tempSvg);
                veCompassChung('tempSvg', p.x, p.y, az, {
                    rDoSo:rDoSo,rDoTick:rDoTick,rDoText:rDoText,r8Outer:r8Out,r8Inner:r8In,r8Text:r8Text,
                    r24Outer:r24Out,r24Inner:r24In,r24Text:r24Text,
                    rTdlOuter:rTdlOut,rTdlInner:rTdlIn,rTdlTick:rTdlTk,
                    rTia:rDoSo*2.8,rTiaStart:rTiaSt,rKim:rKim,
                    doMo:0,mauTia:mauTiaHienTai,isReset:tamNhaData.isResetView,resetOffset:tamNhaData.isResetView?-az:0,
                    sonDen:null,sonDi:null,showLabel:false,fontSize:tamNhaData.fontSizeCompass,mauRanh8:mauRanh8HienTai
                });
                html += tempSvg.innerHTML; document.body.removeChild(tempSvg);
            }
            svgMain.innerHTML = html;
            // innerHTML vừa xóa sạch nội dung cũ (kể cả các phòng đã vẽ) — vẽ lại lớp phòng ngay sau đó
            if (window.VePhongModuleTamNha) window.VePhongModuleTamNha.render();
        }

        function getTamNhaCanvasPos(e) {
            const rect = wrap.getBoundingClientRect();
            const cx = e.touches?e.touches[0].clientX:e.clientX, cy = e.touches?e.touches[0].clientY:e.clientY;
            return {x:cx-rect.left, y:cy-rect.top};
        }
        function onTamNhaPointerDown(e) {
            if (tamNhaData.mode === 'room') return; // để VePhongModuleTamNha tự xử lý (pointerdown riêng)
            e.preventDefault(); const pos = getTamNhaCanvasPos(e);
            if (tamNhaData.mode==='add') {
                if (tamNhaData.closed) return;
                const w = screenToWorldTamNha(pos.x, pos.y); tamNhaData.vertices.push(w);
                if (tamNhaData.vertices.length > 1) tamNhaData.lockedEdges.push(false);
                renderTamNhaEdgeList(); redrawTamNha();
            } else if (tamNhaData.mode==='pan') {
                tamNhaData.dragging = true; tamNhaData.lastTouch = pos; svgMain.style.cursor = 'grabbing';
            }
        }
        function onTamNhaPointerMove(e) {
            if (tamNhaData.mode === 'room') return; // để VePhongModuleTamNha tự xử lý (pointermove riêng)
            const pos = getTamNhaCanvasPos(e);
            if (tamNhaData.mode==='pan' && tamNhaData.dragging) {
                e.preventDefault(); tamNhaData.panX += pos.x-tamNhaData.lastTouch.x; tamNhaData.panY += pos.y-tamNhaData.lastTouch.y; tamNhaData.lastTouch = pos; redrawTamNha();
            }
        }
        function onTamNhaPointerUp() { tamNhaData.dragging = false; if (tamNhaData.mode !== 'room') svgMain.style.cursor = 'crosshair'; }
        if (svgMain) {
            svgMain.addEventListener('mousedown', onTamNhaPointerDown);
            svgMain.addEventListener('mousemove', onTamNhaPointerMove);
            window.addEventListener('mouseup', onTamNhaPointerUp);
            svgMain.addEventListener('touchstart', onTamNhaPointerDown, {passive:false});
            svgMain.addEventListener('touchmove', onTamNhaPointerMove, {passive:false});
            window.addEventListener('touchend', onTamNhaPointerUp);
        }

        function setTamNhaMode(m) {
            tamNhaData.mode = m;
            if (window.VePhongModuleTamNha) window.VePhongModuleTamNha.setActive(m === 'room');
            svgMain.style.cursor = m==='pan' ? 'grab' : 'crosshair';
            var btnAdd = document.getElementById('tnBtnModeAdd'), btnRoom = document.getElementById('tnBtnModeRoom');
            if (btnAdd) btnAdd.style.background = (m === 'add') ? '#1a5c3a' : '';
            if (btnAdd) btnAdd.style.color = (m === 'add') ? '#fff' : '';
            if (btnRoom) btnRoom.style.background = (m === 'room') ? '#1a5c3a' : '';
            if (btnRoom) btnRoom.style.color = (m === 'room') ? '#fff' : '';
            redrawTamNha();
        }
        window.setTamNhaMode = setTamNhaMode;
        function closeTamNhaPolygon() { if (tamNhaData.vertices.length<3){alert('⚠️ Cần ít nhất 3 điểm.');return;} tamNhaData.closed=true; if (tamNhaData.lockedEdges.length<tamNhaData.vertices.length) tamNhaData.lockedEdges.push(false); renderTamNhaEdgeList(); redrawTamNha(); }
        window.closeTamNhaPolygon = closeTamNhaPolygon;
        // Tính & gán tâm nhà — dùng chung cho nút "Tâm", auto-cập nhật khi sửa cạnh, và nút ẩn/hiện la bàn
        function computeAndSetTamNhaCentroid(showBox) {
            if (tamNhaData.vertices.length < 3) return false;
            let A=0,cx=0,cy=0,n=tamNhaData.vertices.length;
            for (let i=0;i<n;i++) { const p1=tamNhaData.vertices[i],p2=tamNhaData.vertices[(i+1)%n]; const cross=p1.x*p2.y-p2.x*p1.y; A+=cross; cx+=(p1.x+p2.x)*cross; cy+=(p1.y+p2.y)*cross; }
            A*=0.5; if (Math.abs(A)<1e-9) return false;
            cx/=(6*A); cy/=(6*A); tamNhaData.centroidWorld={x:cx,y:cy};
            if (showBox) {
                const dienTich = Math.abs(A)/(tamNhaData.pxPerMeter*tamNhaData.pxPerMeter);
                const box = document.getElementById('tnKetQuaTam'); box.style.display='block';
                box.innerHTML = `<b>🎯 Đã tìm tâm:</b><br>Diện tích: <b>${dienTich.toFixed(2)} m²</b><br>Tâm: Đông ${cx.toFixed(2)}m, Bắc ${cy.toFixed(2)}m`;
            }
            return true;
        }
        // Nếu tâm đang hoạt động (đã từng bấm "Tâm"), tự tính lại mỗi khi sửa cạnh — khỏi cần bấm lại
        function autoUpdateTamNhaCentroidIfActive() {
            if (tamNhaData.centroidWorld && tamNhaData.closed && tamNhaData.vertices.length>=3) {
                computeAndSetTamNhaCentroid(true);
            }
        }
        function findTamNhaCentroid() {
            if (!tamNhaData.closed||tamNhaData.vertices.length<3){alert('⚠️ Cần đóng đa giác trước.');return;}
            const ok = computeAndSetTamNhaCentroid(true);
            if (!ok) { alert('⚠️ Đa giác không hợp lệ.'); return; }
            tamNhaData.showCompass = true;
            const btn = document.getElementById('btnToggleCompassTamNha'); if (btn) btn.textContent = '👁️ La bàn';
            renderDoorList(); // cập nhật cột "Vị trí (độ-sơn)" trong danh sách cửa ngay khi có tâm
            redrawTamNha();
        }
        window.findTamNhaCentroid = findTamNhaCentroid;
        // Ẩn/hiện la bàn — không xoá tâm, nên "Vị trí (độ-sơn)" của cửa vẫn tính bình thường khi ẩn
        function toggleTamNhaCompass() {
            if (!tamNhaData.centroidWorld) {
                if (!tamNhaData.closed || tamNhaData.vertices.length<3) { alert('⚠️ Cần đóng đa giác trước khi bật la bàn.'); return; }
                const ok = computeAndSetTamNhaCentroid(true);
                if (!ok) { alert('⚠️ Đa giác không hợp lệ.'); return; }
                tamNhaData.showCompass = true;
            } else {
                tamNhaData.showCompass = !tamNhaData.showCompass;
            }
            const btn = document.getElementById('btnToggleCompassTamNha');
            if (btn) btn.textContent = tamNhaData.showCompass ? '👁️ La bàn' : '🚫 La bàn';
            renderDoorList(); redrawTamNha();
        }
        window.toggleTamNhaCompass = toggleTamNhaCompass;
        function undoTamNha() { if (tamNhaData.closed){tamNhaData.closed=false;}else if(tamNhaData.vertices.length>0){tamNhaData.vertices.pop();tamNhaData.lockedEdges.pop();} tamNhaData.centroidWorld=null; document.getElementById('tnKetQuaTam').style.display='none'; renderTamNhaEdgeList(); redrawTamNha(); }
        window.undoTamNha = undoTamNha;
        function resetTamNha() {
            tamNhaData.vertices=[]; tamNhaData.lockedEdges=[]; tamNhaData.closed=false; tamNhaData.centroidWorld=null;
            tamNhaData.panX=0; tamNhaData.panY=0; tamNhaData.zoomLevel=1; tamNhaData.showCompass=true;
            document.getElementById('tnKetQuaTam').style.display='none';
            tamNhaData.doors = [];
            if (window.VePhongModuleTamNha) window.VePhongModuleTamNha.setRooms([]);
            renderTamNhaEdgeList(); redrawTamNha();
        }
        window.resetTamNha = resetTamNha;
        function zoomTamNha(f) { tamNhaData.zoomLevel=Math.max(0.01,Math.min(100,tamNhaData.zoomLevel*f)); redrawTamNha(); }
        window.zoomTamNha = zoomTamNha;
        function zoomToFitTamNha() {
            if (!tamNhaData.bgImage||!tamNhaData.bgImgWorld){tamNhaData.zoomLevel=1;tamNhaData.panX=0;tamNhaData.panY=0;redrawTamNha();return;}
            const rect=wrap.getBoundingClientRect(),cw=rect.width,ch=rect.height,margin=0.92;
            const fit=Math.min((cw*margin)/tamNhaData.bgImgWorld.ww,(ch*margin)/tamNhaData.bgImgWorld.wh);
            tamNhaData.zoomLevel=fit;tamNhaData.panX=0;tamNhaData.panY=0;redrawTamNha();
        }
        window.zoomToFitTamNha = zoomToFitTamNha;
        // Calibrate dialog (prompt-free, works in sandboxed iframe)
        function showCalibrateDialog() {
            if (!tamNhaData.vertices||tamNhaData.vertices.length<2){alert('⚠️ Cần vẽ ít nhất 2 điểm.');return;}
            const edgeCount=tamNhaData.closed?tamNhaData.vertices.length:tamNhaData.vertices.length-1;
            if (edgeCount<1){alert('⚠️ Không có cạnh nào.');return;}

            // Build edge options
            var opts='';
            for (var i=0;i<edgeCount;i++){
                var a=tamNhaData.vertices[i],b=tamNhaData.vertices[(i+1)%tamNhaData.vertices.length];
                var d=Math.hypot(b.x-a.x,b.y-a.y);
                var lbl=String.fromCharCode(65+i)+String.fromCharCode(65+((i+1)%tamNhaData.vertices.length));
                opts+='<option value="'+i+'">Cạnh '+lbl+' ('+( d/tamNhaData.pxPerMeter).toFixed(2)+'m)</option>';
            }

            var overlay=document.getElementById('tnCalibrateModal');
            if (!overlay) {
                overlay=document.createElement('div');
                overlay.id='tnCalibrateModal';
                overlay.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:3000;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
                overlay.innerHTML='<div style="background:#fff;border-radius:12px;padding:20px;width:100%;max-width:300px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">'
                    +'<div style="color:#8b0000;font-weight:700;font-size:14px;margin-bottom:12px;border-bottom:1px dashed #ddd;padding-bottom:8px;">⚖️ Hiệu chỉnh tỉ lệ</div>'
                    +'<label style="font-size:12px;font-weight:600;color:#444;">Chọn cạnh tham chiếu:</label>'
                    +'<select id="tnCalibEdgeSel" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:13px;margin:6px 0 10px;box-sizing:border-box;"></select>'
                    +'<label style="font-size:12px;font-weight:600;color:#444;">Chiều dài thực tế (m):</label>'
                    +'<input type="number" id="tnCalibLen" step="0.01" min="0.01" value="5" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:14px;margin:6px 0 14px;box-sizing:border-box;">'
                    +'<div style="display:flex;gap:8px;">'
                    +'<button onclick="applyCalibrate()" style="flex:1;padding:9px;background:#1a5c3a;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:13px;">✅ Áp dụng</button>'
                    +'<button onclick="document.getElementById(\'tnCalibrateModal\').style.display=\'none\'" style="flex:1;padding:9px;background:#888;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:13px;">Hủy</button>'
                    +'</div></div>';
                document.body.appendChild(overlay);
            }
            document.getElementById('tnCalibEdgeSel').innerHTML=opts;
            overlay.style.display='flex';
        }
        function applyCalibrate() {
            var idx=parseInt(document.getElementById('tnCalibEdgeSel').value);
            var len=parseFloat(document.getElementById('tnCalibLen').value);
            if (isNaN(len)||len<=0){alert('⚠️ Nhập số dương.');return;}
            var a=tamNhaData.vertices[idx],b=tamNhaData.vertices[(idx+1)%tamNhaData.vertices.length];
            var cur=Math.hypot(b.x-a.x,b.y-a.y);
            if (cur<0.0001){alert('⚠️ Cạnh quá ngắn.');return;}
            var newPx=cur/len;
            if (newPx<0.1||newPx>1000){alert('⚠️ Tỉ lệ không hợp lý.');return;}
            tamNhaData.pxPerMeter=newPx;
            document.getElementById('tnTiLePxPerM').value=newPx.toFixed(2);
            document.getElementById('tnCalibrateModal').style.display='none';
            renderTamNhaEdgeList(); redrawTamNha();
            alert('✅ Đã hiệu chỉnh: 1m = '+newPx.toFixed(2)+'px');
        }
        window.applyCalibrate = applyCalibrate;
        function calibrateTamNhaScale() { showCalibrateDialog(); }
        window.calibrateTamNhaScale = calibrateTamNhaScale;
        function resetTamNhaView() {
            var inputHuong=document.getElementById('tnHuongLaBan'), huongHienTai=parseFloat(inputHuong.value)||0;
            if (!tamNhaData.isResetView) { tamNhaData.huongResetCu=huongHienTai; tamNhaData.isResetView=true; redrawTamNha(); var btn=document.getElementById('btnResetView'); if (btn) btn.textContent='↩️ Trở lại'; if (typeof capNhatHuongTuTamNha==='function') capNhatHuongTuTamNha(); }
            else { tamNhaData.isResetView=false; redrawTamNha(); var btn=document.getElementById('btnResetView'); if (btn) btn.textContent='🔄 Reset'; if (typeof capNhatHuongTuTamNha==='function') capNhatHuongTuTamNha(); }
        }
        window.resetTamNhaView = resetTamNhaView;
        function panTamNha(dx, dy) { tamNhaData.panX+=dx*30; tamNhaData.panY+=dy*30; redrawTamNha(); }
        window.panTamNha = panTamNha;
        function updateTamNhaFontSize(val) { tamNhaData.fontSizeCompass=parseInt(val); document.getElementById('tnFontSizeLabel').textContent=tamNhaData.fontSizeCompass+'px'; redrawTamNha(); }
        window.updateTamNhaFontSize = updateTamNhaFontSize;
        // Xoay ảnh nền (độ) — chỉ xoay ảnh, không xoay đa giác/la bàn/phòng đã vẽ.
        function capNhatXoayAnhTamNha(val) {
            let deg = parseFloat(val);
            if (isNaN(deg)) deg = 0;
            deg = ((deg % 360) + 360) % 360; // chuẩn hoá về 0-359
            tamNhaData.bgImgRotation = deg;
            redrawTamNha();
        }
        window.capNhatXoayAnhTamNha = capNhatXoayAnhTamNha;
        function resetTamNhaFontSize() { tamNhaData.fontSizeCompass=8; document.getElementById('tnFontSize').value=8; document.getElementById('tnFontSizeLabel').textContent='8px'; redrawTamNha(); }
        window.resetTamNhaFontSize = resetTamNhaFontSize;
        function updateTamNhaCompassHeading() {
            let az=parseFloat(document.getElementById('tnHuongLaBan').value)||0, ten=DS24_SON[0].ten;
            for (let s of DS24_SON) { let min=(s.goc-7.5+360)%360,max=(s.goc+7.5)%360,g=((az%360)+360)%360; if (min<max?(g>=min&&g<max):(g>=min||g<max)){ten=s.ten;break;} }
            document.getElementById('tnTenSon').textContent=ten;
            if (tamNhaData.centroidWorld) redrawTamNha();
        }
        window.updateTamNhaCompassHeading = updateTamNhaCompassHeading;
        function resizeTamNhaSvg() {
            const rect=wrap.getBoundingClientRect();
            svgMain.setAttribute('width',rect.width); svgMain.setAttribute('height',rect.height); svgMain.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
            redrawTamNha();
        }
        window.resizeTamNhaSvg = resizeTamNhaSvg;
        function loadImageForTamNha(input) {
            const file=input.files[0]; if (!file) return;
            const reader=new FileReader();
            reader.onload=function(e) {
                const img=new Image();
                img.onload=function() {
                    tamNhaData.bgImage=img;
                    const rect=wrap.getBoundingClientRect(),cw=rect.width,ch=rect.height,margin=0.9;
                    const maxW=cw*margin,maxH=ch*margin,ratio=img.width/img.height;
                    let displayW,displayH;
                    if (ratio>maxW/maxH){displayW=maxW;displayH=maxW/ratio;}else{displayH=maxH;displayW=maxH*ratio;}
                    tamNhaData.bgImgWorld={wx:-displayW/2,wy:displayH/2,ww:displayW,wh:displayH};
                    tamNhaData.bgImgRotation=0;
                    var rotInput=document.getElementById('tnBgRotation'); if (rotInput) rotInput.value=0;
                    tamNhaData.zoomLevel=1;tamNhaData.panX=0;tamNhaData.panY=0;
                    tamNhaData.vertices=[];tamNhaData.lockedEdges=[];tamNhaData.closed=false;tamNhaData.centroidWorld=null;
                    document.getElementById('tnKetQuaTam').style.display='none';
                    renderTamNhaEdgeList(); redrawTamNha();
                };
                img.src=e.target.result;
            };
            reader.readAsDataURL(file); input.value='';
        }
        window.loadImageForTamNha = loadImageForTamNha;
        function applyTamNhaEdge(i) {
            if (tamNhaData.lockedEdges[i]) return;
            const lenMeters=parseFloat(document.getElementById('tnLen'+i).value), ang=parseFloat(document.getElementById('tnAng'+i).value);
            if (isNaN(lenMeters)||isNaN(ang)||lenMeters<=0) return;
            const lenPx=lenMeters*tamNhaData.pxPerMeter, a=tamNhaData.vertices[i], rad=ang*Math.PI/180;
            const newB={x:a.x+lenPx*Math.sin(rad),y:a.y+lenPx*Math.cos(rad)};
            const bIdx=(i+1)%tamNhaData.vertices.length, oldB=tamNhaData.vertices[bIdx];
            const dx=newB.x-oldB.x, dy=newB.y-oldB.y;
            if (tamNhaData.closed&&bIdx===0) { tamNhaData.vertices[0]=newB; }
            else { tamNhaData.vertices[bIdx]=newB; for (let k=bIdx+1;k<tamNhaData.vertices.length;k++){tamNhaData.vertices[k].x+=dx;tamNhaData.vertices[k].y+=dy;} }
            autoUpdateTamNhaCentroidIfActive();
            renderTamNhaEdgeList(); redrawTamNha();
        }
        window.applyTamNhaEdge = applyTamNhaEdge;
        function snapTamNhaEdge(i, kind) {
            if (tamNhaData.lockedEdges[i]) return;
            let ang=parseFloat(document.getElementById('tnAng'+i).value)||0;
            let snapped=kind==='v'?(ang>90&&ang<270?180:0):(ang>=0&&ang<180?90:270);
            document.getElementById('tnAng'+i).value=snapped; applyTamNhaEdge(i);
        }
        window.snapTamNhaEdge = snapTamNhaEdge;
        function toggleTamNhaLock(i) { tamNhaData.lockedEdges[i]=!tamNhaData.lockedEdges[i]; renderTamNhaEdgeList(); redrawTamNha(); }
        window.toggleTamNhaLock = toggleTamNhaLock;

        document.getElementById('tnTiLePxPerM').addEventListener('input', redrawTamNha);
        document.getElementById('tnFontSize').value = 8;
        document.getElementById('tnFontSizeLabel').textContent = '8px';
        document.getElementById("tnColorTia").addEventListener("input", function() { capNhatMauTiaTamNha(); });
        document.getElementById("tnColorTia").addEventListener("change", function() { capNhatMauTiaTamNha(); });
        document.getElementById("tnColorRanh8Huong").addEventListener("input", function() { capNhatMauRanh8TamNha(); });
        document.getElementById("tnColorRanh8Huong").addEventListener("change", function() { capNhatMauRanh8TamNha(); });
        setTimeout(resizeTamNhaSvg, 100);

        // ==== LƯU / MỞ TOÀN BỘ TRẠNG THÁI (dùng bởi Hồ Sơ Nhà — ho-so.js) ====
        function layStateTamNha() {
            function val(id) { var el = document.getElementById(id); return el ? el.value : ""; }
            return {
                loai: "tam-nha", phienBan: 1,
                vertices: tamNhaData.vertices.map(function(v){ return {x:v.x, y:v.y}; }),
                closed: tamNhaData.closed,
                lockedEdges: tamNhaData.lockedEdges.slice(),
                phong: (window.VePhongModuleTamNha ? window.VePhongModuleTamNha.getRooms() : []).map(function (r) {
                    return {
                        id: r.id,
                        points: r.points.map(function (p) { return { x: p.x, y: p.y }; }),
                        color: r.color,
                        label: r.label,
                        locked: !!r.locked,
                        lockedEdges: Array.isArray(r.lockedEdges) ? r.lockedEdges.map(function (v) { return !!v; }) : []
                    };
                }),
                doors: JSON.parse(JSON.stringify(tamNhaData.doors || [])),
                pxPerMeter: tamNhaData.pxPerMeter,
                showCompass: tamNhaData.showCompass,
                bgImageSrc: tamNhaData.bgImage ? tamNhaData.bgImage.src : null,
                bgImgWorld: tamNhaData.bgImgWorld,
                bgImgRotation: tamNhaData.bgImgRotation || 0,
                inputs: {
                    tnTiLePxPerM: val("tnTiLePxPerM"),
                    tnHuongLaBan: val("tnHuongLaBan"),
                    tnColorTia: val("tnColorTia"),
                    tnColorRanh8Huong: val("tnColorRanh8Huong"),
                    tnFontSize: val("tnFontSize")
                }
            };
        }
        window.layStateTamNha = layStateTamNha;

        function apDungStateTamNha(obj) {
            if (!obj) return;
            function setVal(id, v) { var el = document.getElementById(id); if (el && v !== undefined) el.value = v; }
            var inp = obj.inputs || {};
            setVal("tnTiLePxPerM", inp.tnTiLePxPerM);
            setVal("tnHuongLaBan", inp.tnHuongLaBan);
            setVal("tnColorTia", inp.tnColorTia);
            setVal("tnColorRanh8Huong", inp.tnColorRanh8Huong);
            setVal("tnFontSize", inp.tnFontSize);
            setVal("tnBgRotation", obj.bgImgRotation || 0);
            var fsLabel = document.getElementById("tnFontSizeLabel");
            if (fsLabel && inp.tnFontSize) fsLabel.textContent = inp.tnFontSize + "px";

            tamNhaData.vertices = (obj.vertices || []).map(function(v){ return {x:v.x, y:v.y}; });
            tamNhaData.closed = !!obj.closed;
            tamNhaData.lockedEdges = (obj.lockedEdges || []).slice();
            if (window.VePhongModuleTamNha) window.VePhongModuleTamNha.setRooms(obj.phong || []);
            tamNhaData.doors = JSON.parse(JSON.stringify(obj.doors || []));
            tamNhaData.pxPerMeter = obj.pxPerMeter || tamNhaData.pxPerMeter;
            tamNhaData.bgImgWorld = obj.bgImgWorld || null;
            tamNhaData.bgImgRotation = obj.bgImgRotation || 0;
            tamNhaData.fontSizeCompass = parseInt(inp.tnFontSize) || 8;
            tamNhaData.centroidWorld = null;
            tamNhaData.showCompass = obj.showCompass !== false;
            tamNhaData.zoomLevel = 1; tamNhaData.panX = 0; tamNhaData.panY = 0;

            function hoanTatKhoiPhuc() {
                var kq = document.getElementById('tnKetQuaTam');
                if (tamNhaData.closed && tamNhaData.vertices.length >= 3) {
                    computeAndSetTamNhaCentroid(true);
                } else if (kq) kq.style.display = 'none';
                if (typeof updateTamNhaCompassHeading === "function") updateTamNhaCompassHeading();
                renderTamNhaEdgeList();
                redrawTamNha();
            }
            if (obj.bgImageSrc) {
                var img = new Image();
                img.onload = function() { tamNhaData.bgImage = img; hoanTatKhoiPhuc(); };
                img.onerror = function() { tamNhaData.bgImage = null; hoanTatKhoiPhuc(); };
                img.src = obj.bgImageSrc;
            } else {
                tamNhaData.bgImage = null;
                hoanTatKhoiPhuc();
            }
        }
        window.apDungStateTamNha = apDungStateTamNha;

        // =====================================================================
        // ===== CHUYỂN TAB & KHỞI TẠO =====
        // =====================================================================
        function chuyenTab(ten) {
            document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el=>el.classList.remove('active'));
            document.getElementById('tab-'+ten).classList.add('active');
            document.getElementById('tabBtn'+ten.charAt(0).toUpperCase()+ten.slice(1)).classList.add('active');
            if (ten==='tamnha') setTimeout(function(){resizeTamNhaSvg();},150);
            if (ten==='cuucungluoi') setTimeout(function(){ if (typeof cuuCungLuoiRedraw==='function') cuuCungLuoiRedraw(); }, 200);
            if (ten==='hoso') setTimeout(function(){ if (typeof hoSoRenderTab==='function') hoSoRenderTab(); }, 50);
            if (ten==='thongtin') setTimeout(function(){ if (typeof thongTinRenderTab==='function') thongTinRenderTab(); }, 50);
            if (ten==='timnha' && typeof tnKhoiTao === 'function') tnKhoiTao();
        }
        document.addEventListener('DOMContentLoaded', function() {
            var initVal=parseFloat(document.getElementById('doSoTay').value)||180;
            document.getElementById('houseFacing').value=initVal;
            document.getElementById('tnHuongLaBan').value=initVal;
            if (typeof veCompassOverlay==='function') veCompassOverlay(initVal);
            updateTamNhaCompassHeading(); redrawTamNha(); xoayLaBan(initVal);
        });
        (function() {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(m) { if (m.type==='attributes'&&m.attributeName==='class') { var tab=m.target; if (tab.id==='tab-tamnha'&&tab.classList.contains('active')) setTimeout(function(){resizeTamNhaSvg();},50); } });
            });
            var tab=document.getElementById('tab-tamnha'); if (tab) observer.observe(tab,{attributes:true});
        })();
        document.addEventListener('keydown', function(e) {
            var tab=document.getElementById('tab-tamnha'); if (!tab||!tab.classList.contains('active')) return;
            switch(e.key){case 'ArrowUp':e.preventDefault();panTamNha(0,1);break;case 'ArrowDown':e.preventDefault();panTamNha(0,-1);break;case 'ArrowLeft':e.preventDefault();panTamNha(-1,0);break;case 'ArrowRight':e.preventDefault();panTamNha(1,0);break;}
        });
