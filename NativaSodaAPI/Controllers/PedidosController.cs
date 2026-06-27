using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NativaSodaAPI.Data;
using NativaSodaAPI.Models;

namespace NativaSodaAPI.Controllers
{
    [ApiController]
    [Route("api/pedidos")]
    public class PedidosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PedidosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: Para que el Administrador vea todos los pedidos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidos()
        {
            return await _context.Pedidos.ToListAsync();
        }

        // GET: api/pedidos/cliente/Juan
        // Este método busca exclusivamente los pedidos del cliente que lo solicita
        [HttpGet("cliente/{nombre}")]
        public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidosPorCliente(string nombre)
        {
            // Filtramos la base de datos buscando coincidencias con el nombre
            var pedidosDelCliente = await _context.Pedidos
                                                  .Where(p => p.Cliente == nombre)
                                                  .ToListAsync();
            
            return Ok(pedidosDelCliente);
        }

        // POST: Para que el cliente guarde su compra
        [HttpPost]
        public async Task<ActionResult<Pedido>> PostPedido(Pedido pedido)
        {
            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();
            return Ok(pedido);
        }

        // 4. PUT: Para marcar un pedido específico como "Enviado"
        [HttpPut("{id}/enviar")]
        public async Task<IActionResult> MarcarPedidoComoEnviado(int id)
        {
            // Buscamos el pedido en la base de datos
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound("Pedido no encontrado.");

            // Le cambiamos el estado
            pedido.Estado = "Enviado";
            
            // Guardamos los cambios
            await _context.SaveChangesAsync();

            return NoContent(); // Respuesta de éxito
        }


    }
}