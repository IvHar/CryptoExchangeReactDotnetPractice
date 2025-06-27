namespace CryptoExchangeReactDotnetPractice.Server.DTOs
{
    public class WalletTransactionDto
    {
        public string Symbol { get; set; } 
        public decimal Amount { get; set; }
        public decimal Price { get; set; } 
        public string Type { get; set; }   
    }
}
