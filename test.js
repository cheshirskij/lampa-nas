(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function searchInJellyfin(movie, callback) {
        var title = movie.title || movie.name;
        // Пробуем найти по ID, если их нет - по названию
        var extId = movie.imdb_id || movie.tmdb_id || "";
        var url = nas_host + '/Items?api_key=' + nas_key + '&Recursive=true&Fields=PrimaryImageAspectRatio&AnyId=' + extId;

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 5000,
            success: function (data) {
                if (data && data.Items && data.Items.length > 0) {
                    callback(data.Items);
                } else {
                    // Запасной поиск по названию
                    var sUrl = nas_host + '/Items?api_key=' + nas_key + '&searchTerm=' + encodeURIComponent(title) + '&IncludeItemTypes=Movie&Recursive=true';
                    $.ajax({
                        url: sUrl,
                        method: 'GET',
                        success: function (res) { callback(res.Items || []); },
                        error: function () { callback([]); }
                    });
                }
            },
            error: function () {
                Lampa.Noty.show('Ошибка связи с Jellyfin');
                callback([]);
            }
        });
    }

    function showItems(items) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer({title: 'Результаты из Jellyfin'});
        
        items.forEach(function (item) {
            var card = Lampa.Template.get('button', {
                title: item.Name,
                description: item.ProductionYear || 'Jellyfin'
            });

            card.on('hover:enter', function () {
                var videoUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                Lampa.Player.play({ url: videoUrl, title: item.Name });
                Lampa.Player.playlist([{ url: videoUrl, title: item.Name }]);
            });

            scroll.append(card);
        });

        files.appendFiles(scroll.render());
        Lampa.Activity.push({
            url: '',
            title: 'Jellyfin NAS',
            component: 'jelly_search',
            render: function () { return files.render(); }
        });
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin NAS</span></div>');
                
                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Ищу на сервере...');
                    searchInJellyfin(e.data.movie, function(foundItems) {
                        if (foundItems.length > 0) showItems(foundItems);
                        else Lampa.Noty.show('На сервере ничего не найдено');
                    });
                });

                var container = e.object.activity.render().find('.view--torrent');
                if (container.length) container.after(btn);
                else e.object.activity.render().find('.full-start__buttons').append(btn);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
