using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeReactDotnetPractice.Server.Repositories
{
    public class WalletRepository : Repository<Wallet, long>, IWalletRepository
    {
        public WalletRepository(CryptoDbContext db) : base(db) { }

        public async Task<List<Wallet>> GetAllAsync() => await _db.Wallets
                .AsNoTracking().Include(w => w.User).Include(w => w.Coin).ToListAsync();

        public async Task<Wallet?> GetByUserAndCoinAsync(int userId, int coinId) => await _db.Wallets
                .FirstOrDefaultAsync(w => w.UserId == userId && w.CoinId == coinId);

        public async Task<List<Wallet>> GetByUserIdAsync(int userId) => await _db.Wallets
                .AsNoTracking().Where(w => w.UserId == userId).ToListAsync();
    }
}
