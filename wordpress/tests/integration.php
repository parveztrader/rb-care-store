<?php
/** Run with wp eval-file /project/tests/integration.php inside the isolated local stack. */
if (!defined('ABSPATH') || 'local' !== wp_get_environment_type()) throw new RuntimeException('Local installation required.');
$GLOBALS['rbcare_test_checks'] = 0;
function rbtest($condition, $label) { if (!$condition) throw new RuntimeException('FAIL: ' . $label); ++$GLOBALS['rbcare_test_checks']; WP_CLI::log('PASS: ' . $label); }
$product_id = 0; $order_id = 0;
try {
    $fixture = json_decode(file_get_contents('/project/dev/private/http-fixture.json'), true, 512, JSON_THROW_ON_ERROR);
    $id = rbcare_find_request($fixture['id']);
    rbtest((bool) $id, 'real multipart submission persisted as a private WordPress record');
    rbtest('private' === get_post_status($id), 'seller record stays private');
    rbtest('NEW' === get_post_meta($id, '_rb_status', true) && 0.0 === (float) get_post_meta($id, '_rb_teamPrice', true), 'submitted status and price cannot bypass team review');
    rbtest(!rbcare_seller_authorized($id, 'Bearer invalid') && rbcare_seller_authorized($id, 'Bearer ' . $fixture['token']), 'tracking secret is validated against a saved hash');
    rbtest(!rbcare_is_public_request($id), 'new seller submission is absent from community');
    rbtest(is_wp_error(rbcare_review_request($id, 'PUBLISHED', 2000, 'Attempt')), 'publication cannot skip quotation');
    rbtest(is_wp_error(rbcare_review_request($id, 'QUOTED', 0, 'Attempt')), 'quotation requires a positive price');
    rbtest(true === rbcare_review_request($id, 'QUOTED', 2300, 'Team-approved local fixture'), 'team can quote the submitted appliance');
    update_post_meta($id, '_rb_publishConsent', '0');
    rbtest(is_wp_error(rbcare_review_request($id, 'PUBLISHED', 2300, 'Attempt')), 'publication requires seller consent');
    update_post_meta($id, '_rb_publishConsent', '1');
    rbtest(true === rbcare_review_request($id, 'PUBLISHED', 2300, 'Team-approved local fixture') && rbcare_is_public_request($id), 'separate publication succeeds after quotation and consent');
    $public = rbcare_request_view($id, true);
    foreach (array('phone', 'name', 'area', 'pincode', 'tokenHash', 'token_hash', 'ownerNote') as $key) rbtest(!array_key_exists($key, $public), 'public listing omits ' . $key);
    $private = rbcare_request_view($id);
    rbtest(2300.0 === (float) $private['teamPrice'] && 'Team-approved local fixture' === $private['ownerNote'], 'customer receives the exact team price and note');
    wp_update_post(array('ID' => $id, 'post_status' => 'publish'));
    rbtest('private' === get_post_status($id), 'native post publish action cannot expose the private source record');

    $catalog = rbcare_import_catalog('/project/migration/catalog.seed.json', true);
    rbtest(0 === $catalog['created'] && 4 === $catalog['skipped'], 'catalog import is idempotent by SKU');
    $original = wc_get_product(wc_get_product_id_by_sku('RBR-LKO-001'));
    rbtest($original && '14500' === $original->get_regular_price() && 90 === (int) $original->get_meta('_rb_warrantyDays'), 'source price and warranty migrated');
    rbtest('REFERENCE' === $original->get_meta('_rb_photoSource'), 'seed photos remain labelled as reference photography');

    $product = new WC_Product_Simple(); $product->set_name('RB Care isolated test appliance'); $product->set_sku('RB-TEST-' . wp_generate_uuid4()); $product->set_status('publish'); $product->set_regular_price('1000'); $product->set_manage_stock(true); $product->set_stock_quantity(1); $product->set_sold_individually(true);
    foreach (array('city' => 'Lucknow', 'stockMode' => 'CITY', 'delivery' => 650) as $key => $value) $product->update_meta_data('_rb_' . $key, $value);
    $product_id = $product->save(); $items = array(array('data' => $product, 'quantity' => 1));
    rbtest('' === rbcare_city_error(' lucknow ', $items), 'delivery accepts the saved stock city');
    rbtest('' !== rbcare_city_error('Mumbai', $items), 'delivery rejects a different stock city');
    do_action('woocommerce_shipping_init');
    $shipping = new RB_Care_Shipping(); $shipping->calculate_shipping(array('destination' => array('city' => 'Lucknow'), 'contents' => $items));
    $rates = $shipping->rates; $rate = reset($rates);
    rbtest($rate && 650.0 === (float) $rate->get_cost(), 'native shipping rate uses the saved per-product charge');
    $bad_shipping = new RB_Care_Shipping(); $bad_shipping->calculate_shipping(array('destination' => array('city' => 'Mumbai'), 'contents' => $items));
    rbtest(0 === count($bad_shipping->rates), 'unsupported destination does not receive a delivery rate');
    $order = wc_create_order(); $order_id = $order->get_id(); $order->add_product($product, 1); $order->set_billing_email('test@example.invalid'); $order->calculate_totals(); $order->update_status('on-hold');
    rbtest(0 === wc_get_product($product_id)->get_stock_quantity(), 'native on-hold order reduces inventory');
    wc_reduce_stock_levels($order_id);
    rbtest(0 === wc_get_product($product_id)->get_stock_quantity(), 'repeated order stock reduction does not oversell the unit');
    $persisted_order = wc_get_order($order_id);
    rbtest($persisted_order && 'on-hold' === $persisted_order->get_status() && !$persisted_order->is_paid(), 'native order persists without inventing a payment');
    $persisted_order->update_status('cancelled');
    rbtest(1 === wc_get_product($product_id)->get_stock_quantity(), 'native cancellation restores inventory');
    rbtest(true === apply_filters('pre_wp_mail', null, array()), 'local outgoing email is blocked');
    rbtest(false === apply_filters('woocommerce_webhook_should_deliver', true), 'local outgoing webhooks are blocked');
} finally {
    if ($order_id) { $order = wc_get_order($order_id); if ($order) $order->delete(true); }
    if ($product_id) { $product = wc_get_product($product_id); if ($product) $product->delete(true); }
}
WP_CLI::success($GLOBALS['rbcare_test_checks'] . ' integration assertions passed.');
