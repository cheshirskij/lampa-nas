(function () {
    'use strict';

    // 1. Локализация
    Lampa.Lang.add({
        my_nas_title: { ru: "Мой Jellyfin NAS", en: "My Jellyfin NAS" },
        nas_server_ip: { ru: 'IP сервера Jellyfin', en: 'Jellyfin Server IP' },
        nas_api_key: { ru: 'API Ключ', en: 'API Key' }
    });

    // 2. Создаем страницу настроек
    Lampa.Component.add('nas_settings_page', function (object) {
        var comp = new Lampa.InteractionMain(object);
        comp.create = function () {
            this.activity.loader(true);
            this.build([]);
        };
        comp.build = function () {
            var _this = this;
            this.activity.loader(false);
            
            var items = [
                { title: Lampa.Lang.translate('nas_server_ip'), name: 'nas_host', placeholder: 'http://192.168.1.100:8096' },
                { title: Lampa.Lang.translate('nas_api_key'), name: 'nas_key', placeholder: 'Твой API Ключ' }
            ];

            items.forEach(function (item) {
                var field = Lampa.Template.get('settings_field', { 
                    title: item.title, 
                    description: Lampa.Storage.get(item.name) || item.placeholder 
                });
                
                field.on('hover:enter', function () {
                    Lampa.Input.edit({ 
                        value: Lampa.Storage.get(item.name, ''), 
                        free: true 
                    }, function (new_value) {
                        if (new_value) {
                            Lampa.Storage.set(item.name, new_value);
                            Lampa.Noty.show('Сохранено: ' + new_value);
                            _this.activity.back(); // Возвращаемся после ввода
                        }
                    });
                });
                _this.append(field);
            });
        };
        return comp;
    });

    // 3. Главная функция запуска
    function StartPlugin() {
        // Добавляем пункт в настройки ОФИЦИАЛЬНЫМ способом, чтобы не было ошибки шаблона
        Lampa.Settings.add({
            title: Lampa.Lang.translate('my_nas_title'),
            type: 'open',
            name: 'my_nas_settings', // ID должен совпадать с именованием в системе
            icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 15V13H5V15H19ZM19 19V17H5V19H19ZM19 11V9H5V11H19ZM5 5V7H19V5H5Z" fill="white"/></svg>',
            component: 'nas_settings_page'
        });

        // Добавляем плитку в расширения
        Lampa.Plugins.add({
            name: 'Jellyfin NAS',
            description: 'Поиск фильмов на твоем Proxmox',
            auth: false,
            onLaunch: function () {
                var host = Lampa.Storage.get('nas_host');
                if (!host) {
                    Lampa.Noty.show('Настрой IP в настройках!');
                } else {
                    Lampa.Noty.show('Подключаюсь к ' + host);
                }
            }
        });
    }

    // Запуск
    if (window.appready) StartPlugin();
    else Lampa.Listener.follow('app', function (e) { 
        if (e.type == 'ready') StartPlugin(); 
    });
})();
