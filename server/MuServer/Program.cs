using System.Net;
using MuServer.Game;
using MuServer.Networking;

var port = int.Parse(Environment.GetEnvironmentVariable("PORT") ?? "3000");

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
    WebRootPath = null
});

builder.WebHost.UseKestrel(options =>
{
    options.Listen(IPAddress.Any, port);
    options.Limits.MaxRequestBodySize = 65536;
});

var app = builder.Build();

app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(30)
});

var world = new World();
var wsHandler = new WebSocketHandler(world);
world.SetWebSocketHandler(wsHandler);

world.Start();

app.Map("/ws", async (HttpContext context) =>
{
    await wsHandler.HandleConnection(context);
});

app.MapGet("/health", () => Results.Ok(new { status = "ok", uptime = Environment.TickCount64, players = wsHandler.ConnectionCount }));

Console.WriteLine($"Mu Online server starting on port {port}...");
Console.WriteLine($"Data directory: {Path.Combine(AppContext.BaseDirectory, "Data")}");

app.Lifetime.ApplicationStopping.Register(() =>
{
    Console.WriteLine("Shutting down...");
    world.Stop();
});

await app.RunAsync();
