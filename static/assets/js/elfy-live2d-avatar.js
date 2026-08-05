(() => {
  'use strict';

  const ROOT_SELECTOR = '[data-elfy-live2d]';
  const STORAGE_KEY = 'alice-floating-live2d-doll';
  const DOLLS = {
    elfy: {
      name: 'Elfy',
      modelUrl: '/assets/live2d/elfy/Elfy.model3.json',
      defaultExpression: 'accessories',
      readyText: '嗨，我是 Elfy 👋 配饰已戴好～',
      hoverText: '有事喊我～',
      scale: 0.92,
    },
    tutu: {
      name: '秃秃秃',
      modelUrl: '/assets/live2d/tutu/秃秃秃.model3.json',
      readyText: '秃秃秃已上线，可以切换我啦～',
      hoverText: '秃秃秃待命中～',
      scale: 0.88,
    },
  };

  function setBubble(root, text) {
    const bubble = root.querySelector('.elfy-live2d__bubble');
    if (bubble) bubble.textContent = text;
  }

  function markError(root, message) {
    console.error('[Floating Live2D]', message);
    root.classList.add('is-error', 'is-bubble-visible');
    setBubble(root, '人偶加载失败，稍后再试～');
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

  function fitModel(app, model, dollConfig) {
    const root = app.view.parentElement;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height || !model) return;

    model.anchor.set(0.5, 0.5);
    model.x = rect.width * 0.5;
    model.y = rect.height * 0.5;

    const modelWidth = Math.max(1, model.width / Math.max(model.scale.x, 0.0001));
    const modelHeight = Math.max(1, model.height / Math.max(model.scale.y, 0.0001));
    const scale = Math.min(rect.width / modelWidth, rect.height / modelHeight) * (dollConfig.scale || 0.9);
    model.scale.set(scale);
  }

  function updateSwitcher(root, activeName) {
    root.querySelectorAll('[data-elfy-doll]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.elfyDoll === activeName);
    });
  }

  function getInitialDollName() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return DOLLS[stored] ? stored : 'elfy';
  }

  async function init(root) {
    const canvas = root.querySelector('.elfy-live2d__canvas');
    if (!canvas) return;

    let app;
    let model;
    let currentDollName = getInitialDollName();
    let currentDollConfig = DOLLS[currentDollName];
    let bubbleTimer = 0;
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let loadToken = 0;

    async function loadDoll(dollName) {
      const dollConfig = DOLLS[dollName] || DOLLS.elfy;
      const token = ++loadToken;
      root.classList.remove('is-ready', 'is-error');
      root.classList.add('is-bubble-visible', 'is-controls-visible');
      setBubble(root, `正在切换到 ${dollConfig.name}…`);
      updateSwitcher(root, dollName);

      try {
        if (model) {
          app.stage.removeChild(model);
          model.destroy({ children: true, texture: false, baseTexture: false });
          model = null;
        }

        const nextModel = await PIXI.live2d.Live2DModel.from(dollConfig.modelUrl, {
          autoInteract: true,
          autoUpdate: true,
        });
        if (token !== loadToken) {
          nextModel.destroy({ children: true, texture: false, baseTexture: false });
          return;
        }

        model = nextModel;
        currentDollName = dollName;
        currentDollConfig = dollConfig;
        window.localStorage.setItem(STORAGE_KEY, dollName);

        app.stage.addChild(model);
        fitModel(app, model, currentDollConfig);

        if (dollConfig.defaultExpression) {
          try {
            await model.expression(dollConfig.defaultExpression);
          } catch (error) {
            console.warn('[Floating Live2D] default expression failed', error);
          }
        }

        root.classList.add('is-ready', 'is-bubble-visible');
        setBubble(root, dollConfig.readyText || `${dollConfig.name} 已加载～`);
        window.clearTimeout(bubbleTimer);
        bubbleTimer = window.setTimeout(() => root.classList.remove('is-bubble-visible'), 4200);
      } catch (error) {
        markError(root, error);
      }
    }

    try {
      await ensureRuntime();

      app = new PIXI.Application({
        view: canvas,
        resizeTo: root,
        autoStart: true,
        antialias: true,
        transparent: true,
        backgroundAlpha: 0,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      root.querySelectorAll('[data-elfy-doll]').forEach((button) => {
        button.addEventListener('click', async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const dollName = button.dataset.elfyDoll;
          if (!DOLLS[dollName] || dollName === currentDollName) return;
          await loadDoll(dollName);
        });
      });

      root.querySelectorAll('[data-elfy-expression]').forEach((button) => {
        button.addEventListener('click', async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const name = button.dataset.elfyExpression;
          if (!model) return;
          try {
            if (name === 'random') {
              await model.expression();
            } else {
              const ok = await model.expression(name);
              if (!ok) await model.expression();
            }
            root.classList.add('is-bubble-visible', 'is-controls-visible');
            setBubble(root, `切换 ${name}`);
          } catch (error) {
            console.warn('[Floating Live2D] expression failed', name, error);
            root.classList.add('is-bubble-visible', 'is-controls-visible');
            setBubble(root, '这个表情没切成功');
          }
        });
      });

      root.addEventListener('pointerenter', () => {
        window.clearTimeout(bubbleTimer);
        root.classList.add('is-bubble-visible');
        setBubble(root, (currentDollConfig && currentDollConfig.hoverText) || '有事喊我～');
      });

      root.addEventListener('pointerleave', () => {
        bubbleTimer = window.setTimeout(() => root.classList.remove('is-bubble-visible'), 1200);
      });

      root.addEventListener('pointerdown', (event) => {
        if (event.target.closest('[data-elfy-expression], [data-elfy-doll]')) return;
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

      window.addEventListener('resize', () => fitModel(app, model, currentDollConfig));
      await loadDoll(currentDollName);
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
