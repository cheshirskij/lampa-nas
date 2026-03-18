(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function searchInJellyfin(movie, callback) {
        var title = movie.title || movie.name;
        var cleanTitle = title.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, ''); 

        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&searchTerm=' + encodeURIComponent(cleanTitle) + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=10';

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 10000,
            success: function (data) {
                callback(data.Items || []);
            },
            error: function () {
                Lampa.Noty.show('Jellyfin: Ошибка сервера');
                callback([]);
            }
        });
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin NAS</span></div>');
                var container = e.object.activity.render().find('.view--torrent');
                
                // Создаем скрытый блок для списка файлов
                var list_html = $('<div class="jellyfin-list" style="display: none; width: 100%; margin-top: 10px;"></div>');

                btn.on('hover:enter', function () {
                    if (list_html.is(':visible')) {
                        list_html.slideUp(200);
                    } else {
                        Lampa.Noty.show('Ищу файлы на NAS...');
                        searchInJellyfin(e.data.movie, function(found) {
                            if (found.length > 0) {
                                list_html.empty().show();
                                found.forEach(function(item) {
                                    var line = $('<div class="full-start__button selector" style="display: block; width: 100%; text-align: left; margin-bottom: 5px; background: rgba(255,255,255,0.1);"><span>' + item.Name + '</span></div>');
                                    
                                    line.on('hover:enter', function() {
                                        var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                                        Lampa.Player.play({
                                            url: vUrl,
                                            title: item.Name
                                        });
                                        Lampa.Player.playlist([{url: vUrl, title: item.Name}]);
                                    });
                                    
                                    list_html.append(line);
                                });
                                // Заставляем Lampa обновить фокус на новых кнопках
                                e.object.activity.render().find('.selector').unbind('mouseenter'); 
                            } else {
                                Lampa.Noty.show('На сервере пусто');
                            }
                        });
                    }
                });

                if (container.length) {
                    container.after(btn);
                    btn.after(list_html);
                }
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
