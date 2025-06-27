namespace CryptoExchangeReactDotnetPractice.Server.DTOs.Admin
{
    public class AdminCoinDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Symbol { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal Capitalization { get; set; }
        public string? ImageUrl { get; set; }
    }
}
