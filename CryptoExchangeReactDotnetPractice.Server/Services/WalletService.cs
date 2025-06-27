using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.DTOs;
using CryptoExchangeReactDotnetPractice.Server.DTOs.Admin;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CryptoExchangeReactDotnetPractice.Server.Services
{
    public class WalletService
    {
        private readonly ICoinRepository _coinRepo;
        private readonly IWalletRepository _walletRepo;
        private readonly CoinService _coinService;
        private readonly CryptoDbContext _db;
        private readonly IHttpContextAccessor _httpCtx;

        public WalletService(
            ICoinRepository coinRepo,
            IWalletRepository walletRepo,
            CoinService coinService,
            CryptoDbContext db,
            IHttpContextAccessor httpCtx)
        {
            _coinRepo = coinRepo;
            _walletRepo = walletRepo;
            _coinService = coinService;
            _db = db;
            _httpCtx = httpCtx;
        }

        private int CurrentUserId =>
           int.Parse(_httpCtx.HttpContext!.User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? throw new InvalidOperationException("User not authenticated"));

        public async Task<List<AdminWalletDto>> GetAllAsync()
        {
            var wallets = await _db.Wallets
                .Include(w => w.User)
                .Include(w => w.Coin)
                .AsNoTracking()
                .ToListAsync();

            return wallets.Select(w => new AdminWalletDto
            {
                WalletId = w.Id,
                Username = w.User.Username,
                CoinSymbol = w.Coin.Abbreviation,
                Amount = w.CoinAmount
            }).ToList();
        }

        public async Task<bool> ApplyTransactionAsync(WalletTransactionDto dto)
        {
            await using var txScope = await _db.Database.BeginTransactionAsync();
            try
            {
                var coin = await _coinRepo.GetBySymbolAsync(dto.Symbol);
                if (coin == null) return false;

                var userId = CurrentUserId;
                var wallet = await _walletRepo.GetByUserAndCoinAsync(userId, coin.Id);

                if (wallet == null)
                {
                    if (dto.Type != "buy") return false;

                    wallet = new Wallet
                    {
                        UserId = userId,
                        CoinId = coin.Id,
                        CoinAmount = dto.Amount
                    };
                    await _walletRepo.AddAsync(wallet);
                }
                else
                {
                    var newAmount = dto.Type == "buy"
                        ? wallet.CoinAmount + dto.Amount
                        : wallet.CoinAmount - dto.Amount;

                    if (newAmount < 0) return false;
                    wallet.CoinAmount = newAmount;
                    _walletRepo.Update(wallet);
                }
                await _db.SaveChangesAsync();

                var history = new Transaction
                {
                    Amount = dto.Amount,
                    TransactionTimestamp = DateTime.UtcNow,
                    SenderId = dto.Type == "withdraw" ? wallet.Id : null,
                    ReceiverId = dto.Type == "buy" ? wallet.Id : null,
                };
                await _db.Transactions.AddAsync(history);
                await _db.SaveChangesAsync();
                await txScope.CommitAsync();
                return true;
            }
            catch
            {
                await txScope.RollbackAsync();
                throw;
            }
        }

        public async Task<List<WalletDto>> GetWalletsForCurrentUserAsync()
        {
            var userId = CurrentUserId;
            var wallets = await _walletRepo.GetByUserIdAsync(userId);

            var result = new List<WalletDto>(wallets.Count);
            foreach (var w in wallets)
            {
                var coin = await _coinRepo.GetByIdAsync(w.CoinId);
                if (coin == null) continue;
                var (pct, vol) = await _coinService.GetStatsForCoinAsync(coin.Id);

                result.Add(new WalletDto {
                    WalletId = w.Id, CoinId = coin.Id, CoinSymbol = coin.Abbreviation, CoinName = coin.CoinName,
                    CoinImageUrl = coin.ImageUrl, CoinPrice = $"${coin.Price:N2}", CoinChange24h = $"{pct:+0.00;-0.00}%", Amount = w.CoinAmount
                });
            }
            return result;
        }
    }
}
