<?php
defined('ABSPATH') || exit;

class Alawi_React_Renderer {

    private static $css = '';
    private static $breakpoints = [
        'tablet' => 768,
        'mobile' => 480,
    ];

    public static function render($elements) {
        if (empty($elements) || !is_array($elements)) return '';
        self::$css = '';
        $html = '';
        foreach ($elements as $el) {
            $html .= self::render_element($el);
        }
        $output = $html;
        if (self::$css) {
            $output .= '<style class="ab-react-styles">' . self::$css . '</style>';
        }
        return $output;
    }

    private static function render_element($el) {
        if (empty($el['type'])) return '';

        $type = $el['type'];
        $id = esc_attr($el['id'] ?? '');
        $props = $el['props'] ?? [];
        $styles = $el['styles'] ?? [];
        $children = $el['children'] ?? [];
        $css_class = trim('ab-r-' . $id . ' ' . esc_attr($styles['cssClass'] ?? ''));
        $css_id = $styles['cssId'] ?? '';
        $id_attr = $css_id ? ' id="' . esc_attr($css_id) . '"' : '';

        self::generate_css($id, $styles, $type, $props);

        switch ($type) {
            case 'section':
            case 'container':
            case 'div':
                return self::render_div($css_class, $id_attr, $children, $styles, $props);
            case 'heading':
                return self::render_heading($css_class, $id_attr, $props, $styles);
            case 'text':
                return self::render_text($css_class, $id_attr, $props);
            case 'image':
                return self::render_image($css_class, $id_attr, $props);
            case 'button':
                return self::render_button($css_class, $id_attr, $props);
            case 'spacer':
                return self::render_spacer($css_class, $id_attr);
            case 'component':
                return self::render_component($css_class, $id_attr, $props);
            case 'logo':
                return self::render_logo($css_class, $id_attr, $props);
            case 'nav-menu':
                return self::render_nav_menu($css_class, $id_attr, $props);
            case 'link':
                return self::render_link($css_class, $id_attr, $props);
            case 'search':
                return self::render_search($css_class, $id_attr, $props);
            case 'icon':
                return self::render_icon($css_class, $id_attr, $props);
            case 'social-icons':
                return self::render_social_icons($css_class, $id_attr, $props);
            case 'badge':
                return self::render_badge($css_class, $id_attr, $props);
            case 'divider':
                return '<hr class="ab-divider ' . esc_attr($css_class) . '"' . $id_attr . '>';
            case 'video':
                return self::render_video($css_class, $id_attr, $props);
            case 'gallery':
                return self::render_gallery($css_class, $id_attr, $props);
            case 'accordion':
                return self::render_accordion($css_class, $id_attr, $props);
            case 'tabs':
                return self::render_tabs($css_class, $id_attr, $props);
            case 'post-title':
                return self::render_post_title($css_class, $id_attr, $props);
            case 'post-content':
                return self::render_post_content($css_class, $id_attr, $props);
            case 'post-excerpt':
                return self::render_post_excerpt($css_class, $id_attr, $props);
            case 'post-meta':
                return self::render_post_meta($css_class, $id_attr, $props);
            case 'featured-image':
                return self::render_featured_image($css_class, $id_attr, $props);
            case 'breadcrumbs':
                return self::render_breadcrumbs($css_class, $id_attr, $props);
            case 'shortcode':
                return self::render_shortcode_element($css_class, $id_attr, $props);
            default:
                return '';
        }
    }

    private static function render_children($children) {
        if (empty($children)) return '';
        $html = '';
        foreach ($children as $child) {
            $html .= self::render_element($child);
        }
        return $html;
    }

