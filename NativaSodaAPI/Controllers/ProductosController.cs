using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NativaSodaAPI.Data;
using NativaSodaAPI.Models;

namespace NativaSodaAPI.Controllers
{
    [ApiController]
    [Route("api/productos")]
    public class ProductosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Producto>>> GetProductos()
        {
            return await _context.Productos.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Producto>> PostProducto(Producto producto)
        {
            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProductos), new { id = producto.Id }, producto);
        }

        // 3. MÉTODO PUT (Para actualizar un producto existente)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProducto(int id, Producto productoActualizado)
        {
            // Verificamos que el ID de la URL coincida con el ID del producto que nos envían
            if (id != productoActualizado.Id)
            {
                return BadRequest();
            }

            // Le decimos a la base de datos que este producto fue modificado
            _context.Entry(productoActualizado).State = EntityState.Modified;
            await _context.SaveChangesAsync(); // Guardamos los cambios

            return NoContent(); // Responde con éxito
        }

        // 4. MÉTODO DELETE (Para borrar un producto)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProducto(int id)
        {
            // Buscamos el producto en la base de datos
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
            {
                return NotFound(); // Si no existe, avisa que no lo encontró
            }

            // Lo borramos y guardamos
            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();

            return NoContent(); // Responde con éxito
        }
    }
}