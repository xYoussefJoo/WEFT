using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Weft.Api.Security;
using Weft.Application.Orders;
using Weft.Application.Settings;
using Weft.Domain.Settings;

namespace Weft.Api.Controllers.Admin;

[Route("api/admin")]
[Authorize(Policy = Policies.Owner)]
public sealed class AdminSiteController : ApiControllerBase
{
    // #43
    [HttpGet("site-settings")]
    public Task<SiteContent> SiteSettings([FromServices] GetAdminSiteSettingsHandler handler, CancellationToken ct) =>
        handler.HandleAsync(ct);

    // #44
    [HttpPut("site-settings")]
    public Task<SiteContent> UpdateSiteSettings(SiteContent content, [FromServices] UpdateSiteSettingsHandler handler, CancellationToken ct) =>
        handler.HandleAsync(content, ct);

    // #47
    [HttpGet("dashboard")]
    public Task<DashboardDto> Dashboard([FromServices] GetDashboardHandler handler, CancellationToken ct) =>
        handler.HandleAsync(ct);
}
