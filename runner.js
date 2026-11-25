
const VELOCIDAD_INICIAL = 180;     // pixeles al empezar
const VELOCIDAD_MAXIMA = 230;      
const ACELERACION = 1;           // cuanto sube la velocidad por cada segundo de partida
const FACTORES = [0, 0.15, 0.3, 0.55, 1, 1];        // capaz 
const ANCHO_IMAGEN = 800;                          
const TIEMPO_MAXIMO = 0.05;                         // tope de segundos entre cuadros

const ANCHO_ESCENA = 800;
const ALTO_ESCENA = 450;
const ALTO_SUELO = 20;
const PISO = ALTO_ESCENA - ALTO_SUELO;              // altura donde empieza la calle
const TECHO = 0;       
const LIMITE_SUPERIOR_HUECO = 40;                                 

const GRAVEDAD = 1600;                              // píxeles por segundo, cada segundo
const IMPULSO = 520;                                // velocidad hacia arriba 
const JUGADOR_X = 140;                              
const JUGADOR_ANCHO = 64;
const JUGADOR_ALTO = 64;
const DURACION_MUERTE = 0.8;                        

const ANCHO_BARRERA = 72;
const HUECO_INICIAL = 190;                          // alto del hueco al empezar
const HUECO_MINIMO = 130;                           
const ACHIQUE_HUECO = 1;                            // se achica por segundo de partida
const VARIACION_HUECO = 20;                         
const SEPARACION_MINIMA = 220;                      // distancia entre barreras
const SEPARACION_MAXIMA = 340;
const MARGEN_HUECO = 4;        

const META = 50;
const PUNTOS_BARRERA = 1;
const PUNTOS_ORBE = 5;
const PROBABILIDAD_ELEMENTO = 0.5;                  // en la mitad de los huecos aparece un elemento
const PROBABILIDAD_ORBE = 0.6;                      
const DURACION_DANADO = 3;            
const FUERZA_DANADO = 0.65;           // el impulso queda al 65 %

const MOSTRAR_CAJAS = false;                         
//const CLAVE_RECORD = 'last-rei-record';

const IMAGENES = [
    'assets/runner/capa-1.png', 'assets/runner/capa-2.png', 'assets/runner/capa-3.png',
    'assets/runner/capa-4.png', 'assets/runner/capa-5.png',
    'assets/runner/rei.png', 'assets/runner/orbe.png', 'assets/runner/dron.png',
    'assets/runner/laser.png', 'assets/runner/emisor-arriba.png', 'assets/runner/emisor-abajo.png',
    'assets/runner/titulo.png', 'assets/runner/historia-1.png', 'assets/runner/historia-2.png',
    'assets/runner/historia-3.png', 'assets/runner/victoria.png'
];
const SONIDOS = {
    impulso:  { ruta: 'assets/runner/sonidos/impulso.mp3',  volumen: 0.8 },
    punto:    { ruta: 'assets/runner/sonidos/punto.mp3',    volumen: 0.5 },
    orbe:     { ruta: 'assets/runner/sonidos/orbe.mp3',     volumen: 0.7 },
    dron:     { ruta: 'assets/runner/sonidos/dron.mp3',     volumen: 0.7 },
    choque:   { ruta: 'assets/runner/sonidos/choque.mp3',   volumen: 0.8 },
    historia: { ruta: 'assets/runner/sonidos/historia.mp3', volumen: 0.6 },
    victoria: { ruta: 'assets/runner/sonidos/victoria.mp3', volumen: 0.8 }
};
const RUTA_MUSICA = 'assets/runner/sonidos/musica.wav';
const VOLUMEN_MUSICA = 0.35;

const HISTORIA = [
    {
        imagen: 'assets/runner/historia-1.png',
        texto: '<span class="nombre-rei">Rei</span> era la última de su especie. Vivía en el planeta <span class="nombre-ceibo">Ceibo</span>, donde tuvo a sus hijos para que su especie no se extinguiera.'
    },
    {
        imagen: 'assets/runner/historia-2.png',
        texto: 'Hasta que unos terrícolas malvados llegaron y se llevaron a sus hijos.'
    },
    {
        imagen: 'assets/runner/historia-3.png',
        texto: 'Ahora comienza su aventura en el planeta Tierra, lista para rescatar lo que le pertenece: sus hijos.'
    }
];


