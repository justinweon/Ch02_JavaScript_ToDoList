const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const labelInput = document.querySelector("#label-input");
const allTask = document.querySelector("#allTask");

const filterButtons = document.querySelectorAll("[data-filter]");

const allCount = document.querySelector("#all-count");
const activeCount = document.querySelector("#active-count");
const doneCount = document.querySelector("#done-count");

const summary = document.querySelector("#summary");
const emptyMessage = document.querySelector("#empty-message");

const STORAGE_KEY = "departures-tasks";

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      return [];
    }

    const data = JSON.parse(saved);

    if (!Array.isArray(data)) {
      throw new Error("저장된 데이터가 배열이 아님");
    }

    return data;
  } catch (error) {
    console.error("할 일 불러오기 실패:", error);
    alert("저장된 할 일을 불러오지 못했어요.");
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("할 일 저장 실패:", error);
    alert("저장하지 못했어요. 새로고침하면 변경 내용이 사라질 수 있어요.");
  }
}


// 2. Store the app's current data.
let tasks = loadTasks();
let currentFilter = "all";

let nextId = tasks.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1;



// ---- 플립 효과 ----
const FLIP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const prevTiles = {}; // key별로 직전에 화면에 있던 글자
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function esc(char) {
  return char.replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`);
}

function tileHtml(from, to, cls) {
  return `<span class="char-cell ${cls}" data-from="${esc(from)}" data-to="${esc(to)}"><i class="u"><b>${esc(from)}</b></i><i class="l"><b>${esc(from)}</b></i><i class="fu"><b>${esc(from)}</b></i><i class="fb"><b>${esc(from)}</b></i></span>`;
}

function setTile(tile, char) {
  tile.querySelectorAll("b").forEach((b) => (b.textContent = char));
  tile.dataset.from = char;
}

// 글자 한 번 넘기기: 위쪽이 접히고 아래쪽이 펴짐
async function flipOnce(tile, next) {
  const [u, l, fu, fb] = tile.children;
  const old = tile.dataset.from;
  u.firstChild.textContent = next;
  l.firstChild.textContent = old;
  fu.firstChild.textContent = old;
  fb.firstChild.textContent = next;

  const a = fu.animate(
    [{ transform: "rotateX(0deg)" }, { transform: "rotateX(-90deg)" }],
    { duration: 55, easing: "ease-in", fill: "forwards" },
  );
  await a.finished;
  const c = fb.animate(
    [{ transform: "rotateX(90deg)" }, { transform: "rotateX(0deg)" }],
    { duration: 55, easing: "ease-out", fill: "forwards" },
  );
  await c.finished;

  setTile(tile, next);
  a.cancel();
  c.cancel();
}

// 목표 글자까지 랜덤 글자 3개를 거쳐 도착
async function flipTile(tile, delay) {
  const target = tile.dataset.to;
  if (tile.dataset.from === target) return;
  if (reduceMotion) {
    setTile(tile, target);
    return;
  }
  await sleep(delay);
  const seq = Array.from(
    { length: 3 },
    () => FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)],
  );
  seq.push(target);
  for (const char of seq) {
    if (!tile.isConnected) return;
    if (char !== tile.dataset.from) await flipOnce(tile, char);
  }
}

// 한 행의 바뀐 타일만 플립. 바뀐 게 있으면 true
function playFlip(row, baseDelay) {
  const columns = row.querySelectorAll(
    "[data-task-text], [data-label-btn], [data-status-btn]",
  );
  let changed = false;
  columns.forEach((column, columnIndex) => {
    column.querySelectorAll(".char-cell").forEach((tile, index) => {
      if (tile.dataset.from !== tile.dataset.to) {
        changed = true;
        flipTile(tile, baseDelay + columnIndex * 150 + index * 25);
      }
    });
  });
  return changed;
}

function renderTiles(text, totalSlots, colorClass = "", key = "") {
  const cleanText = text.toUpperCase().slice(0, totalSlots);
  const prev = prevTiles[key] || "";
  prevTiles[key] = cleanText;
  let html = "";
  for (let i = 0; i < totalSlots; i++) {
    const to = cleanText[i] || " ";
    const from = prev[i] || " ";
    // 레퍼런스처럼 남는 자리도 빈 타일 박스로 채워주기
    const cls = i < cleanText.length || from !== " " ? colorClass : "empty";
    html += tileHtml(from, to, cls);
  }
  return html;
}

// 3. Add a task when the form is submitted.
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();

  if (text === "") {
    return;
  }

  const newTask = {
    id: nextId,
    text: text,
    label: labelInput.value,
    status: labelInput.value === "URGENT" ? "FINAL CALL" : "ON TIME",
    done: false,
  };

  tasks.push(newTask);
  nextId += 1;
  saveTasks();

  input.value = "";

  // Show all tasks so the newly added task is visible.
  currentFilter = "all";

  renderTasks();
  input.focus();
});

// 4. Change which tasks are displayed.
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    Object.keys(prevTiles).forEach((key) => delete prevTiles[key]); // 필터 바꾸면 다시 플립
    renderTasks();
  });
});

// 5. Draw the list from the current task data.
function renderTasks() {
  // Remove the old displayed rows before rebuilding them.
  allTask.replaceChildren();

  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") {
      return !task.done;
    }

    if (currentFilter === "done") {
      return task.done;
    }

    return true;
  });

  let flipIndex = 0;

  visibleTasks.forEach((task) => {
    const row = document.createElement("li");

    row.className = "group flex items-center gap-3 px-0 py-2 text-xl";


    const todoHtml = renderTiles(task.text, 20, "todo-blue", `${task.id}:text`);
    const labelHtml = renderTiles(task.label, 6, "", `${task.id}:label`);
    const statusColor = task.status === "FINAL CALL" ? "status-red" : "";
    const statusHtml = renderTiles(task.status, 10, statusColor, `${task.id}:status`);


    row.innerHTML = `
      <!-- 2. TODO (20칸 타일 + 호버 액션) -->
      <div class="flex-1 flex items-center overflow-hidden">
        <div data-task-text class="flex items-center flex-nowrap">
          ${todoHtml}
        </div>
        <div class="ml-2 flex gap-2 text-xs opacity-0 group-hover:opacity-100 transition shrink-0">
          <button type="button" data-edit class="cursor-pointer text-[#171717] hover:underline"
>[edit]</button>
          <button type="button" data-delete class="cursor-pointer text-[#171717] hover:underline"
>[cancel]</button>
        </div>
      </div>

            <div class="w-[96px] flex items-center flex-shrink-0">
        <button
          type="button"
          data-label-btn
          title="labe-change"
          class="cursor-pointer flex items-center"
        >
          ${labelHtml}
        </button>
      </div>


      <div class="w-[160px] flex items-center justify-end flex-shrink-0">
        <button type="button" data-status-btn title="상태 변경" class="cursor-pointer flex items-center transition hover:brightness-125">
          ${statusHtml}
        </button>
      </div>
    `;

    const editButton = row.querySelector("[data-edit]");
    const deleteButton = row.querySelector("[data-delete]");
    const statusBtn = row.querySelector("[data-status-btn]");
    const taskText = row.querySelector("[data-task-text]");
    const labelBtn = row.querySelector("[data-label-btn]");

    labelBtn.addEventListener("click", () => {
      const labelCycle = ["DEV", "URGENT", "LIFE", "WORK"];
      const currentIndex = labelCycle.indexOf(task.label);
      const nextIndex = (currentIndex + 1) % labelCycle.length;

      task.label = labelCycle[nextIndex];

      if (!task.done) {
        if (task.label === "URGENT") {
          task.status = "FINAL CALL";
        } else if (task.status === "FINAL CALL") {
          task.status = "ON TIME";
        }
      }
      saveTasks();
      renderTasks();

    });

    if (task.done) {
      row.classList.add("opacity-50");
    }

    statusBtn.addEventListener("click", () => {
      const statusCycle =
        task.label === "URGENT"
          ? ["FINAL CALL", "DONE"]
          : ["ON TIME", "BOARDING", "DONE"];
      const currentIndex = statusCycle.indexOf(task.status);
      const nextIndex = (currentIndex + 1) % statusCycle.length;
      task.status = statusCycle[nextIndex];
      task.done = task.status === "DONE";
      saveTasks();
      renderTasks();
    });
    // 삭제 이벤트
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      renderTasks();
    });
    // 수정 이벤트
    editButton.addEventListener("click", () => {
      startEditing(task, taskText, editButton);
    });
    allTask.append(row);
    if (playFlip(row, flipIndex * 110)) {
      flipIndex += 1;
    }
  });


  updateSummary();

  // Show a helpful message when the selected list is empty.
  emptyMessage.hidden = visibleTasks.length > 0;

  emptyMessage.textContent =
    currentFilter === "all"
      ? "No tasks yet. Add your first one above."
      : `No ${currentFilter} tasks.`;

  // Highlight the selected filter.
  filterButtons.forEach((button) => {
    const isSelected = button.dataset.filter === currentFilter;

    button.classList.toggle("border-current", isSelected);
    button.classList.toggle("border-transparent", !isSelected);
    button.classList.toggle("opacity-50", !isSelected);

    button.setAttribute("aria-pressed", String(isSelected));
  });
}

// 6. Replace a task's text with an editing form.
function startEditing(task, taskText, editButton) {
  // Prevent opening a second editor on the same row.
  editButton.disabled = true;
  editButton.classList.add("opacity-40");

  const editForm = document.createElement("form");

  editForm.className = "flex min-w-0 flex-1 flex-wrap items-center gap-2";

  editForm.innerHTML = `
    <input
      type="text"
      aria-label="Edit task"
      maxlength="200"
      required
      class="min-w-0 flex-1 border-b border-[#CFC8B8] bg-transparent py-2 text-[#247CB0] outline-none focus-visible:ring-1 focus-visible:ring-[#171717]"

    />

    <button
      type="submit"
      class="min-h-11 cursor-pointer text-xs hover:underline"
    >[ save ]</button>

    <button
      type="button"
      data-cancel
      class="min-h-11 cursor-pointer text-xs hover:underline"
    >[ cancel ]</button>
  `;

  const editInput = editForm.querySelector("input");
  const cancelButton = editForm.querySelector("[data-cancel]");

  editInput.value = task.text;

  taskText.replaceWith(editForm);

  editInput.focus();
  editInput.select();

  editForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const updatedText = editInput.value.trim();

    if (updatedText === "") {
      editInput.focus();
      return;
    }

    task.text = updatedText;
    saveTasks();
    renderTasks();
  });

  cancelButton.addEventListener("click", () => {
    renderTasks();
  });

  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      renderTasks();
    }
  });
}

// 7. Update counts from the full task array.
function updateSummary() {
  const completedTasks = tasks.filter((task) => task.done).length;
  const activeTasks = tasks.length - completedTasks;

  allCount.textContent = tasks.length;
  activeCount.textContent = activeTasks;
  doneCount.textContent = completedTasks;

  summary.textContent = `${activeTasks} tasks left / ${completedTasks} done`;
}

// 8. Draw the initial empty state.
renderTasks();

function updateToday() {
  const today = new Date();

  document.querySelector("#today-date").textContent = today.toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
    },
  );

  document.querySelector("#today-day").textContent = today.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    },
  );
}

updateToday();
setInterval(updateToday, 60_000);
