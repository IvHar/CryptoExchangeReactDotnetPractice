using CryptoExchangeReactDotnetPractice.Server.Repositories;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.DTOs;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using CryptoExchangeReactDotnetPractice.Server.DTOs.Admin;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using static CryptoExchangeReactDotnetPractice.Server.DTOs.MarketDtos;

namespace CryptoExchangeReactDotnetPractice.Server.Services
{
    public class CoinService
    {
        private readonly ICoinRepository _coinRepo;
        private readonly IOrderRepository _orderRepo;
        private readonly IWebHostEnvironment _env;

        public CoinService(ICoinRepository coinRepo, IOrderRepository orderRepo, IWebHostEnvironment env)
        {
            _coinRepo = coinRepo;
            _orderRepo = orderRepo;
            _env = env;
        }

        public Task<List<Coin>> GetAllAsync(int? count = null)
            => _coinRepo.GetAllAsync().ContinueWith(t => count.HasValue ? t.Result.Take(count.Value).ToList() : t.Result);

        public async Task<List<AdminCoinDto>> GetAllAdminAsync()
        {
            var coins = await _coinRepo.GetAllAsync();
            return coins.Select(c => new AdminCoinDto
            {
                Id = c.Id,
                Name = c.CoinName,
                Symbol = c.Abbreviation,
                Price = c.Price,
                Capitalization = c.Capitalization,
                ImageUrl = c.ImageUrl
            }).ToList();
        }

        public async Task<Coin> CreateCoinAsync(CreateCoinDto dto)
        {
            var url = await SaveSquareImageAsync(dto.Symbol, dto.Image);

            var coin = new Coin
            {
                CoinName = dto.Name,
                Abbreviation = dto.Symbol.ToUpperInvariant(),
                Price = dto.InitialPrice,
                Capitalization = dto.Capitalization,
                ImageUrl = url
            };

            return await _coinRepo.AddAsync(coin);
        }

        public async Task<Coin?> GetByIdAsync(int id) => await _coinRepo.GetByIdAsync(id);

        public Task<List<Coin>> GetPopularAsync(int count) => _coinRepo.GetPopularAsync(count);

        public Task<List<Coin>> GetNewListingAsync(int count) => _coinRepo.GetNewListingAsync(count);

        public Task<List<string>> GetSymbolsAsync() => _coinRepo.GetSymbolsAsync();

        public async Task<Coin?> GetBySymbolAsync(string symbol) => await _coinRepo.GetBySymbolAsync(symbol);

        public Task<List<Coin>> GetTopTradedAsync(int count) => _coinRepo.GetTopTradedAsync(count);

        public async Task<(decimal percentChange24h, decimal volume24h)> GetStatsForCoinAsync(int coinId)
        {
            DateTime since24h = DateTime.UtcNow.AddDays(-1);

            var allFulfilled = await _orderRepo.FindAsync(o =>
                o.Status == "fulfilled" &&
                o.Wallet != null &&
                o.Wallet.CoinId == coinId
            );

            var ordersLast24h = allFulfilled.Where(o => o.OrderDate >= since24h).ToList();
            decimal volume24h = ordersLast24h.Sum(o => o.Amount * o.Price);
            
            //ищем самый свежий ордер, у которого OrderDate <= since24h
            var orderAtOrBefore = allFulfilled
                .Where(o => o.OrderDate <= since24h)
                .OrderByDescending(o => o.OrderDate)
                .FirstOrDefault();

            var coin = await _coinRepo.GetByIdAsync(coinId);
            decimal priceNow = coin?.Price ?? 0m;
            decimal price24Ago = orderAtOrBefore != null ? orderAtOrBefore.Price : priceNow;

            decimal percentChange24h = 0m;
            if (price24Ago > 0m)
                percentChange24h = (priceNow - price24Ago) / price24Ago * 100m;

            return (percentChange24h, volume24h);
        }

        public async Task<List<Coin>> GetTopGainersAsync(int count)
        {
            var allCoins = await _coinRepo.GetAllAsync();
            var stats = new List<(Coin coin, decimal pct)>(allCoins.Count);
            foreach (var c in allCoins)
            {
                var (pct, _) = await GetStatsForCoinAsync(c.Id);
                stats.Add((c, pct));
            }

            return stats
                .OrderByDescending(x => x.pct)
                .Take(count)
                .Select(x => x.coin)
                .ToList();
        }

        internal async Task DeleteCoinAsync(int id)
        {
            var coin = await _coinRepo.GetByIdAsync(id);
            if (coin != null)
            {
                _coinRepo.Remove(coin);
                await _coinRepo.SaveChangesAsync();
            }
        }

