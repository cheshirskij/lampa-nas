(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function getAllContent(callback) {
        var network = new Lampa.Reguest();
        // Добавляем ТОЛЬКО MediaSources, это даст нам индексы субтитров
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
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online"><span>Jellyfin NAS</span></div>');

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
                                    // Если сервер прислал данные о потоках, вытаскиваем их
                                    if (item.MediaSources && item.MediaSources[0] && item.MediaSources[0].MediaStreams) {
                                        item.MediaSources[0].MediaStreams.forEach(function(stream) {
                                            if (stream.Type === 'Subtitle') {
                                                subs.push({
                                                    label: stream.DisplayTitle || stream.Language || 'Субтитры',
                                                    // Ссылка на VTT для совместимости с Lampa
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
                                    
                                    // Мгновенный запуск
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

                var container = e.object.activity.render().find('.view--torrent');
                if (container.length) container.after(btn);
                else e.object.activity.render().find('.full-start__buttons').append(btn);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
