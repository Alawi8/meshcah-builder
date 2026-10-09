<?php
defined('ABSPATH') || exit;

class Alawi_Page_Builder {

    private static $blocks = [
        'hero'        => 'بانر رئيسي',
        'features'    => 'مميزات',
        'text_image'  => 'نص وصورة',
        'cta'         => 'دعوة للإجراء',
        'testimonials'=> 'آراء العملاء',
        'gallery'     => 'معرض صور',
        'pricing'     => 'جدول أسعار',
        'faq'         => 'أسئلة شائعة',
        'contact'     => 'نموذج تواصل',
        'spacer'      => 'مسافة فارغة',
        'html'        => 'كود HTML مخصص',
    ];

    public static function init() {
        add_action('add_meta_boxes', [__CLASS__, 'add_meta_box']);
        add_action('save_post', [__CLASS__, 'save_meta_box']);
        add_action('wp_ajax_alawi_get_block_template', [__CLASS__, 'ajax_get_block_template']);
    }

    public static function add_meta_box() {
        add_meta_box(
            'alawi_page_builder',
            'منشئ الصفحات - Alawi Builder',
            [__CLASS__, 'render_meta_box'],
            ['page', 'post'],
            'normal',
            'high'
        );
    }

    public static function render_meta_box($post) {
        wp_nonce_field('alawi_builder_save', 'alawi_builder_nonce_field');
        $builder_data = get_post_meta($post->ID, '_alawi_builder_data', true);
        $blocks = $builder_data ? json_decode($builder_data, true) : [];
        $use_builder = get_post_meta($post->ID, '_alawi_use_builder', true);
        ?>
        <div id="alawi-builder-wrap">
            <label>
                <input type="checkbox" name="alawi_use_builder" value="1" <?php checked($use_builder, '1'); ?>>
                تفعيل منشئ الصفحات لهذه الصفحة
            </label>

            <div id="alawi-block-palette" style="margin-top:15px;">
                <h4>اسحب البلوك وأفلته في منطقة البناء:</h4>
                <div class="alawi-palette-blocks">
                    <?php foreach (self::$blocks as $type => $label) : ?>
                        <div class="alawi-palette-block" draggable="true" data-type="<?php echo esc_attr($type); ?>">
                            <?php echo esc_html($label); ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div id="alawi-builder-canvas" class="alawi-canvas">
                <?php if (!empty($blocks)) : ?>
                    <?php foreach ($blocks as $i => $block) : ?>
                        <?php self::render_block_admin($block['type'], $block['data'], $i); ?>
                    <?php endforeach; ?>
                <?php else : ?>
                    <div class="alawi-canvas-empty">اسحب البلوكات هنا لبناء الصفحة</div>
                <?php endif; ?>
            </div>

            <input type="hidden" id="alawi_builder_data" name="alawi_builder_data" value="<?php echo esc_attr($builder_data ?: '[]'); ?>">
        </div>
        <?php
    }

    public static function render_block_admin($type, $data, $index) {
        $label = self::$blocks[$type] ?? $type;
        ?>
        <div class="alawi-block-item" data-type="<?php echo esc_attr($type); ?>" data-index="<?php echo $index; ?>">
            <div class="alawi-block-header">
                <span class="alawi-block-drag-handle">☰</span>
                <span class="alawi-block-title"><?php echo esc_html($label); ?></span>
                <button type="button" class="alawi-block-toggle">▼</button>
                <button type="button" class="alawi-block-remove">✕</button>
            </div>
            <div class="alawi-block-content">
                <?php self::render_block_fields($type, $data, $index); ?>
            </div>
        </div>
        <?php
    }

