namespace Weft.Domain.Common;

// Default stock-keeping unit: WF-{productId}-{size}-{color}, e.g. WF-12-M-BEIGE.
public static class Sku
{
    public static string For(int productId, string size, string colorNameEn) =>
        $"WF-{productId}-{Slug.From(size)}-{Slug.From(colorNameEn)}".ToUpperInvariant();
}