function limitar(valor, minimo, maximo) {  //para que no se incline
    return Math.min(Math.max(valor, minimo), maximo);
}

function azar(minimo, maximo) {
    return minimo + Math.random() * (maximo - minimo);
}

function choca(a, b) {
    return a.x < b.x + b.ancho && a.x + a.ancho > b.x &&
           a.y < b.y + b.alto  && a.y + a.alto  > b.y;
}

function crearCajaDebug() {
    const div = document.createElement('div');
    div.className = 'caja-debug';
    document.getElementById('runner-escena').append(div);
    return div;
}

function mostrarCaja(div, caja) {
    div.style.width = caja.ancho + 'px';
    div.style.height = caja.alto + 'px';
    div.style.transform = `translate(${caja.x}px, ${caja.y}px)`;
}

class Capa {  //cada capa guarda el div, el factor de velocidad y cuanto avanzo
    constructor(elemento, factor) {
        this.elemento = elemento;
        this.factor = factor;
        this.posicion = 0;
    }

    actualizar(tiempoTranscurrido, velocidad) {
        this.posicion = (this.posicion + velocidad * this.factor * tiempoTranscurrido) % ANCHO_IMAGEN;
    }

    dibujar() { //corre la imagen a la izquierda
        this.elemento.style.backgroundPositionX = -this.posicion + 'px';
    }
}

class Jugador {
    constructor(elemento) {
        this.elemento = elemento;
        this.sprite = elemento.querySelector('.personaje');
        this.animacion = 'volar';

        // cuando termina una animacion de una sola vez, vuelve a volar
        this.sprite.addEventListener('animationend', () => {
            if (this.animacion !== 'muerte') {
                this.ponerEstado('volar');
            }
        });

        if (MOSTRAR_CAJAS) this.cajaDebug = crearCajaDebug();

        this.reiniciar();
    }

    reiniciar() {
        this.x = JUGADOR_X;
        this.yInicial = ALTO_ESCENA / 2 - JUGADOR_ALTO / 2;
        this.y = this.yInicial;
        this.velocidadVertical = 0;
        this.tiempoFlotando = 0;
        this.tiempoDanado = 0;                         // segundos que le quedan al daño
        this.ponerEstado('volar');
    }

    ponerEstado(nombre) {
        this.animacion = nombre;
        this.sprite.classList.remove('impulso', 'dano', 'muerte', 'orbe');
        void this.sprite.offsetWidth;                  // reinicia la animacion
        if (nombre !== 'volar') {
            this.sprite.classList.add(nombre);
        }
    }

    flotar(tiempoTranscurrido) {
        this.tiempoFlotando += tiempoTranscurrido;
        this.y = this.yInicial + Math.sin(this.tiempoFlotando * 4) * 6;
        this.velocidadVertical = 0;
    }

    danarJetpack(segundos) {
        this.tiempoDanado = segundos;
    }

    tieneJetpackDanado() {
        return this.tiempoDanado > 0;
    }

    impulsar() {
        const fuerza = this.tieneJetpackDanado() ? FUERZA_DANADO : 1;
        this.velocidadVertical = -IMPULSO * fuerza;    // asigna, no suma
        this.ponerEstado('impulso');
    }

    morir() {
        this.velocidadVertical = 0;
        this.tiempoDanado = 0;
        this.ponerEstado('muerte');
    }

    actualizar(tiempoTranscurrido) {
        this.tiempoDanado = Math.max(0, this.tiempoDanado - tiempoTranscurrido);

        this.velocidadVertical += GRAVEDAD * tiempoTranscurrido;
        this.y += this.velocidadVertical * tiempoTranscurrido;

        if (this.y < TECHO) {
            this.y = TECHO;
            this.velocidadVertical = 0;
        }
    }
    tocaElPiso() {
        return this.y + JUGADOR_ALTO >= PISO;
    }

