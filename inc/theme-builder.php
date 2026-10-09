<?php
defined('ABSPATH') || exit;

// ── Custom Post Type ─────────────────────────────

function alawi_register_theme_tpl_cpt() {
    register_post_type('alawi_theme_tpl', [
        'labels' => [
            'name'          => 'قوالب الثيم',
            'singular_name' => 'قالب ثيم',
            'add_new'       => 'إضافة قالب',
            'add_new_item'  => 'إضافة قالب جديد',
            'edit_item'     => 'تحرير قالب',
            'all_items'     => 'جميع القوالب',
        ],
        'public'       => false,
        'show_ui'      => false,
        'show_in_menu' => false,
        'supports'     => ['title'],
        'has_archive'  => false,
        'rewrite'      => false,
    ]);
}
add_action('init', 'alawi_register_theme_tpl_cpt');

// Theme builder page is registered from the settings page

function alawi_theme_builder_handle_actions() {
    if (!current_user_can('edit_theme_options')) return;

    // Handle create
    if (isset($_POST['alawi_create_tpl']) && wp_verify_nonce($_POST['_wpnonce'], 'alawi_create_tpl')) {
        $types = alawi_tpl_types();
        $tpl_type = sanitize_text_field($_POST['tpl_type']);
        $tpl_name = sanitize_text_field($_POST['tpl_name']);
        if ($tpl_type && $tpl_name && isset($types[$tpl_type])) {
            $id = wp_insert_post([
                'post_type'   => 'alawi_theme_tpl',
                'post_title'  => $tpl_name,
                'post_status' => 'publish',
            ]);
            if ($id && !is_wp_error($id)) {
                update_post_meta($id, '_alawi_tpl_type', $tpl_type);
                update_post_meta($id, '_alawi_tpl_conditions', wp_json_encode([]));
                update_post_meta($id, '_alawi_use_builder', '1');
                wp_redirect(admin_url('admin.php?page=alawi-editor&post_id=' . $id));
                exit;
            }
        }
    }

    // Handle delete
    if (isset($_GET['page']) && in_array($_GET['page'], ['alawi-editor', 'alawi-theme-builder', 'alawi-settings', 'alawi-themes'], true) && isset($_GET['delete_tpl']) && wp_verify_nonce($_GET['_wpnonce'], 'alawi_delete_tpl')) {
        $del_id = absint($_GET['delete_tpl']);
        if ($del_id && get_post_type($del_id) === 'alawi_theme_tpl') {
            wp_delete_post($del_id, true);
            $content_type = isset($_GET['content_type']) ? sanitize_text_field($_GET['content_type']) : '';
            $redirect = $content_type ? admin_url('admin.php?page=alawi-editor&content_type=' . $content_type) : admin_url('admin.php?page=alawi-editor');
            wp_redirect($redirect);
            exit;
        }
    }
}
add_action('admin_init', 'alawi_theme_builder_handle_actions');

