namespace CryptoExchangeReactDotnetPractice.Server.DTOs.Admin
{
    public class AdminUserDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Username { get; set; } = null!;
        public string Role { get; set; } = null!;
    }
}
