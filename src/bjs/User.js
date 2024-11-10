class ActiveUser extends Resource {
    setProperty(name_or_object, value, type) {
        /* установка свойства для пользователя */
        let prop = this.getPreparedPropertyForSaving(name_or_object, value, type);
        if (!prop.user_id && user) { prop.user_id = user.id }

        users_properties.push(prop);

        /* redis enabled */
        if (this.setMemProperty(prop)) { return true }

        this.sendAction('set-user-property', prop);
    }

    getProperty(name_or_object, default_value) {
        if (!user) {
            throw new Error("User.getProperty: user is not defined. Seems this command is runned on background.");
        }
        var options = name_or_object
        if (typeof (options) != "object") {
            options = { name: name_or_object, user_id: user.id, default_value: default_value }
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
        return this.setProp(propName, null, "boolean");
    }

    addToGroup(group_name) {
        /* пока можно добавить только в одну группу */
        return this.setProperty('group', group_name, 'string')
    }

    removeGroup() {
        return this.setProperty('group', null, 'string')
    }

    getGroup() {
        return this.getProperty('group');
    }

    setCache(time_in_seconds) {
        this.sendAction('set-user-cache', { time_in_seconds: time_in_seconds });
    }

    clearCache(command_name) {
        this.sendAction('clear-user-cache', { command_name: command_name });
    }
}