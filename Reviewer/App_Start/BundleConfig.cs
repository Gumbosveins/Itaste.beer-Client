// --------------------------------------------------------------------------------------------------------------------
// <copyright file="BundleConfig.cs" company="">
//   Copyright © 2015 
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

namespace App.Reviewer
{
    using System.Web;
    using System.Web.Optimization;

    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new StyleBundle("~/content/css/app").Include(
                "~/content/angular-material.min.css"
                ,"~/content/angular-material.layouts.min.css"
                ,"~/content/angular-material.layout-attributes.min.css"
                , "~/content/toastr.min.css"
                , "~/content/app.css"
                ));

            bundles.Add(new ScriptBundle("~/js/jquery").Include("~/scripts/vendor/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/js/app").Include(
                "~/scripts/angular/angular.js",
                "~/scripts/angular-aria/angular-aria.js",
                "~/scripts/angular-animate/angular-animate.js",
                "~/scripts/angular-material/angular-material.js",
                "~/scripts/angular/angular-drag-and-drop-lists.min.js",
                "~/scripts/vendor/angular-ui-router.js",
                "~/scripts/vendor/jquery.marquee.js",
                "~/scripts/jquery.signalR-2.2.0.min.js",
                "~/scripts/toastr.min.js",
                "~/scripts/vendor/underscore-min.js",
                "~/scripts/vendor/math.min.js",
                "~/scripts/filters.js",
                "~/scripts/services.js",
                "~/scripts/directives.js",
                "~/scripts/controllers.js",
                "~/scripts/app.js"));


            
        }


    }
}
