(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Твоя оригинальная функция вообще без изменений
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

    // Слушаем открытие настроек, а не карточки фильма
    Lampa.Settings.listener.follow('open', function (e) {
        // Проверяем, что открыт раздел "Основные" (main)
        if (e.name == 'main') {
            
            // Защита от дублей, если ты вышел и снова зашел в настройки
            if (e.body.find('[data-name="local_jellyfin_btn"]').length) return;

            // Верстка пункта меню (как у online_mod)
            var btn = $(`
                <div class="settings-param selector" data-name="local_jellyfin_btn" data-type="button">
                    <div class="settings-param__name">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 8px;">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                        </svg>
                        Локальные файлы
                    </div>
                    <div class="settings-param__value">Jellyfin NAS</div>
                </div>
            `);

            // Твоя логика запуска из первого скрипта
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
                                // Возврат в настройки после выхода из меню селектора
                                Lampa.Controller.toggle('settings');
                            }
                        });
                    } else {
                        Lampa.Noty.show('Файлы не найдены');
                    }
                });
            });

            // Находим контейнер и вставляем кнопку
            var folder = e.body.find('.settings-folder');
            if (folder.length) {
                folder.append(btn); // В самый низ списка "Основные"
            } else {
                e.body.append(btn); // Резервный вариант, если тема лампы изменена
            }
        }
    });

})();
