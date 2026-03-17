(function() {
    'use strict';

    // 1. Добавляем перевод названия (чтобы было красиво на разных языках)
    Lampa.Lang.add({
        my_nas_title: {
            ru: "Мой Jellyfin NAS",
            en: "My Jellyfin NAS"
        }
    });

    // 2. Функция для вставки кнопки в меню настроек
    function addNasSettings() {
        // Проверяем, не добавлена ли уже кнопка, чтобы не дублировать
        if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="my_nas_settings"]').length) {
            
            // Генерируем HTML код кнопки (используем иконку облака/сервера)
            var field = $('<div class="settings-folder selector" data-component="my_nas_settings">' +
                '<div class="settings-folder__icon">' +
                    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H5V11H19V13ZM19 17H4V15H19V17ZM19 21H5V19H19V21ZM5 5V7H19V5H5Z" fill="white"/></svg>' +
                '</div>' +
                '<div class="settings-folder__name">' + Lampa.Lang.translate('my_nas_title') + '</div>' +
            '</div>');

            // Вставляем кнопку после раздела "Остальное" (more)
            Lampa.Settings.main().render().find('[data-component="more"]').after(field);
            
            // Обновляем навигацию, чтобы кнопка стала кликабельной
            Lampa.Settings.main().update();
        }
    }

    // 3. Вешаем действие при нажатии на кнопку
    Lampa.Settings.listener.follow('open', function(e) {
        if (e.name == 'main') {
            e.body.find('[data-component="my_nas_settings"]').on('hover:enter', function() {
                // Пока просто выводим уведомление, позже заменим на открытие списка файлов
                Lampa.Noty.show('Подключение к Jellyfin на Proxmox...');
                
                // Здесь можно вызвать открытие твоей страницы
                Lampa.Activity.push({
                    url: '',
                    title: 'Jellyfin NAS',
                    component: 'jelly_nas_page', // Эту страницу мы создавали в прошлый раз
                    page: 1
                });
            });
        }
    });

    // Запуск при готовности приложения
    if (window.appready) addNasSettings();
    else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') addNasSettings();
        });
    }
})();
