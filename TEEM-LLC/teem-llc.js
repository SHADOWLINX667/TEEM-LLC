(function(){
  'use strict';

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $all(selector, context) {
    return Array.from((context || document).querySelectorAll(selector));
  }

  var THEME_STORAGE_KEY = 'teem-theme';
  var darkModeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function getSystemTheme() {
    return darkModeQuery && darkModeQuery.matches ? 'dark' : 'light';
  }

  function getStoredTheme() {
    var storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if(storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return null;
  }

  function resolveTheme() {
    return getStoredTheme() || getSystemTheme();
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    root.classList.remove('dark-mode', 'light-mode');
    if(theme === 'dark') {
      root.classList.add('dark-mode');
    } else {
      root.classList.add('light-mode');
    }
  }

  function updateThemeToggleButton() {
    var themeToggle = $('#theme-toggle');
    if(!themeToggle) return;
    var isDark = document.documentElement.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.setAttribute('aria-pressed', String(isDark));
  }

  function setupThemeToggle() {
    var themeToggle = $('#theme-toggle');
    if(!themeToggle) return;

    themeToggle.addEventListener('click', function() {
      var isDark = document.documentElement.classList.contains('dark-mode');
      var nextTheme = isDark ? 'light' : 'dark';
      applyTheme(nextTheme);
      updateThemeToggleButton();
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    });

    if(darkModeQuery) {
      darkModeQuery.addEventListener('change', function() {
        if(getStoredTheme()) return;
        applyTheme(getSystemTheme());
        updateThemeToggleButton();
      });
    }
  }

  applyTheme(resolveTheme());

  function initFolders() {
    $all('.folder-group').forEach(function(group){
      var header = group.querySelector('.folder-header');
      var body = group.querySelector('.folder-body');
      var countEl = header.querySelector('.folder-count');
      var tiles = group.querySelectorAll('.photo-tile');

      if(countEl) {
        countEl.textContent = tiles.length + (tiles.length === 1 ? ' photo' : ' photos');
      }

      if(body && !body.id) {
        body.id = group.id + '-body';
        header.setAttribute('aria-controls', body.id);
      }

      header.addEventListener('click', function(){
        var expanded = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', String(!expanded));
        group.classList.toggle('open');
      });

      header.addEventListener('keydown', function(event){
        if(event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          header.click();
        }
      });
    });
  }

  var galleryImages = [];
  var currentIndex = -1;
  var lastTrigger = null;

  function rebuildImageList() {
    galleryImages = $all('.photos-grid img').map(function(img){
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
    });
  }

  function showImage() {
    var imageElement = $('#lightbox-img');
    if(!imageElement || currentIndex < 0 || currentIndex >= galleryImages.length) return;
    imageElement.src = galleryImages[currentIndex].src;
    imageElement.alt = galleryImages[currentIndex].alt;
  }

  window.openLightbox = function(tileElement) {
    if(!tileElement) return;

    rebuildImageList();
    lastTrigger = tileElement;

    var img = tileElement.querySelector('img');
    if(!img) return;

    var src = img.getAttribute('src');
    currentIndex = galleryImages.findIndex(function(item){
      return item.src === src || (src && item.src && item.src.endsWith(src));
    });

    if(currentIndex === -1) {
      currentIndex = 0;
    }

    showImage();

    var lightbox = $('#lightbox');
    if(!lightbox) return;

    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';

    var closeButton = $('#lightbox-close');
    if(closeButton) {
      closeButton.focus();
    }
  };

  window.closeLightbox = function() {
    var lightbox = $('#lightbox');
    if(!lightbox) return;

    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');

    var imageElement = $('#lightbox-img');
    if(imageElement) {
      imageElement.src = '';
    }

    document.documentElement.style.overflow = '';

    if(lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus();
    }

    lastTrigger = null;
  };

  function prevImage() {
    if(!galleryImages.length) return;
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    showImage();
  }

  function nextImage() {
    if(!galleryImages.length) return;
    currentIndex = (currentIndex + 1) % galleryImages.length;
    showImage();
  }

  function updateHeroLogoScroll() {
    var wrapper = document.getElementById('heroLogoWrapper');
    if(!wrapper) return;

    var maxScroll = window.innerHeight * 0.7;
    var progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    var scale = 1 - (0.25 * progress);
    var opacity = 1 - (0.7 * progress);

    wrapper.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    wrapper.style.opacity = opacity.toFixed(3);
    document.body.classList.toggle('hero-scrolled', progress >= 0.08);
  }

  function setupNavToggle() {
    var nav = document.querySelector('.site-nav');
    var toggle = document.querySelector('.nav-toggle');
    var links = $all('.nav-links a');

    if(!nav || !toggle) return;

    toggle.addEventListener('click', function() {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('nav-open');
    });

    links.forEach(function(link) {
      link.addEventListener('click', function() {
        nav.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function(event) {
      if(!nav.contains(event.target) && nav.classList.contains('nav-open')) {
        nav.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    initFolders();
    rebuildImageList();
    setupNavToggle();
    setupThemeToggle();
    updateThemeToggleButton();

    updateHeroLogoScroll();
    window.addEventListener('scroll', updateHeroLogoScroll, { passive: true });
    window.addEventListener('resize', updateHeroLogoScroll);

    $all('.photo-tile').forEach(function(tile) {
      tile.setAttribute('tabindex', '0');
      tile.addEventListener('keydown', function(event) {
        if(event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(tile);
        }
      });
    });

    var lightbox = $('#lightbox');
    if(lightbox) {
      lightbox.addEventListener('click', function(event) {
        if(event.target === lightbox) {
          closeLightbox();
        }
      });
    }

    var closeButton = $('#lightbox-close');
    if(closeButton) {
      closeButton.addEventListener('click', function(event) {
        event.stopPropagation();
        closeLightbox();
      });
    }

    var prevButton = $('#lightbox-prev');
    if(prevButton) {
      prevButton.addEventListener('click', function(event) {
        event.stopPropagation();
        prevImage();
      });
    }

    var nextButton = $('#lightbox-next');
    if(nextButton) {
      nextButton.addEventListener('click', function(event) {
        event.stopPropagation();
        nextImage();
      });
    }

    var imageElement = $('#lightbox-img');
    if(imageElement) {
      imageElement.addEventListener('click', function(event) {
        event.stopPropagation();
      });
    }

    document.addEventListener('keydown', function(event) {
      if(!lightbox || !lightbox.classList.contains('active')) return;
      if(event.key === 'Escape') {
        closeLightbox();
      }
      if(event.key === 'ArrowLeft') {
        prevImage();
      }
      if(event.key === 'ArrowRight') {
        nextImage();
      }
    });
  });
})();