    public static function render_block_fields($type, $data, $index) {
        $data = $data ?: [];
        $prefix = "alawi_blocks[{$index}]";

        switch ($type) {
            case 'hero':
                self::field_text($prefix, 'title', 'العنوان', $data['title'] ?? '');
                self::field_textarea($prefix, 'subtitle', 'العنوان الفرعي', $data['subtitle'] ?? '');
                self::field_text($prefix, 'btn_text', 'نص الزر', $data['btn_text'] ?? '');
                self::field_text($prefix, 'btn_url', 'رابط الزر', $data['btn_url'] ?? '#');
                self::field_color($prefix, 'bg_color', 'لون الخلفية', $data['bg_color'] ?? '#1e3a5f');
                self::field_image($prefix, 'bg_image', 'صورة الخلفية', $data['bg_image'] ?? '');
                break;
            case 'features':
                self::field_text($prefix, 'title', 'العنوان', $data['title'] ?? '');
                for ($i = 1; $i <= 3; $i++) {
                    self::field_text($prefix, "feature_{$i}_title", "ميزة {$i} - العنوان", $data["feature_{$i}_title"] ?? '');
                    self::field_textarea($prefix, "feature_{$i}_desc", "ميزة {$i} - الوصف", $data["feature_{$i}_desc"] ?? '');
                    self::field_text($prefix, "feature_{$i}_icon", "ميزة {$i} - أيقونة (emoji)", $data["feature_{$i}_icon"] ?? '⭐');
                }
                break;
            case 'text_image':
                self::field_text($prefix, 'title', 'العنوان', $data['title'] ?? '');
                self::field_textarea($prefix, 'content', 'المحتوى', $data['content'] ?? '');
                self::field_image($prefix, 'image', 'الصورة', $data['image'] ?? '');
                self::field_select($prefix, 'layout', 'التخطيط', $data['layout'] ?? 'image-right', ['image-right' => 'صورة يمين', 'image-left' => 'صورة يسار']);
                break;
            case 'cta':
                self::field_text($prefix, 'title', 'العنوان', $data['title'] ?? '');
                self::field_textarea($prefix, 'content', 'المحتوى', $data['content'] ?? '');
                self::field_text($prefix, 'btn_text', 'نص الزر', $data['btn_text'] ?? '');
                self::field_text($prefix, 'btn_url', 'رابط الزر', $data['btn_url'] ?? '#');
                self::field_color($prefix, 'bg_color', 'لون الخلفية', $data['bg_color'] ?? '#2563eb');
                break;
            case 'testimonials':
                self::field_text($prefix, 'title', 'العنوان', $data['title'] ?? '');
                for ($i = 1; $i <= 3; $i++) {
                    self::field_text($prefix, "person_{$i}_name", "شخص {$i} - الاسم", $data["person_{$i}_name"] ?? '');
                    self::field_textarea($prefix, "person_{$i}_quote", "شخص {$i} - الرأي", $data["person_{$i}_quote"] ?? '');
                }
                break;
            case 'gallery':
                self::field_text($prefix, 'title', 'العنوان', $data['title'] ?? '');
                self::field_text($prefix, 'columns', 'عدد الأعمدة', $data['columns'] ?? '3');
                self::field_textarea($prefix, 'images', 'روابط الصور (كل رابط بسطر)', $data['images'] ?? '');
                break;
            case 'pricing':
                self::field_text($prefix, 'title', 'العنوان', $data['title'] ?? '');
                for ($i = 1; $i <= 3; $i++) {
                    self::field_text($prefix, "plan_{$i}_name", "خطة {$i} - الاسم", $data["plan_{$i}_name"] ?? '');
                    self::field_text($prefix, "plan_{$i}_price", "خطة {$i} - السعر", $data["plan_{$i}_price"] ?? '');
                    self::field_textarea($prefix, "plan_{$i}_features", "خطة {$i} - المميزات (كل ميزة بسطر)", $data["plan_{$i}_features"] ?? '');
                    self::field_text($prefix, "plan_{$i}_btn_text", "خطة {$i} - نص الزر", $data["plan_{$i}_btn_text"] ?? 'اشترك الآن');
                    self::field_text($prefix, "plan_{$i}_btn_url", "خطة {$i} - رابط الزر", $data["plan_{$i}_btn_url"] ?? '#');
                }
                break;
            case 'faq':
                self::field_text($prefix, 'title', 'العنوان', $data['title'] ?? '');
                for ($i = 1; $i <= 5; $i++) {
                    self::field_text($prefix, "q_{$i}", "سؤال {$i}", $data["q_{$i}"] ?? '');
                    self::field_textarea($prefix, "a_{$i}", "جواب {$i}", $data["a_{$i}"] ?? '');
                }
                break;
            case 'contact':
                self::field_text($prefix, 'title', 'العنوان', $data['title'] ?? '');
                self::field_text($prefix, 'email', 'البريد الإلكتروني', $data['email'] ?? '');
                self::field_textarea($prefix, 'content', 'نص إضافي', $data['content'] ?? '');
                break;
            case 'spacer':
                self::field_text($prefix, 'height', 'الارتفاع (بالبكسل)', $data['height'] ?? '50');
                break;
            case 'html':
                self::field_textarea($prefix, 'code', 'كود HTML', $data['code'] ?? '');
                break;
        }
    }

