(function () {
    'use strict';

    // Конфигурация Jellyfin
    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Перевод для кнопки
    Lampa.Lang.add({
        local_files: {
            ru: 'Локальные файлы',
            en: 'Local Files'
        }
    });

    // Функция получения контента (полностью без изменений)
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

    // Функция запуска плагина
    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Новый, чистый HTML кнопки с SVG-иконкой Jellyfin
                var btn = $(`
                    <div class="full-start__button selector view--online">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 10px; vertical-align: middle;">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
                        </svg>
                        <span style="vertical-align: middle;">${Lampa.Lang.translate('local_files')}</span>
                    </div>
                `);

                // Логика нажатия (полностью без изменений)
                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Загрузка списка...');
                    
                    getAllContent(function (items) {
                        if (items.length > 0) {
                            Lampa.Select.show({
                                title: 'Файлы на сервере',
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
                                    Lampa.Controller.toggle('full_start');
                                }
                            });
                        } else {
                            Lampa.Noty.show('Файлы не найдены');
                        }
                    });
                });

                // Правильное позиционирование: добавляем В НАЧАЛО контейнера кнопок
                var container = e.object.activity.render().find('.full-start__buttons');
                if (container.length) {
                    container.prepend(btn); // <- Это переместит кнопку в начало списка
                }
            }
        });
    }

    // Запуск при готовности приложения
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
