class SmartBot {
    LIB_PREFIX = "SmartBot";

    // we can run another command - so handle is not needed
    doNotHandle = false;

    // smart params
    params = {};

    // cur command Template
    curCommand = {};

    // cur command name
    curCommandName = null;
    langData = {};

    curApiMethod = null;
    paramsForApi = {}; // params for Api.sendMessage

    smartError = null;

    // constructor
    constructor(opts) {
        if (this._needToSkip()) { return }

        this.params = opts?.params || {};

        // add Global Options to params
        this.params = { ...this.params, ...options };

        this.defaultMarkdown = opts?.defaultMarkdown || "Markdown";

        this.strict_params = opts?.strict_params || false;

        this.skip_cmd_folders = opts?.skip_cmd_folders || [];

        this.debug = opts?.debug || false;

        // throw new Error(`${this.LIB_PREFIX} error on message "${message}": ${text}. All params: ${JSON.stringify(this.params)}`)
        this.smartError = new SmartError({
            prefix: this.LIB_PREFIX,
            endPrefixPart: " func > ",  // ??
            endPart: ". All params: " + JSON.stringify(this.params),
            debugTitle: "SmartBot:Debug",
            isDebug: this.debug
        });

        this._setLangData();
        if (message && this.langData && this.langData.commands) {
            // in message we have command name
            // command - it is global BB variable
            this.curCommandName = command?.name || message?.split(" ")[0];
            // TODO: we can pass commands params like "/start user1221" here
            // but is needed?
            // this.params.cmdParams = message.split(" ").slice(1).join(" ");
            this.curCommand = this.langData.commands[this.curCommandName]
            if (this._setCmdByAlias()) {
                // need run another Command because we can have BJS in it!
                this.run({ command: this.curCommandName });
                this.doNotHandle = true;
            }
        }
    }

    // setup Lang data
    setupLng(langName, keys) {
        Bot.setProperty(this.LIB_PREFIX + '_lang_' + langName, keys, "json");
        let def = this._getDefaultLng();
        if (!def) { this._setDefaultLng(langName) }
    }

    _getDefaultLng() {
        return Bot.getProperty(this.LIB_PREFIX + "_lang_" + "default");
    }

    _setDefaultLng(langName) {
        Bot.setProperty(this.LIB_PREFIX + "_lang_" + "default", langName, "string");
    }

    _getUserLanguage() {
        if (user) {
            let lng = User.getProperty(this.LIB_PREFIX + "_lang_" + "curLangName");
            if (lng) { return lng }
        }
        return this._getDefaultLng();
    }

    _setLangData() {
        if (this._needToSkip()) { return }

        let curLng = this._getUserLanguage();
        this.langData = Bot.getProperty(this.LIB_PREFIX + "_lang_" + curLng);
    }

    _throwErrOnEmptyLangData() {
        if (this.langData) { return }

        this.smartError.throw("Language is not configured. " +
            "You need to add it via setupLng() function");
    }

    // is current message or passed message is alias?
    // it can be used for check alias in BJS
    // for "Back", "Cancel" buttons and etc in Wait For Answer Commands
    isAlias(_message, _defineCurCmd = false) {
        let alias = _message || message;
        if (!_message) { return }

        // find command by alias
        for (let cmdName in this.langData?.commands) {
            let cmd = this.langData.commands[cmdName];
            let isAlias = (cmd.alias == alias)

            // cmd.aliases - is string, separate by ","
            if (!isAlias && cmd.aliases) {
                // need trim for all aliases before

                if (typeof cmd.aliases == "string") {
                    cmd.aliases = cmd.aliases.split(",").map(alias => alias.trim());
                }

                isAlias = cmd.aliases.includes(alias);
            }

            if (!isAlias) { continue }

            if (_defineCurCmd) {
                this.curCommandName = cmdName;
                this.curCommand = cmd;
                this._debug(`Set command by alias:\n${alias} -> ${cmdName}`);
            }

            return true;
        }
    }

    _setCmdByAlias() {
        // command can have alias or aliases
        // alias can have " " (space) in name - it is not allowed for command name
        // so alias can't have params
        const alias = message;
        if (!alias) { return }
        if (this.curCommand) { return }

        return this.isAlias(alias, true)
    }

