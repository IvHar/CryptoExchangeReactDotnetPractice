using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.DTOs;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using static CryptoExchangeReactDotnetPractice.Server.DTOs.MarketDtos;

namespace CryptoExchangeReactDotnetPractice.Server.Services
{
    public class MarketService
    {
        private readonly IOrderRepository _orderRepo;
        private readonly IWalletRepository _walletRepo;
        private readonly ITransactionRepository _txRepo;
        private readonly IHttpContextAccessor _httpCtx;
        private readonly ICoinRepository _coinRepo;
        private readonly CryptoDbContext _db;

        public MarketService(IOrderRepository orderRepo, IWalletRepository walletRepo, ITransactionRepository txRepo, IHttpContextAccessor httpCtx, ICoinRepository coinRepo, CryptoDbContext db)
        {
            _orderRepo = orderRepo;
            _walletRepo = walletRepo;
            _coinRepo = coinRepo;
            _txRepo = txRepo;
            _httpCtx = httpCtx;
            _db = db;
        }

        private int CurrentUserId =>
            int.Parse(_httpCtx.HttpContext!.User.FindFirstValue(ClaimTypes.NameIdentifier)
                       ?? throw new InvalidOperationException("User not authenticated"));

        public async Task<OrderResponse> PlaceOrderAsync(OrderRequest req)
        {
            var userId = CurrentUserId;

            // 1) Находим записи о монетах Base и Quote
            var baseCoin = await _db.Coins.SingleOrDefaultAsync(c => c.Abbreviation == req.Base);
            if (baseCoin == null)
                return new(false, $"Base coin '{req.Base}' not found");

            var quoteCoin = await _db.Coins.SingleOrDefaultAsync(c => c.Abbreviation == req.Quote);
            if (quoteCoin == null)
                return new(false, $"Quote coin '{req.Quote}' not found");

            // 2) Получаем или создаём baseWallet (для базовой монеты)
            var baseWallet = await _walletRepo.GetByUserAndCoinAsync(userId, baseCoin.Id);
            if (baseWallet == null)
            {
                baseWallet = new Wallet
                {
                    UserId = userId,
                    CoinId = baseCoin.Id,
                    CoinAmount = 0m
                };
                await _walletRepo.AddAsync(baseWallet);
                await _db.SaveChangesAsync();
            }

            // 3) Получаем или создаём quoteWallet (для котируемой монеты)
            var quoteWallet = await _walletRepo.GetByUserAndCoinAsync(userId, quoteCoin.Id);
            if (quoteWallet == null)
            {
                quoteWallet = new Wallet
                {
                    UserId = userId,
                    CoinId = quoteCoin.Id,
                    CoinAmount = 0m
                };
                await _walletRepo.AddAsync(quoteWallet);
                await _db.SaveChangesAsync();
            }

            // 4) Проверяем баланс пользователя
            if (req.Side == "sell")
            {
                if (baseWallet.CoinAmount < req.Amount)
                    return new(false, "Insufficient base coin balance");
            }
            else
            {
                decimal requiredQuote = req.Price * req.Amount;
                if (quoteWallet.CoinAmount < requiredQuote)
                    return new(false, "Insufficient quote coin balance");
            }

            // 5) Сохраняем сам ордер (status="open")
            var order = new Order
            {
                WalletId = baseWallet.Id,
                Type = req.Side,
                Status = "open",
                Price = req.Price,
                Amount = req.Amount,
                OrderDate = DateTime.UtcNow,
                QuoteCoinId = quoteCoin.Id
            };
            await _orderRepo.AddAsync(order);
            await _db.SaveChangesAsync(); // здесь появится order.Id

            // 6) Пытаемся найти встречный ордер
            var match = await _orderRepo.FindMatchingAsync(order);
            if (match != null)
            {
                // Начинаем транзакцию, чтобы атомарно обновить ордера, кошельки, транзакции и цену coins.Price
                await using var tx = await _db.Database.BeginTransactionAsync();

                // 6.1) Меняем статус обоим ордерам и сохраняем matchedPrice (в нашем случае matchedPrice = order.Price)
                order.Status = "fulfilled";
                match.Status = "fulfilled";

                _orderRepo.Update(order);
                _orderRepo.Update(match);
                await _db.SaveChangesAsync();

                // 6.2) Вычисляем новую цену baseCoin в USDT и сохраняем её.
                //       matchedPrice = order.Price  (сколько quoteCoin отдают за 1 baseCoin)
                decimal matchedPrice = order.Price;
                decimal newPriceInUsdt;
                if (quoteCoin.Abbreviation == "USDT")
                {
                    newPriceInUsdt = matchedPrice;
                }
                else
                {
                    if (quoteCoin.Price <= 0m)
                    {
                        newPriceInUsdt = 0m;
                    }
                    else
                    {
                        newPriceInUsdt = matchedPrice * quoteCoin.Price;
                    }
                }

                baseCoin.Price = newPriceInUsdt;
                _coinRepo.Update(baseCoin);
                await _db.SaveChangesAsync();
                var buyerId = (req.Side == "buy") ? userId : match.Wallet.UserId;
                var sellerId = (req.Side == "sell") ? userId : match.Wallet.UserId;
                var buyerBaseWallet = await _walletRepo.GetByUserAndCoinAsync(buyerId, baseCoin.Id)
                                       ?? new Wallet { UserId = buyerId, CoinId = baseCoin.Id, CoinAmount = 0m };
                if (buyerBaseWallet.Id == 0)
                {
                    await _walletRepo.AddAsync(buyerBaseWallet);
                    await _db.SaveChangesAsync();
                }

                var buyerQuoteWallet = await _walletRepo.GetByUserAndCoinAsync(buyerId, quoteCoin.Id)
                                         ?? new Wallet { UserId = buyerId, CoinId = quoteCoin.Id, CoinAmount = 0m };
                if (buyerQuoteWallet.Id == 0)
                {
                    await _walletRepo.AddAsync(buyerQuoteWallet);
                    await _db.SaveChangesAsync();
                }

                var sellerBaseWallet = await _walletRepo.GetByUserAndCoinAsync(sellerId, baseCoin.Id)
                                        ?? throw new InvalidOperationException("Seller base wallet not found");

                var sellerQuoteWallet = await _walletRepo.GetByUserAndCoinAsync(sellerId, quoteCoin.Id)
                                          ?? new Wallet { UserId = sellerId, CoinId = quoteCoin.Id, CoinAmount = 0m };
                if (sellerQuoteWallet.Id == 0)
                {
                    await _walletRepo.AddAsync(sellerQuoteWallet);
                    await _db.SaveChangesAsync();
                }

                // 6.3) Расчёт фактического объёма сделки
                decimal tradedAmount = order.Amount;                // сколько базовой монеты куплено/продано
                decimal tradedValue = tradedAmount * order.Price;  // сколько котируемой монеты потрачено/получено

                // 6.4) Обновляем балансы кошельков
                buyerBaseWallet.CoinAmount += tradedAmount;
                buyerQuoteWallet.CoinAmount -= tradedValue;

                sellerBaseWallet.CoinAmount -= tradedAmount;
                sellerQuoteWallet.CoinAmount += tradedValue;

                _walletRepo.Update(buyerBaseWallet);
                _walletRepo.Update(buyerQuoteWallet);
                _walletRepo.Update(sellerBaseWallet);
                _walletRepo.Update(sellerQuoteWallet);
                await _db.SaveChangesAsync();

                // 6.5) Записываем историю транзакций (две записи: базовая и котируемая часть)
                var tx1 = new Transaction
                {
                    SenderId = sellerBaseWallet.Id,
                    ReceiverId = buyerBaseWallet.Id,
                    Amount = tradedAmount,
                    TransactionTimestamp = DateTime.UtcNow
                };
                var tx2 = new Transaction
                {
                    SenderId = buyerQuoteWallet.Id,
                    ReceiverId = sellerQuoteWallet.Id,
                    Amount = tradedValue,
                    TransactionTimestamp = DateTime.UtcNow
                };
                await _txRepo.AddAsync(tx1);
                await _txRepo.AddAsync(tx2);
                await _db.SaveChangesAsync();

                // 6.6) Фиксируем всю транзакцию (commit)
                await tx.CommitAsync();
            }

            return new(true);
        }

