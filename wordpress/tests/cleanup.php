<?php
if (!defined('ABSPATH') || 'local' !== wp_get_environment_type()) throw new RuntimeException('Local installation required.');
$fixture = json_decode(file_get_contents('/project/dev/private/http-fixture.json'), true, 512, JSON_THROW_ON_ERROR);
$id = rbcare_find_request($fixture['id']);
if ($id && 'RBTEST' === get_post_meta($id, '_rb_brand', true) && rbcare_seller_authorized($id, 'Bearer ' . $fixture['token'])) {
    rbcare_review_request($id, 'CLOSED', 2300, 'Automated local test completed.');
    foreach ((array) get_post_meta($id, '_rb_photos', true) as $photo) {
        $path = rbcare_private_directory() . '/' . basename($photo['file']); if (is_file($path)) unlink($path);
    }
    wp_delete_post($id, true);
}
$enquiry_id = (int) ($fixture['enquiryId'] ?? 0);
if ($enquiry_id && 'rb_enquiry' === get_post_type($enquiry_id) && 'RB Care Test Customer' === get_post_meta($enquiry_id, '_rb_name', true)) wp_delete_post($enquiry_id, true);
WP_CLI::success('Removed only the matching automated-test fixtures.');
