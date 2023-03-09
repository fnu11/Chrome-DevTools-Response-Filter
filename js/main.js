
var rows = {
		clear: '×',
		method: ['Method'],
        time: ['&nbsp; &nbsp; Time'],
        size: ['&nbsp; &nbsp; Size'],
        type: ['&nbsp; Type'],
        status: ['Status'],
        url: ['URL'],
	},

    $body = undefined,
    $scrollUp = undefined,
    $scrollUpClass = undefined,
    $scrollUpSpan = undefined,
    $requests = undefined,
    $formUrl = undefined,
    $formHeaders = undefined,
    $formHeaders2 = undefined,
    $formBody = undefined,
    $formBody2 = undefined,
    $formLabelBody2 = undefined,
    $formBody2Image = undefined,
    $details = undefined,
    $splitArea = undefined,
    $formMethodClear = undefined,
    $formStatusClear = undefined,
    $formTimeClear = undefined,

    contentScriptLoaded = false,
    sheaders = '',
    sbody = '',

    largeContent = undefined,
    largeContentEncoding = undefined,
    respbody = '',
    respheader = '',

    splitter = undefined,
    splitRatio = -1,
    splitDir = undefined,
	values = {
		requests: {},
		filters: [],
		filters_str: ''
	},
	ROW_HEIGHT = 24,
    FORBIDEN_HEADERS_STARTS_WITH = [
        'proxy-',
        'sec-',
        ':'
    ],
    FORBIDEN_HEADERS = [
        'accept-charset',
        'accept-encoding',
        'access-control-request-headers',
        'access-control-request-method',
        'cache-control',
        'connection',
        'content-length',
        'cookie',
        'cookie2',
        'date',
        'dnt',
        'expect',
        'host',
        'keep-alive',
        'origin',
        'pragma',
        'referer',
        'te',
        'trailer',
        'transfer-encoding',
        'upgrade',
        'user-agent',
        'via'
    ],
    dialogOpened = false,
	selected = undefined;

