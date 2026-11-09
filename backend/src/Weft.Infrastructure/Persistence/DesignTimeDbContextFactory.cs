using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Weft.Infrastructure.Persistence;

// Used only by `dotnet ef` (creating migrations, generating SQL). The app itself uses AddInfrastructure.
// Creating a migration never connects, so a placeholder connection string is enough.
// For `dotnet ef database update`, set WEFT_DB to a real connection string.
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<WeftDbContext>
{
    public WeftDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("WEFT_DB")
            ?? "Server=localhost;Database=weft;Trusted_Connection=True;TrustServerCertificate=True";

        var options = new DbContextOptionsBuilder<WeftDbContext>()
            .UseSqlServer(connectionString, sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", WeftDbContext.Schema))
            .Options;
        return new WeftDbContext(options, TimeProvider.System);
    }
}
