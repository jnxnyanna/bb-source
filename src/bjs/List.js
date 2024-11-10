class List extends Resource {
    constructor(prms) {
        super()

        this.exist = false;
        this.id = null;
        this.bot_id = null;
        this.user_id = null;
        this.name = null;

        this.order_ascending = true;
        this.per_page = 100;
        this.page = 1;

        this.case_sensitive = true;

        this.recount_delay = {
            lag: 1000, // 1 ms - 1 sec
            total: null,
            current_value: null,
        }

        if (prms) {
            this.bot_id = prms.bot_id;
            this.user_id = prms.user_id;

            if ((prms.user) && (prms.user.id)) {
                this.user_id = prms.user.id;
            }

            this.name = prms.name;
        }

        this.setDefaultBotId();
        this.loadInfo();
        //console.log(this)
    }

    setDefaultBotId() {
        if (!bot) { return }
        if (this.bot_id) { return }
        this.bot_id = bot.id;
    }

    getEasyParams(include_name = null) {
        let name = (include_name ? this.name : null)

        return {
            id: this.id,
            name: name,
            // bot_id: ... TODO: for other bots
            user_id: this.user_id
        }
    }

    getParams(include_name = null) {
        return { list: this.getEasyParams(include_name) }
    }

    loadInfo() {
        let list = _bb_api.list.load(this);

        this.exist = false;

        for (let ind in list) {
            this[ind] = list[ind];
        }

        if (this.id) {
            this.id = parseInt(this.id)
            this.exist = (this.id > 0);

            // time in ms
            this.updated_ago = (new Date() - new Date(this.updated_at));
            this.setRecountDelay();
        }

        this.total_pages = Math.ceil(this.count / this.per_page)
    }

    // you need to recount list sometimes
    // such recount can be very slowly so we need to perform it not very often
    // https://help.bots.business/bjs/lists#recount-list
    setRecountDelay() {
        if (!this.last_calc_time) { return }

        // time in ms
        // if last calc time is 10 ms we need to wait 10 sec for new calc
        this.recount_delay.total = 1000 * this.recount_delay.lag * this.last_calc_time;
        this.recount_delay.current_value = this.recount_delay.total - this.updated_ago;
    }

    isRecountNeeded() {
        if (!this.exist) { return false }

        if (!this.last_calc_time) { return true }

        if (!this.recount_delay.current_value) { return true }

        return this.recount_delay.current_value < 0
    }

    getBuildedUser(prop) {
        if (!prop.user_id) {
            return null
        }
        return {
            id: prop.user_id,
            first_name: prop.first_name,
            last_name: prop.last_name,
            username: prop.username,
            telegramid: prop.telegramid,
            language_code: prop.language_code
        }
    }


    buildProp(prop) {
        if (!prop) { return }
        return {
            name: prop.name,
            value: this.getValue(prop),
            user: this.getBuildedUser(prop),
            // bot_id ? - почему бы не сделать общий список для ботов
            created_at: prop.created_at,
            updated_at: prop.updated_at
        }
    }

    buildProps(properties) {
        this.properties = []

        for (let ind in properties) {
            this.properties.push(this.buildProp(properties[ind]))
        }

        this.assignCountFor(this.properties);
        return this.properties;
    }


    buildUser(user) {
        if (!user) { return }
        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            telegramid: user.telegramid,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }

    buildUsers(users) {
        this.users = [];

        for (let ind in users) {
            this.users.push(this.buildUser(users[ind]))
        }
        this.assignCountFor(this.users);

        return this.users;
    }

    assignCountFor(objects) {
        // quick update count
        if (objects.length < this.per_page) {
            this.count = objects.length;
        }
    }

    create() {
        this.sendAction('create-list', this.getParams(true))
    }

    get() {
        let properties = _bb_api.list.loadProperties(this);
        return this.buildProps(properties);
    }

    getUsers() {
        let users = _bb_api.list.loadUsers(this);
        return this.buildUsers(users);
    }

    throwErrorIfNotExist(method) {
        if (this.exist) { return }
        throw new Error('List "' + this.name +
            '" not exist yet or is just created. Can not perform method: ' + method)
    }

    removeProperty(propertyName) {
        let params = {
            list: this.getEasyParams(),
            prop_name: propertyName
        }
        this.sendAction('remove-prop-from-list', params);
    }

    rejectProperty(propertyName) {
        let params = {
            list: this.getEasyParams(),
            prop_name: propertyName
        }
        this.sendAction('reject-prop-from-list', params);
    }

    remove() {
        this.throwErrorIfNotExist('remove');
        this.sendAction('remove-list', this.getParams())
    }

    removeAll() {
        this.throwErrorIfNotExist('removeAll');
        this.sendAction('remove-list-and-props', this.getParams())
    }

    rejectAll() {
        this.throwErrorIfNotExist('rejectAll');
        this.sendAction('reject-props-from-list', this.getParams())
    }

    search(text) {
        let properties = _bb_api.list.searchProperties(text, this);
        return this.buildProps(properties);
    }

    recount(params) {
        this.throwErrorIfNotExist('recount');

        if (!params) { params = {} }
        params.list = this.getEasyParams();
        this.sendAction('recount-list', params)
    }

    is_correct_user(user) {
        let err_msg = 'Need pass user';
        if (!user) { throw new Error(err_msg) }

        err_msg = 'Need pass user_id. E.g: { id: user.id }. You pass: ' + JSON.stringify(user)
        if (!user.id) { throw new Error(err_msg) }
    }

    addUser(user) {
        this.is_correct_user(user);

        this.sendAction('add-user-to-list', {
            list: this.getEasyParams(true),
            user_id: user.id
        })
    }

    rejectUser(user) {
        this.is_correct_user(user);

        this.sendAction('reject-user-from-list', {
            list: this.getEasyParams(true),
            user_id: user.id
        })
    }

    rejectAllUsers() {
        this.sendAction('reject-all-users-from-list', this.getParams())
    }

    haveUser(user) {
        if (!user) { throw new Error('need pass user object') }
        if (!user.id) { throw new Error('need user.id to find user in list') }

        let result = _bb_api.list.haveUser(user, this);
        return this.buildUser(result)
    }

    getUser(user) {
        return this.haveUser(user)
    }
}