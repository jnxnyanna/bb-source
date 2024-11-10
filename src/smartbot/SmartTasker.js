class SmartTasker {
    lib_prefix = "SmartTasker.";
    tasks = []
    completedTasks = null;
    balance = 0;
    smartBot = null;

    curTask = null; // current task definition
    curExecution = null; // current user's execution of task (curTask)

    constructor(options) {
        if (!user) { return }  // only for users

        if (!options) { options = {} }

        this.name = options.name || "default";

        this.smartError = new SmartError({
            prefix: `SmartTasker/"${this.name}"`,
            endPrefixPart: " func > "
        });

        this._checkInitOptions(options);

        this.tasks = options.tasks;
        this.balance = options.balance || 0;
        this.smartBot = options.smartBot;

        this._checkSmartBot("constructor");

        this._checkTasks(options);
    }

    _checkInitOptions(options) {
        this.smartError.setMethod("constructor");

        if (!options) {
            this.smartError.throw("options is empty! Need to pass options");
        }

        if (!options.tasks) {
            this.smartError.throw(" tasks is empty! Passed options: " + JSON.stringify(options));
        }

        // task must be object
        // task must be array
        if (!Array.isArray(options.tasks)) {
            this.smartError.throw("tasks must be array! It is not Array: " + JSON.stringify(options.tasks));
        }
    }

    // get tasks for work
    // return array of tasks for work wich is not completed
    getTasksForWork() {
        this.loadUserTasks();

        return this.tasks
            // skip tasks which are already completed (in completedTasks)
            .filter(task => !this.completedTasks.items.find(item => item.id === task.id));
    }

    loadUserTasks() {
        if (this.completedTasks) { return this.completedTasks }

        let blankTasks = {
            completedCount: 0,
            skippedCount: 0,
            totalReward: 0,
            lastRewardAt: null,
            items: []
        };

        this.completedTasks = User.getProperty(this._getPropName());

        if (!this.completedTasks) {
            this.completedTasks = blankTasks;
            return this.completedTasks;
        }

        this._clearOldTasks();
        return this.completedTasks;
    }

    // skip the first Tasks
    // return true if task skipped and we have next task
    skipTask() {
        const tasks = this.getTasksForWork();
        const taskDef = tasks[0]
        if (!taskDef) { return }

        this.defineWork(taskDef.id);

        this.curExecution.skippedAt = new Date().getTime();
        this.completedTasks.skippedCount += 1;

        this._setCompletedTask();
        return (tasks.length > 1)
    }

    getTaskDefById(taskID) {
        this.smartError.checkType({ value: taskID, name: "taskID", needType: "string" });

        return this.tasks.filter(taskDef => taskDef.id == taskID)[0];
    }

    // set curTask Def by taskID or TaskDef
    // add taskDef to smartbot params
    defineTask(taskDefOrTaskID, _throwError = true) {
        let taskDef;
        if (typeof taskDefOrTaskID == "string") {
            taskDef = this.getTaskDefById(taskDefOrTaskID);
        }

        if (typeof taskDefOrTaskID == "object") {
            taskDef = taskDefOrTaskID;
        }

        // task can be removed from tasks
        // we return if error is not needed
        if (!taskDef && !_throwError) { return }

        this._checkTask(taskDef, "defineTask")

        this.curTask = taskDef;
        this.smartBot.add(this.curTask);
        return true;
    }

    // set user Cur Task Execution
    defineCurExecution() {
        this.loadUserTasks();

        const existUserTaskExecution = this.completedTasks.items.filter(
            item => item.id == this.curTask.id
        )[0];

        this.curExecution = existUserTaskExecution || { id: this.curTask.id };
        this.smartBot.add(this.curExecution);
    }

    // set curTask and curExecution
    defineWork(taskID) {
        this.defineTask(taskID);
        this.defineCurExecution();
    }

    completeExecution(taskID) {
        if (!taskID) {
            taskID = this.curTask.id;
        }

        this.defineWork(taskID);

        // it can be already rewarded
        const rewardNotPossible = this.curExecution.count && !this.curTask.manyTimes;
        if (rewardNotPossible) { return }

        return this._doCompleteExecution();
    }

    // General functions
    addBalance(amount) {
        const errPrefix = this._getErrPrefix("addBalance");

        this.smartError.checkType({ value: amount, name: "amount", needType: "number" });

        // add amount to balance
        let newBalance = this.balance + amount;

        // amount can be negative but balance can't be negative
        if (newBalance < 0) {
            this.smartError.throw(
                "balance can't be negative! Balance: " + this.balance + ", amount: " + amount
            );
        }

        this.balance = newBalance;
    }

    // prepare Task Question with answers
    // will be add question and answers to smartBot params
    // Can be used in Scheme like:
    // text: "Please answer the question for reward:\n\n❓ *{question}*",
    //     inline_buttons: [
    //       // show answers buttons for answers with texts only
    //       [ { text: "{answer1}", command: "sendAnswer {isValidAnswer1}" } ],
    //       ...
    //       [ { text: "{answer6}", command: "sendAnswer {isValidAnswer6}" } ],
    //     ]
    //   },
    prepareTaskQuestion(prms) {
        const task = this.getTaskDefById(prms.taskID);

        this._checkParamsOnQuestionPreparing(task);

        // add question
        this.smartBot.add({
            question: task.question
        })

        this._prepareAnswers(task, prms);
    }

    // clear user progress
    // user can start from beginning again
    // it is for debug
    clearUserProgress() {
        this.completedTasks = null;
        this._saveCompletedTasks();
    }

    add(params) {
        this.smartBot.add(params);
    }

    _getErrPrefix(method) {
        return `SmartTasker "${this.name}" - method "${method}" on message "${message}":`;
    }

    _checkTasks() {
        // check that we have correctAnswer if answers passed
        for (let taskID in this.tasks) {
            const taskDef = this.tasks[taskID];

            this._checkTask(taskDef, "creation");

            if (!taskDef.question) { continue }

            this._checkQuestionTypes(taskDef);

            // we have correctAnswer in answers array
            if (taskDef.answers.includes(taskDef.correctAnswer)) { continue }
            // else throw error:
            this.smartError.throw(
                "Task " + taskID + " must have correctAnswer in answers array!"
            );
        }
    }

    _checkQuestionTypes(taskDef) {
        // question must be string only
        this.smartError.checkType({
            value: taskDef.question,
            name: "question",
            needType: "string"
        });

        // answers must be array
        this.smartError.checkType({
            value: taskDef.answers,
            name: "answers",
            needType: "array"
        });

        // need to to have 1 ore more answers
        if (taskDef.answers.length == 0) {
            this.smartError.throw(
                "Task " + taskDef.id + " must have 1 or more answers! It is empty array"
            );
        }
    }

    _getPropName() {
        return this.lib_prefix + this.name + ":completedTasks";
    }

    _clearOldTasks() {
        // remove not already exist tasks.
        // All user's tasks must be actual (must be in this.tasks)
        let items = this.completedTasks.items;

        for (let taskID in items) {
            if (!this.tasks[taskID]) {
                delete items[taskID];
            }
        }
        this.completedTasks.items = items;
    }

    _saveCompletedTasks() {
        User.setProperty(this._getPropName(), this.completedTasks, "json");
    }

    _checkTaskIdName(taskID) {
        this.smartError.checkType({ value: taskID, name: "taskID", needType: "string" });

        // taskID can not have ":" or " " symbols
        if (taskID.includes(":") || taskID.includes(" ")) {
            this.smartError.throw(
                "Task " + taskID + " must not have ':' or ' ' symbols! It is reserved symbols."
            );
        }
    }

    _checkTask(taskDef, methodName) {
        // task must be object
        this.smartError.checkType({ value: taskDef, name: "task", needType: "object" });

        this._checkTaskIdName(taskDef.id);

        // amount must be number
        this.smartError.checkType({ value: taskDef.amount, name: "amount", needType: "number" });
    }

    _setCompletedTask() {
        this.completedTasks.items.push(this.curExecution);
        this._saveCompletedTasks();
        return this.curExecution;
    }

    _doCompleteExecution() {
        this.addBalance(this.curTask.amount);

        // update balance for smart bot
        this.smartBot.params.balance = this.balance;

        this.curExecution.count = this.curExecution.count || 0;
        this.curExecution.count += 1;
        this.curExecution.lastRewardAt = new Date().getTime();

        this.completedTasks.completedCount += 1;
        this.completedTasks.totalReward += this.curTask.amount;
        this.completedTasks.lastRewardAt = this.curExecution.lastRewardAt;

        return this._setCompletedTask();
    }

    _checkSmartBot(onMethodName) {
        if (this.smartBot) { return }

        this.smartError.throw(
            "smartBot is not defined! Please pass smartBot to SmartTasker constructor",
        )
    }

    _checkParamsOnQuestionPreparing(task) {
        if (task) { return }

        this.smartError.throw(
            "Task not found! TaskID: \"" + taskID +
            "\". All tasks: " + JSON.stringify(this.tasks)
        );
    }

    _prepareAnswers(taskDef, prms) {
        // mix answers array
        let answers = taskDef.answers;
        answers.sort(() => Math.random() - 0.5);

        for (let ind = 0; ind < answers.length; ind++) {
            let answerKey = `answer${ind + 1}`;
            let isValidAnswerKey = `isValidAnswer${ind + 1}`;
            let onAnswerKey = `onAnswer${ind + 1}`;

            let answerText = answers[ind];
            if (!answerText) { continue }

            let isValidAnswer = (taskDef.correctAnswer === answerText);

            // on Answer Cmd. We need ind - for keep true answer as hidden
            let onAnswerCmd = `${prms.onAnswer} ${taskDef.id}:${isValidAnswer}:${ind}`;

            let answer = {
                [answerKey]: answerText,
                [isValidAnswerKey]: isValidAnswer,
                [onAnswerKey]: onAnswerCmd
            };

            this.smartBot.add(answer)
        }
    }

    // accept answer from user
    // we have answer in params like:
    //  taskID:isCorrectAnswer:tag  (tag used for hidden true answer only)
    acceptAnswer(_prms) {
        _prms = _prms || params;  // params is global variable
        const arr = _prms.split(":");
        if (arr.length != 3) {
            // invalid params - seems command callback is not ok
            this.smartError.throw(
                "acceptAnswer params is invalid: not looked like answer callback! Params: " + _prms
            )
        }

        const taskID = _prms.split(":")[0];
        const isCorrect = (_prms.split(":")[1] == "true" ? true : false);

        // task not found
        // task can be removed
        if (!this.defineTask(taskID, false)) { return }

        return {
            taskID: taskID,
            isCorrect: isCorrect
        }
    }

}