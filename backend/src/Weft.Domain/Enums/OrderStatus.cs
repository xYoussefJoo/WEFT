namespace Weft.Domain.Enums;

public enum OrderStatus
{
    PendingConfirmation,
    Confirmed,
    AwaitingQuote,
    QuoteSent,
    QuoteApproved,
    InProduction,
    QualityCheck,
    Packing,
    Shipped,
    Delivered,
    Cancelled
}
