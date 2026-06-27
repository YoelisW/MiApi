// ==========================================
// 1. SIMULACIÓN DE BASE DE DATOS (LocalStorage)
// ==========================================
let inventario = JSON.parse(localStorage.getItem('inventario')) || [
    { id: 1, nombre: 'Soda de Frutos Rojos', precio: 45.00, stock: 15, desc: 'Refrescante y antioxidante.' },
    { id: 2, nombre: 'Soda de Limón y Menta', precio: 45.00, stock: 5, desc: 'El equilibrio perfecto.' }
];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
let usuarioActual = JSON.parse(localStorage.getItem('sesionActiva')) || null;

// Guardar datos en la "Base de Datos"
function guardarDatos() {
    localStorage.setItem('inventario', JSON.stringify(inventario));
    localStorage.setItem('carrito', JSON.stringify(carrito));
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));
}

// ==========================================
// 2. RENDERIZADO DINÁMICO DE PRODUCTOS
// ==========================================
// ==========================================
// 2. CONEXIÓN REAL AL SERVIDOR (API)
// ==========================================

const API_URL = 'http://localhost:5011/api/Productos';
const API_USUARIOS = 'http://localhost:5011/api/usuarios';
const API_PEDIDOS = 'http://localhost:5011/api/pedidos';

// Nueva función que se conecta a tu base de datos SQL
async function cargarProductosDesdeBaseDatos() {
    try {
        // 1. Va a tu servidor en C# y pide la lista de productos
        const respuesta = await fetch(API_URL);
        
        // 2. Convierte la respuesta a formato que JavaScript entienda
        const productosDB = await respuesta.json();
        
        // 3. Actualizamos nuestro inventario local con los datos reales
        inventario = productosDB;
        
        // 4. Dibujamos los productos en la pantalla
        renderizarProductosReales();
    } catch (error) {
        console.error("Error al conectar con la base de datos:", error);
        document.getElementById('contenedor-productos').innerHTML = '<p>Error al cargar el catálogo de productos.</p>';
    }
}

function renderizarProductosReales() {
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = ''; // Limpiar antes de dibujar

inventario.forEach(producto => {
        let claseStock = producto.stock <= 5 ? 'stock-badge stock-bajo' : 'stock-badge';
        let textoStock = producto.stock > 0 ? `Quedan: ${producto.stock}` : 'Agotado';
        let btnDisabled = producto.stock === 0 ? 'disabled style="background:#ccc;"' : '';
        
        // Si el producto no tiene imagen, mostramos una genérica
        let srcImagen = producto.imagen ? producto.imagen : 'https://via.placeholder.com/250x300?text=Sin+Imagen';

const tarjeta = `
            <div class="card">
                <span class="${claseStock}">${textoStock}</span>
                <img src="${srcImagen}" alt="${producto.nombre}" style="width: 100%; height: 250px; object-fit: contain; margin-bottom: 15px;">
                <h3 style="color: var(--verde-oscuro);">${producto.nombre}</h3>
                <p>${producto.descripcion}</p>
                <p><strong>C$ ${producto.precio.toFixed(2)}</strong></p>
                
                <!-- NUEVO: Selector de cantidad -->
                <div style="display: flex; gap: 10px; margin-bottom: 15px; justify-content: center; align-items: center;">
                    <label for="cant-${producto.id}" style="font-size: 0.9rem; color: var(--verde-oscuro); font-weight: bold;">Cant:</label>
                    <input type="number" id="cant-${producto.id}" value="1" min="1" max="${producto.stock}" style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; text-align: center;" ${producto.stock === 0 ? 'disabled' : ''}>
                </div>

                <button class="btn" style="width: 100%;" onclick="agregarAlCarrito(${producto.id})" ${btnDisabled}>
                    ${producto.stock > 0 ? 'Comprar Ahora' : 'Agotado'}
                </button>
            </div>
        `;
        contenedor.innerHTML += tarjeta;
    });
}


