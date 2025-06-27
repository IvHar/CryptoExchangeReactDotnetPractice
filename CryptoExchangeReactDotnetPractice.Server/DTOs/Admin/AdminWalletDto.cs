namespace CryptoExchangeReactDotnetPractice.Server.DTOs.Admin
{
    public class AdminWalletDto
    {
        public long WalletId { get; set; }
        public string Username { get; set; } = null!;
        public string CoinSymbol { get; set; } = null!;
        public decimal Amount { get; set; }
    }
}
