const STORAGE_KEY = "ipt_demo_v1";
let currentUser = null;

window.db = {
    accounts: [],
    departments: []
};

/* STORAGE */

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!data) throw "No data";
        window.db = data;
    } catch {
        window.db = {
            accounts: [
                {
                    firstName: "Admin",
                    lastName: "User",
                    email: "admin@example.com",
                    password: "Password123!",
                    role: "admin",
                    verified: true
                }
            ],
            departments: []
        };
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

/* ROUTING */

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    let hash = window.location.hash || "#/";

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    if (hash === "#/register") showPage("register-page");
    else if (hash === "#/login") showPage("login-page");
    else if (hash === "#/verify-email") {
        showPage("verify-email-page");
        const email = localStorage.getItem("unverified_email");
        document.getElementById("verifyEmailText").innerText = email || "";
    }
    else if (hash === "#/profile") {
        if (!currentUser) return navigateTo("#/login");
        showPage("profile-page");
        renderProfile();
    }
    else showPage("home-page");
}

function showPage(id) {
    document.getElementById(id).classList.add("active");
}

window.addEventListener("hashchange", handleRouting);

/* AUTH */

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
    navigateTo("#/");
}

/* REGISTER */

document.getElementById("registerForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const first = regFirst.value.trim();
    const last = regLast.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;

    if (window.db.accounts.find(acc => acc.email === email)) {
        registerError.innerText = "Email already exists.";
        return;
    }

    const newUser = {
        firstName: first,
        lastName: last,
        email,
        password,
        role: (currentUser && currentUser.role === "admin") ? "admin" : "user",
        verified: false
    };

    window.db.accounts.push(newUser);
    saveToStorage();

    localStorage.setItem("unverified_email", email);
    navigateTo("#/verify-email");
});

/* VERIFY */

function simulateVerification() {
    const email = localStorage.getItem("unverified_email");
    const user = window.db.accounts.find(acc => acc.email === email);
    if (user) {
        user.verified = true;
        saveToStorage();
        navigateTo("#/login");
    }
}

/* LOGIN */

document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    const user = window.db.accounts.find(acc =>
        acc.email === email &&
        acc.password === password &&
        acc.verified === true
    );

    if (!user) {
        loginError.innerText = "Invalid credentials or email not verified.";
        return;
    }

    setAuthState(true, user);
    navigateTo("#/profile");
});

/* PROFILE */

function renderProfile() {
    document.getElementById("profileInfo").innerHTML = `
        <strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}<br>
        <strong>Email:</strong> ${currentUser.email}<br>
        <strong>Role:</strong> ${currentUser.role}
    `;
}

/* INIT */

loadFromStorage();
handleRouting();
