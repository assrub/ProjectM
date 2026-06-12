FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /app
COPY MuServer/MuServer.csproj ./MuServer/
RUN dotnet restore ./MuServer/MuServer.csproj
COPY . .
RUN dotnet publish ./MuServer/MuServer.csproj -c Release -o /publish
RUN mkdir -p /publish/Data && cp -r MuServer/json/* /publish/Data/

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
COPY --from=build /publish .
EXPOSE 3000
ENV PORT=3000
CMD ["dotnet", "MuServer.dll"]
