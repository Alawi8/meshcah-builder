<?php
defined('ABSPATH') || exit;

define('ALAWI_VERSION', '1.0.0');
define('ALAWI_DIR', get_template_directory());
define('ALAWI_URI', get_template_directory_uri());

function alawi_setup() {
    load_theme_textdomain('alawi-builder', ALAWI_DIR . '/languages');
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    add_theme_support('custom-logo', ['height' => 60, 'width' => 200, 'flex-height' => true, 'flex-width' => true]);
    add_theme_support('editor-styles');
    add_theme_support('wp-block-styles');
    add_theme_support('responsive-embeds');
    add_theme_support('align-wide');
    register_nav_menus([
        'primary' => __('Primary Menu', 'alawi-builder'),
        'footer'  => __('Footer Menu', 'alawi-builder'),
    ]);
}
add_action('after_setup_theme', 'alawi_setup');

function alawi_scripts() {
    wp_enqueue_style('alawi-style', get_stylesheet_uri(), [], ALAWI_VERSION);
    wp_enqueue_style('font-awesome-front', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css', [], '6.5.1');
    wp_enqueue_style('alawi-main', ALAWI_URI . '/assets/css/main.css', ['font-awesome-front'], ALAWI_VERSION);
    wp_enqueue_script('alawi-builder-js', ALAWI_URI . '/assets/js/builder.js', [], ALAWI_VERSION, true);
    wp_localize_script('alawi-builder-js', 'alawiBuilder', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('alawi_builder_nonce'),
        'isAdmin' => current_user_can('edit_posts'),
    ]);
}
add_action('wp_enqueue_scripts', 'alawi_scripts');

function alawi_admin_scripts($hook) {
    if ($hook === 'toplevel_page_alawi-editor') {
        return;
    }
    if (!in_array($hook, ['post.php', 'post-new.php'])) return;
    wp_enqueue_style('alawi-admin', ALAWI_URI . '/assets/css/admin.css', [], ALAWI_VERSION);
    wp_enqueue_script('alawi-admin-builder', ALAWI_URI . '/assets/js/admin-builder.js', ['jquery', 'jquery-ui-sortable', 'jquery-ui-draggable', 'jquery-ui-droppable', 'wp-color-picker'], ALAWI_VERSION, true);
    wp_enqueue_style('wp-color-picker');
    wp_localize_script('alawi-admin-builder', 'alawiAdmin', [
        'nonce' => wp_create_nonce('alawi_builder_nonce'),
        'ajaxUrl' => admin_url('admin-ajax.php'),
    ]);
}
add_action('admin_enqueue_scripts', 'alawi_admin_scripts');

function alawi_editor_admin_menu() {
    add_menu_page(
        'Meshcah',
        'Meshcah',
        'edit_posts',
        'alawi-editor',
        'alawi_editor_render_page',
        'dashicons-layout',
        3
    );
    add_submenu_page(
        'alawi-editor',
        'Settings',
        'Settings',
        'edit_theme_options',
        'alawi-settings',
        'alawi_settings_page'
    );
}
add_action('admin_menu', 'alawi_editor_admin_menu');

function alawi_add_edit_with_meshcah_link($actions, $post) {
    if (current_user_can('edit_post', $post->ID)) {
        $url = admin_url('admin.php?page=alawi-editor&post_id=' . $post->ID);
        $actions['edit_meshcah'] = '<a href="' . esc_url($url) . '">Edit with Meshcah</a>';
    }
    return $actions;
}
add_filter('page_row_actions', 'alawi_add_edit_with_meshcah_link', 10, 2);
add_filter('post_row_actions', 'alawi_add_edit_with_meshcah_link', 10, 2);

