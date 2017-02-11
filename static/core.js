/**
 * listeners for the Static Editor interface
 */
$(document).ready(function () {
    // Initialize dropzone location and setup event handlers
    //var dropzone_home = new Dropzone("div#image_homepage", {url: "/upload/homepage", renameFilename: cleanFilename});
    //dropzone_home.on("drop", function () {
    //    $('#image_homepage').empty();
    //});
    var dropzone_other = new Dropzone("div#image_other", {url: "/upload/static", renameFilename: cleanFilename});
    dropzone_other.on("drop", function () {
        $('#image_other').empty();
    });
    dropzone_other.on("success", function (file) {
        add_to_image_list(file);
    });

    // Enable copy buttons
    var clipboard = new Clipboard('.copybtns');
    clipboard.on('success', function (e) {
        e.clearSelection();
    });
    clipboard.on('error', function (e) {
        console.error('Action:', e.action);
        console.error('Trigger:', e.trigger);
    });

    // Remove button listener
    $(document).on('click', '.removebtns', function () {
        $(this).parent().remove();
    });

    /*
    // Save document listener
    $(document).on('click', '#save', function () {
        if ($('#checkbox-easyedit').is(':checked')) {
            // For now, lets have the save button ALSO call the easyedit system, if that system is enabled
            $('#content').val(run_easy_edit());
        }
        // Proceed with this buttons default behavior
        save_doc(true);
    });

    // Check document listener
    $(document).on('click', '#check', function () {
        if ($('#checkbox-easyedit').is(':checked')) {
            // For now, lets have the save button ALSO call the easyedit system, if that system is enabled
            $('#content').val(run_easy_edit());
        }
        // Proceed with this buttons default behavior
        save_doc(false);
    });

    // If this is an "edit" page, populate the page with prior data
    var pathArray = window.location.pathname.split('/');
    if (pathArray.length == 4) {
        if (pathArray[2] == "edit") {
            $.ajax({
                type: "get",
                url: "/news/json/" + pathArray[3],
                dataType: "json",
                contentType: "application/json",
                success: function (data) {
                    load_previous(data);
                },
                error: function (err) {
                    console.error("Unable to find item data for [" + pathArray[3] + "]");
                    console.error(err);
                }
            });
        }
    } else {
        // Initialize bootstrap datepicker code, depends on moment.js
        default_set_release();
        default_set_retract();
    }

    // Show the save button
    $('#save').removeClass('hide');
    */
});

/**
 * Sets the retract picker
 */
function default_set_retract() {
    init_datepicker(moment(2147482800000), "retractpicker");
}

/**
 * Sets the release picker to a default value
 */
function default_set_release() {
    // Get this weeks weekly update day
    var coming_weekly_update_UTC = moment().utc().day(3);
    var simple_date = new Date;
    if (simple_date.getUTCDay() >= 3) {
        // If we already past this weeks update time, get the upcoming time
        coming_weekly_update_UTC = moment().utc().day(10);
    }
    // Set to 0:00 UTC
    coming_weekly_update_UTC.utc().set('hour', 0);
    coming_weekly_update_UTC.utc().set('minute', 0);
    // Convert to local time
    var coming_weekly_update_local = coming_weekly_update_UTC.toDate();
    // Setup the release picker
    init_datepicker(coming_weekly_update_local, "releasepicker");
}

/**
 * When passed the ID of a div, it will return the Unix timestamp of the date string in the div
 * @param div_id
 * @returns {*}
 */
function parse_to_unix_time(div_id) {
    var get_time = $('#' + div_id).val();
    return moment(get_time, "MM/DD/YYYY hh:mm a").unix();
}

/**
 * From the interface, parse out the time defined in calendar format
 * @param div_id
 * @returns {*}
 */
function parse_cal_time(div_id) {
    var get_time = $('#' + div_id).val();
    return moment(get_time, "MM/DD/YYYY hh:mm a").format('MM/DD/YYYY');
}

/**
 * From the interface, parse out the time - ONLY the year
 * @param div_id
 * @returns {*}
 */
function parse_year_time(div_id) {
    var get_time = $('#' + div_id).val();
    return moment(get_time, "MM/DD/YYYY hh:mm a").format('YYYY');
}

var global_image_list_counter = 1;

function add_to_image_list(file) {
    var content = "";
    if (file.name != undefined) {
        var year = new Date().getFullYear();
        var url = "https://cdn.rcsb.org/news/" + year + "/" + cleanFilename(file.name);
        content = "<li id='image-list-item-" + global_image_list_counter + "' value='" + url + "' class='margin-tb-sm tinytext'><button class='btn btn-xs btn-danger removebtns'>Remove</button> " + url + " <button class='btn btn-xs btn-primary copybtns' data-clipboard-target='#image-list-item-" + global_image_list_counter + "'>Copy</button></li>";
        $('#list-other-images-here').append(content);
        global_image_list_counter += 1;
    } else {
        content = "<li id='image-list-item-" + global_image_list_counter + "' value='" + file + "' class='margin-tb-sm tinytext'><button class='btn btn-xs btn-danger removebtns'>Remove</button> " + file + " <button class='btn btn-xs btn-primary copybtns' data-clipboard-target='#image-list-item-" + global_image_list_counter + "'>Copy</button></li>";
        $('#list-other-images-here').append(content);
        global_image_list_counter += 1;
    }
}

