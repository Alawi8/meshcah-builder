<?php
$ab_single_tpl = alawi_find_theme_template('single');
if ($ab_single_tpl) :
    get_header();
    echo '<main class="ab-theme-main ab-theme-main--single">';
    while (have_posts()) : the_post();
        echo alawi_render_theme_template($ab_single_tpl);
    endwhile;
    echo '</main>';
    get_footer();
else :
?>
<?php get_header(); ?>
<main class="ab-main">
    <div class="ab-container ab-content-wrap">
        <?php while (have_posts()) : the_post(); ?>
            <article>
                <h1><?php the_title(); ?></h1>
                <div class="ab-post-meta"><?php the_date(); ?> | <?php the_author(); ?></div>
                <?php if (has_post_thumbnail()) : ?>
                    <div class="ab-featured-image"><?php the_post_thumbnail('large'); ?></div>
                <?php endif; ?>
                <div class="ab-content"><?php the_content(); ?></div>
            </article>
            <?php if (comments_open()) comments_template(); ?>
        <?php endwhile; ?>
    </div>
</main>
<?php get_footer(); ?>
<?php endif; ?>
