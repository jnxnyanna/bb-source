class CoreTopBoardLib {
    LIB_PREFIX = "TBL_";

    #throwError(message) {
        throw new Error("TopBoardLib: " + message);
    }

    #checkAddScoreParams(params) {
        if (!params.value) {
            this.#throwError("need pass value for addScore")
        }

        if (params.value == 0) { return }
        return true;
    }

    #getIncreasedUserValue(boardName, user_id, value) {
        const userPropName = this.getUserPropName(boardName);
        let curValue = Bot.getProperty({ name: userPropName, user_id: user_id }) || 0;
        curValue += value;

        Bot.setProperty({ name: userPropName, value: curValue, user_id: user_id });
        return curValue;
    }

    #saveSortedBoard(boardName, list, maxCount = 10) {
        if (maxCount < 2) {
            this.#throwError("maxCount must be >= 2")
        }

        if (maxCount > 25) {
            this.#throwError("maxCount must be <= 25")
        }

        list.sort((a, b) => b.value - a.value);

        if (list.length > maxCount) {
            list = list.slice(0, maxCount);
        }

        Bot.setProperty(
            this.getBoardPropName(boardName),
            { list: list },
            "json"
        );
    }

    #getBoard(boardName) {
        boardName = boardName || "default";
        let propName = this.getBoardPropName(boardName);
        let storedList = Bot.getProperty(propName);

        if (storedList && storedList.list) {
            return storedList.list;
        }
        return [];
    }

    #getUser(params) {
        let board_user = user;
        if (params.user) {
            board_user = params.user;
        }
        return {
            id: board_user.id,
            tgId: board_user.telegramid,
            first_name: board_user.first_name,
            last_name: board_user.last_name,
            username: board_user.username,
            language_code: board_user.language_code,
        }
    }

    // params:
    // {
    //    value - score value,
    //    boardName - default "default",
    //    maxCount - default 10
    //    fields - additional fields for user
    // }
    addScore(params) {
        if (!this.#checkAddScoreParams(params)) { return }

        const boardName = params.boardName || "default";
        let user_id = user.id;
        let telegramid = user.telegramid;

        if (params.user) {
            user_id = params.user.id;
            telegramid = params.user.telegramid;
        }

        // by default we add 1 score
        if (!params.value) { params.value = 1 }

        const curValue = this.#getIncreasedUserValue(boardName, user_id, params.value);

        let list = this.#getBoard(boardName);
        let leader = list.find(leader => leader.tgId === telegramid);

        if (leader) {
            leader.value = curValue;
        } else {
            let board_user = this.#getUser(params);
            board_user.value = curValue;

            // add additional fields
            board_user = { ...board_user, ...params.fields };
            list.push(board_user);
        }

        this.#saveSortedBoard(boardName, list, params.maxCount);
    }

    getBoardPropName(boardName) {
        return this.LIB_PREFIX + boardName;
    }

    getUserPropName(boardName) {
        return this.getBoardPropName(boardName) + "_v";
    }

    getBoard(boardName) {
        return this.#getBoard(boardName);
    }

    resetBoard(boardName) {
        boardName = boardName || "default";
        let propName = this.getBoardPropName(boardName);
        Bot.setProperty(propName, { list: [] }, "json");
    }

}