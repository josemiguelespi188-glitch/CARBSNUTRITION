const FLAVORS = [
  "unflavored","blue_raspberry","lemon_lime","cherry","pineapple","kiwi","watermelon",
  "root_beer","grape","green_apple","mixed_berry","seagull","pina_colada","peach",
  "tangerine_natural","grape_natural","pineapple_natural","mango_natural","cotton_candy_natural","hybrid"
];
const FLAVOR_LABELS = {
  unflavored:{es:"Sin sabor",en:"Unflavored"},
  blue_raspberry:{es:"Blue Raspberry",en:"Blue Raspberry"},
  lemon_lime:{es:"Lemon Lime",en:"Lemon Lime"},
  cherry:{es:"Cherry (Cereza)",en:"Cherry"},
  pineapple:{es:"Pineapple (Piña)",en:"Pineapple"},
  kiwi:{es:"Kiwi",en:"Kiwi"},
  watermelon:{es:"Watermelon (Sandía)",en:"Watermelon"},
  root_beer:{es:"Root Beer",en:"Root Beer"},
  grape:{es:"Grape (Uva)",en:"Grape"},
  green_apple:{es:"Green Apple",en:"Green Apple"},
  mixed_berry:{es:"Mixed Berry",en:"Mixed Berry"},
  seagull:{es:"Spirit of The Seagull",en:"Spirit of The Seagull"},
  pina_colada:{es:"Piña Colada",en:"Piña Colada"},
  peach:{es:"Peach (Durazno)",en:"Peach"},
  tangerine_natural:{es:"Tangerine (Natural)",en:"Tangerine (All Natural)"},
  grape_natural:{es:"Grape (Natural)",en:"Grape (All Natural)"},
  pineapple_natural:{es:"Pineapple (Natural)",en:"Pineapple (All Natural)"},
  mango_natural:{es:"Mango (Natural)",en:"Mango (All Natural)"},
  cotton_candy_natural:{es:"Cotton Candy (Natural)",en:"Cotton Candy (All Natural)"},
  hybrid:{es:"Híbrido",en:"Hybrid"},
};

let answers = {};
let mix = {};
let steps, currentStep = 0;

document.addEventListener("DOMContentLoaded", () => {
  steps = document.querySelectorAll(".step");
  const form = document.getElementById("surveyForm");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const progressFill = document.getElementById("progressFill");
  const purposeRadios = form.querySelectorAll('input[name="purpose"]');
  const eventInput = document.getElementById("eventName");

  populateFlavorSelects();

  function updateConditional(){
    const val = form.querySelector('input[name="purpose"]:checked');
    eventInput.style.display = (val && (val.value === "race" || val.value === "both")) ? "block" : "none";
  }
  purposeRadios.forEach(r => r.addEventListener("change", updateConditional));
  updateConditional();
  eventInput.style.display = "none";

  function showStep(i){
    steps.forEach((s,idx)=> s.classList.toggle("active", idx===i));
    prevBtn.disabled = i===0;
    nextBtn.style.display = i === steps.length-1 ? "none" : "inline-block";
    progressFill.style.width = `${((i+1)/steps.length)*100}%`;
  }

  function validateStep(i){
    const stepEl = steps[i];
    const inputs = stepEl.querySelectorAll("input[required], select[required]");
    for(const inp of inputs){
      if(inp.type === "radio"){
        const group = stepEl.querySelectorAll(`input[name="${inp.name}"]`);
        if(![...group].some(r=>r.checked)){ alert(currentLang==="es"?"Por favor responde todas las preguntas.":"Please answer all questions."); return false; }
      } else if(!inp.value){
        alert(currentLang==="es"?"Por favor responde todas las preguntas.":"Please answer all questions.");
        return false;
      }
    }
    return true;
  }

  nextBtn.addEventListener("click", ()=>{
    if(!validateStep(currentStep)) return;
    if(currentStep < steps.length-1){ currentStep++; showStep(currentStep); }
  });
  prevBtn.addEventListener("click", ()=>{
    if(currentStep > 0){ currentStep--; showStep(currentStep); }
  });
  showStep(currentStep);

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    if(!validateStep(currentStep)) return;
    collectAnswers();
    buildRecommendation();
    renderResult();
    document.getElementById("survey").classList.add("hidden");
    document.getElementById("result").classList.remove("hidden");
    window.scrollTo({top:0, behavior:"smooth"});
  });

  document.getElementById("restartBtn").addEventListener("click", ()=>{
    document.getElementById("result").classList.add("hidden");
    document.getElementById("survey").classList.remove("hidden");
    currentStep = 0; showStep(0);
    form.reset();
    document.getElementById("aiChatLog").innerHTML = "";
    document.getElementById("aiChatBox").classList.add("hidden");
    window.scrollTo({top:0, behavior:"smooth"});
  });

  // Editor live updates
  ["edCarbs","edSodium","edRatio","edCaffeine","edSweetener","edPreservatives","edFlavor","edStrength","edScooper","edNotes"]
    .forEach(id => document.getElementById(id).addEventListener("input", syncMixFromEditor));

  document.getElementById("askAiBtn").addEventListener("click", ()=>{
    const box = document.getElementById("aiChatBox");
    box.classList.toggle("hidden");
    if(box.classList.contains("hidden")) return;
    if(document.getElementById("aiChatLog").children.length === 0){
      addChatMsg("bot", aiGreeting());
    }
  });
  document.getElementById("aiChatSend").addEventListener("click", sendChat);
  document.getElementById("aiChatInput").addEventListener("keydown", e=>{
    if(e.key === "Enter") sendChat();
  });
});