function alawi_editor_render_page() {
    $post_id = isset($_GET['post_id']) ? absint($_GET['post_id']) : 0;
    if (!$post_id) {
        $filter = isset($_GET['content_type']) ? sanitize_text_field($_GET['content_type']) : 'page';

        echo '<div class="wrap"><h1>Meshcah Builder</h1>';

        // Navigation tabs
        $nav_items = [
            'page' => ['label' => 'Pages', 'icon' => 'dashicons-admin-page'],
            'post' => ['label' => 'Posts', 'icon' => 'dashicons-admin-post'],
        ];
        $theme_types = [
            'header' => ['label' => 'Header', 'icon' => 'dashicons-arrow-up-alt'],
            'footer' => ['label' => 'Footer', 'icon' => 'dashicons-arrow-down-alt'],
            'archive' => ['label' => 'Archives', 'icon' => 'dashicons-archive'],
            'search' => ['label' => 'Search', 'icon' => 'dashicons-search'],
            '404' => ['label' => '404', 'icon' => 'dashicons-dismiss'],
        ];

        echo '<nav class="nav-tab-wrapper" style="margin-bottom:20px">';
        foreach ($nav_items as $key => $info) {
            $active = ($filter === $key) ? ' nav-tab-active' : '';
            $url = admin_url('admin.php?page=alawi-editor&content_type=' . $key);
            echo '<a href="' . esc_url($url) . '" class="nav-tab' . $active . '"><span class="dashicons ' . esc_attr($info['icon']) . '" style="margin-top:4px"></span> ' . esc_html($info['label']) . '</a>';
        }
        foreach ($theme_types as $key => $info) {
            $active = ($filter === $key) ? ' nav-tab-active' : '';
            $url = admin_url('admin.php?page=alawi-editor&content_type=' . $key);
            echo '<a href="' . esc_url($url) . '" class="nav-tab' . $active . '"><span class="dashicons ' . esc_attr($info['icon']) . '" style="margin-top:4px"></span> ' . esc_html($info['label']) . '</a>';
        }
        echo '</nav>';

        if (isset($theme_types[$filter])) {
            $templates = get_posts([
                'post_type'   => 'alawi_theme_tpl',
                'numberposts' => -1,
                'post_status' => 'any',
                'meta_key'    => '_alawi_tpl_type',
                'meta_value'  => $filter,
            ]);

            echo '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
            echo '<h2 style="margin:0">' . esc_html($theme_types[$filter]['label']) . ' Templates</h2>';
            echo '<form method="post" style="display:flex;gap:6px;align-items:center">';
            wp_nonce_field('alawi_create_tpl');
            echo '<input type="hidden" name="alawi_create_tpl" value="1">';
            echo '<input type="hidden" name="tpl_type" value="' . esc_attr($filter) . '">';
            echo '<input type="text" name="tpl_name" placeholder="Template name" required style="width:160px">';
            echo '<button type="submit" class="button button-primary"><span class="dashicons dashicons-plus" style="margin-top:4px"></span> Create</button>';
            echo '</form></div>';

            if (empty($templates)) {
                echo '<p style="color:#666;text-align:center;padding:30px 0">No ' . esc_html(strtolower($theme_types[$filter]['label'])) . ' templates yet — create one above.</p>';
            } else {
                echo '<table class="widefat striped"><thead><tr><th>Title</th><th>Conditions</th><th>Status</th><th style="width:200px">Actions</th></tr></thead><tbody>';
                foreach ($templates as $t) {
                    $edit_url = admin_url('admin.php?page=alawi-editor&post_id=' . $t->ID);
                    $cond = json_decode(get_post_meta($t->ID, '_alawi_tpl_conditions', true), true) ?: [];
                    $cond_text = !empty($cond) ? esc_html(alawi_conditions_summary($cond)) : '<em style="color:#999">No conditions</em>';
                    $status = !empty($cond) ? '<span style="color:#22c55e">● Active</span>' : '<span style="color:#f59e0b">● Inactive</span>';
                    $del_url = wp_nonce_url(admin_url('admin.php?page=alawi-editor&content_type=' . $filter . '&delete_tpl=' . $t->ID), 'alawi_delete_tpl');
                    echo '<tr>';
                    echo '<td><strong>' . esc_html($t->post_title) . '</strong></td>';
                    echo '<td>' . $cond_text . '</td>';
                    echo '<td>' . $status . '</td>';
                    echo '<td>';
                    echo '<a href="' . esc_url($edit_url) . '" class="button button-small button-primary">Edit</a> ';
                    echo '<a href="' . esc_url(admin_url('admin.php?page=alawi-tpl-conditions&post_id=' . $t->ID)) . '" class="button button-small">Conditions</a> ';
                    echo '<a href="' . esc_url($del_url) . '" class="button button-small" onclick="return confirm(\'Delete this template?\')" style="color:#a00">Delete</a>';
                    echo '</td></tr>';
                }
                echo '</tbody></table>';
            }
        } else {
            // Show pages/posts
            $pages = get_posts(['post_type' => $filter, 'numberposts' => 50, 'post_status' => 'any']);
            echo '<table class="widefat striped"><thead><tr><th>Title</th><th>Status</th><th></th></tr></thead><tbody>';
            foreach ($pages as $p) {
                $url = admin_url('admin.php?page=alawi-editor&post_id=' . $p->ID);
                echo '<tr><td>' . esc_html($p->post_title) . '</td><td>' . esc_html($p->post_status) . '</td><td><a href="' . esc_url($url) . '" class="button button-primary">Edit with Meshcah</a></td></tr>';
            }
            if (empty($pages)) {
                echo '<tr><td colspan="3" style="text-align:center;color:#666">No ' . esc_html($filter) . 's found.</td></tr>';
            }
            echo '</tbody></table>';
        }

        echo '</div>';
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        wp_die('Unauthorized');
    }

    $saved = get_post_meta($post_id, '_alawi_builder_data', true);
    $elements = $saved ? json_decode($saved, true) : [];

    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css', [], '6.5.1');
    wp_enqueue_style('alawi-react-editor', ALAWI_URI . '/assets/dist/css/editor.css', ['font-awesome'], ALAWI_VERSION);
    wp_enqueue_script('alawi-react-editor', ALAWI_URI . '/assets/dist/js/editor.js', [], ALAWI_VERSION, true);
    wp_localize_script('alawi-react-editor', 'alawiEditorConfig', [
        'postId'   => $post_id,
        'restUrl'  => rest_url('alawi/v1/'),
        'nonce'    => wp_create_nonce('wp_rest'),
        'elements' => $elements,
    ]);

    echo '<style>#wpcontent{padding:0}#wpbody-content{padding:0}#wpfooter,.notice,.update-nag,#screen-meta{display:none!important}#alawi-editor-root{position:fixed;inset:0;z-index:99999}</style>';
    echo '<div id="alawi-editor-root"></div>';
}

