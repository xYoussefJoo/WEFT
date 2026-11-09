using Microsoft.EntityFrameworkCore;
using Weft.Domain.Entities;
using Weft.Infrastructure.Identity;
using Weft.Infrastructure.Persistence;
using Weft.Infrastructure.Persistence.Seed;

namespace Weft.Tests.Infrastructure;

public class SeedDataTests
{
    [Fact]
    public void There_are_27_governorates_with_unique_keys()
    {
        var zones = SeedData.DeliveryZones().ToList();

        Assert.Equal(27, zones.Count);
        Assert.Equal(27, zones.Select(z => z.Key).Distinct().Count());
    }

    [Fact]
    public void Eight_valid_colors_from_the_weft_prototype() => Assert.Equal(8, SeedData.Colors().Count());

    [Fact]
    public void Seeded_products_use_known_colors_and_categories()
    {
        var colors = SeedData.Colors().Select(c => c.NameEn).ToHashSet();
        var categories = SeedData.Categories().Select(c => c.Slug).ToHashSet();
        var products = SeedData.Products();

        Assert.Equal(4, products.Count);
        Assert.All(products, p => Assert.Contains(p.CategorySlug, categories));
        Assert.All(products.SelectMany(p => p.Colors), c => Assert.Contains(c, colors));
    }
}

public class DatabaseModelTests
{
    // Builds the real EF model and the SQL it would create, without needing a database.
    private static string CreateScript()
    {
        var options = new DbContextOptionsBuilder<WeftDbContext>().UseSqlServer("Server=localhost;Database=model-only").Options;
        using var db = new WeftDbContext(options, TimeProvider.System);
        return db.Database.GenerateCreateScript();
    }

    [Fact]
    public void Schema_has_the_expected_shape()
    {
        var sql = CreateScript();

        Assert.Contains("CREATE SEQUENCE [weft].[OrderNumbers] START WITH 10001", sql);          // order numbers
        Assert.Contains("[CustomerName] nvarchar(100) NOT NULL", sql);                    // value object columns
        Assert.Contains("[Content] nvarchar(max) NOT NULL", sql);                         // JSON documents
        Assert.Contains("[Status] nvarchar(30) NOT NULL", sql);                           // enums as text
        Assert.Contains("decimal(18,2)", sql);                                            // money
        Assert.Contains("WHERE [IsDeleted] = 0", sql);                                    // one active size+color
        Assert.Contains("CREATE TABLE [weft].[AspNetUsers]", sql);                        // Identity
        Assert.Contains("CREATE TABLE [weft].[DataProtectionKeys]", sql);
        Assert.Contains("[Version] rowversion NOT NULL", sql);                            // optimistic concurrency
    }

    [Fact]
    public void A_variant_that_was_ordered_cannot_be_hard_deleted()
    {
        Assert.Contains("REFERENCES [weft].[ProductVariants] ([Id]) ON DELETE NO ACTION", CreateScript());
    }
}

public class CommonPasswordValidatorTests
{
    private static async Task<bool> IsAccepted(string password, string email = "owner@weft.com") =>
        (await new CommonPasswordValidator().ValidateAsync(null!, new AppUser { Email = email }, password)).Succeeded;

    [Theory]
    [InlineData("1234567890")]
    [InlineData("Password123")]
    [InlineData("weft2026!")]
    [InlineData("owner-secret-1")] // contains the email name
    public async Task Easy_passwords_are_refused(string password) => Assert.False(await IsAccepted(password));

    [Fact]
    public async Task A_long_unusual_password_is_accepted() => Assert.True(await IsAccepted("blue tailor cactus 77"));
}

public class DatabaseSchemaTests
{
    [Fact]
    public void Nothing_is_created_in_the_dbo_schema()
    {
        // WEFT tables live in their own schema, so they are easy to tell apart on a shared server.
        var options = new DbContextOptionsBuilder<WeftDbContext>().UseSqlServer("Server=localhost;Database=model-only").Options;
        using var db = new WeftDbContext(options, TimeProvider.System);
        var sql = db.Database.GenerateCreateScript();

        Assert.Contains("CREATE SCHEMA [weft]", sql);
        Assert.DoesNotContain("CREATE TABLE [dbo]", sql);
        Assert.DoesNotContain("CREATE TABLE [AspNet", sql); // every table is schema-qualified
    }
}
