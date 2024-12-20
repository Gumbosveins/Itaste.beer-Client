﻿'use strict';
////var serviceUrl = "https://localhost:7283/"
var serviceUrl = "https://itbapi.azurewebsites.net/"
// Declares how the application should be bootstrapped. See: http://docs.angularjs.org/guide/module
angular.module('app', ['ngMaterial', 'ui.router', 'app.filters', 'app.services', 'app.directives', 'app.controllers'])

    // Gets executed during the provider registrations and configuration phase. Only providers and constants can be
    // injected here. This is to prevent accidental instantiation of services before they have been fully configured.
    .config(['$stateProvider', '$locationProvider', function ($stateProvider, $locationProvider) {

        // UI States, URL Routing & Mapping. For more info see: https://github.com/angular-ui/ui-router
        // ------------------------------------------------------------------------------------------------------------

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: '/views/index',
                controller: 'HomeCtrl'
            })
            .state('howitworks', {
                url: '/howitworks',
                templateUrl: '/views/how',
                controller: 'HowCtrl'
            })
            .state('createRoom', {
                url: '/create',
                templateUrl: '/views/Create',
                controller: 'CreateCtrl'
            })
            .state('room', {
                url: '/roomcreate/:roomCode',
                templateUrl: '/views/roomDashboard',
                controller: 'RoomCtrl'
            })
            .state('dashboard', {
                url: '/dashboard/:roomCode/:pin',
                templateUrl: '/views/roomTv',
                controller: 'dashboardCtrl'
            })
            .state('userRoom', {
                url: '/userRoom/:roomCode',
                templateUrl: '/views/userRoom',
                controller: 'UserCtrl'
            })
            .state('joinroom', {
                url: '/join',
                templateUrl: '/views/Join',
                controller: 'joinCtrl'
            })
            .state('opendashboard', {
                url: '/opendashboard',
                templateUrl: '/views/openDashboard',
                controller: 'opendashboardCtrl'
            })
            .state('otherwise', {
                url: '*path',
                templateUrl: '/views/404',
                controller: 'Error404Ctrl'
            });

        $locationProvider.html5Mode(true);

    }])

    // Gets executed after the injector is created and are used to kickstart the application. Only instances and constants
    // can be injected here. This is to prevent further system configuration during application run time.
    .run(['$templateCache', '$rootScope', '$state', '$stateParams', function ($templateCache, $rootScope, $state, $stateParams) {

        $rootScope.isOpen = false;

        $rootScope.demo = {
            isOpen: false,
            count: 0,
            selectedDirection: 'right'
        };
        // <ui-view> contains a pre-rendered template for the current view
        // caching it will prevent a round-trip to a server at the first page load
        var view = angular.element('#ui-view');
        $templateCache.put(view.data('tmpl-url'), view.html());

        // Allows to retrieve UI Router state information from inside templates
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        $rootScope.$on('$stateChangeSuccess', function (event, toState) {

            // Sets the layout name, which can be used to display different layouts (header, footer etc.)
            // based on which page the user is located
            $rootScope.layout = toState.layout;
        });
    }]);