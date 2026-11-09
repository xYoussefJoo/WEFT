using Weft.Domain.Entities;
using Weft.Domain.Settings;

namespace Weft.Infrastructure.Persistence.Seed;

// Starting data for a new database. Fees and prices are placeholders the owner edits in the dashboard.
internal static class SeedData
{
    // 27 governorates. Fee / delivery days are starting values to confirm with the client.
    public static IEnumerable<DeliveryZone> DeliveryZones()
    {
        (string Key, string Ar, string En, decimal Fee, int Min, int Max)[] zones =
        [
            ("cairo", "القاهرة", "Cairo", 65, 1, 3),
            ("giza", "الجيزة", "Giza", 65, 1, 3),
            ("alexandria", "الإسكندرية", "Alexandria", 75, 2, 4),
            ("qalyubia", "القليوبية", "Qalyubia", 70, 2, 4),
            ("port-said", "بورسعيد", "Port Said", 80, 2, 4),
            ("suez", "السويس", "Suez", 80, 2, 4),
            ("ismailia", "الإسماعيلية", "Ismailia", 80, 2, 4),
            ("damietta", "دمياط", "Damietta", 80, 2, 4),
            ("dakahlia", "الدقهلية", "Dakahlia", 80, 2, 4),
            ("sharqia", "الشرقية", "Sharqia", 80, 2, 4),
            ("gharbia", "الغربية", "Gharbia", 80, 2, 4),
            ("monufia", "المنوفية", "Monufia", 80, 2, 4),
            ("kafr-el-sheikh", "كفر الشيخ", "Kafr El Sheikh", 80, 2, 4),
            ("beheira", "البحيرة", "Beheira", 80, 2, 4),
            ("faiyum", "الفيوم", "Faiyum", 90, 3, 5),
            ("beni-suef", "بني سويف", "Beni Suef", 90, 3, 5),
            ("minya", "المنيا", "Minya", 95, 3, 5),
            ("asyut", "أسيوط", "Asyut", 100, 3, 6),
            ("sohag", "سوهاج", "Sohag", 100, 3, 6),
            ("qena", "قنا", "Qena", 100, 3, 6),
            ("luxor", "الأقصر", "Luxor", 100, 3, 6),
            ("aswan", "أسوان", "Aswan", 110, 4, 7),
            ("red-sea", "البحر الأحمر", "Red Sea", 120, 4, 7),
            ("new-valley", "الوادي الجديد", "New Valley", 120, 4, 7),
            ("matrouh", "مطروح", "Matrouh", 120, 4, 7),
            ("north-sinai", "شمال سيناء", "North Sinai", 120, 4, 7),
            ("south-sinai", "جنوب سيناء", "South Sinai", 120, 4, 7),
        ];
        return zones.Select(z => new DeliveryZone(z.Key, z.Ar, z.En, z.Fee, z.Min, z.Max));
    }

    // The 10 colors from the old demo.
    public static IEnumerable<Color> Colors() =>
    [
        new("أسود", "Black", "#161616"),
        new("أبيض", "White", "#f7f5ed"),
        new("بيج", "Beige", "#d6b995"),
        new("كحلي", "Navy", "#19344a"),
        new("بني", "Brown", "#815332"),
        new("وردي", "Pink", "#d9a5ad"),
        new("زيتي", "Olive", "#727c54"),
        new("رمادي", "Gray", "#909397"),
        new("كريمي", "Cream", "#e9dac3"),
        new("أوف وايت", "Off-white", "#eee7d9"),
    ];

    // ---------- demo catalog (development only, until the client sends real products)

    public sealed record DemoCategory(string Slug, string NameAr, string NameEn, string? ParentSlug, int SortOrder);

    public sealed record DemoProduct(string CategorySlug, string NameAr, string NameEn, string DescriptionAr,
        string DescriptionEn, decimal Price, string[] Sizes, string[] Colors);

    public static IReadOnlyList<DemoCategory> DemoCategories() =>
    [
        new("dresses", "فساتين وعبايات", "Dresses & Abayas", null, 0),
        new("abayas", "عبايات", "Abayas", "dresses", 0),
        new("trousers", "بناطيل", "Trousers", null, 1),
        new("blouses", "بلوزات", "Blouses", null, 2),
        new("sets", "أطقم", "Co-ord Sets", null, 3),
    ];

    public static IReadOnlyList<DemoProduct> DemoProducts() =>
    [
        new("abayas", "عباية محتشمة", "Modest Abaya", "عباية كريب واسعة بحزام.", "Flowing crepe abaya with a belt.",
            1250, ["M", "L", "XL"], ["Beige", "Black"]),
        new("dresses", "فستان محتشم كحلي", "Modest Navy Dress", "فستان طويل بأكمام كاملة.", "Long dress with full sleeves.",
            1350, ["M", "L", "XL"], ["Navy", "Black"]),
        new("dresses", "فستان طويل محتشم", "Long Modest Dress", "فستان ماكسي خفيف لكل يوم.", "Light maxi dress for every day.",
            1450, ["M", "L", "XL"], ["Navy", "Beige"]),
        new("trousers", "بنطلون واسع", "Wide-leg Trousers", "بنطلون كتان مريح بخصر عالٍ.", "Comfortable high-waist linen trousers.",
            850, ["S", "M", "L", "XL"], ["Beige", "Navy", "Black"]),
        new("trousers", "بنطلون بالازو بني", "Brown Palazzo Trousers", "بالازو كريب انسيابي.", "Flowing crepe palazzo trousers.",
            1050, ["S", "M", "L", "XL"], ["Brown", "Navy"]),
        new("blouses", "بلوزة كلاسيك", "Classic Blouse", "بلوزة قطن بأكمام طويلة.", "Long-sleeve cotton blouse.",
            690, ["S", "M", "L"], ["White", "Beige", "Pink"]),
        new("blouses", "بلوزة بربطة رقبة", "Tie-neck Blouse", "بلوزة كريب بربطة عند الرقبة.", "Crepe blouse with a neck tie.",
            820, ["S", "M", "L"], ["Beige", "Navy"]),
        new("sets", "طقم كاجوال", "Casual Co-ord Set", "طقم بلوزة وبنطلون من الكتان.", "Linen blouse and trousers set.",
            1550, ["S", "M", "L", "XL"], ["Navy", "Beige"]),
    ];
}
