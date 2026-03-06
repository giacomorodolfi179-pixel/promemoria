/* Storage semplice: array di {id,title,category,due,isDone} in localStorage */
const storeKey = 'promemoria.items';
const read = () => JSON.parse(localStorage.getItem(storeKey) || '[]');
const write = (items) => localStorage.setItem(storeKey, JSON.stringify(items));

const list = document.getElementById('list');
const fab = document.getElementById('fab');
const dlg = document.getElementById('newDialog');
const form = document.getElementById('newForm');
const search = document.getElementById('search');
const chips = document.querySelectorAll('.chip');
const installBtn = document.getElementById('installBtn');

let items = read();
let filter = 'tutti';
let deferredPrompt = null;

/* Render */
function render() {
  list.innerHTML = '';
  const q = (search.value || '').toLowerCase();
  items
    .filter(i => filter === 'tutti' || i.category === filter)
    .filter(i => i.title.toLowerCase().includes(q))
    .sort((a,b) => new Date(a.due) - new Date(b.due))
    .forEach(i => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <input type="checkbox" ${i.isDone?'checked':''} aria-label="completa">
        <div>
          <div class="title ${i.isDone?'done':''}">${i.title}</div>
          <div class="meta">${new Date(i.due).toLocaleDateString()} • ${new Date(i.due).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
          <div class="meta"><span class="badge ${i.category}">${i.category}</span></div>
        </div>
        <div class="actions">
          <button data-act="edit">Modifica</button>
          <button data-act="del" class="secondary">Elimina</button>
        </div>
      `;
      // toggle done
      card.querySelector('input').addEventListener('change', e => {
        i.isDone = e.target.checked;
        write(items); render();
      });
      // delete
      card.querySelector('[data-act="del"]').addEventListener('click', () => {
        items = items.filter(x => x.id !== i.id);
        write(items); render();
        // opzionale: potremmo annullare la push pianificata lato servizio
      });
      // (extra) edit minimale: riapre dialog con valori
      card.querySelector('[data-act="edit"]').addEventListener('click', () => {
        dlg.showModal();
        form.title.value = i.title;
        form.category.value = i.category;
        form.due.value = i.due.slice(0,16);
        form.dataset.editId = i.id;
      });
      list.appendChild(card);
    });
}
render();

/* Aggiungi/Modifica */
fab.addEventListener('click', () => {
  delete form.dataset.editId;
  form.reset();
  // default data tra 1 ora
  const d = new Date(Date.now()+60*60*1000);
  form.due.value = new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
  dlg.showModal();
});
form.addEventListener('close', () => form.reset());
form.addEventListener('submit', (e) => e.preventDefault());
form.querySelector('button.primary').addEventListener('click', () => {
  const title = form.title.value.trim();
  const category = form.category.value;
  const due = form.due.value; // ISO local (yyyy-mm-ddThh:mm)
  if(!title || !due) return;

  if (form.dataset.editId) {
    const it = items.find(x => x.id === form.dataset.editId);
    it.title = title; it.category = category; it.due = due;
  } else {
    const it = { id: crypto.randomUUID(), title, category, due, isDone:false };
    items.push(it);
    // 👉 Qui NON possiamo fare una "notifica locale programmata" in background.
    //    Usiamo Web Push (OneSignal). Invieremo una richiesta al servizio per programmare la push a 'due'.
    schedulePush(it); // definita in onesignal-init.js
  }
  write(items); render(); dlg.close();
});

/* Filtri + ricerca */
chips.forEach(c => c.addEventListener('click', () => {
  chips.forEach(x => x.classList.remove('active'));
  c.classList.add('active'); filter = c.dataset.filter; render();
}));
search.addEventListener('input', render);

/* Install prompt PWA */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e; installBtn.style.display='inline-block';
});
installBtn.addEventListener('click', async () => {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null; installBtn.style.display='none';
});

/* Apertura dialog da FAB su iOS standalone per facilitare opt-in notifiche */
document.getElementById('enablePush').addEventListener('click', () => {
  // Chiama OneSignal per richiedere il permesso (solo dopo gesto utente)
  if (window.enablePushPermission) window.enablePushPermission();
});
document.getElementById('notifSettings').addEventListener('click', () => {
  // Su iOS l’utente gestisce le impostazioni in Impostazioni > Notifiche (per la web app).
  alert('Per regolare suoni/avvisi: Impostazioni iPhone → Notifiche → “Promemoria” (web app).');
});