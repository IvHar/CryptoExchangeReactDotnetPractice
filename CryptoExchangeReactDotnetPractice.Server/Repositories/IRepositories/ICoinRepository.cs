using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;

public interface ICoinRepository : IRepository<Coin, int>
{
    Task<List<Coin>> GetPopularAsync(int count, CancellationToken ct = default);
    Task<List<Coin>> GetNewListingAsync(int count, CancellationToken ct = default);
    Task<Coin?> GetBySymbolAsync(string symbol, CancellationToken ct = default);
    Task<List<string>> GetSymbolsAsync(CancellationToken ct = default);
    Task<List<Coin>> GetTopTradedAsync(int count, CancellationToken ct = default);
    Task<Coin> AddAsync(Coin coin);
}
