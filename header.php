<!DOCTYPE html>
<html <?php language_attributes(); ?> dir="rtl">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<?php
$ab_header_tpl = alawi_find_theme_template('header');
if ($ab_header_tpl) :
    echo '<header class="ab-theme-header">';
    echo alawi_render_theme_template($ab_header_tpl);
    echo '</header>';
else :
?>
<header class="ab-header">
    <div class="ab-container ab-header-inner">
        <div class="ab-logo">
            <?php if (has_custom_logo()) : the_custom_logo(); else : ?>
                <a href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a>
            <?php endif; ?>
        </div>
        <button class="ab-menu-toggle" aria-label="القائمة">☰</button>
        <nav class="ab-nav">
            <?php wp_nav_menu(['theme_location' => 'primary', 'container' => false, 'fallback_cb' => false]); ?>
        </nav>
    </div>
</header>
<?php endif; ?>