    private static function render_div($class, $id_attr, $children, $styles = [], $props = []) {
        $div_type = sanitize_text_field($props['divType'] ?? 'div');
        $semantic_tags = ['section', 'header', 'footer', 'main', 'aside', 'article', 'nav'];
        $tag = in_array($div_type, $semantic_tags) ? $div_type : 'div';
        $type_class = esc_attr($div_type);

        $loop_enabled = ($props['loopEnabled'] ?? '') === 'true';
        if ($loop_enabled && !empty($children)) {
            $post_type = sanitize_text_field($props['loopPostType'] ?? 'post');
            $count = absint($props['loopCount'] ?? 6);
            $paged = max(1, absint(get_query_var('paged', 1)));
            $pagination_type = sanitize_text_field($props['paginationType'] ?? 'none');

            $query_args = [
                'post_type'      => $post_type,
                'posts_per_page' => $count ?: 6,
                'post_status'    => 'publish',
                'paged'          => $paged,
            ];
            $query = new WP_Query($query_args);

            $html = '<' . $tag . ' class="' . esc_attr($type_class) . ' ab-loop ' . esc_attr($class) . '"' . $id_attr
                . ' data-post-type="' . esc_attr($post_type) . '"'
                . ' data-per-page="' . esc_attr($count) . '"'
                . ' data-pagination="' . esc_attr($pagination_type) . '"'
                . '>';

            if ($query->have_posts()) {
                $html .= '<div class="ab-loop__items">';
                while ($query->have_posts()) {
                    $query->the_post();
                    self::$post_data_cache = [];
                    $html .= self::render_children($children);
                }
                wp_reset_postdata();
                $html .= '</div>';

                if ($pagination_type !== 'none') {
                    $html .= self::render_pagination($query, $paged, $pagination_type);
                }
            } else {
                $html .= '<div class="ab-loop__empty"><p>No posts found.</p></div>';
            }
            $html .= '</' . $tag . '>';
            return $html;
        }

        return '<' . $tag . ' class="' . esc_attr($type_class) . ' ' . esc_attr($class) . '"' . $id_attr . '>'
            . self::render_children($children)
            . '</' . $tag . '>';
    }

    private static function render_pagination($query, $paged, $type) {
        $max_pages = $query->max_num_pages;
        if ($max_pages <= 1) return '';

        $html = '<nav class="ab-pagination ab-pagination--' . esc_attr($type) . '" aria-label="Pagination" data-max-pages="' . esc_attr($max_pages) . '" data-current="' . esc_attr($paged) . '">';

        switch ($type) {
            case 'numeric':
                $html .= paginate_links([
                    'total'     => $max_pages,
                    'current'   => $paged,
                    'prev_text' => '<i class="fa-solid fa-chevron-left"></i>',
                    'next_text' => '<i class="fa-solid fa-chevron-right"></i>',
                    'type'      => 'list',
                ]);
                break;

            case 'prev-next':
                if ($paged > 1) {
                    $html .= '<a href="' . esc_url(get_pagenum_link($paged - 1)) . '" class="ab-pagination__prev"><i class="fa-solid fa-arrow-left"></i> Previous</a>';
                } else {
                    $html .= '<span class="ab-pagination__prev ab-pagination__disabled"><i class="fa-solid fa-arrow-left"></i> Previous</span>';
                }
                $html .= '<span class="ab-pagination__info">Page ' . $paged . ' of ' . $max_pages . '</span>';
                if ($paged < $max_pages) {
                    $html .= '<a href="' . esc_url(get_pagenum_link($paged + 1)) . '" class="ab-pagination__next">Next <i class="fa-solid fa-arrow-right"></i></a>';
                } else {
                    $html .= '<span class="ab-pagination__next ab-pagination__disabled">Next <i class="fa-solid fa-arrow-right"></i></span>';
                }
                break;

            case 'load-more':
                if ($paged < $max_pages) {
                    $html .= '<button class="ab-pagination__load-more" data-next="' . ($paged + 1) . '"><i class="fa-solid fa-plus"></i> Load More</button>';
                }
                break;

            case 'infinite':
                if ($paged < $max_pages) {
                    $html .= '<div class="ab-pagination__sentinel" data-next="' . ($paged + 1) . '"></div>';
                    $html .= '<div class="ab-pagination__loading" style="display:none"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';
                }
                break;

            default: // 'standard'
                $html .= paginate_links([
                    'total'     => $max_pages,
                    'current'   => $paged,
                    'prev_text' => '&laquo; Previous',
                    'next_text' => 'Next &raquo;',
                    'type'      => 'list',
                ]);
                break;
        }

        $html .= '</nav>';
        return $html;
    }

