using Weft.Domain.Entities;
using Weft.Domain.Settings;

namespace Weft.Infrastructure.Persistence.Seed;

// Starting data for a new database. Fees and prices are placeholders the owner edits in the dashboard.
internal static class SeedData
{
    // 27 governorates. The WEFT prototype charged one flat fee (70 EGP); the owner can change each zone.
    public static IEnumerable<DeliveryZone> DeliveryZones()
    {
        (string Key, string Ar, string En, decimal Fee, int Min, int Max)[] zones =
        [
            ("cairo", "القاهرة", "Cairo", 70, 1, 3),
            ("giza", "الجيزة", "Giza", 70, 1, 3),
            ("alexandria", "الإسكندرية", "Alexandria", 70, 2, 4),
            ("qalyubia", "القليوبية", "Qalyubia", 70, 2, 4),
            ("port-said", "بورسعيد", "Port Said", 70, 2, 4),
            ("suez", "السويس", "Suez", 70, 2, 4),
            ("ismailia", "الإسماعيلية", "Ismailia", 70, 2, 4),
            ("damietta", "دمياط", "Damietta", 70, 2, 4),
            ("dakahlia", "الدقهلية", "Dakahlia", 70, 2, 4),
            ("sharqia", "الشرقية", "Sharqia", 70, 2, 4),
            ("gharbia", "الغربية", "Gharbia", 70, 2, 4),
            ("monufia", "المنوفية", "Monufia", 70, 2, 4),
            ("kafr-el-sheikh", "كفر الشيخ", "Kafr El Sheikh", 70, 2, 4),
            ("beheira", "البحيرة", "Beheira", 70, 2, 4),
            ("faiyum", "الفيوم", "Faiyum", 70, 3, 5),
            ("beni-suef", "بني سويف", "Beni Suef", 70, 3, 5),
            ("minya", "المنيا", "Minya", 70, 3, 5),
            ("asyut", "أسيوط", "Asyut", 70, 3, 6),
            ("sohag", "سوهاج", "Sohag", 70, 3, 6),
            ("qena", "قنا", "Qena", 70, 3, 6),
            ("luxor", "الأقصر", "Luxor", 70, 3, 6),
            ("aswan", "أسوان", "Aswan", 70, 4, 7),
            ("red-sea", "البحر الأحمر", "Red Sea", 70, 4, 7),
            ("new-valley", "الوادي الجديد", "New Valley", 70, 4, 7),
            ("matrouh", "مطروح", "Matrouh", 70, 4, 7),
            ("north-sinai", "شمال سيناء", "North Sinai", 70, 4, 7),
            ("south-sinai", "جنوب سيناء", "South Sinai", 70, 4, 7),
        ];
        return zones.Select(z => new DeliveryZone(z.Key, z.Ar, z.En, z.Fee, z.Min, z.Max));
    }

    // The 8 colours from the WEFT prototype (WEFT-Store-v12 seed.json); English names added.
    public static IEnumerable<Color> Colors() =>
    [
        new("أسود", "Black", "#1d1d1d"),
        new("كريمي", "Cream", "#e8dcc8"),
        new("كحلي", "Navy", "#172c4b"),
        new("زيتي", "Olive", "#475338"),
        new("نبيتي", "Burgundy", "#622b39"),
        new("رمادي", "Gray", "#7c7d7f"),
        new("أزرق", "Blue", "#6695bd"),
        new("وردي", "Pink", "#d6a5ae"),
    ];

    // ---------- WEFT catalog from the prototype's seed.json (only into an empty catalog; the owner edits it later)

    public sealed record SeedCategory(string Slug, string NameAr, string NameEn, int SortOrder);

    // Stock is the prototype's per-product number, put on every size + colour; the owner sets real counts.
    public sealed record SeedProduct(string CategorySlug, string NameAr, string NameEn, string DescriptionAr,
        string DescriptionEn, decimal Price, string[] Sizes, string[] Colors, int StockPerVariant);

    public static IReadOnlyList<SeedCategory> Categories() =>
    [
        new("hoodies", "هوديز", "Hoodies", 0),
    ];

    public static IReadOnlyList<SeedProduct> Products() =>
    [
        new("hoodies", "WEFT Essential Hoodie", "WEFT Essential Hoodie",
            "هودي قطني بقصة مريحة، وشعار WEFT مطرز عند القلب.",
            "A cotton hoodie with a relaxed fit and the WEFT logo embroidered over the heart.",
            1290, ["S", "M", "L", "XL", "XXL"], ["Black", "Cream", "Navy", "Olive", "Burgundy", "Gray"], 12),
        new("hoodies", "WEFT Oversized Hoodie", "WEFT Oversized Hoodie",
            "قصة أوفر سايز عصرية وخامة ثقيلة ناعمة.",
            "A modern oversized fit in a soft, heavyweight fabric.",
            1490, ["M", "L", "XL", "XXL"], ["Black", "Cream", "Blue", "Pink"], 8),
        new("hoodies", "WEFT Signature Hoodie", "WEFT Signature Hoodie",
            "تفاصيل فاخرة وتطريز العلامة على الصدر.",
            "Premium details with the brand embroidered on the chest.",
            1690, ["S", "M", "L", "XL"], ["Black", "Navy", "Burgundy"], 7),
        new("hoodies", "WEFT Everyday Hoodie", "WEFT Everyday Hoodie",
            "هودي يومي بألوان متنوعة وخامة مريحة.",
            "An everyday hoodie in many colours and a comfortable fabric.",
            1190, ["S", "M", "L", "XL", "XXL"], ["Cream", "Olive", "Gray", "Pink"], 15),
    ];
}