    _noHandle() {
        if (this.doNotHandle) { return true }

        if (message) { return }
        if (this.langData) { return }

        return true;
    }

    // PUBLIC METHODS
    // send response from SmartBot
    handle() {
        if (this._noHandle()) {
            this._debug("Skip handle because it is NOT needed (no message, no langData or doNotHandle)");
            return
        }

        this._debug(`Handle[${completed_commands_count}]: ` + message);

        this._throwErrOnEmptyLangData();

        this.paramsForApi = {};
        this.curApiMethod = null;

        if (!this.curCommand) {
            const commands = Object.keys(this.langData.commands);

            this._debug(
                "Command not found: \n`" + this.curCommandName + "`" +
                "\n\n*Total commands count:* " + commands.length + "\n\n" +
                "*Commands* (first 30 only):\n" + commands.slice(0, 30).join(", ")
            )
            return
        }

        this._processCmd();
        this._processAnotherRun();
    }

    // add params for fill variables
    fill(text_or_object) {
        return this._getValue(text_or_object);
    }

    // add params for fill variables
    // use filling also because params can have {variable} too
    add(params) {
        // add params to existing params
        this.params = { ...this.params, ...params };

        // refill params with new params
        this.params = this._fillVarsInObject(this.params, true);
    }

    // set params for fill variables
    set(params) {
        this.params = params;
        this.params = this._fillVarsInObject(params, true);
    }

    // run another bot command like Bot.run
    // but with Smart Params
    // and add request.message.message_id from current request
    run(opts) {
        if (!opts) { return }

        opts.options ||= {};

        // do not throw error if command not found
        // we can have Command Template only without command
        opts.ignoreMissingCommand = true;

        let params = this.params;
        // we don't include param wicth alredy exist in opts.options
        for (let key in opts.options) {
            delete params[key];
        }

        // add Smart Params to opts:
        opts.options = { ...opts.options, ...params };

        // add message_id from current request if not set
        opts.options.message_id ||= request?.message?.message_id;

        Bot.run(opts)
    }

    // PRIVATE METHODS
    // Private methods - started with "_"
    _debug(text) {
        if (!this.smartError) { return } // on "/setup" or etc

        this.smartError.isDebug = this.debug; // it is easy for debug
        this.smartError.debug(text);
    }

    _throwErr(text) {
        this.smartError.throw(text);
    }

    _throwErrOnEmptyValue(key, text) {
        if (!this.strict_params) { return }

        // via smart error
        this.smartError.throw(
            `Variable ${key} is empty! You need to add param: set({ "${key}": value, and_other: key }). ` +
            `Text: "${text}"`
        );
    }

    _fillVar(text, variable) {
        // key without { and }!
        let key = variable.replace(/{|}/g, "");
        let value = this.params[key];

        this._debug(
            "Set variable: \"" + String(value) + '"->' + variable + " in: " + text +
            "\n\nParams: " + JSON.stringify(this.params)
        );

        if (typeof (value) != "undefined") {
            return text.replace(variable, value);
        }

        this._throwErrOnEmptyValue(key, text);

        // replace with empty string
        return text.replace(variable, "");
    }

    // change {variable} to real values
    // extract all keys from {variable}
    _fillVars(text, _notString) {
        if (typeof text == "undefined") { return }

        // no actions if not string
        if (typeof text != "string") { return text }

        this.smartError.checkType({ value: text, name: "text", needType: "string" });

        const variables = text.match(/{.+?}/g);
        // replace all keys with values
        for (let i in variables) {
            text = this._fillVar(text, variables[i])
        }
        return text;
    }

    // fill vars in object
    _fillVarsInObject(obj, _notString) {
        if (!obj) { return }
        if (typeof obj != "object") {
            return this._fillVars(obj, _notString);
        }

        // for each key in object
        // fill vars in value and in key
        for (let key in obj) {
            obj[key] = this._fillVarsInObject(obj[key], _notString);

            // fill vars in key
            let newKey = this._fillVars(key, _notString);
            if (newKey != key) {
                obj[newKey] = obj[key];
                delete obj[key];
            }
        }
        return obj;
    }

