using Microsoft.AspNetCore.Mvc;
using CryptoExchangeReactDotnetPractice.Server.Services;
using CryptoExchangeReactDotnetPractice.Server.DTOs;
using CryptoExchangeReactDotnetPractice.Server.Models;

namespace CryptoExchangeReactDotnetPractice.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoinsController : ControllerBase
    {
        private readonly CoinService _service;
        public CoinsController(CoinService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var coins = await _service.GetAllAsync();
            var dtos = new List<CoinDto>(coins.Count);
            foreach (var c in coins)
                dtos.Add(await ToDtoAsync(c));
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var coin = await _service.GetByIdAsync(id);
            if (coin == null) return NotFound();
            return Ok(await ToDtoAsync(coin));
        }

        [HttpGet("popular")]
        public async Task<IActionResult> GetPopular([FromQuery] int count)
        {
            var coins = await _service.GetPopularAsync(count);
            var dtos = new List<CoinDto>(coins.Count);
            foreach (var c in coins)
                dtos.Add(await ToDtoAsync(c));
            return Ok(dtos);
        }

        [HttpGet("newListing")]
        public async Task<IActionResult> GetNewListing([FromQuery] int count)
        {
            var coins = await _service.GetNewListingAsync(count);
            var dtos = new List<CoinDto>(coins.Count);
            foreach (var c in coins)
                dtos.Add(await ToDtoAsync(c));
            return Ok(dtos);
        }

        [HttpGet("topTraded")]
        public async Task<IActionResult> GetTopTraded([FromQuery] int count)
        {
            var coins = await _service.GetTopTradedAsync(count);
            var dtos = new List<CoinDto>(coins.Count);
            foreach (var c in coins)
                dtos.Add(await ToDtoAsync(c));
            return Ok(dtos);
        }

        [HttpGet("topGainers")]
        public async Task<IActionResult> GetTopGainers([FromQuery] int count)
        {
            var coins = await _service.GetTopGainersAsync(count);
            var dtos = new List<CoinDto>(coins.Count);
            foreach (var c in coins)
                dtos.Add(await ToDtoAsync(c));
            return Ok(dtos);
        }

        [HttpGet("symbols")]
        public async Task<IActionResult> GetSymbols()
        {
            var symbols = await _service.GetSymbolsAsync();
            return Ok(symbols);
        }

        [HttpGet("price")]
        public async Task<IActionResult> GetBySymbol([FromQuery] string symbol)
        {
            var coin = await _service.GetBySymbolAsync(symbol);
            if (coin == null) return NotFound();
            return Ok(new CoinPriceDto { Symbol = coin.Abbreviation, Price = coin.Price });
        }

        private async Task<CoinDto> ToDtoAsync(Coin c)
        {
            var (pct, vol) = await _service.GetStatsForCoinAsync(c.Id);
            return new CoinDto
            {
                Id = c.Id,
                Image = c.ImageUrl,
                Symbol = c.Abbreviation,
                Name = c.CoinName,
                Price = c.Price,
                Change24h = Math.Round(pct, 2),
                Volume24h = Math.Round(vol, 2),
                Capitalization = c.Capitalization
            };
        }
    }
}
