<?php
$ab_404_tpl = alawi_find_theme_template('404');
if ($ab_404_tpl) :
    get_header();
    echo '<main class="ab-theme-main ab-theme-main--404">';
    echo alawi_render_theme_template($ab_404_tpl);
    echo '</main>';
    get_footer();
else :
?>
<?php get_header(); ?>
<main class="ab-main">
    <div class="ab-container ab-404">
        <h1>404</h1>
        <p>الصفحة المطلوبة غير موجودة</p>
        <a href="<?php echo esc_url(home_url('/')); ?>" class="ab-btn">العودة للرئيسية</a>
        <?php get_search_form(); ?>
    </div>
</main>
<?php get_footer(); ?>
<?php endif; ?>
