using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeReactDotnetPractice.Server.Repositories
{
    public class TransactionRepository : Repository<Transaction, long>, ITransactionRepository
    {
        public TransactionRepository(CryptoDbContext db) : base(db) { }

        public async Task<List<Transaction>> GetAllAsync() =>
           await _db.Transactions.Include(t => t.Sender).ThenInclude(w => w.User).Include(t => t.Receiver)
                .ThenInclude(w => w.User).AsNoTracking().ToListAsync();
    }
}
