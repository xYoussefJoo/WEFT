namespace Weft.Infrastructure.Persistence;

// One photo file (one WebP size) kept in the database: products/12/3f9a…-800.webp -> bytes.
// MonsterASP.NET's free plan has no object storage, and files in the site folder can be wiped by a deploy.
public class StoredImage
{
    public string Key { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public byte[] Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
