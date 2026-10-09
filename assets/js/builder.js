document.addEventListener('DOMContentLoaded', function() {
    // Nav menu toggle
    var toggle = document.querySelector('.ab-menu-toggle');
    var nav = document.querySelector('.ab-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }

    // Accordion
    document.querySelectorAll('.ab-accordion').forEach(function(accordion) {
        var allowMultiple = accordion.getAttribute('data-allow-multiple') === 'true';
        accordion.querySelectorAll('.ab-accordion__header').forEach(function(header) {
            header.addEventListener('click', function() {
                var item = header.closest('.ab-accordion__item');
                var body = item.querySelector('.ab-accordion__body');
                var isOpen = item.classList.contains('ab-accordion__item--open');

                if (!allowMultiple) {
                    accordion.querySelectorAll('.ab-accordion__item--open').forEach(function(openItem) {
                        if (openItem !== item) {
                            openItem.classList.remove('ab-accordion__item--open');
                            openItem.querySelector('.ab-accordion__body').style.display = 'none';
                            openItem.querySelector('.ab-accordion__header').setAttribute('aria-expanded', 'false');
                        }
                    });
                }

                if (isOpen) {
                    item.classList.remove('ab-accordion__item--open');
                    body.style.display = 'none';
                    header.setAttribute('aria-expanded', 'false');
                } else {
                    item.classList.add('ab-accordion__item--open');
                    body.style.display = '';
                    header.setAttribute('aria-expanded', 'true');
                }
            });
        });
    });

    // Tabs
    document.querySelectorAll('.ab-tabs').forEach(function(tabsEl) {
        var tabs = tabsEl.querySelectorAll('.ab-tabs__tab');
        var panels = tabsEl.querySelectorAll('.ab-tabs__panel');
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var index = parseInt(tab.getAttribute('data-index'));
                tabs.forEach(function(t, i) {
                    t.classList.toggle('ab-tabs__tab--active', i === index);
                    t.setAttribute('aria-selected', i === index ? 'true' : 'false');
                });
                panels.forEach(function(p, i) {
                    p.classList.toggle('ab-tabs__panel--active', i === index);
                    p.style.display = i === index ? '' : 'none';
                });
            });
        });
    });

    // Load More pagination
    document.querySelectorAll('.ab-pagination__load-more').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var section = btn.closest('.ab-loop');
            if (!section) return;
            var next = parseInt(btn.getAttribute('data-next'));
            var maxPages = parseInt(btn.closest('.ab-pagination').getAttribute('data-max-pages'));
            var container = section.querySelector('.ab-loop__items');
            if (!container) return;

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

            var url = new URL(window.location.href);
            url.searchParams.set('paged', next);

            fetch(url.toString())
                .then(function(r) { return r.text(); })
                .then(function(html) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');
                    var newItems = doc.querySelector('.ab-loop__items');
                    if (newItems) {
                        container.insertAdjacentHTML('beforeend', newItems.innerHTML);
                    }
                    if (next >= maxPages) {
                        btn.closest('.ab-pagination').style.display = 'none';
                    } else {
                        btn.setAttribute('data-next', next + 1);
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-plus"></i> Load More';
                    }
                })
                .catch(function() {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-plus"></i> Load More';
                });
        });
    });

    // Infinite Scroll
    document.querySelectorAll('.ab-pagination__sentinel').forEach(function(sentinel) {
        var section = sentinel.closest('.ab-loop');
        if (!section) return;
        var loading = section.querySelector('.ab-pagination__loading');
        var container = section.querySelector('.ab-loop__items');
        var maxPages = parseInt(sentinel.closest('.ab-pagination').getAttribute('data-max-pages'));
        var isLoading = false;

        var observer = new IntersectionObserver(function(entries) {
            if (!entries[0].isIntersecting || isLoading) return;
            var next = parseInt(sentinel.getAttribute('data-next'));
            if (next > maxPages) { observer.disconnect(); return; }

            isLoading = true;
            if (loading) loading.style.display = '';

            var url = new URL(window.location.href);
            url.searchParams.set('paged', next);

            fetch(url.toString())
                .then(function(r) { return r.text(); })
                .then(function(html) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');
                    var newItems = doc.querySelector('.ab-loop__items');
                    if (newItems && container) {
                        container.insertAdjacentHTML('beforeend', newItems.innerHTML);
                    }
                    if (next >= maxPages) {
                        observer.disconnect();
                        sentinel.closest('.ab-pagination').style.display = 'none';
                    } else {
                        sentinel.setAttribute('data-next', next + 1);
                    }
                    isLoading = false;
                    if (loading) loading.style.display = 'none';
                })
                .catch(function() {
                    isLoading = false;
                    if (loading) loading.style.display = 'none';
                });
        }, { rootMargin: '200px' });

        observer.observe(sentinel);
    });
});
