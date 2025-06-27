namespace CryptoExchangeReactDotnetPractice.Server.DTOs
{
    public class CoinDto
    {
        public int Id { get; set; }
        public string Image { get; set; } = null!;
        public string Symbol { get; set; } = null!;
        public string Name { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal Change24h { get; set; }
        public decimal Volume24h { get; set; }
        public decimal Capitalization { get; set; }
    }
}
