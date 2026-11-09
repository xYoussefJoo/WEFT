using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Weft.Application.Common;
using Weft.Application.Orders;
using Weft.Infrastructure.Persistence;

namespace Weft.Infrastructure.Orders;

// Reads the next number from the SQL Server sequence: unique even when two orders arrive at the same moment.
// Runs on the same connection/transaction as the checkout. A rolled-back checkout leaves a gap, which is fine.
public sealed class OrderNumberGenerator(WeftDbContext db) : IOrderNumberGenerator
{
    public async Task<string> NextAsync(CancellationToken cancellationToken)
    {
        var next = await db.Database
            .SqlQueryRaw<long>($"SELECT NEXT VALUE FOR [{WeftDbContext.Schema}].[{WeftDbContext.OrderNumberSequence}] AS [Value]")
            .SingleAsync(cancellationToken);
        return $"WF-{next}";
    }
}

public sealed class UserDirectory(WeftDbContext db) : IUserDirectory
{
    public async Task<IReadOnlyDictionary<string, string>> NamesAsync(IEnumerable<string> userIds, CancellationToken cancellationToken)
    {
        var ids = userIds.ToList();
        if (ids.Count == 0) return new Dictionary<string, string>();
        return await db.Users.AsNoTracking().Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => string.IsNullOrWhiteSpace(u.FullName) ? u.Email ?? "Owner" : u.FullName, cancellationToken);
    }
}

// "Site:PublicUrl" is the Next.js website (http://localhost:3000 in development, the shop's domain in production).
public sealed class SiteLinks(IConfiguration configuration) : ISiteLinks
{
    private string Base => (configuration["Site:PublicUrl"] ?? "http://localhost:3000").TrimEnd('/');

    public string TrackingPage(string orderNumber, string trackingToken) =>
        $"{Base}/track/{Uri.EscapeDataString(orderNumber)}?t={Uri.EscapeDataString(trackingToken)}";

    public string AdminOrderPage(int orderId) => $"{Base}/admin/orders/{orderId}";
}
