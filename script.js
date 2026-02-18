const STORAGE_KEY = "ipt_demo_v1";
let currentUser = null;

window.db = {
  accounts:    [],
  departments: [],
  employees:   [],
  requests:    []
};

/* ========================
   STORAGE
======================== */

function loadFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) throw "empty";
    window.db = {
      accounts:    saved.accounts    || [],
      departments: saved.departments || [],
      employees:   saved.employees   || [],
      requests:    saved.requests    || []
    };
  } catch {
    window.db = {
      accounts: [{
        firstName: "Admin",
        lastName:  "User",
        email:     "admin@example.com",
        password:  "Password123!",
        role:      "admin",
        verified:  true
      }],
      departments: [
        { id: "dept-1", name: "Engineering", desc: "Software and hardware engineering" },
        { id: "dept-2", name: "HR",          desc: "Human Resources" }
      ],
      employees: [],
      requests:  []
    };
    saveToStorage();
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

/* ========================
   TOAST (Phase 8)
======================== */

function showToast(message, type = "success") {
  const toastEl = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");

  toastEl.className = `toast align-items-center text-white border-0 bg-${type}`;
  toastMsg.innerText = message;

  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
}

/* ========================
   ROUTING
======================== */

const privatePages = ["#/profile", "#/requests"];
const adminPages   = ["#/accounts", "#/departments", "#/employees"];

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || "#/";

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  if (privatePages.includes(hash) && !currentUser) return navigateTo("#/login");
  if (adminPages.includes(hash)) {
    if (!currentUser) return navigateTo("#/login");
    if (currentUser.role !== "admin") return navigateTo("#/");
  }

  switch (hash) {
    case "#/register":
      showPage("register-page");
      break;
    case "#/login":
      showPage("login-page");
      const justVerified = localStorage.getItem("just_verified");
      if (justVerified) {
        document.getElementById("verified-alert").style.display = "block";
        localStorage.removeItem("just_verified");
      } else {
        document.getElementById("verified-alert").style.display = "none";
      }
      break;
    case "#/verify-email":
      showPage("verify-email-page");
      document.getElementById("verify-email-text").innerText =
        localStorage.getItem("unverified_email") || "";
      break;
    case "#/profile":
      showPage("profile-page");
      renderProfile();
      break;
    case "#/accounts":
      showPage("accounts-page");
      renderAccountsList();
      break;
    case "#/departments":
      showPage("departments-page");
      renderDepartmentsList();
      break;
    case "#/employees":
      showPage("employees-page");
      renderEmployeesTable();
      break;
    case "#/requests":
      showPage("requests-page");
      renderRequestsList();
      resetReqForm();
      break;
    default:
      showPage("home-page");
  }
}

function showPage(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

window.addEventListener("hashchange", handleRouting);

/* ========================
   AUTH STATE
======================== */

function setAuthState(isAuth, user = null) {
  const body = document.body;
  if (isAuth) {
    currentUser = user;
    body.classList.remove("not-authenticated");
    body.classList.add("authenticated");
    if (user.role === "admin") {
      body.classList.add("is-admin");
      document.getElementById("nav-username").innerText = "Admin";
    } else {
      body.classList.remove("is-admin");
      document.getElementById("nav-username").innerText = user.firstName;
    }
  } else {
    currentUser = null;
    body.classList.remove("authenticated", "is-admin");
    body.classList.add("not-authenticated");
  }
}

function logout() {
  localStorage.removeItem("auth_token");
  setAuthState(false);
  showToast("Logged out successfully.", "secondary");
  navigateTo("#/");
}

/* ========================
   REGISTER
======================== */

document.getElementById("reg-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const first = document.getElementById("reg-first").value.trim();
  const last  = document.getElementById("reg-last").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const pw    = document.getElementById("reg-pw").value;
  const err   = document.getElementById("reg-error");

  if (pw.length < 6) { err.innerText = "Password must be at least 6 characters."; return; }
  if (window.db.accounts.find(a => a.email === email)) { err.innerText = "Email already in use."; return; }

  window.db.accounts.push({ firstName: first, lastName: last, email, password: pw, role: "user", verified: false });
  saveToStorage();
  localStorage.setItem("unverified_email", email);
  showToast("Account created! Please verify your email.");
  navigateTo("#/verify-email");
});

/* ========================
   VERIFY
======================== */

function fakeVerify() {
  const email = localStorage.getItem("unverified_email");
  const user  = window.db.accounts.find(a => a.email === email);
  if (user) {
    user.verified = true;
    saveToStorage();
    localStorage.setItem("just_verified", "1");
    navigateTo("#/login");
  }
}

