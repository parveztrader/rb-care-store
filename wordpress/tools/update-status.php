<?php
/** Read-only update inventory; pass refresh to query WordPress.org again. */
if (!defined('WP_CLI') || !WP_CLI) exit;
require_once ABSPATH . 'wp-admin/includes/plugin.php';
if ('refresh' === ($args[0] ?? '')) {
    wp_clean_plugins_cache(); wp_clean_themes_cache();
    wp_version_check(array(), true); wp_update_plugins(); wp_update_themes();
}
$plugins = array();
foreach (get_plugins() as $file => $plugin) $plugins[] = array('name' => $plugin['Name'], 'version' => $plugin['Version'], 'active' => is_plugin_active($file));
$themes = array();
foreach (wp_get_themes() as $slug => $theme) $themes[] = array('name' => $theme->get('Name'), 'version' => $theme->get('Version'), 'active' => get_stylesheet() === $slug);
echo wp_json_encode(array('core' => get_bloginfo('version'), 'woocommerce_db' => get_option('woocommerce_db_version'), 'plugins' => $plugins, 'themes' => $themes, 'updates' => wp_get_update_data()['counts']), JSON_PRETTY_PRINT) . PHP_EOL;
