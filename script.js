(() => {
  const KEY = "smartElectricityReadingsV1";
  const $ = id => document.getElementById(id);
  let readings = [];
  try { readings = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { readings = []; }

  const today = new Date();
  $("date").value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  function save() { localStorage.setItem(KEY, JSON.stringify(readings)); }
  function monthKey(date) { return date.slice(0,7); }
  function monthUsage() {
    if (!readings.length) return 0;
    const currentMonth = $("date").value.slice(0,7) || monthKey(new Date().toISOString().slice(0,10));
    const sorted = [...readings].sort((a,b) => a.date.localeCompare(b.date) || a.id-b.id);
    const inMonth = sorted.filter(r => monthKey(r.date) === currentMonth);
    if (!inMonth.length) return 0;
    const firstIndex = sorted.findIndex(r => r.id === inMonth[0].id);
    const previous = firstIndex > 0 ? sorted[firstIndex-1].value : inMonth[0].value;
    return Math.max(0, inMonth[inMonth.length-1].value - previous);
  }
  function render() {
    const usage = monthUsage();
    const remaining = Math.max(0, 200-usage);
    $("usage").innerHTML = `${usage.toFixed(2)} <span class="unit">units</span>`;
    $("remaining").innerHTML = `${remaining.toFixed(2)} <span class="unit">units</span>`;
    const over = usage > 200;
    $("statusMetric").textContent = over ? "Above 200 units" : "Within limit";
    $("statusMetric").style.color = over ? "var(--red)" : "var(--green)";
    $("statusBox").textContent = readings.length === 0
      ? "Add your first meter reading to begin tracking."
      : over ? `You have used ${(usage-200).toFixed(2)} units above the 200-unit reference limit.`
      : `You have used ${usage.toFixed(2)} units. You are ${remaining.toFixed(2)} units below the 200-unit reference limit.`;
    $("usageBar").style.width = `${Math.min(100, usage/200*100)}%`;
    $("usageBar").style.background = over ? "var(--red)" : usage >= 160 ? "#d97706" : "var(--green)";
    $("barText").textContent = `${usage.toFixed(2)} of 200 units used${over ? " (limit exceeded)" : ""}`;

    const sorted = [...readings].sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id);
    if (!sorted.length) {
      $("historyWrap").innerHTML = '<p class="empty">No readings added yet.</p>';
      return;
    }
    $("historyWrap").innerHTML = `<table><thead><tr><th>Date</th><th>Meter reading</th><th>Usage since previous entry</th></tr></thead><tbody>${
      sorted.map(r => {
        const asc = [...readings].sort((a,b) => a.date.localeCompare(b.date) || a.id-b.id);
        const idx = asc.findIndex(x => x.id === r.id);
        const diff = idx > 0 ? Math.max(0, r.value-asc[idx-1].value) : 0;
        return `<tr><td>${r.date}</td><td>${r.value.toFixed(2)}</td><td>${diff.toFixed(2)} units</td></tr>`;
      }).join("")
    }</tbody></table>`;
  }

  $("addBtn").addEventListener("click", () => {
    const value = Number($("reading").value);
    const date = $("date").value;
    if (!date || $("reading").value.trim() === "" || !Number.isFinite(value) || value < 0) {
      $("message").textContent = "Please enter a valid date and non-negative meter reading.";
      return;
    }
    const latest = [...readings].sort((a,b) => a.date.localeCompare(b.date)).at(-1);
    if (latest && value < latest.value) {
      $("message").textContent = "This reading is lower than the latest saved meter reading. Please check the value or meter reset.";
      return;
    }
    readings.push({ id: Date.now(), date, value });
    readings.sort((a,b) => a.date.localeCompare(b.date));
    save();
    $("reading").value = "";
    $("message").textContent = "Reading saved in this browser.";
    render();
  });

  $("clearBtn").addEventListener("click", () => {
    if (!confirm("Delete all saved meter readings from this browser?")) return;
    readings = [];
    save();
    $("message").textContent = "History cleared.";
    render();
  });
  render();
})();
