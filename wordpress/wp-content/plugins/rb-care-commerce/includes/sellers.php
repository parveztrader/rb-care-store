<?php
defined('ABSPATH') || exit;
function rbcare_private_directory() {
    $directory = defined('RBCARE_PRIVATE_DIR') ? RBCARE_PRIVATE_DIR : dirname(untrailingslashit(ABSPATH)) . '/rbcare-private';
    if (!wp_mkdir_p($directory)) throw new RuntimeException('Private photo storage is not writable. Configure RBCARE_PRIVATE_DIR outside the web root.');
    $real = wp_normalize_path(realpath($directory)); $web = trailingslashit(wp_normalize_path(realpath(ABSPATH)));
    if (!$real || str_starts_with(trailingslashit($real), $web)) throw new RuntimeException('Private photo storage must be outside the WordPress web root.');
    return $real;
}
function rbcare_find_request($uuid) {
    if (!rbcare_uuid_valid($uuid)) return 0;
    $ids = get_posts(array('post_type' => 'rb_seller_request', 'post_status' => 'private', 'meta_key' => '_rb_uuid', 'meta_value' => $uuid, 'fields' => 'ids', 'numberposts' => 1));
    return $ids ? (int) $ids[0] : 0;
}
function rbcare_seller_authorized($id, $authorization) {
    if (!$id) return false;
    $hash = get_post_meta($id, '_rb_token_hash', true);
    $token = preg_replace('/^Bearer\s+/i', '', (string) $authorization);
    return is_string($hash) && 64 === strlen($hash) && hash_equals($hash, hash('sha256', $token));
}
function rbcare_is_public_request($id) {
    return $id && 'private' === get_post_status($id) && 'rb_seller_request' === get_post_type($id) && 'PUBLISHED' === get_post_meta($id, '_rb_status', true) && '1' === get_post_meta($id, '_rb_publishConsent', true) && (float) get_post_meta($id, '_rb_teamPrice', true) > 0;
}
function rbcare_photo_url($uuid, $photo_id) {
    return add_query_arg(array('action' => 'rbcare_photo', 'request' => $uuid, 'photo' => $photo_id), admin_url('admin-post.php'));
}
function rbcare_request_view($id, $public = false) {
    $view = array('id' => get_post_meta($id, '_rb_uuid', true));
    $keys = $public ? array('category', 'brand', 'model', 'capacity', 'age', 'condition', 'description', 'repairs', 'city', 'teamPrice') : array('category', 'brand', 'model', 'capacity', 'age', 'condition', 'description', 'repairs', 'city', 'teamPrice', 'status', 'ownerNote');
    foreach ($keys as $key) $view[$key] = get_post_meta($id, '_rb_' . $key, true);
    $view['photos'] = array();
    foreach ((array) get_post_meta($id, '_rb_photos', true) as $photo) if (is_array($photo)) $view['photos'][] = array('id' => $photo['id'], 'url' => rbcare_photo_url($view['id'], $photo['id']));
    return $view;
}
function rbcare_validate_seller($input) {
    $data = array();
    foreach (array('category', 'brand', 'model', 'capacity', 'age', 'condition', 'description', 'repairs', 'name', 'phone', 'city', 'area', 'pincode') as $key) $data[$key] = rbcare_clean($input[$key] ?? '', in_array($key, array('description', 'repairs'), true) ? 2000 : 120);
    foreach (array('brand' => 2, 'model' => 2, 'capacity' => 1, 'name' => 2, 'city' => 2, 'area' => 2, 'description' => 15) as $key => $minimum) if (mb_strlen($data[$key]) < $minimum) return new WP_Error('rb_validation', 'Please complete ' . $key . ' with valid details.', array('status' => 400));
    if (!in_array($data['category'], array('Washing Machine', 'Refrigerator', 'Air Conditioner', 'Microwave', 'Other appliance'), true) || !in_array($data['condition'], array('Working well', 'Working with issues', 'Not working'), true) || !in_array($data['age'], array('Less than 1 year', '1–3 years', '3–5 years', '5–8 years', 'More than 8 years', 'Not sure'), true)) return new WP_Error('rb_validation', 'Choose a valid appliance, age and condition.', array('status' => 400));
    if (!preg_match('/^[6-9][0-9]{9}$/', $data['phone']) || !preg_match('/^[1-9][0-9]{5}$/', $data['pincode'])) return new WP_Error('rb_validation', 'Enter a valid mobile number and PIN code.', array('status' => 400));
    if (!in_array($input['contactConsent'] ?? '', array(true, 1, '1', 'true', 'on'), true)) return new WP_Error('rb_consent', 'Consent to contact you is required for team review.', array('status' => 400));
    $data['publishConsent'] = in_array($input['publishConsent'] ?? '', array(true, 1, '1', 'true', 'on'), true) ? '1' : '0';
    $data['contactConsent'] = '1';
    return $data;
}
function rbcare_create_seller(WP_REST_Request $request) {
    $guard = rbcare_request_guard($request); if (is_wp_error($guard)) return $guard;
    $data = rbcare_validate_seller($request->get_params()); if (is_wp_error($data)) return $data;
    $files = $request->get_file_params()['photos'] ?? null;
    if (!$files || !is_array($files['name']) || count($files['name']) < 1 || count($files['name']) > 6) return new WP_Error('rb_photos', 'Add 1–6 JPG, PNG or WebP photos, up to 3 MB each.', array('status' => 400));
    $prepared = array();
    foreach ($files['name'] as $index => $name) {
        $tmp = $files['tmp_name'][$index] ?? ''; $size = (int) ($files['size'][$index] ?? 0);
        if (($files['error'][$index] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !$size || $size > 3 * MB_IN_BYTES || !is_uploaded_file($tmp)) return new WP_Error('rb_photos', 'A photo could not be uploaded. Limit: 3 MB per photo.', array('status' => 400));
        $image = @getimagesize($tmp);
        if (!$image || !in_array($image['mime'], array('image/jpeg', 'image/png', 'image/webp'), true) || $image[0] > 12000 || $image[1] > 12000) return new WP_Error('rb_photos', 'Only valid JPG, PNG or WebP photos are accepted.', array('status' => 400));
        $prepared[] = array('tmp' => $tmp, 'mime' => $image['mime']);
    }
    $saved = array(); $id = 0;
    try {
        $directory = rbcare_private_directory(); $uuid = wp_generate_uuid4(); $token = bin2hex(random_bytes(32));
        $photos = array();
        foreach ($prepared as $file) {
            $photo_id = wp_generate_uuid4(); $filename = $uuid . '-' . $photo_id;
            if (!move_uploaded_file($file['tmp'], $directory . '/' . $filename)) throw new RuntimeException('Unable to store a photo.');
            chmod($directory . '/' . $filename, 0600); $saved[] = $directory . '/' . $filename;
            $photos[] = array('id' => $photo_id, 'file' => $filename, 'mime' => $file['mime']);
        }
        $id = wp_insert_post(array('post_type' => 'rb_seller_request', 'post_status' => 'private', 'post_title' => $data['brand'] . ' ' . $data['model'] . ' — ' . $data['city']), true);
        if (is_wp_error($id)) throw new RuntimeException('Unable to save your request.');
        foreach ($data as $key => $value) update_post_meta($id, '_rb_' . $key, $value);
        update_post_meta($id, '_rb_uuid', $uuid); update_post_meta($id, '_rb_token_hash', hash('sha256', $token));
        update_post_meta($id, '_rb_status', 'NEW'); update_post_meta($id, '_rb_teamPrice', 0); update_post_meta($id, '_rb_photos', $photos);
        return rbcare_private_response(array('id' => $uuid, 'token' => $token, 'trackingUrl' => home_url('/sell/track/#' . $uuid . ':' . $token)), 201);
    } catch (Throwable $error) {
        foreach ($saved as $filename) if (is_file($filename)) unlink($filename);
        if (is_int($id) && $id) wp_delete_post($id, true);
        return new WP_Error('rb_storage', 'We could not save this request. Please contact the team.', array('status' => 503));
    }
}
add_action('rest_api_init', function () {
    register_rest_route('rb-care/v1', '/sell', array('methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => 'rbcare_create_seller'));
    register_rest_route('rb-care/v1', '/sell/(?P<id>[a-fA-F0-9-]{36})', array('methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function ($request) {
        $id = rbcare_find_request($request['id']);
        if (!rbcare_seller_authorized($id, $request->get_header('authorization'))) return new WP_Error('rb_private', 'Invalid or missing tracking key.', array('status' => 404));
        return rbcare_private_response(rbcare_request_view($id));
    }));
});
function rbcare_serve_photo() {
    $uuid = isset($_GET['request']) && is_string($_GET['request']) ? sanitize_text_field(wp_unslash($_GET['request'])) : '';
    $photo_id = isset($_GET['photo']) && is_string($_GET['photo']) ? sanitize_text_field(wp_unslash($_GET['photo'])) : '';
    $id = rbcare_find_request($uuid);
    if (!rbcare_uuid_valid($photo_id) || !$id || (!rbcare_is_public_request($id) && !current_user_can('manage_woocommerce') && !rbcare_seller_authorized($id, $_SERVER['HTTP_AUTHORIZATION'] ?? ''))) { status_header(404); exit; }
    foreach ((array) get_post_meta($id, '_rb_photos', true) as $photo) {
        if (!is_array($photo) || ($photo['id'] ?? '') !== $photo_id) continue;
        try { $filename = rbcare_private_directory() . '/' . basename($photo['file']); } catch (Throwable $error) { status_header(503); exit; }
        if (!is_file($filename)) break;
        nocache_headers(); header('Content-Type: ' . $photo['mime']); header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: no-referrer'); header('Content-Length: ' . filesize($filename)); readfile($filename); exit;
    }
    status_header(404); exit;
}
add_action('admin_post_nopriv_rbcare_photo', 'rbcare_serve_photo');
add_action('admin_post_rbcare_photo', 'rbcare_serve_photo');
function rbcare_review_request($id, $status, $price, $note) {
    if ('rb_seller_request' !== get_post_type($id)) return new WP_Error('rb_request', 'Request not found.');
    $prior = get_post_meta($id, '_rb_status', true);
    if (!in_array($status, array('NEW', 'QUOTED', 'PUBLISHED', 'CLOSED', 'REJECTED'), true) || !is_numeric($price) || $price < 0 || $price > 1000000) return new WP_Error('rb_review', 'Choose a valid status and price.');
    if (in_array($status, array('QUOTED', 'PUBLISHED'), true) && $price <= 0) return new WP_Error('rb_review', 'Enter a positive team price first.');
    if ('PUBLISHED' === $status && (!in_array($prior, array('QUOTED', 'PUBLISHED'), true) || '1' !== get_post_meta($id, '_rb_publishConsent', true))) return new WP_Error('rb_review', 'Save a QUOTED team price first and confirm seller publication consent.');
    update_post_meta($id, '_rb_status', $status); update_post_meta($id, '_rb_teamPrice', 'NEW' === $status ? 0 : (float) $price); update_post_meta($id, '_rb_ownerNote', rbcare_clean($note));
    return true;
}
add_action('add_meta_boxes_rb_seller_request', function () {
    add_meta_box('rbcare_review', 'Seller request — team valuation', function ($post) {
        wp_nonce_field('rbcare_review_' . $post->ID, 'rbcare_review_nonce');
        echo '<table class="widefat striped"><tbody>';
        foreach (array('uuid', 'category', 'brand', 'model', 'capacity', 'age', 'condition', 'description', 'repairs', 'name', 'phone', 'city', 'area', 'pincode', 'publishConsent', 'contactConsent') as $key) echo '<tr><th>' . esc_html($key) . '</th><td>' . nl2br(esc_html(get_post_meta($post->ID, '_rb_' . $key, true))) . '</td></tr>';
        echo '</tbody></table><p>';
        foreach ((array) get_post_meta($post->ID, '_rb_photos', true) as $photo) if (is_array($photo)) echo '<a target="_blank" rel="noopener" href="' . esc_url(rbcare_photo_url(get_post_meta($post->ID, '_rb_uuid', true), $photo['id'])) . '"><img style="width:160px;height:120px;object-fit:contain" src="' . esc_url(rbcare_photo_url(get_post_meta($post->ID, '_rb_uuid', true), $photo['id'])) . '" alt="Seller photo"></a> ';
        echo '</p><p><label>Status <select name="rb_status">';
        foreach (array('NEW', 'QUOTED', 'PUBLISHED', 'CLOSED', 'REJECTED') as $status) echo '<option ' . selected(get_post_meta($post->ID, '_rb_status', true), $status, false) . '>' . esc_html($status) . '</option>';
        echo '</select></label></p><p><label>Team price (INR) <input type="number" name="rb_price" min="0" max="1000000" step="1" value="' . esc_attr(get_post_meta($post->ID, '_rb_teamPrice', true)) . '"></label></p><p><label>Note visible to this customer<br><textarea name="rb_note" rows="5" style="width:100%">' . esc_textarea(get_post_meta($post->ID, '_rb_ownerNote', true)) . '</textarea></label></p><p>Save QUOTED first. Publication is a separate action and requires prior seller consent. Community listings never become checkout inventory automatically.</p>';
    }, 'rb_seller_request', 'normal', 'high');
});
add_action('save_post_rb_seller_request', function ($id) {
    if (wp_is_post_revision($id) || wp_is_post_autosave($id) || !current_user_can('manage_woocommerce') || !isset($_POST['rbcare_review_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['rbcare_review_nonce'])), 'rbcare_review_' . $id)) return;
    $result = rbcare_review_request($id, rbcare_clean(wp_unslash($_POST['rb_status'] ?? '')), rbcare_clean(wp_unslash($_POST['rb_price'] ?? '')), rbcare_clean(wp_unslash($_POST['rb_note'] ?? '')));
    if (is_wp_error($result)) set_transient('rbcare_notice_' . get_current_user_id(), $result->get_error_message(), MINUTE_IN_SECONDS);
}, 10);
add_action('admin_notices', function () { $key = 'rbcare_notice_' . get_current_user_id(); $notice = get_transient($key); if ($notice) { delete_transient($key); echo '<div class="notice notice-error"><p>' . esc_html($notice) . '</p></div>'; } });
add_filter('manage_rb_seller_request_posts_columns', function ($columns) { $columns['rb_status'] = 'Status'; $columns['rb_price'] = 'Team price'; return $columns; });
add_action('manage_rb_seller_request_posts_custom_column', function ($column, $id) { if ('rb_status' === $column) echo esc_html(get_post_meta($id, '_rb_status', true)); if ('rb_price' === $column) echo esc_html(get_post_meta($id, '_rb_teamPrice', true)); }, 10, 2);
