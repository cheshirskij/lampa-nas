(function () {
    'use strict';

    try {
        var NasPlugin = function() {
            this.name = 'jellyfin_test';
            
            this.init = function() {
                // Выводим уведомление сразу
                Lampa.Noty.show('ПРИВЕТ! Я РАБОТАЮ!');
                
                // Добавляем кнопку в меню через 2 секунды после старта
                setTimeout(function() {
                    var menu = $('.menu__list');
                    if (menu.length) {
                        var item = $('<li class="menuitem selector" data-action="jelly_test"><div class="menuico"><svg width="36" height="36" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" fill="red"/></svg></div><div class="menu__text">NAS ТЕСТ</div></li>');
                        menu.append(item);
                        Lampa.Noty.show('Кнопка в меню!');
                    }
                }, 2000);
            };
        };

        // Регистрация в глобальном объекте Lampa
        if (window.appready) new NasPlugin().init();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') new NasPlugin().init();
            });
        }
    } catch (e) {
        console.error('NAS Plugin Error:', e);
    }
})();
