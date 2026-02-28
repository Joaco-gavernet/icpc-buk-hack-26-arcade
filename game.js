/*
Snake Duel: Crush Ring (1v1) - Buk Arcade Challenge ICPC
First to 3 rounds wins. Touch border/self/opponent body = lose. Ring shrinks over time.
*/

(function () {
  const GW = 800;
  const GH = 600;

  const CS = 16;
  const COLS = 40;
  const ROWS = 30;

  const TICK_MS = 110;
  const WIN_ROUNDS = 3;

  const SHRINK_EVERY = 10500;
  const WARN_MS = 2800;
  const MIN_INNER = 7;
const TICK_MS_START = 110;  
  const TICK_MS_MIN = 50;   
  const SPEED_UP_FACTOR = 0.005; 

  const DIR = { U: { x: 0, y: -1 }, D: { x: 0, y: 1 }, L: { x: -1, y: 0 }, R: { x: 1, y: 0 } };
  const OPP = { U: 'D', D: 'U', L: 'R', R: 'L' };

  const C = {
    bg0: 0x07070c,
    bg1: 0x0a0a16,
    grid: 0x1e1e2e,
    crush: 0x1a090f,
    wall0: 0xff2a6d,
    wall1: 0xff6b9b,
    p1: 0x00e5ff,
    p2: 0xff4dff,
    food: 0xfff45a,
    ui: 0xf2f2ff,
    dim: 0x9a9ab5
  };

  function maxInset() {
    const mx = Math.floor((COLS - MIN_INNER) / 2) - 1;
    const my = Math.floor((ROWS - MIN_INNER) / 2) - 1;
    return Math.max(0, Math.min(mx, my));
  }

 
function createSnake(x, y, d, color, name, extraLength = 0) {
  const body = [{ x, y }];
  const totalSegments = 3 + extraLength;
  
  for (let i = 1; i < totalSegments; i++) {
    body.push({ x: x - i * DIR[d].x, y: y - i * DIR[d].y });
  }
  
  return { 
    body, 
    dir: d, 
    next: d, 
    alive: true, 
    color, 
    name, 
    grow: 0, 
    boost: 100 
  };
}

  function setDir(s, d) {
    if (!d || d === OPP[s.dir]) return;
    s.next = d;
  }

  function tickSnake(s) {
    if (!s.alive) return;
    s.dir = s.next;
    const d = DIR[s.dir];
    const h = s.body[0];
    s.body.unshift({ x: h.x + d.x, y: h.y + d.y });
    if (s.grow > 0) s.grow--;
    else s.body.pop();
  }

  function onWall(x, y, inset) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
    return x <= inset || x >= (COLS - 1 - inset) || y <= inset || y >= (ROWS - 1 - inset);
  }

  function insideSafe(x, y, inset) {
    return x > inset && x < (COLS - 1 - inset) && y > inset && y < (ROWS - 1 - inset);
  }

  function hitsBody(head, body, startIdx) {
    for (let i = startIdx; i < body.length; i++) {
      const c = body[i];
      if (c.x === head.x && c.y === head.y) return true;
    }
    return false;
  }

  function freeCell(state, tries) {
    const used = new Set();
    state.s1.body.forEach(c => used.add(c.x + ',' + c.y));
    state.s2.body.forEach(c => used.add(c.x + ',' + c.y));
    const inset = state.inset;
    tries = tries || 120;
    for (let i = 0; i < tries; i++) {
      const x = (inset + 1) + ((Math.random() * (COLS - 2 * (inset + 1))) | 0);
      const y = (inset + 1) + ((Math.random() * (ROWS - 2 * (inset + 1))) | 0);
      if (!insideSafe(x, y, inset)) continue;
      const k = x + ',' + y;
      if (!used.has(k)) return { x, y };
    }
    for (let y = inset + 1; y < ROWS - inset - 1; y++) {
      for (let x = inset + 1; x < COLS - inset - 1; x++) {
        if (!insideSafe(x, y, inset)) continue;
        const k = x + ',' + y;
        if (!used.has(k)) return { x, y };
      }
    }
    return null;
  }

  function spawnFood(state) {
    const c = freeCell(state);
    state.food = c || null;
  }

  function tstyle(size, color, weight) {
    return {
      fontFamily: 'monospace', 
      fontSize: size + 'px',
      fontStyle: (weight === '600' || weight === 600) ? 'bold' : (weight ? ('' + weight) : 'bold'),
      color: color || '#f2f2ff'
    };
  }

  const Boot = {
    key: 'Boot',
    create: function () {
      this.scene.start('Menu');
    }
  };

  const Menu = {
    key: 'Menu',
    create: function () {
      try {
        this.input.keyboard.addCapture([
          Phaser.Input.Keyboard.KeyCodes.UP,
          Phaser.Input.Keyboard.KeyCodes.DOWN,
          Phaser.Input.Keyboard.KeyCodes.LEFT,
          Phaser.Input.Keyboard.KeyCodes.RIGHT,
          Phaser.Input.Keyboard.KeyCodes.SPACE,
          Phaser.Input.Keyboard.KeyCodes.ENTER,
          Phaser.Input.Keyboard.KeyCodes.W,
          Phaser.Input.Keyboard.KeyCodes.A,
          Phaser.Input.Keyboard.KeyCodes.S,
          Phaser.Input.Keyboard.KeyCodes.D
        ]);
      } catch (e) { }

      const g = this.add.graphics();
      g.fillStyle(C.bg0);
      g.fillRect(0, 0, GW, GH);
      g.fillStyle(C.bg1, 0.9);
      g.fillRect(0, 0, GW, GH);

      this.add.text(GW / 2, 90, 'SNAKE DUEL', tstyle(72, '#f2f2ff', 'bold')).setOrigin(0.5);
      this.add.text(GW / 2, 160, 'CRUSH RING', tstyle(44, '#ff2a6d', 'bold')).setOrigin(0.5);

      this.add.text(GW / 2, 280, 'HIT BORDER / YOUR BODY / ENEMY BODY = LOSE', tstyle(18, '#f2f2ff', '600')).setOrigin(0.5);
      this.add.text(GW / 2, 310, 'SHORTER SNAKE GETS A SMALL SPEED BOOST', tstyle(18, '#9a9ab5', '600')).setOrigin(0.5);
      this.add.text(GW / 2, 340, 'THE RING SHRINKS. SURVIVE THE CRUSH.', tstyle(18, '#f2f2ff', '600')).setOrigin(0.5);
      this.add.text(GW / 2, 420, 'FIRST TO 3 ROUNDS WINS', tstyle(20, '#fff45a', 'bold')).setOrigin(0.5);

      const t = this.add.text(GW / 2, 500, 'PRESS START', tstyle(28, '#00e5ff', 'bold')).setOrigin(0.5);
      this.tweens.add({ targets: t, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });

      const start = () => this.scene.start('Game');
      this.input.once('pointerdown', start);
      const h = e => {
        const k = (e && e.key) ? ('' + e.key).toUpperCase() : '';
        if (k === 'ENTER' || k === ' ' || k === 'START1' || k === 'START2' || k === '1' || k === '2') {
          this.input.keyboard.off('keydown', h);
          start();
        }
      };
      this.input.keyboard.on('keydown', h);
    }
  };

  class Game extends Phaser.Scene {
    constructor() {
      super({ key: 'Game' });
    }
    init() {
      this.score1 = 0;
      this.score2 = 0;
      this.tutStep = 0; 
    }
    create() {
      try {
        this.input.keyboard.addCapture([
          Phaser.Input.Keyboard.KeyCodes.UP,
          Phaser.Input.Keyboard.KeyCodes.DOWN,
          Phaser.Input.Keyboard.KeyCodes.LEFT,
          Phaser.Input.Keyboard.KeyCodes.RIGHT,
          Phaser.Input.Keyboard.KeyCodes.SPACE,
          Phaser.Input.Keyboard.KeyCodes.ENTER,
          Phaser.Input.Keyboard.KeyCodes.W,
          Phaser.Input.Keyboard.KeyCodes.A,
          Phaser.Input.Keyboard.KeyCodes.S,
          Phaser.Input.Keyboard.KeyCodes.D
        ]);
      } catch (e) { }
      this.g = this.add.graphics();
      this.cam = this.cameras.main;
      this.sfx = makeSfx(this);

      this.uiScore = this.add.text(GW / 2, 18, '0 - 0', tstyle(28, '#f2f2ff', 'bold')).setOrigin(0.5, 0);
      this.uiHint = this.add.text(GW / 2, 52, 'FIRST TO 2', tstyle(14, '#9a9ab5', '600')).setOrigin(0.5, 0);
      this.uiRing = this.add.text(GW / 2, 74, '', tstyle(16, '#ff2a6d', 'bold')).setOrigin(0.5, 0);
      this.big = this.add.text(GW / 2, GH / 2 - 40, '', tstyle(96, '#f2f2ff', 'bold')).setOrigin(0.5);
      this.sub = this.add.text(GW / 2, GH / 2 + 40, '', tstyle(24, '#fff45a', '600')).setOrigin(0.5);
      this.uiTut = this.add.text(GW / 2, GH - 60, '', tstyle(20, '#fff45a', 'bold')).setOrigin(0.5);

      this.particles = [];

      this.input.keyboard.on('keydown', e => {
        const k = (e && e.key) ? ('' + e.key).toUpperCase() : '';
        if (this.phase !== 'play') return;
        if (k === 'W' || k === 'P1U') setDir(this.state.s1, 'U');
        else if (k === 'S' || k === 'P1D') setDir(this.state.s1, 'D');
        else if (k === 'A' || k === 'P1L') setDir(this.state.s1, 'L');
        else if (k === 'D' || k === 'P1R') setDir(this.state.s1, 'R');
        else if (e.key === 'ArrowUp' || k === 'P2U') setDir(this.state.s2, 'U');
        else if (e.key === 'ArrowDown' || k === 'P2D') setDir(this.state.s2, 'D');
        else if (e.key === 'ArrowLeft' || k === 'P2L') setDir(this.state.s2, 'L');
        else if (e.key === 'ArrowRight' || k === 'P2R') setDir(this.state.s2, 'R');
      });
this.p1BoostKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
this.p2BoostKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.initRound();
    }
    initRound() {
      const mid = ROWS >> 1;
      
      const p1Bonus = Math.max(0, (this.score2 - this.score1) * 2);
      const p2Bonus = Math.max(0, (this.score1 - this.score2) * 2);

      const p1StartX = 6 + p1Bonus; 
      const p2StartX = (COLS - 7) - p2Bonus;

      this.state = {
        inset: 0,
        s1: createSnake(p1StartX, mid, 'R', C.p1, 'P1', p1Bonus),
        s2: createSnake(p2StartX, mid, 'L', C.p2, 'P2', p2Bonus),
        food: null
      };
      spawnFood(this.state);

      this.tickAcc = 0;
      this.phase = 'countdown';
      this.count = 3;
      this.countAt = this.time.now + 650;
      this.shrinkAt = 0;
      this.shrMax = maxInset();
      this.roundEndAt = 0;

      this._warnLast = 0;
      this.uiRing.setText('');

      this.big.setVisible(true);
      this.sub.setVisible(true);
      this.big.setFontSize(96);
      this.big.setText('3');
      this.sub.setText('GET READY');
    }
    update(time, delta) {
    const g = this.g;
    g.clear();
    const ox = (GW - COLS * CS) / 2;
    const oy = (GH - ROWS * CS) / 2;

    this.drawArena(g, ox, oy, time);
    this.drawFood(g, ox, oy, time);
    this.drawSnakes(g, ox, oy, time);
    this.drawParticles(g);

    g.fillStyle(C.p1, 0.4);
    g.fillRect(ox, oy - 12, (this.state.s1.boost || 0) * 1.5, 4);
    g.fillStyle(C.p2, 0.4);
    g.fillRect(ox + (COLS * CS) - ((this.state.s2.boost || 0) * 1.5), oy - 12, (this.state.s2.boost || 0) * 1.5, 4);

    this.uiScore.setText(this.score1 + ' - ' + this.score2);
    this.uiHint.setText('FIRST TO ' + WIN_ROUNDS);

    if (this.phase === 'countdown') {
      if (time >= this.countAt) {
        this.count--;
        this.countAt = time + 650;
        if (this.count > 0) {
          this.big.setText('' + this.count);
          this.sfx.beep(520);
        } else {
          this.phase = 'play';
          this.startTime = time; 
          this.shrinkAt = time + SHRINK_EVERY;
          this.big.setText('GO');
          this.sfx.beep(820);
          this.time.delayedCall(350, () => { this.big.setText(''); });
        }
      }
      return;
    }

    if (this.phase === 'play') {
      if (!this.tutStep) this.tutStep = 0;
      
      if (this.tutStep === 0) {
        this.uiRing.setText('P1 WASD | P2 ARROWS');
        const k = this.input.keyboard;
        if (k.addKey('W').isDown || k.addKey('UP').isDown || k.addKey('A').isDown || k.addKey('LEFT').isDown) {
          this.tutStep = 1;
        }
      } else if (this.tutStep === 1) {
        this.uiRing.setText('SPACE OR ENTER TO BOOST');
        if (this.p1BoostKey.isDown || this.p2BoostKey.isDown) {
          this.tutStep = 2;
          this.time.delayedCall(2000, () => { if(this.tutStep === 2) this.uiRing.setText(''); });
        }
      }

      const baseTickMs = Math.max(TICK_MS_MIN, TICK_MS_START - ((time - this.startTime) * SPEED_UP_FACTOR));

      if (this.tutStep === 2) {
        const tto = this.shrinkAt - time;
        if (this.state.inset < this.shrMax && tto > 0 && tto <= WARN_MS) {
          this.uiRing.setText('RING SHRINKS IN ' + (1 + ((tto / 1000) | 0)));
        } else if (tto > 0) {
          this.uiRing.setText('');
        }
      }

      if (this.state.inset < this.shrMax && time >= this.shrinkAt) {
        this.doShrink(time);
      }

      this.tickAcc += delta;
      
      while (this.tickAcc >= (baseTickMs / 2) && this.phase === 'play') {
        this.tickAcc -= (baseTickMs / 2);
        this.tickCount = (this.tickCount || 0) + 1;

        const b1 = this.p1BoostKey.isDown && this.state.s1.boost > 1;
        const b2 = this.p2BoostKey.isDown && this.state.s2.boost > 1;

        if (b1 || (this.tickCount % 2 === 0)) {
          this.moveSnake(this.state.s1);
          if (b1) this.state.s1.boost -= 1.2;
        }
        if (b2 || (this.tickCount % 2 === 0)) {
          this.moveSnake(this.state.s2);
          if (b2) this.state.s2.boost -= 1.2;
        }

        if (!b1) this.state.s1.boost = Math.min(100, (this.state.s1.boost || 0) + 0.2);
        if (!b2) this.state.s2.boost = Math.min(100, (this.state.s2.boost || 0) + 0.2);

        this.step(time); 
      }
      return;
    }

    if (this.phase === 'roundEnd') {
      if (time >= this.roundEndAt) {
        if (this.score1 >= WIN_ROUNDS || this.score2 >= WIN_ROUNDS) {
          this.scene.start('Results', { s1: this.score1, s2: this.score2 });
        } else {
          this.initRound();
        }
      }
    }
  }

    doShrink(time) {
      this.state.inset++;
      this.shrinkAt = time + SHRINK_EVERY;
      this.sfx.shrink();
      try { this.cam.shake(140, 0.012); } catch (e) {}

      if (this.state.food && !insideSafe(this.state.food.x, this.state.food.y, this.state.inset)) spawnFood(this.state);

      const s1 = this.state.s1;
      const s2 = this.state.s2;
      const k1 = crushed(s1.body, this.state.inset);
      const k2 = crushed(s2.body, this.state.inset);
      if (k1) s1.alive = false;
      if (k2) s2.alive = false;
      if (!s1.alive || !s2.alive) this.finishRound(time);

      function crushed(body, inset) {
        for (let i = 0; i < body.length; i++) {
          const c = body[i];
          if (onWall(c.x, c.y, inset)) return true;
        }
        return false;
      }
    }
   step(time) {
  const st = this.state;
  const s1 = st.s1;
  const s2 = st.s2;

  const eat = s => {
    if (!st.food || !s.alive) return;
    const h = s.body[0];
    if (h.x === st.food.x && h.y === st.food.y) {
      s.grow += 2;
      s.boost = Math.min(100, s.boost + 15);
      this.sfx.food();
      this.emit(this.cellToPx(h), C.food);
      spawnFood(st);
    }
  };

  const collide = () => {
    const h1 = s1.body[0];
    const h2 = s2.body[0];
    
    if (s1.alive) {
      if (onWall(h1.x, h1.y, st.inset) || hitsBody(h1, s1.body, 1) || hitsBody(h1, s2.body, 0)) s1.alive = false;
    }
    if (s2.alive) {
      if (onWall(h2.x, h2.y, st.inset) || hitsBody(h2, s2.body, 1) || hitsBody(h2, s1.body, 0)) s2.alive = false;
    }
    
    if (h1.x === h2.x && h1.y === h2.y) { s1.alive = false; s2.alive = false; }
  };

  collide();
  eat(s1);
  eat(s2);

  if (!s1.alive || !s2.alive) this.finishRound(time);
}
    finishRound(time) {
      const s1 = this.state.s1;
      const s2 = this.state.s2;
      this.phase = 'roundEnd';

      let msg = 'DRAW';
      if (s1.alive && !s2.alive) { this.score1++; msg = 'P1 WINS'; }
      else if (!s1.alive && s2.alive) { this.score2++; msg = 'P2 WINS'; }

      this.big.setVisible(true);
      this.sub.setVisible(true);
      this.big.setText(msg);
      this.big.setFontSize(72);
      this.sub.setText(msg === 'DRAW' ? 'NO POINTS' : 'ROUND');

      this.sfx.death();
      if (msg !== 'DRAW') this.sfx.win();
      try { this.cam.shake(160, 0.014); } catch (e) {}
      this.roundEndAt = time + 1600;
    }
    moveSnake(s) {
  if (!s.alive) return;
  
  const head = s.body[0];
  const d = DIR[s.next];
  s.dir = s.next;
  
  const newHead = { x: head.x + d.x, y: head.y + d.y };
  s.body.unshift(newHead);
  

  if (s.grow > 0) {
    s.grow--;
  } else {
    s.body.pop();
  }
}
    cellToPx(c) {
      const ox = (GW - COLS * CS) / 2;
      const oy = (GH - ROWS * CS) / 2;
      return { x: ox + (c.x + 0.5) * CS, y: oy + (c.y + 0.5) * CS };
    }
    emit(p, color) {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 1.6 + Math.random() * 3.4;
        this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 26, color, r: 2 + Math.random() * 2 });
      }
    }
    drawParticles(g) {
      if (!this.particles.length) return;
      const out = [];
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life--;
        if (p.life <= 0) continue;
        g.fillStyle(p.color, Math.min(1, p.life / 26));
        g.fillCircle(p.x, p.y, p.r);
        out.push(p);
      }
      this.particles = out;
    }
    drawArena(g, ox, oy, time) {
      g.fillStyle(C.bg0);
      g.fillRect(0, 0, GW, GH);
      g.fillStyle(C.bg1, 0.95);
      g.fillRect(0, 0, GW, GH);

      g.fillStyle(C.grid, 0.35);
      for (let y = 0; y <= ROWS; y++) g.fillRect(ox, oy + y * CS, COLS * CS, 1);
      for (let x = 0; x <= COLS; x++) g.fillRect(ox + x * CS, oy, 1, ROWS * CS);

      const inset = this.state.inset;
      const ix = ox + (inset + 1) * CS;
      const iy = oy + (inset + 1) * CS;
      const iw = (COLS - 2 * (inset + 1)) * CS;
      const ih = (ROWS - 2 * (inset + 1)) * CS;

      g.fillStyle(C.crush, 0.55);
      g.fillRect(ox, oy, COLS * CS, (iy - oy));
      g.fillRect(ox, iy + ih, COLS * CS, (oy + ROWS * CS) - (iy + ih));
      g.fillRect(ox, iy, (ix - ox), ih);
      g.fillRect(ix + iw, iy, (ox + COLS * CS) - (ix + iw), ih);

      const warn = (this.phase === 'play') && (this.state.inset < this.shrMax) && ((this.shrinkAt - time) > 0) && ((this.shrinkAt - time) <= WARN_MS);
      const a = warn ? (0.45 + 0.35 * Math.sin(time / 70)) : 0.65;
      const col = warn ? C.wall1 : C.wall0;
      g.fillStyle(col, a);
      drawBorder(g, ox, oy, inset);

      function drawBorder(g, ox, oy, inset) {
        const xl = inset;
        const xr = COLS - 1 - inset;
        const yt = inset;
        const yb = ROWS - 1 - inset;
        for (let x = xl; x <= xr; x++) {
          g.fillRect(ox + x * CS + 1, oy + yt * CS + 1, CS - 2, CS - 2);
          g.fillRect(ox + x * CS + 1, oy + yb * CS + 1, CS - 2, CS - 2);
        }
        for (let y = yt + 1; y < yb; y++) {
          g.fillRect(ox + xl * CS + 1, oy + y * CS + 1, CS - 2, CS - 2);
          g.fillRect(ox + xr * CS + 1, oy + y * CS + 1, CS - 2, CS - 2);
        }
      }
    }
    drawFood(g, ox, oy, time) {
      const f = this.state.food;
      if (!f) return;
      const x = ox + f.x * CS + CS / 2;
      const y = oy + f.y * CS + CS / 2;
      const p = 0.55 + 0.25 * Math.sin(time / 90);
      g.fillStyle(C.food, 0.25 + 0.25 * p);
      g.fillCircle(x, y, CS / 2 + 2);
      g.fillStyle(C.food, 0.9);
      g.fillCircle(x, y, CS / 2 - 2);
    }
    drawSnakes(g, ox, oy, time) {
      const s1 = this.state.s1;
      const s2 = this.state.s2;
      drawSnake(g, s1);
      drawSnake(g, s2);

      function drawSnake(g, s) {
        const blink = (!s.alive) ? (0.2 + 0.2 * Math.sin(time / 50)) : 1;
        for (let i = 0; i < s.body.length; i++) {
          const c = s.body[i];
          const x = ox + c.x * CS;
          const y = oy + c.y * CS;
          const head = i === 0;
          g.fillStyle(s.color, (head ? 0.35 : 0.18) * blink);
          g.fillRect(x - 1, y - 1, CS + 2, CS + 2);
          g.fillStyle(s.color, 1 * blink);
          g.fillRect(x + 1, y + 1, CS - 2, CS - 2);
          if (head) {
            g.fillStyle(C.ui, 0.95 * blink);
            g.fillRect(x + 4, y + 4, 3, 3);
            g.fillRect(x + CS - 7, y + 4, 3, 3);
          }
        }
      }
    }
  }

  const Results = {
    key: 'Results',
    init: function (d) {
      this.s1 = (d && d.s1) || 0;
      this.s2 = (d && d.s2) || 0;
    },
    create: function () {
      try {
        this.input.keyboard.addCapture([
          Phaser.Input.Keyboard.KeyCodes.SPACE,
          Phaser.Input.Keyboard.KeyCodes.ENTER
        ]);
      } catch (e) { }

      this.add.graphics().fillStyle(C.bg0).fillRect(0, 0, GW, GH);
      const w = this.s1 >= WIN_ROUNDS ? 'P1' : 'P2';
      const col = w === 'P1' ? '#00e5ff' : '#ff4dff';
      this.add.text(GW / 2, 170, w + ' WINS', tstyle(84, col, 'bold')).setOrigin(0.5);
      this.add.text(GW / 2, 270, this.s1 + ' - ' + this.s2, tstyle(44, '#f2f2ff', 'bold')).setOrigin(0.5);
      this.add.text(GW / 2, 360, 'REVENGE?', tstyle(26, '#fff45a', 'bold')).setOrigin(0.5);
      const t = this.add.text(GW / 2, 450, 'PRESS START', tstyle(28, '#9a9ab5', 'bold')).setOrigin(0.5);
      this.tweens.add({ targets: t, alpha: 0.25, duration: 450, yoyo: true, repeat: -1 });

      const go = () => this.scene.start('Game');
      this.input.once('pointerdown', go);
      const h = e => {
        const k = (e && e.key) ? ('' + e.key).toUpperCase() : '';
        if (k === 'ENTER' || k === ' ' || k === 'START1' || k === 'START2' || k === '1' || k === '2') {
          this.input.keyboard.off('keydown', h);
          go();
        }
      };
      this.input.keyboard.on('keydown', h);
    }
  };

  function makeSfx(scene) {
    const ctx = scene.sound && scene.sound.context;
    if (!ctx) return { food: n, death: n, win: n, shrink: n, beep: n };

    function tone(freq, dur, type, vol) {
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = type || 'square';
        o.frequency.setValueAtTime(freq, ctx.currentTime);
        const v = vol == null ? 0.08 : vol;
        g.gain.setValueAtTime(v, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + dur);
      } catch (e) { }
    }

    return {
      beep: function (f) { tone(f || 520, 0.06, 'sine', 0.06); },
      food: function () { tone(880, 0.07, 'square', 0.09); },
      shrink: function () {
        try {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(240, ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.18);
          g.gain.setValueAtTime(0.14, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          o.start(ctx.currentTime);
          o.stop(ctx.currentTime + 0.18);
        } catch (e) { }
      },
      death: function () { tone(120, 0.18, 'sawtooth', 0.13); },
      win: function () {
        tone(520, 0.12, 'square', 0.09);
        try { scene.time.delayedCall(90, () => tone(680, 0.12, 'square', 0.08)); } catch (e) { }
      }
    };

    function n() { }
  }

  const cfg = {
    type: Phaser.AUTO,
    width: GW,
    height: GH,
    backgroundColor: '#07070c',
    scene: [Boot, Menu, Game, Results],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
  };

  function startWhenReady() {
    if (!document.body) return setTimeout(startWhenReady, 0);
    cfg.parent = document.body;
    new Phaser.Game(cfg);
  }

  startWhenReady();
})();
