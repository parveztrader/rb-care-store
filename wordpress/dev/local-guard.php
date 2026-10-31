<?php
/** Local-only mu-plugin. Never include this file in a production theme/plugin ZIP. */
defined('ABSPATH') || exit;
if (!defined('RBCARE_LOCAL') || !RBCARE_LOCAL) return;
add_filter('pre_wp_mail', '__return_true');
add_filter('woocommerce_webhook_should_deliver', '__return_false');
add_filter('woocommerce_allow_tracking', '__return_false');
add_action('admin_notices', function () { echo '<div class="notice notice-warning"><p><strong>RB Care local development</strong> — outgoing email/webhooks are blocked. Checkout uses an offline test method and does not collect money. Source FAQ and policies contain conflicting warranty/return claims; owner approval is required before launch.</p></div>'; });
