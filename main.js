    document.getElementById('yr').textContent = new Date().getFullYear();

    /* ===== PRELOADER (bind to real load) ===== */
    const preloader = document.getElementById('preloader');
    const pctEl = document.getElementById('pct');
    const barF = document.getElementById('bar-f');
    const circP = document.getElementById('circle-p');
    const lStatus = document.getElementById('lstatus');
    const circ = 2 * Math.PI * 52;
    const msgs = ['Initializing...','Loading Core...','Connecting...','Injecting Stream...','System Ready'];
    let prog = 0;
    function tickPreloader() {
      prog += 5 + Math.random() * 8;
      // Cap at 90% until actual load finishes
      const cap = window._assetsLoaded ? 100 : 90;
      if (prog > cap) prog = cap;
      const p = Math.floor(prog);
      pctEl.textContent = p + '%';
      barF.style.width = p + '%';
      circP.style.strokeDashoffset = circ - (p / 100) * circ;
      lStatus.textContent = msgs[Math.min(Math.floor(p / 100 * (msgs.length - 1)), msgs.length - 1)];
      if (prog < cap) requestAnimationFrame(() => setTimeout(tickPreloader, 200));
    }
    tickPreloader();
    function finishPreloader() {
      window._assetsLoaded = true;
      const finish = setInterval(() => {
        prog += 8;
        if (prog > 100) prog = 100;
        const p = Math.floor(prog);
        pctEl.textContent = p + '%';
        barF.style.width = p + '%';
        circP.style.strokeDashoffset = circ - (p / 100) * circ;
        lStatus.textContent = p >= 100 ? 'System Ready' : msgs[Math.min(Math.floor(p / 100 * (msgs.length - 1)), msgs.length - 1)];
        if (prog >= 100) { clearInterval(finish); setTimeout(() => preloader.classList.add('loaded'), 500); }
      }, 100);
    }
    window.addEventListener('load', finishPreloader);

    /* ===== 3D CUBE INTERACTIVE ===== */
    const cube = document.getElementById('cube');
    const cubeWrapper = document.getElementById('cubeWrapper');

    // Posisi rotasi untuk setiap sisi
    const faceRotations = {
    front:  { x: 0, y: 0 },
    back:   { x: 0, y: 180 },
    right:  { x: 0, y: -90 },
    left:   { x: 0, y: 90 },
    top:    { x: -90, y: 0 },
    bottom: { x: 90, y: 0 }
    };

    let currentFace = 'front';
    let isDragging = false;
    let startX, startY, currentRotX = -15, currentRotY = 25;
    let targetRotX = -15, targetRotY = 25;

    // Klik pada dot controls
    document.querySelectorAll('.cube-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const face = dot.dataset.target;
        if (faceRotations[face]) {
        currentFace = face;
        targetRotX = faceRotations[face].x;
        targetRotY = faceRotations[face].y;
        
        // Update active dot
        document.querySelectorAll('.cube-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        }
    });
    });

    // Klik pada face cube untuk rotate ke sisi tersebut
    document.querySelectorAll('.cube-face').forEach(face => {
    face.addEventListener('click', (e) => {
        e.stopPropagation();
        const faceName = face.dataset.face;
        if (faceRotations[faceName]) {
        currentFace = faceName;
        targetRotX = faceRotations[faceName].x;
        targetRotY = faceRotations[faceName].y;
        
        document.querySelectorAll('.cube-dot').forEach(d => d.classList.remove('active'));
        document.querySelector(`.cube-dot[data-target="${faceName}"]`)?.classList.add('active');
        }
    });
    });

    // Drag untuk rotate manual
    cubeWrapper.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    cubeWrapper.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    targetRotY += deltaX * 0.5;
    targetRotX -= deltaY * 0.5;
    
    startX = e.clientX;
    startY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
    isDragging = false;
    cubeWrapper.style.cursor = 'grab';
    });

    // Touch support
    cubeWrapper.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    const deltaY = e.touches[0].clientY - startY;
    
    targetRotY += deltaX * 0.5;
    targetRotX -= deltaY * 0.5;
    
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', () => {
    isDragging = false;
    });

    // Smooth animation loop — pause when offscreen
    let cubeVisible = true;
    const cubeVisObserver = new IntersectionObserver(([entry]) => {
      cubeVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    cubeVisObserver.observe(cubeWrapper);

    function animateCube() {
      if (cubeVisible) {
        currentRotX += (targetRotX - currentRotX) * 0.08;
        currentRotY += (targetRotY - currentRotY) * 0.08;
        if (isDragging) { cube.style.animation = 'none'; }
        else { cube.style.animation = ''; }
        cube.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
      }
      requestAnimationFrame(animateCube);
    }
    animateCube();

    /* ===== FLICKER GRID ON SCROLL (CANVAS) ===== */
    const flickerCanvas = document.getElementById('flickerCanvas');
    const fctx = flickerCanvas.getContext('2d');
    const cellSize = 60;
    let fCols, fRows;
    let flickerCells = []; // {x, y, alpha, targetAlpha, decay}

    function resizeFlickerCanvas() {
      flickerCanvas.width = window.innerWidth;
      flickerCanvas.height = window.innerHeight;
      fCols = Math.ceil(flickerCanvas.width / cellSize) + 1;
      fRows = Math.ceil(flickerCanvas.height / cellSize) + 1;
      flickerCells = [];
      for (let r = 0; r < fRows; r++) {
        for (let c = 0; c < fCols; c++) {
          flickerCells.push({ x: c * cellSize, y: r * cellSize, alpha: 0, targetAlpha: 0, decay: 0.95 });
        }
      }
    }
    resizeFlickerCanvas();
    window.addEventListener('resize', resizeFlickerCanvas);

    // Activate when past hero
    const flickerObserver = new IntersectionObserver(([entry]) => {
      flickerCanvas.classList.toggle('active', !entry.isIntersecting);
    }, { threshold: 0.1 });
    flickerObserver.observe(document.getElementById('hero'));

    // Wave effect on scroll
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
      const scrollDelta = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      if (scrollDelta > 2) {
        const numActive = Math.min(Math.floor(scrollDelta * 2), 20);
        for (let i = 0; i < numActive; i++) {
          const idx = Math.floor(Math.random() * flickerCells.length);
          flickerCells[idx].alpha = 0.6 + Math.random() * 0.4;
          flickerCells[idx].decay = 0.92 + Math.random() * 0.04;
        }
        // Diagonal wave
        if (scrollDelta > 5) {
          const waveRow = Math.floor(Math.random() * fRows);
          for (let c = 0; c < fCols; c += 2) {
            const idx = waveRow * fCols + c;
            if (idx < flickerCells.length) {
              flickerCells[idx].alpha = 0.8;
              flickerCells[idx].decay = 0.94;
            }
          }
        }
      }
    });

    // Canvas render loop
    function drawFlickerGrid() {
      fctx.clearRect(0, 0, flickerCanvas.width, flickerCanvas.height);
      // Draw grid lines
      fctx.strokeStyle = 'rgba(139,92,246,0.04)';
      fctx.lineWidth = 1;
      for (let x = 0; x < flickerCanvas.width; x += cellSize) {
        fctx.beginPath(); fctx.moveTo(x, 0); fctx.lineTo(x, flickerCanvas.height); fctx.stroke();
      }
      for (let y = 0; y < flickerCanvas.height; y += cellSize) {
        fctx.beginPath(); fctx.moveTo(0, y); fctx.lineTo(flickerCanvas.width, y); fctx.stroke();
      }
      // Draw active cells
      for (const cell of flickerCells) {
        if (cell.alpha > 0.01) {
          fctx.fillStyle = `rgba(139,92,246,${cell.alpha * 0.25})`;
          fctx.fillRect(cell.x + 1, cell.y + 1, cellSize - 2, cellSize - 2);
          fctx.strokeStyle = `rgba(139,92,246,${cell.alpha * 0.5})`;
          fctx.strokeRect(cell.x + 1, cell.y + 1, cellSize - 2, cellSize - 2);
          cell.alpha *= cell.decay;
        }
      }
      requestAnimationFrame(drawFlickerGrid);
    }
    drawFlickerGrid();

    /* ===== SCROLL REVEAL ===== */
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal, .skill-card, .project-card').forEach(el => revealObserver.observe(el));

    /* ===== HEADER SCROLL ===== */
    window.addEventListener('scroll', () => {
      document.getElementById('header').classList.toggle('scrolled', window.scrollY > 50);
    });

    /* ===== SMOOTH SCROLL ===== */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
        // Close mobile nav if open
        document.getElementById('mobileNav')?.classList.remove('active');
        document.getElementById('menuToggle')?.classList.remove('active');
        document.getElementById('menuToggle')?.setAttribute('aria-expanded', 'false');
      });
    });

    /* ===== HAMBURGER MENU ===== */
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    if (menuToggle && mobileNav) {
      menuToggle.addEventListener('click', () => {
        const isOpen = mobileNav.classList.toggle('active');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen);
      });
      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
          mobileNav.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.focus();
        }
      });
    }

    /* ===== SKIP LINK FOCUS ===== */
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('focus', () => { skipLink.style.top = '16px'; });
      skipLink.addEventListener('blur', () => { skipLink.style.top = '-100px'; });
    }