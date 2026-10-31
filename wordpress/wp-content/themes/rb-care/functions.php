<?php
defined('ABSPATH') || exit;

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'gallery', 'caption', 'style', 'script'));
    add_theme_support('woocommerce', array('product_grid' => array('default_columns' => 4)));
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
    register_nav_menus(array('primary' => __('Primary navigation', 'rb-care')));
});
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('rb-care-source', get_template_directory_uri() . '/source-design.css', array(), '1.0.0.' . filemtime(get_template_directory() . '/source-design.css'));
    wp_enqueue_style('rb-care', get_stylesheet_uri(), array('rb-care-source'), '1.0.0.' . filemtime(get_stylesheet_directory() . '/style.css'));
});
function rb_care_t($text) {
    return function_exists('rbcare_text') ? rbcare_text($text) : $text;
}
function rb_care_shop_url() {
    return function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/products/');
}
function rb_care_category_url($name) {
    $term = get_term_by('name', $name, 'product_cat');
    return $term && !is_wp_error($term) ? get_term_link($term) : rb_care_shop_url();
}
add_action('after_setup_theme', function () {
    remove_action('woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10);
    remove_action('woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10);
    remove_action('woocommerce_sidebar', 'woocommerce_get_sidebar', 10);
    add_action('woocommerce_before_main_content', function () { echo '<main id="main-content" class="shell rb-content woocommerce">'; }, 10);
    add_action('woocommerce_after_main_content', function () { echo '</main>'; }, 10);
}, 20);
add_filter('loop_shop_columns', function () { return 4; });
add_filter('woocommerce_add_to_cart_fragments', function ($fragments) {
    if (WC()->cart) {
        $fragments['a.store-cart'] = '<a class="store-cart" href="' . esc_url(wc_get_cart_url()) . '">' . esc_html(rb_care_t('Cart')) . ' (' . absint(WC()->cart->get_cart_contents_count()) . ')</a>';
    }
    return $fragments;
});
