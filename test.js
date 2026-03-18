(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Официальная иконка Jellyfin
    var icon = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11.05 17.5L6.15 12.6L7.56 11.19L11.05 14.68L16.44 9.29L17.85 10.7L11.05 17.5Z" fill="#AA5CC3"/></svg>';

    function getSubtitles(itemId, callback) {
        var network = new Lampa.Reguest();
        // Запрашиваем информацию о воспроизведении, чтобы достать дорожки
        var url = nas_host + '/Items/' + itemId + '/PlaybackInfo?api_key=' + nas_key;

        network.silent(url, function (data) {
            var subs = [];
            if (data && data.MediaSources && data.MediaSources[0]) {
                data.MediaSources[0].MediaStreams.forEach(function (stream) {
                    if (stream.Type === 'Subtitle') {
                        // Формируем ссылку на дорожку субтитров
                        var subUrl = nas_host + '/Videos/' + itemId + '/' + data.MediaSources[0].Id + '/Subtitles/' + stream.Index + '/0/Stream.' + (stream.Codec || 'vtt') + '?api_key=' + nas_key;
                        subs.push({
                            label: stream.DisplayTitle || stream.Language || 'Субтитры',
                            url: subUrl,
                            language: stream.Language
                        });
                    }
                });
            }
            callback(subs);
        }, function () {
            callback([]);
        });
    }

    function playFile(item) {
        Lampa.Noty.show('Подготовка потока и субтитров...');
        getSubtitles(item.Id, function(subs) {
            var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
            
            var videoData = {
                url: vUrl,
                title: item.Name,
                subtitles: subs // Передаем найденные субтитры плееру
            };

            Lampa.Player.play(videoData);
            Lampa.Player.playlist([videoData]);
        });
    }

    function openJellyfinMenu() {
        var network = new Lampa.Reguest();
        var url = nas_host + '/Items?api_key=' + nas_key + '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=100&SortBy=DateCreated&SortOrder=Descending';

        network.silent(url, function (data) {
            var items = data.Items || [];
            if (items.length > 0) {
                Lampa.Select.show({
                    title: 'Jellyfin NAS',
                    items: items.map(function(i){
                        return { title: i.Name, subtitle: i.ProductionYear || '', data: i }
                    }),
                    onSelect: function (selected) {
                        playFile(selected.data);
                    },
                    onBack: function () { Lampa.Controller.toggle('settings_drawer'); }
                });
            } else {
                Lampa.Noty.show('Библиотека пуста');
            }
        });
    }

    function startPlugin() {
        // Добавление в настройки
        Lampa.Settings.add({
            title: 'Jellyfin NAS',
            type: 'button',
            icon: icon,
            section: 'main',
            description: 'Просмотр файлов с подгрузкой субтитров',
            onPress: function () { openJellyfinMenu(); }
        });

        // Кнопка в карточке фильма
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                if (e.object.activity.render().find('.jelly-nas-btn').length) return;
                var btn = $('<div class="full-start__button selector view--online jelly-nas-btn">' + icon + '<span>Jellyfin</span></div>');
                btn.on('hover:enter', function () { openJellyfinMenu(); });
                var container = e.object.activity.render().find('.view--torrent');
                if (container.length) container.after(btn);
                else e.object.activity.render().find('.full-start__buttons').append(btn);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
