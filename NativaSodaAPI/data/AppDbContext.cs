using Microsoft.EntityFrameworkCore;
using NativaSodaAPI.Models;

namespace NativaSodaAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Producto> Productos { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }

        // ==========================================
        // DATA SEEDING: INYECCIÓN DE DATOS INICIALES
        // ==========================================
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuario>().HasData(
                // 1. El Administrador (No tiene cupones)
                new Usuario { Id = 1, Nombre = "admin", Password = "admin", Rol = "admin", EsPrimeraCompra = false, CuponSiguienteCompra = false },
                
                // 2. Cliente Nuevo (Tiene el 20% de Primera Compra intacto)
                new Usuario { Id = 2, Nombre = "nuevo", Password = "123", Rol = "cliente", EsPrimeraCompra = true, CuponSiguienteCompra = false },
                
                // 3. Cliente VIP (Ya usó su primera compra, pero ganó el 10% por comprar volumen antes)
                new Usuario { Id = 3, Nombre = "vip", Password = "123", Rol = "cliente", EsPrimeraCompra = false, CuponSiguienteCompra = true },
                
                // 4. Cliente Normal (Ya gastó todo, sirve para probar que el sistema NO le dé descuentos indebidos)
                new Usuario { Id = 4, Nombre = "normal", Password = "123", Rol = "cliente", EsPrimeraCompra = false, CuponSiguienteCompra = false }
            );
        }
    }
}