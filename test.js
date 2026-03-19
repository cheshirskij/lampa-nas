(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Оригинальная функция загрузки
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

    // Функция вставки кнопки в настройки
    function addSettingsButton() {
        // Проверка, чтобы кнопка не дублировалась
        if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-name="local_jellyfin"]').length) {
            
            // Просто текстовая кнопка без иконок
            var field = $(`
                <div class="settings-param selector" data-name="local_jellyfin" data-type="button">
                    <div class="settings-param__name">Локальные файлы</div>
                    <div class="settings-param__value">Jellyfin NAS</div>
                </div>
            `);

            // Вешаем обработчик нажатия
            field.on('hover:enter', function () {
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
                                Lampa.Controller.toggle('settings');
                            }
                        });
                    } else {
                        Lampa.Noty.show('Файлы не найдены');
                    }
                });
            });

            // Добавляем в самый верх списка "Основные" в настройках
            Lampa.Settings.main().render().find('.settings-folder').prepend(field);
            Lampa.Settings.main().update();
        }
    }

    // Слушатель открытия настроек
    Lampa.Settings.listener.follow('open', function (e) {
        if (e.name == 'main') {
            addSettingsButton();
        }
    });

    // Стартовая инициализация
    if (window.appready) addSettingsButton();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addSettingsButton(); });

})();
