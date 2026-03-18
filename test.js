(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function getAllItems(callback) {
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=20&SortBy=DateCreated&SortOrder=Descending';

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 10000,
            success: function (data) {
                callback(data.Items || []);
            },
            error: function () {
                Lampa.Noty.show('Ошибка загрузки данных');
                callback([]);
            }
        });
    }

    function showItems(items) {
        // Очищаем текущую активность и готовим список
        var scroll = new Lampa.Scroll({mask: true, over: true});
        
        items.forEach(function (item) {
            // Создаем элемент через стандартный шаблонизатор Lampa
            var card = Lampa.Template.get('folder', {
                title: item.Name,
                quality: item.Type == 'Episode' ? 'Серия' : 'Фильм'
            });

            card.on('hover:enter', function () {
                var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                
                // Запуск плеера
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

        // Вызываем стандартный компонент просмотра
        Lampa.Activity.push({
            url: '',
            title: 'Найдено: ' + items.length,
            component: 'jelly_all',
            render: function () {
                return scroll.render();
            },
            onBack: function(){
                Lampa.Activity.backward();
            }
        });
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin ТЕСТ</span></div>');
                
                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Загрузка 14 файлов...');
                    getAllItems(function(found) {
                        if (found.length > 0) showItems(found);
                        else Lampa.Noty.show('Список пуст');
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
