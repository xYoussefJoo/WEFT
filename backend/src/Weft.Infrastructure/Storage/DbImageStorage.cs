using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Weft.Application.Common;
using Weft.Infrastructure.Persistence;

namespace Weft.Infrastructure.Storage;

// Product photos stored in the ImageFiles table and served by the API at /api/media/{key}.
// Each call uses its own DbContext, so saving a photo never saves (or waits for) the caller's other changes,
// just like an external store would behave.
public sealed class DbImageStorage(IServiceScopeFactory scopes, TimeProvider clock) : IImageStorage
{
    // /api/... goes through the storefront's /api rewrite, so photos load from the same origin locally and on Vercel.
    public const string PublicPath = "/api/media";

    public string PublicUrl(string objectKey) => $"{PublicPath}/{objectKey}";

    public async Task UploadPublicAsync(string objectKey, byte[] content, string contentType, CancellationToken cancellationToken)
    {
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<WeftDbContext>();
        var image = await db.ImageFiles.FindAsync([objectKey], cancellationToken);
        if (image is null)
        {
            image = new StoredImage { Key = objectKey };
            db.ImageFiles.Add(image);
        }
        image.ContentType = contentType;
        image.Content = content;
        image.CreatedAt = clock.GetUtcNow().UtcDateTime;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeletePublicAsync(IReadOnlyCollection<string> objectKeys, CancellationToken cancellationToken)
    {
        if (objectKeys.Count == 0) return;
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<WeftDbContext>();
        await db.ImageFiles.Where(i => objectKeys.Contains(i.Key)).ExecuteDeleteAsync(cancellationToken);
    }
}
