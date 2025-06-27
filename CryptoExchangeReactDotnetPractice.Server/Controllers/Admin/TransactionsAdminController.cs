using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.DTOs.Admin;
using CryptoExchangeReactDotnetPractice.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeReactDotnetPractice.Server.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/transactions")]
    [Authorize(Roles = "admin")]
    public class TransactionsAdminController : ControllerBase
    {
        private readonly TransactionService _service;
        public TransactionsAdminController(TransactionService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());
    }
}
