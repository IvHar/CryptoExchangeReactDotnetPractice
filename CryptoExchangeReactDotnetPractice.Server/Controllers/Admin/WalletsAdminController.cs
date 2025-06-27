using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.DTOs.Admin;
using CryptoExchangeReactDotnetPractice.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeReactDotnetPractice.Server.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/wallets")]
    [Authorize(Roles = "admin")]
    public class WalletsAdminController : ControllerBase
    {
        private readonly WalletService _service;
        public WalletsAdminController(WalletService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());
    }
}
