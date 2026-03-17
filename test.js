(function () {
    'use strict';

    // 1. Добавляем название для кнопки
    Lampa.Lang.add({
        my_nas_title: { ru: "Настроить Jellyfin NAS", en: "Setup Jellyfin NAS" }
    });

    // 2. Функция вставки кнопки в настройки (твой рабочий метод)
    function addNasButton() {
        var menu = Lampa.Settings.main && Lampa.Settings.main().render();
        if (menu && !menu.find('[data-component="my_nas_settings"]').length) {
            var field = $('<div class="settings-folder selector" data-component="my_nas_settings">' +
                '<div class="settings-folder__icon">' +
                    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H5V11H19V13ZM19 17H4V15H19V17ZM19 21H5V19H19V21ZM5 5V7H19V5H5Z" fill="white"/></svg>' +
                '</div>' +
                '<div class="settings-folder__name">' + Lampa.Lang.translate('my_nas_title') + '</div>' +
            '</div>');

            // Вставляем после раздела "Остальное"
            menu.find('[data-component="more"]').after(field);
            
            // Вешаем действие ПРЯМО на эту кнопку
            field.on('hover:enter', function () {
                // Сначала спрашиваем IP
                Lampa.Input.edit({
                    value: Lampa.Storage.get('nas_host', ''),
                    title: 'Введите адрес Jellyfin',
                    placeholder: 'http://192.168.1.100:8096',
                    free: true
                }, function (new_host) {
                    if (new_host) {
                        Lampa.Storage.set('nas_host', new_host);
                        Lampa.Noty.show('IP сохранен');
                        
                        // Сразу после IP спрашиваем API Ключ
                        setTimeout(function(){
                            Lampa.Input.edit({
                                value: Lampa.Storage.get('nas_key', ''),
                                title: 'Введите API Ключ',
                                placeholder: 'Твой длинный ключ...',
                                free: true
                            }, function (new_key) {
                                if (new_key) {
                                    Lampa.Storage.set('nas_key', new_key);
                                    Lampa.Noty.show('Настройки применены!');
                                }
                            });
                        }, 200);
                    }
                });
            });

            Lampa.Settings.main().update();
        }
    }

    // 3. Следим за открытием меню настроек
    Lampa.Settings.listener.follow('open', function (e) {
        if (e.name == 'main') {
            addNasButton();
        }
    });

    // 4. Основной плагин (плитка в расширениях)
    function StartPlugin() {
        Lampa.Plugins.add({
            name: 'Jellyfin NAS',
            description: 'Поиск фильмов на твоем Proxmox',
            auth: false,
            onLaunch: function () {
                var host = Lampa.Storage.get('nas_host');
                var key = Lampa.Storage.get('nas_key');
                if (!host || !key) {
                    Lampa.Noty.show('Сначала нажми кнопку настройки в меню!');
                } else {
                    Lampa.Noty.show('Сервер: ' + host);
                }
            }
        });
        addNasButton();
    }

    if (window.appready) StartPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') StartPlugin(); });
})();
