(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function getAllItems(callback) {
        // Запрос вообще без поиска. Просто "дай мне 20 последних видео"
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=20&SortBy=DateCreated&SortOrder=Descending';

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 10000,
            success: function (data) {
                callback(data.Items || []);
            },
            error: function (xhr) {
                Lampa.Noty.show('Ошибка связи: ' + xhr.status);
                callback([]);
            }
        });
    }

    function showItems(items) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer({title: 'Jellyfin: Последние'});
        
        items.forEach(function (item) {
            var card = $('<div class="explorer-file selector"><div class="explorer-file__name">' + item.Name + '</div><div class="explorer-file__info">Тип: ' + (item.Type || 'Video') + '</div></div>');

            card.on('hover:enter', function () {
                // Пробуем запустить
                var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                Lampa.Player.play({ url: vUrl, title: item.Name });
                Lampa.Player.playlist([{ url: vUrl, title: item.Name }]);
            });
            scroll.append(card);
        });

        files.appendFiles(scroll.render());
        Lampa.Activity.push({
            url: '', title: 'Найдено: ' + items.length, component: 'jelly_all',
            render: function () { return files.render(); }
        });
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin ТЕСТ</span></div>');
                
                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Запрашиваю список...');
                    getAllItems(function(found) {
                        if (found.length > 0) showItems(found);
                        else Lampa.Noty.show('Сервер вернул пустой список');
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
