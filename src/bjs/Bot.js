class ActiveBot extends Resource {
    doSendMessage(action_name, params) {
        if (typeof (params.value) == 'object') { params.value = JSON.stringify(value) }
        this.sendAction(action_name, params);
    }

    sendMessageAsObj(params = {}) {
        if (!params.text) { throw 'Text can not be blank' }
        let action_name = 'NEW-send-message';

        this.sendAction(action_name, params)
    }

    sendMessage(value, options) {
        if (typeof (value) == 'object') {
            /* новое АПИ */
            return this.sendMessageAsObj(value)
        }

        this.doSendMessage('send-message', { value: value, options: options });
    }

    editMessage(value, message_id, options) {
        this.sendAction('edit-message', { value: value, message_id: message_id, options: options });
    }

    sendMessageToChat(chat_name, value, options) {
        this.doSendMessage('send-message-to-other-chat',
            { chat_name: chat_name, value: value, options: options });
    }

    editMessageInChat(chat_id, value, message_id) {
        this.sendAction('edit-message-in-other-chat', { chat_id: chat_id, value: value, message_id: message_id });
    }

    sendMessageToChatWithId(chat_id, value, options) {
        this.doSendMessage('send-message-to-other-chat',
            { chat_id: chat_id, value: value, options: options });
    }

    /*
      sendMessageToBotAdmins(value){
          if(typeof(value)=='object'){ value = JSON.stringify(value) }
              this.sendAction('send-message-to-bot-admins', { value: value } );
                }
                  */

    inspect(value) {
        this.sendMessage(JSON.stringify(value, null, 2),
            { parse_mode: null }
        )
    }

    sendResult(value) {
        /* идентичные функции пока? */
        sendMessage(value);
    }

    sendKeyboard(buttons, message, options) {
        this.sendAction('send-keyboard', { buttons: buttons, message: message, options: options });
    }

    sendInlineKeyboard(buttons, message, options) {
        this.sendAction('send-inline-keyboard', { buttons: buttons, message: message, options: options });
    }

    sendInlineKeyboardToChatWithId(chat_id, buttons, message, options) {
        this.sendAction('send-inline-keyboard', { chat_id: chat_id, buttons: buttons, message: message, options: options });
    }

    editInlineKeyboard(buttons, message_id, chat_id) {
        // see https://core.telegram.org/bots/api#editmessagereplymarkup
        this.sendAction('edit-inline-keyboard', { buttons: buttons, message_id: message_id, chat_id: chat_id });
    }

    runCommand(command, options) {
        /* e.g.:  /run task  */
        if (!command) { return }   // bugfix
        this.sendAction('run-command', { command: command, options: options });
    }

    run(options) {
        // new method instead runCommand
        if (!options) { return }
        if (!options.command) { return }

        let need_run_after = false;
        if (!options.run_after) {
            need_run_after = options.chat_id || options.bot_id || options.user_id || options.user_telegramid
        }

        if (need_run_after) {
            // Bug workaround for running for another bot or chat or user
            options.run_after = 1;
        }

        if (!options.user_telegramid) {
            if (!options.user_id && user) { options.user_id = user.id }
            if (!options.chat_id && chat) { options.chat_id = chat.id }
        }

        // set same chat_id on customized user_id
        if (user && options.user_id && options.user_id != user.id) {
            options.chat_id = options.user_id;
        }

        //remove user_id on customized chat id
        else if (chat && options.chat_id && options.chat_id != chat.id) {
            options.user_id = null;
        }

        this.sendAction('run-command',
            {
                command: options.command,
                options: options.options,
                run_after: options.run_after,
                bot_id: options.bot_id,
                user_id: options.user_id,
                user_telegramid: options.user_telegramid,
                chat_id: options.chat_id,
                label: options.label,
                ignoreMissingCommand: options.ignoreMissingCommand
            });
    }

    clearRunAfter(options) {
        this.sendAction('clear-run-after',
            {
                label: (options ? options.label : null)
            });
    }

    runAll(options) {
        if (typeof (options) != "object") { throw new Error("Need pass options") }
        if (!options.command) { throw new Error("Need pass command for execution") }

        let rcmd = options.command.split(' ')[0]
        if (message && (message.split(' ')[0] == rcmd)) {
            throw new Error("Can not runAll for same command: " + rcmd + ' from ' + rcmd)
        }

        this.sendAction('run-command-for-all', options);
    }

    setPropertyFromParams(prms) {

    }

    setProperty(name_or_object, value, type) {
        let prop = this.getPreparedPropertyForSaving(name_or_object, value, type);
        bot_properties.push(prop);

        /* redis enabled */
        if (this.setMemProperty(prop)) { return true }

        /* установка свойства для всего бота */
        this.sendAction('set-bot-property', prop);
    }

    getProperty(name_or_object, default_value) {
        var options = name_or_object
        if (typeof (options) != "object") {
            options = { name: name_or_object, default_value: default_value }
        }
        return this.getPropertyValue(options);
    }

    setProp(name_or_object, value, type) {
        return this.setProperty(name_or_object, value, type);
    }

    getProp(name_or_object, default_value) {
        return this.getProperty(name_or_object, default_value);
    }

    // remove prop
    deleteProp(propName) {
        return this.setProperty(propName, null, "boolean");
    }

    importCSV() {
        this.sendAction('import-csv', {});
    }

    importGit(params) {
        this.sendAction('import-git', params);
    }

    exportGit(params) {
        this.sendAction('export-git', params);
    }

    blockChat(chat_id) {
        this.sendAction('block-chat', { chat_id: chat_id });
    }

    unblockChat(chat_id) {
        this.sendAction('unblock-chat', { chat_id: chat_id });
    }

    setCache(time_in_seconds) {
        this.sendAction('set-bot-cache', { time_in_seconds: time_in_seconds });
    }

    clearCache(command_name) {
        this.sendAction('clear-bot-cache', { command_name: command_name });
    }
}