$(function() {

    console.log('main script loaded for tab ', chrome.devtools.inspectedWindow.tabId);

    $body = $('body');
    $scrollUp = $('#scroll-up');
    $scrollUpClass = $('.scroll-up');
    $scrollUpSpan = $('.scroll-up>span');
    $requests = $('.requests');
    $formUrl = $('#form-url');
    $formHeaders = $('#form-headers');
    $formHeaders2 = $('#form-headers2');
    $formBody = $('#form-body');
    $formBody2 = $('#form-body2');
    $formLabelBody2 = $('#form-label-body2');
    $formBody2Image = $('#form-body2-image');
    $details = $('.details');
    $splitArea = $('.split-area');
    $formMethodClear = $('.form-method-clear');
    $formStatusClear = $('.form-status-clear');
    $formTimeClear = $('.form-time-clear');

	var a;

	var filter = $('.filter');
	var first = true;
	for (a in rows) {

		$('.filter-rows').append(
			$('<label/>')
				.addClass('control-label col-lg-1 checkbox')
				.append(
					$('<input/>')
						.attr({
							'type': 'checkbox',
							'name': a,
							'value': '1',
							'checked': true
						})
				)
				.append( typeof rows[a] == 'object' ? rows[a][0] : rows[a] )
		);

		filter.append(
			$('<div/>')
				.addClass('filter-' + a)
		);

		if (typeof rows[a] == 'object') {

			$('.filter-' + a).html(

				$('<div/>')
					.addClass('btn-group clickable')
					.append(
						$('<span/>')
							.html(rows[a][0])
                            .attr({
                                'data-toggle': 'dropdown'
                            })
							.append('<small>▼</small>')
                    )
					.append(
						$('<ul/>')
							.addClass('dropdown-menu dropdown-menu-form')
							.attr('role', 'menu')
							.attr('id', a)
							.append(
								$('<li/>')
									.addClass('checkbox')
									.append(
										$('<label/>')
											.append(
												$('<input/>')
													.attr({
														'type': 'checkbox',
														'name': 'all',
														'val': 'all',
														'checked': true
													})
											)
											.append('All')
											// .append(
											// 	$('<span/>')
											// 		.attr('id', 'badge-' + a)
											// 		.addClass('badge badge-empty badge-right')
											// 		.html('0')
                                            //    )
									)
							)
					)
			);


		} else {

            if (!first) {

            	$('.filter-' + a).html(
					$('<div/>')
						.addClass('btn-group')
						.append(
							$('<span/>')
								.append(
									rows[a]
								)
						)
				);

            } else {

                $('.filter-' + a).html(
                    $('<div/>')
                        .addClass('btn-group clickable')
                        .append(
                            $('<span/>')
                                .append(
                                    rows[a]
                                )

                        )
                );

            }
		}

        first = false;
	}

	filter.append(
		$('<div/>')
			.addClass('filter-empty')
	);


	var filter_fixed = filter.clone();

	filter.after( filter_fixed );
	filter_fixed.addClass('fixed');

    filter_add_item('time', '0', 'fast', true);
    filter_add_item('time', '500', '> 500 ms', true);
    filter_add_item('time', '1000', '> 1000 ms', true);

    filter_add_item('size', '0', 'small', true);
    filter_add_item('size', '100', '> 100 k', true);
    filter_add_item('size', '1m', '> 1 m', true);

    $(document).on('click', '.dropdown-menu.dropdown-menu-form', function(e) {
        e.stopPropagation();
    });

    $('.details .other-controls label').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();

        var label = $(this);
        var id = label.attr('for');
        var edit = $('#' + id)
			.slideToggle();
    });

    $(document).on('click', 'input[name="filter"]', function() {

        var block = $(this).parents('.dropdown-menu'),
            button = block.prev(),
            sel = '.' + $(this).val();

        $('input[name="all"]', block).prop('checked',
            $('input[name="filter"]', block).length == $('input[name="filter"]:checked', block).length
        );

        var checked = $(this).prop('checked');

        if ($('input[name="all"]', block).prop('checked')) {

            $('input[name="filter"]', block).each(function() {

                var a = values.filters.indexOf( sel );

                if (a >= 0)
                    values.filters.splice(a, 1);

            });

            button.removeClass('active');

        } else {

            button.addClass('active');

            if (checked) {

                var a = values.filters.indexOf( sel );

                if (a >= 0)
                    values.filters.splice(a, 1);

            } else {
                values.filters.push( sel );
            }
        }

        values.filters = $.grep(values.filters, function(v, k){
            return $.inArray(v, values.filters) === k;
        });

        if (values.filters.length > 0) {

            values.filters_str = values.filters.join(", ");  
            $('.req').show().filter( values.filters_str ).hide();

        } else {
            values.filters_str = '';
            $('.req').show();
        }

        // checkScroll();
    });


    $(document).on('click', 'input[name="all"]', function() {

        var block = $(this).parents('.dropdown-menu');

        if ($(this).prop('checked')) {
            $('input[name="filter"]:not(:checked)', block).trigger('click');
        } else {
            $('input[name="filter"]:checked', block).trigger('click');
        }
        // $('input[name="filter"]', block).trigger('click');

    });

    $('.filter-clear').bind('click', function () {

        largeContent = undefined;

        values.requests = {};

        $('.req').remove();

        $('.badge-right').html('');

        $body.scrollTop(0);

        // checkScroll();

    });

    $body.on({
        scroll: function (e) {
            // scrollTop = $body.get(0).scrollTop;
            checkScroll(e.currentTarget.scrollTop);
        }
    });

    $(window).on({
		load: function() {

            splitCheck();
            checkScroll(0);
            detailsSizeCheck();

		},
		resize: function() {

		    splitCheck();
		    // checkScroll();
		    detailsSizeCheck();

		}
	});

    $(document).on('click', '#scroll-up', function() {

    	$body.scrollTop(0);

    });

    $(document).on('click', '#form-cancel', function() {

        if ($('#form-status').val() === 'pending') {

            $('#form-cancel').html('Cancel').addClass('btn-default').removeClass('btn-danger');
            $('#form-send').prop('disabled', false).removeClass('spin');
            $('#form-status')
                .val('canceled')
                .removeClass('blink')
                .removeClass('ok')
                .addClass('error');

            return;
        }

        dialogOpened = false;
        largeContent = undefined;

        $splitArea
            .animate({opacity: 0}, 100, 'swing', function () {
                $splitArea.hide();
            });

        if (selected) {
            selected.find('.clear')
                .addClass('visited')
                .html('✓');
        }
        selected = undefined;

        $('#new-request').stop().show();

        detailsSizeCheck();
    });

    $(document).on('click', '#form-send', function() {

    	try {

    		var code = "{";
			var method = $('#form-method').val();
            var url = $formUrl.val();

            if (!url || url.trim().length < 1) {
                $formUrl.focus();
                return;
            }

            code += "var xhr = new XMLHttpRequest();";
            code += "xhr.open('"+esc(method)+"', '"+esc(url)+"', true);";

            var headers = strToHeaders($formHeaders.val());
            for(var i in headers) {
            	if (!headers[i].name) {
            		continue;
				}
				var lower = headers[i].name.toLowerCase();
                if (lower === 'cookie' || lower === 'Cookie2') {
                    code += "xhr.withCredentials = true;";
                    continue;
                }
            	var forbidden = false;
            	for(var k = 0; k < FORBIDEN_HEADERS.length; k++) {
            	    if (lower === FORBIDEN_HEADERS[k]) {
                        forbidden = true;
                        break;
                    }
                }
                if (forbidden) {
            	    continue;
                }
                for(var k = 0; k < FORBIDEN_HEADERS_STARTS_WITH.length; k++) {
                    if (lower.substring(0,FORBIDEN_HEADERS_STARTS_WITH[k].length) === FORBIDEN_HEADERS_STARTS_WITH[k]) {
                        forbidden = true;
                        break;
                    }
                }
                if (forbidden) {
                    continue;
                }
                code += "try {xhr.setRequestHeader('"+esc(headers[i].name)+"', '"+esc(headers[i].value)+"');} catch(e) {};";
            }

            var body = $formBody.val();
            if (body) {
                body = body.replace(/\n|\r/g, " ");
            }

            var id = Math.round(1000000 * Math.random());
            $('#form-id').val(id);
            $formHeaders2.val('');  
            autosize.update($formHeaders2);
            $formBody2.val('').show();
            autosize.update($formBody2);  
            $formBody2Image.html('');
            $formLabelBody2
                .attr('for', 'form-body2')
                .text('Response body:');

			// code += "xhr.onreadystatechange = function (e) {chrome.runtime.sendMessage({spyId:'"+id+"',url:xhr.responseURL,res:'ok'});};";
			code += "xhr.onerror = function (e) {chrome.runtime.sendMessage({spyId:'"+id+"',url:xhr.responseURL,res:'fail'});};";
			code += "xhr.send('"+esc(body)+"');";
			code += "}";

			var onResult = function (res, e) {

                if (!e || !e.isError) {

                    // executed successfully

                } else {

                    $('#form-status')
                        .val('error')
                        .removeClass('blink')
                        .removeClass('ok')
                        .addClass('error');
                }

                 //console.log(code, result, e);

            };

            $('#form-cancel').html('Abort').removeClass('btn-default').addClass('btn-danger');
            $('#form-send').prop('disabled', true).addClass('spin');
            $('#form-status')
                .val('pending')
                .addClass('blink')
                .removeClass('ok')
                .removeClass('error');

            if (chrome.devtools) {  
                chrome.devtools.inspectedWindow.eval(code, {useContentScriptContext: contentScriptLoaded}, onResult);
            } else {
                eval(code);
                onResult();
            }

        } catch (e) {

    		log(e.message);

		}

    });

    // Create a connection to the background page
    try {

        var backgroundPageConnection = chrome.runtime.connect({
            name: "Response_Filter"
        });

        backgroundPageConnection.postMessage({
            name: 'init',
            tabId: chrome.devtools.inspectedWindow.tabId
        });


        // message from background code
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {


            if (!message.spyId && !message.res) {
                return;
            }

            contentScriptLoaded = true;

            if ($('#form-id').val() === message.spyId) {

                $('#form-cancel').html('Cancel').addClass('btn-default').removeClass('btn-danger');
                $('#form-send').prop('disabled', false).removeClass('spin');

                if (message.res === 'fail') {
                    $('#form-status')
                        .val('error')
                        .removeClass('blink')
                        .removeClass('ok')
                        .addClass('error');
                }

                if (message.url) {
                    $formUrl.val(message.url);
                }
            }
        });

    } catch (e) {}

    $('#new-request').on('click', function() {

       editRequest($('<tr id="-1"/>'));

    });

    $(document).on('click', '.req', function() {

        editRequest($(this));

    });

    autosize($('textarea'));

    splitCheck();

	$(document).on('click', 'a', function(e) {

		e.stopPropagation();
	});

	for(var i = 0; i < $('table').outerHeight()/ROW_HEIGHT; i++) {
        $requests.prepend($('<tr/>').attr('colspan', 10).prepend($('<td>&nbsp;</td>')));
    }
 
    if (chrome.devtools)  
    chrome.devtools.network.onRequestFinished.addListener(request => {
      request.getContent((body) => { 
        onDataRaw(request, false, body); 
      });
    }); 

});

