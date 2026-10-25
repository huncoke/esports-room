/* ══════════════════════════════════════════════════════════════
   main.js — 渲染、交互、相机、UI
   ══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const CY = new THREE.Color(0x3ee8ff);

  /* ───────── 渲染器 / 场景 ───────── */
  const canvas = $('#stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070b);
  scene.fog = new THREE.FogExp2(0x05070b, .028);

  const camera = new THREE.PerspectiveCamera(44, innerWidth / innerHeight, .05, 120);
  camera.position.set(5.5, 9.0, 13.0);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .075;
  controls.minDistance = .7;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * .497;
  controls.target.set(ROOM.CX, 1.05, ROOM.CZ);
  controls.autoRotate = true;
  controls.autoRotateSpeed = .42;

  /* ───────── 虚空网格（房间之外的"检视台"） ───────── */
  const grid = new THREE.GridHelper(60, 60, 0x1d6b7d, 0x0e2a33);
  grid.position.set(ROOM.CX, -.45, ROOM.CZ);
  grid.material.transparent = true; grid.material.opacity = .5;
  scene.add(grid);

  /* ───────── 构建房间 ───────── */
  $('#boot-log').textContent = '生成几何体与程序化贴图…';
  const built = ROOM.build(scene);
  const DEVS = built.devices;
  const WALLS = built.walls;

  /* ───────── 尘埃 ───────── */
  const dust = (() => {
    const N = 420, pos = new Float32Array(N * 3), spd = [];
    for (let i = 0; i < N; i++) {
      pos[i * 3] = Math.random() * ROOM.W;
      pos[i * 3 + 1] = Math.random() * ROOM.H;
      pos[i * 3 + 2] = Math.random() * ROOM.D;
      spd.push([(Math.random() - .5) * .004, Math.random() * .006 + .001, (Math.random() - .5) * .004]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({
      size: .011, color: 0xbfe6f2, transparent: true, opacity: .34,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    scene.add(p);
    return { p, pos, spd, N };
  })();

  /* ───────── 选中标记（笼 + 地环） ───────── */
  const marker = new THREE.Group();
  marker.visible = false;
  const cage = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
    new THREE.LineBasicMaterial({ color: 0x3ee8ff, transparent: true, opacity: .85, depthTest: false })
  );
  cage.renderOrder = 999;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(.9, .96, 48),
    new THREE.MeshBasicMaterial({ color: 0x3ee8ff, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  const ring2 = new THREE.Mesh(
    new THREE.RingGeometry(.62, .64, 48, 1, 0, Math.PI * 1.1),
    new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false })
  );
  ring2.rotation.x = -Math.PI / 2;
  marker.add(cage, ring, ring2);
  scene.add(marker);

  /* ───────── 后期：Bloom ───────── */
  let composer = null;
  if (THREE.EffectComposer && THREE.UnrealBloomPass) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .36, .58, .84);
    composer.addPass(bloom);
    composer.bloom = bloom;
    if (THREE.GammaCorrectionShader) composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (composer) composer.setSize(innerWidth, innerHeight);
  });

  /* ════════════════════════════════════════════════════════════
     高亮
     ════════════════════════════════════════════════════════════ */
  /* 高亮 = 在物体外侧套一层 8mm 的青色描边壳（BackSide + 加色混合）。
     不改原材质——改材质会把深色物件糊成一块平色，形体全丢。 */
  const SHELL_K = .008;
  const _gsz = new THREE.Vector3();
  function shellOf(d) {
    if (d._shell) return d._shell;
    const mat = new THREE.MeshBasicMaterial({
      color: 0x3ee8ff, side: THREE.BackSide, transparent: true, opacity: .5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const src = [];
    d.group.traverse(o => { if (o.isMesh && !o.userData.isShell) src.push(o); });
    const parts = [];
    src.forEach(o => {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      o.geometry.boundingBox.getSize(_gsz);
      const m = new THREE.Mesh(o.geometry, mat);
      m.userData.isShell = true;
      m.position.copy(o.position);
      m.rotation.copy(o.rotation);
      m.quaternion.copy(o.quaternion);
      m.scale.set(
        o.scale.x * (1 + 2 * SHELL_K / Math.max(_gsz.x, .004)),
        o.scale.y * (1 + 2 * SHELL_K / Math.max(_gsz.y, .004)),
        o.scale.z * (1 + 2 * SHELL_K / Math.max(_gsz.z, .004))
      );
      m.castShadow = m.receiveShadow = false;
      m.visible = false;
      o.parent.add(m);
      parts.push(m);
    });
    d._shell = { mat, parts };
    return d._shell;
  }
  function applyHL(d, on) {
    const s = shellOf(d);
    s.parts.forEach(m => { m.visible = on; });
    d._on = on;
  }
  function tickHL(d, t, strong) {
    const s = d._shell;
    if (!s) return;
    s.mat.opacity = strong ? .42 + (Math.sin(t * 3.4) * .5 + .5) * .34 : .26;
  }

  /* ════════════════════════════════════════════════════════════
     状态
     ════════════════════════════════════════════════════════════ */
  let hovered = null, selected = null;
  let explodeT = 0, explodeTarget = 0;
  const TG = { walls: true, labels: false, dims: false, explode: false, night: true };

  /* ════════════════════════════════════════════════════════════
     侧边硬件清单
     ════════════════════════════════════════════════════════════ */
  const listEl = $('#inv-list'), tabsEl = $('#inv-tabs');
  let curTab = 'all';
  const rowOf = {};

  DATA.ZONES.forEach(z => {
    const b = document.createElement('button');
    b.textContent = z.label;
    b.className = z.key === 'all' ? 'on' : '';
    b.onclick = () => {
      curTab = z.key;
      [...tabsEl.children].forEach(c => c.classList.toggle('on', c === b));
      renderList();
    };
    tabsEl.appendChild(b);
  });

  function renderList() {
    listEl.innerHTML = '';
    const groups = curTab === 'all' ? ['game', 'cinema', 'show'] : [curTab];
    let n = 0;
    groups.forEach(gk => {
      const items = DATA.DEV.filter(d => d.zone === gk);
      if (!items.length) return;
      const gl = document.createElement('li');
      gl.className = 'grp';
      gl.textContent = DATA.ZONE_OF[gk];
      listEl.appendChild(gl);
      items.forEach(meta => {
        n++;
        const li = document.createElement('li');
        li.className = 'it';
        const zc = (DATA.ZONES.find(z => z.key === gk) || {}).color || '#3ee8ff';
        li.innerHTML =
          `<span class="it-swatch" style="background:${zc};color:${zc}"></span>` +
          `<span class="it-txt"><span class="it-name"></span><span class="it-meta"></span></span>` +
          `<span class="it-num">${String(meta.idx).padStart(2, '0')}</span>`;
        li.querySelector('.it-name').textContent = meta.name;
        li.querySelector('.it-meta').textContent = meta.dims[0] + '×' + meta.dims[1] + '×' + meta.dims[2] + ' mm';
        li.onclick = () => select(meta.id, true);
        li.onmouseenter = () => setHover(find(meta.id), true);
        li.onmouseleave = () => setHover(null);
        listEl.appendChild(li);
        rowOf[meta.id] = li;
      });
    });
    $('#inv-count').textContent = n;
    syncList();
  }
  function syncList() {
    Object.entries(rowOf).forEach(([id, li]) => li.classList.toggle('sel', selected && selected.id === id));
  }
  const find = id => DEVS.find(d => d.id === id);
  renderList();

  /* ════════════════════════════════════════════════════════════
     射线拾取
     ════════════════════════════════════════════════════════════ */
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  const pickables = DEVS.map(d => d.group);
  const tip = $('#hovertip');
  let px = 0, py = 0, downAt = null;

  function pick(ev) {
    ptr.x = (ev.clientX / innerWidth) * 2 - 1;
    ptr.y = -(ev.clientY / innerHeight) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(pickables, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.devId) o = o.parent;
    return o ? find(o.userData.devId) : null;
  }
  function setHover(d, fromList) {
    if (hovered === d) return;
    if (hovered && hovered !== selected) applyHL(hovered, false);
    hovered = d;
    if (d && !fromList) {
      if (d !== selected) applyHL(d, true);
      $('#ht-name').textContent = d.meta.name;
      $('#ht-zone').textContent = DATA.ZONE_OF[d.meta.zone] + ' · ' + d.meta.dims.join(' × ') + ' mm';
      tip.classList.add('on');
      canvas.style.cursor = 'pointer';
    } else {
      if (d && d !== selected) applyHL(d, true);   // 清单悬停：只在 3D 里亮，不弹名牌
      tip.classList.remove('on');
      canvas.style.cursor = '';
    }
  }
  canvas.addEventListener('pointermove', ev => {
    px = ev.clientX; py = ev.clientY;
    tip.style.left = px + 'px'; tip.style.top = py + 'px';
    setHover(pick(ev));
  });
  canvas.addEventListener('pointerleave', () => setHover(null));
  canvas.addEventListener('pointerdown', ev => { downAt = { x: ev.clientX, y: ev.clientY }; stopAuto(); });
  canvas.addEventListener('pointerup', ev => {
    if (!downAt) return;
    const moved = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y);
    downAt = null;
    if (moved > 5) return;                  // 拖拽不算点击
    const d = pick(ev);
    d ? select(d.id, true) : deselect();
  });

  /* ════════════════════════════════════════════════════════════
     详情抽屉
     ════════════════════════════════════════════════════════════ */
  const panel = $('#detail');

  function miniPlan(d) {
    const S = 520, T = 376, k = 100;      // 1m = 100 单位；北在上，东在右
    const x = d.center.x * k, y = d.center.z * k;
    const w = Math.max(d.size.x * k, 10), h = Math.max(d.size.z * k, 10);
    return `<svg viewBox="0 0 ${S} ${T}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">
      <rect x="2" y="2" width="${S - 4}" height="${T - 4}" fill="none" stroke="rgba(120,190,215,.35)" stroke-width="2"/>
      <rect x="${3.4 * k}" y="2" width="${1.8 * k}" height="${.8 * k}" fill="rgba(62,232,255,.09)"/>
      <rect x="4" y="${.5 * k}" width="${3.0 * k}" height="${1.7 * k}" fill="rgba(255,79,216,.07)"/>
      <rect x="${.3 * k}" y="2" width="${1.6 * k}" height="${.42 * k}" fill="rgba(224,168,96,.09)"/>
      <text x="14" y="26" fill="rgba(120,160,185,.55)" font-size="19" font-family="monospace">北</text>
      <text x="14" y="${T - 12}" fill="rgba(120,160,185,.55)" font-size="19" font-family="monospace">南</text>
      <text x="${S - 36}" y="26" fill="rgba(120,160,185,.55)" font-size="19" font-family="monospace">东</text>
      <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}"
            fill="rgba(62,232,255,.85)" stroke="#fff" stroke-width="2"/>
      <circle cx="${x}" cy="${y}" r="${Math.max(w, h) / 2 + 16}" fill="none"
              stroke="rgba(62,232,255,.5)" stroke-width="2" stroke-dasharray="7 6"/>
    </svg>`;
  }

  function openDetail(d) {
    const m = d.meta;
    $('#dt-zone').textContent = DATA.ZONE_OF[m.zone];
    $('#dt-idx').textContent = '#' + String(m.idx).padStart(2, '0') + ' / ' + DATA.DEV.length;
    $('#dt-name').textContent = m.name;
    $('#dt-tag').textContent = m.tag;
    $('#dt-specs').innerHTML = m.specs
      .map(s => `<tr><td>${s[0]}</td><td>${s[1]}</td></tr>`).join('');
    $('#dt-dims').innerHTML = [['宽 W', m.dims[0]], ['深 D', m.dims[1]], ['高 H', m.dims[2]]]
      .map(a => `<div><span>${a[0]}</span><b>${a[1]}<em>mm</em></b></div>`).join('');
    $('#dt-mini').innerHTML = miniPlan(d);
    $('#dt-desc').textContent = m.desc;
    $('#dt-note').textContent = m.note;
    panel.classList.remove('closed');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('detail-open');
    // 重放入场动画
    const inner = panel.querySelector('.dt-inner');
    inner.style.animation = 'none'; void inner.offsetWidth; inner.style.animation = '';
    [...inner.children].forEach(c => { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; });
    inner.scrollTop = 0;
  }
  function closeDetail() {
    panel.classList.add('closed');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('detail-open');
  }
  $('#dt-close').onclick = () => deselect();

  /* ════════════════════════════════════════════════════════════
     选中 / 取消
     ════════════════════════════════════════════════════════════ */
  function select(id, fly) {
    const d = find(id);
    if (!d) return;
    if (selected && selected !== d) applyHL(selected, false);
    selected = d;
    applyHL(d, true);
    marker.visible = true;
    openDetail(d);
    syncList();
    const row = rowOf[id];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (fly) flyTo(d);
    stopAuto();
  }
  function deselect() {
    if (selected) applyHL(selected, false);
    selected = null;
    marker.visible = false;
    closeDetail();
    syncList();
  }

  /* ════════════════════════════════════════════════════════════
     相机
     ════════════════════════════════════════════════════════════ */
  let camAnim = null;
  function animateTo(camPos, tgtPos, dur) {
    camAnim = {
      t0: performance.now(), dur: (dur || .95) * 1000,
      c0: camera.position.clone(), c1: camPos.clone(),
      t0p: controls.target.clone(), t1p: tgtPos.clone(),
    };
  }
  function stepCam() {
    if (!camAnim) return;
    const p = Math.min((performance.now() - camAnim.t0) / camAnim.dur, 1);
    const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    camera.position.lerpVectors(camAnim.c0, camAnim.c1, e);
    controls.target.lerpVectors(camAnim.t0p, camAnim.t1p, e);
    if (p >= 1) camAnim = null;
  }

  /* 世界坐标：x 0→5.2 西→东 | z 0→3.76 北→南 */
  const VIEWS = {
    orbit:  { c: [3.20, 6.00, 9.60], t: [2.65, 1.00, 1.85], fov: 36 },
    desk:   { c: [3.18, 1.62, 1.64], t: [4.55, 1.12, 0.18], fov: 52 },
    cinema: { c: [3.98, 1.50, 1.42], t: [0.55, 1.02, 1.36], fov: 56 },
    shelf:  { c: [2.15, 1.58, 2.72], t: [1.25, 1.02, 0.32], fov: 50 },
    door:   { c: [4.30, 1.66, 3.30], t: [1.55, 1.15, 1.04], fov: 58 },
  };
  function gotoView(name) {
    const v = VIEWS[name];
    if (!v) return;
    stopAuto();
    deselect();
    document.querySelectorAll('.vbtn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    camera.fov = v.fov; camera.updateProjectionMatrix();
    animateTo(new THREE.Vector3(...v.c), new THREE.Vector3(...v.t), 1.05);
  }
  document.querySelectorAll('.vbtn').forEach(b => b.onclick = () => gotoView(b.dataset.view));

  function flyTo(d) {
    document.querySelectorAll('.vbtn').forEach(b => b.classList.remove('active'));
    const c = d.center;
    const out = new THREE.Vector3(ROOM.CX - c.x, 0, ROOM.CZ - c.z);
    if (out.lengthSq() < .02) out.set(.6, 0, .8);
    out.normalize();
    const dist = Math.min(Math.max(d.radius * 3.1, 1.05), 3.4);
    const pos = new THREE.Vector3(
      c.x + out.x * dist, c.y + Math.max(d.radius * .9, .45), c.z + out.z * dist
    );
    // 夹在房间内，别穿墙
    pos.x = Math.min(Math.max(pos.x, .42), ROOM.W - .42);
    pos.z = Math.min(Math.max(pos.z, .42), ROOM.D - .42);
    pos.y = Math.min(Math.max(pos.y, .5), ROOM.H - .25);
    camera.fov = 48; camera.updateProjectionMatrix();
    animateTo(pos, c, .85);
  }

  function stopAuto() {
    if (controls.autoRotate) { controls.autoRotate = false; $('#guide').classList.add('fade'); }
  }

  /* ════════════════════════════════════════════════════════════
     开关
     ════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.tbtn').forEach(b => {
    b.onclick = () => toggle(b.dataset.tg);
  });
  function toggle(k, force) {
    TG[k] = force === undefined ? !TG[k] : force;
    const btn = document.querySelector(`.tbtn[data-tg="${k}"]`);
    if (btn) btn.classList.toggle('on', TG[k]);
    if (k === 'night') ROOM.setNight(TG.night);
    if (k === 'labels') pins.forEach(p => p.el.style.display = TG.labels ? '' : 'none');
    if (k === 'dims') { dimGroup.visible = TG.dims; dimLabels.forEach(l => l.el.style.display = TG.dims ? '' : 'none'); }
    if (k === 'explode') {
      explodeTarget = TG.explode ? 1 : 0;
      if (TG.explode && TG.walls) { toggle('walls', false); wallsAuto = true; }
      else if (!TG.explode && wallsAuto) { toggle('walls', true); wallsAuto = false; }
    }
  }
  let wallsAuto = false;

  /* ════════════════════════════════════════════════════════════
     3D 标注（HTML 投影）
     ════════════════════════════════════════════════════════════ */
  const pinLayer = $('#pins');
  const pins = DEVS.map(d => {
    const el = document.createElement('div');
    el.className = 'pin';
    el.innerHTML = `<span class="pin-line"></span><span class="pin-dot"></span>
      <span class="pin-txt">${d.meta.name}<em>${String(d.meta.idx).padStart(2, '0')}</em></span>`;
    el.style.display = 'none';
    pinLayer.appendChild(el);
    return { d, el };
  });

  /* ───────── 尺寸标注 ───────── */
  const dimGroup = new THREE.Group();
  dimGroup.visible = false;
  scene.add(dimGroup);
  const dimLabels = [];
  const dimMat = new THREE.LineBasicMaterial({ color: 0xe0a860, transparent: true, opacity: .85 });
  function dimLine(a, b, text) {
    const g = new THREE.BufferGeometry().setFromPoints([a, b]);
    dimGroup.add(new THREE.Line(g, dimMat));
    const tick = .07;
    [a, b].forEach(p => {
      const d1 = new THREE.Vector3().subVectors(b, a).normalize();
      const up = Math.abs(d1.y) > .8 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(d1, up).normalize().multiplyScalar(tick);
      const g2 = new THREE.BufferGeometry().setFromPoints([
        p.clone().sub(side), p.clone().add(side)]);
      dimGroup.add(new THREE.Line(g2, dimMat));
    });
    const el = document.createElement('div');
    el.className = 'dim';
    el.textContent = text;
    el.style.display = 'none';
    pinLayer.appendChild(el);
    dimLabels.push({ el, pos: new THREE.Vector3().addVectors(a, b).multiplyScalar(.5) });
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  dimLine(V(0, .02, ROOM.D + .22), V(ROOM.W, .02, ROOM.D + .22), '5200 mm');
  dimLine(V(-.22, .02, 0), V(-.22, .02, ROOM.D), '3760 mm');
  dimLine(V(-.22, 0, ROOM.D + .22), V(-.22, ROOM.H, ROOM.D + .22), '2900 mm');
  dimLine(V(3.4, .02, -.22), V(5.2, .02, -.22), '桌 1800');
  dimLine(V(.12, .55, 1.36), V(2.68, .55, 1.36), '视距 2560');
  dimLine(V(ROOM.W + .22, 1.0, 2.66), V(ROOM.W + .22, 2.2, 2.66), '窗 1200');

  /* ════════════════════════════════════════════════════════════
     键盘
     ════════════════════════════════════════════════════════════ */
  const VORDER = ['orbit', 'desk', 'cinema', 'shelf', 'door'];
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (/^[1-5]$/.test(e.key)) gotoView(VORDER[+e.key - 1]);
    else if (e.key === 'Escape') deselect();
    else if (e.key.toLowerCase() === 'l') toggle('labels');
    else if (e.key.toLowerCase() === 'd') toggle('dims');
    else if (e.key.toLowerCase() === 'x') toggle('explode');
    else if (e.key.toLowerCase() === 'n') toggle('night');
    else if (e.key.toLowerCase() === 'w') toggle('walls');
  });

  /* ════════════════════════════════════════════════════════════
     渲染循环
     ════════════════════════════════════════════════════════════ */
  const cRot = $('#c-rot');
  const fpsEl = $('#fps');
  const tmp = new THREE.Vector3();
  const pinBox = new THREE.Box3(), pinV = new THREE.Vector3();
  let t = 0, last = performance.now(), fAcc = 0, fCnt = 0, inspK = 0;

  function project(v) {
    tmp.copy(v).project(camera);
    return {
      x: (tmp.x * .5 + .5) * innerWidth,
      y: (-tmp.y * .5 + .5) * innerHeight,
      vis: tmp.z < 1,
    };
  }

  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, .05);
    last = now; t += dt;

    stepCam();
    controls.update();
    ROOM.anim(t);

    /* 墙体自动淡出：相机在哪一侧，哪面墙就让开 */
    WALLS.forEach(w => {
      let target = 1;
      if (!TG.walls) target = 0;
      else {
        const side = tmp.copy(camera.position).sub(w.ref).dot(w.normal);
        target = side > .25 ? 0 : 1;       // 相机在墙外 → 淡出
      }
      w.opacity += (target - w.opacity) * Math.min(dt * 7, 1);
      w.mat.opacity = w.opacity;
      w.mesh.visible = w.opacity > .02;
      if (w.att) w.att.visible = w.opacity > .35;   // 门窗木作随墙一起让开
    });

    /* 剖面检视补光：相机退到房间外时淡入 */
    const c0 = camera.position;
    const outside = c0.y > ROOM.H - .1 || c0.x < -.1 || c0.x > ROOM.W + .1 || c0.z < -.1 || c0.z > ROOM.D + .1;
    const want = outside ? 1 : 0;
    inspK += (want - inspK) * Math.min(dt * 2.6, 1);
    built.lights.insp.intensity = inspK * .58;
    built.lights.insp2.intensity = inspK * .32;
    built.ceiling.visible = inspK < .5;        // 剖视时掀掉天花与吊顶沿

    /* 拆解动画 */
    explodeT += (explodeTarget - explodeT) * Math.min(dt * 3.4, 1);
    if (Math.abs(explodeT - explodeTarget) > .0005 || explodeT > .0005) {
      DEVS.forEach((d, i) => {
        const b = d.group.userData.base;
        const k = explodeT * (.45 + (i % 5) * .055);
        d.group.position.set(
          b.x + d.explodeDir.x * k * 1.9,
          b.y + k * (.25 + (d.center.y / ROOM.H) * .9),
          b.z + d.explodeDir.z * k * 1.9
        );
      });
    }

    /* 高亮脉冲 */
    if (hovered && hovered !== selected) tickHL(hovered, t, false);
    if (selected) {
      tickHL(selected, t, true);
      const g = selected.group;
      const bb = new THREE.Box3().setFromObject(g);
      const c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
      cage.position.copy(c);
      cage.scale.set(Math.max(s.x, .06) * 1.1, Math.max(s.y, .06) * 1.1, Math.max(s.z, .06) * 1.1);
      cage.material.opacity = .55 + Math.sin(t * 3.4) * .25;
      const r = Math.max(s.x, s.z) * .72 + .16;
      ring.position.set(c.x, .012, c.z); ring.scale.setScalar(r);
      ring2.position.set(c.x, .016, c.z); ring2.scale.setScalar(r * 1.22);
      ring2.rotation.z = t * .7;
      ring.material.opacity = .28 + Math.sin(t * 2.2) * .14;
    }

    /* 尘埃 */
    const dp = dust.pos;
    for (let i = 0; i < dust.N; i++) {
      dp[i * 3] += dust.spd[i][0];
      dp[i * 3 + 1] += dust.spd[i][1];
      dp[i * 3 + 2] += dust.spd[i][2];
      if (dp[i * 3 + 1] > ROOM.H) { dp[i * 3 + 1] = 0; dp[i * 3] = Math.random() * ROOM.W; dp[i * 3 + 2] = Math.random() * ROOM.D; }
    }
    dust.p.geometry.attributes.position.needsUpdate = true;

    /* 标注投影 */
    if (TG.labels) {
      pins.forEach(p => {
        pinBox.setFromObject(p.d.group);
        pinBox.getCenter(pinV); pinV.y = pinBox.max.y + .04;
        const s = project(pinV);
        if (!s.vis) { p.el.style.opacity = 0; return; }
        p.el.style.opacity = 1;
        p.el.style.transform = `translate(${s.x}px,${s.y}px)`;
      });
    }
    if (TG.dims) {
      dimLabels.forEach(l => {
        if (!l.el.textContent) return;
        const s = project(l.pos);
        l.el.style.opacity = s.vis ? 1 : 0;
        l.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%)`;
      });
    }

    /* 指北针（北 = 世界 -z） */
    const off = tmp.copy(camera.position).sub(controls.target);
    cRot.setAttribute('transform', `rotate(${Math.atan2(off.x, off.z) * 180 / Math.PI} 32 32)`);

    composer ? composer.render() : renderer.render(scene, camera);

    fAcc += dt; fCnt++;
    if (fAcc > .5) { fpsEl.textContent = Math.round(fCnt / fAcc) + ' FPS'; fAcc = 0; fCnt = 0; }
  }

  /* ════════════════════════════════════════════════════════════
     启动
     ════════════════════════════════════════════════════════════ */
  $('#boot-log').textContent = '编译材质 · 点亮灯光…';
  loop();
  setTimeout(() => {
    $('#boot').classList.add('done');
    document.body.classList.add('ready');
    camera.fov = VIEWS.orbit.fov; camera.updateProjectionMatrix();
    animateTo(new THREE.Vector3(...VIEWS.orbit.c), new THREE.Vector3(...VIEWS.orbit.t), 2.2);
  }, 1500);
  setTimeout(() => { if (controls.autoRotate) $('#guide').classList.remove('fade'); }, 4000);
})();
