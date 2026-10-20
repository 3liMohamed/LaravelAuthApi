/* Crextio interactive HTML demo. No server or external account is required.
 * State is scoped to this template. Do not use real employee or payment data.
 * See documentation.html#demo-functionality for integration boundaries.
 */
(() => {
  "use strict";
  const page = location.pathname.split("/").pop() || "index.html";
  const prefix = "crextio-demo-v2:";
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const text = (e) => (e?.textContent || "").replace(/\s+/g, " ").trim();
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const raw = (v) => (window.Alpine ? Alpine.raw(v) : v);
  const clone = (v) => JSON.parse(JSON.stringify(raw(v)));
  const read = (k, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(prefix + k)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(prefix + k, JSON.stringify(raw(v)));
    } catch {
      notice("Storage is unavailable. Changes last until this page closes.");
    }
  };
  const uid = (p) =>
    p +
    "-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 6);
  const date = () => new Date().toISOString().slice(0, 10);
  const roots = () => $$("[x-data]").filter((e) => e._x_dataStack?.length);
  function scope(key) {
    const el = roots().find((e) => Object.hasOwn(raw(e._x_dataStack[0]), key));
    return el ? Alpine.$data(el) : null;
  }
  function local(el) {
    return Alpine.$data(el);
  }
  function notice(message) {
    let n = $("#demo-notice");
    if (!n) {
      n = document.createElement("div");
      n.id = "demo-notice";
      n.className = "demo-notice";
      n.setAttribute("role", "status");
      document.body.append(n);
    }
    n.textContent = message;
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => n.remove(), 4200);
  }
  function dialog(title, body, submit) {
    const old = $("#demo-dialog");
    if (old) old.close();
    old?.remove();
    const d = document.createElement("dialog");
    d.id = "demo-dialog";
    d.className = "demo-dialog";
    d.setAttribute("aria-labelledby", "demo-dialog-title");
    d.innerHTML = `<h2 id="demo-dialog-title">${esc(title)}</h2>${body}`;
    document.body.append(d);
    const previous = document.activeElement;
    d.addEventListener("close", () => {
      d.remove();
      previous?.focus();
    });
    d.addEventListener("click", (e) => {
      if (
        e.target === d &&
        e.clientX &&
        (e.clientX < d.getBoundingClientRect().left ||
          e.clientX > d.getBoundingClientRect().right ||
          e.clientY < d.getBoundingClientRect().top ||
          e.clientY > d.getBoundingClientRect().bottom)
      )
        d.close();
    });
    $$("[data-close]", d).forEach((b) => (b.onclick = () => d.close()));
    if (submit)
      $("form", d).onsubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        if (!f.reportValidity()) return;
        const err = $(".demo-error", d);
        try {
          const values = Object.fromEntries(new FormData(f));
          await submit(values, d);
          d.close();
        } catch (ex) {
          err.textContent = ex.message;
          err.focus();
        }
      };
    d.showModal();
    return d;
  }
  function form(title, fields, onSave, values = {}, submitLabel = "Save") {
    const body = fields
      .map((f) => {
        const [name, label, type = "text", options] = f;
        let control;
        if (type === "select")
          control = `<select name="${name}">${options.map((o) => `<option ${values[name] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
        else if (type === "textarea")
          control = `<textarea name="${name}" required rows="3">${esc(values[name] || "")}</textarea>`;
        else
          control = `<input name="${name}" type="${type}" ${type === "number" ? 'min="0.01" step="0.01"' : ""} ${type === "file" ? "" : `value="${esc(values[name] || "")}"`} required>`;
        return `<label>${esc(label)}${control}</label>`;
      })
      .join("");
    return dialog(
      title,
      `<form>${body}<p class="demo-error" role="alert" tabindex="-1"></p><div class="demo-actions"><button type="button" class="demo-button secondary" data-close>Cancel</button><button class="demo-button" type="submit">${esc(submitLabel)}</button></div></form>`,
      onSave,
    );
  }
  function detail(title, body) {
    return dialog(
      title,
      `${body}<div class="demo-actions"><button class="demo-button" data-close>Close</button></div>`,
    );
  }
  function download(name, content, type = "text/plain") {
    const a = document.createElement("a");
    const url = URL.createObjectURL(new Blob([content], { type }));
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    notice("Download ready: " + name);
  }
  function csv(name, rows) {
    const data = rows.length
      ? rows
      : [{ message: "No records match the current filters" }];
    const keys = Object.keys(raw(data[0])).filter(
      (k) => typeof data[0][k] !== "object",
    );
    const cell = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""') +
      '"';
    download(
      name + ".csv",
      [
        keys.map(cell).join(","),
        ...data.map((r) => keys.map((k) => cell(r[k])).join(",")),
      ].join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  function print(title, body) {
    $("#demo-print")?.remove();
    const el = document.createElement("section");
    el.id = "demo-print";
    el.innerHTML = `<h1>${esc(title)}</h1><p>Crextio HR • ${esc(date())}</p>${body}`;
    document.body.append(el);
    window.print();
    setTimeout(() => el.remove(), 1000);
  }
  function table(rows) {
    if (!rows?.length) return "<p>No records.</p>";
    const keys = Object.keys(raw(rows[0])).filter(
      (k) =>
        typeof rows[0][k] !== "object" && !/img|avatar|color|thumb/.test(k),
    );
    return `<table><thead><tr>${keys.map((k) => `<th>${esc(k)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${keys.map((k) => `<td>${esc(r[k])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }
  const fields = {
    employee: [
      ["name", "Full name"],
      ["role", "Job title"],
      [
        "dept",
        "Department",
        "select",
        [
          "Design",
          "Engineering",
          "HR",
          "Marketing",
          "Analytics",
          "Finance",
          "Product",
          "Sales",
        ],
      ],
      ["email", "Email", "email"],
    ],
    role: [
      ["title", "Job title"],
      [
        "dept",
        "Department",
        "select",
        ["Design", "Engineering", "Marketing", "Product", "HR"],
      ],
      ["location", "Location"],
      ["salary", "Salary range"],
    ],
    candidate: [
      ["name", "Full name"],
      ["role", "Applying for"],
      ["email", "Email", "email"],
      [
        "stage",
        "Stage",
        "select",
        ["Applied", "Screening", "Interview", "Offer"],
      ],
    ],
    team: [
      ["name", "Team name"],
      ["lead", "Team lead"],
      ["description", "Description", "textarea"],
    ],
    device: [
      ["name", "Device name"],
      ["serial", "Serial number"],
      ["assignee", "Assigned employee"],
      ["type", "Type", "select", ["Laptop", "Monitor", "Phone", "Accessory"]],
    ],
    hire: [
      ["name", "Full name"],
      ["role", "Role"],
      ["start", "Start date", "date"],
    ],
    app: [
      ["name", "App name"],
      [
        "cat",
        "Category",
        "select",
        [
          "Communication",
          "Productivity",
          "Design",
          "Engineering",
          "Marketing",
          "Security",
          "Analytics",
        ],
      ],
      ["cost", "Monthly cost", "number"],
    ],
    order: [
      ["employee", "Employee"],
      ["item", "Item"],
      [
        "type",
        "Type",
        "select",
        ["Equipment", "Software", "Training", "Other"],
      ],
      ["amount", "Amount ($)", "number"],
    ],
    address: [
      ["label", "Address label"],
      ["street", "Street"],
      ["city", "City"],
      ["country", "Country"],
      ["contact", "Contact name"],
    ],
    review: [
      ["name", "Employee"],
      ["reviewer", "Reviewer"],
      ["score", "Rating (1–5)", "number"],
      ["feedback", "Feedback", "textarea"],
    ],
  };
  function records(kind) {
    return read(page + ":" + kind, []);
  }
  function renderRecords(kind) {
    const values = records(kind);
    if (!values.length) return;
    let box = $("#demo-records-" + kind);
    if (!box) {
      box = document.createElement("section");
      box.id = "demo-records-" + kind;
      box.className = "demo-records";
      ($(".layout-content") || $("main") || document.body).append(box);
    }
    box.innerHTML = `<h2>${esc(kind[0].toUpperCase() + kind.slice(1))} records</h2>`;
    values.forEach((r, i) => {
      const a = document.createElement("article");
      a.innerHTML = `<strong>${esc(r.name || r.title || r.label || r.item)}</strong><p>${Object.entries(
        r,
      )
        .filter(
          ([k]) => !["id", "name", "title", "label", "fileData"].includes(k),
        )
        .map(([k, v]) => esc(k) + ": " + esc(v))
        .join(" · ")}</p><button class="demo-button secondary">Edit</button>`;
      $("button", a).onclick = () =>
        form(
          "Edit " + kind,
          fields[kind],
          (v) => {
            values[i] = { ...r, ...v };
            write(page + ":" + kind, values);
            renderRecords(kind);
          },
          r,
        );
      box.append(a);
    });
  }
  function create(kind) {
    form("Add " + kind, fields[kind], (v) => {
      const id = uid(kind);
      if (kind === "review") {
        ensure(Number(v.score) <= 5, "Choose a rating from 1 to 5.");
        scope("reviews").reviews.unshift({
          id,
          employee: v.name,
          reviewer: v.reviewer,
          rating: Number(v.score),
          feedback: v.feedback,
          status: "Completed",
          due: date(),
          dept: "Design",
          photo: "assets/images/lora-piterson.jpg",
        });
        return notice("Review added");
      }
      const s = scope(
        kind === "employee"
          ? "employees"
          : kind === "role"
            ? "roles"
            : kind === "app"
              ? "apps"
              : kind === "order"
                ? "orders"
                : "__none",
      );
      if (s) {
        if (kind === "employee")
          s.employees.unshift({
            ...v,
            id,
            status: "Active",
            img: "assets/images/lora-piterson.jpg",
            joined: date(),
          });
        if (kind === "role")
          s.roles.unshift({
            ...clone(s.roles[0]),
            ...v,
            id,
            priority: "Normal",
            applicants: 0,
            posted: "Just now",
          });
        if (kind === "app")
          s.apps.unshift({
            ...clone(s.apps[0]),
            ...v,
            id,
            cost: Number(v.cost),
            users: 1,
          });
        if (kind === "order")
          s.orders.unshift({
            ...v,
            id,
            amount: Number(v.amount),
            img: "assets/images/lora-piterson.jpg",
            date: date(),
            status: "Pending",
            priority: "Normal",
          });
      } else {
        write(page + ":" + kind, [{ ...v, id }, ...records(kind)]);
        renderRecords(kind);
      }
      notice(kind + " added");
    });
  }
  function row(el) {
    return (
      el.closest("tr") ||
      el.closest("article") ||
      el.parentElement.parentElement
    );
  }
  function closeFlag(el) {
    const d = local(el);
    for (const k of [
      "showNew",
      "showModal",
      "showUpload",
      "addDeviceModal",
      "newTeamModal",
      "editModal",
      "showAddFunds",
      "showTransfer",
      "addEventModal",
      "showUpgradeModal",
      "showCancelModal",
    ])
      if (d[k]) d[k] = false;
  }
  function modalValues(el) {
    let wrap = el.closest("[x-show]");
    const inputs = $$("input,select,textarea", wrap || row(el)).filter(
      (i) => i.type !== "hidden",
    );
    return inputs.map((i) => i.value);
  }
  function ensure(condition, message) {
    if (!condition) throw Error(message);
  }
  function persist() {
    const keys = [
      "employees",
      "roles",
      "apps",
      "orders",
      "invoices",
      "preInvoices",
      "tickets",
      "files",
      "transactions",
      "myRequests",
      "teamRequests",
      "myExpenses",
      "teamExpenses",
      "myGoals",
      "teamGoals",
      "announcements",
      "notifications",
      "reports",
      "myCourses",
      "catalog",
      "certifications",
      "reviews",
      "offices",
      "shipping",
      "threads",
      "conversations",
      "hours",
      "notes",
      "projects",
      "status",
      "plan",
      "cancelled",
      "healthPlan",
      "dentalEnrolled",
      "visionEnrolled",
      "k401Rate",
      "lifeEnrolled",
      "lifeMultiple",
      "perks",
      "twoFA",
      "sessionAlerts",
      "emailNotif",
      "pushNotif",
    ];
    roots().forEach((el) => {
      const own = raw(el._x_dataStack[0]);
      for (const k of keys) {
        if (
          !Object.hasOwn(own, k) ||
          Object.getOwnPropertyDescriptor(own, k)?.get
        )
          continue;
        const d = Alpine.$data(el),
          key = page + ":state:" + k,
          stored = read(key, null);
        if (stored !== null) d[k] = stored;
        Alpine.effect(() => {
          const snapshot = JSON.stringify(raw(d[k]));
          /* Read through proxy to track nested changes. */ JSON.stringify(
            d[k],
          );
          try {
            localStorage.setItem(prefix + key, snapshot);
          } catch {}
        });
      }
    });
  }
  const route = {
    Message: "chat.html",
    "View Team": "teams.html",
    "Post Job": "open-roles.html",
    "Run Payroll": "salary.html",
    "Schedule Interview": "calendar.html",
    "Generate Report": "reports.html",
    "View All": "notifications.html",
    "See all": "announcements.html",
    "Send to Client": "invoice.html",
  };
  function action(el, label) {
    const d = local(el);
    if (label === "Open timesheet") {
      location.href = "timesheet.html";
      return;
    }
    if (label === "Open goals") {
      location.href = "goals.html";
      return;
    }
    if (label === "Start timer" || label === "Pause timer") {
      const running = read("timer-start", null);
      let elapsed = read("timer-elapsed", 0);
      if (label === "Start timer" && !running) write("timer-start", Date.now());
      if (label === "Pause timer" && running) {
        elapsed += Date.now() - running;
        write("timer-elapsed", elapsed);
        write("timer-start", null);
      }
      notice(
        label === "Start timer"
          ? "Timer started"
          : "Timer paused: " + Math.floor(elapsed / 60000) + " minutes",
      );
      return;
    }
    if (label === "Attach file") {
      return form(
        "Attach file",
        [["file", "Choose attachment", "file"]],
        async (v) => {
          ensure(v.file.size < 2e6, "Choose a file under 2 MB.");
          const s = scope("threads");
          s.newMsg = "Attachment: " + v.file.name;
          s.sendMessage();
          notice("Attachment sent");
        },
      );
    }
    if (label === "Call preview") {
      const s = scope("conversations");
      return dialog(
        "Call with " + s.active.name,
        `<div class="demo-call"><span class="demo-call-avatar">${esc((s.active.name||'?').slice(0,2).toUpperCase())}</span><p class="demo-call-status">Connected · <span id="call-time">00:00</span></p></div><div class="demo-actions"><button class="demo-button secondary" id="mute-call">Mute</button><button class="demo-button danger" data-close>End call</button></div>`,
      )
        .querySelector("#mute-call")
        .addEventListener(
          "click",
          (e) =>
            (e.target.textContent =
              e.target.textContent === "Mute" ? "Unmute" : "Mute"),
        );
    }
    if (label === "Search messages") {
      return form(
        "Search conversation",
        [["query", "Search messages"]],
        (v) => {
          const s = scope("messages");
          setTimeout(
            () =>
              detail(
                "Search results",
                table(
                  s.messages.filter((m) =>
                    m.text.toLowerCase().includes(v.query.toLowerCase()),
                  ),
                ),
              ),
            0,
          );
        },
      );
    }
    if (label === "Conversation members") {
      const s = scope("conversations");
      return detail(
        "Conversation members",
        table(s.conversations.filter((c) => c.type !== "channel")),
      );
    }
    if (label === "Conversation options") {
      return detail(
        "Conversation options",
        '<p>Browse conversations on the left, or search to find a person or channel.</p><a class="demo-button" href="notifications.html">Notification preferences</a>',
      );
    }
    if (label === "Save Schedule") {
      const s = scope("schedReport");
      const v = modalValues(el);
      const input = el.closest("[x-show]").querySelector("input[type=email]");
      if (!input.value || !input.reportValidity())
        return notice("Enter a valid recipient email.");
      s.schedReport.scheduled = true;
      s.schedReport.schedule = {
        frequency: v[0],
        format: v[1],
        recipient: v[2],
      };
      s.showSchedule = false;
      return notice("Report schedule saved");
    }
    if (label === "New Invoice") return invoiceForm("Pending");
    if (label === "New Ticket") return ticketForm();
    if (label === "New Team") return create("team");
    if (label === "New Device") return create("device");
    if (label === "New Event") return eventForm();
    if (label === "New Pre-Invoice" || label === "Edit Pre-Invoice")
      return preinvoiceForm(el);
    if (route[label] && label !== "Send to Client") {
      location.href = route[label];
      return;
    }
    if (label === "Add Employee") {
      if (page === "dashboard.html")
        location.href = "employees.html?create=employee";
      else create("employee");
      return;
    }
    const creates = {
      "Add Candidate": "candidate",
      "Post Role": "role",
      "Add New Hire": "hire",
      "New Order": "order",
      "Add App": "app",
      "Start Review": "review",
    };
    if (creates[label]) return create(creates[label]);
    if (label === "Create Team" || label === "Add Device") {
      closeFlag(el);
      return create(label === "Create Team" ? "team" : "device");
    }
    if (
      label === "Add Address" ||
      (label === "Edit" && page === "addresses.html")
    ) {
      const s = scope("offices");
      const item = d.o || d.s || d.e;
      if (item)
        return form(
          "Edit address",
          [
            ["label", "Name"],
            ["addr", "Full address"],
          ],
          (values) => {
            if (item.name !== undefined) item.name = values.label;
            if (item.label !== undefined) item.label = values.label;
            item.addr = values.addr;
            notice("Address updated");
          },
          { label: item.label || item.name, addr: item.addr },
        );
      return form(
        label,
        fields.address,
        (v) => {
          const list = s[s.tab];
          const record = {
            ...v,
            addr: [v.street, v.city, v.country].join(", "),
            name: v.label,
            flag: "🏢",
            size: "small",
            headcount: 0,
            color: "bg-blue-100",
            tag: "Office",
            img: "assets/images/lora-piterson.jpg",
            role: "Team member",
            default: false,
          };
          if (item) Object.assign(item, record);
          else list.unshift(record);
          closeFlag(el);
        },
        item || {},
      );
    }
    if (label === "Save Event") {
      closeFlag(el);
      return eventForm();
    }
    if (label === "Save Changes" && page === "employee-profile.html") {
      const inputs = $$("input,select,textarea", el.closest("[x-show]"));
      if (inputs.some((input) => !input.reportValidity())) return;
      const values = modalValues(el);
      write("profile", values);
      const selected = read("selected-employee", null);
      if (selected) {
        Object.assign(selected, {
          name: values[0] + " " + values[1],
          role: values[2],
          email: values[3],
          dept: values[5],
        });
        write("selected-employee", selected);
        const employees = read("employees.html:state:employees", []);
        const match = employees.find((employee) => employee.id === selected.id);
        if (match) Object.assign(match, selected);
        write("employees.html:state:employees", employees);
      }
      updateProfile(values);
      closeFlag(el);
      return notice("Profile updated");
    }
    if (label === "Change photo") {
      return uploadPhoto(el);
    }
    if (
      ["Upload", "Upload File", "Upload Certificate"].includes(label) &&
      !el.hasAttribute("@click")
    ) {
      closeFlag(el);
      return upload(el);
    }
    if (
      label === "Download" ||
      label === "View Certificate" ||
      label === "Download PDF" ||
      label === "PDF" ||
      label === "Export PDF"
    ) {
      const item = d.f || d.c || d.cert || d.inv || d.i || d.selected;
      return fileDownload(item, label, el);
    }
    if (/^(Export CSV|Export Report)$/.test(label)) {
      return csv(
        page.replace(".html", ""),
        scope("invoices")?.invoices ||
          scope("orders")?.orders ||
          scope("employees")?.employees || [
            {
              report: document.title,
              content: text($(".layout-content")).slice(0, 5000),
            },
          ],
      );
    }
    if (label === "Save Draft" || label === "Create Invoice") {
      closeFlag(el);
      return invoiceForm(label === "Save Draft" ? "Draft" : "Pending");
    }
    if (label === "+ Add line item") {
      const wrap = el.parentElement;
      const sample = $("input", wrap)?.closest(".grid");
      if (sample) {
        const copy = sample.cloneNode(true);
        $$("input", copy).forEach(
          (i) => (i.value = i.type === "number" ? "1" : ""),
        );
        wrap.insertBefore(copy, el);
      }
      return;
    }
    if (label === "×") {
      el.parentElement.remove();
      return;
    }
    if (label === "Submit Ticket") {
      closeFlag(el);
      return ticketForm();
    }
    if (
      page === "preinvoice.html" &&
      (label === "Create" || label === "Save Changes")
    ) {
      return preinvoiceForm(el);
    }
    if (
      page === "wallet.html" &&
      (label === "Add Funds" || label === "Transfer")
    ) {
      const s = scope("transactions");
      const transfer = label === "Transfer",
        amount = Number(transfer ? s.transferAmount : s.addAmount);
      if (!Number.isFinite(amount) || amount <= 0)
        return notice("Enter an amount greater than zero.");
      if (transfer && (!s.transferTo || amount > s.balance))
        return notice("Choose a recipient and an amount within your balance.");
      s.transactions.unshift({
        id: uid("TXN"),
        date: date(),
        type: transfer ? "expense" : "income",
        category: transfer ? "Transfer" : "Top-up",
        desc: transfer ? "Transfer to " + s.transferTo : "Wallet top-up",
        amount: transfer ? -amount : amount,
        status: "Completed",
        avatar: null,
        by: "You",
      });
      closeFlag(el);
      s.addAmount = "";
      s.transferAmount = "";
      return notice("Transaction completed");
    }
    if (label === "Yes, cancel") {
      const s = scope("plan");
      s.cancelled = true;
      closeFlag(el);
      return notice("Subscription cancelled");
    }
    if (label === "Save card") {
      const values = modalValues(el);
      if (!values.every((v) => v.trim()))
        return notice("Complete all card fields.");
      write("billing-card", { last4: values[0].replace(/\D/g, "").slice(-4) });
      d.paymentEdit = false;
      return notice("Payment method updated");
    }
    if (label === "Update" && page === "settings.html") {
      location.href = "billing.html";
      return;
    }
    if (label === "Google" || label === "GitHub") {
      el.disabled = true;
      el.innerHTML =
        '<span class="demo-spinner" aria-hidden="true"></span> Connecting to ' +
        label +
        "…";
      setTimeout(() => (location.href = "dashboard.html"), 900);
      return;
    }
    if (label === "Save Job") {
      const saved = read("saved-job", false);
      write("saved-job", !saved);
      el.textContent = saved ? "Save Job" : "Job Saved";
      el.setAttribute("aria-pressed", String(!saved));
      return;
    }
    if (
      label === "Approve" ||
      label === "Reject" ||
      label === "Review" ||
      label === "Approve all" ||
      label === "✓" ||
      label === "✕"
    ) {
      return approval(el, label);
    }
    if (label === "Continue" || label === "Start Course") {
      const c = d.c;
      return dialog(
        c?.title || "Learning module",
        `<p class="demo-eyebrow">Lesson ${Math.min(4, Math.floor((c?.progress || 0) / 25) + 1)} of 4 · ${esc(c?.category || "Course")}</p><div class="demo-progress"><span style="width:${c?.progress || 0}%"></span></div><p>Effective teams start with clear goals, shared responsibilities, and regular feedback. In this lesson you will practise turning decisions into owned next steps and following up on progress.</p><p><strong>Reflection:</strong> identify one action you can use in your next team meeting.</p><div class="demo-actions"><button class="demo-button secondary" data-close>Close</button><button class="demo-button" id="complete-lesson">Mark lesson complete</button></div>`,
      )
        .querySelector("#complete-lesson")
        .addEventListener("click", () => {
          if (c) {
            c.progress = Math.min(100, (c.progress || 0) + 25);
            c.status = c.progress === 100 ? "completed" : "in-progress";
            if (c.status === "completed") c.completed = date();
          }
          $("#demo-dialog").close();
          notice("Lesson progress saved");
        });
    }
    if (label === "Edit Review") {
      const r = scope("selectedReview")?.selectedReview;
      return form(
        "Edit review",
        fields.review,
        (v) => {
          ensure(Number(v.score) <= 5, "Choose a rating from 1 to 5.");
          if (r)
            Object.assign(r, {
              employee: v.name,
              reviewer: v.reviewer,
              feedback: v.feedback,
              rating: Number(v.score),
              status: "Completed",
            });
          notice("Review saved");
        },
        r
          ? {
              name: r.employee,
              reviewer: r.reviewer,
              score: r.rating,
              feedback: r.feedback || "Review completed.",
            }
          : {},
      );
    }
    if (
      ["Revoke", "Remove", "Cancel"].includes(label) &&
      page === "settings.html"
    ) {
      return dialog(
        label + " access",
        `<p>${esc(text(row(el)))}</p><p>Remove this demo entry?</p><div class="demo-actions"><button class="demo-button secondary" data-close>Keep</button><button class="demo-button" id="confirm-remove">Remove</button></div>`,
      )
        .querySelector("#confirm-remove")
        .addEventListener("click", () => {
          write("removed-access", [...read("removed-access", []), text(row(el))]);
          row(el).remove();
          $("#demo-dialog").close();
          notice("Access removed");
        });
    }
    if (label === "Invite member") {
      return form(
        "Invite workspace member",
        [
          ["email", "Email", "email"],
          ["role", "Role", "select", ["Member", "Admin", "Viewer"]],
        ],
        (v) => {
          write("invites", [...read("invites", []), v]);
          notice("Invitation sent");
          const p = document.createElement("p");
          p.textContent = v.email + " · " + v.role + " · Pending invitation";
          row(el).append(p);
        },
      );
    }
    if (label === "Resend") {
      return notice("Invitation resent");
    }
    if (label === "Add project row") {
      const s = scope("projects");
      return form("Add project", [["name", "Project name"]], (v) => {
        s.projects.splice(s.projects.length - 1, 0, v.name);
        s.hours.forEach((h) => h.push(0));
      });
    }
    if (label === "Submitted" || label === "Pending") {
      return detail(
        "Timesheet status",
        "<p>" +
          esc(label) +
          " for approval. Team approvers can review the hours below.</p>",
      );
    }
    if (label === "View" && page === "timesheet.html") {
      return detail(
        "Timesheet details",
        "<p>" +
          esc(text(row(el))) +
          "</p>" +
          table([{ Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8 }]),
      );
    }
    if (label === "Previous Period" || label === "Next Period") {
      const s = scope("period");
      const i = s.periods.indexOf(s.period),
        next = Math.max(
          0,
          Math.min(
            s.periods.length - 1,
            i + (label === "Previous Period" ? 1 : -1),
          ),
        );
      s.period = s.periods[next];
      return;
    }
    if (label === "Mark all as read") {
      el.closest("[x-show]")
        ?.querySelectorAll(".bg-yellow-50,.bg-blue-50")
        .forEach((e) => e.classList.remove("bg-yellow-50", "bg-blue-50"));
      return notice("All notifications marked as read");
    }
    if (label === "Import Data") {
      return form(
        "Import employee CSV",
        [["file", "CSV: name, role, dept, email", "file"]],
        async (v) => {
          const content = await v.file.text();
          const lines = content.trim().split(/\r?\n/);
          ensure(
            lines[0].toLowerCase() === "name,role,dept,email",
            "Use the header: name,role,dept,email",
          );
          const imported = lines.slice(1).map((l) => {
            const [name, role, dept, email] = l.split(",");
            ensure(
              name && role && dept && email,
              "Each row needs four fields.",
            );
            return {
              id: uid("emp"),
              name,
              role,
              dept,
              email,
              status: "Active",
              joined: date(),
              img: "assets/images/lora-piterson.jpg",
            };
          });
          write("import-employees", imported);
          location.href = "employees.html";
        },
      );
    }
    if (label === "Send to Client") {
      const inv = scope("selected")?.selected;
      return form(
        "Send invoice " + (inv?.id || ""),
        [
          ["to", "To", "email"],
          ["subject", "Subject"],
          ["message", "Message", "textarea"],
        ],
        (v) => {
          if (inv && inv.status === "Draft") inv.status = "Pending";
          notice("Invoice sent to " + v.to);
        },
        {
          to: inv?.email || "",
          subject: "Invoice " + (inv?.id || "") + " from Crextio",
          message:
            "Hi,\n\nPlease find attached invoice " +
            (inv?.id || "") +
            " for $" +
            (inv?.amount ?? "") +
            ", due " +
            (inv?.due || "") +
            ".\n\nThank you for your business.",
        },
        "Send invoice",
      );
    }
    if (["Prev", "Next", "1", "2", "←", "→"].includes(label)) {
      return paginate(el, label);
    }
    if (label === "August" || label === "October") {
      location.href = "calendar.html";
      return;
    }
    if (label === "icon") {
      return iconAction(el);
    }
    detail(label, `<p>${esc(text(row(el)))}</p>`);
  }
  function approval(el, label) {
    const d = local(el),
      r = d.e || d.exp || d.r || d.o || d.m;
    const reject = label === "Reject" || label === "✕";
    if (label === "Review")
      return dialog(
        "Review expense",
        `<p>${esc(text(row(el)))}</p><div class="demo-actions"><button class="demo-button secondary" id="reject">Reject</button><button class="demo-button" id="approve">Approve</button></div>`,
      )
        .querySelectorAll("button")
        .forEach(
          (b) =>
            (b.onclick = () => {
              if (r) r.status = b.id === "approve" ? "approved" : "rejected";
              else row(el).dataset.status = b.id;
              $("#demo-dialog").close();
              notice("Expense " + b.id + "d");
            }),
        );
    if (r) r.status = reject ? "rejected" : "approved";
    else if (page === "order-detail.html") {
      const order = read("selected-order", null);
      if (order) {
        order.status = reject ? "Rejected" : "Approved";
        write("selected-order", order);
        const orders = read("orders.html:state:orders", []);
        const match = orders.find((o) => o.id === order.id);
        if (match) {
          match.status = order.status;
          write("orders.html:state:orders", orders);
        }
      }
      const badge = document.createElement("p");
      badge.textContent = reject ? "Order rejected" : "Order approved";
      row(el).replaceChildren(badge);
    } else {
      const container =
        label === "Approve all" ? el.parentElement.parentElement : row(el);
      container.querySelectorAll("button").forEach((b) => {
        if (["✓", "✕", "Approve", "Approve all"].includes(text(b)))
          b.disabled = true;
      });
      el.textContent = reject ? "Rejected" : "Approved";
    }
    notice(reject ? "Request rejected" : "Request approved");
  }
  function invoiceForm(status) {
    const s = scope("invoices");
    const modal = form(
      "New invoice",
      [
        ["client", "Client name"],
        ["email", "Client email", "email"],
        ["due", "Due date", "date"],
        ["desc", "Line item description"],
        ["qty", "Quantity", "number"],
        ["rate", "Unit price ($)", "number"],
        ["status", "Status", "select", ["Pending", "Draft"]],
      ],
      (v, dialog) => {
        const lines = [
          { desc: v.desc, qty: Number(v.qty), rate: Number(v.rate) },
        ];
        $$(".demo-invoice-line", dialog).forEach((line) => {
          const inputs = $$("input", line);
          lines.push({
            desc: inputs[0].value,
            qty: Number(inputs[1].value),
            rate: Number(inputs[2].value),
          });
        });
        s.invoices.unshift({
          ...v,
          id: uid("INV"),
          issued: date(),
          amount: lines.reduce((sum, line) => sum + line.qty * line.rate, 0),
          status: v.status,
          lines,
        });
        s.statusFilter = "All";
        notice("Invoice created");
      },
      { status },
    );
    const add = document.createElement("button");
    add.type = "button";
    add.className = "demo-button secondary";
    add.textContent = "Add line item";
    $(".demo-actions", modal).before(add);
    add.onclick = () => {
      const line = document.createElement("fieldset");
      line.className = "demo-invoice-line";
      line.innerHTML =
        '<legend>Additional line item</legend><label>Description<input required></label><label>Quantity<input type="number" min="0.01" step="0.01" value="1" required></label><label>Unit price ($)<input type="number" min="0.01" step="0.01" required></label><button type="button" class="demo-button secondary">Remove line</button>';
      $("button", line).onclick = () => line.remove();
      add.before(line);
      $("input", line).focus();
    };
  }
  function ticketForm() {
    form(
      "New support ticket",
      [
        ["title", "Subject"],
        [
          "category",
          "Category",
          "select",
          ["Hardware", "Software", "HR Systems", "Network", "Other"],
        ],
        [
          "priority",
          "Priority",
          "select",
          ["Low", "Medium", "High", "Critical"],
        ],
        ["desc", "Description", "textarea"],
      ],
      (v) => {
        scope("tickets").tickets.unshift({
          ...v,
          id: uid("TKT"),
          reporter: "You",
          assignee: "Unassigned",
          status: "Open",
          created: date(),
          activity: [
            {
              user: "You",
              time: "Just now",
              type: "created",
              msg: "Ticket created",
            },
          ],
        });
        notice("Ticket added");
      },
    );
  }
  function preinvoiceForm(el) {
    const s = scope("preInvoices"),
      item = s.editItem;
    closeFlag(el);
    form(
      item ? "Edit pre-invoice" : "New pre-invoice",
      [
        ["client", "Client"],
        ["notes", "Description", "textarea"],
        ["amount", "Amount ($)", "number"],
        ["expires", "Expiry date", "date"],
      ],
      (v) => {
        v.amount = Number(v.amount);
        v.expiry = v.expires;
        v.created = date();
        if (item) Object.assign(item, v);
        else
          s.preInvoices.unshift({
            ...v,
            id: uid("PRE"),
            date: date(),
            issued: date(),
            status: "Draft",
          });
        s.editItem = null;
      },
      item || {},
    );
  }
  function uploadPhoto() {
    form(
      "Change profile photo",
      [["file", "Image file", "file"]],
      async (v) => {
        ensure(v.file.type.startsWith("image/"), "Choose an image file.");
        ensure(v.file.size < 2e6, "Choose an image smaller than 2 MB.");
        const data = await fileData(v.file);
        write("profile-photo", data);
        $$("img")
          .filter((i) => /lora-piterson/.test(i.src))
          .forEach((i) => (i.src = data));
      },
    );
  }
  const fileData = (f) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(f);
    });
  function upload() {
    form(
      "Upload file",
      [
        ["file", "Choose a file (up to 2 MB)", "file"],
        ["name", "Display name"],
        [
          "cat",
          "Category",
          "select",
          ["Reports", "Policies", "Templates", "Exports", "Contracts"],
        ],
      ],
      async (v) => {
        ensure(v.file.size <= 2e6, "Choose a file smaller than 2 MB.");
        const item = {
          name: v.name,
          cat: v.cat,
          type: v.file.name.split(".").pop().toUpperCase(),
          size: Math.ceil(v.file.size / 1024) + " KB",
          date: date(),
          downloads: 0,
          color: "bg-blue-100 text-blue-600",
          fileData: await fileData(v.file),
          filename: v.file.name,
        };
        const s = scope("files");
        if (s) s.files.unshift(item);
        else {
          write(page + ":uploads", [...read(page + ":uploads", []), item]);
          renderUploads();
        }
        notice("File uploaded to this browser");
      },
    );
  }
  function renderUploads() {
    const items = read(page + ":uploads", []);
    if (!items.length) return;
    $("#demo-uploads")?.remove();
    const box = document.createElement("section");
    box.id = "demo-uploads";
    box.className = "demo-records";
    box.innerHTML = "<h2>Uploaded files</h2>";
    items.forEach((f) => {
      const b = document.createElement("button");
      b.className = "demo-button secondary";
      b.textContent = f.name;
      b.onclick = () => fileDownload(f, "Download", b);
      box.append(b);
    });
    ($(".layout-content") || document.body).append(box);
  }
  function fileDownload(item, label, el) {
    if (item?.fileData) {
      const a = document.createElement("a");
      a.href = item.fileData;
      a.download = item.filename;
      a.click();
      if (item.downloads !== undefined) item.downloads++;
      return;
    }
    if (item?.downloads !== undefined) item.downloads++;
    const title = item?.name || item?.title || item?.id || document.title;
    const body = table(item ? [raw(item)] : [{ details: text(row(el)) }]);
    if (
      label.includes("PDF") ||
      label === "PDF" ||
      label === "View Certificate" ||
      item?.type === "PDF"
    ) {
      return print(title, body);
    }
    if (item?.type === "CSV" || (label === "Download" && !item?.type))
      return csv(title, [
        {
          title,
          description: "Crextio HR document",
          date: date(),
          details: text(row(el)),
        },
      ]);
    download(
      title + ".html",
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>${esc(title)}</title><h1>${esc(title)}</h1>${body}`,
      "text/html",
    );
  }
  function updateProfile(values) {
    const root = $(".layout-content");
    if (!root || !values?.length) return;
    const title = $("h1", root);
    if (title && values[0]) title.textContent = values.slice(0, 2).join(" ");
  }
  function iconAction(el) {
    const svg = el.innerHTML;
    if (/M15 17h5|M18 8a6|M12 22|M13.73 21|M15 17a3|M18 8A6/.test(svg)) {
      location.href = "notifications.html";
      return;
    }
    if (/M4 6h16|M3 12h18/.test(svg)) {
      const s = local(el);
      s.sidebarOpen = !s.sidebarOpen;
      return;
    }
    if (el.closest("header")) {
      location.href = /M16 7a4|M12 14a7/.test(svg)
        ? "employee-profile.html"
        : "notifications.html";
      return;
    }
    detail(
      "Details",
      `<p>${esc(text(row(el)))}</p><p><a href="support.html">Open support</a></p>`,
    );
  }
  function paginate(el, label) {
    const state = scope("pageIndex");
    if (!state) return;
    const last = Math.max(0, Math.ceil(state.filtered.length / 5) - 1);
    const next =
      label === "Prev" || label === "←"
        ? state.pageIndex - 1
        : label === "1"
          ? 0
          : label === "2"
            ? 1
            : state.pageIndex + 1;
    state.pageIndex = Math.max(0, Math.min(last, next));
    notice("Page " + (state.pageIndex + 1) + " of " + (last + 1));
  }
  const seedEvents = [
    {
      id: "event-1",
      title: "Design Review",
      date: "2026-05-09",
      time: "14:00",
      category: "Company",
    },
    {
      id: "event-2",
      title: "Q2 Review Cycle",
      date: "2026-05-12",
      time: "09:00",
      category: "Review Cycle",
    },
    {
      id: "event-3",
      title: "Tom Nguyen Starts",
      date: "2026-05-15",
      time: "09:00",
      category: "Hiring",
    },
    {
      id: "event-4",
      title: "Engineering All-Hands",
      date: "2026-05-19",
      time: "11:00",
      category: "Company",
    },
  ];
  let month = new Date(2026, 4, 1);
  function eventForm(day) {
    form(
      "Add calendar event",
      [
        ["title", "Event title"],
        ["date", "Date", "date"],
        ["time", "Time", "time"],
        [
          "category",
          "Category",
          "select",
          [
            "Company",
            "Hiring",
            "Review Cycle",
            "Birthday",
            "Holiday",
            "Finance",
          ],
        ],
      ],
      (v) => {
        write("events", [
          ...read("events", seedEvents),
          { ...v, id: uid("event") },
        ]);
        month = new Date(v.date + "T12:00:00");
        month.setDate(1);
        renderCalendar();
        notice("Event saved");
      },
      { date: day || date(), time: "09:00" },
    );
  }
  function renderCalendar() {
    if (page !== "calendar.html") return;
    const grid = $(".grid.grid-cols-7.gap-1") || $("#demo-calendar");
    if (!grid) return;
    grid.id = "demo-calendar";
    grid.className = "demo-calendar";
    let bar = $("#demo-calendar-toolbar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "demo-calendar-toolbar";
      bar.className = "demo-toolbar";
      grid.before(bar);
    }
    bar.innerHTML = `<button class="demo-button secondary" aria-label="Previous month">←</button><h2>${month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2><button class="demo-button secondary" aria-label="Next month">→</button>`;
    const buttons = $$("button", bar);
    buttons[0].onclick = () => {
      month.setMonth(month.getMonth() - 1);
      renderCalendar();
    };
    buttons[1].onclick = () => {
      month.setMonth(month.getMonth() + 1);
      renderCalendar();
    };
    grid.replaceChildren();
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((v) => {
      const e = document.createElement("strong");
      e.textContent = v;
      grid.append(e);
    });
    for (let i = 0; i < month.getDay(); i++)
      grid.append(document.createElement("span"));
    const events = read("events", seedEvents);
    const heading = $(".layout-content h1");
    if (heading?.nextElementSibling)
      heading.nextElementSibling.textContent =
        month.toLocaleDateString("en-US", { month: "long", year: "numeric" }) +
        " · Company events";
    const oldMonth = $('[data-demo-action="&larr;"]')?.nextElementSibling;
    if (oldMonth)
      oldMonth.textContent = month.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    const upcoming = $$("h2").find((h) => text(h) === "Upcoming Events");
    if (upcoming) {
      const box = upcoming.nextElementSibling;
      box.innerHTML =
        events
          .filter((e) =>
            e.date.startsWith(
              [
                month.getFullYear(),
                String(month.getMonth() + 1).padStart(2, "0"),
              ].join("-"),
            ),
          )
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(
            (e) =>
              "<p><strong>" +
              esc(e.title) +
              "</strong><br><small>" +
              esc(e.date) +
              " · " +
              esc(e.time) +
              "</small></p>",
          )
          .join("") || "<p>No events this month.</p>";
    }
    for (
      let n = 1;
      n <= new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      n++
    ) {
      const day = [
          month.getFullYear(),
          String(month.getMonth() + 1).padStart(2, "0"),
          String(n).padStart(2, "0"),
        ].join("-"),
        b = document.createElement("button");
      b.className = "demo-day";
      b.setAttribute("aria-label", "Add event on " + day);
      b.innerHTML =
        String(n) +
        events
          .filter((e) => e.date === day)
          .map((e) => `<small>${esc(e.time)} ${esc(e.title)}</small>`)
          .join("");
      b.onclick = () => eventForm(day);
      grid.append(b);
    }
  }
  function enhance() {
    const pagination = scope("pageIndex");
    if (pagination)
      Alpine.watch(
        () => JSON.stringify(pagination.filtered),
        () => {
          pagination.pageIndex = 0;
        },
      );
    const invoices = page === "invoice.html" ? scope("invoices") : null;
    if (invoices)
      invoices.invoices.forEach((invoice) => {
        invoice.amount = invoices.subtotal(invoice);
      });

    if (page === "settings.html") {
      const removed = read("removed-access", []);
      $$('[data-demo-action="Remove"],[data-demo-action="Cancel"],[data-demo-action="Revoke"]').forEach(button => {
        if (removed.includes(text(row(button)))) row(button).remove();
      });
      const invites = read("invites", []);
      if (invites.length) {
        const section = document.createElement("section");
        section.className = "demo-records";
        section.innerHTML = '<h2>Pending invitations</h2>' + table(invites);
        ($('[x-show="tab===\'team\'"]') || $(".layout-content")).append(section);
      }
      const settings = scope("saveSettings");
      for (const method of ["applyTheme", "applyMode", "applyLayout"]) {
        const original = settings[method].bind(settings);
        settings[method] = (value) => {
          original(value);
          window.dispatchEvent(new Event("crextio-appearance"));
        };
      }

      const d = scope("saveSettings"),
        inputs = $$(
          "input,select,textarea",
          $("[x-show=\"tab==='profile'\"]") || $(".layout-content"),
        ).filter(
          (i) =>
            i.type !== "password" &&
            !i.getAttribute("x-model") &&
            i.type !== "file",
        );
      const saved = read("settings-profile", null);
      if (saved)
        inputs.forEach((i, n) => {
          if (saved[n] !== undefined) i.value = saved[n];
        });
      d.saveSettings = () => {
        if (d.tab === "security") {
          const vals = $$('input[type="password"]').map((i) => i.value);
          if (vals.some((v) => v.length < 8) || vals.at(-1) !== vals.at(-2))
            return notice(
              "Use at least 8 characters and matching new passwords.",
            );
          $$('input[type="password"]').forEach((i) => (i.value = ""));
          notice("Password updated");
        } else {
          write(
            "settings-profile",
            inputs.map((i) => i.value),
          );
          notice("Preferences saved");
        }
        d.saved = true;
        setTimeout(() => (d.saved = false), 2500);
      };
    }
    if (page === "timesheet.html" && scope("projects")?.submitSheet) {
      const d = scope("projects");
      const base = d.submitSheet.bind(d);
      d.submitSheet = () => {
        if (
          d.hours.some(
            (h) =>
              h.some((v) => !Number.isFinite(v) || v < 0 || v > 24) ||
              h.reduce((a, b) => a + b, 0) > 24,
          )
        )
          return notice("Daily hours must be between 0 and 24.");
        base();
      };
      let previous = d.weekOffset;
      const cache = read("timesheet-weeks", {});
      Alpine.watch(
        () => d.weekOffset,
        (n) => {
          cache[previous] = {
            hours: clone(d.hours),
            notes: clone(d.notes),
            status: d.status,
          };
          write("timesheet-weeks", cache);
          const next = cache[n] || {
            hours: Array.from({ length: 5 }, () =>
              Array(d.projects.length - 1).fill(0),
            ),
            notes: Array(5).fill(""),
            status: "draft",
          };
          d.hours = next.hours;
          d.notes = next.notes;
          d.status = next.status;
          previous = n;
        },
      );
    }
  }

  function convertInvoice(item) {
    const stored = read("invoice.html:state:invoices", []);
    const existing = stored.find((invoice) => invoice.id === item.invoiceId);
    const inv = existing || {
      id: uid("INV"),
      client: item.client,
      email: "client@example.com",
      issued: date(),
      due: item.expiry || date(),
      amount: item.amount,
      status: "Pending",
      lines: [{ desc: item.notes, qty: 1, rate: item.amount }],
    };
    item.invoiceId = inv.id;
    write("converted-invoice", inv);
    location.href = "invoice.html";
  }
  function install() {
    if (!window.Alpine) return;
    persist();
    for (const k of Object.keys(fields)) renderRecords(k);
    renderUploads();
    renderCalendar();
    enhance();
    const profile = read("profile", null);
    if (page === "employee-profile.html") {
      const selected = read("selected-employee", null);
      if (selected) {
        updateProfile([selected.name]);
        const root = $(".layout-content");
        $$("img", root)
          .filter((i) => /lora-piterson/.test(i.src))
          .forEach((i) => {
            i.src = selected.img;
            i.alt = selected.name;
          });
        $$("p,span,a", root)
          .filter(
            (e) =>
              e.children.length === 0 &&
              /^(Product Designer|lora.p@company.com|Design)$/.test(text(e)),
          )
          .forEach(
            (e) =>
              (e.textContent =
                text(e) === "Product Designer"
                  ? selected.role
                  : text(e) === "Design"
                    ? selected.dept
                    : selected.email),
          );
      } else updateProfile(profile);
    }
    const reset = scope("verifyCode");
    if (reset)
      reset.verifyCode = () => {
        if (reset.code.join("") !== "123456")
          return notice("That code is incorrect. Use 123456 to continue.");
        reset.step = "reset";
      };

    // Real validation and state updates replace timer-only demo submissions.
    const r = scope("generate");
    if (r)
      r.generate = (id) => {
        const report = r.reports.find((x) => x.id === id);
        csv(report?.title || report?.name || "report", [
          {
            report: report?.title || report?.name,
            period: "Current period",
            employees: 48,
            payroll: 128400,
            generated: date(),
          },
        ]);
        report.lastGen = date();
        r.generating = null;
      };
    if (page === "invoice.html") {
      const inv = read("converted-invoice", null);
      if (inv) {
        const s = scope("invoices");
        if (!s.invoices.some((i) => i.id === inv.id)) s.invoices.unshift(inv);
        s.selected = s.invoices.find((i) => i.id === inv.id);
        s.showDetail = true;
        write("converted-invoice", null);
      }
    }
    if (page === "employees.html") {
      const imported = read("import-employees", []);
      if (imported.length) {
        scope("employees").employees.unshift(...imported);
        write("import-employees", []);
      }
      if (new URLSearchParams(location.search).has("create"))
        create("employee");
    }
    const leave = scope("submitRequest");
    if (leave)
      leave.submitRequest = () => {
        if (
          !leave.requestFrom ||
          !leave.requestTo ||
          leave.requestTo < leave.requestFrom
        )
          return notice("Choose a valid start and end date.");
        const days =
          Math.round(
            (new Date(leave.requestTo) - new Date(leave.requestFrom)) / 864e5,
          ) + 1;
        leave.myRequests.unshift({
          id: uid("LV"),
          type: leave.requestType,
          from: leave.requestFrom,
          to: leave.requestTo,
          days,
          status: "pending",
          note: leave.requestNote,
        });
        leave.showRequest = false;
        leave.requestFrom = "";
        leave.requestTo = "";
        notice("Leave request added");
      };
    for (const [fn, key, required] of [
      ["postAnnouncement", "newAnn", ["title", "body"]],
      ["submitExpense", "newExp", ["merchant", "date", "amount"]],
      ["addGoal", "newGoal", ["title", "due"]],
      ["submitApp", "form", ["name", "email"]],
    ]) {
      const s = scope(fn);
      if (s) {
        const original = s[fn].bind(s);
        s[fn] = () => {
          if (required.some((k) => !String(s[key][k] || "").trim()))
            return notice("Complete all required fields.");
          if (key === "newExp" && Number(s[key].amount) <= 0)
            return notice("Enter a positive amount.");
          original();
          if (key === "newExp") {
            s.myExpenses[0].id = uid("EXP");
            s.myExpenses[0].date = date();
          }
          notice("Changes saved");
        };
      }
    }
    // "Reset sample data" lives in the theme panel (color-switcher.js).
    window.addEventListener("crextio-reset", () =>
      dialog(
        "Reset sample data",
        '<p>Restore the original sample records and discard changes saved in this browser?</p><div class="demo-actions"><button class="demo-button secondary" data-close>Keep changes</button><button class="demo-button" id="reset-confirm">Reset data</button></div>',
      )
        .querySelector("#reset-confirm")
        .addEventListener("click", () => {
          Object.keys(localStorage)
            .filter((k) => k.startsWith(prefix))
            .forEach((k) => localStorage.removeItem(k));
          location.reload();
        }),
    );
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-demo-action]");
      if (!b) return;
      e.preventDefault();
      try {
        action(
          b,
          b.dataset.demoAction === "icon" ||
            b.dataset.demoAction.startsWith("&")
            ? text(b) || "icon"
            : b.dataset.demoAction,
        );
      } catch (err) {
        notice(err.message);
        console.error(err);
      }
    });
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a");
        if (!a) return;
        const d = local(a);
        if (d.emp) {
          write("selected-employee", clone(d.emp));
          a.href = "employee-profile.html?id=" + encodeURIComponent(d.emp.id);
        }
        if (d.r && a.href.includes("job-detail"))
          write("selected-role", clone(d.r));
      },
      true,
    );
    $$("button")
      .filter((b) => !text(b) && !b.hasAttribute("aria-label"))
      .forEach((b) =>
        b.setAttribute(
          "aria-label",
          b.getAttribute("@click")?.includes("sidebarOpen")
            ? "Toggle navigation"
            : b.getAttribute("@click")?.includes("false")
              ? "Close dialog"
              : b.title || "Open details",
        ),
      );
    $$("input,select,textarea").forEach((el, i) => {
      if (!el.id) el.id = "demo-field-" + i;
      const label = el.parentElement.querySelector("label");
      if (label && !label.htmlFor) label.htmlFor = el.id;
      if (!label && !el.hasAttribute("aria-label"))
        el.setAttribute("aria-label", el.placeholder || el.name || "Input");
    });
    // Existing overlays get keyboard dismissal and focus trapping.
    let activeOverlay = null,
      lastFocus = null;
    const observer = new MutationObserver(() => {
      const overlays = $$("[x-show]").filter(
        (el) =>
          el.classList.contains("fixed") &&
          getComputedStyle(el).display !== "none" &&
          el.querySelector("input,textarea,h2"),
      );
      const current = overlays.at(-1);
      if (current && current !== activeOverlay) {
        lastFocus = document.activeElement;
        activeOverlay = current;
        current.setAttribute("role", "dialog");
        current.setAttribute("aria-modal", "true");
        $("input,button,textarea,select", current)?.focus();
      } else if (!current && activeOverlay) {
        activeOverlay = null;
        lastFocus?.focus();
      }
    });
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    document.addEventListener("keydown", (e) => {
      if (!activeOverlay) return;
      if (e.key === "Escape") {
        const d = local(activeOverlay);
        for (const k of [
          "showNew",
          "showModal",
          "showUpload",
          "showSchedule",
          "showRequest",
          "editModal",
          "addEventModal",
          "newTeamModal",
          "addDeviceModal",
          "showApply",
          "viewModal",
          "showAddFunds",
          "showTransfer",
          "showUpgradeModal",
          "showCancelModal",
          "submitConfirm",
          "showLightbox",
        ])
          if (d[k]) d[k] = false;
      }
      if (e.key === "Tab") {
        const f = $$("button,input,select,textarea,a", activeOverlay).filter(
          (el) => !el.disabled && el.getClientRects().length,
        );
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === f.at(-1)) {
          e.preventDefault();
          f[0].focus();
        }
      }
    });
  }
  window.Crextio = {
    convertInvoice,
    notice,
    form,
    detail,
    download,
    csv,
    print,
    action,
    read,
    write,
  };
  document.addEventListener("DOMContentLoaded", install);
})();