    private static function render_heading($class, $id_attr, $props, $styles) {
        $tag = in_array($props['tag'] ?? 'h2', ['h1','h2','h3','h4','h5','h6']) ? $props['tag'] : 'h2';
        $text = esc_html(self::resolve_dynamic($props['text'] ?? ''));
        return '<' . $tag . ' class="ab-heading ' . esc_attr($class) . '"' . $id_attr . '>'
            . $text
            . '</' . $tag . '>';
    }

    private static function render_text($class, $id_attr, $props) {
        $content = wp_kses_post(self::resolve_dynamic($props['content'] ?? ''));
        return '<div class="ab-text-el ' . esc_attr($class) . '"' . $id_attr . '>'
            . wpautop($content)
            . '</div>';
    }

    private static function render_image($class, $id_attr, $props) {
        $src = esc_url(self::resolve_dynamic($props['src'] ?? ''));
        $alt = esc_attr(self::resolve_dynamic($props['alt'] ?? ''));
        if (!$src) return '';
        return '<figure class="ab-image-el ' . esc_attr($class) . '"' . $id_attr . '>'
            . '<img src="' . $src . '" alt="' . $alt . '" loading="lazy">'
            . '</figure>';
    }

    private static function render_button($class, $id_attr, $props) {
        $text = esc_html(self::resolve_dynamic($props['text'] ?? ''));
        $url = esc_url(self::resolve_dynamic($props['url'] ?? '#'));
        return '<div class="ab-button-wrap ' . esc_attr($class) . '"' . $id_attr . '>'
            . '<a href="' . $url . '" class="ab-button">' . $text . '</a>'
            . '</div>';
    }

    private static function render_spacer($class, $id_attr) {
        return '<div class="ab-spacer-el ' . esc_attr($class) . '"' . $id_attr . '></div>';
    }

    private static function render_component($class, $id_attr, $props) {
        $comp_id = sanitize_text_field($props['componentId'] ?? '');
        if (!$comp_id) return '';
        $components = get_option('alawi_components', []);
        if (empty($components[$comp_id])) return '';
        $comp = $components[$comp_id];
        return '<div class="ab-component-el ' . esc_attr($class) . '"' . $id_attr . '>'
            . self::render_children($comp['elements'] ?? [])
            . '</div>';
    }

    private static function render_logo($class, $id_attr, $props) {
        $src = esc_url(self::resolve_dynamic($props['src'] ?? ''));
        $alt = esc_attr(self::resolve_dynamic($props['alt'] ?? 'Logo'));
        $url = esc_url($props['url'] ?? '/');
        if (!$src) return '';
        return '<a href="' . $url . '" class="ab-logo ' . esc_attr($class) . '"' . $id_attr . '>'
            . '<img src="' . $src . '" alt="' . $alt . '" loading="lazy">'
            . '</a>';
    }

