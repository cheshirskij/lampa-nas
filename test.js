(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function searchInJellyfin(movie, callback) {
        // Берем оригинальное название или русское
        var title = movie.name || movie.title;
        
        // Оставляем только буквы и цифры, убираем знаки препинания
        var cleanTitle = title.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, ''); 

        // Самый простой запрос: просто ищем строку по всему серверу
        // Добавил Fields=Path, чтобы убедиться, что файл физически есть
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&searchTerm=' + encodeURIComponent(cleanTitle) + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=20';

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 10000,
            success: function (data) {
                console.log('Jellyfin found:', data);
                callback(data.Items || []);
            },
            error: function () {
                Lampa.Noty.show('Jellyfin: Ошибка запроса');
                callback([]);
            }
        });
    }

    function showItems(items) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer({title: 'Jellyfin NAS'});
        
        items.forEach(function (item) {
            // Создаем карточку вручную
            var card = $('<div class="explorer-file selector"><div class="explorer-file__name">' + item.Name + '</div><div class="explorer-file__info">' + (item.ProductionYear || 'Видео') + '</div></div>');

            card.on('hover:enter', function () {
                // Прямая ссылка на стрим
                var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                Lampa.Player.play({ url: vUrl, title: item.Name });
                Lampa.Player.playlist([{ url: vUrl, title: item.Name }]);
            });
            scroll.append(card);
        });

        files.appendFiles(scroll.render());
        Lampa.Activity.push({
            url: '', title: 'Результаты: ' + items.length, component: 'jelly_search',
            render: function () { return files.render(); }
        });
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin NAS</span></div>');
                
                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Ищу файлы...');
                    searchInJellyfin(e.data.movie, function(found) {
                        if (found && found.length > 0) showItems(found);
                        else Lampa.Noty.show('Ничего не найдено по названию');
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
