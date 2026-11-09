using Weft.Domain.Common;
using Weft.Domain.Entities;
using Weft.Domain.Enums;
using Weft.Domain.Exceptions;
using Weft.Domain.Settings;
using Weft.Domain.ValueObjects;
using static Weft.Tests.TestData;

namespace Weft.Tests.Domain;

public class CustomerInfoTests
{
    [Theory]
    [InlineData("01012345678")]
    [InlineData("+201012345678")]
    [InlineData("00201012345678")]
    [InlineData("010 1234-5678")]
    public void Phone_is_stored_in_one_format(string input) =>
        Assert.Equal("+201012345678", EgyptianPhone.Normalize(input));

    [Theory]
    [InlineData("0131234567")]   // wrong operator
    [InlineData("0101234567")]   // too short
    [InlineData("12345")]
    public void Invalid_phone_is_refused(string input) =>
        Assert.Throws<DomainException>(() => EgyptianPhone.Normalize(input));

    [Fact]
    public void Email_is_optional_and_lowercased()
    {
        Assert.Null(Customer(email: null).Email);
        Assert.Null(Customer(email: "  ").Email);
        Assert.Equal("mona@example.com", Customer(email: "Mona@Example.com").Email);
    }

    [Fact]
    public void Invalid_email_is_refused() =>
        Assert.Throws<DomainException>(() => Customer(email: "not-an-email"));

    [Fact]
    public void Address_must_be_detailed() =>
        Assert.Throws<DomainException>(() => new CustomerInfo("Mona Ahmed", "01012345678", null, "Cairo", "Cairo", null));
}
