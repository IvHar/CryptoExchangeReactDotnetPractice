using CryptoExchangeReactDotnetPractice.Server.Models;

namespace CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories
{
    public interface IWalletRepository : IRepository<Wallet, long>
    {
        Task<Wallet?> GetByUserAndCoinAsync(int userId, int coinId);
        Task<List<Wallet>> GetByUserIdAsync(int userId);
    }
}
