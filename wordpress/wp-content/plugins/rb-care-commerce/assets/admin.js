/* WordPress-authenticated heartbeat; never exposes seller details to public visitors. */
jQuery(function ($) {
  $(document).on('heartbeat-send.rbcare',function(event,data){data.rbcare_requests=true;});
  $(document).on('heartbeat-tick.rbcare',function(event,data){
    if(typeof data.rbcare_pending!=='number')return;
    $('#rbcare_requests .inside p strong').text(data.rbcare_pending).attr('aria-live','polite');
    const link=$('#menu-posts-rb_seller_request .wp-menu-name');
    link.find('.rbcare-pending-badge').remove();
    if(data.rbcare_pending>0)$('<span class="update-plugins rbcare-pending-badge"><span class="plugin-count"></span></span>').find('.plugin-count').text(data.rbcare_pending).end().appendTo(link);
  });
  if(window.wp&&wp.heartbeat)wp.heartbeat.interval(15);
});