function headersToStr(h) {
	var res = '';
	for(var i in h) {
		if (h[i].name && h[i].value) {
			res += h[i].name + ': ' + h[i].value + '\r\n';
		}
	}
	return res;
}

function strToHeaders(headers) {
    if (!headers) {
        return [];
    }
    var res = [];
	var h = headers.split("\n");
	for (var i in h) {
		if (!h[i]) {
			continue;
		}
		var x = h[i].split(':');
		if (x.length != 2 || !x[0] || !x[1]) {
			continue;
		}
		res.push({name: x[0].trim(), value: x[1].trim()});
	}
	return res;
}

function hostname(domain) {
    if (!domain || domain.length < 1) {
        return domain;
    }
    var i = domain.indexOf(':');
    if (i >= 0) {
        domain = domain.substring(0, i);
    }
    var s = domain.split('.');
    if (s.length < 2) {
        return domain;
    }
    return s[s.length-2] + '.' + s[s.length-1];
}

function setRespbody(content) {
    respbody = content;
    return;
}

function setRespheader(content) {
    respheader = content;
    return;
}

function parse_url(url) {

	var res = {hostname: '(empty)', pathname: '', search: ''};
	if (!url) {
		return res;
	}
	var j = url.indexOf('//');
	if (j < 0) {
		res.pathname = url;
		return res;
	}
	var i = url.indexOf('/', j+2);
    if (i < 0) {
        res.hostname = hostname(url.substring(j+2));
        if (!res.hostname) {
            res.hostname = '(empty)';
        }
        res.pathname = '/';
        return res;
    }
    res.hostname = hostname(url.substring(j+2,i));
    if (!res.hostname) {
        res.hostname = '(empty)';
    }
	var k = url.indexOf('?', i+1);
    if (k < 0) {
        k = url.indexOf('#', i+1);
	}
	if (k < 0) {
        res.pathname = url.substring(i);
	} else {
        res.pathname = url.substring(i, k);
        res.search = url.substring(k);
	}
	return res;
}

