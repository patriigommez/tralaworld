// ===== VARIABLES GLOBALES =====
let datos = [];
let configuracion = {};

// ===== FUNCIONES PRINCIPALES =====
function aplicarConfiguracion() {
  if (configuracion.tema === 'oscuro') {
    document.body.classList.add('modo-oscuro');
    document.body.classList.remove('modo-claro');
    document.getElementById("modoBtn").textContent = "☀️";
  } else {
    document.body.classList.add('modo-claro');
    document.body.classList.remove('modo-oscuro');
    document.getElementById("modoBtn").textContent = "🌙";
  }
}

async function cargarConfiguracion() {
  try {
    const response = await fetch("config.yaml");
    const yamlText = await response.text();
    const parsed = jsyaml.load(yamlText);
    Object.assign(configuracion, parsed);
    aplicarConfiguracion();
  } catch (error) {
    console.log("Usando configuración por defecto", error);
  }
}

async function cargarDatos() {
  try {
    const response = await fetch("data.json");
    datos = await response.json();
    mostrarCards();
  } catch (error) {
    console.error("Error cargando datos:", error);
    mostrarErrorEnUI();
  }
}

// ===== FUNCIONES DE FAVORITOS =====
function toggleFavorito(id, event) {
  event.stopPropagation();
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  const index = favoritos.indexOf(id);
  let esFavorito;

  if (index === -1) {
    favoritos.push(id);
    esFavorito = true;
    mostrarToast('❤️ Añadido a favoritos');
  } else {
    favoritos.splice(index, 1);
    esFavorito = false;
    mostrarToast('💔 Eliminado de favoritos');

    // Si estás en la sección de favoritos, elimina el elemento del DOM
    if (window.location.hash === "#/favorites") {
      const elemento = event.target.closest(".col-md-4, .list-group-item");
      if (elemento) {
        elemento.remove();
      }

      // Si no quedan favoritos, muestra el mensaje vacío
      const container = document.getElementById('favoritos-container');
      if (favoritos.length === 0) {
        container.innerHTML = `
          <div class="col-12 text-center py-5">
            <p class="text-muted">No tienes memes favoritos aún</p>
            <button onclick="location.hash='#/home'" class="btn btn-warning mt-2">
              Explorar memes
            </button>
          </div>
        `;
      }
    }
  }

  // Actualizar almacenamiento local
  localStorage.setItem('favoritos', JSON.stringify(favoritos));

  // Actualización visual inmediata del botón en cualquier sección
  const boton = event.target;
  boton.innerHTML = esFavorito ? '❤️ Quitar' : '♡ Añadir';
  boton.classList.toggle('btn-danger', esFavorito);
  boton.classList.toggle('btn-outline-danger', !esFavorito);
}

