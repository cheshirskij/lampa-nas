(function () {
    'use strict';

    // ОБНОВЛЕННЫЕ ДАННЫЕ
    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function searchInJellyfin(movie, callback) {
        var title = movie.title || movie.name;
        var extId = movie.imdb_id || movie.tmdb_id || "";
        
        // 1. Пробуем найти по жесткому ID
        var url = nas_host + '/Items?api_key=' + nas_key + '&Recursive=true&Fields=PrimaryImageAspectRatio&AnyId=' + extId;

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 8000, // Увеличил таймаут для внешнего IP
            success: function (data) {
                if (data && data.Items && data.Items.length > 0) {
                    callback(data.Items);
                } else {
                    // 2. Если не нашли - ищем по названию
                    var sUrl = nas_host + '/Items?api_key=' + nas_key + '&searchTerm=' + encodeURIComponent(title) + '&IncludeItemTypes=Movie,Episode&Recursive=true&Limit=10';
                    $.ajax({
                        url: sUrl,
                        method: 'GET',
                        success: function (res) { callback(res.Items || []); },
                        error: function () { callback([]); }
                    });
                }
            },
            error: function (xhr) {
                if(xhr.status === 401) Lampa.Noty.show('Jellyfin: Ошибка авторизации (401)');
                else Lampa.Noty.show('Jellyfin: Сервер недоступен по внешнему IP');
                callback([]);
            }
        });
    }

    function showItems(items) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer({title: 'Jellyfin NAS'});
        
        items.forEach(function (item) {
            // Ручная отрисовка строки (чтобы не было ошибки Template not found)
            var card = $('<div class="explorer-file selector"><div class="explorer-file__name">' + item.Name + '</div><div class="explorer-file__info">' + (item.ProductionYear || 'Jellyfin') + '</div></div>');

            card.on('hover:enter', function () {
                var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                Lampa.Player.play({ url: vUrl, title: item.Name });
                Lampa.Player.playlist([{ url: vUrl, title: item.Name }]);
            });
            scroll.append(card);
        });

        files.appendFiles(scroll.render());
        Lampa.Activity.push({
            url: '', title: 'Jellyfin NAS', component: 'jelly_search',
            render: function () { return files.render(); }
        });
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector"><span>Jellyfin NAS</span></div>');
                
                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Связь с сервером...');
                    searchInJellyfin(e.data.movie, function(found) {
                        if (found.length > 0) showItems(found);
                        else Lampa.Noty.show('На NAS ничего не найдено');
                    });
                });

                var container = e.object.activity.render().find('.full-start__buttons');
                if (container.length) container.append(btn);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