/* ========================
   LOGIN
======================== */

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const pw    = document.getElementById("login-pw").value;
  const err   = document.getElementById("login-error");
  const match = window.db.accounts.find(a => a.email === email && a.password === pw && a.verified);

  if (!match) { err.innerText = "Wrong credentials or email not verified."; return; }

  localStorage.setItem("auth_token", email);
  setAuthState(true, match);
  showToast(`Welcome back, ${match.firstName}!`);
  navigateTo("#/profile");
});

/* ========================
   PROFILE
======================== */

function renderProfile() {
  document.getElementById("profile-info").innerHTML = `
    <table class="table table-borderless mb-0">
      <tr><td class="text-muted" style="width:100px">Name</td><td>${currentUser.firstName} ${currentUser.lastName}</td></tr>
      <tr><td class="text-muted">Email</td><td>${currentUser.email}</td></tr>
      <tr><td class="text-muted">Role</td><td>
        <span class="badge ${currentUser.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${currentUser.role}</span>
      </td></tr>
    </table>
  `;
}

function openEditProfile() {
  document.getElementById("edit-profile-form").style.display = "block";
  document.getElementById("edit-first").value = currentUser.firstName;
  document.getElementById("edit-last").value  = currentUser.lastName;
  document.getElementById("edit-email").value = currentUser.email;
  document.getElementById("edit-profile-error").innerText = "";
}

function closeEditProfile() {
  document.getElementById("edit-profile-form").style.display = "none";
}

document.getElementById("edit-profile-el").addEventListener("submit", function (e) {
  e.preventDefault();

  const first = document.getElementById("edit-first").value.trim();
  const last  = document.getElementById("edit-last").value.trim();
  const email = document.getElementById("edit-email").value.trim();
  const err   = document.getElementById("edit-profile-error");

  // Check if new email is taken by someone else
  const taken = window.db.accounts.find(a => a.email === email && a.email !== currentUser.email);
  if (taken) { err.innerText = "That email is already in use."; return; }

  // Update in db
  const acc = window.db.accounts.find(a => a.email === currentUser.email);
  acc.firstName = first;
  acc.lastName  = last;
  acc.email     = email;

  // Update session token if email changed
  localStorage.setItem("auth_token", email);

  // Update currentUser
  currentUser.firstName = first;
  currentUser.lastName  = last;
  currentUser.email     = email;

  saveToStorage();

  // Refresh navbar name and profile display
  if (currentUser.role !== "admin") {
    document.getElementById("nav-username").innerText = first;
  }

  renderProfile();
  closeEditProfile();
  showToast("Profile updated!");
});

/* ========================
   ACCOUNTS
======================== */