function populateFlavorSelects(){
  const edFlavor = document.getElementById("edFlavor");
  FLAVORS.forEach(f=>{
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = FLAVOR_LABELS[f][currentLang];
    opt.dataset.flavorKey = f;
    edFlavor.appendChild(opt);
  });
}

function collectAnswers(){
  const form = document.getElementById("surveyForm");
  answers = {
    name: document.getElementById("athleteName").value.trim() || (currentLang==="es" ? "Atleta" : "Athlete"),
    event: document.getElementById("eventName").value.trim(),
    purpose: form.querySelector('input[name="purpose"]:checked').value,
    duration: form.querySelector('input[name="duration"]:checked').value,
    climate: form.querySelector('input[name="climate"]:checked').value,
    caffeine: form.querySelector('input[name="caffeine"]:checked').value,
    sugar: form.querySelector('input[name="sugar"]:checked').value,
    flavor: document.getElementById("flavor").value,
    strength: form.querySelector('input[name="strength"]:checked').value,
    notes: document.getElementById("notes").value.trim(),
  };
}

function buildRecommendation(){
  // Carbs based on session duration
  let carbs = 50;
  if(answers.duration === "short") carbs = 25;
  else if(answers.duration === "medium") carbs = 75;
  else if(answers.duration === "long") carbs = 100;

  // Sodium based on climate / sweat rate
  let sodium = 600;
  if(answers.climate === "low") sodium = 400;
  else if(answers.climate === "medium") sodium = 600;
  else if(answers.climate === "high") sodium = 1000;

  // Caffeine
  let caffeine = 0;
  if(answers.caffeine === "low") caffeine = 25;
  else if(answers.caffeine === "high") caffeine = 75;
  else if(answers.caffeine === "split") caffeine = 50;

  // Long sessions favor higher fructose ratio for better absorption
  const ratio = (answers.duration === "long") ? "2:1" : "1:0.8";

  // Sweetener
  let sweetener = "standard";
  if(answers.sugar === "natural") sweetener = "natural";
  else if(answers.sugar === "sensitive") sweetener = "low";

  const flavor = answers.flavor || "unflavored";

  mix = {
    carbs, sodium, caffeine, ratio, sweetener,
    preservatives: "yes",
    flavor,
    strength: answers.strength || "regular",
    scooper: "yes",
    notes: answers.notes,
  };
}

