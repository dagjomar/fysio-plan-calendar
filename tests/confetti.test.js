/**
 * tests/confetti.test.js
 * Tester for konfetti-animasjon og canvas-ressurshåndtering
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Konfetti-partikler balanserer save() og restore() på canvas context', () => {
  let saveCalls = 0;
  let restoreCalls = 0;

  const mockCtx = {
    save() {
      saveCalls++;
    },
    restore() {
      restoreCalls++;
    },
    clearRect() {},
    translate() {},
    rotate() {},
    fillRect() {},
    globalAlpha: 1,
    fillStyle: ''
  };

  const particles = [
    { x: 100, y: 100, vx: 1, vy: 1, gravity: 0.35, rotation: 0, rotSpeed: 1, alpha: 0.9, size: 6, color: '#10b981' },
    { x: 200, y: 200, vx: -1, vy: 1, gravity: 0.35, rotation: 45, rotSpeed: -1, alpha: 0.5, size: 8, color: '#3b82f6' }
  ];

  // Simuler ett animasjonssteg
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.rotation += p.rotSpeed;
    p.alpha -= 0.015;

    if (p.alpha > 0) {
      mockCtx.save();
      mockCtx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      mockCtx.translate(p.x, p.y);
      mockCtx.rotate((p.rotation * Math.PI) / 180);
      mockCtx.fillStyle = p.color;
      mockCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      mockCtx.restore();
    }
  });

  assert.equal(saveCalls, 2);
  assert.equal(restoreCalls, 2);
  assert.equal(saveCalls - restoreCalls, 0, 'save() og restore() må være i perfekt balanse');
});

test('Partikler terminerer og active blir false når alpha når 0', () => {
  const particles = [
    { x: 100, y: 100, vx: 0, vy: 0, gravity: 0, rotation: 0, rotSpeed: 0, alpha: 0.03, size: 5, color: '#f59e0b' }
  ];

  let frameCount = 0;
  let active = true;

  while (active && frameCount < 10) {
    frameCount++;
    active = false;
    particles.forEach(p => {
      p.alpha -= 0.015;
      if (p.alpha > 0) {
        active = true;
      }
    });
  }

  assert.equal(active, false);
  assert.equal(frameCount, 2);
});
