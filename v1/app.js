/* ========================================================================
   电竞房 3D 可视化 v2 (Three.js r147, 纯几何体, 零外部模型)
   坐标系: x=东西(0=西 5.2=东)  y=高度(0=地板 2.9=天花)  z=南北(0=南 3.76=北)
   v2: Bloom后期 / Canvas动态屏幕 / 木地板纹理 / 尘埃粒子 / Kimi设计助手
   ======================================================================== */

(() => {
  'use strict';

  // ---------- 场景初始化 ----------
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.Fog(0x05060a, 10, 22);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 50);
  camera.position.set(2.6, 7.5, -2.8); // 开场高位, 稍后缓动到总览

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.2;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(2.6, 0, 1.88);
  controls.autoRotate = true;          // 开场缓慢自转, 第一次操作时停止
  controls.autoRotateSpeed = 0.55;

  // ---------- Bloom 后期 (库缺失时自动回退普通渲染) ----------
  let composer = null;
  if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.RenderPass) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const bloom = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 0.32, 0.5, 0.82);
    composer.addPass(bloom);
    if (THREE.GammaCorrectionShader && THREE.ShaderPass) {
      composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
    }
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- 材质工具 ----------
  function m(opts) {
    return new THREE.MeshStandardMaterial({
      color: opts.color !== undefined ? opts.color : 0xffffff,
      roughness: opts.rough !== undefined ? opts.rough : 0.5,
      metalness: opts.metal !== undefined ? opts.metal : 0,
      emissive: opts.emit || 0x000000,
      emissiveIntensity: opts.estr || 0,
      emissiveMap: opts.emap || null,
      map: opts.map || null,
      transparent: !!opts.trans,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || THREE.FrontSide,
    });
  }

  const M = {
    wall:   m({ color: 0x6b7280, rough: 0.92 }),
    wallD:  m({ color: 0x4a4f58, rough: 0.9 }),
    floor:  m({ color: 0x5a3a1e, rough: 0.55 }),
    trim:   m({ color: 0x7a4f22, rough: 0.45 }),
    walnut: m({ color: 0x2a1a0e, rough: 0.45 }),
    black:  m({ color: 0x0a0a0d, rough: 0.6 }),
    metal:  m({ color: 0x1a1d24, rough: 0.25, metal: 0.85 }),
    sofa:   m({ color: 0x1c100a, rough: 0.7 }),
    grey:   m({ color: 0x1a1c22, rough: 0.8 }),
    glass:  m({ color: 0x8fc8ff, rough: 0.08, metal: 0.1, trans: true, opacity: 0.18, side: THREE.DoubleSide }),
    ledCyan:   m({ color: 0x00e5ff, emit: 0x00e5ff, estr: 2.5 }),
    ledPurple: m({ color: 0xaa55ff, emit: 0x6622cc, estr: 1.8 }),
    ledWarm:   m({ color: 0xffaa55, emit: 0xff8833, estr: 2.0 }),
    rgb1:   m({ color: 0x00ffff, emit: 0x00dddd, estr: 3 }),
    rgb2:   m({ color: 0xff00dd, emit: 0xcc00aa, estr: 3 }),
    rgb3:   m({ color: 0x8844ff, emit: 0x6622dd, estr: 3 }),
    fig1:   m({ color: 0xcc3344, rough: 0.5 }),
    fig2:   m({ color: 0x3377dd, rough: 0.5 }),
    fig3:   m({ color: 0xeebb44, rough: 0.5 }),
    fig4:   m({ color: 0x33cc88, rough: 0.5 }),
    fig5:   m({ color: 0xdde2ea, rough: 0.4 }),
    shade:  m({ color: 0xfff5e8, emit: 0xffddaa, estr: 1.2 }),
    neon:   m({ color: 0x00ffff, emit: 0x00dddd, estr: 2.0 }),
    red:    m({ color: 0x9a1020, rough: 0.6 }),
    gold:   m({ color: 0xddaa33, rough: 0.35, metal: 0.5 }),
    pad:    m({ color: 0x101216, rough: 0.9 }),
    pillow: m({ color: 0x1a3038, rough: 0.8 }),
  };

  // ---------- 构建工具 ----------
  function box(w, h, d, mat, px, py, pz) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(px, py, pz);
    return mesh;
  }
  function cyl(r, h, mat, px, py, pz, rotX, rotZ) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), mat);
    mesh.position.set(px, py, pz);
    if (rotX) mesh.rotation.x = rotX;
    if (rotZ) mesh.rotation.z = rotZ;
    return mesh;
  }
  function sphere(r, mat, px, py, pz) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
    mesh.position.set(px, py, pz);
    return mesh;
  }
  function torus(R, r, mat, px, py, pz, rotX, rotY) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(R, r, 10, 24), mat);
    mesh.position.set(px, py, pz);
    if (rotX) mesh.rotation.x = rotX;
    if (rotY) mesh.rotation.y = rotY;
    return mesh;
  }
  function plane(w, h, mat, px, py, pz, rotY) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(px, py, pz);
    if (rotY) mesh.rotation.y = rotY;
    return mesh;
  }
  function setShadow(obj, cast, receive) {
    obj.traverse(o => {
      if (o.isMesh) {
        if (cast) o.castShadow = true;
        if (receive) o.receiveShadow = true;
      }
    });
  }

  // ========================================================================
  //  Canvas 程序化纹理
  // ========================================================================
  const R = i => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };

  function makeTex(w, h, drawFn) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    drawFn(ctx, w, h, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return { tex, cv, ctx, draw: t => { drawFn(ctx, w, h, t); tex.needsUpdate = true; } };
  }

  // 木地板
  const floorTex = makeTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3d2410'; ctx.fillRect(0, 0, w, h);
    const rows = 8, rh = h / rows;
    for (let i = 0; i < rows; i++) {
      const tone = 0.85 + R(i) * 0.4;
      ctx.fillStyle = `rgb(${Math.floor(88 * tone)},${Math.floor(56 * tone)},${Math.floor(28 * tone)})`;
      ctx.fillRect(0, i * rh + 1, w, rh - 2);
      // 木纹
      ctx.strokeStyle = 'rgba(40,22,8,0.35)';
      ctx.lineWidth = 1;
      for (let gLine = 0; gLine < 5; gLine++) {
        ctx.beginPath();
        const y0 = i * rh + 4 + R(i * 31 + gLine) * (rh - 8);
        ctx.moveTo(0, y0);
        for (let x = 0; x <= w; x += 32) {
          ctx.lineTo(x, y0 + Math.sin(x * 0.03 + gLine * 2 + i) * 2.5);
        }
        ctx.stroke();
      }
      // 板缝
      ctx.fillStyle = 'rgba(20,10,4,0.8)';
      ctx.fillRect(0, i * rh, w, 1.6);
      const joint = R(i * 7) * w;
      ctx.fillRect(joint, i * rh, 1.6, rh);
    }
  });

  // 主屏: FPS 游戏画面 (动画)
  const scrMain = makeTex(512, 288, (ctx, w, h, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a1830'); g.addColorStop(0.7, '#143058'); g.addColorStop(1, '#0c1e38');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // 地形剪影
    ctx.fillStyle = '#0a1626';
    ctx.beginPath(); ctx.moveTo(0, h * 0.7);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, h * 0.7 - Math.abs(Math.sin(x * 0.015 + 1)) * 26 - Math.sin(x * 0.05) * 7);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    // 移动目标
    const ex = (t * 46) % (w + 80) - 40, ey = h * 0.58 + Math.sin(t * 3) * 9;
    ctx.fillStyle = '#ff4455';
    ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ff445588'; ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 7); ctx.stroke();
    // 准星
    const cx = w / 2, cy = h / 2, r = 8 + Math.sin(t * 4) * 2;
    ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * (r + 4), cy + dy * (r + 4));
      ctx.lineTo(cx + dx * (r + 14), cy + dy * (r + 14));
      ctx.stroke();
    });
    // 击杀信息
    ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#fffc';
    ctx.fillText('★ HEADSHOT +200', 16, 28);
    ctx.fillStyle = '#0ff8'; ctx.fillText('FPS 237    PING 12ms', 16, 46);
    // 血条
    ctx.fillStyle = '#000a'; ctx.fillRect(14, h - 40, 186, 16);
    ctx.fillStyle = '#00ff88'; ctx.fillRect(17, h - 37, 122 + Math.sin(t * 0.8) * 30, 10);
    // 弹药
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px monospace';
    ctx.fillText('27 / 90', w - 116, h - 22);
    // 小地图
    ctx.fillStyle = '#04101ccc'; ctx.fillRect(w - 112, 12, 100, 74);
    ctx.strokeStyle = '#0ff6'; ctx.strokeRect(w - 112, 12, 100, 74);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(w - 106 + (t * 13) % 84, 18 + (t * 29) % 58, 4, 4);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(w - 62, 44, 4, 4);
  });

  // 副屏(竖): 代码 + 弹幕 (动画)
  const scrSub = makeTex(256, 448, (ctx, w, h, t) => {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h);
    // 代码区
    const cols = ['#7ee787', '#79c0ff', '#d2a8ff', '#ffa657', '#8b949e'];
    for (let i = 0; i < 14; i++) {
      const indent = Math.floor(R(i * 3) * 4) * 14;
      const len = 40 + R(i * 13) * (w - indent - 70);
      ctx.fillStyle = cols[Math.floor(R(i * 7) * cols.length)] + 'cc';
      ctx.fillRect(14 + indent, 16 + i * 16, len, 7);
    }
    // 光标闪烁
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = '#7ee787';
      ctx.fillRect(14 + Math.floor(R(99) * 4) * 14 + 60, 16 + 13 * 16, 8, 9);
    }
    // 分隔
    ctx.fillStyle = '#21262d'; ctx.fillRect(0, 260, w, 2);
    ctx.fillStyle = '#8b949e'; ctx.font = '10px sans-serif';
    ctx.fillText('直播弹幕', 12, 278);
    // 弹幕气泡滚动
    const msgs = ['66666', '这波操作可以', '主播牛啊', '哈哈哈绝了', '前方高能', '稳了稳了'];
    for (let i = 0; i < 5; i++) {
      const yy = 296 + i * 28 - (t * 14) % 28;
      if (yy < 282 || yy > h - 20) continue;
      ctx.fillStyle = `rgba(58,64,${96 + i * 10},0.85)`;
      const mw = 90 + R(i * 17) * 80;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(12, yy, mw, 20, 9) : ctx.rect(12, yy, mw, 20);
      ctx.fill();
      ctx.fillStyle = '#e6edf3'; ctx.font = '11px sans-serif';
      ctx.fillText(msgs[i % msgs.length], 22, yy + 14);
    }
  });

  // 电视: 电影夜景 (动画)
  const scrTV = makeTex(512, 288, (ctx, w, h, t) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const vh = h - 56; // 上下黑边
    const g = ctx.createLinearGradient(0, 28, 0, 28 + vh);
    g.addColorStop(0, '#0a1030'); g.addColorStop(0.6, '#1a2050'); g.addColorStop(1, '#301a3a');
    ctx.fillStyle = g; ctx.fillRect(0, 28, w, vh);
    // 星星
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 40; i++) {
      const sx = R(i * 11) * w, sy = 30 + R(i * 23) * vh * 0.45;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i));
      ctx.globalAlpha = tw * 0.9;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
    // 月亮
    ctx.fillStyle = '#ffe9b8';
    ctx.beginPath(); ctx.arc(w * 0.78, 28 + vh * 0.22, 17, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffe9b822';
    ctx.beginPath(); ctx.arc(w * 0.78, 28 + vh * 0.22, 30, 0, 7); ctx.fill();
    // 山两层
    ctx.fillStyle = '#0c1226';
    ctx.beginPath(); ctx.moveTo(0, 28 + vh * 0.62);
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, 28 + vh * 0.62 - Math.abs(Math.sin(x * 0.01 + 2)) * 34);
    ctx.lineTo(w, 28 + vh); ctx.lineTo(0, 28 + vh); ctx.fill();
    ctx.fillStyle = '#060a18';
    ctx.beginPath(); ctx.moveTo(0, 28 + vh * 0.8);
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, 28 + vh * 0.8 - Math.abs(Math.sin(x * 0.017)) * 22);
    ctx.lineTo(w, 28 + vh); ctx.lineTo(0, 28 + vh); ctx.fill();
    // 流星
    const mt = t % 6;
    if (mt < 0.8) {
      const mx = w * 0.15 + mt * 300, my = 40 + mt * 46;
      const lg = ctx.createLinearGradient(mx - 40, my - 8, mx, my);
      lg.addColorStop(0, 'transparent'); lg.addColorStop(1, '#fff');
      ctx.strokeStyle = lg; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(mx - 40, my - 8); ctx.lineTo(mx, my); ctx.stroke();
    }
    // 字幕
    ctx.fillStyle = '#fffd'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('——  夜 晚 的 城 市 , 灯 火 未 眠  ——', w / 2, h - 12);
    ctx.textAlign = 'left';
    // 杜比标
    ctx.fillStyle = '#fff8'; ctx.font = 'bold 10px sans-serif';
    ctx.fillText('DOLBY VISION · 4K 120Hz', 10, 20);
  });

  // 窗外夜景
  const cityTex = makeTex(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#060a1e'); g.addColorStop(0.7, '#101838'); g.addColorStop(1, '#1a2248');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = 0.3 + R(i * 5) * 0.7;
      ctx.fillRect(R(i * 13) * w, R(i * 29) * h * 0.4, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
    // 楼群剪影 + 亮窗
    for (let b = 0; b < 14; b++) {
      const bw = 26 + R(b * 7) * 34, bh = 60 + R(b * 17) * 120, bx = b * 38 - 10;
      ctx.fillStyle = '#080d20';
      ctx.fillRect(bx, h - bh, bw, bh);
      for (let wy = 0; wy < Math.floor(bh / 16); wy++) {
        for (let wx = 0; wx < Math.floor(bw / 10); wx++) {
          if (R(b * 100 + wy * 10 + wx) > 0.62) {
            ctx.fillStyle = R(b + wy + wx) > 0.5 ? '#ffd88a' : '#9ecfff';
            ctx.globalAlpha = 0.5 + R(wx * wy + b) * 0.5;
            ctx.fillRect(bx + 3 + wx * 10, h - bh + 6 + wy * 16, 5, 7);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  });

  // 海报
  const posterTex = makeTex(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#0b0e16'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 56px monospace'; ctx.textAlign = 'center';
    ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 18;
    ctx.fillText('GAME', w / 2, h / 2 - 16);
    ctx.fillStyle = '#ff00dd'; ctx.shadowColor = '#ff00dd';
    ctx.fillText('ON', w / 2, h / 2 + 48);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#5a6a85'; ctx.font = '12px monospace';
    ctx.fillText('EST. 2026 · 5.2×3.76', w / 2, h - 34);
    ctx.textAlign = 'left';
  });

  function screenMat(tex, estr) {
    return new THREE.MeshStandardMaterial({
      color: 0x000000, roughness: 0.35, metalness: 0,
      emissive: 0xffffff, emissiveIntensity: estr || 1.25, emissiveMap: tex,
    });
  }

  // ---------- 硬件清单数据 ----------
  const hardware = [
    { id:'pc', name:'游戏主机', zone:'电竞区', icon:'🖥️',
      specs:[{k:'CPU', v:'Core i9-14900K'},{k:'GPU', v:'RTX 4090 24G'},{k:'内存', v:'64GB DDR5 6400'},{k:'存储', v:'2TB NVMe × 2'},{k:'电源', v:'1000W 金牌全模'},{k:'散热', v:'360 水冷'}],
      desc:'桌面展示机箱,玻璃侧透+三层RGB风扇灯效,垂直风道,位于桌面右侧靠近东墙,方便展示也便于走线。' },
    { id:'monitor_main', name:'27寸 4K 144Hz 主屏', zone:'电竞区', icon:'🖥',
      specs:[{k:'尺寸', v:'27寸'},{k:'分辨率', v:'3840×2160 4K'},{k:'刷新率', v:'144Hz'},{k:'面板', v:'IPS 10bit'},{k:'响应', v:'1ms GTG'}],
      desc:'主显示器居中支臂悬挂,支持90°旋转调节,视线平齐桌面高度,长时间游戏不累眼。' },
    { id:'monitor_sub', name:'竖屏副显示器', zone:'电竞区', icon:'📱',
      specs:[{k:'尺寸', v:'27寸'},{k:'分辨率', v:'2560×1440 2K'},{k:'旋转', v:'90° 竖屏'},{k:'刷新率', v:'75Hz'}],
      desc:'主屏左侧竖放,用于文档/聊天/代码/直播弹幕,支臂高度可调。' },
    { id:'screenbar', name:'屏幕挂灯', zone:'电竞区', icon:'💡',
      specs:[{k:'光源', v:'非对称前向投光'},{k:'显指', v:'Ra95'},{k:'色温', v:'2700-6500K 无极'},{k:'控制', v:'无线旋钮遥控'}],
      desc:'挂在主屏顶部,只照桌面不照屏幕,深夜游戏护眼主力光源。' },
    { id:'kb', name:'机械键盘 + 鼠标', zone:'电竞区', icon:'⌨️',
      specs:[{k:'键盘', v:'87键 客制化 红轴'},{k:'鼠标', v:'轻量化 无线'},{k:'桌垫', v:'900×400mm 大桌垫'}],
      desc:'桌面大桌垫覆盖键鼠区,键盘支持RGB背光,鼠标右手位。' },
    { id:'headset', name:'电竞耳机 + 洞洞板', zone:'电竞区', icon:'🎧',
      specs:[{k:'耳机', v:'50mm 单元 7.1虚拟环绕'},{k:'麦克风', v:'可拆卸 降噪'},{k:'收纳', v:'洞洞板悬挂'}],
      desc:'东墙洞洞板收纳耳机/手柄/线材,桌面永远干净——可以贵但不可以麻烦。' },
    { id:'chair', name:'人体工学椅', zone:'电竞区', icon:'💺',
      specs:[{k:'类型', v:'全网人体工学椅'},{k:'扶手', v:'4D 可调'},{k:'腰托', v:'自适应动态'},{k:'倾仰', v:'135° 锁定'},{k:'承重', v:'150kg'}],
      desc:'高个子友好:高靠背+头颈枕+动态腰托,185身高长时间游戏/办公都能支撑。' },
    { id:'desk', name:'定制高桌', zone:'电竞区', icon:'📐',
      specs:[{k:'尺寸', v:'1800 × 800 × 800mm'},{k:'台面', v:'深胡桃实木贴皮'},{k:'桌腿', v:'黑钢制'},{k:'高度', v:'800mm(适配185身高)'}],
      desc:'定制固定高桌,1.8m大台面放双屏+机箱+手办还富余,80cm桌高适配185身高。' },
    { id:'tv', name:'75寸 4K 120Hz 电视', zone:'观影区', icon:'📺',
      specs:[{k:'尺寸', v:'75寸'},{k:'分辨率', v:'4K UHD'},{k:'刷新率', v:'120Hz'},{k:'接口', v:'HDMI 2.1 × 2 / eARC'},{k:'HDR', v:'杜比视界 + HDR10+'}],
      desc:'西墙挂装,屏中心离地1.1m,2.5m视距影院前排沉浸感,支持eARC连回音壁。' },
    { id:'sofa', name:'双人电动功能沙发', zone:'观影区', icon:'🛋️',
      specs:[{k:'座位', v:'双人位'},{k:'功能', v:'电动躺平 + 脚踏伸出'},{k:'材质', v:'头层牛皮'},{k:'展开尺寸', v:'1700 × 1500 × 900mm'}],
      desc:'左位已展开成躺平模式,右位正常坐姿,一键电动切换,玩累了直接躺平看剧。' },
    { id:'soundbar', name:'电视回音壁', zone:'观影区', icon:'🔊',
      specs:[{k:'声道', v:'3.1.2 全景声'},{k:'功率', v:'400W'},{k:'连接', v:'HDMI eARC / 光纤 / 蓝牙'}],
      desc:'电视柜上置,eARC自动回传,PC→HDMI→电视→eARC→回音壁,全自动切换无明线。' },
    { id:'console', name:'游戏主机 + 路由器', zone:'观影区', icon:'🎮',
      specs:[{k:'游戏主机', v:'PS5 数字版'},{k:'路由器', v:'WiFi 6 双频 5400M'}],
      desc:'电视柜左侧放游戏主机,右侧放路由器,HDMI接入电视,全屋WiFi覆盖。' },
    { id:'cabinet', name:'玻璃展示柜', zone:'展示区', icon:'📦',
      specs:[{k:'尺寸', v:'1600 × 400 × 1900mm'},{k:'材质', v:'深胡桃柜体 + 玻璃门'},{k:'层板', v:'4层玻璃'},{k:'照明', v:'每层暖光 LED 灯带'}],
      desc:'北墙西段落地柜,玻璃门防尘+暖光灯带,手办+外设+游戏盒分层展示,下柜封闭储物。' },
    { id:'neon', name:'GAME 霓虹灯牌', zone:'展示区', icon:'💡',
      specs:[{k:'文字', v:'G A M E'},{k:'光源', v:'柔性 LED 霓虹管'},{k:'颜色', v:'青冰蓝'},{k:'尺寸', v:'约 800 × 120mm'}],
      desc:'北墙展示柜与桌面之间的发光字牌,暗调环境下的视觉焦点,一键开关。' },
    { id:'ac', name:'壁挂空调', zone:'建筑', icon:'❄️',
      specs:[{k:'类型', v:'1.5匹 壁挂式'},{k:'位置', v:'北墙靠东 顶部'},{k:'离地', v:'2.8m'}],
      desc:'原装保留,空调下方桌面不受直吹(加装挡风板),夏日电竞制冷足够。' },
    { id:'window', name:'东墙推拉窗', zone:'建筑', icon:'🪟',
      specs:[{k:'尺寸', v:'1800 × 1200mm'},{k:'窗台', v:'离地 1.0m'},{k:'窗帘', v:'深灰遮光帘'}],
      desc:'东墙整面大窗,桌面右手侧进光,深灰遮光帘一键变黑屋模式。' },
    { id:'lamp', name:'五头玻璃吊灯', zone:'建筑', icon:'💡',
      specs:[{k:'灯头', v:'5头 玻璃球罩'},{k:'光源', v:'暖光 LED 2700K'},{k:'位置', v:'房间中央'}],
      desc:'全屋主照明,暖光五头吊灯,保留原装中式木作风格不违和。' },
    { id:'door_s', name:'南门装饰单元', zone:'建筑', icon:'🚪',
      specs:[{k:'门洞', v:'1000 × 2000mm'},{k:'结构', v:'门扇 + 侧格栅 + 门楣格栅'},{k:'材质', v:'蜜色实木'}],
      desc:'南门含西侧通顶格栅板+门楣格栅,挂中国结,与东墙挂落连成一体木作圈。' },
  ];

  const hwMap = {};
  hardware.forEach(h => hwMap[h.id] = h);

  // ---------- 选中高亮系统 ----------
  const clickableMeshes = [];

  function registerDevice(group, id) {
    group.traverse(obj => {
      if (obj.isMesh && !obj.userData.noClick) {
        obj.userData.hwId = id;
        clickableMeshes.push(obj);
      }
    });
    const bbox = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3(), ctr = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(ctr);
    const g = new THREE.Mesh(
      new THREE.BoxGeometry(size.x * 1.08 + 0.04, size.y * 1.08 + 0.04, size.z * 1.08 + 0.04),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0, side: THREE.BackSide, depthWrite: false })
    );
    g.position.copy(ctr);
    g.userData.isGlow = true;
    scene.add(g);
    hwMap[id].glow = g;
    hwMap[id].group = group;
    hwMap[id]._glowStart = 0;
    hwMap[id]._glowEnd = 0;
    hwMap[id]._glowT = 1;
  }

  function setHighlight(id, on) {
    if (!hwMap[id] || !hwMap[id].glow) return;
    hwMap[id]._glowStart = hwMap[id].glow.material.opacity;
    hwMap[id]._glowEnd = on ? 0.38 : 0;
    hwMap[id]._glowT = 0;
    hwMap[id]._glowing = on;
    document.querySelectorAll('.hw-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id && on);
    });
  }

  // ---------- 灯光 ----------
  scene.add(new THREE.AmbientLight(0x252c38, 0.32));

  const keyLight = new THREE.DirectionalLight(0xffe0b8, 0.7);
  keyLight.position.set(6, 7, -2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -6;
  keyLight.shadow.camera.right = 6;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -6;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 20;
  scene.add(keyLight);

  function pt(color, i, dist, x, y, z) {
    const L = new THREE.PointLight(color, i, dist);
    L.position.set(x, y, z);
    scene.add(L);
    return L;
  }
  pt(0x00aaff, 0.6, 4, 4.3, 1.2, 3.3);     // 桌面冷光
  pt(0x6622cc, 0.6, 4, 0.5, 1.2, 2.4);     // 电视背光晕
  pt(0xffaa55, 0.55, 3.5, 1.1, 1.5, 3.5);  // 展示柜暖光
  pt(0x00e5ff, 0.4, 3, 2.6, 2.1, 3.6);     // 霓虹晕
  pt(0xffddaa, 0.5, 6, 2.6, 2.35, 1.88);   // 吊灯主光
  pt(0x00ffff, 0.45, 0.8, 4.9, 1.06, 3.45); // 机箱内光

  // ---------- 建筑本体 ----------
  function wallMesh(w, h, d, x, y, z, mat) {
    const mm = box(w, h, d, mat, x, y, z);
    mm.receiveShadow = true;
    return mm;
  }

  function buildDoor() {
    const g = new THREE.Group();
    const fd = 0.16, fw = 0.06;
    g.add(box(fw, 2.0, fd, M.trim, -0.53, 1.0, 0));
    g.add(box(fw, 2.0, fd, M.trim, 0.53, 1.0, 0));
    g.add(box(1.12, 0.06, fd, M.trim, 0, 2.03, 0));
    g.add(box(0.98, 1.98, 0.045, M.trim, 0, 1.0, 0));
    for (let i = 0; i < 3; i++) {
      g.add(box(0.6, 0.45, 0.005, m({ color: 0x6b4820, rough: 0.5 }), 0, 0.5 + i * 0.52, 0.022));
    }
    g.add(sphere(0.02, M.metal, 0.38, 1.02, 0.03));
    setShadow(g, true, true);
    return g;
  }

  function buildLattice(w, h, depth, mat, plane) {
    const g = new THREE.Group();
    const bar = 0.02, space = 0.22;
    if (plane === 'xy') {
      g.add(box(bar, h, depth, mat, -w/2 + bar/2, h/2, 0));
      g.add(box(bar, h, depth, mat, w/2 - bar/2, h/2, 0));
      g.add(box(w, bar, depth, mat, 0, h - bar/2, 0));
      g.add(box(w, bar, depth, mat, 0, bar/2, 0));
      const nv = Math.floor(w / space);
      for (let i = 1; i < nv; i++)
        g.add(box(bar * 0.7, h - bar * 2, depth * 0.7, mat, -w/2 + i * w / nv, h/2, 0));
      const nh = Math.floor(h / space);
      for (let j = 1; j < nh; j++)
        g.add(box(w - bar * 2, bar * 0.7, depth * 0.7, mat, 0, j * h / nh, 0));
    } else if (plane === 'yz') {
      g.add(box(depth, h, bar, mat, 0, h/2, -w/2 + bar/2));
      g.add(box(depth, h, bar, mat, 0, h/2, w/2 - bar/2));
      g.add(box(depth, bar, w, mat, 0, h - bar/2, 0));
      g.add(box(depth, bar, w, mat, 0, bar/2, 0));
      const nv = Math.floor(w / space);
      for (let i = 1; i < nv; i++)
        g.add(box(depth * 0.7, h - bar * 2, bar * 0.7, mat, 0, h/2, -w/2 + i * w / nv));
      const nh = Math.floor(h / space);
      for (let j = 1; j < nh; j++)
        g.add(box(depth * 0.7, bar * 0.7, w - bar * 2, mat, 0, j * h / nh, 0));
    }
    return g;
  }

  function buildKnot() {
    const g = new THREE.Group();
    const knotBody = box(0.18, 0.18, 0.03, M.red, 0, 0, 0);
    knotBody.rotation.z = Math.PI / 4;
    g.add(knotBody);
    g.add(sphere(0.025, M.gold, 0, 0.15, 0));
    for (let i = 0; i < 5; i++)
      g.add(cyl(0.005, 0.28, M.red, -0.04 + i * 0.02, -0.28, 0));
    return g;
  }

  function buildRacket(x, z, yOffset) {
    const g = new THREE.Group();
    const frame = torus(0.085, 0.01, M.metal, 0, 0, 0, Math.PI / 2, 0);
    frame.scale.z = 1.25;
    g.add(frame);
    g.add(cyl(0.01, 0.28, M.black, 0, -0.22, 0));
    g.position.set(x, z, yOffset);
    return g;
  }

  function buildWindow() {
    const g = new THREE.Group();
    g.add(box(0.06, 0.06, 1.88, M.trim, 0, 2.23, 0));
    g.add(box(0.06, 0.06, 1.88, M.trim, 0, 0.97, 0));
    g.add(box(0.06, 1.32, 0.06, M.trim, 0, 1.6, -0.93));
    g.add(box(0.06, 1.32, 0.06, M.trim, 0, 1.6, 0.93));
    g.add(box(0.04, 1.26, 0.04, M.trim, 0, 1.6, 0));
    // 玻璃
    g.add(box(0.01, 1.16, 1.76, M.glass, 0.02, 1.6, 0));
    // 窗外夜景 (双面, 从房内可见)
    const night = plane(2.4, 2.0,
      new THREE.MeshBasicMaterial({ map: cityTex.tex, side: THREE.DoubleSide, fog: false }),
      0.14, 1.6, 0, Math.PI / 2);
    night.userData.noClick = true;
    g.add(night);
    // 窗台
    g.add(box(0.12, 0.03, 1.9, M.trim, -0.06, 0.95, 0));
    setShadow(g, true, true);
    return g;
  }

  function buildRoom() {
    const room = new THREE.Group();
    const WT = 0.12;

    // 地板 (木纹 canvas 纹理)
    const floorMat = m({ color: 0xffffff, rough: 0.55, map: floorTex.tex });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.76), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(2.6, 0, 1.88);
    floor.receiveShadow = true;
    room.add(floor);

    // 天花板
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.76), m({ color: 0x3a3e48, rough: 0.95 }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(2.6, 2.9, 1.88);
    room.add(ceil);

    // 二级吊顶沿 + 内嵌暖光灯带
    const soffit = m({ color: 0x323640, rough: 0.9 });
    const sw = 0.4, sh = 0.18;
    room.add(box(5.2, sh, sw, soffit, 2.6, 2.72, 0.2));
    room.add(box(5.2, sh, sw, soffit, 2.6, 2.72, 3.56));
    room.add(box(sw, sh, 3.76, soffit, 0.2, 2.72, 1.88));
    room.add(box(sw, sh, 3.76, soffit, 5.0, 2.72, 1.88));
    room.add(box(4.36, 0.018, 0.025, M.ledWarm, 2.6, 2.625, 0.42));
    room.add(box(4.36, 0.018, 0.025, M.ledWarm, 2.6, 2.625, 3.34));
    room.add(box(0.025, 0.018, 2.92, M.ledWarm, 0.42, 2.625, 1.88));
    room.add(box(0.025, 0.018, 2.92, M.ledWarm, 4.78, 2.625, 1.88));

    // 北墙
    room.add(wallMesh(5.2, 2.9, WT, 2.6, 1.45, 3.82, M.wallD));
    // 南墙(门洞 x 3.9-4.9)
    room.add(wallMesh(3.9, 2.9, WT, 1.95, 1.45, -0.06, M.wall));
    room.add(wallMesh(0.3, 2.9, WT, 5.05, 1.45, -0.06, M.wall));
    room.add(wallMesh(1.0, 0.9, WT, 4.4, 2.45, -0.06, M.wall));
    // 西墙(门洞 z 0.4-1.4)
    room.add(wallMesh(WT, 2.9, 0.4, -0.06, 1.45, 0.2, M.wall));
    room.add(wallMesh(WT, 2.9, 2.36, -0.06, 1.45, 2.58, M.wall));
    room.add(wallMesh(WT, 0.9, 1.0, -0.06, 2.45, 0.9, M.wall));
    // 东墙(窗洞 z 1.0-2.8 y 1.0-2.2)
    room.add(wallMesh(WT, 2.9, 1.0, 5.26, 1.45, 0.5, M.wall));
    room.add(wallMesh(WT, 2.9, 0.96, 5.26, 1.45, 3.28, M.wall));
    room.add(wallMesh(WT, 1.0, 1.8, 5.26, 0.5, 1.9, M.wall));
    room.add(wallMesh(WT, 0.7, 1.8, 5.26, 2.55, 1.9, M.wall));

    // 踢脚线 + 顶角线
    const sk = 0.08, sd = 0.03;
    [ [2.6, 0.04, 0.015, 5.2, sk, sd],
      [2.6, 0.04, 3.745, 5.2, sk, sd],
      [0.015, 0.04, 1.88, sd, sk, 3.76],
      [5.185, 0.04, 1.88, sd, sk, 3.76],
      [2.6, 2.86, 0.03, 5.2, sd, 0.06],
      [2.6, 2.86, 3.73, 5.2, sd, 0.06],
      [0.03, 2.86, 1.88, 0.06, sd, 3.76],
      [5.17, 2.86, 1.88, 0.06, sd, 3.76],
    ].forEach(([x,y,z,w,h,d]) => room.add(box(w, h, d, M.trim, x, y, z)));

    // 南门 + 装饰单元
    const sDoor = buildDoor();
    sDoor.position.set(4.4, 0, -0.06);
    sDoor.rotation.y = Math.PI;
    room.add(sDoor);
    const sSide = buildLattice(0.7, 2.45, 0.04, M.trim, 'xy');
    sSide.position.set(3.45, 0, -0.08);
    room.add(sSide);
    const sTop = buildLattice(2.05, 0.45, 0.04, M.trim, 'xy');
    sTop.position.set(3.45, 2.22, -0.08);
    room.add(sTop);
    const knot = buildKnot();
    knot.position.set(3.45, 1.55, -0.18);
    knot.rotation.y = Math.PI;
    room.add(knot);
    registerDevice(sDoor, 'door_s');

    // 海报 (南墙, 沙发对面)
    const poster = plane(0.62, 0.78, screenMat(posterTex.tex, 0.85), 1.5, 1.5, 0.035);
    room.add(poster);
    room.add(box(0.68, 0.84, 0.02, M.black, 1.5, 1.5, 0.012));

    // 西门 + 装饰单元
    const wDoor = buildDoor();
    wDoor.position.set(-0.06, 0, 0.9);
    wDoor.rotation.y = Math.PI / 2;
    room.add(wDoor);
    const wSide = buildLattice(0.36, 2.45, 0.04, M.trim, 'yz');
    wSide.position.set(0.08, 0, 0.2);
    room.add(wSide);
    const wTop = buildLattice(1.0, 0.45, 0.04, M.trim, 'yz');
    wTop.position.set(0.08, 2.22, 0.9);
    room.add(wTop);
    room.add(buildRacket(0.09, 1.42, 0.25));
    room.add(buildRacket(0.09, 1.34, 0.12));

    // 东墙通长挂落 + 假藤蔓
    const gualuo = buildLattice(3.76, 0.55, 0.03, M.trim, 'yz');
    gualuo.position.set(5.14, 2.5, 1.88);
    room.add(gualuo);
    const vineMat = m({ color: 0x2a4a18, rough: 0.8 });
    for (let i = 0; i < 22; i++) {
      room.add(sphere(0.04 + R(i * 3) * 0.03, vineMat,
        5.16 + R(i * 7) * 0.02, 2.56 + R(i * 11) * 0.1, 0.2 + i * 0.165));
    }

    // 窗户
    const win = buildWindow();
    win.position.set(5.2, 0, 1.9);
    room.add(win);
    registerDevice(win, 'window');

    // 窗帘
    [0.56, 3.2].forEach(z => {
      const c = new THREE.Group();
      c.add(cyl(0.012, 3.7, M.metal, 5.06, 2.48, 1.88, Math.PI / 2));
      c.add(box(0.14, 2.42, 1.12, M.grey, 5.06, 1.2, z));
      for (let i = 0; i < 7; i++) {
        c.add(box(0.02, 2.4, 0.15, m({ color: 0x14161c, rough: 0.85 }),
          5.06 + (i % 2 ? 0.04 : -0.04), 1.2, z - 0.5 + i * 0.16));
      }
      room.add(c);
    });

    // 空调
    const ac = new THREE.Group();
    ac.add(box(0.9, 0.3, 0.24, m({ color: 0xe8eaee, rough: 0.5 }), 0, 0, 0));
    const flap = box(0.8, 0.03, 0.1, m({ color: 0x222222, rough: 0.6 }), 0, -0.1, -0.16);
    flap.rotation.x = 0.5;
    ac.add(flap);
    ac.position.set(4.7, 2.62, 3.66);
    setShadow(ac, true, true);
    registerDevice(ac, 'ac');
    room.add(ac);

    // 五头吊灯 + 光锥
    const chl = new THREE.Group();
    chl.add(cyl(0.05, 0.08, M.metal, 2.6, 2.55, 1.88));
    chl.add(cyl(0.012, 0.36, M.metal, 2.6, 2.73, 1.88));
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffcc88, transparent: true, opacity: 0.028,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const ax = 2.6 + 0.26 * Math.cos(a), az = 1.88 + 0.26 * Math.sin(a);
      const arm = cyl(0.006, 0.36, M.metal, 0, 0, 0, Math.PI / 2, a);
      arm.position.set(ax, 2.55, az);
      chl.add(arm);
      const sx = 2.6 + 0.35 * Math.cos(a), sz = 1.88 + 0.35 * Math.sin(a);
      chl.add(sphere(0.12, M.shade, sx, 2.52, sz));
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.0, 16, 1, true), coneMat);
      cone.position.set(sx, 2.0, sz);
      cone.userData.noClick = true;
      chl.add(cone);
    }
    room.add(chl);
    registerDevice(chl, 'lamp');

    return room;
  }

  scene.add(buildRoom());

  // ---------- 电竞区 ----------
  function buildMonitor(w, h, tex) {
    const g = new THREE.Group();
    g.add(cyl(0.02, 0.5, M.metal, 0, 0.25, 0.04));
    const body = box(w, h, 0.05, M.black, 0, 0, 0);
    body.castShadow = true;
    g.add(body);
    // 屏幕画面 (朝 -z, 面向椅子)
    const scr = plane(w * 0.94, h * 0.9, screenMat(tex, 1.35), 0, 0, -0.028, Math.PI);
    scr.userData.noClick = true;
    g.add(scr);
    return g;
  }

  function buildChair() {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leg = box(0.36, 0.04, 0.05, M.metal, 0, 0.05, 0);
      leg.position.set(0.17 * Math.cos(a), 0.05, 0.17 * Math.sin(a));
      leg.rotation.y = a;
      g.add(leg);
      g.add(sphere(0.025, M.black, 0.34 * Math.cos(a), 0.025, 0.34 * Math.sin(a)));
    }
    g.add(cyl(0.03, 0.4, M.metal, 0, 0.28, 0));
    g.add(box(0.52, 0.09, 0.5, M.black, 0, 0.5, 0));
    const back = box(0.48, 0.55, 0.07, M.grey, 0, 0.88, -0.23);
    back.rotation.x = -0.08;
    g.add(back);
    g.add(box(0.26, 0.13, 0.07, M.grey, 0, 1.28, -0.26));
    [-1, 1].forEach(s => {
      g.add(box(0.06, 0.05, 0.3, M.black, s * 0.28, 0.68, -0.02));
      g.add(cyl(0.015, 0.16, M.metal, s * 0.28, 0.58, -0.02));
    });
    setShadow(g, true, true);
    return g;
  }

  function buildDeskZone() {
    const g = new THREE.Group();

    // 桌面 + 桌腿
    const desk = new THREE.Group();
    const top = box(1.8, 0.045, 0.8, M.walnut, 4.3, 0.78, 3.36);
    top.castShadow = true; top.receiveShadow = true;
    desk.add(top);
    desk.add(box(0.05, 0.7, 0.76, M.metal, 3.48, 0.38, 3.36));
    desk.add(box(0.05, 0.7, 0.76, M.metal, 5.12, 0.38, 3.36));
    desk.add(box(1.5, 0.08, 0.08, M.black, 4.3, 0.62, 3.7));
    g.add(desk);
    registerDevice(desk, 'desk');

    // 桌后灯带
    g.add(box(1.7, 0.015, 0.02, M.ledCyan, 4.3, 0.86, 3.745));

    // 主屏 (动态游戏画面)
    const monMain = buildMonitor(0.63, 0.37, scrMain.tex);
    monMain.position.set(4.35, 1.18, 3.62);
    g.add(monMain);
    registerDevice(monMain, 'monitor_main');

    // 竖屏副屏 (代码+弹幕)
    const monSub = buildMonitor(0.36, 0.63, scrSub.tex);
    monSub.position.set(3.6, 1.2, 3.62);
    g.add(monSub);
    registerDevice(monSub, 'monitor_sub');

    // 屏幕挂灯
    const sb = new THREE.Group();
    sb.add(box(0.38, 0.03, 0.018, M.black, 4.35, 1.378, 3.61));
    sb.add(box(0.34, 0.006, 0.01, M.ledWarm, 4.35, 1.368, 3.6));
    g.add(sb);
    registerDevice(sb, 'screenbar');

    // 桌垫 + 键鼠 + RGB 键盘
    const kbGroup = new THREE.Group();
    kbGroup.add(box(0.9, 0.004, 0.4, M.pad, 4.42, 0.803, 3.12));
    kbGroup.add(box(0.36, 0.025, 0.13, M.black, 4.3, 0.818, 3.14));
    [M.rgb1, M.rgb2, M.rgb3].forEach((mm2, i) => {
      kbGroup.add(box(0.34, 0.003, 0.032, mm2, 4.3, 0.832, 3.105 + i * 0.038));
    });
    kbGroup.add(box(0.06, 0.03, 0.1, M.black, 4.78, 0.82, 3.14));
    g.add(kbGroup);
    registerDevice(kbGroup, 'kb');

    // 杯子 + 手柄 (装饰)
    const mug = new THREE.Group();
    mug.add(cyl(0.035, 0.09, m({ color: 0xdde2ea, rough: 0.4 }), 3.72, 0.85, 3.22));
    const handle = torus(0.024, 0.006, m({ color: 0xdde2ea, rough: 0.4 }), 3.755, 0.85, 3.22);
    handle.rotation.y = Math.PI / 2;
    mug.add(handle);
    g.add(mug);
    g.add(box(0.14, 0.03, 0.09, M.black, 4.68, 0.82, 3.36));
    g.add(sphere(0.012, M.black, 4.65, 0.84, 3.34));
    g.add(sphere(0.012, M.black, 4.71, 0.84, 3.38));

    // 机箱 + 内部结构
    const pc = new THREE.Group();
    pc.add(box(0.22, 0.5, 0.44, M.black, 5.0, 1.06, 3.45));
    pc.add(box(0.008, 0.46, 0.4, M.glass, 4.885, 1.06, 3.45));
    // 主板 + 显卡 + 内存
    pc.add(box(0.012, 0.42, 0.38, m({ color: 0x0d1218, rough: 0.7 }), 4.985, 1.06, 3.45));
    pc.add(box(0.03, 0.05, 0.26, m({ color: 0x161a22, rough: 0.5 }), 4.955, 1.0, 3.45));
    pc.add(box(0.008, 0.012, 0.24, M.rgb2, 4.945, 1.028, 3.45));
    pc.add(box(0.014, 0.09, 0.02, M.ledCyan, 4.975, 1.14, 3.37));
    pc.add(box(0.014, 0.09, 0.02, M.ledCyan, 4.975, 1.14, 3.41));
    // 前面板风扇
    const fans = [M.rgb1, M.rgb2, M.rgb3];
    for (let i = 0; i < 3; i++) {
      const f = torus(0.045, 0.012, fans[i], 4.895, 0.93 + i * 0.13, 3.32, Math.PI / 2, 0);
      pc.add(f);
    }
    g.add(pc);
    registerDevice(pc, 'pc');

    // 人体工学椅
    const chair = buildChair();
    chair.position.set(4.3, 0, 2.52);
    g.add(chair);
    registerDevice(chair, 'chair');

    // 洞洞板 + 耳机
    const peg = new THREE.Group();
    peg.add(box(0.04, 0.75, 0.8, M.grey, 5.16, 1.45, 3.3));
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 4; j++)
        peg.add(cyl(0.005, 0.05, M.metal, 5.13, 1.1 + j * 0.2, 2.95 + i * 0.16, Math.PI / 2, 0));
    const hp = torus(0.09, 0.02, M.black, 5.1, 1.55, 3.5, 0, 0);
    hp.rotation.y = Math.PI / 2;
    hp.scale.x = 1.2;
    peg.add(hp);
    g.add(peg);
    registerDevice(peg, 'headset');

    return g;
  }

  scene.add(buildDeskZone());

  // ---------- 观影区 ----------
  function buildSofa() {
    const g = new THREE.Group();
    const zc = 2.4;
    g.add(box(0.85, 0.32, 1.6, M.sofa, 1.85, 0.3, zc));
    g.add(box(0.24, 0.72, 1.6, M.sofa, 2.34, 0.6, zc));
    g.add(box(0.8, 0.5, 0.16, M.sofa, 1.95, 0.52, 1.53));
    g.add(box(0.8, 0.5, 0.16, M.sofa, 1.95, 0.52, 3.27));
    // 左位(南): 躺平展开
    g.add(box(0.72, 0.14, 0.72, M.sofa, 1.82, 0.46, 2.0));
    g.add(box(0.6, 0.12, 0.68, M.sofa, 1.12, 0.42, 2.0));
    g.add(box(0.14, 0.14, 0.5, M.metal, 1.42, 0.3, 2.0));
    g.add(box(0.44, 0.13, 0.7, M.sofa, 2.26, 0.56, 2.0));
    // 右位(北): 坐姿
    g.add(box(0.72, 0.14, 0.72, M.sofa, 1.82, 0.46, 2.8));
    const rb = box(0.16, 0.5, 0.72, M.sofa, 2.14, 0.85, 2.8);
    rb.rotation.y = -0.15;
    g.add(rb);
    g.add(box(0.08, 0.34, 0.68, M.sofa, 1.45, 0.33, 2.8));
    const p1 = box(0.13, 0.34, 0.34, M.pillow, 2.06, 0.68, 2.62);
    p1.rotation.set(0.25, 0.15, 0);
    g.add(p1);
    const p2 = box(0.13, 0.32, 0.32, M.grey, 2.08, 0.66, 2.98);
    p2.rotation.set(-0.2, -0.1, 0);
    g.add(p2);
    g.add(box(0.5, 0.07, 0.28, M.pillow, 1.95, 0.8, 1.53));
    setShadow(g, true, true);
    return g;
  }

  function buildViewingZone() {
    const g = new THREE.Group();

    // 电视柜
    const tvc = box(0.42, 0.44, 1.5, M.walnut, 0.26, 0.26, 2.4);
    g.add(tvc);
    g.add(box(0.006, 0.015, 1.3, M.black, 0.475, 0.3, 2.4));

    // 电视 (动态电影画面)
    const tv = new THREE.Group();
    tv.add(box(0.055, 0.95, 1.68, M.black, 0.055, 1.1, 2.4));
    const tvScr = plane(1.6, 0.88, screenMat(scrTV.tex, 1.15), 0.088, 1.1, 2.4, Math.PI / 2);
    tvScr.userData.noClick = true;
    tv.add(tvScr);
    g.add(tv);
    registerDevice(tv, 'tv');

    // 电视背景光
    const bgLight = new THREE.Mesh(
      new THREE.PlaneGeometry(1.72, 0.99),
      m({ color: 0x5522cc, emit: 0x4422aa, estr: 0.7, side: THREE.DoubleSide })
    );
    bgLight.rotation.y = Math.PI / 2;
    bgLight.position.set(0.01, 1.1, 2.4);
    bgLight.userData.noClick = true;
    g.add(bgLight);

    // 回音壁
    const sb = box(0.09, 0.09, 1.05, M.black, 0.26, 0.525, 2.4);
    g.add(sb);
    registerDevice(sb, 'soundbar');

    // 游戏主机 + 路由器
    const cons = new THREE.Group();
    cons.add(box(0.3, 0.06, 0.26, M.black, 0.26, 0.52, 1.78));
    cons.add(box(0.02, 0.012, 0.01, M.rgb1, 0.26, 0.52, 1.64));
    cons.add(box(0.2, 0.04, 0.14, m({ color: 0xcccccc, rough: 0.6 }), 0.26, 0.53, 3.0));
    cons.add(box(0.015, 0.01, 0.008, M.rgb1, 0.26, 0.53, 2.92));
    g.add(cons);
    registerDevice(cons, 'console');

    // 沙发
    const sofa = buildSofa();
    g.add(sofa);
    registerDevice(sofa, 'sofa');

    // 地毯
    const rug = box(1.9, 0.03, 1.7, M.grey, 2.0, 0.015, 2.1);
    rug.receiveShadow = true;
    g.add(rug);

    // 沙发后氛围灯带
    g.add(box(0.02, 0.015, 1.5, M.ledPurple, 2.52, 0.035, 2.4));

    return g;
  }

  scene.add(buildViewingZone());

  // ---------- 展示区 ----------
  function buildNeonLetter(ch) {
    const g = new THREE.Group();
    const t = 0.012, h = 0.16, w = 0.16;
    const seg = (x1, y1, x2, y2) => {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const mm2 = cyl(t / 2, len, M.neon, (x1 + x2) / 2, (y1 + y2) / 2, 0);
      mm2.rotation.z = Math.PI / 2 - ang;
      g.add(mm2);
      g.add(sphere(t / 2, M.neon, x1, y1, 0));
      g.add(sphere(t / 2, M.neon, x2, y2, 0));
    };
    switch (ch) {
      case 'G':
        seg(-w/2, -h/2, w/2, -h/2); seg(-w/2, -h/2, -w/2, h/2);
        seg(-w/2, h/2, w/2, h/2); seg(w/2, h/2, w/2, 0); seg(w/4, 0, w/2, 0);
        break;
      case 'A':
        seg(-w/2, -h/2, -w/5, h/2); seg(w/2, -h/2, w/5, h/2); seg(-w/4, 0, w/4, 0);
        break;
      case 'M':
        seg(-w/2, -h/2, -w/2, h/2); seg(-w/2, h/2, 0, 0);
        seg(w/2, h/2, 0, 0); seg(w/2, -h/2, w/2, h/2);
        break;
      case 'E':
        seg(-w/2, -h/2, -w/2, h/2); seg(-w/2, h/2, w/2, h/2);
        seg(-w/2, 0, w/3, 0); seg(-w/2, -h/2, w/2, -h/2);
        break;
    }
    return g;
  }

  function buildDisplayZone() {
    const g = new THREE.Group();

    const cab = new THREE.Group();
    cab.add(box(1.6, 1.9, 0.4, M.walnut, 1.1, 0.95, 3.56));
    cab.add(box(1.6, 1.9, 0.04, m({ color: 0x1a1008, rough: 0.7 }), 1.1, 0.95, 3.76));
    cab.add(box(1.6, 0.56, 0.4, M.walnut, 1.1, 0.28, 3.56));
    cab.add(box(0.04, 1.9, 0.4, M.walnut, 0.32, 0.95, 3.56));
    cab.add(box(0.04, 1.9, 0.4, M.walnut, 1.88, 0.95, 3.56));
    cab.add(box(1.6, 0.04, 0.4, M.walnut, 1.1, 1.92, 3.56));
    [0.62, 1.0, 1.38, 1.72].forEach(y => {
      cab.add(box(1.52, 0.025, 0.36, M.glass, 1.1, y, 3.56));
      cab.add(box(1.5, 0.015, 0.02, M.ledWarm, 1.1, y + 0.06, 3.7));
    });
    cab.add(box(1.52, 1.35, 0.015, M.glass, 1.1, 1.25, 3.35));
    cab.add(sphere(0.012, M.metal, 1.85, 1.0, 3.34));
    g.add(cab);
    registerDevice(cab, 'cabinet');

    // 手办
    const figMats = [M.fig1, M.fig2, M.fig3, M.fig4, M.fig5];
    const figs = [
      [0.7, 0.64, 3.56, 0, 1],[1.05, 0.64, 3.56, 1, 1.2],[1.45, 0.64, 3.56, 2, 0.9],
      [0.8, 1.02, 3.56, 3, 1],[1.3, 1.02, 3.56, 4, 1.1],
      [0.65, 1.4, 3.56, 1, 0.8],[1.0, 1.4, 3.56, 0, 1.3],[1.5, 1.4, 3.56, 3, 1],
      [0.9, 1.74, 3.56, 2, 1],[1.35, 1.74, 3.56, 4, 1],
    ];
    figs.forEach(([x, y, z, mi, s]) => {
      const fg = new THREE.Group();
      fg.add(box(0.09 * s, 0.025 * s, 0.09 * s, M.black, 0, 0, 0));
      fg.add(cyl(0.035 * s, 0.12 * s, figMats[mi], 0, 0.09 * s, 0));
      fg.add(sphere(0.038 * s, figMats[mi], 0, 0.19 * s, 0));
      fg.position.set(x, y, z);
      g.add(fg);
    });

    // 游戏盒
    const gcs = [0x772233, 0x225599, 0x229977, 0x998822];
    for (let i = 0; i < 4; i++) {
      g.add(box(0.035, 0.19, 0.24, m({ color: gcs[i], rough: 0.5 }),
        1.56 + i * 0.045, 1.11, 3.56));
    }

    // 霓虹灯牌 GAME
    const neon = new THREE.Group();
    'GAME'.split('').forEach((ch, i) => {
      const letter = buildNeonLetter(ch);
      letter.position.set(1.8 + i * 0.25, 2.15, 3.77);
      neon.add(letter);
    });
    g.add(neon);
    registerDevice(neon, 'neon');

    return g;
  }

  scene.add(buildDisplayZone());

  // ---------- 尘埃粒子 ----------
  const dust = (() => {
    const N = 160;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = 0.3 + R(i * 3) * 4.6;
      pos[i * 3 + 1] = 0.3 + R(i * 7) * 2.3;
      pos[i * 3 + 2] = 0.3 + R(i * 13) * 3.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x99ccff, size: 0.012, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const p1 = new THREE.Points(geo, mat);
    p1.userData.noClick = true;
    scene.add(p1);
    return p1;
  })();

  // ---------- 侧边硬件清单 (分区) ----------
  const hwList = document.getElementById('hw-list');
  document.getElementById('hw-count').textContent = hardware.length + ' 件';
  ['电竞区', '观影区', '展示区', '建筑'].forEach(z => {
    const items = hardware.filter(h => h.zone === z);
    if (!items.length) return;
    const head = document.createElement('li');
    head.className = 'zone-head';
    head.textContent = `── ${z} ──`;
    hwList.appendChild(head);
    items.forEach(h => {
      const li = document.createElement('li');
      li.className = 'hw-item';
      li.dataset.id = h.id;
      li.innerHTML = `
        <div class="hw-icon">${h.icon}</div>
        <div class="hw-info">
          <div class="hw-name">${h.name}</div>
          <div class="hw-zone">${h.zone}</div>
        </div>`;
      li.addEventListener('click', () => { focusDevice(h.id); openDetail(h.id); });
      hwList.appendChild(li);
    });
  });

  // ---------- 交互 ----------
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredId = null;
  let selectedId = null;
  const hoverTip = document.getElementById('hover-tip');

  function updateMouse(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
  function getIntersected() {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(clickableMeshes, false);
    return hits.length > 0 ? hits[0].object.userData.hwId : null;
  }

  let dragging = false, sx = 0, sy = 0;
  renderer.domElement.addEventListener('pointerdown', () => {
    controls.autoRotate = false; // 第一次操作后停止自转
  });
  renderer.domElement.addEventListener('mousedown', e => {
    dragging = false; sx = e.clientX; sy = e.clientY;
  });
  renderer.domElement.addEventListener('mousemove', e => {
    if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) dragging = true;
    updateMouse(e);
    const id = getIntersected();
    if (id !== hoveredId) {
      if (hoveredId && hoveredId !== selectedId) setHighlight(hoveredId, false);
      hoveredId = id;
      if (id && id !== selectedId) setHighlight(id, true);
      if (id) {
        hoverTip.textContent = hwMap[id].name;
        hoverTip.style.display = 'block';
        canvas.style.cursor = 'pointer';
      } else {
        hoverTip.style.display = 'none';
        canvas.style.cursor = 'grab';
      }
    }
    if (id) {
      hoverTip.style.left = (e.clientX + 14) + 'px';
      hoverTip.style.top = (e.clientY + 14) + 'px';
    }
  });
  renderer.domElement.addEventListener('click', e => {
    if (dragging) return;
    updateMouse(e);
    const id = getIntersected();
    if (id) {
      focusDevice(id);
      openDetail(id);
    } else if (selectedId) {
      closeDetail();
    }
  });

  // ---------- 详情卡片（停靠式，不挡画面） ----------
  const modal = document.getElementById('detail-modal');
  function openDetail(id) {
    const h = hwMap[id];
    if (selectedId && selectedId !== id) setHighlight(selectedId, false);
    selectedId = id;
    setHighlight(id, true);
    document.getElementById('md-name').textContent = h.name;
    document.getElementById('md-zone').textContent = '◆ ' + h.zone;
    document.getElementById('md-specs').innerHTML = h.specs.map(s =>
      `<tr><td>${s.k}</td><td>${s.v}</td></tr>`).join('');
    document.getElementById('md-desc').textContent = h.desc;
    modal.classList.remove('hidden');
  }
  function closeDetail() {
    if (selectedId) { setHighlight(selectedId, false); selectedId = null; }
    modal.classList.add('hidden');
  }
  document.getElementById('btn-close').addEventListener('click', closeDetail);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeDetail();
      kimiPanel.classList.add('hidden');
    }
  });

  // 问 Kimi 这个设备
  document.getElementById('md-ask').addEventListener('click', () => {
    if (!selectedId) return;
    const h = hwMap[selectedId];
    closeDetail();
    openKimi();
    const specStr = h.specs.map(s => `${s.k}:${s.v}`).join('、');
    askKimi(`我想了解这个房间里的「${h.name}」(${h.zone})。参数:${specStr}。布局:${h.desc} 请给我一些使用体验和搭配上的建议。`);
  });

  // ---------- 相机 ----------
  function clampToRoom(v) {
    v.x = Math.min(Math.max(v.x, 0.25), 4.95);
    v.y = Math.min(Math.max(v.y, 0.25), 2.75);
    v.z = Math.min(Math.max(v.z, 0.25), 3.55);
    return v;
  }

  function focusDevice(id) {
    const h = hwMap[id];
    if (!h || !h.group) return;
    const bbox = new THREE.Box3().setFromObject(h.group);
    const ctr = new THREE.Vector3();
    bbox.getCenter(ctr);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxD = Math.max(size.x, size.y, size.z);

    // 从房间中心方向接近设备, 保证相机永远在房内开阔侧
    const dir = new THREE.Vector3(2.6 - ctr.x, 0.35, 1.88 - ctr.z).normalize();
    const dist = Math.max(maxD * 2.6, 1.3);
    const endCam = clampToRoom(ctr.clone().add(dir.multiplyScalar(dist)));
    if (selectedId && selectedId !== id) setHighlight(selectedId, false);
    animateCamera({ cam: camera.position.clone(), tgt: controls.target.clone() },
                   { cam: endCam, tgt: ctr }, 0.8);
    setHighlight(id, true);
    selectedId = id;
  }

  function animateCamera(start, end, dur) {
    const t0 = performance.now();
    function step() {
      const t = Math.min((performance.now() - t0) / (dur * 1000), 1);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      camera.position.lerpVectors(start.cam, end.cam, e);
      controls.target.lerpVectors(start.tgt, end.tgt, e);
      if (t < 1) requestAnimationFrame(step);
    }
    step();
  }

  // 视角预设
  const VIEW_PRESETS = {
    overview: { cam: [2.6, 5.4, 1.4], tgt: [2.6, 0, 1.9] },   // 正上方微倾, 自转=转盘展示
    entry:    { cam: [4.4, 1.7, 0.45],  tgt: [2.0, 1.0, 2.4] },
    desk:     { cam: [3.45, 1.85, 1.7], tgt: [4.45, 1.05, 3.6] }, // 斜侧越过椅子看桌面
    sofa:     { cam: [2.1, 1.2, 2.5],   tgt: [0.3, 1.1, 2.4] },
  };
  const VIEW_ORDER = ['overview', 'entry', 'desk', 'sofa'];

  function gotoView(name) {
    const v = VIEW_PRESETS[name];
    if (!v) return;
    controls.autoRotate = false;
    document.querySelectorAll('.view-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.view === name));
    if (selectedId) { setHighlight(selectedId, false); selectedId = null; }
    animateCamera(
      { cam: camera.position.clone(), tgt: controls.target.clone() },
      { cam: new THREE.Vector3(...v.cam), tgt: new THREE.Vector3(...v.tgt) },
      0.9);
  }
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => gotoView(btn.dataset.view));
  });
  document.addEventListener('keydown', e => {
    if (/^[1-4]$/.test(e.key) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      gotoView(VIEW_ORDER[parseInt(e.key) - 1]);
    }
  });

  // ========================================================================
  //  Kimi 设计助手
  // ========================================================================
  const kimiPanel = document.getElementById('kimi-panel');
  const kimiMsgs = document.getElementById('kimi-msgs');
  const kimiText = document.getElementById('kimi-text');
  const kimiSend = document.getElementById('kimi-send');
  const KIMI = {
    key: localStorage.getItem('kimi_key') || '',
    model: localStorage.getItem('kimi_model') || 'kimi-k2-0905-preview',
    history: [],
    busy: false,
  };
  document.getElementById('kimi-key').value = KIMI.key;
  document.getElementById('kimi-model').value = KIMI.model;

  function openKimi() {
    kimiPanel.classList.remove('hidden');
    if (!kimiMsgs.children.length) {
      addMsg('bot', '你好,我是这个电竞房的 AI 设计助手 ✨\n房间布局、设备参数、灯光方案我都熟,随便问。也可以直接点场景里的设备,再点「问 Kimi」。');
      if (!KIMI.key) {
        addMsg('err', '还没配 API Key:点右上角 ⚙,填入 platform.moonshot.cn 的 Key 就能聊了。');
      }
    }
  }
  document.getElementById('kimi-fab').addEventListener('click', () => {
    kimiPanel.classList.contains('hidden') ? openKimi() : kimiPanel.classList.add('hidden');
  });
  document.getElementById('kimi-close').addEventListener('click', () => kimiPanel.classList.add('hidden'));
  document.getElementById('kimi-gear').addEventListener('click', () => {
    document.getElementById('kimi-settings').classList.toggle('hidden');
  });
  document.getElementById('kimi-save').addEventListener('click', () => {
    KIMI.key = document.getElementById('kimi-key').value.trim();
    KIMI.model = document.getElementById('kimi-model').value.trim() || 'kimi-k2-0905-preview';
    localStorage.setItem('kimi_key', KIMI.key);
    localStorage.setItem('kimi_model', KIMI.model);
    const st = document.getElementById('kimi-key-status');
    st.textContent = KIMI.key ? '已保存 ✓' : '已清空';
    setTimeout(() => st.textContent = '', 2000);
  });

  function addMsg(role, text) {
    const div = document.createElement('div');
    div.className = 'kmsg ' + role;
    div.textContent = text;
    kimiMsgs.appendChild(div);
    kimiMsgs.scrollTop = kimiMsgs.scrollHeight;
    return div;
  }

  function kimiSystemPrompt() {
    const devList = hardware.map(h =>
      `【${h.name}】(${h.zone}) ${h.specs.map(s => s.k + ':' + s.v).join(',')}。${h.desc}`
    ).join('\n');
    return `你是「电竞房设计助手」,嵌在一个真实房间的 3D 可视化页面里,用中文回答,简洁专业有审美,可适当给升级建议,不知道就说不确定,别编参数。

房间实况:5.2m(东西)×3.76m(南北)×2.9m高。满屋中式蜜色木作(门套/格栅挂落/假藤蔓)全部保留。南门东南角挂中国结,西门通卫生间过道,东墙推拉窗(1.8×1.2m,窗台1m),北墙空调离地2.8m。

布局定稿 v3:
- 电竞区(东北):定制高桌180×80×80压北墙东段,双屏支臂,桌面展示机箱,人体工学椅,东墙洞洞板
- 观影区(西):75寸电视挂西墙(屏中心1.1m)+回音壁+PS5+路由器,双人电动功能沙发朝西(左位可躺平成床),视距2.3-2.6m
- 展示区(北墙西段):1.6m玻璃带灯展示柜,GAME霓虹灯牌
- 风格:暗调木质电竞——黑/深胡桃家具+2700-3000K暖光为主+RGB点缀

用户原则:可以贵但不可以麻烦(一切省心自动化);身高185cm;电视观影几何>桌面场景;米家智能场景;不动墙不布线。

设备清单:
${devList}`;
  }

  async function askKimi(q) {
    q = q.trim();
    if (!q || KIMI.busy) return;
    openKimi();
    addMsg('user', q);
    kimiText.value = '';
    if (!KIMI.key) {
      addMsg('err', '先点右上角 ⚙ 配一下 Moonshot API Key(platform.moonshot.cn 注册领取)。');
      return;
    }
    KIMI.busy = true;
    kimiSend.disabled = true;
    const loading = document.createElement('div');
    loading.className = 'kmsg bot loading';
    loading.innerHTML = '<span>●</span><span>●</span><span>●</span>';
    kimiMsgs.appendChild(loading);
    kimiMsgs.scrollTop = kimiMsgs.scrollHeight;

    KIMI.history.push({ role: 'user', content: q });
    if (KIMI.history.length > 12) KIMI.history = KIMI.history.slice(-12);

    try {
      const resp = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + KIMI.key,
        },
        body: JSON.stringify({
          model: KIMI.model,
          temperature: 0.6,
          max_tokens: 800,
          messages: [
            { role: 'system', content: kimiSystemPrompt() },
            ...KIMI.history,
          ],
        }),
      });
      loading.remove();
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        let hint = `HTTP ${resp.status}`;
        if (resp.status === 401) hint += ':Key 不对,去 ⚙ 检查';
        else if (resp.status === 429) hint += ':额度不足或限流,稍后再试';
        else if (resp.status === 404) hint += ':模型名不对,去 ⚙ 改成 kimi-k2-0905-preview 或 moonshot-v1-32k';
        addMsg('err', `Kimi 请求失败 ${hint}\n${txt.slice(0, 160)}`);
        KIMI.history.pop();
      } else {
        const data = await resp.json();
        const ans = (data.choices && data.choices[0] && data.choices[0].message.content || '').trim();
        KIMI.history.push({ role: 'assistant', content: ans });
        addMsg('bot', ans || '(空回复)');
      }
    } catch (err) {
      loading.remove();
      addMsg('err', '网络请求失败(可能是浏览器跨域限制或没联网)。\n如果是 CORS 问题,告诉我,我可以加个本地小代理。\n' + err.message);
      KIMI.history.pop();
    }
    KIMI.busy = false;
    kimiSend.disabled = false;
  }

  kimiSend.addEventListener('click', () => askKimi(kimiText.value));
  kimiText.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askKimi(kimiText.value);
    }
  });
  document.querySelectorAll('.kchip').forEach(c => {
    c.addEventListener('click', () => askKimi(c.textContent));
  });

  // ---------- 开场 ----------
  let booted = false;
  setTimeout(() => {
    document.getElementById('boot').classList.add('done');
    booted = true;
    // 缓动到总览位
    animateCamera(
      { cam: camera.position.clone(), tgt: controls.target.clone() },
      { cam: new THREE.Vector3(...VIEW_PRESETS.overview.cam),
        tgt: new THREE.Vector3(...VIEW_PRESETS.overview.tgt) },
      1.6);
  }, 900);

  // ---------- 渲染循环 ----------
  let clock = 0, scrTimer = 0;
  function render() {
    requestAnimationFrame(render);
    clock += 0.016;
    controls.update();

    // 高亮动画
    hardware.forEach(h => {
      if (h._glowT !== undefined && h._glowT < 1 && h.glow) {
        h._glowT = Math.min(h._glowT + 0.05, 1);
        h.glow.material.opacity = h._glowStart + (h._glowEnd - h._glowStart) * h._glowT;
      }
    });

    // 霓虹呼吸
    const pulse = 2 + Math.sin(clock * 2) * 0.5;
    if (hwMap.neon && hwMap.neon.group) {
      hwMap.neon.group.traverse(o => {
        if (o.isMesh && o.material && o.material.emissiveIntensity !== undefined) {
          o.material.emissiveIntensity = pulse;
        }
      });
    }

    // 尘埃缓慢漂移
    dust.rotation.y = clock * 0.008;

    // 屏幕内容 10fps 刷新
    scrTimer += 0.016;
    if (scrTimer > 0.1 && !document.hidden) {
      scrTimer = 0;
      scrMain.draw(clock);
      scrSub.draw(clock);
      scrTV.draw(clock);
    }

    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  render();

})();
