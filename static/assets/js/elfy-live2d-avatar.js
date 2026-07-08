(() => {
  'use strict';

  const ROOT_SELECTOR = '[data-elfy-live2d]';
  const MODEL_URL = '/assets/live2d/elfy/Elfy.model3.json';
  const EXPRESSION_LABELS = {
    random: '随机变一下 ✨',
    face1: '换个表情～',
    eyes1: '眼神切换 👀',
    blush: '脸红了…',
    phone: '手机拿好啦',
    mic: '麦克风准备好了',
    accessories: '配饰上线～',
  };

  function setBubble(root, text) {
    const bubble = root.querySelector('.elfy-live2d__bubble');
    if (bubble) bubble.textContent = text;
  }

  function markError(root, message) {
    console.error('[Elfy Live2D]', message);
    root.classList.add('is-error', 'is-bubble-visible');
    setBubble(root, 'Elfy 加载失败，稍后再试～');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`加载脚本失败：${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensureRuntime() {
    await loadScript('/assets/live2d/elfy/vendor/live2dcubismcore.min.js');
    await loadScript('/assets/live2d/elfy/vendor/pixi.min.js');
    window.PIXI = window.PIXI || PIXI;
    await loadScript('/assets/live2d/elfy/vendor/pixi-live2d-cubism4.min.js');

    if (!window.Live2DCubismCore) throw new Error('Live2DCubismCore 不存在');
    if (!window.PIXI || !window.PIXI.live2d || !window.PIXI.live2d.Live2DModel) {
      throw new Error('PIXI Live2D runtime 不存在');
    }
  }

  function fitModel(app, model) {
    const root = app.view.parentElement;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    model.anchor.set(0.5, 0.5);
    model.x = rect.width * 0.5;
    model.y = rect.height * 0.5;

    const modelWidth = Math.max(1, model.width / Math.max(model.scale.x, 0.0001));
    const modelHeight = Math.max(1, model.height / Math.max(model.scale.y, 0.0001));
    const scale = Math.min(rect.width / modelWidth, rect.height / modelHeight) * 0.92;
    model.scale.set(scale);
  }

  async function init(root) {
    const canvas = root.querySelector('.elfy-live2d__canvas');
    if (!canvas) return;

    try {
      await ensureRuntime();

      const app = new PIXI.Application({
        view: canvas,
        resizeTo: root,
        autoStart: true,
        antialias: true,
        transparent: true,
        backgroundAlpha: 0,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      const model = await PIXI.live2d.Live2DModel.from(MODEL_URL, {
        autoInteract: true,
        autoUpdate: true,
      });

      app.stage.addChild(model);
      fitModel(app, model);
      try {
        await model.expression('accessories');
      } catch (error) {
        console.warn('[Elfy Live2D] default accessories failed', error);
      }
      root.classList.add('is-ready', 'is-bubble-visible');
      setBubble(root, '嗨，我是 Elfy 👋 配饰已戴好～');

      let bubbleTimer = window.setTimeout(() => root.classList.remove('is-bubble-visible'), 4200);
      let dragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;

      root.addEventListener('pointerenter', () => {
        window.clearTimeout(bubbleTimer);
        root.classList.add('is-bubble-visible');
        setBubble(root, '有事喊我～');
      });

      root.addEventListener('pointerleave', () => {
        bubbleTimer = window.setTimeout(() => root.classList.remove('is-bubble-visible'), 1200);
      });

  

      root.querySelectorAll('[data-elfy-expression]').forEach((button) => {
        button.addEventListener('click', async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const name = button.dataset.elfyExpression;
          try {
            if (name === 'random') {
              await model.expression();
            } else {
              const ok = await model.expression(name);
              if (!ok) await model.expression();
            }
            root.classList.add('is-bubble-visible', 'is-controls-visible');
            setBubble(root, EXPRESSION_LABELS[name] || `切换 ${name}`);
          } catch (error) {
            console.warn('[Elfy Live2D] expression failed', name, error);
            root.classList.add('is-bubble-visible', 'is-controls-visible');
            setBubble(root, '这个表情没切成功');
          }
        });
      });

      root.addEventListener('pointerdown', (event) => {
        if (event.target.closest('[data-elfy-expression]')) return;
        dragging = true;
        root.setPointerCapture?.(event.pointerId);
        const rect = root.getBoundingClientRect();
        dragOffsetX = event.clientX - rect.left;
        dragOffsetY = event.clientY - rect.top;
      });

      root.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        const nextRight = window.innerWidth - event.clientX - (root.offsetWidth - dragOffsetX);
        const nextBottom = window.innerHeight - event.clientY - (root.offsetHeight - dragOffsetY);
        root.style.right = `${Math.max(8, Math.min(window.innerWidth - root.offsetWidth - 8, nextRight))}px`;
        root.style.bottom = `${Math.max(8, Math.min(window.innerHeight - root.offsetHeight - 8, nextBottom))}px`;
      });

      root.addEventListener('pointerup', (event) => {
        dragging = false;
        root.releasePointerCapture?.(event.pointerId);
      });

      window.addEventListener('resize', () => fitModel(app, model));
    } catch (error) {
      markError(root, error);
    }
  }

  function boot() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
