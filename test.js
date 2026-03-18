(function () {
    'use strict';

    // === НАСТРОЙКИ ===
    var nas_host = 'http://192.168.1.95:8096';
    var nas_key  = 'B4659bb0cc0c476bb7bf3113fef553f9';

    function searchInJellyfin(movie, callback) {
        var title = movie.title || movie.name;
        // Берем ID (IMDb или TMDB)
        var queryId = movie.imdb_id || movie.tmdb_id || "";
        
        // Сначала пробуем точный поиск по ID
        var url = nas_host + '/Items?api_key=' + nas_key + '&Recursive=true&AnyId=' + queryId;

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 5000,
            success: function (data) {
                if (data && data.Items && data.Items.length > 0) {
                    callback(data.Items);
                } else {
                    // Если по ID пусто, ищем просто по названию
                    var searchUrl = nas_host + '/Items?api_key=' + nas_key + 
                                    '&searchTerm=' + encodeURIComponent(title) + 
                                    '&IncludeItemTypes=Movie,Episode&Recursive=true';
                    $.ajax({
                        url: searchUrl,
                        method: 'GET',
                        success: function (res) { 
                            callback(res.Items || []); 
                        },
                        error: function () { callback([]); }
                    });
                }
            },
            error: function () {
                Lampa.Noty.show('Jellyfin недоступен');
                callback([]);
            }
        });
    }

    function showItems(items, movie) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer({title: 'Jellyfin: ' + (movie.title || movie.name)});
        
        items.forEach(function (item) {
            var card = Lampa.Template.get('button', {
                title: item.Name,
                description: item.ProductionYear || 'Jellyfin'
            });

            card.on('hover:enter', function () {
                // Ссылка на поток
                var videoUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                
                Lampa.Player.play({
                    url: videoUrl,
                    title: item.Name
                });
                Lampa.Player.playlist([{
                    url: videoUrl,
                    title: item.Name
                }]);
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
                        if (foundItems.length > 0) {
                            showItems(foundItems, e.data.movie);
                        } else {
                            Lampa.Noty.show('На сервере ничего не найдено');
                        }
                    });
                });

                // Добавляем кнопку в блок кнопок фильма
                var container = e.object.activity.render().find('.full-start__buttons');
                if (container.length) container.append(btn);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });

})();
