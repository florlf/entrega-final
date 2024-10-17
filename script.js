class SimuladorGastos {
    constructor() {
        // Inicializa el ingreso y las categorías de gastos con 0
        this.ingreso = 0;
        this.gastos = {
            alquiler: {
                renta: 0,
                servicios: 0
            },
            comida: {
                necesario: 0,
                antojos: 0
            },
            transporte: {
                subte: 0,
                tren: 0
            },
            otros: {
                entretenimiento: 0,
                compras: 0
            }
        };
    }

    // Establece el ingreso y guarda los datos en localStorage
    setIngreso(ingreso) {
        this.ingreso = ingreso;
        this.guardarDatos();
    }

    // Método para agregar un gasto en la categoría especificada
    agregarGasto(categoria, subcategoria, gasto) {
        if (typeof this.gastos[categoria] === 'object') {
            this.gastos[categoria][subcategoria] += gasto;
        } else {
            this.gastos[categoria] += gasto;
        }
        this.guardarDatos();
    }

    // Método para eliminar un gasto específico
    eliminarGasto(categoria, subcategoria, gasto) {
        if (typeof this.gastos[categoria] === 'object') {
            this.gastos[categoria][subcategoria] -= gasto;
            // No permite que el gasto sea negativo
            if (this.gastos[categoria][subcategoria] < 0) {
                this.gastos[categoria][subcategoria] = 0;
            }
        }
        this.guardarDatos();
    }

    calcularTotalGastos() {
        let total = 0;
        for (let categoria in this.gastos) {
            if (typeof this.gastos[categoria] === 'object') {
                for (let subcategoria in this.gastos[categoria]) {
                    total += this.gastos[categoria][subcategoria];
                }
            } else {
                total += this.gastos[categoria];
            }
        }
        return total;
    }

    calcularSaldo() {
        return this.ingreso - this.calcularTotalGastos();
    }

    // Método para obtener la lista de gastos
    obtenerListaGastos() {
        const listaGastos = [];
        // Agrega ingresos a la lista
        if (this.ingreso > 0) {
            listaGastos.push(`Ingresos: $${this.ingreso.toFixed(2)}`);
        }
        // Agrega gastos a la lista
        for (let categoria in this.gastos) {
            if (typeof this.gastos[categoria] === 'object') {
                for (let subcategoria in this.gastos[categoria]) {
                    const gasto = this.gastos[categoria][subcategoria];
                    if (gasto > 0) {
                        listaGastos.push(`${categoria} (${subcategoria}): $${gasto.toFixed(2)}`);
                    }
                }
            }
        }
        return listaGastos;
    }

    // Método para guardar los datos en localStorage
    guardarDatos() {
        const datos = {
            ingreso: this.ingreso,
            gastos: this.gastos,
        };
        localStorage.setItem('datosFinancieros', JSON.stringify(datos));
    }

    // Método para recuperar los datos de localStorage
    recuperarDatos() {
        const datos = JSON.parse(localStorage.getItem('datosFinancieros'));
        if (datos) {
            this.ingreso = datos.ingreso;
            this.gastos = datos.gastos;
        }
    }

    // Método para reiniciar los datos
    reiniciarDatos() {
        this.ingreso = 0;
        this.gastos = {
            alquiler: {
                renta: 0,
                servicios: 0
            },
            comida: {
                necesario: 0,
                antojos: 0
            },
            transporte: {
                subte: 0,
                tren: 0
            },
            otros: {
                entretenimiento: 0,
                compras: 0
            }
        };
        localStorage.removeItem('datosFinancieros');
    }

    // Método para cargar categorías desde el archivo JSON
    async cargarCategorias() {
        try {
            const response = await fetch('categorias.json');
            const categorias = await response.json();
            this.gastos = categorias;
            this.guardarDatos();
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }
}

// Función para actualizar la lista de gastos en la interfaz
function actualizarListaGastos(listaElement, simulador, resultadoDiv) {
    listaElement.innerHTML = ''; // Limpia la lista antes de actualizar
    const listaGastos = simulador.obtenerListaGastos(); // Obtiene la lista actualizada

    listaGastos.forEach((gasto, index) => {
        const li = document.createElement('li');
        li.textContent = gasto;

        // Verifica si el gasto es de la categoría de gastos y no de ingresos
        if (!gasto.startsWith('Ingresos:')) {
            const eliminarBtn = document.createElement('button');
            eliminarBtn.innerHTML = '<i class="fas fa-times"></i>'; // Icono de "X"
            eliminarBtn.classList.add('boton-eliminar');
            eliminarBtn.onclick = () => {
                // Extrae categoría, subcategoría y monto
                const [categoria, detalle] = gasto.split(' (');
                const subcategoria = detalle ? detalle.split('):')[0] : null; // Extrae subcategoría
                const monto = parseFloat(detalle.split('$')[1]); // Extrae monto
            
                // Llama al método de eliminación de gasto
                simulador.eliminarGasto(categoria.trim(), subcategoria ? subcategoria.replace(')', '').trim() : null, monto);
            
                // Actualiza la lista de gastos
                actualizarListaGastos(listaElement, simulador, resultadoDiv);
            };

            li.appendChild(eliminarBtn);
        }

        listaElement.appendChild(li);
    });

    const totalGastos = simulador.calcularTotalGastos();
    const saldo = simulador.calcularSaldo();
    let estado = saldo >= 0 
        ? 'Su presupuesto está equilibrado.' 
        : `Está en déficit de $${Math.abs(saldo).toFixed(2)}.`;
    resultadoDiv.innerText = `Total de gastos: $${totalGastos.toFixed(2)}. Saldo: $${saldo.toFixed(2)}. ${estado}`;
}

// Función para iniciar el simulador
async function inicializarSimulador() {
    const simulador = new SimuladorGastos();
    simulador.recuperarDatos();
    await simulador.cargarCategorias(); // Carga categorías al inicio

    const ingresoInput = document.getElementById('ingreso');
    const gastoInput = document.getElementById('gasto');
    const categoriaSelect = document.getElementById('categoria');
    const subcategoriaSelect = document.getElementById('subcategoria');
    const botonIngreso = document.getElementById('agregarIngreso');
    const botonGasto = document.getElementById('agregarGasto');
    const botonReiniciar = document.getElementById('reiniciar');
    const resultadoDiv = document.getElementById('resultado');
    const resumen = document.getElementById('resumen');

    botonIngreso.addEventListener('click', () => {
        const ingreso = parseFloat(ingresoInput.value);
        if (!isNaN(ingreso) && ingreso > 0) {
            simulador.setIngreso(ingreso);
            // Muestra el contenedor de la lista de gastos
            document.getElementById('listaGastos').style.display = 'block';

            // Toastify para notificar al usuario
            Toastify({
                text: `Ingreso registrado: $${ingreso.toFixed(2)}`,
                duration: 3000,
                gravity: "top",
                position: 'right',
                style: {
                    background: "linear-gradient(to right, #00b09b, #96c93d)"
                },
                className: "toastify",
            }).showToast();
            ingresoInput.value = '';

            // Actualiza la lista de gastos para incluir el ingreso
            actualizarListaGastos(resumen, simulador, resultadoDiv);
        } else {
            Toastify({
                text: 'Por favor, ingrese un presupuesto válido.',
                duration: 3000,
                gravity: "top",
                position: 'right',
                style: {
                    background: "#cf1d12"
                },
                className: "toastify",
            }).showToast();
        }
    });

    // Evento cuando cambia la categoría para actualizar las subcategorías
    categoriaSelect.addEventListener('change', () => {
        const categoria = categoriaSelect.value;
        subcategoriaSelect.innerHTML = ''; // Limpia las opciones anteriores

        if (categoria === 'comida') {
            subcategoriaSelect.disabled = false;
            subcategoriaSelect.innerHTML = `
                <option value="necesario">Necesario</option>
                <option value="antojos">Antojos</option>
            `;
        } else if (categoria === 'transporte') {
            subcategoriaSelect.disabled = false;
            subcategoriaSelect.innerHTML = `
                <option value="subte">Subte</option>
                <option value="tren">Tren</option>
            `;
        } else if (categoria === 'alquiler') {
            subcategoriaSelect.disabled = false;
            subcategoriaSelect.innerHTML = `
                <option value="renta">Renta</option>
                <option value="servicios">Servicios</option>
            `;
        } else if (categoria === 'otros') {
            subcategoriaSelect.disabled = false;
            subcategoriaSelect.innerHTML = `
                <option value="entretenimiento">Entretenimiento</option>
                <option value="compras">Compras</option>
            `;
        } else {
            subcategoriaSelect.disabled = true;
        }
    });

    // Llama manualmente el evento change para iniciar las subcategorías
    categoriaSelect.dispatchEvent(new Event('change'));

    botonGasto.addEventListener('click', () => {
        // Verifica si el ingreso se estableció
        if (simulador.ingreso === 0) {
            Toastify({
                text: 'Por favor, primero ingrese un presupuesto.',
                duration: 3000,
                gravity: "top",
                position: 'right',
                style: {
                    background: "#cf1d12"
                },
                className: "toastify",
            }).showToast();
            return; // Se sale de la función si no hay ingreso
        }
    
        const gasto = parseFloat(gastoInput.value);
        const categoria = categoriaSelect.value;
        const subcategoria = subcategoriaSelect.value || null;
    
        if (!isNaN(gasto) && gasto > 0) {
            simulador.agregarGasto(categoria, subcategoria, gasto);
    
            // Actualiza la lista de gastos para incluir el nuevo gasto
            actualizarListaGastos(resumen, simulador, resultadoDiv);
    
            // Toast para el gasto
            Toastify({
                text: `Gasto de $${gasto.toFixed(2)} agregado en ${categoria}${subcategoria ? ` (${subcategoria})` : ''}.`,
                duration: 3000,
                gravity: "top",
                position: 'right',
                style: {
                    background: "linear-gradient(to right, #00b09b, #96c93d)"
                },
                className: "toastify",
            }).showToast();
    
            gastoInput.value = ''; // Limpia el campo de entrada de gasto
        } else {
            Toastify({
                text: 'Por favor, ingrese un monto de gasto válido.',
                duration: 3000,
                gravity: "top",
                position: 'right',
                style: {
                    background: "#cf1d12"
                },
                className: "toastify",
            }).showToast();
        }
    });
    
    // Evento para reiniciar el simulador si el usuario quiere realizar una nueva consulta
    botonReiniciar.addEventListener('click', () => {
        simulador.reiniciarDatos();
        resultadoDiv.innerText = 'Simulador reiniciado. Puede ingresar nuevos datos.';
        resumen.innerHTML = ''; // Limpia la lista de gastos
        ingresoInput.value = '';
        gastoInput.value = '';
        Toastify({
            text: 'Simulador reiniciado. Puede ingresar nuevos datos.',
            duration: 3000,
            gravity: "top",
            position: 'right',
            style: {
                background: "linear-gradient(to right, #cc92e3, #c173df)"
            },
            className: "toastify"
        }).showToast();
    });
}

document.addEventListener('DOMContentLoaded', inicializarSimulador);