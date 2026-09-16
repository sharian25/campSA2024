/* =========================================================
   Andaré con Cristo — Campamento Estaca Kennedy 2026
   Cada módulo comprueba que sus elementos existan antes de usarlos.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     Respaldo del logo: si el archivo llegara a faltar, se oculta
     la imagen y se muestra el nombre en texto, sin icono roto.
     --------------------------------------------------------- */

  function imagenOpcional(imagen, alFallar) {
    if (!imagen) return;
    if (imagen.complete) {
      if (imagen.naturalWidth === 0) alFallar();
      return;
    }
    imagen.addEventListener("error", alFallar, { once: true });
  }

  (function imagenesOpcionales() {
    var marca = document.querySelector(".marca");
    if (marca) {
      imagenOpcional(marca.querySelector(".marca__logo"), function () {
        marca.classList.add("sin-imagen");
      });
    }

    var marcaPie = document.getElementById("pie-marca");
    if (marcaPie) {
      imagenOpcional(marcaPie.querySelector(".pie__logo"), function () {
        marcaPie.classList.add("sin-imagen");
      });
    }
  })();

  /* ---------------------------------------------------------
     Cuenta regresiva (zona horaria America/Bogotá)
     --------------------------------------------------------- */

  var INICIO = new Date("2026-10-05T00:00:00-05:00").getTime();
  var FIN = new Date("2026-10-08T00:00:00-05:00").getTime();

  function estadoDelCampamento(ahora) {
    if (ahora < INICIO) return "antes";
    if (ahora < FIN) return "durante";
    return "despues";
  }

  function trozo(clase, texto) {
    var nodo = document.createElement("span");
    nodo.className = clase;
    nodo.textContent = texto;
    return nodo;
  }

  function bloqueDeTiempo(valor, unidad) {
    var caja = document.createElement("span");
    caja.className = "cuenta__bloque";
    caja.appendChild(trozo("cuenta__numero", String(valor)));
    caja.appendChild(document.createTextNode(" "));
    caja.appendChild(trozo("cuenta__unidad", unidad));
    return caja;
  }

  function piezasDeLaCuenta(ahora) {
    var falta = INICIO - ahora;
    var dias = Math.floor(falta / 86400000);
    var horas = Math.floor((falta % 86400000) / 3600000);
    var piezas = [];

    if (dias > 0) {
      piezas.push(bloqueDeTiempo(dias, dias === 1 ? "día" : "días"));
    }
    if (dias > 0 || horas > 0) {
      // Espacio real entre bloques: si no, se lee "18 días13 horas".
      if (piezas.length > 0) piezas.push(document.createTextNode(" "));
      piezas.push(bloqueDeTiempo(horas, horas === 1 ? "hora" : "horas"));
    }
    if (piezas.length === 0) {
      piezas.push(trozo("cuenta__frase", "Falta menos de una hora"));
    }
    return piezas;
  }

  (function cuentaRegresiva() {
    var caja = document.getElementById("cuenta");
    if (!caja) return;

    function pintar() {
      var ahora = Date.now();
      var estado = estadoDelCampamento(ahora);

      if (estado === "antes") {
        caja.replaceChildren.apply(caja, piezasDeLaCuenta(ahora));
      } else if (estado === "durante") {
        caja.replaceChildren(trozo("cuenta__frase", "Estamos en el campamento"));
      } else {
        caja.replaceChildren(trozo("cuenta__frase", "Gracias por caminar con nosotros"));
        document.body.classList.add("inscripcion-cerrada");
      }
      return estado;
    }

    if (pintar() === "despues") return;
    window.setInterval(pintar, 60000);
  })();

  /* ---------------------------------------------------------
     Carrusel de fondo del hero
     Con prefers-reduced-motion no rota y ni siquiera descarga
     las fotos que no se ven.
     --------------------------------------------------------- */

  (function carrusel() {
    var fondo = document.querySelector(".hero__fondo");
    var pausa = document.getElementById("hero-pausa");
    if (!fondo) return;

    var diapos = Array.prototype.slice.call(fondo.querySelectorAll(".hero__diapo"));
    if (diapos.length < 2) return;

    var DURACION = 6000;
    var actual = 0;
    var reloj = null;
    var pausadoPorElUsuario = false;
    var quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (quieto.matches) return;

    function cargarLasDemas() {
      diapos.forEach(function (diapo) {
        var imagen = diapo.querySelector("img[data-src]");
        if (!imagen) return;
        imagen.src = imagen.getAttribute("data-src");
        imagen.removeAttribute("data-src");
      });
    }

    function mostrar(indice) {
      diapos[actual].classList.remove("hero__diapo--activa");
      actual = (indice + diapos.length) % diapos.length;
      diapos[actual].classList.add("hero__diapo--activa");
    }

    function arrancar() {
      if (reloj || pausadoPorElUsuario) return;
      reloj = window.setInterval(function () {
        mostrar(actual + 1);
      }, DURACION);
    }

    function detener() {
      window.clearInterval(reloj);
      reloj = null;
    }

    if (pausa) {
      pausa.hidden = false;
      pausa.setAttribute("aria-pressed", "false");
      pausa.addEventListener("click", function () {
        pausadoPorElUsuario = !pausadoPorElUsuario;
        pausa.setAttribute("aria-pressed", String(pausadoPorElUsuario));
        pausa.setAttribute(
          "aria-label",
          pausadoPorElUsuario ? "Reanudar las fotos del fondo" : "Pausar las fotos del fondo"
        );
        if (pausadoPorElUsuario) detener();
        else arrancar();
      });
    }

    // No gastar batería ni datos con la pestaña en segundo plano
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) detener();
      else arrancar();
    });

    window.setTimeout(function () {
      cargarLasDemas();
      arrancar();
    }, 1500);
  })();

  /* ---------------------------------------------------------
     Lista de equipaje: marcar, progreso y memoria del celular
     --------------------------------------------------------- */

  (function equipaje() {
    var lista = document.getElementById("equipaje-lista");
    var progreso = document.getElementById("equipaje-progreso");
    var conteo = document.getElementById("equipaje-conteo");
    var barra = document.getElementById("equipaje-barra");
    if (!lista || !progreso || !conteo || !barra) return;

    var CLAVE = "andare-equipaje-v1";
    var casillas = Array.prototype.slice.call(
      lista.querySelectorAll(".lista__casilla")
    );
    if (casillas.length === 0) return;

    function leerGuardado() {
      try {
        var crudo = window.localStorage.getItem(CLAVE);
        var datos = crudo ? JSON.parse(crudo) : [];
        return Array.isArray(datos) ? datos : [];
      } catch (error) {
        return [];
      }
    }

    function guardar() {
      try {
        var marcadas = casillas
          .filter(function (casilla) {
            return casilla.checked;
          })
          .map(function (casilla) {
            return casilla.id;
          });
        window.localStorage.setItem(CLAVE, JSON.stringify(marcadas));
      } catch (error) {
        /* Si el navegador no deja guardar, la lista sigue funcionando. */
      }
    }

    var grupos = Array.prototype.slice.call(lista.querySelectorAll(".grupo"));
    var textoProgreso = conteo.querySelector("[data-progreso-texto]");
    var porcentaje = conteo.querySelector("[data-progreso-porcentaje]");

    function actualizarGrupos() {
      grupos.forEach(function (grupo) {
        var cajas = grupo.querySelectorAll(".lista__casilla");
        var listos = grupo.querySelectorAll(".lista__casilla:checked").length;
        var marcador = grupo.querySelector("[data-marcador]");
        if (marcador) {
          marcador.hidden = false;
          marcador.textContent = listos + " / " + cajas.length;
        }
        grupo.classList.toggle("grupo--completo", listos === cajas.length);
      });
    }

    function actualizarProgreso() {
      var listos = casillas.filter(function (casilla) {
        return casilla.checked;
      }).length;
      var todo = listos === casillas.length;

      if (textoProgreso) {
        textoProgreso.textContent = todo
          ? "Ya tienes todo listo"
          : listos + " de " + casillas.length + " listos";
      } else {
        conteo.textContent = listos + " de " + casillas.length + " listos";
      }
      if (porcentaje) {
        porcentaje.textContent = Math.round((listos / casillas.length) * 100) + " %";
      }
      progreso.classList.toggle("progreso--completo", todo);
      barra.value = listos;
      actualizarGrupos();
    }

    var guardadas = leerGuardado();
    casillas.forEach(function (casilla) {
      if (guardadas.indexOf(casilla.id) !== -1) casilla.checked = true;
    });

    barra.max = casillas.length;
    progreso.hidden = false;
    actualizarProgreso();

    lista.addEventListener("change", function (evento) {
      if (!evento.target.classList.contains("lista__casilla")) return;
      actualizarProgreso();
      guardar();
    });

    var reiniciar = document.getElementById("equipaje-reiniciar");
    if (reiniciar) {
      reiniciar.hidden = false;
      reiniciar.addEventListener("click", function () {
        casillas.forEach(function (casilla) {
          casilla.checked = false;
        });
        actualizarProgreso();
        guardar();
      });
    }

    var imprimir = document.getElementById("equipaje-imprimir");
    if (imprimir) {
      imprimir.hidden = false;
      imprimir.addEventListener("click", function () {
        window.print();
      });
    }
  })();

  /* ---------------------------------------------------------
     Visor de fotos del lugar
     --------------------------------------------------------- */

  (function galeria() {
    var galeria = document.getElementById("galeria");
    var visor = document.getElementById("visor");
    var imagen = document.getElementById("visor-imagen");
    var conteo = document.getElementById("visor-conteo");
    var anterior = document.getElementById("visor-anterior");
    var siguiente = document.getElementById("visor-siguiente");
    var cerrar = document.getElementById("visor-cerrar");

    if (!galeria || !visor || !imagen || !conteo) return;
    if (typeof visor.showModal !== "function") return;

    var botones = Array.prototype.slice.call(
      galeria.querySelectorAll(".galeria__boton")
    );
    if (botones.length === 0) return;

    var fotos = botones.map(function (boton) {
      var miniatura = boton.querySelector("img");
      return {
        src: boton.getAttribute("data-grande"),
        ancho: boton.getAttribute("data-ancho"),
        alto: boton.getAttribute("data-alto"),
        alt: miniatura ? miniatura.alt : ""
      };
    });

    var actual = 0;
    var origen = null;

    function mostrar(indice) {
      actual = (indice + fotos.length) % fotos.length;
      var foto = fotos[actual];
      imagen.width = foto.ancho;
      imagen.height = foto.alto;
      imagen.src = foto.src;
      imagen.alt = foto.alt;
      conteo.textContent = "Foto " + (actual + 1) + " de " + fotos.length;
    }

    botones.forEach(function (boton, indice) {
      boton.addEventListener("click", function () {
        origen = boton;
        mostrar(indice);
        visor.showModal();
      });
    });

    if (anterior) {
      anterior.addEventListener("click", function () {
        mostrar(actual - 1);
      });
    }

    if (siguiente) {
      siguiente.addEventListener("click", function () {
        mostrar(actual + 1);
      });
    }

    if (cerrar) {
      cerrar.addEventListener("click", function () {
        visor.close();
      });
    }

    visor.addEventListener("keydown", function (evento) {
      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        mostrar(actual - 1);
      } else if (evento.key === "ArrowRight") {
        evento.preventDefault();
        mostrar(actual + 1);
      }
    });

    // Cerrar al tocar por fuera de la foto
    visor.addEventListener("click", function (evento) {
      if (evento.target === visor) visor.close();
    });

    visor.addEventListener("close", function () {
      imagen.removeAttribute("src");
      if (origen) origen.focus();
    });
  })();

  /* ---------------------------------------------------------
     Video: se carga solo cuando el usuario lo pide
     --------------------------------------------------------- */

  (function video() {
    var caja = document.getElementById("video");
    var boton = document.getElementById("video-boton");
    if (!caja || !boton) return;

    boton.addEventListener("click", function () {
      var marco = document.createElement("iframe");
      marco.src =
        "https://www.youtube-nocookie.com/embed/KaUJCYGtr-c?autoplay=1&rel=0";
      marco.title = "Video de CampoBase Suesca";
      marco.allow =
        "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
      marco.referrerPolicy = "strict-origin-when-cross-origin";
      marco.allowFullscreen = true;
      caja.replaceChildren(marco);
      marco.focus();
    });
  })();

  /* ---------------------------------------------------------
     Barra fija de celular
     --------------------------------------------------------- */

  (function barraMovil() {
    var barra = document.getElementById("barra-movil");
    var inscripcion = document.getElementById("inscripcion");
    if (!barra) return;
    if (document.body.classList.contains("inscripcion-cerrada")) return;

    barra.hidden = false;
    document.body.classList.add("con-barra");

    if (!inscripcion || typeof window.IntersectionObserver !== "function") return;

    var vigia = new window.IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          barra.hidden = entrada.isIntersecting;
        });
      },
      { threshold: 0.15 }
    );

    vigia.observe(inscripcion);
  })();

  /* ---------------------------------------------------------
     Cerrar el menú al tocar un enlace
     --------------------------------------------------------- */

  (function menu() {
    var menu = document.getElementById("menu");
    if (!menu || !window.bootstrap || !window.bootstrap.Collapse) return;

    menu.addEventListener("click", function (evento) {
      var enlace = evento.target.closest(".nav-link");
      if (!enlace || !menu.classList.contains("show")) return;
      window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
    });
  })();
})();