function aiExplanationText(){
  const d = translations[currentLang];
  const lines = [];
  if(currentLang === "es"){
    lines.push(`Elegimos ${mix.carbs}g de carbohidratos por porción porque indicaste sesiones de ${
      answers.duration === "short" ? "menos de 1 hora" : answers.duration === "medium" ? "1 a 3 horas" : "más de 3 horas"
    }; tus reservas de glucógeno necesitan ese ritmo de reposición para sostener tu rendimiento.`);
    lines.push(`El sodio quedó en ${mix.sodium}mg porque describiste un clima/nivel de sudoración "${
      answers.climate === "low" ? "bajo" : answers.climate === "medium" ? "moderado" : "alto"
    }" — así evitamos calambres e hiponatremia sin pasarte de sal.`);
    lines.push(`La cafeína quedó en ${mix.caffeine}mg según tu tolerancia (${
      {none:"prefieres sin cafeína", low:"baja tolerancia", high:"alta tolerancia", split:"quieres ambas versiones"}[answers.caffeine]
    }).`);
    if(mix.ratio === "2:1") lines.push(`Usamos proporción Malto:Fructosa 2:1 porque en sesiones largas esta mezcla mejora la absorción de carbohidratos y reduce molestias digestivas.`);
    if(mix.sweetener === "natural") lines.push(`Como prefieres endulzantes naturales, priorizamos una base tipo miel en vez de edulcorantes estándar.`);
    if(mix.sweetener === "low") lines.push(`Como eres sensible al azúcar, redujimos la carga dulce manteniendo el aporte energético que necesitas.`);
    if(answers.purpose === "race") lines.push(`Como esto es para tu evento "${answers.event || "tu carrera"}", el mix está optimizado para rendimiento sostenido el día de la competencia.`);
    if(answers.purpose === "both") lines.push(`Como pediste un pack doble, te sugerimos esta versión para entrenamiento — y replicaremos un segundo pack ajustado a las exigencias específicas de "${answers.event || "tu carrera"}".`);
    lines.push(`El sabor "${FLAVOR_LABELS[mix.flavor][currentLang]}" con intensidad ${
      {regular:"regular", lite:"lite", mega:"mega"}[mix.strength]
    } fue tu elección — todo es ajustable abajo si quieres experimentar.`);
  } else {
    lines.push(`We set ${mix.carbs}g of carbs per serving because you train in sessions of ${
      answers.duration === "short" ? "under 1 hour" : answers.duration === "medium" ? "1–3 hours" : "more than 3 hours"
    }; your glycogen stores need that replenishment rate to sustain performance.`);
    lines.push(`Sodium landed at ${mix.sodium}mg based on your "${
      answers.climate === "low" ? "low" : answers.climate === "medium" ? "moderate" : "high"
    }" sweat rate / climate — enough to prevent cramping and hyponatremia without overdoing salt.`);
    lines.push(`Caffeine is set to ${mix.caffeine}mg based on your tolerance (${
      {none:"you prefer none", low:"low tolerance", high:"high tolerance", split:"you want both versions"}[answers.caffeine]
    }).`);
    if(mix.ratio === "2:1") lines.push(`We used a 2:1 Malto:Fructose ratio because for long sessions this blend improves carb absorption and reduces GI discomfort.`);
    if(mix.sweetener === "natural") lines.push(`Since you prefer natural sweeteners, we prioritized a honey-type base over standard sweeteners.`);
    if(mix.sweetener === "low") lines.push(`Since you're sugar-sensitive, we reduced the sweetness load while keeping the energy you need.`);
    if(answers.purpose === "race") lines.push(`Since this is for your event "${answers.event || "your race"}", the mix is tuned for sustained performance on race day.`);
    if(answers.purpose === "both") lines.push(`Since you asked for a double pack, this version is for training — we'll mirror a second pack tuned to the demands of "${answers.event || "your race"}".`);
    lines.push(`You picked the "${FLAVOR_LABELS[mix.flavor][currentLang]}" flavor at ${
      {regular:"regular", lite:"lite", mega:"mega"}[mix.strength]
    } strength — everything is adjustable below if you want to experiment.`);
  }
  return lines.join(" ");
}

function motivationPhrase(){
  const d = translations[currentLang];
  if(answers.purpose === "race") return d.motivation_race(answers.event || (currentLang==="es"?"carrera":"race"));
  if(answers.purpose === "both") return d.motivation_both(answers.event || (currentLang==="es"?"tu carrera":"your race"));
  return d.motivation_training(answers.name);
}

function renderResult(){
  const d = translations[currentLang];
  document.getElementById("resultTitle").textContent = d.result_title(answers.name);
  document.getElementById("resultMotivation").textContent = motivationPhrase();
  document.getElementById("aiExplanation").textContent = aiExplanationText();

  document.getElementById("edCarbs").value = mix.carbs;
  document.getElementById("edSodium").value = mix.sodium;
  document.getElementById("edRatio").value = mix.ratio;
  document.getElementById("edCaffeine").value = mix.caffeine;
  document.getElementById("edSweetener").value = mix.sweetener;
  document.getElementById("edPreservatives").value = mix.preservatives;
  document.getElementById("edFlavor").value = mix.flavor;
  document.getElementById("edStrength").value = mix.strength;
  document.getElementById("edScooper").value = mix.scooper;
  document.getElementById("edNotes").value = mix.notes;

  renderPackage();
}

function syncMixFromEditor(){
  mix = {
    carbs: document.getElementById("edCarbs").value,
    sodium: document.getElementById("edSodium").value,
    ratio: document.getElementById("edRatio").value,
    caffeine: document.getElementById("edCaffeine").value,
    sweetener: document.getElementById("edSweetener").value,
    preservatives: document.getElementById("edPreservatives").value,
    flavor: document.getElementById("edFlavor").value,
    strength: document.getElementById("edStrength").value,
    scooper: document.getElementById("edScooper").value,
    notes: document.getElementById("edNotes").value,
  };
  renderPackage();
}

function renderPackage(){
  const d = translations[currentLang];
  document.getElementById("pkgName").textContent =
    (currentLang === "es" ? "MIX DE " : "") + answers.name.toUpperCase() + (currentLang === "en" ? "'S MIX" : "");
  document.getElementById("pkgPhrase").textContent = motivationPhrase();
  document.getElementById("pkgSpecs").textContent = d.pkg_specs(mix.carbs, mix.sodium, mix.caffeine, mix.ratio);
}

