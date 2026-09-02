using flagwarsbackend;

var builder = WebApplication.CreateBuilder(args);

// 1. SignalR Servisi
builder.Services.AddSignalR(options =>
{
    // Sunucu, telefondan 60 saniye boyunca ses gelmezse ancak o zaman düşürsün
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
    // İletişimi hayatta tutmak için daha sık yoklama yapsın
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
});

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

// Render'ın bize verdiği dinamik portu alıyoruz, eğer yoksa 5184 kullanıyoruz.
var port = Environment.GetEnvironmentVariable("PORT") ?? "5184";

// localhost yerine 0.0.0.0 kullanarak dış dünyadan (Render üzerinden) gelen isteklere kapıyı açıyoruz.
app.Run($"http://0.0.0.0:{port}");