    private static function render_nav_menu($class, $id_attr, $props) {
        $menu_id = sanitize_text_field($props['menuId'] ?? '');
        $breakpoint = intval($props['mobileBreakpoint'] ?? 768);
        $mobile_style = sanitize_text_field($props['mobileStyle'] ?? 'drawer');
        $toggle_icon = esc_attr($props['toggleIcon'] ?? 'fa-solid fa-bars');
        $close_icon = esc_attr($props['closeIcon'] ?? 'fa-solid fa-xmark');
        $layout = sanitize_text_field($props['layout'] ?? 'horizontal');
        $link_color = sanitize_text_field($props['linkColor'] ?? '');
        $link_hover = sanitize_text_field($props['linkHoverColor'] ?? '');
        $active_color = sanitize_text_field($props['activeColor'] ?? '');
        $toggle_color = sanitize_text_field($props['toggleColor'] ?? '');
        $toggle_size = sanitize_text_field($props['toggleSize'] ?? '24px');
        $dropdown_bg = sanitize_text_field($props['dropdownBg'] ?? '#ffffff');

        $args = ['container' => false, 'menu_class' => 'ab-nm__list', 'echo' => false, 'items_wrap' => '<ul class="%2$s">%3$s</ul>'];
        if ($menu_id) {
            $args['menu'] = $menu_id;
        } else {
            $args['theme_location'] = 'primary';
        }
        $menu_html = wp_nav_menu($args);
        if (!$menu_html) $menu_html = '<ul class="ab-nm__list"></ul>';

        $css_vars = '';
        if ($link_color) $css_vars .= '--ab-nm-link:' . $link_color . ';';
        if ($link_hover) $css_vars .= '--ab-nm-hover:' . $link_hover . ';';
        if ($active_color) $css_vars .= '--ab-nm-active:' . $active_color . ';';
        if ($toggle_color) $css_vars .= '--ab-nm-toggle:' . $toggle_color . ';';
        if ($toggle_size) $css_vars .= '--ab-nm-toggle-size:' . $toggle_size . ';';
        if ($dropdown_bg) $css_vars .= '--ab-nm-dropdown-bg:' . $dropdown_bg . ';';
        $css_vars .= '--ab-nm-bp:' . $breakpoint . 'px;';
        $style_attr = $css_vars ? ' style="' . esc_attr($css_vars) . '"' : '';

        return '<nav class="ab-nm ab-nm--' . esc_attr($layout) . ' ab-nm--' . esc_attr($mobile_style) . ' ' . esc_attr($class) . '"' . $id_attr . $style_attr . ' data-bp="' . $breakpoint . '">'
            . '<button class="ab-nm__toggle" aria-label="Menu" aria-expanded="false" onclick="this.closest(\'.ab-nm\').classList.toggle(\'ab-nm--open\');this.setAttribute(\'aria-expanded\',this.getAttribute(\'aria-expanded\')===\'true\'?\'false\':\'true\')">'
            . '<i class="ab-nm__toggle-open ' . $toggle_icon . '"></i>'
            . '<i class="ab-nm__toggle-close ' . $close_icon . '"></i>'
            . '</button>'
            . '<div class="ab-nm__drawer">'
            . $menu_html
            . '</div>'
            . '</nav>';
    }

    private static function render_link($class, $id_attr, $props) {
        $text = esc_html(self::resolve_dynamic($props['text'] ?? ''));
        $url = esc_url(self::resolve_dynamic($props['url'] ?? '#'));
        $target = in_array($props['target'] ?? '_self', ['_self', '_blank']) ? ($props['target'] ?? '_self') : '_self';
        $rel = $target === '_blank' ? ' rel="noopener noreferrer"' : '';
        return '<a href="' . $url . '" class="ab-link ' . esc_attr($class) . '"' . $id_attr . ' target="' . esc_attr($target) . '"' . $rel . '>' . $text . '</a>';
    }

    private static function render_search($class, $id_attr, $props) {
        $placeholder = esc_attr(self::resolve_dynamic($props['placeholder'] ?? 'Search...'));
        return '<form role="search" method="get" action="' . esc_url(home_url('/')) . '" class="ab-search ' . esc_attr($class) . '"' . $id_attr . '>'
            . '<input type="search" name="s" placeholder="' . $placeholder . '" class="ab-search__input">'
            . '</form>';
    }

    private static function render_icon($class, $id_attr, $props) {
        $icon_class = sanitize_text_field($props['icon'] ?? 'fa-solid fa-star');
        $label = esc_attr($props['ariaLabel'] ?? '');
        $url = $props['url'] ?? '';
        $inner = '<span class="ab-icon ' . esc_attr($class) . '"' . $id_attr . ($label ? ' aria-label="' . $label . '"' : '') . '><i class="' . esc_attr($icon_class) . '"></i></span>';
        if ($url) {
            return '<a href="' . esc_url($url) . '">' . $inner . '</a>';
        }
        return $inner;
    }