function aiGreeting(){
  if(currentLang === "es"){
    return `Hola ${answers.name}, soy tu asistente de nutrición. Puedes preguntarme cosas como "¿por qué tanto sodio?", "¿puedo bajar la cafeína?" o "¿este mix sirve para un Ironman?".`;
  }
  return `Hi ${answers.name}, I'm your nutrition assistant. Ask me things like "why so much sodium?", "can I lower the caffeine?" or "does this mix work for an Ironman?".`;
}

function addChatMsg(role, text){
  const log = document.getElementById("aiChatLog");
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function sendChat(){
  const input = document.getElementById("aiChatInput");
  const text = input.value.trim();
  if(!text) return;
  addChatMsg("user", text);
  input.value = "";
  setTimeout(()=> addChatMsg("bot", answerChat(text)), 400);
}

function answerChat(question){
  const q = question.toLowerCase();
  const es = currentLang === "es";
  if(q.includes("sodio") || q.includes("sodium")){
    return es
      ? `Tu mezcla tiene ${mix.sodium}mg de sodio porque ese fue el nivel adecuado según tu clima y sudoración. Si entrenas en interiores o hace frío, puedes bajarlo a "Light (200mg)" en el editor.`
      : `Your mix has ${mix.sodium}mg of sodium because that's the right level for your climate and sweat rate. If you train indoors or in cold weather, you can lower it to "Light (200mg)" in the editor.`;
  }
  if(q.includes("cafe") || q.includes("caffeine") || q.includes("caff")){
    return es
      ? `Tienes ${mix.caffeine}mg de cafeína por porción. Puedes ajustarlo entre 0 y 100mg en el editor — recuerda que efectos notables suelen empezar alrededor de 50-75mg.`
      : `You have ${mix.caffeine}mg of caffeine per serving. You can adjust it from 0 to 100mg in the editor — noticeable effects usually start around 50-75mg.`;
  }
  if(q.includes("carb")){
    return es
      ? `Sugerimos ${mix.carbs}g de carbohidratos por porción según la duración de tus sesiones. Para esfuerzos largos (+3h), atletas de alto rendimiento suelen necesitar 90-120g/hora repartidos en varias porciones.`
      : `We suggest ${mix.carbs}g of carbs per serving based on your session length. For long efforts (3h+), high performance athletes often need 90-120g/hour spread across multiple servings.`;
  }
  if(q.includes("ironman") || q.includes("maraton") || q.includes("marathon") || q.includes("carrera") || q.includes("race")){
    return es
      ? `Para un evento de resistencia larga, este mix usa proporción Malto:Fructosa ${mix.ratio} para mejorar absorción y minimizar molestias estomacales — ideal para sostener el ritmo en las últimas horas.`
      : `For a long endurance event, this mix uses a ${mix.ratio} Malto:Fructose ratio to improve absorption and minimize GI distress — ideal for holding your pace in the final hours.`;
  }
  if(q.includes("azucar") || q.includes("sugar") || q.includes("dulce") || q.includes("sweet")){
    return es
      ? `Tu endulzante está configurado como "${mix.sweetener}". Si quieres algo más natural tipo miel, cámbialo a "Natural" en el editor; si prefieres menos dulzor, usa "Bajo en azúcar".`
      : `Your sweetener is set to "${mix.sweetener}". If you want something more natural like honey, switch to "Natural" in the editor; for less sweetness, use "Low sugar".`;
  }
  return es
    ? `Buena pregunta. Tu mix actual: ${mix.carbs}g carbs, ${mix.sodium}mg sodio, ${mix.caffeine}mg cafeína, ratio ${mix.ratio}, sabor ${FLAVOR_LABELS[mix.flavor] ? FLAVOR_LABELS[mix.flavor].es : mix.flavor}. Puedes ajustar cualquier valor en el editor de arriba, y yo te explico el porqué de cada uno.`
    : `Good question. Your current mix: ${mix.carbs}g carbs, ${mix.sodium}mg sodium, ${mix.caffeine}mg caffeine, ${mix.ratio} ratio, ${FLAVOR_LABELS[mix.flavor] ? FLAVOR_LABELS[mix.flavor].en : mix.flavor} flavor. You can adjust any value in the editor above, and I'll explain the reasoning behind each one.`;
}

window.refreshDynamicText = function(){
  // Update flavor select option labels
  document.querySelectorAll("#edFlavor option").forEach(opt=>{
    const key = opt.dataset.flavorKey;
    if(FLAVOR_LABELS[key]) opt.textContent = FLAVOR_LABELS[key][currentLang];
  });
  if(answers.name){
    renderResult();
  }
};