function alawi_theme_builder_page() {
    $types = alawi_tpl_types();
    $templates = get_posts([
        'post_type'   => 'alawi_theme_tpl',
        'numberposts' => -1,
        'post_status' => 'any',
    ]);

    $by_type = [];
    foreach ($templates as $t) {
        $ttype = get_post_meta($t->ID, '_alawi_tpl_type', true);
        $by_type[$ttype][] = $t;
    }

    echo '<div class="wrap"><h1>Theme Builder — قوالب الثيم</h1>';

    // Create form
    echo '<div class="ab-tb-create" style="background:#fff;padding:16px;border:1px solid #ccd0d4;margin:16px 0;border-radius:4px">';
    echo '<form method="post"><h3 style="margin-top:0">إنشاء قالب جديد</h3>';
    wp_nonce_field('alawi_create_tpl');
    echo '<input type="hidden" name="alawi_create_tpl" value="1">';
    echo '<label>الاسم: <input type="text" name="tpl_name" required style="margin:0 8px"></label>';
    echo '<label>النوع: <select name="tpl_type">';
    foreach ($types as $key => $info) {
        echo '<option value="' . esc_attr($key) . '">' . esc_html($info['label']) . '</option>';
    }
    echo '</select></label> ';
    echo '<button type="submit" class="button button-primary">إنشاء</button>';
    echo '</form></div>';

    // Templates list by type
    foreach ($types as $type_key => $type_info) {
        echo '<h2>' . esc_html($type_info['icon'] . ' ' . $type_info['label']) . '</h2>';
        $items = $by_type[$type_key] ?? [];
        if (empty($items)) {
            echo '<p style="color:#666">لا توجد قوالب من هذا النوع</p>';
            continue;
        }
        echo '<table class="widefat striped"><thead><tr><th>الاسم</th><th>الشروط</th><th>إجراءات</th></tr></thead><tbody>';
        foreach ($items as $t) {
            $conditions = json_decode(get_post_meta($t->ID, '_alawi_tpl_conditions', true), true) ?: [];
            $cond_text = empty($conditions) ? '<em style="color:#999">بدون شروط (غير نشط)</em>' : esc_html(alawi_conditions_summary($conditions));
            $edit_url = admin_url('admin.php?page=alawi-editor&post_id=' . $t->ID);
            $cond_url = admin_url('admin.php?page=alawi-tpl-conditions&post_id=' . $t->ID);
            $del_url = wp_nonce_url(admin_url('admin.php?page=alawi-theme-builder&delete_tpl=' . $t->ID), 'alawi_delete_tpl');

            echo '<tr>';
            echo '<td><strong>' . esc_html($t->post_title) . '</strong></td>';
            echo '<td>' . $cond_text . '</td>';
            echo '<td>';
            echo '<a href="' . esc_url($edit_url) . '" class="button">تحرير</a> ';
            echo '<a href="' . esc_url($cond_url) . '" class="button">الشروط</a> ';
            echo '<a href="' . esc_url($del_url) . '" class="button" onclick="return confirm(\'حذف هذا القالب؟\')" style="color:#a00">حذف</a>';
            echo '</td></tr>';
        }
        echo '</tbody></table>';
    }
    echo '</div>';
}

// ── Conditions Page ──────────────────────────────

function alawi_tpl_conditions_menu() {
    add_submenu_page(
        null,
        'شروط القالب',
        'شروط القالب',
        'edit_theme_options',
        'alawi-tpl-conditions',
        'alawi_tpl_conditions_page'
    );
}
add_action('admin_menu', 'alawi_tpl_conditions_menu');