    caja() {
        return { x: this.x + 20, y: this.y + 14, ancho: 30, alto: 40 };
    }

    dibujar() {
        const angulo = limitar(this.velocidadVertical / 12, -25, 75);
        this.elemento.style.transform =
            `translate(${this.x}px, ${this.y}px) rotate(${angulo}deg)`;
        if (MOSTRAR_CAJAS) mostrarCaja(this.cajaDebug, this.caja());

        this.elemento.classList.toggle('averiado', this.tieneJetpackDanado()); //rojo mientras dura el daño
    }
}

class Barrera {
    constructor(contenedor, centro, hueco) {
        this.x = ANCHO_ESCENA;                          
        this.centro = centro;
        this.hueco = hueco;
        this.pasada = false;                            

        this.elemento = document.createElement('div');
        this.elemento.className = 'barrera';

        const arriba = document.createElement('div'); //el laser de arriba va desde 0 hasta el borde de arriba del hueco
        arriba.className = 'barrera-laser barrera-arriba';
        arriba.style.height = (centro - hueco / 2) + 'px';

        const abajo = document.createElement('div');  //el de abajo empieza en el borde de abajo del hueco hasta la calle
        abajo.className = 'barrera-laser barrera-abajo';
        abajo.style.top = (centro + hueco / 2) + 'px';
        abajo.style.height = (PISO - (centro + hueco / 2)) + 'px';

        this.elemento.append(arriba, abajo);
        contenedor.append(this.elemento);

        if (MOSTRAR_CAJAS) {
            this.debugArriba = crearCajaDebug();
            this.debugAbajo = crearCajaDebug();
        }
    }

    actualizar(tiempoTranscurrido, velocidad) {
        this.x -= velocidad * tiempoTranscurrido;
    }

    arriba() {
    return { x: this.x + 14, y: 0, ancho: 44, alto: this.centro - this.hueco / 2 - MARGEN_HUECO };
    }

    abajo() {
        const inicio = this.centro + this.hueco / 2 + MARGEN_HUECO;
        return { x: this.x + 14, y: inicio, ancho: 44, alto: PISO - inicio };
    }

    dibujar() {
        this.elemento.style.transform = `translateX(${this.x}px)`;
        if (MOSTRAR_CAJAS) {
            mostrarCaja(this.debugArriba, this.arriba());
            mostrarCaja(this.debugAbajo, this.abajo());
        }
    }

    eliminar() {
        this.elemento.remove();
        if (MOSTRAR_CAJAS) {
            this.debugArriba.remove();
            this.debugAbajo.remove();
        }
    }
}

class Elemento {
    constructor(contenedor, tipo, x, y) {
        this.tipo = tipo;                               // orbe o dron
        this.x = x;
        this.yBase = y;
        this.y = y;
        this.tiempo = 0;
        this.tomado = false;

        this.elemento = document.createElement('div');
        this.elemento.className = 'elemento elemento-' + tipo;
        contenedor.append(this.elemento);

        if (MOSTRAR_CAJAS) this.cajaDebug = crearCajaDebug();
    }

    actualizar(tiempoTranscurrido, velocidad) {
        this.tiempo += tiempoTranscurrido;
        if (this.tipo === 'dron') {
            this.x -= velocidad * 1.35 * tiempoTranscurrido;             // mas rapido que la ciudad
            this.y = this.yBase + Math.sin(this.tiempo * 3) * 14;        // sube y baja 
        } else {
            this.x -= velocidad * tiempoTranscurrido;
            this.y = this.yBase + Math.sin(this.tiempo * 2) * 4;         // flota suave
        }
    }

    caja() {
        if (this.tipo === 'orbe') {
            return { x: this.x - 4, y: this.y - 4, ancho: 48, alto: 48 };   // mas grande
        }
        return { x: this.x + 8, y: this.y + 8, ancho: 32, alto: 22 };       // mas chica
    }

    tomar() {
        this.tomado = true;
        this.elemento.classList.add('tomado');
    }

