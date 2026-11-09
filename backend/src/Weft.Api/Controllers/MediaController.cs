using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Weft.Infrastructure.Persistence;

namespace Weft.Api.Controllers;

// Product photos stored in the database (see DbImageStorage). Every key is unique, so browsers and Vercel
// may keep a photo for a year.
[Route("api/media")]
[AllowAnonymous]
public sealed class MediaController : ApiControllerBase
{
    [HttpGet("{**key}")]
    [ResponseCache(Duration = 31536000, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> Get(string key, [FromServices] WeftDbContext db, CancellationToken ct)
    {
        var image = await db.ImageFiles.AsNoTracking()
            .Where(i => i.Key == key)
            .Select(i => new { i.ContentType, i.Content })
            .FirstOrDefaultAsync(ct);
        return image is null ? NotFound() : File(image.Content, image.ContentType);
    }
}
