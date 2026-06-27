using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NativaSodaAPI.Data;
using NativaSodaAPI.Models;

namespace NativaSodaAPI.Controllers
{
    [ApiController]
    [Route("api/usuarios")]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsuariosController(AppDbContext context)
        {
            _context = context;
        }

// POST: api/usuarios/login (SOLO para usuarios que ya existen)
        [HttpPost("login")]
        public async Task<ActionResult<Usuario>> Login([FromBody] Usuario credenciales)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Nombre == credenciales.Nombre);
            
            if (user == null) return NotFound("El usuario no existe."); // Rechaza si no existe
            
            if (user.Password != credenciales.Password) return BadRequest("Contraseña incorrecta."); // Rechaza si la clave está mal

            return Ok(user); // Si todo está bien, entra.
        }

        // POST: api/usuarios/registro (SOLO para crear cuentas nuevas)
        [HttpPost("registro")]
        public async Task<ActionResult<Usuario>> Registro([FromBody] Usuario nuevoUsuario)
        {
            // 1. Verificamos si alguien ya tomó ese nombre
            var existe = await _context.Usuarios.AnyAsync(u => u.Nombre == nuevoUsuario.Nombre);
            if (existe) return BadRequest("Ese nombre de usuario ya está ocupado.");

            // 2. Le asignamos sus beneficios iniciales
            nuevoUsuario.Rol = "cliente";
            nuevoUsuario.EsPrimeraCompra = true;
            nuevoUsuario.CuponSiguienteCompra = false;

            // 3. Lo guardamos en la Base de Datos
            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();
            
            return Ok(nuevoUsuario);
        }

        // PUT: api/usuarios/5 (Actualiza el estado de los cupones después de comprar)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUsuario(int id, Usuario usuario)
        {
            if (id != usuario.Id) return BadRequest();

            _context.Entry(usuario).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}