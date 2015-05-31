$(document).ready(function(){

    var groupId = $("#translated").data('groupid');
    var bookgroupId = $("#translate_textarea").data('bookgroupid');
    var paragraphId;


    var socket = io.connect('http://' + document.domain + ':' + location.port + '/rendertranslations');

    socket.on('my response', function (msg) {
        // Server confirms page is connected to socketio
        console.log(msg.connection_status);
    });

    socket.on('connect', function () {
        // Allows user to join a Room. Information about room name is taken from
        // bookgroupId and chapterNumber and sent to the joined socket route
        var chapterNumber = $("select[name=chapter_selection] option:selected").val();
        socket.emit("joined", {"bookgroup_id": bookgroupId, "chapter_number": chapterNumber});
    });

    socket.on('joined_status', function (data) {
        // Transmits a message from the server that the user succesfully joined
        // a room. Sent from joined socket route
        console.log(data.msg);
    });

    socket.on('update text', function (msg) {
        // The currently updated text is taken from the update text socket route
        //  and rendered on the appropriate paragraph.
        $('#' + msg.paragraphId +" p").text(msg.change_text);
    });

    socket.on('render reverted text', function (msg) {
        $('#' + msg.paragraphIdAjax +" p").text(msg.last_text);
    });

    function placeParagraph(translatedText, pId) {
        // Places the translated text in the assigned paragraph div depending on
        // whether a user adds or updates a translation.
        var paragraphId = $("#"+pId);

        paragraphId.empty();
        paragraphId.html("<p>"+translatedText+"</p>");
    }

    function isEmpty( el ){
        return !$.trim(el.html());
    }

    $(".edit_text").click(function (editevt) {
        // TODO: show translated text when user begins to edit
        // When .edit_text is click, it triggers the socket.emit on the input
        // event handler for #text_form_ta
        paragraphId = $(this).data('paragraphid');
        var translated_para_text =  $("#" + paragraphId + " p").text();
        var untranslated_para_text = $("." + paragraphId + " p").text();

        $("#current_untans_text p").text(untranslated_para_text);
        $("#text_form_ta").val(translated_para_text);

        $("#text_form_ta").trigger("input");
    });

    $("#text_form_ta").on("input", function (evt) {
        // Socket logs all changes made to the textarea and sends the info to
        // the value changed socket route
        socket.emit('value changed', {"paragraphId" : paragraphId,
                "change_text": $(this).val()});
    });

    $("#cancel_translation_btn").on("click", function (evt) {
        $.ajax({
            url: "/cancel_translation",
            data: "&p_id=" + paragraphId + "&bg_id=" + bookgroupId,
            type: "POST",
            success: function(response) {
                console.log(response.last_saved_trans + " ctb");
               socket.emit("canceled translation", {"last_text" :
                response.last_saved_trans, "paragraphIdAjax" : response.paragraph_id});
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    // hides and shows edit button
    $(".a_chapter_and_bttn").on("mouseenter", function () {
        $(this).find("button").show();
    });

    $(".a_chapter_and_bttn").on("mouseleave", function () {
        $(this).find("button").hide();
    });

    $("#submit_bttn").on("click", function (evt) {
        // submits translated text to the db.
        evt.preventDefault();
        var translated_text = $("#text_form_ta").val();

        $.ajax({
            url: "/save_text",
            data: $('form').serialize() + "&p_id=" + paragraphId + "&bg_id=" + bookgroupId,
            type: "POST",
            success: function(response) {
                placeParagraph(response.translated_text, response.paragraph_id);
            },
            error: function(error) {
                console.log(error);
            }
        });
        $(".trans_para").show();
    });

    $(".trans_para").each(function () {
        if (isEmpty($(this))) {
            $(this).html("<p></p>");
        }
    });

    // leaves room
    $("#chosen_chap_submit").on("click", function (evt) {
        var chapterNumber = $("select[name=chapter_selection] option:selected").val();
        socket.emit("leave", {"bookgroup_id": bookgroupId, "chapter_number": chapterNumber});
    });

    function main() {
        // hide the edit text button
        var edit_text_bttn = $(".edit_text");
        edit_text_bttn.hide();
    }

    main();
});