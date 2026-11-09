/* ===================================================================
   comum.js — configuração do MathJax, navegação e utilitários gráficos
   Probabilidade & Estatística / URCA
   =================================================================== */

/* ---------- MathJax ---------- */
window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)'], ['$', '$']],
    displayMath: [['\\[', '\\]'], ['$$', '$$']],
    processEscapes: true,
    macros: {
      med: ['\\langle #1 \\rangle', 1],
      /* notação brasileira: sen, tg, cotg, arcsen.
         Redefinimos \sin e \tan para que qualquer fórmula escrita no padrão
         internacional também apareça na notação usada em sala. */
      sen: '\\operatorname{sen}',
      sin: '\\operatorname{sen}',
      tg: '\\operatorname{tg}',
      tan: '\\operatorname{tg}',
      cotg: '\\operatorname{cotg}',
      cot: '\\operatorname{cotg}',
      arcsen: '\\operatorname{arcsen}',
      arcsin: '\\operatorname{arcsen}',
      arctg: '\\operatorname{arctg}',
      arctan: '\\operatorname{arctg}',
      Var: '\\operatorname{Var}',
      Cov: '\\operatorname{Cov}',
      E: '\\mathbb{E}',
      R: '\\mathbb{R}',
      N: '\\mathbb{N}'
    }
  },
  options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
  svg: { fontCache: 'global' }
};

/* ---------- Índice lateral ativo durante a rolagem ---------- */
document.addEventListener('DOMContentLoaded', function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.lateral a[href^="#"]'));
  if (!links.length) return;
  var alvos = links.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  }).filter(Boolean);

  function atualizar() {
    var y = window.scrollY + 110, atual = null;
    alvos.forEach(function (el) { if (el.offsetTop <= y) atual = el; });
    links.forEach(function (a) {
      a.classList.toggle('ativo', atual && a.getAttribute('href') === '#' + atual.id);
    });
  }
  var pendente = false;
  window.addEventListener('scroll', function () {
    if (pendente) return;
    pendente = true;
    window.requestAnimationFrame(function () { atualizar(); pendente = false; });
  }, { passive: true });
  atualizar();
});

/* ===================================================================
   Utilitários matemáticos
   =================================================================== */