    dibujar() {
        this.elemento.style.transform = `translate(${this.x}px, ${this.y}px)`;
        if (MOSTRAR_CAJAS) mostrarCaja(this.cajaDebug, this.caja());
    }

    eliminar() {
        this.elemento.remove();
        if (MOSTRAR_CAJAS) this.cajaDebug.remove();
    }
}

// elementos html
const escena = document.getElementById('runner-escena');
const mundo = document.querySelector('.runner-mundo');
const pantallaTitulo = document.getElementById('runner-titulo');
const pantallaHistoria = document.getElementById('runner-historia');
const historiaImagen = document.getElementById('historia-imagen');
const historiaTexto = document.getElementById('historia-texto');
const pantallaListo = document.getElementById('runner-listo');
const pantallaFin = document.getElementById('runner-fin');
const tituloFin = document.getElementById('runner-fin-titulo');
const textoFin = document.getElementById('runner-fin-texto');
const finPuntos = document.getElementById('runner-fin-puntos');
const finRecord = document.getElementById('runner-fin-record');
const botonJugarDeNuevo = document.getElementById('runner-fin-reiniciar');

const textoPuntos = document.getElementById('runner-puntos');
const textoMeta = document.getElementById('runner-meta');
const textoRecord = document.getElementById('runner-record');
const aviso = document.getElementById('runner-aviso');
const modal = document.getElementById('runner-modal');
const botonAyuda = document.getElementById('runner-boton-ayuda');
const finMetaCaja = document.getElementById('runner-fin-meta-caja');
const finMeta = document.getElementById('runner-fin-meta');

const textoTitulo = document.getElementById('runner-titulo-texto');
const botonSonido = document.getElementById('runner-boton-sonido');

// estados del juego
const juego = {
    estado: 'titulo',          // 'titulo', 'historia', 'listo', 'jugando', 'muriendo','pausa' o 'fin'
    estadoAntesDePausa: 'titulo',
    velocidad: VELOCIDAD_INICIAL,
    cuadroHistoria: 0,
    tiempoMuerte: 0,
    tiempoJugando: 0,          // segundos de partida: sirve para achicar el hueco
    distanciaProxima: 0,       // cuánto falta para crear la próxima barrera
    puntos: 0,
    gano: false,
    tiempoEnFin: 0,           // segundos desde que apareció el cartel final
};

const capas = [];
for (let indice = 0; indice < FACTORES.length; indice++) {
    const elemento = document.getElementById('capa-' + (indice + 1));
    capas.push(new Capa(elemento, FACTORES[indice]));
}

const jugador = new Jugador(document.getElementById('runner-jugador'));
const barreras = [];
const elementos = [];


const EFECTOS = {
    orbe: () => {
        sonar('orbe');
        jugador.ponerEstado('orbe');
        mostrarTexto('+' + PUNTOS_ORBE, jugador.x + 30, jugador.y);
        sumarPuntos(PUNTOS_ORBE);
    },
    dron: () => {
        sonar('dron')
        jugador.ponerEstado('dano');
        jugador.danarJetpack(DURACION_DANADO);
    }
};

// sonidos
const efectosDeSonido = {};
for (const nombre in SONIDOS) {
    const audio = new Audio(SONIDOS[nombre].ruta);
    audio.volume = SONIDOS[nombre].volumen;
    efectosDeSonido[nombre] = audio;
}

// musica con web audio
const contextoAudio = new AudioContext();
const volumenMusica = contextoAudio.createGain();
volumenMusica.gain.value = VOLUMEN_MUSICA;
volumenMusica.connect(contextoAudio.destination);

let bufferMusica = null;       // la música ya decodificada, lista para sonar
let fuenteMusica = null;       // la reproducción que está sonando ahora (o null)

fetch(RUTA_MUSICA)
    .then(respuesta => respuesta.arrayBuffer())
    .then(datos => contextoAudio.decodeAudioData(datos))
    .then(buffer => {
        bufferMusica = buffer;
        if (juego.estado !== 'titulo') iniciarMusica();   
    })
    .catch(() => {});          // si no carga, el juego sigue sin música

