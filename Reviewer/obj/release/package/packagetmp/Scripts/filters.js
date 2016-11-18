'use strict';

angular.module('app.filters', [])

    .filter('beerFilter', function () {
        return function (items) {
            var filtered = _.sortBy(items, function (i) { return i.displayOrder; });

            return filtered;
        };
    })
    .filter('resultFilter', function () {
        return function (items) {
            var filtered = _.sortBy(items, function (i) { return -i.results.totalScore; });

            return filtered;
        };
    })
    .filter('userFilter', function () {
        return function (items) {
            var filtered = _.sortBy(items, function (i) { return -i.totalScore; });

            return filtered;
        };
    })
    .filter('reviewPartSorter', function () {
        return function (items) {
            var filtered = _.sortBy(items, function (i) { return i.displayOrder; });

            return filtered;
        };
    })