/**
 * Given a news data object, populate the fields on the page with existing data
 * @param data
 */
function load_previous(data) {
    if (typeof data !== 'undefined') {
        // Handy for debugging
        // console.log("Populating the page with:");
        // console.log(JSON.stringify(data, null, 2));

        // Populate top level text fields
        $('#_id').html(data._id);
        page_update_and_count(data, "title", "title", 48);
        page_update_and_count(data, "teaser", "teaser", 120);
        page_update(data, "content", "content");

        // Update Withhold checkbox
        load_checkbox(data, "withhold", false);

        // Setup release and retract fields
        if (data.retract != undefined) {
            if (data.retract.time_unix != undefined) {
                init_datepicker(moment(data.retract.time_unix * 1000), "retractpicker");
            } else {
                default_set_retract();
            }
        } else {
            default_set_retract();
        }

        if (data.release != undefined) {
            if (data.release.time_unix != undefined) {
                init_datepicker(moment(data.release.time_unix * 1000), "releasepicker");
            } else {
                default_set_release();
            }
        } else {
            default_set_release();
        }

        if (data.channel != undefined) {
            load_checkbox(data.channel, "rcsb", true);
            load_checkbox(data.channel, "wwpdb", true);
            load_checkbox(data.channel, "pdb101", false);
        }

        if (data.rcsb != undefined) {
            load_checkbox(data.rcsb, "pinned", false);
            load_checkbox(data.rcsb, "feature", false);
        }
        if (data.wwpdb != undefined) {
            load_checkbox(data.wwpdb, "visible_on_homepage", false);
            page_update_and_count(data.wwpdb, "teaser", "wwpdb-hp-content", 1000);
            page_update_and_count(data.wwpdb, "news_feed", "wwpdb-news_feed", 500);
        }
        if (data.easyedit != undefined) {
            load_checkbox(data, "easyedit", false);
            renable_easyedit(data.easyedit_content);
        }

        if (data.image != undefined) {
            if (data.image.homepage != undefined) {
                var image = data.image.homepage;
                var filename = image.substring(image.lastIndexOf("/") + 1, image.length);
                // The CDN path needs to be adjusted to match some fringe criteria
                // Under our new method, news images are stored in the CDN and are split up based upon the year they were uploaded
                // We also have this second option to be backwards compatible with the legacy method for www.rcsb.org
                var cdn_prepended_path = "";
                if ((image.substring(0, 20) != "http://cdn.rcsb.org/") && (image.substring(0, 21) != "https://cdn.rcsb.org/")) {
                    // Make sure that if the URL already points to the CDN - you do not mess with it
                    if (data.channel != undefined) {
                        if (data.channel.rcsb != undefined) {
                            cdn_prepended_path = "https://cdn.rcsb.org/rcsb-pdb";
                        } else if (data.channel.pdb101 != undefined) {
                            cdn_prepended_path = "https://cdn.rcsb.org/pdb101/news/images/";
                        }
                    }
                    // wwPDB does not have any legacy homepage images - all there code was inline to their teaser
                }

                var image_reload_code = "<div class='dz-message'>Drag a new image here to replace</div><div class='dz-preview'><img class='image-preview' alt='" + image + "' src='" + cdn_prepended_path + image + "'><div class='dz-filename'><span>" + filename + "</span></div></div>";
                $('#image_homepage').html(image_reload_code);
            }
            if (data.image.other != undefined) {
                if (data.image.other.length >= 1) {
                    for (var i = 0, len = data.image.other.length; i < len; i++) {
                        add_to_image_list(data.image.other[i]);
                    }
                }
            }
        }
    }
}

/**
 * When given a target, update the check box to is saved value
 * Optionally, if 2nd parameter is true - show hidden content
 * @param data
 * @param target
 * @param also_fadein
 */
function load_checkbox(data, target, also_fadein) {
    if (data[target] != undefined) {
        $("#checkbox-" + target).prop('checked', true);
        if (also_fadein) {
            $('.' + target + '-outer_wrapper').fadeIn();
        }
    } else {
        $("#checkbox-" + target).prop('checked', false);
    }
}

/**
 * When gven a target to count, a count is taken, the count is then subtracted from max_count and the result is displayed at a second location
 * @param input_id
 * @param counter_id
 * @param max_count
 */
function character_counter(input_id, counter_id, max_count) {
    var count = $('#' + input_id).val().length;
    $('#' + counter_id).html(max_count - count);
}

/**
 * When passed a data object and the target, update that part of the page with that parts data
 * @param data
 * @param key
 * @param div_id
 */
function page_update(data, key, div_id) {
    if (data[key] != undefined) {
        $('#' + div_id).val(data[key]);
    }
}

/**
 * When given the name of the object - infer the rest of the configuration and update the page
 * ALSO update the counter for that field
 * @param data
 * @param key
 * @param div_id
 * @param max_count
 */
