<?php
/** Reconcile only the identified dummy browser checkout after QA. */
if (!defined('ABSPATH') || 'local' !== wp_get_environment_type()) throw new RuntimeException('Local installation required.');
$order = wc_get_order(absint($args[0] ?? 0));
if (!$order || 'checkout-test@example.invalid' !== $order->get_billing_email() || 'Local' !== $order->get_billing_first_name()) throw new RuntimeException('The expected local checkout fixture was not found.');
if ('on-hold' !== $order->get_status() || $order->is_paid() || 15150.0 !== (float) $order->get_total() || 650.0 !== (float) $order->get_shipping_total()) throw new RuntimeException('Native checkout totals/status do not match.');
$report = array('order' => $order->get_id(), 'status_before' => $order->get_status(), 'paid' => $order->is_paid(), 'total' => $order->get_total(), 'shipping' => $order->get_shipping_total(), 'payment_method' => $order->get_payment_method());
$order->update_status('cancelled', 'Local browser QA finished; stock restored. No payment collected.');
$product = wc_get_product(wc_get_product_id_by_sku('RBR-LKO-001'));
if (1 !== $product->get_stock_quantity()) throw new RuntimeException('Native cancellation did not restore the source unit.');
WP_CLI::success(wp_json_encode($report) . ' — test order cancelled and stock restored.');
