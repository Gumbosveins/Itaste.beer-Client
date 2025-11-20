using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.StaticFiles;
using System.Net.Http;
using System.Net;

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
            // Disable caching for template files to ensure updated partials are fetched
            context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            context.Response.Headers["Pragma"] = "no-cache";
            context.Response.Headers["Expires"] = "0";
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

// --- Simple dev reverse proxy for the legacy API ---
// This lets the front-end call /api/* on the same origin, avoiding browser CORS/mixed-content issues.
// Target defaults to http://localhost:5082 but can be overridden with env var DEV_API_BASE.
var apiBase = Environment.GetEnvironmentVariable("DEV_API_BASE")?.TrimEnd('/')
              ?? "http://localhost:5082";
var httpClient = new HttpClient(new HttpClientHandler
{
    AllowAutoRedirect = false,
    AutomaticDecompression = DecompressionMethods.All
});

app.MapWhen(ctx => ctx.Request.Path.StartsWithSegments("/api"), apiApp =>
{
    apiApp.Run(async ctx =>
    {
        var upstream = new Uri(apiBase + ctx.Request.Path + ctx.Request.QueryString);

        // Build upstream request
        var method = new HttpMethod(ctx.Request.Method);
        var upstreamRequest = new HttpRequestMessage(method, upstream);

        // Copy headers (except Host)
        foreach (var header in ctx.Request.Headers)
        {
            if (string.Equals(header.Key, "Host", StringComparison.OrdinalIgnoreCase)) continue;
            if (!upstreamRequest.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()))
            {
                upstreamRequest.Content ??= new StreamContent(ctx.Request.Body);
                upstreamRequest.Content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
            }
        }

        // Copy body if present
        if (ctx.Request.ContentLength.HasValue && ctx.Request.ContentLength.Value > 0)
        {
            upstreamRequest.Content = new StreamContent(ctx.Request.Body);
            // Try to pass through content-type
            if (ctx.Request.ContentType != null)
            {
                upstreamRequest.Content.Headers.TryAddWithoutValidation("Content-Type", ctx.Request.ContentType);
            }
        }

        // Send and relay response
        using var upstreamResponse = await httpClient.SendAsync(upstreamRequest, HttpCompletionOption.ResponseHeadersRead, ctx.RequestAborted);
        ctx.Response.StatusCode = (int)upstreamResponse.StatusCode;

        // Copy response headers
        foreach (var header in upstreamResponse.Headers)
        {
            ctx.Response.Headers[header.Key] = header.Value.ToArray();
        }
        foreach (var header in upstreamResponse.Content.Headers)
        {
            ctx.Response.Headers[header.Key] = header.Value.ToArray();
        }
        // Remove hop-by-hop headers that Kestrel forbids
        ctx.Response.Headers.Remove("transfer-encoding");

        await upstreamResponse.Content.CopyToAsync(ctx.Response.Body);
    });
});

// SPA fallback to index.html for client-side routes
app.MapFallbackToFile("index.html");

app.Run();