var M = (function () {

  function fatorial(n) {
    if (n < 0) return NaN;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }

  /* log(n!) por Lanczos — estável para n grande */
  function lnGama(z) {
    var g = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
             -176.61502916214059, 12.507343278686905, -0.13857109526572012,
             9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGama(1 - z);
    z -= 1;
    var x = 0.99999999999980993;
    for (var i = 0; i < 8; i++) x += g[i] / (z + i + 1);
    var t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  function lnFatorial(n) { return lnGama(n + 1); }

  function binom(n, k) {
    if (k < 0 || k > n) return 0;
    if (n < 171) return Math.round(fatorial(n) / (fatorial(k) * fatorial(n - k)));
    return Math.exp(lnFatorial(n) - lnFatorial(k) - lnFatorial(n - k));
  }

  function arranjo(n, k) {
    if (k < 0 || k > n) return 0;
    var r = 1;
    for (var i = 0; i < k; i++) r *= (n - i);
    return r;
  }

  /* Distribuições */
  function pBinomial(n, k, p) {
    if (k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    var ln = lnFatorial(n) - lnFatorial(k) - lnFatorial(n - k)
           + k * Math.log(p) + (n - k) * Math.log(1 - p);
    return Math.exp(ln);
  }

  function pPoisson(k, m) {
    if (k < 0) return 0;
    if (m === 0) return k === 0 ? 1 : 0;
    return Math.exp(-m + k * Math.log(m) - lnFatorial(k));
  }

  function pGeometrica(k, p) { // k = número do ensaio do 1º sucesso, k>=1
    if (k < 1) return 0;
    return Math.pow(1 - p, k - 1) * p;
  }

  function dNormal(x, mu, sg) {
    var z = (x - mu) / sg;
    return Math.exp(-0.5 * z * z) / (sg * Math.sqrt(2 * Math.PI));
  }

  /* erf por Abramowitz & Stegun 7.1.26 (|erro| < 1.5e-7) */
  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
                - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }

  function FNormal(x, mu, sg) { // acumulada
    return 0.5 * (1 + erf((x - (mu || 0)) / ((sg === undefined ? 1 : sg) * Math.SQRT2)));
  }

  /* quantil normal padrão — Acklam */
  function zCritico(p) {
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];
    var pb = 0.02425, q, r;
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p < pb) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
    if (p <= 1 - pb) {
      q = p - 0.5; r = q * q;
      return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
             (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    }
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }

  /* ----- distribuição t de Student ----- */
  function lnGamaF(x) { return lnFatorial(x - 1); }

  function dT(t, nu) {
    var ln = lnGamaF((nu + 1) / 2) - lnGamaF(nu / 2)
           - 0.5 * Math.log(nu * Math.PI)
           - ((nu + 1) / 2) * Math.log(1 + t * t / nu);
    return Math.exp(ln);
  }

  /* integração de Simpson de a até b */
  function simpson(f, a, b, n) {
    n = n || 400;
    if (n % 2) n++;
    var h = (b - a) / n, s = f(a) + f(b);
    for (var i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  }

  function FT(t, nu) {
    if (t === 0) return 0.5;
    var area = simpson(function (x) { return dT(x, nu); }, 0, Math.abs(t), 400);
    return t > 0 ? 0.5 + area : 0.5 - area;
  }

  /* t crítico bilateral: devolve t tal que P(T > t) = alfa */
  function tCritico(alfa, nu) {
    var lo = 0, hi = 60;
    for (var i = 0; i < 80; i++) {
      var m = (lo + hi) / 2;
      if (1 - FT(m, nu) > alfa) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  /* ----- distribuição qui-quadrado ----- */
  function dQui(x, k) {
    if (x <= 0) return 0;
    var ln = (k / 2 - 1) * Math.log(x) - x / 2
           - (k / 2) * Math.LN2 - lnGamaF(k / 2);
    return Math.exp(ln);
  }

  /* gama incompleta regularizada P(a,x) — série e fração continuada
     (Simpson não serve aqui: para k=1 a densidade diverge na origem) */
  function gamaP(a, x) {
    if (x <= 0 || a <= 0) return 0;
    var i, del;
    if (x < a + 1) {                       // série
      var ap = a, soma = 1 / a;
      del = soma;
      for (i = 0; i < 600; i++) {
        ap++; del *= x / ap; soma += del;
        if (Math.abs(del) < Math.abs(soma) * 1e-15) break;
      }
      return soma * Math.exp(-x + a * Math.log(x) - lnGamaF(a));
    }
    var MIN = 1e-300;                      // fração continuada para Q
    var b = x + 1 - a, c = 1 / MIN, d = 1 / b, h = d, an;
    for (i = 1; i <= 600; i++) {
      an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < MIN) d = MIN;
      c = b + an / c; if (Math.abs(c) < MIN) c = MIN;
      d = 1 / d;
      del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - lnGamaF(a)) * h;
  }

  function FQui(x, k) {
    if (x <= 0) return 0;
    return Math.min(1, Math.max(0, gamaP(k / 2, x / 2)));
  }

  /* qui-quadrado crítico: devolve x tal que P(X > x) = alfa */
  function quiCritico(alfa, k) {
    var lo = 1e-6, hi = Math.max(60, k * 6 + 40);
    for (var i = 0; i < 90; i++) {
      var m = (lo + hi) / 2;
      if (1 - FQui(m, k) > alfa) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  /* ===================================================================
     Distribuição F de Snedecor, correlação e acumuladas discretas
     =================================================================== */

  /* fração continuada de Lentz para a beta incompleta */
  function betaCF(a, b, x) {
    var MAX = 300, EPS = 3e-16, MIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < MIN) d = MIN;
    d = 1 / d;
    var h = d, m, m2, aa, del;
    for (m = 1; m <= MAX; m++) {
      m2 = 2 * m;
      aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < MIN) d = MIN;
      c = 1 + aa / c; if (Math.abs(c) < MIN) c = MIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < MIN) d = MIN;
      c = 1 + aa / c; if (Math.abs(c) < MIN) c = MIN;
      d = 1 / d; del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  /* beta incompleta regularizada I_x(a,b) */
  function betaI(a, b, x) {
    if (!(x > 0)) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lnGama(a + b) - lnGama(a) - lnGama(b)
      + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2)
      ? bt * betaCF(a, b, x) / a
      : 1 - bt * betaCF(b, a, 1 - x) / b;
  }

  function dF(x, v1, v2) {
    if (!(x > 0)) return 0;
    var l = 0.5 * v1 * Math.log(v1) + 0.5 * v2 * Math.log(v2)
      + (0.5 * v1 - 1) * Math.log(x) - 0.5 * (v1 + v2) * Math.log(v2 + v1 * x)
      + lnGama((v1 + v2) / 2) - lnGama(v1 / 2) - lnGama(v2 / 2);
    return Math.exp(l);
  }

  function FF(x, v1, v2) {
    if (!(x > 0)) return 0;
    return Math.min(1, Math.max(0, betaI(v1 / 2, v2 / 2, v1 * x / (v1 * x + v2))));
  }

  /* F crítico: devolve x tal que P(X > x) = alfa */
  function fCritico(alfa, v1, v2) {
    var lo = 1e-8, hi = 1e5;
    for (var i = 0; i < 200; i++) {
      var m = (lo + hi) / 2;
      if (1 - FF(m, v1, v2) > alfa) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  /* correlação de Pearson: sob H0 (ρ=0), t = r√(n−2)/√(1−r²) tem ν = n−2,
     de modo que o r crítico sai do t crítico */
  function rCritico(alfa, n) {
    var nu = n - 2;
    if (nu < 1) return NaN;
    var t = tCritico(alfa, nu);
    return t / Math.sqrt(t * t + nu);
  }
  /* valor p bilateral de r */
  function pCorrelacao(r, n) {
    var nu = n - 2;
    if (nu < 1 || Math.abs(r) >= 1) return NaN;
    var t = Math.abs(r) * Math.sqrt(nu / (1 - r * r));
    return 2 * (1 - FT(t, nu));
  }

  /* acumuladas discretas, somando as probabilidades pontuais */
  function FBinomial(k, n, p) {
    if (k < 0) return 0;
    var s = 0;
    for (var i = 0; i <= Math.min(k, n); i++) s += pBinomial(n, i, p);
    return Math.min(1, s);
  }
  function FPoisson(k, m) {
    if (k < 0) return 0;
    var s = 0;
    for (var i = 0; i <= k; i++) s += pPoisson(i, m);
    return Math.min(1, s);
  }

  /* ===================================================================
     Testes de normalidade
     =================================================================== */

  /* momentos amostrais padronizados */
  function momentos(x) {
    var n = x.length, m = 0, i;
    for (i = 0; i < n; i++) m += x[i];
    m /= n;
    var m2 = 0, m3 = 0, m4 = 0, d;
    for (i = 0; i < n; i++) {
      d = x[i] - m;
      m2 += d * d; m3 += d * d * d; m4 += d * d * d * d;
    }
    m2 /= n; m3 /= n; m4 /= n;
    return {
      media: m,
      s: Math.sqrt(m2 * n / (n - 1)),
      /* assimetria e curtose amostrais, com correção para amostra */
      g1: m3 / Math.pow(m2, 1.5),
      g2: m4 / (m2 * m2) - 3
    };
  }

  /* D'Agostino–Pearson K²: combina assimetria e curtose */
  function dagostino(x) {
    var n = x.length;
    if (n < 8) return null;
    var mo = momentos(x), b1 = mo.g1, b2 = mo.g2 + 3;

    /* transformação da assimetria (D'Agostino, 1970) */
    var Y = b1 * Math.sqrt((n + 1) * (n + 3) / (6 * (n - 2)));
    var beta2 = 3 * (n * n + 27 * n - 70) * (n + 1) * (n + 3)
              / ((n - 2) * (n + 5) * (n + 7) * (n + 9));
    var W2 = -1 + Math.sqrt(2 * (beta2 - 1));
    var delta = 1 / Math.sqrt(0.5 * Math.log(W2));
    var alfa = Math.sqrt(2 / (W2 - 1));
    var Z1 = delta * Math.log(Y / alfa + Math.sqrt(Math.pow(Y / alfa, 2) + 1));

    /* transformação da curtose (Anscombe–Glynn, 1983) */
    var Eb2 = 3 * (n - 1) / (n + 1);
    var varb2 = 24 * n * (n - 2) * (n - 3) / ((n + 1) * (n + 1) * (n + 3) * (n + 5));
    var Xx = (b2 - Eb2) / Math.sqrt(varb2);
    var sqrtB1 = 6 * (n * n - 5 * n + 2) / ((n + 7) * (n + 9))
               * Math.sqrt(6 * (n + 3) * (n + 5) / (n * (n - 2) * (n - 3)));
    var A = 6 + (8 / sqrtB1) * (2 / sqrtB1 + Math.sqrt(1 + 4 / (sqrtB1 * sqrtB1)));
    var termo = (1 - 2 / A) / (1 + Xx * Math.sqrt(2 / (A - 4)));
    var Z2 = (1 - 2 / (9 * A) - Math.sign(termo) * Math.pow(Math.abs(termo), 1 / 3))
           / Math.sqrt(2 / (9 * A));

    var K2 = Z1 * Z1 + Z2 * Z2;
    return { K2: K2, Z1: Z1, Z2: Z2, g1: mo.g1, g2: mo.g2, p: 1 - FQui(K2, 2) };
  }

  /* Anderson–Darling para normalidade, com parâmetros estimados */
  function andersonDarling(x) {
    var n = x.length;
    if (n < 8) return null;
    var ord = x.slice().sort(function (a, b) { return a - b; });
    var mo = momentos(ord);
    var soma = 0;
    for (var i = 0; i < n; i++) {
      var F1 = FNormal(ord[i], mo.media, mo.s);
      var F2 = FNormal(ord[n - 1 - i], mo.media, mo.s);
      F1 = Math.min(1 - 1e-12, Math.max(1e-12, F1));
      F2 = Math.min(1 - 1e-12, Math.max(1e-12, F2));
      soma += (2 * (i + 1) - 1) * (Math.log(F1) + Math.log(1 - F2));
    }
    var A2 = -n - soma / n;
    var A2e = A2 * (1 + 0.75 / n + 2.25 / (n * n));   /* corrigido para n finito */
    /* valor p pela aproximação de D'Agostino & Stephens (1986) */
    var p;
    if (A2e >= 0.6) p = Math.exp(1.2937 - 5.709 * A2e + 0.0186 * A2e * A2e);
    else if (A2e >= 0.34) p = Math.exp(0.9177 - 4.279 * A2e - 1.38 * A2e * A2e);
    else if (A2e >= 0.2) p = 1 - Math.exp(-8.318 + 42.796 * A2e - 59.938 * A2e * A2e);
    else p = 1 - Math.exp(-13.436 + 101.14 * A2e - 223.73 * A2e * A2e);
    return { A2: A2e, p: Math.min(1, Math.max(0, p)) };
  }

  /* Kolmogorov–Smirnov com parâmetros estimados (Lilliefors) */
  function lilliefors(x) {
    var n = x.length;
    if (n < 4) return null;
    var ord = x.slice().sort(function (a, b) { return a - b; });
    var mo = momentos(ord);
    var D = 0;
    for (var i = 0; i < n; i++) {
      var F = FNormal(ord[i], mo.media, mo.s);
      D = Math.max(D, Math.abs((i + 1) / n - F), Math.abs(F - i / n));
    }
    /* valor crítico a 5% (Lilliefors), aproximação usual */
    var crit05 = n > 30 ? 0.886 / Math.sqrt(n)
                        : [0, 0, 0, 0, 0.381, 0.337, 0.319, 0.300, 0.285, 0.271, 0.258,
                           0.249, 0.242, 0.234, 0.227, 0.220, 0.213, 0.206, 0.200, 0.195,
                           0.190, 0.187, 0.182, 0.177, 0.173, 0.169, 0.166, 0.163, 0.160,
                           0.157, 0.155][n] || 0.886 / Math.sqrt(n);
    return { D: D, crit05: crit05, rejeita: D > crit05 };
  }

  /* Shapiro–Wilk pelo algoritmo de Royston (1992) */
  /* Coeficientes a_i do Shapiro-Wilk (Royston 1992), e os valores esperados m_i
     das estatisticas de ordem de que eles derivam. Depende so de n. */
  function coefsSW(n) {
    if (n < 4 || n > 5000) return null;
    var i, m = [], somaM2 = 0;
    for (i = 1; i <= n; i++) {
      var mi = zCritico((i - 0.375) / (n + 0.25));
      m.push(mi); somaM2 += mi * mi;
    }
    var a = new Array(n), u = 1 / Math.sqrt(n), raiz = Math.sqrt(somaM2);
    var an = -2.706056 * Math.pow(u, 5) + 4.434685 * Math.pow(u, 4)
           - 2.071190 * Math.pow(u, 3) - 0.147981 * u * u + 0.221157 * u
           + m[n - 1] / raiz;
    a[n - 1] = an; a[0] = -an;
    var phi, inicio;
    if (n > 5) {
      var an1 = -3.582633 * Math.pow(u, 5) + 5.682633 * Math.pow(u, 4)
              - 1.752461 * Math.pow(u, 3) - 0.293762 * u * u + 0.042981 * u
              + m[n - 2] / raiz;
      a[n - 2] = an1; a[1] = -an1;
      phi = (somaM2 - 2 * m[n - 1] * m[n - 1] - 2 * m[n - 2] * m[n - 2])
          / (1 - 2 * an * an - 2 * an1 * an1);
      inicio = 2;
    } else {
      phi = (somaM2 - 2 * m[n - 1] * m[n - 1]) / (1 - 2 * an * an);
      inicio = 1;
    }
    for (i = inicio; i < n - inicio; i++) a[i] = m[i] / Math.sqrt(phi);
    return { a: a, m: m, somaM2: somaM2 };
  }

  function shapiroWilk(x) {
    var n = x.length;
    if (n < 4 || n > 5000) return null;
    var ord = x.slice().sort(function (p, q) { return p - q; });
    var C = coefsSW(n);
    if (!C) return null;
    var a = C.a, m = C.m, i;

    var media = 0;
    for (i = 0; i < n; i++) media += ord[i];
    media /= n;
    var num = 0, den = 0;
    for (i = 0; i < n; i++) { num += a[i] * ord[i]; den += Math.pow(ord[i] - media, 2); }
    var W = num * num / den;
    if (W >= 1) W = 1 - 1e-12;

    /* valor p (Royston) */
    var p, g, mu, sg, ln = Math.log(n);
    if (n <= 11) {
      g = -2.273 + 0.459 * n;
      mu = 0.5440 - 0.39978 * n + 0.025054 * n * n - 0.0006714 * n * n * n;
      sg = Math.exp(1.3822 - 0.77857 * n + 0.062767 * n * n - 0.0020322 * n * n * n);
      var y = -Math.log(g - Math.log(1 - W));
      p = 1 - FNormal((y - mu) / sg, 0, 1);
    } else {
      mu = 0.0038915 * ln * ln * ln - 0.083751 * ln * ln - 0.31082 * ln - 1.5861;
      sg = Math.exp(0.0030302 * ln * ln - 0.082676 * ln - 0.4803);
      p = 1 - FNormal((Math.log(1 - W) - mu) / sg, 0, 1);
    }
    return { W: W, p: Math.min(1, Math.max(0, p)), a: a, m: m, ord: ord };
  }

  /* ===================================================================
     Distribuições exatas dos testes não paramétricos
     =================================================================== */

  /* Postos com empates resolvidos pela média das posições.
     Devolve {r: postos, correcao: Σ(t³−t) sobre os grupos empatados}  */
  function postosMedios(v) {
    var n = v.length, idx = [], i, j;
    for (i = 0; i < n; i++) idx.push(i);
    idx.sort(function (p, q) { return v[p] - v[q]; });
    var r = new Array(n), corr = 0;
    i = 0;
    while (i < n) {
      j = i;
      while (j + 1 < n && v[idx[j + 1]] === v[idx[i]]) j++;
      var m = (i + j) / 2 + 1, t = j - i + 1;
      for (var k = i; k <= j; k++) r[idx[k]] = m;
      if (t > 1) corr += t * t * t - t;
      i = j + 1;
    }
    return { r: r, correcao: corr };
  }

  /* Wilcoxon dos postos sinalizados: nº de subconjuntos de {1..n} com soma w.
     Guardado em cache, pois a tabela é a mesma para todo n repetido. */
  var cacheW = {};
  function contagemWilcoxon(n) {
    if (cacheW[n]) return cacheW[n];
    var max = n * (n + 1) / 2, c = new Float64Array(max + 1), i, w;
    c[0] = 1;
    for (i = 1; i <= n; i++)
      for (w = max; w >= i; w--) c[w] += c[w - i];
    cacheW[n] = c;
    return c;
  }

  /* P(W⁺ ≤ w) exato, sem empates */
  function FWilcoxon(w, n) {
    if (n < 1) return NaN;
    var c = contagemWilcoxon(n), total = Math.pow(2, n), s = 0;
    for (var i = 0; i <= Math.min(w, c.length - 1); i++) s += c[i];
    return s / total;
  }

  /* valor p bilateral do Wilcoxon pareado.
     exato quando n ≤ 25 e não há empates nos postos; normal com
     correção de continuidade e de empates caso contrário. */
  function pWilcoxon(W, n, correcao) {
    var media = n * (n + 1) / 4;
    if (n <= 25 && !correcao) {
      var w = Math.min(W, 2 * media - W);
      return Math.min(1, 2 * FWilcoxon(Math.floor(w), n));
    }
    var va = n * (n + 1) * (2 * n + 1) / 24 - (correcao || 0) / 48;
    if (va <= 0) return 1;
    var z = (Math.abs(W - media) - 0.5) / Math.sqrt(va);
    return Math.min(1, 2 * (1 - FNormal(z, 0, 1)));
  }

  /* P(U ≤ u) exato por programação dinâmica sobre partições */
  var cacheFU = {};
  function FMannWhitney(u, n1, n2) {
    var ch = n1 + 'x' + n2;
    var tab = cacheFU[ch];
    if (!tab) {
      var max = n1 * n2;
      /* f[k][s]: nº de subconjuntos de tamanho k dos postos 1..n com soma s */
      var n = n1 + n2, i, k, s;
      var f = [];
      for (k = 0; k <= n1; k++) f.push(new Float64Array(n1 * n + 1));
      f[0][0] = 1;
      for (i = 1; i <= n; i++)
        for (k = Math.min(n1, i); k >= 1; k--)
          for (s = f[k].length - 1; s >= i; s--)
            f[k][s] += f[k - 1][s - i];
      var base = n1 * (n1 + 1) / 2;
      tab = new Float64Array(max + 1);
      for (s = 0; s < f[n1].length; s++) {
        var uu = s - base;
        if (uu >= 0 && uu <= max) tab[uu] += f[n1][s];
      }
      cacheFU[ch] = tab;
    }
    var soma = 0, tot = 0, i2;
    for (i2 = 0; i2 < tab.length; i2++) {
      tot += tab[i2];
      if (i2 <= u) soma += tab[i2];
    }
    return soma / tot;
  }

  /* valor p bilateral de Mann–Whitney */
  function pMannWhitney(U, n1, n2, correcao) {
    var media = n1 * n2 / 2;
    if (n1 <= 12 && n2 <= 12 && !correcao) {
      var u = Math.min(U, 2 * media - U);
      return Math.min(1, 2 * FMannWhitney(Math.floor(u), n1, n2));
    }
    var n = n1 + n2;
    var va = n1 * n2 / 12 * (n + 1 - (correcao || 0) / (n * (n - 1)));
    if (va <= 0) return 1;
    var z = (Math.abs(U - media) - 0.5) / Math.sqrt(va);
    return Math.min(1, 2 * (1 - FNormal(z, 0, 1)));
  }

  /* Teste das sequências (runs): aproximação normal com continuidade */
  function pSequencias(R, n1, n2) {
    var n = n1 + n2;
    if (n1 < 1 || n2 < 1) return NaN;
    var media = 2 * n1 * n2 / n + 1;
    var va = 2 * n1 * n2 * (2 * n1 * n2 - n) / (n * n * (n - 1));
    if (va <= 0) return 1;
    var z = (Math.abs(R - media) - 0.5) / Math.sqrt(va);
    return { z: (R - media) / Math.sqrt(va), media: media, dp: Math.sqrt(va),
             p: Math.min(1, 2 * (1 - FNormal(z, 0, 1))) };
  }

  /* Normal padrão por Box–Muller */
  var reserva = null;
  function normalAleatoria() {
    if (reserva !== null) { var v = reserva; reserva = null; return v; }
    var u1 = Math.random() || 1e-12, u2 = Math.random();
    var r = Math.sqrt(-2 * Math.log(u1)), th = 2 * Math.PI * u2;
    reserva = r * Math.sin(th);
    return r * Math.cos(th);
  }

  /* Formatação em padrão brasileiro */
  function fmt(x, casas) {
    if (!isFinite(x)) return '—';
    if (casas === undefined) casas = 4;
    if (x !== 0 && Math.abs(x) < 1e-4) {
      var e = x.toExponential(3).split('e');
      return e[0].replace('.', ',') + '×10<sup>' + Number(e[1]) + '</sup>';
    }
    if (Math.abs(x) >= 1e7) {
      var f = x.toExponential(3).split('e');
      return f[0].replace('.', ',') + '×10<sup>' + Number(f[1]) + '</sup>';
    }
    return x.toFixed(casas).replace('.', ',');
  }

  function pct(x, casas) { return fmt(100 * x, casas === undefined ? 2 : casas) + '%'; }

  return {
    fatorial: fatorial, lnFatorial: lnFatorial, binom: binom, arranjo: arranjo,
    pBinomial: pBinomial, pPoisson: pPoisson, pGeometrica: pGeometrica,
    dNormal: dNormal, FNormal: FNormal, erf: erf, zCritico: zCritico,
    dT: dT, FT: FT, tCritico: tCritico,
    momentos: momentos, dagostino: dagostino, andersonDarling: andersonDarling,
    lilliefors: lilliefors, shapiroWilk: shapiroWilk,
    dQui: dQui, FQui: FQui, quiCritico: quiCritico, simpson: simpson,
    betaI: betaI, dF: dF, FF: FF, fCritico: fCritico,
    rCritico: rCritico, pCorrelacao: pCorrelacao,
    FBinomial: FBinomial, FPoisson: FPoisson,
    coefsSW: coefsSW, postosMedios: postosMedios, FWilcoxon: FWilcoxon, pWilcoxon: pWilcoxon,
    FMannWhitney: FMannWhitney, pMannWhitney: pMannWhitney,
    pSequencias: pSequencias,
    normalAleatoria: normalAleatoria, fmt: fmt, pct: pct
  };
})();

/* ===================================================================
   Desenho em canvas — eixos, barras e curvas
   =================================================================== */
var G = (function () {

  var COR = {
    tinta: '#1b1f24', suave: '#5b6773', grade: '#e4e9ef',
    azul: '#2c5f8d', azulClaro: '#7ba7cc', vinho: '#8c2f39',
    verde: '#1f6f54', ambar: '#b5831f', fundo: '#ffffff'
  };

  /* Prepara o canvas para telas de alta densidade */
  function preparar(cv, altura) {
    var larg = cv.clientWidth || cv.parentNode.clientWidth || 600;
    var alt = altura || Math.round(larg * 0.56);
    var dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(larg * dpr);
    cv.height = Math.round(alt * dpr);
    cv.style.height = alt + 'px';
    var ct = cv.getContext('2d');
    ct.setTransform(dpr, 0, 0, dpr, 0, 0);
    ct.clearRect(0, 0, larg, alt);
    ct.fillStyle = COR.fundo;
    ct.fillRect(0, 0, larg, alt);
    return { ct: ct, L: larg, A: alt };
  }

  /* Cria um sistema de eixos. op: {xmin,xmax,ymin,ymax,rotX,rotY,formataX,formataY} */
  function eixos(cv, op) {
    var p = preparar(cv, op.altura);
    var ct = p.ct;
    var m = op.margem || { e: 60, d: 16, c: 14, b: 40 };
    var x0 = m.e, x1 = p.L - m.d, y0 = m.c, y1 = p.A - m.b;
    var xmin = op.xmin, xmax = op.xmax, ymin = op.ymin || 0, ymax = op.ymax;

    function X(v) { return x0 + (v - xmin) / (xmax - xmin) * (x1 - x0); }
    function Y(v) { return y1 - (v - ymin) / (ymax - ymin) * (y1 - y0); }

    ct.font = '11px system-ui, sans-serif';
    ct.textBaseline = 'middle';

    // grade horizontal + rótulos y
    var nY = op.divY || 5;
    ct.strokeStyle = COR.grade; ct.lineWidth = 1;
    ct.fillStyle = COR.suave; ct.textAlign = 'right';
    for (var i = 0; i <= nY; i++) {
      var v = ymin + (ymax - ymin) * i / nY, y = Math.round(Y(v)) + 0.5;
      ct.beginPath(); ct.moveTo(x0, y); ct.lineTo(x1, y); ct.stroke();
      var rot = op.formataY ? op.formataY(v) : (Math.abs(v) < 1e-9 ? '0' : v.toPrecision(2));
      ct.fillText(rot, x0 - 7, y);
    }

    // marcas x
    if (op.marcasX) {
      ct.textAlign = 'center'; ct.textBaseline = 'top';
      op.marcasX.forEach(function (t) {
        var x = X(t.v);
        if (x < x0 - 1 || x > x1 + 1) return;
        ct.strokeStyle = COR.grade;
        ct.beginPath(); ct.moveTo(x, y1); ct.lineTo(x, y1 + 4); ct.stroke();
        ct.fillStyle = COR.suave;
        ct.fillText(t.r, x, y1 + 7);
      });
    }

    // eixos
    ct.strokeStyle = COR.suave; ct.lineWidth = 1.2;
    ct.beginPath();
    ct.moveTo(x0, y0); ct.lineTo(x0, y1); ct.lineTo(x1, y1);
    ct.stroke();

    // títulos
    ct.fillStyle = COR.suave; ct.font = '600 11px system-ui, sans-serif';
    if (op.rotX) { ct.textAlign = 'center'; ct.textBaseline = 'bottom';
      ct.fillText(op.rotX, (x0 + x1) / 2, p.A - 2); }
    if (op.rotY) {
      ct.save(); ct.translate(11, (y0 + y1) / 2); ct.rotate(-Math.PI / 2);
      ct.textAlign = 'center'; ct.textBaseline = 'top'; ct.fillText(op.rotY, 0, 0); ct.restore();
    }

    return { ct: ct, X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, L: p.L, A: p.A,
             xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
  }

  /* Barras discretas. dados = [{x,y}] */
  function barras(g, dados, cor, larguraRel) {
    var ct = g.ct, n = dados.length;
    if (!n) return;
    var passo = (g.x1 - g.x0) / (g.xmax - g.xmin);
    var w = Math.max(1.5, passo * (larguraRel === undefined ? 0.74 : larguraRel));
    ct.fillStyle = cor || COR.azul;
    dados.forEach(function (d) {
      var x = g.X(d.x), y = g.Y(d.y), h = g.y1 - y;
      if (h <= 0) return;
      ct.fillRect(x - w / 2, y, w, h);
    });
  }

  /* Curva contínua a partir de f(x) */
  function curva(g, f, cor, espessura, tracejado) {
    var ct = g.ct, passos = 420;
    ct.save();
    ct.strokeStyle = cor || COR.vinho;
    ct.lineWidth = espessura || 2;
    if (tracejado) ct.setLineDash(tracejado);
    ct.beginPath();
    for (var i = 0; i <= passos; i++) {
      var x = g.xmin + (g.xmax - g.xmin) * i / passos, y = f(x);
      if (!isFinite(y)) continue;
      var px = g.X(x), py = g.Y(Math.max(g.ymin, Math.min(g.ymax, y)));
      if (i === 0) ct.moveTo(px, py); else ct.lineTo(px, py);
    }
    ct.stroke();
    ct.restore();
  }

  /* Área sob f(x) entre a e b */
  function area(g, f, a, b, cor) {
    var ct = g.ct, passos = 240;
    a = Math.max(a, g.xmin); b = Math.min(b, g.xmax);
    if (b <= a) return;
    ct.save();
    ct.fillStyle = cor || 'rgba(44,95,141,.26)';
    ct.beginPath();
    ct.moveTo(g.X(a), g.y1);
    for (var i = 0; i <= passos; i++) {
      var x = a + (b - a) * i / passos;
      ct.lineTo(g.X(x), g.Y(Math.max(g.ymin, Math.min(g.ymax, f(x)))));
    }
    ct.lineTo(g.X(b), g.y1);
    ct.closePath(); ct.fill();
    ct.restore();
  }

  /* Linha vertical marcada */
  function vertical(g, x, cor, rotulo, tracejado) {
    var ct = g.ct, px = g.X(x);
    if (px < g.x0 || px > g.x1) return;
    ct.save();
    ct.strokeStyle = cor || COR.vinho; ct.lineWidth = 1.6;
    ct.setLineDash(tracejado === false ? [] : [5, 4]);
    ct.beginPath(); ct.moveTo(px, g.y0); ct.lineTo(px, g.y1); ct.stroke();
    if (rotulo) {
      ct.setLineDash([]);
      ct.fillStyle = cor || COR.vinho;
      ct.font = '600 11px system-ui, sans-serif';
      ct.textAlign = 'center'; ct.textBaseline = 'top';
      ct.fillText(rotulo, px, g.y0 + 1);
    }
    ct.restore();
  }

  /* Legenda simples no canto superior direito */
  function legenda(g, itens) {
    var ct = g.ct, x = g.x1 - 8, y = g.y0 + 10;
    ct.save();
    ct.font = '11px system-ui, sans-serif';
    ct.textAlign = 'right'; ct.textBaseline = 'middle';
    itens.forEach(function (it, i) {
      var yy = y + i * 16;
      ct.fillStyle = COR.tinta;
      ct.fillText(it.texto, x - 16, yy);
      ct.fillStyle = it.cor;
      ct.fillRect(x - 12, yy - 4, 11, 8);
    });
    ct.restore();
  }

  /* Marcas inteiras espaçadas automaticamente */
  function marcasInteiras(min, max, maximoRotulos) {
    var n = max - min + 1, passo = Math.max(1, Math.ceil(n / (maximoRotulos || 12))), m = [];
    for (var v = min; v <= max; v += passo) m.push({ v: v, r: String(v) });
    return m;
  }

  function marcasLineares(min, max, qtd, casas) {
    var m = [];
    for (var i = 0; i <= qtd; i++) {
      var v = min + (max - min) * i / qtd;
      m.push({ v: v, r: v.toFixed(casas === undefined ? 1 : casas).replace('.', ',') });
    }
    return m;
  }

  return { COR: COR, preparar: preparar, eixos: eixos, barras: barras, curva: curva,
           area: area, vertical: vertical, legenda: legenda,
           marcasInteiras: marcasInteiras, marcasLineares: marcasLineares };
})();

/* Redesenha os widgets quando a janela muda de tamanho */
var _redesenhos = [];
function registrarRedesenho(f) { _redesenhos.push(f); f(); }
window.addEventListener('resize', (function () {
  var t;
  return function () {
    clearTimeout(t);
    t = setTimeout(function () { _redesenhos.forEach(function (f) { f(); }); }, 160);
  };
})());
