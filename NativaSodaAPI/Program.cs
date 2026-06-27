using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NativaSodaAPI.Data.AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=nativasoda.db"));

builder.Services.AddControllers();

builder.Services.AddCors(options => {
    options.AddPolicy("PermitirTodo", policy => {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("PermitirTodo");

// ¡ATENCIÓN AQUÍ! Hemos comentado (desactivado) esta línea que suele causar el 404 en pruebas locales.
// app.UseHttpsRedirection(); 

app.UseAuthorization();
app.MapControllers();

// ==========================================
// RUTA DE PRUEBA EXTREMA
// ==========================================
app.MapGet("/api/test", () => "¡Exito! El servidor principal esta vivo y las rutas funcionan.");

app.Run();