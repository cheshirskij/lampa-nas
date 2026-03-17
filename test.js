(function () {
    'use strict';

    // Эта функция — наше "сердце" плагина
    function PluginStart() {
        console.log('Jellyfin Test: Plugin started');

        // 1. Постоянная проверка меню
        var checkMenu = setInterval(function() {
            // Ищем список меню
            var menu = $('.menu__list');
            
            if (menu.length > 0) {
                // Если меню нашлось, и нашей кнопки еще нет
                if ($('.menu__item[data-action="jelly_check"]').length === 0) {
                    
                    var item = $('<li class="menu__item selector" data-action="jelly_check">' +
                        '<div class="menu__ico">' +
                            '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#ff0000" stroke-width="2"/></svg>' +
                        '</div>' +
                        '<div class="menu__text" style="color: #ff0000 !important;">ПРОВЕРКА</div>' +
                    '</li>');

                    // Добавляем действие при нажатии
                    item.on('hover:enter click', function () {
                        Lampa.Noty.show('СВЯЗЬ УСТАНОВЛЕНА! Код исполняется.');
                    });

                    menu.append(item);
                    
                    // Как только добавили — выводим уведомление
                    Lampa.Noty.show('Кнопка добавлена в меню!');
                    
                    // Можно остановить проверку, когда кнопка на месте
                    // Но для надежности оставим
                }
            }
        }, 1000); // Проверяем каждую секунду
    }

    // 2. Пытаемся запуститься всеми способами сразу
    if (window.appready) {
        PluginStart();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                PluginStart();
            }
        });
    }

    // На случай, если события не прокидываются — запускаем через 3 секунды принудительно
    setTimeout(PluginStart, 3000);

})();