    private static $social_icon_map = [
        'facebook' => 'fa-brands fa-facebook-f',
        'twitter' => 'fa-brands fa-x-twitter',
        'instagram' => 'fa-brands fa-instagram',
        'youtube' => 'fa-brands fa-youtube',
        'linkedin' => 'fa-brands fa-linkedin-in',
        'tiktok' => 'fa-brands fa-tiktok',
        'snapchat' => 'fa-brands fa-snapchat',
        'pinterest' => 'fa-brands fa-pinterest-p',
        'whatsapp' => 'fa-brands fa-whatsapp',
        'telegram' => 'fa-brands fa-telegram',
        'github' => 'fa-brands fa-github',
        'dribbble' => 'fa-brands fa-dribbble',
        'behance' => 'fa-brands fa-behance',
        'discord' => 'fa-brands fa-discord',
        'reddit' => 'fa-brands fa-reddit-alien',
        'email' => 'fa-solid fa-envelope',
        'website' => 'fa-solid fa-globe',
    ];

    private static function render_social_icons($class, $id_attr, $props) {
        $icons = $props['icons'] ?? [];
        if (!is_array($icons)) return '';
        $html = '<div class="ab-social-icons ' . esc_attr($class) . '"' . $id_attr . '>';
        foreach ($icons as $ic) {
            $platform = sanitize_text_field($ic['platform'] ?? '');
            $url = esc_url($ic['url'] ?? '#');
            $icon_class = !empty($ic['icon']) ? sanitize_text_field($ic['icon']) : (self::$social_icon_map[$platform] ?? 'fa-solid fa-link');
            $html .= '<a href="' . $url . '" class="ab-social-icon" aria-label="' . esc_attr($platform) . '" target="_blank" rel="noopener noreferrer"><i class="' . esc_attr($icon_class) . '"></i></a>';
        }
        $html .= '</div>';
        return $html;
    }

    private static function render_badge($class, $id_attr, $props) {
        $text = esc_html(self::resolve_dynamic($props['text'] ?? ''));
        return '<span class="ab-badge ' . esc_attr($class) . '"' . $id_attr . '>' . $text . '</span>';
    }

    private static function render_video($class, $id_attr, $props) {
        $src = esc_url(self::resolve_dynamic($props['src'] ?? ''));
        if (!$src) return '';
        $poster = !empty($props['poster']) ? ' poster="' . esc_url($props['poster']) . '"' : '';
        $autoplay = ($props['autoplay'] ?? '') === 'true' ? ' autoplay' : '';
        $loop = ($props['loop'] ?? '') === 'true' ? ' loop' : '';
        $muted = ($props['muted'] ?? '') === 'true' ? ' muted' : '';
        $controls = ($props['controls'] ?? 'true') !== 'false' ? ' controls' : '';
        return '<div class="ab-video ' . esc_attr($class) . '"' . $id_attr . '>'
            . '<video src="' . $src . '"' . $poster . $autoplay . $loop . $muted . $controls . ' style="width:100%"></video>'
            . '</div>';
    }

    private static function render_gallery($class, $id_attr, $props) {
        $images = $props['images'] ?? [];
        if (!is_array($images) || empty($images)) return '';
        $cols = absint($props['columns'] ?? 3) ?: 3;
        $gap = sanitize_text_field($props['gap'] ?? '8px');
        $html = '<div class="ab-gallery ' . esc_attr($class) . '"' . $id_attr . ' style="display:grid;grid-template-columns:repeat(' . $cols . ',1fr);gap:' . esc_attr($gap) . '">';
        foreach ($images as $img) {
            if (!is_array($img) || empty($img['src'])) continue;
            $html .= '<img src="' . esc_url($img['src']) . '" alt="' . esc_attr($img['alt'] ?? '') . '" loading="lazy" style="width:100%;object-fit:cover;border-radius:4px;aspect-ratio:1">';
        }
        $html .= '</div>';
        return $html;
    }

