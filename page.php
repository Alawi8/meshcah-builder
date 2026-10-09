<?php get_header();
$use_builder = get_post_meta(get_the_ID(), '_alawi_use_builder', true);
$builder_data = get_post_meta(get_the_ID(), '_alawi_builder_data', true);
?>
<main class="ab-main">
    <?php if ($use_builder && $builder_data) :
        $blocks = json_decode($builder_data, true);
        if (!empty($blocks) && is_array($blocks)) :
            // Detect format: new React elements have 'id' + 'styles', old blocks have 'type' + 'data'
            $first = $blocks[0];
            if (isset($first['id'], $first['styles'])) :
                echo Alawi_React_Renderer::render($blocks);
            else :
                echo Alawi_Block_Renderer::render($blocks);
            endif;
        endif;
    else : ?>
        <div class="ab-container ab-content-wrap">
            <?php while (have_posts()) : the_post(); ?>
                <h1><?php the_title(); ?></h1>
                <div class="ab-content"><?php the_content(); ?></div>
            <?php endwhile; ?>
        </div>
    <?php endif; ?>
</main>
<?php get_footer(); ?>