        public async Task<TickerDto?> GetTickerAsync(string baseSymbol, string quoteSymbol)
        {
            // 1. Загружаем все монеты (список в памяти)
            var allCoins = await _coinRepo.GetAllAsync();

            // 2. Находим объекты Coin для base и quote
            var baseCoin = allCoins
                .FirstOrDefault(c => c.Abbreviation.Equals(baseSymbol, StringComparison.OrdinalIgnoreCase));
            var quoteCoin = allCoins
                .FirstOrDefault(c => c.Abbreviation.Equals(quoteSymbol, StringComparison.OrdinalIgnoreCase));

            if (baseCoin == null || quoteCoin == null)
                return null; // Одна из валют не найдена

            // 3. Найдем ID монеты "USDT" один раз
            var usdtCoin = allCoins
                .FirstOrDefault(c => c.Abbreviation.Equals("USDT", StringComparison.OrdinalIgnoreCase));
            if (usdtCoin == null)
            {
                // Если USDT не найден, возвращаем null
                return null;
            }
            int usdtId = usdtCoin.Id;

            // 4. Получаем текущие цены монет в USDT (из поля coins.Price)
            decimal basePriceNow = baseCoin.Price;
            decimal quotePriceNow = quoteCoin.Price;

            // 5. Рассчитываем текущую цену пары base/quote
            decimal currentPrice;
            if (quoteSymbol.Equals("USDT", StringComparison.OrdinalIgnoreCase))
            {
                currentPrice = basePriceNow;
            }
            else if (baseSymbol.Equals("USDT", StringComparison.OrdinalIgnoreCase))
            {
                currentPrice = quotePriceNow != 0m ? 1m / quotePriceNow : 0m;
            }
            else
            {
                currentPrice = quotePriceNow != 0m
                    ? basePriceNow / quotePriceNow
                    : 0m;
            }

            // 6. Рассчитываем изменение за 24 часа (change24h)
            DateTime utcNow = DateTime.UtcNow;
            DateTime since24h = utcNow.AddHours(-24);

            // 6.1. Цена базовой монеты в USDT "24 часа назад"
            decimal basePrice24hAgo;
            if (baseSymbol.Equals("USDT", StringComparison.OrdinalIgnoreCase))
            {
                basePrice24hAgo = 1m;
            }
            else
            {
                var fulfilledBaseOrders = await _orderRepo.FindAsync(o =>
                    o.Status == "fulfilled" &&
                    o.Wallet.CoinId == baseCoin.Id &&
                    o.QuoteCoinId == usdtId &&
                    o.OrderDate <= since24h
                );

                var lastBaseOrder24h = fulfilledBaseOrders
                    .OrderByDescending(o => o.OrderDate)
                    .FirstOrDefault();

                basePrice24hAgo = lastBaseOrder24h != null
                    ? lastBaseOrder24h.Price
                    : basePriceNow;
            }

            // 6.2. Цена котируемой монеты в USDT "24 часа назад"
            decimal quotePrice24hAgo;
            if (quoteSymbol.Equals("USDT", StringComparison.OrdinalIgnoreCase))
            {
                quotePrice24hAgo = 1m;
            }
            else
            {
                var fulfilledQuoteOrders = await _orderRepo.FindAsync(o =>
                    o.Status == "fulfilled" &&
                    o.Wallet.CoinId == quoteCoin.Id &&
                    o.QuoteCoinId == usdtId &&
                    o.OrderDate <= since24h
                );

                var lastQuoteOrder24h = fulfilledQuoteOrders
                    .OrderByDescending(o => o.OrderDate)
                    .FirstOrDefault();

                quotePrice24hAgo = lastQuoteOrder24h != null
                    ? lastQuoteOrder24h.Price
                    : quotePriceNow;
            }

            // 6.3. Рассчитываем кросс-цену 24h назад
            decimal priceCross24hAgo;
            if (quoteSymbol.Equals("USDT", StringComparison.OrdinalIgnoreCase))
            {
                priceCross24hAgo = basePrice24hAgo;
            }
            else if (baseSymbol.Equals("USDT", StringComparison.OrdinalIgnoreCase))
            {
                priceCross24hAgo = quotePrice24hAgo != 0m
                    ? 1m / quotePrice24hAgo
                    : 0m;
            }
            else
            {
                priceCross24hAgo = quotePrice24hAgo != 0m
                    ? basePrice24hAgo / quotePrice24hAgo
                    : 0m;
            }

            // 6.4. Вычисляем изменение в процентах за 24h
            decimal change24h = 0m;
            if (priceCross24hAgo > 0m)
            {
                change24h = (currentPrice - priceCross24hAgo) / priceCross24hAgo * 100m;
            }

            // 7. Возвращаем TickerDto
            return new TickerDto(currentPrice, change24h);
        }

        private async Task<string> SaveSquareImageAsync(string symbol, IFormFile file)
        {
            var fileName = $"{symbol.ToLowerInvariant()}.png";
            var saveDir = Path.Combine(_env.WebRootPath, "coin_images");
            if (!Directory.Exists(saveDir))
            {
                Directory.CreateDirectory(saveDir);
            }

            var savePath = Path.Combine(saveDir, fileName);

            await using var src = file.OpenReadStream();
            using var img = await Image.LoadAsync(src);

            var size = Math.Min(img.Width, img.Height);
            var cropRect = new Rectangle(
                (img.Width - size) / 2,
                (img.Height - size) / 2,
                size, size);

            img.Mutate(x => x.Crop(cropRect).Resize(256, 256));
            await img.SaveAsync(savePath, new PngEncoder { CompressionLevel = PngCompressionLevel.BestCompression });

            return $"/coin_images/{fileName}";
        }
    }
}
