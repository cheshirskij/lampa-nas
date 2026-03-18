(function () {
    'use strict';

    // ТВОИ НАСТРОЙКИ
    var nas_host = 'http://192.168.1.95:8096';
    var nas_key  = 'B4659bb0cc0c476bb7bf3113fef553f9';

    // Умная функция поиска
    function searchInJellyfin(movie, callback) {
        // Пробуем получить все возможные ID
        var ids = [];
        if (movie.imdb_id) ids.push(movie.imdb_id);
        if (movie.tmdb_id) ids.push(movie.tmdb_id);
        // Кинопоиск ID Jellyfin обычно не понимает напрямую через AnyId, 
        // поэтому его используем только если других нет
        if (!ids.length && movie.kp_id) ids.push(movie.kp_id);

        var title = movie.title || movie.name;
        var cleanTitle = title.replace(/[:]/g, ''); // Убираем двоеточия, Jellyfin их не любит

        // 1. Пытаемся найти по внешним ID (самый точный путь)
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&Recursive=true&Fields=PrimaryImageAspectRatio&AnyId=' + ids.join(',');

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 5000,
            success: function (data) {
                if (data && data.Items && data.Items.length > 0) {
                    callback(data.Items);
                } else {
                    // 2. Если по ID пусто, ищем по названию
                    var searchUrl = nas_host + '/Items?api_key=' + nas_key + 
                                    '&searchTerm=' + encodeURIComponent(cleanTitle) + 
                                    '&IncludeItemTypes=Movie,Episode&Recursive=true&Limit=20';
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
            error: function () { callback([]); }
        });
    }

    function playFile(item) {
        var videoUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
        Lampa.Player.play({
            url: videoUrl,
            title: item.Name
        });
        Lampa.Player.playlist([{
            url: videoUrl,
            title: item.Name
        }]);
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Добавляем кнопку в список кнопок фильма
                var container = e.object.activity.render().find('.full-start__buttons');
                
                if (container.length && !container.find('.jelly_btn').length) {
                    var btn = $('<div class="full-start__button selector view--online jelly_btn"><span>Jellyfin NAS</span></div>');
                    
                    btn.on('hover:enter', function () {
                        Lampa.Noty.show('Ищу на сервере...');
                        searchInJellyfin(e.data.movie, function(found) {
                            if (found.length > 0) {
                                if (found.length === 1) {
                                    playFile(found[0]);
                                } else {
                                    // Если нашли несколько (например, разные сезоны или части)
                                    Lampa.Select.show({
                                        title: 'Найдено в Jellyfin',
                                        items: found.map(function(i) {
                                            return {
                                                title: i.Name,
                                                description: i.ProductionYear || '',
                                                item: i
                                            };
                                        }),
                                        onSelect: function(res) { playFile(res.item); },
                                        onBack: function() { Lampa.Controller.toggle('full_start'); }
                                    });
                                }
                            } else {
                                Lampa.Noty.show('На сервере ничего не найдено');
                            }
                        });
                    });
                    container.append(btn);
                }
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