function alawi_tpl_conditions_page() {
    $post_id = absint($_GET['post_id'] ?? 0);
    if (!$post_id || get_post_type($post_id) !== 'alawi_theme_tpl') {
        wp_die('قالب غير صالح');
    }

    $post = get_post($post_id);
    $tpl_type = get_post_meta($post_id, '_alawi_tpl_type', true);
    $conditions = json_decode(get_post_meta($post_id, '_alawi_tpl_conditions', true), true) ?: [];

    if (isset($_POST['alawi_save_conditions']) && wp_verify_nonce($_POST['_wpnonce'], 'alawi_save_conditions')) {
        $new_conditions = [];
        $rules = $_POST['condition_type'] ?? [];
        $values = $_POST['condition_value'] ?? [];
        foreach ($rules as $i => $rule) {
            $rule = sanitize_text_field($rule);
            $val = sanitize_text_field($values[$i] ?? '');
            if ($rule) {
                $new_conditions[] = ['type' => $rule, 'value' => $val];
            }
        }
        update_post_meta($post_id, '_alawi_tpl_conditions', wp_json_encode($new_conditions));
        $conditions = $new_conditions;
        echo '<div class="notice notice-success"><p>تم حفظ الشروط</p></div>';
    }

    $types = alawi_tpl_types();
    $type_label = $types[$tpl_type]['label'] ?? $tpl_type;

    $condition_options = alawi_condition_options($tpl_type);
    $categories = get_categories(['hide_empty' => false]);
    $post_types = get_post_types(['public' => true], 'objects');

    echo '<div class="wrap">';
    echo '<h1>شروط العرض — ' . esc_html($post->post_title) . ' (' . esc_html($type_label) . ')</h1>';
    echo '<p><a href="' . esc_url(admin_url('admin.php?page=alawi-theme-builder')) . '">&larr; العودة لقوالب الثيم</a></p>';

    echo '<form method="post">';
    wp_nonce_field('alawi_save_conditions');
    echo '<input type="hidden" name="alawi_save_conditions" value="1">';

    echo '<div id="ab-conditions" style="background:#fff;padding:16px;border:1px solid #ccd0d4;border-radius:4px;margin:16px 0">';
    echo '<p style="margin-top:0"><strong>عرض هذا القالب عندما:</strong></p>';

    echo '<div id="ab-cond-list">';
    if (empty($conditions)) {
        echo '<p id="ab-cond-empty" style="color:#999">لا توجد شروط — أضف شرطاً ليصبح القالب نشطاً</p>';
    }
    foreach ($conditions as $i => $cond) {
        alawi_render_condition_row($i, $cond, $condition_options, $categories);
    }
    echo '</div>';

    echo '<button type="button" class="button" onclick="alawiAddCondition()">+ إضافة شرط</button>';
    echo '</div>';

    echo '<button type="submit" class="button button-primary button-large">حفظ الشروط</button>';
    echo '</form>';

    // JS for adding/removing rows
    ?>
    <script>
    var abCondIdx = <?php echo count($conditions); ?>;
    var abCondOptions = <?php echo wp_json_encode($condition_options); ?>;
    var abCategories = <?php echo wp_json_encode(array_map(function($c) { return ['id' => $c->term_id, 'name' => $c->name]; }, $categories)); ?>;

    function alawiAddCondition() {
        var empty = document.getElementById('ab-cond-empty');
        if (empty) empty.remove();
        var list = document.getElementById('ab-cond-list');
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px';
        row.innerHTML = buildConditionRow(abCondIdx, '', '');
        list.appendChild(row);
        abCondIdx++;
    }

    function buildConditionRow(idx, type, value) {
        var opts = '<option value="">— اختر —</option>';
        for (var i = 0; i < abCondOptions.length; i++) {
            var o = abCondOptions[i];
            opts += '<option value="' + o.value + '"' + (o.value === type ? ' selected' : '') + '>' + o.label + '</option>';
        }
        var valueInput = '';
        if (type === 'category') {
            valueInput = '<select name="condition_value[]">';
            for (var j = 0; j < abCategories.length; j++) {
                valueInput += '<option value="' + abCategories[j].id + '"' + (abCategories[j].id == value ? ' selected' : '') + '>' + abCategories[j].name + '</option>';
            }
            valueInput += '</select>';
        } else if (type === 'post_type') {
            valueInput = '<input type="text" name="condition_value[]" value="' + (value||'post') + '" placeholder="post">';
        } else {
            valueInput = '<input type="hidden" name="condition_value[]" value="">';
        }
        return '<select name="condition_type[]" onchange="alawiCondTypeChange(this)">' + opts + '</select>' +
            '<span class="ab-cond-value">' + valueInput + '</span>' +
            '<button type="button" class="button" onclick="this.parentNode.remove()" style="color:#a00">✕</button>';
    }

    function alawiCondTypeChange(sel) {
        var row = sel.parentNode;
        var valSpan = row.querySelector('.ab-cond-value');
        var type = sel.value;
        if (type === 'category') {
            var html = '<select name="condition_value[]">';
            for (var j = 0; j < abCategories.length; j++) {
                html += '<option value="' + abCategories[j].id + '">' + abCategories[j].name + '</option>';
            }
            html += '</select>';
            valSpan.innerHTML = html;
        } else if (type === 'post_type') {
            valSpan.innerHTML = '<input type="text" name="condition_value[]" value="post" placeholder="post">';
        } else {
            valSpan.innerHTML = '<input type="hidden" name="condition_value[]" value="">';
        }
    }
    </script>
    <?php
    echo '</div>';
}

function alawi_render_condition_row($i, $cond, $options, $categories) {
    echo '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">';
    echo '<select name="condition_type[]" onchange="alawiCondTypeChange(this)">';
    echo '<option value="">— اختر —</option>';
    foreach ($options as $opt) {
        echo '<option value="' . esc_attr($opt['value']) . '"' . selected($opt['value'], $cond['type'], false) . '>' . esc_html($opt['label']) . '</option>';
    }
    echo '</select>';
    echo '<span class="ab-cond-value">';
    if ($cond['type'] === 'category') {
        echo '<select name="condition_value[]">';
        foreach ($categories as $cat) {
            echo '<option value="' . esc_attr($cat->term_id) . '"' . selected($cat->term_id, $cond['value'], false) . '>' . esc_html($cat->name) . '</option>';
        }
        echo '</select>';
    } elseif ($cond['type'] === 'post_type') {
        echo '<input type="text" name="condition_value[]" value="' . esc_attr($cond['value']) . '">';
    } else {
        echo '<input type="hidden" name="condition_value[]" value="">';
    }
    echo '</span>';
    echo '<button type="button" class="button" onclick="this.parentNode.remove()" style="color:#a00">✕</button>';
    echo '</div>';
}

