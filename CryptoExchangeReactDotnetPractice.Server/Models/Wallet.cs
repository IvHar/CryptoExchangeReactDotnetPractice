using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CryptoExchangeReactDotnetPractice.Server.Models
{
    public class Wallet
    {
        [Key]
        public long Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; }


        [Column("coin_id")]
        public int CoinId { get; set; }

        [ForeignKey(nameof(CoinId))]
        public virtual Coin Coin { get; set; }

        [Column("coin_amount", TypeName = "decimal(28,8)")]
        public decimal CoinAmount { get; set; }

        public virtual ICollection<Order> Orders { get; set; }
        public ICollection<Transaction> SentTransactions { get; set; } = new List<Transaction>();
        public ICollection<Transaction> ReceivedTransactions { get; set; } = new List<Transaction>();
    }
}
