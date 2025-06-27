using CryptoExchangeReactDotnetPractice.Server.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Data.SqlClient;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeReactDotnetPractice.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly CryptoDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(CryptoDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) && string.IsNullOrWhiteSpace(req.Phone))
                return BadRequest("Email or phone must be provided");

            if (await _context.Users.AnyAsync(u => u.Username == req.Username))
                return Conflict("Username already exists");

            if (!string.IsNullOrWhiteSpace(req.Email))
            {
                if (await _context.Users.AnyAsync(u => u.Email == req.Email))
                    return Conflict("Email already exists");
            }

            if (!string.IsNullOrWhiteSpace(req.Phone))
            {
                if (await _context.Users.AnyAsync(u => u.Phone == req.Phone))
                    return Conflict("Phone already exists");
            }

            var user = new User
            {
                FirstName = req.FirstName,
                LastName = req.LastName,
                Email = req.Email,
                Phone = req.Phone,
                Username = req.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role = "user"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok("User registered successfully");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest req)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == req.Identifier || u.Email == req.Identifier || u.Phone == req.Identifier);

            if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.Password))
                return Unauthorized("Invalid credentials");

            var token = GenerateJwtToken(user);
            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id, username = user.Username, firstName = user.FirstName, lastName = user.LastName, email = user.Email, phone = user.Phone, role = user.Role
                }
            });
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(int.Parse(_config["Jwt:ExpiresInMinutes"])),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
