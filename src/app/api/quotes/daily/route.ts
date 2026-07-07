import { NextResponse } from 'next/server'

const QUOTES = [
  { q: 'El dolor que sientes hoy será la fuerza que sentirás mañana.', a: 'Arnold Schwarzenegger' },
  { q: 'No cuentes los días. Haz que los días cuenten.', a: 'Muhammad Ali' },
  { q: 'El éxito no es final, el fracaso no es fatal: lo que cuenta es el coraje de continuar.', a: 'Winston Churchill' },
  { q: 'Tu cuerpo puede aguantar casi cualquier cosa. Es tu mente la que tienes que convencer.', a: 'Desconocido' },
  { q: 'Los campeones no se hacen en los gimnasios. Se hacen de algo profundo: el deseo, el sueño y la visión.', a: 'Muhammad Ali' },
  { q: 'El entrenamiento duro hoy, la victoria fácil mañana.', a: 'Mia Hamm' },
  { q: 'Si quieres algo que nunca has tenido, tienes que hacer algo que nunca has hecho.', a: 'Thomas Jefferson' },
  { q: 'La disciplina es elegir entre lo que quieres ahora y lo que quieres más.', a: 'Abraham Lincoln' },
  { q: 'Lo que no te mata, te hace más fuerte.', a: 'Friedrich Nietzsche' },
  { q: 'El cuerpo logra lo que la mente cree.', a: 'Jim Evans' },
  { q: 'Haz de cada entrenamiento un acto de fe en tu futuro.', a: 'Desconocido' },
  { q: 'No hay sustituto para el trabajo duro.', a: 'Thomas Edison' },
  { q: 'La grandeza no nace, se construye rep a rep.', a: 'Desconocido' },
  { q: 'Cada repetición que completas es una promesa que te haces a ti mismo.', a: 'Desconocido' },
  { q: 'Las limitaciones solo existen en tu mente.', a: 'Jamie Anderson' },
  { q: 'El secreto del cambio es enfocar toda tu energía en construir lo nuevo, no en luchar contra lo viejo.', a: 'Sócrates' },
  { q: 'Los que dicen que es imposible no deben interrumpir a quienes ya lo están haciendo.', a: 'Proverbio chino' },
  { q: 'La consistencia supera a la intensidad. Siempre.', a: 'Desconocido' },
  { q: 'El esfuerzo de hoy es el resultado de mañana.', a: 'Desconocido' },
  { q: 'No busques la gloria. Busca la excelencia y la gloria te seguirá.', a: 'Desconocido' },
  { q: 'El progreso, no la perfección, es el objetivo.', a: 'Desconocido' },
  { q: 'Cuida tu cuerpo. Es el único lugar que tienes para vivir.', a: 'Jim Rohn' },
  { q: 'El único mal entrenamiento es el que no sucedió.', a: 'Desconocido' },
  { q: 'La fuerza no viene de ganar. Tus luchas desarrollan tus fortalezas.', a: 'Arnold Schwarzenegger' },
  { q: 'Nunca te rindas en algo que no puedas pasar un día sin pensar.', a: 'Winston Churchill' },
  { q: 'Hoy entrenas para el atleta que serás mañana.', a: 'Desconocido' },
  { q: 'La motivación te lleva a empezar; el hábito te mantiene en marcha.', a: 'Jim Ryun' },
  { q: 'Cada entreno que completas te diferencia de quien no lo hizo.', a: 'Desconocido' },
  { q: 'La única forma de definir tus límites es yendo más allá de ellos.', a: 'Arthur C. Clarke' },
  { q: 'Si no te desafía, no te cambia.', a: 'Fred DeVito' },
  { q: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', a: 'Robert Collier' },
  { q: 'No te preocupes por ser mejor que los demás. Sé mejor que quien eras ayer.', a: 'Jigoro Kano' },
  { q: 'Tu único competidor real eres tú mismo.', a: 'Desconocido' },
  { q: 'La excelencia no es un destino; es un proceso continuo.', a: 'Brian Tracy' },
  { q: 'Cuando sientas ganas de rendirte, recuerda por qué empezaste.', a: 'Desconocido' },
  { q: 'Los pesos que levantas hoy son la armadura que llevas mañana.', a: 'Desconocido' },
  { q: 'Construye hábitos, no excusas.', a: 'Desconocido' },
  { q: 'El hierro es el mejor antidepresivo.', a: 'Henry Rollins' },
  { q: 'Entrena con propósito. Come con propósito. Vive con propósito.', a: 'Desconocido' },
  { q: 'Tu futuro yo te estará agradecido por cada repetición que hagas hoy.', a: 'Desconocido' },
  { q: 'El único lugar donde el éxito viene antes que el trabajo es en el diccionario.', a: 'Vidal Sassoon' },
  { q: 'Cada día es una nueva oportunidad para cambiar tu vida.', a: 'Desconocido' },
  { q: 'El músculo se gana en el gym, pero se construye en la cocina y en el sueño.', a: 'Desconocido' },
  { q: 'La diferencia entre ordinario y extraordinario es ese pequeño extra.', a: 'Jimmy Johnson' },
  { q: 'Entrena insano o permanece igual.', a: 'Desconocido' },
  { q: 'No te detengas cuando estés cansado. Detente cuando hayas terminado.', a: 'Desconocido' },
  { q: 'Eres más fuerte de lo que crees, más capaz de lo que imaginas.', a: 'Desconocido' },
  { q: 'La disciplina es la puerta a la libertad.', a: 'Jocko Willink' },
  { q: 'Primero forja la mente. Luego el cuerpo te sigue.', a: 'Desconocido' },
  { q: 'No importa lo lento que vayas, siempre y cuando no te pares.', a: 'Confucio' },
  { q: 'El único límite es el que tú mismo te pones.', a: 'Desconocido' },
  { q: 'La batalla se gana antes de entrar al gym, en la decisión de ir.', a: 'Desconocido' },
  { q: 'Cada gota de sudor es una inversión en tu versión más fuerte.', a: 'Desconocido' },
  { q: 'Cuando el cuerpo dice que no puede más, la mente decide si sigue.', a: 'Desconocido' },
  { q: 'No hay excusas, solo resultados.', a: 'Desconocido' },
  { q: 'El músculo que no trabajas hoy, lo trabaja alguien más mañana.', a: 'Desconocido' },
  { q: 'La adversidad revela al genio; la prosperidad lo oculta.', a: 'Horacio' },
  { q: 'Ser un campeón es simple: haces lo que los demás no quieren hacer.', a: 'Tom Hopkins' },
  { q: 'El secreto es empezar. El resto viene solo.', a: 'Mark Twain' },
  { q: 'Vive como si fueras a morir mañana. Aprende como si fueras a vivir para siempre.', a: 'Mahatma Gandhi' },
  { q: 'La voluntad te lleva hasta donde la motivación no puede.', a: 'Desconocido' },
]

export async function GET() {
  try {
    // Try ZenQuotes for a fresh quote
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    try {
      const res = await fetch('https://zenquotes.io/api/today', {
        signal: controller.signal,
        next: { revalidate: 3600 },
      })
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        if (data?.[0]?.q && data[0].q !== 'Too Many Requests') {
          return NextResponse.json({
            quote: data[0].q,
            author: data[0].a !== 'Unknown' ? data[0].a : 'Desconocido',
            source: 'api',
          })
        }
      }
    } catch {
      clearTimeout(timeout)
    }

    // Fallback: pick by day of year (changes daily, deterministic)
    const start = new Date(new Date().getFullYear(), 0, 0)
    const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000)
    const idx = dayOfYear % QUOTES.length
    return NextResponse.json({ ...QUOTES[idx], source: 'local' })
  } catch {
    return NextResponse.json({ ...QUOTES[0], source: 'local' })
  }
}
