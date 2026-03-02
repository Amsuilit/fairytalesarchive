// js/index.js
(function() {
    'use strict';

    let archiveData = [];
    let currentSort = '';
    let sortAscending = true;
    let searchTimeout = null;
    let downloadMode = false;
    let selectedBooks = new Set();
    const DOM = {};

    function updateSelectedCount() {
        const countSpan = document.getElementById('selected-count');
        if (countSpan) countSpan.textContent = selectedBooks.size;

        const info = document.getElementById('downloadInfo');
        if (downloadMode) {
            info.textContent = `${selectedBooks.size} book(s) selected - Use Select buttons`;
        }

        const downloadActions = document.getElementById('download-actions');
        if (downloadMode && downloadActions) {
            downloadActions.style.display = 'flex';
            document.getElementById('format-selector').style.display = 'none';
        } else if (downloadActions) {
            downloadActions.style.display = 'none';
        }
    }

    window.toggleDownloadMode = function() {
        downloadMode = !downloadMode;
        const btn = document.getElementById('downloadBtn');
        const info = document.getElementById('downloadInfo');
        const downloadActions = document.getElementById('download-actions');

        if (downloadMode) {
            btn.classList.add('selected');
            info.textContent = `${selectedBooks.size} book(s) selected - Use Select buttons`;
            downloadActions.style.display = 'flex';
            document.getElementById('format-selector').style.display = 'none';
            render();
        } else {
            btn.classList.remove('selected');
            info.textContent = 'Click to select books for download';
            selectedBooks.clear();
            downloadActions.style.display = 'none';
            render();
        }
    };

    window.toggleSelect = function(base, event) {
        if (!downloadMode) return;
        event.preventDefault();

        if (selectedBooks.has(base)) {
            selectedBooks.delete(base);
            event.target.classList.remove('selected');
            event.target.textContent = 'Select';
        } else {
            selectedBooks.add(base);
            event.target.classList.add('selected');
            event.target.textContent = 'Selected';
        }

        updateSelectedCount();
    };

    function clearSelection() {
        selectedBooks.clear();
        updateSelectedCount();
        render();
    }

    function showFormatSelector() {
        if (selectedBooks.size === 0) {
            alert('No books selected.');
            return;
        }
        document.getElementById('format-selector').style.display = 'flex';
    }

    function cancelDownload() {
        document.getElementById('format-selector').style.display = 'none';
    }

    function startDownload() {
        const format = document.querySelector('input[name="format"]:checked').value;
        const booksToDownload = Array.from(selectedBooks).map(base =>
            archiveData.find(book => book.base === base)
        ).filter(book => book && book[format]);

        if (booksToDownload.length === 0) {
            alert(`None of the selected books have ${format.toUpperCase()} format.`);
            return;
        }

        booksToDownload.forEach(book => {
            const url = `books/${encodeURIComponent(book.base + '.' + format)}`;
            const a = document.createElement('a');
            a.href = url;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        DOM.searchTitle = document.getElementById('searchTitle');
        DOM.searchAuthor = document.getElementById('searchAuthor');
        DOM.yearFrom = document.getElementById('yearFrom');
        DOM.yearTo = document.getElementById('yearTo');
        DOM.tbody = document.getElementById('library-body');
        DOM.countStr = document.getElementById('book-count');
        DOM.titleHeader = document.getElementById('th-title');
        DOM.yearHeader = document.getElementById('th-year');

        document.getElementById('download-selected-btn').addEventListener('click', showFormatSelector);
        document.getElementById('clear-selection-btn').addEventListener('click', clearSelection);
        document.getElementById('start-download-btn').addEventListener('click', startDownload);
        document.getElementById('cancel-download-btn').addEventListener('click', cancelDownload);
    });

    function parseYear(yearStr) {
        if (!yearStr || yearStr === 'N/A') return 999999;
        const isBC = yearStr.toUpperCase().includes('BC');
        const num = parseInt(yearStr.replace(/[^0-9]/g, ''));
        if (isNaN(num)) return 999999;
        return isBC ? -num : num;
    }

    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(render, 300);
    }
    window.debounceSearch = debounceSearch;

    function updateHeaders() {
        DOM.titleHeader.innerText = 'TITLE';
        DOM.yearHeader.innerText = 'YEAR';
        const arrow = sortAscending ? ' ▲' : ' ▼';
        if (currentSort === 'title') DOM.titleHeader.innerText = 'TITLE' + arrow;
        if (currentSort === 'year') DOM.yearHeader.innerText = 'YEAR' + arrow;
    }

    window.sortBy = function(field) {
        if (currentSort === field) sortAscending = !sortAscending;
        else { currentSort = field; sortAscending = true; }
        archiveData.sort((a, b) => {
            if (field === 'year') {
                if (a._yNum === 999999) return 1;
                if (b._yNum === 999999) return -1;
                return sortAscending ? a._yNum - b._yNum : b._yNum - a._yNum;
            }
            if (a._tUpper < b._tUpper) return sortAscending ? -1 : 1;
            if (a._tUpper > b._tUpper) return sortAscending ? 1 : -1;
            return 0;
        });
        updateHeaders();
        render();
    };

    function render() {
        const titleTerm = DOM.searchTitle.value.toUpperCase();
        const authorTerm = DOM.searchAuthor.value.toUpperCase();
        const yearFromStr = DOM.yearFrom.value.trim();
        const yearToStr = DOM.yearTo.value.trim();
        const minYear = yearFromStr ? parseYear(yearFromStr) : -999999;
        const maxYear = yearToStr ? parseYear(yearToStr) : 999999;

        const isFiltering = titleTerm || authorTerm || yearFromStr || yearToStr;
        const showDividers = currentSort === 'title' && sortAscending && !isFiltering;

        let htmlRows = [], count = 0, currentLetter = '';

        archiveData.forEach(book => {
            if (!book._tUpper.includes(titleTerm)) return;
            if (!book._aUpper.includes(authorTerm)) return;
            const inYear = (!yearFromStr && !yearToStr) || (book._yNum >= minYear && book._yNum <= maxYear);
            if (!inYear) return;

            if (showDividers) {
                const ch = book._tUpper[0];
                if (ch !== currentLetter) {
                    currentLetter = ch;
                    htmlRows.push(`<tr><td colspan="4" class="letter-divider">${ch}</td></tr>`);
                }
            }

            const epubLink = book.epub
                ? `reader.html?file=${encodeURIComponent('books/' + book.base + '.epub')}`
                : null;

            let actionsHtml = '<div class="action-buttons">';

            if (epubLink) {
                actionsHtml += `<a href="${epubLink}" class="action-btn read">Read</a>`;
            }

            if (book.rtf) {
                actionsHtml += `<a href="books/${encodeURIComponent(book.base + '.rtf')}" download class="action-btn">RTF</a>`;
            }

            if (downloadMode) {
                const isSelected = selectedBooks.has(book.base);
                const selectedClass = isSelected ? ' selected' : '';
                const selectText = isSelected ? 'Selected' : 'Select';
                actionsHtml += `<a href="#" onclick="toggleSelect('${book.base}', event)" class="action-btn${selectedClass}">${selectText}</a>`;
            }

            actionsHtml += '</div>';

            htmlRows.push(`<tr>
                <td><span class="title-text">${book.t}</span></td>
                <td>${book.a}</td>
                <td>${book.y}</td>
                <td>${actionsHtml}</td>
            </tr>`);
            count++;
        });

        if (count === 0) {
            htmlRows.push(`<tr><td colspan="4" style="text-align:center;padding:30px;font-style:italic;">No matches found in the archive.</td></tr>`);
        }
        DOM.tbody.innerHTML = htmlRows.join('');
        DOM.countStr.innerText = count;
    }

    function loadData() {
        const script = document.createElement('script');
        script.src = 'data.js?v=' + Date.now();
        script.onload = () => {
            // The data.js script defines a global variable 'archiveData'
            // Assign it to our local variable
            archiveData = window.archiveData;
            archiveData.forEach(book => {
                book._tUpper = (book.t || '').toUpperCase();
                book._aUpper = (book.a || '').toUpperCase();
                book._yNum = parseYear(book.y);
            });
            sortBy('title');
        };
        document.head.appendChild(script);
    }

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    window.onload = loadData;
})();