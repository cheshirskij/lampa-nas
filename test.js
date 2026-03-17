(function () {
    'use strict';

    function StartPlugin() {
        // 1. Создаем визуальную часть (страницу), которая откроется при клике
        Lampa.Component.add('jellyfin_page', function (object) {
            var comp = new Lampa.InteractionMain(object);

            comp.create = function () {
                this.activity.loader(true);
                this.build([]);
            };

            comp.build = function (items) {
                this.activity.loader(false);
                // Выводим сообщение на пустой странице
                var empty = Lampa.Template.get('empty', {
                    title: 'Jellyfin на Proxmox',
                    descr: 'Здесь будет список ваших фильмов. Связь с GitHub установлена!'
                });
                this.display(empty);
            };

            return comp;
        });

        // 2. Регистрируем плагин в системе, чтобы он появился в "Расширении"
        Lampa.Plugins.add({
            name: 'Jellyfin Proxmox',
            description: 'Интеграция с локальным сервером',
            auth: false,
            icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" stroke-width="2"/></svg>',
            onLaunch: function () {
                // Вызываем нашу страницу при запуске
                Lampa.Activity.push({
                    url: '',
                    title: 'Мой Jellyfin',
                    component: 'jellyfin_page',
                    page: 1
                });
            }
        });
    }

    // Ожидание готовности Lampa
    if (window.appready) StartPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') StartPlugin();
    });
})();
