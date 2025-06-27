using CryptoExchangeReactDotnetPractice.Server.Models;

namespace CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories
{
    public interface IUserRepository : IRepository<User, int>
    {
        Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default);
    }
}
