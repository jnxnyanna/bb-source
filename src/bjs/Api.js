class ActiveAPI extends Action {
    // все методы с telegram API (почти)
    sendApiAction(action_name, params) {
        if (typeof (params) != "object") {
            throw new Error("Need object for API actions by passed: " + params)
        }

        var _prms = {}
        var value;
        for (var key in params) {
            value = params[key]

            if (typeof (value) == "object") {
                if (key != "bb_options") {  // skip bb_options
                    value = JSON.stringify(value)
                }
            }

            _prms[key] = value
        }

        this.sendAction("API-" + action_name, _prms);
    }

    call(method, params) {
        // camel case to snake case
        method = method.replace(/([A-Z])/g, "_$1").toLowerCase();
        this.sendApiAction(method, params);
    }

    // Important!
    // on new Api Methods - need to add it to bjs_api_action file on BB Api!

    setWebhook(params) { this.sendApiAction("set_webhook", params) }
    deleteWebhook(params) { this.sendApiAction("delete_webhook", params) }
    getWebhookInfo(params) { this.sendApiAction("get_webhook_info", params) }
    getMe(params) { this.sendApiAction("get_me", params) }
    sendMessage(params) { this.sendApiAction("send_message", params) }
    forwardMessage(params) { this.sendApiAction("forward_message", params) }
    copyMessage(params) { this.sendApiAction("copy_message", params) }
    sendPhoto(params) { this.sendApiAction("send_photo", params) }
    sendAudio(params) { this.sendApiAction("send_audio", params) }
    sendDocument(params) { this.sendApiAction("send_document", params) }
    sendVideo(params) { this.sendApiAction("send_video", params) }
    sendVoice(params) { this.sendApiAction("send_voice", params) }
    sendVideoNote(params) { this.sendApiAction("send_video_note", params) }
    sendMediaGroup(params) { this.sendApiAction("send_media_group", params) }
    sendLocation(params) { this.sendApiAction("send_location", params) }
    editMessageLiveLocation(params) { this.sendApiAction("edit_message_live_location", params) }
    stopMessageLiveLocation(params) { this.sendApiAction("stop_message_live_location", params) }
    sendVenue(params) { this.sendApiAction("send_venue", params) }
    sendContact(params) { this.sendApiAction("send_contact", params) }
    sendChatAction(params) { this.sendApiAction("send_chat_action", params) }
    getUserProfilePhotos(params) { this.sendApiAction("get_user_profile_photos", params) }
    getFile(params) { this.sendApiAction("get_file", params) }
    banChatMember(params) { this.sendApiAction("ban_chat_member", params) }
    unbanChatMember(params) { this.sendApiAction("unban_chat_member", params) }
    restrictChatMember(params) { this.sendApiAction("restrict_chat_member", params) }
    promoteChatMember(params) { this.sendApiAction("promote_chat_member", params) }
    leaveChat(params) { this.sendApiAction("leave_chat", params) }
    getChat(params) { this.sendApiAction("get_chat", params) }
    getChatAdministrators(params) { this.sendApiAction("get_chat_administrators", params) }
    exportChatInviteLink(params) { this.sendApiAction("export_chat_invite_link", params) }
    createChatInviteLink(params) { this.sendApiAction("create_chat_invite_link", params) }
    editChatInviteLink(params) { this.sendApiAction("edit_chat_invite_link", params) }
    revokeChatInviteLink(params) { this.sendApiAction("revoke_chat_invite_link", params) }
    setChatPhoto(params) { this.sendApiAction("set_chat_photo", params) }
    deleteChatPhoto(params) { this.sendApiAction("delete_chat_photo", params) }
    setChatTitle(params) { this.sendApiAction("set_chat_title", params) }
    setChatDescription(params) { this.sendApiAction("set_chat_description", params) }
    pinChatMessage(params) { this.sendApiAction("pin_chat_message", params) }
    unpinChatMessage(params) { this.sendApiAction("unpin_chat_message", params) }
    unpinAllChatMessages(params) { this.sendApiAction("unpin_all_chat_messages", params) }
    getChatMembersCount(params) { this.sendApiAction("get_chat_members_count", params) }
    getChatMember(params) { this.sendApiAction("get_chat_member", params) }
    setChatStickerSet(params) { this.sendApiAction("set_chat_sticker_set", params) }
    deleteChatStickerSet(params) { this.sendApiAction("delete_chat_sticker_set", params) }
    answerCallbackQuery(params) { this.sendApiAction("answer_callback_query", params) }
    editMessageText(params) { this.sendApiAction("edit_message_text", params) }
    editMessageCaption(params) { this.sendApiAction("edit_message_caption", params) }
    editMessageReplyMarkup(params) { this.sendApiAction("edit_message_reply_markup", params) }
    deleteMessage(params) { this.sendApiAction("delete_message", params) }
    sendSticker(params) { this.sendApiAction("send_sticker", params) }
    getStickerSet(params) { this.sendApiAction("get_sticker_set", params) }
    uploadStickerFile(params) { this.sendApiAction("upload_sticker_file", params) }
    createNewStickerSet(params) { this.sendApiAction("create_new_sticker_set", params) }
    addStickerToSet(params) { this.sendApiAction("add_sticker_to_set", params) }
    setStickerPositionInSet(params) { this.sendApiAction("set_sticker_position_in_set", params) }
    setStickerSetThumb(params) { this.sendApiAction("set_sticker_set_thumb", params) }
    deleteStickerFromSet(params) { this.sendApiAction("delete_sticker_from_set", params) }
    answerInlineQuery(params) { this.sendApiAction("answer_inline_query", params) }
    sendInvoice(params) { this.sendApiAction("send_invoice", params) }
    answerShippingQuery(params) { this.sendApiAction("answer_shipping_query", params) }
    answerPreCheckoutQuery(params) { this.sendApiAction("answer_pre_checkout_query", params) }
    sendGame(params) { this.sendApiAction("send_game", params) }
    setGameScore(params) { this.sendApiAction("set_game_score", params) }
    getGameHighScores(params) { this.sendApiAction("get_game_high_scores", params) }


    setPassportDataErrors(params) { this.sendApiAction("set_passport_data_errors", params) }
    editMessageMedia(params) { this.sendApiAction("edit_message_media", params) }
    sendAnimation(params) { this.sendApiAction("send_animation", params) }
    sendPoll(params) { this.sendApiAction("send_poll", params) }
    stopPoll(params) { this.sendApiAction("stop_poll", params) }
    setChatPermissions(params) { this.sendApiAction("set_chat_permissions", params) }
    setChatAdministratorCustomTitle(params) { this.sendApiAction("set_chat_administrator_custom_title", params) }
    getMyCommands(params) { this.sendApiAction("get_my_commands", params) }
    setMyCommands(params) { this.sendApiAction("set_my_commands", params) }
    sendDice(params) { this.sendApiAction("send_dice", params) }

    banChatSenderChat(params) { this.sendApiAction("ban_chat_sender_chat", params) }
    unbanChatSenderChat(params) { this.sendApiAction("unban_chat_sender_chat", params) }

    approveChatJoinRequest(params) { this.sendApiAction("approve_chat_join_request", params) }
    declineChatJoinRequest(params) { this.sendApiAction("decline_chat_join_request", params) }
    setChatMenuButton(params) { this.sendApiAction("set_chat_menu_button", params) }
    getChatMenuButton(params) { this.sendApiAction("get_chat_menu_button", params) }
    setMyDefaultAdministratorRights(params) { this.sendApiAction("set_my_default_administrator_rights", params) }

    setMessageReaction(params) { this.sendApiAction("set_message_reaction", params) }
    deleteMessages(params) { this.sendApiAction("delete_messages", params) }
    forwardMessages(params) { this.sendApiAction("forward_messages", params) }
    copyMessages(params) { this.sendApiAction("copy_messages", params) }
    getUserChatBoosts(params) { this.sendApiAction("get_user_chat_boosts", params) }

    // last API update - Dec 29, 2023
    // https://core.telegram.org/bots/api#december-29-2023


}