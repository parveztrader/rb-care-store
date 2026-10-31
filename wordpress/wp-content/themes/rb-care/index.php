<?php defined('ABSPATH') || exit; get_header(); ?>
<main id="main-content" class="shell rb-content"><?php if (have_posts()) : while (have_posts()) : the_post(); ?><article <?php post_class(); ?>><h1><?php the_title(); ?></h1><div class="rb-page-body"><?php the_content(); ?></div></article><?php endwhile; the_posts_pagination(); else : ?><h1><?php echo esc_html(rb_care_t('Page not found')); ?></h1><p><a href="<?php echo esc_url(home_url('/')); ?>"><?php echo esc_html(rb_care_t('Home')); ?></a></p><?php endif; ?></main>
<?php get_footer(); ?>
