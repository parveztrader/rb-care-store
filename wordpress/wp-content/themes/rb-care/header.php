<?php defined('ABSPATH') || exit; ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width,initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class(); ?>><?php wp_body_open(); ?>
<a class="skip-link" href="#main-content"><?php echo esc_html(rb_care_t('Skip to content')); ?></a>
<header class="store-header">
<div class="utility-bar"><div class="shell utility-inner"><span><?php echo esc_html(rb_care_t('RB Care · 2nd hand appliances · Lucknow & Gonda')); ?></span><a href="https://rbcareservice.in"><?php echo esc_html(rb_care_t('Appliance repair services')); ?></a><span class="rb-language"><?php foreach (array('en' => 'English', 'hi' => 'हिन्दी') as $code => $label) : ?><a data-rb-language="<?php echo esc_attr($code); ?>" href="<?php echo esc_url(add_query_arg('rb_lang', $code)); ?>" <?php if ((isset($_COOKIE['rb_language']) ? $_COOKIE['rb_language'] : 'en') === $code) echo 'aria-current="true"'; ?>><?php echo esc_html($label); ?></a><?php endforeach; ?></span></div></div>
<div class="shell store-masthead">
<a href="<?php echo esc_url(home_url('/')); ?>" class="store-brand"><span class="store-monogram">RB</span><span><strong>RB Care Service</strong><small><?php echo esc_html(rb_care_t('Home Appliance Store')); ?></small></span></a>
<form action="<?php echo esc_url(home_url('/')); ?>" class="store-search" role="search"><label class="rb-search-label" for="rb-search"><?php echo esc_html(rb_care_t('Search appliances, brands or models')); ?></label><input id="rb-search" name="s" placeholder="<?php echo esc_attr(rb_care_t('Search appliances, brands or models')); ?>" type="search" value="<?php echo esc_attr(get_search_query()); ?>"><input type="hidden" name="post_type" value="product"><button type="submit"><?php echo esc_html(rb_care_t('Search')); ?></button></form>
<a class="store-phone" href="tel:+918503939715"><small><?php echo esc_html(rb_care_t('Call for assistance')); ?></small><strong>08503939715</strong></a>
<?php if (function_exists('WC')) : ?><a class="store-cart" href="<?php echo esc_url(wc_get_cart_url()); ?>"><?php echo esc_html(rb_care_t('Cart')); ?> (<?php echo WC()->cart ? absint(WC()->cart->get_cart_contents_count()) : 0; ?>)</a><?php endif; ?>
</div>
<nav class="store-nav" aria-label="<?php echo esc_attr(rb_care_t('Main navigation')); ?>"><div class="shell">
<?php if (has_nav_menu('primary')) { wp_nav_menu(array('theme_location' => 'primary', 'container' => false, 'items_wrap' => '<ul class="rb-primary-menu">%3$s</ul>')); } else { ?>
<a href="<?php echo esc_url(rb_care_shop_url()); ?>"><?php echo esc_html(rb_care_t('Buy appliances')); ?></a><a href="<?php echo esc_url(home_url('/sell/')); ?>" class="sell-nav-link"><?php echo esc_html(rb_care_t('Sell your appliance')); ?></a><a href="<?php echo esc_url(home_url('/community/')); ?>"><?php echo esc_html(rb_care_t('Customer appliances')); ?></a>
<?php foreach (array('Washing Machine', 'Refrigerator', 'Air Conditioner', 'Microwave') as $category) : ?><a href="<?php echo esc_url(rb_care_category_url($category)); ?>"><?php echo esc_html(rb_care_t($category)); ?></a><?php endforeach; ?>
<a href="<?php echo esc_url(home_url('/bulk/')); ?>"><?php echo esc_html(rb_care_t('Bulk enquiry')); ?></a><a href="<?php echo esc_url(home_url('/contact/')); ?>"><?php echo esc_html(rb_care_t('Contact us')); ?></a><a href="<?php echo esc_url(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : wp_login_url()); ?>"><?php echo esc_html(rb_care_t('My account')); ?></a>
<?php } ?></div></nav></header>
