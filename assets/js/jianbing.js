var _window = window,TimelineMax = _window.TimelineMax;
var $pan = document.querySelector('.pan');
var $wrap = document.querySelector('.pancake__wrapper');
var $cake = document.querySelector('.pancake');

var timeout = void 0;
var flipping = void 0;
var rotation = 0;
// A little function for toggling the pancake face
var cook = function cook() {
  timeout = setTimeout(function () {
    var op = 'add';
    if ($cake.classList.contains('pancake--cooking')) op = 'remove';
    $cake.classList[op]('pancake--cooking');
    cook();
  }, Math.random() * 4000);
};

var getShake = function getShake(el, isPan) {
  var SHAKE = 0.075;
  var PLACE = 5;
  var timeline = new TimelineMax({ repeat: 3 });
  timeline.
  to(el, SHAKE, { x: isPan ? -PLACE : PLACE, y: isPan ? PLACE : -PLACE }).
  to(el, SHAKE, { x: isPan ? PLACE : -PLACE, y: isPan ? -PLACE : PLACE }).
  to(el, SHAKE, { x: 0, y: 0 });
  return timeline;
};

var DRAW = 0.2;
var START = 0.1;
var FLIP = 0.5;
var SET = 0.1;

var drawBackAndTilt = function drawBackAndTilt() {
  var timeline = new TimelineMax();
  timeline.
  to($pan, DRAW, { x: 10, y: -10, rotationX: -15 }).
  to($pan, START, { x: -10, y: 10, rotationX: 20, z: 255 }).
  to($pan, SET, { x: 0, y: 0, rotationX: 0, z: 0, delay: FLIP });
  return timeline;
};

var cakeFlip = function cakeFlip() {
  var timeline = new TimelineMax({
    onComplete: function onComplete() {return rotation = rotation + 360;} });

  timeline.
  to($wrap, DRAW, { x: 10, y: -10, rotationX: rotation - 15 }).
  to($wrap, START, { x: -10, y: 10, rotationX: rotation + 20, z: 255 }).
  to($wrap, FLIP, {
    x: -10,
    y: 10,
    z: 500,
    rotationX: rotation + 360,
    onStart: function onStart() {return $cake.classList.add('pancake--flipping');},
    onComplete: function onComplete() {return $cake.classList.remove('pancake--flipping');} }).

  to($wrap, SET, { x: 0, y: 0, rotationX: rotation + 360, z: 5 });
  return timeline;
};

var flip = function flip() {
  if (flipping) return;
  var flipTl = new TimelineMax({
    onStart: function onStart() {
      flipping = true;
      clearTimeout(timeout);
    },
    onComplete: function onComplete() {
      flipping = false;
      cook();
    } });

  flipTl.
  add(getShake($pan, true), 'shake').
  add(getShake($wrap, false), 'shake').
  add(drawBackAndTilt(), 'flip').
  add(cakeFlip(), 'flip');
};
cook();
$(".pancake__wrapper").click(function(){
    flip()
})
$(".pan").click(function(){
    flip()
})