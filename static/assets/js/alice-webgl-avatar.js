(() => {
  'use strict';

  const ROOT_SELECTOR = '[data-alice-webgl-avatar]';
  const STATE_TEXT = {
    idle: '我在这里，有事喊我～',
    greeting: '嗨，我是 Alice 数字人 👋',
    thinking: '我想想喔…',
    speaking: '正在说话中 ✨',
  };

  const AVATAR_VERTEX_SHADER = `
    attribute vec2 aPosition;
    attribute vec2 aUv;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uHover;
    uniform float uNear;
    uniform float uState;
    uniform float uAudioLevel;
    uniform vec2 uLook;

    void main() {
      vec2 pos = aPosition;
      float breathe = sin(uTime * 1.8) * 0.012;
      float idleSway = sin(uTime * 1.15) * 0.018;
      float greetWave = sin(uTime * 8.0) * 0.018 * step(0.5, uState) * (1.0 - step(1.5, uState));
      float thinkingBob = sin(uTime * 3.6) * 0.014 * step(1.5, uState) * (1.0 - step(2.5, uState));
      float speakingPulse = uAudioLevel * 0.028 * step(2.5, uState);

      pos.x += idleSway * (1.0 - abs(pos.y));
      pos.x += uLook.x * 0.055 * uNear * (1.0 - abs(pos.y));
      pos.x += greetWave * (1.0 - abs(pos.y));
      pos.y += breathe * (1.0 + uHover * 0.35);
      pos.y += uLook.y * 0.025 * uNear * (1.0 - abs(pos.x));
      pos.y += thinkingBob;
      pos *= 1.0 + uHover * 0.035 + speakingPulse;

      gl_Position = vec4(pos, 0.0, 1.0);
      vUv = aUv;
    }
  `;

  const AVATAR_FRAGMENT_SHADER = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uVideo;
    uniform float uTime;
    uniform float uHover;
    uniform float uNear;
    uniform float uState;
    uniform float uAudioLevel;

    void main() {
      vec4 frame = texture2D(uVideo, vUv);
      float alpha = frame.a;

      vec2 centered = vUv - vec2(0.5, 0.52);
      float aura = smoothstep(0.76, 0.05, length(centered * vec2(0.78, 1.0)));
      float statePulse = 0.75 + 0.25 * sin(uTime * 2.4);
      float speaking = step(2.5, uState);
      float thinking = step(1.5, uState) * (1.0 - step(2.5, uState));
      float greeting = step(0.5, uState) * (1.0 - step(1.5, uState));

      vec3 blueGlow = vec3(0.30, 0.70, 1.0) * aura * 0.15 * statePulse;
      vec3 pinkGlow = vec3(1.0, 0.64, 0.86) * aura * (0.08 + 0.16 * uHover + 0.12 * greeting);
      vec3 goldGlow = vec3(1.0, 0.78, 0.28) * aura * 0.10 * thinking * (0.55 + 0.45 * sin(uTime * 5.2));
      vec3 voiceGlow = vec3(0.36, 0.95, 1.0) * aura * speaking * (0.16 + uAudioLevel * 0.42);
      vec3 nearGlow = vec3(0.44, 0.78, 1.0) * aura * uNear * 0.10;

      vec3 color = frame.rgb + (blueGlow + pinkGlow + goldGlow + voiceGlow + nearGlow) * alpha;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const PARTICLE_VERTEX_SHADER = `
    attribute vec2 aPosition;
    attribute float aSize;
    attribute float aAlpha;
    attribute float aHue;
    varying float vAlpha;
    varying float vHue;
    uniform float uDpr;
    uniform float uAudioLevel;
    uniform float uState;

    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      float speaking = step(2.5, uState);
      gl_PointSize = aSize * uDpr * (1.0 + speaking * uAudioLevel * 1.4);
      vAlpha = aAlpha;
      vHue = aHue;
    }
  `;

  const PARTICLE_FRAGMENT_SHADER = `
    precision mediump float;
    varying float vAlpha;
    varying float vHue;

    void main() {
      vec2 p = gl_PointCoord - vec2(0.5);
      float d = length(p);
      float soft = smoothstep(0.5, 0.02, d);
      vec3 blue = vec3(0.28, 0.72, 1.0);
      vec3 pink = vec3(1.0, 0.58, 0.86);
      vec3 gold = vec3(1.0, 0.82, 0.38);
      vec3 color = mix(blue, pink, smoothstep(0.0, 0.7, vHue));
      color = mix(color, gold, smoothstep(0.72, 1.0, vHue));
      gl_FragColor = vec4(color, soft * vAlpha);
    }
  `;

  const STATE_VALUE = {
    idle: 0,
    greeting: 1,
    thinking: 2,
    speaking: 3,
  };

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'WebGL shader compile failed';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || 'WebGL program link failed';
      gl.deleteProgram(program);
      throw new Error(message);
    }
    return program;
  }

  function resizeCanvas(canvas, gl) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    return dpr;
  }

  async function safePlay(video) {
    try {
      const result = video.play();
      if (result && typeof result.then === 'function') await result;
      return true;
    } catch (error) {
      return false;
    }
  }

  function createParticles(count) {
    return Array.from({ length: count }, (_, index) => {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.7;
      const radius = 0.48 + Math.random() * 0.52;
      return {
        baseAngle: angle,
        radius,
        speed: 0.08 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
        size: 2.5 + Math.random() * 5.8,
        alpha: 0.24 + Math.random() * 0.58,
        hue: Math.random(),
      };
    });
  }

  function setupAvatarProgram(gl) {
    const program = createProgram(gl, AVATAR_VERTEX_SHADER, AVATAR_FRAGMENT_SHADER);
    const vertices = new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
      -1,  1, 0, 0,
       1, -1, 1, 1,
       1,  1, 1, 0,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return {
      program,
      buffer,
      aPosition: gl.getAttribLocation(program, 'aPosition'),
      aUv: gl.getAttribLocation(program, 'aUv'),
      uVideo: gl.getUniformLocation(program, 'uVideo'),
      uTime: gl.getUniformLocation(program, 'uTime'),
      uHover: gl.getUniformLocation(program, 'uHover'),
      uNear: gl.getUniformLocation(program, 'uNear'),
      uLook: gl.getUniformLocation(program, 'uLook'),
      uState: gl.getUniformLocation(program, 'uState'),
      uAudioLevel: gl.getUniformLocation(program, 'uAudioLevel'),
    };
  }

  function setupParticleProgram(gl) {
    const program = createProgram(gl, PARTICLE_VERTEX_SHADER, PARTICLE_FRAGMENT_SHADER);
    const buffer = gl.createBuffer();
    return {
      program,
      buffer,
      stride: 5 * 4,
      aPosition: gl.getAttribLocation(program, 'aPosition'),
      aSize: gl.getAttribLocation(program, 'aSize'),
      aAlpha: gl.getAttribLocation(program, 'aAlpha'),
      aHue: gl.getAttribLocation(program, 'aHue'),
      uDpr: gl.getUniformLocation(program, 'uDpr'),
      uAudioLevel: gl.getUniformLocation(program, 'uAudioLevel'),
      uState: gl.getUniformLocation(program, 'uState'),
    };
  }

  function attachDomBubbleControls(root) {
    if (root.dataset.aliceBubbleBound === 'true') return;
    root.dataset.aliceBubbleBound = 'true';
    const bubble = root.querySelector('.floating-alice-video__bubble');
    let bubbleTimer = 0;

    const setBubble = (state, text, duration) => {
      window.clearTimeout(bubbleTimer);
      if (bubble) bubble.textContent = text || STATE_TEXT[state] || STATE_TEXT.idle;
      root.dataset.state = state;
      root.classList.toggle('is-greeting', state === 'greeting');
      root.classList.toggle('is-thinking', state === 'thinking');
      root.classList.toggle('is-speaking', state === 'speaking');
      root.classList.add('is-bubble-visible');
      if (duration) {
        bubbleTimer = window.setTimeout(() => {
          if (bubble) bubble.textContent = STATE_TEXT.idle;
          root.dataset.state = 'idle';
          root.classList.remove('is-greeting', 'is-thinking', 'is-speaking', 'is-bubble-visible', 'is-tapped');
        }, duration);
      }
    };

    root.addEventListener('pointerenter', () => {
      if (!root.classList.contains('is-greeting') && !root.classList.contains('is-thinking') && !root.classList.contains('is-speaking')) {
        if (bubble) bubble.textContent = STATE_TEXT.idle;
        root.classList.add('is-bubble-visible');
      }
    });

    root.addEventListener('pointerleave', () => {
      if (!root.classList.contains('is-greeting') && !root.classList.contains('is-thinking') && !root.classList.contains('is-speaking')) {
        root.classList.remove('is-bubble-visible');
      }
    });

    root.addEventListener('pointerdown', () => {
      root.classList.add('is-tapped');
      setBubble('greeting', STATE_TEXT.greeting, 2600);
      window.setTimeout(() => root.classList.remove('is-tapped'), 520);
    });
  }

  function initAvatar(root) {
    attachDomBubbleControls(root);

    const canvas = root.querySelector('.floating-alice-video__canvas');
    const video = root.querySelector('.floating-alice-video__fallback');
    const bubble = root.querySelector('.floating-alice-video__bubble');
    if (!canvas || !video) return null;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      root.classList.add('is-fallback');
      return null;
    }

    let avatarProgram;
    let particleProgram;
    try {
      avatarProgram = setupAvatarProgram(gl);
      particleProgram = setupParticleProgram(gl);
    } catch (error) {
      console.warn('[Alice WebGL Avatar] shader init failed:', error);
      root.classList.add('is-fallback');
      return null;
    }

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);

    const particles = createParticles(92);
    const particleData = new Float32Array(particles.length * 5);
    let raf = 0;
    let hoverTarget = 0;
    let hover = 0;
    let nearTarget = 0;
    let near = 0;
    let lookTarget = { x: 0, y: 0 };
    let look = { x: 0, y: 0 };
    let hasFrame = false;
    let state = 'idle';
    let revertTimer = 0;
    let audioContext = null;
    let analyser = null;
    let audioData = null;
    let audioEl = null;
    let syntheticSpeechUntil = 0;
    let audioLevel = 0;
    const start = performance.now();

    function setBubbleText(text) {
      if (!bubble) return;
      bubble.textContent = text || STATE_TEXT[state] || STATE_TEXT.idle;
    }

    function setState(nextState, options = {}) {
      if (!STATE_VALUE.hasOwnProperty(nextState)) return;
      window.clearTimeout(revertTimer);
      state = nextState;
      root.dataset.state = nextState;
      root.classList.toggle('is-speaking', nextState === 'speaking');
      root.classList.toggle('is-thinking', nextState === 'thinking');
      root.classList.toggle('is-greeting', nextState === 'greeting');
      setBubbleText(options.text || STATE_TEXT[nextState]);
      if (options.showBubble !== false) {
        root.classList.add('is-bubble-visible');
      }
      if (options.duration) {
        revertTimer = window.setTimeout(() => setState('idle', { showBubble: false }), options.duration);
      }
    }

    function updatePointer(clientX, clientY) {
      const rect = root.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (clientX - cx) / rect.width;
      const dy = (clientY - cy) / rect.height;
      const distance = Math.hypot(dx, dy);
      nearTarget = Math.max(0, Math.min(1, 1 - distance / 2.4));
      lookTarget.x = Math.max(-1, Math.min(1, dx * 1.25));
      lookTarget.y = Math.max(-1, Math.min(1, -dy * 1.1));
      if (nearTarget > 0.62 && state === 'idle') {
        root.classList.add('is-attentive');
      } else {
        root.classList.remove('is-attentive');
      }
    }

    function readAudioLevel(now) {
      if (analyser && audioData) {
        analyser.getByteFrequencyData(audioData);
        let sum = 0;
        for (let i = 0; i < audioData.length; i += 1) sum += audioData[i];
        return Math.min(1, (sum / audioData.length) / 145);
      }
      if (now < syntheticSpeechUntil) {
        return 0.45 + 0.35 * Math.abs(Math.sin(now * 0.012)) + 0.14 * Math.abs(Math.sin(now * 0.031));
      }
      return 0;
    }

    function updateParticles(time, dpr) {
      const isSpeaking = state === 'speaking';
      const isThinking = state === 'thinking';
      const boost = isSpeaking ? 0.18 + audioLevel * 0.24 : isThinking ? 0.1 : 0;
      particles.forEach((p, index) => {
        const angle = p.baseAngle + time * p.speed + Math.sin(time * 0.55 + p.phase) * 0.12;
        const radius = p.radius + Math.sin(time * 1.4 + p.phase) * 0.045 + boost;
        const x = Math.cos(angle) * radius * 0.72;
        const y = Math.sin(angle) * radius * 0.86 - 0.02;
        const alphaPulse = 0.65 + Math.sin(time * 2.2 + p.phase) * 0.35;
        const o = index * 5;
        particleData[o] = x;
        particleData[o + 1] = y;
        particleData[o + 2] = p.size;
        particleData[o + 3] = p.alpha * alphaPulse * (0.68 + near * 0.4 + (isSpeaking ? 0.35 : 0));
        particleData[o + 4] = p.hue;
      });

      gl.useProgram(particleProgram.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleProgram.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(particleProgram.aPosition);
      gl.vertexAttribPointer(particleProgram.aPosition, 2, gl.FLOAT, false, particleProgram.stride, 0);
      gl.enableVertexAttribArray(particleProgram.aSize);
      gl.vertexAttribPointer(particleProgram.aSize, 1, gl.FLOAT, false, particleProgram.stride, 8);
      gl.enableVertexAttribArray(particleProgram.aAlpha);
      gl.vertexAttribPointer(particleProgram.aAlpha, 1, gl.FLOAT, false, particleProgram.stride, 12);
      gl.enableVertexAttribArray(particleProgram.aHue);
      gl.vertexAttribPointer(particleProgram.aHue, 1, gl.FLOAT, false, particleProgram.stride, 16);
      gl.uniform1f(particleProgram.uDpr, dpr);
      gl.uniform1f(particleProgram.uAudioLevel, audioLevel);
      gl.uniform1f(particleProgram.uState, STATE_VALUE[state]);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, particles.length);
    }

    function renderAvatar(time) {
      gl.useProgram(avatarProgram.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, avatarProgram.buffer);
      gl.enableVertexAttribArray(avatarProgram.aPosition);
      gl.vertexAttribPointer(avatarProgram.aPosition, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(avatarProgram.aUv);
      gl.vertexAttribPointer(avatarProgram.aUv, 2, gl.FLOAT, false, 16, 8);
      gl.uniform1f(avatarProgram.uTime, time);
      gl.uniform1f(avatarProgram.uHover, hover);
      gl.uniform1f(avatarProgram.uNear, near);
      gl.uniform2f(avatarProgram.uLook, look.x, look.y);
      gl.uniform1f(avatarProgram.uState, STATE_VALUE[state]);
      gl.uniform1f(avatarProgram.uAudioLevel, audioLevel);
      gl.uniform1i(avatarProgram.uVideo, 0);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function render(now) {
      const dpr = resizeCanvas(canvas, gl);
      const time = (now - start) / 1000;
      audioLevel += (readAudioLevel(now) - audioLevel) * 0.18;
      if (state === 'speaking' && audioLevel < 0.02 && now > syntheticSpeechUntil && (!audioEl || audioEl.paused || audioEl.ended)) {
        setState('idle', { showBubble: false });
      }

      hover += (hoverTarget - hover) * 0.08;
      near += (nearTarget - near) * 0.075;
      look.x += (lookTarget.x - look.x) * 0.08;
      look.y += (lookTarget.y - look.y) * 0.08;

      gl.clear(gl.COLOR_BUFFER_BIT);
      updateParticles(time, dpr);

      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          hasFrame = true;
        } catch (error) {
          console.warn('[Alice WebGL Avatar] video texture update failed:', error);
          root.classList.add('is-fallback');
          cancelAnimationFrame(raf);
          return;
        }
      }

      if (hasFrame) {
        renderAvatar(time);
        root.classList.add('is-webgl-ready');
      }
      raf = requestAnimationFrame(render);
    }

    async function speak(text = STATE_TEXT.speaking, audioUrl) {
      setState('speaking', { text });
      if (audioEl) {
        audioEl.pause();
        audioEl = null;
      }
      if (audioUrl) {
        try {
          audioEl = new Audio(audioUrl);
          audioEl.crossOrigin = 'anonymous';
          audioEl.addEventListener('ended', () => setState('idle', { showBubble: false }), { once: true });
          if (window.AudioContext || window.webkitAudioContext) {
            audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaElementSource(audioEl);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            audioData = new Uint8Array(analyser.frequencyBinCount);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
          }
          await audioEl.play();
        } catch (error) {
          console.warn('[Alice WebGL Avatar] audio playback failed, using synthetic speech pulse:', error);
          syntheticSpeechUntil = performance.now() + Math.max(2200, text.length * 140);
        }
      } else {
        syntheticSpeechUntil = performance.now() + Math.max(2200, text.length * 140);
      }
    }

    root.addEventListener('pointerenter', () => {
      hoverTarget = 1;
    });
    root.addEventListener('pointerleave', () => {
      hoverTarget = 0;
    });
    root.addEventListener('pointerdown', () => {
      setState('greeting', { duration: 2600 });
    });
    window.addEventListener('pointermove', (event) => updatePointer(event.clientX, event.clientY), { passive: true });

    const startRender = async () => {
      const playable = await safePlay(video);
      if (!playable) {
        root.classList.add('is-fallback');
        return;
      }
      root.classList.add('is-webgl');
      setBubbleText(STATE_TEXT.idle);
      raf = requestAnimationFrame(render);
    };

    if (video.readyState >= video.HAVE_METADATA) {
      startRender();
    } else {
      video.addEventListener('loadedmetadata', startRender, { once: true });
      video.addEventListener('error', () => root.classList.add('is-fallback'), { once: true });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        video.pause();
        if (audioEl) audioEl.pause();
      } else if (!root.classList.contains('is-fallback')) {
        safePlay(video).then(() => { raf = requestAnimationFrame(render); });
      }
    });

    return {
      root,
      setState,
      speak,
      startSpeaking: (text) => speak(text || STATE_TEXT.speaking),
      stopSpeaking: () => setState('idle', { showBubble: false }),
      think: (text = STATE_TEXT.thinking, duration = 2600) => setState('thinking', { text, duration }),
      greet: (text = STATE_TEXT.greeting, duration = 2600) => setState('greeting', { text, duration }),
      idle: () => setState('idle', { showBubble: false }),
    };
  }

  function init() {
    const instances = [];
    document.querySelectorAll(ROOT_SELECTOR).forEach((root) => {
      const instance = initAvatar(root);
      if (instance) instances.push(instance);
    });
    window.AliceAvatar = instances[0] || null;
    window.AliceAvatars = instances;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
