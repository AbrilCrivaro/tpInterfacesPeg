
const TAM_CASILLERO = 56;        
const CANT_FILAS = 7;            
const CANT_COLUMNAS = 7;         
const RADIO_FICHA = 22;          
const TIEMPO_LIMITE_S = 300;     
const INVALIDA = -1;             // marca de casillero que no existe (las esquinas)
const ANCHO_LIENZO = 800; // 16:9
const ALTO_LIENZO = 450;
const TABLERO_X = (ANCHO_LIENZO - CANT_COLUMNAS * TAM_CASILLERO) / 2;   // margen izquierdo del tablero 
const TABLERO_Y = (ALTO_LIENZO - CANT_FILAS * TAM_CASILLERO) / 2;       // margen superior del tablero 

const IMAGEN_TABLERO = 'assets/peg/tablero.jpg';
const IMAGENES_FICHAS = [        // un tipo de ficha por imagen
    'assets/peg/ficha-1.png',
    'assets/peg/ficha-2.png',
    'assets/peg/ficha-3.png'
];

function cargarImagen(ruta) {
    const imagen = new Image();
    imagen.listo = false;
    imagen.onload = () => { imagen.listo = true; };
    imagen.src = ruta;
    return imagen;
}

// devuelve el centro del casillero de una fila y columna
function centroCasillero(fila, columna) {
    return {
        x: TABLERO_X + columna * TAM_CASILLERO + TAM_CASILLERO / 2,
        y: TABLERO_Y + fila * TAM_CASILLERO + TAM_CASILLERO / 2
    };
}

class Figura {
    
    constructor(posX, posY, contexto) {
        this.posX = posX;
        this.posY = posY;
        this.contexto = contexto;
    }

    moverA(x, y) {
        this.posX = x;
        this.posY = y;
    }

    dibujar() { }

    contienePunto(x, y) {
        return false;
    }
}

class Ficha extends Figura {
    // fila y columna: casillero en el que esta, tipo: cual de las imagenes usa
    constructor(fila, columna, tipo, imagen, contexto) {
        const centro = centroCasillero(fila, columna);
        super(centro.x, centro.y, contexto);   // inicializa posX, posY y contexto
        this.fila = fila;
        this.columna = columna;
        this.tipo = tipo;
        this.imagen = imagen;
        this.radio = RADIO_FICHA;
    }

    // apoya la ficha en el centro de un casillero 
    colocarEnCasillero(fila, columna) {
        this.fila = fila;
        this.columna = columna;
        const centro = centroCasillero(fila, columna);
        this.moverA(centro.x, centro.y);
    }

    // dibuja la ficha , circulo con imagen. colorBorde y anchoBorde cambian el borde (violeta = cuando se arrastra la ficha, rojo = la ficha no tiene saltos o es la ficha que se va a eliminar)
    dibujar(colorBorde = '#0C0D14', anchoBorde = 2, brillo = false) {  // brillo = true brillo violeta y borde lila en fichas que tienen saltos 
        const ctx = this.contexto;
        
        if (!this.imagen.listo) return;

        // circulo con sombra difuminada y borde lila que queda atras de la imagen 
        if (brillo) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.posX, this.posY, this.radio, 0, 2 * Math.PI);
            ctx.shadowColor = '#BCAFFF';
            ctx.shadowBlur = 32;
            colorBorde = '#BCAFFF';              
            anchoBorde = 0.5;
            ctx.fillStyle = '#BCAFFF';
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }

        ctx.save();                                   
        ctx.beginPath();
        ctx.arc(this.posX, this.posY, this.radio, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();                                   // es para que quede dentro del circulo la imagen 
        ctx.drawImage(this.imagen, this.posX - this.radio, this.posY - this.radio,
            this.radio * 2, this.radio * 2);
        ctx.restore();                                

        // borde de la ficha
        ctx.beginPath();
        ctx.arc(this.posX, this.posY, this.radio, 0, 2 * Math.PI);
        ctx.lineWidth = anchoBorde;
        ctx.strokeStyle = colorBorde;
        ctx.stroke();
        ctx.closePath();
    }

    // true si el punto x, y esta dentro del circulo, la distancia al centro tiene que ser menor al radio
    contienePunto(x, y) {
        const dx = this.posX - x;
        const dy = this.posY - y;
        return Math.sqrt(dx * dx + dy * dy) < this.radio;
    }
}

