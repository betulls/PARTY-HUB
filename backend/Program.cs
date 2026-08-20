using flagwarsbackend;

var builder = WebApplication.CreateBuilder(args);

// 1. SignalR Servisi
builder.Services.AddSignalR();

// 2. CORS Ayarları
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 3. CORS Middleware
app.UseCors("AllowAll");

// 4. SignalR Hub Rotası
app.MapHub<GameHub>("/gamehub");

app.Run();