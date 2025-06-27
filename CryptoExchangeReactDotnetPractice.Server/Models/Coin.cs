using System.ComponentModel.DataAnnotations.Schema;

namespace CryptoExchangeReactDotnetPractice.Server.Models
{
    public class Coin
    {
        public int Id { get; set; }
        public string CoinName { get; set; }
        public string Abbreviation { get; set; }

        [Column(TypeName = "decimal(28,8)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Capitalization { get; set; }
        public string ImageUrl { get; set; }
    }
}