function page_update_and_count(data, key, div_id, max_count) {
    if (data[key] != undefined) {
        $('#' + div_id).val(data[key]);
        character_counter(div_id, "counter-" + div_id, max_count);
    }
}

/**
 * When passed a moment variable and a targeted div_id - initialize the date picker there
 * @param my_moment
 * @param div_id
 */
function init_datepicker(my_moment, div_id) {
    $('#' + div_id).datetimepicker({
        defaultDate: my_moment,
        toolbarPlacement: "top",
        sideBySide: true,
        showClear: true,
        showClose: true,
        showTodayButton: true,
        stepping: 15
    });
}

/**
 * This parses all the content out of the page into one object - then sends the object to the server for saving
 * On success - the page is redirected back to the news list
 * @param send_to_server: true = save the doc, false = just parse locally
 */
function save_doc(send_to_server) {
    var mongodb_id = $('#_id').html();
    var to_save = {};
    get_value_text(to_save, "title");
    get_value_text(to_save, "teaser");
    get_value_text(to_save, "content");
    get_value_checkbox(to_save, "withhold");
    to_save.release = {};
    to_save.release.time_unix = parse_to_unix_time("releasetime");
    to_save.release.date = parse_cal_time("releasetime");
    to_save.release.year = Number(parse_year_time("releasetime"));
    to_save.retract = {};
    to_save.retract.time_unix = parse_to_unix_time("retracttime");
    to_save.channel = {};
    get_value_checkbox(to_save.channel, "rcsb");
    get_value_checkbox(to_save.channel, "pdb101");
    get_value_checkbox(to_save.channel, "wwpdb");
    if ($('#checkbox-rcsb').is(':checked')) {
        to_save.rcsb = {};
        get_value_checkbox(to_save.rcsb, "pinned");
        get_value_checkbox(to_save.rcsb, "feature");
    }
    if ($('#checkbox-wwpdb').is(':checked')) {
        to_save.wwpdb = {};
        get_value_checkbox(to_save.wwpdb, "visible_on_homepage");
        get_value_text(to_save.wwpdb, "teaser", "wwpdb-hp-content");
        get_value_text(to_save.wwpdb, "news_feed", "wwpdb-news_feed");
    }
    to_save.image = {};
    // Get the homepage image
    var homepage_image = $('#image_homepage').find('.dz-filename').children().html();;
    if (homepage_image != undefined) {
        if (homepage_image.indexOf('/') > -1) {
            // Image has paths attached to it - leave it alone (handles legacy uploads)
            to_save.image.homepage = homepage_image;
        }
        else if ((homepage_image.substring(0, 20) == "http://cdn.rcsb.org/") || (homepage_image.substring(0, 21) == "https://cdn.rcsb.org/")) {
            // CDN path is ALREADY prepended to the URL - do not double prepend
            to_save.image.homepage = homepage_image;
        } else {
            var year = new Date().getFullYear();
            to_save.image.homepage = "https://cdn.rcsb.org/news/" + year + "/homepage/" + homepage_image;
        }
    }
    // Get the other images
    var list_of_images = $('#list-other-images-here').children('li');
    if (list_of_images.length >= 1) {
        to_save.image.other = [];
        for (var i = 0, len = list_of_images.length; i < len; i++) {
            to_save.image.other.push($(list_of_images[i]).attr('value'));
        }
    }
    // Parse the Easy Edit system for saving
    get_value_checkbox(to_save, "easyedit");
    to_save.easyedit_content = parse_easyedit();

    if (send_to_server) {
        if (mongodb_id.length != 24) {
            // Insert a NEW news article
            $.ajax({
                type: "post",
                url: "/news/create",
                dataType: "json",
                data: JSON.stringify(to_save),
                contentType: "application/json",
                success: function () {
                    window.location = "/news/list/all/20";
                },
                error: function (err) {
                    console.error("Unable to create a new news item @ /news/create");
                    console.error(err);
                }
            });
        } else {
            // Update an EXISTING news article
            $.ajax({
                type: "post",
                url: "/news/update/" + mongodb_id,
                dataType: "json",
                data: JSON.stringify(to_save),
                contentType: "application/json",
                success: function () {
                    window.location = "/news/list/all/20";
                },
                error: function (err) {
                    console.error("Unable to update the news item @ /news/update/" + mongodb_id);
                    console.error(err);
                }
            });
        }
    } else {
        // This is for the check command
        var pretty = JSON.stringify(to_save, null, 3);
        pretty = pretty.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        $('#check-log').html(pretty);
        $('#check-log-outer').modal('toggle');
    }
}

/**
 * When passed a data object and a target, target is loaded into data[target] at key "target"
 * @param data
 * @param target
 * @param div_id OPTIONAL
 */
function get_value_text(data, target, div_id) {
    div_id = (typeof div_id === 'undefined') ? target : div_id;
    data[target] = clean_html($('#' + div_id).val());
}

function get_value_checkbox(data, target) {
    var checkvalue = $('#checkbox-' + target).is(':checked');
    if (checkvalue) {
        data[target] = checkvalue;
    }
}