class Tablero {
    // guarda el canvas, las imágenes y arma el tablero con todas las fichas en su lugar
    constructor(contexto, imagenFondo, imagenesFichas) {
        this.contexto = contexto;
        this.imagenFondo = imagenFondo;
        this.imagenesFichas = imagenesFichas;
        this.celdas = [];     // matriz: invalida (esquina), null (hueco vacio) o una Ficha
        this.fichas = [];     // arreglo con todas las fichas que siguen en juego
        this.tipoFicha = 0;   // que imagen es
        this.reiniciar();
    }

    reiniciar(tipo = this.tipoFicha) {
        this.tipoFicha = tipo;
        this.celdas = [];
        this.fichas = [];
        for (let f = 0; f < CANT_FILAS; f++) {
            const fila = [];
            for (let c = 0; c < CANT_COLUMNAS; c++) {
                const enEsquina = (f < 2 || f > 4) && (c < 2 || c > 4);   // las 4 esquinas forman la cruz
                if (enEsquina) {
                    fila.push(INVALIDA);
                } else if (f === 3 && c === 3) {
                    fila.push(null);                                      // el hueco del centro empieza vacio
                } else {
                    // la ficha nueva con la imagen elegida
                    const ficha = new Ficha(f, c, tipo, this.imagenesFichas[tipo], this.contexto);
                    fila.push(ficha);   //en celdas
                    this.fichas.push(ficha); //lista de fichas en juego
                }
            }
            this.celdas.push(fila);
        }
    }

    // true si (fila, columna) esta dentro de la matriz y no es una esquina
    esCasilleroValido(fila, columna) {
        return fila >= 0 && fila < CANT_FILAS && columna >= 0 && columna < CANT_COLUMNAS
            && this.celdas[fila][columna] !== INVALIDA;
    }

    // a que casillero corresponde el punto (x, y) del canvas; null si cae fuera del tablero
    casilleroEn(x, y) {
        const fila = Math.floor((y - TABLERO_Y) / TAM_CASILLERO);       // se resta el margen del tablero
        const columna = Math.floor((x - TABLERO_X) / TAM_CASILLERO);
        if (this.esCasilleroValido(fila, columna)) {
            return { fila, columna };    // el punto cae en un casillero del tablero
        } else {
            return null;                 // cae afuera o en una esquina que no existe
        }
    }

    // true si la ficha puede saltar al casillero (nuevaFila, nuevaColumna)
    movimientoValido(ficha, nuevaFila, nuevaColumna) {
    
        if (!this.esCasilleroValido(nuevaFila, nuevaColumna)) return false;   // el destino tiene que existir y estar vacio
        if (this.celdas[nuevaFila][nuevaColumna] !== null) return false;

        const difFila = nuevaFila - ficha.fila;
        const difColumna = nuevaColumna - ficha.columna;
        // solo saltos de 2 casilleros en linea recta, no diagonal
        const esSalto = (Math.abs(difFila) === 2 && difColumna === 0) ||
                        (Math.abs(difColumna) === 2 && difFila === 0);
        if (!esSalto) return false;

        // en el casillero del medio tiene que haber una ficha para eliminarla
        return this.celdas[ficha.fila + difFila / 2][ficha.columna + difColumna / 2] instanceof Ficha;
    }

    // lista de casilleros {fila, columna} a los que esa ficha puede saltar ahora
    destinosPosibles(ficha) {
        const saltos = [[-2, 0], [2, 0], [0, -2], [0, 2]];
        return saltos
            .map(([df, dc]) => ({ fila: ficha.fila + df, columna: ficha.columna + dc }))
            .filter(d => this.movimientoValido(ficha, d.fila, d.columna));
    }

    // devuelve la ficha que queda en el medio de un salto (la que se comería al saltar a ese casillero)
    fichaEnMedio(ficha, nuevaFila, nuevaColumna) {
        return this.celdas[(ficha.fila + nuevaFila) / 2][(ficha.columna + nuevaColumna) / 2];
    }

    // ejecuta el salto: mueve la ficha y elimina la que estaba en el medio
    mover(ficha, nuevaFila, nuevaColumna) {
        const filaMedio = (ficha.fila + nuevaFila) / 2;
        const columnaMedio = (ficha.columna + nuevaColumna) / 2;

        const comida = this.fichaEnMedio(ficha, nuevaFila, nuevaColumna);
        this.celdas[filaMedio][columnaMedio] = null;
        this.fichas = this.fichas.filter(f => f !== comida);      // sale del arreglo de fichas

        this.celdas[ficha.fila][ficha.columna] = null;            // el casillero de origen queda vacio
        this.celdas[nuevaFila][nuevaColumna] = ficha;
        ficha.colocarEnCasillero(nuevaFila, nuevaColumna);
    }

    // true si queda al menos una ficha con algun salto posible (se llama despues de cada movimiento)
    hayMovimientos() {
        return this.fichas.some(ficha => this.destinosPosibles(ficha).length > 0);
    }

