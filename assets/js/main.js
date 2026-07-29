/* Baal Dan Charities site interactions (vanilla JS, no build step) */
(function () {
  "use strict";

  /* ---------- Load shared header/footer partials ---------- */
  function loadPartials() {
    var slots = document.querySelectorAll("[data-include]");
    var pending = slots.length;
    if (!pending) { afterPartials(); return; }
    slots.forEach(function (el) {
      var file = el.getAttribute("data-include");
      fetch(file)
        .then(function (r) { if (!r.ok) throw new Error(file); return r.text(); })
        .then(function (html) {
          el.outerHTML = html;
        })
        .catch(function () {
          el.innerHTML = "";
        })
        .finally(function () {
          pending -= 1;
          if (pending === 0) afterPartials();
        });
    });
  }

  function afterPartials() {
    markActiveNav();
    initHeaderInteractions();
    initThemeToggle();
    initBackToTop();
  }

  function markActiveNav() {
    var here = (location.pathname.split("/").pop() || "index.html");
    document.querySelectorAll(".nav a.nav-link, .dropdown a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href && href.split("/").pop() === here) a.classList.add("active");
    });
  }

  function initHeaderInteractions() {
    var burger = document.querySelector(".hamburger");
    var nav = document.querySelector(".nav");
    if (burger && nav) {
      burger.addEventListener("click", function () {
        burger.classList.toggle("open");
        nav.classList.toggle("open");
      });
    }
    // mobile dropdown tap-to-open
    document.querySelectorAll(".has-dropdown > .nav-link").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (window.innerWidth <= 960) {
          e.preventDefault();
          link.parentElement.classList.toggle("open");
        }
      });
    });
  }

  function initThemeToggle() {
    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    var stored = localStorage.getItem("baaldan-theme");
    if (stored) document.documentElement.setAttribute("data-theme", stored);
    updateThemeIcon(toggle);
    toggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", current);
      localStorage.setItem("baaldan-theme", current);
      updateThemeIcon(toggle);
    });
  }
  function updateThemeIcon(toggle) {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    toggle.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>';
  }

  function initBackToTop() {
    var btn = document.querySelector(".back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("show", window.scrollY > 500);
    });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Reveal-on-scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("pending");
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach(function (el) { el.classList.add("pending"); io.observe(el); });
  }

  /* ---------- Animated counters ---------- */
  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { io.observe(el); });
  }
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = prefix + value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- Testimonial slider ---------- */
  function initTestimonialSlider() {
    var slider = document.querySelector("[data-testimonial-slider]");
    if (!slider) return;
    var slides = Array.from(slider.querySelectorAll(".t-slide"));
    var controls = slider.querySelector(".t-controls");
    var index = 0;
    slides.forEach(function (s, i) {
      var dot = document.createElement("button");
      dot.className = "t-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Show testimonial " + (i + 1));
      dot.addEventListener("click", function () { show(i); });
      controls.appendChild(dot);
    });
    var dots = Array.from(controls.querySelectorAll(".t-dot"));
    function show(i) {
      slides[index].classList.remove("active");
      dots[index].classList.remove("active");
      index = i;
      slides[index].classList.add("active");
      dots[index].classList.add("active");
    }
    var timer = setInterval(function () { show((index + 1) % slides.length); }, 6000);
    slider.addEventListener("mouseenter", function () { clearInterval(timer); });
  }

  /* ---------- Accordion ---------- */
  function initAccordion() {
    document.querySelectorAll(".accordion-head").forEach(function (head) {
      head.addEventListener("click", function () {
        var item = head.parentElement;
        var body = item.querySelector(".accordion-body");
        var wasOpen = item.classList.contains("open");
        item.parentElement.querySelectorAll(".accordion-item").forEach(function (i) {
          i.classList.remove("open");
          i.querySelector(".accordion-body").style.maxHeight = null;
        });
        if (!wasOpen) {
          item.classList.add("open");
          body.style.maxHeight = body.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------- Country cards ---------- */
  function initCountryCards() {
    document.querySelectorAll(".country-card").forEach(function (card) {
      card.addEventListener("click", function () { card.classList.toggle("open"); });
    });
  }

  /* ---------- Donate form ---------- */
  function initDonateForm() {
    var panel = document.querySelector("[data-donate-panel]");
    if (!panel) return;
    var freqBtns = panel.querySelectorAll(".freq-toggle button");
    var amountBtns = panel.querySelectorAll(".amount-btn");
    var customInput = panel.querySelector("#custom-amount");
    var impactLine = panel.querySelector("[data-impact-line]");
    var totalLabel = panel.querySelector("[data-total-label]");
    var hiddenAmount = { value: 50 };
    var hiddenFreq = { value: "monthly" };

    var impactMap = {
      25: "provides a week of nutritious meals for a child.",
      50: "covers a month of school supplies and textbooks.",
      100: "helps fund clean water & sanitation access for a family.",
      250: "supports a child's education sponsorship for a term.",
      500: "helps a grantee partner expand a nutrition program.",
      1000: "makes you a Baal Dan Luminary, funding a program for a month."
    };

    function refreshImpact() {
      var amt = hiddenAmount.value;
      var closest = Object.keys(impactMap).reduce(function (a, b) {
        return Math.abs(b - amt) < Math.abs(a - amt) ? b : a;
      });
      if (impactLine) impactLine.textContent = "$" + amt + " " + (hiddenFreq.value === "monthly" ? "a month " : "") + impactMap[closest];
      if (totalLabel) totalLabel.textContent = "$" + amt + (hiddenFreq.value === "monthly" ? " / month" : " one-time");
    }

    freqBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        freqBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        hiddenFreq.value = btn.getAttribute("data-freq");
        refreshImpact();
      });
    });
    amountBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        amountBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        hiddenAmount.value = parseFloat(btn.getAttribute("data-amount"));
        if (customInput) customInput.value = "";
        refreshImpact();
      });
    });
    if (customInput) {
      customInput.addEventListener("input", function () {
        if (customInput.value) {
          amountBtns.forEach(function (b) { b.classList.remove("active"); });
          hiddenAmount.value = parseFloat(customInput.value) || 0;
          refreshImpact();
        }
      });
    }
    refreshImpact();

    var form = panel.querySelector("#donate-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var payEmail = form.getAttribute("data-paypal-business") || "";
        if (!payEmail || payEmail.indexOf("REPLACE") !== -1) {
          showToast("Demo mode: connect a PayPal business email or Stripe Payment Link in donate.html to go live.");
          return;
        }
        var params = new URLSearchParams({
          cmd: "_donations",
          business: payEmail,
          item_name: "Donation to Baal Dan Charities",
          currency_code: "USD",
          amount: hiddenAmount.value
        });
        window.location.href = "https://www.paypal.com/cgi-bin/webscr?" + params.toString();
      });
    }
  }

  /* ---------- Employee matching search (demo) ---------- */
  function initMatchSearch() {
    var form = document.querySelector("#match-form");
    if (!form) return;
    var result = document.querySelector("#match-result");
    var known = ["microsoft", "at&t", "att", "esurance", "wells fargo", "tellabs", "ing", "liberty mutual", "ebay"];
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = form.querySelector("input").value.trim().toLowerCase();
      if (!val) return;
      var match = known.some(function (k) { return val.indexOf(k) !== -1; });
      result.textContent = match
        ? "Great news, " + form.querySelector("input").value + " has matched Baal Dan gifts before. Check your HR portal or contact us and we'll help you submit the match."
        : "We couldn't confirm " + form.querySelector("input").value + " in our records. Many employers still match! Email us and we'll help you find out.";
    });
  }

  /* ---------- Newsletter / contact form demo ---------- */
  function initDemoForms() {
    document.querySelectorAll("form[data-demo-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        showToast(form.getAttribute("data-success") || "Thank you! We'll be in touch soon.");
        form.reset();
      });
    });
  }

  function showToast(message) {
    var toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove("show"); }, 3600);
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    loadPartials();
    initReveal();
    initCounters();
    initTestimonialSlider();
    initAccordion();
    initCountryCards();
    initDonateForm();
    initMatchSearch();
    initDemoForms();

    var yearEl = document.querySelector("[data-year]");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
