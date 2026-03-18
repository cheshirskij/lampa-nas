(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';
    
    // Иконка Jellyfin (SVG)
    var icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11.05 17.5L6.15 12.6L7.56 11.19L11.05 14.68L16.44 9.29L17.85 10.7L11.05 17.5Z" fill="#AA5CC3"/></svg>';

    // Функция проигрывания с сабами
    function playFile(item) {
        Lampa.Noty.show('Загрузка субтитров...');
        var network = new Lampa.Reguest();
        network.silent(nas_host + '/Items/' + item.Id + '/PlaybackInfo?api_key=' + nas_key, function(data) {
            var subs = [];
            if (data && data.MediaSources && data.MediaSources[0]) {
                data.MediaSources[0].MediaStreams.forEach(function (stream) {
                    if (stream.Type === 'Subtitle') {
                        subs.push({
                            label: stream.DisplayTitle || stream.Language || 'Субтитры',
                            url: nas_host + '/Videos/' + item.Id + '/' + data.MediaSources[0].Id + '/Subtitles/' + stream.Index + '/0/Stream.' + (stream.Codec || 'vtt') + '?api_key=' + nas_key
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

    // Меню выбора (Select)
    function openJellyMenu(query) {
        var network = new Lampa.Reguest();
        var url = nas_host + '/Items?api_key=' + nas_key + '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=80';
        if (query) url += '&searchTerm=' + encodeURIComponent(query.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, ''));
        else url += '&SortBy=DateCreated&SortOrder=Descending';

        network.silent(url, function (data) {
            if (data.Items && data.Items.length) {
                Lampa.Select.show({
                    title: query ? 'Поиск: ' + query : 'Jellyfin NAS',
                    items: data.Items.map(function(i){ return { title: i.Name, subtitle: i.ProductionYear || '', data: i } }),
                    onSelect: function (sel) { playFile(sel.data); },
                    onBack: function () { Lampa.Controller.toggle(query ? 'full_start' : 'settings'); }
                });
            } else {
                Lampa.Noty.show('Ничего не найдено');
            }
        });
    }

    // Внедрение кнопки в настройки (как в store.js)
    Lampa.Listener.follow('activity', function (e) {
        if (e.type == 'render' && e.component == 'settings') {
            var item = $('<div class="settings-folder selector" data-static="true">' +
                '<div class="settings-folder__icon">' + icon + '</div>' +
                '<div class="settings-folder__name">Jellyfin NAS</div>' +
                '<div class="settings-folder__descr">Ваша медиатека и субтитры</div>' +
            '</div>');

            item.on('hover:enter', function () {
                openJellyMenu(false);
            });

            // Вставляем в список настроек
            e.render.find('.settings-list').append(item);
        }
    });

    // Кнопка в карточке фильма
    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online jelly-nas-btn">' + icon + '<span>Jellyfin</span></div>');
                btn.on('hover:enter', function () {
                    openJellyMenu(e.data.movie.title || e.data.movie.name);
                });

                var container = e.object.activity.render().find('.view--torrent');
                if (container.length) container.after(btn);
                else e.object.activity.render().find('.full-start__buttons').append(btn);
                
                Lampa.Controller.enable('full_start');
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
