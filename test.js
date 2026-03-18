(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Регистрируем компонент для отображения списка, как в online_mod
    Lampa.Component.add('jellyfin_view', function (object, str) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        var html = $('<div></div>');

        this.create = function () {
            var _this = this;
            
            // Если данные переданы при открытии
            if (object.items) {
                object.items.forEach(function (item) {
                    // Используем универсальный шаблон 'full_start_button' для строк
                    var card = Lampa.Template.get('button', {
                        title: item.Name,
                        description: item.ProductionYear || 'Video'
                    });

                    card.on('hover:enter', function () {
                        var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                        Lampa.Player.play({
                            url: vUrl,
                            title: item.Name
                        });
                        Lampa.Player.playlist([{
                            url: vUrl,
                            title: item.Name
                        }]);
                    });

                    scroll.append(card);
                });
            }

            html.append(scroll.render());
        };

        this.render = function () {
            return html;
        };
    });

    function searchInJellyfin(movie, callback) {
        var title = movie.title || movie.name;
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&searchTerm=' + encodeURIComponent(title) + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode&Limit=15';

        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                callback(data.Items || []);
            },
            error: function () {
                Lampa.Noty.show('Jellyfin: Ошибка сети');
                callback([]);
            }
        });
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin NAS</span></div>');

                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Поиск на сервере...');
                    searchInJellyfin(e.data.movie, function(found) {
                        if (found.length > 0) {
                            // Вызываем наш зарегистрированный компонент
                            Lampa.Activity.push({
                                url: '',
                                title: 'Jellyfin',
                                component: 'jellyfin_view',
                                items: found, // Передаем найденные файлы
                                page: 1
                            });
                        } else {
                            Lampa.Noty.show('На NAS ничего не найдено');
                        }
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
