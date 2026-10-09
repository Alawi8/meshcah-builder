<?php
$ab_archive_tpl = alawi_find_theme_template('archive');
if ($ab_archive_tpl) :
    get_header();
    echo '<main class="ab-theme-main ab-theme-main--archive">';
    echo alawi_render_theme_template($ab_archive_tpl);
    echo '</main>';
    get_footer();
else :
?>
<?php get_header(); ?>
<main class="ab-main">
    <div class="ab-container">
        <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
            <article class="ab-post">
                <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                <div class="ab-post-meta"><?php the_date(); ?></div>
                <div class="ab-post-excerpt"><?php the_excerpt(); ?></div>
            </article>
        <?php endwhile; the_posts_pagination(); else : ?>
            <p>لا توجد مقالات.</p>
        <?php endif; ?>
    </div>
</main>
<?php get_footer(); ?>
<?php endif; ?>
