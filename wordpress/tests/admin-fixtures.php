<?php
if (!defined('ABSPATH') || 'local' !== wp_get_environment_type()) throw new RuntimeException('Local installation required.');
$fixture = json_decode(file_get_contents('/project/dev/private/admin-fixture.json'), true, 512, JSON_THROW_ON_ERROR);
$product = new WC_Product_Simple();
$product->set_name('RB Admin QA appliance'); $product->set_sku('RB-ADMIN-QA-' . $fixture['run']); $product->set_status('draft'); $product->set_regular_price('1000'); $product->set_manage_stock(true); $product->set_stock_quantity(1); $product->set_sold_individually(true);
foreach (array('city' => 'Lucknow', 'stockMode' => 'CITY', 'condition' => 'Very Good', 'delivery' => 100, 'warrantyDays' => 30, 'photoSource' => 'REFERENCE', 'brand' => 'RBADMINQA', 'model' => 'QA-ORIGINAL') as $key => $value) $product->update_meta_data('_rb_' . $key, $value);
$product->update_meta_data('_rb_admin_qa', $fixture['run']); $product_id = $product->save();
$order = wc_create_order(); $order->add_product($product, 1); $order->set_billing_first_name('RB Admin QA'); $order->set_billing_last_name('Customer'); $order->set_billing_email('admin-qa@example.invalid'); $order->set_billing_city('Lucknow'); $order->set_billing_country('IN'); $order->set_payment_method('bacs'); $order->update_meta_data('_rb_admin_qa', $fixture['run']); $order->calculate_totals(); $order->save();
$customer_id = wp_insert_user(array('user_login' => $fixture['customerUser'], 'user_pass' => $fixture['customerPassword'], 'user_email' => 'admin-qa-' . $fixture['run'] . '@example.invalid', 'role' => 'customer'));
if (is_wp_error($customer_id)) throw new RuntimeException($customer_id->get_error_message());
update_user_meta($customer_id, '_rb_admin_qa', $fixture['run']);
echo wp_json_encode(array('productId' => $product_id, 'orderId' => $order->get_id(), 'customerId' => $customer_id, 'sellerId' => rbcare_find_request($fixture['id']))) . PHP_EOL;
