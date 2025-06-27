using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.DTOs.Admin;
using CryptoExchangeReactDotnetPractice.Server.Models;
using CryptoExchangeReactDotnetPractice.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeReactDotnetPractice.Server.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/coins")]
    [Authorize(Roles = "admin")]
    public class CoinsAdminController : ControllerBase
    {
        private readonly CoinService _service;
        public CoinsAdminController(CoinService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var dtos = await _service.GetAllAdminAsync();
            return Ok(dtos);
        }

        [HttpPost]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> Create([FromForm] CreateCoinDto dto)
        {
            var coin = await _service.CreateCoinAsync(dto);
            return CreatedAtRoute(
                routeName: null,
                routeValues: new { coin.Id },
                value: new
                {
                    coin.Id,
                    coin.CoinName,
                    coin.Abbreviation,
                    Price = $"${coin.Price:N2}",
                    coin.Capitalization,
                    coin.ImageUrl
                });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteCoinAsync(id);
            return NoContent();
        }
    }
}
