namespace NativaSodaAPI.Models
{
    public class Pedido
    {
        public int Id { get; set; }
        public string Cliente { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public int Articulos { get; set; }
        public decimal Total { get; set; }
        public string Estado { get; set; } = "Pendiente de envío";
        
        // Aquí guardaremos todo el texto con el resumen de descuentos y productos
        public string Detalles { get; set; } = string.Empty; 
    }
}