// Revelado al hacer scroll (respeta prefers-reduced-motion)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduced && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.15 });
      document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
    } else {
      document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    }

    // Coordenadas del cursor en el hero
    const coords = document.getElementById('coords');
    if (coords && !reduced) {
      window.addEventListener('mousemove', (e) => {
        const x = String(Math.round(e.clientX)).padStart(4, '0');
        const y = String(Math.round(e.clientY)).padStart(4, '0');
        coords.textContent = `X:${x} Y:${y}`;
      }, { passive: true });
    }