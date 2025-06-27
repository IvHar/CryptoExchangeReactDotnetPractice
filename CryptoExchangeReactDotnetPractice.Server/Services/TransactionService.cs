using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.DTOs.Admin;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeReactDotnetPractice.Server.Services
{
    public class TransactionService
    {
        private readonly CryptoDbContext _db;
        private readonly ITransactionRepository _repo;
        public TransactionService(ITransactionRepository repo, CryptoDbContext db)
        {
            _repo = repo;
            _db = db;
        }

        public async Task<List<AdminTransactionDto>> GetAllAsync()
        {
            var txs = await _db.Transactions
                .Include(t => t.Sender).ThenInclude(w => w.User)
                .Include(t => t.Receiver).ThenInclude(w => w.User)
                .Include(t => t.Sender).ThenInclude(w => w.Coin)
                .Include(t => t.Receiver).ThenInclude(w => w.Coin)
                .AsNoTracking().ToListAsync();

            return txs.Select(t => new AdminTransactionDto
            {
                Id = t.Id,
                Timestamp = t.TransactionTimestamp.ToString("u"),
                Amount = t.Amount,
                CoinSymbol = t.Sender?.Coin?.Abbreviation ?? t.Receiver?.Coin?.Abbreviation,
                Sender = t.Sender?.User?.Username ?? "-",
                Receiver = t.Receiver?.User?.Username ?? "-"
            }).ToList();
        }
    }
}
