(function(){
  'use strict';

  // Angular module to post-process fetched .cshtml templates when served as static HTML
  angular.module('razorShim', [])
    .config(['$httpProvider', function($httpProvider){
      $httpProvider.interceptors.push(['$q', function($q){
        return {
          response: function(resp){
            try{
              var url = (resp && resp.config && resp.config.url) || '';
              if (typeof resp.data === 'string' && url.indexOf('/views/') === 0){
                var html = resp.data;
                // Replace app-relative paths
                html = html.replace(/~\//g, '/');
                // Drop simple Razor blocks like @{ ... }
                html = html.replace(/@\{[\s\S]*?\}/g, '');
                // Drop inline Razor expressions like @Something or @* comments *@
                html = html.replace(/@\*([\s\S]*?)\*@/g, '');
                html = html.replace(/@\(.*?\)/g, '');
                html = html.replace(/@[A-Za-z0-9_\.\[\]\(\)]+/g, '');
                resp.data = html;
              }
            }catch(e){ /* best effort */ }
            return resp || $q.resolve(resp);
          }
        };
      }]);
    }]);
})();
