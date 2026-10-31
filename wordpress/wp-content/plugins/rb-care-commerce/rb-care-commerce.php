<?php
/**
 * Plugin Name: RB Care Commerce
 * Description: Appliance condition reports, city delivery, private seller valuations, community listings and enquiries for WooCommerce.
 * Version: 1.0.1
 * Requires at least: 6.7
 * Requires PHP: 8.1
 * Requires Plugins: woocommerce
 * Text Domain: rb-care-commerce
 */
defined('ABSPATH') || exit;
define('RBCARE_VERSION', '1.0.1');
define('RBCARE_PLUGIN_FILE', __FILE__);
define('RBCARE_DIR', plugin_dir_path(__FILE__));
require_once RBCARE_DIR . 'includes/core.php';
require_once RBCARE_DIR . 'includes/products.php';
require_once RBCARE_DIR . 'includes/sellers.php';
require_once RBCARE_DIR . 'includes/forms.php';
require_once RBCARE_DIR . 'includes/migration.php';
add_action('before_woocommerce_init', function () {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', RBCARE_PLUGIN_FILE, true);
    }
});
register_activation_hook(__FILE__, function () { rbcare_register_types(); flush_rewrite_rules(); });
register_deactivation_hook(__FILE__, 'flush_rewrite_rules');
