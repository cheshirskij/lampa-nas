(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';
    var icon = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11.05 17.5L6.15 12.6L7.56 11.19L11.05 14.68L16.44 9.29L17.85 10.7L11.05 17.5Z" fill="#AA5CC3"/></svg>';

    // Функция поиска/получения данных
    function getJellyData(query, callback) {
        var network = new Lampa.Reguest();
        var url = nas_host + '/Items?api_key=' + nas_key + '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=50';
        
        if(query) {
            var cleanTitle = query.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '');
            url += '&searchTerm=' + encodeURIComponent(cleanTitle);
        } else {
            url += '&SortBy=DateCreated&SortOrder=Descending';
        }

        network.silent(url, callback, function () {
            Lampa.Noty.show('Jellyfin: Ошибка связи');
            callback({Items: []});
        });
    }

    // Логика запуска видео с субтитрами
    function playWithSubs(item) {
        var network = new Lampa.Reguest();
        network.silent(nas_host + '/Items/' + item.Id + '/PlaybackInfo?api_key=' + nas_key, function(data) {
            var subs = [];
            if (data && data.MediaSources && data.MediaSources[0]) {
                data.MediaSources[0].MediaStreams.forEach(function (stream) {
                    if (stream.Type === 'Subtitle') {
                        subs.push({
                            label: stream.DisplayTitle || stream.Language || 'Субтитры',
                            url: nas_host + '/Videos/' + item.Id + '/' + data.MediaSources[0].Id + '/Subtitles/' + stream.Index + '/0/Stream.' + (stream.Codec || 'vtt') + '?api_key=' + nas_key,
                        });
                    }
                });
            }
            var video = {
                url: nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true',
                title: item.Name,
                subtitles: subs
            };
            Lampa.Player.play(video);
            Lampa.Player.playlist([video]);
        });
    }

    // Вызов меню выбора
    function showJellyMenu(query) {
        getJellyData(query, function(data) {
            if (data.Items && data.Items.length) {
                Lampa.Select.show({
                    title: query ? 'Найдено на NAS' : 'Jellyfin: Последние',
                    items: data.Items.map(function(i){ return {title: i.Name, subtitle: i.ProductionYear || '', data: i} }),
                    onSelect: function (sel) { playWithSubs(sel.data); },
                    onBack: function () { Lampa.Controller.toggle(query ? 'full_start' : 'settings_drawer'); }
                });
            } else {
                Lampa.Noty.show('На Jellyfin ничего не найдено');
            }
        });
    }

    function startPlugin() {
        // 1. РЕГИСТРАЦИЯ В НАСТРОЙКАХ (Жесткая)
        Lampa.Settings.register({
            name: 'jellyfin_nas',
            type: 'button',
            icon: icon,
            title: 'Jellyfin NAS',
            description: 'Просмотр всей медиатеки с субтитрами',
            section: 'main',
            onPress: function () { showJellyMenu(false); }
        });

        // 2. ДОБАВЛЕНИЕ КНОПКИ В КАРТОЧКУ
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var container = e.object.activity.render().find('.view--torrent');
                if (!container.length) container = e.object.activity.render().find('.full-start__buttons');

                if (container.length && !e.object.activity.render().find('.jelly-nas-btn').length) {
                    var btn = $('<div class="full-start__button selector view--online jelly-nas-btn">' + icon + '<span>Jellyfin</span></div>');
                    btn.on('hover:enter', function () { 
                        showJellyMenu(e.data.movie.title || e.data.movie.name); 
                    });
                    container.after(btn);
                    // Переинициализация фокуса для пульта
                    Lampa.Controller.enable('full_start');
                }
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
