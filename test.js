(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function searchInJellyfin(movie, callback) {
        var network = new Lampa.Reguest();
        var title = movie.title || movie.name;
        
        // Формируем чистый запрос без лишних фильтров, которые могут мешать
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&searchTerm=' + encodeURIComponent(title) + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=20';

        network.silent(url, function (data) {
            if (data && data.Items) {
                callback(data.Items);
            } else {
                callback([]);
            }
        }, function () {
            Lampa.Noty.show('Jellyfin: Ошибка запроса к серверу');
            callback([]);
        });
    }

    // Эта функция создаст список прямо на текущем экране, чтобы не ловить "Activity error"
    function appendResultToList(items, container) {
        items.forEach(function (item) {
            var line = $('<div class="full-start__button selector view--online" style="display: block; width: 100%; text-align: left; margin-top: 5px; background: rgba(255,255,255,0.05);"><span>' + item.Name + '</span></div>');

            line.on('hover:enter', function () {
                var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                Lampa.Player.play({
                    url: vUrl,
                    title: item.Name
                });
                Lampa.Player.playlist([{ url: vUrl, title: item.Name }]);
            });

            container.append(line);
        });
        
        // Важно: заставляем Лампу увидеть новые кнопки для пульта
        Lampa.Controller.enable('full_start'); 
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online"><span>Найти на Jellyfin</span></div>');
                var btn_container = e.object.activity.render().find('.full-start__buttons');
                
                // Создаем невидимый блок, куда упадут результаты
                var results_box = $('<div class="jelly-results" style="width: 100%;"></div>');

                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Стучусь на сервер...');
                    searchInJellyfin(e.data.movie, function(found) {
                        if (found.length > 0) {
                            results_box.empty();
                            appendResultToList(found, results_box);
                            Lampa.Noty.show('Найдено файлов: ' + found.length);
                        } else {
                            Lampa.Noty.show('На NAS ничего не найдено');
                        }
                    });
                });

                if (btn_container.length) {
                    btn_container.append(btn);
                    btn_container.after(results_box);
                }
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
