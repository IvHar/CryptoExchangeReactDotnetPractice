namespace CryptoExchangeReactDotnetPractice.Server.DTOs.Admin
{
    public class UpdateUserRoleDto
    {
        public int UserId { get; set; }
        public string Role { get; set; } = null!;
    }
}
