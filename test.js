(function () {
    'use strict';

    // 1. Добавляем локализацию
    Lampa.Lang.add({
        my_nas_title: { ru: "Мой Jellyfin NAS", en: "My Jellyfin NAS" },
        nas_server_ip: { ru: 'IP сервера Jellyfin', en: 'Jellyfin Server IP' },
        nas_api_key: { ru: 'API Ключ', en: 'API Key' }
    });

    // 2. Функция для вставки кнопки в главное меню настроек (твой рабочий метод)
    function addNasSettingsButton() {
        if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="my_nas_settings"]').length) {
            var field = $('<div class="settings-folder selector" data-component="my_nas_settings">' +
                '<div class="settings-folder__icon">' +
                    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H5V11H19V13ZM19 17H4V15H19V17ZM19 21H5V19H19V21ZM5 5V7H19V5H5Z" fill="white"/></svg>' +
                '</div>' +
                '<div class="settings-folder__name">' + Lampa.Lang.translate('my_nas_title') + '</div>' +
            '</div>');

            Lampa.Settings.main().render().find('[data-component="more"]').after(field);
            Lampa.Settings.main().update();
        }
    }

    // 3. Создаем страницу самих настроек (где вводить IP и Ключ)
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
                var field = Lampa.Template.get('settings_field', { title: item.title, description: item.placeholder });
                field.find('.settings-field__value').text(Lampa.Storage.get(item.name, ''));
                field.on('hover:enter', function () {
                    Lampa.Input.edit({ value: Lampa.Storage.get(item.name, ''), free: true }, function (new_value) {
                        if (new_value) {
                            Lampa.Storage.set(item.name, new_value);
                            field.find('.settings-field__value').text(new_value);
                            Lampa.Noty.show('Сохранено');
                        }
                    });
                });
                _this.append(field);
            });
        };
        return comp;
    });

    // 4. Слушатель нажатия на кнопку в настройках
    Lampa.Settings.listener.follow('open', function (e) {
        if (e.name == 'main') {
            addNasSettingsButton(); // На всякий случай проверяем наличие кнопки при открытии
            e.body.find('[data-component="my_nas_settings"]').on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'Настройки Jellyfin',
                    component: 'nas_settings_page',
                    page: 1
                });
            });
        }
    });

    // 5. Плитка в основном меню расширений для запуска поиска
    function StartPlugin() {
        Lampa.Plugins.add({
            name: 'Jellyfin NAS',
            description: 'Поиск фильмов на сервере',
            auth: false,
            icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" fill="#3498db"/></svg>',
            onLaunch: function () {
                var host = Lampa.Storage.get('nas_host');
                var key = Lampa.Storage.get('nas_key');
                if (!host || !key) {
                    Lampa.Noty.show('Сначала введи IP и Ключ в настройках!');
                } else {
                    Lampa.Noty.show('Подключаюсь к ' + host);
                    // Тут будет магия запроса списка
                }
            }
        });
        addNasSettingsButton();
    }

    if (window.appready) StartPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') StartPlugin(); });
})();
