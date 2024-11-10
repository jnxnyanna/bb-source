class ActiveHTTP extends Action {
    call_method(method, params) {
        if (!params.url) { throw "ActiveHTTP: Need url" }
        params.http_method = method;
        this.sendAction('HTTP', params)
    }

    get(params) {
        this.call_method("get", params);
    }

    post(params) {
        this.call_method("post", params);
    }

    put(params) {
        this.call_method("put", params);
    }

    delete(params) {
        this.call_method("delete", params);
    }

    options(params) {
        this.call_method("options", params);
    }

    trace(params) {
    }

    patch(params) {
    }
}