function alawi_register_rest_routes() {
    register_rest_route('alawi/v1', '/pages/(?P<id>\d+)', [
        'methods'  => 'GET',
        'callback' => function ($request) {
            $post_id = $request['id'];
            $post = get_post($post_id);
            if (!$post) return new WP_Error('not_found', 'الصفحة غير موجودة', ['status' => 404]);
            $saved = get_post_meta($post_id, '_alawi_builder_data', true);
            return [
                'id'       => $post_id,
                'title'    => $post->post_title,
                'status'   => $post->post_status,
                'elements' => $saved ? json_decode($saved, true) : [],
            ];
        },
        'permission_callback' => function ($request) {
            return current_user_can('edit_post', $request['id']);
        },
    ]);

    register_rest_route('alawi/v1', '/pages/(?P<id>\d+)', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $post_id = $request['id'];
            $body = $request->get_json_params();
            $elements = isset($body['elements']) ? $body['elements'] : $body;

            $sanitized = alawi_sanitize_elements($elements);
            update_post_meta($post_id, '_alawi_builder_data', wp_json_encode($sanitized, JSON_UNESCAPED_UNICODE));
            update_post_meta($post_id, '_alawi_use_builder', '1');

            return ['success' => true, 'elements' => $sanitized];
        },
        'permission_callback' => function ($request) {
            return current_user_can('edit_post', $request['id']);
        },
    ]);

    // Templates
    register_rest_route('alawi/v1', '/templates', [
        'methods'  => 'GET',
        'callback' => function () {
            $templates = get_option('alawi_templates', []);
            return is_array($templates) ? array_values($templates) : [];
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    register_rest_route('alawi/v1', '/templates', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $data = $request->get_json_params();
            $templates = get_option('alawi_templates', []);
            if (!is_array($templates)) $templates = [];
            $tpl = [
                'id'       => sanitize_text_field($data['id'] ?? ''),
                'name'     => sanitize_text_field($data['name'] ?? ''),
                'category' => sanitize_text_field($data['category'] ?? 'section'),
                'elements' => alawi_sanitize_elements($data['elements'] ?? []),
                'created'  => absint($data['created'] ?? time()),
            ];
            $templates[$tpl['id']] = $tpl;
            update_option('alawi_templates', $templates);
            return ['success' => true];
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    register_rest_route('alawi/v1', '/templates/(?P<id>[a-zA-Z0-9_]+)', [
        'methods'  => 'DELETE',
        'callback' => function ($request) {
            $templates = get_option('alawi_templates', []);
            if (!is_array($templates)) $templates = [];
            unset($templates[$request['id']]);
            update_option('alawi_templates', $templates);
            return ['success' => true];
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    // Post Dynamic Data
    register_rest_route('alawi/v1', '/post-data/(?P<id>\d+)', [
        'methods'  => 'GET',
        'callback' => function ($request) {
            $post_id = $request['id'];
            $post = get_post($post_id);
            if (!$post) return new WP_Error('not_found', 'Not found', ['status' => 404]);

            $thumb_id = get_post_thumbnail_id($post_id);
            $thumb_url = $thumb_id ? wp_get_attachment_url($thumb_id) : '';
            $cats = get_the_category($post_id);
            $tags = get_the_tags($post_id);
            $author = get_the_author_meta('display_name', $post->post_author);

            $data = [
                'post_title'     => $post->post_title,
                'post_content'   => apply_filters('the_content', $post->post_content),
                'post_excerpt'   => $post->post_excerpt ?: wp_trim_words($post->post_content, 30),
                'post_date'      => get_the_date('', $post),
                'post_author'    => $author,
                'featured_image' => $thumb_url,
                'post_category'  => $cats ? implode(', ', wp_list_pluck($cats, 'name')) : '',
                'post_tags'      => $tags ? implode(', ', wp_list_pluck($tags, 'name')) : '',
                'site_title'     => get_bloginfo('name'),
                'site_url'       => home_url('/'),
                'permalink'      => get_permalink($post_id),
            ];

            $custom_fields = get_post_custom($post_id);
            if ($custom_fields) {
                foreach ($custom_fields as $key => $values) {
                    if (strpos($key, '_') === 0) continue;
                    $data['cf_' . $key] = $values[0] ?? '';
                }
            }

            return $data;
        },
        'permission_callback' => function ($request) {
            return current_user_can('edit_post', $request['id']);
        },
    ]);

    // Components
    register_rest_route('alawi/v1', '/components', [
        'methods'  => 'GET',
        'callback' => function () {
            $components = get_option('alawi_components', []);
            return is_array($components) ? array_values($components) : [];
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    register_rest_route('alawi/v1', '/components', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $data = $request->get_json_params();
            $components = get_option('alawi_components', []);
            if (!is_array($components)) $components = [];
            $comp = [
                'id'       => sanitize_text_field($data['id'] ?? ''),
                'name'     => sanitize_text_field($data['name'] ?? ''),
                'elements' => alawi_sanitize_elements($data['elements'] ?? []),
                'created'  => absint($data['created'] ?? time()),
            ];
            $components[$comp['id']] = $comp;
            update_option('alawi_components', $components);
            return ['success' => true];
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    register_rest_route('alawi/v1', '/components/(?P<id>[a-zA-Z0-9_]+)', [
        'methods'  => 'DELETE',
        'callback' => function ($request) {
            $components = get_option('alawi_components', []);
            if (!is_array($components)) $components = [];
            unset($components[$request['id']]);
            update_option('alawi_components', $components);
            return ['success' => true];
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    // Preview render endpoint
    register_rest_route('alawi/v1', '/preview/(?P<id>\d+)', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $post_id = $request['id'];
            $elements = $request->get_json_params();
            $sanitized = alawi_sanitize_elements($elements);
            require_once ALAWI_DIR . '/inc/react-renderer.php';
            $html = Alawi_React_Renderer::render($sanitized);
            $post = get_post($post_id);
            $title = $post ? $post->post_title : '';
            return ['html' => $html, 'title' => $title];
        },
        'permission_callback' => function ($request) {
            return current_user_can('edit_post', $request['id']);
        },
    ]);

    // Pages list for navigation
    register_rest_route('alawi/v1', '/pages-list', [
        'methods'  => 'GET',
        'callback' => function () {
            $items = [];

            $pages = get_posts(['post_type' => 'page', 'numberposts' => 50, 'post_status' => 'any', 'orderby' => 'title', 'order' => 'ASC']);
            foreach ($pages as $p) {
                $items[] = [
                    'id'      => $p->ID,
                    'title'   => $p->post_title,
                    'status'  => $p->post_status,
                    'type'    => 'page',
                    'editUrl' => admin_url('admin.php?page=alawi-editor&post_id=' . $p->ID),
                    'viewUrl' => get_permalink($p->ID),
                ];
            }

            $posts = get_posts(['post_type' => 'post', 'numberposts' => 20, 'post_status' => 'any', 'orderby' => 'date', 'order' => 'DESC']);
            foreach ($posts as $p) {
                $items[] = [
                    'id'      => $p->ID,
                    'title'   => $p->post_title,
                    'status'  => $p->post_status,
                    'type'    => 'post',
                    'editUrl' => admin_url('admin.php?page=alawi-editor&post_id=' . $p->ID),
                    'viewUrl' => get_permalink($p->ID),
                ];
            }

            $tpls = get_posts(['post_type' => 'alawi_theme_tpl', 'numberposts' => 50, 'post_status' => 'any']);
            foreach ($tpls as $t) {
                $items[] = [
                    'id'      => $t->ID,
                    'title'   => $t->post_title,
                    'status'  => $t->post_status,
                    'type'    => 'alawi_theme_tpl',
                    'editUrl' => admin_url('admin.php?page=alawi-editor&post_id=' . $t->ID),
                    'viewUrl' => '',
                ];
            }

            return $items;
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    // Builder settings
    register_rest_route('alawi/v1', '/settings', [
        'methods'  => 'GET',
        'callback' => function () {
            return get_option('alawi_builder_settings', [
                'autosaveEnabled'  => true,
                'autosaveInterval' => 30,
                'headerTemplateId' => 0,
                'footerTemplateId' => 0,
            ]);
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    register_rest_route('alawi/v1', '/settings', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $data = $request->get_json_params();
            $settings = [
                'autosaveEnabled'  => !empty($data['autosaveEnabled']),
                'autosaveInterval' => max(10, absint($data['autosaveInterval'] ?? 30)),
                'headerTemplateId' => absint($data['headerTemplateId'] ?? 0),
                'footerTemplateId' => absint($data['footerTemplateId'] ?? 0),
            ];
            update_option('alawi_builder_settings', $settings);
            return ['success' => true];
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    // Theme install endpoint
    register_rest_route('alawi/v1', '/theme-install', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $data = $request->get_json_params();
            $slug = sanitize_text_field($data['slug'] ?? '');
            $label = sanitize_text_field($data['label'] ?? $slug);
            $elements = alawi_sanitize_elements($data['elements'] ?? []);
            $theme_id = sanitize_text_field($data['themeId'] ?? '');
            $theme_name = sanitize_text_field($data['themeName'] ?? '');

            if (!$slug) {
                return new WP_Error('invalid', 'Missing slug', ['status' => 400]);
            }

            // Find existing template of this type
            $existing = get_posts([
                'post_type'   => 'alawi_theme_tpl',
                'numberposts' => 1,
                'post_status' => 'any',
                'meta_key'    => '_alawi_tpl_type',
                'meta_value'  => $slug,
            ]);

            if (!empty($existing)) {
                $post_id = $existing[0]->ID;
                wp_update_post(['ID' => $post_id, 'post_title' => $label . ' (' . $theme_name . ')']);
            } else {
                $post_id = wp_insert_post([
                    'post_type'   => 'alawi_theme_tpl',
                    'post_title'  => $label . ' (' . $theme_name . ')',
                    'post_status' => 'publish',
                ]);
                if (is_wp_error($post_id)) {
                    return new WP_Error('create_failed', 'Failed to create template', ['status' => 500]);
                }
                update_post_meta($post_id, '_alawi_tpl_type', $slug);
            }

            update_post_meta($post_id, '_alawi_builder_data', wp_json_encode($elements, JSON_UNESCAPED_UNICODE));
            update_post_meta($post_id, '_alawi_use_builder', '1');
            update_post_meta($post_id, '_alawi_theme_source', $theme_id);

            // Auto-activate header/footer
            if (in_array($slug, ['header', 'footer'], true)) {
                update_post_meta($post_id, '_alawi_tpl_conditions', wp_json_encode([['type' => 'all']]));
            }

            return ['success' => true, 'postId' => $post_id];
        },
        'permission_callback' => function () {
            return current_user_can('edit_theme_options');
        },
    ]);

    // Keep legacy endpoint for backwards compatibility
    register_rest_route('alawi/v1', '/save/(?P<id>\d+)', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $post_id = $request['id'];
            $elements = $request->get_json_params();
            $sanitized = alawi_sanitize_elements($elements);
            update_post_meta($post_id, '_alawi_builder_data', wp_json_encode($sanitized, JSON_UNESCAPED_UNICODE));
            update_post_meta($post_id, '_alawi_use_builder', '1');
            return ['success' => true];
        },
        'permission_callback' => function ($request) {
            return current_user_can('edit_post', $request['id']);
        },
    ]);
    // Render shortcode preview
    register_rest_route('alawi/v1', '/render-shortcode', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $data = $request->get_json_params();
            $shortcode = sanitize_text_field($data['shortcode'] ?? '');
            if (!$shortcode) return new WP_Error('missing', 'No shortcode', ['status' => 400]);
            $html = do_shortcode($shortcode);
            return ['html' => $html];
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    register_rest_route('alawi/v1', '/menus', [
        'methods'  => 'GET',
        'callback' => function () {
            $menus = wp_get_nav_menus();
            $locations = get_nav_menu_locations();
            $registered = get_registered_nav_menus();
            $result = [];
            foreach ($menus as $menu) {
                $items = wp_get_nav_menu_items($menu->term_id);
                $menu_items = [];
                if ($items) {
                    foreach ($items as $item) {
                        $menu_items[] = [
                            'id'     => $item->ID,
                            'title'  => $item->title,
                            'url'    => $item->url,
                            'parent' => (int) $item->menu_item_parent,
                        ];
                    }
                }
                $location = '';
                foreach ($locations as $loc => $id) {
                    if ($id === $menu->term_id) { $location = $loc; break; }
                }
                $result[] = [
                    'id'       => $menu->term_id,
                    'name'     => $menu->name,
                    'slug'     => $menu->slug,
                    'location' => $location,
                    'locationLabel' => $location && isset($registered[$location]) ? $registered[$location] : '',
                    'items'    => $menu_items,
                ];
            }
            return $result;
        },
        'permission_callback' => function () {
            return current_user_can('edit_theme_options');
        },
    ]);
}
add_action('rest_api_init', 'alawi_register_rest_routes');

function alawi_sanitize_elements($elements) {
    if (!is_array($elements)) return [];

    $allowed_types = ['section', 'container', 'div', 'heading', 'text', 'image', 'button', 'spacer', 'component', 'logo', 'nav-menu', 'link', 'search', 'icon', 'social-icons', 'badge', 'divider', 'video', 'gallery', 'accordion', 'tabs', 'post-title', 'post-content', 'post-excerpt', 'post-meta', 'featured-image', 'breadcrumbs', 'shortcode'];
    $sanitized = [];

    foreach ($elements as $el) {
        if (!is_array($el) || empty($el['type'])) continue;
        if (!in_array($el['type'], $allowed_types, true)) continue;

        $clean = [
            'id'       => sanitize_text_field($el['id'] ?? ''),
            'type'     => $el['type'],
            'props'    => alawi_sanitize_props($el['type'], $el['props'] ?? []),
            'styles'   => alawi_sanitize_styles($el['styles'] ?? []),
            'children' => alawi_sanitize_elements($el['children'] ?? []),
        ];
        $sanitized[] = $clean;
    }

    return $sanitized;
}

function alawi_sanitize_props($type, $props) {
    if (!is_array($props)) return [];
    $clean = [];
    foreach ($props as $key => $val) {
        $k = sanitize_text_field($key);
        if ($k === 'content') {
            $clean[$k] = wp_kses_post($val);
        } elseif ($k === 'src' || $k === 'url' || $k === 'poster') {
            $clean[$k] = esc_url_raw($val);
        } elseif (($k === 'items' || $k === 'images' || $k === 'icons') && is_array($val)) {
            $clean[$k] = alawi_sanitize_array_prop($val);
        } else {
            $clean[$k] = is_string($val) ? sanitize_text_field($val) : $val;
        }
    }
    return $clean;
}

function alawi_sanitize_array_prop($arr) {
    if (!is_array($arr)) return [];
    $clean = [];
    foreach ($arr as $item) {
        if (!is_array($item)) continue;
        $c = [];
        foreach ($item as $k => $v) {
            $sk = sanitize_text_field($k);
            if ($sk === 'content') {
                $c[$sk] = wp_kses_post($v);
            } elseif ($sk === 'src' || $sk === 'url') {
                $c[$sk] = esc_url_raw($v);
            } elseif (is_bool($v)) {
                $c[$sk] = $v;
            } else {
                $c[$sk] = is_string($v) ? sanitize_text_field($v) : $v;
            }
        }
        $clean[] = $c;
    }
    return $clean;
}

function alawi_sanitize_styles($styles) {
    if (!is_array($styles)) return [];
    $clean = [];
    foreach ($styles as $key => $val) {
        $k = sanitize_text_field($key);
        if (is_array($val)) {
            // Responsive value: {desktop, tablet, mobile}
            $rv = [];
            foreach ($val as $device => $dval) {
                $rv[sanitize_text_field($device)] = sanitize_text_field($dval);
            }
            $clean[$k] = $rv;
        } else {
            $clean[$k] = sanitize_text_field($val);
        }
    }
    return $clean;
}



// ── Settings Page ───────────────────────────────────────

function alawi_settings_page() {
    if (!current_user_can('edit_theme_options')) {
        wp_die('Unauthorized');
    }

    // Handle form submit
    if (isset($_POST['alawi_save_settings']) && wp_verify_nonce($_POST['_wpnonce'], 'alawi_save_settings')) {
        $settings = [
            'autosaveEnabled'  => !empty($_POST['autosave_enabled']),
            'autosaveInterval' => max(10, absint($_POST['autosave_interval'] ?? 30)),
            'headerTemplateId' => absint($_POST['header_template_id'] ?? 0),
            'footerTemplateId' => absint($_POST['footer_template_id'] ?? 0),
            'headTags'         => wp_kses($_POST['head_tags'] ?? '', [
                'meta'   => ['name' => true, 'content' => true, 'charset' => true, 'property' => true],
                'link'   => ['rel' => true, 'href' => true, 'type' => true, 'media' => true],
                'script' => ['src' => true, 'async' => true, 'defer' => true, 'type' => true],
                'style'  => ['type' => true],
                'noscript' => [],
            ]),
            'bodyStartTags'    => wp_kses_post($_POST['body_start_tags'] ?? ''),
            'bodyEndTags'      => wp_kses_post($_POST['body_end_tags'] ?? ''),
            'customCss'        => wp_strip_all_tags($_POST['custom_css'] ?? ''),
        ];
        update_option('alawi_builder_settings', $settings);
        echo '<div class="notice notice-success"><p>تم حفظ الإعدادات بنجاح</p></div>';
    }

    $settings = get_option('alawi_builder_settings', []);
    $defaults = [
        'autosaveEnabled'  => true,
        'autosaveInterval' => 30,
        'headerTemplateId' => 0,
        'footerTemplateId' => 0,
        'headTags'         => '',
        'bodyStartTags'    => '',
        'bodyEndTags'      => '',
        'customCss'        => '',
    ];
    $s = wp_parse_args($settings, $defaults);

    // Get template options for header/footer
    $header_templates = get_posts([
        'post_type' => 'alawi_theme_tpl', 'numberposts' => -1, 'post_status' => 'any',
        'meta_key' => '_alawi_tpl_type', 'meta_value' => 'header',
    ]);
    $footer_templates = get_posts([
        'post_type' => 'alawi_theme_tpl', 'numberposts' => -1, 'post_status' => 'any',
        'meta_key' => '_alawi_tpl_type', 'meta_value' => 'footer',
    ]);

    ?>
    <div class="wrap">
        <h1>Meshcah — الإعدادات</h1>

        <form method="post">
            <?php wp_nonce_field('alawi_save_settings'); ?>
            <input type="hidden" name="alawi_save_settings" value="1">

            <!-- Autosave -->
            <div class="ab-settings-card">
                <h2><span class="dashicons dashicons-backup" style="margin-top:2px"></span> الحفظ التلقائي</h2>
                <table class="form-table">
                    <tr>
                        <th>تفعيل الحفظ التلقائي</th>
                        <td>
                            <label>
                                <input type="checkbox" name="autosave_enabled" value="1" <?php checked($s['autosaveEnabled']); ?>>
                                حفظ التغييرات تلقائياً أثناء التحرير
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th>الفاصل الزمني (ثواني)</th>
                        <td>
                            <input type="number" name="autosave_interval" value="<?php echo esc_attr($s['autosaveInterval']); ?>" min="10" max="300" class="small-text">
                            <p class="description">كم ثانية بين كل حفظ تلقائي (الحد الأدنى 10)</p>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Header/Footer Templates -->
            <div class="ab-settings-card">
                <h2><span class="dashicons dashicons-welcome-widgets-menus" style="margin-top:2px"></span> قوالب الهيدر والفوتر</h2>
                <table class="form-table">
                    <tr>
                        <th>قالب الهيدر</th>
                        <td>
                            <select name="header_template_id">
                                <option value="0">— بدون هيدر —</option>
                                <?php foreach ($header_templates as $ht) : ?>
                                    <option value="<?php echo esc_attr($ht->ID); ?>" <?php selected($s['headerTemplateId'], $ht->ID); ?>>
                                        <?php echo esc_html($ht->post_title); ?> (ID: <?php echo $ht->ID; ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <a href="<?php echo esc_url(admin_url('admin.php?page=alawi-editor&content_type=header')); ?>" class="button" style="margin-right:8px">إدارة الهيدرات</a>
                        </td>
                    </tr>
                    <tr>
                        <th>قالب الفوتر</th>
                        <td>
                            <select name="footer_template_id">
                                <option value="0">— بدون فوتر —</option>
                                <?php foreach ($footer_templates as $ft) : ?>
                                    <option value="<?php echo esc_attr($ft->ID); ?>" <?php selected($s['footerTemplateId'], $ft->ID); ?>>
                                        <?php echo esc_html($ft->post_title); ?> (ID: <?php echo $ft->ID; ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <a href="<?php echo esc_url(admin_url('admin.php?page=alawi-editor&content_type=footer')); ?>" class="button" style="margin-right:8px">إدارة الفوترات</a>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Head Tags -->
            <div class="ab-settings-card">
                <h2><span class="dashicons dashicons-editor-code" style="margin-top:2px"></span> تاقات الهيدر (Head Tags)</h2>
                <table class="form-table">
                    <tr>
                        <th>أكواد داخل &lt;head&gt;</th>
                        <td>
                            <textarea name="head_tags" rows="6" class="large-text code" placeholder="<!-- مثال: Google Analytics, Meta Tags -->
<meta name=&quot;google-site-verification&quot; content=&quot;...&quot;>
<script async src=&quot;https://www.googletagmanager.com/gtag/js?id=...&quot;></script>"><?php echo esc_textarea($s['headTags']); ?></textarea>
                            <p class="description">أكواد تُضاف داخل &lt;head&gt; مثل: Google Analytics، تحقق Google، Meta tags</p>
                        </td>
                    </tr>
                    <tr>
                        <th>أكواد بعد فتح &lt;body&gt;</th>
                        <td>
                            <textarea name="body_start_tags" rows="4" class="large-text code" placeholder="<!-- مثال: Google Tag Manager noscript -->"><?php echo esc_textarea($s['bodyStartTags']); ?></textarea>
                            <p class="description">أكواد تُضاف مباشرة بعد فتح &lt;body&gt;</p>
                        </td>
                    </tr>
                    <tr>
                        <th>أكواد قبل إغلاق &lt;/body&gt;</th>
                        <td>
                            <textarea name="body_end_tags" rows="4" class="large-text code" placeholder="<!-- مثال: Chat widgets, tracking scripts -->"><?php echo esc_textarea($s['bodyEndTags']); ?></textarea>
                            <p class="description">أكواد تُضاف قبل إغلاق &lt;/body&gt;</p>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Custom CSS -->
            <div class="ab-settings-card">
                <h2><span class="dashicons dashicons-admin-customizer" style="margin-top:2px"></span> CSS مخصص</h2>
                <table class="form-table">
                    <tr>
                        <th>CSS إضافي</th>
                        <td>
                            <textarea name="custom_css" rows="8" class="large-text code" placeholder="/* أضف CSS مخصص هنا */"><?php echo esc_textarea($s['customCss']); ?></textarea>
                            <p class="description">CSS مخصص يُطبق على الواجهة الأمامية</p>
                        </td>
                    </tr>
                </table>
            </div>

            <?php submit_button('حفظ الإعدادات'); ?>
        </form>
    </div>

    <style>
        .ab-settings-card {
            background: #fff;
            border: 1px solid #ccd0d4;
            border-radius: 4px;
            padding: 0 20px 16px;
            margin: 16px 0;
        }
        .ab-settings-card h2 {
            display: flex;
            align-items: center;
            gap: 6px;
            padding-top: 16px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .ab-settings-card .form-table th {
            width: 180px;
        }
    </style>
    <?php
}


// Inject head/body tags from settings
function alawi_settings_head_tags() {
    $settings = get_option('alawi_builder_settings', []);
    if (!empty($settings['headTags'])) {
        echo "\n" . $settings['headTags'] . "\n";
    }
    if (!empty($settings['customCss'])) {
        echo '<style id="meshcah-custom-css">' . "\n" . $settings['customCss'] . "\n</style>\n";
    }
}
add_action('wp_head', 'alawi_settings_head_tags', 99);

function alawi_settings_body_start() {
    $settings = get_option('alawi_builder_settings', []);
    if (!empty($settings['bodyStartTags'])) {
        echo "\n" . $settings['bodyStartTags'] . "\n";
    }
}
add_action('wp_body_open', 'alawi_settings_body_start');

function alawi_settings_body_end() {
    $settings = get_option('alawi_builder_settings', []);
    if (!empty($settings['bodyEndTags'])) {
        echo "\n" . $settings['bodyEndTags'] . "\n";
    }
}
add_action('wp_footer', 'alawi_settings_body_end', 99);

// ── Shortcodes ─────────────────────────────────────────

function meshcah_template_shortcode($atts) {
    $atts = shortcode_atts(['id' => 0], $atts, 'meshcah_template');
    $post_id = absint($atts['id']);
    if (!$post_id) return '';

    static $rendering = [];
    if (isset($rendering[$post_id])) return '<!-- meshcah: circular reference -->';
    $rendering[$post_id] = true;

    $saved = get_post_meta($post_id, '_alawi_builder_data', true);
    if (!$saved) { unset($rendering[$post_id]); return ''; }

    $elements = json_decode($saved, true);
    if (!is_array($elements) || empty($elements)) { unset($rendering[$post_id]); return ''; }

    require_once ALAWI_DIR . '/inc/react-renderer.php';
    $html = Alawi_React_Renderer::render($elements);
    unset($rendering[$post_id]);
    return $html;
}
add_shortcode('meshcah_template', 'meshcah_template_shortcode');

require_once ALAWI_DIR . '/inc/page-builder.php';
require_once ALAWI_DIR . '/inc/custom-blocks.php';
require_once ALAWI_DIR . '/inc/react-renderer.php';
require_once ALAWI_DIR . '/inc/theme-builder.php';
