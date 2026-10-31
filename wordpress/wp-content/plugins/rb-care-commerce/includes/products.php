<?php
defined('ABSPATH') || exit;
function rbcare_product_fields() {
    return array('city' => 'Stock city', 'stockMode' => 'Stock mode (CITY or CENTRAL)', 'condition' => 'Condition', 'brand' => 'Brand', 'model' => 'Model', 'capacity' => 'Capacity', 'color' => 'Color', 'age' => 'Approximate age', 'warrantyDays' => 'Warranty days', 'delivery' => 'Delivery charge (INR)', 'photoSource' => 'Photo source (ACTUAL or REFERENCE)', 'defects' => 'Known defects / wear', 'tested' => 'Tested functions — one per line', 'highlights' => 'Highlights — one per line', 'included' => 'Included accessories — one per line', 'packaging' => 'Packaging', 'repairHistory' => 'Repair history', 'installation' => 'Installation notes', 'specifications' => 'Specifications — Label: Value per line', 'photos' => 'External photos — Label | URL per line');
}
add_filter('woocommerce_product_data_tabs', function ($tabs) { $tabs['rbcare'] = array('label' => 'RB Care appliance', 'target' => 'rbcare_product_data', 'class' => array('show_if_simple'), 'priority' => 25); return $tabs; });
add_action('woocommerce_product_data_panels', function () {
    global $product_object;
    echo '<div id="rbcare_product_data" class="panel woocommerce_options_panel hidden"><p class="form-field">Use native product images for actual unit photography. Imported external reference photos remain labelled. Unknown details should stay empty.</p>';
    foreach (rbcare_product_fields() as $field => $label) {
        $value = $product_object ? $product_object->get_meta('_rb_' . $field) : '';
        if (in_array($field, array('tested', 'highlights', 'included'), true)) $value = is_array($value) ? implode("\n", $value) : $value;
        if (in_array($field, array('photos', 'specifications'), true) && is_array($value)) {
            $rows = array(); foreach ($value as $row) $rows[] = ($row['label'] ?? '') . ('photos' === $field ? ' | ' : ': ') . ($row['url'] ?? $row['value'] ?? '');
            $value = implode("\n", $rows);
        }
        $args = array('id' => '_rb_' . $field, 'label' => $label, 'value' => $value, 'desc_tip' => false);
        if (in_array($field, array('warrantyDays', 'delivery'), true)) { $args['type'] = 'number'; $args['custom_attributes'] = array('min' => 0); }
        if (in_array($field, array('stockMode', 'photoSource'), true)) {
            $args['options'] = 'stockMode' === $field ? array('CITY' => 'CITY', 'CENTRAL' => 'CENTRAL') : array('REFERENCE' => 'REFERENCE', 'ACTUAL' => 'ACTUAL');
            woocommerce_wp_select($args);
        } elseif (in_array($field, array('defects', 'tested', 'highlights', 'included', 'packaging', 'repairHistory', 'installation', 'specifications', 'photos'), true)) woocommerce_wp_textarea_input($args);
        else woocommerce_wp_text_input($args);
    }
    echo '</div>';
});
add_action('woocommerce_admin_process_product_object', function ($product) {
    if (!current_user_can('edit_post', $product->get_id()) || !isset($_POST['_rb_city'])) return;
    foreach (rbcare_product_fields() as $field => $label) {
        $value = rbcare_clean(wp_unslash($_POST['_rb_' . $field] ?? ''), 10000);
        if (in_array($field, array('warrantyDays', 'delivery'), true)) $value = max(0, (float) $value);
        if ('stockMode' === $field && !in_array($value, array('CITY', 'CENTRAL'), true)) $value = 'CITY';
        if ('photoSource' === $field && !in_array($value, array('ACTUAL', 'REFERENCE'), true)) $value = 'REFERENCE';
        if (in_array($field, array('tested', 'highlights', 'included'), true)) $value = array_values(array_filter(array_map('trim', explode("\n", $value))));
        if (in_array($field, array('specifications', 'photos'), true)) {
            $items = array(); foreach (array_filter(explode("\n", $value)) as $line) {
                $parts = explode('photos' === $field ? ' | ' : ':', $line, 2);
                if (2 !== count($parts)) continue;
                if ('photos' === $field) { $url = esc_url_raw(trim($parts[1]), array('http', 'https')); if ($url) $items[] = array('label' => trim($parts[0]), 'url' => $url); }
                else $items[] = array('label' => trim($parts[0]), 'value' => trim($parts[1]));
            } $value = array_slice($items, 0, 'photos' === $field ? 10 : 30);
        }
        $product->update_meta_data('_rb_' . $field, $value);
    }
});
function rbcare_external_image($product, $class = '') {
    $photos = $product->get_meta('_rb_photos');
    $url = is_array($photos) && !empty($photos[0]['url']) ? $photos[0]['url'] : $product->get_meta('_rb_image');
    return $url ? '<img class="' . esc_attr($class) . '" src="' . esc_url($url, array('http', 'https')) . '" alt="' . esc_attr($product->get_name()) . '" loading="lazy" width="600" height="600">' : '';
}
add_filter('woocommerce_product_get_image', function ($image, $product) { return !$product->get_image_id() && rbcare_external_image($product) ? rbcare_external_image($product) : $image; }, 10, 2);
add_filter('woocommerce_single_product_image_thumbnail_html', function ($html) {
    global $product;
    return $product && !$product->get_image_id() && rbcare_external_image($product) ? '<div class="woocommerce-product-gallery__image">' . rbcare_external_image($product) . '</div>' : $html;
});
add_action('woocommerce_single_product_summary', function () {
    global $product;
    if (!$product->get_meta('_rb_city')) return;
    echo '<p class="rb-product-note">' . esc_html(rbcare_text('Location')) . ': ' . esc_html($product->get_meta('_rb_city')) . ' · ' . esc_html($product->get_meta('_rb_condition')) . '</p>';
    echo '<p class="rb-product-note">' . esc_html('CITY' === $product->get_meta('_rb_stockMode') ? sprintf('Delivery within %s only.', $product->get_meta('_rb_city')) : 'Delivery to supported cities after feasibility is confirmed.') . '</p>';
    if (!$product->get_image_id()) echo '<p class="rb-product-note">' . esc_html(rbcare_text('ACTUAL' === $product->get_meta('_rb_photoSource') ? 'Actual unit photos' : 'Reference photos — not the actual unit')) . '</p>';
}, 25);
add_filter('woocommerce_product_tabs', function ($tabs) {
    global $product;
    if ($product && $product->get_meta('_rb_city')) $tabs['rbcare_condition'] = array('title' => rbcare_text('Condition & specifications'), 'priority' => 15, 'callback' => 'rbcare_condition_tab');
    return $tabs;
});
function rbcare_condition_tab() {
    global $product;
    echo '<h2>' . esc_html(rbcare_text('Condition & specifications')) . '</h2><table class="rb-facts" translate="no">';
    foreach (array('brand', 'model', 'capacity', 'color', 'age', 'condition', 'city', 'warrantyDays', 'defects', 'packaging', 'repairHistory', 'installation') as $key) {
        $value = $product->get_meta('_rb_' . $key);
        if ('' === $value || null === $value) continue;
        echo '<tr><th>' . esc_html(rbcare_text(rbcare_product_fields()[$key])) . '</th><td>' . nl2br(esc_html($value)) . '</td></tr>';
    }
    foreach (array('tested' => 'Tested functions', 'highlights' => 'Highlights', 'included' => 'Included accessories') as $key => $label) { $values = $product->get_meta('_rb_' . $key); if (is_array($values) && $values) echo '<tr><th>' . esc_html(rbcare_text($label)) . '</th><td>' . esc_html(implode(', ', $values)) . '</td></tr>'; }
    foreach ((array) $product->get_meta('_rb_specifications') as $row) if (is_array($row)) echo '<tr><th>' . esc_html($row['label'] ?? '') . '</th><td>' . esc_html($row['value'] ?? '') . '</td></tr>';
    echo '</table>';
    $photos = $product->get_meta('_rb_photos');
    if (is_array($photos) && count($photos) > 1) { echo '<div class="rb-gallery-extra">'; foreach ($photos as $photo) echo '<a href="' . esc_url($photo['url']) . '"><img loading="lazy" src="' . esc_url($photo['url']) . '" alt="' . esc_attr($photo['label']) . '"></a>'; echo '</div>'; }
}
function rbcare_city_error($city, $items) {
    $city = strtolower(trim($city));
    foreach ($items as $item) {
        $product = $item['data'];
        if (!$product || !$product->get_meta('_rb_city')) continue;
        $allowed = 'CITY' === $product->get_meta('_rb_stockMode') ? array(strtolower($product->get_meta('_rb_city'))) : array_map('strtolower', apply_filters('rbcare_supported_cities', array('Lucknow', 'Gonda', 'Mumbai', 'Pune')));
        if (!in_array($city, $allowed, true)) return sprintf('%s: delivery is available in %s only.', $product->get_name(), implode(', ', array_map('ucfirst', $allowed)));
    }
    return '';
}
add_filter('woocommerce_billing_fields', function ($fields) { if (isset($fields['billing_phone'])) $fields['billing_phone']['required'] = true; return $fields; });
add_action('woocommerce_after_checkout_validation', function ($data, $errors) {
    $city = !empty($data['ship_to_different_address']) ? ($data['shipping_city'] ?? '') : ($data['billing_city'] ?? '');
    $error = WC()->cart ? rbcare_city_error($city, WC()->cart->get_cart()) : '';
    if ($error) $errors->add('rbcare_city', $error);
}, 10, 2);
add_action('woocommerce_store_api_checkout_update_order_from_request', function ($order) {
    $city = $order->get_shipping_city() ?: $order->get_billing_city();
    $error = WC()->cart ? rbcare_city_error($city, WC()->cart->get_cart()) : '';
    if ($error) throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException('rbcare_city', $error, 400);
});
add_action('woocommerce_shipping_init', function () {
    if (class_exists('RB_Care_Shipping')) return;
    class RB_Care_Shipping extends WC_Shipping_Method {
        public function __construct($instance_id = 0) {
            $this->id = 'rbcare_delivery'; $this->instance_id = absint($instance_id);
            $this->method_title = 'RB Care appliance delivery'; $this->method_description = 'Uses the saved per-unit delivery charge and validates stock city.';
            $this->supports = array('shipping-zones', 'instance-settings');
            $this->instance_form_fields = array('title' => array('title' => 'Title', 'type' => 'text', 'default' => 'Appliance delivery'));
            $this->init_settings(); $this->title = $this->get_option('title', 'Appliance delivery'); $this->enabled = 'yes';
            add_action('woocommerce_update_options_shipping_' . $this->id, array($this, 'process_admin_options'));
        }
        public function calculate_shipping($package = array()) {
            if (rbcare_city_error($package['destination']['city'] ?? '', $package['contents'])) return;
            $cost = 0;
            foreach ($package['contents'] as $item) if ($item['data']->needs_shipping()) $cost += max(0, (float) $item['data']->get_meta('_rb_delivery')) * $item['quantity'];
            $this->add_rate(array('id' => $this->get_rate_id(), 'label' => $this->title, 'cost' => $cost, 'package' => $package));
        }
    }
});
add_filter('woocommerce_shipping_methods', function ($methods) { $methods['rbcare_delivery'] = 'RB_Care_Shipping'; return $methods; });
add_action('woocommerce_product_query', function ($query) {
    if (!empty($_GET['city']) && is_scalar($_GET['city'])) { $meta = (array) $query->get('meta_query'); $meta[] = array('key' => '_rb_city', 'value' => sanitize_text_field(wp_unslash($_GET['city']))); $query->set('meta_query', $meta); }
});
add_action('woocommerce_before_shop_loop', function () {
    echo '<form class="rb-filter" method="get"><label>' . esc_html(rbcare_text('City')) . ' <select name="city"><option value="">' . esc_html(rbcare_text('All cities')) . '</option>';
    foreach (array('Lucknow', 'Gonda', 'Mumbai', 'Pune') as $city) echo '<option value="' . esc_attr($city) . '" ' . selected(isset($_GET['city']) && is_scalar($_GET['city']) ? sanitize_text_field(wp_unslash($_GET['city'])) : '', $city, false) . '>' . esc_html(rbcare_text($city)) . '</option>';
    echo '</select></label> <button class="button" type="submit">' . esc_html(rbcare_text('Apply filters')) . '</button></form>';
}, 15);
add_filter('posts_search', function ($search, $query) {
    if (is_admin() || !$query->is_main_query() || !$query->is_search() || 'product' !== $query->get('post_type') || !$query->get('s')) return $search;
    global $wpdb;
    $like = '%' . $wpdb->esc_like($query->get('s')) . '%';
    $meta = $wpdb->prepare("EXISTS (SELECT 1 FROM {$wpdb->postmeta} rbmeta WHERE rbmeta.post_id = {$wpdb->posts}.ID AND rbmeta.meta_key IN ('_rb_brand','_rb_model') AND rbmeta.meta_value LIKE %s)", $like);
    $original = preg_replace('/^\s*AND\s+/i', '', trim($search));
    return $original ? " AND (({$original}) OR ({$meta} AND {$wpdb->posts}.post_password = '')) " : $search;
}, 20, 2);
