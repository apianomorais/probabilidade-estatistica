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
      sen: '\\operatorname{sen}',
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
    dQui: dQui, FQui: FQui, quiCritico: quiCritico, simpson: simpson,
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
