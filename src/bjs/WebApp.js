class ActiveWebApp extends Action {
    _evalTemplate(params) {
        var template = new Command({ name: params.template });
        var code = template.code;
        if (!code) { return }

        // parse <% any-code %> lines
        var regex = /<%[^>]*%>/gm;

        return code.replace(regex, function (value) {
            var mask = value.substring(2, value.length - 2);
            var options = params.options;
            // pass options to mask
            mask = 'let options=' + JSON.stringify(options) + ';' + mask;
            return eval(mask);
        })
    }

    render(params) {
        if (!params) { return }

        // render template
        if (params.template && !params.content) {
            params.content = this._evalTemplate(params)
        }

        this.sendAction('WebApp::render', params);
    }

    _sortOptions(options) {
        var keys = Object.keys(options);

        keys.sort();
        var newOptions = {}

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            newOptions[key] = options[key]
        }
        return newOptions;
    }

    _buildQuery(options) {
        if (!options) { return }

        options = this._sortOptions(options);

        var result;
        for (var key in options) {
            if (!result) { result = '?' }

            result += encodeURIComponent(key) + '=' + encodeURIComponent(options[key]) + '&'
        }

        return result;
    }

    getSecret(options, query = null) {
        if (!query) {
            query = this._buildQuery(options.options);
        }

        var hash = CryptoJS.SHA512(
            String(bot.token) + options.command + query
        );

        return hash.toString(CryptoJS.enc.Base64);
    }

    getUrl(options) {
        if (!options) {
            throw new Error("Need pass options for WebApp.getUrl")
        }
        if (!options.command) {
            throw new Error("Need pass options.command for WebApp.getUrl")
        }

        var bot_id = (options.bot_id ? options.bot_id : bot.id)

        var query = this._buildQuery(options.options);

        var prefix = ""
        if (!query) {
            query = '';
            prefix = '?';
        }

        var secret = prefix + 'secret=' + this.getSecret(options, query);

        return 'https://' +
            BB_API_URL + '/v2/bots/' + bot_id +
            '/web-app/' + encodeURIComponent(options.command) +
            query + secret
    }
}