        public async Task<OrderResponse> CancelOrderAsync(long orderId)
        {
            var order = await _orderRepo.GetByIdAsync(orderId);
            if (order == null || order.Status != "open")
                return new(false, "Order not found or not open");

            order.Status = "cancelled";
            _orderRepo.Update(order);
            await _db.SaveChangesAsync();
            return new(true);
        }

        public async Task<OrderBookDto> GetOrderBookAsync(string baseSymbol, string quoteSymbol)
        {
            var allCoins = await _coinRepo.GetAllAsync();
            var baseCoin = allCoins.FirstOrDefault(c =>
                              c.Abbreviation.Equals(baseSymbol, StringComparison.OrdinalIgnoreCase));
            var quoteCoin = allCoins.FirstOrDefault(c =>
                              c.Abbreviation.Equals(quoteSymbol, StringComparison.OrdinalIgnoreCase));

            if (baseCoin == null || quoteCoin == null)
            {
                return new OrderBookDto(new List<OrderBookEntryDto>(), new List<OrderBookEntryDto>());
            }

            int baseId = baseCoin.Id;
            int quoteId = quoteCoin.Id;

            var openOrders = await _orderRepo.FindAsync(o =>
                o.Status == "open" &&
                o.Wallet.CoinId == baseId &&
                o.QuoteCoinId == quoteId);

            var bids = openOrders
                        .Where(o => o.Type == "buy")
                        .OrderByDescending(o => o.Price)
                        .Select(o => new OrderBookEntryDto(
                            Price: o.Price,
                            Amount: o.Amount,
                            Total: (o.Price * o.Amount)
                        ))
                        .ToList();

            var asks = openOrders
                        .Where(o => o.Type == "sell")
                        .OrderBy(o => o.Price)
                        .Select(o => new OrderBookEntryDto(
                            Price: o.Price,
                            Amount: o.Amount,
                            Total: (o.Price * o.Amount)
                        ))
                        .ToList();

            return new OrderBookDto(bids, asks);
        }

