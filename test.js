(function () {
    'use strict';

    function StartPlugin() {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                // Создаем кнопку в меню
                var menu_item = $('<li class="menu__item selector" data-action="nas_test">' +
                    '<div class="menu__ico"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="white"/></svg></div>' +
                    '<div class="menu__text">Jellyfin Тест</div>' +
                '</li>');

                $('.menu__list').append(menu_item);

                // Реакция на нажатие
                menu_item.on('hover:enter', function () {
                    Lampa.Noty.show('Плагин с GitHub работает!');
                });
            }
        });
    }

    if (window.appready) StartPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') StartPlugin();
    });
})();
