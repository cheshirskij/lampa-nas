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
        if ($('.menu .menu__list li[data-action="local_files"]').length) return;

        // SVG логотип Jellyfin (фирменная форма)
        var jellyIcon = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2L4 7V17L12 22L20 17V7L12 2ZM11 16.5V7.5L17 12L11 16.5Z" fill="#AA5CC3"/>
                <path opacity="0.4" d="M12 2L4 7V17L12 22V2L12 2Z" fill="#AA5CC3"/>
            </svg>
        `;

        var menu_item = $(`
            <li class="menu__item selector" data-action="local_files">
                <div class="menu__ico">
                    ${jellyIcon}
                </div>
                <div class="menu__text">Локальные файлы</div>
            </li>
        `);

        menu_item.on('hover:enter', function () {
            Lampa.Noty.show('Загрузка списка...');
            
            getAllContent(function (items) {
                if (items.length > 0) {
                    Lampa.Select.show({
                        title: 'Jellyfin файлы',
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
