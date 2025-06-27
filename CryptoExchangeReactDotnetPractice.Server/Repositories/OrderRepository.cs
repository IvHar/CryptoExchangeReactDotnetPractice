using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace CryptoExchangeReactDotnetPractice.Server.Repositories
{
    public class OrderRepository : Repository<Order, long>, IOrderRepository
    {
        public OrderRepository(CryptoDbContext db) : base(db) { }

        public async Task<List<Order>> GetSinceAsync(DateTime since, CancellationToken ct = default) =>
            await _db.Orders.AsNoTracking().Where(o => o.OrderDate >= since)
                .Include(o => o.Wallet).ToListAsync(ct);

        public async Task<Order?> FindMatchingAsync(Order newOrder)
        {
            var oppositeType = newOrder.Type == "buy" ? "sell" : "buy";
            var match = await _db.Orders
                .Include(o => o.Wallet)
                .Where(o =>
                    o.Type == oppositeType &&
                    o.Status == "open" &&
                    o.Price == newOrder.Price &&
                    o.Wallet.CoinId == newOrder.Wallet.CoinId
                )
                .OrderBy(o => o.OrderDate)
                .FirstOrDefaultAsync();

            return match;
        }

        public async Task<List<Order>> FindAsync(Expression<Func<Order, bool>> predicate, CancellationToken ct = default) =>
            await _db.Orders.Where(predicate).ToListAsync(ct);
    }
}