var scrollEnabled = false;
var scrollCount = 0;

function checkScroll(scrollTop) {
    var count = Math.round(scrollTop/ROW_HEIGHT);
    if (count > 0 && count !== scrollCount) {
        scrollCount = count;
        $scrollUpSpan.html(scrollCount);
    }
    if (scrollEnabled === (count > 0)) {
    	return;
    }
    scrollEnabled = count > 0;
    if (scrollEnabled) {
        $scrollUp.show();
    } else {
        $scrollUp.hide();
    }
}

function parse_domain(str) {

	var regex = /[^.]+.[^.]+$/gi;

	return regex.exec( str.toString().toLowerCase() );
}

function parse_status(str) {

	var regex = /(\d{3})[\w\s.,-]+$/gi;

	return regex.exec( str.toString() );
}

var makeCRCTable = function(){
    var c;
    var crcTable = [];
    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
};

function esc(str) {
	return str.replace(/"/g, '\\"').replace(/'/g, "\\'");
}

function hash(str) {

	return str.toString().toLowerCase().replace(/[^0-9a-z]/g, '');
}

function replaceAll( s ) {
	return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function filter_add_item(filter, id, str, add_zero) {

    if (!add_zero) {
        add_zero = '1';
    } else {
        add_zero = '0';
    }

	var f = $('.filter-' + filter + ':last'),
		ul = $('ul', f),
		badge,
		i;

	if (!$('#' + filter + '-' + id, f).is(':input')) {

		if ($('li', ul).length == 1) {

			ul.append(
				$('<li/>').addClass('divider')
			);
		}

		ul.append(
			$('<li/>')
				.addClass('checkbox')
				.append(
					$('<label/>')
						.append(
							$('<input/>')
								.attr({
									'type': 'checkbox',
									'name': 'filter',
									'value': filter + '-' + id,
									'id': filter + '-' + id,
									'checked': true
								})
						)
						.append( str )
						.append(
							$('<span/>')
								.attr('id', 'badge-' + filter + '-' + id)
								.addClass('badge badge-right')
								.html(add_zero)
						)
				)
		);

		// badge = $('#badge-' + filter, ul);
		// i = parseInt( badge.html() );
		// badge.html( i + 1 );

	} else {

		badge = $('#badge-' + filter + '-' + id, ul);
		i = parseInt( badge.html() );
		badge.html( i + 1 );
	}
}

var rootId = 1;

function addSpaces(data, count) {
	while (data.length < count) {
		data += '&nbsp;';
	}
	return data;
}

function getRedColor(value, foreground) {
	var MIN = 0.3;
	if (value < MIN) {
		return {};
	} else if (value > 1) {
		value = 1;
	} else {
		value = (value - MIN) / (1 - MIN);
	}
	var h = Math.round(value*100).toString(16);
	var color = '#ff0000' + (h.length < 2 ? '0' : '') + h;
	if (foreground) {
        return {'color': color};
    } else {
        return {'background': color};
    }
}
 
function onDataRaw(data, id, rowbody) { 
    bodystr = String(rowbody);
    data.rowbody = bodystr;
    data.response.bodySize = bodystr.length; 

    if (!id) {
        rootId++;
        id = rootId;
    }

    var tr_class = 'req' + id,
        url = parse_url(data.request.url),
        _url = url.pathname,
        // _url = url.hostname + url.pathname + url.search,
        tr = $('#' + id);
    if (_url && _url.substring(0,1) === '/' && _url.length > 1) {
        _url = _url.substring(1);
    }
    if ((!_url || _url.length < 2) && url.search) {
        _url = url.search;
    }

    values.requests[id] = data;
    var removeId = id - 1000;
    if (removeId >= 0) {
        delete values.requests[removeId];
        $('#'+removeId).remove();
    }

    tr = $('<tr/>')
        .addClass('req ' + tr_class)
        .attr('id', id)
        .css({'display': 'none'});

    for (var a in rows) {

        tr.append(
            $('<td/>')
                .addClass(a)
        );

    }

    //////////////////////////////////////////////////

    $('.clear', tr)
        .html('&nbsp;');

    //////////////////////////////////////////////////

    $('.url', tr)
        .html(_url);

    var _domain = hash(url.hostname);
    filter_add_item('url', _domain, url.hostname);
    tr.addClass('url-' + _domain);

    //////////////////////////////////////////////////
    var type = 'other';
    if (data.response && data.response.headers && data.response.headers.length) {
 
        var headers = data.response.headers;
        for (var i = 0; i < headers.length; i++) {
            if (!headers[i].name) {
                continue;
            }
            if (headers[i].name.toLowerCase() === 'content-type') {
                type = headers[i].value;
                if (type) {
                    if (type.indexOf('image/') >= 0) {
                        type = 'image';
                    } else if (type.indexOf('javascript') >= 0) {
                        type = 'js';
                    } else if (type.indexOf('font') >= 0) {
                        type = 'font';
                    } else if (type.indexOf('json') >= 0) {
                        type = 'json';
                    } else if (type.indexOf('xml') >= 0) {
                        type = 'xml';
                    } else if (type.indexOf('css') >= 0) {
                        type = 'css';
                    } else if (type.indexOf('html') >= 0) {
                        type = 'html';
                    } else if (type.indexOf('text') >= 0) {
                        type = 'text';
                    } else {
                        type = 'other';
                    }
                }
            }
        }
    }
 
    var size = data.response.bodySize;
    var size_int = Math.round(size);
    if (size) {
        size = Math.round(size / 1024) + '<small> k</small>';
    }

    $('.type', tr)
        .html(type)
        .addClass(type);

    var _type = hash(type);
    filter_add_item('type', _type, type);
    tr.addClass('type-' + _type);

    $('.size', tr)
        .html(size)
        .css(getRedColor(size_int/(1024*1024)));

    if (size_int >= 1024*1024) {
        filter_add_item('size', '1m');
        tr.addClass('size-1000');
    } else if (size_int >= 100*1024) {
        filter_add_item('size', '100');
        tr.addClass('size-100');
    } else {
        filter_add_item('size', '0');
        tr.addClass('size-0');
    }

    //////////////////////////////////////////////////

    var status = Math.round(data.response.status);
    if (status < 0) {
        $('.status', tr)
            .html('pending');
    } else {
        $('.status', tr)
            .html(status ? status : 'error')
                .css(getRedColor((status >= 200 && status < 300) ? 0 : 1));

        filter_add_item('status', status, status ? status : 'error');
        tr.addClass('status-' + status);
    }

    //////////////////////////////////////////////////

    if (status < 0) {

        $('.time', tr)
            .html('pending');

    } else {

        var time = Math.round(data.time);
        $('.time', tr)
            .html(time + '<small> ms</small>')
            .css(getRedColor(time / 2000));

        if (time >= 1000) {
            filter_add_item('time', '1000');
            tr.addClass('time-1000');
        } else if (time >= 500) {
            filter_add_item('time', '500');
            tr.addClass('time-500');
        } else {
            filter_add_item('time', '0');
            tr.addClass('time-0');
        }

    }

    //////////////////////////////////////////////////
    var _method = hash(data.request.method);

    filter_add_item('method', _method, data.request.method);
    tr.addClass('method-' + _method);

    $('.method', tr)
        .html(data.request.method)
        .addClass(data.request.method);

    //////////////////////////////////////////////////

    if ($('.' + tr_class).is('div')) {

        $('.' + tr_class + ':first').before(tr);

    } else {

        $requests.prepend(tr);
    }
 

    if (tr.is( values.filters_str )) { 
        tr.hide();
    } else {
        //=== if filters this  

        let arr_sheaders = sheaders.split('\n');  
        let arr_sbody = sbody.split('\n');  
        if (arr_sheaders.length>0&&arr_sheaders[1]!==''&&arr_sbody.length>0&&arr_sbody[1]!=='') {  
            let respheaders = headersToStr(data.response.headers);
            let htd = false;
            tr.hide();
            if (data.response.status==200&&rowbody!==null&&rowbody.length>0) {
                if (arr_sheaders.length>0&&arr_sheaders[1]!=='') {
                    if(arr_sheaders.some(word => respheaders.includes(word))) {
                        tr.show();
                        htd = true;
                    }
                } else htd = true;


                if (arr_sbody.length>0&&arr_sbody[1]!=='') {
                    if (htd&&arr_sbody.some(word => rowbody.includes(word))) {
                        tr.show();
                    } else tr.hide();
                }
            }
        } else tr.show(); 
    }

    // checkScroll();

    var editUrl = $formUrl.val();
    if (!editUrl) {
        editUrl = '';
    }
    editUrl = stripTrailingSlash(editUrl);
    if (selected
        && ($('#form-status').val() === 'pending')
        && ($('#form-method').val() === data.request.method)
        && ((editUrl === stripTrailingSlash(data.request.url))
            || (editUrl.indexOf('//') < 0 && editUrl === stripTrailingSlash(_url)))
    ) {
        setTimeout(function () {
            editRequest(tr);
        }, 10);
    }

    return id;
}

function stripTrailingSlash(str) {
    if(str.substr(-1) === '/') {
        return str.substr(0, str.length - 1);
    }
    return str;
}

function editRequest(tr) {

    largeContent = undefined;

    dialogOpened = true;

    if (selected) {
        selected.find('.clear')
            .addClass('visited')
            .html('✓');
    }
    selected = tr;
    if (selected) {
        selected.find('.clear')
            .removeClass('visited')
            .html('➤');
    }

    $('#new-request').hide();

    if (splitter) {
        var sizes = splitter.getSizes();
        if (sizes.length !== 2 || sizes[1] < 10) {
            splitter.setSizes([50, 50]);
        }
    }

    $splitArea
        .css({opacity: 0.0, display: (splitDir === 'vertical') ? 'block' : 'flex'})
        .animate({opacity: 1}, 100, 'swing');

    var id = selected ? selected.attr('id') : -1;
    var data = (id > 0) ? values.requests[id] : {};
    if (!data.request) {
        data.request = {method: 'GET', url: '', headers: []};
    }
    if (!data.response) {
        data.response = {headers: [], content: ''};
    }


    $('#form-cancel').html('Cancel').addClass('btn-default').removeClass('btn-danger');
    $('#form-send').prop('disabled', false).removeClass('spin');

    $('#form-id').val(id);

    $('#form-method').val(data.request.method);

    var displayValue = data.response.status;
    if (displayValue === undefined) {
        displayValue = '';
    } else if (displayValue === 0) {
        displayValue = 'error';
    } else if (displayValue === 200) {
        displayValue = '200 - OK';
    }
    $('#form-status')
        .val(displayValue)
        .removeClass('blink')
        .removeClass('ok')
        .removeClass('error')
        .addClass((data.response.status >= 200 && data.response.status < 300) ? 'ok' : 'error');

    $('.hint')
        .css({display: data.response.status && data.response.status !== 200 ? 'block' : 'none'});

    $('#hint')
        .html(getStatusHint(data.response.status));

    if (data.time) {
        var time = Math.round(data.time);
        $('#form-time')
            .val(time + ' ms');
            // .css(getRedColor(time / 2000));
    } else {
        $('#form-time')
            .val('');
    }

    var focusSet = false;

    $formUrl.val(data.request.url);
    autosize.update($formUrl);
    if (!focusSet && $formUrl.is(':visible')) {
    	$formUrl.focus();
        focusSet = true;
	}

    $formHeaders.val(headersToStr(data.request.headers));
    autosize.update($formHeaders);
    if (!focusSet && $formHeaders.is(':visible')) {
        $formHeaders.focus();
        focusSet = true;
    }

    if (data.request.postData) {
        $formBody.val(format(data.request.postData.text ? data.request.postData.text : data.request.postData));
    } else {
        $formBody.val('');
    }
    autosize.update($formBody);
    if (!focusSet && $formBody.is(':visible')) {
        $formBody.focus();
        focusSet = true;
    }

    $formHeaders2.val(headersToStr(data.response.headers));
    autosize.update($formHeaders2);
    if (!focusSet && $formHeaders2.is(':visible')) {
        $formHeaders2.focus();
        focusSet = true;
    }

    var mime2 = (data.response.content && data.response.content.mimeType) ?
        data.response.content.mimeType.toLowerCase() : '';

    $formBody2.val(format(data.response.content)).show();
    $formBody2Image.html('');
    var sizeCompressed = data.response.bodySize;
    var sizeFull = data.response.content.size;
    if (!sizeFull) {
        sizeFull = sizeCompressed;
    }
    var sizeInfo = '';
    if (sizeFull) {
        sizeInfo = Math.round(sizeFull/1024) + ' k ' +
            ((sizeCompressed === sizeFull) ? ' not gzipped' :
                ' / ' + Math.round(sizeCompressed/1024) + ' k gzipped');
    }
    $formLabelBody2
        .attr('for', 'form-body2')
        .text('Response body: ' + sizeInfo);
    autosize.update($formBody2);


    if (mime2.indexOf('image') >= 0) {
        var img = '<a target="_blank" href="'+data.request.url+'"><img height="100px" src="data:' +
            data.response.content.mimeType.toLowerCase() + ';' + "base64" + ',' + (data.rowbody) + '"/></a>';
        $formBody2.val('').hide();
        $formBody2Image.html($(img));
        $formLabelBody2.attr('for', 'form-body2-image');
    } else {
        if (!data.rowbody) {
            $formBody2.val('');
        } else if (data.rowbody.length < 100*1024) {
            $formBody2.val(format(data.rowbody, mime2));
            autosize.update($formBody2); 
            //console.log(format(content, mime2));
        } else {
            // largeContent = content;
            // largeContentEncoding = encoding;
            // $formBody2.val('Content is too large.');
            //console.log(format(content, mime2));
             
            $formBody2
                .val(format(data.rowbody, mime2))
                .css({height: 500, overflow: 'scroll'})
        }
    }
    if (!focusSet && $formBody2.is(':visible')) {
        $formBody2.focus();
        focusSet = true;
    }

    detailsSizeCheck();
    $details.scrollTop(0);
}

function loadLargeContent() {
    $formBody2.val(format(largeContent, largeContentEncoding));
    autosize.update($formBody2);
    largeContent = undefined;
}

function format(s, mime) {
	if (!s) {
		return s;
	}
	if (typeof s === 'string') {

        if (mime && mime.indexOf('css') >= 0) {

            try {
                s = pd.css(s);
            } catch (e) {}

        } else if (mime && mime.indexOf('xml') >= 0) {

            try {
                s = pd.xml(s);
            } catch (e) {}

        } else if (mime && mime.indexOf('json') >= 0) {

            try {
                s = pd.json(s);
            } catch (e) {}

        } else {

            try {
                s = pd.json(s);
                // s = JSON.stringify(JSON.parse(s), null, 4);
            } catch (e) {
                try {
                    s = pd.xml(s);
                } catch (e) {}
            }
        }

    } else {
        s = JSON.stringify(s, null, 4);
    }
    if (!s) {
        return s;
    }
    s = s.replace(/\\n/g, "\n")
        .replace(/\\'/g, "\'")
        .replace(/\\\//g, "\/")
        .replace(/\\"/g, '\"')
        .replace(/\\&/g, "\&")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\b/g, "\b")
        .replace(/\\f/g, "\f");
    return s;
}

function log(data) {
    if (!chrome.devtools) {
        return;
    }
    chrome.devtools.inspectedWindow.eval(
        "console.log('"+esc(JSON.stringify(data))+"');"
    );
}

function splitCheck() {

    if (!$splitArea.height()) {
        return;
    }
    var ratio = Math.round(10 * $splitArea.width() / $splitArea.height());
    if (ratio > 10) {
        dir = 'horizontal';
    } else {
        dir = 'vertical';
    }
    if (dir === splitDir || ratio === splitRatio) {
        return;
    }

    $splitArea.removeClass('split-'+splitDir);
    if (splitter) {
        splitter.destroy();
        splitter = undefined;
    }

    splitRatio = ratio;
    splitDir = dir;
    $splitArea.addClass('split-'+splitDir);
    if ($splitArea.is(':visible')) {
        $splitArea.css({display: (splitDir === 'vertical') ? 'block' : 'flex'});
    }
    splitter = Split(['.transparent', '.details'], {
        direction: dir,
        sizes: [50, 50],
        gutterSize: 20,
        snapOffset: 50,
        minSize: 0,
        onDragStart: function () {
            $splitArea.addClass('splitting');
        },
        onDrag: function () {
            detailsSizeCheck();
        },
        onDragEnd: function () {
            $splitArea.removeClass('splitting');
        }
    });
}

function detailsSizeCheck() {
    // var total = $(this).children().length;
    // $(this).children().each(function(k) {
    //
    //     var width = filter.children('div:eq(' + k + ')').width();
    //     $(this).width( width || 'auto' );
    //
    // });

    var w = $details.width();
    $details.css({paddingRight: (w < 20) ? 0 : ''});
    if (w < 220) {
        $formMethodClear.show();
        $formStatusClear.hide();
        $formTimeClear.hide();
    } else if (w < 320) {
        $formMethodClear.hide();
        $formStatusClear.show();
        $formTimeClear.hide();
    } else if (w < 420) {
        $formMethodClear.hide();
        $formStatusClear.hide();
        $formTimeClear.show();
    } else {
        $formMethodClear.hide();
        $formStatusClear.hide();
        $formTimeClear.hide();
    }

    $scrollUpClass.css({right: splitDir === 'vertical' || !dialogOpened ? '20px' : (w+40)+'px'});
}

function getStatusHint(status) {
    var statuses = {
        100: 'Continue',
        101: 'Switching Protocols',
        102: 'Processing',
        103: 'Early Hints',
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        203: 'Non-Authoritative Information',
        204: 'No Content',
        205: 'Reset Content',
        206: 'Partial Content',
        207: 'Multi-Status',
        208: 'Already Reported',
        226: 'IM Used',
        300: 'Multiple Choices',
        301: 'Moved Permanently',
        302: 'Found',
        303: 'See Other',
        304: 'Not Modified',
        305: 'Use Proxy',
        306: '(Unused)',
        307: 'Temporary Redirect',
        308: 'Permanent Redirect',
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Timeout',
        409: 'Conflict',
        410: 'Gone',
        411: 'Length Required',
        412: 'Precondition Failed',
        413: 'Payload Too Large',
        414: 'URI Too Long',
        415: 'Unsupported Media Type',
        416: 'Range Not Satisfiable',
        417: 'Expectation Failed',
        421: 'Misdirected Request',
        422: 'Unprocessable Entity',
        423: 'Locked',
        424: 'Failed Dependency',
        426: 'Upgrade Required',
        428: 'Precondition Required',
        429: 'Too Many Requests',
        431: 'Request Header Fields Too Large',
        451: 'Unavailable For Legal Reasons',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
        505: 'HTTP Version Not Supported',
        506: 'Variant Also Negotiates',
        507: 'Insufficient Storage',
        508: 'Loop Detected',
        510: 'Not Extended',
        511: 'Network Authentication Required'
    };

    var res = statuses[status];
    if (res === undefined) {
        return 'unknown status code';
    } else {
        return res;
    }
}

$(document).on('click', '#form-fbtn', function() {
    $("#fbtnbox").show();
    $("#form-fbtn-save").show();
});

$(document).on('click', '#form-fbtn-save', function() {
    $("#fbtnbox").hide();
    $("#form-fbtn-save").hide();
    sheaders = $('textarea#filter-form-headers').val();
    localStorage.setItem('sheaders', sheaders);
    sbody = $('textarea#filter-form-body').val();
    localStorage.setItem('sbody', sbody); 
});

if (localStorage.getItem("sheaders") !== null) 
sheaders = localStorage.getItem('sheaders');
else sheaders = "";
$('textarea#filter-form-headers').val(sheaders); 
 
if (localStorage.getItem("sbody") !== null) 
sbody = localStorage.getItem('sbody');
else sbody = "";
$('textarea#filter-form-body').val(sbody); 
 