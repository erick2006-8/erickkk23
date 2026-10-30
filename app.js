
const productos = [
  { id: 1, nombre: "Laptop HP", categoria: "Tecnología", precio: 650 },
  { id: 2, nombre: "Mouse inalámbrico", categoria: "Accesorios", precio: 15 },
  { id: 3, nombre: "Teclado mecánico", categoria: "Accesorios", precio: 45 },
  { id: 4, nombre: "Monitor Samsung", categoria: "Tecnología", precio: 220 },
  { id: 5, nombre: "Audífonos Bluetooth", categoria: "Accesorios", precio: 35 },
  { id: 6, nombre: "Lámpara LED", categoria: "Hogar", precio: 25 },
  { id: 7, nombre: "Tablet Lenovo", categoria: "Tecnología", precio: 180 },
  { id: 8, nombre: "Cámara web", categoria: "Tecnología", precio: 40 }
];

let carrito = [];

const catalogo = document.getElementById("catalogo");
const listaCarrito = document.getElementById("listaCarrito");
const contador = document.getElementById("contador");

const busqueda = document.getElementById("busqueda");
const categoria = document.getElementById("categoria");

const subtotalElemento = document.getElementById("subtotal");
const descuentoElemento = document.getElementById("descuento");
const totalElemento = document.getElementById("total");

const mensaje = document.getElementById("mensaje");

// FORMATO DE MONEDA
function moneda(valor) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD"
  }).format(valor);
}

// MOSTRAR PRODUCTOS
function mostrarProductos() {
  const texto = busqueda.value.toLowerCase();
  const categoriaSeleccionada = categoria.value;

  const filtrados = productos.filter(producto => {
    return (
      producto.nombre.toLowerCase().includes(texto) &&
      (categoriaSeleccionada === "" ||
        producto.categoria === categoriaSeleccionada)
    );
  });

  catalogo.innerHTML = "";

  if (filtrados.length === 0) {
    catalogo.innerHTML =
      '<p class="vacio">No se encontraron productos.</p>';
    return;
  }

  filtrados.forEach(producto => {
    const cantidad = carrito.find(p => p.id === producto.id)?.cantidad || 0;

    const tarjeta = document.createElement("article");
    tarjeta.className = "producto";

    if (cantidad > 0) {
      tarjeta.classList.add("en-carrito");
    }

    tarjeta.innerHTML = `
      <span class="categoria">${producto.categoria}</span>
      <span class="nombre">${producto.nombre}</span>
      <span class="precio">${moneda(producto.precio)}</span>
      <button type="button" data-id="${producto.id}">
        ${cantidad > 0 ? "Agregar otro" : "Agregar al carrito"}
      </button>
    `;

    catalogo.appendChild(tarjeta);
  });
}

// AGREGAR PRODUCTO
function agregarProducto(id) {
  const producto = productos.find(p => p.id === id);

  const existente = carrito.find(p => p.id === id);

  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      ...producto,
      cantidad: 1
    });
  }

  actualizarCarrito();
  mostrarMensaje("Producto agregado correctamente.");
}

// CAMBIAR CANTIDAD
function cambiarCantidad(id, cambio) {
  const producto = carrito.find(p => p.id === id);

  if (!producto) return;

  producto.cantidad += cambio;

  if (producto.cantidad <= 0) {
    eliminarProducto(id);
    return;
  }

  actualizarCarrito();
}

// ELIMINAR PRODUCTO
function eliminarProducto(id) {
  carrito = carrito.filter(p => p.id !== id);
  actualizarCarrito();
}

// ACTUALIZAR CARRITO
function actualizarCarrito() {
  listaCarrito.innerHTML = "";

  if (carrito.length === 0) {
    listaCarrito.innerHTML =
      '<li class="vacio">Tu carrito está vacío.</li>';
  }

  carrito.forEach(producto => {
    const item = document.createElement("li");
    item.className = "item";

    item.innerHTML = `
      <div class="detalle">
        <strong>${producto.nombre}</strong>
        <small>${moneda(producto.precio)} c/u</small>
        <small>Subtotal: ${moneda(producto.precio * producto.cantidad)}</small>
      </div>

      <div class="cantidad">
        <button type="button" data-accion="restar" data-id="${producto.id}">−</button>
        <strong>${producto.cantidad}</strong>
        <button type="button" data-accion="sumar" data-id="${producto.id}">+</button>
      </div>

      <button class="quitar" type="button"
        data-accion="eliminar" data-id="${producto.id}">
        ×
      </button>
    `;

    listaCarrito.appendChild(item);
  });

  calcularTotal();

  const cantidadTotal = carrito.reduce(
    (acumulado, producto) => acumulado + producto.cantidad,
    0
  );

  contador.textContent = cantidadTotal;

  document.getElementById("comprar").disabled = carrito.length === 0;

  mostrarProductos();
}

// CALCULAR SUBTOTAL, DESCUENTO Y TOTAL
function calcularTotal() {
  const subtotal = carrito.reduce(
    (acumulado, producto) =>
      acumulado + producto.precio * producto.cantidad,
    0
  );

  const descuento = subtotal >= 100 ? subtotal * 0.10 : 0;

  const total = subtotal - descuento;

  subtotalElemento.textContent = moneda(subtotal);
  descuentoElemento.textContent = moneda(descuento);
  totalElemento.textContent = moneda(total);
}

// MOSTRAR MENSAJES
function mostrarMensaje(texto) {
  mensaje.textContent = texto;
  mensaje.hidden = false;
}

// EVENTOS DEL CATÁLOGO
catalogo.addEventListener("click", event => {
  const boton = event.target.closest("button[data-id]");

  if (!boton) return;

  agregarProducto(Number(boton.dataset.id));
});

// EVENTOS DEL CARRITO
listaCarrito.addEventListener("click", event => {
  const boton = event.target.closest("button[data-accion]");

  if (!boton) return;

  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === "sumar") {
    cambiarCantidad(id, 1);
  }

  if (accion === "restar") {
    cambiarCantidad(id, -1);
  }

  if (accion === "eliminar") {
    eliminarProducto(id);
  }
});

// FILTROS
busqueda.addEventListener("input", mostrarProductos);
categoria.addEventListener("change", mostrarProductos);

// VACIAR CARRITO
document.getElementById("vaciar").addEventListener("click", () => {
  carrito = [];
  actualizarCarrito();
  mostrarMensaje("El carrito ha sido vaciado.");
});

// FINALIZAR COMPRA
document.getElementById("comprar").addEventListener("click", () => {
  if (carrito.length === 0) return;

  const total = carrito.reduce(
    (acumulado, producto) =>
      acumulado + producto.precio * producto.cantidad,
    0
  );

  const descuento = total >= 100 ? total * 0.10 : 0;

  alert(
    "¡Compra realizada correctamente!\n\n" +
    "Total: " + moneda(total - descuento)
  );

  carrito = [];
  actualizarCarrito();

  mensaje.textContent = "¡Gracias por tu compra!";
  mensaje.hidden = false;
});

// INICIAR APLICACIÓN
mostrarProductos();
actualizarCarrito();