let silenciado = false;


const entrada = {
    impulso: false,
    tecla: false             // true si el impulso vino del teclado
};

document.addEventListener('keydown', evento => {
    contextoAudio.resume();
    if (modal.open) return;          
    if (evento.target.closest('input, textarea')) return;
    const tecla = evento.code;
    if ((tecla === 'Space' || tecla === 'ArrowUp' || tecla === 'KeyZ') && !evento.repeat) {
        evento.preventDefault();
        entrada.impulso = true;
        entrada.tecla = true;
    }
});

escena.addEventListener('mousedown', evento => {
    contextoAudio.resume();
    if (evento.button !== 0) return;                    // solo el clic izquierdo
    if (evento.target.closest('button')) return;
    entrada.impulso = true;
});

// la ruedita no hace scroll mientras se juega
escena.addEventListener('wheel', evento => {
    if (juego.estado === 'listo' || juego.estado === 'jugando') {
        evento.preventDefault();
    }
}, { passive: false });

escena.addEventListener('contextmenu', evento => {
    evento.preventDefault();                            // sin menu del clic derecho sobre el juego
});

botonJugarDeNuevo.addEventListener('click', empezar);
botonAyuda.addEventListener('click', abrirAyuda);
modal.addEventListener('close', cerrarAyuda);    // se dispara con "entendido" y con Escape

modal.addEventListener('click', evento => {      // cierra con un clic afuera
    if (evento.target === modal) modal.close();
});

botonSonido.addEventListener('click', () => {
    silenciado = !silenciado;
    botonSonido.textContent = silenciado ? '🔇' : '🔊';
    if (silenciado) {
        pararMusica();
    } else if (juego.estado !== 'titulo') {
        iniciarMusica();
    }
});

// ===== 6. Cambios de estado =====
/* function leerRecord() {
    try {
        return Number(localStorage.getItem(CLAVE_RECORD)) || 0;
    } catch (error) {
        return 0;
    }
}

function guardarRecord() {
    try {
        localStorage.setItem(CLAVE_RECORD, juego.record);
    } catch (error) {
        // si el navegador no deja guardar, seguimos sin récord
    }
} */
function precargar(rutas) {
    const promesas = [];
    for (const ruta of rutas) {
        promesas.push(new Promise(resolver => {
            const imagen = new Image();
            imagen.onload = resolver;
            imagen.onerror = resolver;      // si una falla, no se traba el juego
            imagen.src = ruta;
        }));
    }
    return Promise.all(promesas);
}

function actualizarHUD() {
    textoPuntos.textContent = juego.puntos;
    textoMeta.textContent = META;
}

function sumarPuntos(cantidad) {
    juego.puntos = Math.max(0, juego.puntos + cantidad);
    actualizarHUD();
    if (juego.puntos >= META) {
        terminar(true);
    }
}

function mostrarCuadroHistoria() {
    const cuadroActual = HISTORIA[juego.cuadroHistoria];
    historiaImagen.src = cuadroActual.imagen;
    historiaTexto.innerHTML = cuadroActual.texto;
}

function empezarHistoria() {
    iniciarMusica();                     
    sonar('historia');
    juego.estado = 'historia';
    juego.cuadroHistoria = 0;
    pantallaTitulo.hidden = true;
    pantallaHistoria.hidden = false;
    mostrarCuadroHistoria();
}

function avanzarHistoria() {
    sonar('historia'); 
    juego.cuadroHistoria++;
    if (juego.cuadroHistoria < HISTORIA.length) {
        mostrarCuadroHistoria();
    } else {
        empezar();
    }
}

