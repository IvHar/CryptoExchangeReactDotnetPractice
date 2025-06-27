namespace CryptoExchangeReactDotnetPractice.Server.DTOs
{
    public class WalletDto
    {
        public long WalletId { get; set; }
        public int CoinId { get; set; }
        public string CoinSymbol { get; set; } = null!;
        public string CoinName { get; set; } = null!;
        public string? CoinImageUrl { get; set; }
        public string CoinPrice { get; set; } = null!;     
        public string CoinChange24h { get; set; } = null!; 
        public decimal Amount { get; set; }                
    }
}
