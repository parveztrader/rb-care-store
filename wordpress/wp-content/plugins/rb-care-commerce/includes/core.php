<?php
defined('ABSPATH') || exit;
function rbcare_dictionary() {
    static $dictionary;
    if (null === $dictionary) $dictionary = json_decode(file_get_contents(RBCARE_DIR . 'assets/hindi.json'), true);
    return $dictionary;
}
function rbcare_language() {
    return isset($_COOKIE['rb_language']) && 'hi' === $_COOKIE['rb_language'] ? 'hi' : 'en';
}
add_filter('locale', function ($locale) { return !is_admin() && !(defined('WP_CLI') && WP_CLI) && 'hi' === rbcare_language() ? 'hi_IN' : $locale; });
function rbcare_text($text) {
    $dictionary = rbcare_dictionary();
    $english = $dictionary['aliases'][$text] ?? $text;
    return 'hi' === rbcare_language() ? ($dictionary['hindi'][$english] ?? $english) : $english;
}
add_filter('gettext_woocommerce', function ($translated, $original) {
    if (!is_admin() && 'hi' === rbcare_language()) { $dictionary = rbcare_dictionary(); return $dictionary['hindi'][$original] ?? $translated; }
    return $translated;
}, 20, 2);
add_filter('language_attributes', function ($attributes) {
    return !is_admin() ? preg_replace('/lang="[^"]+"/', 'lang="' . ('hi' === rbcare_language() ? 'hi' : 'en-IN') . '"', $attributes) : $attributes;
});
add_action('template_redirect', function () {
    if (isset($_GET['rb_lang']) && in_array($_GET['rb_lang'], array('en', 'hi'), true)) {
        setcookie('rb_language', sanitize_key($_GET['rb_lang']), array('expires' => time() + YEAR_IN_SECONDS, 'path' => COOKIEPATH ?: '/', 'secure' => is_ssl(), 'httponly' => false, 'samesite' => 'Lax'));
        wp_safe_redirect(remove_query_arg('rb_lang')); exit;
    }
    if (is_page(array('sell', 'track', 'cart', 'checkout', 'my-account'))) { nocache_headers(); header('Referrer-Policy: same-origin'); }
});
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script('rb-care-commerce', plugins_url('assets/store.js', RBCARE_PLUGIN_FILE), array(), RBCARE_VERSION . '.' . filemtime(RBCARE_DIR . 'assets/store.js'), true);
    wp_localize_script('rb-care-commerce', 'RBCare', array('root' => esc_url_raw(rest_url('rb-care/v1/')), 'nonce' => wp_create_nonce('wp_rest'), 'language' => rbcare_language(), 'dictionary' => rbcare_dictionary(), 'trackUrl' => home_url('/sell/track/')));
});
function rbcare_register_types() {
    $capabilities = array();
    foreach (array('edit_post', 'read_post', 'delete_post', 'edit_posts', 'edit_others_posts', 'publish_posts', 'read_private_posts', 'delete_posts', 'delete_private_posts', 'delete_published_posts', 'delete_others_posts', 'edit_private_posts', 'edit_published_posts', 'create_posts') as $capability) $capabilities[$capability] = 'manage_woocommerce';
    $capabilities['create_posts'] = 'do_not_allow';
    foreach (array('rb_seller_request' => 'Seller requests', 'rb_enquiry' => 'Customer enquiries') as $type => $label) {
        register_post_type($type, array('labels' => array('name' => $label, 'singular_name' => $label, 'add_new_item' => $label), 'public' => false, 'publicly_queryable' => false, 'exclude_from_search' => true, 'show_ui' => true, 'show_in_rest' => false, 'rewrite' => false, 'supports' => array('title'), 'capabilities' => $capabilities, 'map_meta_cap' => false, 'menu_icon' => 'dashicons-clipboard'));
    }
}
add_action('init', 'rbcare_register_types');
// Mirror the native order-list capability before WooCommerce's page controller,
// which otherwise sends its default 500 wp_die response for this denial.
add_action('admin_menu', function () {
    global $pagenow;
    if ('admin.php' === $pagenow && isset($_GET['page']) && 'wc-orders' === $_GET['page'] && !current_user_can('edit_shop_orders')) {
        wp_die(esc_html__('You do not have permission to manage orders.', 'rb-care-commerce'), esc_html__('Access denied', 'rb-care-commerce'), array('response' => 403));
    }
}, 0);
add_filter('wp_insert_post_data', function ($data) {
    if (in_array($data['post_type'] ?? '', array('rb_seller_request', 'rb_enquiry'), true) && !in_array($data['post_status'], array('trash', 'auto-draft'), true)) $data['post_status'] = 'private';
    return $data;
});
function rbcare_request_guard(WP_REST_Request $request) {
    $origin = $request->get_header('origin');
    if ($origin && strtolower(untrailingslashit($origin)) !== strtolower(untrailingslashit(home_url()))) return new WP_Error('rb_origin', 'Submit this form from the store website.', array('status' => 403));
    if (strlen((string) $request->get_param('website'))) return new WP_Error('rb_form', 'Unable to accept this request.', array('status' => 400));
    $key = 'rbcare_form_' . hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', wp_salt('nonce'));
    $count = (int) get_transient($key);
    if ($count >= 20) return new WP_Error('rb_rate', 'Too many submissions. Please try again later.', array('status' => 429));
    set_transient($key, $count + 1, HOUR_IN_SECONDS);
    return true;
}
function rbcare_clean($value, $max = 2000) {
    return mb_substr(sanitize_textarea_field(is_scalar($value) ? (string) $value : ''), 0, $max);
}
function rbcare_uuid_valid($value) { return is_string($value) && 1 === preg_match('/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i', $value); }
function rbcare_private_response($data, $status = 200) {
    $response = new WP_REST_Response($data, $status);
    $response->header('Cache-Control', 'private, no-store, max-age=0');
    $response->header('Referrer-Policy', 'no-referrer');
    return $response;
}
add_filter('rest_post_dispatch', function ($response, $server, $request) {
    if (str_starts_with($request->get_route(), '/rb-care/v1/')) {
        $response->header('Cache-Control', 'private, no-store, max-age=0');
        $response->header('X-Content-Type-Options', 'nosniff');
    }
    return $response;
}, 10, 3);
add_action('rest_api_init', function () {
    register_rest_route('rb-care/v1', '/language', array('methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => function ($request) {
        if (!in_array($request->get_param('language'), array('en', 'hi'), true)) return new WP_Error('rb_language', 'Invalid language', array('status' => 400));
        $origin = $request->get_header('origin');
        if ($origin && untrailingslashit($origin) !== untrailingslashit(home_url())) return new WP_Error('rb_origin', 'Invalid origin', array('status' => 403));
        setcookie('rb_language', $request->get_param('language'), array('expires' => time() + YEAR_IN_SECONDS, 'path' => COOKIEPATH ?: '/', 'secure' => is_ssl(), 'httponly' => false, 'samesite' => 'Lax'));
        return rbcare_private_response(array('ok' => true));
    }));
});
add_action('wp_dashboard_setup', function () {
    if (!current_user_can('manage_woocommerce')) return;
    wp_add_dashboard_widget('rbcare_requests', 'RB Care — pending seller requests', function () {
        $pending = new WP_Query(array('post_type' => 'rb_seller_request', 'post_status' => 'private', 'meta_key' => '_rb_status', 'meta_value' => 'NEW', 'posts_per_page' => 10));
        echo '<p><strong>' . absint($pending->found_posts) . '</strong> awaiting team review.</p><ul>';
        foreach ($pending->posts as $post) echo '<li><a href="' . esc_url(get_edit_post_link($post->ID)) . '">' . esc_html($post->post_title) . '</a></li>';
        echo '</ul><a href="' . esc_url(admin_url('edit.php?post_type=rb_seller_request')) . '">Review seller requests</a>';
    });
});
add_action('admin_enqueue_scripts', function () {
    $screen = get_current_screen();
    if (current_user_can('manage_woocommerce') && $screen && ('dashboard' === $screen->id || 'rb_seller_request' === $screen->post_type)) wp_enqueue_script('rbcare-admin', plugins_url('assets/admin.js', RBCARE_PLUGIN_FILE), array('jquery', 'heartbeat'), RBCARE_VERSION, true);
});
add_filter('heartbeat_received', function ($response, $data) {
    if (!empty($data['rbcare_requests']) && current_user_can('manage_woocommerce')) {
        $query = new WP_Query(array('post_type' => 'rb_seller_request', 'post_status' => 'private', 'meta_key' => '_rb_status', 'meta_value' => 'NEW', 'posts_per_page' => 1, 'fields' => 'ids'));
        $response['rbcare_pending'] = (int) $query->found_posts;
    }
    return $response;
}, 10, 2);
