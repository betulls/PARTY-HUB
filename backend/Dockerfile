FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Sadece csproj dosyasını kopyala ve restore et (Önbellek ve RAM optimizasyonu)
COPY *.csproj ./
RUN dotnet restore

# 2. Kaynak kodları kopyala ve Release olarak derle
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# 3. Çalıştırma Aşaması (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# ⚠️ Proje .csproj dosyanın adı "backend.csproj" ise backend.dll doğrudur.
# Eğer "flagwarsbackend.csproj" ise "flagwarsbackend.dll" olarak değiştir.
ENTRYPOINT ["dotnet", "backend.dll"]