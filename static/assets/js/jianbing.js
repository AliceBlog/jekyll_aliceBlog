(function () {
  'use strict';

  var TimelineMax = window.TimelineMax;
  var pancakeRoots = Array.prototype.slice.call(document.querySelectorAll('.home-kawaii-pancake, .eggboxs'));

  if (!pancakeRoots.length) return;

  function createFallbackFlip(cake, wrap, pan) {
    if (!cake || cake.dataset.fallbackFlipping === 'true') return;
    cake.dataset.fallbackFlipping = 'true';
    cake.classList.add('pancake--flipping');
    if (wrap) wrap.classList.add('pancake__wrapper--fallback-flip');
    if (pan) pan.classList.add('pan--fallback-shake');

    window.setTimeout(function () {
      cake.classList.remove('pancake--flipping');
      if (wrap) wrap.classList.remove('pancake__wrapper--fallback-flip');
      if (pan) pan.classList.remove('pan--fallback-shake');
      cake.dataset.fallbackFlipping = 'false';
    }, 820);
  }

  function initPancake(root) {
    var pan = root.querySelector('.pan');
    var wrap = root.querySelector('.pancake__wrapper');
    var cake = root.querySelector('.pancake');
    var timeout = null;
    var flipping = false;
    var rotation = 0;

    if (!pan || !wrap || !cake) return;

    function cook() {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(function () {
        if (!cake || flipping) return;
        cake.classList.toggle('pancake--cooking');
        cook();
      }, Math.random() * 4000 + 900);
    }

    function getShake(el, isPan) {
      var SHAKE = 0.075;
      var PLACE = 5;
      var timeline = new TimelineMax({ repeat: 3 });
      timeline
        .to(el, SHAKE, { x: isPan ? -PLACE : PLACE, y: isPan ? PLACE : -PLACE })
        .to(el, SHAKE, { x: isPan ? PLACE : -PLACE, y: isPan ? -PLACE : PLACE })
        .to(el, SHAKE, { x: 0, y: 0 });
      return timeline;
    }

    function drawBackAndTilt() {
      var timeline = new TimelineMax();
      timeline
        .to(pan, 0.2, { x: 10, y: -10, rotationX: -15 })
        .to(pan, 0.1, { x: -10, y: 10, rotationX: 20, z: 255 })
        .to(pan, 0.1, { x: 0, y: 0, rotationX: 0, z: 0, delay: 0.5 });
      return timeline;
    }

    function cakeFlip() {
      var timeline = new TimelineMax({
        onComplete: function () {
          rotation += 360;
        },
      });

      timeline
        .to(wrap, 0.2, { x: 10, y: -10, rotationX: rotation - 15 })
        .to(wrap, 0.1, { x: -10, y: 10, rotationX: rotation + 20, z: 255 })
        .to(wrap, 0.5, {
          x: -10,
          y: 10,
          z: 500,
          rotationX: rotation + 360,
          onStart: function () {
            cake.classList.add('pancake--flipping');
          },
          onComplete: function () {
            cake.classList.remove('pancake--flipping');
          },
        })
        .to(wrap, 0.1, { x: 0, y: 0, rotationX: rotation + 360, z: 5 });
      return timeline;
    }

    function flip() {
      if (flipping) return;

      if (!TimelineMax) {
        createFallbackFlip(cake, wrap, pan);
        return;
      }

      var flipTl = new TimelineMax({
        onStart: function () {
          flipping = true;
          window.clearTimeout(timeout);
        },
        onComplete: function () {
          flipping = false;
          cook();
        },
      });

      flipTl
        .add(getShake(pan, true), 'shake')
        .add(getShake(wrap, false), 'shake')
        .add(drawBackAndTilt(), 'flip')
        .add(cakeFlip(), 'flip');
    }

    root.addEventListener('click', function (event) {
      if (!event.target.closest('.pancake__wrapper, .pan, .home-kawaii-pancake')) return;
      event.preventDefault();
      flip();
    });

    root.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      flip();
    });

    root.setAttribute('tabindex', '0');
    root.setAttribute('role', 'button');
    root.setAttribute('aria-label', root.getAttribute('aria-label') || '点击翻动煎饼');
    cook();
  }

  pancakeRoots.forEach(initPancake);
})();
