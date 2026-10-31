<?php
if (!defined('ABSPATH') || 'local' !== wp_get_environment_type()) throw new RuntimeException('Local installation required.');
$fixture = json_decode(file_get_contents('/project/dev/private/admin-fixture.json'), true, 512, JSON_THROW_ON_ERROR);
$passed = array();
$check = function ($condition, $label) use (&$passed) { if (!$condition) throw new RuntimeException($label); $passed[] = $label; };
$product = wc_get_product($fixture['productId']);
$check($product && $product->get_meta('_rb_admin_qa') === $fixture['run'], 'matching product fixture');
$check(1234.0 === (float) $product->get_regular_price() && 'draft' === $product->get_status(), 'admin price saved without publishing fixture');
foreach (array('city' => 'Gonda', 'stockMode' => 'CENTRAL', 'model' => 'QA-SAVED', 'warrantyDays' => '45', 'delivery' => '125') as $field => $value) $check((string) $product->get_meta('_rb_' . $field) === $value, 'saved product ' . $field);
$check(array('Cooling', 'Controls') === $product->get_meta('_rb_tested'), 'saved multiline tested-functions array');
$check(array(array('label' => 'Capacity', 'value' => '7 kg'), array('label' => 'Color', 'value' => 'White')) === $product->get_meta('_rb_specifications'), 'saved structured specifications');
$check('RB Admin QA appliance' === $product->get_name(), 'invalid nonce did not alter product title');
$order = wc_get_order($fixture['orderId']);
$check($order && 'cancelled' === $order->get_status() && !$order->is_paid(), 'admin cancellation persisted with no payment');
$check(1000.0 === (float) $order->get_total(), 'order price snapshot survives later product price change');
$check(1 === $product->get_stock_quantity(), 'native cancellation restored fixture stock');
$notes = wc_get_order_notes(array('order_id' => $fixture['orderId']));
$private_note = false; $reduced = false; $restored = false;
foreach ($notes as $note) { $content = html_entity_decode($note->content, ENT_QUOTES | ENT_HTML5, 'UTF-8'); if (str_contains($content, 'Backend QA: private note saved through the native order editor.')) $private_note = !$note->customer_note; if (str_contains($content, '1→0')) $reduced = true; if (str_contains($content, '0→1')) $restored = true; }
$check($private_note, 'native order note persisted privately'); $check($reduced && $restored, 'admin order notes record reduction and restoration');
$seller_id = rbcare_find_request($fixture['id']);
$expected = $args[0] ?? 'PUBLISHED';
$check($seller_id && $expected === get_post_meta($seller_id, '_rb_status', true), 'seller UI status saved as ' . $expected);
$check(1800.0 === (float) get_post_meta($seller_id, '_rb_teamPrice', true) && 'private' === get_post_status($seller_id), 'seller price saved while source post stays private');
$check('Temporary contact enquiry for backend QA.' === get_post_meta($fixture['enquiryId'], '_rb_message', true) && 'private' === get_post_status($fixture['enquiryId']), 'contact enquiry persisted privately');
$check(current_user_can('manage_woocommerce') === false, 'CLI fixture check does not depend on an admin session');
echo wp_json_encode(array('passed' => $passed)) . PHP_EOL;
