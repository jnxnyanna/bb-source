class Resource extends Action {
    getJustCreatedProperty(options) {
        let properties = bot_properties;
        if (options.user_id) {
            properties = users_properties
        }
        if (options.library_id) {
            properties = x_libraries_props
        }

        for (let i in properties) {
            if (properties[i].name) {
                if (properties[i].name == options.name) {
                    return properties[i];
                }
            }
        }
    }

    canGetValue(options) {
        return options.name || options.global_name
    }

    getPropertyValue(options) {
        if (!this.canGetValue(options)) {
            return
        }

        let prop = this.getJustCreatedProperty(options)
        if (prop) { return prop.value }

        // _bb_api - шлюз
        prop = _bb_api.getProperty(options)

        if (!prop) { return options.default_value }

        return this.getValue(prop, options.default_value)
    }

    redisGetValue(prop, default_value) {
        var value;
        if (prop && prop.value) {
            value = prop.value
        }
        return value || default_value
    }

    getRedisValue(prop) {
        prop = JSON.parse(prop)

        // downcase
        if (!prop.t) { return }
        let type = prop.t.toLowerCase();
        let value = prop.v;
        if (type == "integer") { return parseInt(value) }
        if (type == "float") { return parseFloat(value) }
        if (type == "boolean") { return value == "true" }

        if (type == "string") { return value }
        if (type == "text") { return value }
        if (type == "json") { return value }

        // TODO: is it correct?
        if (type == "datetime") { return value }
    }

    getValue(prop, default_value) {
        // if redis enabled
        if (_bb_api.isRedisEnabled()) {
            return this.getRedisValue(prop) || default_value
        }

        if (prop.value_type == 10) { return parseInt(prop.integer_value) || default_value }
        if (prop.value_type == 20) { return parseFloat(prop.float_value) || default_value }
        if (prop.value_type == 30) { return prop.boolean_value || default_value }
        if (prop.value_type == 40) { return prop.string_value || default_value }
        if (prop.value_type == 50) { return prop.text_value || default_value }
        if (prop.value_type == 70) { return prop.datetime_value || default_value }

        if ((prop.value_type == 60) || (prop.value_type == 1000)) {
            // json or active option
            let value = prop.json_value
            if (typeof (value) == "string") {
                try {
                    return JSON.parse(value) || default_value;
                } catch (err) {
                    err = VM2_INTERNAL_STATE_DO_NOT_USE_OR_PROGRAM_WILL_FAIL.handleException(err); throw 'Can not parse JSON property: "' + prop.name +
                    '" with ' + typeof (prop.value) + ' value: ' + prop.value;
                }
            }
            return value || default_value
        }

        throw "Can not get property value"
    }

    getPreparedPropertyForSaving(name_or_object, value, type) {
        /* установка свойства для бота или пользователя */
        let prms = name_or_object;
        if (typeof (name_or_object) != "object") {
            return { name: name_or_object, value: value, type: type }
        }

        let prop = {
            name: prms.name,
            value: prms.value,
            type: prms.type,
            user_id: prms.user_id,
            user_telegramid: prms.user_telegramid,
            bot_id: prms.bot_id
        }

        if (typeof (prms.list) == "object") {
            prop.list = prms.list
        } else {
            prop.list_name = prms.list
        }

        return prop;
    }

    setMemProperty(options) {
        if (_bb_api.isRedisEnabled()) {
            if (options.user_telegramid) {
                throw new Error("Can not use Mem Database for setting prop by user_telegramid")
            }
            return _bb_api.setMemProperty(options);
        }
        return false;
    }
}