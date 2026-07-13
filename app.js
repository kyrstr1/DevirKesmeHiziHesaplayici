(() => {
      const root = document.getElementById('cnc-hiz-hesaplayici');
      const tabs = { turning: root.querySelector('#turning-tab'), milling: root.querySelector('#milling-tab') };
      const forms = { turning: root.querySelector('#turning-form'), milling: root.querySelector('#milling-form') };
      const output = {
        result: root.querySelector('#result-box'), error: root.querySelector('#error-message'), rpm: root.querySelector('#rpm-value'),
        feed: root.querySelector('#feed-value'), time: root.querySelector('#time-value'), mode: root.querySelector('#result-mode'), warning: root.querySelector('#limit-warning'), toothNote: root.querySelector('#tooth-note')
      };
      const samples = {
        turning: { vc: 180, diameter: 50, feed: 0.20, length: 100, max: 3000 },
        milling: { vc: 220, diameter: 10, fz: 0.08, teeth: 4, length: 100, max: 12000 }
      };
      let mode = 'turning';
      const value = (id) => {
        const field = root.querySelector('#' + id);
        const typed = field.value.trim().replace(',', '.');
        return typed === '' ? null : Number(typed);
      };
      const number = (amount, digits = 0) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
      const duration = (minutes) => {
        if (!Number.isFinite(minutes) || minutes <= 0) return '—';
        const seconds = Math.round(minutes * 60);
        return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0') + ' dk';
      };
      const requiredValues = () => mode === 'turning'
        ? [['Kesme hızı', value('turning-vc')], ['Parça çapı', value('turning-diameter')], ['İlerleme / devir', value('turning-feed')]]
        : [['Kesme hızı', value('milling-vc')], ['Takım çapı', value('milling-diameter')], ['İlerleme / diş', value('milling-fz')]];
      const calculate = () => {
        const missing = requiredValues().find(([, amount]) => !Number.isFinite(amount) || amount <= 0);
        if (missing) {
          output.error.textContent = 'Lütfen “' + missing[0] + '” alanına sıfırdan büyük bir değer girin.';
          output.result.classList.remove('show');
          return;
        }
        output.error.textContent = '';
        const prefix = mode === 'turning' ? 'turning' : 'milling';
        const vc = value(prefix + '-vc');
        const diameter = value(prefix + '-diameter');
        const limit = value(prefix + '-max');
        const length = value(prefix + '-length');
        const idealRpm = (vc * 1000) / (Math.PI * diameter);
        const rpm = Number.isFinite(limit) && limit > 0 ? Math.min(idealRpm, limit) : idealRpm;
        const capped = Number.isFinite(limit) && limit > 0 && idealRpm > limit;
        const toothCount = value('milling-teeth');
        const toothCountKnown = Number.isFinite(toothCount) && toothCount > 0;
        const feedRate = mode === 'turning' ? value('turning-feed') * rpm : toothCountKnown ? value('milling-fz') * toothCount * rpm : null;
        output.rpm.textContent = number(rpm) + ' dev/dk';
        output.feed.textContent = Number.isFinite(feedRate) ? number(feedRate, 1) + ' mm/dk' : 'Diş sayısı gerekli';
        output.time.textContent = Number.isFinite(feedRate) && Number.isFinite(length) && length > 0 ? duration(length / feedRate) : Number.isFinite(length) && length > 0 ? 'Diş sayısı gerekli' : 'Boy girilmedi';
        output.mode.textContent = mode === 'turning' ? 'Torna ayarları' : 'Freze ayarları';
        output.warning.classList.toggle('show', capped);
        output.toothNote.classList.toggle('show', mode === 'milling' && !toothCountKnown);
        output.result.classList.add('show');
      };
      const setMode = (next) => {
        mode = next;
        Object.entries(tabs).forEach(([name, tab]) => tab.setAttribute('aria-selected', String(name === mode)));
        Object.entries(forms).forEach(([name, form]) => form.hidden = name !== mode);
        output.error.textContent = '';
        output.result.classList.remove('show');
      };
      const fillSample = () => {
        const sample = samples[mode];
        Object.entries(sample).forEach(([key, amount]) => root.querySelector('#' + mode + '-' + key).value = String(amount));
        output.error.textContent = '';
      };
      const applyMaterialSuggestion = () => {
        const select = root.querySelector('#material-select');
        const selected = select.options[select.selectedIndex];
        const suggestedSpeed = Number(selected.dataset[mode]);
        const note = root.querySelector('#material-note');
        if (!Number.isFinite(suggestedSpeed) || suggestedSpeed <= 0) {
          note.textContent = 'Bu malzeme için sabit bir öneri yok. Takım üreticisi kataloğundaki kesme hızını girin.';
          return;
        }
        root.querySelector('#' + mode + '-vc').value = suggestedSpeed;
        note.textContent = selected.text + ' için karbit takımla kaba başlangıç: ' + suggestedSpeed + ' m/dk. Katalog değeri varsa onu kullanın.';
      };
      Object.entries(tabs).forEach(([name, tab]) => tab.addEventListener('click', () => setMode(name)));
      root.querySelector('#calculate-button').addEventListener('click', calculate);
      root.querySelector('#example-button').addEventListener('click', fillSample);
      root.querySelector('#apply-material-button').addEventListener('click', applyMaterialSuggestion);
      root.querySelectorAll('input').forEach((input) => input.addEventListener('input', () => output.error.textContent = ''));
    })();
