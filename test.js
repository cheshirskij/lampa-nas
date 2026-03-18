(function () {
    'use strict';

    // ТВОИ НАСТРОЙКИ
    var nas_host = 'http://192.168.1.95:8096';
    var nas_key  = 'B4659bb0cc0c476bb7bf3113fef553f9';

    // ОБНОВЛЕННАЯ ЛОГИКА ПОИСКА
    function searchInJellyfin(movie, callback) {
        var title = movie.title || movie.name;
        // Собираем все ID, которые знает Лампа (IMDb, TMDB)
        var ids = [];
        if (movie.imdb_id) ids.push(movie.imdb_id);
        if (movie.tmdb_id) ids.push(movie.tmdb_id);
        
        // 1. Сначала ищем по жесткому совпадению ID (самый точный способ)
        // Параметр AnyId заставляет Jellyfin искать по всем внешним базам
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&Recursive=true&Fields=PrimaryImageAspectRatio&AnyId=' + ids.join(',');

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 5000,
            success: function (data) {
                if (data && data.Items && data.Items.length > 0) {
                    // Нашли по ID!
                    callback(data.Items);
                } else {
                    // 2. Если по ID не нашли, ищем по названию (запасной вариант)
                    var searchUrl = nas_host + '/Items?api_key=' + nas_key + 
                                    '&searchTerm=' + encodeURIComponent(title) + 
                                    '&IncludeItemTypes=Movie,Episode&Recursive=true&Limit=10';
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
                Lampa.Noty.show('Ошибка связи с Proxmox');
                callback([]);
            }
        });
    }

    // ТВОЯ ОРИГИНАЛЬНАЯ ЛОГИКА ОТРИСОВКИ
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
