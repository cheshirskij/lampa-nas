(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Функция конвертации из кода выше для стабильности
    function srtToVtt(s) {
        var t = String(s || '').replace(/\r+/g, '').trim();
        return 'WEBVTT\n\n' + t
            .replace(/^\d+\n/gm, '')
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})\s-->\s(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2 --> $3.$4')
            .replace(/\n{3,}/g, '\n\n');
    }

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
                                    return { title: i.Name, subtitle: i.ProductionYear || '', data: i }
                                }),
                                onSelect: function (selected) {
                                    var item = selected.data;
                                    var vUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
                                    
                                    // 1. Сначала запускаем видео, чтобы не было "крутилки"
                                    var videoData = { url: vUrl, title: item.Name, subtitles: [] };
                                    Lampa.Player.play(videoData);
                                    Lampa.Player.playlist([videoData]);

                                    // 2. В фоне запрашиваем субтитры
                                    var net = new Lampa.Reguest();
                                    net.silent(nas_host + '/Items/' + item.Id + '?api_key=' + nas_key, function(res) {
                                        if (res.MediaSources && res.MediaSources[0]) {
                                            var streams = res.MediaSources[0].MediaStreams || [];
                                            streams.forEach(function(s) {
                                                if (s.Type === 'Subtitle') {
                                                    var sUrl = nas_host + '/Videos/' + item.Id + '/' + res.MediaSources[0].Id + '/Subtitles/' + s.Index + '/0/Stream.srt?api_key=' + nas_key;
                                                    
                                                    // Загружаем текст субтитров, конвертируем в VTT и подсовываем плееру
                                                    fetch(sUrl).then(function(r){ return r.text() }).then(function(text){
                                                        var vtt = srtToVtt(text);
                                                        var blob = new Blob([vtt], { type: 'text/vtt' });
                                                        var blobUrl = URL.createObjectURL(blob);
                                                        
                                                        // Добавляем субтитр в работающий плеер
                                                        Lampa.Player.subs([{
                                                            label: s.DisplayTitle || s.Language || 'Субтитры',
                                                            url: blobUrl
                                                        }]);
                                                    }).catch(function(){});
                                                }
                                            });
                                        }
                                    });
                                },
                                onBack: function () { Lampa.Controller.toggle('full_start'); }
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