    _getType(typeName) {
        if (!typeName) { return }
        if (typeof typeName != "string") { return }
        // type must be starts with "#/" only
        if (!typeName.startsWith("#/")) { return }

        // we can set type as "#/langVer" or '#/keyboards/joinInlineKeyboard" and etc
        // extract this type from types
        let type = typeName.replace("#/", "");
        let typeParts = type.split("/");
        let typeValue = this.langData.types;

        for (let i in typeParts) {
            typeValue = typeValue[typeParts[i]];
            if (!typeValue) { return null }
        }

        return typeValue;
    }

    _getValue(text_or_object, _noTypeCheck) {
        if (!text_or_object) { return }

        // it can be object or string
        // for object we need to fill vars in it
        if (typeof text_or_object == "object") {  // array is object too
            return this._fillVarsInObject(text_or_object);
        }

        // it is string
        let text = text_or_object;

        // fill vars in text first
        text = this._fillVars(text);

        if (_noTypeCheck) { return text }

        // check for type
        let typeValue = this._getType(text);
        if (typeValue) {
            // can be object again!
            // and we need to fill vars in it too
            return this._getValue(typeValue, true);
        }
        return text;
    }

    _getStringValue(text, keyName) {
        text = this._getValue(text);
        this.smartError.checkType({ value: text, name: keyName, needType: "string" })

        return text;
    }

    getMarkdown() {
        return this.curCommand?.parse_mode || this.defaultMarkdown;
    }

    // rename "command" key to "callback_data"
    _replaceKeysCommandToCallbackData(inline_buttons) {
        return inline_buttons.map(buttons => buttons.map(button => {
            if (button.callback_data) { return button }

            return { ...button, callback_data: button.command, command: undefined };
        }));
    }

    _isValidInlineButton(button) {
        function isValidUrl(url) {
            return (url && url.trim() !== '');
        }

        if (!button.text) return false;

        return (
            (button.callback_data) ||
            (button.url && isValidUrl(button.url)) ||
            (button.web_app && isValidUrl(button.web_app.url)) ||
            (button.login_url && isValidUrl(button.login_url)) ||
            (button.switch_inline_query) ||
            (button.switch_inline_query_current_chat) ||
            (button.switch_inline_query_chosen_chat) ||
            (button.callback_game) ||
            (button.pay)
        );
    }


    _processInlineKeyboard() {
        if (!this.curCommand.inline_buttons) { return }

        this._debug("Inline Buttons Structure: \n" + JSON.stringify(this.curCommand.inline_buttons))

        let inline_buttons = this._getValue(this.curCommand.inline_buttons);
        this.smartError.checkType({ value: inline_buttons, name: "inline_buttons", needType: "array" })


        inline_buttons = this._replaceKeysCommandToCallbackData(inline_buttons);

        this._debug("Inline Buttons: \n" + JSON.stringify(inline_buttons))

        // delete buttons with blank text and etc
        inline_buttons = inline_buttons.map(
            buttons => buttons.filter(this._isValidInlineButton)
        );

        // delete blank arrays from inline_buttons
        inline_buttons = inline_buttons.filter(buttons => buttons.length > 0);

        this.curApiMethod = "sendMessage"
        this.paramsForApi.reply_markup = { inline_keyboard: inline_buttons }

        return true
    }

    _getKeyboardsArr() {
        let keyboard = this._getStringValue(this.curCommand.keyboard);

        // need to convert strings keyboard to keyboards array for Api.sendMessage with reply_markup
        let keyboardLines = keyboard.split("\n");
        let keyboards = [];
        for (let i in keyboardLines) {
            keyboards.push(keyboardLines[i].split(","));
        }
        return keyboards;
    }

    _processKeyboard() {
        if (!this.curCommand.keyboard) { return }

        this._debug("keyboard: " + this.curCommand.keyboard);

        this.curApiMethod = "sendMessage"
        this.paramsForApi.reply_markup = { keyboard: this._getKeyboardsArr(), resize_keyboard: true };
        return true
    }

    _processPhoto() {
        if (!this.curCommand.photo) { return }

        this._debug("photo: " + this.curCommand.photo);

        this.curApiMethod = "sendPhoto"
        this.paramsForApi.photo = this._getStringValue(this.curCommand.photo, "photo");

        return true
    }