    private static function field_text($prefix, $name, $label, $value) {
        printf('<p><label>%s<br><input type="text" name="%s[%s]" value="%s" class="widefat"></label></p>',
            esc_html($label), esc_attr($prefix), esc_attr($name), esc_attr($value));
    }

    private static function field_textarea($prefix, $name, $label, $value) {
        printf('<p><label>%s<br><textarea name="%s[%s]" class="widefat" rows="3">%s</textarea></label></p>',
            esc_html($label), esc_attr($prefix), esc_attr($name), esc_textarea($value));
    }

    private static function field_color($prefix, $name, $label, $value) {
        printf('<p><label>%s<br><input type="color" name="%s[%s]" value="%s"></label></p>',
            esc_html($label), esc_attr($prefix), esc_attr($name), esc_attr($value));
    }

    private static function field_image($prefix, $name, $label, $value) {
        printf('<p><label>%s<br><input type="text" name="%s[%s]" value="%s" class="widefat alawi-image-field" placeholder="رابط الصورة أو اختر من المكتبة"></label>
        <button type="button" class="button alawi-upload-btn">اختر صورة</button></p>',
            esc_html($label), esc_attr($prefix), esc_attr($name), esc_attr($value));
    }

    private static function field_select($prefix, $name, $label, $value, $options) {
        $html = sprintf('<p><label>%s<br><select name="%s[%s]" class="widefat">',
            esc_html($label), esc_attr($prefix), esc_attr($name));
        foreach ($options as $k => $v) {
            $html .= sprintf('<option value="%s"%s>%s</option>', esc_attr($k), selected($value, $k, false), esc_html($v));
        }
        $html .= '</select></label></p>';
        echo $html;
    }

    public static function save_meta_box($post_id) {
        if (!isset($_POST['alawi_builder_nonce_field']) || !wp_verify_nonce($_POST['alawi_builder_nonce_field'], 'alawi_builder_save')) return;
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
        if (!current_user_can('edit_post', $post_id)) return;

        $use_builder = isset($_POST['alawi_use_builder']) ? '1' : '0';
        update_post_meta($post_id, '_alawi_use_builder', $use_builder);

        if (isset($_POST['alawi_builder_data'])) {
            $data = sanitize_text_field(wp_unslash($_POST['alawi_builder_data']));
            update_post_meta($post_id, '_alawi_builder_data', $data);
        }
    }

    public static function ajax_get_block_template() {
        check_ajax_referer('alawi_builder_nonce', 'nonce');
        $type = sanitize_key($_POST['type'] ?? '');
        $index = intval($_POST['index'] ?? 0);
        if (!isset(self::$blocks[$type])) wp_die('Invalid block');
        ob_start();
        self::render_block_admin($type, [], $index);
        wp_send_json_success(ob_get_clean());
    }

    public static function get_blocks() {
        return self::$blocks;
    }
}

Alawi_Page_Builder::init();
