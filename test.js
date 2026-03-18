(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Ваш исходный рабочий метод - НЕ МЕНЯЕМ
    function getAllContent(callback) {
        var network = new Lampa.Reguest();
        var url = nas_host + '/Items?api_key=' + nas_key + 
                  '&Recursive=true&IncludeItemTypes=Movie,Episode,Video&Limit=50&SortBy=DateCreated&SortOrder=Descending';

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
                                    
                                    // 1. Сразу готовим объект для плеера
                                    var play_item = {
                                        url: vUrl,
                                        title: item.Name,
                                        subtitles: []
                                    };

                                    // 2. Пытаемся быстро подтянуть субтитры отдельным легким запросом
                                    var net = new Lampa.Reguest();
                                    net.silent(nas_host + '/Items/' + item.Id + '?api_key=' + nas_key, function(res){
                                        if(res.MediaSources && res.MediaSources[0]){
                                            var streams = res.MediaSources[0].MediaStreams || [];
                                            streams.forEach(function(s){
                                                if(s.Type === 'Subtitle'){
                                                    play_item.subtitles.push({
                                                        label: s.DisplayTitle || s.Language || 'Sub',
                                                        url: nas_host + '/Videos/' + item.Id + '/' + res.MediaSources[0].Id + '/Subtitles/' + s.Index + '/0/Stream.vtt?api_key=' + nas_key
                                                    });
                                                }
                                            });
                                        }
                                        // Запускаем плеер ПОСЛЕ попытки получить субтитры (даже если их нет)
                                        Lampa.Player.play(play_item);
                                        Lampa.Player.playlist([play_item]);
                                    }, function(){
                                        // Если запрос упал - просто играем файл
                                        Lampa.Player.play(play_item);
                                        Lampa.Player.playlist([play_item]);
                                    });
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