    _proccessAlert() {
        const curAlert = this.curCommand.alert || this.curCommand.alert_top;
        if (!curAlert) { return }

        this._debug("alert: " + curAlert);

        this.curApiMethod = "answerCallbackQuery"
        this.paramsForApi.text = this._getStringValue(curAlert, "alert (or alert_top))");
        this.paramsForApi.callback_query_id = request.id;
        this.paramsForApi.show_alert = (this.curCommand.alert ? true : false);

        return true
    }

    _processAnyAction() {
        const anyAction = (this._processKeyboard() ||
            this._processInlineKeyboard() ||
            this._processPhoto() ||
            this._proccessAlert()
        )

        if (anyAction) { return }

        // just send message one single answer
        this._debug("Send single message: " + this.text);
        this.curApiMethod = "sendMessage"
    }

    _setParamsForApi() {
        this.paramsForApi = {
            chat_id: this.chat_id,
            text: this.text,
            caption: this.text,  // just use text for caption too
            parse_mode: this.getMarkdown()
        }
    }

    _needEditingByParams() {
        // support for editing mode
        // "edit" or "editing" must be in params
        // for example: "/command edit"
        if (!params) { return }

        let prms = params.split(" ");
        return prms.includes("edit") || prms.includes("editing")
    }

    _needEditing() {
        let editing = this.curCommand.edit;

        editing = editing || this._needEditingByParams();
        if (!editing) { return }

        // if string
        if (typeof editing == "string") {
            editing = this._getValue(editing);
        }

        this._debug(`In edit key: ${editing}`);

        if (!editing) {
            this._debug(`Edit key ${this.curCommand.edit} is empty. Skip editing`);
            return;
        }

        return true;
    }

    _setEditing() {
        if (!this._needEditing()) { return }

        let message_id = request?.message?.message_id;
        if (this.curCommand.message_id) {
            message_id = this._getValue(this.curCommand.message_id);
        }

        this.paramsForApi.message_id = message_id;

        if (this.curApiMethod == "sendMessage") {
            this.curApiMethod = "editMessageText"
        }

        return true;

        // TODO: editMessageMedia and etc:
        // https://core.telegram.org/bots/api#updating-messages
    }

    _needCmdProcess() {
        const singleTypes = [
            // we can send text or photo without text
            "text", "photo", "alert", "alert_top"
        ]

        const curCmd = this.curCommand;
        if (!curCmd) { return }

        // allow process sending for text, or photo or alert and etc
        if (singleTypes.some(type => curCmd[type])) {
            return true;
        }
    }

    _processCmd() {
        if (!this._needCmdProcess()) { return }

        this._debug(`Process command: "${message}"`);

        let text = this.curCommand.text;
        if (text) {
            this.text = this._getStringValue(text, "text");
        }

        this.chat_id = chat?.chatid

        if (this.curCommand.chat_id) {
            this.chat_id = this._fillVars(this.curCommand.chat_id);
        }

        this._setParamsForApi();
        this._processAnyAction();

        //do edit
        this._setEditing();
        this._debug("Api Method: " + this.curApiMethod + " Params: " + JSON.stringify(this.paramsForApi));

        // curApiMethod to snake_case
        this.curApiMethod = this.curApiMethod.replace(/([A-Z])/g, "_$1").toLowerCase();
        Api.sendApiAction(this.curApiMethod, this.paramsForApi);

        return true
    }

    // run another command if needed
    //   in line run: { command: "/command" }
    _processAnotherRun() {
        if (!this.curCommand.run) { return }
        const commandName = this._getStringValue(this.curCommand.run.command, "run command");

        this._debug("Run sub command: " + commandName);
        this.run({ command: commandName });
    }

    _isSetupCommand() {
        return message == "/setup" || message.startsWith("lng-");
        // todo: check setup folder?
    }

    _needToSkip() {
        const folders = this.skip_cmd_folders;
        const isSkipFolder = Array.isArray(folders) && folders.includes(command?.folder)

        return isSkipFolder || this._isSetupCommand()
    }

}