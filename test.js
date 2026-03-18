(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Регистрируем компонент отображения списка
    Lampa.Component.add('jellyfin_all_items', function (object, str) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var html = $('<div class="category-full"></div>');
        
        this.create = function () {
            var _this = this;
            if (object.items && object.items.length) {
                object.items.forEach(function (item) {
                    // Используем стандартный шаблон кнопки
                    var card = Lampa.Template.get('button', {
                        title: item.Name,
                        description: (item.ProductionYear || '') + ' • ' + (item.Type || 'Video')
                    });

                    card.on('hover:enter', function () {
                        // Ссылка на поток
                        var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                        
                        Lampa.Player.play({
                            url: vUrl,
                            title: item.Name
                        });
                        
                        Lampa.Player.playlist([{
                            title: item.Name,
                            url: vUrl
                        }]);
                    });
                    scroll.append(card);
                });
            } else {
                html.append('<div class="empty">Сервер не вернул файлов</div>');
            }
            html.append(scroll.render());
        };

        this.render = function () { return html; };
    });

    // Функция получения ВСЕГО контента (последние 30 штук)
    function getAllContent(callback) {
        var network = new Lampa.Reguest();
        // Запрос: рекурсивно, только видео, последние по дате добавления
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=30&SortBy=DateCreated&SortOrder=Descending';

        network.silent(url, function (data) {
            callback(data.Items || []);
        }, function () {
            Lampa.Noty.show('Jellyfin: Ошибка связи');
            callback([]);
        });
    }

    function addButton(e) {
        // Чтобы кнопка не дублировалась при возврате в карточку
        if (e.object.activity.render().find('.jelly-all-btn').length) return;

        var btn = $('<div class="full-start__button selector view--online jelly-all-btn"><span>Jellyfin ТЕСТ (ВСЁ)</span></div>');
        
        btn.on('hover:enter', function () {
            Lampa.Noty.show('Запрашиваю весь список...');
            getAllContent(function (found) {
                if (found.length > 0) {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Весь Jellyfin (' + found.length + ')',
                        component: 'jellyfin_all_items',
                        items: found,
                        page: 1
                    });
                } else {
                    Lampa.Noty.show('Сервер прислал пустой список');
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
