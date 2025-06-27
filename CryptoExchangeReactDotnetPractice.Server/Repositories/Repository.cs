using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;
using Microsoft.EntityFrameworkCore;

public class Repository<T, TKey> : IRepository<T, TKey> where T : class
{
    protected readonly CryptoDbContext _db;
    public Repository(CryptoDbContext db) => _db = db;

    public async Task<List<T>> GetAllAsync(CancellationToken ct = default)
        => await _db.Set<T>().AsNoTracking().ToListAsync(ct);

    public async Task<T?> GetByIdAsync(TKey id, CancellationToken ct = default)
        => await _db.Set<T>().FindAsync(new object[] { id }, ct);

    public async Task AddAsync(T entity, CancellationToken ct = default)
    {
        await _db.Set<T>().AddAsync(entity, ct);
    }

    public void Update(T entity) => _db.Set<T>().Update(entity);

    public void Remove(T entity) => _db.Set<T>().Remove(entity);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