    private static function render_accordion($class, $id_attr, $props) {
        $items = $props['items'] ?? [];
        if (!is_array($items) || empty($items)) return '';
        $allow_multiple = ($props['allowMultiple'] ?? 'false') === 'true';
        $html = '<div class="ab-accordion ' . esc_attr($class) . '"' . $id_attr . ' data-allow-multiple="' . ($allow_multiple ? 'true' : 'false') . '">';
        foreach ($items as $i => $item) {
            if (!is_array($item)) continue;
            $title = esc_html($item['title'] ?? '');
            $content = wp_kses_post($item['content'] ?? '');
            $open = !empty($item['open']);
            $icon_open = esc_attr($props['iconOpen'] ?? 'fa-solid fa-chevron-up');
            $icon_closed = esc_attr($props['iconClosed'] ?? 'fa-solid fa-chevron-down');
            $html .= '<div class="ab-accordion__item' . ($open ? ' ab-accordion__item--open' : '') . '">'
                . '<button class="ab-accordion__header" type="button" aria-expanded="' . ($open ? 'true' : 'false') . '">'
                . '<span>' . $title . '</span>'
                . '<i class="' . ($open ? $icon_open : $icon_closed) . '"></i>'
                . '</button>'
                . '<div class="ab-accordion__body"' . ($open ? '' : ' style="display:none"') . '>'
                . '<div class="ab-accordion__content">' . wpautop($content) . '</div>'
                . '</div></div>';
        }
        $html .= '</div>';
        return $html;
    }

    private static function render_tabs($class, $id_attr, $props) {
        $items = $props['items'] ?? [];
        if (!is_array($items) || empty($items)) return '';
        $active = absint($props['activeIndex'] ?? 0);
        $html = '<div class="ab-tabs ' . esc_attr($class) . '"' . $id_attr . '>';
        $html .= '<div class="ab-tabs__nav" role="tablist">';
        foreach ($items as $i => $item) {
            if (!is_array($item)) continue;
            $is_active = $i === $active;
            $html .= '<button class="ab-tabs__tab' . ($is_active ? ' ab-tabs__tab--active' : '') . '" role="tab" data-index="' . $i . '" aria-selected="' . ($is_active ? 'true' : 'false') . '">' . esc_html($item['title'] ?? '') . '</button>';
        }
        $html .= '</div>';
        foreach ($items as $i => $item) {
            if (!is_array($item)) continue;
            $is_active = $i === $active;
            $html .= '<div class="ab-tabs__panel' . ($is_active ? ' ab-tabs__panel--active' : '') . '" role="tabpanel"' . ($is_active ? '' : ' style="display:none"') . '>'
                . wpautop(wp_kses_post($item['content'] ?? ''))
                . '</div>';
        }
        $html .= '</div>';
        return $html;
    }

    private static function render_post_title($class, $id_attr, $props) {
        $tag = in_array($props['tag'] ?? 'h1', ['h1','h2','h3','h4','h5','h6']) ? $props['tag'] : 'h1';
        $title = get_the_title();
        if (($props['linkToPost'] ?? 'false') === 'true') {
            $title = '<a href="' . esc_url(get_permalink()) . '">' . esc_html($title) . '</a>';
        } else {
            $title = esc_html($title);
        }
        return '<' . $tag . ' class="ab-post-title ' . esc_attr($class) . '"' . $id_attr . '>' . $title . '</' . $tag . '>';
    }

    private static function render_post_content($class, $id_attr, $props) {
        $content = apply_filters('the_content', get_the_content());
        return '<div class="ab-post-content ' . esc_attr($class) . '"' . $id_attr . '>' . $content . '</div>';
    }

    private static function render_post_excerpt($class, $id_attr, $props) {
        $word_count = absint($props['wordCount'] ?? 30) ?: 30;
        $excerpt = get_the_excerpt();
        if (!$excerpt) {
            $excerpt = wp_trim_words(get_the_content(), $word_count);
        }
        return '<p class="ab-post-excerpt ' . esc_attr($class) . '"' . $id_attr . '>' . esc_html($excerpt) . '</p>';
    }

