(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function searchInJellyfin(movie, callback) {
        var network = new Lampa.Reguest();
        var title = movie.title || movie.name;
        var cleanTitle = title.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '');

        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&searchTerm=' + encodeURIComponent(cleanTitle) + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=20';

        network.silent(url, function (data) {
            callback(data.Items || []);
        }, function () {
            Lampa.Noty.show('Jellyfin: Ошибка связи');
            callback([]);
        });
    }

    // Вспомогательная функция для получения деталей файла (включая субтитры)
    function getMediaDetails(itemId, callback) {
        var network = new Lampa.Reguest();
        var url = nas_host + '/Users/' + '00000000000000000000000000000000' + '/Items/' + itemId + '?api_key=' + nas_key; 
        // Примечание: Jellyfin часто требует ID пользователя, '000...' обычно работает как публичный доступ
        
        network.silent(url, callback, function() { callback(null); });
    }

    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                if (e.object.activity.render().find('.jelly-nas-btn').length) return;

                var btn = $('<div class="full-start__button selector view--online jelly-nas-btn"><span>Jellyfin NAS</span></div>');

                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Ищу на сервере...');
                    
                    searchInJerryfin(e.data.movie, function (items) {
                        if (items.length > 0) {
                            Lampa.Select.show({
                                title: 'Найдено в Jellyfin',
                                items: items.map(function(i){
                                    return {
                                        title: i.Name,
                                        subtitle: (i.ProductionYear || '') + (i.Type === 'Episode' ? ' • Серия' : ''),
                                        data: i
                                    }
                                }),
                                onSelect: function (selected) {
                                    Lampa.Noty.show('Загрузка метаданных...');
                                    
                                    // 1. Получаем полные данные об айтеме (MediaSources)
                                    getMediaDetails(selected.data.Id, function(fullData) {
                                        var subs = [];
                                        var vUrl = nas_host + '/Videos/' + selected.data.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';

                                        if (fullData && fullData.MediaSources && fullData.MediaSources[0]) {
                                            var source = fullData.MediaSources[0];
                                            
                                            // 2. Проходим по всем потокам и ищем субтитры
                                            source.MediaStreams.forEach(function(stream) {
                                                if (stream.Type === 'Subtitle' && stream.DeliveryMethod !== 'Embed') {
                                                    subs.push({
                                                        label: (stream.Language || 'Unknown') + ' (' + (stream.Title || stream.Codec) + ')',
                                                        url: nas_host + '/Videos/' + selected.data.Id + '/' + source.Id + '/Subtitles/' + stream.Index + '/0/Stream.' + (stream.Codec === 'vtt' ? 'vtt' : 'srt') + '?api_key=' + nas_key
                                                    });
                                                }
                                            });
                                        }

                                        // 3. Запускаем плеер с субтитрами
                                        var playObject = {
                                            url: vUrl,
                                            title: selected.data.Name,
                                            subtitles: subs // Передаем найденные субтитры
                                        };

                                        Lampa.Player.play(playObject);
                                        Lampa.Player.playlist([playObject]);
                                    });
                                },
                                onBack: function () {
                                    Lampa.Controller.toggle('full_start');
                                }
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
        });
    }

    function searchInJerryfin(m, c) { searchInJellyfin(m, c); } // Фикс опечатки в вызове

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