function agregarAlCarrito(idProducto) {
    const producto = inventario.find(p => p.id === idProducto);
    
    // Leemos la cantidad que el usuario escribió en la tarjeta
    const inputCantidad = document.getElementById(`cant-${idProducto}`);
    const cantidadDeseada = parseInt(inputCantidad.value);

    // Verificamos cuántos de este producto YA existen en el carrito actual
    const cantidadEnCarrito = carrito.filter(item => item.id === idProducto).length;
    
    // Validamos que la suma no exceda el stock real
    if (cantidadEnCarrito + cantidadDeseada > producto.stock) {
        alert(`Solo quedan ${producto.stock} unidades disponibles. Ya tienes ${cantidadEnCarrito} en tu carrito.`);
        return;
    }

    // Agregamos el producto al carrito la cantidad de veces solicitada
    for(let i = 0; i < cantidadDeseada; i++) {
        carrito.push(producto);
    }
    
    guardarDatos();
    actualizarInterfazCarrito();
    
    // Pequeña notificación visual
    alert(`¡Se agregaron ${cantidadDeseada} unidades de ${producto.nombre} al carrito!`);
    
    // Reseteamos el selector de vuelta a 1 para la próxima compra
    inputCantidad.value = 1;
}



function actualizarInterfazCarrito() {
    const contenedorCarrito = document.getElementById('contenedor-carrito');
    const resumenPago = document.getElementById('resumen-pago');
    document.getElementById('contador-carrito').innerText = carrito.length;

    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = '<p>Tu carrito está vacío.</p>';
        resumenPago.style.display = 'none';
        return;
    }

    let subtotal = 0;
    let descuentos = 0;
    let totalBotellas = 0;
    let htmlCarrito = '';
    let detallesDescuentoHtml = '';

    let carritoAgrupado = {};
    carrito.forEach((producto) => {
        if(carritoAgrupado[producto.id]) {
            carritoAgrupado[producto.id].cantidad += 1;
        } else {
            carritoAgrupado[producto.id] = { ...producto, cantidad: 1 };
        }
    });

    let encontroPrimeraCompra = false;

    for (let id in carritoAgrupado) {
        let item = carritoAgrupado[id];
        let subtotalLinea = item.precio * item.cantidad;
        subtotal += subtotalLinea;
        
        if (item.esComboEspecial) {
            totalBotellas += (6 * item.cantidad);
        } else {
            totalBotellas += item.cantidad;

            // OFERTA: 3x2 en Jengibre
            if (item.nombre.toLowerCase().includes('jengibre')) {
                let gratis = Math.floor(item.cantidad / 3);
                if (gratis > 0) {
                    let ahorroJengibre = gratis * item.precio;
                    descuentos += ahorroJengibre;
                    detallesDescuentoHtml += `<p style="color:var(--rojo-brillante); margin: 2px 0;">✔️ 3x2 Jengibre: -C$ ${ahorroJengibre.toFixed(2)}</p>`;
                }
            }

            // OFERTA: 20% Primera Compra
            if (usuarioActual && usuarioActual.esPrimeraCompra && !encontroPrimeraCompra) {
                let ahorroPrimera = item.precio * 0.20;
                descuentos += ahorroPrimera;
                detallesDescuentoHtml += `<p style="color:var(--rojo-brillante); margin: 2px 0;">✔️ 20% Primera Compra (1 Botella): -C$ ${ahorroPrimera.toFixed(2)}</p>`;
                encontroPrimeraCompra = true;
            }
        }

        htmlCarrito += `
            <div class="item-carrito" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 15px 0;">
                <div style="flex: 2;">
                    <strong style="color: var(--verde-oscuro);">${item.nombre}</strong><br>
                    <small>C$ ${item.precio.toFixed(2)} c/u</small>
                    ${item.esComboEspecial ? `<br><small style="color:#666;">${item.descripcion}</small>` : ''}
                </div>
                <div style="flex: 1; text-align: center;"><strong>x ${item.cantidad}</strong></div>
                <div style="flex: 1; text-align: right; font-weight: bold;">C$ ${subtotalLinea.toFixed(2)}</div>
                <button onclick="eliminarTodoDelCarrito('${item.id}')" style="background:var(--rojo-vino); color:white; border:none; padding:8px; border-radius:4px; margin-left:10px; cursor:pointer;">🗑️</button>
            </div>
        `;
    }

    // OFERTA: 10% Cliente Frecuente
    if (usuarioActual && usuarioActual.cuponSiguienteCompra) {
        let ahorroCupon = (subtotal - descuentos) * 0.10;
        descuentos += ahorroCupon;
        detallesDescuentoHtml += `<p style="color:var(--rojo-brillante); margin: 2px 0;">✔️ Cupón Cliente Frecuente (10%): -C$ ${ahorroCupon.toFixed(2)}</p>`;
    }

    // OFERTA: Envío Gratis
    let costoEnvio = 50.00; 
    if (totalBotellas >= 10) {
        costoEnvio = 0;
        detallesDescuentoHtml += `<p style="color:var(--rojo-brillante); margin: 2px 0;">✔️ ¡Envío Gratis! (+10 botellas aplicadas)</p>`;
    }

    let totalFinal = (subtotal - descuentos) + costoEnvio;

    contenedorCarrito.innerHTML = htmlCarrito;
    resumenPago.style.display = 'block';
    resumenPago.innerHTML = `
        <div style="text-align: right; margin-bottom: 15px;">
            <p>Subtotal: C$ ${subtotal.toFixed(2)}</p>
            ${detallesDescuentoHtml}
            <p>Envío: ${costoEnvio === 0 ? '<strong>GRATIS</strong>' : `C$ ${costoEnvio.toFixed(2)}`}</p>
        </div>
        <h3 style="color: var(--rojo-intenso); text-align: right; font-size: 1.5rem;">Total Final: C$ ${totalFinal.toFixed(2)}</h3>
        <button class="btn" style="width: 100%; margin-top: 15px; font-size: 1.2rem;" onclick="procesarCompraFinal(${totalBotellas}, ${totalFinal})">Proceder al Pago Seguro</button>
    `;
}

