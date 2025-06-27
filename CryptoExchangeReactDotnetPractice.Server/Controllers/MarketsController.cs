using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static CryptoExchangeReactDotnetPractice.Server.DTOs.MarketDtos;

namespace CryptoExchangeReactDotnetPractice.Server.Controllers
{
    [ApiController]
    [Route("api/markets")]
    public class MarketsController : ControllerBase
    {
        private readonly MarketService _marketService;
        private readonly CoinService _coinService;

        public MarketsController(MarketService marketService, CoinService coinService)
        {
            _marketService = marketService;
            _coinService = coinService;
        }

        [HttpGet("orderbook")]
        public async Task<IActionResult> GetOrderBook([FromQuery] string @base, [FromQuery] string quote)
        {
            if (string.IsNullOrWhiteSpace(@base) || string.IsNullOrWhiteSpace(quote))
                return BadRequest("Both 'base' and 'quote' parameters are required.");

            try
            {
                var book = await _marketService.GetOrderBookAsync(@base, quote);
                return Ok(book);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("place")]
        [Authorize]
        public async Task<IActionResult> Place([FromBody] OrderRequest req)
        {
            if (req == null) return BadRequest("OrderRequest is null.");

            var res = await _marketService.PlaceOrderAsync(req);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPost("order/{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> Cancel(long id)
        {
            var res = await _marketService.CancelOrderAsync(id);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpGet("myorders")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders()
        {
            if (!User.Identity.IsAuthenticated)
                return Unauthorized();
            var res = await _marketService.GetOpenOrdersForCurrentUserAsync();
            return Ok(res);
        }

        [HttpGet("{baseSymbol}/{quoteSymbol}/ticker")]
        public async Task<IActionResult> GetTicker(string baseSymbol, string quoteSymbol)
        {
            try
            {
                var ticker = await _coinService.GetTickerAsync(baseSymbol, quoteSymbol);
                if (ticker == null) return BadRequest(new { error = "Монета не найдена" });

                return Ok(ticker);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Внутренняя ошибка сервера: " + ex.Message });
            }
        }

        [HttpGet("{baseSymbol}/{quoteSymbol}/candles")]
        public async Task<IActionResult> GetCandles(string baseSymbol, string quoteSymbol, [FromQuery] string interval)
        {
            try
            {
                var candles = await _marketService.GetCandlesAsync(baseSymbol, quoteSymbol, interval);
                return Ok(candles);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Внутренняя ошибка сервера: " + ex.Message });
            }
        }
    }
}
