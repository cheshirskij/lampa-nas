(function () {
    'use strict';

    // 1. Локализация
    Lampa.Lang.add({
        my_nas_title: { ru: "Настройка Jellyfin NAS", en: "Jellyfin NAS Setup" }
    });

    // 2. Функция вставки кнопки (твой проверенный способ)
    function addNasButton() {
        if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="my_nas_settings"]').length) {
            var field = $('<div class="settings-folder selector" data-component="my_nas_settings">' +
                '<div class="settings-folder__icon">' +
                    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H5V11H19V13ZM19 17H4V15H19V17ZM19 21H5V19H19V21ZM5 5V7H19V5H5Z" fill="white"/></svg>' +
                '</div>' +
                '<div class="settings-folder__name">' + Lampa.Lang.translate('my_nas_title') + '</div>' +
            '</div>');

            // Вставляем после раздела "Остальное"
            Lampa.Settings.main().render().find('[data-component="more"]').after(field);
            
            // Вешаем событие клика СРАЗУ на эту кнопку
            field.on('hover:enter', function () {
                // Вместо открытия новой страницы (которая давала ошибку), просто вызываем ввод IP
                Lampa.Input.edit({
                    value: Lampa.Storage.get('nas_host', ''),
                    title: 'Введите IP вашего Jellyfin',
                    placeholder: 'http://192.168.1.100:8096',
                    free: true
                }, function (new_value) {
                    if (new_value) {
                        Lampa.Storage.set('nas_host', new_value);
                        Lampa.Noty.show('IP сохранен: ' + new_value);
                        
                        // После IP сразу спросим API ключ для удобства
                        setTimeout(function(){
                            Lampa.Input.edit({
                                value: Lampa.Storage.get('nas_key', ''),
                                title: 'Введите API Ключ',
                                placeholder: 'B4659bb...',
                                free: true
                            }, function (key_value) {
                                if (key_value) {
                                    Lampa.Storage.set('nas_key', key_value);
                                    Lampa.Noty.show('Ключ сохранен!');
                                }
                            });
                        }, 500);
                    }
                });
            });

            Lampa.Settings.main().update();
        }
    }

    // 3. Следим за открытием настроек
    Lampa.Settings.listener.follow('open', function (e) {
        if (e.name == 'main') {
            addNasButton();
        }
    });

    // 4. Плитка в расширениях для запуска
    function StartPlugin() {
        Lampa.Plugins.add({
            name: 'Jellyfin NAS',
            description: 'Запуск поиска фильмов',
            auth: false,
            onLaunch: function () {
                var host = Lampa.Storage.get('nas_host');
                var key = Lampa.Storage.get('nas_key');
                if (!host || !key) {
                    Lampa.Noty.show('Сначала нажми кнопку настройки ниже!');
                } else {
                    Lampa.Noty.show('Подключаюсь к: ' + host);
                }
            }
        });
        addNasButton();
    }

    if (window.appready) StartPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') StartPlugin(); });
})();
