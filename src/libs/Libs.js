class Libs {
    runLibs() {
        let lib_commands = [];
        function on(command, callback) {
            // для обработки сообщений прямо в библиотеке
            lib_commands.push({ command: command, callback: callback })
        }

        function publishLib(lib_name, object) {
            // публикация объектов библиотеки для внешнего использования
            // смотри js_content.rb также
            Libs[lib_name] = object;
        }

        // команда и параметры
        let cmd_text;
        if (message) {
            let arr = message.split(' ');
            cmd_text = arr[0];
            let prms = arr.slice(1, 999999999).join(' ');
            let blank_params = (!params || (params == ''));
            if (blank_params && (prms != '')) {
                params = prms;
            }
        }

        //!LIBS_CODE

        //!LIBS_END_CODE

        for (let index = 0; index < lib_commands.length; index++) {
            let it = lib_commands[index];
            if ((cmd_text == it.command) || (it.command == "*")) {
                it.callback();
                js_result.runned_by_lib = true;
                break; // только одно выполнение
            }
        }

        // core BJS lib now
        if (typeof (ResLib) != 'undefined') {
            Libs['ResourcesLib'] = ResLib;
        }

        if (typeof (RefLib) != 'undefined') {
            Libs['ReferralLib'] = RefLib;
            RefLib.init();
        }

        if (typeof (CommonLib) != 'undefined') {
            Libs['CommonLib'] = CommonLib;
            Libs['commonLib'] = CommonLib;
        }
    }
}