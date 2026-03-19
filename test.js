(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // 1. Твоя оригинальная функция загрузки контента
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

    // 2. Функция запуска селектора (твоя логика из первого кода)
    function openJellyfinMenu() {
        Lampa.Noty.show('Загрузка списка из Jellyfin...');
        
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