async function procesarCompraFinal(totalBotellas, totalAPagar) {
    if (!usuarioActual) return abrirModalLogin();

    // Calculamos beneficios futuros
    if (totalBotellas >= 8) {
        usuarioActual.cuponSiguienteCompra = true;
        alert("¡Felicidades! Por llevar 8 o más botellas, ganaste un cupón del 10% para tu próxima compra.");
    } else {
        usuarioActual.cuponSiguienteCompra = false;
    }
    usuarioActual.esPrimeraCompra = false;

    // Recolectamos el desglose visual (Descuentos, Envío, etc.) directamente de la pantalla
    const desgloseTexto = document.getElementById('resumen-pago').innerText;

    const nuevoPedido = {
        cliente: usuarioActual.nombre,
        fecha: new Date().toLocaleDateString(),
        articulos: totalBotellas,
        total: totalAPagar,
        estado: 'Pendiente de envío',
        detalles: desgloseTexto // Guardamos el texto exacto con los descuentos aplicados
    };

    try {
        // 1. Actualizar cupones del usuario en la Base de Datos
        await fetch(`${API_USUARIOS}/${usuarioActual.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioActual)
        });

        // 2. Guardar el Pedido en la Base de Datos
        await fetch(API_PEDIDOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoPedido)
        });

        // 3. Descontar el stock real de los productos comprados
        for (let item of carrito) {
            if(!item.esComboEspecial) {
                let prodDB = inventario.find(p => p.id === item.id);
                if(prodDB) {
                    prodDB.stock -= 1;
                    await fetch(`${API_URL}/${prodDB.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(prodDB) });
                }
            } else {
                for (let bot of item.botellasReales) {
                    let prodDB = inventario.find(p => p.id === bot.id);
                    if(prodDB) {
                        prodDB.stock -= bot.cantidad;
                        await fetch(`${API_URL}/${prodDB.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(prodDB) });
                    }
                }
            }
        }

        carrito = [];
        guardarDatos();
        cargarProductosDesdeBaseDatos(); // Refrescamos la tienda para ver el nuevo stock
        actualizarInterfazCarrito();
        alert("¡Pedido confirmado con éxito! Tu orden ha sido enviada.");
        
    } catch (error) {
        console.error("Error al procesar la compra:", error);
    }
}


function eliminarTodoDelCarrito(idProducto) {
    carrito = carrito.filter(producto => producto.id.toString() !== idProducto.toString());
    guardarDatos();
    actualizarInterfazCarrito();
}



function abrirModalLogin() { document.getElementById('modal-login').style.display = 'block'; }


function cerrarModalLogin() {

    document.getElementById('modal-login').style.display = 'none';
    
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    
    // 3. Limpiamos los campos de Crear Cuenta
    document.getElementById('reg-user').value = '';
    document.getElementById('reg-pass').value = '';
}


function cambiarTabLogin(tab) {
    const secLogin = document.getElementById('form-login-seccion');
    const secReg = document.getElementById('form-registro-seccion');
    const btnLogin = document.getElementById('btn-tab-login');
    const btnReg = document.getElementById('btn-tab-registro');

    if (tab === 'login') {
        secLogin.style.display = 'block';
        secReg.style.display = 'none';
        btnLogin.style.cssText = 'flex: 1; padding: 10px; background: none; border: none; font-weight: bold; color: var(--verde-oscuro); border-bottom: 3px solid var(--verde-oscuro); cursor: pointer;';
        btnReg.style.cssText = 'flex: 1; padding: 10px; background: none; border: none; color: #999; border-bottom: 3px solid transparent; cursor: pointer;';
    } else {
        secLogin.style.display = 'none';
        secReg.style.display = 'block';
        btnReg.style.cssText = 'flex: 1; padding: 10px; background: none; border: none; font-weight: bold; color: var(--verde-oscuro); border-bottom: 3px solid var(--verde-oscuro); cursor: pointer;';
        btnLogin.style.cssText = 'flex: 1; padding: 10px; background: none; border: none; color: #999; border-bottom: 3px solid transparent; cursor: pointer;';
    }
}


async function procesarSoloLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (user === '' || pass === '') return alert("Llena todos los campos.");

    try {
        const respuesta = await fetch(`${API_USUARIOS}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: user, password: pass })
        });

        if (respuesta.ok) {
            usuarioActual = await respuesta.json();
            localStorage.setItem('sesionActiva', JSON.stringify(usuarioActual)); // Guardamos la sesión
            
            // REDIRECCIÓN INTELIGENTE
            if (usuarioActual.rol === 'admin') {
                window.location.href = 'admin.html'; // Lo mandamos al panel
            } else {
                cerrarModalLogin(); 
                actualizarNavegacion(); 
                actualizarInterfazCarrito();
                alert(`¡Bienvenido de nuevo, ${usuarioActual.nombre}!`);
            }
        } else {
            alert("Usuario no encontrado o contraseña incorrecta.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}


async function procesarSoloRegistro() {
    const user = document.getElementById('reg-user').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    if (user === '' || pass === '') return alert("Llena todos los campos.");

    try {
        const respuesta = await fetch(`${API_USUARIOS}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: user, password: pass })
        });

        if (respuesta.ok) {
            usuarioActual = await respuesta.json();
            guardarDatos(); cerrarModalLogin(); actualizarNavegacion(); actualizarInterfazCarrito();
            alert("¡Cuenta creada exitosamente! Tu 20% de descuento está listo para usarse.");
        } else {
            // Si el servidor rechaza, leemos el mensaje exacto (Ej: "Usuario ocupado")
            const errorMensaje = await respuesta.text();
            alert(errorMensaje || "Ocurrió un error al registrarse.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem('sesionActiva'); // Borramos la memoria
    window.location.href = 'index.html'; // Lo regresamos a la tienda
}

function actualizarNavegacion() {
    const btnLogin = document.getElementById('nav-login');
    const btnLogout = document.getElementById('nav-logout');
    const btnAdmin = document.getElementById('nav-admin');
    const btnMisPedidos = document.getElementById('nav-mis-pedidos'); // NUEVO

    if (usuarioActual) {
        btnLogin.style.display = 'none';
        btnLogout.style.display = 'inline-block';
        
        if (usuarioActual.rol === 'admin') {
            btnAdmin.style.display = 'inline-block';
            btnMisPedidos.style.display = 'none'; 
        } else {
            btnAdmin.style.display = 'none';
            btnMisPedidos.style.display = 'inline-block'; // Mostramos el historial al cliente
        }
    } else {
        btnLogin.style.display = 'inline-block';
        btnLogout.style.display = 'none';
        btnAdmin.style.display = 'none';
        btnMisPedidos.style.display = 'none';
    }
}


// ==========================================
// 5. MÓDULO DE ADMINISTRADOR
// ==========================================
function mostrarVista(vista) {
    if (vista === 'admin' && (!usuarioActual || usuarioActual.rol !== 'admin')) {
        return alert("Acceso denegado.");
    }
    
    document.getElementById('vista-cliente').style.display = vista === 'cliente' ? 'block' : 'none';
    document.getElementById('vista-admin').style.display = vista === 'admin' ? 'block' : 'none';
    
    if (vista === 'admin') renderizarPedidosAdmin();
}

// ==========================================
// NUEVA FUNCIÓN PARA GUARDAR DESDE EL PANEL ADMIN
// ==========================================
async function agregarProductoMenu(event) {
    event.preventDefault(); 

    const inputImagen = document.getElementById('prod-img');
    let imagenBase64 = "";
    if (inputImagen.files.length > 0) {
        imagenBase64 = await convertirImagenABase64(inputImagen.files[0]);
    }


    const nuevoProd = {
        nombre: document.getElementById('prod-nombre').value,
        precio: parseFloat(document.getElementById('prod-precio').value),
        stock: parseInt(document.getElementById('prod-stock').value),
        descripcion: document.getElementById('prod-desc').value,
        imagen: imagenBase64
    };

    try {
        // 2. Enviamos la petición POST al servidor (Hace el trabajo de Swagger)
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Le decimos al servidor que enviamos un JSON
            },
            body: JSON.stringify(nuevoProd) // Convertimos el objeto a texto para el viaje
        });

        // 3. Revisamos si el servidor respondió con éxito (Código 201)
        if (respuesta.ok) {
            alert("¡Producto agregado exitosamente a la base de datos SQL!");
            document.getElementById('form-nuevo-producto').reset(); // Limpia los campos
            
            // 4. Recargamos la lista desde el servidor para que el nuevo producto aparezca de inmediato
            cargarProductosDesdeBaseDatos(); 
        } else {
            alert("El servidor rechazó el producto. Revisa los datos.");
        }
    } catch (error) {
        console.error("Error al enviar el producto:", error);
        alert("No se pudo conectar con el servidor.");
    }
}


async function renderizarPedidosAdmin() {
    const contPedidos = document.getElementById('contenedor-pedidos');
    contPedidos.innerHTML = '<p>Cargando información de pedidos...</p>';
    
    try {
        const respuesta = await fetch(API_PEDIDOS);
        const pedidosDB = await respuesta.json();

        contPedidos.innerHTML = '';
        if (pedidosDB.length === 0) {
            contPedidos.innerHTML = '<p>No hay pedidos recientes.</p>';
            return;
        }

        pedidosDB.reverse().forEach(pedido => {
            // Evaluamos si el pedido ya fue enviado para cambiar el color y el botón
            let colorEstado = pedido.estado === 'Pendiente de envío' ? '#f1c40f' : 'var(--verde-suave)';
            
            // Si está pendiente, mostramos el botón. Si ya se envió, mostramos un texto.
            let zonaBotonHtml = pedido.estado === 'Pendiente de envío' 
                ? `<button class="btn" style="padding: 6px 12px; font-size: 0.8rem; background-color: var(--verde-oscuro);" onclick="marcarPedidoEnviado(${pedido.id})">📦 Marcar como Enviado</button>`
                : `<span style="color: var(--verde-oscuro); font-weight: bold; font-size: 0.9rem;">✔️ Paquete despachado</span>`;

            contPedidos.innerHTML += `
                <div class="pedido-item" style="background: white; padding: 15px; border-left: 4px solid ${colorEstado}; margin-bottom: 15px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color: var(--verde-oscuro); font-size: 1.1rem;">Orden #${pedido.id}</strong>
                        <span style="background: ${colorEstado}; color: ${pedido.estado === 'Pendiente de envío' ? '#333' : 'white'}; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight:bold;">${pedido.estado}</span>
                    </div>
                    <p style="margin: 8px 0;"><strong>Cliente:</strong> ${pedido.cliente} | <strong>Fecha:</strong> ${pedido.fecha}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
                    
                    <p style="font-size: 0.9rem; color: #555; white-space: pre-wrap; margin: 0; font-family: monospace;">${pedido.detalles}</p>
                    
                    <div style="margin-top: 15px; text-align: right;">
                        ${zonaBotonHtml}
                    </div>
                </div>
            `;
        });
    } catch (error) {
        contPedidos.innerHTML = '<p>Error al conectar con la base de datos de pedidos.</p>';
    }
}

// Función para que el Admin actualice el estado del pedido
async function marcarPedidoEnviado(idPedido) {
    // Pedimos confirmación para evitar clics accidentales
    const confirmar = confirm(`¿Estás seguro de marcar la Orden #${idPedido} como Enviada?`);
    if (!confirmar) return;

    try {
        const respuesta = await fetch(`${API_PEDIDOS}/${idPedido}/enviar`, {
            method: 'PUT'
        });

        if (respuesta.ok || respuesta.status === 204) {
            alert("¡Pedido actualizado con éxito!");
            renderizarPedidosAdmin(); // Recargamos la lista del admin para ver el cambio
        } else {
            alert("Hubo un error al intentar actualizar el pedido.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    }
}

function renderizarInventarioAdmin() {
    const contInventario = document.getElementById('contenedor-inventario');
    contInventario.innerHTML = '';

    if (inventario.length === 0) {
        contInventario.innerHTML = '<p>No hay productos registrados.</p>';
        return;
    }

    // Dibujamos la lista de productos con los nuevos botones
    inventario.forEach(producto => {
        contInventario.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px; margin-bottom: 10px; border-radius: 4px; border-left: 4px solid var(--verde-suave); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div>
                    <strong style="color: var(--verde-oscuro);">${producto.nombre}</strong><br>
                    <small>Precio: C$ ${producto.precio.toFixed(2)} | Stock actual: <strong>${producto.stock}</strong></small>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button style="background: var(--verde-suave); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;" onclick="abrirModalEditar(${producto.id})">✏️ Editar</button>
                    <button style="background: var(--rojo-vino); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;" onclick="eliminarProductoBaseDatos(${producto.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    });
}


function abrirModalEditar(id) {
    const producto = inventario.find(p => p.id === id);
    if (!producto) return;

    // Rellenamos el formulario con los datos de la base de datos
    document.getElementById('edit-id').value = producto.id;
    document.getElementById('edit-nombre').value = producto.nombre;
    document.getElementById('edit-precio').value = producto.precio;
    document.getElementById('edit-stock').value = producto.stock;
    document.getElementById('edit-desc').value = producto.descripcion;

    document.getElementById('modal-editar').style.display = 'block';
}

function cerrarModalEditar() {
    document.getElementById('modal-editar').style.display = 'none';
}

async function guardarEdicion(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('edit-id').value);
    
    // Leemos el cuadro donde se sube la imagen
    const inputImagen = document.getElementById('edit-img');
    let imagenBase64 = ""; 
    
    // Si el administrador seleccionó una foto nueva, la convertimos
    if (inputImagen.files.length > 0) {
        imagenBase64 = await convertirImagenABase64(inputImagen.files[0]);
    } else {
        // Si no subió foto nueva, simplemente buscamos la que ya tenía en el inventario
        const prodViejo = inventario.find(p => p.id === id);
        imagenBase64 = prodViejo.imagen;
    }

    const productoActualizado = {
        id: id,
        nombre: document.getElementById('edit-nombre').value,
        precio: parseFloat(document.getElementById('edit-precio').value),
        stock: parseInt(document.getElementById('edit-stock').value),
        descripcion: document.getElementById('edit-desc').value,
        imagen: imagenBase64 // <- Enviamos la imagen correcta
    };

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productoActualizado)
        });

        if (respuesta.ok || respuesta.status === 204) {
            alert("¡Producto actualizado correctamente!");
            cerrarModalEditar();
            cargarProductosDesdeBaseDatos(); // Recargamos para ver los cambios
        } else {
            alert("Error al actualizar el producto en el servidor.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function eliminarProductoBaseDatos(id) {
    // Pedimos confirmación para evitar borrar algo por accidente
    const confirmacion = confirm("¿Estás seguro de que deseas eliminar permanentemente este producto?");
    if (!confirmacion) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (respuesta.ok || respuesta.status === 204) {
            alert("Producto eliminado del sistema.");
            cargarProductosDesdeBaseDatos(); // Recargamos la lista
        } else {
            alert("Error al eliminar el producto.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function modificarStock(id, cantidadCambio) {
    let producto = inventario.find(p => p.id === id);
    if (producto) {
        producto.stock += cantidadCambio;
        if (producto.stock < 0) producto.stock = 0; // Evitar stock negativo
        
        guardarDatos();
        renderizarInventarioAdmin(); // Actualizar panel admin
        renderizarProductos(); // Actualizar menú del cliente en tiempo real
    }
}

function mostrarVista(vista) {
    if (vista === 'admin' && (!usuarioActual || usuarioActual.rol !== 'admin')) {
        return alert("Acceso denegado.");
    }
    
    document.getElementById('vista-cliente').style.display = vista === 'cliente' ? 'block' : 'none';
    document.getElementById('vista-admin').style.display = vista === 'admin' ? 'block' : 'none';
    
    if (vista === 'admin') {
        renderizarPedidosAdmin();
        renderizarInventarioAdmin(); // Llamada nueva
    }
}

function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==========================================
// OFERTAS PROMOCIONALES Y COMBOS
// ==========================================
function aplicarOfertaRapida(tipo) {
    if (tipo === 'jengibre') {
        const prodJengibre = inventario.find(p => p.nombre.toLowerCase().includes('jengibre'));
        if (prodJengibre && prodJengibre.stock >= 3) {
            carrito.push(prodJengibre, prodJengibre, prodJengibre);
            alert("¡3 Sodas de Jengibre agregadas! El 3x2 se aplicará en el carrito.");
        } else {
            alert("No hay suficiente stock de Jengibre (requiere 3) para esta promoción.");
        }
    } else if (tipo === 'degustacion') {
        inventario.forEach(prod => {
            if (prod.stock > 0) carrito.push(prod);
        });
        alert("¡Pack degustación añadido! Tienes una botella de cada sabor disponible.");
    }
    guardarDatos();
    actualizarInterfazCarrito();
}

let comboTemporal = [];
function abrirModalCombo() {
    comboTemporal = [];
    actualizarUiCombo();
    document.getElementById('modal-combo').style.display = 'block';
}

function actualizarUiCombo() {
    const contenedor = document.getElementById('contenedor-opciones-combo');
    contenedor.innerHTML = '';
    let totalBotellasCombo = comboTemporal.reduce((acc, val) => acc + val.cantidad, 0);
    document.getElementById('combo-contador').innerText = totalBotellasCombo;

    inventario.forEach(prod => {
        if(prod.stock > 0) {
            let cantEnCombo = comboTemporal.find(c => c.id === prod.id)?.cantidad || 0;
            contenedor.innerHTML += `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center;">
                    <span style="color: var(--verde-oscuro);">${prod.nombre} (C$ ${prod.precio})</span>
                    <div>
                        <button onclick="modificarCombo(${prod.id}, -1)" class="btn" style="padding:2px 8px;">-</button>
                        <span style="margin: 0 10px;">${cantEnCombo}</span>
                        <button onclick="modificarCombo(${prod.id}, 1)" class="btn" style="padding:2px 8px;" ${totalBotellasCombo >= 6 ? 'disabled' : ''}>+</button>
                    </div>
                </div>
            `;
        }
    });

    const btnGuardar = document.getElementById('btn-guardar-combo');
    if(totalBotellasCombo === 6) {
        btnGuardar.disabled = false;
        btnGuardar.style.backgroundColor = 'var(--rojo-intenso)';
    } else {
        btnGuardar.disabled = true;
        btnGuardar.style.backgroundColor = '#ccc';
    }
}

function modificarCombo(idProd, cantidad) {
    let item = comboTemporal.find(c => c.id === idProd);
    if(item) {
        item.cantidad += cantidad;
        if(item.cantidad <= 0) comboTemporal = comboTemporal.filter(c => c.id !== idProd);
    } else if (cantidad > 0) {
        comboTemporal.push({ id: idProd, cantidad: 1 });
    }
    actualizarUiCombo();
}

function agregarComboAlCarrito() {
    let precioOriginalCombo = 0;
    let descripcionCombo = "Sabores: ";
    
    comboTemporal.forEach(item => {
        let prod = inventario.find(p => p.id === item.id);
        precioOriginalCombo += (prod.precio * item.cantidad);
        descripcionCombo += `${item.cantidad}x ${prod.nombre}, `;
    });

    const productoCombo = {
        id: 'COMBO-' + Date.now(),
        nombre: "Pack Combo Ahorro (6 Botellas)",
        precio: precioOriginalCombo * 0.85, // 15% de descuento directo
        esComboEspecial: true,
        descripcion: descripcionCombo,
        botellasReales: comboTemporal
    };

    carrito.push(productoCombo);
    guardarDatos();
    actualizarInterfazCarrito();
    document.getElementById('modal-combo').style.display = 'none';
    alert("¡Combo Ahorro agregado al carrito exitosamente!");
}

// ==========================================
// HISTORIAL DE PEDIDOS DEL CLIENTE
// ==========================================
async function abrirModalMisPedidos() {
    if (!usuarioActual) return;
    
    document.getElementById('modal-mis-pedidos').style.display = 'block';
    const contenedor = document.getElementById('contenedor-mis-pedidos');
    contenedor.innerHTML = '<p style="text-align: center;">Buscando tus pedidos...</p>';

    try {
        // Pedimos al servidor SOLO las órdenes de este usuario
        const respuesta = await fetch(`${API_PEDIDOS}/cliente/${usuarioActual.nombre}`);
        const misPedidosDB = await respuesta.json();

        if (misPedidosDB.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: #666;">Aún no has realizado ningún pedido con nosotros.</p>';
            return;
        }

        contenedor.innerHTML = '';
        
        // .reverse() sirve para que la orden más reciente (la última) aparezca hasta arriba
        misPedidosDB.reverse().forEach(pedido => {
            // Cambiamos el color de la etiqueta dependiendo de si ya se envió o no
            let colorEstado = pedido.estado === 'Pendiente de envío' ? '#f1c40f' : 'var(--verde-suave)';
            
            contenedor.innerHTML += `
                <div style="background: var(--fondo-crema); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid var(--verde-oscuro);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color: var(--verde-oscuro);">Orden #${pedido.id}</strong>
                        <span style="background: ${colorEstado}; color: #333; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight:bold;">${pedido.estado}</span>
                    </div>
                    <p style="margin: 8px 0; font-size: 0.9rem;"><strong>Fecha:</strong> ${pedido.fecha} | <strong>Total Pagado:</strong> C$ ${pedido.total.toFixed(2)}</p>
                    
                    <details style="margin-top: 10px; background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
                        <summary style="cursor: pointer; color: var(--rojo-intenso); font-size: 0.9rem; font-weight: bold; outline: none;">Ver comprobante de pago</summary>
                        <p style="font-size: 0.85rem; color: #555; white-space: pre-wrap; margin-top: 10px; font-family: monospace;">${pedido.detalles}</p>
                    </details>
                </div>
            `;
        });
    } catch (error) {
        contenedor.innerHTML = '<p style="text-align: center; color: var(--rojo-vino);">Error al cargar el historial. Intenta nuevamente.</p>';
        console.error(error);
    }
}

// ==========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================
window.onload = async () => {
    // Si estamos en la página del Administrador (admin.html)
    if (document.getElementById('vista-admin')) {
        // Barrera de seguridad: Si alguien entra a admin.html sin ser admin, lo patea afuera
        if (!usuarioActual || usuarioActual.rol !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        // Cargamos los datos del administrador
        try {
            const res = await fetch(API_URL);
            inventario = await res.json();
            renderizarInventarioAdmin();
            renderizarPedidosAdmin();
        } catch (e) { console.error("Error cargando panel:", e); }
    } 
    // Si estamos en la página del Cliente (index.html)
    else {
        actualizarNavegacion();
        cargarProductosDesdeBaseDatos();
        actualizarInterfazCarrito();
    }
};


