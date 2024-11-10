class Command extends Action {
    constructor(prms) {
        super()
        this.name = prms.name;

        this.loadInfo();
    }

    loadInfo() {
        let command = _bb_api.command.load(this);

        for (let ind in command) {
            this[ind] = command[ind];
        }
    }

}