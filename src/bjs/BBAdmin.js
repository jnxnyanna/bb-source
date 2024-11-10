class ActiveBBAdmin extends Action {
    constructor(admin_bridge_data) {
        super();
        let admin_data
        try {
            admin_data = admin_bridge_data;
        } catch (err) {
            err = VM2_INTERNAL_STATE_DO_NOT_USE_OR_PROGRAM_WILL_FAIL.handleException(err); throw "Error with BridgeData: " + err;
        }

        this.curUser = {
            parentAccount: admin_data.parent_account
        }
    }

    addExtraPointsToIterationQuota(options) {
        this.sendAction('bbadmin-add-extra-points-to-iteration-quota', options)
    }

    addChildAccount(api_key) {
        /* трекаем событие для segment.com */
        /*  options = { event: 'buy product', properties: { price: 10, discount: 20 }  } */
        this.sendAction('bbadmin-add-child-account', { api_key: api_key });
    }

    unlinkAllChildAccounts() {
        this.sendAction('bbadmin-unlink-all-child-accounts', {});
    }

    getParentAccount(options) {
        this.sendAction('bbadmin-get-parent-account', options)
    }

    getParentAccountDetails(options) {
        this.sendAction('bbadmin-get-parent-account-details', options)
    }

    installPaidStoreBot(options) {
        this.sendAction('bbadmin-install-paid-store-bot', options)
    }

    attractUser(options) {
        this.sendAction('bbadmin-try-to-attract-another-user', options);
    }

    installBot(options) {
        this.sendAction('bbadmin-install-bot-for-another-user', options);
    }

    cloneBot(options) {
        this.sendAction('bbadmin-install-bot-for-another-user', options);
    }

    resetPassword(options) {
        this.sendAction('bbadmin-set-new-password-via-bot-token', options);
    }

    getAccountBalance(options) {
        this.sendAction('bbadmin-get-account-balance', options);
    }
}