function renderAccountsList() {
  const tbody = document.getElementById("acc-list");
  tbody.innerHTML = "";
  window.db.accounts.forEach((a, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${a.firstName} ${a.lastName}</td>
        <td>${a.email}</td>
        <td><span class="badge ${a.role === 'admin' ? 'bg-danger' : 'bg-secondary'}">${a.role}</span></td>
        <td>${a.verified ? "✅" : "—"}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1"  onclick="editAcc(${i})">Edit</button>
          <button class="btn btn-sm btn-outline-warning me-1"  onclick="resetPw(${i})">Reset PW</button>
          <button class="btn btn-sm btn-outline-danger"        onclick="deleteAcc(${i})">Delete</button>
        </td>
      </tr>`;
  });
}

function openAccForm(data = null, idx = -1) {
  document.getElementById("acc-form").style.display = "block";
  document.getElementById("acc-form-title").innerText = idx >= 0 ? "Edit Account" : "Add Account";
  document.getElementById("acc-idx").value        = idx;
  document.getElementById("acc-first").value      = data?.firstName || "";
  document.getElementById("acc-last").value       = data?.lastName  || "";
  document.getElementById("acc-email").value      = data?.email     || "";
  document.getElementById("acc-pw").value         = "";
  document.getElementById("acc-role").value       = data?.role      || "user";
  document.getElementById("acc-verified").checked = data?.verified  || false;
  document.getElementById("acc-error").innerText  = "";

  const pwField = document.getElementById("acc-pw");
  if (idx >= 0) {
    pwField.removeAttribute("required");
    pwField.placeholder = "New password (leave blank to keep)";
  } else {
    pwField.setAttribute("required", "");
    pwField.placeholder = "Password (min 6)";
  }
}

function closeAccForm() {
  document.getElementById("acc-form").style.display = "none";
}

document.getElementById("acc-form-el").addEventListener("submit", function (e) {
  e.preventDefault();

  const idx      = parseInt(document.getElementById("acc-idx").value);
  const first    = document.getElementById("acc-first").value.trim();
  const last     = document.getElementById("acc-last").value.trim();
  const email    = document.getElementById("acc-email").value.trim();
  const pw       = document.getElementById("acc-pw").value;
  const role     = document.getElementById("acc-role").value;
  const verified = document.getElementById("acc-verified").checked;
  const err      = document.getElementById("acc-error");

  const taken = window.db.accounts.find((a, i) => a.email === email && i !== idx);
  if (taken) { err.innerText = "Email already in use."; return; }

  if (idx >= 0) {
    const a = window.db.accounts[idx];
    Object.assign(a, { firstName: first, lastName: last, email, role, verified });
    if (pw) {
      if (pw.length < 6) { err.innerText = "Password must be at least 6 chars."; return; }
      a.password = pw;
    }
  } else {
    if (pw.length < 6) { err.innerText = "Password must be at least 6 chars."; return; }
    window.db.accounts.push({ firstName: first, lastName: last, email, password: pw, role, verified });
  }

  saveToStorage();
  closeAccForm();
  renderAccountsList();
  showToast("Account saved.");
});

function editAcc(i) { openAccForm(window.db.accounts[i], i); }

function resetPw(i) {
  const pw = prompt("New password (min 6 chars):");
  if (pw === null) return;
  if (pw.length < 6) { alert("Too short."); return; }
  window.db.accounts[i].password = pw;
  saveToStorage();
  showToast("Password updated.");
}

function deleteAcc(i) {
  if (window.db.accounts[i].email === currentUser?.email) { alert("Can't delete your own account."); return; }
  if (!confirm(`Delete ${window.db.accounts[i].email}?`)) return;
  window.db.accounts.splice(i, 1);
  saveToStorage();
  renderAccountsList();
  showToast("Account deleted.", "danger");
}

/* ========================
   DEPARTMENTS
======================== */

function renderDepartmentsList() {
  const tbody = document.getElementById("dept-list");
  tbody.innerHTML = "";
  window.db.departments.forEach((d, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.desc || "—"}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editDept(${i})">Edit</button>
          <button class="btn btn-sm btn-outline-danger"       onclick="deleteDept(${i})">Delete</button>
        </td>
      </tr>`;
  });
}

function openDeptForm(data = null, idx = -1) {
  document.getElementById("dept-form").style.display = "block";
  document.getElementById("dept-form-title").innerText = idx >= 0 ? "Edit Department" : "Add Department";
  document.getElementById("dept-idx").value  = idx;
  document.getElementById("dept-name").value = data?.name || "";
  document.getElementById("dept-desc").value = data?.desc || "";
}

function closeDeptForm() {
  document.getElementById("dept-form").style.display = "none";
}

document.getElementById("dept-form-el").addEventListener("submit", function (e) {
  e.preventDefault();

  const idx  = parseInt(document.getElementById("dept-idx").value);
  const name = document.getElementById("dept-name").value.trim();
  const desc = document.getElementById("dept-desc").value.trim();

  if (idx >= 0) {
    Object.assign(window.db.departments[idx], { name, desc });
  } else {
    window.db.departments.push({ id: "dept-" + Date.now(), name, desc });
  }

  saveToStorage();
  closeDeptForm();
  renderDepartmentsList();
  showToast("Department saved.");
});

function editDept(i)   { openDeptForm(window.db.departments[i], i); }

function deleteDept(i) {
  if (!confirm(`Delete "${window.db.departments[i].name}"?`)) return;
  window.db.departments.splice(i, 1);
  saveToStorage();
  renderDepartmentsList();
  showToast("Department deleted.", "danger");
}

/* ========================
   EMPLOYEES
======================== */

function renderEmployeesTable() {
  const tbody = document.getElementById("emp-list");
  tbody.innerHTML = "";
  window.db.employees.forEach((emp, i) => {
    const dept = window.db.departments.find(d => d.id === emp.deptId);
    tbody.innerHTML += `
      <tr>
        <td>${emp.empId}</td>
        <td>${emp.email}</td>
        <td>${emp.position}</td>
        <td>${dept ? dept.name : "—"}</td>
        <td>${emp.hireDate || "—"}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmp(${i})">Edit</button>
          <button class="btn btn-sm btn-outline-danger"       onclick="deleteEmp(${i})">Delete</button>
        </td>
      </tr>`;
  });
}

function fillDeptDropdown(selected = "") {
  const sel = document.getElementById("emp-dept");
  sel.innerHTML = `<option value="">Select Department</option>`;
  window.db.departments.forEach(d => {
    sel.innerHTML += `<option value="${d.id}" ${d.id === selected ? "selected" : ""}>${d.name}</option>`;
  });
}

