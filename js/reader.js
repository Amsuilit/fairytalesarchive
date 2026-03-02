// js/reader.js
(function() {
    'use strict';

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const fileUrl = params.get('file');
    const bookKey = 'book_' + (fileUrl || '').replace(/[^a-z0-9]/gi, '_');

    const EL = {
        loading:      document.getElementById('loading'),
        titleDisplay: document.getElementById('title-display'),
        progBar:      document.getElementById('prog-bar'),
        overlay:      document.getElementById('overlay'),
        fontPanel:    document.getElementById('font-panel'),
        themePanel:   document.getElementById('theme-panel'),
        bmPanel:      document.getElementById('bm-panel'),
        bmList:       document.getElementById('bm-list'),
        tocPanel:     document.getElementById('toc-panel'),
        tocList:      document.getElementById('toc-list'),
        viewer:       document.getElementById('viewer'),
        resumeToast:  document.getElementById('resume-toast'),
        stCh:         document.getElementById('st-ch'),
        stSec:        document.getElementById('st-sec'),
        stPct:        document.getElementById('st-pct'),
        stTime:       document.getElementById('st-time'),
        selFont:      document.getElementById('sel-font'),
        selSize:      document.getElementById('sel-size'),
        selLh:        document.getElementById('sel-lh'),
        valSize:      document.getElementById('val-size'),
        valLh:        document.getElementById('val-lh'),
        btnToc:       document.getElementById('btn-toc'),
        btnTheme:     document.getElementById('btn-theme'),
        btnBmAdd:     document.getElementById('btn-bm-add'),
        btnBm:        document.getElementById('btn-bm'),
        btnFont:      document.getElementById('btn-font'),
        btnFs:        document.getElementById('btn-fs'),
        themePanelBtns: document.querySelectorAll('#theme-panel .theme-btn'),
    };

    if (!fileUrl) {
        EL.loading.innerHTML = '<p style="color:#c00;padding:20px">Error: No book URL provided.</p>';
        return;
    }

    let book, rendition;
    let tocEls = [], bookmarks = [];
    let totalSections = 0, currentCFI = null, currentChapter = '—';
    let totalWords = 0;
    let tocOpen = true, fontOpen = false, bmOpen = false, themeOpen = false;

    try { bookmarks = JSON.parse(localStorage.getItem(bookKey + '_bm') || '[]'); } catch(_) {}

    book = ePub(fileUrl);
    rendition = book.renderTo(EL.viewer, { width: '100%', height: '100%', spread: 'none', flow: 'paginated' });
    rendition.display().catch(err => {
        EL.loading.innerHTML = `<p style="color:#c00;padding:20px">Failed to load EPUB.<br><small>${err}</small></p>`;
    });
    book.ready.then(onReady).catch(() => {
        EL.loading.innerHTML = '<p style="color:#c00;padding:20px">Failed to parse EPUB.</p>';
    });

    function onReady() {
        EL.loading.classList.add('gone');
        totalSections = book.spine.items.length;

        let title = 'Untitled';
        try { const m = book.packaging.metadata; if (m && m.title && m.title.trim()) title = m.title; } catch(_) {}
        if (title === 'Untitled')
            title = decodeURIComponent(fileUrl.split('/').pop().replace('.epub', ''))
                        .replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        EL.titleDisplay.textContent = title;
        document.title = title + ' — Reader';

        loadTOC();
        renderBookmarks();
        applyFont();
        estimateWordCount();
        checkResume();
    }

    function estimateWordCount() {
        const sample = book.spine.items.slice(0, Math.min(3, book.spine.items.length));
        let count = 0, n = 0;
        Promise.all(sample.map(item =>
            item.load(book.load.bind(book)).then(doc => {
                count += ((doc.body || doc).textContent || '').split(/\s+/).length;
                n++;
            }).catch(() => {})
        )).then(() => { if (n) totalWords = Math.round(count / n * book.spine.items.length); });
    }

    function updateReadingTime(pct) {
        if (!totalWords || pct == null) return;
        const rem = Math.round((1 - pct) * totalWords / 250);
        EL.stTime.textContent = rem > 1 ? `${rem} min left` : 'Almost done';
    }

    function loadTOC() {
        const toc = book.navigation && book.navigation.toc;
        if (!toc) { EL.tocList.textContent = 'No contents available.'; return; }
        const render = items => {
            if (!items || !items.length) { EL.tocList.textContent = 'No contents available.'; return; }
            const emptyEl = document.getElementById('toc-empty');
            if (emptyEl) emptyEl.remove();

            const frag = document.createDocumentFragment();
            function addItems(arr, depth) {
                arr.forEach(item => {
                    const a = document.createElement('a');
                    a.className = 'toc-item' + (depth === 1 ? ' d1' : depth >= 2 ? ' d2' : '');
                    a.textContent = item.label.trim();
                    a.title       = item.label.trim();
                    a.href        = '#';
                    a.onclick = e => {
                        e.preventDefault();
                        rendition.display(item.href);
                        activateTOC(a);
                        if (window.innerWidth < 640) toggleTOC();
                    };
                    frag.appendChild(a);
                    tocEls.push({ el: a, href: item.href });
                    if (item.subitems && item.subitems.length) addItems(item.subitems, depth + 1);
                });
            }
            addItems(items, 0);
            EL.tocList.appendChild(frag);
        };
        typeof toc.then === 'function' ? toc.then(render) : render(toc);
    }

    function activateTOC(activeEl) {
        tocEls.forEach(t => t.el.classList.remove('active'));
        if (activeEl) activeEl.classList.add('active');
    }

    rendition.on('relocated', loc => {
        if (!loc) return;
        const pct = loc.start.percentage || 0;
        const pctDisplay = Math.round(pct * 100);

        EL.progBar.style.width = pctDisplay + '%';
        EL.stPct.textContent   = pctDisplay + '%';
        EL.stSec.textContent   = `${(loc.start.index || 0) + 1} / ${totalSections}`;
        currentCFI             = loc.start.cfi;

        updateReadingTime(pct);
        try { localStorage.setItem(bookKey + '_pos', currentCFI); } catch(_) {}

        const href = loc.start.href || '';
        const match = tocEls.find(t => href && href.includes(t.href.split('#')[0]));
        if (match) {
            activateTOC(match.el);
            currentChapter = match.el.textContent.trim();
            const ch = currentChapter;
            EL.stCh.textContent = ch.length > 22 ? ch.slice(0, 22) + '…' : ch;
        }
    });

    function checkResume() {
        const saved = localStorage.getItem(bookKey + '_pos');
        if (!saved || saved === 'null') return;
        EL.resumeToast.classList.add('show');
        setTimeout(dismissToast, 8000);
    }

    function resumeReading() {
        const s = localStorage.getItem(bookKey + '_pos');
        if (s) rendition.display(s);
        dismissToast();
    }
    window.resumeReading = resumeReading;

    function dismissToast() {
        EL.resumeToast.classList.remove('show');
    }
    window.dismissToast = dismissToast;

    function go(dir) {
        dir < 0 ? rendition.prev() : rendition.next();
    }
    window.go = go;

    document.addEventListener('keyup', e => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   rendition.prev();
        if (e.key === 'ArrowRight' || e.key === 'PageDown')  rendition.next();
        if (e.key === 'f') toggleFS();
        if (e.key === 'b') addBookmark();
        if (e.key === 'Escape') closeAllPanels();
    });

    let tx = 0, ty = 0;
    document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - tx;
        const dy = e.changedTouches[0].clientY - ty;
        if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
        dx < 0 ? go(1) : go(-1);
    }, { passive: true });

    function addBookmark() {
        if (!currentCFI || bookmarks.find(b => b.cfi === currentCFI)) return;
        bookmarks.push({ cfi: currentCFI, chapter: currentChapter, added: new Date().toLocaleDateString() });
        try { localStorage.setItem(bookKey + '_bm', JSON.stringify(bookmarks)); } catch(_) {}
        renderBookmarks();
        EL.btnBmAdd.classList.add('on');
        setTimeout(() => EL.btnBmAdd.classList.remove('on'), 900);
    }
    window.addBookmark = addBookmark;

    function renderBookmarks() {
        if (!bookmarks.length) {
            EL.bmList.innerHTML = '<div id="bm-empty">No bookmarks yet. Press "Add" to save your position.</div>';
            return;
        }
        const frag = document.createDocumentFragment();
        bookmarks.forEach((bm, i) => {
            const div = document.createElement('div');
            div.className = 'bm-item';
            div.innerHTML = `<div class="bm-text"><div>${bm.chapter || 'Position ' + (i + 1)}</div><div class="bm-chapter">${bm.added}</div></div><button class="bm-del" onclick="deleteBM(${i})">✕</button>`;
            div.onclick = e => {
                if (!e.target.classList.contains('bm-del')) { rendition.display(bm.cfi); toggleBM(); }
            };
            frag.appendChild(div);
        });
        EL.bmList.innerHTML = '';
        EL.bmList.appendChild(frag);
    }

    function deleteBM(i) {
        bookmarks.splice(i, 1);
        try { localStorage.setItem(bookKey + '_bm', JSON.stringify(bookmarks)); } catch(_) {}
        renderBookmarks();
    }
    window.deleteBM = deleteBM;

    const THEMES = {
        light: { bg: '#ffffff', fg: '#000000' },
        dark:  { bg: '#1a1a1a', fg: '#e0e0e0' },
        sepia: { bg: '#f4ecd8', fg: '#5c4a3a' },
        forest: { bg: '#2c3e2c', fg: '#d0d9c0' },
        ocean: { bg: '#003366', fg: '#cce6ff' },
        highcontrast: { bg: '#000000', fg: '#ffff00' },
        vintage: { bg: '#f2e6d8', fg: '#4f3a2b' },
        monochrome: { bg: '#eeeeee', fg: '#222222' },
    };

    function applyFont() {
        if (!rendition) return;

        const family = EL.selFont.value;
        const size   = +EL.selSize.value;
        const lh     = (+EL.selLh.value / 10).toFixed(1);
        
        EL.valSize.textContent = size + 'px';
        EL.valLh.textContent   = lh;
        
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const t = THEMES[theme] || THEMES.light;

        rendition.themes.fontSize(size + 'px');

        const rules = {
            '*': {
                'font-family': `${family} !important`,
                'color': `${t.fg} !important`,
                'line-height': `${lh} !important`,
                'background-color': 'transparent !important' 
            },
            'body': {
                'background-color': `${t.bg} !important`,
                'color': `${t.fg} !important`,
                'padding-bottom': '40px !important'
            },
            'p': { 'font-size': `${size}px !important` },
            'li': { 'font-size': `${size}px !important` },
            'div': { 'font-size': `${size}px !important` },
            'span': { 'color': `${t.fg} !important` }, 
            
            'h1': { 'font-size': `${Math.round(size * 1.6)}px !important` },
            'h2': { 'font-size': `${Math.round(size * 1.4)}px !important` },
            'h3': { 'font-size': `${Math.round(size * 1.2)}px !important` },
            'h4, h5, h6': { 'font-size': `${Math.round(size * 1.1)}px !important` },
            
            'svg text': {
                'fill': `${t.fg} !important`
            }
        };

        rendition.themes.register('custom-reader-theme', rules);
        rendition.themes.select('custom-reader-theme');
    }
    window.applyFont = applyFont;

    window.addEventListener('themeChanged', applyFont);

    function toggleFS() {
        if (!document.fullscreenElement) {
            (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)
                .call(document.documentElement);
            EL.btnFs.textContent = '✕ Full';
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
            EL.btnFs.textContent = 'Full';
        }
    }
    window.toggleFS = toggleFS;

    function toggleTOC() {
        tocOpen = !tocOpen;
        EL.tocPanel.classList.toggle('hidden', !tocOpen);
        EL.btnToc.classList.toggle('on', tocOpen);
    }
    window.toggleTOC = toggleTOC;

    function toggleFont() {
        fontOpen = !fontOpen; bmOpen = false; themeOpen = false;
        EL.fontPanel.classList.toggle('open', fontOpen);
        EL.bmPanel.classList.remove('open');
        EL.themePanel.classList.remove('open');
        EL.overlay.classList.toggle('open', fontOpen);
        EL.btnFont.classList.toggle('on', fontOpen);
        EL.btnBm.classList.remove('on');
        EL.btnTheme.classList.remove('on');
    }
    window.toggleFont = toggleFont;

    function toggleBM() {
        bmOpen = !bmOpen; fontOpen = false; themeOpen = false;
        EL.bmPanel.classList.toggle('open', bmOpen);
        EL.fontPanel.classList.remove('open');
        EL.themePanel.classList.remove('open');
        EL.overlay.classList.toggle('open', bmOpen);
        EL.btnBm.classList.toggle('on', bmOpen);
        EL.btnFont.classList.remove('on');
        EL.btnTheme.classList.remove('on');
    }
    window.toggleBM = toggleBM;

    function toggleTheme() {
        themeOpen = !themeOpen; fontOpen = false; bmOpen = false;
        EL.themePanel.classList.toggle('open', themeOpen);
        EL.fontPanel.classList.remove('open');
        EL.bmPanel.classList.remove('open');
        EL.overlay.classList.toggle('open', themeOpen);
        EL.btnTheme.classList.toggle('on', themeOpen);
        EL.btnFont.classList.remove('on');
        EL.btnBm.classList.remove('on');
    }
    window.toggleTheme = toggleTheme;

    function closeAllPanels() {
        fontOpen = bmOpen = themeOpen = false;
        EL.fontPanel.classList.remove('open');
        EL.bmPanel.classList.remove('open');
        EL.themePanel.classList.remove('open');
        EL.overlay.classList.remove('open');
        EL.btnFont.classList.remove('on');
        EL.btnBm.classList.remove('on');
        EL.btnTheme.classList.remove('on');
    }
    window.closeAllPanels = closeAllPanels;

})();