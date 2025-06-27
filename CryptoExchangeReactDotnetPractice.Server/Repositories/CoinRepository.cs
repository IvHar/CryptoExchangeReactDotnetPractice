using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.Models;
using Microsoft.EntityFrameworkCore;

public class CoinRepository : Repository<Coin, int>, ICoinRepository
{
    public CoinRepository(CryptoDbContext db) : base(db) { }

    public async Task<List<Coin>> GetAllAsync() => await _db.Coins.AsNoTracking().ToListAsync();

    public async Task<Coin> AddAsync(Coin coin)
    {
        await _db.Coins.AddAsync(coin);
        await _db.SaveChangesAsync();
        return coin;
    }

    public async Task<List<Coin>> GetPopularAsync(int count, CancellationToken ct = default)
        => await _db.Coins
                    .AsNoTracking()
                    .OrderByDescending(c => c.Capitalization)
                    .Take(count)
                    .ToListAsync(ct);

    public async Task<List<Coin>> GetNewListingAsync(int count, CancellationToken ct = default)
        => await _db.Coins
                    .AsNoTracking()
                    .OrderByDescending(c => c.Id)
                    .Take(count)
                    .ToListAsync(ct);

    public async Task<List<string>> GetSymbolsAsync(CancellationToken ct = default)
            => await _db.Coins
                        .AsNoTracking()
                        .Select(c => c.Abbreviation)
                        .Distinct()
                        .ToListAsync(ct);

    public async Task<Coin?> GetBySymbolAsync(string symbol, CancellationToken ct = default)
            => await _db.Coins
                        .AsNoTracking()
                        .SingleOrDefaultAsync(c => c.Abbreviation == symbol, ct);

    public async Task<List<Coin>> GetTopTradedAsync(int count, CancellationToken ct = default)
    {
        var topVolumes = await _db.Orders
            .AsNoTracking()
            .Where(o => o.Status == "fulfilled")
            .Join(_db.Wallets, o => o.WalletId, w => w.Id, (o, w) => new { w.CoinId, o.Amount })
            .GroupBy(x => x.CoinId)
            .Select(g => new {CoinId = g.Key, Volume = g.Sum(x => x.Amount)})
            .OrderByDescending(x => x.Volume)
            .Take(count)
            .ToListAsync(ct);
        var coinIds = topVolumes.Select(x => x.CoinId).ToList();
        var coins = await _db.Coins
            .AsNoTracking()
            .Where(c => coinIds.Contains(c.Id))
            .ToListAsync(ct);
        return coins.OrderByDescending(c => topVolumes.First(tv => tv.CoinId == c.Id).Volume).ToList();
    }
}
