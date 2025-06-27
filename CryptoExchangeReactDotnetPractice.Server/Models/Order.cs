using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CryptoExchangeReactDotnetPractice.Server.Models
{
    public class Order
    {

        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("wallet_id")]
        public long WalletId { get; set; }

        [ForeignKey(nameof(WalletId))]
        public virtual Wallet Wallet { get; set; }

        public string Type { get; set; } // buy/sell
        public string Status { get; set; } // open/fulfilled/cancelled

        [Column(TypeName = "decimal(28,8)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(28,8)")]
        public decimal Amount { get; set; }

        [Column("order_date")]
        public DateTime OrderDate { get; set; }

        [Column("quote_coin_id")]
        public int QuoteCoinId { get; set; }

        [ForeignKey(nameof(QuoteCoinId))]
        public Coin QuoteCoin { get; set; }
    }
}