    private static function render_post_meta($class, $id_attr, $props) {
        $parts = [];
        $sep = sanitize_text_field($props['separator'] ?? ' · ');
        if (($props['showDate'] ?? 'true') !== 'false') {
            $parts[] = '<time datetime="' . esc_attr(get_the_date('c')) . '">' . esc_html(get_the_date()) . '</time>';
        }
        if (($props['showAuthor'] ?? 'true') !== 'false') {
            $parts[] = '<span class="ab-post-meta__author">' . esc_html(get_the_author()) . '</span>';
        }
        if (($props['showCategory'] ?? 'true') !== 'false') {
            $cats = get_the_category();
            if ($cats) {
                $parts[] = '<span class="ab-post-meta__cat">' . esc_html(implode(', ', wp_list_pluck($cats, 'name'))) . '</span>';
            }
        }
        return '<div class="ab-post-meta ' . esc_attr($class) . '"' . $id_attr . '>' . implode(esc_html($sep), $parts) . '</div>';
    }

    private static function render_featured_image($class, $id_attr, $props) {
        $size = sanitize_text_field($props['size'] ?? 'large');
        $thumb = get_the_post_thumbnail(null, $size, ['class' => 'ab-featured-img', 'loading' => 'lazy']);
        if (!$thumb) return '';
        $wrap = '<figure class="ab-featured-image ' . esc_attr($class) . '"' . $id_attr . '>';
        if (($props['linkToPost'] ?? 'false') === 'true') {
            $wrap .= '<a href="' . esc_url(get_permalink()) . '">' . $thumb . '</a>';
        } else {
            $wrap .= $thumb;
        }
        $wrap .= '</figure>';
        return $wrap;
    }

    private static function render_breadcrumbs($class, $id_attr, $props) {
        $sep = esc_html(sanitize_text_field($props['separator'] ?? '/'));
        $show_home = ($props['showHome'] ?? 'true') !== 'false';
        $home_label = esc_html(sanitize_text_field($props['homeLabel'] ?? 'Home'));
        $parts = [];
        if ($show_home) {
            $parts[] = '<a href="' . esc_url(home_url('/')) . '">' . $home_label . '</a>';
        }
        if (is_singular()) {
            $cats = get_the_category();
            if ($cats) {
                $cat = $cats[0];
                $parts[] = '<a href="' . esc_url(get_category_link($cat->term_id)) . '">' . esc_html($cat->name) . '</a>';
            }
            $parts[] = '<span>' . esc_html(get_the_title()) . '</span>';
        } elseif (is_archive()) {
            $parts[] = '<span>' . esc_html(get_the_archive_title()) . '</span>';
        } elseif (is_search()) {
            $parts[] = '<span>Search Results</span>';
        }
        return '<nav class="ab-breadcrumbs ' . esc_attr($class) . '"' . $id_attr . ' aria-label="Breadcrumb">'
            . implode(' <span class="ab-breadcrumbs__sep">' . $sep . '</span> ', $parts)
            . '</nav>';
    }

    // ── Dynamic Data ──────────────────────────────

    private static $post_data_cache = [];

    private static function resolve_dynamic($value, $post_id = null) {
        if (!is_string($value) || strpos($value, '{{') === false) return $value;
        if (!$post_id) $post_id = get_the_ID();

        if (empty(self::$post_data_cache[$post_id])) {
            $post = get_post($post_id);
            if (!$post) return $value;
            $thumb_id = get_post_thumbnail_id($post_id);
            $cats = get_the_category($post_id);
            $tags = get_the_tags($post_id);
            self::$post_data_cache[$post_id] = [
                'post_title'     => $post->post_title,
                'post_content'   => apply_filters('the_content', $post->post_content),
                'post_excerpt'   => $post->post_excerpt ?: wp_trim_words($post->post_content, 30),
                'post_date'      => get_the_date('', $post),
                'post_author'    => get_the_author_meta('display_name', $post->post_author),
                'featured_image' => $thumb_id ? wp_get_attachment_url($thumb_id) : '',
                'post_category'  => $cats ? implode(', ', wp_list_pluck($cats, 'name')) : '',
                'post_tags'      => $tags ? implode(', ', wp_list_pluck($tags, 'name')) : '',
                'site_title'     => get_bloginfo('name'),
                'site_url'       => home_url('/'),
            ];
        }
        $data = self::$post_data_cache[$post_id];

        return preg_replace_callback('/\{\{([a-z_]+)(?::([^}]*))?\}\}/', function ($m) use ($data, $post_id) {
            $tag = $m[1];
            if ($tag === 'custom_field' && !empty($m[2])) {
                return esc_html(get_post_meta($post_id, $m[2], true));
            }
            return isset($data[$tag]) ? $data[$tag] : $m[0];
        }, $value);
    }