function cargarFavoritos() {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  const container = document.getElementById('favoritos-container');
  
  if (favoritos.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <p class="text-muted">No tienes memes favoritos aún</p>
        <button onclick="location.hash='#/home'" class="btn btn-warning mt-2">
          Explorar memes
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  favoritos.forEach(id => {
    const meme = datos.find(item => item.id === id);
    if (meme) {
      const div = document.createElement("div");
      div.className = "col-md-4 mb-4";
      div.innerHTML = `
        <div class="card h-100 shadow-sm" onclick="mostrarDetalle(${meme.id})">
          <img src="${meme.imagen}" class="card-img-top" alt="${meme.titulo}" loading="lazy">
          <div class="card-body">
            <h5 class="card-title">${meme.titulo}</h5>
            <button onclick="toggleFavorito(${meme.id}, event)" 
                    class="btn btn-sm btn-danger"
                    style="z-index: 2; position: relative;">
              ❤️ Quitar
            </button>
          </div>
        </div>
      `;
      container.appendChild(div);
    }
  });
}

function actualizarBotonesFavoritos() {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  document.querySelectorAll('.btn-favorito').forEach(btn => {
    const id = parseInt(btn.dataset.id);
    if (favoritos.includes(id)) {
      btn.innerHTML = '❤️ Quitar';
      btn.classList.remove('btn-outline-danger');
      btn.classList.add('btn-danger');
    } else {
      btn.innerHTML = '♡ Añadir';
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-outline-danger');
    }
  });
}

// ===== FUNCIONES DE INTERFAZ =====
function mostrarCards(filtro = "") { 
  const contenedor = document.getElementById("memes-container");
  contenedor.innerHTML = "";

  const filtrados = datos.filter(item => {
    const coincideFiltro = item.titulo.toLowerCase().includes(filtro.toLowerCase()) || 
        item.descripcion.toLowerCase().includes(filtro.toLowerCase());
    const coincideCategoria = configuracion.categoriaSeleccionada === "todos" || 
        item.categoria === configuracion.categoriaSeleccionada;
    return coincideFiltro && coincideCategoria;
  });

  const aMostrar = filtrados.slice(0, configuracion.maxPorPagina);
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

  aMostrar.forEach(item => {
    const esFavorito = favoritos.includes(item.id);
    const div = document.createElement("div");
    div.className = configuracion.vistaLista ? "col-12 mb-3" : "col-md-4 mb-4";

    if (configuracion.vistaLista) {
      div.innerHTML = `
        <div class="list-group-item d-flex align-items-center">
          ${configuracion.mostrarImagenes && item.imagen ? 
            `<img src="${item.imagen}" class="img-thumbnail me-3" style="width: 120px; height: 90px;">` : "" }
          <div class="flex-grow-1">
            <h5 class="titulo-item mb-1">${item.titulo}</h5>
            <p class="descripcion-item mb-2">${item.descripcion}</p>
          </div>
          <div class="d-flex">
            <button onclick="mostrarDetalle(${item.id})" 
                    class="btn btn-sm btn-outline-primary me-2">
              🔍 Ver más
            </button>
            <button onclick="toggleFavorito(${item.id}, event)" 
                    class="btn btn-sm ${esFavorito ? 'btn-danger' : 'btn-outline-danger'}">
              ${esFavorito ? '❤️ Quitar' : '♡ Añadir'}
            </button>
          </div>
        </div>
      `;
    } else {
      div.innerHTML = `
        <div class="card h-100">
          ${configuracion.mostrarImagenes && item.imagen ? 
            `<img src="${item.imagen}" class="card-img-top" alt="${item.titulo}">` : ''}
          <div class="card-body">
            <h5 class="card-title">${item.titulo}</h5>
            <p class="descripcion-item mb-2">${item.descripcion}</p>
            <div class="d-flex justify-content-between">
              <button onclick="mostrarDetalle(${item.id})" 
                      class="btn btn-sm btn-outline-primary">
                🔍 Ver más
              </button>
              <button onclick="toggleFavorito(${item.id}, event)" 
                      class="btn btn-sm ${esFavorito ? 'btn-danger' : 'btn-outline-danger'}">
                ${esFavorito ? '❤️ Quitar' : '♡ Añadir'}
              </button>
            </div>
          </div>
        </div>
      `;
    }
    contenedor.appendChild(div);
  });
}

function mostrarDetalle(id) {
  const item = datos.find(d => d.id === id);
  if (!item) return;

  const detalle = document.getElementById("detalle");
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  const esFavorito = favoritos.includes(id);

  detalle.innerHTML = `
    <div class="card shadow-lg">
      <div class="card-header bg-warning">
        <div class="d-flex justify-content-between align-items-center">
          <h2 class="mb-0">${item.titulo}</h2>
          <button onclick="toggleFavorito(${item.id}, event)" 
                  class="btn btn-sm ${esFavorito ? 'btn-danger' : 'btn-outline-danger'} btn-favorito"
                  data-id="${item.id}">
            ${esFavorito ? '❤️ Quitar favorito' : '♡ Añadir a favoritos'}
          </button>
        </div>
      </div>
      <div class="card-body text-center">
        ${item.imagen ? `
        <img src="${item.imagen}" 
             class="img-fluid rounded mb-3" 
             style="max-width: 300px; height: auto;">
        ` : ''}
        <p class="lead" id="detalle-texto">${item.contenido}</p>
        ${item.audio ? `
        <div class="mt-4">
          <audio controls class="w-100" style="max-width: 400px; margin: 0 auto;">
            <source src="${item.audio}" type="audio/mpeg">
          </audio>
        </div>` : ''}
      </div>
      <div class="card-footer text-end">
        <button class="btn btn-secondary" onclick="cerrarDetalle()">Cerrar</button>
      </div>
    </div>
  `;

  // Ajustar el estilo según el tema actual
  if (configuracion.tema === 'oscuro') {
    document.getElementById("detalle-texto").style.color = "#f0f0f0"; // Blanco sutil
    document.getElementById("detalle-texto").style.fontSize = "1.1rem"; // Tamaño adecuado
    document.getElementById("detalle-texto").style.lineHeight = "1.6"; // Espaciado cómodo
  }

  detalle.style.display = "block";
  if (configuracion.animaciones) {
    detalle.scrollIntoView({ behavior: "smooth" });
  }
}

function cerrarDetalle() {
  const detalle = document.getElementById("detalle");

  // Detener cualquier audio en el detalle
  const audioElement = detalle.querySelector("audio");
  if (audioElement) {
    audioElement.pause(); // Detiene la reproducción
    audioElement.currentTime = 0; // Reinicia el audio al inicio
  }

  // Ocultar el detalle
  detalle.style.display = "none";
}

// Actualizar máximo de elementos por página
function actualizarMaxElementos() {
  const maxElementos = document.getElementById("maxElementosInput").value;
  configuracion.maxPorPagina = parseInt(maxElementos) || configuracion.maxPorPagina;
  localStorage.setItem("configMaxElementos", configuracion.maxPorPagina);
  mostrarToast(`📄 Máximo de elementos cambiado a ${configuracion.maxPorPagina}`);
  mostrarCards(document.getElementById("filtro").value); // Actualizar las cards
}

// Inicializar configuración guardada
document.addEventListener("DOMContentLoaded", () => {
  // Cargar maxElementos desde localStorage
  const maxElementosGuardado = localStorage.getItem("configMaxElementos");
  if (maxElementosGuardado) configuracion.maxPorPagina = parseInt(maxElementosGuardado);

  // Ajustar select e input
  document.getElementById("maxElementosInput").value = configuracion.maxPorPagina || "";
});

// ===== FUNCIONES DE CONFIGURACIÓN =====
function alternarTema() {
  configuracion.tema = configuracion.tema === "oscuro" ? "claro" : "oscuro";
  localStorage.setItem('configTema', configuracion.tema);
  aplicarConfiguracion();
}

function alternarVista() {
  configuracion.vistaLista = !configuracion.vistaLista;
  document.getElementById("vistaBtn").textContent = 
    configuracion.vistaLista ? "Cambiar a tarjetas" : "Cambiar a lista";
  mostrarCards(document.getElementById("filtro").value);
}

// ===== NAVEGACIÓN =====
function mostrarSeccion() {
  let hash = window.location.hash || "#/home";
  let seccionId = hash.replace("#/", "");

  console.log("📌 Navegando a la sección:", seccionId);

  document.querySelectorAll(".seccion").forEach(seccion => {
    seccion.style.display = "none";
  });

  const seccionActiva = document.getElementById(seccionId);
  if (seccionActiva) {
    seccionActiva.style.display = "block";
    document.title = `TRALAWORLD - ${seccionId.charAt(0).toUpperCase() + seccionId.slice(1)}`;

    if (seccionId === "favorites") {
      cargarFavoritos();
    } else if (seccionId === "home") {
      console.log("⚡ Recargando tarjetas en home con categoría:", configuracion.categoriaSeleccionada);
      mostrarCards(document.getElementById("filtro").value);
    }
  } else {
    console.error("❌ Error: Sección no encontrada en el DOM.");
  }
}

// ===== UTILIDADES =====
function mostrarToast(mensaje, tipo = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast show position-fixed bottom-0 end-0 m-3`;
  toast.innerHTML = `
    <div class="toast-header bg-${tipo} text-white">
      <strong class="me-auto">TRALAWORLD</strong>
      <button type="button" class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
    <div class="toast-body">
      ${mensaje}
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function limpiarFavoritos() {
  if (confirm('¿Borrar todos los favoritos?')) {
    localStorage.removeItem('favoritos');
    mostrarToast('🧹 Todos los favoritos eliminados', 'warning');
    if (window.location.hash === "#/favorites") cargarFavoritos();
    actualizarBotonesFavoritos();
  }
}

function filtrarPorCategoria() {
  const categoriaSelect = document.getElementById("categoriaSelect");
  const nuevaCategoria = categoriaSelect.value;

  // Verificar que el valor sea válido
  if (["todos", "animales", "objetos"].includes(nuevaCategoria)) {
    configuracion.categoriaSeleccionada = nuevaCategoria;
    localStorage.setItem("configCategoriaSeleccionada", nuevaCategoria);
    console.log("✅ Categoría seleccionada correctamente:", nuevaCategoria);
    mostrarCards(document.getElementById("filtro").value);
  } else {
    console.error("❌ Error: Se intentó asignar una categoría inválida:", nuevaCategoria);
  }
}

//FORMULARIO
document.getElementById("contactForm").addEventListener("submit", (event) => {
  event.preventDefault(); // Evita que la página se recargue

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();

  if (nombre && email) {
    const datosFormulario = { nombre, email };
    const jsonDatos = JSON.stringify(datosFormulario, null, 2);

    console.log("🚀 Datos en formato JSON:");
    console.log(jsonDatos); // Mostrará los datos en la consola como JSON

    // Si quieres almacenar temporalmente en localStorage
    localStorage.setItem("suscriptor", jsonDatos);

    document.getElementById("mensajeConfirmacion").style.display = "block";
    
    // 🔹 Limpiar los campos después del envío
    document.getElementById("contactForm").reset();
  }
});

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", () => {
  // Cargar tema guardado
  const temaGuardado = localStorage.getItem("configTema");
  if (temaGuardado) configuracion.tema = temaGuardado;

  cargarConfiguracion();
  cargarDatos();

  // Validar categoría antes de asignarla
  const categoriaGuardada = localStorage.getItem("configCategoriaSeleccionada");
  if (["todos", "animales", "objetos"].includes(categoriaGuardada)) {
    configuracion.categoriaSeleccionada = categoriaGuardada;
  } else {
    configuracion.categoriaSeleccionada = "todos"; // Valor por defecto
  }

  // Sincronizar categoría con el select
  const categoriaSelect = document.getElementById("categoriaSelect");
  if (categoriaSelect) {
    categoriaSelect.value = configuracion.categoriaSeleccionada;
    categoriaSelect.addEventListener("change", filtrarPorCategoria);
  }

  // Event listeners
  document.getElementById("modoBtn").addEventListener("click", alternarTema);
  document.getElementById("vistaBtn").addEventListener("click", alternarVista);
  document.getElementById("filtro").addEventListener("input", (e) => {
    mostrarCards(e.target.value);
  });

  // Navegación
  window.addEventListener("hashchange", mostrarSeccion);
  mostrarSeccion();
});
