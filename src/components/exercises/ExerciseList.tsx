'use client'
import { useState, useMemo, useCallback } from 'react'

const CARD='var(--card-bg,rgba(255,255,255,.04))'
const BDR='var(--card-border,rgba(255,255,255,.08))'
const T1='var(--text-primary,#fff)'
const T2='var(--text-secondary,#888)'
const T3='var(--text-tertiary,#44445a)'
const ACC='var(--accent-color,#C8FF00)'

const MC: Record<string,string> = {
  pecho:'#FF6B6B', espalda:'#4ECDC4', hombros:'#A78BFA',
  'deltoides lateral':'#A78BFA', 'deltoides anterior':'#C4B5FD',
  biceps:'#FBBF24', triceps:'#FCD34D', cuadriceps:'#60A5FA',
  isquiotibiales:'#3B82F6', gluteos:'#EC4899', gemelos:'#10B981',
  core:'#F97316', chest:'#FF6B6B', back:'#4ECDC4', shoulders:'#A78BFA',
  arms:'#FBBF24', legs:'#60A5FA', glutes:'#EC4899', calves:'#10B981',
}
const mc = (m: string) => MC[m?.toLowerCase()] ?? '#8888AA'

const MUSCLE_GROUPS = [
  'pecho','espalda','deltoides lateral','deltoides anterior',
  'biceps','triceps','cuadriceps','isquiotibiales','gluteos','gemelos','core'
]

const MOVEMENT_PATTERNS = ['push','pull','hinge','squat','carry','rotation','isolation']

interface Exercise {
  id: string; name: string; muscle_group_primary: string;
  muscle_groups_secondary: string[]; equipment: string | null;
  difficulty_level: number; is_bilateral: boolean; is_global: boolean
}

