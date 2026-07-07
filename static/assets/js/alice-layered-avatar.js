(() => {
  'use strict';

  const DEFAULT_MANIFEST = '/assets/img/alice-avatar-layers/manifest.json';
  const MOTIONS = {
    idle: { label: '待机', bubble: '我在这里，有事喊我～' },
    greeting: { label: '打招呼', bubble: '嗨，我是分层版 Alice 👋' },
    thinking: { label: '思考', bubble: '让我认真想一下…' },
    speaking: { label: '说话', bubble: '正在说话中 ✨' },
    listening: { label: '聆听', bubble: '我在听你说。' },
    happy: { label: '开心', bubble: '好耶，今天也很可爱！' },
  };

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function createLayer(layer) {
    const el = document.createElement('img');
    el.className = `alice-layered-avatar__layer layer-${layer.name}`;
    el.src = layer.src;
    el.alt = '';
    el.decoding = 'async';
    el.dataset.name = layer.name;
    el.style.left = `${(layer.x / 720) * 100}%`;
    el.style.top = `${(layer.y / 1280) * 100}%`;
    el.style.width = `${(layer.width / 720) * 100}%`;
    el.style.height = `${(layer.height / 1280) * 100}%`;
    el.style.zIndex = layer.z;
    el.style.transformOrigin = `${layer.pivot.x * 100}% ${layer.pivot.y * 100}%`;
    return el;
  }

  async function initOne(root) {
    const manifestUrl = root.dataset.manifest || DEFAULT_MANIFEST;
    const response = await fetch(manifestUrl);
    const manifest = await response.json();
    const stage = root.querySelector('.alice-layered-avatar__stage') || root;
    const bubble = root.querySelector('.alice-layered-avatar__bubble');
    const layerEls = new Map();
    let state = 'idle';
    let stateSince = performance.now();
    let pointer = { x: 0, y: 0, near: 0 };
    let look = { x: 0, y: 0, near: 0 };
    let audioLevel = 0;
    let syntheticUntil = 0;
    let raf = 0;

    root.classList.add('is-loading');
    manifest.layers
      .filter(layer => layer.name !== '00_full_reference')
      .sort((a, b) => a.z - b.z)
      .forEach(layer => {
        const el = createLayer(layer);
        layerEls.set(layer.name, el);
        stage.appendChild(el);
      });
    root.classList.remove('is-loading');
    root.classList.add('is-ready');


    function findLayerName(...parts) {
      const names = Array.from(layerEls.keys());
      return names.find(name => parts.every(part => name.includes(part))) || '';
    }

    const layerName = {
      hairBack: findLayerName('hair_back'),
      body: findLayerName('body', 'skirt'),
      leftArm: findLayerName('left_arm'),
      rightArm: findLayerName('right_arm'),
      legs: findLayerName('legs'),
      shoes: findLayerName('shoes'),
      face: findLayerName('face'),
      hairFront: findLayerName('hair_front'),
      hat: findLayerName('hat'),
      bow: findLayerName('bow'),
      leftEye: findLayerName('left_eye'),
      rightEye: findLayerName('right_eye'),
      leftEyelid: (manifest.eyelids && manifest.eyelids[0]) || findLayerName('left_eyelid'),
      rightEyelid: (manifest.eyelids && manifest.eyelids[1]) || findLayerName('right_eyelid'),
      mouthClosed: (manifest.mouths && manifest.mouths.closed) || findLayerName('mouth_closed') || findLayerName('mouth_smile'),
      mouthA: (manifest.mouths && manifest.mouths.a) || findLayerName('mouth_a') || findLayerName('mouth_open'),
      mouthE: (manifest.mouths && manifest.mouths.e) || findLayerName('mouth_e') || findLayerName('mouth_open'),
      mouthO: (manifest.mouths && manifest.mouths.o) || findLayerName('mouth_o'),
    };

    function setBubble(text) {
      if (bubble) bubble.textContent = text || MOTIONS[state].bubble;
    }

    function setState(next, options = {}) {
      if (!MOTIONS[next]) return;
      state = next;
      stateSince = performance.now();
      root.dataset.state = next;
      setBubble(options.text || MOTIONS[next].bubble);
      root.classList.add('is-bubble-visible');
      if (options.duration) {
        window.setTimeout(() => setState('idle', { hideBubble: true }), options.duration);
      }
      if (options.hideBubble) root.classList.remove('is-bubble-visible');
    }

    function updatePointer(event) {
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.36;
      const dx = (event.clientX - cx) / rect.width;
      const dy = (event.clientY - cy) / rect.height;
      const dist = Math.hypot(dx, dy);
      pointer.x = clamp(dx * 2.2, -1, 1);
      pointer.y = clamp(dy * 2.8, -1, 1);
      pointer.near = clamp(1 - dist / 0.75, 0, 1);
    }

    function setLayer(name, transform, opacity = 1) {
      const el = layerEls.get(name);
      if (!el) return;
      el.style.transform = transform;
      el.style.opacity = opacity;
    }

    function render(now) {
      const t = now / 1000;
      const stateT = (now - stateSince) / 1000;
      look.x += (pointer.x - look.x) * 0.08;
      look.y += (pointer.y - look.y) * 0.08;
      look.near += (pointer.near - look.near) * 0.08;
      const speaking = state === 'speaking';
      const thinking = state === 'thinking';
      const greeting = state === 'greeting';
      if (now < syntheticUntil) {
        audioLevel = 0.45 + 0.38 * Math.abs(Math.sin(now * 0.012)) + 0.14 * Math.abs(Math.sin(now * 0.033));
      } else {
        audioLevel *= 0.86;
        if (speaking && audioLevel < 0.03) setState('idle', { hideBubble: true });
      }

      const breathe = Math.sin(t * 1.8) * 1.4;
      const floatY = Math.sin(t * 1.15) * 3;
      const headX = look.x * 8 * look.near;
      const headY = look.y * 4 * look.near;
      const headRot = look.x * 4.5 * look.near + (thinking ? Math.sin(t * 2.8) * 1.8 : 0);
      const bodyRot = Math.sin(t * 1.1) * 0.8;
      const wave = greeting ? Math.sin(stateT * 12) * 13 : Math.sin(t * 1.5) * 1.5;
      const talkScale = speaking ? 1 + audioLevel * 0.12 : 1;
      const blink = Math.sin(t * 2.1) > 0.985 || state === 'happy';
      const happy = state === 'happy';
      const phonemeIndex = Math.floor(t * 11 + audioLevel * 9) % 3;
      const showA = speaking && audioLevel > 0.5 && phonemeIndex !== 1;
      const showE = speaking && audioLevel > 0.26 && !showA && phonemeIndex === 1;
      const showO = speaking && audioLevel > 0.05 && !showA && !showE;

      stage.style.transform = `translateY(${floatY}px)`;
      setLayer(layerName.hairBack, `translate(${headX * 0.25}px, ${headY * 0.2 + breathe}px) rotate(${headRot * 0.3}deg)`);
      setLayer(layerName.body, `translateY(${breathe * 0.5}px) rotate(${bodyRot}deg)`);
      setLayer(layerName.leftArm, `rotate(${greeting ? -wave * 0.25 : Math.sin(t * 1.3) * 2}deg) translateY(${breathe * 0.2}px)`);
      setLayer(layerName.rightArm, `rotate(${wave}deg) translateY(${breathe * 0.2}px)`);
      setLayer(layerName.legs, `translateY(${Math.max(0, breathe * 0.3)}px)`);
      setLayer(layerName.shoes, `translateY(${Math.max(0, breathe * 0.2)}px)`);
      setLayer(layerName.face, `translate(${headX}px, ${headY}px) rotate(${headRot}deg) scale(${happy ? 1.015 : 1})`);
      setLayer(layerName.hairFront, `translate(${headX * 1.08}px, ${headY * 0.9}px) rotate(${headRot * 0.9}deg)`);
      setLayer(layerName.hat, `translate(${headX * 1.15}px, ${headY * 0.85}px) rotate(${headRot * 1.05 + Math.sin(t * 2.4) * 0.5}deg)`);
      setLayer(layerName.bow, `translate(${headX * 1.25}px, ${headY}px) rotate(${headRot * 1.2 + Math.sin(t * 4.2) * 2.6}deg)`);
      setLayer(layerName.leftEye, `translate(${headX + look.x * 2}px, ${headY + look.y * 1.2}px)`, blink ? 0.22 : 1);
      setLayer(layerName.rightEye, `translate(${headX + look.x * 2}px, ${headY + look.y * 1.2}px)`, blink ? 0.22 : 1);
      setLayer(layerName.leftEyelid, `translate(${headX + look.x * 2}px, ${headY + look.y * 1.2 + (blink ? 0 : -28)}px) scaleY(${blink ? 1 : 0.08})`, blink ? 1 : 0);
      setLayer(layerName.rightEyelid, `translate(${headX + look.x * 2}px, ${headY + look.y * 1.2 + (blink ? 0 : -28)}px) scaleY(${blink ? 1 : 0.08})`, blink ? 1 : 0);
      setLayer(layerName.mouthClosed, `translate(${headX}px, ${headY}px) scale(${happy ? 1.12 : 1})`, speaking ? 0 : state === 'listening' ? 0.55 : 1);
      setLayer(layerName.mouthA, `translate(${headX}px, ${headY}px) scale(${talkScale})`, showA ? 1 : 0);
      setLayer(layerName.mouthE, `translate(${headX}px, ${headY}px) scale(${0.94 + audioLevel * 0.18})`, showE ? 1 : 0);
      setLayer(layerName.mouthO, `translate(${headX}px, ${headY}px) scale(${0.82 + audioLevel * 0.3})`, showO ? 0.95 : 0);
      root.style.setProperty('--alice-energy', speaking ? audioLevel.toFixed(3) : (thinking ? '0.45' : (look.near * 0.45).toFixed(3)));

      raf = requestAnimationFrame(render);
    }

    root.addEventListener('pointerenter', () => root.classList.add('is-bubble-visible'));
    root.addEventListener('pointerleave', () => { if (state === 'idle') root.classList.remove('is-bubble-visible'); });
    root.addEventListener('pointermove', updatePointer);
    window.addEventListener('pointermove', updatePointer, { passive: true });
    root.addEventListener('click', () => setState('greeting', { duration: 2600 }));

    const api = {
      setState,
      greet: () => setState('greeting', { duration: 2600 }),
      think: (text) => setState('thinking', { text, duration: 3200 }),
      listen: (text) => setState('listening', { text: text || MOTIONS.listening.bubble, duration: 3200 }),
      happy: (text) => setState('happy', { text: text || MOTIONS.happy.bubble, duration: 2600 }),
      speak: (text) => {
        setState('speaking', { text: text || MOTIONS.speaking.bubble });
        syntheticUntil = performance.now() + Math.max(1800, (text || '').length * 130);
      },
      idle: () => setState('idle', { hideBubble: true }),
    };

    setBubble(MOTIONS.idle.bubble);
    raf = requestAnimationFrame(render);
    root.__aliceLayeredAvatar = api;
    return api;
  }

  async function init() {
    const roots = Array.from(document.querySelectorAll('[data-alice-layered-avatar]'));
    const instances = [];
    for (const root of roots) {
      try { instances.push(await initOne(root)); }
      catch (error) { console.warn('[Alice Layered Avatar] init failed:', error); }
    }
    window.AliceLayeredAvatar = instances[0] || null;
    window.AliceLayeredAvatars = instances;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
