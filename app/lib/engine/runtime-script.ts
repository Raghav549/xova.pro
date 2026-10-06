import type { Blueprint } from './types';

/**
 * The client runtime that is inlined into every generated site.
 *
 * It is intentionally dependency-free (three.js is imported lazily from a CDN)
 * and contains a real rigid-body solver so the generated hero is genuinely
 * simulated rather than a video loop.
 *
 * Note: this string is emitted verbatim into the browser — it deliberately
 * avoids template literals so it survives being embedded in HTML.
 */
export function clientRuntime(bp: Blueprint): string {
  const physics = bp.physics;
  const motion = bp.motion;
  const enablePhysics = physics.engine !== 'none';
  const wantsParallax = motion.parallax;
  const wantsMagnetic = motion.magnetic;
  const bodyCount = physics.bodyCount;

  return `/* Xova runtime — generated for ${bp.brand} */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sticky nav ---------- */
  var nav = document.querySelector('[data-nav]');
  function onScroll() {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector('[data-burger]');
  var links = document.querySelector('.xv-nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () { links.classList.toggle('is-open'); });
    links.addEventListener('click', function () { links.classList.remove('is-open'); });
  }

  /* ---------- smooth anchor scrolling (works for pointer + touch) ---------- */
  document.addEventListener('click', function (event) {
    var target = event.target.closest ? event.target.closest('[data-scroll]') : null;
    if (!target) return;
    event.preventDefault();
    var el = document.querySelector(target.getAttribute('data-scroll'));
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- reveal on scroll ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (reduce || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = Number(entry.target.getAttribute('data-delay') || 0);
        setTimeout(function () { entry.target.classList.add('is-in'); }, delay);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '-8% 0px -8% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- animated counters ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  counters.forEach(function (el) {
    var raw = el.getAttribute('data-count') || '';
    var match = /([0-9]+(?:\\.[0-9]+)?)/.exec(raw);
    if (!match || reduce) return;
    var target = parseFloat(match[1]);
    var prefix = raw.slice(0, match.index);
    var suffix = raw.slice(match.index + match[1].length);
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min(1, (ts - start) / 1200);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + (target * eased).toFixed(match[1].indexOf('.') > -1 ? 1 : 0) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { requestAnimationFrame(step); io.disconnect(); }
    });
    io.observe(el);
  });

  /* ---------- magnetic buttons ---------- */
  ${wantsMagnetic && !motion.scrollReveal ? '' : ''}${
    wantsMagnetic
      ? `
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    Array.prototype.slice.call(document.querySelectorAll('[data-magnetic]')).forEach(function (el) {
      el.addEventListener('pointermove', function (event) {
        var rect = el.getBoundingClientRect();
        var dx = (event.clientX - rect.left - rect.width / 2) / rect.width;
        var dy = (event.clientY - rect.top - rect.height / 2) / rect.height;
        el.style.transform = 'translate(' + (dx * 8).toFixed(2) + 'px,' + (dy * 8 - 2).toFixed(2) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }`
      : ''
  }

  /* ---------- 3D tilt cards ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    Array.prototype.slice.call(document.querySelectorAll('[data-tilt]')).forEach(function (el) {
      el.addEventListener('pointermove', function (event) {
        var rect = el.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 8).toFixed(2) + 'deg) translateY(-6px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- store: cart + filters ---------- */
  var cart = { items: [], total: 0 };
  var panel = document.querySelector('[data-cart-panel]');
  function renderCart() {
    if (!panel) return;
    panel.hidden = cart.items.length === 0;
    var list = panel.querySelector('[data-cart-items]');
    var total = panel.querySelector('[data-cart-total]');
    if (list) {
      list.innerHTML = cart.items.map(function (item) {
        return '<li>' + item.name + ' <span style="float:right">' + item.price + '</span></li>';
      }).join('');
    }
    if (total) total.textContent = '$' + cart.total.toFixed(0);
  }
  document.addEventListener('click', function (event) {
    var add = event.target.closest ? event.target.closest('[data-add-to-cart]') : null;
    if (add) {
      var price = parseFloat(String(add.getAttribute('data-price')).replace(/[^0-9.]/g, '')) || 0;
      cart.items.push({ name: add.getAttribute('data-name') || 'Item', price: '$' + price.toFixed(0) });
      cart.total += price;
      renderCart();
      add.textContent = 'Added';
      setTimeout(function () { add.textContent = 'Add to cart'; }, 1200);
    }
    var filter = event.target.closest ? event.target.closest('[data-filter]') : null;
    if (filter) {
      var tag = filter.getAttribute('data-filter');
      Array.prototype.slice.call(document.querySelectorAll('[data-filter]')).forEach(function (chip) { chip.classList.toggle('is-active', chip === filter); });
      Array.prototype.slice.call(document.querySelectorAll('[data-tag]')).forEach(function (card) {
        var match = tag === 'All' || (card.getAttribute('data-tag') || '').indexOf(tag) > -1;
        card.style.display = match ? '' : 'none';
      });
    }
    var checkout = event.target.closest ? event.target.closest('[data-checkout]') : null;
    if (checkout) {
      checkout.textContent = cart.items.length ? 'Order placed ✓' : 'Cart is empty';
      cart.items = []; cart.total = 0;
      setTimeout(renderCart, 1400);
    }
  });
  renderCart();

  /* ---------- contact form ---------- */
  var form = document.querySelector('[data-contact]');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var note = document.querySelector('[data-contact-note]');
      var value = input && input.value ? input.value : '';
      var valid = /.+@.+\\..+/.test(value);
      if (note) {
        note.textContent = valid
          ? 'Thanks — ${bp.brand} will reach out at ' + value + '.'
          : 'Please enter a valid email address.';
        note.classList.toggle('is-ok', valid);
      }
      if (valid && input) input.value = '';
    });
  }

  ${
    wantsParallax
      ? `
  /* ---------- pointer parallax on decorative layers ---------- */
  if (!reduce) {
    var layers = Array.prototype.slice.call(document.querySelectorAll('.xv-glow'));
    window.addEventListener('pointermove', function (event) {
      var nx = event.clientX / window.innerWidth - 0.5;
      var ny = event.clientY / window.innerHeight - 0.5;
      layers.forEach(function (layer, index) {
        var depth = (index + 1) * 12;
        layer.style.transform = 'translate3d(' + (nx * depth).toFixed(1) + 'px,' + (ny * depth).toFixed(1) + 'px,0)';
      });
    }, { passive: true });
  }`
      : ''
  }

  ${enablePhysics ? physicsScene(bp, bodyCount) : ''}
})();`;
}

function physicsScene(bp: Blueprint, bodyCount: number): string {
  return `
  /* ---------- 3D hero: three.js scene with a rigid-body solver ---------- */
  var canvas = document.getElementById('xv-physics');

  if (canvas) {
    var startScene = function () {
      import('https://esm.sh/three@0.169.0').then(function (THREE) {
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 1.4, 9);

        var hemi = new THREE.HemisphereLight(0xffffff, 0x111133, 1.1);
        scene.add(hemi);
        var key = new THREE.DirectionalLight(0xffffff, 2.1);
        key.position.set(4, 8, 6);
        scene.add(key);
        var rim = new THREE.PointLight(new THREE.Color('${bp.theme.accent2}'), 26, 30);
        rim.position.set(-5, 2, 4);
        scene.add(rim);
        var rim2 = new THREE.PointLight(new THREE.Color('${bp.theme.accent3}'), 18, 30);
        rim2.position.set(5, -2, -2);
        scene.add(rim2);

        var floor = new THREE.Mesh(
          new THREE.CircleGeometry(16, 64),
          new THREE.MeshStandardMaterial({ color: new THREE.Color('${bp.theme.bgAlt}'), roughness: 0.85, metalness: 0.2 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2.4;
        scene.add(floor);

        var grid = new THREE.GridHelper(34, 34, new THREE.Color('${bp.theme.accent}'), new THREE.Color('${bp.theme.border}'));
        grid.position.y = -2.38;
        grid.material.opacity = 0.22;
        grid.material.transparent = true;
        scene.add(grid);

        var cursor = new THREE.Vector2(-10, -10);
        var raycaster = new THREE.Raycaster();

        var isSmall = window.innerWidth < 860;
        var COUNT = Math.min(${Math.max(8, bodyCount)}, isSmall ? 14 : 34);
        var particles = [];
        var meshes = [];
        var bounds = { x: 5.4, y: 2.1, z: 1.6 };

        var geometry = new THREE.IcosahedronGeometry(0.5, isSmall ? 0 : 1);
        var palette = [new THREE.Color('${bp.theme.accent}'), new THREE.Color('${bp.theme.accent2}'), new THREE.Color('${bp.theme.accent3}'), new THREE.Color('#ffffff')];

        for (var i = 0; i < COUNT; i++) {
          var material = new THREE.MeshStandardMaterial({
            color: palette[i % palette.length],
            roughness: 0.18,
            metalness: 0.72,
            flatShading: i % 3 === 0
          });
          var mesh = new THREE.Mesh(geometry, material);
          var radius = 0.28 + Math.random() * 0.36;
          mesh.scale.setScalar(radius / 0.5);
          scene.add(mesh);

          var particle = {
            mesh: mesh,
            radius: radius,
            position: new THREE.Vector3(
              (Math.random() - 0.5) * bounds.x * 2,
              4 + Math.random() * 6,
              (Math.random() - 0.5) * bounds.z * 2
            ),
            velocity: new THREE.Vector3((Math.random() - 0.5) * 1.4, 0, (Math.random() - 0.5) * 1.4),
            spin: new THREE.Vector3((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6)
          };
          particles.push(particle);
          meshes.push(mesh);
        }

        var pointer = { x: 0, y: 0, active: false };
        var impulseStrength = 6.4;

        function pointerImpulse() {
          if (!pointer.active) return;
          raycaster.setFromCamera(cursor, camera);
          var hits = raycaster.intersectObjects(meshes, false);
          if (hits.length > 0) {
            var hit = hits[0];
            var body = null;
            for (var k = 0; k < particles.length; k++) { if (particles[k].mesh === hit.object) { body = particles[k]; break; } }
            if (body) {
              var dir = raycaster.ray.direction.clone().normalize();
              body.velocity.addScaledVector(dir, impulseStrength);
              body.velocity.y += 2.2;
            }
          }
        }

        window.addEventListener('pointerdown', function (event) {
          if (event.target.closest && event.target.closest('a,button,input')) return;
          var rect = canvas.getBoundingClientRect();
          cursor.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          cursor.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          pointer.active = true;
          pointerImpulse();
        }, { passive: true });

        canvas.addEventListener('pointermove', function (event) {
          var rect = canvas.getBoundingClientRect();
          var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          cursor.set(x, y);
          pointer.x = x; pointer.y = y;
          pointer.active = y > -0.2;
        }, { passive: true });
        canvas.addEventListener('pointerleave', function () { pointer.active = false; });

        window.addEventListener('resize', resize);
        function resize() {
          var width = canvas.clientWidth || window.innerWidth;
          var height = canvas.clientHeight || window.innerHeight;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          bounds.x = Math.max(3.4, (camera.aspect * 4.6));
        }
        resize();

        function drop() {
          for (var i = 0; i < particles.length; i++) {
            var body = particles[i];
            body.position.set((Math.random() - 0.5) * bounds.x * 1.6, 5 + Math.random() * 5, (Math.random() - 0.5) * bounds.z * 2);
            body.velocity.set((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3);
          }
        }
        Array.prototype.slice.call(document.querySelectorAll('[data-scene-action]')).forEach(function (button) {
          button.addEventListener('click', function () {
            var action = button.getAttribute('data-scene-action');
            if (action === 'drop') drop();
            else window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' });
          });
        });

        var GRAVITY = ${bp.physics.gravity};
        var RESTITUTION = ${bp.physics.restitution};
        var last = performance.now();
        var accumulator = 0;
        var fixedStep = 1 / 120;

        function simulate(dt) {
          for (var i = 0; i < particles.length; i++) {
            var body = particles[i];
            body.velocity.y += GRAVITY * dt;
            body.position.addScaledVector(body.velocity, dt);

            if (body.position.y - body.radius < -2.35) {
              body.position.y = -2.35 + body.radius;
              body.velocity.y = Math.abs(body.velocity.y) * RESTITUTION;
              body.velocity.x *= 0.985;
              body.velocity.z *= 0.985;
            }
            if (body.position.y + body.radius > 9.5) { body.position.y = 9.5 - body.radius; body.velocity.y = -Math.abs(body.velocity.y) * 0.4; }
            if (Math.abs(body.position.x) + body.radius > bounds.x) {
              body.position.x = Math.sign(body.position.x) * (bounds.x - body.radius);
              body.velocity.x *= -RESTITUTION;
            }
            if (Math.abs(body.position.z) + body.radius > bounds.z) {
              body.position.z = Math.sign(body.position.z) * (bounds.z - body.radius);
              body.velocity.z *= -RESTITUTION;
            }
          }

          /* sphere-sphere collision resolution */
          var passes = particles.length > 20 ? 1 : 2;
          for (var pass = 0; pass < passes; pass++) {
            for (var a = 0; a < particles.length; a++) {
              for (var b = a + 1; b < particles.length; b++) {
                var first = particles[a];
                var second = particles[b];
                var dx = second.position.x - first.position.x;
                var dy = second.position.y - first.position.y;
                var dz = second.position.z - first.position.z;
                var minDist = first.radius + second.radius;
                var distSq = dx * dx + dy * dy + dz * dz;
                if (distSq === 0 || distSq > minDist * minDist) continue;
                var dist = Math.sqrt(distSq);
                var nx = dx / dist, ny = dy / dist, nz = dz / dist;
                var overlap = (minDist - dist) * 0.5;
                first.position.x -= nx * overlap; first.position.y -= ny * overlap; first.position.z -= nz * overlap;
                second.position.x += nx * overlap; second.position.y += ny * overlap; second.position.z += nz * overlap;
                var relative = (second.velocity.x - first.velocity.x) * nx + (second.velocity.y - first.velocity.y) * ny + (second.velocity.z - first.velocity.z) * nz;
                if (relative > 0) continue;
                var impulse = -(1 + RESTITUTION) * relative * 0.5;
                first.velocity.x -= nx * impulse; first.velocity.y -= ny * impulse; first.velocity.z -= nz * impulse;
                second.velocity.x += nx * impulse; second.velocity.y += ny * impulse; second.velocity.z += nz * impulse;
              }
            }
          }
        }

        function frame(now) {
          var dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          accumulator += dt;

          while (accumulator >= fixedStep) {
            simulate(fixedStep);
            accumulator -= fixedStep;
          }

          for (var i = 0; i < particles.length; i++) {
            var body = particles[i];
            body.mesh.position.copy(body.position);
            body.mesh.rotation.x += body.spin.x * dt;
            body.mesh.rotation.y += body.spin.y * dt;
            body.mesh.rotation.z += body.spin.z * dt;
          }

          camera.position.x += (pointer.x * 1.5 - camera.position.x) * 0.04;
          camera.position.y += (1.4 - pointer.y * 1.2 - camera.position.y) * 0.04;
          camera.lookAt(0, 0.2, 0);
          renderer.render(scene, camera);
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }).catch(function () {
        canvas.style.display = 'none';
      });
    };

    if (reduce) {
      canvas.style.display = 'none';
    } else if (typeof IntersectionObserver === 'function') {
      var sceneObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { startScene(); sceneObserver.disconnect(); }
      }, { threshold: 0.05 });
      sceneObserver.observe(canvas);
    } else {
      startScene();
    }
  }`;
}
