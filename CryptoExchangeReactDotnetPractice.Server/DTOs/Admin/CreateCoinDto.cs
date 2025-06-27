using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Http;

namespace CryptoExchangeReactDotnetPractice.Server.DTOs.Admin
{
    public class CreateCoinDto
    {
        public string Name { get; set; } = null!;
        public string Symbol { get; set; } = null!;
        public decimal InitialPrice { get; set; }
        public decimal Capitalization { get; set; }
        public IFormFile Image { get; set; } = null!;
    }
}
