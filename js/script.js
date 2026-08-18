// SEBAS.ENG — interactions (vanilla, sin dependencias)
(function () {
  "use strict";

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ── Revelado al hacer scroll ─────────────────────────────────── */
  function initReveals() {
    var items = document.querySelectorAll(".fade-up");
    if (!items.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = (i % 3) * 0.08 + "s";
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -2% 0px" });

    items.forEach(function (el) { io.observe(el); });

    // Red de seguridad: a los 6s, revela lo que siga oculto y esté a la vista
    setTimeout(function () {
      items.forEach(function (el) {
        if (!el.classList.contains("visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("visible");
        }
      });
    }, 6000);
  }

  /* ── Split-text: reveal por palabras (hero title) ───────────────── */
  function escHTML(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function wrapWords(text) {
    return text.split(/(\s+)/).map(function (w) {
      return /^\s+$/.test(w) || w === "" ? w : '<span class="split-word" aria-hidden="true">' + escHTML(w) + "</span>";
    }).join("");
  }

  function splitWords(el) {
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    var html = Array.prototype.map.call(el.childNodes, function (node) {
      if (node.nodeType === 3) return wrapWords(node.textContent);
      if (node.nodeName === "BR") return "<br>";
      if (node.nodeType === 1) {
        var tag = node.tagName.toLowerCase();
        var cls = node.className ? ' class="' + node.className + '"' : "";
        return "<" + tag + cls + ">" + wrapWords(node.textContent) + "</" + tag + ">";
      }
      return "";
    }).join("");
    el.innerHTML = html;
    return el.querySelectorAll(".split-word");
  }

  function initSplitHero() {
    var el = document.querySelector("[data-split='words']");
    if (!el) return;
    var words = splitWords(el);
    if (reducedMotion) {
      words.forEach(function (w) { w.classList.add("is-in"); });
      return;
    }
    words.forEach(function (w, i) {
      w.style.transitionDelay = (0.15 + i * 0.045) + "s";
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        words.forEach(function (w) { w.classList.add("is-in"); });
      });
    });
  }

  /* ── Cursor personalizado (dos círculos) ─────────────────────────── */
  function initCursor() {
    var root = document.querySelector("[data-cursor-root]");
    if (!root || !fineHover) return;
    document.documentElement.classList.add("has-cursor");

    var ring = root.querySelector(".cursor-ring");
    var dot = root.querySelector(".cursor-dot");
    var tx = 0, ty = 0, rx = 0, ry = 0, firstMove = false;

    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (dot) dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      if (!firstMove) {
        firstMove = true;
        rx = tx; ry = ty;
        if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
        root.classList.add("is-ready");
      }
    }, { passive: true });

    function tick() {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    var HOVERABLES = "a[href], button, .project-frame, [data-magnetic]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(HOVERABLES)) root.classList.add("is-interactive");
    });
    document.addEventListener("mouseout", function (e) {
      var t = e.target.closest(HOVERABLES);
      if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) root.classList.remove("is-interactive");
    });
  }

  /* ── Botones magnéticos ───────────────────────────────────────── */
  function initMagnetic() {
    if (!fineHover) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.dataset.magneticStrength || "0.25");
      var inner = document.createElement("span");
      inner.className = "magnetic-inner";
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add("has-magnetic");

      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * strength;
        ty = (e.clientY - r.top - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("mouseleave", function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      function loop() {
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        inner.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ── Tilt 3D + halo en tarjetas de proyecto ──────────────────────── */
  function initTilt() {
    if (!fineHover) return;
    var MAX = 7;
    document.querySelectorAll(".project-frame:not(.empty)").forEach(function (card) {
      card.classList.add("has-tilt");
      var halo = document.createElement("span");
      halo.className = "frame-halo";
      halo.setAttribute("aria-hidden", "true");
      card.appendChild(halo);

      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      function loop() {
        cx += (tx - cx) * 0.15;
        cy += (ty - cy) * 0.15;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ── Boot ─────────────────────────────────────────────────────── */
  function boot() {
    safe(initReveals, "initReveals");
    safe(initSplitHero, "initSplitHero");
    safe(initCursor, "initCursor");
    safe(initMagnetic, "initMagnetic");
    safe(initTilt, "initTilt");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
