<?php
$ab_search_tpl = alawi_find_theme_template('search');
if ($ab_search_tpl) :
    get_header();
    echo '<main class="ab-theme-main ab-theme-main--search">';
    echo alawi_render_theme_template($ab_search_tpl);
    echo '</main>';
    get_footer();
else :
?>
<?php get_header(); ?>
<main class="ab-main">
    <div class="ab-container">
        <h1>نتائج البحث عن: <?php the_search_query(); ?></h1>
        <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
            <article class="ab-post">
                <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                <div class="ab-post-excerpt"><?php the_excerpt(); ?></div>
            </article>
        <?php endwhile; the_posts_pagination(); else : ?>
            <p>لا توجد نتائج.</p>
        <?php endif; ?>
    </div>
</main>
<?php get_footer(); ?>
<?php endif; ?>
