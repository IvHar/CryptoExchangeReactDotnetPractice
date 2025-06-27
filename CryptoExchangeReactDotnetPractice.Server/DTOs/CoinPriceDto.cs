namespace CryptoExchangeReactDotnetPractice.Server.DTOs
{
    public class CoinPriceDto
    {
        public string Symbol { get; set; } = null!;
        public decimal Price { get; set; }
    }
}