export function ExerciseList({ exercises: initial }: { exercises: Exercise[] }) {
  const [exercises, setExercises] = useState(initial)
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('Todos')
  const [showCreate, setShowCreate] = useState(false)
  const [inputFocus, setInputFocus] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  // Form state
  const [form, setForm] = useState({
    name: '', muscle_group_primary: '', equipment: '', movement_pattern: '',
    is_bilateral: true, difficulty_level: 2, description: ''
  })

  const filtered = useMemo(() => exercises.filter(ex =>
    (group === 'Todos' || ex.muscle_group_primary === group) &&
    (!search || ex.name.toLowerCase().includes(search.toLowerCase()))
  ), [exercises, search, group])

  const grouped = useMemo(() => filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const g = ex.muscle_group_primary || 'Otros'
    if (!acc[g]) acc[g] = []
    acc[g].push(ex)
    return acc
  }, {}), [filtered])

  const allGroups = useMemo(() => ['Todos', ...new Set(exercises.map(e => e.muscle_group_primary).filter(Boolean))], [exercises])

  const handleCreate = useCallback(async () => {
    if (!form.name.trim() || !form.muscle_group_primary) return
    setSaving(true); setSaveErr('')
    try {
      const res = await fetch('/api/exercises/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExercises(prev => [data.exercise, ...prev])
      setShowCreate(false)
      setForm({ name:'', muscle_group_primary:'', equipment:'', movement_pattern:'', is_bilateral:true, difficulty_level:2, description:'' })
    } catch(e) { setSaveErr(e instanceof Error ? e.message : String(e)) }
    setSaving(false)
  }, [form])

  const iStyle = (key: string): React.CSSProperties => ({
    width:'100%', background:'#0d0d14', borderRadius:11, color:T1,
    border:`1.5px solid ${inputFocus===key?ACC+'60':BDR}`,
    fontFamily:'Inter,sans-serif', fontSize:13, padding:'10px 12px',
    outline:'none', transition:'border-color 0.2s', boxSizing:'border-box',
  })

  return (
    <div>
      {/* Search */}
      <div style={{position:'relative',marginBottom:12}}>
        <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:T3}}>🔍</span>
        <input
          type="text" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar ejercicios..."
          style={{...iStyle('search'),paddingLeft:34}}
          onFocus={()=>setInputFocus('search')} onBlur={()=>setInputFocus(null)}
        />
      </div>

      {/* Group filter tabs */}
      <div style={{display:'flex',gap:6,overflowX:'auto',scrollbarWidth:'none',marginBottom:16,paddingBottom:2}}>
        {allGroups.map(g=>(
          <button key={g} onClick={()=>setGroup(g)} style={{
            padding:'6px 12px',borderRadius:100,fontSize:10,fontWeight:700,
            fontFamily:'Syne,sans-serif',cursor:'pointer',whiteSpace:'nowrap',
            background:group===g?mc(g)+'22':'transparent',
            color:group===g?mc(g):T3,
            border:`1px solid ${group===g?mc(g)+'40':BDR}`,transition:'all .15s',
          }}>{g}</button>
        ))}
      </div>

      {/* Custom exercise create button */}
      {!showCreate&&(
        <button onClick={()=>setShowCreate(true)} style={{
          width:'100%',marginBottom:14,padding:'11px 0',background:'transparent',
          border:`1px dashed ${ACC}30`,borderRadius:12,color:ACC,fontSize:12,
          fontWeight:700,fontFamily:'Syne,sans-serif',cursor:'pointer',
          transition:'border-color .15s,background .15s',
        }}
          onMouseEnter={e=>{(e.currentTarget as any).style.background=`${ACC}08`}}
          onMouseLeave={e=>{(e.currentTarget as any).style.background='transparent'}}
        >+ Crear ejercicio personalizado</button>
      )}

      {/* Create form */}
      {showCreate&&(
        <div style={{background:CARD,border:`1px solid ${ACC}25`,borderRadius:16,padding:16,marginBottom:16}}>
          <p style={{margin:'0 0 14px',fontSize:13,fontWeight:700,color:T1,fontFamily:'Syne,sans-serif'}}>✏️ Nuevo ejercicio</p>

          <div style={{marginBottom:10}}>
            <label style={{display:'block',fontSize:9,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>Nombre *</label>
            <input type="text" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="ej. Press banca agarre cerrado" autoFocus
              style={iStyle('name')} onFocus={()=>setInputFocus('name')} onBlur={()=>setInputFocus(null)}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <label style={{display:'block',fontSize:9,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>Grupo muscular *</label>
              <select value={form.muscle_group_primary} onChange={e=>setForm(f=>({...f,muscle_group_primary:e.target.value}))}
                style={{...iStyle('mg'),appearance:'none' as any}} onFocus={()=>setInputFocus('mg')} onBlur={()=>setInputFocus(null)}>
                <option value="">Seleccionar...</option>
                {MUSCLE_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:9,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>Equipamiento</label>
              <input type="text" value={form.equipment} onChange={e=>setForm(f=>({...f,equipment:e.target.value}))}
                placeholder="Barra, mancuerna..."
                style={iStyle('eq')} onFocus={()=>setInputFocus('eq')} onBlur={()=>setInputFocus(null)}/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <label style={{display:'block',fontSize:9,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>Patrón</label>
              <select value={form.movement_pattern} onChange={e=>setForm(f=>({...f,movement_pattern:e.target.value}))}
                style={{...iStyle('mp'),appearance:'none' as any}} onFocus={()=>setInputFocus('mp')} onBlur={()=>setInputFocus(null)}>
                <option value="">Ninguno</option>
                {MOVEMENT_PATTERNS.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:9,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>Dificultad (1-5)</label>
              <input type="number" min={1} max={5} value={form.difficulty_level} onChange={e=>setForm(f=>({...f,difficulty_level:parseInt(e.target.value)||2}))}
                style={iStyle('dif')} onFocus={()=>setInputFocus('dif')} onBlur={()=>setInputFocus(null)}/>
            </div>
          </div>

          <div style={{marginBottom:10}}>
            <label style={{display:'block',fontSize:9,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>Descripción</label>
            <input type="text" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              placeholder="Notas opcionales..."
              style={iStyle('desc')} onFocus={()=>setInputFocus('desc')} onBlur={()=>setInputFocus(null)}/>
          </div>

          {/* Bilateral toggle */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <button
              onClick={()=>setForm(f=>({...f,is_bilateral:!f.is_bilateral}))}
              style={{
                width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',
                background:form.is_bilateral?ACC:'rgba(255,255,255,.08)',
                transition:'background .2s',position:'relative',flexShrink:0
              }}
            >
              <span style={{
                position:'absolute',top:2,left:form.is_bilateral?22:2,width:20,height:20,
                borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'
              }}/>
            </button>
            <span style={{fontSize:12,color:T2,fontFamily:'DM Mono,monospace'}}>
              {form.is_bilateral?'Bilateral (ambos lados)':'Unilateral (un lado)'}
            </span>
          </div>

          {saveErr&&<p style={{color:'#FF6B6B',fontSize:11,marginBottom:10,fontFamily:'DM Mono,monospace'}}>{saveErr}</p>}

          <div style={{display:'flex',gap:10}}>
            <button onClick={handleCreate} disabled={saving||!form.name.trim()||!form.muscle_group_primary} style={{
              flex:1,padding:'11px 0',background:ACC,border:'none',borderRadius:11,
              color:'#0A0A0F',fontWeight:700,fontSize:12,fontFamily:'Syne,sans-serif',
              cursor:saving||!form.name.trim()||!form.muscle_group_primary?'not-allowed':'pointer',
              opacity:!form.name.trim()||!form.muscle_group_primary?0.4:1,
            }}>{saving?'Guardando...':'Guardar ejercicio'}</button>
            <button onClick={()=>{setShowCreate(false);setSaveErr('')}} style={{
              flex:1,padding:'11px 0',background:'transparent',border:`1px solid ${BDR}`,
              borderRadius:11,color:T2,fontWeight:700,fontSize:12,fontFamily:'Syne,sans-serif',cursor:'pointer'
            }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Exercise list */}
      {Object.entries(grouped).map(([g,exs])=>(
        <div key={g} style={{marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:mc(g),flexShrink:0}}/>
            <p style={{margin:0,fontSize:10,fontWeight:700,color:mc(g),fontFamily:'Syne,sans-serif',textTransform:'uppercase',letterSpacing:'.1em'}}>
              {g} <span style={{color:T3,fontWeight:400}}>({exs.length})</span>
            </p>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {exs.map(ex=>(
              <div key={ex.id} style={{
                display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'12px 14px',background:CARD,border:`1px solid ${BDR}`,
                borderRadius:12,gap:10,
              }}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontSize:13,fontWeight:600,color:T1,fontFamily:'Syne,sans-serif',
                    display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                    {ex.name}
                    {!ex.is_global&&(
                      <span style={{fontSize:9,color:ACC,background:ACC+'15',border:`1px solid ${ACC}30`,padding:'1px 6px',borderRadius:4,fontFamily:'DM Mono,monospace',letterSpacing:'.06em'}}>custom</span>
                    )}
                  </p>
                  <p style={{margin:'3px 0 0',fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>
                    {ex.equipment??'Peso libre'}
                    {ex.is_bilateral?' · Bilateral':' · Unilateral'}
                    {ex.difficulty_level&&` · ${'★'.repeat(ex.difficulty_level)}${'☆'.repeat(5-ex.difficulty_level)}`}
                  </p>
                </div>
                <div style={{width:8,height:8,borderRadius:'50%',background:mc(ex.muscle_group_primary),flexShrink:0,opacity:0.6}}/>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!filtered.length&&(
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <p style={{fontSize:28,margin:'0 0 8px'}}>🏋️</p>
          <p style={{fontSize:13,color:T2,fontFamily:'Syne,sans-serif'}}>No se encontraron ejercicios</p>
        </div>
      )}
    </div>
  )
}
