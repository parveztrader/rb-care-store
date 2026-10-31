<?php
if (!defined('ABSPATH') || 'local' !== wp_get_environment_type()) throw new RuntimeException('Local installation required.');
$fixture = json_decode(file_get_contents('/project/dev/private/admin-fixture.json'), true, 512, JSON_THROW_ON_ERROR);
$seller_id = rbcare_find_request($fixture['id']);
if ($seller_id && 'RBADMINQA' === get_post_meta($seller_id, '_rb_brand', true) && rbcare_seller_authorized($seller_id, 'Bearer ' . $fixture['token'])) {
    foreach ((array) get_post_meta($seller_id, '_rb_photos', true) as $photo) { $file = rbcare_private_directory() . '/' . basename($photo['file']); if (is_file($file)) unlink($file); }
    wp_delete_post($seller_id, true);
}
$order = wc_get_order($fixture['orderId']);
if ($order && $fixture['run'] === $order->get_meta('_rb_admin_qa')) { if ('cancelled' !== $order->get_status()) $order->update_status('cancelled'); $order->delete(true); }
$product = wc_get_product($fixture['productId']);
if ($product && $fixture['run'] === $product->get_meta('_rb_admin_qa')) $product->delete(true);
if ('rb_enquiry' === get_post_type($fixture['enquiryId']) && 'RB Admin QA Customer' === get_post_meta($fixture['enquiryId'], '_rb_name', true)) wp_delete_post($fixture['enquiryId'], true);
if ($fixture['run'] === get_user_meta($fixture['customerId'], '_rb_admin_qa', true)) { require_once ABSPATH . 'wp-admin/includes/user.php'; wp_delete_user($fixture['customerId']); }
WP_CLI::success('Removed only matching backend QA fixtures and the temporary customer account.');
