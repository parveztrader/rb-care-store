<?php
/** Read-only local state summary for handoff and directory moves. */
if (!defined('WP_CLI') || !WP_CLI) exit;
$products = array();
foreach (wc_get_products(array('limit' => -1, 'status' => array('publish', 'draft', 'private', 'pending'))) as $product) {
    $products[] = array('id' => $product->get_id(), 'sku' => $product->get_sku(), 'status' => $product->get_status(), 'price' => $product->get_price(), 'stock' => $product->get_stock_quantity(), 'stock_status' => $product->get_stock_status());
}
usort($products, function ($a, $b) { return $a['id'] <=> $b['id']; });
$orders = array();
foreach (wc_get_orders(array('limit' => -1, 'orderby' => 'ID', 'order' => 'ASC')) as $order) $orders[] = array('id' => $order->get_id(), 'status' => $order->get_status(), 'total' => $order->get_total());
$state = array('wordpress' => get_bloginfo('version'), 'woocommerce' => defined('WC_VERSION') ? WC_VERSION : null, 'theme' => get_stylesheet(), 'theme_version' => wp_get_theme()->get('Version'), 'plugin_version' => defined('RBCARE_VERSION') ? RBCARE_VERSION : null, 'products' => $products, 'orders' => $orders, 'users' => count_users()['total_users'], 'seller_requests' => (int) wp_count_posts('rb_seller_request')->private, 'enquiries' => (int) wp_count_posts('rb_enquiry')->private);
echo wp_json_encode($state, JSON_PRETTY_PRINT) . PHP_EOL;
