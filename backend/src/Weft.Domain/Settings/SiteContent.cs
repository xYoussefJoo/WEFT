namespace Weft.Domain.Settings;

// The home page and footer content the owner edits. Stored as one jsonb document.
public sealed record SiteContent(
    string AnnouncementAr,
    string AnnouncementEn,
    HeroContent Hero,
    CollectionContent Collection,
    ContactInfo Contact,
    SocialLinks Social)
{
    public static SiteContent Default => new(
        "توصيل لجميع المحافظات", "Delivery across Egypt",
        new HeroContent("", "", "هوديز بتصميم بسيط وخامات مريحة وتفاصيل مميزة.",
            "Hoodies with a simple design, comfortable fabrics and standout details.", null),
        new CollectionContent(true, "كولكشن WEFT", "The WEFT collection"),
        new ContactInfo(null, null, null, null, null),
        new SocialLinks(null, null, null));
}

public sealed record HeroContent(string TitleAr, string TitleEn, string SubtitleAr, string SubtitleEn, string? ImageUrl);

public sealed record CollectionContent(bool Enabled, string TitleAr, string TitleEn);

public sealed record ContactInfo(string? Phone, string? WhatsApp, string? Email, string? AddressAr, string? AddressEn);

public sealed record SocialLinks(string? Facebook, string? Instagram, string? TikTok);
