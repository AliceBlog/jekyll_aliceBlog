;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){

    //this exports all the verlet methods globally, so that the demos work.
    
    var VerletJS = require('./verlet')
    var constraint = require('./constraint')
                                     require('./objects') //patches VerletJS.prototype (bad)
    window.Vec2 = require('./vec2')
    window.VerletJS = VerletJS
    
    window.Particle = VerletJS.Particle
    
    window.DistanceConstraint = constraint.DistanceConstraint
    window.PinConstraint      = constraint.PinConstraint
    window.AngleConstraint    = constraint.AngleConstraint
    
    
    
    },{"./verlet":2,"./constraint":3,"./objects":4,"./vec2":5}],3:[function(require,module,exports){
    
    /*
    Copyright 2013 Sub Protocol and other contributors
    http://subprotocol.com/
    
    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */
    
    // DistanceConstraint -- constrains to initial distance
    // PinConstraint -- constrains to static/fixed point
    // AngleConstraint -- constrains 3 particles to an angle
    
    exports.DistanceConstraint = DistanceConstraint
    exports.PinConstraint = PinConstraint
    exports.AngleConstraint = AngleConstraint
    
    function DistanceConstraint(a, b, stiffness, distance /*optional*/) {
        this.a = a;
        this.b = b;
        this.distance = typeof distance != "undefined" ? distance : a.pos.sub(b.pos).length();
        this.stiffness = stiffness;
    }
    
    DistanceConstraint.prototype.relax = function(stepCoef) {
        var normal = this.a.pos.sub(this.b.pos);
        var m = normal.length2();
        normal.mutableScale(((this.distance*this.distance - m)/m)*this.stiffness*stepCoef);
        this.a.pos.mutableAdd(normal);
        this.b.pos.mutableSub(normal);
    }
    
    DistanceConstraint.prototype.draw = function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.a.pos.x, this.a.pos.y);
        ctx.lineTo(this.b.pos.x, this.b.pos.y);
        ctx.strokeStyle = "#d8dde2";
        ctx.stroke();
    }
    
    
    
    function PinConstraint(a, pos) {
        this.a = a;
        this.pos = (new Vec2()).mutableSet(pos);
    }
    
    PinConstraint.prototype.relax = function(stepCoef) {
        this.a.pos.mutableSet(this.pos);
    }
    
    PinConstraint.prototype.draw = function(ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 6, 0, 2*Math.PI);
        ctx.fillStyle = "rgba(0,153,255,0.1)";
        ctx.fill();
    }
    
    
    function AngleConstraint(a, b, c, stiffness) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.angle = this.b.pos.angle2(this.a.pos, this.c.pos);
        this.stiffness = stiffness;
    }
    
    AngleConstraint.prototype.relax = function(stepCoef) {
        var angle = this.b.pos.angle2(this.a.pos, this.c.pos);
        var diff = angle - this.angle;
        
        if (diff <= -Math.PI)
            diff += 2*Math.PI;
        else if (diff >= Math.PI)
            diff -= 2*Math.PI;
    
        diff *= stepCoef*this.stiffness;
        
        this.a.pos = this.a.pos.rotate(this.b.pos, diff);
        this.c.pos = this.c.pos.rotate(this.b.pos, -diff);
        this.b.pos = this.b.pos.rotate(this.a.pos, diff);
        this.b.pos = this.b.pos.rotate(this.c.pos, -diff);
    }
    
    AngleConstraint.prototype.draw = function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.a.pos.x, this.a.pos.y);
        ctx.lineTo(this.b.pos.x, this.b.pos.y);
        ctx.lineTo(this.c.pos.x, this.c.pos.y);
        var tmp = ctx.lineWidth;
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(255,255,0,0.2)";
        ctx.stroke();
        ctx.lineWidth = tmp;
    }
    
    },{}],5:[function(require,module,exports){
    
    /*
    Copyright 2013 Sub Protocol and other contributors
    http://subprotocol.com/
    
    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */
    
    // A simple 2-dimensional vector implementation
    
    module.exports = Vec2
    
    function Vec2(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    
    Vec2.prototype.add = function(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    
    Vec2.prototype.sub = function(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    
    Vec2.prototype.mul = function(v) {
        return new Vec2(this.x * v.x, this.y * v.y);
    }
    
    Vec2.prototype.div = function(v) {
        return new Vec2(this.x / v.x, this.y / v.y);
    }
    
    Vec2.prototype.scale = function(coef) {
        return new Vec2(this.x*coef, this.y*coef);
    }
    
    Vec2.prototype.mutableSet = function(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    
    Vec2.prototype.mutableAdd = function(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    
    Vec2.prototype.mutableSub = function(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    
    Vec2.prototype.mutableMul = function(v) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }
    
    Vec2.prototype.mutableDiv = function(v) {
        this.x /= v.x;
        this.y /= v.y;
        return this;
    }
    
    Vec2.prototype.mutableScale = function(coef) {
        this.x *= coef;
        this.y *= coef;
        return this;
    }
    
    Vec2.prototype.equals = function(v) {
        return this.x == v.x && this.y == v.y;
    }
    
    Vec2.prototype.epsilonEquals = function(v, epsilon) {
        return Math.abs(this.x - v.x) <= epsilon && Math.abs(this.y - v.y) <= epsilon;
    }
    
    Vec2.prototype.length = function(v) {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    
    Vec2.prototype.length2 = function(v) {
        return this.x*this.x + this.y*this.y;
    }
    
    Vec2.prototype.dist = function(v) {
        return Math.sqrt(this.dist2(v));
    }
    
    Vec2.prototype.dist2 = function(v) {
        var x = v.x - this.x;
        var y = v.y - this.y;
        return x*x + y*y;
    }
    
    Vec2.prototype.normal = function() {
        var m = Math.sqrt(this.x*this.x + this.y*this.y);
        return new Vec2(this.x/m, this.y/m);
    }
    
    Vec2.prototype.dot = function(v) {
        return this.x*v.x + this.y*v.y;
    }
    
    Vec2.prototype.angle = function(v) {
        return Math.atan2(this.x*v.y-this.y*v.x,this.x*v.x+this.y*v.y);
    }
    
    Vec2.prototype.angle2 = function(vLeft, vRight) {
        return vLeft.sub(this).angle(vRight.sub(this));
    }
    
    Vec2.prototype.rotate = function(origin, theta) {
        var x = this.x - origin.x;
        var y = this.y - origin.y;
        return new Vec2(x*Math.cos(theta) - y*Math.sin(theta) + origin.x, x*Math.sin(theta) + y*Math.cos(theta) + origin.y);
    }
    
    Vec2.prototype.toString = function() {
        return "(" + this.x + ", " + this.y + ")";
    }
    
    function test_Vec2() {
        var assert = function(label, expression) {
            console.log("Vec2(" + label + "): " + (expression == true ? "PASS" : "FAIL"));
            if (expression != true)
                throw "assertion failed";
        };
        
        assert("equality", (new Vec2(5,3).equals(new Vec2(5,3))));
        assert("epsilon equality", (new Vec2(1,2).epsilonEquals(new Vec2(1.01,2.02), 0.03)));
        assert("epsilon non-equality", !(new Vec2(1,2).epsilonEquals(new Vec2(1.01,2.02), 0.01)));
        assert("addition", (new Vec2(1,1)).add(new Vec2(2, 3)).equals(new Vec2(3, 4)));
        assert("subtraction", (new Vec2(4,3)).sub(new Vec2(2, 1)).equals(new Vec2(2, 2)));
        assert("multiply", (new Vec2(2,4)).mul(new Vec2(2, 1)).equals(new Vec2(4, 4)));
        assert("divide", (new Vec2(4,2)).div(new Vec2(2, 2)).equals(new Vec2(2, 1)));
        assert("scale", (new Vec2(4,3)).scale(2).equals(new Vec2(8, 6)));
        assert("mutable set", (new Vec2(1,1)).mutableSet(new Vec2(2, 3)).equals(new Vec2(2, 3)));
        assert("mutable addition", (new Vec2(1,1)).mutableAdd(new Vec2(2, 3)).equals(new Vec2(3, 4)));
        assert("mutable subtraction", (new Vec2(4,3)).mutableSub(new Vec2(2, 1)).equals(new Vec2(2, 2)));
        assert("mutable multiply", (new Vec2(2,4)).mutableMul(new Vec2(2, 1)).equals(new Vec2(4, 4)));
        assert("mutable divide", (new Vec2(4,2)).mutableDiv(new Vec2(2, 2)).equals(new Vec2(2, 1)));
        assert("mutable scale", (new Vec2(4,3)).mutableScale(2).equals(new Vec2(8, 6)));
        assert("length", Math.abs((new Vec2(4,4)).length() - 5.65685) <= 0.00001);
        assert("length2", (new Vec2(2,4)).length2() == 20);
        assert("dist", Math.abs((new Vec2(2,4)).dist(new Vec2(3,5)) - 1.4142135) <= 0.000001);
        assert("dist2", (new Vec2(2,4)).dist2(new Vec2(3,5)) == 2);
    
        var normal = (new Vec2(2,4)).normal()
        assert("normal", Math.abs(normal.length() - 1.0) <= 0.00001 && normal.epsilonEquals(new Vec2(0.4472, 0.89443), 0.0001));
        assert("dot", (new Vec2(2,3)).dot(new Vec2(4,1)) == 11);
        assert("angle", (new Vec2(0,-1)).angle(new Vec2(1,0))*(180/Math.PI) == 90);
        assert("angle2", (new Vec2(1,1)).angle2(new Vec2(1,0), new Vec2(2,1))*(180/Math.PI) == 90);
        assert("rotate", (new Vec2(2,0)).rotate(new Vec2(1,0), Math.PI/2).equals(new Vec2(1,1)));
        assert("toString", (new Vec2(2,4)) == "(2, 4)");
    }
    
    
    },{}],4:[function(require,module,exports){
    
    /*
    Copyright 2013 Sub Protocol and other contributors
    http://subprotocol.com/
    
    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */
    
    // generic verlet entities
    
    var VerletJS = require('./verlet')
    var Particle = VerletJS.Particle
    var constraints = require('./constraint')
    var DistanceConstraint = constraints.DistanceConstraint
    
    VerletJS.prototype.point = function(pos) {
        var composite = new this.Composite();
        composite.particles.push(new Particle(pos));
        this.composites.push(composite);
        return composite;
    }
    
    VerletJS.prototype.lineSegments = function(vertices, stiffness) {
        var i;
        
        var composite = new this.Composite();
        
        for (i in vertices) {
            composite.particles.push(new Particle(vertices[i]));
            if (i > 0)
                composite.constraints.push(new DistanceConstraint(composite.particles[i], composite.particles[i-1], stiffness));
        }
        
        this.composites.push(composite);
        return composite;
    }
    
    VerletJS.prototype.cloth = function(origin, width, height, segments, pinMod, stiffness) {
        
        var composite = new this.Composite();
        
        var xStride = width/segments;
        var yStride = height/segments;
        
        var x,y;
        for (y=0;y<segments;++y) {
            for (x=0;x<segments;++x) {
                var px = origin.x + x*xStride - width/2 + xStride/2;
                var py = origin.y + y*yStride - height/2 + yStride/2;
                composite.particles.push(new Particle(new Vec2(px, py)));
                
                if (x > 0)
                    composite.constraints.push(new DistanceConstraint(composite.particles[y*segments+x], composite.particles[y*segments+x-1], stiffness));
                
                if (y > 0)
                    composite.constraints.push(new DistanceConstraint(composite.particles[y*segments+x], composite.particles[(y-1)*segments+x], stiffness));
            }
        }
        
        for (x=0;x<segments;++x) {
            if (x%pinMod == 0)
            composite.pin(x);
        }
        
        this.composites.push(composite);
        return composite;
    }
    
    VerletJS.prototype.tire = function(origin, radius, segments, spokeStiffness, treadStiffness) {
        var stride = (2*Math.PI)/segments;
        var i;
        
        var composite = new this.Composite();
        
        // particles
        for (i=0;i<segments;++i) {
            var theta = i*stride;
            composite.particles.push(new Particle(new Vec2(origin.x + Math.cos(theta)*radius, origin.y + Math.sin(theta)*radius)));
        }
        
        var center = new Particle(origin);
        composite.particles.push(center);
        
        // constraints
        for (i=0;i<segments;++i) {
            composite.constraints.push(new DistanceConstraint(composite.particles[i], composite.particles[(i+1)%segments], treadStiffness));
            composite.constraints.push(new DistanceConstraint(composite.particles[i], center, spokeStiffness))
            composite.constraints.push(new DistanceConstraint(composite.particles[i], composite.particles[(i+5)%segments], treadStiffness));
        }
            
        this.composites.push(composite);
        return composite;
    }
    
    
    },{"./verlet":2,"./constraint":3}],2:[function(require,module,exports){
    
    /*
    Copyright 2013 Sub Protocol and other contributors
    http://subprotocol.com/
    
    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */
    
    window.requestAnimFrame = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.oRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };
    
    var Vec2 = require('./vec2')
    
    exports = module.exports = VerletJS
    exports.Particle = Particle
    exports.Composite = Composite
    
    function Particle(pos) {
        this.pos = (new Vec2()).mutableSet(pos);
        this.lastPos = (new Vec2()).mutableSet(pos);
    }
    
    Particle.prototype.draw = function(ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 2, 0, 2*Math.PI);
        ctx.fillStyle = "#2dad8f";
        ctx.fill();
    }
    
    function VerletJS(width, height, canvas) {
        this.width = width;
        this.height = height;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.mouse = new Vec2(0,0);
        this.mouseDown = false;
        this.draggedEntity = null;
        this.selectionRadius = 20;
        this.highlightColor = "#4f545c";
        
        this.bounds = function (particle) {
            if (particle.pos.y > this.height-1)
                particle.pos.y = this.height-1;
            
            if (particle.pos.x < 0)
                particle.pos.x = 0;
    
            if (particle.pos.x > this.width-1)
                particle.pos.x = this.width-1;
        }
        
        var _this = this;
        
        // prevent context menu
        this.canvas.oncontextmenu = function(e) {
            e.preventDefault();
        };
        
        this.canvas.onmousedown = function(e) {
            _this.mouseDown = true;
            var nearest = _this.nearestEntity();
            if (nearest) {
                _this.draggedEntity = nearest;
            }
        };
        
        this.canvas.onmouseup = function(e) {
            _this.mouseDown = false;
            _this.draggedEntity = null;
        };
        
        this.canvas.onmousemove = function(e) {
            var rect = _this.canvas.getBoundingClientRect();
            _this.mouse.x = e.clientX - rect.left;
            _this.mouse.y = e.clientY - rect.top;
        };  
        
        // simulation params
        this.gravity = new Vec2(0,0.2);
        this.friction = 0.99;
        this.groundFriction = 0.8;
        
        // holds composite entities
        this.composites = [];
    }
    
    VerletJS.prototype.Composite = Composite
    
    function Composite() {
        this.particles = [];
        this.constraints = [];
        
        this.drawParticles = null;
        this.drawConstraints = null;
    }
    
    Composite.prototype.pin = function(index, pos) {
        pos = pos || this.particles[index].pos;
        var pc = new PinConstraint(this.particles[index], pos);
        this.constraints.push(pc);
        return pc;
    }
    
    VerletJS.prototype.frame = function(step) {
        var i, j, c;
    
        for (c in this.composites) {
            for (i in this.composites[c].particles) {
                var particles = this.composites[c].particles;
                
                // calculate velocity
                var velocity = particles[i].pos.sub(particles[i].lastPos).scale(this.friction);
            
                // ground friction
                if (particles[i].pos.y >= this.height-1 && velocity.length2() > 0.000001) {
                    var m = velocity.length();
                    velocity.x /= m;
                    velocity.y /= m;
                    velocity.mutableScale(m*this.groundFriction);
                }
            
                // save last good state
                particles[i].lastPos.mutableSet(particles[i].pos);
            
                // gravity
                particles[i].pos.mutableAdd(this.gravity);
            
                // inertia  
                particles[i].pos.mutableAdd(velocity);
            }
        }
        
        // handle dragging of entities
        if (this.draggedEntity)
            this.draggedEntity.pos.mutableSet(this.mouse);
            
        // relax
        var stepCoef = 1/step;
        for (c in this.composites) {
            var constraints = this.composites[c].constraints;
            for (i=0;i<step;++i)
                for (j in constraints)
                    constraints[j].relax(stepCoef);
        }
        
        // bounds checking
        for (c in this.composites) {
            var particles = this.composites[c].particles;
            for (i in particles)
                this.bounds(particles[i]);
        }
    }
    
    VerletJS.prototype.draw = function() {
        var i, c;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);  
        
        for (c in this.composites) {
            // draw constraints
            if (this.composites[c].drawConstraints) {
                this.composites[c].drawConstraints(this.ctx, this.composites[c]);
            } else {
                var constraints = this.composites[c].constraints;
                for (i in constraints)
                    constraints[i].draw(this.ctx);
            }
            
            // draw particles
            if (this.composites[c].drawParticles) {
                this.composites[c].drawParticles(this.ctx, this.composites[c]);
            } else {
                var particles = this.composites[c].particles;
                for (i in particles)
                    particles[i].draw(this.ctx);
            }
        }
    
        // highlight nearest / dragged entity
        var nearest = this.draggedEntity || this.nearestEntity();
        if (nearest) {
            this.ctx.beginPath();
            this.ctx.arc(nearest.pos.x, nearest.pos.y, 8, 0, 2*Math.PI);
            this.ctx.strokeStyle = this.highlightColor;
            this.ctx.stroke();
        }
    }
    
    VerletJS.prototype.nearestEntity = function() {
        var c, i;
        var d2Nearest = 0;
        var entity = null;
        var constraintsNearest = null;
        
        // find nearest point
        for (c in this.composites) {
            var particles = this.composites[c].particles;
            for (i in particles) {
                var d2 = particles[i].pos.dist2(this.mouse);
                if (d2 <= this.selectionRadius*this.selectionRadius && (entity == null || d2 < d2Nearest)) {
                    entity = particles[i];
                    constraintsNearest = this.composites[c].constraints;
                    d2Nearest = d2;
                }
            }
        }
        
        // search for pinned constraints for this entity
        for (i in constraintsNearest)
            if (constraintsNearest[i] instanceof PinConstraint && constraintsNearest[i].a == entity)
                entity = constraintsNearest[i];
        
        return entity;
    }
    
    
    },{"./vec2":5}]},{},[1]);