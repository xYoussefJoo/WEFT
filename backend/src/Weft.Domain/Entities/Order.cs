using Weft.Domain.Common;
using Weft.Domain.Constants;
using Weft.Domain.Enums;
using Weft.Domain.Exceptions;
using Weft.Domain.ValueObjects;

namespace Weft.Domain.Entities;

public class Order : Entity
{
    public const int MaxLines = 30;

    // Every move the owner may make (docs/API-CONTRACT.md, Appendix A).
    private static readonly Dictionary<OrderStatus, OrderStatus[]> OwnerMoves = new()
    {
        [OrderStatus.PendingConfirmation] = [OrderStatus.Confirmed, OrderStatus.Cancelled],
        [OrderStatus.Confirmed] = [OrderStatus.Packing, OrderStatus.Cancelled],
        [OrderStatus.Packing] = [OrderStatus.Shipped],
        [OrderStatus.Shipped] = [OrderStatus.Delivered],
    };

    private readonly List<OrderLine> _lines = [];
    private readonly List<OrderStatusHistory> _history = [];

    public string Number { get; private set; } = null!;            // WF-10234
    public string TrackingTokenHash { get; private set; } = null!; // the token itself is never stored
    public OrderStatus Status { get; private set; }

    public CustomerInfo Customer { get; private set; } = null!;
    public int DeliveryZoneId { get; private set; }

    public decimal Subtotal { get; private set; }
    public decimal DeliveryFee { get; private set; }
    public decimal Total { get; private set; }
    public PaymentMethod PaymentMethod { get; private set; }
    public PaymentStatus PaymentStatus { get; private set; }

    public IReadOnlyCollection<OrderLine> Lines => _lines;
    public IReadOnlyCollection<OrderStatusHistory> History => _history;

    private Order() { } // EF Core

    private Order(string number, string trackingTokenHash, CustomerInfo customer, int deliveryZoneId, decimal deliveryFee)
    {
        Number = Guard.Required(number, "Order number", 20);
        TrackingTokenHash = Guard.Required(trackingTokenHash, "Tracking token hash", 128);
        Customer = customer ?? throw new DomainException(ErrorCodes.Validation, "Customer details are required.");
        DeliveryZoneId = Guard.Positive(deliveryZoneId, "Delivery zone");
        DeliveryFee = Guard.Money(deliveryFee, "Delivery fee", allowZero: true);
        PaymentMethod = PaymentMethod.CashOnDelivery;
        PaymentStatus = PaymentStatus.Unpaid;
    }

    // ---------- create

    // Lines come already priced and reserved by the application.
    public static Order CreateReady(string number, string trackingTokenHash, CustomerInfo customer,
        int deliveryZoneId, decimal deliveryFee, IReadOnlyCollection<OrderLineDraft> lines, DateTime now)
    {
        if (lines.Count is 0 or > MaxLines)
            throw new DomainException(ErrorCodes.Validation, $"An order needs between 1 and {MaxLines} items.");
        if (lines.Select(l => l.VariantId).Distinct().Count() != lines.Count)
            throw new DomainException(ErrorCodes.Validation, "Each variant may appear only once; merge the quantities.");

        var order = new Order(number, trackingTokenHash, customer, deliveryZoneId, deliveryFee);
        order._lines.AddRange(lines.Select(l => new OrderLine(l)));
        order.SetSubtotal(order._lines.Sum(l => l.LineTotal));
        order.Record(OrderStatus.PendingConfirmation, null, null, now);
        return order;
    }

    // ---------- owner actions

    // Returns the stock to give back when the order is cancelled (empty otherwise).
    public IReadOnlyList<StockReturn> ChangeStatus(OrderStatus to, string? changedByUserId, string? note, DateTime now)
    {
        if (!OwnerMoves.TryGetValue(Status, out var allowed) || !allowed.Contains(to))
            throw new DomainException(ErrorCodes.InvalidStatusTransition, $"An order can't move from {Status} to {to}.");

        Record(to, changedByUserId, note, now);
        if (to == OrderStatus.Delivered) PaymentStatus = PaymentStatus.Paid; // cash collected at the door

        return to == OrderStatus.Cancelled
            ? _lines.Select(l => new StockReturn(l.VariantId, l.Quantity)).ToList()
            : [];
    }

    // A fresh private link (e.g. to resend on WhatsApp). The old link stops working.
    public void ReplaceTrackingToken(string trackingTokenHash) =>
        TrackingTokenHash = Guard.Required(trackingTokenHash, "Tracking token hash", 128);

    // ---------- helpers

    private void SetSubtotal(decimal subtotal)
    {
        Subtotal = subtotal;
        Total = subtotal + DeliveryFee;
    }

    private void Record(OrderStatus to, string? changedByUserId, string? note, DateTime now)
    {
        var from = _history.Count == 0 ? (OrderStatus?)null : Status;
        _history.Add(new OrderStatusHistory(from, to, changedByUserId, Guard.Optional(note, "Note", 500), now));
        Status = to;
    }
}