function crearBarrera() {
    const hueco = Math.max(HUECO_MINIMO, HUECO_INICIAL - juego.tiempoJugando * ACHIQUE_HUECO)
                + azar(-VARIACION_HUECO, VARIACION_HUECO);
    const centro = azar(LIMITE_SUPERIOR_HUECO + hueco / 2, PISO - hueco / 2);
    barreras.push(new Barrera(mundo, centro, hueco));
    juego.distanciaProxima = azar(SEPARACION_MINIMA, SEPARACION_MAXIMA);

    // a veces aparece un orbe o un dron en el medio, antes de la próxima barrera
    if (Math.random() < PROBABILIDAD_ELEMENTO) {
        const tipo = Math.random() < PROBABILIDAD_ORBE ? 'orbe' : 'dron';
        const x = ANCHO_ESCENA + ANCHO_BARRERA + (juego.distanciaProxima - ANCHO_BARRERA) / 2;
        const y = azar(TECHO + 10, PISO - 60);
        elementos.push(new Elemento(mundo, tipo, x, y));
    }
}

function borrarBarreras() {
    for (const barrera of barreras) {
        barrera.eliminar();
    }
    barreras.length = 0;
}

function borrarElementos() {
    for (const elemento of elementos) {
        elemento.eliminar();
    }
    elementos.length = 0;
}

function empezar() {
    borrarBarreras();
    borrarElementos();
    juego.tiempoJugando = 0;
    juego.distanciaProxima = 0;
    juego.puntos = 0;
    juego.velocidad = VELOCIDAD_INICIAL;
    actualizarHUD();
    jugador.reiniciar();
    juego.estado = 'listo';
    pantallaTitulo.hidden = true;
    pantallaHistoria.hidden = true;
    pantallaFin.hidden = true;
    pantallaListo.hidden = false;
    iniciarMusica();
}

function chocar() {
    sonar('choque');  
    juego.estado = 'muriendo';
    juego.tiempoMuerte = DURACION_MUERTE;
    jugador.morir();
}

function abrirAyuda() {
    juego.estadoAntesDePausa = juego.estado;
    juego.estado = 'pausa';
    escena.classList.add('pausada');
    modal.showModal();
}

function cerrarAyuda() {
    juego.estado = juego.estadoAntesDePausa;
    escena.classList.remove('pausada');
    entrada.impulso = false;
}

function terminar(gano) {
    juego.gano = gano;
    juego.tiempoEnFin = 0;
    if (gano) {                          
        pararMusica();
        sonar('victoria');
    }
    juego.estado = 'fin';
    actualizarHUD();
    tituloFin.textContent = gano ? '¡Rescataste a tus hijos!' : 'Te chocaste';
    textoFin.textContent = gano ? 'Llegaste a la meta.' : 'Probá de nuevo.';
    finPuntos.textContent = juego.puntos;
    finMeta.textContent = META;
    finMetaCaja.hidden = gano;               // al ganar solo se muestran los puntos
    pantallaFin.classList.toggle('victoria', gano);
    pantallaFin.hidden = false;
}

function mostrarTexto(texto, x, y) {
    const div = document.createElement('div');
    div.className = 'texto-flotante';
    div.textContent = texto;
    div.style.transform = `translate(${x}px, ${y}px)`;
    div.addEventListener('animationend', () => div.remove());   // se borra solo al terminar
    escena.append(div);
}
function sonar(nombre) {
    if (silenciado) return;
    const audio = efectosDeSonido[nombre];
    audio.currentTime = 0;              
    audio.play().catch(() => {});       // si el navegador lo bloquea, no frena el juego
}

function iniciarMusica() {
    if (silenciado || !bufferMusica || fuenteMusica) return;
    fuenteMusica = contextoAudio.createBufferSource();
    fuenteMusica.buffer = bufferMusica;
    fuenteMusica.loop = true;
    fuenteMusica.connect(volumenMusica);
    fuenteMusica.start();
}

