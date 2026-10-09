<?php
defined('ABSPATH') || exit;

class Alawi_Block_Renderer {

    public static function render($blocks) {
        if (empty($blocks)) return '';
        $output = '';
        foreach ($blocks as $block) {
            $method = 'render_' . $block['type'];
            if (method_exists(__CLASS__, $method)) {
                $output .= self::$method($block['data'] ?? []);
            }
        }
        return $output;
    }

    private static function render_hero($d) {
        $bg = !empty($d['bg_image']) ? "background-image:url('" . esc_url($d['bg_image']) . "');background-size:cover;background-position:center;" : '';
        $color = esc_attr($d['bg_color'] ?? '#1e3a5f');
        $title = esc_html($d['title'] ?? '');
        $subtitle = esc_html($d['subtitle'] ?? '');
        $btn = '';
        if (!empty($d['btn_text'])) {
            $btn = sprintf('<a href="%s" class="ab-btn">%s</a>', esc_url($d['btn_url'] ?? '#'), esc_html($d['btn_text']));
        }
        return "<section class=\"ab-hero\" style=\"background-color:{$color};{$bg}\">
            <div class=\"ab-container\"><h1>{$title}</h1><p>{$subtitle}</p>{$btn}</div></section>";
    }

    private static function render_features($d) {
        $title = esc_html($d['title'] ?? '');
        $items = '';
        for ($i = 1; $i <= 3; $i++) {
            $ft = esc_html($d["feature_{$i}_title"] ?? '');
            $fd = esc_html($d["feature_{$i}_desc"] ?? '');
            $fi = esc_html($d["feature_{$i}_icon"] ?? '⭐');
            if ($ft) $items .= "<div class=\"ab-feature\"><div class=\"ab-feature-icon\">{$fi}</div><h3>{$ft}</h3><p>{$fd}</p></div>";
        }
        return "<section class=\"ab-features\"><div class=\"ab-container\"><h2>{$title}</h2><div class=\"ab-features-grid\">{$items}</div></div></section>";
    }

    private static function render_text_image($d) {
        $layout = esc_attr($d['layout'] ?? 'image-right');
        $title = esc_html($d['title'] ?? '');
        $content = wp_kses_post($d['content'] ?? '');
        $img = !empty($d['image']) ? '<img src="' . esc_url($d['image']) . '" alt="">' : '';
        return "<section class=\"ab-text-image ab-layout-{$layout}\"><div class=\"ab-container\">
            <div class=\"ab-text\"><h2>{$title}</h2><div>{$content}</div></div>
            <div class=\"ab-image\">{$img}</div></div></section>";
    }

    private static function render_cta($d) {
        $color = esc_attr($d['bg_color'] ?? '#2563eb');
        $title = esc_html($d['title'] ?? '');
        $content = esc_html($d['content'] ?? '');
        $btn = '';
        if (!empty($d['btn_text'])) {
            $btn = sprintf('<a href="%s" class="ab-btn">%s</a>', esc_url($d['btn_url'] ?? '#'), esc_html($d['btn_text']));
        }
        return "<section class=\"ab-cta\" style=\"background-color:{$color}\"><div class=\"ab-container\"><h2>{$title}</h2><p>{$content}</p>{$btn}</div></section>";
    }

    private static function render_testimonials($d) {
        $title = esc_html($d['title'] ?? '');
        $items = '';
        for ($i = 1; $i <= 3; $i++) {
            $name = esc_html($d["person_{$i}_name"] ?? '');
            $quote = esc_html($d["person_{$i}_quote"] ?? '');
            if ($name) $items .= "<div class=\"ab-testimonial\"><blockquote>{$quote}</blockquote><cite>{$name}</cite></div>";
        }
        return "<section class=\"ab-testimonials\"><div class=\"ab-container\"><h2>{$title}</h2><div class=\"ab-testimonials-grid\">{$items}</div></div></section>";
    }

    private static function render_gallery($d) {
        $title = esc_html($d['title'] ?? '');
        $cols = intval($d['columns'] ?? 3);
        $images = array_filter(explode("\n", $d['images'] ?? ''));
        $items = '';
        foreach ($images as $img) {
            $items .= '<div class="ab-gallery-item"><img src="' . esc_url(trim($img)) . '" alt="" loading="lazy"></div>';
        }
        return "<section class=\"ab-gallery\"><div class=\"ab-container\"><h2>{$title}</h2><div class=\"ab-gallery-grid\" style=\"grid-template-columns:repeat({$cols},1fr)\">{$items}</div></div></section>";
    }

    private static function render_pricing($d) {
        $title = esc_html($d['title'] ?? '');
        $plans = '';
        for ($i = 1; $i <= 3; $i++) {
            $name = esc_html($d["plan_{$i}_name"] ?? '');
            if (!$name) continue;
            $price = esc_html($d["plan_{$i}_price"] ?? '');
            $features = array_filter(explode("\n", $d["plan_{$i}_features"] ?? ''));
            $flist = '';
            foreach ($features as $f) $flist .= '<li>' . esc_html(trim($f)) . '</li>';
            $btn_text = esc_html($d["plan_{$i}_btn_text"] ?? 'اشترك');
            $btn_url = esc_url($d["plan_{$i}_btn_url"] ?? '#');
            $highlight = $i === 2 ? ' ab-plan-featured' : '';
            $plans .= "<div class=\"ab-plan{$highlight}\"><h3>{$name}</h3><div class=\"ab-plan-price\">{$price}</div><ul>{$flist}</ul><a href=\"{$btn_url}\" class=\"ab-btn\">{$btn_text}</a></div>";
        }
        return "<section class=\"ab-pricing\"><div class=\"ab-container\"><h2>{$title}</h2><div class=\"ab-pricing-grid\">{$plans}</div></div></section>";
    }

    private static function render_faq($d) {
        $title = esc_html($d['title'] ?? '');
        $items = '';
        for ($i = 1; $i <= 5; $i++) {
            $q = esc_html($d["q_{$i}"] ?? '');
            $a = esc_html($d["a_{$i}"] ?? '');
            if ($q) $items .= "<details class=\"ab-faq-item\"><summary>{$q}</summary><p>{$a}</p></details>";
        }
        return "<section class=\"ab-faq\"><div class=\"ab-container\"><h2>{$title}</h2>{$items}</div></section>";
    }

    private static function render_contact($d) {
        $title = esc_html($d['title'] ?? '');
        $content = esc_html($d['content'] ?? '');
        $email = esc_attr($d['email'] ?? '');
        return "<section class=\"ab-contact\"><div class=\"ab-container\"><h2>{$title}</h2><p>{$content}</p>
            <form class=\"ab-contact-form\" method=\"post\">
                <input type=\"text\" name=\"name\" placeholder=\"الاسم\" required>
                <input type=\"email\" name=\"email\" placeholder=\"البريد الإلكتروني\" required>
                <textarea name=\"message\" placeholder=\"رسالتك\" rows=\"5\" required></textarea>
                <input type=\"hidden\" name=\"to_email\" value=\"{$email}\">
                <button type=\"submit\" class=\"ab-btn\">إرسال</button>
            </form></div></section>";
    }

    private static function render_spacer($d) {
        $h = intval($d['height'] ?? 50);
        return "<div class=\"ab-spacer\" style=\"height:{$h}px\"></div>";
    }

    private static function render_html($d) {
        return '<section class="ab-custom-html"><div class="ab-container">' . wp_kses_post($d['code'] ?? '') . '</div></section>';
    }
}
