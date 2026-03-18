(function () {
    'use strict';

    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    function getAllContent(callback) {
        var network = new Lampa.Reguest();
        // Добавили Fields=MediaSources, чтобы Jellyfin сразу отдавал данные о потоках (субтитрах)
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

                                    // Поиск субтитров в метаданных Jellyfin
                                    if (item.MediaSources && item.MediaSources[0]) {
                                        var source = item.MediaSources[0];
