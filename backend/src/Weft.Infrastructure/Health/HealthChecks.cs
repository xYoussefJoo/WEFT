using Microsoft.Extensions.Diagnostics.HealthChecks;
using Weft.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Weft.Infrastructure.Health;

public static class HealthCheckNames
{
    public const string Database = "db";
    public const string Storage = "storage";
}

// Can we open a connection and run a query? Without the database nothing works: Unhealthy (503).
internal sealed class DatabaseHealthCheck(WeftDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            return await db.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Cannot connect to the database.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database check failed.", ex);
        }
    }
}

// Can we read the photo table? Without it only photos fail, so the site is Degraded, not down.
internal sealed class StorageHealthCheck(WeftDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            await db.ImageFiles.Select(i => i.Key).FirstOrDefaultAsync(cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Degraded("Storage check failed.", ex);
        }
    }
}
