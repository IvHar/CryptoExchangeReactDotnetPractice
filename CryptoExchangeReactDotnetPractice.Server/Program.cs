using CryptoExchangeReactDotnetPractice.Server.Services;
using CryptoExchangeReactDotnetPractice.Server.Repositories;
using CryptoExchangeReactDotnetPractice.Server.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System;
using System.Text;
using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using System.Diagnostics;

namespace CryptoExchangeReactDotnetPractice.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Configuration
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddEnvironmentVariables();

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddCors(opt =>
                opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
            builder.Services.AddHttpContextAccessor();

            builder.Services.AddScoped<JwtService>();

            builder.Services.AddDbContext<CryptoDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddScoped(typeof(IRepository<,>), typeof(Repository<,>));
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<ICoinRepository, CoinRepository>();
            builder.Services.AddScoped<IWalletRepository, WalletRepository>();
            builder.Services.AddScoped<IOrderRepository, OrderRepository>();
            builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();

            builder.Services.AddScoped<UserService>();
            builder.Services.AddScoped<CoinService>();
            builder.Services.AddScoped<WalletService>();
            builder.Services.AddScoped<MarketService>();
            builder.Services.AddScoped<TransactionService>();

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
                    };
                });
            builder.Services.AddAuthorization();

            var app = builder.Build();

            var env = app.Services.GetRequiredService<IWebHostEnvironment>();
            var coinImagesDir = Path.Combine(builder.Environment.WebRootPath, "coin_images");
            if (!Directory.Exists(coinImagesDir))
                Directory.CreateDirectory(coinImagesDir);

            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseCors("AllowAll");

            app.UseSwagger();
            app.UseSwaggerUI();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}
