using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeReactDotnetPractice.Server.Repositories
{
    public class UserRepository : Repository<User, int>, IUserRepository
    {
        public UserRepository(CryptoDbContext context) : base(context) { }

        public async Task<List<User>> GetAllAsync() =>
            await _db.Users.AsNoTracking().ToListAsync();

        public async Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default) => 
            await _db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Username == username, ct);
    }
}
