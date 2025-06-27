using CryptoExchangeReactDotnetPractice.Server.Models;
using System.Linq.Expressions;

namespace CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories
{
    public interface IOrderRepository : IRepository<Order, long>
    {
        Task<List<Order>> GetSinceAsync(DateTime since, CancellationToken ct = default);
        Task<Order?> FindMatchingAsync(Order newOrder);
        Task<List<Order>> FindAsync(Expression<Func<Order, bool>> predicate, CancellationToken ct = default);
    }
}
