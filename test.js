(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Иконка Jellyfin в формате SVG
    var icon = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 3C9.71573 3 3 9.71573 3 18C3 26.2843 9.71573 33 18 33C26.2843 33 33 26.2843 33 18C33 9.71573 26.2843 3 18 3ZM15.4286 24L10 18.5714L11.7143 16.8571L15.4286 20.5714L24.2857 11.7143L26 13.4286L15.4286 24Z" fill="white"/></svg>';

    function getAllContent(callback) {
        var network = new Lampa.Reguest();
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=100&SortBy=DateCreated&SortOrder=Descending';

        network.silent(url, function (data) {
            callback(data.Items || []);
        }, function () {
            Lampa.Noty.show('Jellyfin: Ошибка связи');
            callback([]);
        });
    }

    function openJellyfinMenu() {
        Lampa.Noty.show('Загрузка вашей медиатеки...');
        getAllContent(function (items) {
            if (items.length > 0) {
                Lampa.Select.show({
                    title: 'Jellyfin NAS',
                    items: items.map(function(i){
                        return {
                            title: i.Name,
                            subtitle: (i.ProductionYear || '') + (i.Type === 'Episode' ? ' • Серия' : ''),
                            data: i
                        }
                    }),
                    onSelect: function (selected) {
                        var vUrl = nas_host + '/Videos/' + selected.data.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                        Lampa.Player.play({
                            url: vUrl,
                            title: selected.data.Name
                        });
                        Lampa.Player.playlist([{
                            title: selected.data.Name,
                            url: vUrl
                        }]);
                    },
                    onBack: function () {
                        Lampa.Controller.toggle('settings_drawer'); // Возврат в настройки
                    }
                });
            } else {
                Lampa.Noty.show('Библиотека пуста');
            }
        });
    }

    function startPlugin() {
        // Добавляем пункт в настройки
        Lampa.Settings.add({
            title: 'Jellyfin NAS',
            type: 'button',
            icon: icon,
            section: 'main', // Появится в главном списке настроек
            description: 'Просмотр всех файлов на вашем сервере',
            onPress: function () {
                openJellyfinMenu();
            }
        });

        // Оставляем кнопку в карточке фильма для быстрого поиска (по желанию)
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                if (e.object.activity.render().find('.jelly-nas-btn').length) return;
                var btn = $('<div class="full-start__button selector view--online jelly-nas-btn">' + icon + '<span>Jellyfin</span></div>');
                btn.on('hover:enter', function () {
                    openJellyfinMenu();
                });
                var container = e.object.activity.render().find('.view--torrent');
                if (container.length) container.after(btn);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
