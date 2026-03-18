(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Регистрируем компонент отображения
    Lampa.Component.add('jellyfin_search', function (object, str) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var html = $('<div class="category-full"></div>');
        
        this.create = function () {
            var _this = this;
            if (object.items && object.items.length) {
                object.items.forEach(function (item) {
                    var card = Lampa.Template.get('button', {
                        title: item.Name,
                        description: (item.ProductionYear || '') + ' • ' + (item.Type === 'Episode' ? 'Серия' : 'Фильм')
                    });

                    card.on('hover:enter', function () {
                        var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                        Lampa.Player.play({
                            url: vUrl,
                            title: item.Name
                        });
                        var playlist = object.items.map(function(i){
                            return {
                                title: i.Name,
                                url: nas_host + '/Videos/' + i.Id + '/stream.mp4?api_key=' + nas_key + '&static=true'
                            }
                        });
                        Lampa.Player.playlist(playlist);
                    });
                    scroll.append(card);
                });
            }
            html.append(scroll.render());
        };

        this.render = function () { return html; };
    });

    // Поиск как в online_mod (через системный network)
    function search(movie, callback) {
        var title = movie.title || movie.name;
        // Убираем всё, кроме букв и цифр, для максимально широкого поиска
        var cleanTitle = title.replace(/[^a-zA-Zа-яА-Я0-9]/g, ' ').trim();
        
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&searchTerm=' + encodeURIComponent(cleanTitle) + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=30&Fields=Path';

        var network = new Lampa.Reguest();
        network.silent(url, function (data) {
            console.log('Jellyfin Search Result:', data); // Для отладки в консоли
            callback(data.Items || []);
        }, function () {
            Lampa.Noty.show('Jellyfin: Ошибка сети (проверьте CORS)');
            callback([]);
        });
    }

    function addButton(e) {
        // Проверяем, не добавлена ли уже кнопка
        if (e.object.activity.render().find('.jellyfin-nas-btn').length) return;

        var btn = $('<div class="full-start__button selector view--online jellyfin-nas-btn"><span>Jellyfin NAS</span></div>');
        
        btn.on('hover:enter', function () {
            Lampa.Noty.show('Ищу: ' + (e.data.movie.title || e.data.movie.name));
            search(e.data.movie, function (found) {
                if (found.length > 0) {
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

        var container = e.object.activity.render().find('.view--torrent');
        if (container.length) container.after(btn);
        else e.object.activity.render().find('.full-start__buttons').append(btn);
    }

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
