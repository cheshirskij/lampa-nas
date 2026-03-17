(function () {
    'use strict';

    // 1. Создаем саму страницу, которая откроется при клике
    Lampa.Component.add('jelly_nas_page', function (object) {
        var comp = new Lampa.InteractionMain(object);

        comp.create = function () {
            this.activity.loader(true); // Рисуем крутилку загрузки
            this.build([]);
        };

        comp.build = function (items) {
            var _this = this;
            this.activity.loader(false); // Убираем загрузку

            // Покажем красивую заглушку
            var empty = Lampa.Template.get('empty', {
                title: 'Jellyfin NAS',
                descr: 'Связь через GitHub Pages работает! Скоро здесь будет твой Proxmox.'
            });

            this.display(empty);
        };

        return comp;
    });

    // 2. Регистрируем плагин в системе
    function StartPlugin() {
        Lampa.Plugins.add({
            name: 'Jellyfin NAS',
            description: 'Локальный сервер через GitHub Pages',
            auth: false,
            // Иконка в виде сервера
            icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 13H4V11H20V13ZM20 17H4V15H20V17ZM20 21H4V19H20V21ZM10 3L12 5L14 3H20C21.1 3 22 3.9 22 5V21C22 22.1 21.1 23 20 23H4C2