        public async Task<List<OpenOrderDto>> GetOpenOrdersForCurrentUserAsync()
        {
            var httpContext = _httpCtx.HttpContext;
            if (httpContext == null || httpContext.User == null)
            {
                return new List<OpenOrderDto>();
            }

            var userIdStr = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return new List<OpenOrderDto>();
            }

            var openOrders = await _db.Orders
                .Include(o => o.Wallet)
                .Include(o => o.Wallet.Coin)
                .Include(o => o.QuoteCoin)
                .Where(o => o.Wallet.UserId == userId && o.Status == "open")
                .OrderByDescending(o => o.Id)
                .Select(o => new OpenOrderDto(
                    o.Id,
                    $"{o.Wallet.Coin.Abbreviation}/{o.QuoteCoin.Abbreviation}",
                    o.Type,
                    o.Status,
                    o.Price,
                    o.Amount,
                    (o.Price * o.Amount).ToString("F8")
                ))
                .ToListAsync();

            return openOrders;
        }

        public async Task<List<CandleDto>> GetCandlesAsync(string baseSymbol, string quoteSymbol, string interval)
        {
            // 1. Находим Id базовой и квоут монеты
            var allCoins = await _coinRepo.GetAllAsync();
            var baseCoin = allCoins.FirstOrDefault(c => c.Abbreviation.Equals(baseSymbol, StringComparison.OrdinalIgnoreCase));
            var quoteCoin = allCoins.FirstOrDefault(c => c.Abbreviation.Equals(quoteSymbol, StringComparison.OrdinalIgnoreCase));

            if (baseCoin == null || quoteCoin == null)
                throw new ArgumentException("Неверный символ монеты (base или quote не найдены).");

            int baseId = baseCoin.Id;
            int quoteId = quoteCoin.Id;

            // 2. Определяем шаг интервала (в минутах)
            int stepMinutes = interval switch
            {
                "1m" => 1,
                "5m" => 5,
                "15m" => 15,
                "1h" => 60,
                "4h" => 4 * 60,
                "1d" => 24 * 60,
                _ => throw new ArgumentException("Неподдерживаемый интервал свечей.")
            };

            // 3. Сколько свечей отдать (например, 100 последних свечей)
            int candleCount = 100;

            DateTime utcNow = DateTime.UtcNow;
            DateTime startTime = utcNow.AddMinutes(-stepMinutes * candleCount);

            // 4. Вытаскиваем все исполненные sell–ордера для этой пары за период [startTime, utcNow]
            var fulfilledOrders = await _orderRepo.FindAsync(o =>
                o.Status == "fulfilled" &&
                o.Wallet.CoinId == baseId &&
                o.QuoteCoinId == quoteId &&
                o.OrderDate >= startTime
            );

            // 5. Группируем ордера по свечным окнам
            var candles = new List<CandleDto>();
            decimal? prevClose = null;

            // Проходим по каждому оконному интервалу от startTime до utcNow
            DateTime windowStart = startTime;
            for (int i = 0; i < candleCount; i++)
            {
                DateTime windowEnd = windowStart.AddMinutes(stepMinutes);

                var ordersInWindow = fulfilledOrders
                    .Where(o => o.OrderDate >= windowStart && o.OrderDate < windowEnd)
                    .OrderBy(o => o.OrderDate)
                    .ToList();

                decimal open, high, low, close, volume;

                if (ordersInWindow.Any())
                {
                    open = ordersInWindow.First().Price;
                    close = ordersInWindow.Last().Price;
                    high = ordersInWindow.Max(o => o.Price);
                    low = ordersInWindow.Min(o => o.Price);
                    volume = ordersInWindow.Sum(o => o.Amount);
                    prevClose = close;
                }
                else
                {
                    if (prevClose.HasValue)
                    {
                        open = prevClose.Value;
                        high = prevClose.Value;
                        low = prevClose.Value;
                        close = prevClose.Value;
                        volume = 0m;
                    }
                    else
                    {
                        open = 0m;
                        high = 0m;
                        low = 0m;
                        close = 0m;
                        volume = 0m;
                    }
                }

                candles.Add(new CandleDto(windowStart, open, high, low, close, volume));
                windowStart = windowEnd;
            }
            return candles;
        }
    }
}
