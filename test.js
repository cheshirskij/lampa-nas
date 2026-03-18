(function () {
    'use strict';

    var nas_host = 'http://192.168.1.95:8096';
    var nas_key  = 'B4659bb0cc0c476bb7bf3113fef553f9';

    // Функция поиска
    function searchInJellyfin(movie, callback) {
        var title = movie.title || movie.name;
        var queryId = movie.imdb_id || movie.tmdb_id || "";
        
        var url = nas_host + '/Items?api_key=' + nas_key + '&Recursive=true&AnyId=' + queryId;

        $.ajax({
            url: url,
            method: 'GET',
            timeout: 5000,
            success: function (data) {
                if (data && data.Items && data.Items.length > 0) callback(data.Items);
                else {
                    var searchUrl = nas_host + '/Items?api_key=' + nas_key + '&searchTerm=' + encodeURIComponent(title) + '&IncludeItemTypes=Movie,Episode&Recursive=true';
                    $.ajax({
                        url: searchUrl,
                        method: 'GET',
                        success: function (res) { callback(res.Items || []); },
                        error: function () { callback([]); }
                    });
                }
            },
            error: function () { callback([]); }
        });
    }

    // Функция запуска плеера
    function playFile(item) {
        var videoUrl = nas_host + '/Videos/' + item.Id + '/stream.mp4?api_key=' + nas_key + '&static=true';
        Lampa.Player.play({
            url: videoUrl,
            title: item.Name
        });
        Lampa.Player.playlist([{
            url: videoUrl,
            title: item.Name
        }]);
    }

    // Главная магия: добавляем в меню "Источник"
    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Ждем пока Лампа сформирует меню источников
                var timer = setInterval(function(){
                    var body = e.object.activity.render();
                    var container = body.find('.full-start__buttons');
                    
                    if(container.length > 0){
                        clearInterval(timer);
                        
                        // Если кнопки еще нет - создаем
                        if(!container.find('.jelly_btn').length){
                            var btn = $('<div class="full-start__button selector view--online jelly_btn"><span>Jellyfin NAS</span></div>');
                            
                            btn.on('hover:enter', function () {
                                Lampa.Noty.show('Поиск на сервере...');
                                searchInJellyfin(e.data.movie, function(found){
                                    if(found.length > 0){
                                        // Если нашли один - сразу играем, если много - показываем список
                                        if(found.length === 1) playFile(found[0]);
                                        else {
                                            Lampa.Select.show({
                                                title: 'Результаты Jellyfin',
                                                items: found.map(function(i){ 
                                                    i.title = i.Name + ' (' + (i.ProductionYear || '---') + ')';
                                                    return i; 
                                                }),
                                                onSelect: function(item){ playFile(item); },
                                                onBack: function(){ Lampa.Controller.toggle('full_start'); }
                                            });
                                        }
                                    } else {
                                        Lampa.Noty.show('На сервере ничего не найдено');
                                    }
                                });
                            });
                            
                            container.append(btn);
                        }
                    }
                }, 200);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
