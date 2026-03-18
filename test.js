(function () {
    'use strict';

    // Твои настройки
    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Умный поиск: AnyId -> SearchTerm
    function searchInJellyfin(movie, callback) {
        var title = movie.title || movie.name;
        // Самый агрессивный фильтр названия: оставляем только буквы, цифры и пробелы
        var cleanTitle = title.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, ''); 
        var imdbId = movie.imdb_id;
        
        // Очищаем IMDb ID от 'tt', если он есть
        if (imdbId) imdbId = imdbId.replace(/^tt/, '');
        var anyId = imdbId;
        
        // 1. Попытка 1: Поиск по AnyId (чистый IMDb)
        var urlAnyId = nas_host + '/Items?api_key=' + nas_key + '&Recursive=true&Fields=PrimaryImageAspectRatio&AnyId=' + anyId;

        $.ajax({
            url: urlAnyId,
            method: 'GET',
            timeout: 8000, 
            success: function (data) {
                if (data && data.Items && data.Items.length > 0) {
                    callback(data.Items);
                } else {
                    // 2. Если по ID не нашли, ищем по очищенному названию
                    var sUrl = nas_host + '/Items?api_key=' + nas_key + '&searchTerm=' + encodeURIComponent(cleanTitle) + '&IncludeItemTypes=Movie,Episode&Recursive=true&Limit=10';
                    
                    $.ajax({
                        url: sUrl,
                        method: 'GET',
                        success: function (res) { 
                            callback(res.Items || []); 
                        },
                        error: function (xhr) { 
                            callback([]); 
                        }
                    });
                }
            },
            error: function (xhr) {
                if(xhr.status === 401) Lampa.Noty.show('Jellyfin: Ошибка авторизации (401)');
                else if(xhr.status === 0) Lampa.Noty.show('Jellyfin: Блокировка CORS в браузере');
                else Lampa.Noty.show('Jellyfin: Сервер недоступен');
                callback([]);
            }
        });
    }

    function showItems(items) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer({title: 'Jellyfin NAS'});
        
        items.forEach(function (item) {
            // Рисуем список без зеленой ошибки Template not found
            var card = $('<div class="explorer-file selector"><div class="explorer-file__name">' + item.Name + '</div><div class="explorer-file__info">' + (item.ProductionYear || '') + '</div></div>');

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
                // Кнопка с классом view--online в стиле Лампы
                var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin NAS</span></div>');
                
                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Ищу на сервере...');
                    searchInJellyfin(e.data.movie, function(found) {
                        if (found.length > 0) showItems(found);
                        else Lampa.Noty.show('На NAS ничего не найдено');
                    });
                });

                // Вставка после Торрентов
                var container = e.object.activity.render().find('.view--torrent');
                if (container.length) container.after(btn);
                else e.object.activity.render().find('.full-start__buttons').append(btn);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