function pararMusica() {
    if (fuenteMusica) {
        fuenteMusica.stop();
        fuenteMusica = null;
    }
}
// ===== 7. Actualizar y dibujar =====
function actualizar(tiempoTranscurrido) {
    juego.velocidad = Math.min(VELOCIDAD_MAXIMA, juego.velocidad + ACELERACION * tiempoTranscurrido);
    if (entrada.impulso) {
        jugador.impulsar();
        sonar('impulso');    
    }

    for (const capa of capas) {
        capa.actualizar(tiempoTranscurrido, juego.velocidad);
    }

    // barreras: crear, mover y borrar las que salen
    juego.tiempoJugando += tiempoTranscurrido;
    juego.distanciaProxima -= juego.velocidad * tiempoTranscurrido;
    if (juego.distanciaProxima <= 0) {
        crearBarrera();
    }

    for (const barrera of barreras) {
        barrera.actualizar(tiempoTranscurrido, juego.velocidad);
    }
    while (barreras.length && barreras[0].x < -ANCHO_BARRERA) {
        const vieja = barreras.shift();
        vieja.eliminar();
    }

    // orbes y drones: mover y borrar los que salen
    for (const elemento of elementos) {
        elemento.actualizar(tiempoTranscurrido, juego.velocidad);
    }
    while (elementos.length && elementos[0].x < -60) {
        const viejo = elementos.shift();
        viejo.eliminar();
    }

    
    jugador.actualizar(tiempoTranscurrido);

    // puntos de la barrera
    for (const barrera of barreras) {
        if (!barrera.pasada && barrera.x + ANCHO_BARRERA / 2 < jugador.x + JUGADOR_ANCHO / 2) {
            barrera.pasada = true;
            sonar('punto');
            sumarPuntos(PUNTOS_BARRERA);
        }
    }

    // orbes y drones
    const caja = jugador.caja();
    for (const elemento of elementos) {
        if (!elemento.tomado && choca(caja, elemento.caja())) {
            elemento.tomar();
            EFECTOS[elemento.tipo]();
        }
    }
    if (juego.estado !== 'jugando') return;            

    // choques contra barrera
    for (const barrera of barreras) {
        if (choca(caja, barrera.arriba()) || choca(caja, barrera.abajo())) {
            chocar();
            return;
        }
    }

    // choque contra la calle
    if (jugador.tocaElPiso()) {
        jugador.y = PISO - JUGADOR_ALTO;
        chocar();
    }
}

function dibujar() {
    for (const capa of capas) {
        capa.dibujar();
    }
    for (const barrera of barreras) {
        barrera.dibujar();
    }
    for (const elemento of elementos) {
        elemento.dibujar();
    }
    jugador.dibujar();

   aviso.hidden = !jugador.tieneJetpackDanado();
}

// game loop
let tiempoAnterior = performance.now();

function cuadro(tiempoActual) {
    let tiempoTranscurrido = (tiempoActual - tiempoAnterior) / 1000;
    tiempoAnterior = tiempoActual;
    tiempoTranscurrido = Math.min(tiempoTranscurrido, TIEMPO_MAXIMO);

    switch (juego.estado) {
        case 'titulo':
            if (entrada.impulso) empezarHistoria();
            break;
        case 'historia':
            if (entrada.impulso) avanzarHistoria();
            break;
        case 'listo':
            for (const capa of capas) {
                capa.actualizar(tiempoTranscurrido, juego.velocidad);
            }
            jugador.flotar(tiempoTranscurrido);
            if (entrada.impulso) {
                juego.estado = 'jugando';
                pantallaListo.hidden = true;
                actualizar(tiempoTranscurrido);       // aplica el primer impulso en este mismo cuadro
            }
            break;
        case 'jugando':
            actualizar(tiempoTranscurrido);
            break;
        case 'muriendo':
            juego.tiempoMuerte -= tiempoTranscurrido;
            if (juego.tiempoMuerte <= 0) {
                terminar(false);
            }
            break;
        case 'pausa':
            break;                       
        case 'fin':
            juego.tiempoEnFin += tiempoTranscurrido;
            if (entrada.tecla && !juego.gano && juego.tiempoEnFin > 0.5) {
                empezar();
            }
            break;                                   
    }

    entrada.impulso = false;
    entrada.tecla = false;
    dibujar();
    requestAnimationFrame(cuadro);
}

actualizarHUD();
precargar(IMAGENES).then(() => {
    textoTitulo.textContent = 'Presioná Z o hacé clic';
    entrada.impulso = false;              // descarta clics hechos mientras cargaba
    tiempoAnterior = performance.now();
    requestAnimationFrame(cuadro);        
});