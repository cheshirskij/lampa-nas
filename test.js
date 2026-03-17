(function () {
    'use strict';

    // 1. Добавляем настройки для ввода IP и API Ключа
    Lampa.Lang.add({
        nas_server_ip: { ru: 'IP сервера Jellyfin', en: 'Jellyfin Server IP' },
        nas_api_key: { ru: 'API Ключ', en: 'API Key' },
        nas_title: { ru: 'Мой Jellyfin', en: 'My Jellyfin' }
    });

    Lampa.Settings.add({
        title: 'Мой NAS',
        type: 'open',
        name: 'nas_settings',
        icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 15V13H5V15H19ZM19 19V17H5V19H19ZM19 11V9H5V11H19ZM5 5V7H19V5H5Z" fill="white"/></svg>',
        onRender: function (body) {
            var items = [
                {
                    title: Lampa.Lang.translate('nas_server_ip'),
                    description: 'Например: http://192.168.1.100:8096',
                    type: 'input',
                    name: 'nas_host',
                    placeholder: 'http://192.168.1.100:8096'
                },
                {
                    title: Lampa.Lang.translate('nas_api_key'),
                    description: 'Вставь ключ из Jellyfin',
                    type: 'input',
                    name: 'nas_key',
                    placeholder: 'Твой API Ключ'
                }
            ];

            items.forEach(function (item) {
                var field = Lampa.Template.get('settings_field', item);
                field.find('.settings-field__value').text(Lampa.Storage.get(item.name, ''));
                
                field.on('hover:enter', function () {
                    Lampa.Input.edit({
                        value: Lampa.Storage.get(item.name, ''),
                        free: true
                    }, function (new_value) {
                        if (new_value) {
                            Lampa.Storage.set(item.name, new_value);
                            field.find('.settings-field__value').text(new_value);
                        }
                    });
                });
                body.append(field);
            });
        }
    });

    // 2. Функция для получения списка фильмов
    function loadMovies() {
        var host = Lampa.Storage.get('nas_host');
        var key = Lampa.Storage.get('nas_key');

        if (!host || !key) {
            Lampa.Noty.show('Настрой IP и API ключ в настройках!');
            return;
        }

        // Запрос к Jellyfin на получение последних добавленных фильмов
        var url = host + '/Items?api_key=' + key + '&IncludeItemTypes=Movie&Limit=20&Recursive=true&SortBy=DateCreated&SortOrder=Descending';

        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                if (data && data.Items) {
                    Lampa.Noty.show('Найдено фильмов: ' + data.Items.length);
                    console.log('Jellyfin Data:', data.Items);
                    // Здесь в следующем шаге мы отрисуем обложки
                }
            },
            error: function () {
                Lampa.Noty.show('Ошибка подключения к Jellyfin!');
            }
        });
    }

    // 3. Регистрация плагина
    Lampa.Plugins.add({
        name: 'Jellyfin NAS',
        description: 'Твой сервер в Proxmox',
        auth: false,
        onLaunch: function () {
            loadMovies();
        }
    });
})();
