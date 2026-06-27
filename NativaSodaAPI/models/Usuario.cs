namespace NativaSodaAPI.Models
{
    public class Usuario
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Rol { get; set; } = "cliente";
        
        // Variables para las promociones de fidelidad
        public bool EsPrimeraCompra { get; set; } = true;
        public bool CuponSiguienteCompra { get; set; } = false;
    }
}