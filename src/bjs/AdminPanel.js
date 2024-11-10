class ActiveAdminPanel extends Resource {
    getPanel(name) {
        return this.getPropertyValue({ name: name });
    }

    getPanelField(opt) {
        if (!opt.panel_name) { return }
        var in_panel = this.getPanel(opt.panel_name);

        if (!in_panel) { return }
        if (!in_panel.fields) { return }

        for (var ind in in_panel.fields) {
            if (in_panel.fields[ind].name == opt.field_name) {
                return in_panel.fields[ind]
            }
        }
    }

    getPanelValues(name) {
        var panel = this.getPanel(name);
        var result = {};

        if (!panel) { return result }

        var field;
        for (var ind in panel.fields) {
            field = panel.fields[ind];
            if (!field.name) { continue }
            result[field.name] = field.value
        }

        return result;
    }

    getFieldValue(opt) {
        var field = this.getPanelField(opt)
        if (field) { return field.value }
    }

    setFieldValue(opt) {
        if (!opt.panel_name) { return }
        var panel = this.getPanel(opt.panel_name);

        if (!panel) { return }
        var result = false;

        for (var ind in panel.fields) {
            if (panel.fields[ind].name != opt.field_name) { continue }
            panel.fields[ind].value = opt.value

            this.doSetPanel({ panel_name: opt.panel_name, data: panel });
            return true;
        }
    }

    extractOldFieldsValues(opt) {
        var field_name, new_field;
        if (!opt.data) { return }
        if (!opt.data.fields) { return opt.data }
        if (!this.getPanel(opt.panel_name)) { return opt.data }

        var cur_field;
        for (var ind in opt.data.fields) {
            cur_field = this.getPanelField({
                panel_name: opt.panel_name,
                field_name: opt.data.fields[ind].name
            })

            if (cur_field) {
                opt.data.fields[ind].value = cur_field.value
            }
        }

        return opt.data
    }

    doSetPanel(opt) {
        /* установка свойства для всего бота */
        let prop = { name: opt.panel_name, value: opt.data, type: 'active_option' }
        bot_properties.push(prop);
        this.sendAction('set-bot-property', prop);
    }

    setPanel(opt) { // (name, json){
        if (!opt) { return }

        // opt.data -can be null

        if (!opt.force) {
            opt.data = this.extractOldFieldsValues(opt);
        }

        this.doSetPanel(opt);
    }
}