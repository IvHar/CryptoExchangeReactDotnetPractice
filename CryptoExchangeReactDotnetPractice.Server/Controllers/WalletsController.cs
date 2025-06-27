using CryptoExchangeReactDotnetPractice.Server.DTOs;
using CryptoExchangeReactDotnetPractice.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CryptoExchangeReactDotnetPractice.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WalletsController : ControllerBase
    {
        private readonly WalletService _walletService;
        public WalletsController(WalletService ws) => _walletService = ws;

        [HttpPost("buyCrypto")]
        public async Task<IActionResult> buyCrypro([FromBody] WalletTransactionDto dto)
        {
            var success = await _walletService.ApplyTransactionAsync(dto);
            if (!success) return BadRequest("Not enough balance or wallet not found");
            return Ok();
        }

        [HttpGet]
        public async Task<IActionResult> GetMyWallets()
        {
            var dtos = await _walletService.GetWalletsForCurrentUserAsync();
            return Ok(dtos);
        }

    }
}
