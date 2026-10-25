/* ══════════════════════════════════════════════════════════════
   textures.js — 全部贴图由 Canvas 现场绘制，零外部文件
   ══════════════════════════════════════════════════════════════ */
window.TEX = (() => {
  'use strict';

  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return [c, c.getContext('2d')];
  }
  function tex(c, rx, ry) {
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    if (rx) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx, ry === undefined ? rx : ry);
    }
    return t;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  // 细颗粒噪点，给所有平面加一点"脏"，避免塑料感
  function grain(ctx, w, h, amt, alpha) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * amt;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
      if (alpha !== undefined) d[i + 3] = alpha;
    }
    ctx.putImageData(img, 0, 0);
  }

  /* ─────────── 木地板：深胡桃色长条，错缝 ─────────── */
  function woodFloor() {
    const W = 1024, H = 1024, [c, x] = cv(W, H);
    const planks = 7, ph = H / planks;
    for (let i = 0; i < planks; i++) {
      const base = rnd(0.86, 1.14);
      const off = (i % 2) * 0.33 * W + rnd(-40, 40);
      for (let seg = -1; seg < 2; seg++) {
        const sx = off + seg * W * 0.62, sw = W * 0.62;
        const g = x.createLinearGradient(0, i * ph, 0, (i + 1) * ph);
        const r = 74 * base, gg = 46 * base, b = 27 * base;
        g.addColorStop(0, `rgb(${r * .82 | 0},${gg * .82 | 0},${b * .82 | 0})`);
        g.addColorStop(.45, `rgb(${r | 0},${gg | 0},${b | 0})`);
        g.addColorStop(1, `rgb(${r * .7 | 0},${gg * .7 | 0},${b * .7 | 0})`);
        x.fillStyle = g;
        x.fillRect(sx, i * ph, sw, ph);
        // 木纹
        x.save(); x.beginPath(); x.rect(sx, i * ph, sw, ph); x.clip();
        for (let k = 0; k < 26; k++) {
          x.beginPath();
          const y0 = i * ph + rnd(2, ph - 2);
          x.moveTo(sx, y0);
          x.bezierCurveTo(sx + sw * .3, y0 + rnd(-7, 7), sx + sw * .7, y0 + rnd(-7, 7), sx + sw, y0 + rnd(-5, 5));
          x.strokeStyle = `rgba(${28},${16},${8},${rnd(.10, .32)})`;
          x.lineWidth = rnd(.6, 2.4);
          x.stroke();
        }
        x.restore();
        // 缝
        x.fillStyle = 'rgba(0,0,0,.72)';
        x.fillRect(sx, i * ph, 2, ph);
      }
      x.fillStyle = 'rgba(0,0,0,.55)';
      x.fillRect(0, i * ph, W, 2);
    }
    grain(x, W, H, 16);
    return tex(c, 2.2, 1.6);
  }

  /* ─────────── 蜜色木作（门套 / 格栅 / 挂落） ─────────── */
  function honeyWood() {
    const W = 512, H = 512, [c, x] = cv(W, H);
    x.fillStyle = '#b07c3c'; x.fillRect(0, 0, W, H);
    for (let k = 0; k < 90; k++) {
      x.beginPath();
      const y0 = rnd(0, H);
      x.moveTo(0, y0);
      x.bezierCurveTo(W * .3, y0 + rnd(-10, 10), W * .7, y0 + rnd(-10, 10), W, y0 + rnd(-8, 8));
      x.strokeStyle = `rgba(${110},${70},${28},${rnd(.08, .3)})`;
      x.lineWidth = rnd(.8, 3);
      x.stroke();
    }
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,215,150,.16)');
    g.addColorStop(1, 'rgba(60,35,10,.22)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    grain(x, W, H, 14);
    return tex(c, 1, 1);
  }

  /* ─────────── 深胡桃（家具） ─────────── */
  function walnut() {
    const W = 512, H = 512, [c, x] = cv(W, H);
    x.fillStyle = '#2b1d14'; x.fillRect(0, 0, W, H);
    for (let k = 0; k < 70; k++) {
      x.beginPath();
      const y0 = rnd(0, H);
      x.moveTo(0, y0);
      x.bezierCurveTo(W * .35, y0 + rnd(-14, 14), W * .65, y0 + rnd(-14, 14), W, y0 + rnd(-6, 6));
      x.strokeStyle = `rgba(${Math.random() > .5 ? 18 : 62},${12},${7},${rnd(.12, .4)})`;
      x.lineWidth = rnd(.8, 3.4);
      x.stroke();
    }
    grain(x, W, H, 12);
    return tex(c, 1.6, 1.6);
  }

  /* ─────────── 墙面：深冷灰微颗粒 ─────────── */
  function wall(tint) {
    const W = 512, H = 512, [c, x] = cv(W, H);
    x.fillStyle = tint || '#2a3139'; x.fillRect(0, 0, W, H);
    // 极轻的大尺度明暗，只为打破纯色，不能形成可见云斑
    for (let k = 0; k < 90; k++) {
      const r = rnd(60, 180), cx2 = rnd(0, W), cy2 = rnd(0, H);
      const g = x.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
      const light = Math.random() > .5;
      g.addColorStop(0, light ? 'rgba(255,255,255,.022)' : 'rgba(0,0,0,.03)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(cx2, cy2, r, 0, 7); x.fill();
    }
    grain(x, W, H, 9);
    return tex(c, 3, 2);
  }

  /* ─────────── 织物（沙发 / 地毯 / 抱枕） ─────────── */
  function fabric(col, dense) {
    const W = 256, H = 256, [c, x] = cv(W, H);
    x.fillStyle = col; x.fillRect(0, 0, W, H);
    const step = dense || 4;
    for (let y = 0; y < H; y += step) {
      for (let xx = 0; xx < W; xx += step) {
        x.fillStyle = `rgba(255,255,255,${Math.random() * .07})`;
        x.fillRect(xx, y, step - 1, step - 1);
        x.fillStyle = `rgba(0,0,0,${Math.random() * .12})`;
        x.fillRect(xx + step - 1, y + step - 1, 1, 1);
      }
    }
    grain(x, W, H, 10);
    return tex(c, 5, 5);
  }

  /* ─────────── 皮革（电竞椅 / 功能沙发） ─────────── */
  function leather(col) {
    const W = 256, H = 256, [c, x] = cv(W, H);
    x.fillStyle = col; x.fillRect(0, 0, W, H);
    for (let k = 0; k < 900; k++) {
      x.beginPath();
      x.arc(rnd(0, W), rnd(0, H), rnd(1, 4), 0, 7);
      x.strokeStyle = `rgba(255,255,255,${rnd(.01, .05)})`;
      x.lineWidth = 1; x.stroke();
    }
    grain(x, W, H, 9);
    return tex(c, 3, 3);
  }

  /* ─────────── 主屏：FPS 竞技画面（动态） ─────────── */
  function screenGame() {
    const W = 1024, H = 576, [c, x] = cv(W, H);
    const t = tex(c);
    const hills = [];
    for (let i = 0; i <= 40; i++) hills.push(Math.sin(i * .45) * 26 + Math.sin(i * 1.3) * 13);
    const stars = Array.from({ length: 90 }, () => [Math.random() * W, Math.random() * H * .42, Math.random()]);
    function draw(time) {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#07101e'); g.addColorStop(.52, '#15314a'); g.addColorStop(1, '#040810');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      stars.forEach(s => {
        x.globalAlpha = .25 + Math.abs(Math.sin(time * 1.6 + s[2] * 9)) * .7;
        x.fillStyle = '#cfefff'; x.fillRect(s[0], s[1], 1.6, 1.6);
      });
      x.globalAlpha = 1;
      // 远山
      const scroll = (time * 16) % 40;
      x.beginPath(); x.moveTo(-40, H);
      for (let i = 0; i <= 40; i++) x.lineTo(i * 30 - scroll * 30 % 30, H * .62 + hills[i]);
      x.lineTo(W + 40, H); x.closePath();
      x.fillStyle = '#0c1b2b'; x.fill();
      x.beginPath(); x.moveTo(-40, H);
      for (let i = 0; i <= 40; i++) x.lineTo(i * 34 - (scroll * 1.7) % 34, H * .74 + hills[(i + 7) % 41] * .6);
      x.lineTo(W + 40, H); x.closePath();
      x.fillStyle = '#060e18'; x.fill();
      // 敌人框
      const ex = W * .5 + Math.sin(time * .8) * W * .22, ey = H * .54 + Math.cos(time * 1.1) * 26;
      x.strokeStyle = '#ff2d55'; x.lineWidth = 2;
      x.strokeRect(ex - 26, ey - 42, 52, 84);
      x.fillStyle = '#ff2d55'; x.font = 'bold 15px monospace';
      x.fillText('ENEMY', ex - 24, ey - 50);
      // 准星
      const cx = W / 2, cy = H / 2;
      x.strokeStyle = '#4dffb8'; x.lineWidth = 2.4;
      [[0, -22, 0, -9], [0, 9, 0, 22], [-22, 0, -9, 0], [9, 0, 22, 0]].forEach(l => {
        x.beginPath(); x.moveTo(cx + l[0], cy + l[1]); x.lineTo(cx + l[2], cy + l[3]); x.stroke();
      });
      x.fillStyle = '#4dffb8'; x.fillRect(cx - 1.5, cy - 1.5, 3, 3);
      // HUD
      x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, W, 34);
      x.fillStyle = '#9fe9ff'; x.font = 'bold 16px monospace';
      x.fillText('RANKED · DUST', 20, 23);
      x.fillStyle = '#fff'; x.fillText('13 : 9', W / 2 - 26, 23);
      x.fillStyle = '#4dffb8';
      x.fillText(`${(140 + Math.sin(time * 3) * 12).toFixed(0)} FPS   ${(8 + Math.sin(time * 5) * 3).toFixed(0)} ms`, W - 240, 23);
      // 血条 / 弹药
      x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(24, H - 72, 260, 14);
      const hp = .52 + Math.sin(time * .45) * .3;
      x.fillStyle = hp > .35 ? '#4dffb8' : '#ff2d55'; x.fillRect(24, H - 72, 260 * hp, 14);
      x.fillStyle = '#fff'; x.font = 'bold 34px monospace';
      x.fillText(`${(21 - Math.floor(time * 2) % 22)}`, W - 150, H - 40);
      x.fillStyle = '#7b8798'; x.font = '19px monospace'; x.fillText('/ 90', W - 98, H - 40);
      // 小地图
      x.fillStyle = 'rgba(2,8,14,.72)'; x.fillRect(W - 168, 48, 140, 140);
      x.strokeStyle = 'rgba(62,232,255,.5)'; x.lineWidth = 1; x.strokeRect(W - 168, 48, 140, 140);
      for (let i = 0; i < 5; i++) {
        x.fillStyle = i < 3 ? '#4dffb8' : '#ff2d55';
        x.fillRect(W - 160 + Math.sin(time * .6 + i * 2) * 55 + 60, 56 + Math.cos(time * .5 + i * 3) * 55 + 60, 5, 5);
      }
      t.needsUpdate = true;
    }
    draw(0);
    return { tex: t, draw };
  }

  /* ─────────── 竖屏副屏：代码 + 弹幕（动态） ─────────── */
  function screenCode() {
    const W = 540, H = 960, [c, x] = cv(W, H);
    const t = tex(c);
    const kw = ['#ff79c6', '#8be9fd', '#50fa7b', '#f1fa8c', '#bd93f9', '#6b7a8f'];
    const lines = Array.from({ length: 46 }, () => ({
      ind: Math.floor(Math.random() * 4) * 22,
      segs: Array.from({ length: 1 + Math.floor(Math.random() * 4) }, () => ({
        w: 24 + Math.random() * 120, c: kw[Math.floor(Math.random() * kw.length)]
      }))
    }));
    function draw(time) {
      x.fillStyle = '#0a0d14'; x.fillRect(0, 0, W, H);
      // 标签栏
      x.fillStyle = '#121724'; x.fillRect(0, 0, W, 34);
      x.fillStyle = '#3ee8ff'; x.font = 'bold 13px monospace'; x.fillText('room.js', 16, 22);
      x.fillStyle = '#4a5565'; x.fillText('build.log', 100, 22);
      const scroll = (time * 11) % 22;
      lines.forEach((ln, i) => {
        const y = 52 + i * 22 - scroll;
        if (y < 36 || y > H - 190) return;
        x.fillStyle = '#2b3444'; x.font = '12px monospace';
        x.fillText(String(i + 1).padStart(3, ' '), 8, y);
        let cx2 = 44 + ln.ind;
        ln.segs.forEach(s => {
          x.fillStyle = s.c; x.globalAlpha = .85;
          x.fillRect(cx2, y - 9, s.w, 9);
          cx2 += s.w + 9;
        });
        x.globalAlpha = 1;
      });
      // 光标
      if (Math.sin(time * 6) > 0) { x.fillStyle = '#3ee8ff'; x.fillRect(66, 52 + 9 * 22 - scroll - 10, 2, 13); }
      // 底部弹幕/聊天
      x.fillStyle = '#070a10'; x.fillRect(0, H - 180, W, 180);
      x.fillStyle = '#1b2230'; x.fillRect(0, H - 180, W, 1);
      x.fillStyle = '#4a5565'; x.font = 'bold 11px monospace';
      x.fillText('LIVE CHAT · 1.2k', 14, H - 160);
      const names = ['绝地小鸡', '夜猫子', '木鱼人', '键盘侠007', '一杯冰美式'];
      for (let i = 0; i < 5; i++) {
        const y = H - 136 + i * 24 + ((time * 14) % 24) - 24;
        if (y < H - 150 || y > H - 12) continue;
        x.globalAlpha = .9;
        x.fillStyle = ['#ff79c6', '#8be9fd', '#50fa7b', '#f1fa8c', '#bd93f9'][i];
        x.font = '11px sans-serif';
        x.fillText(names[(i + Math.floor(time / 1.7)) % 5], 14, y);
        x.fillStyle = '#7b8798';
        x.fillRect(96, y - 8, 60 + ((i * 53 + Math.floor(time)) % 180), 8);
        x.globalAlpha = 1;
      }
      t.needsUpdate = true;
    }
    draw(0);
    return { tex: t, draw };
  }

  /* ─────────── 电视：电影画面（动态） ─────────── */
  function screenTV() {
    const W = 1024, H = 576, [c, x] = cv(W, H);
    const t = tex(c);
    function draw(time) {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#07101c'); g.addColorStop(.40, '#122b3c'); g.addColorStop(.66, '#2d4a52'); g.addColorStop(1, '#0a1218');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // 低悬的太阳
      const sy = H * .58 + Math.sin(time * .22) * 8;
      const gg = x.createRadialGradient(W * .62, sy, 3, W * .62, sy, 120);
      gg.addColorStop(0, 'rgba(255,224,176,.9)'); gg.addColorStop(.3, 'rgba(236,150,92,.26)'); gg.addColorStop(1, 'rgba(220,120,70,0)');
      x.fillStyle = gg; x.fillRect(0, 0, W, H);
      x.beginPath(); x.arc(W * .62, sy, 26, 0, 7); x.fillStyle = '#ffe3b6'; x.fill();
      // 云层
      for (let i = 0; i < 5; i++) {
        x.globalAlpha = .16 + i * .04;
        x.fillStyle = '#091722';
        const y = H * (.30 + i * .07), off = (time * (6 + i * 4)) % (W + 400) - 200;
        x.beginPath(); x.ellipse(off, y, 230, 14 + i * 4, 0, 0, 7); x.fill();
      }
      x.globalAlpha = 1;
      // 剪影地平线
      x.beginPath(); x.moveTo(0, H);
      for (let i = 0; i <= 30; i++) x.lineTo(i * 36, H * .76 + Math.sin(i * .7) * 20 + Math.sin(i * 2.1) * 8);
      x.lineTo(W, H); x.closePath(); x.fillStyle = '#050a0e'; x.fill();
      // 影院黑边 + 字幕
      x.fillStyle = '#000'; x.fillRect(0, 0, W, 48); x.fillRect(0, H - 48, W, 48);
      x.fillStyle = 'rgba(255,255,255,.9)'; x.font = '600 23px "PingFang SC",sans-serif';
      const subs = ['「 这局之后，就去看日落。」', '「 别急着走，片尾还有彩蛋。」', '「 我们把夜晚留给自己。」'];
      const s = subs[Math.floor(time / 5) % subs.length];
      x.textAlign = 'center'; x.fillText(s, W / 2, H - 14); x.textAlign = 'left';
      x.fillStyle = 'rgba(62,232,255,.6)'; x.font = 'bold 13px monospace';
      x.fillText('DOLBY VISION · 4K 120Hz · eARC', 22, 32);
      t.needsUpdate = true;
    }
    draw(0);
    return { tex: t, draw };
  }

  /* ─────────── 窗外：夜景城市 / 白天 ─────────── */
  function cityView(night) {
    const W = 1024, H = 768, [c, x] = cv(W, H);
    if (night) {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#060a14'); g.addColorStop(.55, '#13213a'); g.addColorStop(1, '#2a2440');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(200,230,255,${Math.random() * .7})`; x.fillRect(Math.random() * W, Math.random() * H * .45, 1.6, 1.6); }
      x.beginPath(); x.arc(W * .8, H * .18, 34, 0, 7); x.fillStyle = '#f2f0e4'; x.fill();
    } else {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#9dc8ea'); g.addColorStop(.6, '#cfe2f0'); g.addColorStop(1, '#e8eef2');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        x.fillStyle = 'rgba(255,255,255,.75)';
        x.beginPath(); x.ellipse(Math.random() * W, Math.random() * H * .4, 90 + Math.random() * 90, 24, 0, 0, 7); x.fill();
      }
    }
    // 楼群
    const rows = night ? [[.62, '#0a1220', .95], [.72, '#060c16', 1]] : [[.62, '#8fa6ba', .95], [.72, '#7b92a8', 1]];
    rows.forEach(([base, col, sc]) => {
      let px = -40;
      while (px < W + 40) {
        const bw = 40 + Math.random() * 90, bh = (60 + Math.random() * 230) * sc;
        const by = H * base - bh;
        x.fillStyle = col; x.fillRect(px, by, bw, H - by);
        if (night) {
          for (let wy = by + 10; wy < H * base - 8; wy += 16) {
            for (let wx = px + 7; wx < px + bw - 9; wx += 13) {
              if (Math.random() > .58) {
                x.fillStyle = Math.random() > .25 ? 'rgba(255,214,140,.85)' : 'rgba(150,220,255,.7)';
                x.fillRect(wx, wy, 5, 7);
              }
            }
          }
        }
        px += bw + 5 + Math.random() * 14;
      }
    });
    grain(x, W, H, 8);
    return tex(c);
  }

  /* ─────────── 霓虹灯牌 GAME ON ─────────── */
  function neonSign() {
    const W = 512, H = 192, [c, x] = cv(W, H);
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 94px "Impact","Arial Black",sans-serif';
    x.shadowColor = '#ff4fd8'; x.shadowBlur = 38;
    x.fillStyle = '#ffd3f4'; x.fillText('GAME', W / 2, H / 2 - 6);
    x.shadowBlur = 20; x.strokeStyle = '#ff4fd8'; x.lineWidth = 3;
    x.strokeText('GAME', W / 2, H / 2 - 6);
    x.shadowColor = '#3ee8ff'; x.shadowBlur = 24;
    x.font = 'bold 26px monospace'; x.fillStyle = '#cff7ff';
    x.fillText('— ON —', W / 2, H / 2 + 56);
    x.shadowBlur = 0; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    return tex(c);
  }

  /* ─────────── 桌垫 ─────────── */
  function deskMat() {
    const W = 512, H = 256, [c, x] = cv(W, H);
    x.fillStyle = '#0c0f15'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(62,232,255,.16)'; x.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      x.beginPath();
      x.moveTo(0, H * .2 + i * 14);
      x.bezierCurveTo(W * .3, H * .2 + i * 14 - 40, W * .7, H * .2 + i * 14 + 40, W, H * .2 + i * 14);
      x.stroke();
    }
    x.strokeStyle = 'rgba(255,79,216,.26)'; x.lineWidth = 2;
    x.strokeRect(5, 5, W - 10, H - 10);
    x.fillStyle = 'rgba(120,140,160,.35)'; x.font = 'bold 15px monospace';
    x.fillText('UNIT-01', 22, H - 22);
    grain(x, W, H, 9);
    return tex(c);
  }

  /* ─────────── 海报（门后墙） ─────────── */
  function poster(kind) {
    const W = 384, H = 540, [c, x] = cv(W, H);
    if (kind === 0) {
      x.fillStyle = '#0d0f18'; x.fillRect(0, 0, W, H);
      const g = x.createRadialGradient(W / 2, H * .42, 10, W / 2, H * .42, 230);
      g.addColorStop(0, '#ff4fd8'); g.addColorStop(.45, '#5a1f7a'); g.addColorStop(1, '#0d0f18');
      x.fillStyle = g; x.beginPath(); x.arc(W / 2, H * .42, 230, 0, 7); x.fill();
      x.fillStyle = '#0d0f18';
      x.beginPath(); x.moveTo(0, H * .58);
      for (let i = 0; i <= 20; i++) x.lineTo(i * 20, H * .52 + Math.sin(i * .9) * 26);
      x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.fillStyle = '#fff'; x.font = 'bold 40px "Impact",sans-serif'; x.textAlign = 'center';
      x.fillText('NIGHT RUN', W / 2, H * .80);
      x.fillStyle = '#3ee8ff'; x.font = '15px monospace';
      x.fillText('VOL. 02 / 深夜限定', W / 2, H * .86);
    } else {
      x.fillStyle = '#f2ede2'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#17191f'; x.fillRect(28, 28, W - 56, H * .56);
      x.fillStyle = '#ff4fd8'; x.beginPath(); x.arc(W / 2, H * .32, 74, 0, 7); x.fill();
      x.fillStyle = '#17191f'; x.font = 'bold 30px monospace'; x.textAlign = 'center';
      x.fillText('PLAY', W / 2, H * .74);
      x.font = '13px monospace'; x.fillStyle = '#6b7280';
      x.fillText('AND  REST  WELL', W / 2, H * .80);
      x.strokeStyle = '#17191f'; x.lineWidth = 2; x.strokeRect(14, 14, W - 28, H - 28);
    }
    x.textAlign = 'left';
    return tex(c);
  }

  /* ─────────── 键帽字符 ─────────── */
  function keycaps() {
    const W = 512, H = 192, [c, x] = cv(W, H);
    x.fillStyle = '#16181f'; x.fillRect(0, 0, W, H);
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    x.textAlign = 'center'; x.textBaseline = 'middle';
    rows.forEach((r, ri) => {
      for (let i = 0; i < r.length; i++) {
        const kw2 = 40, kh = 40;
        const px = 26 + i * 44 + ri * 16, py = 42 + ri * 46;
        x.fillStyle = '#23262f'; x.fillRect(px - kw2 / 2, py - kh / 2, kw2, kh);
        x.fillStyle = '#2d313c'; x.fillRect(px - kw2 / 2, py - kh / 2, kw2, 3);
        x.fillStyle = '#8b93a3'; x.font = 'bold 15px monospace';
        x.fillText(r[i], px, py);
      }
    });
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    return tex(c);
  }

  /* ─────────── 书 / 收藏盒脊 ─────────── */
  function boxArt(h) {
    const W = 64, H = 96, [c, x] = cv(W, H);
    const cols = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d4a017', '#16a085'];
    const col = cols[h % cols.length];
    x.fillStyle = col; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, 6, H);
    x.fillStyle = 'rgba(255,255,255,.85)';
    x.fillRect(14, 16, W - 26, 3); x.fillRect(14, 26, W - 38, 3);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(12, H - 30, W - 24, 18);
    return tex(c);
  }

  /* ─────────── 门板（蜜色木 + 三段线条） ─────────── */
  function doorPanel() {
    const W = 256, H = 512, [c, x] = cv(W, H);
    x.fillStyle = '#b8823f'; x.fillRect(0, 0, W, H);
    for (let k = 0; k < 60; k++) {
      x.beginPath(); const y0 = rnd(0, H);
      x.moveTo(0, y0); x.bezierCurveTo(W * .4, y0 + rnd(-8, 8), W * .6, y0 + rnd(-8, 8), W, y0 + rnd(-6, 6));
      x.strokeStyle = `rgba(110,70,28,${rnd(.08, .26)})`; x.lineWidth = rnd(.7, 2.4); x.stroke();
    }
    // 三段凹板
    [[.06, .30], [.355, .625], [.65, .945]].forEach(([a, b]) => {
      const y = H * a, hh = H * (b - a);
      x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(26, y, W - 52, hh);
      x.fillStyle = 'rgba(255,220,160,.14)'; x.fillRect(30, y + 4, W - 60, hh - 8);
      x.strokeStyle = 'rgba(70,42,16,.5)'; x.lineWidth = 2; x.strokeRect(26, y, W - 52, hh);
    });
    grain(x, W, H, 11);
    return tex(c);
  }

  return {
    woodFloor, honeyWood, walnut, wall, fabric, leather,
    screenGame, screenCode, screenTV, cityView, neonSign,
    deskMat, poster, keycaps, boxArt, doorPanel
  };
})();