function openEmpForm(data = null, idx = -1) {
  document.getElementById("emp-form").style.display = "block";
  document.getElementById("emp-form-title").innerText = idx >= 0 ? "Edit Employee" : "Add Employee";
  document.getElementById("emp-idx").value       = idx;
  document.getElementById("emp-id").value        = data?.empId    || "";
  document.getElementById("emp-email").value     = data?.email    || "";
  document.getElementById("emp-position").value  = data?.position || "";
  document.getElementById("emp-hire").value      = data?.hireDate || "";
  document.getElementById("emp-error").innerText = "";
  fillDeptDropdown(data?.deptId || "");
}

function closeEmpForm() {
  document.getElementById("emp-form").style.display = "none";
}

document.getElementById("emp-form-el").addEventListener("submit", function (e) {
  e.preventDefault();

  const idx      = parseInt(document.getElementById("emp-idx").value);
  const empId    = document.getElementById("emp-id").value.trim();
  const email    = document.getElementById("emp-email").value.trim();
  const position = document.getElementById("emp-position").value.trim();
  const deptId   = document.getElementById("emp-dept").value;
  const hireDate = document.getElementById("emp-hire").value;
  const err      = document.getElementById("emp-error");

  if (!window.db.accounts.find(a => a.email === email)) { err.innerText = "No account with that email."; return; }
  if (!deptId) { err.innerText = "Pick a department."; return; }

  const entry = { empId, email, position, deptId, hireDate };

  if (idx >= 0) {
    Object.assign(window.db.employees[idx], entry);
  } else {
    window.db.employees.push(entry);
  }

  saveToStorage();
  closeEmpForm();
  renderEmployeesTable();
  showToast("Employee saved.");
});

function editEmp(i)   { openEmpForm(window.db.employees[i], i); }

function deleteEmp(i) {
  if (!confirm("Remove this employee?")) return;
  window.db.employees.splice(i, 1);
  saveToStorage();
  renderEmployeesTable();
  showToast("Employee removed.", "danger");
}

/* ========================
   REQUESTS
======================== */

function resetReqForm() {
  document.getElementById("req-items").innerHTML = "";
  document.getElementById("req-error").innerText = "";
  addItem();
}

function addItem() {
  const row = document.createElement("div");
  row.className = "d-flex gap-2 mb-2 item-row";
  row.innerHTML = `
    <input type="text"   class="form-control" placeholder="Item name" />
    <input type="number" class="form-control" style="max-width:100px" placeholder="Qty" min="1" value="1" />
    <button type="button" class="btn btn-outline-danger btn-sm" onclick="this.closest('.item-row').remove()">×</button>
  `;
  document.getElementById("req-items").appendChild(row);
}

function submitReq() {
  const type = document.getElementById("req-type").value;
  const err  = document.getElementById("req-error");
  const rows = document.querySelectorAll(".item-row");

  const items = [];
  rows.forEach(row => {
    const [nameEl, qtyEl] = row.querySelectorAll("input");
    const name = nameEl.value.trim();
    if (name) items.push({ name, qty: qtyEl.value });
  });

  if (!items.length) { err.innerText = "Add at least one item."; return; }
  err.innerText = "";

  window.db.requests.push({
    id:            "req-" + Date.now(),
    type,
    items,
    status:        "Pending",
    date:          new Date().toLocaleDateString(),
    employeeEmail: currentUser.email
  });

  saveToStorage();
  bootstrap.Modal.getInstance(document.getElementById("req-popup")).hide();
  renderRequestsList();
  resetReqForm();
  showToast("Request submitted!");
}

function renderRequestsList() {
  const tbody = document.getElementById("req-list");
  const mine  = window.db.requests.filter(r => r.employeeEmail === currentUser.email);

  tbody.innerHTML = "";

  if (!mine.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No requests yet.</td></tr>`;
    return;
  }

  mine.forEach(r => {
    const color   = r.status === "Approved" ? "bg-success"
                  : r.status === "Rejected" ? "bg-danger"
                  : "bg-warning text-dark";
    const summary = r.items.map(i => `${i.name} (×${i.qty})`).join(", ");
    tbody.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.type}</td>
        <td><small>${summary}</small></td>
        <td><span class="badge ${color}">${r.status}</span></td>
      </tr>`;
  });
}

/* ========================
   INIT
======================== */

loadFromStorage();

// Restore session on page reload
const savedToken = localStorage.getItem("auth_token");
if (savedToken) {
  const user = window.db.accounts.find(a => a.email === savedToken);
  if (user) setAuthState(true, user);
}

handleRouting();