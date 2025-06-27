namespace CryptoExchangeReactDotnetPractice.Server.DTOs.Admin
{
    public class AdminTransactionDto
    {
        public long Id { get; set; }
        public string Timestamp { get; set; }
        public decimal Amount { get; set; }
        public string CoinSymbol { get; set; } = default!;
        public string Sender { get; set; } = "-";
        public string Receiver { get; set; } = "-";
    }
}
