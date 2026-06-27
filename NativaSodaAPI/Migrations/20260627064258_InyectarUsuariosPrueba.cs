using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NativaSodaAPI.Migrations
{
    /// <inheritdoc />
    public partial class InyectarUsuariosPrueba : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "CuponSiguienteCompra", "EsPrimeraCompra", "Nombre", "Password", "Rol" },
                values: new object[,]
                {
                    { 1, false, false, "admin", "admin", "admin" },
                    { 2, false, true, "nuevo", "123", "cliente" },
                    { 3, true, false, "vip", "123", "cliente" },
                    { 4, false, false, "normal", "123", "cliente" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 4);
        }
    }
}
