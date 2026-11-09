using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Weft.Application.Common;
using Weft.Domain.Constants;
using Weft.Domain.Exceptions;

namespace Weft.Api.Errors;

// One place that turns exceptions into the ProblemDetails responses from docs/API-CONTRACT.md.
// Controllers never need try/catch for business rules.
public sealed class GlobalExceptionHandler(IProblemDetailsService problemDetails, ILogger<GlobalExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, code, title, detail) = exception switch
        {
            DomainException e => (StatusFor(e.Code), e.Code, TitleFor(e.Code), e.Message),
            NotFoundException e => (StatusCodes.Status404NotFound, ErrorCodes.NotFound, "Not found", e.Message),
            ConflictException e => (StatusCodes.Status409Conflict, e.Code, TitleFor(e.Code), e.Message),
            FileRejectedException e => (e.StatusCode, e.Code, "File refused", e.Message),
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, ErrorCodes.ConcurrencyConflict,
                "Changed by someone else", "This item was changed by someone else. Reload it and try again."),
            // Safety nets: the use cases check these first, but two requests can still race each other.
            // SQL Server error 2601/2627 = duplicate in a unique index, 547 = still referenced by a foreign key.
            DbUpdateException { InnerException: SqlException { Number: 2601 or 2627 } } =>
                (StatusCodes.Status409Conflict, ErrorCodes.Duplicate, "Already exists", "Something with the same name, link or SKU already exists."),
            DbUpdateException { InnerException: SqlException { Number: 547 } } =>
                (StatusCodes.Status409Conflict, ErrorCodes.InUse, "Still in use", "This item is still used by something else."),
            _ => (StatusCodes.Status500InternalServerError, null, "Something went wrong", null),
        };

        if (status >= 500) logger.LogError(exception, "Unhandled exception");
        else logger.LogInformation("Request refused with {Code}: {Message}", code, exception.Message);

        httpContext.Response.StatusCode = status;
        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail, // never the exception text for 500s
            Type = $"https://weft.app/errors/{(code ?? "server-error").ToLowerInvariant().Replace('_', '-')}",
        };
        if (code is not null) problem.Extensions["code"] = code;
        if (exception is ConflictException conflict)
            foreach (var (key, value) in conflict.Details) problem.Extensions[key] = value; // e.g. items, total

        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception,
        });
    }

    private static int StatusFor(string code) => code switch
    {
        ErrorCodes.Validation => StatusCodes.Status400BadRequest,
        ErrorCodes.OutOfStock or ErrorCodes.PriceChanged or ErrorCodes.InvalidStatusTransition
            or ErrorCodes.ConcurrencyConflict or ErrorCodes.Duplicate or ErrorCodes.InUse => StatusCodes.Status409Conflict,
        _ => StatusCodes.Status400BadRequest,
    };

    private static string TitleFor(string code) => code switch
    {
        ErrorCodes.Validation => "Validation failed",
        ErrorCodes.OutOfStock => "Out of stock",
        ErrorCodes.PriceChanged => "Price changed",
        ErrorCodes.InvalidStatusTransition => "Action not allowed now",
        ErrorCodes.ConcurrencyConflict => "Changed by someone else",
        ErrorCodes.Duplicate => "Already exists",
        ErrorCodes.InUse => "Still in use",
        _ => "Request refused",
    };
}
