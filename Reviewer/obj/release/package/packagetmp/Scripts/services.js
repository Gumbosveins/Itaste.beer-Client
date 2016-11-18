'use strict';

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('app.services', [])


.factory('ToastService', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
    return {
        InitToast: function () {
            toastr.options = {
                "progressBar": true,
                "positionClass": "toast-bottom-right",
                "showDuration": "300",
                "hideDuration": "1000",
                "timeOut": "5000",
                "extendedTimeOut": "1000",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            }
        },
        Toast: function (msg, success) {
            if (success) {
                toastr["success"](msg);
            }
            else {
                if (msg != null)
                    toastr["error"](msg);
                else
                    toastr["error"]("An error occurred");
            }
        },
    };
}])

.factory('TasteService', ['$http', '$q', '$rootScope', 'ToastService', function ($http, $q, $rootScope, ToastService) {
    return {
        CreateRoom: function (room) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/CreateRoom',
                method: 'POST',
                data: room
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        FinishRoomCreation: function (data) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/FinishRoomCreation',
                method: 'POST',
                data: data
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        GetRoom: function (roomCode, pin, userId) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/GetRoom?roomCode=' + roomCode + '&pin=' + pin + '&userId=' + userId,
                method: 'GET',
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        GetDashboard: function (roomCode, pin) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/GetDashboard?roomCode=' + roomCode + '&pin=' + pin,
                method: 'GET',
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        GetBreweries: function () {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/GetBreveries',
                method: 'GET',
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        GetBreweriesBeers: function (id) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/GetBreverysBeers?id=' + id,
                method: 'GET',
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        SearchForBeers: function (query) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/SearchForBeers?query=' + query,
                method: 'GET',
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        GetReviewTypes: function (query) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/GetReviewTypes',
                method: 'GET',
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        AddReview: function (data) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/AddReview',
                method: 'POST',
                data: data
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        JoinRoom: function (data) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/JoinRoom',
                method: 'POST',
                data: data
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data.Message, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        UnlockBeer: function (roomCode, beerId) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/UnlockBeer?roomCode=' + roomCode + '&beerId=' + beerId,
                method: 'GET',
            }).success(function (data) {
                ToastService.Toast(data, true);
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
        FinishReview: function (roomCode, beerId) {
            var deferred = $q.defer();
            $http({
                url: serviceUrl + 'api/Taster/FinishReview?roomCode=' + roomCode + '&beerId=' + beerId,
                method: 'GET',
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                ToastService.Toast(data, false);
                deferred.reject(false);
            })
            return deferred.promise;
        },
    };
}])



.factory('beerService', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
    return {
        Test: function (tournamentId, teamId) {
            var deferred = $q.defer();
            $http.get(serviceUrl + 'Test')
                .success(function (data) {
                    //resolve the promise as the data
                    deferred.resolve(data);
                }).error(function () {
                    //alert('We could not process your request please try again');
                    deferred.reject();
                });
            return deferred.promise;
        },

        CreateUser: function (user, pass) {
            var deferred = $q.defer();
            $http.get(serviceUrl + 'CreateUser?username=' + user + '&pass=' + pass)
                .success(function (data) {
                    //resolve the promise as the data
                    deferred.resolve(data);
                }).error(function () {
                    //alert('We could not process your request please try again');
                    deferred.reject();
                });
            return deferred.promise;
        },

        Init: function (user) {
            var deferred = $q.defer();
            $http.get(serviceUrl + 'Init?username=' + user)
                .success(function (data) {
                    //resolve the promise as the data
                    deferred.resolve(data);
                }).error(function () {
                    //alert('We could not process your request please try again');
                    deferred.reject();
                });
            return deferred.promise;
        },
        Vote: function (user, beerId, aroma, appearance, flavor, mouthfeel, oaImpression, CB) {
            var deferred = $q.defer();
            $http.get(serviceUrl + 'Vote?username=' + user + '&beerId=' + beerId + '&aroma=' + aroma + '&appearance=' + appearance + '&flavor=' + flavor + '&mouthfeel=' + mouthfeel + '&oaImpression=' + oaImpression + '&CB=' + CB)
                .success(function (data) {
                    //resolve the promise as the data
                    deferred.resolve(data);
                }).error(function () {
                    //alert('We could not process your request please try again');
                    deferred.reject();
                });
            return deferred.promise;
        },
        Initdashboard: function () {
            var deferred = $q.defer();
            $http.get(serviceUrl + 'InitDashboard')
                .success(function (data) {
                    //resolve the promise as the data
                    deferred.resolve(data);
                }).error(function () {
                    //alert('We could not process your request please try again');
                    deferred.reject();
                });
            return deferred.promise;
        },
        CloseAllBeers: function () {
            var deferred = $q.defer();
            $http.get(serviceUrl + 'CloseAllBeers')
                .success(function (data) {
                    //resolve the promise as the data
                    deferred.resolve(data);
                }).error(function () {
                    //alert('We could not process your request please try again');
                    deferred.reject();
                });
            return deferred.promise;
        },
        OpenBeer: function (id) {
            var deferred = $q.defer();
            $http.get(serviceUrl + 'OpenBeer?id=' + id)
                .success(function (data) {
                    //resolve the promise as the data
                    deferred.resolve(data);
                }).error(function () {
                    //alert('We could not process your request please try again');
                    deferred.reject();
                });
            return deferred.promise;
        },

    };
}])


.value('signalRServer', "http://skalapi.azurewebsites.net/")

.factory('signalRHubProxy', ['$rootScope', 'signalRServer', 
    function ($rootScope, signalRServer) {

        function signalRHubProxyFactory(hubName, startOptions) {

            var connection = $.hubConnection(signalRServer);
            var proxy = connection.createHubProxy(hubName);
            $.connection.hub.logging = true;
            connection.start({ transport: 'webSockets', jsonp: true }).done(function (data) {
                console.log(data);
            });
            connection.reconnected(function (data) {
            });
            connection.disconnected(function (data) {
            });
            connection.reconnecting(function (data) {
            });
            return {
                on: function (eventName, callback) {
                    proxy.on(eventName, function (result) {
                        $rootScope.$apply(function () {
                            if (callback) {
                                callback(result);
                            }
                        });
                    });
                },
                invokeNoParam: function (methodName, callback) {
                    proxy.invoke(methodName)
                        .done(function (result) {
                            $rootScope.$apply(function () {
                                if (callback) {
                                    callback(result);
                                }
                            });
                        });
                },
                invokeSingelParam: function (methodName, p, callback) {
                    proxy.invoke(methodName, p)
                        .done(function (result) {
                            $rootScope.$apply(function () {
                                if (callback) {
                                    callback(result);
                                }
                            });
                        });
                },
                connection: connection
            };
        };

        return signalRHubProxyFactory;
    }])

