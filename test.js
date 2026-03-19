(function () {
    'use strict';

    // Конфигурация Jellyfin
    var nas_host = 'http://178.234.15.238:8096';
    var nas_key  = 'b4659bb0cc0c476bb7bf3113fef553f9';

    // Перевод
    Lampa.Lang.add({
        local_files_title: {
            ru: 'Локальные файлы',
            en: 'Local Files'
        }
    });

    // Функция получения контента (твоя оригинальная логика)
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

    // Функция обработки выбора и запуска (твоя оригинальная логика)
    function playSelected(selected) {
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
    }

    // Функция действия при нажатии (вызывает селектор)
    function handleAction() {
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
                        playSelected(selected);
                    },
                    onBack: function () {
                        Lampa.Controller.toggle('settings');
                    }
                });
            } else {
                Lampa.Noty.show('Файлы не найдены');
            }
        });
    }

    // Функция добавления кнопки в настройки
    function addLocalFilesBtn() {
        // Проверка на дубли (ищем по data-component)
        if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="local_files_jellyfin"]').length) {
            
            // Чистая HTML разметка в стиле Lampa с маленькой иконкой плеера
            var field = $(`
                <div class="settings-param selector" data-component="local_files_jellyfin">
                    <div class="settings-param__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; width: 100%; height: 100%;">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="settings-param__name">${Lampa.Lang.translate('local_files_title')}</div>
                    <div class="settings-param__value">Jellyfin NAS</div>
                </div>
            `);

            // Вставляем после пункта "Интерфейс" ( data-component="interface" )
            var interfaceBtn = Lampa.Settings.main().render().find('[data-component="interface"]');
            
            if (interfaceBtn.length) {
                interfaceBtn.after(field); // Вставляем ПОСЛЕ Интерфейса
            } else {
                // Если "Интерфейс" не найден, вставляем в начало кнопок-категорий
                var startButtons = Lampa.Settings.main().render().find('.full-start__buttons');
                if (startButtons.length) startButtons.prepend(field);
                else Lampa.Settings.main().render().prepend(field); // Резерв
            }

            Lampa.Settings.main().update();
        }
    }

    // Слушатели открытия настроек и привязки событий
    Lampa.Settings.listener.follow('open', function (e) {
        if (e.name == 'main') {
            // Добавляем обработчик на уже существующую кнопку
            e.body.find('[data-component="local_files_jellyfin"]').on('hover:enter', function() {
                handleAction();
            });
        }
    });

    // Запуск при старте приложения
    if (window.appready) addLocalFilesBtn();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addLocalFilesBtn(); });

})();
