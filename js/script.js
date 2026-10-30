const SUPABASE_URL = 'https://rileeibbxobqqlxmkcvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kroDLdSTszQsW0pf0XAqlw_0L14vAIi';

const { createClient } = supabase;

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Cliente de Supabase inicializado');

const formulario = document.getElementById('formBuscarInvitado');
const inputNombre = document.getElementById('nombreInvitado');
const mensaje = document.getElementById('mensaje');
const listaInvitados = document.getElementById('listaInvitados');


inputNombre.addEventListener('input', () => {
    inputNombre.value = inputNombre.value.replace(
        /[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g,
        ''
    );
});

// Normalizar nombres para facilitar la búsqueda
function normalizarNombre(nombre) {
    return nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') 
        .replace(/\s+/g, ' ')            
        .trim()   
        .toLowerCase();   
}

formulario.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombreIngresado = inputNombre.value;
    const nombreNormalizado = normalizarNombre(nombreIngresado);

    // Limpiar los resultados anteriores
    mensaje.textContent = 'Buscando...';
    mensaje.classList.add('mensaje');
    listaInvitados.replaceChildren();

    // Casos especiales
    const casosEspeciales = {
        'marysel caraballo': [
            'Víctor Mederos',
            'Lilian Díaz',
            'Camila Maya',
            'Guillermo Basino'
        ],
        'daniel luengo': [
            'Federico Morales',
            'Martha Díaz'
        ]
    };

    // Verificar si es un caso especial
    if (casosEspeciales[nombreNormalizado]) {
        mensaje.textContent = '';

        casosEspeciales[nombreNormalizado].forEach((nombre) => {
            const li = document.createElement('li');
            li.classList.add('invitado-item');
            li.textContent = nombre;
            listaInvitados.appendChild(li);
        });

        return;
    }

    // Buscar invitados en Supabase
    const { data: personas, error: errorPersona } = await db
        .from('Invitados')
        .select('invitadoId, invitadoNombre, invitadoGrupoId');

    if (errorPersona) {
        console.error(errorPersona);
        mensaje.textContent = 'Hubo un error al realizar la búsqueda.';
        return;
    }

    // Comparar los nombres normalizados
    const persona = personas.find(
        (p) => normalizarNombre(p.invitadoNombre) === nombreNormalizado
    );

    if (!persona) {
        mensaje.textContent = 'No encontramos ese nombre en la lista.';
        return;
    }

    // Buscar a los integrantes del mismo grupo,
    // excluyendo a la persona que realizó la búsqueda
    const { data: invitados, error: errorGrupo } = await db
        .from('Invitados')
        .select('invitadoId, invitadoNombre')
        .eq('invitadoGrupoId', persona.invitadoGrupoId)
        .neq('invitadoId', persona.invitadoId)
        .order('invitadoNombre');

    if (errorGrupo) {
        console.error(errorGrupo);
        mensaje.textContent = 'No pudimos cargar las personas de tu grupo.';
        return;
    }

    if (invitados.length === 0) {
        mensaje.textContent = 'No hay otras personas en tu grupo.';
        return;
    }

    mensaje.textContent = '';

    invitados.forEach((invitado) => {
        const li = document.createElement('li');
        li.classList.add('invitado-item');
        li.textContent = invitado.invitadoNombre;
        listaInvitados.appendChild(li);
    });
});
