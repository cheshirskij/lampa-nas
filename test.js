(function () {
    'use strict';

    // Твои жестко прописанные данные
    var nas_host = 'http://192.168.1.95:8096';
    var nas_key  = 'B4659bb0cc0c476bb7bf3113fef553f9';

    function StartPlugin() {
        Lampa.Plugins.add({
            name: 'Jellyfin NAS',
            description: 'Твой сервер в Proxmox',
            auth: false,
            // Иконка сервера
            icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 13H4V11H20V13ZM20 17H4V15H20V17ZM20 21H4V19H20V21ZM10 3L12 5L14 3H20C21.1 3 22 3.9 22 5V21C22 22.1 21.1 23 20 23H4C2.9 23 2 22.1 2 21V5C2 3.9 2.9 3 4 3H10Z" fill="white"/></svg>',
            onLaunch: function () {
                Lampa.Noty.show('Стучусь на ' + nas_host);
                
                // Параметры запроса: берем только фильмы, сортируем по дате добавления
                var url = nas_host + '/Items?api_key=' + nas_key + '&IncludeItemTypes=Movie&Limit=50&Recursive=true&Fields=PrimaryImageAspectRatio,CanDelete&SortBy=DateCreated&SortOrder=Descending';

                $.ajax({
                    url: url,
                    method: 'GET',
                    timeout: 5000,
                    success: function (data) {
                        if (data && data.Items && data.Items.length > 0) {
                            Lampa.Noty.show('Нашел фильмов: ' + data.Items.length);
                            console.log('Jellyfin Data:', data.Items);
                            
                            // Мы получили данные! Теперь мы готовы выводить их на экран Лампы.
                        } else {
                            Lampa.Noty.show('Связь есть, но в библиотеках Jellyfin пусто.');
                        }
                    },
                    error: function (jqXHR, textStatus) {
                        Lampa.Noty.show('Не удалось достучаться до 192.168.1.95. Проверь сеть!');
                    }
                });
            }
        });
    }

    // Безопасный запуск плагина
    if (window.appready) StartPlugin();
    else Lampa.Listener.follow('app', function (e)
