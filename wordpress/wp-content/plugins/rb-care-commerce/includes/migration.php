<?php
defined('ABSPATH') || exit;
function rbcare_import_catalog($filename, $publish = false) {
    if (!class_exists('WC_Product_Simple')) throw new RuntimeException('Activate WooCommerce first.');
    $rows = json_decode(file_get_contents($filename), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($rows) || !array_is_list($rows)) throw new RuntimeException('Catalog must be a JSON array.');
    $seen = array();
    foreach ($rows as $row) {
        if (!is_array($row) || empty($row['id']) || empty($row['slug']) || empty($row['name']) || !isset($row['price']) || !is_numeric($row['price']) || $row['price'] <= 0 || isset($seen[$row['id']])) throw new RuntimeException('Invalid or duplicate catalog record. No products imported.');
        if (!in_array($row['status'] ?? '', array('AVAILABLE', 'RESERVED', 'SOLD'), true) || !in_array($row['stockMode'] ?? '', array('CITY', 'CENTRAL'), true)) throw new RuntimeException('Invalid inventory status/stock mode.');
        $seen[$row['id']] = true;
    }
    $created = 0; $skipped = 0;
    foreach ($rows as $row) {
        if (wc_get_product_id_by_sku($row['id'])) { ++$skipped; continue; }
        $product = new WC_Product_Simple();
        $product->set_name(sanitize_text_field($row['name'])); $product->set_slug(sanitize_title($row['slug'])); $product->set_sku(sanitize_text_field($row['id']));
        $product->set_status($publish ? 'publish' : 'draft'); $product->set_regular_price(wc_format_decimal($row['price']));
        $product->set_description(wp_kses_post($row['description'] ?? '')); $product->set_short_description(sanitize_textarea_field($row['defects'] ?? ''));
        $product->set_manage_stock(true); $product->set_stock_quantity('AVAILABLE' === $row['status'] ? 1 : 0); $product->set_stock_status('AVAILABLE' === $row['status'] ? 'instock' : 'outofstock'); $product->set_backorders('no'); $product->set_sold_individually(true);
        foreach (array_merge(array_keys(rbcare_product_fields()), array('image', 'status')) as $field) {
            $value = $row[$field] ?? (in_array($field, array('tested', 'highlights', 'included', 'specifications'), true) ? array() : '');
            if ('photos' === $field && !$value) $value = !empty($row['image']) ? array(array('label' => 'Overview', 'url' => esc_url_raw($row['image'], array('http', 'https')))) : array();
            if ('photoSource' === $field && !in_array($value, array('ACTUAL', 'REFERENCE'), true)) $value = 'REFERENCE';
            $product->update_meta_data('_rb_' . $field, $value);
        }
        $category = sanitize_text_field($row['category'] ?? 'Appliances');
        $term = term_exists($category, 'product_cat'); if (!$term) $term = wp_insert_term($category, 'product_cat');
        if (is_wp_error($term)) throw new RuntimeException($term->get_error_message());
        $product->set_category_ids(array((int) (is_array($term) ? $term['term_id'] : $term))); $product->save(); ++$created;
    }
    return array('created' => $created, 'skipped' => $skipped);
}
function rbcare_import_sellers($source) {
    $files = glob(trailingslashit($source) . 'records/*.json') ?: array(); $created = 0; $skipped = 0;
    $destination = $files ? rbcare_private_directory() : '';
    foreach ($files as $filename) {
        $row = json_decode(file_get_contents($filename), true, 512, JSON_THROW_ON_ERROR);
        if (!rbcare_uuid_valid($row['id'] ?? null) || !preg_match('/^[a-f0-9]{64}$/', $row['tokenHash'] ?? '')) throw new RuntimeException('Invalid legacy seller ID or token hash.');
        if (rbcare_find_request($row['id'])) { ++$skipped; continue; }
        $validated = rbcare_validate_seller($row); if (is_wp_error($validated)) throw new RuntimeException('Legacy request needs review: ' . $validated->get_error_message());
        $photos = array();
        foreach ($row['photos'] ?? array() as $photo) {
            if (!rbcare_uuid_valid($photo['id'] ?? null) || !in_array($photo['type'] ?? '', array('image/jpeg', 'image/png', 'image/webp'), true)) throw new RuntimeException('Invalid legacy photo.');
            $original = trailingslashit($source) . 'photos/' . $photo['id'];
            if (!is_file($original) || filesize($original) > 3 * MB_IN_BYTES) throw new RuntimeException('Legacy photo missing or too large.');
            $file = $row['id'] . '-' . $photo['id'];
            if (!copy($original, $destination . '/' . $file)) throw new RuntimeException('Unable to copy a legacy photo.');
            chmod($destination . '/' . $file, 0600); $photos[] = array('id' => $photo['id'], 'file' => $file, 'mime' => $photo['type']);
        }
        $id = wp_insert_post(array('post_type' => 'rb_seller_request', 'post_status' => 'private', 'post_title' => $validated['brand'] . ' ' . $validated['model'] . ' — ' . $validated['city'], 'post_date_gmt' => !empty($row['createdAt']) ? gmdate('Y-m-d H:i:s', strtotime($row['createdAt'])) : current_time('mysql', true)), true);
        if (is_wp_error($id)) throw new RuntimeException($id->get_error_message());
        foreach ($validated as $key => $value) update_post_meta($id, '_rb_' . $key, $value);
        update_post_meta($id, '_rb_uuid', $row['id']); update_post_meta($id, '_rb_token_hash', $row['tokenHash']); update_post_meta($id, '_rb_photos', $photos);
        $price = isset($row['teamPrice']) && is_numeric($row['teamPrice']) ? max(0, (float) $row['teamPrice']) : 0;
        $status = in_array($row['status'] ?? '', array('NEW', 'QUOTED', 'PUBLISHED', 'CLOSED', 'REJECTED'), true) ? $row['status'] : 'NEW';
        if (in_array($status, array('QUOTED', 'PUBLISHED'), true) && !$price) $status = 'NEW';
        if ('PUBLISHED' === $status && '1' !== $validated['publishConsent']) $status = 'QUOTED';
        update_post_meta($id, '_rb_status', $status); update_post_meta($id, '_rb_teamPrice', 'NEW' === $status ? 0 : $price); update_post_meta($id, '_rb_ownerNote', rbcare_clean($row['ownerNote'] ?? '')); ++$created;
    }
    return array('created' => $created, 'skipped' => $skipped);
}
function rbcare_setup_pages($content_file, $publish = false) {
    $content = json_decode(file_get_contents($content_file), true, 512, JSON_THROW_ON_ERROR);
    $pages = array('home' => array('Home', ''), 'products' => array('2nd hand / Used appliances', ''), 'cart' => array('Cart', '[woocommerce_cart]'), 'checkout' => array('Checkout', '[woocommerce_checkout]'), 'my-account' => array('My account', '[woocommerce_my_account]'), 'sell' => array('Sell your appliance', '[rbcare_sell]'), 'sell/track' => array('Track your seller request', '[rbcare_track]'), 'community' => array('Customer appliances', '[rbcare_community]'), 'bulk' => array('Business & bulk enquiries', '[rbcare_bulk]'), 'contact' => array('Contact RB Care', '[rbcare_contact]'), 'policies' => array('Policies', '<p>Please read the warranty, returns, delivery, privacy and terms pages before placing an order.</p>'));
    foreach ($content['policies'] as $slug => $policy) $pages['policies/' . $slug] = array($policy['title'], implode('', array_map(function ($p) { return '<p>' . esc_html($p) . '</p>'; }, $policy['body'])));
    $faq = ''; foreach ($content['faq'] as $section) { $faq .= '<h2>' . esc_html($section['cat']) . '</h2>'; foreach ($section['items'] as $item) $faq .= '<details><summary>' . esc_html($item['q']) . '</summary><p>' . esc_html($item['a']) . '</p></details>'; }
    $pages['faq'] = array('Frequently asked questions', $faq);
    $ids = array();
    foreach ($pages as $path => $page) {
        $existing = get_page_by_path($path);
        if ($existing) { $ids[$path] = $existing->ID; continue; }
        $parts = explode('/', $path); $slug = array_pop($parts); $parent = $parts ? ($ids[implode('/', $parts)] ?? 0) : 0;
        $id = wp_insert_post(array('post_type' => 'page', 'post_status' => $publish ? 'publish' : 'draft', 'post_name' => $slug, 'post_title' => $page[0], 'post_content' => $page[1], 'post_parent' => $parent), true);
        if (is_wp_error($id)) throw new RuntimeException($id->get_error_message()); $ids[$path] = $id;
    }
    return $ids;
}
add_action('init', function () { add_rewrite_rule('^community/([a-fA-F0-9-]{36})/?$', 'index.php?pagename=community&rbcare_listing=$matches[1]', 'top'); });
add_filter('query_vars', function ($vars) { $vars[] = 'rbcare_listing'; return $vars; });
add_action('template_redirect', function () {
    if (function_exists('is_shop') && is_shop()) {
        if (!empty($_GET['q']) && is_string($_GET['q'])) { wp_safe_redirect(add_query_arg(array('s' => sanitize_text_field(wp_unslash($_GET['q'])), 'post_type' => 'product'), home_url('/'))); exit; }
        if (!empty($_GET['category']) && is_string($_GET['category'])) {
            $term = get_term_by('name', sanitize_text_field(wp_unslash($_GET['category'])), 'product_cat');
            if ($term) { $url = get_term_link($term); if (!empty($_GET['city']) && is_string($_GET['city'])) $url = add_query_arg('city', sanitize_text_field(wp_unslash($_GET['city'])), $url); wp_safe_redirect($url); exit; }
        }
    }
    $path = trim(wp_parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
    $redirects = array('admin' => admin_url(), 'admin/sell' => admin_url('edit.php?post_type=rb_seller_request'), 'admin/orders' => admin_url('admin.php?page=wc-orders'), 'checkout/pay' => function_exists('wc_get_checkout_url') ? wc_get_checkout_url() : home_url('/checkout/'));
    if (isset($redirects[$path])) { wp_safe_redirect($redirects[$path], 302); exit; }
});
add_filter('woocommerce_structured_data_product', function ($data, $product) { if ($product->get_meta('_rb_city')) $data['itemCondition'] = 'https://schema.org/UsedCondition'; return $data; }, 10, 2);
if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('rb-care import-catalog', function ($args, $assoc) { try { $result = rbcare_import_catalog($args[0], isset($assoc['publish'])); WP_CLI::success(wp_json_encode($result)); } catch (Throwable $error) { WP_CLI::error($error->getMessage()); } });
    WP_CLI::add_command('rb-care import-sellers', function ($args) { try { WP_CLI::success(wp_json_encode(rbcare_import_sellers($args[0]))); } catch (Throwable $error) { WP_CLI::error($error->getMessage()); } });
    WP_CLI::add_command('rb-care setup', function ($args, $assoc) {
        try {
            if (!class_exists('WooCommerce')) throw new RuntimeException('Activate WooCommerce first.');
            $ids = rbcare_setup_pages($args[0], isset($assoc['publish']));
            if (isset($assoc['configure-local'])) {
                if ('local' !== wp_get_environment_type()) throw new RuntimeException('--configure-local requires WP_ENVIRONMENT_TYPE=local.');
                update_option('show_on_front', 'page'); update_option('page_on_front', $ids['home']);
                foreach (array('cart' => '[woocommerce_cart]', 'checkout' => '[woocommerce_checkout]') as $slug => $shortcode) wp_update_post(array('ID' => $ids[$slug], 'post_content' => $shortcode));
                foreach (array('products' => 'shop', 'cart' => 'cart', 'checkout' => 'checkout', 'my-account' => 'myaccount', 'policies/terms' => 'terms') as $slug => $option) update_option('woocommerce_' . $option . '_page_id', $ids[$slug]);
                update_option('wp_page_for_privacy_policy', $ids['policies/privacy']); update_option('woocommerce_default_country', 'IN:UP'); update_option('woocommerce_currency', 'INR');
                update_option('woocommerce_allowed_countries', 'specific'); update_option('woocommerce_specific_allowed_countries', array('IN')); update_option('woocommerce_ship_to_countries', '');
                update_option('woocommerce_manage_stock', 'yes'); update_option('woocommerce_hide_out_of_stock_items', 'yes'); update_option('woocommerce_hold_stock_minutes', 12);
                update_option('woocommerce_enable_guest_checkout', 'yes'); update_option('woocommerce_enable_myaccount_registration', 'yes'); update_option('woocommerce_enable_signup_and_login_from_checkout', 'yes');
                update_option('woocommerce_permalinks', array('product_base' => '/products', 'category_base' => '/product-category', 'tag_base' => '/product-tag'));
                update_option('blog_public', 0); update_option('timezone_string', 'Asia/Kolkata'); update_option('woocommerce_allow_tracking', 'no');
                update_option('woocommerce_coming_soon', 'no');
                update_option('woocommerce_store_address', ''); update_option('woocommerce_store_city', 'Lucknow'); update_option('permalink_structure', '/%postname%/');
                // Offline BACS is used only as a local checkout fixture; never a fake paid transaction.
                update_option('woocommerce_bacs_settings', array('enabled' => 'yes', 'title' => 'Local test order — no payment', 'description' => 'Development only. No money is transferred. The order remains on hold.', 'instructions' => 'Local development fixture; no payment was collected.'));
                update_option('woocommerce_cod_settings', array('enabled' => 'no')); update_option('woocommerce_cheque_settings', array('enabled' => 'no'));
                $zones = WC_Shipping_Zones::get_zones(); $zone = null;
                foreach ($zones as $entry) if ('RB Care India' === $entry['zone_name']) $zone = new WC_Shipping_Zone($entry['id']);
                if (!$zone) { $zone = new WC_Shipping_Zone(); $zone->set_zone_name('RB Care India'); $zone->set_zone_order(0); $zone->add_location('IN', 'country'); $zone->save(); $zone->add_shipping_method('rbcare_delivery'); }
            }
            flush_rewrite_rules(); WP_CLI::success(wp_json_encode($ids));
        } catch (Throwable $error) { WP_CLI::error($error->getMessage()); }
    });
}
