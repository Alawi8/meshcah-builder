<?php
$ab_footer_tpl = alawi_find_theme_template('footer');
if ($ab_footer_tpl) :
    echo '<footer class="ab-theme-footer">';
    echo alawi_render_theme_template($ab_footer_tpl);
    echo '</footer>';
else :
?>
<footer class="ab-footer">
    <div class="ab-container">
        <nav class="ab-footer-nav">
            <?php wp_nav_menu(['theme_location' => 'footer', 'container' => false, 'fallback_cb' => false]); ?>
        </nav>
        <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?></p>
    </div>
</footer>
<?php endif; ?>
<?php wp_footer(); ?>
</body>
</html>
