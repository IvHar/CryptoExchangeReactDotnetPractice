using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using CryptoExchangeReactDotnetPractice.Server.Data;

namespace CryptoExchangeReactDotnetPractice.Server.Controllers
{
    [ApiController]
    [Route("api/admin/db")]
    [Authorize(Roles = "admin")]
    public class BackupController : ControllerBase
    {
        private readonly CryptoDbContext _db;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;

        public BackupController(IConfiguration configuration, IWebHostEnvironment env, CryptoDbContext db)
        {
            _configuration = configuration;
            _env = env;
            _db = db;
        }

        [HttpGet("backup/download")]
        public IActionResult DownloadBackup()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var backupFileName = $"crypto_db_{timestamp}.bak";
            var backupDir = Path.Combine(_env.ContentRootPath, "DbBackups");
            if (!Directory.Exists(backupDir)) Directory.CreateDirectory(backupDir);

            var fullPath = Path.Combine(backupDir, backupFileName);

            var databaseName = _db.Database.GetDbConnection().Database;
            var sql = $@"
                BACKUP DATABASE [{databaseName}]
                TO DISK = N'{fullPath}'
                WITH INIT, NAME = N'Full backup of {databaseName}';";
            _db.Database.ExecuteSqlRaw(sql);

            var fileBytes = System.IO.File.ReadAllBytes(fullPath);
            return File(fileBytes, "application/octet-stream", backupFileName);
        }

        [HttpPost("restore")]
        public IActionResult RestoreDatabase([FromForm] IFormFile backupFile)
        {
            if (backupFile == null || Path.GetExtension(backupFile.FileName).ToLower() != ".bak")
                return BadRequest(new { success = false, error = "Неправильный файл. Ожидается .bak" });
            try
            {
                var tempFolder = Path.Combine(_env.ContentRootPath, "DbBackups");
                if (!Directory.Exists(tempFolder)) Directory.CreateDirectory(tempFolder);

                var filePath = Path.Combine(tempFolder, backupFile.FileName);
                using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
                {
                    backupFile.CopyTo(stream);
                }

                var dbName = _db.Database.GetDbConnection().Database;
                if (string.IsNullOrWhiteSpace(dbName)) dbName = "crypto_db";

                var originalConn = _configuration.GetConnectionString("DefaultConnection");
                if (string.IsNullOrEmpty(originalConn))
                    throw new Exception("Connection string 'DefaultConnection' не найдена.");

                var builder = new SqlConnectionStringBuilder(originalConn)
                {
                    InitialCatalog = "master"
                };
                var masterConnectionString = builder.ConnectionString;
                var restoreSql = $@"
                    ALTER DATABASE [{dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    RESTORE DATABASE [{dbName}] 
                        FROM DISK = N'{filePath}' 
                        WITH REPLACE;
                    ALTER DATABASE [{dbName}] SET MULTI_USER;";

                using (var conn = new SqlConnection(masterConnectionString))
                {
                    conn.Open();
                    using (var cmd = new SqlCommand(restoreSql, conn))
                    {
                        cmd.CommandTimeout = 60 * 10;
                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }
}
