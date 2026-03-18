(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // 1. Создаем компонент отображения, как в примере
    Lampa.Component.add('jellyfin_search', function (object, str) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var html = $('<div></div>');
        
        this.create = function () {
            var _this = this;
            if (object.items && object.items.length) {
                object.items.forEach(function (item) {
                    // Используем стандартный шаблон кнопки из примера
                    var card = Lampa.Template.get('button', {
                        title: item.Name,
                        description: item.ProductionYear || 'Jellyfin'
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
            } else {
                html.append('<div class="empty">Ничего не найдено</div>');
            }
            html.append(scroll.render());
        };

        this.render = function () {
            return html;
        };
    });

    // 2. Логика поиска через системный Lampa.Reguest
    function search(movie, callback) {
        var network = new Lampa.Reguest();
        var title = movie.title || movie.name;
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&searchTerm=' + encodeURIComponent(title) + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode&Limit=20';

        network.silent(url, function (data) {
            callback(data.Items || []);
        }, function () {
            Lampa.Noty.show('Ошибка связи с Jellyfin');
            callback([]);
        });
    }

    // 3. Добавление кнопки через правильный Listener
    function addButton(e) {
        var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin NAS</span></div>');
        
        btn.on('hover:enter', function () {
            Lampa.Noty.show('Поиск...');
            search(e.data.movie, function (found) {
                if (found.length > 0) {
                    // Пушим активность с нашим компонентом
                    Lampa.Activity.push({
                        url: '',
                        title: 'Jellyfin',
                        component: 'jellyfin_search',
                        items: found,
                        page: 1
                    });
                } else {
                    Lampa.Noty.show('На сервере ничего не найдено');
                }
            });
        });

        // Вставка кнопки по логике примера
        var container = e.object.activity.render().find('.view--torrent');
        if (container.length) container.after(btn);
        else e.object.activity.render().find('.full-start__buttons').append(btn);
    }

    // Запуск плагина
    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                addButton(e);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
