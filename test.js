(function () {
    'use strict';

    // === ТВОИ НАСТРОЙКИ ===
    var nas_host = 'http://192.168.1.95:8096';
    var nas_key  = 'B4659bb0cc0c476bb7bf3113fef553f9';

    // Функция поиска фильма в Jellyfin
    function searchInJellyfin(movie, callback) {
        // Пробуем достать все доступные ID из Лампы
        var ids = [];
        if (movie.imdb_id) ids.push(movie.imdb_id);
        if (movie.tmdb_id) ids.push(movie.tmdb_id);
        if (movie.kp_id)   ids.push(movie.kp_id);
        
        var queryId = ids.join(',');
        var title = movie.title || movie.name;

        console.log('JellySearch: Ищу', title, 'с ID:', queryId);

        // 1. Сначала самый точный поиск по ID
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&Recursive=true&Fields=PrimaryImageAspectRatio,CanDelete&AnyId=' + queryId;

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 5000,
            success: function (data) {
                if (data.Items && data.Items.length > 0) {
                    console.log('JellySearch: Найдено по ID');
                    callback(data.Items);
                } else {
                    // 2. Если по ID не нашли, ищем по названию (запасной вариант)
                    console.log('JellySearch: По ID пусто, ищу по названию...');
                    var searchUrl = nas_host + '/Items?api_key=' + nas_key + 
                                    '&searchTerm=' + encodeURIComponent(title) + 
                                    '&IncludeItemTypes=Movie,Episode&Recursive=true&Limit=10';
                    $.ajax({
                        url: searchUrl,
                        method: 'GET',
                        success: function (res) { callback(res.Items || []); },
                        error: function () { callback([]); }
                    });
                }
            },
            error: function () {
                Lampa.Noty.show('Ошибка подключения к Jellyfin');
                callback([]);
            }
        });
    }

    // Отрисовка результатов (список найденного)
    function showItems(items, movie) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer({title: 'Jellyfin: ' + (movie.title || movie.name)});
        
        items.forEach(function (item) {
            // Создаем карточку в стиле Лампы
            var card = Lampa.Template.get('button', {
                title: item.Name,
                description: item.ProductionYear || 'Найдено на сервере'
            });

            card.on('hover:enter', function () {
                // Формируем прямую ссылку на поток для плеера Лампы
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
        
        // Пушим активность в Лампу
        Lampa.Activity.push({
            url: '',
            title
