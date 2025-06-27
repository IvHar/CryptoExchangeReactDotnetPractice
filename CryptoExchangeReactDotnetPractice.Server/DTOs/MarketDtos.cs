namespace CryptoExchangeReactDotnetPractice.Server.DTOs
{
    public class MarketDtos
    {
        public record OrderRequest(string Base, string Quote, string Side, decimal Price, decimal Amount);

        public record OrderResponse(bool Success, string? Message = null);

        public record TickerDto(decimal Price, decimal Change24h);

        public record OrderBookEntryDto(decimal Price, decimal Amount, decimal Total);

        public record OrderBookDto(List<OrderBookEntryDto> Buys, List<OrderBookEntryDto> Sells);

        public record OpenOrderDto(long Id, string Pair, string Type, string Status, decimal Price, decimal Amount, string Total);

        public record CandleDto(DateTime Timestamp, decimal Open, decimal High, decimal Low, decimal Close, decimal Volume);
    }
}
