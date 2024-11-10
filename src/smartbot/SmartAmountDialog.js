class SmartAmountDialog {
    lib_prefix = "SmartAmountDialog.";

    constructor(options) {
        if (!options) { throw new Error("Need to pass options to SmartAmountDialog") }

        this.smartBot = options.smartBot;
        this.max = options.max;
        this.min = options.min;
        this.curValue = options.curValue || 0;
        this.onlyInteger = options.onlyInteger || false;
        this.skipZero = options.skipZero || false;

        this.dialogErrors = options.dialogErrors;
    }

    accept(strAmount) {
        this.text = strAmount;

        // invalid amount
        if (!this._stringIsFloat()) {
            return this._setErr("invalid")
        }

        // if not integer
        if (this.onlyInteger && !this._stringIsInteger()) {
            return this._setErr("notInteger")
        }

        // if zero
        if (!this.skipZero && this.curValue == 0) {
            return this._setErr("zero")
        }

        this.amount = parseFloat(strAmount);

        // if not enough
        if (this.amount > this.curValue) {
            return this._setErr("notEnough")
        }

        // if too small
        if (this.min && this.amount < this.min) {
            return this._setErr("small")
        }

        // if too big
        if (this.max && this.amount > this.max) {
            return this._setErr("big")
        }

        return true;
    }

    _setErr(key) {
        let errText = this.dialogErrors[key];

        let max = (this.curValue < this.max ? this.curValue : this.max);

        // if no smartBot - return errText
        if (!this.smartBot) { return errText }

        this.smartBot.add({
            _amount: this.amount || this.text,
            _min: this.min,
            _max: max,
            _curValue: this.curValue
        });

        // fill vars in errText
        this.errMsg = this.smartBot.fill(errText);
        return false;
    }

    // accept only integer or float
    _stringIsFloat() {
        return /^\d+(\.\d+)?$/.test(this.text);  // it is regex for float like "1.23"
    }

    _stringIsInteger() {
        return /^\d+$/.test(this.text);  // it is regex for integer like "123"
    }

}