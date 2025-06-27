using CryptoExchangeReactDotnetPractice.Server.DTOs.Admin;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Repositories.IRepositories;

namespace CryptoExchangeReactDotnetPractice.Server.Services
{
    public class UserService
    {
        private readonly IRepository<User, int> _repo;
        public UserService(IRepository<User, int> repo) => _repo = repo;

        public Task AddAsync(User user) => _repo.AddAsync(user);
        public bool CheckPassword(string password, string passwordHash) => password == passwordHash;

        public async Task<List<AdminUserDto>> GetAllUsersAsync()
        {
            var users = await _repo.GetAllAsync();
            return users.Select(u => new AdminUserDto
            {
                Id = u.Id, Username = u.Username, FirstName = u.FirstName, LastName = u.LastName,
                Email = u.Email, Phone = u.Phone, Role = u.Role
            }).ToList();
        }

        public async Task<bool> AssignRoleAsync(int id, UpdateUserRoleDto dto)
        {
            var user = await _repo.GetByIdAsync(id);
            if (user is null) return false;
            user.Role = dto.Role;
            _repo.Update(user);
            await _repo.SaveChangesAsync();
            return true;
        }
    }
}