// ── Types & Condition Options ────────────────────

function alawi_tpl_types() {
    return [
        'header'  => ['label' => 'هيدر', 'icon' => '🔝'],
        'footer'  => ['label' => 'فوتر', 'icon' => '🔚'],
        'single'  => ['label' => 'مقال فردي', 'icon' => '📄'],
        'archive' => ['label' => 'أرشيف', 'icon' => '📚'],
        'search'  => ['label' => 'بحث', 'icon' => '🔍'],
        '404'     => ['label' => '404', 'icon' => '⚠️'],
    ];
}

function alawi_condition_options($tpl_type) {
    $opts = [
        ['value' => 'all', 'label' => 'الكل — جميع الصفحات'],
    ];
    if (in_array($tpl_type, ['single', 'archive', 'header', 'footer'])) {
        $opts[] = ['value' => 'post_type', 'label' => 'نوع المحتوى'];
        $opts[] = ['value' => 'category', 'label' => 'تصنيف محدد'];
    }
    if (in_array($tpl_type, ['header', 'footer'])) {
        $opts[] = ['value' => 'front_page', 'label' => 'الصفحة الرئيسية فقط'];
        $opts[] = ['value' => 'singular', 'label' => 'صفحات/مقالات فقط'];
        $opts[] = ['value' => 'archive_page', 'label' => 'صفحات الأرشيف فقط'];
    }
    return $opts;
}

function alawi_conditions_summary($conditions) {
    $parts = [];
    foreach ($conditions as $cond) {
        switch ($cond['type']) {
            case 'all': $parts[] = 'الكل'; break;
            case 'front_page': $parts[] = 'الصفحة الرئيسية'; break;
            case 'singular': $parts[] = 'صفحات/مقالات'; break;
            case 'archive_page': $parts[] = 'صفحات الأرشيف'; break;
            case 'post_type': $parts[] = 'نوع: ' . $cond['value']; break;
            case 'category':
                $cat = get_category($cond['value']);
                $parts[] = 'تصنيف: ' . ($cat ? $cat->name : $cond['value']);
                break;
        }
    }
    return implode(' | ', $parts);
}

// ── Template Matching ────────────────────────────

function alawi_find_theme_template($type) {
    static $cache = [];
    if (isset($cache[$type])) return $cache[$type];

    $templates = get_posts([
        'post_type'   => 'alawi_theme_tpl',
        'numberposts' => -1,
        'post_status' => 'publish',
        'meta_key'    => '_alawi_tpl_type',
        'meta_value'  => $type,
    ]);

    $best = null;
    $best_priority = -1;

    foreach ($templates as $tpl) {
        $conditions = json_decode(get_post_meta($tpl->ID, '_alawi_tpl_conditions', true), true) ?: [];
        if (empty($conditions)) continue;

        foreach ($conditions as $cond) {
            $priority = alawi_check_condition($cond);
            if ($priority > $best_priority) {
                $best_priority = $priority;
                $best = $tpl;
            }
        }
    }

    $cache[$type] = $best;
    return $best;
}

function alawi_check_condition($cond) {
    $type = $cond['type'] ?? '';
    $value = $cond['value'] ?? '';

    switch ($type) {
        case 'all':
            return 1;

        case 'front_page':
            return is_front_page() ? 10 : 0;

        case 'singular':
            return is_singular() ? 5 : 0;

        case 'archive_page':
            return is_archive() ? 5 : 0;

        case 'post_type':
            if (is_singular($value)) return 8;
            if (is_post_type_archive($value)) return 8;
            $qo = get_queried_object();
            if ($qo && isset($qo->taxonomy)) {
                $tax_obj = get_taxonomy($qo->taxonomy);
                if ($tax_obj && in_array($value, $tax_obj->object_type, true)) return 7;
            }
            return 0;

        case 'category':
            if (is_singular() && has_category($value)) return 15;
            if (is_category($value)) return 15;
            return 0;
    }

    return 0;
}

function alawi_render_theme_template($tpl_post) {
    $data = get_post_meta($tpl_post->ID, '_alawi_builder_data', true);
    if (!$data) return '';
    $elements = json_decode($data, true);
    if (empty($elements) || !is_array($elements)) return '';
    return Alawi_React_Renderer::render($elements);
}

