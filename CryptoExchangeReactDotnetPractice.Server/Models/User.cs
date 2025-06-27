using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace CryptoExchangeReactDotnetPractice.Server.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("first_name")]
        public string FirstName { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("last_name")]
        public string LastName { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        [Phone]
        public string? Phone { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; }

        [Column("registration_date")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public DateTime RegistrationDate { get; set; }

        [Required]
        [RegularExpression("^(user|admin)$")]
        public string Role { get; set; }
    }
}