    // ── CSS Generation ──────────────────────────────

    private static $css_prop_map = [
        'fontSize'        => 'font-size',
        'fontWeight'      => 'font-weight',
        'lineHeight'      => 'line-height',
        'textAlign'       => 'text-align',
        'backgroundColor' => 'background-color',
        'borderRadius'    => 'border-radius',
        'maxWidth'        => 'max-width',
        'flexDirection'   => 'flex-direction',
        'objectFit'       => 'object-fit',
    ];

    private static function to_css_prop($key) {
        if (isset(self::$css_prop_map[$key])) return self::$css_prop_map[$key];
        return strtolower(preg_replace('/[A-Z]/', '-$0', $key));
    }

    private static function generate_css($id, $styles, $type, $props = []) {
        if (empty($styles)) return;

        $selector = '.ab-r-' . $id;
        $desktop = [];
        $tablet = [];
        $mobile = [];

        $skip = ['cssClass', 'cssId', 'backgroundImage'];

        foreach ($styles as $key => $val) {
            if (in_array($key, $skip, true)) continue;
            $css_prop = self::to_css_prop($key);

            if (is_array($val) && isset($val['desktop'])) {
                if (!empty($val['desktop'])) $desktop[$css_prop] = $val['desktop'];
                if (!empty($val['tablet']))  $tablet[$css_prop]  = $val['tablet'];
                if (!empty($val['mobile']))  $mobile[$css_prop]  = $val['mobile'];
            } elseif (is_string($val) && $val !== '') {
                $desktop[$css_prop] = $val;
            }
        }

        // For buttons, apply styles to the inner <a>
        $btn_selector = ($type === 'button') ? $selector . ' .ab-button' : $selector;

        if ($desktop) {
            self::$css .= $btn_selector . '{' . self::props_to_css($desktop) . '}';
        }
        if ($tablet) {
            self::$css .= '@media(max-width:' . self::$breakpoints['tablet'] . 'px){' . $btn_selector . '{' . self::props_to_css($tablet) . '}}';
        }
        if ($mobile) {
            self::$css .= '@media(max-width:' . self::$breakpoints['mobile'] . 'px){' . $btn_selector . '{' . self::props_to_css($mobile) . '}}';
        }

        if ($type === 'nav-menu' && !empty($props)) {
            $bp = intval($props['mobileBreakpoint'] ?? 768);
            self::$css .= '@media(max-width:' . $bp . 'px){' . $selector . ' .ab-nm__toggle{display:flex;align-items:center;justify-content:center}' . $selector . ' .ab-nm__drawer{display:none}' . $selector . '.ab-nm--open .ab-nm__drawer{display:flex;flex-direction:column}}';
        }
    }

    private static function render_shortcode_element($class, $id_attr, $props) {
        $shortcode = $props['shortcode'] ?? '';
        if (!$shortcode) return '<div class="' . esc_attr($class) . '"' . $id_attr . '></div>';
        return '<div class="' . esc_attr($class) . '"' . $id_attr . '>' . do_shortcode($shortcode) . '</div>';
    }

    private static function props_to_css($props) {
        $parts = [];
        foreach ($props as $prop => $value) {
            $parts[] = esc_attr($prop) . ':' . esc_attr($value);
        }
        return implode(';', $parts);
    }
}