    // dibuja el fondo del tablero y los huecos de los casilleros
    dibujarFondo() {
        const ctx = this.contexto;
        
        ctx.fillStyle = '#12131D';
        ctx.fillRect(0, 0, ANCHO_LIENZO, ALTO_LIENZO);
        
        if (this.imagenFondo.listo) {
        ctx.drawImage(this.imagenFondo, TABLERO_X, TABLERO_Y,
        CANT_COLUMNAS * TAM_CASILLERO, CANT_FILAS * TAM_CASILLERO);
        }
        // un hueco oscuro en cada casillero valido (se ve cuando la ficha se va)
        for (let f = 0; f < CANT_FILAS; f++) {
            for (let c = 0; c < CANT_COLUMNAS; c++) {
                if (this.celdas[f][c] === INVALIDA) continue;
                const centro = centroCasillero(f, c);
                ctx.beginPath();
                ctx.arc(centro.x, centro.y, RADIO_FICHA * 0.55, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(12, 13, 20, 0.55)';
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

class Juego {
    
    constructor(lienzo) {
        this.lienzo = lienzo;
        this.ctx = lienzo.getContext('2d');

        const escala = window.devicePixelRatio || 1;
        this.ancho = ANCHO_LIENZO;                     // tamaño lógico del lienzo
        this.alto = ALTO_LIENZO;
        lienzo.width = this.ancho * escala;            // píxeles reales del canvas
        lienzo.height = this.alto * escala;
        this.ctx.scale(escala, escala);                

        // pantalla de inicio: elegir ficha y apretar comenzar
        this.capa = document.getElementById('peg-capa');
        this.capaFin = document.getElementById('peg-fin');
        this.finTitulo = document.getElementById('peg-fin-titulo');
        this.finTexto = document.getElementById('peg-fin-texto');
        this.botonFin = document.getElementById('peg-fin-reiniciar');
        this.opciones = Array.from(document.querySelectorAll('.peg-opcion'));
        this.botonComenzar = document.getElementById('peg-comenzar');
        this.tipoElegido = 0;          // índice de la ficha elegida (0, 1 o 2)

        this.tablero = new Tablero(this.ctx, cargarImagen(IMAGEN_TABLERO), IMAGENES_FICHAS.map(cargarImagen));

        this.fichaArrastrada = null;   // la ficha que tiene el mouse agarrada (o null)
        this.destinos = [];            
        this.comidas = [];             // fichas que se eliminarian con el salto (se marcan con borde rojo)
        this.fichaHover = null;        // ficha con saltos 
        this.desvioX = 0;              // diferencia entre el mouse y el centro de la ficha al agarrarla
        this.desvioY = 0;
        this.estado = 'esperando';     // 'esperando' (antes de comenzar) | 'jugando' | 'ganado' | 'sinMovimientos' | 'sinTiempo'
        this.inicio = 0;               // momento en que arrancó la partida
        this.tiempoRestante = TIEMPO_LIMITE_S;

        this.agregarEventos();
        this.reiniciar();
        requestAnimationFrame(ahora => this.bucle(ahora));
    }

    reiniciar() {
        this.tablero.reiniciar(this.tipoElegido);
        this.fichaArrastrada = null;
        this.destinos = [];
        this.comidas = [];
        this.fichaHover = null;
        this.tiempoRestante = TIEMPO_LIMITE_S;
        this.lienzo.style.cursor = 'default';
        this.estado = 'esperando';
        this.marcarOpcion();
        if (this.capaFin) this.capaFin.hidden = true;       // esconde el cartel final si estaba
        if (this.capa) {
            this.capa.hidden = false;      // muestra la pantalla de elegir ficha
        } else {
            this.comenzar();               // sin pantalla de inicio, arranca directo
        }
    }

    // el tablero se arma de nuevo con esa imagen
    elegirFicha(tipo) {
        if (this.estado !== 'esperando') return;
        this.tipoElegido = tipo;
        this.tablero.reiniciar(tipo);
        this.marcarOpcion();
    }

    // resalta en la pantalla de inicio la ficha que esta elegida
    marcarOpcion() {
        this.opciones.forEach(opcion => {
            opcion.setAttribute('aria-pressed', Number(opcion.dataset.tipo) === this.tipoElegido);
        });
    }

    // arranca la partida: esconde la pantalla de inicio y empieza a correr el tiempo
    comenzar() {
        if (this.estado !== 'esperando') return;
        if (this.capa) this.capa.hidden = true;
        this.estado = 'jugando';
        this.inicio = performance.now();
    }

    // eventos del mouse
    // mousedown, mousemove y mouseup
    agregarEventos() {
        this.lienzo.addEventListener('mousedown', e => this.alPresionar(e));
        this.lienzo.addEventListener('mousemove', e => this.alMover(e));
        this.lienzo.addEventListener('mouseup', e => this.alSoltar(e));
        // si el mouse se va del canvas se apaga el brillo y, si había una ficha agarrada, se cancela el movimiento
        this.lienzo.addEventListener('mouseleave', e => {
            this.fichaHover = null;
            this.alSoltar(e);
        });

        // pantalla de inicio: elegir una ficha y apretar Comenzar
        this.opciones.forEach(opcion => {
            opcion.addEventListener('click', () => this.elegirFicha(Number(opcion.dataset.tipo)));
        });
        if (this.botonComenzar) this.botonComenzar.addEventListener('click', () => this.comenzar());
        if (this.botonFin) this.botonFin.addEventListener('click', () => this.reiniciar());   // Reiniciar del cartel final
    }

    // convierte la posición del mouse en pantalla a coordenadas del canvas
    posicionMouse(evento) {
    const rect = this.lienzo.getBoundingClientRect();
    return {
        x: (evento.clientX - rect.left) * (this.ancho / rect.width),
        y: (evento.clientY - rect.top) * (this.alto / rect.height)
    };
    }

    // busca cual ficha está debajo del punto (x, y) o null 
    buscarFicha(x, y) {
        return this.tablero.fichas.find(ficha => ficha.contienePunto(x, y)) || null;
    }

    // mousedown: elige la ficha clickeada y calcula los hints
    alPresionar(evento) {
        if (this.estado !== 'jugando' || evento.button !== 0) return;   // solo con el boton izquierdo y la partida en curso
        const pos = this.posicionMouse(evento);
        const ficha = this.buscarFicha(pos.x, pos.y);
        if (!ficha) return;

        // la ficha cae si el salto es valido, si la ficha no tiene ninguno, no se marca nada y al soltarla vuelve
        this.fichaArrastrada = ficha;
        this.desvioX = pos.x - ficha.posX;       
        this.desvioY = pos.y - ficha.posY;
        this.destinos = this.tablero.destinosPosibles(ficha);
        this.fichaHover = null;                  // mientras se arrastra no hay brillo
        // las fichas que se pueden comer, la del medio de cada salto posible 
        this.comidas = this.destinos.map(d => this.tablero.fichaEnMedio(ficha, d.fila, d.columna));
        this.lienzo.style.cursor = 'grabbing';
    }

    // mousemove: si hay una ficha agarrada, la sigue al mouse; si no, cambia el cursor y el brillo
    alMover(evento) {
        const pos = this.posicionMouse(evento);
        if (this.fichaArrastrada) {
            this.fichaArrastrada.moverA(pos.x - this.desvioX, pos.y - this.desvioY);
        } else if (this.estado === 'jugando') {
            const ficha = this.buscarFicha(pos.x, pos.y);
            if (ficha) {
                this.lienzo.style.cursor = 'grab';       // hay una ficha bajo el mouse se pone manito
            } else {
                this.lienzo.style.cursor = 'default';    // no hay ficha, flecha normal
            }
            if (ficha && this.tablero.destinosPosibles(ficha).length > 0) {
                this.fichaHover = ficha;     // hay una ficha bajo el mouse y tiene saltos: brilla
            } else {
                this.fichaHover = null;      // no hay ficha o no tiene saltos: no brilla nada
            }
        }
    }

    // mouseup: si el casillero donde se solto es un destino valido, la ficha salta. si no, vuelve
    alSoltar(evento) {
        const ficha = this.fichaArrastrada;
        if (!ficha) return;

        let destino = null;
        if (evento.type === 'mouseup') {
            // la ficha se apoya donde esta el mouse justo al soltar 
            const pos = this.posicionMouse(evento);
            ficha.moverA(pos.x - this.desvioX, pos.y - this.desvioY);
            destino = this.tablero.casilleroEn(ficha.posX, ficha.posY);
        }
        const esValido = destino && this.tablero.movimientoValido(ficha, destino.fila, destino.columna);

        if (esValido) {
            this.tablero.mover(ficha, destino.fila, destino.columna);
            this.verificarFin();                                  
        } else {
            ficha.colocarEnCasillero(ficha.fila, ficha.columna);  // vuelve a donde estaba
        }

        this.fichaArrastrada = null;
        this.destinos = [];
        this.comidas = [];
        this.lienzo.style.cursor = 'default';
    }

    // termina la partida si ya no quedan movimientos posibles
    verificarFin() {
        if (this.tablero.hayMovimientos()) return;
        if (this.tablero.fichas.length === 1) {
            this.terminar('ganado');            
        } else {
            this.terminar('sinMovimientos');     
        }
    }

    // cierra la partida con un resultado ('ganado', 'sinMovimientos' o 'sinTiempo') y muestra el cartel final
    terminar(resultado) {
        this.estado = resultado;
        this.fichaArrastrada = null;
        this.destinos = [];
        this.comidas = [];
        this.fichaHover = null;
        this.lienzo.style.cursor = 'default';

        const quedan = this.tablero.fichas.length;
        const mensajes = {
            ganado:         ['¡Red liberada!', 'Quedó una sola ficha'],
            sinMovimientos: ['Sin movimientos', 'Quedaron ' + quedan + ' fichas'],
            sinTiempo:      ['Se acabó el tiempo', 'Quedaron ' + quedan + ' fichas']
        };
        if (!this.capaFin) return;
        this.finTitulo.textContent = mensajes[resultado][0];
        this.finTexto.textContent = mensajes[resultado][1];
        this.capaFin.hidden = false;
    }

    // descuenta el tiempo usando el reloj y corta la partida si llega a cero
    actualizarTiempo(ahora) {
        if (this.estado !== 'jugando') return;
        this.tiempoRestante = Math.max(0, TIEMPO_LIMITE_S - (ahora - this.inicio) / 1000);
        if (this.tiempoRestante === 0) this.terminar('sinTiempo');
    }

    bucle(ahora) {
        this.actualizarTiempo(ahora);
        this.dibujar(ahora);
        this.actualizarMarcador();
        requestAnimationFrame(t => this.bucle(t));
    }

    // - borde rojo: fichas que se eliminarian con el salto
    // - brillo violeta: ficha con saltos bajo el mouse
    // - ficha agarrada: borde violeta si tiene saltos, borde rojo si no tiene ninguno
    dibujar(ahora) {
        const ROJO = '#EA6B6B';
        this.ctx.clearRect(0, 0, this.lienzo.width, this.lienzo.height);
        this.tablero.dibujarFondo();
        this.dibujarHints(ahora);
        this.tablero.fichas.forEach(ficha => {
            if (ficha === this.fichaArrastrada) return;
            if (this.comidas.includes(ficha)) ficha.dibujar(ROJO, 4);
            else ficha.dibujar('#0C0D14', 2, ficha === this.fichaHover);
        });
        if (this.fichaArrastrada) {                                       // al final, para que quede arriba de todo
            const sinSaltos = this.destinos.length === 0;
            if (sinSaltos) {
                this.fichaArrastrada.dibujar(ROJO, 4);        // no tiene saltos: borde rojo
            } else {
                this.fichaArrastrada.dibujar('#9B86FF', 4);   // tiene saltos: borde violeta
            }
        }
    }

    //en el casillero donde se puede soltar la ficha hay un circulo que late
    dibujarHints(ahora) {
        const ctx = this.ctx;
        const pulso = (Math.sin(ahora / 220) + 1) / 2;       // oscila entre 0 y 1

        this.destinos.forEach(destino => {
            const centro = centroCasillero(destino.fila, destino.columna);

            // crece y se desvanece
            ctx.beginPath();
            ctx.arc(centro.x, centro.y, RADIO_FICHA * (0.6 + 0.35 * pulso), 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 102, 0, ' + (0.25 + 0.4 * pulso) + ')';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FF6600';
            ctx.stroke();
            ctx.closePath();
        });
    }

    // escribe el tiempo y las fichas restantes en la página 
    actualizarMarcador() {
        const tiempo = document.getElementById('peg-tiempo');
        const fichas = document.getElementById('peg-fichas');
        if (tiempo) {
            const total = Math.ceil(this.tiempoRestante);
            const texto = String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
            if (tiempo.textContent !== texto) tiempo.textContent = texto;
            tiempo.classList.toggle('urgente', this.tiempoRestante <= 10);   // los últimos 10 segundos en rojo
        }
        if (fichas && fichas.textContent !== String(this.tablero.fichas.length)) {
            fichas.textContent = this.tablero.fichas.length;
        }
    }
}

const lienzoPeg = document.getElementById('peg-lienzo');
if (lienzoPeg) {
    const juegoPeg = new Juego(lienzoPeg);
    const botonReiniciar = document.getElementById('peg-reiniciar');
    if (botonReiniciar) botonReiniciar.onclick = () => juegoPeg.reiniciar();
    // el menú del click derecho 
    lienzoPeg.addEventListener('contextmenu', e => e.preventDefault());
}