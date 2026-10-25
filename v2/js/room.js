/* ══════════════════════════════════════════════════════════════
   room.js — 全部场景几何体（纯代码生成，零外部模型）
   坐标：x 0→5.2 (西→东) | y 0→2.9 (地→顶) | z 0→3.76 (南→北)
   ══════════════════════════════════════════════════════════════ */
window.ROOM = (() => {
  'use strict';

  const W = 5.2, D = 3.76, H = 2.9;      // 房间净尺寸(m)
  const CX = W / 2, CZ = D / 2;

  /* ───────── 基础工具 ───────── */
  const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(BOX(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function cyl(rt, rb, h, mat, x, y, z, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function plane(w, h, mat) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.receiveShadow = true;
    return m;
  }
  function std(o) {
    return new THREE.MeshStandardMaterial({
      color: o.c !== undefined ? o.c : 0xffffff,
      map: o.map || null,
      roughness: o.r !== undefined ? o.r : .62,
      metalness: o.m !== undefined ? o.m : 0,
      emissive: o.e !== undefined ? o.e : 0x000000,
      emissiveIntensity: o.ei !== undefined ? o.ei : 1,
      emissiveMap: o.emap || null,
      transparent: !!o.t,
      opacity: o.o !== undefined ? o.o : 1,
      side: o.side || THREE.FrontSide,
      depthWrite: o.dw === undefined ? true : o.dw,
    });
  }
  function wallMesh(w, h, holes, th, mat) {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, h); s.lineTo(0, h); s.closePath();
    (holes || []).forEach(([x0, y0, x1, y1]) => {
      const p = new THREE.Path();
      p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath();
      s.holes.push(p);
    });
    const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false });
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = true;
    return m;
  }

  /* ───────── 材质库 ───────── */
  let M = null, TX = null;
  function buildMaterials() {
    const floorT = TEX.woodFloor();
    const wallT = TEX.wall('#343b45'); wallT.repeat.set(.42, .42);
    const honeyT = TEX.honeyWood();
    const walnutT = TEX.walnut();
    TX = {
      game: TEX.screenGame(), code: TEX.screenCode(), tv: TEX.screenTV(),
      cityN: TEX.cityView(true), cityD: TEX.cityView(false),
      neon: TEX.neonSign(), mat: TEX.deskMat(), keys: TEX.keycaps(),
      door: TEX.doorPanel(),
    };
    M = {
      floor: std({ map: floorT, r: .52, c: 0xcfcfcf }),
      wall: std({ map: wallT, r: .95, c: 0x7f868f, t: true, o: 1, side: THREE.DoubleSide }),
      ceil: std({ c: 0x20252c, r: .98 }),
      honey: std({ map: honeyT, r: .55, c: 0xffffff }),
      honeyD: std({ map: honeyT, r: .6, c: 0xb8b0a4 }),
      door: std({ map: TX.door, r: .5 }),
      walnut: std({ map: walnutT, r: .48 }),
      walnutL: std({ map: walnutT, r: .42, c: 0xd8d8d8 }),
      black: std({ c: 0x101318, r: .55 }),
      blackM: std({ c: 0x0a0c10, r: .32, m: .55 }),
      alu: std({ c: 0x8d96a3, r: .3, m: .85 }),
      steel: std({ c: 0x2a3038, r: .35, m: .8 }),
      plastic: std({ c: 0x1b1f26, r: .7 }),
      glass: std({ c: 0xa8d8ff, r: .06, m: .2, t: true, o: .13, side: THREE.DoubleSide, dw: false }),
      screenOff: std({ c: 0x07090d, r: .25 }),
      leatherB: std({ map: TEX.leather('#1d2128'), r: .6 }),
      fabricD: std({ map: TEX.fabric('#2a2f37'), r: .92 }),
      rug: std({ map: TEX.fabric('#3b4047', 3), r: .99 }),
      curtain: std({ map: TEX.fabric('#333942', 6), r: .95, side: THREE.DoubleSide }),
      pillow: std({ map: TEX.fabric('#2d3a44', 3), r: .9 }),
      mat: std({ map: TX.mat, r: .92 }),
      vine: std({ c: 0x2f4a2a, r: .85 }),
      red: std({ c: 0x8e1220, r: .6 }),
      gold: std({ c: 0xc79a3c, r: .3, m: .7 }),
      warmBulb: std({ c: 0xfff1dc, e: 0xffd9a0, ei: 1.15, r: .2, t: true, o: .92 }),
      ledWarm: std({ c: 0xffc98a, e: 0xff9d45, ei: 1.7, r: .4 }),
      ledCyan: std({ c: 0x9ff4ff, e: 0x2fd8f5, ei: 2.3, r: .4 }),
      ledMag: std({ c: 0xffb4ec, e: 0xff2fc0, ei: 2.3, r: .4 }),
      neon: std({ map: TX.neon, e: 0xffffff, emap: TX.neon, ei: 2.2, t: true, o: .96, side: THREE.DoubleSide, dw: false }),
      sky: std({ map: TX.cityN, e: 0xffffff, emap: TX.cityN, ei: .62, side: THREE.DoubleSide }),
    };
  }

  /* ───────── 设备注册 ───────── */
  const devices = [];
  function reg(id, group) {
    const meta = DATA.MAP[id];
    if (!meta) { console.warn('未定义设备', id); return group; }
    group.name = id;
    group.userData.devId = id;
    const bb = new THREE.Box3().setFromObject(group);
    const ctr = new THREE.Vector3(), size = new THREE.Vector3();
    bb.getCenter(ctr); bb.getSize(size);
    devices.push({
      id, meta, group,
      center: ctr.clone(),
      size: size.clone(),
      top: new THREE.Vector3(ctr.x, bb.max.y, ctr.z),
      base: group.position.clone(),
      radius: Math.max(size.x, size.y, size.z) * .5,
    });
    return group;
  }
  const G = () => new THREE.Group();

  /* ════════════════════════════════════════════════════════════
     建筑本体
     ════════════════════════════════════════════════════════════ */
  const walls = [];
  let ATT = null;                       // 各墙的附属木作（随墙一起淡出）
  let ceilGroup = null;
  function buildShell(root) {
    ATT = { south: G(), north: G(), west: G(), east: G() };
    Object.values(ATT).forEach(g => root.add(g));

    /* 地板 */
    const fl = plane(W, D, M.floor);
    fl.rotation.x = -Math.PI / 2;
    fl.position.set(CX, 0, CZ);
    root.add(fl);

    /* 地板下的"基座"，让房间像一块悬浮模型 */
    const plinth = box(W + .24, .16, D + .24, std({ c: 0x0c1016, r: .6, m: .3 }), CX, -.09, CZ);
    root.add(plinth);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(BOX(W + .24, .16, D + .24)),
      new THREE.LineBasicMaterial({ color: 0x2fd8f5, transparent: true, opacity: .5 })
    );
    edge.position.set(CX, -.09, CZ);
    root.add(edge);

    /* 天花 */
    const ceil = G();
    ceilGroup = ceil;
    const cp = plane(W, D, M.ceil);
    cp.rotation.x = Math.PI / 2; cp.position.set(CX, H, CZ);
    ceil.add(cp);
    // 二级吊顶沿
    const rimM = std({ c: 0x191d23, r: .95 });
    [[W - .5, .1, .22, CX, H - .05, .26], [W - .5, .1, .22, CX, H - .05, D - .26],
     [.22, .1, D - .9, .26, H - .05, CZ], [.22, .1, D - .9, W - .26, H - .05, CZ]]
      .forEach(a => ceil.add(box(a[0], a[1], a[2], rimM, a[3], a[4], a[5])));
    root.add(ceil);

    /* 四面墙（带门窗洞），材质各自独立以便单独淡出 */
    const mk = (base) => { const m = base.clone(); m.transparent = true; return m; };
    const defs = [
      { k: 'south', w: W, holes: [[3.85, 0, 4.85, 2.0]], rot: 0, pos: [0, 0, -.1], n: [0, 0, -1] },
      { k: 'north', w: W, holes: [], rot: 0, pos: [0, 0, D], n: [0, 0, 1] },
      { k: 'west', w: D, holes: [[2.41, 0, 3.41, 2.0]], rot: Math.PI / 2, pos: [-.1, 0, D], n: [-1, 0, 0] },
      { k: 'east', w: D, holes: [[1.1, 1.0, 2.9, 2.2]], rot: -Math.PI / 2, pos: [W + .1, 0, 0], n: [1, 0, 0] },
    ];
    defs.forEach(d => {
      const mat = mk(M.wall);
      const m = wallMesh(d.w, H, d.holes, .1, mat);
      m.rotation.y = d.rot;
      m.position.set(d.pos[0], d.pos[1], d.pos[2]);
      m.userData.isWall = true;
      root.add(m);
      const nv = new THREE.Vector3(...d.n);
      walls.push({ mesh: m, mat, normal: nv, key: d.k, opacity: 1, att: ATT[d.k] });
    });

    /* 踢脚线 + 顶角线（归属各自的墙） */
    const sk = M.honeyD;
    ATT.south.add(box(W, .09, .022, sk, CX, .045, .011));
    ATT.north.add(box(W, .09, .022, sk, CX, .045, D - .011));
    ATT.west.add(box(.022, .09, D, sk, .011, .045, CZ));
    ATT.east.add(box(.022, .09, D, sk, W - .011, .045, CZ));
    ATT.south.add(box(W, .055, .055, M.honeyD, CX, H - .03, .028));
    ATT.north.add(box(W, .055, .055, M.honeyD, CX, H - .03, D - .028));
    ATT.west.add(box(.055, .055, D, M.honeyD, .028, H - .03, CZ));
    ATT.east.add(box(.055, .055, D, M.honeyD, W - .028, H - .03, CZ));
  }

  /* 格栅：在 yz / xy 平面生成细木条 */
  function grille(len, hgt, step, thick, plane2, mat) {
    const g = G();
    const n = Math.max(2, Math.floor(len / step));
    for (let i = 0; i <= n; i++) {
      const p = -len / 2 + (i / n) * len;
      const b = plane2 === 'yz'
        ? box(thick, hgt, thick, mat, 0, 0, p)
        : box(thick, hgt, thick, mat, p, 0, 0);
      b.castShadow = false;
      g.add(b);
    }
    // 上下横档
    const rail = plane2 === 'yz' ? box(thick * 1.3, thick * 1.6, len, mat) : box(len, thick * 1.6, thick * 1.3, mat);
    const r1 = rail.clone(); r1.position.y = hgt / 2 - thick * .8;
    const r2 = rail.clone(); r2.position.y = -hgt / 2 + thick * .8;
    g.add(r1, r2);
    return g;
  }

  /* 假藤蔓 */
  function vines(len, axis) {
    const g = G();
    const leafG = new THREE.SphereGeometry(.035, 6, 5);
    for (let i = 0; i < Math.floor(len * 22); i++) {
      const t = Math.random() * len - len / 2;
      const m = new THREE.Mesh(leafG, M.vine);
      m.scale.set(1 + Math.random(), .5, .6 + Math.random() * .5);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      const drop = -Math.random() * .26;
      if (axis === 'z') m.position.set((Math.random() - .5) * .08, drop, t);
      else m.position.set(t, drop, (Math.random() - .5) * .08);
      m.castShadow = false;
      g.add(m);
    }
    return g;
  }

  /* 门窗与中式木作 */
  function buildOpenings(root) {
    /* —— 南门（东南角，挂中国结） —— */
    const sd = G();
    const dw = 1.0, dh = 2.0, dx = 4.35;
    sd.add(box(dw, dh, .045, M.door, dx, dh / 2, .03));                      // 门扇
    [[dw + .16, .09, .12, dx, dh + .045, .055],                              // 门套上
     [.08, dh + .09, .12, dx - dw / 2 - .04, dh / 2, .055],
     [.08, dh + .09, .12, dx + dw / 2 + .04, dh / 2, .055]]
      .forEach(a => sd.add(box(a[0], a[1], a[2], M.honey, a[3], a[4], a[5])));
    const knob = cyl(.028, .028, .11, M.blackM, dx + dw / 2 - .1, 1.05, .085, 12);
    knob.rotation.x = Math.PI / 2; sd.add(knob);
    // 门楣格栅（门上到顶）
    const lint = grille(dw + .16, H - dh - .14, .085, .028, 'xy', M.honey);
    lint.position.set(dx, dh + .09 + (H - dh - .14) / 2, .05);
    sd.add(lint);
    // 门西侧通顶格栅板
    const sideG = grille(.52, H - .1, .09, .03, 'xy', M.honey);
    sideG.position.set(dx - dw / 2 - .38, H / 2 - .05, .05);
    sd.add(sideG);
    sd.add(box(.56, .06, .1, M.honey, dx - dw / 2 - .38, H - .07, .05));
    // 中国结
    const cn = G();
    cn.add(box(.17, .17, .025, M.red, 0, 0, 0));
    const k2 = box(.12, .12, .028, M.red, 0, 0, .004); k2.rotation.z = Math.PI / 4; cn.add(k2);
    cn.add(cyl(.016, .016, .05, M.gold, 0, .115, 0, 10));
    for (let i = -2; i <= 2; i++) cn.add(box(.012, .3, .012, M.red, i * .032, -.23, 0));
    cn.add(box(.14, .035, .02, M.gold, 0, -.09, .006));
    cn.position.set(dx - dw / 2 - .38, 1.62, .1);
    sd.add(cn);
    ATT.south.add(sd);

    /* —— 西门（西南角 → 卫生间过道） —— */
    const wd = G();
    const wz = .85;
    const wdoor = box(.045, 2.0, 1.0, M.door, .03, 1.0, wz); wd.add(wdoor);
    [[.12, .09, 1.16, .055, 2.045, wz],
     [.12, 2.09, .08, .055, 1.0, wz - .54],
     [.12, 2.09, .08, .055, 1.0, wz + .54]]
      .forEach(a => wd.add(box(a[0], a[1], a[2], M.honey, a[3], a[4], a[5])));
    const wl = grille(1.16, H - 2.14, .085, .028, 'yz', M.honey);
    wl.position.set(.05, 2.09 + (H - 2.14) / 2, wz);
    wd.add(wl);
    // 门南侧窄格栅板（挂球拍）
    const wsg = grille(.42, H - .1, .09, .03, 'yz', M.honey);
    wsg.position.set(.05, H / 2 - .05, wz - .5 - .28);
    wd.add(wsg);
    // 球拍
    const rk = G();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.13, .012, 8, 24), M.blackM);
    rk.add(ring);
    rk.add(box(.025, .3, .025, M.walnut, 0, -.26, 0));
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(.12, 20),
      std({ c: 0xdde3ea, t: true, o: .22, side: THREE.DoubleSide }));
    rk.add(mesh);
    rk.rotation.y = Math.PI / 2;
    rk.position.set(.1, 1.7, wz - .78);
    wd.add(rk);
    ATT.west.add(wd);

    /* —— 东墙推拉窗 + 窗台 + 窗外城市 —— */
    const win = G();
    const fr = M.alu;
    const z0 = 1.1, z1 = 2.9, y0 = 1.0, y1 = 2.2;
    const wz2 = (z0 + z1) / 2, wy = (y0 + y1) / 2;
    win.add(box(.06, .05, z1 - z0 + .06, fr, W - .02, y0, wz2));
    win.add(box(.06, .05, z1 - z0 + .06, fr, W - .02, y1, wz2));
    win.add(box(.06, y1 - y0, .05, fr, W - .02, wy, z0));
    win.add(box(.06, y1 - y0, .05, fr, W - .02, wy, z1));
    win.add(box(.05, y1 - y0, .04, fr, W - .025, wy, wz2 + .02));   // 中梃
    // 玻璃
    const gl = plane(z1 - z0, y1 - y0, M.glass);
    gl.rotation.y = -Math.PI / 2; gl.position.set(W - .03, wy, wz2);
    win.add(gl);
    // 窗台
    win.add(box(.2, .05, z1 - z0 + .18, M.honey, W - .08, y0 - .03, wz2));
    // 窗井：五面封闭的浅盒，只朝房间一侧开口。
    // 这样室内透窗能看见城市，而从外部剖视时不会有一块大贴图板横在空中。
    const wellM = std({ c: 0x080b10, r: .95, side: THREE.DoubleSide });
    const wd2 = 1.25, wh = 2.1, wwz = 2.6, wx0 = W;
    win.add(box(wd2, .04, wwz, wellM, wx0 + wd2 / 2, y0 - .32, wz2));          // 底
    win.add(box(wd2, .04, wwz, wellM, wx0 + wd2 / 2, y0 - .32 + wh, wz2));     // 顶
    win.add(box(wd2, wh, .04, wellM, wx0 + wd2 / 2, y0 - .32 + wh / 2, wz2 - wwz / 2));
    win.add(box(wd2, wh, .04, wellM, wx0 + wd2 / 2, y0 - .32 + wh / 2, wz2 + wwz / 2));
    const sky = plane(wwz - .08, wh - .08, M.sky);
    sky.rotation.y = -Math.PI / 2;
    sky.position.set(wx0 + wd2 - .03, y0 - .32 + wh / 2, wz2);
    win.add(sky);
    ATT.east.add(win);

    /* —— 东墙通长挂落 + 假藤蔓 —— */
    const lat = G();
    const eg = grille(D - .1, .44, .095, .032, 'yz', M.honey);
    eg.position.set(W - .07, H - .28, CZ);
    lat.add(eg);
    lat.add(box(.14, .07, D - .06, M.honey, W - .07, H - .5, CZ));
    const v = vines(D - .3, 'z'); v.position.set(W - .13, H - .52, CZ); lat.add(v);
    reg('lattice', lat);
    ATT.east.add(lat);

    /* —— 南墙海报 —— */
    [[1.15, TEX.poster(0)], [2.15, TEX.poster(1)]].forEach(([px, pt]) => {
      ATT.south.add(box(.6, .83, .025, M.blackM, px, 1.62, .025));
      const pm = plane(.56, .79, std({ map: pt, r: .85, e: 0xffffff, emap: pt, ei: .09 }));
      pm.position.set(px, 1.62, .04);
      ATT.south.add(pm);
    });
  }

  /* ════════════════════════════════════════════════════════════
     电竞区（东北）
     ════════════════════════════════════════════════════════════ */
  const DESK_X = 4.3, DESK_Z = D - .4, DESK_TOP = .80;

  function buildGame(root) {
    /* —— 桌 —— */
    const desk = G();
    desk.add(box(1.8, .04, .8, M.walnutL, 0, DESK_TOP - .02, 0));
    desk.add(box(1.76, .02, .76, std({ c: 0x1a120c, r: .8 }), 0, DESK_TOP - .05, 0));
    const legM = M.steel;
    [[-.84, -.34], [-.84, .34], [.84, -.34], [.84, .34]].forEach(([lx, lz]) => {
      desk.add(box(.055, DESK_TOP - .04, .055, legM, lx, (DESK_TOP - .04) / 2, lz));
    });
    desk.add(box(1.68, .05, .05, legM, 0, .09, -.3));
    desk.add(box(1.68, .05, .05, legM, 0, .09, .3));
    desk.add(box(1.6, .1, .22, std({ c: 0x14181e, r: .8 }), 0, .62, .3));   // 理线槽
    desk.position.set(DESK_X, 0, DESK_Z);
    reg('desk', desk); root.add(desk);

    /* —— 桌垫 —— */
    const padM = plane(.9, .4, M.mat);
    padM.rotation.x = -Math.PI / 2;
    padM.position.set(DESK_X + .05, DESK_TOP + .003, DESK_Z - .25);
    root.add(padM);

    /* —— 显示器支臂 —— */
    const armM = M.blackM;
    const pole = G();
    pole.add(box(.08, .04, .1, armM, 0, DESK_TOP + .02, 0));
    pole.add(cyl(.019, .019, .62, armM, 0, DESK_TOP + .33, 0, 14));
    pole.position.set(DESK_X + .02, 0, DESK_Z + .35);
    root.add(pole);

    /* —— 主屏（屏面朝南，正对座位） —— */
    const mm = G();
    const sw = .614, sh = .345;
    mm.add(box(sw + .018, sh + .018, .022, M.blackM, 0, 0, 0));
    const scr = plane(sw, sh, std({ map: TX.game.tex, e: 0xffffff, emap: TX.game.tex, ei: 1.15, r: .3 }));
    scr.rotation.y = Math.PI; scr.position.z = -.013; mm.add(scr);
    mm.add(box(.1, .05, .05, armM, 0, 0, .04));
    mm.add(box(.34, .02, .018, M.ledCyan, 0, -sh / 2 - .02, -.004));   // 下沿氛围条
    mm.position.set(DESK_X + .02, 1.22, DESK_Z + .3);
    mm.rotation.y = .04;
    reg('mon-main', mm); root.add(mm);

    /* —— 竖屏副屏（内倾朝向座位） —— */
    const sm = G();
    sm.add(box(.368 + .018, .614 + .018, .022, M.blackM, 0, 0, 0));
    const scr2 = plane(.368, .614, std({ map: TX.code.tex, e: 0xffffff, emap: TX.code.tex, ei: 1.0, r: .3 }));
    scr2.rotation.y = Math.PI; scr2.position.z = -.013; sm.add(scr2);
    sm.add(box(.09, .05, .05, armM, 0, 0, .04));
    sm.position.set(DESK_X + .62, 1.28, DESK_Z + .16);
    sm.rotation.y = .52;
    reg('mon-sub', sm); root.add(sm);
    // 副屏支臂横杆
    const arm2 = box(.5, .03, .03, armM, DESK_X + .33, 1.38, DESK_Z + .33);
    arm2.rotation.y = .26; root.add(arm2);

    /* —— 屏幕挂灯（卡在主屏上沿，光打向南侧桌面） —— */
    const sb = G();
    sb.add(box(.45, .03, .055, M.alu, 0, 0, 0));
    sb.add(box(.42, .012, .03, M.ledWarm, 0, -.018, -.01));
    sb.add(box(.07, .05, .09, M.blackM, 0, -.03, .045));
    sb.position.set(DESK_X + .02, 1.415, DESK_Z + .27);
    reg('screenbar', sb); root.add(sb);

    /* —— 主机（桌面左端，西面侧透开窗） —— */
    const pc = G();
    const pw = .23, ph = .48, pd = .46;
    const caseM = M.black, caseM2 = std({ c: 0x15181d, r: .6 });
    // 机箱用缺西面的板件拼装，内部件才真的看得见（实心盒子不可能"侧透"）
    pc.add(box(.012, ph, pd, caseM, pw / 2 - .006, ph / 2, 0));               // 东侧板
    pc.add(box(pw, .012, pd, caseM, 0, ph - .006, 0));                         // 顶板
    pc.add(box(pw, .014, pd, caseM, 0, .007, 0));                              // 底板
    pc.add(box(pw, ph, .012, caseM, 0, ph / 2, pd / 2 - .006));                // 背板
    pc.add(box(pw, ph, .014, caseM2, 0, ph / 2, -pd / 2 + .007));              // 前面板
    pc.add(box(pw - .05, ph - .08, .004, std({ c: 0x0a0c10, r: .95 }), 0, ph / 2, -pd / 2 + .0));
    pc.add(box(.03, .004, .03, M.ledCyan, pw / 2 - .05, .035, -pd / 2 - .002));
    // 侧透玻璃（西面）
    const side = plane(pd - .03, ph - .04, std({ c: 0xa8d8ff, r: .05, m: .2, t: true, o: .14, side: THREE.DoubleSide, dw: false }));
    side.rotation.y = -Math.PI / 2; side.position.set(-pw / 2 + .004, ph / 2, 0);
    pc.add(side);
    pc.add(box(.008, ph, .012, M.alu, -pw / 2 + .004, ph / 2, pd / 2 - .01));
    pc.add(box(.008, ph, .012, M.alu, -pw / 2 + .004, ph / 2, -pd / 2 + .01));
    // 内部：主板 / 显卡 / 内存 / 水冷 / 电源仓 / 顶部风扇
    pc.add(box(.012, .32, .32, std({ c: 0x0f1b16, r: .8 }), .07, ph * .57, .02));
    pc.add(box(.11, .06, .3, std({ c: 0x171a1f, r: .55 }), .01, ph * .50, .03));
    pc.add(box(.1, .012, .28, M.ledMag, .01, ph * .50 - .036, .03));
    pc.add(box(.03, .09, .09, std({ c: 0x22262c, r: .6 }), .055, ph * .50 + .055, -.09));
    pc.add(box(.085, .085, .085, std({ c: 0x1a1e24, r: .5 }), .01, ph * .70, .05));
    const cool = cyl(.026, .026, .012, M.ledCyan, -.036, ph * .70, .05, 16);
    cool.rotation.z = Math.PI / 2; pc.add(cool);
    pc.add(box(pw - .03, .09, pd - .14, std({ c: 0x0e1115, r: .85 }), 0, .065, .02));
    for (let i = 0; i < 3; i++) {
      pc.add(cyl(.052, .052, .02, std({ c: 0x121519, r: .7 }), 0, ph - .042, -.14 + i * .13, 18));
      const r = new THREE.Mesh(new THREE.TorusGeometry(.047, .005, 6, 20), M.ledCyan);
      r.rotation.x = Math.PI / 2; r.position.set(0, ph - .029, -.14 + i * .13);
      pc.add(r);
    }
    pc.position.set(DESK_X - .66, DESK_TOP, DESK_Z + .06);
    pc.rotation.y = .22;
    reg('pc', pc); root.add(pc);

    /* —— 键盘 —— */
    const kb = G();
    kb.add(box(.34, .028, .14, std({ c: 0x191c22, r: .5, m: .3 }), 0, .014, 0));
    const keys = plane(.32, .125, std({ map: TX.keys, r: .7 }));
    keys.rotation.x = -Math.PI / 2; keys.position.set(0, .029, 0);
    kb.add(keys);
    kb.add(box(.345, .008, .145, M.ledMag, 0, .004, 0));   // 底部轴灯泄光
    kb.add(cyl(.016, .016, .018, M.alu, .148, .034, -.052, 14));
    kb.position.set(DESK_X - .02, DESK_TOP + .004, DESK_Z - .25);
    kb.rotation.y = .02;
    reg('keyboard', kb); root.add(kb);

    /* —— 鼠标 —— */
    const ms = G();
    const body = new THREE.Mesh(new THREE.SphereGeometry(.042, 16, 12), std({ c: 0x15181d, r: .45 }));
    body.scale.set(.75, .52, 1.25); body.position.y = .022;
    ms.add(body);
    ms.add(box(.002, .006, .05, M.ledCyan, 0, .038, .005));
    ms.position.set(DESK_X + .36, DESK_TOP + .004, DESK_Z - .26);
    reg('mouse', ms); root.add(ms);

    /* —— 桌面音响 ×2（喇叭朝南，向座位内倾） —— */
    const spk = G();
    [-.84, .3].forEach((ox, i) => {
      const s = G();
      s.add(box(.11, .23, .13, std({ c: 0x14171c, r: .65 }), 0, .115, 0));
      const cone = cyl(.038, .038, .012, std({ c: 0x0a0b0e, r: .9 }), 0, .14, -.066, 18);
      cone.rotation.x = Math.PI / 2; s.add(cone);
      const tw = cyl(.015, .015, .01, std({ c: 0x4a4f57, r: .4, m: .6 }), 0, .195, -.066, 14);
      tw.rotation.x = Math.PI / 2; s.add(tw);
      s.add(box(.08, .006, .004, M.ledCyan, 0, .02, -.066));
      s.position.set(ox, 0, 0);
      s.rotation.y = i ? .5 : -.5;
      spk.add(s);
    });
    spk.position.set(DESK_X + .25, DESK_TOP, DESK_Z + .2);
    reg('speaker', spk); root.add(spk);

    /* —— 杯子 + 手机支架（陈设，不可点） —— */
    const cup = cyl(.038, .034, .1, std({ c: 0x20252c, r: .5 }), DESK_X + .66, DESK_TOP + .05, DESK_Z - .22, 18);
    root.add(cup);
    root.add(cyl(.04, .04, .004, std({ c: 0x3c2a1c, r: .3 }), DESK_X + .66, DESK_TOP + .098, DESK_Z - .22, 18));

    /* —— 洞洞板（东墙，窗北侧；板面朝西对着房间） —— */
    const pb = G();
    const pbW = .75, pbH = .6;
    pb.add(box(.016, pbH, pbW, std({ c: 0x23282f, r: .85 }), 0, 0, 0));
    const holeM = std({ c: 0x0a0c10, r: .9 });
    for (let a = 0; a < 7; a++) for (let b = 0; b < 9; b++) {
      const h = cyl(.008, .008, .02, holeM, -.009, pbH / 2 - .07 - a * .075, -pbW / 2 + .07 + b * .075, 6);
      h.rotation.z = Math.PI / 2; h.castShadow = false; pb.add(h);
    }
    pb.add(box(.05, .012, .26, M.alu, -.03, .12, -.06));     // 托盘
    pb.add(box(.05, .09, .26, std({ c: 0x1b1f26, r: .7 }), -.03, .17, -.06));
    pb.position.set(W - .03, 1.48, 3.3);
    reg('pegboard', pb); root.add(pb);

    /* —— 耳机 + 挂架 —— */
    const hs = G();
    hs.add(box(.05, .018, .018, M.alu, -.028, .14, 0));
    const hb = new THREE.Mesh(new THREE.TorusGeometry(.085, .013, 8, 20, Math.PI), std({ c: 0x16191e, r: .6 }));
    hb.rotation.y = Math.PI / 2; hb.position.set(-.05, .06, 0);
    hs.add(hb);
    [-.082, .082].forEach(oz => {
      const ear = cyl(.045, .045, .032, std({ c: 0x16191e, r: .65 }), -.05, -.01, oz, 18);
      ear.rotation.x = Math.PI / 2; hs.add(ear);
      const r = new THREE.Mesh(new THREE.TorusGeometry(.042, .005, 6, 18), M.ledMag);
      r.position.set(-.067, -.01, oz); r.rotation.y = Math.PI / 2; hs.add(r);
    });
    hs.position.set(W - .055, 1.72, 2.98);
    reg('headset', hs); root.add(hs);

    /* —— 人体工学椅 —— */
    const ch = G();
    const seatY = .55;
    ch.add(cyl(.035, .035, seatY - .1, M.steel, 0, (seatY - .1) / 2 + .05, 0, 14));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leg = box(.3, .025, .045, M.blackM, Math.cos(a) * .15, .06, Math.sin(a) * .15);
      leg.rotation.y = -a; ch.add(leg);
      const cw = new THREE.Mesh(new THREE.SphereGeometry(.028, 10, 8), std({ c: 0x0d0f13, r: .6 }));
      cw.position.set(Math.cos(a) * .29, .03, Math.sin(a) * .29); ch.add(cw);
    }
    ch.add(box(.5, .07, .48, M.leatherB, 0, seatY, 0));
    ch.add(box(.46, .03, .44, std({ c: 0x22272f, r: .9 }), 0, seatY + .05, 0));
    // 靠背（网背，朝南=朝向房间）
    const back = G();
    back.add(box(.46, .62, .05, M.leatherB, 0, .31, 0));
    back.add(box(.38, .5, .02, std({ c: 0x262c35, r: .95 }), 0, .32, .025));
    back.add(box(.3, .09, .06, M.leatherB, 0, .14, .035));   // 腰托
    back.position.set(0, seatY + .035, .24);
    back.rotation.x = .17;
    ch.add(back);
    // 头枕
    const hd = box(.3, .13, .07, M.leatherB, 0, seatY + .72, .14);
    hd.rotation.x = .3; ch.add(hd);
    ch.add(box(.035, .18, .035, M.blackM, 0, seatY + .6, .2));
    // 扶手
    [-.27, .27].forEach(ox => {
      ch.add(box(.045, .2, .045, M.blackM, ox, seatY + .1, .1));
      ch.add(box(.07, .035, .26, std({ c: 0x1b1f26, r: .7 }), ox, seatY + .21, .06));
    });
    ch.position.set(DESK_X - .02, 0, DESK_Z - .72);
    ch.rotation.y = Math.PI + .12;
    reg('chair', ch); root.add(ch);

    /* —— 空调 + 挡风板 —— */
    const ac = G();
    ac.add(box(.9, .3, .22, std({ c: 0xeef1f4, r: .55 }), 0, 0, 0));
    ac.add(box(.86, .05, .02, std({ c: 0x9aa3ad, r: .6 }), 0, -.1, -.115));
    ac.add(box(.04, .04, .02, M.ledCyan, .36, .08, -.115));
    const baf = box(1.0, .22, .012, std({ c: 0xd8dde2, r: .4, t: true, o: .55 }), 0, -.16, -.2);
    baf.rotation.x = -.5; ac.add(baf);
    ac.position.set(4.5, 2.78, D - .12);
    reg('ac', ac); root.add(ac);
  }

  /* ════════════════════════════════════════════════════════════
     观影区（西）
     ════════════════════════════════════════════════════════════ */
  const TV_Z = 2.4;

  function buildCinema(root) {
    /* —— 电视 —— */
    const tv = G();
    const tw = 1.67, th2 = .95;
    tv.add(box(.035, th2, tw, std({ c: 0x0b0d11, r: .45, m: .3 }), 0, 0, 0));
    const scr = plane(tw - .03, th2 - .05, std({ map: TX.tv.tex, e: 0xffffff, emap: TX.tv.tex, ei: 1.25, r: .25 }));
    scr.rotation.y = Math.PI / 2; scr.position.set(.019, .004, 0);
    tv.add(scr);
    // 背光（挂墙氛围）
    const bl = plane(tw + .26, th2 + .26, std({ c: 0xff4fd8, e: 0xcc2aa0, ei: .9, t: true, o: .13, side: THREE.DoubleSide, dw: false }));
    bl.rotation.y = Math.PI / 2; bl.position.set(-.03, 0, 0);
    tv.add(bl);
    tv.position.set(.07, 1.10, TV_Z);
    reg('tv', tv); root.add(tv);

    /* —— 电视柜 —— */
    const st = G();
    const sw2 = 1.4, sd2 = .4, sh2 = .42;
    st.add(box(sd2, .035, sw2, M.walnutL, 0, sh2 - .018, 0));
    st.add(box(sd2, .035, sw2, M.walnut, 0, .04, 0));
    st.add(box(.025, sh2 - .08, sw2, M.walnut, -sd2 / 2 + .012, sh2 / 2, 0));
    [-.5, .5].forEach(oz => st.add(box(sd2, .22, .66, M.walnut, 0, .17, oz * .67)));
    [-.34, .34].forEach(oz => {
      st.add(box(.018, .18, .62, M.walnutL, sd2 / 2 + .002, .17, oz));
      st.add(box(.022, .012, .18, M.alu, sd2 / 2 + .012, .17, oz));
    });
    [-.6, .6].forEach(oz => { [-.14, .14].forEach(ox => st.add(box(.05, .045, .05, M.blackM, ox, .02, oz))); });
    st.position.set(.26, 0, TV_Z);
    reg('tvstand', st); root.add(st);

    /* —— 回音壁 —— */
    const sbar = G();
    sbar.add(box(.12, .07, 1.1, std({ c: 0x0e1115, r: .55 }), 0, 0, 0));
    const mesh2 = plane(1.06, .05, std({ c: 0x1b2027, r: .95 }));
    mesh2.rotation.y = Math.PI / 2; mesh2.position.set(.061, 0, 0);
    sbar.add(mesh2);
    sbar.add(box(.01, .008, .12, M.ledCyan, .062, -.022, .42));
    sbar.position.set(.3, .46, TV_Z);
    reg('soundbar', sbar); root.add(sbar);

    /* —— 家用游戏主机 —— */
    const cs = G();
    cs.add(box(.26, .09, .39, std({ c: 0x14171c, r: .5 }), 0, .045, 0));
    cs.add(box(.265, .012, .38, std({ c: 0xe8edf2, r: .4 }), 0, .085, 0));
    cs.add(box(.005, .006, .3, M.ledCyan, -.134, .045, 0));
    // 手柄
    const pad = G();
    pad.add(box(.15, .035, .07, std({ c: 0x1b1f26, r: .5 }), 0, 0, 0));
    [-.06, .06].forEach(ox => {
      const h = new THREE.Mesh(new THREE.SphereGeometry(.033, 10, 8), std({ c: 0x1b1f26, r: .5 }));
      h.scale.set(1, .8, 1.5); h.position.set(ox, -.01, .05); pad.add(h);
    });
    pad.add(box(.03, .01, .02, M.ledMag, 0, .02, -.03));
    pad.position.set(.05, .51, TV_Z - .5); pad.rotation.y = .5;
    root.add(pad);
    cs.position.set(.26, .42, TV_Z + .45);
    reg('console', cs); root.add(cs);

    /* —— 路由器（陈设） —— */
    const rt = box(.12, .025, .12, std({ c: 0x191d23, r: .6 }), .26, .46, TV_Z - .62);
    root.add(rt);
    [-.04, .04].forEach(o => root.add(box(.008, .14, .008, M.blackM, .26 + o, .54, TV_Z - .62)));

    /* —— 地毯 —— */
    const rug = G();
    const rp = plane(1.5, 2.0, M.rug);
    rp.rotation.x = -Math.PI / 2; rug.add(rp);
    const bd = plane(1.38, 1.88, std({ c: 0x3a4049, r: .99, t: true, o: .5 }));
    bd.rotation.x = -Math.PI / 2; bd.position.y = .002; rug.add(bd);
    rug.position.set(1.85, .006, TV_Z);
    reg('rug', rug); root.add(rug);

    /* —— 双人电动功能沙发（朝西正对电视） —— */
    const sofa = G();
    const SW = 1.68;        // 沿 z（面宽）
    const SD = .95;         // 沿 x（进深）
    const seatZ = [-.41, .41];
    // 底座 + 脚
    sofa.add(box(SD - .04, .10, SW, std({ c: 0x191d23, r: .85 }), .02, .07, 0));
    [[-.36, -.68], [-.36, .68], [.36, -.68], [.36, .68]].forEach(([ox, oz]) =>
      sofa.add(box(.08, .04, .08, M.blackM, ox, .02, oz)));
    // 靠背主体 + 独立靠垫
    sofa.add(box(.22, .70, SW, M.fabricD, SD / 2 - .11, .47, 0));
    sofa.add(box(.24, .06, SW + .02, M.fabricD, SD / 2 - .12, .85, 0));        // 背顶压条
    seatZ.forEach(oz => {
      const bc = box(.17, .44, .70, M.leatherB, SD / 2 - .255, .56, oz);
      bc.rotation.z = -.05; sofa.add(bc);
      sofa.add(box(.13, .09, .66, M.leatherB, SD / 2 - .27, .33, oz));         // 腰部小垫
    });
    // 坐垫
    seatZ.forEach(oz => {
      sofa.add(box(SD - .26, .19, .72, M.leatherB, -.05, .285, oz));
      sofa.add(box(SD - .24, .022, .74, std({ c: 0x121519, r: .95 }), -.05, .375, oz));
    });
    // 中缝
    sofa.add(box(SD - .2, .22, .02, std({ c: 0x0d1014, r: .95 }), -.04, .29, 0));
    // 扶手（两侧 + 中间小台）
    [-SW / 2 + .10, SW / 2 - .10].forEach(oz => {
      sofa.add(box(SD - .06, .30, .20, M.fabricD, 0, .32, oz));
      sofa.add(box(SD - .04, .045, .22, std({ c: 0x1f242b, r: .85 }), 0, .483, oz));
    });
    sofa.add(box(SD - .3, .26, .13, M.walnut, -.08, .30, 0));                   // 中置杯架台
    sofa.add(cyl(.042, .042, .018, M.blackM, -.3, .43, 0, 14));
    sofa.add(box(.06, .02, .1, M.ledCyan, SD / 2 - .02, .22, -.74));            // 电动按键条
    // 左位（北侧）电动展开的脚踏
    const foot = G();
    foot.add(box(.44, .15, .72, M.leatherB, 0, .25, 0));
    foot.add(box(.40, .025, .68, std({ c: 0x121519, r: .95 }), 0, .335, 0));
    foot.add(box(.06, .10, .6, std({ c: 0x191d23, r: .85 }), .22, .22, 0));
    foot.position.set(-SD / 2 - .18, 0, -.41);
    sofa.add(foot);
    // 抱枕 + 毯子
    const pl = box(.13, .34, .34, M.pillow, SD / 2 - .34, .62, .54);
    pl.rotation.z = .3; pl.rotation.x = .18; sofa.add(pl);
    const bl2 = box(.46, .07, .46, std({ map: TEX.fabric('#2f2830', 5), r: .95 }), -.12, .44, .5);
    bl2.rotation.y = .3; sofa.add(bl2);
    sofa.position.set(2.45, 0, TV_Z);
    reg('sofa', sofa); root.add(sofa);

    /* —— 沙发后氛围灯带（陈设） —— */
    const glow = box(.03, .025, SW, M.ledWarm, 2.92, .1, TV_Z);
    root.add(glow);

    /* —— 东窗电动遮光窗帘（两片拉向两侧） —— */
    const cur = G();
    const rail = box(.06, .04, 2.2, M.blackM, W - .14, 2.32, 2.0);
    cur.add(rail);
    [[.92, .32], [3.06, .32]].forEach(([cz, cw]) => {
      const panel = G();
      for (let i = 0; i < 6; i++) {
        const f = box(.06, 2.2, cw / 6 * 1.25, M.curtain, 0, 0, -cw / 2 + (i + .5) * cw / 6);
        f.rotation.y = (i % 2 ? .1 : -.1);
        panel.add(f);
      }
      panel.position.set(W - .15, 1.17, cz);
      cur.add(panel);
    });
    reg('curtain', cur); ATT.east.add(cur);
  }

  /* ════════════════════════════════════════════════════════════
     展示 · 氛围
     ════════════════════════════════════════════════════════════ */
  function buildShow(root) {
    /* —— 玻璃展示柜（北墙西段） —— */
    const cab = G();
    const cw = 1.6, cd = .4, cH = 1.8;
    cab.add(box(cw, .05, cd, M.walnut, 0, .025, 0));
    cab.add(box(cw, .06, cd, M.walnut, 0, cH - .03, 0));
    [-cw / 2 + .03, cw / 2 - .03].forEach(ox => cab.add(box(.06, cH, cd, M.walnut, ox, cH / 2, 0)));
    cab.add(box(cw, cH, .02, std({ c: 0x1a1410, r: .9 }), 0, cH / 2, -cd / 2 + .01));
    const shelfM = std({ c: 0xbfe4f5, r: .06, m: .2, t: true, o: .2, side: THREE.DoubleSide, dw: false });
    const figM = [std({ c: 0xc0392b, r: .5 }), std({ c: 0x2980b9, r: .5 }), std({ c: 0xd4a017, r: .45 }),
                  std({ c: 0x27ae60, r: .5 }), std({ c: 0xe8edf2, r: .4 }), std({ c: 0x8e44ad, r: .5 })];
    for (let i = 0; i < 4; i++) {
      const sy = .4 + i * .42;
      cab.add(box(cw - .1, .016, cd - .05, shelfM, 0, sy, 0));
      cab.add(box(cw - .16, .012, .02, M.ledWarm, 0, sy + .025, -cd / 2 + .06));  // 层板灯带
      // 摆件
      for (let k = 0; k < 5; k++) {
        const ox = -cw / 2 + .2 + k * .3 + (Math.random() - .5) * .05;
        const t = Math.floor(Math.random() * 3);
        const mat = figM[(i * 5 + k) % figM.length];
        if (t === 0) {           // 手办
          const f = G();
          f.add(cyl(.05, .06, .018, M.blackM, 0, .009, 0, 14));
          f.add(box(.045, .13, .035, mat, 0, .085, 0));
          const hh = new THREE.Mesh(new THREE.SphereGeometry(.032, 10, 8), std({ c: 0xf0d6bd, r: .5 }));
          hh.position.y = .175; f.add(hh);
          f.add(box(.012, .09, .012, mat, .038, .1, 0));
          f.add(box(.012, .09, .012, mat, -.038, .1, 0));
          f.position.set(ox, sy + .008, 0); cab.add(f);
        } else if (t === 1) {    // 游戏盒
          const bx = box(.03, .17, .12, std({ map: TEX.boxArt(i * 5 + k), r: .6 }), ox, sy + .093, 0);
          bx.rotation.y = (Math.random() - .5) * .3; cab.add(bx);
        } else {                 // 奖杯 / 外设
          cab.add(cyl(.035, .045, .015, M.gold, ox, sy + .012, 0, 14));
          cab.add(cyl(.012, .012, .07, M.gold, ox, sy + .055, 0, 10));
          const cup2 = cyl(.045, .022, .06, M.gold, ox, sy + .12, 0, 14);
          cab.add(cup2);
        }
      }
    }
    // 玻璃推拉门
    const gd = plane(cw - .08, cH - .12, M.glass);
    gd.position.set(0, cH / 2, cd / 2 - .01); cab.add(gd);
    cab.add(box(.025, cH - .12, .025, M.alu, 0, cH / 2, cd / 2 - .012));
    cab.position.set(1.1, 0, D - .22);
    cab.rotation.y = Math.PI;          // 柜门朝南（面向房间），背板贴北墙
    reg('cabinet', cab); root.add(cab);

    /* —— GAME 霓虹灯牌（灯面朝南） —— */
    const neon = G();
    TX.neon.wrapS = THREE.RepeatWrapping;
    TX.neon.repeat.x = -1; TX.neon.offset.x = 1;   // 配合整体翻转，保证字正过来
    const np = plane(.8, .3, M.neon);
    np.rotation.y = Math.PI;
    neon.add(np);
    neon.add(box(.84, .34, .022, std({ c: 0x0b0d11, r: .7, t: true, o: .55 }), 0, 0, .015));
    neon.position.set(2.7, 1.85, D - .045);
    reg('neon', neon); root.add(neon);

    /* —— 挂落灯带（东墙，藏在格栅后；随东墙一起让开） —— */
    const strip = G();
    strip.add(box(.025, .02, D - .2, M.ledWarm, 0, 0, 0));
    const bounce = plane(.45, D - .2, std({ c: 0xffb066, e: 0xff9d45, ei: .45, t: true, o: .10, side: THREE.DoubleSide, dw: false }));
    bounce.rotation.z = Math.PI / 2; bounce.rotation.y = Math.PI / 2;
    bounce.position.set(-.1, .18, 0);
    strip.add(bounce);
    strip.position.set(W - .16, H - .18, CZ);
    reg('ledstrip', strip); ATT.east.add(strip);

    /* —— 五头玻璃吊灯 —— */
    const pd2 = G();
    pd2.add(cyl(.09, .09, .03, M.blackM, 0, 0, 0, 18));
    pd2.add(cyl(.012, .012, .42, M.blackM, 0, -.22, 0, 10));
    pd2.add(cyl(.11, .11, .025, M.blackM, 0, -.44, 0, 20));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const ax = Math.cos(a) * .3, az = Math.sin(a) * .3;
      const arm = box(.31, .014, .014, M.blackM, ax / 2, -.45, az / 2);
      arm.rotation.y = -a; pd2.add(arm);
      pd2.add(cyl(.009, .009, .14, M.blackM, ax, -.52, az, 8));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.072, 18, 14), M.warmBulb);
      bulb.position.set(ax, -.63, az);
      pd2.add(bulb);
    }
    pd2.position.set(CX, H - .02, CZ);
    reg('pendant', pd2); root.add(pd2);
  }

  /* ════════════════════════════════════════════════════════════
     灯光
     ════════════════════════════════════════════════════════════ */
  const L = {};
  function buildLights(root) {
    L.amb = new THREE.AmbientLight(0x6f86a8, .22);
    L.hemi = new THREE.HemisphereLight(0x7fa8c8, 0x2a1d12, .32);
    root.add(L.amb, L.hemi);

    // 吊灯暖光（主光，投影）
    L.pendant = new THREE.PointLight(0xffc98a, 1.5, 9, 2);
    L.pendant.position.set(CX, H - .7, CZ);
    L.pendant.castShadow = true;
    L.pendant.shadow.mapSize.set(1024, 1024);
    L.pendant.shadow.bias = -.0025;
    L.pendant.shadow.camera.far = 12;
    root.add(L.pendant);

    // 屏幕冷光
    L.scrGame = new THREE.PointLight(0x5fd8ff, .85, 3.4, 2);
    L.scrGame.position.set(DESK_X, 1.25, DESK_Z - .1);
    root.add(L.scrGame);

    // 电视光
    L.tv = new THREE.PointLight(0x86b4e8, .82, 4.6, 2);
    L.tv.position.set(.55, 1.15, TV_Z);
    root.add(L.tv);

    // 挂落灯带暖光（东墙）
    L.strip1 = new THREE.PointLight(0xff9d45, .55, 4.2, 2); L.strip1.position.set(W - .5, H - .35, 1.1);
    L.strip2 = new THREE.PointLight(0xff9d45, .55, 4.2, 2); L.strip2.position.set(W - .5, H - .35, 2.9);
    root.add(L.strip1, L.strip2);

    // 展示柜
    L.cab = new THREE.PointLight(0xffd3a0, .6, 2.8, 2);
    L.cab.position.set(1.1, 1.3, D - .45);
    root.add(L.cab);

    // 霓虹
    L.neon = new THREE.PointLight(0xff2fc0, .7, 2.8, 2);
    L.neon.position.set(2.7, 1.85, D - .28);
    root.add(L.neon);

    // 屏幕挂灯
    L.bar = new THREE.SpotLight(0xffd0a0, 1.1, 2.4, .9, .6, 2);
    L.bar.position.set(DESK_X, 1.42, DESK_Z - .25);
    L.bar.target.position.set(DESK_X, DESK_TOP, DESK_Z - .3);
    root.add(L.bar, L.bar.target);

    // 窗光（夜=月光冷 / 日=强暖白）
    L.win = new THREE.DirectionalLight(0x9fc4ff, .18);
    L.win.position.set(W + 3.5, 3.2, 2.2);
    L.win.target.position.set(2.0, .6, 2.0);
    root.add(L.win, L.win.target);

    // 检视补光：相机退到房外做剖面观察时淡入，保证内部看得清（由 main.js 调强度）
    L.insp = new THREE.DirectionalLight(0xd2e6ff, 0);
    L.insp.position.set(CX + 3.5, 9.5, CZ - 4.5);
    L.insp.target.position.set(CX, .8, CZ);
    root.add(L.insp, L.insp.target);
    L.insp2 = new THREE.DirectionalLight(0xffd9b5, 0);
    L.insp2.position.set(CX - 4.5, 7.5, CZ + 4.5);
    L.insp2.target.position.set(CX, .8, CZ);
    root.add(L.insp2, L.insp2.target);
  }

  /* 昼 / 夜 */
  let isNight = true;
  function setNight(v) {
    isNight = v;
    const t = v ? 1 : 0;
    L.amb.intensity = v ? .22 : .62;
    L.amb.color.setHex(v ? 0x6f86a8 : 0xbcd2e8);
    L.hemi.intensity = v ? .32 : .95;
    L.pendant.intensity = v ? 1.5 : .45;
    L.scrGame.intensity = v ? .85 : .35;
    L.tv.intensity = v ? .8 : .3;
    L.strip1.intensity = L.strip2.intensity = v ? .55 : .12;
    L.cab.intensity = v ? .6 : .2;
    L.neon.intensity = v ? .7 : .25;
    L.bar.intensity = v ? 1.1 : .4;
    L.win.intensity = v ? .18 : 2.3;
    L.win.color.setHex(v ? 0x9fc4ff : 0xfff0d8);
    M.sky.map = M.sky.emissiveMap = v ? TX.cityN : TX.cityD;
    M.sky.emissiveIntensity = v ? .62 : 1.0;
    M.sky.needsUpdate = true;
    M.warmBulb.emissiveIntensity = v ? 1.15 : .4;
    M.ledWarm.emissiveIntensity = v ? 1.7 : .5;
    M.ledCyan.emissiveIntensity = v ? 2.3 : .9;
    M.ledMag.emissiveIntensity = v ? 2.3 : .9;
    M.neon.emissiveIntensity = v ? 2.2 : .8;
    return t;
  }

  /* ════════════════════════════════════════════════════════════
     对外接口
     ════════════════════════════════════════════════════════════ */
  function build(scene) {
    buildMaterials();
    const root = new THREE.Group();
    buildShell(root);
    buildOpenings(root);
    buildGame(root);
    buildCinema(root);
    buildShow(root);
    buildLights(root);
    scene.add(root);

    // 记录每个设备在 root 局部空间的初始位置与拆解方向
    devices.forEach(d => {
      d.group.userData.base = d.group.position.clone();
      const dir = new THREE.Vector3(d.center.x - CX, 0, d.center.z - CZ);
      if (dir.lengthSq() < .01) dir.set(0, 0, 1);
      d.explodeDir = dir.normalize();
    });

    /* ──────────────────────────────────────────────────────────
       坐标系校正：
       Three 是 y-up 右手系，若直接令 +x=东、+z=北，整个房间会左右镜像
       （从南门进来，东窗会跑到左手边）。沿 z 轴翻一次即可对上真实朝向：
       翻转后 世界 z=0 为北、z=D 为南，+x 仍为东。
       Three 会自动翻转背面剔除方向，法线也由法线矩阵处理，无副作用。
       ────────────────────────────────────────────────────────── */
    root.scale.z = -1;
    root.position.z = D;
    root.updateMatrixWorld(true);

    // 翻转后重算世界坐标（相机、标注、剖面图都用世界坐标）
    const bb = new THREE.Box3(), c = new THREE.Vector3(), s = new THREE.Vector3();
    devices.forEach(d => {
      bb.setFromObject(d.group);
      bb.getCenter(c); bb.getSize(s);
      d.center.copy(c); d.size.copy(s);
      d.top.set(c.x, bb.max.y, c.z);
      d.radius = Math.max(s.x, s.y, s.z) * .5;
    });
    walls.forEach(w => {
      w.normal.z *= -1;
      bb.setFromObject(w.mesh);
      w.ref = bb.getCenter(new THREE.Vector3());
    });

    setNight(true);
    return { root, devices, walls, lights: L, ceiling: ceilGroup };
  }

  function anim(t) {
    TX.game.draw(t); TX.code.draw(t); TX.tv.draw(t);
    // 霓虹呼吸
    M.neon.emissiveIntensity = (isNight ? 2.2 : .8) * (1 + Math.sin(t * 2.4) * .10);
    L.neon.intensity = (isNight ? .7 : .25) * (1 + Math.sin(t * 2.4) * .16);
    // 屏幕光随画面轻微起伏
    L.scrGame.intensity = (isNight ? .85 : .35) * (1 + Math.sin(t * 1.7) * .09);
    L.tv.intensity = (isNight ? .8 : .3) * (1 + Math.sin(t * 1.1 + 2) * .14);
  }

  return { build, anim, setNight, W, D, H, CX, CZ, devices, walls,
           get materials() { return M; } };
})();
