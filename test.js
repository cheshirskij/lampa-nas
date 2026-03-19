(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function getAllContent(callback) {
        var network = new Lampa.Reguest();
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=50&SortBy=DateCreated&SortOrder=Descending&Fields=MediaSources';

        network.silent(url, function (data) {
            callback(data.Items || []);
        }, function () {
            Lampa.Noty.show('Jellyfin: Ошибка связи');
            callback([]);
        });
    }

    function startPlugin() {
        var menu_item = $(`
            <li class="menu__item selector" data-action="local_files">
                <div class="menu__ico">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
                    </svg>
                </div>
                <div class="menu__text">Локальные файлы</div>
            </li>
        `);

        menu_item.on('hover:enter', function () {
            // Сохраняем состояние контроллера, чтобы не было Script Error
            Lampa.Controller.save();
            Lampa.Menu.hide();
            
            Lampa.Noty.show('Загрузка списка...');
            
            getAllContent(function (items) {
                if (items.length > 0) {
                    Lampa.Select.show({
                        title: 'Локальные файлы',
                        items: items.map(function(i){
                            return {
                                title: i.Name,
                                subtitle: i.ProductionYear || '',
                                data: i
                            }
                        }),
                        onSelect: function (selected) {
                            var item = selected.data;
                            var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                            
                            var subs = [];
                            if (item.MediaSources && item.MediaSources[0] && item.MediaSources[0].MediaStreams) {
                                item.MediaSources[0].MediaStreams.forEach(function(stream) {
                                    if (stream.Type === 'Subtitle') {
                                        subs.push({
                                            label: stream.DisplayTitle || stream.Language || 'Субтитры',
                                            url: nas_host + '/Videos/' + item.Id + '/Subtitles/' + stream.Index + '/0/Stream.vtt?api_key=' + nas_key,
                                            type: 'vtt'
                                        });
                                    }
                                });
                            }

                            var videoData = {
                                url: vUrl,
                                title: item.Name,
                                subtitles: subs
                            };
                            
                            Lampa.Player.play(videoData);
                            Lampa.Player.playlist([videoData]);
                        },
                        onBack: function () {
                            Lampa.Controller.toggle('menu'); 
                        }
                    });
                } else {
                    Lampa.Noty.show('Файлы не найдены');
                }
            });
        });

        // Вставка под "Главная"
        var main_item = $('.menu .menu__list li[data-action="main"]');
        if (main_item.length) {
            menu_item.insertAfter(main_item);
        } else {
            $('.menu .menu__list').prepend(menu_item);
        }
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });

})();
