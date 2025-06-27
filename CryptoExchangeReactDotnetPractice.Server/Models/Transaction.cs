using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CryptoExchangeReactDotnetPractice.Server.Models
{
    public class Transaction
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }
     
        [Column("sender_id")]
        public long? SenderId { get; set; }
        public Wallet? Sender { get; set; }

        [Column("receiver_id")]
        public long? ReceiverId { get; set; }
        public Wallet? Receiver { get; set; }

        [Column(TypeName = "decimal(28,8)")]
        public decimal Amount { get; set; }

        [Column("transaction_timestamp")]
        public DateTime TransactionTimestamp { get; set; }
    }
}
