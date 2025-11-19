using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

var app = builder.Build();

// Compute repository root and legacy project path early (used by several middlewares)
var repoRoot = Directory.GetParent(app.Environment.ContentRootPath)!.FullName;
string legacyRoot = Path.Combine(repoRoot, "Reviewer");

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseResponseCompression();

// Rewrite missing vendor paths to existing ones to avoid 404s breaking bootstrap
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    if (string.Equals(path, "/Scripts/vendor/jquery-2.1.4.min.js", System.StringComparison.OrdinalIgnoreCase))
    {
        // Serve the existing jQuery 2.0.3 as a drop-in replacement
        var existing = Path.Combine(legacyRoot, "Scripts", "vendor", "jquery-2.0.3.min.js");
        if (File.Exists(existing))
        {
            context.Response.ContentType = "application/javascript";
            await context.Response.SendFileAsync(existing);
            return;
        }
    }
    await next();
});

// Redirect explicit /index.html to root to keep a clean URL and avoid double-loads
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    if (string.Equals(path, "/index.html", System.StringComparison.OrdinalIgnoreCase))
    {
        context.Response.Redirect("/", permanent: false);
        return;
    }
    await next();
});

// Serve default files (index.html) from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

// Map legacy static folders from the existing project without moving files

// Content type provider with .cshtml served as text/html so Angular templates work
var contentTypeProvider = new FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".cshtml"] = "text/html";

void MapLegacy(string requestPath, string physicalSubFolder)
{
    var physical = Path.Combine(legacyRoot, physicalSubFolder);
    if (Directory.Exists(physical))
    {
        app.UseStaticFiles(new StaticFileOptions
        {
            RequestPath = requestPath,
            FileProvider = new PhysicalFileProvider(physical),
            ContentTypeProvider = contentTypeProvider
        });
    }
}

MapLegacy("/Scripts", "Scripts");
MapLegacy("/content", "content");
MapLegacy("/Images", "Images");
MapLegacy("/sounds", "sounds");
MapLegacy("/Views", "Views");
MapLegacy("/views", "Views");

// Support extension-less template URLs like /views/index -> serve Reviewer/Views/Index.cshtml directly
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    if (path.StartsWith("/views", System.StringComparison.OrdinalIgnoreCase)
        && !Path.HasExtension(path))
    {
        var relative = path.Substring("/views".Length).TrimStart('/');
        // Try exact match first (case-sensitive filesystems may fail here)
        var candidate = Path.Combine(legacyRoot, "Views", relative + ".cshtml");
        string? physical = null;
        if (File.Exists(candidate))
        {
            physical = candidate;
        }
        else
        {
            // Attempt case-insensitive resolution within the target directory
            var dir = Path.GetDirectoryName(candidate);
            var wantName = Path.GetFileNameWithoutExtension(candidate);
            if (!string.IsNullOrEmpty(dir) && Directory.Exists(dir))
            {
                foreach (var file in Directory.EnumerateFiles(dir, "*.cshtml", SearchOption.TopDirectoryOnly))
                {
                    var name = Path.GetFileNameWithoutExtension(file);
                    if (string.Equals(name, wantName, System.StringComparison.OrdinalIgnoreCase))
                    {
                        physical = file; // use actual casing
                        break;
                    }
                }
            }
        }

        if (physical != null)
        {
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.SendFileAsync(physical);
            return;
        }
    }
    await next();
});

// Serve index.html at root explicitly so you don't have to navigate to it
app.MapGet("/", async context =>
{
    var indexPath = Path.Combine(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"), "index.html");
    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.SendFileAsync(indexPath);
});

// SPA fallback to index.html for client-side routes
app.MapFallbackToFile("index.html");

app.Run();
