using CryptoExchangeReactDotnetPractice.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeReactDotnetPractice.Server.Data
{
    public class CryptoDbContext : DbContext
    {
        public CryptoDbContext(DbContextOptions<CryptoDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Coin> Coins { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Transaction> Transactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username).IsUnique();

            modelBuilder.Entity<User>().HasCheckConstraint("CHK_AtLeastOneContact", "[Email] IS NOT NULL OR [Phone] IS NOT NULL");

            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>()
                .HasDefaultValue("user");

            modelBuilder.Entity<Transaction>(eb =>
            {
                eb.ToTable("transaction_history");
                eb.HasKey(t => new { t.Id });
                eb.Property(t => t.Id).HasColumnName("id").ValueGeneratedOnAdd();
                eb.Property(t => t.SenderId).HasColumnName("sender_id");
                eb.Property(t => t.ReceiverId).HasColumnName("receiver_id");
                eb.Property(t => t.Amount).HasColumnName("amount");
                eb.Property(t => t.TransactionTimestamp).HasColumnName("transaction_timestamp");
            });

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Sender)
                .WithMany(w => w.SentTransactions)
                .HasForeignKey(t => t.SenderId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Receiver)
                .WithMany(w => w.ReceivedTransactions)
                .HasForeignKey(t => t.ReceiverId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Coin>(eb =>
            {
                eb.ToTable("coins");
                eb.HasKey(c => c.Id);
                eb.Property(c => c.Id).HasColumnName("id");
                eb.Property(c => c.CoinName).HasColumnName("coin_name").IsRequired();
                eb.Property(c => c.Abbreviation).HasColumnName("abbreviation").IsRequired();
                eb.Property(c => c.Price).HasColumnName("price");
                eb.Property(c => c.Capitalization).HasColumnName("capitalization");
                eb.Property(c => c.ImageUrl).HasColumnName("image_url").IsRequired();
                eb.HasIndex(c => c.ImageUrl).IsUnique();
            });

            modelBuilder.Entity<Wallet>().HasKey(w => w.Id);
        }
    }

}
