<?php
defined('ABSPATH') || exit;
function rbcare_field($name, $label, $type = 'text', $options = array(), $required = true) {
    echo '<label>' . esc_html(rbcare_text($label));
    $attributes = ' name="' . esc_attr($name) . '"' . ($required ? ' required' : '');
    if ('select' === $type) { echo '<select' . $attributes . '><option value="">' . esc_html(rbcare_text('Select')) . '</option>'; foreach ($options as $option) echo '<option value="' . esc_attr($option) . '">' . esc_html(rbcare_text($option)) . '</option>'; echo '</select>'; }
    elseif ('textarea' === $type) echo '<textarea' . $attributes . ' maxlength="2000" rows="4"></textarea>';
    else { $extra = 'phone' === $name ? ' pattern="[6-9][0-9]{9}" inputmode="tel" maxlength="10"' : ('pincode' === $name ? ' pattern="[1-9][0-9]{5}" inputmode="numeric" maxlength="6"' : ' maxlength="120"'); if ('number' === $type) $extra = ' min="1" step="1" max="10000000"'; echo '<input type="' . esc_attr($type) . '"' . $attributes . $extra . '>'; }
    echo '</label>';
}
function rbcare_honeypot() { echo '<div class="rb-honeypot" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>'; }
add_shortcode('rbcare_sell', function () {
    ob_start();
    echo '<p>' . esc_html(rbcare_text('Submit photos and condition details of your washing machine, fridge, AC or microwave. Your request stays pending until the RB Care team reviews and prices it. Publication requires separate team approval.')) . '</p><form class="rb-form" data-rb-form="sell" enctype="multipart/form-data"><fieldset class="rb-full rb-step" data-step="0"><legend>' . esc_html(rbcare_text('Appliance details')) . '</legend>';
    rbcare_field('category', 'Appliance category', 'select', array('Washing Machine', 'Refrigerator', 'Air Conditioner', 'Microwave', 'Other appliance'));
    rbcare_field('brand', 'Brand'); rbcare_field('model', 'Model'); rbcare_field('capacity', 'Capacity');
    rbcare_field('age', 'Approximate age', 'select', array('Less than 1 year', '1–3 years', '3–5 years', '5–8 years', 'More than 8 years', 'Not sure'));
    rbcare_field('condition', 'Working condition', 'select', array('Working well', 'Working with issues', 'Not working'));
    rbcare_field('description', 'Condition and known issues (at least 15 characters)', 'textarea'); rbcare_field('repairs', 'Repair history', 'textarea', array(), false);
    echo '</fieldset><fieldset class="rb-full rb-step" data-step="1"><legend>' . esc_html(rbcare_text('Photos')) . '</legend><label>' . esc_html(rbcare_text('Add 1–6 JPG, PNG or WebP photos, up to 3 MB each.')) . '<input type="file" name="photos[]" accept="image/jpeg,image/png,image/webp" multiple required></label></fieldset><fieldset class="rb-full rb-step" data-step="2"><legend>' . esc_html(rbcare_text('Your details')) . '</legend>';
    rbcare_field('name', 'Your name'); rbcare_field('phone', 'Mobile number', 'tel'); rbcare_field('city', 'City'); rbcare_field('area', 'Area / locality'); rbcare_field('pincode', 'PIN code');
    echo '<label class="rb-check rb-full"><input type="checkbox" name="contactConsent" value="1" required><span>' . esc_html(rbcare_text('I agree that RB Care may contact me to review this appliance.')) . '</span></label><label class="rb-check rb-full"><input type="checkbox" name="publishConsent" value="1"><span>' . esc_html(rbcare_text('I allow approved appliance details and photos to be published. My contact details stay private.')) . '</span></label></fieldset>';
    rbcare_honeypot();
    echo '<div class="rb-full rb-step-controls" hidden><button type="button" data-rb-back>' . esc_html(rbcare_text('Back')) . '</button> <span data-rb-step-label aria-live="polite"></span> <button type="button" data-rb-next>' . esc_html(rbcare_text('Next')) . '</button></div><button class="rb-full" type="submit">' . esc_html(rbcare_text('Submit for team review')) . '</button><div class="rb-full" data-rb-result role="status" aria-live="polite" translate="no"></div></form><noscript>Please enable JavaScript to submit the form, or call 08503939715.</noscript>';
    return ob_get_clean();
});
add_shortcode('rbcare_track', function () {
    return '<div data-rb-track><p>' . esc_html(rbcare_text('Open the private tracking link you received after submitting your appliance. Keep this link safe.')) . '</p><button type="button" data-rb-refresh>' . esc_html(rbcare_text('Refresh')) . '</button><div data-rb-result role="status" aria-live="polite" translate="no"></div></div>';
});
add_shortcode('rbcare_community', function () {
    ob_start();
    $detail_uuid = isset($_GET['listing']) && is_string($_GET['listing']) ? sanitize_text_field(wp_unslash($_GET['listing'])) : get_query_var('rbcare_listing', '');
    $detail_id = $detail_uuid ? rbcare_find_request($detail_uuid) : 0;
    if ($detail_uuid && !rbcare_is_public_request($detail_id)) return '<p>' . esc_html(rbcare_text('Listing is not available.')) . '</p>';
    echo '<p>' . esc_html(rbcare_text('Team-approved customer appliances. Enquiries go through RB Care. These listings are separate from refurbished store checkout.')) . '</p><div class="rb-community">';
    $posts = $detail_id ? array(get_post($detail_id)) : get_posts(array('post_type' => 'rb_seller_request', 'post_status' => 'private', 'numberposts' => 24, 'meta_query' => array(array('key' => '_rb_status', 'value' => 'PUBLISHED'), array('key' => '_rb_publishConsent', 'value' => '1'))));
    $count = 0;
    foreach ($posts as $post) {
        if (!rbcare_is_public_request($post->ID)) continue; ++$count;
        $data = rbcare_request_view($post->ID, true);
        echo '<article translate="no">';
        foreach (array_slice($data['photos'], 0, $detail_id ? 6 : 1) as $photo) echo '<img loading="lazy" src="' . esc_url($photo['url']) . '" alt="' . esc_attr($data['brand'] . ' ' . $data['model']) . '">';
        echo '<h2><a href="' . esc_url(add_query_arg('listing', $data['id'], home_url('/community/'))) . '">' . esc_html($data['brand'] . ' ' . $data['model']) . '</a></h2><p>' . esc_html($data['city'] . ' · ' . $data['condition']) . '</p><p><strong>' . wp_kses_post(function_exists('wc_price') ? wc_price($data['teamPrice']) : '₹' . number_format((float) $data['teamPrice'])) . '</strong></p>';
        if ($detail_id) foreach (array('category', 'capacity', 'age', 'description', 'repairs') as $key) if ($data[$key]) echo '<p><strong>' . esc_html(ucfirst($key)) . ':</strong> ' . nl2br(esc_html($data[$key])) . '</p>';
        echo '<a href="tel:+918503939715">' . esc_html(rbcare_text('Contact RB Care')) . '</a></article>';
    }
    if (!$count) echo '<p>' . esc_html(rbcare_text('No customer appliances are published yet.')) . '</p>';
    echo '</div>';
    return ob_get_clean();
});
function rbcare_enquiry_form($kind) {
    ob_start(); echo '<form class="rb-form" data-rb-form="enquiry"><input type="hidden" name="kind" value="' . esc_attr($kind) . '">';
    rbcare_field('name', 'Your name'); rbcare_field('phone', 'Mobile number', 'tel'); rbcare_field('email', 'Email address', 'email', array(), false); rbcare_field('city', 'City');
    if ('bulk' === $kind) { rbcare_field('organisation', 'Organisation / business'); rbcare_field('quantity', 'Number of units', 'number'); rbcare_field('budget', 'Estimated budget (₹)', 'number'); rbcare_field('categories', 'Appliance categories and models required', 'textarea'); rbcare_field('deliveryNeed', 'Delivery / installation requirement', 'textarea'); }
    else rbcare_field('message', 'Message', 'textarea');
    echo '<label class="rb-check rb-full"><input name="contactConsent" type="checkbox" value="1" required><span>' . esc_html(rbcare_text('I agree that RB Care may contact me about this enquiry.')) . '</span></label>';
    rbcare_honeypot(); echo '<button type="submit">' . esc_html(rbcare_text('Send enquiry')) . '</button><div class="rb-full" data-rb-result role="status" aria-live="polite" translate="no"></div></form>';
    return ob_get_clean();
}
add_shortcode('rbcare_bulk', function () { return rbcare_enquiry_form('bulk'); });
add_shortcode('rbcare_contact', function () { return '<p><a href="tel:+918503939715">08503939715</a> · Lucknow, Uttar Pradesh</p>' . rbcare_enquiry_form('contact'); });
add_action('rest_api_init', function () {
    register_rest_route('rb-care/v1', '/enquiry', array('methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => function ($request) {
        $guard = rbcare_request_guard($request); if (is_wp_error($guard)) return $guard;
        $data = array(); foreach (array('kind', 'name', 'phone', 'email', 'city', 'organisation', 'quantity', 'budget', 'categories', 'deliveryNeed', 'message') as $key) $data[$key] = rbcare_clean($request->get_param($key));
        if (!in_array($data['kind'], array('bulk', 'contact'), true) || mb_strlen($data['name']) < 2 || mb_strlen($data['city']) < 2 || !preg_match('/^[6-9][0-9]{9}$/', $data['phone']) || !in_array($request->get_param('contactConsent'), array('1', 1, true, 'on'), true) || ($data['email'] && !is_email($data['email']))) return new WP_Error('rb_validation', 'Complete your contact details and consent.', array('status' => 400));
        if ('bulk' === $data['kind'] && (mb_strlen($data['organisation']) < 2 || !ctype_digit($data['quantity']) || (int) $data['quantity'] < 2 || !is_numeric($data['budget']) || (float) $data['budget'] <= 0 || !$data['categories'] || !$data['deliveryNeed'])) return new WP_Error('rb_validation', 'Complete the organisation, quantity, budget and requirements.', array('status' => 400));
        if ('contact' === $data['kind'] && mb_strlen($data['message']) < 10) return new WP_Error('rb_validation', 'Enter a message of at least 10 characters.', array('status' => 400));
        $id = wp_insert_post(array('post_type' => 'rb_enquiry', 'post_status' => 'private', 'post_title' => ucfirst($data['kind']) . ' — ' . $data['name'] . ' — ' . $data['city']), true);
        if (is_wp_error($id)) return new WP_Error('rb_storage', 'Unable to save this enquiry.', array('status' => 503));
        foreach ($data as $key => $value) update_post_meta($id, '_rb_' . $key, $value);
        update_post_meta($id, '_rb_status', 'NEW'); update_post_meta($id, '_rb_contactConsent', '1');
        return rbcare_private_response(array('ok' => true, 'reference' => 'RBE-' . $id), 201);
    }));
});
add_action('add_meta_boxes_rb_enquiry', function () {
    add_meta_box('rbcare_enquiry', 'Enquiry details', function ($post) {
        echo '<table class="widefat striped">'; foreach (array('kind', 'name', 'phone', 'email', 'city', 'organisation', 'quantity', 'budget', 'categories', 'deliveryNeed', 'message', 'contactConsent') as $key) echo '<tr><th>' . esc_html($key) . '</th><td>' . nl2br(esc_html(get_post_meta($post->ID, '_rb_' . $key, true))) . '</td></tr>'; echo '</table>';
    });
});
