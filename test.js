(function () {
    'use strict';

    // ТВОИ НАСТРОЙКИ
    var nas_host = 'http://192.168.1.95:8096';
    var nas_key  = 'B4659bb0cc0c476bb7bf3113fef553f9';

    // Функция поиска фильма в Jellyfin
    function searchInJellyfin(movie, callback) {
        var title = movie.title || movie.name;
        var url = nas_host + '/Items?api_key=' + nas_key + '&searchTerm=' + encodeURIComponent(title) + '&IncludeItemTypes=Movie&Recursive=true&Fields=PrimaryImageAspectRatio,CanDelete';

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 5000,
            success: function (data) {
                callback(data.Items || []);
            },
            error: function () {
                Lampa.Noty.show('Ошибка связи с Proxmox');
                callback([]);
            }
        });
    }

    // Отрисовка списка найденного (используем логику из присланного тобой кода)
    function showItems(items) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer({title: 'Результаты из Jellyfin'});
        
        items.forEach(function (item) {
            // Создаем карточку в стиле "престиж"
            var card = Lampa.Template.get('button', {
                title: item.Name,
                description: item.ProductionYear || 'Jellyfin'
            });

            card.on('hover:enter', function () {
                // Формируем прямую ссылку на видео для плеера
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
        Lampa.Activity.push({
            url: '',
            title: 'Jellyfin NAS',
            component: 'jelly_search',
            render: function () {
                return files.render();
            }
        });
    }

    // Главная магия: добавляем кнопку "Jellyfin" на карточку любого фильма
    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Создаем кнопку
                var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin NAS</span></div>');
                
                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Ищу на сервере...');
                    searchInJellyfin(e.data.movie, function(foundItems) {
                        if (foundItems.length > 0) {
                            showItems(foundItems);
                        } else {
                            Lampa.Noty.show('На сервере ничего не найдено');
                        }
                    });
                });

                // Вставляем кнопку после кнопки "Торренты" или "Трейлер"
                var container = e.object.activity.render().find('.view--torrent');
                if (container.length) container.after(btn);
                else e.object.activity.render().find('.full-start__buttons').append(btn);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
